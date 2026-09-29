/**
 * 短信接码 · 买家接口的公共部分（docs/短信接码-设计.md §6.4、§10.2）：同源校验、登录、进程内限频、按本人本站取单、统一的 JSON 形状。
 *
 * 【denyOnChannel 不在这里】构建前检查规则 18 要求每个路由 handler 自己在第一个 try 之前调 denyOnChannel()（包进 try 的话店面解析
 * 出错会被 catch 吞掉、按主站继续）；路由文件第一句调完再交给这里。
 * 【总开关只挡新单】查看与操作已有订单不看 sms_config（E59：关总开关是为了停止收新钱，已付款的买家照样要拿到号、能取消能退款）。
 * 订单与钱包类响应一律 `Cache-Control: no-store`。
 */
import { NextRequest, NextResponse } from 'next/server'
import type { SmsOrder } from '@prisma/client'
import { getCurrentUser } from '../auth'
import { crossSiteReason } from '../same-origin'
import { rateLimited } from '../news/rate-limit'
import { findBuyerOrder, buildOrderView } from './view'
import { lazyAdvance, type BuyerResult } from './engine'

export function noStore(res: NextResponse): NextResponse {
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export function jfail(status: number, code: string, message: string, extra: Record<string, unknown> = {}): NextResponse {
  return noStore(NextResponse.json({ success: false, error: message, code, ...extra }, { status }))
}

export function jok<T>(data: T): NextResponse {
  return noStore(NextResponse.json({ success: true, data }))
}

/** 号码页 GET：先惰性推进（节流在引擎里），再给本人本站的视图 */
export async function viewOrder(orderNo: string): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) return jfail(401, 'UNAUTHORIZED', '请先登录')
    if (rateLimited(`jiema-view:${user.id}:${orderNo}`, { windowMs: 1000, max: 2 })) return jfail(429, 'RATE', '刷新太频繁')
    let ref = await findBuyerOrder(user.id, orderNo)
    if (!ref) return jfail(404, 'NOT_FOUND', '订单不存在')
    await lazyAdvance(ref.so.id).catch((e) => console.error('[jiema] 惰性推进失败', ref?.so.id, (e as Error)?.message))
    ref = (await findBuyerOrder(user.id, orderNo)) ?? ref
    return jok(await buildOrderView(ref))
  } catch (e) {
    console.error('[jiema] GET 订单失败', orderNo, e)
    return jfail(500, 'ERROR', '加载失败，请稍后重试')
  }
}

export type ActionKind = 'close' | 'replace' | 'cancel' | 'finish' | 'start' | 'refund-ready'

/**
 * 号码页上的操作：同源 → 登录 → 限频（关单每单 1 分钟 5 次；其余每单 10 分钟 12 次，共用一个桶）→ 取单 → 引擎 → 返回最新视图。
 * 失败（409 VERSION / TOO_EARLY / NO_LEFT / THREADS / PAID_PROCESSING / PAYING / HOLD …）同样带上最新视图（E29「另一个收到 409 和最新状态」）。
 */
export async function runBuyerAction(
  request: NextRequest,
  orderNo: string,
  kind: ActionKind,
  handler: (so: SmsOrder, body: { version: number; reason?: string | null }) => Promise<BuyerResult>,
): Promise<NextResponse> {
  try {
    if (crossSiteReason(request.headers)) return jfail(403, 'FORBIDDEN', '请求来源不正确')
    const user = await getCurrentUser()
    if (!user) return jfail(401, 'UNAUTHORIZED', '请先登录')
    const bucket = kind === 'close' ? `jiema-close:${user.id}:${orderNo}` : `jiema-act:${user.id}:${orderNo}`
    const rule = kind === 'close' ? { windowMs: 60_000, max: 5 } : { windowMs: 10 * 60_000, max: 12 }
    if (rateLimited(bucket, rule)) return jfail(429, 'RATE', '操作太频繁，请稍后再试')
    const raw = (await request.json().catch(() => null)) as { version?: unknown; reason?: unknown } | null
    const version = raw && typeof raw.version === 'number' && Number.isSafeInteger(raw.version) ? raw.version : null
    if (version == null) return jfail(400, 'BAD_REQUEST', '请求参数不正确，请刷新页面后重试')
    const reason = raw && typeof raw.reason === 'string' && ['USED', 'REJECTED', 'NO_SMS', 'OTHER'].includes(raw.reason) ? raw.reason : null
    const ref = await findBuyerOrder(user.id, orderNo)
    if (!ref) return jfail(404, 'NOT_FOUND', '订单不存在')
    const r = await handler(ref.so, { version, reason })
    const fresh = (await findBuyerOrder(user.id, orderNo)) ?? ref
    const view = await buildOrderView(fresh)
    if (!r.ok) return jfail(r.status, r.code, r.message, { ...(r.extra ?? {}), view })
    return jok(view)
  } catch (e) {
    console.error('[jiema] 号码页操作失败', kind, orderNo, e)
    return jfail(500, 'ERROR', '操作失败，请稍后重试')
  }
}
