/**
 * 渠道结算账本核心（设计第 10 章、8.3–8.6；WP3）。站长专用：渠道层（partner-services / handlers / 页面）**不得 import 本文件**，
 * 只经 partner-facade.ts（边界检查规则 3）。
 *
 * 【记账模型】只追加的单边子账：每条分录 = 某渠道、某桶、某成分、有符号金额；余额永远由分录求和得出，不存可变余额字段。
 *  · 成分方向：SALE / INVOICE_SHARE 为 +，PURCHASE / FEE / INVOICE_FEE / SHORT / LOSS 为 −（设计 10.4）；
 *  · 货款组（SALE、PURCHASE、FEE、SHORT）跟随 Order.settleState；发票组（INVOICE_SHARE、INVOICE_FEE）跟随 Order.invShareState；
 *  · LOSS（CHANNEL 承担的平台损失）**不属于任何组，一律直接记 AVAILABLE**：它是对渠道的扣减而不是这一单的收入，
 *    放进 PENDING 的话，订单被整单冲销（REVERSED）后永远不会解冻，这笔扣减就永远停在冻结中；
 *    也符合设计 10.7 的保守口径「可用 = 已解冻流入 − 全部已发生流出」。
 *
 * 【冲销 = 写差额】所有「应剩余值」由纯函数 remainingByComponent 从订单快照与累计退款值算出，冲销写「新剩余 − 旧剩余」。
 * 多次部分退款累计结果与一次全退完全相同（check-tenant-ledger 随机 1000 组验证），尾差天然由最后一次吸收。
 *
 * 【串行化】同一订单上的计提、事后开票计提、退款、解冻、补记一律先按 Order.settleVersion CAS（+1），再读、再写分录。
 * 先 CAS 再读还有一层用意：UPDATE 之后本事务读这一行拿到的是最新提交版本 + 自己的修改（RR 快照对自己改过的行不适用），
 * 而任何改这一单结算状态的人都要先拿同一把行锁，所以 CAS 之后读到的累计值不会过期。
 * 顺序固定为「先 CAS 订单行、再写分录」：tenant_ledger_entries.order_id 有外键，插分录会给订单行加 S 锁，
 * 反过来先写分录再 UPDATE 订单行会 S→X 升级、并发时死锁（WP0 schema 注释）。
 *
 * 【幂等】(eventKey, leg) 唯一；同一次调用的所有腿（可能跨多个 eventKey）用**一条** createMany 写入（同一时间戳、同进同退），
 * skipDuplicates 兜底重复调用。eventKey 来自业务事实（订单 id、订单版本号、结算单 id、外部流水号、客户端 requestId），绝不随机生成。
 *
 * 【金额】一律分（Int），比例一律 bp；只用 math.ts 的 mulBps / mulDivRound（只接受非负数，符号由调用方加）。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { toCents } from '../money'
import { writeAudit } from '../audit'
import { mulBps, mulDivRound } from './math'
import { alertPlatform } from './platform-alert'
import { findShopOrderForInvoice } from './billing-link'
import { LIMITS } from './types'
import type { Bearer, InvShareState, LedgerBucket, LedgerComponent, LedgerType, SettleState } from './types'

type Tx = Prisma.TransactionClient
type Db = Tx | typeof prisma

const PLATFORM_TENANT_ID = 1

/** Decimal / 数字 / 字符串（元）→ 分；null 视为 0 */
export function decCents(d: Prisma.Decimal | number | string | null | undefined): number {
  if (d == null) return 0
  return toCents(typeof d === 'object' ? d.toString() : d)
}

// =====================================================================================
// 成分、方向、腿名
// =====================================================================================

/** 与单笔订单相关的七个成分（MANUAL / NET 不挂订单） */
export type OrderComponent = 'SALE' | 'PURCHASE' | 'FEE' | 'SHORT' | 'LOSS' | 'INVOICE_SHARE' | 'INVOICE_FEE'
export type Remaining = Record<OrderComponent, number>

export const ORDER_COMPONENTS: readonly OrderComponent[] = ['SALE', 'PURCHASE', 'FEE', 'SHORT', 'LOSS', 'INVOICE_SHARE', 'INVOICE_FEE']
/** 分录方向：分录金额 = 方向 × 应剩余值 */
export const COMPONENT_SIGN: Readonly<Record<OrderComponent, 1 | -1>> = Object.freeze({
  SALE: 1,
  PURCHASE: -1,
  FEE: -1,
  SHORT: -1,
  LOSS: -1,
  INVOICE_SHARE: 1,
  INVOICE_FEE: -1,
})
/** 腿名（设计 10.4）：计提 / 冲销用基础名，解冻用 `x-` / `x+` */
export const COMPONENT_LEG: Readonly<Record<OrderComponent, string>> = Object.freeze({
  SALE: 'g',
  PURCHASE: 'p',
  FEE: 'f',
  SHORT: 'sh',
  LOSS: 'l',
  INVOICE_SHARE: 's',
  INVOICE_FEE: 'sf',
})
const GOODS_COMPONENTS: readonly OrderComponent[] = ['SALE', 'PURCHASE', 'FEE', 'SHORT']
const INVOICE_COMPONENTS: readonly OrderComponent[] = ['INVOICE_SHARE', 'INVOICE_FEE']

// =====================================================================================
// 纯函数
// =====================================================================================

export interface RemainingInput {
  amountCents: number
  supplyCents: number
  feeRateBp: number
  invoiceShareRateBp: number
  settleRefundedCents: number
  shortChargedCents: number
  settleLossCents: number
  inv: { baseCents: number; taxCents: number; taxActualCents: number; refundedTaxCents: number } | null
  settleReversed: boolean
  invReversed: boolean
}

/**
 * 给定订单快照与累计值，算各成分「应剩余额」（全部为非负量；符号由调用方按 COMPONENT_SIGN 加）。
 * reconcile（L5 的独立来源）、applyRefund、releaseDue、resettle、计提共用。设计 10.4：
 *   G  = A − Rg（settleReversed 时 0）
 *   P  = mulDivRound(S, A − Rg, A)                          按件退款时恰好 = 剩余件数 × 进货价
 *   SH = mulDivRound(shortChargedCents, A − Rg, A)
 *   L  = settleLossCents（累计值，冲销后也保留）
 *   I₀ = mulDivRound(mulBps(b, s), T_actual, T)              少付由站长承担时按实收税费缩减（8.6）
 *   I  = mulDivRound(I₀, T − Rt, T)；inv 为空（未计提）/ invReversed / settleReversed 时 0
 *   FEE = mulBps(G, f)；INVOICE_FEE = mulBps(G + I, f) − mulBps(G, f)（差额法，合计逐单只舍入一次）
 */
export function remainingByComponent(o: RemainingInput): Remaining {
  const A = o.amountCents
  if (!Number.isSafeInteger(A) || A <= 0) throw new Error(`[ledger] 订单金额非法：${A}`)
  const Rg = Math.min(Math.max(o.settleRefundedCents, 0), A)
  const remA = o.settleReversed ? 0 : A - Rg
  const G = remA
  const P = mulDivRound(o.supplyCents, remA, A)
  const SH = mulDivRound(Math.max(o.shortChargedCents, 0), remA, A)
  const L = Math.max(o.settleLossCents, 0)
  let I = 0
  if (o.inv && !o.invReversed && !o.settleReversed && o.inv.taxCents > 0) {
    const T = o.inv.taxCents
    const tAct = Math.min(Math.max(o.inv.taxActualCents, 0), T)
    const I0 = mulDivRound(mulBps(o.inv.baseCents, o.invoiceShareRateBp), tAct, T)
    const Rt = Math.min(Math.max(o.inv.refundedTaxCents, 0), T)
    I = mulDivRound(I0, T - Rt, T)
  }
  const total = mulBps(G + I, o.feeRateBp)
  const fee = mulBps(G, o.feeRateBp)
  return { SALE: G, PURCHASE: P, FEE: fee, SHORT: SH, LOSS: L, INVOICE_SHARE: I, INVOICE_FEE: total - fee }
}

/**
 * CHANNEL 承担退款时 lossCents 的默认值（设计 8.4）：本次冲回的进货款 × 本次退件中「已交付件」的占比。
 * **不读任何成本字段**（接码成本、卡密 cost）——LOSS 分录对渠道可见，按成本取默认值等于把成本泄露给渠道。
 * 口径：先退未交付的件（之前按件退掉的也视为先消耗未交付件）；refundQty = 0（按金额让利）时按「未退件中已交付的占比」。
 */
export function defaultLossCents(
  o: { supplyCents: number; quantity: number; refundedQty: number; deliveredQty: number },
  refundQty: number,
  reversedPurchaseCents: number,
): number {
  const rev = Math.max(0, Math.floor(reversedPurchaseCents))
  const qty = Math.max(0, Math.floor(o.quantity))
  const prior = Math.min(Math.max(0, Math.floor(o.refundedQty)), qty)
  const delivered = Math.min(Math.max(0, Math.floor(o.deliveredQty)), qty)
  if (rev === 0 || qty === 0) return 0
  if (refundQty <= 0) {
    const left = qty - prior
    if (left <= 0) return 0
    const deliveredLeft = Math.min(delivered, left)
    return mulDivRound(rev, deliveredLeft, left)
  }
  const undeliveredLeft = Math.max(0, qty - delivered - prior)
  const undeliveredPart = Math.min(refundQty, undeliveredLeft)
  const deliveredPart = Math.max(0, refundQty - undeliveredPart)
  return mulDivRound(rev, deliveredPart, refundQty)
}

/**
 * 手工标已付、实收 ≠ 应收时写进订单的少付字段（设计 8.6；WP4 标已付时在同一事务写入后调 accrueOnPaid）。
 *   x = 应收（A + T）− 实收；x ≤ 0（足额或多付）→ 全 0
 *   CHANNEL：shortCharged = min(x, A − S)（最多扣到该单货款组余额）；T_actual = T − min(x − shortCharged, T)
 *   PLATFORM：shortCharged = 0；T_actual = T − min(x, T)（少付先冲抵税费，分成只按实收税费计）
 */
export function shortFields(
  o: { amountCents: number; taxCents: number; supplyCents: number },
  receivedCents: number,
  bearer: 'CHANNEL' | 'PLATFORM',
): { shortCents: number; shortChargedCents: number; taxActualCents: number } {
  const A = o.amountCents
  const T = Math.max(0, o.taxCents)
  const x = A + T - receivedCents
  if (x <= 0) return { shortCents: 0, shortChargedCents: 0, taxActualCents: T }
  const charged = bearer === 'CHANNEL' ? Math.min(x, Math.max(0, A - o.supplyCents)) : 0
  return { shortCents: x, shortChargedCents: charged, taxActualCents: T - Math.min(x - charged, T) }
}

/** 由订单上的 shortCents / shortChargedCents 推出实收税费（两种承担方同一个式子，见 shortFields） */
export function taxActualFromShort(taxCents: number, shortCents: number | null, shortChargedCents: number | null): number {
  const x = Math.max(0, shortCents ?? 0)
  const charged = Math.max(0, shortChargedCents ?? 0)
  return taxCents - Math.min(Math.max(0, x - charged), taxCents)
}

// =====================================================================================
// 订单行与发票基数
// =====================================================================================

export const LEDGER_ORDER_SELECT = {
  id: true,
  orderNo: true,
  tenantId: true,
  userId: true,
  productId: true,
  quantity: true,
  amount: true,
  invoiceTaxFee: true,
  payStatus: true,
  deliveryStatus: true,
  paidAt: true,
  deliveredAt: true,
  listingId: true,
  supplyUnitPrice: true,
  supplyCents: true,
  feeRateBp: true,
  invoiceShareRateBp: true,
  settleHoldDays: true,
  settleState: true,
  invShareState: true,
  settleExcludeReason: true,
  settleBearer: true,
  refundedGoodsCents: true,
  settleRefundedCents: true,
  refundedTaxCents: true,
  refundedQty: true,
  settleLossCents: true,
  shortCents: true,
  shortChargedCents: true,
  settleVersion: true,
} as const satisfies Prisma.OrderSelect
export type LedgerOrder = Prisma.OrderGetPayload<{ select: typeof LEDGER_ORDER_SELECT }>

/** 快照完整且在范围内（设计 5.4 快照断言）。返回问题描述；null = 完整 */
export function snapshotProblem(o: Pick<LedgerOrder, 'listingId' | 'supplyUnitPrice' | 'supplyCents' | 'feeRateBp' | 'invoiceShareRateBp' | 'settleHoldDays' | 'amount'>): string | null {
  if (o.listingId == null) return 'listingId 为空'
  if (o.supplyUnitPrice == null) return 'supplyUnitPrice 为空'
  if (o.supplyCents == null || !Number.isSafeInteger(o.supplyCents) || o.supplyCents <= 0) return 'supplyCents 缺失或非正'
  if (o.feeRateBp == null || o.feeRateBp < 0 || o.feeRateBp > LIMITS.maxFeeBp) return 'feeRateBp 缺失或越界'
  if (o.invoiceShareRateBp == null || o.invoiceShareRateBp < 0 || o.invoiceShareRateBp > LIMITS.maxInvShareBp) return 'invoiceShareRateBp 缺失或越界'
  if (o.settleHoldDays == null || o.settleHoldDays < 0) return 'settleHoldDays 缺失'
  const A = decCents(o.amount)
  if (!(A >= o.supplyCents)) return '售价低于进货款'
  return null
}

export interface LinkedInvoice {
  id: number
  status: string
  payStatus: string
  sellingPrice: Prisma.Decimal | null
  taxFee: Prisma.Decimal | null
}

/**
 * 一批订单各自关联的发票（shopOrderId 直连 + 外部订单行 shopOrderId / 背书键 + 发票 sourceKey 快照三条线索，
 * 与 order-link 同一口径；不 import order-link，理由见 billing-link.ts 顶部）。按 id 升序。
 */
export async function linkedInvoicesByOrder(db: Db, orderIds: number[]): Promise<Map<number, LinkedInvoice[]>> {
  const out = new Map<number, LinkedInvoice[]>()
  const ids = Array.from(new Set(orderIds.filter((n) => Number.isSafeInteger(n) && n > 0)))
  if (!ids.length) return out
  const keys = ids.map((id) => `order:${id}`)
  const exts = await db.externalOrder.findMany({
    where: { OR: [{ shopOrderId: { in: ids } }, { sourceKey: { in: keys } }] },
    select: { id: true, shopOrderId: true, sourceKey: true },
  })
  const extToOrder = new Map<number, number>()
  for (const e of exts) {
    const m = /^order:(\d+)$/.exec(e.sourceKey || '')
    const oid = e.shopOrderId ?? (m ? Number(m[1]) : null)
    if (oid && ids.includes(oid)) extToOrder.set(e.id, oid)
  }
  const extIds = Array.from(extToOrder.keys())
  const invs = await db.invoice.findMany({
    where: {
      OR: [{ shopOrderId: { in: ids } }, ...(extIds.length ? [{ externalOrderId: { in: extIds } }] : []), { sourceKey: { in: keys } }],
    },
    select: { id: true, status: true, payStatus: true, sellingPrice: true, taxFee: true, shopOrderId: true, externalOrderId: true, sourceKey: true },
    orderBy: { id: 'asc' },
  })
  for (const iv of invs) {
    const m = /^order:(\d+)$/.exec(iv.sourceKey || '')
    const oid =
      (iv.shopOrderId && ids.includes(iv.shopOrderId) ? iv.shopOrderId : null) ??
      (iv.externalOrderId != null ? extToOrder.get(iv.externalOrderId) ?? null : null) ??
      (m ? Number(m[1]) : null)
    if (!oid || !ids.includes(oid)) continue
    const list = out.get(oid) || []
    list.push({ id: iv.id, status: iv.status, payStatus: iv.payStatus, sellingPrice: iv.sellingPrice, taxFee: iv.taxFee })
    out.set(oid, list)
  }
  return out
}

/**
 * 发票分成的基数（设计 9.2）：
 *  · 结账勾选开票（Order.invoiceTaxFee > 0）：b = A，T = invoiceTaxFee，T_actual 按少付缩减；
 *  · 事后开票：取**已付税费、税费 > 0 的关联发票里 id 最小的一张**为准（一单只分成一次；同单两张已付发票只认第一张，
 *    计提、冲销、解冻、对账都用同一张，结果与调用顺序无关），b = sellingPrice，T = taxFee。
 * invoiceStatus 是「该单的发票」当前状态（RELEASE_INV 要求 ISSUED；全额退款时「发票未开」冲为 0；A13）。
 */
export interface InvoiceBasis {
  path: 'CHECKOUT' | 'POSTHOC'
  baseCents: number
  taxCents: number
  taxActualCents: number
  invoiceId: number | null
  invoiceStatus: string | null
}

export function basisFrom(o: Pick<LedgerOrder, 'amount' | 'invoiceTaxFee' | 'shortCents' | 'shortChargedCents'>, invs: LinkedInvoice[]): InvoiceBasis | null {
  const paid = invs.filter((i) => i.payStatus === 'PAID').sort((a, b) => a.id - b.id)
  const checkoutT = o.invoiceTaxFee == null ? 0 : decCents(o.invoiceTaxFee)
  if (checkoutT > 0) {
    const canon = paid[0] ?? null
    return {
      path: 'CHECKOUT',
      baseCents: decCents(o.amount),
      taxCents: checkoutT,
      taxActualCents: taxActualFromShort(checkoutT, o.shortCents, o.shortChargedCents),
      invoiceId: canon?.id ?? null,
      invoiceStatus: canon?.status ?? null,
    }
  }
  const canon = paid.find((i) => i.taxFee != null && decCents(i.taxFee) > 0 && i.sellingPrice != null)
  if (!canon) return null
  const T = decCents(canon.taxFee)
  return { path: 'POSTHOC', baseCents: decCents(canon.sellingPrice), taxCents: T, taxActualCents: T, invoiceId: canon.id, invoiceStatus: canon.status }
}

/** 从订单行 + 基数 + 覆盖值组 remainingByComponent 的入参 */
export function remainingInputOf(
  o: LedgerOrder,
  basis: InvoiceBasis | null,
  ov: { Rg?: number; Rt?: number; L?: number; settleReversed?: boolean; invPresent?: boolean; invReversed?: boolean } = {},
): RemainingInput {
  const invPresent = ov.invPresent ?? o.invShareState != null
  return {
    amountCents: decCents(o.amount),
    supplyCents: o.supplyCents ?? 0,
    feeRateBp: o.feeRateBp ?? 0,
    invoiceShareRateBp: o.invoiceShareRateBp ?? 0,
    settleRefundedCents: ov.Rg ?? o.settleRefundedCents ?? 0,
    shortChargedCents: o.shortChargedCents ?? 0,
    settleLossCents: ov.L ?? o.settleLossCents ?? 0,
    inv: invPresent && basis ? { baseCents: basis.baseCents, taxCents: basis.taxCents, taxActualCents: basis.taxActualCents, refundedTaxCents: ov.Rt ?? o.refundedTaxCents ?? 0 } : null,
    settleReversed: ov.settleReversed ?? o.settleState === 'REVERSED',
    invReversed: ov.invReversed ?? o.invShareState === 'REVERSED',
  }
}

/** 订单当前应剩余值（对账、视图用）：按订单现状组入参；未计提的状态返回 null */
export function expectedRemaining(o: LedgerOrder, basis: InvoiceBasis | null): Remaining | null {
  if (o.settleState !== 'ACCRUED' && o.settleState !== 'RELEASED' && o.settleState !== 'REVERSED') return null
  return remainingByComponent(remainingInputOf(o, basis))
}

// =====================================================================================
// 分录写入
// =====================================================================================

export interface LegInput {
  leg: string
  type: LedgerType
  component: LedgerComponent
  bucket: LedgerBucket
  amountCents: number
  orderId?: number | null
  statementId?: number | null
  memo?: string | null
  publicMemo?: string | null
  operatorId?: number | null
}
export interface LedgerEvent {
  eventKey: string
  legs: LegInput[]
}

/**
 * 一次写入若干事件的全部非零腿（一条 createMany，skipDuplicates）。返回实际插入行数。
 * 金额为 0 的行不写（设计 10.4），复核时缺失按 0。
 */
export async function insertLedgerEvents(db: Db, tenantId: number, events: LedgerEvent[]): Promise<number> {
  if (!Number.isInteger(tenantId) || tenantId < 2) throw new Error(`[ledger] tenantId 非法：${tenantId}`)
  const data: Prisma.TenantLedgerEntryCreateManyInput[] = []
  for (const ev of events) {
    if (!ev.eventKey || ev.eventKey.length > 100) throw new Error(`[ledger] eventKey 非法：${ev.eventKey}`)
    for (const l of ev.legs) {
      if (!Number.isSafeInteger(l.amountCents)) throw new Error(`[ledger] 金额非法：${ev.eventKey}/${l.leg}=${l.amountCents}`)
      if (l.amountCents === 0) continue
      if (!l.leg || l.leg.length > 8) throw new Error(`[ledger] 腿名非法：${l.leg}`)
      data.push({
        tenantId,
        eventKey: ev.eventKey,
        leg: l.leg,
        type: l.type,
        component: l.component,
        bucket: l.bucket,
        amountCents: l.amountCents,
        orderId: l.orderId ?? null,
        statementId: l.statementId ?? null,
        memo: l.memo ? String(l.memo).slice(0, 255) : null,
        publicMemo: l.publicMemo ? String(l.publicMemo).slice(0, 255) : null,
        operatorId: l.operatorId ?? null,
      })
    }
  }
  if (!data.length) return 0
  const r = await db.tenantLedgerEntry.createMany({ data, skipDuplicates: true })
  return r.count
}

/** 订单计提：sale / short / inv 三组（全部 PENDING），金额 = 方向 × 当前应剩余值 */
function accrualEvents(orderId: number, rem: Remaining, withInv: boolean): LedgerEvent[] {
  const leg = (c: OrderComponent, type: LedgerType): LegInput => ({
    leg: COMPONENT_LEG[c],
    type,
    component: c,
    bucket: c === 'LOSS' ? 'AVAILABLE' : 'PENDING',
    amountCents: COMPONENT_SIGN[c] * rem[c],
    orderId,
  })
  const evs: LedgerEvent[] = [{ eventKey: `sale:${orderId}`, legs: [leg('SALE', 'ACCRUE'), leg('PURCHASE', 'ACCRUE'), leg('FEE', 'ACCRUE'), leg('LOSS', 'ACCRUE')] }]
  if (rem.SHORT) evs.push({ eventKey: `short:${orderId}`, legs: [leg('SHORT', 'SHORTPAY')] })
  if (withInv) evs.push({ eventKey: `inv:${orderId}`, legs: [leg('INVOICE_SHARE', 'ACCRUE_INV'), leg('INVOICE_FEE', 'ACCRUE_INV')] })
  return evs
}

/** 解冻腿：每个成分一对（PENDING −x / AVAILABLE +x） */
function releaseLegs(orderId: number, type: 'RELEASE' | 'RELEASE_INV', sums: Partial<Record<OrderComponent, number>>): LegInput[] {
  const legs: LegInput[] = []
  for (const [c, x] of Object.entries(sums) as [OrderComponent, number][]) {
    if (!x) continue
    legs.push({ leg: `${COMPONENT_LEG[c]}-`, type, component: c, bucket: 'PENDING', amountCents: -x, orderId })
    legs.push({ leg: `${COMPONENT_LEG[c]}+`, type, component: c, bucket: 'AVAILABLE', amountCents: x, orderId })
  }
  return legs
}

async function pendingSums(db: Db, orderId: number, comps: readonly OrderComponent[]): Promise<Partial<Record<OrderComponent, number>>> {
  const rows = await db.tenantLedgerEntry.groupBy({
    by: ['component'],
    where: { orderId, bucket: 'PENDING', component: { in: comps as OrderComponent[] } },
    _sum: { amountCents: true },
  })
  const out: Partial<Record<OrderComponent, number>> = {}
  for (const r of rows) out[r.component as OrderComponent] = r._sum.amountCents ?? 0
  return out
}

// =====================================================================================
// 测试注入（仅 scripts/itest-tenant；生产永远为空集合）
// =====================================================================================

export type LedgerFaultPoint = 'accrue.afterCas' | 'accrue.sql' | 'accrueInv.afterCas' | 'release.afterCas'
const faults = new Set<LedgerFaultPoint>()
/** 仅供 itest：在指定位置注入故障（accrue.sql = 在事务里执行一条必然失败的 SQL，验证「单条语句失败不中止事务」） */
export function setLedgerFaultForTest(p: LedgerFaultPoint, on: boolean): void {
  if (on) faults.add(p)
  else faults.delete(p)
}
/** 仅供 itest：accrueOnPaid 在 CAS 之后调用的钩子（W3-3b 用它在付款事务里制造真实死锁）。生产永远为 null */
let accrueHook: ((tx: Tx) => Promise<void>) | null = null
export function setAccrueHookForTest(fn: ((tx: Tx) => Promise<void>) | null): void {
  accrueHook = fn
}
async function maybeFault(db: Db, p: LedgerFaultPoint): Promise<void> {
  if (!faults.has(p)) return
  if (p === 'accrue.sql') await db.$executeRawUnsafe('SELECT * FROM __itest_tenant_no_such_table__')
  throw new Error(`[itest] 注入故障 ${p}`)
}

// =====================================================================================
// 事务级致命错误
// =====================================================================================

/**
 * 会让 MySQL 回滚**整个**事务（而不只是那一条语句）的错误：
 *  · 死锁 1213（Prisma 模型查询报 P2034，原生查询报 P2010 + meta.code '1213'）——InnoDB 选中牺牲者后整个事务回滚；
 *  · 锁等待超时 1205——innodb_rollback_on_timeout=ON 时同样整个回滚；不假设服务器配置，一律按致命处理；
 *  · P2028（Prisma 交互式事务已失效，如超时被引擎回滚）。
 * 这类错误发生后事务已经不存在了：同一连接上的后续语句会以 autocommit **逐条单独提交**，回调照常 return 之后的 COMMIT 也不报错。
 * 所以在付款赢家事务里「吞掉继续跑」极其危险——翻 PAID、Payment、销量都已回滚，调用方却当作赢家去发卡、发邮件，
 * 兜底的写 MISSING 还会以 autocommit 落到一张待支付订单上。遇到它们必须 rethrow，让付款事务整体失败：
 * vmq 到账路径由 reconcilePaidVmq 在宽限期后补做 fulfillOrder，后台标已付由管理员重试。
 * 「单条语句失败不中止事务」只对普通语句级错误成立（itest W3-3 实测），对这里列的错误不成立（itest W3-3b 实测死锁）。
 */
export function isTxAbortingError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false
  const err = e as { code?: unknown; meta?: { code?: unknown } | null; message?: unknown }
  const code = typeof err.code === 'string' ? err.code : ''
  if (code === 'P2034' || code === 'P2028') return true
  const metaCode = String(err.meta?.code ?? '')
  if (metaCode === '1213' || metaCode === '1205') return true
  const msg = typeof err.message === 'string' ? err.message : ''
  return /Code: `?(1213|1205)`?|Deadlock found when trying to get lock|Lock wait timeout exceeded/i.test(msg)
}

// =====================================================================================
// 计提
// =====================================================================================

/**
 * 付款 CAS 赢家事务内调用（vmq 到账 fulfillOrder、后台标已付 wonPaid）。**永不抛**（设计 8.3）：
 * 计提在付款事务里，而 VmqOrder 0→1 已独立提交，同一笔钱不会再履约一次——计提一旦抛错导致付款事务回滚，
 * 就是「钱到了、订单永远待支付」。所以：
 *  · 平台单第一行返回（主站零改动）；已有 settleState（重入）直接返回；
 *  · 快照不完整 → MISSING + 平台告警；settleExcludeReason 非空 → EXCLUDED；否则 ACCRUED（同时 settleVersion+1）；
 *  · 结账勾选开票（invoiceTaxFee > 0）同时计提发票分成；订单上已写 shortCents / shortChargedCents（WP4 标已付时同一事务先写）
 *    则同时写 short:{oid}，并按 8.6 缩减 I₀；
 *  · 整个函数体 try/catch，普通异常 → 尽力置 MISSING、告警，**不 rethrow**；
 *  · **唯一例外：事务级致命错误（死锁、锁等待超时、事务已失效，见 isTxAbortingError）照原样 rethrow**——此时付款事务
 *    本身已被数据库回滚，继续跑等于把「没付成」当成「付成了」，后果见 isTxAbortingError 的注释。
 * 前提「MySQL 交互式事务里单条语句失败不中止事务」只对普通语句级错误成立：itest wp3 W3-3（accrue.sql 注入）实测；
 * 死锁会回滚整个事务，W3-3b 用真实死锁实测。兜底写 MISSING 另带 payStatus 条件，防御万一漏判时写到待支付订单上。
 */
export async function accrueOnPaid(tx: Tx, orderId: number): Promise<void> {
  let o: LedgerOrder | null = null
  let casDone = false
  try {
    o = await tx.order.findUnique({ where: { id: orderId }, select: LEDGER_ORDER_SELECT })
    if (!o || o.tenantId === PLATFORM_TENANT_ID) return
    if (o.settleState != null) return
    // 未付款不计提（L12）；REFUNDED 也接受：标已付与退款同一事务的极端顺序下不漏记
    if (o.payStatus !== 'PAID' && o.payStatus !== 'REFUNDED') return
    const v = o.settleVersion
    const problem = snapshotProblem(o)
    if (problem) {
      await tx.order.updateMany({ where: { id: o.id, settleState: null, settleVersion: v }, data: { settleState: 'MISSING', settleVersion: v + 1 } })
      void alertPlatform(`渠道单 ${o.orderNo} 下单快照不完整（${problem}），计提置为 MISSING；请核对后「按快照补记」或调账`)
      return
    }
    if (o.settleExcludeReason) {
      await tx.order.updateMany({ where: { id: o.id, settleState: null, settleVersion: v }, data: { settleState: 'EXCLUDED', settleVersion: v + 1 } })
      return
    }
    const checkoutT = o.invoiceTaxFee == null ? 0 : decCents(o.invoiceTaxFee)
    const basis: InvoiceBasis | null =
      checkoutT > 0
        ? {
            path: 'CHECKOUT',
            baseCents: decCents(o.amount),
            taxCents: checkoutT,
            taxActualCents: taxActualFromShort(checkoutT, o.shortCents, o.shortChargedCents),
            invoiceId: null,
            invoiceStatus: null,
          }
        : null
    const rem = remainingByComponent(remainingInputOf(o, basis, { settleReversed: false, invPresent: basis != null, invReversed: false }))
    const r = await tx.order.updateMany({
      where: { id: o.id, settleState: null, settleVersion: v },
      data: { settleState: 'ACCRUED', settleVersion: v + 1, ...(basis ? { invShareState: 'ACCRUED' } : {}) },
    })
    if (r.count !== 1) return
    casDone = true
    await maybeFault(tx, 'accrue.afterCas')
    await maybeFault(tx, 'accrue.sql')
    if (accrueHook) await accrueHook(tx)
    await insertLedgerEvents(tx, o.tenantId, accrualEvents(o.id, rem, basis != null))
  } catch (e) {
    if (isTxAbortingError(e)) {
      console.error('[ledger] 计提遇到事务级致命错误（死锁 / 锁超时），付款事务整体失败、交给补履约', orderId, e)
      throw e
    }
    console.error('[ledger] 计提失败（订单付款不受影响，已置 MISSING）', orderId, e)
    // 兜底写 MISSING 带 payStatus 条件：即使漏判了某种致命错误（事务已没了、这句以 autocommit 执行），也不会写到待支付订单上
    const paid: Prisma.EnumPayStatusFilter<'Order'> = { in: ['PAID', 'REFUNDED'] }
    try {
      if (o && o.tenantId !== PLATFORM_TENANT_ID) {
        if (casDone) {
          await tx.order.updateMany({
            where: { id: o.id, settleVersion: o.settleVersion + 1, payStatus: paid },
            data: { settleState: 'MISSING', invShareState: null, settleVersion: o.settleVersion + 2 },
          })
        } else {
          await tx.order.updateMany({ where: { id: o.id, settleState: null, payStatus: paid }, data: { settleState: 'MISSING', settleVersion: { increment: 1 } } })
        }
      }
    } catch (e2) {
      if (isTxAbortingError(e2)) throw e2
      console.error('[ledger] 置 MISSING 也失败了', orderId, e2)
    }
    void alertPlatform(`渠道单 ${o?.orderNo ?? `#${orderId}`} 计提异常：${errText(e)}；已置 MISSING，请「按快照补记」`)
  }
}

type InvAccrueOutcome = 'OK' | 'DUPLICATE' | 'CONFLICT' | 'SKIP_STATE' | 'SKIP_REFUNDED' | 'SKIP_NOINV' | 'SKIP_PLATFORM'

async function accrueInvoiceShareForOrder(orderId: number, opt: { alert: boolean }): Promise<'OK' | 'SKIPPED' | 'DUPLICATE'> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await prisma.$transaction(async (tx): Promise<InvAccrueOutcome> => {
      const o = await tx.order.findUnique({ where: { id: orderId }, select: LEDGER_ORDER_SELECT })
      if (!o || o.tenantId === PLATFORM_TENANT_ID) return 'SKIP_PLATFORM'
      if (o.invShareState != null) return 'DUPLICATE'
      if (o.settleState !== 'ACCRUED' && o.settleState !== 'RELEASED') return 'SKIP_STATE'
      if ((o.refundedGoodsCents ?? 0) >= decCents(o.amount)) return 'SKIP_REFUNDED'
      const invs = (await linkedInvoicesByOrder(tx, [o.id])).get(o.id) ?? []
      const basis = basisFrom(o, invs)
      if (!basis) return 'SKIP_NOINV'
      if ((await tx.tenantLedgerEntry.count({ where: { eventKey: `inv:${o.id}` } })) > 0) return 'DUPLICATE'
      const r = await tx.order.updateMany({
        where: { id: o.id, settleVersion: o.settleVersion, invShareState: null, settleState: { in: ['ACCRUED', 'RELEASED'] } },
        data: { invShareState: 'ACCRUED', settleVersion: o.settleVersion + 1 },
      })
      if (r.count !== 1) return 'CONFLICT'
      await maybeFault(tx, 'accrueInv.afterCas')
      // INVOICE_FEE 用当前剩余 G（设计 10.5）；settleState=RELEASED 时也写 PENDING，由 RELEASE_INV 按条件解冻
      const rem = remainingByComponent(remainingInputOf(o, basis, { invPresent: true, invReversed: false }))
      await insertLedgerEvents(tx, o.tenantId, [
        {
          eventKey: `inv:${o.id}`,
          legs: [
            { leg: 's', type: 'ACCRUE_INV', component: 'INVOICE_SHARE', bucket: 'PENDING', amountCents: rem.INVOICE_SHARE, orderId: o.id },
            { leg: 'sf', type: 'ACCRUE_INV', component: 'INVOICE_FEE', bucket: 'PENDING', amountCents: -rem.INVOICE_FEE, orderId: o.id },
          ],
        },
      ])
      return 'OK'
    })
    if (res === 'CONFLICT') continue
    if (res === 'OK') return 'OK'
    if (res === 'DUPLICATE') return 'DUPLICATE'
    if (opt.alert && (res === 'SKIP_STATE' || res === 'SKIP_REFUNDED')) {
      void alertPlatform(`渠道订单 #${orderId} 事后开票税费已到账，但发票分成未计提（${res === 'SKIP_STATE' ? '订单未计提或已冲销' : '货款已全额退回'}），请核对`)
    }
    return 'SKIPPED'
  }
  return 'SKIPPED'
}

/**
 * 税费单独到账后调用（fulfillInvoice flip 成功后、补偿扫描、补记）。经 findShopOrderForInvoice 找订单；自己开事务；
 * 按 settleVersion CAS；**永不抛**；eventKey inv:{oid} 保证一单只分成一次。
 * 前置：settleState ∈ {ACCRUED, RELEASED} 且货款未全额退回，否则跳过并告警（漏掉的由解冻 cron 的补偿扫描补上）。
 */
export async function accrueInvoiceShare(invoiceId: number): Promise<'OK' | 'SKIPPED' | 'DUPLICATE'> {
  try {
    const link = await findShopOrderForInvoice(invoiceId)
    if (!link || link.tenantId === PLATFORM_TENANT_ID) return 'SKIPPED'
    return await accrueInvoiceShareForOrder(link.orderId, { alert: true })
  } catch (e) {
    console.error('[ledger] 事后开票分成计提失败（交给补偿扫描）', invoiceId, e)
    void alertPlatform(`发票 #${invoiceId} 的发票分成计提失败：${errText(e)}；下一轮解冻任务的补偿扫描会重试`)
    return 'SKIPPED'
  }
}

// =====================================================================================
// 解冻（cron）
// =====================================================================================

class Rollback extends Error {}

/** 告警里的异常摘要：Prisma 的错误信息以换行开头、夹着调用栈，压成一行取尾部的数据库原因 */
function errText(e: unknown): string {
  const msg = String((e as Error)?.message ?? e ?? '').replace(/\s+/g, ' ').trim()
  return (msg.length > 200 ? '…' + msg.slice(-200) : msg) || '未知错误'
}

/**
 * cron（每小时）：先跑补偿扫描（设计 10.5），再解冻货款组与发票分成组。每单一个小事务：
 * **第一句就是按 settleVersion 的 CAS**（条件里带解冻判定），CAS 之后在同一事务里求 PENDING 余额 x；CAS 失败跳过（下轮再来）。
 */
export async function releaseDue(
  now: Date = new Date(),
  opt: { tenantId?: number } = {},
): Promise<{ compensated: number; released: number; releasedInv: number; skipped: number }> {
  // 可选只处理一个渠道（超管「立即解冻该渠道」、itest 隔离用）；cron 不传 = 全部渠道
  if (opt.tenantId !== undefined && (!Number.isInteger(opt.tenantId) || opt.tenantId < 2)) throw new Error(`[ledger] tenantId 非法：${opt.tenantId}`)
  const scope = opt.tenantId !== undefined ? Prisma.sql`AND o.tenant_id = ${opt.tenantId}` : Prisma.empty
  let compensated = 0
  let released = 0
  let releasedInv = 0
  let skipped = 0

  /*
   * ① 补偿扫描：税费已收（结账勾选或关联发票已付）却没有发票分成的渠道单。inv:{oid} 保证幂等。
   * 「关联发票」必须与 linkedInvoicesByOrder / findShopOrderForInvoice / 对账 L11 **同一口径**的四条线索：
   * invoices.shop_order_id 直连、发票 sourceKey 快照 `order:<id>`、外部订单行 shop_order_id、外部订单行背书键 `order:<id>`。
   * 只认第一条的话，shop_order_id 为空的渠道发票（建票没经 billingTenantFields、或行被改过）首次计提一旦失败就永远补不上，
   * L11 天天报钱类失败、payoutHold 无法自动恢复。拆成四个 EXISTS 是为了每条都能走各自的索引
   * （invoices.shop_order_id / source_key / external_order_id 唯一、external_orders.shop_order_id / source_key 唯一）。
   * SQL 只负责圈候选，最终认哪张发票仍由 accrueInvoiceShareForOrder 里的 linkedInvoicesByOrder + basisFrom 决定（多圈无害：SKIP_NOINV）。
   */
  const comp = await prisma.$queryRaw<{ id: number }[]>`
    SELECT o.id FROM orders o
     WHERE o.tenant_id >= 2 ${scope} AND o.settle_state IN ('ACCRUED','RELEASED') AND o.inv_share_state IS NULL
       AND COALESCE(o.refunded_goods_cents, 0) < ROUND(o.amount * 100)
       AND (o.invoice_tax_fee > 0
            OR EXISTS (SELECT 1 FROM invoices i WHERE i.shop_order_id = o.id
                         AND i.pay_status = 'PAID' AND i.tax_fee > 0 AND i.selling_price IS NOT NULL)
            OR EXISTS (SELECT 1 FROM invoices i WHERE i.source_key = CONCAT('order:', o.id)
                         AND i.pay_status = 'PAID' AND i.tax_fee > 0 AND i.selling_price IS NOT NULL)
            OR EXISTS (SELECT 1 FROM external_orders e JOIN invoices i ON i.external_order_id = e.id
                        WHERE e.shop_order_id = o.id AND i.pay_status = 'PAID' AND i.tax_fee > 0 AND i.selling_price IS NOT NULL)
            OR EXISTS (SELECT 1 FROM external_orders e JOIN invoices i ON i.external_order_id = e.id
                        WHERE e.source_key = CONCAT('order:', o.id) AND i.pay_status = 'PAID' AND i.tax_fee > 0 AND i.selling_price IS NOT NULL))
     ORDER BY o.id LIMIT 500`
  for (const row of comp) {
    const r = await accrueInvoiceShareForOrder(Number(row.id), { alert: false }).catch((e) => {
      console.error('[ledger] 补偿扫描失败', row.id, e)
      return 'SKIPPED' as const
    })
    if (r === 'OK') compensated++
  }

  // ② 货款组解冻
  const due = await prisma.$queryRaw<{ id: number; v: number; hold: number }[]>`
    SELECT o.id, o.settle_version AS v, o.settle_hold_days AS hold FROM orders o
     WHERE o.tenant_id >= 2 ${scope} AND o.settle_state = 'ACCRUED' AND o.pay_status IN ('PAID','REFUNDED')
       AND o.delivery_status = 'DELIVERED' AND o.delivered_at IS NOT NULL AND o.settle_hold_days IS NOT NULL
       AND o.delivered_at <= DATE_SUB(${now}, INTERVAL o.settle_hold_days DAY)
       AND NOT EXISTS (SELECT 1 FROM tenant_after_sales a WHERE a.order_id = o.id AND a.status = 'PENDING' AND a.kind = 'REFUND')
     ORDER BY o.id LIMIT 1000`
  for (const row of due) {
    const id = Number(row.id)
    const v = Number(row.v)
    const cutoff = new Date(now.getTime() - Number(row.hold) * 86400_000)
    try {
      const ok = await prisma.$transaction(async (tx) => {
        const r = await tx.order.updateMany({
          where: { id, settleState: 'ACCRUED', settleVersion: v, payStatus: { in: ['PAID', 'REFUNDED'] }, deliveryStatus: 'DELIVERED', deliveredAt: { lte: cutoff } },
          data: { settleState: 'RELEASED', settleVersion: v + 1 },
        })
        if (r.count !== 1) return false
        const pendingAs = await tx.tenantAfterSale.count({ where: { orderId: id, status: 'PENDING', kind: 'REFUND' } })
        if (pendingAs > 0) throw new Rollback()
        await maybeFault(tx, 'release.afterCas')
        const o = await tx.order.findUnique({ where: { id }, select: { tenantId: true } })
        const sums = await pendingSums(tx, id, GOODS_COMPONENTS)
        await insertLedgerEvents(tx, o!.tenantId, [{ eventKey: `rel:${id}`, legs: releaseLegs(id, 'RELEASE', sums) }])
        return true
      })
      if (ok) released++
      else skipped++
    } catch (e) {
      skipped++
      if (!(e instanceof Rollback)) console.error('[ledger] 解冻失败（下轮重试）', id, e)
    }
  }

  // ③ 发票分成组解冻：货款组已解冻 + 该单的发票已开具
  const invDue = await prisma.$queryRaw<{ id: number; v: number }[]>`
    SELECT o.id, o.settle_version AS v FROM orders o
     WHERE o.tenant_id >= 2 ${scope} AND o.inv_share_state = 'ACCRUED' AND o.settle_state = 'RELEASED'
     ORDER BY o.id LIMIT 1000`
  if (invDue.length) {
    const links = await linkedInvoicesByOrder(prisma, invDue.map((r) => Number(r.id)))
    const heads = await prisma.order.findMany({ where: { id: { in: invDue.map((r) => Number(r.id)) } }, select: LEDGER_ORDER_SELECT })
    const headMap = new Map(heads.map((h) => [h.id, h]))
    for (const row of invDue) {
      const id = Number(row.id)
      const v = Number(row.v)
      const head = headMap.get(id)
      const basis = head ? basisFrom(head, links.get(id) ?? []) : null
      if (!head || basis?.invoiceStatus !== 'ISSUED') {
        skipped++
        continue
      }
      try {
        const ok = await prisma.$transaction(async (tx) => {
          const r = await tx.order.updateMany({
            where: { id, invShareState: 'ACCRUED', settleState: 'RELEASED', settleVersion: v },
            data: { invShareState: 'RELEASED', settleVersion: v + 1 },
          })
          if (r.count !== 1) return false
          // CAS 之后复核发票仍是已开具（CAS 前读的是事务外快照）
          if (basis.invoiceId != null) {
            const iv = await tx.invoice.findUnique({ where: { id: basis.invoiceId }, select: { status: true } })
            if (iv?.status !== 'ISSUED') throw new Rollback()
          }
          const sums = await pendingSums(tx, id, INVOICE_COMPONENTS)
          await insertLedgerEvents(tx, head.tenantId, [{ eventKey: `relinv:${id}`, legs: releaseLegs(id, 'RELEASE_INV', sums) }])
          return true
        })
        if (ok) releasedInv++
        else skipped++
      } catch (e) {
        skipped++
        if (!(e instanceof Rollback)) console.error('[ledger] 发票分成解冻失败（下轮重试）', id, e)
      }
    }
  }

  return { compensated, released, releasedInv, skipped }
}

// =====================================================================================
// 退款冲销
// =====================================================================================

export interface RefundInput {
  orderId: number
  refundGoodsCents: number
  refundTaxCents: number
  refundQty?: number
  bearer: Bearer
  lossCents?: number
  refundTradeNo?: string | null
  requestId: string
  operatorId: number
  expectedVersion: number
  fullStatus?: 'REFUNDED' | 'CANCELLED'
  confirmTaxKept?: boolean
}
/**
 * 失败原因（契约之外补了两个，WP4 按 400 处理即可）：
 *  · NOT_FULL：带了 fullStatus（全额退款 / 取消）但累计退货款仍 < A——否则会出现「已退款但 refundedGoodsCents < A」，对账 L13 报错；
 *  · EMPTY：本次货款、税费都为 0（无意义的退款，拒绝以免白白推进版本号）。
 */
export type RefundResult =
  | { ok: true; entries: number; settleState: SettleState | null; cashRefundCents: number }
  | { ok: false; reason: 'CONFLICT' | 'OVER_REFUND' | 'LOSS_TOO_HIGH' | 'TAX_KEPT_UNCONFIRMED' | 'NOT_PAID' | 'NOT_FULL' | 'EMPTY' }

const BEARERS: ReadonlySet<string> = new Set(['PROPORTIONAL', 'CHANNEL', 'PLATFORM'])
const isNonNegInt = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0

/**
 * 在调用方（WP4 后台订单 PUT、发票 CANNOT 联动）的事务里执行一次退款的全部账务（设计 8.4、10.6）：
 *  1. 订单 CAS：payStatus IN ('PAID','REFUNDED') AND settleVersion = expectedVersion → settleVersion+1（第一句）；
 *  2. 读最新订单，校验上限：累计 refundedGoodsCents ≤ A、refundedTaxCents ≤ T、refundedQty ≤ quantity、
 *     累计退给买家的现金（= RG + Rt − 已抵扣的少付额）≤ 实收合计；失败则把版本号改回去并返回原因（调用方无需回滚）；
 *  3. 写累计值（含 refundedQty、settleLossCents）、settleBearer、状态；全额时按 fullStatus 写 REFUNDED / CANCELLED；
 *     按件退后「剩余件都已交付」→ 同事务置 DELIVERED、deliveredAt=now（之后按新时间冻结）；
 *  4. 冲销分录 rev:{oid}:v{新版本}（各成分「新剩余 − 旧剩余」，CHANNEL 另写 LOSS），货款组在 ACCRUED 时写 PENDING、
 *     已解冻写 AVAILABLE（不论是否已进结算单、是否已打款），发票组按 invShareState 同理；
 *  5. 买家货款全额退回（RG = A）且发票未开 → 发票组冲为 0；订单被渠道分担地全部退完（G = 0）→ REVERSED（发票组、SHORT 一并归零）；
 *     RG = A 但仍有 PLATFORM 承担而保留的余额且货款组仍冻结 → 同事务立即 RELEASE（否则永不交付、永不解冻）。
 * settleState 为 NULL / MISSING / EXCLUDED（以及 REVERSED 后再退税费）时只更新累计值、不写分录。平台单只做累计值校验后返回 ok（不写任何东西）。
 * lossCents 的默认值由调用方用 defaultLossCents 给出，本函数只校验上限（≤ 本次冲回的进货款），从不读 cost。
 */
export async function applyRefund(tx: Tx, input: RefundInput): Promise<RefundResult> {
  const goods = input.refundGoodsCents
  const tax = input.refundTaxCents
  const qty = input.refundQty ?? 0
  const lossIn = input.lossCents ?? 0
  if (!isNonNegInt(goods) || !isNonNegInt(tax) || !isNonNegInt(qty) || !isNonNegInt(lossIn)) return { ok: false, reason: 'OVER_REFUND' }
  if (!BEARERS.has(input.bearer)) throw new Error(`[ledger] 承担方非法：${input.bearer}`)
  if (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 0) return { ok: false, reason: 'CONFLICT' }
  if (!input.requestId || String(input.requestId).length > 64) throw new Error('[ledger] requestId 必填（≤ 64 字符）')
  if (goods === 0 && tax === 0) return { ok: false, reason: 'EMPTY' }

  const v0 = input.expectedVersion
  const v1 = v0 + 1
  const bump = await tx.order.updateMany({
    where: { id: input.orderId, payStatus: { in: ['PAID', 'REFUNDED'] }, settleVersion: v0 },
    data: { settleVersion: v1 },
  })
  if (bump.count !== 1) {
    const cur = await tx.order.findUnique({ where: { id: input.orderId }, select: { payStatus: true } })
    return { ok: false, reason: cur && cur.payStatus === 'UNPAID' ? 'NOT_PAID' : 'CONFLICT' }
  }
  const fail = async (reason: 'OVER_REFUND' | 'LOSS_TOO_HIGH' | 'TAX_KEPT_UNCONFIRMED' | 'NOT_FULL'): Promise<RefundResult> => {
    await tx.order.updateMany({ where: { id: input.orderId, settleVersion: v1 }, data: { settleVersion: v0 } })
    return { ok: false, reason }
  }

  const o = await tx.order.findUnique({ where: { id: input.orderId }, select: LEDGER_ORDER_SELECT })
  if (!o) return { ok: false, reason: 'CONFLICT' }
  const A = decCents(o.amount)
  const invs = (await linkedInvoicesByOrder(tx, [o.id])).get(o.id) ?? []
  const basis = basisFrom(o, invs)
  const T = basis?.taxCents ?? 0

  const RG0 = o.refundedGoodsCents ?? 0
  const Rt0 = o.refundedTaxCents ?? 0
  const Q0 = o.refundedQty ?? 0
  const L0 = o.settleLossCents ?? 0
  const Rg0 = o.settleRefundedCents ?? 0
  const RG1 = RG0 + goods
  const Rt1 = Rt0 + tax
  const Q1 = Q0 + qty
  if (RG1 > A || Rt1 > T || Q1 > o.quantity) return fail('OVER_REFUND')

  /*
   * 累计退给买家的现金 = 累计货款 + 累计税费 − 已抵扣的少付额（少付额先抵扣，8.6）。
   * 设计 8.4 写的是「≤ Payment 实收合计」，但现有 Payment.amount 只记货款（vmq 到账时写 cur.amount，结账税费与事后开票税费
   * 都不进 Payment），照字面比会把「货款 + 税费」的全额退款误拒。这里用等价且口径一致的上限：
   * 实收 = A + T − x，而 RG ≤ A、Rt ≤ T 已经保证 cash(RG, Rt) ≤ A + T − x（x = shortCents，少付额只能抵扣一次）。
   */
  const x = Math.max(0, o.shortCents ?? 0)
  const cash = (rg: number, rt: number) => rg + rt - Math.min(x, rg + rt)
  const cashThis = cash(RG1, Rt1) - cash(RG0, Rt0)
  if (cash(RG1, Rt1) > Math.max(0, A + T - x)) return fail('OVER_REFUND')
  if (input.fullStatus && RG1 < A) return fail('NOT_FULL')
  // 全额退货款但税费不退：弹窗必须勾「税费不退、原因」（设计 10.6 末行）
  if (goods > 0 && RG0 < A && RG1 === A && T > 0 && Rt1 < T && input.confirmTaxKept !== true) return fail('TAX_KEPT_UNCONFIRMED')

  if (o.tenantId === PLATFORM_TENANT_ID) {
    // 平台单：WP4 对主站单忽略 refund；万一调进来，只做校验、不写任何东西
    await tx.order.updateMany({ where: { id: o.id, settleVersion: v1 }, data: { settleVersion: v0 } })
    return { ok: true, entries: 0, settleState: null, cashRefundCents: cashThis }
  }

  const bearer = input.bearer
  const Rg1 = Rg0 + (bearer === 'PLATFORM' ? 0 : goods)
  const lossThis = bearer === 'CHANNEL' ? lossIn : 0
  const L1 = L0 + lossThis
  const S0 = o.settleState as SettleState | null
  const I0 = o.invShareState as InvShareState | null
  const accruedLike = S0 === 'ACCRUED' || S0 === 'RELEASED'
  const invActive = I0 === 'ACCRUED' || I0 === 'RELEASED'
  const settleReversed1 = S0 === 'REVERSED' || (accruedLike && A - Rg1 === 0)
  const issued = basis?.invoiceStatus === 'ISSUED'
  const invReversed1 = I0 === 'REVERSED' || (invActive && (settleReversed1 || (RG1 === A && !issued)))

  // 按件退后「剩余件都已交付」→ 置 DELIVERED（设计 8.4）；只有自动发卡商品能数清已交付件
  let deliveredNow = false
  if (qty > 0 && input.fullStatus !== 'CANCELLED' && o.deliveryStatus !== 'DELIVERED' && o.deliveryStatus !== 'CANCELLED') {
    const left = o.quantity - Q1
    if (left > 0) {
      const p = await tx.product.findUnique({ where: { id: o.productId }, select: { deliveryType: true } })
      if (p?.deliveryType === 'AUTO') {
        const cards = await tx.cardKey.count({ where: { orderId: o.id, status: 'USED' } })
        deliveredNow = cards >= left
      }
    }
  }

  // 未计提的单（NULL / MISSING / EXCLUDED）也要校验 loss 上限：之后「按快照补记」会把累计 LOSS 原样写成分录
  if (!accruedLike && lossThis > 0) {
    if (snapshotProblem(o)) return fail('LOSS_TOO_HIGH')
    const pOld = remainingByComponent(remainingInputOf(o, null, { Rg: Rg0, settleReversed: false, invPresent: false })).PURCHASE
    const pNew = remainingByComponent(remainingInputOf(o, null, { Rg: Rg1, settleReversed: false, invPresent: false })).PURCHASE
    if (lossThis > pOld - pNew) return fail('LOSS_TOO_HIGH')
  }

  let entries = 0
  let newSettle: SettleState | null = S0
  let newInv: InvShareState | null = I0
  const events: LedgerEvent[] = []
  if (accruedLike) {
    const old = remainingByComponent(remainingInputOf(o, basis, { settleReversed: false }))
    const neu = remainingByComponent(remainingInputOf(o, basis, { Rg: Rg1, Rt: Rt1, L: L1, settleReversed: settleReversed1, invReversed: invReversed1 }))
    const reversedPurchase = old.PURCHASE - neu.PURCHASE
    if (lossThis > reversedPurchase) return fail('LOSS_TOO_HIGH')
    const goodsBucket: LedgerBucket = S0 === 'ACCRUED' ? 'PENDING' : 'AVAILABLE'
    const invBucket: LedgerBucket = I0 === 'ACCRUED' ? 'PENDING' : 'AVAILABLE'
    const legs: LegInput[] = []
    for (const c of ORDER_COMPONENTS) {
      const delta = COMPONENT_SIGN[c] * (neu[c] - old[c])
      if (!delta) continue
      const bucket: LedgerBucket = c === 'LOSS' ? 'AVAILABLE' : INVOICE_COMPONENTS.includes(c) ? invBucket : goodsBucket
      legs.push({ leg: COMPONENT_LEG[c], type: 'REVERSE', component: c, bucket, amountCents: delta, orderId: o.id, operatorId: input.operatorId })
    }
    events.push({ eventKey: `rev:${o.id}:v${v1}`, legs })
    newSettle = settleReversed1 ? 'REVERSED' : S0
    newInv = invReversed1 && invActive ? 'REVERSED' : I0
    // 全额退给买家、渠道仍保留（PLATFORM 承担）的部分还冻结着 → 同事务立即解冻
    if (S0 === 'ACCRUED' && !settleReversed1 && RG1 === A) {
      const sums: Partial<Record<OrderComponent, number>> = {}
      for (const c of GOODS_COMPONENTS) sums[c] = COMPONENT_SIGN[c] * neu[c]
      events.push({ eventKey: `rel:${o.id}`, legs: releaseLegs(o.id, 'RELEASE', sums) })
      newSettle = 'RELEASED'
    }
  }

  await tx.order.updateMany({
    where: { id: o.id, settleVersion: v1 },
    data: {
      refundedGoodsCents: RG1,
      settleRefundedCents: Rg1,
      refundedTaxCents: Rt1,
      refundedQty: Q1,
      settleLossCents: L1,
      settleBearer: bearer,
      settleState: newSettle,
      invShareState: newInv,
      ...(input.fullStatus === 'REFUNDED' ? { payStatus: 'REFUNDED' as const } : {}),
      ...(input.fullStatus === 'CANCELLED' ? { deliveryStatus: 'CANCELLED' as const } : deliveredNow ? { deliveryStatus: 'DELIVERED' as const, deliveredAt: new Date() } : {}),
    },
  })
  if (events.length) entries = await insertLedgerEvents(tx, o.tenantId, events)
  return { ok: true, entries, settleState: newSettle, cashRefundCents: cashThis }
}

// =====================================================================================
// 按快照补记
// =====================================================================================

/**
 * 仅超管、仅 settleState ∈ {NULL, MISSING} 的已付渠道单（设计 8.3）。只用订单快照，**永不按当前 listing 重算**；
 * 快照不完整拒绝（只能调账）。已有退款累计值也可以补：按 remainingByComponent(当前累计值) 一步写成 sale: 组
 * （与「先计提、再逐次冲销」逐分相同）；已付税费的开票分成一并补 inv: 组（费率用订单快照）；
 * 已被渠道分担地全部退完的写 REVERSED（只剩累计 LOSS 时仍写 LOSS 腿）；买家已全额退回且仍有保留余额的同时解冻。
 */
export async function resettleFromSnapshot(orderId: number, operatorId: number): Promise<{ ok: boolean; reason?: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const o0 = await tx.order.findUnique({ where: { id: orderId }, select: { settleVersion: true } })
      if (!o0) return { ok: false, reason: 'NOT_FOUND' }
      const v0 = o0.settleVersion
      const bump = await tx.order.updateMany({
        where: { id: orderId, settleVersion: v0, OR: [{ settleState: null }, { settleState: 'MISSING' }] },
        data: { settleVersion: v0 + 1 },
      })
      if (bump.count !== 1) return { ok: false, reason: 'BAD_STATE' }
      const o = (await tx.order.findUnique({ where: { id: orderId }, select: LEDGER_ORDER_SELECT }))!
      if (o.tenantId === PLATFORM_TENANT_ID) throw new ResettleReject('NOT_CHANNEL')
      if ((o.payStatus !== 'PAID' && o.payStatus !== 'REFUNDED') || !o.paidAt) throw new ResettleReject('NOT_PAID')
      const problem = snapshotProblem(o)
      if (problem) throw new ResettleReject('SNAPSHOT_INCOMPLETE')
      if ((await tx.tenantLedgerEntry.count({ where: { orderId: o.id } })) > 0) throw new ResettleReject('HAS_ENTRIES')
      if (o.settleExcludeReason) {
        await tx.order.update({ where: { id: o.id }, data: { settleState: 'EXCLUDED' } })
        await writeAudit(tx, { actorUserId: operatorId, actorKind: 'PLATFORM', tenantId: o.tenantId, action: 'order.resettle', targetType: 'order', targetId: o.orderNo, diff: { to: 'EXCLUDED' } })
        return { ok: true }
      }
      const A = decCents(o.amount)
      const Rg = o.settleRefundedCents ?? 0
      const RG = o.refundedGoodsCents ?? 0
      const reversed = A - Math.min(Rg, A) === 0
      const invs = (await linkedInvoicesByOrder(tx, [o.id])).get(o.id) ?? []
      const basis = basisFrom(o, invs)
      const invApplies = basis != null && !reversed && !(RG >= A && basis.invoiceStatus !== 'ISSUED')
      const rem = remainingByComponent(remainingInputOf(o, basis, { settleReversed: reversed, invPresent: invApplies, invReversed: false }))
      const events = accrualEvents(o.id, rem, invApplies)
      let settleState: SettleState = reversed ? 'REVERSED' : 'ACCRUED'
      if (!reversed && RG >= A) {
        const sums: Partial<Record<OrderComponent, number>> = {}
        for (const c of GOODS_COMPONENTS) sums[c] = COMPONENT_SIGN[c] * rem[c]
        events.push({ eventKey: `rel:${o.id}`, legs: releaseLegs(o.id, 'RELEASE', sums) })
        settleState = 'RELEASED'
      }
      const invShareState: InvShareState | null = invApplies ? 'ACCRUED' : basis != null && (reversed || RG >= A) ? 'REVERSED' : null
      await tx.order.update({ where: { id: o.id }, data: { settleState, invShareState } })
      for (const ev of events) for (const l of ev.legs) l.operatorId = operatorId
      await insertLedgerEvents(tx, o.tenantId, events)
      await writeAudit(tx, {
        actorUserId: operatorId,
        actorKind: 'PLATFORM',
        tenantId: o.tenantId,
        action: 'order.resettle',
        targetType: 'order',
        targetId: o.orderNo,
        diff: { from: o.settleState, to: settleState, invShareState, remaining: rem },
      })
      return { ok: true }
    })
  } catch (e) {
    if (e instanceof ResettleReject) return { ok: false, reason: e.reason }
    throw e
  }
}
class ResettleReject extends Error {
  constructor(public reason: string) {
    super(reason)
  }
}

// =====================================================================================
// 调账、回款、核销、保证金（全部 AVAILABLE / DEPOSIT 的 MANUAL 成分；审计与分录同一事务）
// =====================================================================================

async function lockChannelTenant(tx: Tx, tenantId: number): Promise<void> {
  if (!Number.isInteger(tenantId) || tenantId < 2) throw new Error(`[ledger] tenantId 非法：${tenantId}`)
  const rows = await tx.$queryRaw<{ id: number; kind: string }[]>`SELECT id, kind FROM tenants WHERE id = ${tenantId} FOR UPDATE`
  if (!rows.length || rows[0].kind !== 'CHANNEL') throw new Error(`[ledger] 渠道 ${tenantId} 不存在`)
}

function assertKey(name: string, v: string, max: number): string {
  const s = String(v ?? '').trim()
  if (!s || s.length > max) throw new Error(`[ledger] ${name} 必填且不超过 ${max} 字符`)
  return s
}
function assertPositive(n: number): void {
  if (!Number.isSafeInteger(n) || n <= 0) throw new Error(`[ledger] 金额必须是正整数（分）：${n}`)
}

async function bucketSum(tx: Tx, tenantId: number, bucket: LedgerBucket): Promise<number> {
  const r = await tx.tenantLedgerEntry.aggregate({ where: { tenantId, bucket }, _sum: { amountCents: true } })
  return r._sum.amountCents ?? 0
}

/** 超管调账：adj:{requestId}，AVAILABLE MANUAL ±x。requestId 由弹窗打开时前端生成（重复提交 = DUPLICATE） */
export async function adjust(a: { tenantId: number; amountCents: number; reasonCode: string; reason: string; publicMemo?: string; requestId: string; operatorId: number }): Promise<'OK' | 'DUPLICATE'> {
  if (!Number.isSafeInteger(a.amountCents) || a.amountCents === 0) throw new Error('[ledger] 调账金额必须是非零整数（分）')
  const requestId = assertKey('requestId', a.requestId, 64)
  return prisma.$transaction(async (tx) => {
    await lockChannelTenant(tx, a.tenantId)
    const n = await insertLedgerEvents(tx, a.tenantId, [
      {
        eventKey: `adj:${requestId}`,
        legs: [{ leg: 'a', type: 'ADJUST', component: 'MANUAL', bucket: 'AVAILABLE', amountCents: a.amountCents, memo: a.reason, publicMemo: a.publicMemo ?? null, operatorId: a.operatorId }],
      },
    ])
    if (n === 0) return 'DUPLICATE'
    await writeAudit(tx, {
      actorUserId: a.operatorId,
      actorKind: 'PLATFORM',
      tenantId: a.tenantId,
      action: 'ledger.adjust',
      targetType: 'ledger',
      reasonCode: a.reasonCode,
      reason: a.reason,
      diff: { amountCents: a.amountCents, reasonCode: a.reasonCode, reason: a.reason, publicMemo: a.publicMemo ?? null, requestId },
      publicDiff: { amountCents: a.amountCents, publicMemo: a.publicMemo ?? null },
    })
    return 'OK'
  })
}

async function simpleManual(
  a: { tenantId: number; amountCents: number; operatorId: number },
  ev: { eventKey: string; type: LedgerType; bucket: LedgerBucket; sign: 1 | -1; action: string; publicMemo: string },
  check?: (tx: Tx) => Promise<boolean>,
): Promise<'OK' | 'DUPLICATE' | 'INSUFFICIENT'> {
  assertPositive(a.amountCents)
  return prisma.$transaction(async (tx) => {
    await lockChannelTenant(tx, a.tenantId)
    if ((await tx.tenantLedgerEntry.count({ where: { eventKey: ev.eventKey } })) > 0) return 'DUPLICATE'
    if (check && !(await check(tx))) return 'INSUFFICIENT'
    const n = await insertLedgerEvents(tx, a.tenantId, [
      {
        eventKey: ev.eventKey,
        legs: [{ leg: 'a', type: ev.type, component: 'MANUAL', bucket: ev.bucket, amountCents: ev.sign * a.amountCents, publicMemo: ev.publicMemo, operatorId: a.operatorId }],
      },
    ])
    if (n === 0) return 'DUPLICATE'
    await writeAudit(tx, {
      actorUserId: a.operatorId,
      actorKind: 'PLATFORM',
      tenantId: a.tenantId,
      action: ev.action,
      targetType: 'ledger',
      diff: { amountCents: a.amountCents, eventKey: ev.eventKey },
      publicDiff: { amountCents: a.amountCents, publicMemo: ev.publicMemo },
    })
    return 'OK'
  })
}

/** 收保证金：dep-in:{外部流水号}，DEPOSIT +x（不进结算单、不计手续费） */
export async function depositIn(a: { tenantId: number; amountCents: number; externalNo: string; operatorId: number }): Promise<'OK' | 'DUPLICATE'> {
  const no = assertKey('externalNo', a.externalNo, 64)
  return simpleManual(a, { eventKey: `dep-in:${no}`, type: 'DEPOSIT_IN', bucket: 'DEPOSIT', sign: 1, action: 'deposit.in', publicMemo: '保证金转入' }) as Promise<'OK' | 'DUPLICATE'>
}

/** 保证金抵扣：dep-apply:{requestId}，DEPOSIT −x / AVAILABLE +x 一对；保证金不足 → INSUFFICIENT */
export async function depositApply(a: { tenantId: number; amountCents: number; requestId: string; operatorId: number }): Promise<'OK' | 'DUPLICATE' | 'INSUFFICIENT'> {
  assertPositive(a.amountCents)
  const requestId = assertKey('requestId', a.requestId, 64)
  const eventKey = `dep-apply:${requestId}`
  return prisma.$transaction(async (tx) => {
    await lockChannelTenant(tx, a.tenantId)
    if ((await tx.tenantLedgerEntry.count({ where: { eventKey } })) > 0) return 'DUPLICATE'
    if ((await bucketSum(tx, a.tenantId, 'DEPOSIT')) < a.amountCents) return 'INSUFFICIENT'
    const n = await insertLedgerEvents(tx, a.tenantId, [
      {
        eventKey,
        legs: [
          { leg: 'a', type: 'DEPOSIT_APPLY', component: 'MANUAL', bucket: 'DEPOSIT', amountCents: -a.amountCents, publicMemo: '保证金抵扣', operatorId: a.operatorId },
          { leg: 'b', type: 'DEPOSIT_APPLY', component: 'MANUAL', bucket: 'AVAILABLE', amountCents: a.amountCents, publicMemo: '保证金抵扣', operatorId: a.operatorId },
        ],
      },
    ])
    if (n === 0) return 'DUPLICATE'
    await writeAudit(tx, {
      actorUserId: a.operatorId,
      actorKind: 'PLATFORM',
      tenantId: a.tenantId,
      action: 'deposit.apply',
      targetType: 'ledger',
      diff: { amountCents: a.amountCents, requestId },
      publicDiff: { amountCents: a.amountCents, publicMemo: '保证金抵扣' },
    })
    return 'OK'
  })
}

/** 退保证金：dep-refund:{外部流水号}，DEPOSIT −x；保证金不足 → INSUFFICIENT */
export async function depositRefund(a: { tenantId: number; amountCents: number; externalNo: string; operatorId: number }): Promise<'OK' | 'DUPLICATE' | 'INSUFFICIENT'> {
  const no = assertKey('externalNo', a.externalNo, 64)
  return simpleManual(
    a,
    { eventKey: `dep-refund:${no}`, type: 'DEPOSIT_REFUND', bucket: 'DEPOSIT', sign: -1, action: 'deposit.refund', publicMemo: '保证金退还' },
    async (tx) => (await bucketSum(tx, a.tenantId, 'DEPOSIT')) >= a.amountCents,
  )
}

/** 渠道回款（负余额时渠道把钱打回来）：repay:{外部流水号}，AVAILABLE MANUAL +x */
export async function repay(a: { tenantId: number; amountCents: number; externalNo: string; operatorId: number }): Promise<'OK' | 'DUPLICATE'> {
  const no = assertKey('externalNo', a.externalNo, 64)
  return simpleManual(a, { eventKey: `repay:${no}`, type: 'REPAY', bucket: 'AVAILABLE', sign: 1, action: 'ledger.repay', publicMemo: '渠道回款' }) as Promise<'OK' | 'DUPLICATE'>
}

/** 可结算里还没进结算单的部分 Σ U（AVAILABLE、不含 NET、不在任何结算单行里）= 下一张结算单的 netCents（设计 10.8） */
async function availableUnsettledSum(tx: Tx, tenantId: number): Promise<number> {
  const r = await tx.$queryRaw<{ s: unknown }[]>`
    SELECT COALESCE(SUM(e.amount_cents), 0) AS s
      FROM tenant_ledger_entries e
      LEFT JOIN tenant_statement_lines l ON l.entry_id = e.id
     WHERE e.tenant_id = ${tenantId} AND e.bucket = 'AVAILABLE' AND e.component <> 'NET' AND l.id IS NULL`
  return Number(r[0]?.s ?? 0)
}

/**
 * 核销（站长承担负余额，写原因）：wo:{requestId}，AVAILABLE MANUAL +x。
 * 只能核掉**当前的负数**（设计 10.7 ④）：持渠道行锁后算 Σ U，Σ U ≥ 0 或金额超过 −Σ U 一律 INSUFFICIENT——
 * 否则输错 / 多填的金额会变成一笔正的可结算，下一张结算单直接打给渠道（终审账本 #5）。
 * 同一 requestId 重试先判 DUPLICATE（第一次核完 Σ U 已回到 0，不能让重试报「不足」）。
 */
export async function writeoff(a: { tenantId: number; amountCents: number; reason: string; requestId: string; operatorId: number }): Promise<'OK' | 'DUPLICATE' | 'INSUFFICIENT'> {
  assertPositive(a.amountCents)
  const requestId = assertKey('requestId', a.requestId, 64)
  const reason = assertKey('reason', a.reason, 255)
  const eventKey = `wo:${requestId}`
  return prisma.$transaction(async (tx) => {
    await lockChannelTenant(tx, a.tenantId)
    if (await tx.tenantLedgerEntry.findFirst({ where: { eventKey, leg: 'a' }, select: { id: true } })) return 'DUPLICATE'
    const u = await availableUnsettledSum(tx, a.tenantId)
    if (u >= 0 || a.amountCents > -u) return 'INSUFFICIENT'
    const n = await insertLedgerEvents(tx, a.tenantId, [
      { eventKey, legs: [{ leg: 'a', type: 'WRITEOFF', component: 'MANUAL', bucket: 'AVAILABLE', amountCents: a.amountCents, memo: reason, publicMemo: '负余额核销', operatorId: a.operatorId }] },
    ])
    if (n === 0) return 'DUPLICATE'
    await writeAudit(tx, {
      actorUserId: a.operatorId,
      actorKind: 'PLATFORM',
      tenantId: a.tenantId,
      action: 'writeoff',
      targetType: 'ledger',
      reason,
      diff: { amountCents: a.amountCents, reason, requestId },
      publicDiff: { amountCents: a.amountCents, publicMemo: '负余额核销' },
    })
    return 'OK'
  })
}
