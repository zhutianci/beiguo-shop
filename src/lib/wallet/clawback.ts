/**
 * 返现扣回的合计口径（docs/短信接码-设计.md §7.8「返现扣回」）。
 *
 * 【为什么要单独算】CLAWBACK 只写流水（clawback:<订单 id>），ReferralReward 不改（status 仍是 SETTLED、金额不变）：
 * 它记的是「这张订单产生过的返现」，改状态会牵动「待结算返现」的口径（SETTLED 之外的已付款单会被当成待结算）
 * 与结算幂等（ReferralReward.orderId 唯一）。于是凡是按 ReferralReward 汇总「累计返现 / 已到账返现 / 已结算返现合计」
 * 的地方，都要减去这里的扣回合计，才与钱包页 totals.referral（Σ REFERRAL − Σ|CLAWBACK|）一致。
 * 扣回不足（两格合计不够、扣到 0）时流水只记实际扣到的部分，这里也只减实际扣到的。
 */
import { prisma } from '../db'
import { centsOf } from './buckets'

/** 每个推广人被扣回的返现合计（分，正数 = Σ|CLAWBACK 流水两格|）。userIds 不给 = 全站 */
export async function clawbackCentsByUser(userIds?: number[]): Promise<Map<number, number>> {
  if (userIds && userIds.length === 0) return new Map()
  const rows = await prisma.balanceLog.groupBy({
    by: ['userId'],
    where: { type: 'CLAWBACK', ...(userIds ? { userId: { in: userIds } } : {}) },
    _sum: { delta: true, topupDeltaCents: true },
  })
  return new Map(rows.map((r) => [r.userId, -(centsOf(r._sum.delta ?? 0) + (r._sum.topupDeltaCents ?? 0))]))
}

/** 一个推广人被扣回的返现合计（分，正数） */
export async function clawbackCentsOf(userId: number): Promise<number> {
  return (await clawbackCentsByUser([userId])).get(userId) ?? 0
}
