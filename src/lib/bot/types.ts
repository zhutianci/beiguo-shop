/**
 * 微信机器人公共类型（契约：docs/微信机器人-设计.md）。
 * 这里只放类型与常量，不 import 任何业务模块（旁路 sink 也会引用它）。
 */

/** 会话类型：主站管理群 / 分站群 / 管理员私聊（§4.1） */
export type ConvKind = 'MGMT' | 'TENANT' | 'DM'
export type ConvStatus = 'ACTIVE' | 'PAUSED' | 'UNREACHABLE' | 'REVOKED'

/** 订阅类别（§5.2）。同一个类别名在管理群里指主站事件，在分站群里指本站事件 */
export type BotCategory =
  | 'user' // 用户 / 新客户注册
  | 'order_new' // 下单（未付款）
  | 'order_done' // 成交：付款、交付、退款
  | 'message' // 买家留言
  | 'billing' // 发票、收据
  | 'stock' // 库存（仅管理群）
  | 'money_alert' // 资金异常（仅管理群）
  | 'channel_alert' // 渠道单里需要站长处理的告警（仅管理群，站长 Q7）
  | 'ops' // 运营类：友链、抽奖、营销、接码、充值（仅管理群）
  | 'security' // 安全：卡密导出、机器人自身（仅管理群，不可退订）
  | 'aftersale' // 售后结果（仅分站群）
  | 'settle' // 结算单、打款、余额为负（仅分站群）
  | 'supply' // 货源：进货价、授权、下架（仅分站群）
  | 'store' // 店铺状态、域名（仅分站群）

export const CATEGORY_LABELS: Readonly<Record<BotCategory, string>> = Object.freeze({
  user: '用户',
  order_new: '下单',
  order_done: '成交',
  message: '留言',
  billing: '发票收据',
  stock: '库存',
  money_alert: '资金异常',
  channel_alert: '渠道告警',
  ops: '运营',
  security: '安全',
  aftersale: '售后',
  settle: '结算',
  supply: '货源',
  store: '店铺',
})

/** 管理群可订阅的类别 */
export const MGMT_CATEGORIES: readonly BotCategory[] = [
  'user',
  'order_new',
  'order_done',
  'message',
  'billing',
  'stock',
  'money_alert',
  'channel_alert',
  'ops',
  'security',
]

/** 分站群可订阅的类别（不能订阅平台类别，§5.2） */
export const TENANT_CATEGORIES: readonly BotCategory[] = [
  'user',
  'order_new',
  'order_done',
  'message',
  'billing',
  'aftersale',
  'settle',
  'supply',
  'store',
]

/** 不允许退订的类别 */
export const LOCKED_CATEGORIES: ReadonlySet<BotCategory> = new Set<BotCategory>(['security'])

/** 一行「标签：值」 */
export interface BotLine {
  label: string
  value: string
}

/** 出队消息的种类与优先级（§5.6：指令回复 > 紧急 > 普通动态 > 日报） */
export type OutboxKind = 'EVENT' | 'DIGEST' | 'REPLY' | 'REPORT' | 'ALERT'
export const PRIORITY = Object.freeze({ REPLY: 30, URGENT: 20, EVENT: 10, REPORT: 0 })

/** 协议服务回调解析后的标准入站消息（§11.2） */
export interface Inbound {
  kind: 'MESSAGE' | 'SYSTEM'
  /** 协议给的消息 ID，入站去重 */
  msgId: string
  /** 群 ID（xxx@chatroom）或私聊对方 wxid */
  convExternalId: string
  isGroup: boolean
  senderWxid: string
  senderName?: string
  text: string
  /** 被 @ 的 wxid 列表（来自消息的 atuserlist；@所有人 时含 notify@all） */
  atWxids: string[]
  atAll: boolean
  ts: Date
}
