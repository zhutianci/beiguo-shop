/**
 * 渠道后台：订单列表 / 搜索 / 导出 / 详情（WP6，设计 6.3、6.4、12.1）。
 *
 * 【行范围】所有查询 where 顶层先放 tenantId（来自 partnerRoute 查库的结果），再放搜索条件（设计 6.4.3「先限定本站，再做匹配」）。
 * 所以用主站订单号、主站买家邮箱、zz 的卡密去搜，结果与「不存在」完全一样（total=0，W6-8）。
 * 客户端只能传枚举化的筛选参数；这里逐个字段翻译成 Prisma where，**绝不透传 JSON**。
 *
 * 【字段】只用 selects.ts 的白名单；列表 / 详情 / 导出**一律不含交付凭据**（卡密、deliveryInfo、验证码只在
 * order-cards.ts 的 /cards 接口里给，Q14）。自增 id 只在服务端内部用来关联（PARTNER_INTERNAL_ORDER_KEY_SELECT），不进 DTO。
 *
 * 【账本】订单详情里的结算快照只经 partner-facade（WP3）；本文件不 import ledger / balances（边界检查规则 3）。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { toCents } from '../money'
import { writeAudit, writeAuditThrottled } from '../audit'
import { orderSettlementViewsForPartner } from '../tenant/partner-facade'
import {
  LIMITS,
  TENANT_DEFAULTS,
  type AfterSaleKind,
  type AfterSaleStatus,
  type PartnerInvoiceDTO,
  type OrderSettlementView,
  type PartnerOrderDetail,
  type PartnerOrderListRow,
  type PartnerOrderSettlementView,
  type PartnerReceiptDTO,
  type PartnerSmsDTO,
  type SettleState,
  type InvShareState,
} from '../tenant/types'
import { newPublicNo, parsePublicNo } from '../tenant/public-no'
import { assertTenantId, findTenantOrder } from './_scope'
import {
  PARTNER_AFTER_SALE_SELECT,
  PARTNER_INTERNAL_CUSTOMER_KEY_SELECT,
  PARTNER_INTERNAL_LISTING_KEY_SELECT,
  PARTNER_INTERNAL_ORDER_KEY_SELECT,
  PARTNER_INTERNAL_SELF_SELECT,
  PARTNER_INVOICE_SELECT,
  PARTNER_ORDER_DETAIL_SELECT,
  PARTNER_ORDER_LIST_SELECT,
  PARTNER_RECEIPT_SELECT,
  PARTNER_SMS_SELECT,
} from './selects'
import { tenantOrderIdsByCardText } from './order-cards'

// ============================================================================
// 通用：服务层错误与小工具（本目录其他服务文件复用）
// ============================================================================

/**
 * 服务层的业务错误：handler 按 status 原样转成 { success:false, error }。
 * 404 一律用 PARTNER_NOT_FOUND_BODY（handler 负责），这里的 message 对 404 不生效——「不存在」与「无权」不可区分。
 */
export class PartnerServiceError extends Error {
  constructor(
    public readonly status: 400 | 404 | 409 | 429 | 503,
    message: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'PartnerServiceError'
  }
}

export const notFoundError = () => new PartnerServiceError(404, '资源不存在')

export function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}

/** Decimal / 数字 / 字符串 → 分（Int）。toCents 是全仓唯一的元→分口径 */
export function centsOf(v: { toString(): string } | number | string | null | undefined): number {
  if (v === null || v === undefined) return 0
  return toCents(typeof v === 'object' ? v.toString() : v)
}

/** 东八区某天 00:00 对应的 UTC 时刻（渠道看到的「今日」「本月」与站长对账口径一致） */
export function cnDayStart(d: Date): Date {
  const t = new Date(d.getTime() + 8 * 3600_000)
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - 8 * 3600_000)
}
export function cnMonthStart(d: Date): Date {
  const t = new Date(d.getTime() + 8 * 3600_000)
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1) - 8 * 3600_000)
}
export function cnDateTimeText(d: Date): string {
  const t = new Date(d.getTime() + 8 * 3600_000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`
}

// ============================================================================
// 筛选
// ============================================================================

export const PAY_STATUSES = ['UNPAID', 'PAID', 'REFUNDED'] as const
export const DELIVERY_STATUSES = ['PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED'] as const
export const SETTLE_FILTERS = ['ACCRUED', 'RELEASED', 'REVERSED', 'EXCLUDED', 'MISSING', 'NONE'] as const

export interface PartnerOrderFilter {
  page?: number
  pageSize?: number
  /** 订单号前缀 */
  orderNo?: string
  /** 买家邮箱：精确或前缀，≥ 3 字符 */
  email?: string
  productId?: number
  /** 商品（渠道侧只认 listingNo，服务端换成 productId；不存在 / 未授权 = 空结果） */
  listingNo?: string
  /** 只看有未读买家留言的订单（看板「未读买家留言」待办跳过来用） */
  unread?: boolean
  payStatus?: (typeof PAY_STATUSES)[number]
  deliveryStatus?: (typeof DELIVERY_STATUSES)[number]
  /** 结算状态；NONE = 未计提（未付款 / 平台单口径） */
  settle?: (typeof SETTLE_FILTERS)[number]
  /** 下单时间范围（含端点）；UTC 时刻，由 handler 按东八区日期换算 */
  from?: Date
  to?: Date
  /** yes = 结账勾选开票或有本站发票；no = 都没有 */
  invoice?: 'yes' | 'no'
  /** pending = 有待处理售后申请；any = 有过任何售后申请；none = 从未申请 */
  afterSale?: 'pending' | 'any' | 'none'
  /** 卡密明文：服务端算 contentHash 后精确匹配本站已售卡（盐只在服务端） */
  card?: string
  /** 客户编号（WP7 客户详情「本站订单」复用）：先按 (tenantId, customerNo) 找到客户，查不到 = 空结果 */
  customerNo?: string
}

/** 单个条件 ≤ 128 字符（设计 6.4.3）；超长直接 400，不截断（截断后的前缀匹配会返回意料之外的结果） */
const MAX_COND_LEN = 128

function assertLen(name: string, v: string | undefined): void {
  if (v !== undefined && v.length > MAX_COND_LEN) throw new PartnerServiceError(400, `${name}过长（最多 ${MAX_COND_LEN} 个字符）`)
}

/**
 * 把筛选条件翻译成 where。返回 null = 必然为空（例如卡密不属于本站、客户编号不存在），调用方直接回 total=0，
 * 不再发一条必然为空的查询——也不会因为「查了 / 没查」产生可观测的时间差之外的任何差异。
 */
async function buildOrderWhere(tenantId: number, f: PartnerOrderFilter): Promise<Prisma.OrderWhereInput | null> {
  assertTenantId(tenantId)
  assertLen('订单号', f.orderNo)
  assertLen('邮箱', f.email)
  assertLen('卡密', f.card)
  assertLen('客户编号', f.customerNo)

  // tenantId 放在 AND 的第一项且是顶层字段：后面任何条件都只能在本渠道订单里再收窄
  const and: Prisma.OrderWhereInput[] = []
  const where: Prisma.OrderWhereInput = { tenantId, AND: and }

  if (f.orderNo) {
    const no = f.orderNo.trim()
    if (!/^[A-Za-z0-9_-]+$/.test(no)) return null
    and.push({ orderNo: { startsWith: no } })
  }
  if (f.email !== undefined && f.email.trim() !== '') {
    const e = f.email.trim()
    if (e.length < 3) throw new PartnerServiceError(400, '邮箱至少输入 3 个字符')
    and.push({ user: { email: { startsWith: e } } })
  }
  if (f.productId !== undefined) and.push({ productId: f.productId })
  if (f.listingNo !== undefined) {
    // 只认本渠道**已授权**的上架行：未授权行渠道在商品池里看不到，按它筛也只给空结果（不暴露其存在，设计 5.3 / 6.3）
    const no = parsePublicNo(f.listingNo)
    if (!no) return null
    const l = await prisma.tenantListing.findFirst({ where: { tenantId, publicNo: no, granted: true }, select: PARTNER_INTERNAL_LISTING_KEY_SELECT })
    if (!l) return null
    and.push({ productId: l.productId })
  }
  if (f.unread) and.push({ messages: { some: { sender: 'BUYER', readByTenant: false } } })
  if (f.payStatus) and.push({ payStatus: f.payStatus })
  if (f.deliveryStatus) and.push({ deliveryStatus: f.deliveryStatus })
  if (f.settle) and.push({ settleState: f.settle === 'NONE' ? null : f.settle })
  if (f.from) and.push({ createdAt: { gte: f.from } })
  if (f.to) and.push({ createdAt: { lte: f.to } })

  if (f.customerNo !== undefined) {
    const no = parsePublicNo(f.customerNo)
    if (!no) return null
    const c = await prisma.tenantCustomer.findFirst({ where: { tenantId, publicNo: no }, select: PARTNER_INTERNAL_CUSTOMER_KEY_SELECT })
    if (!c) return null
    and.push({ userId: c.userId })
  }

  if (f.card !== undefined && f.card.trim() !== '') {
    const ids = await tenantOrderIdsByCardText(tenantId, f.card)
    if (ids.length === 0) return null
    and.push({ id: { in: ids } })
  }

  if (f.invoice) {
    // 「本站发票」= Invoice where { tenantId, shopOrderId }（两个条件同时满足，设计 6.3）
    const inv = await prisma.invoice.groupBy({ by: ['shopOrderId'], where: { tenantId, shopOrderId: { not: null } } })
    const invOrderIds = inv.map((r) => r.shopOrderId).filter((x): x is number => typeof x === 'number')
    if (f.invoice === 'yes') and.push({ OR: [{ invoiceTaxFee: { gt: 0 } }, { id: { in: invOrderIds } }] })
    else and.push({ OR: [{ invoiceTaxFee: null }, { invoiceTaxFee: { lte: 0 } }] }, { id: { notIn: invOrderIds } })
  }

  if (f.afterSale) {
    const as = await prisma.tenantAfterSale.groupBy({
      by: ['orderId'],
      where: { tenantId, orderId: { not: null }, ...(f.afterSale === 'pending' ? { status: 'PENDING' } : {}) },
    })
    const ids = as.map((r) => r.orderId).filter((x): x is number => typeof x === 'number')
    if (f.afterSale === 'none') and.push({ id: { notIn: ids } })
    else and.push({ id: { in: ids } })
  }

  return where
}

// ============================================================================
// 列表行映射
// ============================================================================

type ListRaw = Prisma.OrderGetPayload<{ select: typeof PARTNER_ORDER_LIST_SELECT & typeof PARTNER_INTERNAL_ORDER_KEY_SELECT }>

const LIST_WITH_KEY = { ...PARTNER_ORDER_LIST_SELECT, ...PARTNER_INTERNAL_ORDER_KEY_SELECT } as const

function toListRow(o: ListRaw, unread: number, afterSaleStatus: string | null): PartnerOrderListRow {
  return {
    orderNo: o.orderNo,
    productName: o.productName,
    quantity: o.quantity,
    unitPriceCents: centsOf(o.productPrice),
    amountCents: centsOf(o.amount),
    invoiceTaxCents: centsOf(o.invoiceTaxFee),
    payStatus: o.payStatus,
    deliveryStatus: o.deliveryStatus,
    createdAt: o.createdAt.toISOString(),
    paidAt: iso(o.paidAt),
    deliveredAt: iso(o.deliveredAt),
    escalatedAt: iso(o.escalatedAt),
    settleState: (o.settleState as SettleState | null) ?? null,
    invShareState: (o.invShareState as InvShareState | null) ?? null,
    refundedGoodsCents: o.refundedGoodsCents ?? 0,
    refundedTaxCents: o.refundedTaxCents ?? 0,
    refundedQty: o.refundedQty ?? 0,
    buyer: { email: o.user.email ?? '', nickname: o.user.nickname ?? null },
    unreadMessages: unread,
    afterSaleStatus,
  }
}

/** 一批订单（已确认属于本渠道的内部 id）的未读买家留言数 */
async function unreadCounts(orderIds: number[]): Promise<Map<number, number>> {
  const m = new Map<number, number>()
  if (orderIds.length === 0) return m
  const g = await prisma.orderMessage.groupBy({
    by: ['orderId'],
    where: { orderId: { in: orderIds }, sender: 'BUYER', readByTenant: false },
    _count: { _all: true },
  })
  g.forEach((r) => m.set(r.orderId, r._count._all))
  return m
}

/**
 * 一批订单的「售后状态」：有待处理的给 PENDING，否则给最近一条申请的状态；从未申请 = null。
 * 条件里同时带 tenantId（售后行本身就按渠道隔离），不只靠 orderId。
 */
async function afterSaleStatuses(tenantId: number, orderIds: number[]): Promise<Map<number, string>> {
  const m = new Map<number, string>()
  if (orderIds.length === 0) return m
  const g = await prisma.tenantAfterSale.groupBy({
    by: ['orderId', 'status'],
    where: { tenantId, orderId: { in: orderIds } },
    _max: { createdAt: true },
  })
  const latest = new Map<number, { status: string; at: number }>()
  g.forEach((r) => {
    if (r.orderId == null) return
    if (r.status === 'PENDING') {
      m.set(r.orderId, 'PENDING')
      return
    }
    const at = r._max.createdAt ? r._max.createdAt.getTime() : 0
    const cur = latest.get(r.orderId)
    if (!cur || at > cur.at) latest.set(r.orderId, { status: r.status, at })
  })
  latest.forEach((v, k) => {
    if (!m.has(k)) m.set(k, v.status)
  })
  return m
}

async function decorate(tenantId: number, raws: ListRaw[]): Promise<PartnerOrderListRow[]> {
  const ids = raws.map((r) => r.id)
  const [unread, as] = await Promise.all([unreadCounts(ids), afterSaleStatuses(tenantId, ids)])
  return raws.map((r) => toListRow(r, unread.get(r.id) ?? 0, as.get(r.id) ?? null))
}

// ============================================================================
// 列表（WP7 客户详情复用：partnerListOrders(tenantId, { customerNo })）
// ============================================================================

export async function partnerListOrders(tenantId: number, filter: PartnerOrderFilter): Promise<{ total: number; rows: PartnerOrderListRow[] }> {
  assertTenantId(tenantId)
  const where = await buildOrderWhere(tenantId, filter)
  if (!where) return { total: 0, rows: [] }
  const page = Math.max(1, Math.floor(filter.page ?? 1))
  const pageSize = Math.min(LIMITS.pageMax, Math.max(1, Math.floor(filter.pageSize ?? 20)))
  const [total, raws] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      select: LIST_WITH_KEY,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])
  return { total, rows: await decorate(tenantId, raws) }
}

// ============================================================================
// 导出（OWNER；每日 10 次；≤ 5000 行；水印；不含任何交付凭据）
// ============================================================================

export const ORDER_EXPORT_HEADER = [
  '订单号',
  '商品',
  '数量',
  '单价(元)',
  '货款(元)',
  '开票税费(元)',
  '支付状态',
  '交付状态',
  '下单时间',
  '支付时间',
  '交付时间',
  '买家邮箱',
  '买家昵称',
  '结算状态',
  '发票分成状态',
  '已退货款(元)',
  '已退税费(元)',
  '已退件数',
  '升级时间',
  '未读留言',
  '售后状态',
]

const yuan = (c: number) => (c / 100).toFixed(2)
const cnTime = (s: string | null) => (s ? cnDateTimeText(new Date(s)) : '')

/**
 * 导出限额按「东八区自然日、本渠道」计数，数的是 audit_events 里当天成功的 order.export——
 * 落库计数，进程重启不清零，也天然覆盖「每次导出写审计」。超限本身也写一条 DENIED 审计（W6-11）。
 *
 * 【并发：先占位、再复数】只「先数后写」的话，同一秒并发 N 个导出都会看到 used<10、全部放行，日限额被突破。
 * 这里把 OK 审计行本身当名额：
 *   1. 快速路径：已满直接 DENIED（与原来一样，顺序请求的第 11 次走这里）；
 *   2. 先做不占名额的校验（筛选条件、行数上限 400），再**写入本次的 OK 审计行占位**（targetId = 本次导出编号）；
 *   3. 占位提交后重新数当天 OK 行（含别人已提交的占位）；> 上限就把**自己这行**改成 DENIED / DAILY_LIMIT 并 429。
 * 为什么不会超：任意两个都放行的请求 A、B，若 A 复数时没看到 B，则 B 的占位提交晚于 A 的复数、也就晚于 A 的占位提交，
 * B 复数时必然数到 A——所以放行者复数时看到的行数都 ≤ 上限，放行总数 ≤ 上限。代价是保守：极端并发下可能双双拒绝、
 * 名额没用满，渠道重试即可（fail closed，不会多给）。
 *   4. 占位之后生成文件出错：把自己这行改成 ERROR 释放名额，再抛出。
 * 审计行只在本次请求内从 OK 改成 DENIED / ERROR（同一次尝试的最终结果），不改任何别的行；没用 GET_LOCK，因为规则 3 禁止 $queryRaw。
 */
export async function partnerExportOrders(
  tenantId: number,
  userId: number,
  filter: PartnerOrderFilter,
  req?: Request,
): Promise<{ header: string[]; rows: Record<string, string | number | null>[]; watermark: string; filename: string }> {
  assertTenantId(tenantId)
  const now = new Date()
  const limit = TENANT_DEFAULTS.orderExportPerDay
  const okToday = { tenantId, action: 'order.export', result: 'OK', at: { gte: cnDayStart(now) } }
  const denyDaily = async (used: number) => {
    await writeAudit(null, {
      actorKind: 'TENANT',
      actorUserId: userId,
      tenantId,
      action: 'order.export',
      result: 'DENIED',
      reasonCode: 'DAILY_LIMIT',
      diff: { used, limit },
      req,
    })
    return new PartnerServiceError(429, `今日导出次数已用完（每日 ${limit} 次）`)
  }

  const used = await prisma.auditEvent.count({ where: okToday })
  if (used >= limit) throw await denyDaily(used)

  const where = await buildOrderWhere(tenantId, filter)
  const total = where ? await prisma.order.count({ where }) : 0
  if (total > LIMITS.exportMaxRows) {
    throw new PartnerServiceError(400, `结果共 ${total} 行，超过单次导出上限 ${LIMITS.exportMaxRows} 行，请缩小时间范围`)
  }

  // 导出编号：随机公开编号（不是时间戳）——它同时是占位审计行的定位键，并发的两次导出不能撞号
  const requestId = `EX${newPublicNo()}`
  const mine = { tenantId, action: 'order.export', targetType: 'order', targetId: requestId }
  // 先写审计、后给文件：审计写不进去就不导出（导出本身就是需要留痕的敏感操作）；这行同时是今日名额的占位
  await writeAudit(null, {
    actorKind: 'TENANT',
    actorUserId: userId,
    tenantId,
    action: 'order.export',
    targetType: 'order',
    targetId: requestId,
    result: 'OK',
    diff: { filter: exportFilterSummary(filter), rows: total },
    req,
  })
  const after = await prisma.auditEvent.count({ where: okToday })
  if (after > limit) {
    await prisma.auditEvent.updateMany({ where: { ...mine, result: 'OK' }, data: { result: 'DENIED', reasonCode: 'DAILY_LIMIT' } })
    throw new PartnerServiceError(429, `今日导出次数已用完（每日 ${limit} 次）`)
  }

  try {
    const raws = where
      ? await prisma.order.findMany({ where, select: LIST_WITH_KEY, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: LIMITS.exportMaxRows })
      : []
    const rows = await decorate(tenantId, raws)

    // 水印：导出人（本人邮箱）+ 时间 + 用途。导出人取当前成员自己的账号（只读本人一行，见文件末尾说明）
    const me = await prisma.user.findUnique({ where: { id: userId }, select: SELF_WATERMARK_SELECT })
    const who = me?.nickname ? `${me.nickname}（${me.email ?? ''}）` : me?.email ?? '渠道成员'
    const watermark = `导出人：${who}；导出时间：${cnDateTimeText(now)}（东八区）；导出编号：${requestId}；仅用于本站售后，禁止外传`

    const csvRows: Record<string, string | number | null>[] = rows.map((r) => ({
      订单号: r.orderNo,
      商品: r.productName,
      数量: r.quantity,
      '单价(元)': yuan(r.unitPriceCents),
      '货款(元)': yuan(r.amountCents),
      '开票税费(元)': yuan(r.invoiceTaxCents),
      支付状态: r.payStatus,
      交付状态: r.deliveryStatus,
      下单时间: cnTime(r.createdAt),
      支付时间: cnTime(r.paidAt),
      交付时间: cnTime(r.deliveredAt),
      买家邮箱: r.buyer.email,
      买家昵称: r.buyer.nickname,
      结算状态: r.settleState,
      发票分成状态: r.invShareState,
      '已退货款(元)': yuan(r.refundedGoodsCents),
      '已退税费(元)': yuan(r.refundedTaxCents),
      已退件数: r.refundedQty,
      升级时间: cnTime(r.escalatedAt),
      未读留言: r.unreadMessages,
      售后状态: r.afterSaleStatus,
    }))

    // CSV 文本由 handler 用 _http.toCsv 生成（公式注入防护、BOM、水印行都在那里，服务层不重复实现）
    const d = cnDateTimeText(now).slice(0, 10)
    return { header: ORDER_EXPORT_HEADER, rows: csvRows, watermark, filename: `orders-${d}.csv` }
  } catch (e) {
    // 生成失败：本次没给出文件，释放名额（占位行改 ERROR）；改不动也只记日志，原错误照常抛出（名额多扣一次，fail closed）
    await prisma.auditEvent
      .updateMany({ where: { ...mine, result: 'OK' }, data: { result: 'ERROR', reasonCode: 'EXPORT_FAILED' } })
      .catch((err) => console.error('[partner] 导出失败后释放名额失败', (err as Error)?.message || err))
    throw e
  }
}

/** 审计里记录的筛选条件：卡密明文不落审计（只记「按卡密搜索」） */
function exportFilterSummary(f: PartnerOrderFilter): Record<string, unknown> {
  const { card, from, to, ...rest } = f
  return { ...rest, ...(card ? { card: '(卡密精确匹配)' } : {}), from: from ? from.toISOString() : undefined, to: to ? to.toISOString() : undefined }
}

/**
 * 导出水印要写「导出人」（设计 6.2：文件带成员名与时间水印）。只读**当前成员本人**的邮箱与昵称，
 * 不经任何渠道 DTO；字段取自 selects.ts 的 PARTNER_INTERNAL_SELF_SELECT（D15）。
 */
const SELF_WATERMARK_SELECT = PARTNER_INTERNAL_SELF_SELECT

// ============================================================================
// 详情
// ============================================================================

const DETAIL_WITH_KEY = { ...PARTNER_ORDER_DETAIL_SELECT, ...PARTNER_INTERNAL_ORDER_KEY_SELECT } as const

/** 结账开票草稿（Order.invoiceInfo）只输出已知键，未知键丢弃（防将来草稿里多出内部字段被原样带给渠道） */
const INVOICE_INFO_KEYS = ['title', 'taxNumber', 'address', 'phone', 'bankName', 'bankAccount', 'email', 'showAiWording'] as const

function parseInvoiceInfo(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null
  let v: unknown
  try {
    v = JSON.parse(raw)
  } catch {
    return null
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const src = v as Record<string, unknown>
  const out: Record<string, unknown> = {}
  INVOICE_INFO_KEYS.forEach((k) => {
    const x = src[k]
    if (typeof x === 'string' || typeof x === 'boolean') out[k] = x
  })
  return Object.keys(out).length ? out : null
}

type InvoiceRaw = Prisma.InvoiceGetPayload<{ select: typeof PARTNER_INVOICE_SELECT }>
function toInvoiceDto(i: InvoiceRaw): PartnerInvoiceDTO {
  const c = (v: InvoiceRaw['sellingPrice']) => (v == null ? null : centsOf(v))
  return {
    invoiceNo: i.invoiceNo,
    sellingPriceCents: c(i.sellingPrice),
    invoiceAmountCents: c(i.invoiceAmount),
    taxFeeCents: c(i.taxFee),
    title: i.title,
    taxNumber: i.taxNumber,
    address: i.address,
    phone: i.phone,
    bankName: i.bankName,
    bankAccount: i.bankAccount,
    email: i.email,
    showAiWording: i.showAiWording,
    status: i.status,
    payStatus: i.payStatus,
    paidAt: iso(i.paidAt),
    submittedAt: iso(i.submittedAt),
    issuedAt: iso(i.issuedAt),
    createdAt: i.createdAt.toISOString(),
  }
}

type ReceiptRaw = Prisma.ReceiptGetPayload<{ select: typeof PARTNER_RECEIPT_SELECT }>
function toReceiptDto(r: ReceiptRaw): PartnerReceiptDTO {
  return {
    receiptNo: r.receiptNo,
    payerTitle: r.payerTitle,
    amountCents: centsOf(r.amount),
    issuedAt: (r.issuedAt ?? r.createdAt).toISOString(),
    // 相对地址：渠道后台与收据页同在渠道 Host 上，不需要（也不能在这一层）拼绝对 origin；token 本身不作为字段输出
    previewUrl: r.token ? `/receipt/${encodeURIComponent(r.token)}` : '',
  }
}

/**
 * 订单详情（设计 6.4.1，不含交付凭据）。不存在与「不是本渠道的单」同样返回 null（handler 统一 404）。
 * 每次查看写 order.view 审计，同一成员同一订单 10 分钟聚合一条。
 */
/**
 * 没有 finance.read 的成员（STAFF）看订单详情：余额、预计打款、手续费、所在桶、所属结算单置空（D5 最小权限）。
 * 结算状态与货款 / 进货款 / 发票分成这些「本单成分」仍给（设计 6.4.1：订单本身的构成属于 order.read）。
 */
function settlementForViewer(s: OrderSettlementView | null, withFinance: boolean): PartnerOrderSettlementView | null {
  if (!s || withFinance) return s
  return { ...s, feeCents: null, balanceCents: null, payoutCents: null, bucket: null, statementNo: null }
}

export async function partnerOrderDetail(
  tenantId: number,
  orderNo: string,
  userId: number,
  req: Request | undefined,
  opts: { withFinance: boolean },
): Promise<PartnerOrderDetail | null> {
  const o = await findTenantOrder(tenantId, orderNo, DETAIL_WITH_KEY)
  if (!o) return null

  const [invoices, receipts, sms, afterSales, unread, settlementMap] = await Promise.all([
    prisma.invoice.findMany({ where: { tenantId, shopOrderId: o.id }, select: PARTNER_INVOICE_SELECT, orderBy: { createdAt: 'asc' } }),
    prisma.receipt.findMany({ where: { tenantId, shopOrderId: o.id }, select: PARTNER_RECEIPT_SELECT, orderBy: { createdAt: 'asc' } }),
    // SmsActivation 没有 tenantId 列：orderId 取自上面按 (orderNo, tenantId) 查到的本渠道订单，行范围由它保证
    prisma.smsActivation.findUnique({ where: { orderId: o.id }, select: PARTNER_SMS_SELECT }),
    prisma.tenantAfterSale.findMany({ where: { tenantId, orderId: o.id }, select: PARTNER_AFTER_SALE_SELECT, orderBy: { createdAt: 'desc' }, take: 50 }),
    unreadCounts([o.id]),
    orderSettlementViewsForPartner(tenantId, [o.orderNo]),
  ])

  const smsDto: PartnerSmsDTO | null = sms
    ? { phone: sms.phone ?? null, status: sms.status, numberAt: iso(sms.numberAt), codeAt: iso(sms.codeAt), expireAt: iso(sms.expireAt) }
    : null
  const pending = afterSales.find((a) => a.status === 'PENDING')
  const afterSaleStatus = pending ? 'PENDING' : afterSales[0]?.status ?? null

  const base = toListRow(o, unread.get(o.id) ?? 0, afterSaleStatus)
  const detail: PartnerOrderDetail = {
    ...base,
    productId: o.productId,
    buyerRemark: o.buyerRemark ?? null,
    invoiceInfo: parseInvoiceInfo(o.invoiceInfo),
    supplyUnitCents: centsOf(o.supplyUnitPrice),
    supplyCents: o.supplyCents ?? 0,
    feeRateBp: o.feeRateBp ?? 0,
    invoiceShareRateBp: o.invoiceShareRateBp ?? 0,
    settleHoldDays: o.settleHoldDays ?? 0,
    settleBearer: o.settleBearer ?? null,
    buyer: { email: o.user.email ?? '', nickname: o.user.nickname ?? null, avatar: o.user.avatar ?? null },
    payments: o.payments.map((p) => ({ payMethod: p.payMethod, amountCents: centsOf(p.amount), createdAt: p.createdAt.toISOString() })),
    settlement: settlementForViewer(settlementMap.get(o.orderNo) ?? null, opts.withFinance),
    invoices: invoices.map(toInvoiceDto),
    receipts: receipts.map(toReceiptDto),
    sms: smsDto,
    afterSales: afterSales.map((a) => ({
      requestNo: a.requestNo,
      kind: a.kind as AfterSaleKind,
      status: a.status as AfterSaleStatus,
      resultNote: a.resultNote ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
  }

  // order.view：聚合写，失败只记日志（看订单详情不是交付凭据，不因审计失败拒绝）
  writeAuditThrottled(`order.view:${tenantId}:${userId}:${o.orderNo}`, TENANT_DEFAULTS.orderViewAuditWindowMs, {
    actorKind: 'TENANT',
    actorUserId: userId,
    tenantId,
    action: 'order.view',
    targetType: 'order',
    targetId: o.orderNo,
    req,
  }).catch((e) => console.error('[partner] order.view 审计写入失败', e))

  return detail
}
