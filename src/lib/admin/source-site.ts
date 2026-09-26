/**
 * 超管后台的「来源站」与渠道单联动的共用实现（设计 5.5、8.4、12.2；WP4 独占）。
 *
 * 分包第 13 节给 WP4 的 lib 文件只有这一个，所以超管侧几个 route 共用的小工具都放在这里，按节分开：
 *  ① 来源站：租户简表缓存（id → code）、`?tenantId=<id>|all` 解析、行上的 `source: { tenantId, code }`、卡密来源站筛选；
 *  ② 超管身份：路由内拿到当前管理员（审计要 operatorId），渠道 Host 上 404（AdminHostError），其余 403；
 *  ③ 售后申请的处理（订单退款保存事务与售后列表的 PATCH 共用，CAS + 通知 + 审计在调用方的同一事务里）；
 *  ④ 发票状态变更与账本的联动（admin/invoices/[id] 与 by-order 共用，设计 8.4 末段）。
 *
 * 【休眠与主站零依赖】tenantId = 1 的来源站是常量「main / 主站」，不查 tenants 表；只有页面上要列出全部来源站、
 * 或行里出现 tenantId ≥ 2 时才查库，查库失败一律退回「只有主站」，不影响任何主站列表（设计 4.10 ①）。
 * 渠道层（partner-*）不得 import 本文件：这里有平台拉黑原因、成本参考等只给超管的东西。
 */
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { requireAdmin } from '../auth'
import { error } from '../api'
import { writeAudit } from '../audit'
import { isAdminHostError } from '../tenant/admin-host-error'
import { emitTenantNotice } from '../tenant/notice'
import { applyRefund } from '../tenant/ledger'
import { findShopOrderForInvoice } from '../tenant/billing-link'

const PLATFORM_TENANT_ID = 1

// =====================================================================================
// ① 来源站
// =====================================================================================

export interface SourceSite {
  tenantId: number
  code: string
}
/** 筛选下拉的一项。name 是渠道内部名称（只在超管后台显示）；main 固定显示「主站」 */
export interface SiteOption extends SourceSite {
  name: string
  status: string
}

const MAIN_SITE: SiteOption = Object.freeze({ tenantId: PLATFORM_TENANT_ID, code: 'main', name: '主站', status: 'ACTIVE' }) as SiteOption

// 进程内缓存 30 秒：渠道数量个位数，后台列表每次请求都要用；新建渠道最多 30 秒后出现在下拉里
const TTL_MS = 30_000
let cache: { at: number; list: SiteOption[] } | null = null

/** 后台改了渠道（WP5 新建 / 改名）后可以调用；不调也最多 30 秒后自动刷新 */
export function invalidateSiteOptions(): void {
  cache = null
}

/**
 * 全部来源站（主站在前，其余按 id）。查库失败 → 只有主站（绝不让后台列表因为 tenants 表的问题整页报错）。
 * 主站行即使库里没有（种子未跑）也照样给出。
 */
export async function siteOptions(): Promise<SiteOption[]> {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) return cache.list
  let list: SiteOption[] = [MAIN_SITE]
  try {
    const rows = await prisma.tenant.findMany({
      where: { id: { gt: PLATFORM_TENANT_ID } },
      select: { id: true, code: true, name: true, status: true },
      orderBy: { id: 'asc' },
      take: 500,
    })
    list = [MAIN_SITE, ...rows.map((r) => ({ tenantId: r.id, code: r.code, name: r.name, status: r.status }))]
  } catch (e) {
    console.error('[admin/source-site] 读取渠道列表失败，按只有主站处理', (e as Error)?.message || e)
  }
  cache = { at: now, list }
  return list
}

/** tenantId → 来源站。只有出现 ≥ 2 的 id 才会读 siteOptions（主站列表不查 tenants 表） */
export async function sourceMap(tenantIds: Iterable<number>): Promise<Map<number, SourceSite>> {
  const out = new Map<number, SourceSite>()
  const ids = Array.from(new Set(Array.from(tenantIds).filter((n) => Number.isInteger(n))))
  const channel = ids.filter((id) => id !== PLATFORM_TENANT_ID)
  if (ids.includes(PLATFORM_TENANT_ID)) out.set(PLATFORM_TENANT_ID, { tenantId: PLATFORM_TENANT_ID, code: 'main' })
  if (!channel.length) return out
  let opts = await siteOptions()
  if (channel.some((id) => !opts.some((o) => o.tenantId === id))) {
    // 缓存里没有（刚建的渠道）：强制刷新一次
    invalidateSiteOptions()
    opts = await siteOptions()
  }
  for (const id of channel) {
    const o = opts.find((x) => x.tenantId === id)
    // 查不到（渠道行被删 / 读库失败）也给一个可辨认的占位，绝不显示成主站
    out.set(id, { tenantId: id, code: o?.code ?? `t${id}` })
  }
  return out
}

export function sourceOf(map: Map<number, SourceSite>, tenantId: number): SourceSite {
  return map.get(tenantId) ?? (tenantId === PLATFORM_TENANT_ID ? { tenantId, code: 'main' } : { tenantId, code: `t${tenantId}` })
}

/** 给一批行加上 source 字段（行里的 tenantId 由 pick 取出） */
export async function withSource<T>(rows: T[], pick: (r: T) => number): Promise<(T & { source: SourceSite })[]> {
  const m = await sourceMap(rows.map(pick))
  return rows.map((r) => ({ ...r, source: sourceOf(m, pick(r)) }))
}

/**
 * `?tenantId=<id>|all`（默认 all）。返回 null = 全部；数字 = 只看该站。
 * 传坏了（abc、0、负数）返回 'invalid'，调用方回 400——不能静默退化成「全部」，否则运营以为在看渠道数据、其实是全站。
 * extra 允许额外的枚举值（卡密的 'stock'）。
 */
export function parseTenantFilter<E extends string = never>(
  sp: URLSearchParams,
  key = 'tenantId',
  extra: readonly E[] = [],
): number | null | E | 'invalid' {
  const raw = (sp.get(key) || '').trim()
  if (!raw || raw === 'all') return null
  if ((extra as readonly string[]).includes(raw)) return raw as E
  if (!/^\d{1,9}$/.test(raw)) return 'invalid'
  const n = Number(raw)
  return n >= 1 ? n : 'invalid'
}

export const INVALID_TENANT_FILTER = '来源站参数无效'

// ------------------------------- 卡密的来源站 -------------------------------

/**
 * 卡密的来源站 = 售出订单的站（CardKey.orderId → Order.tenantId，设计 5.5）。CardKey 与 Order 没有 Prisma 关系，
 * 只能先取订单 id 再筛。渠道单数量有限（P0 单渠道），按 id 列表筛成本可控；productId 给了就先按商品收窄。
 *  · 1：主站售出 = 有 orderId 且不是任何渠道单
 *  · ≥2：该渠道订单售出的卡
 *  · 'stock'：未售（orderId 为空且不是外部站领走）
 */
export async function cardSiteWhere(filter: number | 'stock', productId?: number | null): Promise<Prisma.CardKeyWhereInput> {
  if (filter === 'stock') return { orderId: null, externalRef: null }
  const scope: Prisma.OrderWhereInput = productId ? { productId } : {}
  if (filter === PLATFORM_TENANT_ID) {
    const ch = await prisma.order.findMany({ where: { ...scope, tenantId: { gt: PLATFORM_TENANT_ID } }, select: { id: true } })
    return { orderId: { not: null, ...(ch.length ? { notIn: ch.map((o) => o.id) } : {}) } }
  }
  const own = await prisma.order.findMany({ where: { ...scope, tenantId: filter }, select: { id: true } })
  return { orderId: { in: own.map((o) => o.id) } }
}

export type CardSource = SourceSite & { kind: 'ORDER' | 'STOCK' | 'EXTERNAL'; label: string }

/** 一批卡的来源站：已售本站订单 → 订单的站；外部站领走 → 「外部:client」；未售 → 「库存」 */
export async function cardSources(cards: { orderId: number | null; externalRef: string | null }[]): Promise<(c: { orderId: number | null; externalRef: string | null }) => CardSource> {
  const oids = Array.from(new Set(cards.map((c) => c.orderId).filter((v): v is number => v != null)))
  const orders = oids.length ? await prisma.order.findMany({ where: { id: { in: oids } }, select: { id: true, tenantId: true } }) : []
  const tOf = new Map(orders.map((o) => [o.id, o.tenantId]))
  const m = await sourceMap(orders.map((o) => o.tenantId))
  return (c) => {
    if (c.orderId != null) {
      const s = sourceOf(m, tOf.get(c.orderId) ?? PLATFORM_TENANT_ID)
      return { ...s, kind: 'ORDER', label: s.tenantId === PLATFORM_TENANT_ID ? '主站' : s.code }
    }
    if (c.externalRef) {
      const client = c.externalRef.split(':')[0] || c.externalRef
      return { tenantId: PLATFORM_TENANT_ID, code: 'main', kind: 'EXTERNAL', label: `外部:${client}` }
    }
    return { tenantId: PLATFORM_TENANT_ID, code: 'main', kind: 'STOCK', label: '库存' }
  }
}

// =====================================================================================
// ② 超管身份
// =====================================================================================

export type AdminUser = Awaited<ReturnType<typeof requireAdmin>>

/**
 * 路由内拿当前管理员：`const a = await adminOrResponse(); if ('res' in a) return a.res`。
 * 与 adminGuard 同一口径（同源校验在 requireAdmin 里），多了一样：返回管理员本人（审计要 operatorId）。
 * 渠道 Host 上 requireAdmin 抛 AdminHostError → 404（与 adminGuard 一致，表现为「不存在」）；其余 → 403。
 * 不要包进业务 try：getStorefront 的 Next 内部异常不能被吞（requireAdmin 自己不在 try 里调店面解析以外的东西）。
 */
export async function adminOrResponse(): Promise<{ user: AdminUser } | { res: Response }> {
  try {
    return { user: await requireAdmin() }
  } catch (e) {
    if (isAdminHostError(e)) return { res: error('资源不存在', 404) }
    return { res: error('无管理员权限', 403) }
  }
}

// =====================================================================================
// ③ 售后申请的处理（设计 8.4；契约见分包 7.4）
// =====================================================================================

export type AfterSaleAction = 'REJECT' | 'DONE' | 'CLEAR_ESCALATION'

const ACTION_TITLE: Record<'REJECTED' | 'DONE', string> = { REJECTED: '售后申请已驳回', DONE: '售后申请已处理' }
const KIND_LABEL: Record<string, string> = { REFUND: '退款', REISSUE: '补发', ESCALATE: '升级', BAN_REQUEST: '全局封禁' }

export class AfterSaleConflict extends Error {
  constructor(message = '售后申请状态已变化，请刷新后重试') {
    super(message)
    this.name = 'AfterSaleConflict'
  }
}

/**
 * 在调用方事务里把一条 PENDING 申请结案：状态 CAS PENDING → DONE / REJECTED，activeKey 置 NULL（同类申请可以再发起），
 * 写 handledBy / handledAt / resultNote（渠道可见）与退款结果列；通知渠道（AFTER_SALE_RESULT，dedupeKey 保证一次）；
 * 审计 aftersale.handle（publicDiff 只含 requestNo、result、resultNote，设计 5.8）。CAS 失败抛 AfterSaleConflict。
 */
export async function closeAfterSale(
  tx: Prisma.TransactionClient,
  a: {
    id: number
    result: 'DONE' | 'REJECTED'
    note: string | null
    operatorId: number
    req?: Request
    /** 限定条件（订单退款时校验申请确实属于这张订单且是退款类） */
    expect?: { tenantId?: number; orderId?: number; kind?: string }
    refund?: { bearer: string; refundGoodsCents: number; refundTaxCents: number; lossCents: number | null; refundTradeNo: string | null }
  },
): Promise<{ requestNo: string; tenantId: number; kind: string }> {
  const row = await tx.tenantAfterSale.findUnique({
    where: { id: a.id },
    select: { id: true, requestNo: true, tenantId: true, orderId: true, kind: true, status: true },
  })
  if (!row) throw new AfterSaleConflict('售后申请不存在')
  if (a.expect?.tenantId != null && row.tenantId !== a.expect.tenantId) throw new AfterSaleConflict('售后申请不属于该订单')
  if (a.expect?.orderId != null && row.orderId !== a.expect.orderId) throw new AfterSaleConflict('售后申请不属于该订单')
  if (a.expect?.kind != null && row.kind !== a.expect.kind) throw new AfterSaleConflict('售后申请类型不符')
  const note = a.note?.trim() ? a.note.trim().slice(0, 500) : null
  const now = new Date()
  const c = await tx.tenantAfterSale.updateMany({
    where: { id: row.id, status: 'PENDING' },
    data: {
      status: a.result,
      activeKey: null,
      resultNote: note,
      handledBy: a.operatorId,
      handledAt: now,
      ...(a.refund
        ? {
            bearer: a.refund.bearer,
            refundGoodsCents: a.refund.refundGoodsCents,
            refundTaxCents: a.refund.refundTaxCents,
            lossCents: a.refund.lossCents,
            refundTradeNo: a.refund.refundTradeNo,
          }
        : {}),
    },
  })
  if (c.count !== 1) throw new AfterSaleConflict()
  let orderNo: string | null = null
  if (row.orderId != null) {
    const o = await tx.order.findUnique({ where: { id: row.orderId }, select: { orderNo: true } })
    orderNo = o?.orderNo ?? null
  }
  const kindLabel = KIND_LABEL[row.kind] ?? row.kind
  await emitTenantNotice(tx, {
    tenantId: row.tenantId,
    kind: 'AFTER_SALE_RESULT',
    title: `${ACTION_TITLE[a.result]}（${kindLabel}）`,
    body: [orderNo ? `订单 ${orderNo}` : null, note ? `说明：${note}` : null].filter(Boolean).join('；') || undefined,
    refType: 'after_sale',
    refKey: row.requestNo,
    dedupeKey: `as:${row.requestNo}:${a.result}`,
  })
  await writeAudit(tx, {
    actorUserId: a.operatorId,
    actorKind: 'PLATFORM',
    tenantId: row.tenantId,
    action: 'aftersale.handle',
    targetType: 'after_sale',
    targetId: row.requestNo,
    result: 'OK',
    diff: { requestNo: row.requestNo, kind: row.kind, from: 'PENDING', to: a.result, note, refund: a.refund ?? null },
    publicDiff: { requestNo: row.requestNo, result: a.result, resultNote: note },
    req: a.req,
  })
  return { requestNo: row.requestNo, tenantId: row.tenantId, kind: row.kind }
}

// =====================================================================================
// ④ 发票状态变更与账本联动（设计 8.4 末段；契约见分包 7.4）
// =====================================================================================

/** 渠道单发票改 CANNOT、或 ISSUED → SUBMITTED 撤回时必带：退税费（走 applyRefund）或保留（写审计，原因必填） */
export const taxRefundSchema = z.union([
  z.object({
    refundTaxCents: z.number().int().min(1, '退还税费须大于 0；不退请选「保留税费」'),
    expectedVersion: z.number().int().min(0),
    requestId: z.string().trim().regex(/^[A-Za-z0-9_-]{8,64}$/, 'requestId 格式不正确'),
    refundTradeNo: z.string().trim().max(64).optional().nullable(),
  }),
  z.object({ keep: z.literal(true), reason: z.string().trim().min(2, '请填写保留税费的原因').max(200) }),
])
export type TaxRefundDecision = z.infer<typeof taxRefundSchema>

export interface ChannelInvoiceLink {
  orderId: number
  tenantId: number
  orderNo: string
  settleVersion: number
}

/** 发票 → 渠道单（tenantId ≥ 2）；主站 / 站外票据返回 null（不需要联动） */
export async function channelInvoiceLink(invoiceId: number, db: Prisma.TransactionClient | typeof prisma = prisma): Promise<ChannelInvoiceLink | null> {
  const link = await findShopOrderForInvoice(invoiceId, db)
  if (!link || link.tenantId === PLATFORM_TENANT_ID) return null
  const o = await db.order.findUnique({ where: { id: link.orderId }, select: { orderNo: true, settleVersion: true } })
  if (!o) return null
  return { orderId: link.orderId, tenantId: link.tenantId, orderNo: o.orderNo, settleVersion: o.settleVersion }
}

/** 这次状态变更是否要求带 taxRefund：渠道单发票、税费已收，改 CANNOT（从非 CANNOT）或 ISSUED → SUBMITTED */
export function needsTaxDecision(iv: { status: string; payStatus: string }, to: string): boolean {
  if (iv.payStatus !== 'PAID') return false
  return (to === 'CANNOT' && iv.status !== 'CANNOT') || (iv.status === 'ISSUED' && to === 'SUBMITTED')
}

export class TaxDecisionError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
    this.name = 'TaxDecisionError'
  }
}

const REFUND_REASON_TEXT: Record<string, string> = {
  CONFLICT: '订单结算状态已变化，请刷新后重试',
  NOT_PAID: '订单未付款，不能退税费',
  OVER_REFUND: '退还税费超过已收税费（或累计退款超过实收）',
  LOSS_TOO_HIGH: '损失金额超过上限',
  TAX_KEPT_UNCONFIRMED: '请确认税费处理方式',
  NOT_FULL: '退款未达全额',
  EMPTY: '退还金额为 0',
}

/**
 * 在调用方事务里执行税费决定（发票状态的 CAS 由调用方先做）：
 *  · 退：applyRefund(tx, { refundGoodsCents: 0, refundTaxCents, … })——发票组按 Rt 冲销（设计 10.6），失败抛 TaxDecisionError；
 *  · 保留：写审计 invoice.tax_kept（原因原文仅超管可见，不写 publicDiff）。
 * 两者都写审计（渠道侧只看得到 action，没有 publicDiff）。
 */
export async function applyInvoiceTaxDecision(
  tx: Prisma.TransactionClient,
  a: { link: ChannelInvoiceLink; invoiceNo: string; from: string; to: string; decision: TaxRefundDecision; operatorId: number; req?: Request },
): Promise<{ refunded: number }> {
  const d = a.decision
  if ('keep' in d) {
    await writeAudit(tx, {
      actorUserId: a.operatorId,
      actorKind: 'PLATFORM',
      tenantId: a.link.tenantId,
      action: 'invoice.tax_kept',
      targetType: 'order',
      targetId: a.link.orderNo,
      reason: d.reason,
      diff: { invoiceNo: a.invoiceNo, from: a.from, to: a.to },
      req: a.req,
    })
    return { refunded: 0 }
  }
  const r = await applyRefund(tx, {
    orderId: a.link.orderId,
    refundGoodsCents: 0,
    refundTaxCents: d.refundTaxCents,
    bearer: 'PROPORTIONAL',
    refundTradeNo: d.refundTradeNo ?? null,
    requestId: d.requestId,
    operatorId: a.operatorId,
    expectedVersion: d.expectedVersion,
  })
  if (!r.ok) {
    const status = r.reason === 'CONFLICT' || r.reason === 'NOT_PAID' ? 409 : 400
    throw new TaxDecisionError(status, r.reason, REFUND_REASON_TEXT[r.reason] ?? r.reason)
  }
  await writeAudit(tx, {
    actorUserId: a.operatorId,
    actorKind: 'PLATFORM',
    tenantId: a.link.tenantId,
    action: 'invoice.tax_refund',
    targetType: 'order',
    targetId: a.link.orderNo,
    diff: { invoiceNo: a.invoiceNo, from: a.from, to: a.to, refundTaxCents: d.refundTaxCents, requestId: d.requestId, refundTradeNo: d.refundTradeNo ?? null, entries: r.entries },
    req: a.req,
  })
  return { refunded: d.refundTaxCents }
}

export { REFUND_REASON_TEXT }
