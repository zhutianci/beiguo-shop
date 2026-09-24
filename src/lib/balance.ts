/**
 * 余额流水的共用口径（纯函数，不连库）。
 */

export type BalanceLogType = 'REFERRAL' | 'ADJUST' | 'WITHDRAW'

export const BALANCE_TYPE_LABELS: Record<string, string> = {
  REFERRAL: '推荐返现',
  ADJUST: '余额调整',
  WITHDRAW: '提现 / 扣减',
}

/** settleReferral 写入 note 的固定格式：`订单#${Order.id} 内推返现` */
const REFERRAL_NOTE_RE = /^订单#(\d+) 内推返现$/

/**
 * 一条 REFERRAL 流水对应的站内订单 id。
 * 2026-09-24 起 balance_logs.order_id 直接有值；更早的行只能从 note 里解析 ——
 * 两条路都走这一个函数，调用方不需要知道区别，也就不需要回填脚本。
 */
export function referralOrderIdOf(log: { type: string; orderId?: number | null; note?: string | null }): number | null {
  if (log.orderId && log.orderId > 0) return log.orderId
  if (log.type !== 'REFERRAL' || !log.note) return null
  const m = REFERRAL_NOTE_RE.exec(log.note.trim())
  if (!m) return null
  const id = Number(m[1])
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
