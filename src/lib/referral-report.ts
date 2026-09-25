/**
 * 报表用的内推返现口径（只读）。
 *
 * 【为什么在报表层扣，不在 CardKey.profit 上扣】CardKey.profit 的定义是「卡差价 = soldPrice − cost」
 * （schema 注释、docs/多渠道分销-设计.md），有 5 条写入路径（发卡、单卡改价/改成本、批量改、回填）。
 * 在写入时扣返现，站长下次批量改成本就会把它静默覆盖掉。所以列本身不动，
 * 只在标着「利润合计 / 毛利率」的两个报表里，把已经真实付给推广人的返现减掉。
 *
 * 【用 ReferralReward(SETTLED) 而不是 Order.referralReward 快照】前者是已经进了推广人余额、
 * 可以被提现的真钱；未交付或部分发货的单还没结算，本来就不该扣。
 */
import { prisma } from './db'
import { toCents } from './money'

/** 这些订单已结算的内推返现，按订单汇总，单位：分 */
export async function settledReferralCents(orderIds: number[]): Promise<Map<number, number>> {
  const out = new Map<number, number>()
  const ids = Array.from(new Set(orderIds))
  const CHUNK = 1000 // IN 列表分块，避免超大 SQL
  for (let i = 0; i < ids.length; i += CHUNK) {
    const rows = await prisma.referralReward.findMany({
      where: { orderId: { in: ids.slice(i, i + CHUNK) }, status: 'SETTLED' },
      select: { orderId: true, amount: true },
    })
    for (const r of rows) out.set(r.orderId, (out.get(r.orderId) ?? 0) + toCents(r.amount.toString()))
  }
  return out
}
