/**
 * 渠道余额、订单结算视图、流水与结算单查询（设计 10.8；WP3）。**超管侧完整版本**：返回值可能带内部字段
 * （流水的 id / eventKey / memo / operatorId、结算单的加密账号），渠道层不得 import 本文件——渠道只经 partner-facade.ts，
 * facade 在这里的结果之上再按 DTO 白名单裁剪（边界检查规则 3）。
 *
 * 【全部由分录求和得出】不存可变余额。记 U = 「AVAILABLE 桶中、未进任何结算单（无 TenantStatementLine）、component ≠ NET」的分录：
 *   余额（可结算）= Σ U 中 SALE + PURCHASE + INVOICE_SHARE + LOSS + SHORT + MANUAL
 *   手续费（待扣）= −Σ U 中 FEE + INVOICE_FEE
 *   预计打款       = 余额 − 手续费 = Σ U 全部（= 下一张结算单的 netCents）
 *   冻结中三个数   = 同上三式作用于 PENDING 桶
 * 退回结算单按成分拆回的行没有 orderId、不在任何结算单里，属于 U（设计 10.4）。
 *
 * 【订单视图的符号】OrderSettlementView 里 purchaseCents、feeCents 取**正的量**（与页面公式「余额 = 货款 + 发票分成 − 进货款 ± 售后与调整；
 * 预计打款 = 余额 − 手续费」、BalanceTriple.feeCents 同口径）；otherCents 带符号（LOSS / SHORT 为负）。
 * 结算单 DTO 沿用表里存的带符号汇总（purchaseCents、feeCents 为负），与 schema 注释一致。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { BALANCE_COMPONENTS, FEE_COMPONENTS } from './types'
import type {
  BalanceComposition,
  BalanceTriple,
  InvShareState,
  LedgerBucket,
  LedgerComponent,
  LedgerRowDTO,
  LedgerType,
  OrderSettlementView,
  SettleState,
  StatementDetailDTO,
  StatementOrigin,
  StatementState,
  TenantBalances,
} from './types'

const num = (v: unknown): number => (v == null ? 0 : Number(v))

export function tripleOf(sums: Partial<Record<string, number>>): BalanceTriple {
  let balance = 0
  let feeRaw = 0
  for (const [c, v] of Object.entries(sums)) {
    if (!v) continue
    if (BALANCE_COMPONENTS.has(c as LedgerComponent)) balance += v
    else if (FEE_COMPONENTS.has(c as LedgerComponent)) feeRaw += v
  }
  const feeCents = -feeRaw
  return { balanceCents: balance, feeCents, payoutCents: balance - feeCents }
}

/** 某个桶的成分合计 → 余额构成（符号见 types.ts BalanceComposition；与 getOrderSettlementViews 的逐单口径一致） */
export function compositionOf(t: Partial<Record<string, number>>): BalanceComposition {
  return {
    goodsCents: t.SALE ?? 0,
    purchaseCents: -(t.PURCHASE ?? 0),
    invShareCents: t.INVOICE_SHARE ?? 0,
    feeCents: -((t.FEE ?? 0) + (t.INVOICE_FEE ?? 0)),
    otherCents: (t.LOSS ?? 0) + (t.SHORT ?? 0) + (t.MANUAL ?? 0),
  }
}

function assertChannelId(tenantId: number): void {
  if (!Number.isInteger(tenantId) || tenantId < 2) throw new Error(`[balances] tenantId 非法：${tenantId}`)
}

/**
 * 余额 + 余额构成：可结算（Σ U）与冻结中两个桶按成分拆开（结算中心「余额构成」）。与 computeBalances 同一条查询、同一口径，
 * 两者由同一次分组结果得出，构成之和恒等于三个数。
 */
export async function computeBalancesWithComposition(
  tenantId: number,
): Promise<{ balances: TenantBalances; composition: { available: BalanceComposition; pending: BalanceComposition } }> {
  const r = await balancesAndSums(tenantId)
  return { balances: r.balances, composition: { available: compositionOf(r.avail), pending: compositionOf(r.pend) } }
}

/** 渠道看到的全部余额数字（设计 10.8） */
export async function computeBalances(tenantId: number): Promise<TenantBalances> {
  return (await balancesAndSums(tenantId)).balances
}

async function balancesAndSums(tenantId: number): Promise<{ balances: TenantBalances; avail: Record<string, number>; pend: Record<string, number> }> {
  assertChannelId(tenantId)
  const rows = await prisma.$queryRaw<{ bucket: string; component: string; s: unknown; u: unknown }[]>`
    SELECT e.bucket, e.component, SUM(e.amount_cents) AS s,
           SUM(CASE WHEN l.id IS NULL THEN e.amount_cents ELSE 0 END) AS u
      FROM tenant_ledger_entries e
      LEFT JOIN tenant_statement_lines l ON l.entry_id = e.id
     WHERE e.tenant_id = ${tenantId}
     GROUP BY e.bucket, e.component`
  const avail: Record<string, number> = {}
  const pend: Record<string, number> = {}
  let inPayout = 0
  let deposit = 0
  for (const r of rows) {
    if (r.bucket === 'AVAILABLE' && r.component !== 'NET') avail[r.component] = (avail[r.component] ?? 0) + num(r.u)
    else if (r.bucket === 'PENDING') pend[r.component] = (pend[r.component] ?? 0) + num(r.s)
    else if (r.bucket === 'IN_PAYOUT') inPayout += num(r.s)
    else if (r.bucket === 'DEPOSIT') deposit += num(r.s)
  }
  const pay = await prisma.tenantPayout.aggregate({ where: { tenantId }, _sum: { amountCents: true, withholdCents: true } })
  const available = tripleOf(avail)
  const balances: TenantBalances = {
    available,
    pending: tripleOf(pend),
    inPayoutCents: inPayout,
    depositCents: deposit,
    paidTotalCents: pay._sum.amountCents ?? 0,
    withheldTotalCents: pay._sum.withholdCents ?? 0,
    negative: available.payoutCents < 0,
  }
  return { balances, avail, pend }
}

/**
 * 每单一行的结算视图（渠道订单明细、超管订单详情）。只返回属于该渠道的订单；按内部 id 为键。
 * bucket：钱现在在哪——PENDING（冻结中）/ AVAILABLE（可结算、未出单）/ SETTLED（已进未退回的结算单）/
 * RETURNED（所在结算单已退回，金额已按成分转回可结算）/ MIXED（多处都有）/ NONE（没有分录或全部冲销为 0）。
 */
export async function getOrderSettlementViews(tenantId: number, orderIds: number[]): Promise<Map<number, OrderSettlementView>> {
  assertChannelId(tenantId)
  const out = new Map<number, OrderSettlementView>()
  const ids = Array.from(new Set(orderIds.filter((n) => Number.isSafeInteger(n) && n > 0))).slice(0, 500)
  if (!ids.length) return out
  const orders = await prisma.order.findMany({
    where: { id: { in: ids }, tenantId },
    select: { id: true, orderNo: true, settleState: true, invShareState: true, deliveredAt: true, settleHoldDays: true },
  })
  if (!orders.length) return out
  const entries = await prisma.$queryRaw<{ oid: number; component: string; bucket: string; amt: number; sid: number | null }[]>`
    SELECT e.order_id AS oid, e.component, e.bucket, e.amount_cents AS amt, l.statement_id AS sid
      FROM tenant_ledger_entries e
      LEFT JOIN tenant_statement_lines l ON l.entry_id = e.id
     WHERE e.tenant_id = ${tenantId} AND e.order_id IN (${Prisma.join(orders.map((o) => o.id))})`
  const sids = Array.from(new Set(entries.map((e) => (e.sid == null ? null : Number(e.sid))).filter((v): v is number => v != null)))
  const stmts = sids.length
    ? await prisma.tenantStatement.findMany({ where: { id: { in: sids }, tenantId }, select: { id: true, statementNo: true, state: true } })
    : []
  const stmtMap = new Map(stmts.map((s) => [s.id, s]))

  type Acc = { total: Record<string, number>; cls: Record<string, Record<string, number>>; lastSid: number | null }
  const acc = new Map<number, Acc>()
  for (const e of entries) {
    const oid = Number(e.oid)
    const a = acc.get(oid) ?? { total: {}, cls: {}, lastSid: null }
    const amt = Number(e.amt)
    a.total[e.component] = (a.total[e.component] ?? 0) + amt
    const sid = e.sid == null ? null : Number(e.sid)
    let cls: string
    if (e.bucket === 'PENDING') cls = 'PENDING'
    else if (e.bucket === 'AVAILABLE' && sid == null) cls = 'AVAILABLE'
    else if (sid != null) cls = stmtMap.get(sid)?.state === 'RETURNED' ? 'RETURNED' : 'SETTLED'
    else cls = e.bucket
    const c = (a.cls[cls] = a.cls[cls] ?? {})
    c[e.component] = (c[e.component] ?? 0) + amt
    if (sid != null && (a.lastSid == null || sid > a.lastSid)) a.lastSid = sid
    acc.set(oid, a)
  }

  for (const o of orders) {
    const a = acc.get(o.id)
    const t = a?.total ?? {}
    const goods = t.SALE ?? 0
    const purchase = -(t.PURCHASE ?? 0)
    const invShare = t.INVOICE_SHARE ?? 0
    const fee = -((t.FEE ?? 0) + (t.INVOICE_FEE ?? 0))
    const other = (t.LOSS ?? 0) + (t.SHORT ?? 0) + (t.MANUAL ?? 0)
    const balance = goods - purchase + invShare + other
    const present = a ? Object.entries(a.cls).filter(([, sums]) => Object.values(sums).some((v) => v !== 0)).map(([k]) => k) : []
    const bucket: OrderSettlementView['bucket'] =
      present.length === 0 ? 'NONE' : present.length > 1 ? 'MIXED' : (present[0] as 'PENDING' | 'AVAILABLE' | 'SETTLED' | 'RETURNED')
    const eta =
      o.settleState === 'ACCRUED' && o.deliveredAt && o.settleHoldDays != null
        ? new Date(o.deliveredAt.getTime() + o.settleHoldDays * 86400_000).toISOString()
        : null
    out.set(o.id, {
      orderNo: o.orderNo,
      settleState: (o.settleState as SettleState | null) ?? null,
      invShareState: (o.invShareState as InvShareState | null) ?? null,
      goodsCents: goods,
      purchaseCents: purchase,
      invShareCents: invShare,
      feeCents: fee,
      otherCents: other,
      balanceCents: balance,
      payoutCents: balance - fee,
      releaseEta: eta,
      bucket,
      statementNo: a?.lastSid != null ? stmtMap.get(a.lastSid)?.statementNo ?? null : null,
    })
  }
  return out
}

export interface LedgerQuery {
  page: number
  pageSize: number
  type?: LedgerType
  component?: LedgerComponent
  from?: Date
  to?: Date
}

export function ledgerWhere(tenantId: number, q: LedgerQuery): Prisma.TenantLedgerEntryWhereInput {
  return {
    tenantId,
    ...(q.type ? { type: q.type } : {}),
    ...(q.component ? { component: q.component } : {}),
    ...(q.from || q.to ? { createdAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lt: q.to } : {}) } } : {}),
  }
}

export function pageOf(q: { page: number; pageSize: number }): { skip: number; take: number } {
  const pageSize = Math.min(Math.max(1, Math.floor(q.pageSize) || 20), 100)
  const page = Math.max(1, Math.floor(q.page) || 1)
  return { skip: (page - 1) * pageSize, take: pageSize }
}

/** 超管流水列表（含 id、eventKey、memo、operatorId）。新的在前 */
export async function listLedgerAdmin(
  tenantId: number,
  q: LedgerQuery,
): Promise<{ total: number; rows: (LedgerRowDTO & { id: number; eventKey: string; memo: string | null; operatorId: number | null })[] }> {
  assertChannelId(tenantId)
  const where = ledgerWhere(tenantId, q)
  const { skip, take } = pageOf(q)
  const [total, list] = await Promise.all([
    prisma.tenantLedgerEntry.count({ where }),
    prisma.tenantLedgerEntry.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take,
      select: {
        id: true,
        eventKey: true,
        type: true,
        component: true,
        bucket: true,
        amountCents: true,
        memo: true,
        publicMemo: true,
        operatorId: true,
        createdAt: true,
        statementId: true,
        order: { select: { orderNo: true } },
      },
    }),
  ])
  const sids = Array.from(new Set(list.map((r) => r.statementId).filter((v): v is number => v != null)))
  const stmts = sids.length ? await prisma.tenantStatement.findMany({ where: { id: { in: sids }, tenantId }, select: { id: true, statementNo: true } }) : []
  const noOf = new Map(stmts.map((s) => [s.id, s.statementNo]))
  return {
    total,
    rows: list.map((r) => ({
      id: r.id,
      eventKey: r.eventKey,
      memo: r.memo,
      operatorId: r.operatorId,
      at: r.createdAt.toISOString(),
      type: r.type as LedgerType,
      component: r.component as LedgerComponent,
      bucket: r.bucket as LedgerBucket,
      amountCents: r.amountCents,
      orderNo: r.order?.orderNo ?? null,
      statementNo: r.statementId != null ? noOf.get(r.statementId) ?? null : null,
      publicMemo: r.publicMemo,
    })),
  }
}

/** 结算单行 → DTO（超管与渠道共用映射；渠道版由 facade 去掉 payeeAccountEnc / payingBy） */
export function statementToDTO(
  s: {
    statementNo: string
    seq: number
    origin: string
    periodEnd: Date
    state: string
    goodsCents: number
    purchaseCents: number
    invShareCents: number
    feeCents: number
    otherCents: number
    grossCents: number
    netCents: number
    payeeName: string
    payeeMethod: string
    payeeAccountMasked: string
    voucherType: string | null
  },
  payout: { paidAt: Date; externalTradeNo: string; proofFile: string | null } | null,
  lines: StatementDetailDTO['lines'],
): StatementDetailDTO {
  return {
    statementNo: s.statementNo,
    seq: s.seq,
    origin: s.origin as StatementOrigin,
    periodEnd: s.periodEnd.toISOString(),
    state: s.state as StatementState,
    goodsCents: s.goodsCents,
    purchaseCents: s.purchaseCents,
    invShareCents: s.invShareCents,
    feeCents: s.feeCents,
    otherCents: s.otherCents,
    grossCents: s.grossCents,
    netCents: s.netCents,
    lines,
    payee: { name: s.payeeName, method: s.payeeMethod, accountMasked: s.payeeAccountMasked },
    voucherType: s.voucherType,
    paidAt: payout ? payout.paidAt.toISOString() : null,
    tradeNoLast4: payout ? payout.externalTradeNo.slice(-4) : null,
    proofUploaded: !!payout?.proofFile,
  }
}

/** 结算单纳入的分录（按 id 升序），带订单号 */
export async function statementLines(statementId: number): Promise<StatementDetailDTO['lines']> {
  const rows = await prisma.$queryRaw<{ at: Date; type: string; component: string; amt: number; orderNo: string | null }[]>`
    SELECT e.created_at AS at, e.type, e.component, e.amount_cents AS amt, o.order_no AS orderNo
      FROM tenant_statement_lines l
      JOIN tenant_ledger_entries e ON e.id = l.entry_id
      LEFT JOIN orders o ON o.id = e.order_id
     WHERE l.statement_id = ${statementId}
     ORDER BY e.id ASC`
  return rows.map((r) => ({
    at: new Date(r.at).toISOString(),
    type: r.type as LedgerType,
    component: r.component as LedgerComponent,
    amountCents: Number(r.amt),
    orderNo: r.orderNo ?? null,
  }))
}

/** 超管结算单详情（含加密的收款账号，用于打款时解密查看；查看明文由 WP5 写审计） */
export async function statementDetailAdmin(
  statementId: number,
): Promise<(StatementDetailDTO & { payeeAccountEnc: string | null; payingBy: number | null }) | null> {
  const s = await prisma.tenantStatement.findUnique({ where: { id: statementId } })
  if (!s) return null
  const payout = await prisma.tenantPayout.findUnique({ where: { statementId }, select: { paidAt: true, externalTradeNo: true, proofFile: true } })
  const lines = await statementLines(statementId)
  return { ...statementToDTO(s, payout, lines), payeeAccountEnc: s.payeeAccountEnc, payingBy: s.payingBy }
}
