export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { crossSiteReason } from '@/lib/same-origin'
import { rateLimited } from '@/lib/news/rate-limit'
import { startTopup, topupPageData } from '@/lib/topup-checkout'

/**
 * 余额充值（docs/短信接码-设计.md §1.16、§6.4、D35、D36）。只在主站（D11）：第一行 denyOnChannel，不包进 try。
 *
 * GET：`{ enabled, tiersCents, minCents, maxCents, balanceCents, topupCents, termsVersion, termsAgreed, pending[] }`；
 *      充值没对本人开放（开关、受众、配置读不到、载体商品不正常）时只回 `{ enabled: false }`。
 * POST：`{ amountCents, clientToken(uuid), termsVersion, returnTo? }` → `{ orderNo, payUrl }`；
 *       400 AMOUNT（文案按配置拼）/ 409 TOO_MANY_PENDING / CLOSED / PAID / TERMS / 429 OPEN_PAYMENTS / RATE /
 *       503 TOPUP_OFF / BUSY（发起收款失败，充值单已在同一请求里关掉）。不设充值余额总额上限（Q5）。
 * 写接口同源校验（CSRF，lib/same-origin.ts）；每人每分钟 3 次。订单与钱包类响应一律 no-store。
 */
const postSchema = z.object({
  amountCents: z.unknown(),
  clientToken: z.string().max(64),
  termsVersion: z.string().max(40),
  returnTo: z.string().max(400).optional().nullable(),
})

function fail(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  const res = NextResponse.json({ success: false, error: message, code, ...extra }, { status })
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export async function GET() {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const res = success(await topupPageData({ id: user.id, role: user.role }))
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    console.error('[wallet] GET topup 失败', e)
    return error('加载失败，请稍后重试', 500)
  }
}

export async function POST(request: NextRequest) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    if (crossSiteReason(request.headers)) return error('请求来源不正确', 403)
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (rateLimited(`wallet-topup:${user.id}`, { windowMs: 60_000, max: 3 })) return fail(429, 'RATE', '操作太频繁，请稍后再试')
    const parsed = postSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return fail(400, 'BAD_REQUEST', '请求参数不正确，请刷新页面后重试')
    const r = await startTopup({ id: user.id, role: user.role }, { ...parsed.data, amountCents: parsed.data.amountCents })
    if (!r.ok) return fail(r.status, r.code, r.message, r.minCents != null ? { minCents: r.minCents, maxCents: r.maxCents } : {})
    const res = success({ orderNo: r.orderNo, payUrl: r.payUrl, amountCents: r.amountCents })
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    console.error('[wallet] POST topup 失败', e)
    return fail(503, 'BUSY', '当前付款人数较多，请稍后再试')
  }
}
