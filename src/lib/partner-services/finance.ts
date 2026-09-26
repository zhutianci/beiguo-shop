/**
 * 渠道后台：结算中心（WP7，设计 10.8、10.9、12.1）。
 *
 * 【只经 partner-facade】余额、流水、订单结算视图、结算单、申请结算一律调 WP3 的 src/lib/tenant/partner-facade.ts（设计 6.5.3）：
 * 本文件不 import ledger / statement / balances（边界检查规则 3），也就调不到调账、登记打款、退回这类站长专用函数，
 * 拿到的返回值已经是逐字段映射过的渠道 DTO（没有 id、eventKey、memo、operatorId、payeeAccountEnc）。
 *
 * 【三个数】余额 = 货款 + 发票分成 − 进货款 ± 售后与调整；预计打款 = 余额 − 手续费；手续费 =（货款 + 发票分成）× 费率，逐单四舍五入。
 * 全部由分录求和得出（facade.balancesForPartner），这里不做任何金额计算，只拼说明文案与「能不能申请」的提示。
 *
 * 【能不能申请】summary 里的 canApply / applyBlockReason 只是**提示**（按出单函数同一顺序预判：暂停打款 → 收款信息未设 →
 * 冷静期 → 有未完结结算单 → 间隔不足 / 今日次数用完 → 余额不为正 → 低于最低结算额）。真正的判定只在 apply 时由出单函数在锁内做，
 * 页面提示与实际结果不一致时以 apply 的返回为准（例如对账失败 RECONCILE_FAILED 只有出单时才知道）。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { writeAudit } from '../audit'
import {
  applySettlementForPartner,
  balanceCompositionForPartner,
  balancesForPartner,
  lastRequestAt,
  listLedgerForPartner,
  orderSettlementViewsForPartner,
  statementDetailForPartner,
  statementListForPartner,
} from '../tenant/partner-facade'
import {
  LEDGER_COMPONENTS,
  LEDGER_TYPES,
  LIMITS,
  TENANT_DEFAULTS,
  type BalanceComposition,
  type GenerateResult,
  type LedgerComponent,
  type LedgerRowDTO,
  type LedgerType,
  type OrderSettlementView,
  type StatementDetailDTO,
  type TenantBalances,
} from '../tenant/types'
import { assertTenantId } from './_scope'
import { PARTNER_INTERNAL_TENANT_APPLY_SELECT, PARTNER_ORDER_DETAIL_SELECT, PARTNER_ORDER_LIST_SELECT, PARTNER_TENANT_SELECT } from './selects'
import { cnDateTimeText, cnDayStart, PartnerServiceError } from './orders'

type ApplyBlockReason = Extract<GenerateResult, { ok: false }>['reason']

export interface FinanceSummary {
  balances: TenantBalances
  /** 余额构成：可结算 / 冻结中按成分拆开（货款、进货款、发票分成、手续费、售后与调整） */
  composition: { available: BalanceComposition; pending: BalanceComposition }
  rates: { feeRateBp: number; invoiceShareRateBp: number; holdDays: number; minPayoutCents: number; requestIntervalDays: number }
  formula: string
  canApply: boolean
  applyBlockReason?: ApplyBlockReason
  nextApplyAt?: string
  releaseCalendar: { date: string; payoutCents: number }[]
}

/**
 * 出单前置条件里「收款信息冷静期」要看 payeeChangedAt（它不进任何渠道 DTO）。
 * 只在这里读来算提示与 nextApplyAt，结果不输出原值；字段取自 selects.ts 的 PARTNER_INTERNAL_TENANT_APPLY_SELECT（D15）。
 */
const TENANT_APPLY_SELECT = PARTNER_INTERNAL_TENANT_APPLY_SELECT

/** 订单号 / 商品 / 数量 / 付款时间：全部取自 PARTNER_ORDER_LIST_SELECT 的子集（不另写字段） */
const FIN_ORDER_SELECT = {
  orderNo: PARTNER_ORDER_LIST_SELECT.orderNo,
  productName: PARTNER_ORDER_LIST_SELECT.productName,
  quantity: PARTNER_ORDER_LIST_SELECT.quantity,
  paidAt: PARTNER_ORDER_LIST_SELECT.paidAt,
  // 冲销原因与承担方（设计 12.1「订单明细」）：退了多少货款 / 税费、最近一次由谁承担；都是订单详情本来就给渠道的字段
  refundedGoodsCents: PARTNER_ORDER_LIST_SELECT.refundedGoodsCents,
  refundedTaxCents: PARTNER_ORDER_LIST_SELECT.refundedTaxCents,
  settleBearer: PARTNER_ORDER_DETAIL_SELECT.settleBearer,
} as const

const OPEN_STATES = ['GENERATED', 'CONFIRMED', 'DISPUTED', 'PAYING']
const DAY_MS = 86400_000

/** bp → 「1.5%」 */
function pct(bp: number): string {
  return `${(bp / 100).toFixed(2).replace(/\.?0+$/, '')}%`
}

/** 页面固定显示的公式（设计 10.8），费率随渠道配置变化（W7-4） */
export function financeFormula(feeRateBp: number, invoiceShareRateBp: number): string {
  return (
    `余额 = 货款 + 发票分成 − 进货款 ± 售后与调整；预计打款 = 余额 − 手续费；` +
    `手续费 = （货款 + 发票分成）× ${pct(feeRateBp)}，逐单四舍五入；发票分成 = 开票订单货款 × ${pct(invoiceShareRateBp)}`
  )
}

/** ISO 时刻 → 东八区日期 YYYY-MM-DD */
function cnDate(d: Date): string {
  return cnDateTimeText(d).slice(0, 10)
}

/**
 * 预计可结算日历：冻结中（settleState=ACCRUED）的订单按「交付时间 + 冻结期」归到东八区日期，金额取该单的预计打款。
 * 尚未交付的单没有预计日（不进日历）；只差发票开具的发票分成组也不进（它随发票开具解冻，没有固定日期）。
 * 最多看 1000 单（每批 100 单经 facade），更多的只是日历尾部不全，不影响任何金额。
 */
async function releaseCalendar(tenantId: number): Promise<{ date: string; payoutCents: number }[]> {
  const pend = await prisma.order.findMany({
    where: { tenantId, settleState: 'ACCRUED' },
    select: { orderNo: PARTNER_ORDER_LIST_SELECT.orderNo },
    orderBy: { id: 'asc' },
    take: 1000,
  })
  const byDate = new Map<string, number>()
  for (let i = 0; i < pend.length; i += 100) {
    const views = await orderSettlementViewsForPartner(
      tenantId,
      pend.slice(i, i + 100).map((o) => o.orderNo),
    )
    views.forEach((v) => {
      if (!v.releaseEta) return
      const d = cnDate(new Date(v.releaseEta))
      byDate.set(d, (byDate.get(d) ?? 0) + v.payoutCents)
    })
  }
  return Array.from(byDate.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([date, payoutCents]) => ({ date, payoutCents }))
}

export async function partnerFinanceSummary(tenantId: number, now: Date = new Date()): Promise<FinanceSummary> {
  assertTenantId(tenantId)
  const [balances, composition, t, extra, last, openCount, attempts, calendar] = await Promise.all([
    balancesForPartner(tenantId),
    balanceCompositionForPartner(tenantId),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: PARTNER_TENANT_SELECT }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: TENANT_APPLY_SELECT }),
    lastRequestAt(tenantId),
    prisma.tenantStatement.count({ where: { tenantId, state: { in: OPEN_STATES } } }),
    prisma.auditEvent.count({ where: { tenantId, action: 'statement.apply', at: { gte: cnDayStart(now) } } }),
    releaseCalendar(tenantId),
  ])
  if (!t) throw new Error(`[partner-finance] 渠道 ${tenantId} 不存在`)

  // 与出单函数 generateStatement 相同的判定顺序（见文件头）；只是提示
  let reason: ApplyBlockReason | undefined
  let nextAt: Date | undefined
  const cooldownEnd = extra?.payeeChangedAt ? new Date(extra.payeeChangedAt.getTime() + TENANT_DEFAULTS.payeeCooldownHours * 3600_000) : null
  const intervalEnd = last ? new Date(last.getTime() + t.requestIntervalDays * DAY_MS) : null
  if (t.payoutHold) reason = 'HOLD'
  else if (!t.payeeName || !t.payeeMethod || !t.payeeAccountMasked) reason = 'PAYEE_MISSING'
  else if (cooldownEnd && cooldownEnd.getTime() > now.getTime()) {
    reason = 'PAYEE_COOLDOWN'
    nextAt = cooldownEnd
  } else if (openCount > 0) reason = 'OPEN_EXISTS'
  else if (intervalEnd && intervalEnd.getTime() > now.getTime()) {
    reason = 'INTERVAL'
    nextAt = intervalEnd
  } else if (attempts >= TENANT_DEFAULTS.applyPerDay) {
    reason = 'INTERVAL'
    nextAt = new Date(cnDayStart(now).getTime() + DAY_MS)
  } else if (balances.available.payoutCents <= 0) reason = 'NEGATIVE'
  else if (balances.available.payoutCents < t.minPayoutCents) reason = 'BELOW_MIN'

  return {
    balances,
    composition,
    rates: {
      feeRateBp: t.feeRateBp,
      invoiceShareRateBp: t.invoiceShareRateBp,
      holdDays: t.holdDays,
      minPayoutCents: t.minPayoutCents,
      requestIntervalDays: t.requestIntervalDays,
    },
    formula: financeFormula(t.feeRateBp, t.invoiceShareRateBp),
    canApply: reason === undefined,
    ...(reason ? { applyBlockReason: reason } : {}),
    ...(nextAt ? { nextApplyAt: nextAt.toISOString() } : {}),
    releaseCalendar: calendar,
  }
}

// ============================================================================
// 流水
// ============================================================================

export interface LedgerFilter {
  type?: LedgerType
  component?: LedgerComponent
  from?: Date
  to?: Date
  page: number
  pageSize: number
}

export function isLedgerType(v: string): v is LedgerType {
  return (LEDGER_TYPES as readonly string[]).includes(v)
}
export function isLedgerComponent(v: string): v is LedgerComponent {
  return (LEDGER_COMPONENTS as readonly string[]).includes(v)
}

export async function partnerLedger(tenantId: number, f: LedgerFilter): Promise<{ total: number; rows: LedgerRowDTO[] }> {
  assertTenantId(tenantId)
  return listLedgerForPartner(tenantId, {
    page: Math.max(1, Math.floor(f.page)),
    pageSize: Math.min(LIMITS.pageMax, Math.max(1, Math.floor(f.pageSize))),
    type: f.type,
    component: f.component,
    from: f.from,
    to: f.to,
  })
}

// ============================================================================
// 订单明细（每单一行，设计 10.8）
// ============================================================================

export const FIN_ORDER_STATES = ['ACCRUED', 'RELEASED', 'REVERSED', 'EXCLUDED', 'MISSING'] as const
export type FinOrderState = (typeof FIN_ORDER_STATES)[number]

export type FinanceOrderRow = OrderSettlementView & {
  productName: string
  quantity: number
  paidAt: string | null
  refundedGoodsCents: number
  refundedTaxCents: number
  /** 最近一次退款的承担方 PROPORTIONAL | CHANNEL | PLATFORM；没退过款为 null */
  settleBearer: string | null
}

/**
 * 按付款时间筛（渠道对账按「哪天卖出去的」看最直观）；只列有结算状态的本渠道订单（未付款的单没有结算视图）。
 * 结算视图经 facade（每页 ≤ 100 单，正好一次调用）。
 */
export async function partnerFinanceOrders(
  tenantId: number,
  f: { state?: FinOrderState; from?: Date; to?: Date; page: number; pageSize: number },
): Promise<{ total: number; rows: FinanceOrderRow[] }> {
  assertTenantId(tenantId)
  const and: Prisma.OrderWhereInput[] = []
  const where: Prisma.OrderWhereInput = { tenantId, AND: and }
  and.push({ settleState: f.state ? f.state : { not: null } })
  if (f.from) and.push({ paidAt: { gte: f.from } })
  if (f.to) and.push({ paidAt: { lte: f.to } })
  const page = Math.max(1, Math.floor(f.page))
  const pageSize = Math.min(LIMITS.pageMax, Math.max(1, Math.floor(f.pageSize)))
  const [total, raws] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, select: FIN_ORDER_SELECT, orderBy: [{ paidAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }),
  ])
  const views = await orderSettlementViewsForPartner(
    tenantId,
    raws.map((r) => r.orderNo),
  )
  const rows: FinanceOrderRow[] = []
  for (const r of raws) {
    const v = views.get(r.orderNo)
    if (!v) continue
    rows.push({
      ...v,
      productName: r.productName,
      quantity: r.quantity,
      paidAt: r.paidAt ? r.paidAt.toISOString() : null,
      refundedGoodsCents: r.refundedGoodsCents ?? 0,
      refundedTaxCents: r.refundedTaxCents ?? 0,
      settleBearer: r.settleBearer ?? null,
    })
  }
  return { total, rows }
}

// ============================================================================
// 申请结算
// ============================================================================

/** 前端在打开确认框时生成的请求编号（重复提交返回同一张结算单） */
export const APPLY_REQUEST_ID_RE = /^[A-Za-z0-9_-]{8,32}$/

/**
 * 申请结算（OWNER，finance.apply）。前置条件全部由出单函数在锁内判定（设计 10.9），这里只把 requestId 加上渠道前缀再交给 facade：
 * requestId 在结算单表上全局唯一，若直接用客户端的值，别的渠道拿到（或猜到）这个值再提交一次，会撞上本渠道的结算单
 * （facade 会抛错 → 500，等于告诉对方「这个编号存在」）。加上 `p{tenantId}_` 前缀后不同渠道的编号永不相交。
 * 前缀里的 tenantId 只存在于库里，不进任何渠道 DTO。
 */
export async function partnerApplySettlement(tenantId: number, userId: number, requestId: string): Promise<GenerateResult> {
  assertTenantId(tenantId)
  if (typeof requestId !== 'string' || !APPLY_REQUEST_ID_RE.test(requestId)) throw new PartnerServiceError(400, '请求编号格式不正确，请刷新页面后重试')
  try {
    return await applySettlementForPartner(tenantId, userId, `p${tenantId}_${requestId}`)
  } catch (e) {
    // PartnerFacadeError（请求编号不合规）→ 400；按名字识别（不同路由包里类定义可能各有一份）
    if ((e as { name?: unknown })?.name === 'PartnerFacadeError') throw new PartnerServiceError(400, '请求编号格式不正确，请刷新页面后重试')
    throw e
  }
}

// ============================================================================
// 结算单
// ============================================================================

export async function partnerStatements(tenantId: number, page: number): Promise<{ total: number; rows: Omit<StatementDetailDTO, 'lines' | 'payee'>[] }> {
  assertTenantId(tenantId)
  return statementListForPartner(tenantId, Math.max(1, Math.floor(page)))
}

export async function partnerStatementDetail(tenantId: number, statementNo: string): Promise<StatementDetailDTO | null> {
  assertTenantId(tenantId)
  return statementDetailForPartner(tenantId, statementNo)
}

export const STATEMENT_CSV_HEADER = ['时间', '类型', '成分', '订单号', '金额(分)', '金额(元)']

const TYPE_TEXT: Record<string, string> = {
  ACCRUE: '计提',
  ACCRUE_INV: '发票分成计提',
  RELEASE: '解冻',
  RELEASE_INV: '发票分成解冻',
  REVERSE: '冲销',
  SHORTPAY: '少付',
  ADJUST: '调账',
  STATEMENT: '结算',
  PAYOUT: '打款',
  WITHHOLD: '代扣',
  RETURN: '结算单退回',
  REPAY: '回款',
  BOUNCE: '退票',
  WRITEOFF: '核销',
  DEPOSIT_IN: '保证金转入',
  DEPOSIT_APPLY: '保证金抵扣',
  DEPOSIT_REFUND: '保证金退还',
}
const COMPONENT_TEXT: Record<string, string> = {
  SALE: '货款',
  PURCHASE: '进货款',
  INVOICE_SHARE: '发票分成',
  FEE: '手续费',
  INVOICE_FEE: '发票分成手续费',
  LOSS: '售后损失',
  SHORT: '少付',
  MANUAL: '调整',
  NET: '净额',
}

/**
 * 对账单 CSV：纳入明细逐行 + 末行合计。合计 = Σ 明细 = 结算单 netCents（W7-6）。
 * 金额同时给「分」（整数，对账用）与「元」（数字列，不是字符串：以负号开头的字符串会被 CSV 公式注入防护加单引号）。
 * 下载写 statement.export 审计（渠道自己的操作，publicDiff = diff）。
 */
export async function partnerStatementCsv(
  tenantId: number,
  userId: number,
  statementNo: string,
  req?: Request,
): Promise<{ header: string[]; rows: Record<string, string | number | null>[]; watermark: string; filename: string } | null> {
  const d = await partnerStatementDetail(tenantId, statementNo)
  if (!d) return null
  const now = new Date()
  let sum = 0
  const rows: Record<string, string | number | null>[] = d.lines.map((l) => {
    sum += l.amountCents
    return {
      时间: cnDateTimeText(new Date(l.at)),
      类型: TYPE_TEXT[l.type] ?? l.type,
      成分: COMPONENT_TEXT[l.component] ?? l.component,
      订单号: l.orderNo ?? '',
      '金额(分)': l.amountCents,
      '金额(元)': Number((l.amountCents / 100).toFixed(2)),
    }
  })
  if (sum !== d.netCents) {
    // 明细与结算单头不一致只可能是账本出了问题：不给一张对不上的对账单
    console.error(`[partner-finance] 结算单 ${d.statementNo} 明细合计 ${sum} ≠ netCents ${d.netCents}`)
    throw new PartnerServiceError(409, '对账单数据校验未通过，请联系站长')
  }
  rows.push({ 时间: '合计', 类型: '', 成分: '', 订单号: `${d.lines.length} 条`, '金额(分)': sum, '金额(元)': Number((sum / 100).toFixed(2)) })
  await writeAudit(null, {
    actorKind: 'TENANT',
    actorUserId: userId,
    tenantId,
    action: 'statement.export',
    targetType: 'statement',
    targetId: d.statementNo,
    diff: { statementNo: d.statementNo, lines: d.lines.length },
    req,
  })
  const watermark = `对账单 ${d.statementNo}（第 ${d.seq} 期）；截止 ${cnDateTimeText(new Date(d.periodEnd))}；打款净额 ${(d.netCents / 100).toFixed(2)} 元；导出时间 ${cnDateTimeText(now)}（东八区）`
  return { header: STATEMENT_CSV_HEADER, rows, watermark, filename: `statement-${d.statementNo}.csv` }
}
