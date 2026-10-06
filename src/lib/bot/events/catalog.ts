/**
 * 事件目录（docs/微信机器人-设计.md §5.2）。
 *
 * 用 Record<NotifyEvent, …> 与 Record<TenantNoticeKind, …> 写死：现有推送新增了事件类型而这里没登记，编译就报错，
 * 不会悄悄漏推。只 import 类型（import type），不引入任何运行时依赖——旁路 sink 也要用它。
 */
import type { NotifyEvent } from '../../notify'
import type { TenantNoticeKind } from '../../tenant/types'
import type { BotCategory } from '../types'

export interface EventDef {
  category: BotCategory
  /** 新会话的出厂订阅 */
  defaultOn: boolean
  /** 紧急：不受免打扰、优先发 */
  urgent?: boolean
  emoji: string
  /** 买家可控的字段（按标签匹配）：渲染时额外做疑似卡密打码与网址中性化 */
  userTextLabels?: readonly string[]
}

/** 主站 notify() 事件 → 管理群（带 site 的会被路由改成「渠道告警」类别，§5.3 第 2 条） */
export const NOTIFY_EVENT_DEFS: Readonly<Record<NotifyEvent, EventDef>> = Object.freeze({
  'order.created': { category: 'order_new', defaultOn: true, emoji: '🛒', userTextLabels: ['用户'] },
  'order.paid': { category: 'order_done', defaultOn: true, emoji: '💰', userTextLabels: ['用户'] },
  // 已定义、目前没有调用点（notify.ts:22,51），登记备用
  'order.delivered': { category: 'order_done', defaultOn: true, emoji: '📦' },
  'invoice.submitted': { category: 'billing', defaultOn: true, emoji: '🧾' },
  'invoice.paid': { category: 'billing', defaultOn: true, emoji: '✅' },
  'invoice.failed': { category: 'money_alert', defaultOn: true, urgent: true, emoji: '🚨' },
  'receipt.created': { category: 'billing', defaultOn: true, emoji: '📄' },
  'message.buyer': { category: 'message', defaultOn: true, emoji: '🔔', userTextLabels: ['买家', '内容'] },
  'stock.low': { category: 'stock', defaultOn: true, emoji: '⚠️' },
  'user.registered': { category: 'user', defaultOn: true, emoji: '👤', userTextLabels: ['昵称'] },
  'link.applied': {
    category: 'ops',
    defaultOn: true,
    emoji: '🤝',
    userTextLabels: ['站点名称', '网站名称', '简介', '联系方式', '网址', '申请人', '说明'],
  },
  'cardkey.exported': { category: 'security', defaultOn: true, urgent: true, emoji: '🔐' },
  'lottery.won': { category: 'ops', defaultOn: true, emoji: '🧧' },
  'marketing.started': { category: 'ops', defaultOn: true, emoji: '📣' },
  'marketing.finished': { category: 'ops', defaultOn: true, emoji: '✅' },
  'marketing.paused': { category: 'ops', defaultOn: true, urgent: true, emoji: '🛑' },
  'payment.fulfill_failed': { category: 'money_alert', defaultOn: true, urgent: true, emoji: '🚨' },
  'payment.duplicate': { category: 'money_alert', defaultOn: true, urgent: true, emoji: '🚨' },
  'vmq.unmatched': { category: 'money_alert', defaultOn: true, urgent: true, emoji: '🚨' },
  'wallet.alert': { category: 'money_alert', defaultOn: true, urgent: true, emoji: '🚨' },
  // 现有推送里它是 opt-in（默认不推），机器人沿用
  'wallet.topup': { category: 'ops', defaultOn: false, emoji: '💳', userTextLabels: ['用户', '买家'] },
  'sms.alert': { category: 'ops', defaultOn: true, urgent: true, emoji: '🚨' },
  'sms.refund_failed': { category: 'money_alert', defaultOn: true, urgent: true, emoji: '🚨' },
  'sms.complaint': { category: 'ops', defaultOn: true, emoji: '📨', userTextLabels: ['内容', '说明', '买家'] },
  'sms.daily': { category: 'ops', defaultOn: true, emoji: '📊' },
  // 机器人自己的三个事件只走企业微信（sink 会跳过 bot.*），这里登记只为让 Record 完整
  'bot.offline': { category: 'security', defaultOn: true, urgent: true, emoji: '🚨' },
  'bot.online': { category: 'security', defaultOn: true, emoji: '✅' },
  'bot.sensitive': { category: 'security', defaultOn: true, urgent: true, emoji: '🔐' },
  // 内容平台待审提醒（docs/内容平台/内容平台-设计.md §10.1）：标题与作者是用户填的
  'forum.review': { category: 'ops', defaultOn: true, emoji: '📝', userTextLabels: ['标题', '作者', '内容'] },
})

/** 渠道站内通知 → 分站群 */
export const TENANT_NOTICE_DEFS: Readonly<Record<TenantNoticeKind, EventDef>> = Object.freeze({
  ORDER_PAID: { category: 'order_done', defaultOn: true, emoji: '💰' },
  BUYER_MESSAGE: { category: 'message', defaultOn: true, emoji: '🔔' },
  AFTER_SALE_RESULT: { category: 'aftersale', defaultOn: true, emoji: '🧾' },
  ORDER_REFUNDED: { category: 'order_done', defaultOn: true, emoji: '↩️' },
  STATEMENT: { category: 'settle', defaultOn: true, emoji: '📑' },
  PAYOUT: { category: 'settle', defaultOn: true, emoji: '💸' },
  SUPPLY_CHANGED: { category: 'supply', defaultOn: true, emoji: '📦' },
  PLATFORM_LISTING: { category: 'supply', defaultOn: true, emoji: '🆕' },
  AUTO_DELISTED: { category: 'supply', defaultOn: true, urgent: true, emoji: '⛔' },
  PRODUCT_WITHDRAWN: { category: 'supply', defaultOn: true, urgent: true, emoji: '⛔' },
  TENANT_STATUS: { category: 'store', defaultOn: true, urgent: true, emoji: '🏪' },
  NEGATIVE_BALANCE: { category: 'settle', defaultOn: true, urgent: true, emoji: '⚠️' },
  CUSTOMER_JOINED: { category: 'user', defaultOn: true, emoji: '👤' },
  ORDER_DELIVERED: { category: 'order_done', defaultOn: true, emoji: '📦' },
})

/** 新补的事件（现有代码里没有对应通知，§5.2「新增」） */
export type DirectEventType =
  | 'channel.order_created' // 渠道站新订单（未付款）
  | 'channel.invoice_paid' // 渠道单开票税费已付（精简版）
  | 'channel.receipt_created' // 渠道单收据
  | 'platform.alert' // alertPlatform 旁路

export const DIRECT_EVENT_DEFS: Readonly<Record<DirectEventType, EventDef & { title: string }>> = Object.freeze({
  'channel.order_created': { category: 'order_new', defaultOn: true, emoji: '🛒', title: '新订单（未付款）' },
  'channel.invoice_paid': { category: 'billing', defaultOn: true, emoji: '🧾', title: '开票申请（税费已付）' },
  'channel.receipt_created': { category: 'billing', defaultOn: true, emoji: '📄', title: '新开具收据' },
  'platform.alert': { category: 'channel_alert', defaultOn: true, urgent: true, emoji: '🚨', title: '渠道告警' },
})

/** 带 site 的 notify()（渠道单里需要站长处理的告警）一律按这个类别路由到管理群（站长 Q7） */
export const CHANNEL_ALERT_CATEGORY: BotCategory = 'channel_alert'

/** 某会话是否订阅了某类别：subs 里有值用它，没有取默认（目录里该类别任一事件默认开即视为开） */
export function categoryDefaultOn(category: BotCategory): boolean {
  if (category === 'ops') return true
  for (const d of Object.values(NOTIFY_EVENT_DEFS)) if (d.category === category && d.defaultOn) return true
  for (const d of Object.values(TENANT_NOTICE_DEFS)) if (d.category === category && d.defaultOn) return true
  for (const d of Object.values(DIRECT_EVENT_DEFS)) if (d.category === category && d.defaultOn) return true
  return false
}

export function isSubscribed(subs: unknown, category: BotCategory): boolean {
  if (category === 'security') return true // 安全类不可退订
  if (subs && typeof subs === 'object' && !Array.isArray(subs)) {
    const v = (subs as Record<string, unknown>)[category]
    if (typeof v === 'boolean') return v
  }
  return categoryDefaultOn(category)
}
