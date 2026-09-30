export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { crossSiteReason } from '@/lib/same-origin'
import { rateLimited, clientIp } from '@/lib/news/rate-limit'
import { createJiemaOrder } from '@/lib/jiema/order'
import { jfail, jok } from '@/lib/jiema/buyer-api'
import { listBuyerRecords } from '@/lib/jiema/records'
import { parseRecordDays, parseRecordTab, phoneQuery } from '@/lib/jiema/ui'

/**
 * 短信接码下单（docs/短信接码-设计.md §6.4、T1、§1.8、§1.9）。只在主站：第一行 denyOnChannel，不包进 try（D11、规则 18）。
 *
 * POST `{ service, country, operator: string|null, operatorFallback, expectPriceCents, payWith: 'ALIPAY'|'BALANCE', expectBalanceCents?, clientToken(uuid),
 *        agree: true, termsVersion, walletTermsVersion }`（后三项是付款前弹窗「下单须知与免责声明」的同意标记与两份条款版本，§1.8、§8.6）
 *   200 `{ orderNo, orderId, priceCents, payMode, balanceCents, alipayCents, quoteExpiresAt, next: 'NUMBER'|'CASHIER', payUrl? }`；
 *   400 BAD_REQUEST（zod 只校验格式，§10.2）/ 404 NOT_FOUND（组合不在目录里）；
 *   409 PRICE_CHANGED{priceCents,balanceCents,alipayCents} / BALANCE_CHANGED{balanceCents,alipayCents,suggestPayWith?} / SOLD_OUT / HOLD /
 *       TERMS{termsVersion,walletTermsVersion}（没勾同意、缺字段、版本不是当前版都是这个；带回当前两个版本号）；
 *   429 LIMIT / OPEN_PAYMENTS{released?} / BUSY / RATE；503 MAINTENANCE / BALANCE_PAY_OFF / PAY_BUSY / UNAVAILABLE / QUOTE_FAILED。
 * 写接口同源校验（CSRF）；每人每分钟 5 次（进程内）；业务上限在下单事务里锁住用户行后判断。
 * 同意留痕：请求的 IP（clientIp）与 User-Agent 交给下单事务，写进 TERMS_AGREED 事件（lib/jiema/consent.ts）。
 */
const schema = z.object({
  service: z.string().regex(/^[a-z0-9]{2,4}$/),
  country: z.number().int().min(1).max(999),
  operator: z.string().regex(/^[a-z0-9_]{2,40}$/i).nullable().optional(),
  operatorFallback: z.boolean().optional(),
  expectPriceCents: z.number().int().min(1).max(10_000_000),
  payWith: z.enum(['ALIPAY', 'BALANCE']),
  expectBalanceCents: z.number().int().min(0).max(10_000_000).nullable().optional(),
  clientToken: z.string().uuid(),
  // 同意标记与版本号只校验类型、都可以缺：缺了由下单逻辑返回 409 TERMS（前端重新弹窗），不是 400（§8.6）
  agree: z.boolean().nullable().optional(),
  termsVersion: z.string().max(16).nullable().optional(),
  walletTermsVersion: z.string().max(16).nullable().optional(),
})

export async function POST(request: NextRequest) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    if (crossSiteReason(request.headers)) return jfail(403, 'FORBIDDEN', '请求来源不正确')
    const user = await getCurrentUser()
    if (!user) return jfail(401, 'UNAUTHORIZED', '请先登录')
    if (rateLimited(`jiema-order:${user.id}`, { windowMs: 60_000, max: 5 })) return jfail(429, 'RATE', '操作太频繁，请稍后再试')
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return jfail(400, 'BAD_REQUEST', '请求参数不正确，请刷新页面后重试')
    const d = parsed.data
    const r = await createJiemaOrder(
      { id: user.id, role: user.role },
      {
        service: d.service,
        country: d.country,
        operator: d.operator ? d.operator.toLowerCase() : null,
        operatorFallback: d.operatorFallback ?? true,
        expectPriceCents: d.expectPriceCents,
        payWith: d.payWith,
        expectBalanceCents: d.expectBalanceCents ?? null,
        clientToken: d.clientToken.toLowerCase(),
        agree: d.agree ?? null,
        termsVersion: d.termsVersion ?? null,
        walletTermsVersion: d.walletTermsVersion ?? null,
        consent: { ip: clientIp(request.headers), ua: request.headers.get('user-agent') },
      },
    )
    if (!r.ok) return jfail(r.status, r.code, r.message, r.extra ?? {})
    return jok(r.data)
  } catch (e) {
    console.error('[jiema] 下单失败', e)
    return jfail(503, 'BUSY', '当前下单人数较多，请稍后再试')
  }
}

/**
 * 我的接码记录（docs/短信接码-设计.md §1.11、§6.4；S3）。也是 /jiema 顶部「进行中提示条」的数据源（tab=active，只在登录后请求，§1.4）。
 *
 * GET `?tab=all|active|done|cancelled|closed&q=<号码或后 4 位>&days=7|30|90&page=`
 *   200 `{ items: JiemaRecordItem[], total, counts: { all, active, done, cancelled, closed }, page, pageSize, hasMore, serverNow }`；
 *   400 BAD_QUERY（号码不到 4 位）；401。
 * 只查本人（sms_orders.user_id）、主站订单；**不看 sms_config**（总开关只挡新单，查看已有的单照常，E59）。进行中的单不受日期筛选影响。
 * 第一行 denyOnChannel（渠道 Host 404），不包进 try；响应 no-store。
 */
export async function GET(request: NextRequest) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const user = await getCurrentUser()
    if (!user) return jfail(401, 'UNAUTHORIZED', '请先登录')
    if (rateLimited(`jiema-records:${user.id}`, { windowMs: 60_000, max: 60 })) return jfail(429, 'RATE', '刷新太频繁，请稍后再试')
    const sp = request.nextUrl.searchParams
    const phone = phoneQuery(sp.get('q'))
    if (phone === 'SHORT') return jfail(400, 'BAD_QUERY', '请输入完整号码或至少后 4 位')
    const page = Math.min(Math.max(parseInt(sp.get('page') || '1') || 1, 1), 500)
    const data = await listBuyerRecords(user.id, { tab: parseRecordTab(sp.get('tab')), days: parseRecordDays(sp.get('days')), phone, page })
    return jok(data)
  } catch (e) {
    console.error('[jiema] 接码记录失败', e)
    return jfail(500, 'ERROR', '加载失败，请稍后重试')
  }
}
