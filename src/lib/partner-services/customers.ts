/**
 * 渠道后台：本站用户（WP7，设计 5.5、6.2「用户（买家）」、6.4.1、6.4.3、12.1）。
 *
 * 【行范围】「本站用户」= TenantCustomer(tenantId = 本渠道)。只有「在该渠道注册、或在该渠道下过单」的人才有这一行（WP0 ensureTenantCustomer），
 * 只登录不下单的主站老用户没有行（T26）。所有查询 where 顶层先放 tenantId，再放搜索条件：用主站独有邮箱、他站客户邮箱、
 * 不存在的邮箱去搜，结果完全相同（total=0，T14）。
 *
 * 【汇总口径只算本渠道】（设计 5.5）订单数 / 实付 = Order where { tenantId, userId }；退款数 = 其中 refundedGoodsCents > 0 或
 * refundedTaxCents > 0 的单数；开票数 = Invoice where { tenantId, shopOrderId IN (本渠道该用户的订单) }。**绝不按全局 Invoice.userId 计**，
 * 否则用户在主站开过的票会被带给渠道（W7-2）。实付 = 已付款（含之后退款的）订单的「货款 + 开票税费」，即买家当初付出的钱；
 * 退了多少看退款数与订单详情，这里不做净额（净额口径属于结算中心）。
 *
 * 【字段】只用 selects.ts 的 PARTNER_CUSTOMER_SELECT：不含 joinedVia（ORDER 即暗示他站已有账号）、platformNote、blockedBy、
 * 平台拉黑原因（blockedByKind='PLATFORM' 时 blockReason 不输出）、User.createdAt / registeredTenantId / balance / vipLevel / phone。
 *
 * 【写】只写 note、tags（partnerUpdateCustomer）与 blockedAt/By/Kind/Reason（拉黑 / 解除）。平台设的拉黑渠道不能解除（404，与不存在同一响应）；
 * 拉黑对象只能是本站用户列表里的 customerNo，不能输入任意邮箱预先拉黑（否则成了探测「这个邮箱是不是贝果客户」的通道，设计 6.2）。
 * 拉黑只影响该用户在本渠道 Host 的**新下单**（WP2 下单时 isBlockedInTenant）；已购订单的取卡、留言、开票、售后照常。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { writeAudit } from '../audit'
import { LIMITS, TENANT_DEFAULTS, type PartnerCustomerDetail, type PartnerCustomerRow } from '../tenant/types'
import { newPublicNo, parsePublicNo } from '../tenant/public-no'
import { assertTenantId } from './_scope'
import { PARTNER_CUSTOMER_SELECT, PARTNER_INTERNAL_CUSTOMER_KEY_SELECT, PARTNER_INTERNAL_ORDER_KEY_SELECT } from './selects'
import { centsOf, cnDateTimeText, cnDayStart, iso, notFoundError, PartnerServiceError, partnerListOrders } from './orders'
import { partnerRequestBan } from './after-sales'

// ============================================================================
// 常量
// ============================================================================

/** 本站拉黑原因（必选，设计 6.2）：存 `CODE` 或 `CODE：补充说明` */
export const BLOCK_REASONS = ['FRAUD', 'ABUSE', 'CHARGEBACK', 'OTHER'] as const
export type BlockReason = (typeof BLOCK_REASONS)[number]
export const NOTE_MAX = 500
export const TAGS_MAX = 10
export const TAG_LEN_MAX = 12
export const BLOCK_NOTE_MAX = 100
/** 客户详情里带出的本站订单条数（更多的去订单页按邮箱筛选） */
export const DETAIL_ORDERS_MAX = 50
/** 单个搜索条件最长 128 字符（设计 6.4.3） */
const MAX_COND_LEN = 128

/** 时间范围按哪一列（设计 6.4.3「首单 / 最近下单时间范围」；joined = 首次到店） */
export const CUSTOMER_DATE_BY = ['last', 'first', 'joined'] as const
export const CUSTOMER_SORTS = ['recent', 'joined'] as const

export interface CustomerFilter {
  /** 邮箱（含 @ 时：精确或前缀，≥ 3 字符）或昵称（包含） */
  q?: string
  tag?: string
  blocked?: 'yes' | 'no'
  from?: Date
  to?: Date
  dateBy?: (typeof CUSTOMER_DATE_BY)[number]
  sort?: (typeof CUSTOMER_SORTS)[number]
  page?: number
  pageSize?: number
}

// 列表 / 详情用的行：白名单字段 + 内部键（id、userId 只在服务端用来汇总，不进 DTO）
const CUSTOMER_WITH_KEY = { ...PARTNER_CUSTOMER_SELECT, ...PARTNER_INTERNAL_CUSTOMER_KEY_SELECT } as const
type CustomerRaw = Prisma.TenantCustomerGetPayload<{ select: typeof CUSTOMER_WITH_KEY }>

// ============================================================================
// 筛选 → where
// ============================================================================

function assertLen(name: string, v: string | undefined): void {
  if (v !== undefined && v.length > MAX_COND_LEN) throw new PartnerServiceError(400, `${name}过长（最多 ${MAX_COND_LEN} 个字符）`)
}

function buildCustomerWhere(tenantId: number, f: CustomerFilter): Prisma.TenantCustomerWhereInput {
  assertTenantId(tenantId)
  assertLen('搜索词', f.q)
  // tenantId 是顶层字段、AND 里的条件只能在本渠道客户里再收窄（先限定本站，再做匹配）
  const and: Prisma.TenantCustomerWhereInput[] = []
  const where: Prisma.TenantCustomerWhereInput = { tenantId, AND: and }

  const q = f.q?.trim()
  if (q) {
    if (q.includes('@')) {
      if (q.length < 3) throw new PartnerServiceError(400, '邮箱至少输入 3 个字符')
      and.push({ user: { email: { startsWith: q } } })
    } else {
      // 昵称包含；够 3 个字符时顺带按邮箱前缀匹配（买家常只记得邮箱开头）
      const or: Prisma.TenantCustomerWhereInput[] = [{ user: { nickname: { contains: q } } }]
      if (q.length >= 3) or.push({ user: { email: { startsWith: q } } })
      and.push({ OR: or })
    }
  }
  if (f.tag !== undefined && f.tag.trim() !== '') {
    const tag = f.tag.trim()
    if (tag.length > TAG_LEN_MAX) throw new PartnerServiceError(400, `标签最多 ${TAG_LEN_MAX} 个字`)
    // tags 是 JSON 字符串数组；MySQL 下 array_contains 需要带 path（'$' = 整个数组）
    and.push({ tags: { path: '$', array_contains: tag } })
  }
  if (f.blocked === 'yes') and.push({ blockedAt: { not: null } })
  if (f.blocked === 'no') and.push({ blockedAt: null })
  const col = f.dateBy === 'first' ? 'firstOrderAt' : f.dateBy === 'joined' ? 'createdAt' : 'lastOrderAt'
  if (f.from) and.push({ [col]: { gte: f.from } })
  if (f.to) and.push({ [col]: { lte: f.to } })
  return where
}

function orderByOf(sort: CustomerFilter['sort']): Prisma.TenantCustomerOrderByWithRelationInput[] {
  // MySQL 降序时 NULL 排在最后：从未下单（lastOrderAt 为空）的注册客户自然落到后面
  return sort === 'joined' ? [{ createdAt: 'desc' }, { id: 'desc' }] : [{ lastOrderAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }]
}

// ============================================================================
// 本渠道汇总（只算本渠道订单，设计 5.5）
// ============================================================================

interface Summary {
  orderCount: number
  paidCents: number
  refundCount: number
  invoiceCount: number
}

async function summariesOf(tenantId: number, userIds: number[]): Promise<Map<number, Summary>> {
  const out = new Map<number, Summary>()
  const ids = Array.from(new Set(userIds))
  ids.forEach((u) => out.set(u, { orderCount: 0, paidCents: 0, refundCount: 0, invoiceCount: 0 }))
  if (ids.length === 0) return out
  const base: Prisma.OrderWhereInput = { tenantId, userId: { in: ids } }

  const [counts, paid, refunds, orderKeys] = await Promise.all([
    prisma.order.groupBy({ by: ['userId'], where: base, _count: { _all: true } }),
    prisma.order.groupBy({ by: ['userId'], where: { ...base, payStatus: { in: ['PAID', 'REFUNDED'] } }, _sum: { amount: true, invoiceTaxFee: true } }),
    prisma.order.groupBy({
      by: ['userId'],
      where: { ...base, OR: [{ refundedGoodsCents: { gt: 0 } }, { refundedTaxCents: { gt: 0 } }] },
      _count: { _all: true },
    }),
    // 本渠道该批用户的订单内部 id（只用于数发票）；select 是 WP0 的内部键常量
    prisma.order.findMany({ where: base, select: PARTNER_INTERNAL_ORDER_KEY_SELECT }),
  ])
  counts.forEach((r) => {
    const s = out.get(r.userId)
    if (s) s.orderCount = r._count._all
  })
  paid.forEach((r) => {
    const s = out.get(r.userId)
    // Decimal 求和在库里精确完成，再经 toCents（全仓唯一的元→分口径）转成分
    if (s) s.paidCents = centsOf(r._sum.amount) + centsOf(r._sum.invoiceTaxFee)
  })
  refunds.forEach((r) => {
    const s = out.get(r.userId)
    if (s) s.refundCount = r._count._all
  })
  if (orderKeys.length) {
    const userOf = new Map(orderKeys.map((o) => [o.id, o.userId]))
    // 两个条件同时满足：发票属于本渠道（tenantId）且指回本渠道订单（shopOrderId）——设计 6.3
    const inv = await prisma.invoice.groupBy({
      by: ['shopOrderId'],
      where: { tenantId, shopOrderId: { in: orderKeys.map((o) => o.id) } },
      _count: { _all: true },
    })
    inv.forEach((r) => {
      const uid = r.shopOrderId == null ? undefined : userOf.get(r.shopOrderId)
      const s = uid === undefined ? undefined : out.get(uid)
      if (s) s.invoiceCount += r._count._all
    })
  }
  return out
}

function tagsOf(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((t): t is string => typeof t === 'string').slice(0, TAGS_MAX)
}

function toRow(c: CustomerRaw, s: Summary | undefined): PartnerCustomerRow {
  return {
    customerNo: c.publicNo,
    email: c.user.email ?? '',
    nickname: c.user.nickname ?? null,
    firstSeenAt: c.createdAt.toISOString(),
    lastOrderAt: iso(c.lastOrderAt),
    orderCount: s?.orderCount ?? 0,
    paidCents: s?.paidCents ?? 0,
    refundCount: s?.refundCount ?? 0,
    invoiceCount: s?.invoiceCount ?? 0,
    tags: tagsOf(c.tags),
    blocked: c.blockedAt != null,
    blockedByPlatform: c.blockedAt != null && c.blockedByKind === 'PLATFORM',
  }
}

// ============================================================================
// 列表 / 详情
// ============================================================================

export async function partnerListCustomers(tenantId: number, f: CustomerFilter): Promise<{ total: number; rows: PartnerCustomerRow[] }> {
  const where = buildCustomerWhere(tenantId, f)
  const page = Math.max(1, Math.floor(f.page ?? 1))
  const pageSize = Math.min(LIMITS.pageMax, Math.max(1, Math.floor(f.pageSize ?? 20)))
  const [total, raws] = await Promise.all([
    prisma.tenantCustomer.count({ where }),
    prisma.tenantCustomer.findMany({ where, select: CUSTOMER_WITH_KEY, orderBy: orderByOf(f.sort), skip: (page - 1) * pageSize, take: pageSize }),
  ])
  const sums = await summariesOf(
    tenantId,
    raws.map((r) => r.userId),
  )
  return { total, rows: raws.map((r) => toRow(r, sums.get(r.userId))) }
}

async function findCustomer(tenantId: number, customerNo: string): Promise<CustomerRaw | null> {
  assertTenantId(tenantId)
  const no = parsePublicNo(customerNo)
  if (!no) return null
  return prisma.tenantCustomer.findFirst({ where: { tenantId, publicNo: no }, select: CUSTOMER_WITH_KEY })
}

/** 客户详情：行 + 渠道备注 + 本站订单（经 WP6 partnerListOrders，仅本站）。不存在 / 他站 = null（handler 统一 404） */
export async function partnerCustomerDetail(tenantId: number, customerNo: string): Promise<PartnerCustomerDetail | null> {
  const c = await findCustomer(tenantId, customerNo)
  if (!c) return null
  const [sums, orders] = await Promise.all([
    summariesOf(tenantId, [c.userId]),
    partnerListOrders(tenantId, { customerNo: c.publicNo, page: 1, pageSize: DETAIL_ORDERS_MAX }),
  ])
  return {
    ...toRow(c, sums.get(c.userId)),
    avatar: c.user.avatar ?? null,
    note: c.note ?? null,
    // 平台设的拉黑原因永不给渠道（设计 6.4.2 第 8 条）
    blockReason: c.blockedAt != null && c.blockedByKind === 'TENANT' ? c.blockReason ?? null : null,
    orders: orders.rows,
  }
}

// ============================================================================
// 备注、标签
// ============================================================================

export interface CustomerPatch {
  note?: string | null
  tags?: string[]
}

/** 只写 note、tags（设计 6.5.3）；审计与写入同一事务 */
export async function partnerUpdateCustomer(tenantId: number, customerNo: string, userId: number, patch: CustomerPatch, req?: Request): Promise<void> {
  assertTenantId(tenantId)
  const no = parsePublicNo(customerNo)
  if (!no) throw notFoundError()
  const data: Prisma.TenantCustomerUpdateManyMutationInput = {}
  const diff: Record<string, unknown> = { customerNo: no }
  if (patch.note !== undefined) {
    const n = (patch.note ?? '').trim()
    if (n.length > NOTE_MAX) throw new PartnerServiceError(400, `备注最多 ${NOTE_MAX} 个字`)
    data.note = n || null
    diff.note = n || null
  }
  if (patch.tags !== undefined) {
    const tags = normalizeTags(patch.tags)
    data.tags = tags
    diff.tags = tags
  }
  if (Object.keys(data).length === 0) throw new PartnerServiceError(400, '没有要修改的内容')
  await prisma.$transaction(async (tx) => {
    const r = await tx.tenantCustomer.updateMany({ where: { tenantId, publicNo: no }, data })
    if (r.count !== 1) throw notFoundError()
    await writeAudit(tx, { actorKind: 'TENANT', actorUserId: userId, tenantId, action: 'customer.update', targetType: 'customer', targetId: no, diff, req })
  })
}

/** 去空白、去重、每个 ≤ 12 字、最多 10 个；不合规直接 400（不静默截断，免得渠道以为存上了） */
export function normalizeTags(raw: string[]): string[] {
  const out: string[] = []
  for (const t of raw) {
    const s = String(t ?? '').trim()
    if (!s) continue
    if (s.length > TAG_LEN_MAX) throw new PartnerServiceError(400, `每个标签最多 ${TAG_LEN_MAX} 个字`)
    if (/[\u0000-\u001f]/.test(s)) throw new PartnerServiceError(400, '标签含非法字符')
    if (!out.includes(s)) out.push(s)
  }
  if (out.length > TAGS_MAX) throw new PartnerServiceError(400, `标签最多 ${TAGS_MAX} 个`)
  return out
}

// ============================================================================
// 本站拉黑 / 解除
// ============================================================================

/**
 * 本站拉黑（必选原因）。平台已设拉黑时 409（不改平台的决定）；已被本渠道拉黑则更新原因（幂等）。
 * CAS：updateMany 条件里带「当前不是平台拉黑」，与超管同时改时后到的一方失败，不会把平台拉黑改写成渠道拉黑。
 */
export async function partnerBlockCustomer(
  tenantId: number,
  customerNo: string,
  userId: number,
  input: { reason: BlockReason; note?: string | null },
  req?: Request,
): Promise<void> {
  assertTenantId(tenantId)
  const no = parsePublicNo(customerNo)
  if (!no) throw notFoundError()
  if (!(BLOCK_REASONS as readonly string[]).includes(input.reason)) throw new PartnerServiceError(400, '请选择拉黑原因')
  const note = (input.note ?? '').trim()
  if (note.length > BLOCK_NOTE_MAX) throw new PartnerServiceError(400, `补充说明最多 ${BLOCK_NOTE_MAX} 个字`)
  const blockReason = note ? `${input.reason}：${note}` : input.reason
  await prisma.$transaction(async (tx) => {
    const c = await tx.tenantCustomer.findFirst({ where: { tenantId, publicNo: no }, select: PARTNER_INTERNAL_CUSTOMER_KEY_SELECT })
    if (!c) throw notFoundError()
    if (c.blockedByKind === 'PLATFORM') throw new PartnerServiceError(409, '该用户已被平台限制在本站下单，无需重复操作')
    const r = await tx.tenantCustomer.updateMany({
      where: { id: c.id, tenantId, OR: [{ blockedByKind: null }, { blockedByKind: 'TENANT' }] },
      data: { blockedAt: new Date(), blockedBy: userId, blockedByKind: 'TENANT', blockReason },
    })
    if (r.count !== 1) throw new PartnerServiceError(409, '状态已变化，请刷新后重试')
    await writeAudit(tx, {
      actorKind: 'TENANT',
      actorUserId: userId,
      tenantId,
      action: 'customer.block',
      targetType: 'customer',
      targetId: no,
      reasonCode: input.reason,
      diff: { customerNo: no, reason: input.reason, note: note || null },
      req,
    })
  })
}

/**
 * 解除本站拉黑。平台设的拉黑 → 404（与不存在同一响应，设计实施分包 10.4）；本来就没拉黑 → 成功（幂等，不写审计）。
 */
export async function partnerUnblockCustomer(tenantId: number, customerNo: string, userId: number, req?: Request): Promise<void> {
  assertTenantId(tenantId)
  const no = parsePublicNo(customerNo)
  if (!no) throw notFoundError()
  await prisma.$transaction(async (tx) => {
    const c = await tx.tenantCustomer.findFirst({ where: { tenantId, publicNo: no }, select: { ...PARTNER_INTERNAL_CUSTOMER_KEY_SELECT, blockedAt: PARTNER_CUSTOMER_SELECT.blockedAt } })
    if (!c || c.blockedByKind === 'PLATFORM') throw notFoundError()
    if (c.blockedAt == null && c.blockedByKind == null) return
    const r = await tx.tenantCustomer.updateMany({
      where: { id: c.id, tenantId, blockedByKind: 'TENANT' },
      data: { blockedAt: null, blockedBy: null, blockedByKind: null, blockReason: null },
    })
    if (r.count !== 1) throw new PartnerServiceError(409, '状态已变化，请刷新后重试')
    await writeAudit(tx, { actorKind: 'TENANT', actorUserId: userId, tenantId, action: 'customer.unblock', targetType: 'customer', targetId: no, diff: { customerNo: no }, req })
  })
}

/** 申请全局封禁（经 WP6 partnerRequestBan：零订单的本站客户也能申请；同一客户同时只能有一条待处理） */
export async function partnerCustomerBanRequest(tenantId: number, customerNo: string, userId: number, reason: string, req?: Request): Promise<{ requestNo: string }> {
  assertTenantId(tenantId)
  return partnerRequestBan(tenantId, customerNo, userId, reason, req)
}

// ============================================================================
// 导出（OWNER；每日 5 次；≤ 5000 行；水印）
// ============================================================================

export const CUSTOMER_EXPORT_HEADER = [
  '客户编号',
  '邮箱',
  '昵称',
  '首次到店',
  '最近下单',
  '本站订单数',
  '本站实付(元)',
  '本站退款单数',
  '本站开票数',
  '标签',
  '本站限制下单',
  '渠道备注',
]

/** 导出人水印只读当前成员本人的邮箱与昵称（取 PARTNER_CUSTOMER_SELECT.user 的子集，不另写 select） */
const SELF_SELECT = { email: PARTNER_CUSTOMER_SELECT.user.select.email, nickname: PARTNER_CUSTOMER_SELECT.user.select.nickname } as const

const cnTimeText = (s: string | null) => (s ? cnDateTimeText(new Date(s)) : '')

/**
 * 导出本站用户 CSV。限额按「东八区自然日、本渠道」数 audit_events 里当天成功的 customer.export（与 WP6 订单导出同一套
 * 「先占位、再复数」：并发请求不会突破日限额，极端并发下宁可双双拒绝）；超限写 DENIED 审计并 429。
 * 行数超过 5000 直接 400（不静默截断）。CSV 文本由 handler 用 _http.toCsv 生成（水印、公式注入防护、BOM）。
 */
export async function partnerExportCustomers(
  tenantId: number,
  userId: number,
  f: CustomerFilter,
  req?: Request,
): Promise<{ header: string[]; rows: Record<string, string | number | null>[]; watermark: string; filename: string }> {
  assertTenantId(tenantId)
  const now = new Date()
  const limit = TENANT_DEFAULTS.customerExportPerDay
  const okToday = { tenantId, action: 'customer.export', result: 'OK', at: { gte: cnDayStart(now) } }
  const denied = async (used: number) => {
    await writeAudit(null, { actorKind: 'TENANT', actorUserId: userId, tenantId, action: 'customer.export', result: 'DENIED', reasonCode: 'DAILY_LIMIT', diff: { used, limit }, req })
    return new PartnerServiceError(429, `今日导出次数已用完（每日 ${limit} 次）`)
  }
  const used = await prisma.auditEvent.count({ where: okToday })
  if (used >= limit) throw await denied(used)

  const where = buildCustomerWhere(tenantId, f)
  const total = await prisma.tenantCustomer.count({ where })
  if (total > LIMITS.exportMaxRows) throw new PartnerServiceError(400, `结果共 ${total} 行，超过单次导出上限 ${LIMITS.exportMaxRows} 行，请缩小范围`)

  // 占位：本次导出的 OK 审计行（导出编号随机，并发两次不会撞号）；写不进审计就不导出
  const exportNo = `EX${newPublicNo()}`
  const mine = { tenantId, action: 'customer.export', targetType: 'customer', targetId: exportNo }
  await writeAudit(null, {
    actorKind: 'TENANT',
    actorUserId: userId,
    tenantId,
    action: 'customer.export',
    targetType: 'customer',
    targetId: exportNo,
    result: 'OK',
    diff: { filter: { q: f.q ?? null, tag: f.tag ?? null, blocked: f.blocked ?? null, from: iso(f.from), to: iso(f.to), dateBy: f.dateBy ?? null }, rows: total },
    req,
  })
  const after = await prisma.auditEvent.count({ where: okToday })
  if (after > limit) {
    await prisma.auditEvent.updateMany({ where: { ...mine, result: 'OK' }, data: { result: 'DENIED', reasonCode: 'DAILY_LIMIT' } })
    throw new PartnerServiceError(429, `今日导出次数已用完（每日 ${limit} 次）`)
  }

  try {
    const raws = await prisma.tenantCustomer.findMany({ where, select: CUSTOMER_WITH_KEY, orderBy: orderByOf(f.sort), take: LIMITS.exportMaxRows })
    const sums = new Map<number, Summary>()
    // 汇总分批（每批 500 个用户），避免 IN 列表过长
    for (let i = 0; i < raws.length; i += 500) {
      const part = await summariesOf(
        tenantId,
        raws.slice(i, i + 500).map((r) => r.userId),
      )
      part.forEach((v, k) => sums.set(k, v))
    }
    const me = await prisma.user.findUnique({ where: { id: userId }, select: SELF_SELECT })
    const who = me?.nickname ? `${me.nickname}（${me.email ?? ''}）` : me?.email ?? '渠道成员'
    const watermark = `导出人：${who}；导出时间：${cnDateTimeText(now)}（东八区）；导出编号：${exportNo}；仅用于本站售后，禁止外传`
    const rows = raws.map((c) => {
      const r = toRow(c, sums.get(c.userId))
      return {
        客户编号: r.customerNo,
        邮箱: r.email,
        昵称: r.nickname,
        首次到店: cnTimeText(r.firstSeenAt),
        最近下单: cnTimeText(r.lastOrderAt),
        本站订单数: r.orderCount,
        '本站实付(元)': Number((r.paidCents / 100).toFixed(2)),
        本站退款单数: r.refundCount,
        本站开票数: r.invoiceCount,
        标签: r.tags.join(' / '),
        本站限制下单: r.blocked ? (r.blockedByPlatform ? '是（平台）' : '是') : '',
        渠道备注: c.note ?? '',
      }
    })
    return { header: CUSTOMER_EXPORT_HEADER, rows, watermark, filename: `customers-${cnDateTimeText(now).slice(0, 10)}.csv` }
  } catch (e) {
    // 生成失败：释放名额（占位行改 ERROR）；改不动只记日志，原错误照常抛出
    await prisma.auditEvent
      .updateMany({ where: { ...mine, result: 'OK' }, data: { result: 'ERROR', reasonCode: 'EXPORT_FAILED' } })
      .catch((err) => console.error('[partner] 客户导出失败后释放名额失败', (err as Error)?.message || err))
    throw e
  }
}
