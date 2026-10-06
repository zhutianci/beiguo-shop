export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { meOrDeny } from '@/lib/content/session'
import { rateLimited } from '@/lib/news/rate-limit'
import { MONTHLY_LIMIT, ShopError, redeem, shopOptions, walletOf } from '@/lib/content/shop'

// 积分兑换（P3，设计 §8.3）。GET：可用积分、兑换档位、本月已兑次数、最近兑换记录；POST {key}：兑换一张券
export async function GET(request: NextRequest) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  const { user, denied } = await meOrDeny(request, false)
  if (denied) return denied
  const [wallet, options, history] = await Promise.all([
    walletOf(user!.id),
    shopOptions(),
    prisma.pointRedemption.findMany({ where: { userId: user!.id }, orderBy: { id: 'desc' }, take: 20 }),
  ])
  const coupons = history.length
    ? await prisma.coupon.findMany({ where: { id: { in: history.map((h) => h.couponId!).filter(Boolean) } }, select: { id: true, name: true, endAt: true } })
    : []
  const cm = new Map(coupons.map((c) => [c.id, c]))
  return success({
    ...wallet,
    monthlyLimit: MONTHLY_LIMIT,
    options: options.filter((o) => o.enabled),
    history: history.map((h) => ({ id: h.id, cost: h.cost, createdAt: h.createdAt, name: cm.get(h.couponId ?? 0)?.name ?? '优惠券', endAt: cm.get(h.couponId ?? 0)?.endAt ?? null })),
  })
}

export async function POST(request: NextRequest) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  const { user, denied } = await meOrDeny(request, true)
  if (denied) return denied
  if (rateLimited(`points-shop:${user!.id}`, { windowMs: 60_000, max: 5 })) return error('操作太频繁，请稍后再试', 429)
  try {
    const parsed = z.object({ key: z.string().max(16) }).safeParse(await request.json())
    if (!parsed.success) return error('参数无效')
    const r = await redeem(user!.id, parsed.data.key)
    return success({ ...r, wallet: await walletOf(user!.id) }, `兑换成功：「${r.couponName}」已放进你的优惠券，下单时可用`)
  } catch (err) {
    if (err instanceof ShopError) return error(err.message)
    console.error('Points shop error:', err)
    return error('兑换失败，请稍后再试')
  }
}
