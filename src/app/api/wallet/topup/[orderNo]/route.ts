export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized, notFound } from '@/lib/api'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { rateLimited } from '@/lib/news/rate-limit'
import { topupStatusFor } from '@/lib/wallet/topup'

/**
 * 一张充值单的状态（钱包页 `?topup=<orderNo>` 横幅轮询用，docs/短信接码-设计.md §1.15、§6.4）：
 *   `{ state: 'PENDING'|'CREDITED'|'CLOSED', amountCents, creditedCents, returnTo }`。只查本人、主站的充值单；每单每秒 1 次。
 */
export async function GET(_request: NextRequest, { params }: { params: { orderNo: string } }) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const orderNo = String(params.orderNo || '')
    if (!/^[0-9A-Za-z]{8,32}$/.test(orderNo)) return notFound('充值单不存在')
    if (rateLimited(`wallet-topup-state:${user.id}:${orderNo}`, { windowMs: 1_000, max: 1 })) return error('查询太频繁', 429)
    const s = await topupStatusFor(user.id, orderNo)
    if (!s) return notFound('充值单不存在')
    const res = success(s)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    console.error('[wallet] 充值单状态查询失败', e)
    return error('查询失败', 500)
  }
}
