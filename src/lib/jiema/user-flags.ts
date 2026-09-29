/**
 * 短信接码 · 可疑用户标记（docs/短信接码-设计.md §10.1：「24 小时内取消 ≥10 单的，在后台用户页和订单列表上标出来」「同一用户 24 小时内
 * 支付宝付款后取消、退回充值格合计超过 ¥50，也标记并知会」）。**只标记、不限制下单**（真实买家的高失败率多半来自平台侧）。
 *
 * 一个口径三处用：每日对账的知会（reconcile.noticeLines → 日报、wallet.alert）、后台「用户」列表、后台「短信接码 → 订单」列表
 * （S4 评审修复：原来只进了日报）。只给管理员接口调用（调用方第一行 adminGuard）。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { ALIPAY_CANCEL_NOTICE_CENTS, CANCEL_NOTICE_COUNT, userFlagText } from './recon-rules'
import { jnow } from './runtime'

const H = 3600_000

export interface JiemaUserFlagRow {
  userId: number
  /** 近 24 小时取消（CANCELLED、按 refundedAt）的接码单数 */
  cancels: number
  /** 这些单里支付宝实收之和（分）——取消后退进了充值格 */
  alipayCents: number
}

/** 近 24 小时达到标记线的用户（userIds 给了就只查这些人；最多 limit 个） */
export async function jiemaUserFlagRows(now: Date = jnow(), userIds?: readonly number[], limit = 50): Promise<JiemaUserFlagRow[]> {
  if (userIds && !userIds.length) return []
  const since = new Date(now.getTime() - 24 * H)
  const only = userIds ? Prisma.sql`AND user_id IN (${Prisma.join(Array.from(new Set(userIds)))})` : Prisma.empty
  const rows = await prisma.$queryRaw<{ user_id: number; n: bigint | number; ali: unknown }[]>`
    SELECT user_id, COUNT(*) AS n, COALESCE(SUM(alipay_paid_cents), 0) AS ali FROM sms_orders
     WHERE state = 'CANCELLED' AND refunded_at >= ${since} ${only}
     GROUP BY user_id HAVING COUNT(*) >= ${CANCEL_NOTICE_COUNT} OR COALESCE(SUM(alipay_paid_cents), 0) > ${ALIPAY_CANCEL_NOTICE_CENTS}
     ORDER BY user_id LIMIT ${limit}`
  return rows.map((r) => ({ userId: Number(r.user_id), cancels: Number(r.n), alipayCents: Number(r.ali ?? 0) }))
}

/** 后台列表用：userId → 标记文字（没到标记线的不在 Map 里）。查询失败返回空 Map（标记是辅助信息，不能让列表报错） */
export async function jiemaUserFlags(userIds: readonly number[], now: Date = jnow()): Promise<Map<number, string>> {
  const out = new Map<number, string>()
  if (!userIds.length) return out
  try {
    for (const r of await jiemaUserFlagRows(now, userIds, userIds.length)) {
      const t = userFlagText(r)
      if (t) out.set(r.userId, t)
    }
  } catch (e) {
    console.error('[jiema] 可疑用户标记查询失败', (e as Error)?.message)
  }
  return out
}
