/**
 * 「订单」指令的取数（docs/微信机器人-设计.md §7.3、§7.5，附录 B 第 2、3 条）：按订单号 / 邮箱 / 订单号后 6 位找订单，给摘要用的字段。
 * 只读；**不取卡密**（只数已发出几张，看卡用「查卡」）。
 *
 * 【范围】分站范围（分站群）只能按完整订单号查、只查本站单：where 里直接带 tenantId，别站的单与不存在一视同仁（都是「没有」），
 *  不暴露「这个号在别的站存在」。分站范围下**不查**买家邮箱、订单备注与站长未读数（第二次查询只在管理群范围发出，不是查了再藏）。
 * 【索引】订单号走唯一索引；邮箱先按 users.email 唯一索引找人、再按 user_id（外键索引）取单；后 6 位没有索引能用，
 *  限定最近 90 天（created_at 索引）再匹配尾号。列表最多 limit 条，总数单独 count。
 */
import { prisma } from '../../db'
import { assertScope, centsOrNull, requirePlatformScope, tenantWhere, type BotScope } from './scope'

/** 按订单号后 6 位查时只看最近这么多天的订单 */
export const SUFFIX_LOOKBACK_DAYS = 90

export type OrderQuery = { kind: 'no'; orderNo: string } | { kind: 'email'; email: string } | { kind: 'suffix'; suffix: string }

export interface OrderBrief {
  id: number
  orderNo: string
  tenantId: number
  productName: string
  botCode: string | null
  deliveryType: string
  quantity: number
  amountCents: number
  invoiceTaxCents: number | null
  payStatus: string
  deliveryStatus: string
  createdAt: Date
  paidAt: Date | null
  deliveredAt: Date | null
  /** 已发出的卡（status = USED）张数：只是数量，不取卡的内容 */
  cardsSent: number
  /** 仅管理群范围：买家邮箱原文（调用方负责打码）；分站范围恒为 null */
  userEmail: string | null
  /** 仅管理群范围：订单备注（含系统追加的「待人工补发」「【待退款】」等）；分站范围恒为 null */
  remark: string | null
  /** 仅管理群范围：买家发来、站长未读的留言条数；分站范围恒为 0 */
  unreadForAdmin: number
}

export interface OrderLookupResult {
  /** 符合条件的订单总数（list 最多 limit 条，按下单时间倒序） */
  total: number
  list: OrderBrief[]
  /** 按邮箱查时：有没有这个用户 */
  userFound?: boolean
}

const BASE_SELECT = {
  id: true,
  orderNo: true,
  tenantId: true,
  productName: true,
  quantity: true,
  amount: true,
  invoiceTaxFee: true,
  payStatus: true,
  deliveryStatus: true,
  createdAt: true,
  paidAt: true,
  deliveredAt: true,
  product: { select: { botCode: true, deliveryType: true } },
} as const

export async function lookupOrders(scope: BotScope, q: OrderQuery, now: Date, limit = 5): Promise<OrderLookupResult> {
  assertScope(scope)
  const take = Math.min(Math.max(1, Math.trunc(limit)), 10)
  let where: { orderNo: string; tenantId?: number } | { userId: number } | { orderNo: { endsWith: string }; createdAt: { gte: Date } }
  let userFound: boolean | undefined
  if (q.kind === 'no') {
    where = { orderNo: q.orderNo, ...tenantWhere(scope) }
  } else if (q.kind === 'email') {
    requirePlatformScope(scope, '按邮箱查订单')
    const u = await prisma.user.findUnique({ where: { email: q.email }, select: { id: true } })
    if (!u) return { total: 0, list: [], userFound: false }
    userFound = true
    where = { userId: u.id }
  } else {
    requirePlatformScope(scope, '按订单号后 6 位查订单')
    where = { orderNo: { endsWith: q.suffix }, createdAt: { gte: new Date(now.getTime() - SUFFIX_LOOKBACK_DAYS * 86400_000) } }
  }
  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, take, select: BASE_SELECT }),
  ])
  if (!rows.length) return { total, list: [], userFound }
  const ids = rows.map((r) => r.id)
  const platform = scope.tenantId === null
  // 邮箱、备注、站长未读数只在管理群范围查
  const [cardOf, extraOf, unreadOf] = await Promise.all([
    cardsSentOf(ids),
    platform ? platformExtras(ids) : Promise.resolve(new Map<number, { email: string | null; remark: string | null }>()),
    platform ? unreadForAdminOf(ids) : Promise.resolve(new Map<number, number>()),
  ])
  const list = rows.map((r): OrderBrief => {
    const x = extraOf.get(r.id)
    return {
      id: r.id,
      orderNo: r.orderNo,
      tenantId: r.tenantId,
      productName: r.productName,
      botCode: r.product?.botCode ?? null,
      deliveryType: r.product?.deliveryType ?? '',
      quantity: r.quantity,
      amountCents: centsOrNull(r.amount) ?? 0,
      invoiceTaxCents: centsOrNull(r.invoiceTaxFee),
      payStatus: r.payStatus,
      deliveryStatus: r.deliveryStatus,
      createdAt: r.createdAt,
      paidAt: r.paidAt,
      deliveredAt: r.deliveredAt,
      cardsSent: cardOf.get(r.id) ?? 0,
      userEmail: platform ? x?.email ?? null : null,
      remark: platform ? x?.remark ?? null : null,
      unreadForAdmin: platform ? unreadOf.get(r.id) ?? 0 : 0,
    }
  })
  return { total, list, userFound }
}

/** 每单已发出（USED）的卡张数：按 card_keys.order_id 索引分组计数，不取卡 */
async function cardsSentOf(orderIds: number[]): Promise<Map<number, number>> {
  const rows = await prisma.cardKey.groupBy({ by: ['orderId'], where: { orderId: { in: orderIds }, status: 'USED' }, _count: { _all: true } })
  const out = new Map<number, number>()
  rows.forEach((c) => {
    if (c.orderId != null) out.set(c.orderId, c._count._all)
  })
  return out
}

/** 仅管理群范围：买家邮箱与订单备注 */
async function platformExtras(orderIds: number[]): Promise<Map<number, { email: string | null; remark: string | null }>> {
  const rows = await prisma.order.findMany({ where: { id: { in: orderIds } }, select: { id: true, remark: true, user: { select: { email: true } } } })
  return new Map(rows.map((r) => [r.id, { email: r.user?.email ?? null, remark: r.remark }]))
}

/** 仅管理群范围：买家发来、站长未读的留言条数 */
async function unreadForAdminOf(orderIds: number[]): Promise<Map<number, number>> {
  const rows = await prisma.orderMessage.groupBy({ by: ['orderId'], where: { orderId: { in: orderIds }, sender: 'BUYER', readByAdmin: false }, _count: { _all: true } })
  return new Map(rows.map((u) => [u.orderId, u._count._all]))
}
