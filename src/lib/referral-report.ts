/**
 * 报表用的卡密利润口径（只读）。后台订单列表（每行 + 合计）、卡密数据分析、微信机器人日报与「利润」指令共用这一份。
 *
 * 【2026-10-12 站长定的口径】
 *  · 利润 = 卡差价（Σ CardKey.profit = soldPrice − cost），**不扣内推返现**。返现只在旁边标「待返现 ¥X」
 *    （已结算进推广人余额、等提现时线下打款的那部分），不参与利润计算。此前是在报表层把已结算返现减掉。
 *  · **已取消的单不计利润，即使卡已经发出去了**（profitCounted）；已退款的同理。成本不受影响：卡确实发出去了。
 *
 * 【返现金额用 ReferralReward(SETTLED) 而不是 Order.referralReward 快照】前者是已经进了推广人余额、
 * 可以被提现的真钱；未交付或部分发货的单还没结算，不标。
 */
import { prisma } from './db'
import { toCents } from './money'

/** 这张单的卡密利润计不计入报表：已付款、且没有取消。已取消 / 已退款的单即使发过卡也不计 */
export function profitCounted(o: { payStatus: string; deliveryStatus: string }): boolean {
  return o.payStatus === 'PAID' && o.deliveryStatus !== 'CANCELLED'
}

/** 这些订单已结算的内推返现（报表里标「待返现」的那个数），按订单汇总，单位：分 */
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
