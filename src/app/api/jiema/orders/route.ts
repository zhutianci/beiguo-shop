export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { crossSiteReason } from '@/lib/same-origin'
import { rateLimited } from '@/lib/news/rate-limit'
import { createJiemaOrder } from '@/lib/jiema/order'
import { jfail, jok } from '@/lib/jiema/buyer-api'

/**
 * 短信接码下单（docs/短信接码-设计.md §6.4、T1、§1.8、§1.9）。只在主站：第一行 denyOnChannel，不包进 try（D11、规则 18）。
 *
 * POST `{ service, country, operator: string|null, operatorFallback, expectPriceCents, payWith: 'ALIPAY'|'BALANCE', expectBalanceCents?, clientToken(uuid),
 *        agree: true, termsVersion, walletTermsVersion }`
 *   200 `{ orderNo, orderId, priceCents, payMode, balanceCents, alipayCents, quoteExpiresAt, next: 'NUMBER'|'CASHIER', payUrl? }`；
 *   400 BAD_REQUEST（zod 只校验格式，§10.2）/ 404 NOT_FOUND（组合不在目录里）；
 *   409 PRICE_CHANGED{priceCents,balanceCents,alipayCents} / BALANCE_CHANGED{balanceCents,alipayCents,suggestPayWith?} / SOLD_OUT / HOLD / TERMS；
 *   429 LIMIT / OPEN_PAYMENTS{released?} / BUSY / RATE；503 MAINTENANCE / BALANCE_PAY_OFF / PAY_BUSY / UNAVAILABLE / QUOTE_FAILED。
 * 写接口同源校验（CSRF）；每人每分钟 5 次（进程内）；业务上限在下单事务里锁住用户行后判断。
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
  agree: z.boolean(),
  termsVersion: z.string().max(16),
  walletTermsVersion: z.string().max(16),
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
        agree: d.agree,
        termsVersion: d.termsVersion,
        walletTermsVersion: d.walletTermsVersion,
      },
    )
    if (!r.ok) return jfail(r.status, r.code, r.message, r.extra ?? {})
    return jok(r.data)
  } catch (e) {
    console.error('[jiema] 下单失败', e)
    return jfail(503, 'BUSY', '当前下单人数较多，请稍后再试')
  }
}
