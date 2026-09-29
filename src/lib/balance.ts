/**
 * 余额流水的共用口径（纯函数，不连库；客户端也能 import）。
 *
 * B0 起流水类型从 3 种扩到 10 种（docs/短信接码-设计.md §5.2），类型是字符串列、不是枚举。
 */

export type BalanceLogType =
  | 'REFERRAL'
  | 'ADJUST'
  | 'WITHDRAW'
  | 'TOPUP'
  | 'HOLD'
  | 'RELEASE'
  | 'REFUND'
  | 'LATEPAY'
  | 'TOPUP_REFUND'
  | 'CLAWBACK'

/** 买家与后台共用的中文标签（§1.15、§5.2 的「买家看到的标签」列） */
export const BALANCE_TYPE_LABELS: Record<string, string> = {
  TOPUP: '充值',
  HOLD: '接码付款（余额部分）',
  RELEASE: '订单关闭 · 预扣退回',
  REFUND: '接码退款',
  LATEPAY: '付款退回余额',
  REFERRAL: '推荐返现',
  CLAWBACK: '返现扣回',
  ADJUST: '余额调整',
  WITHDRAW: '提现',
  TOPUP_REFUND: '充值退还',
}

/** settleReferral 写入 note 的固定格式：`订单#${Order.id} 内推返现` */
const REFERRAL_NOTE_RE = /^订单#(\d+) 内推返现$/

/**
 * 一条 REFERRAL 流水对应的站内订单 id（「产生返现的**别人的**订单」）。**只对 type === 'REFERRAL' 返回**：
 * B0 之后 HOLD / REFUND 等流水的 orderId 是本人自己的接码单或充值单，当成返现订单去核对就会报
 * 「没有找到对应的返现记录」「推广人与这条流水的用户不一致」（设计 §5.2、§6.6 第 1 条）。
 * 2026-09-24 起 balance_logs.order_id 直接有值；更早的行只能从 note 里解析 —— 两条路都走这一个函数。
 */
export function referralOrderIdOf(log: { type: string; orderId?: number | null; note?: string | null }): number | null {
  if (log.type !== 'REFERRAL') return null
  if (log.orderId && log.orderId > 0) return log.orderId
  if (!log.note) return null
  const m = REFERRAL_NOTE_RE.exec(log.note.trim())
  if (!m) return null
  const id = Number(m[1])
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

/** orderId 是「本人自己的订单」（接码单 / 充值单）的流水类型 */
export const OWN_ORDER_LOG_TYPES: ReadonlySet<string> = new Set(['TOPUP', 'HOLD', 'RELEASE', 'REFUND', 'LATEPAY'])

/**
 * 接码与充值流水对应的本人订单 id（TOPUP / HOLD / RELEASE / REFUND / LATEPAY）。其余类型返回 null。
 * 反查订单时一律带 userId = 本人（§6.4 WalletLogItem）。
 */
export function ledgerOrderIdOf(log: { type: string; orderId?: number | null }): number | null {
  if (!OWN_ORDER_LOG_TYPES.has(log.type)) return null
  return log.orderId && log.orderId > 0 ? log.orderId : null
}

/**
 * 钱包页的分类筛选（§1.15）：充值 = TOPUP；消费 = HOLD；退回 = RELEASE、REFUND、LATEPAY；
 * 返现 = REFERRAL、CLAWBACK；提现/调整 = ADJUST、WITHDRAW、TOPUP_REFUND。
 */
export const WALLET_LOG_CATEGORIES = {
  topup: ['TOPUP'],
  spend: ['HOLD'],
  back: ['RELEASE', 'REFUND', 'LATEPAY'],
  referral: ['REFERRAL', 'CLAWBACK'],
  withdraw: ['ADJUST', 'WITHDRAW', 'TOPUP_REFUND'],
} as const
export type WalletLogCategory = 'all' | keyof typeof WALLET_LOG_CATEGORIES
