/**
 * 短信接码 · 营收 / 成本 / 利润的汇总纯函数（docs/短信接码-设计.md §9.5、§7.1、§7.2 页脚、§6.6 第 28 条）。
 *
 * 【零依赖】不连库；后台概览、仪表盘卡片、后台订单列表页脚都用这里的口径，scripts/check-jiema-s2b.ts 直接断言 §9.5 的例子。
 *
 * 口径（§9.5）：
 *  · 营收 = 定稿（costFinal=true）、costAt 落在区间内、状态 ∈ {FINISHED, REFUNDED} 的单的 priceCents 之和
 *    （从 RECEIVED 直接售后退款的单在退款那一刻定稿，同样进这一批，否则当天毛利会被记成 −售价而不是 −成本）；
 *  · 实际扣费 = 同一批单的 chargedMicro 之和；真实成本 = 同一批单的 **Σ costCents**（每单按自己快照的成本汇率向上取整，页面不出现乘号）；
 *  · 售后退款冲减 = refundedAt 落在区间内的 REFUNDED 单的 priceCents 之和（记负数）；
 *  · 毛利 = 营收 − 真实成本 − 售后退款冲减（长期合计等于 Σ profitCents）；
 *  · 已取消：单数、退回金额（两格分开），**不进营收、成本、毛利**；亏损 = 已取消单的 lossCents 之和（按退款时间落在区间内）；
 *  · 预估中 = 已收码未定稿（costFinal=false 且 costCents 不为空）的单，单独计数、不进毛利。
 */

export interface FinanceRow {
  state: string
  priceCents: number
  chargedMicro: number | null
  costCents: number | null
  profitCents: number | null
  lossCents: number | null
  costFinal: boolean
  costAt: Date | null
  refundedAt: Date | null
  refundTopupCents: number | null
  refundCashCents: number | null
}

export interface FinanceSummary {
  /** 定稿单数（营收那一批） */
  finalized: number
  revenueCents: number
  chargedMicro: number
  costCents: number
  /** 售后退款冲减（正数，页面显示为负） */
  refundOffsetCents: number
  profitCents: number
  cancelled: { count: number; topupCents: number; cashCents: number }
  lossCents: number
  /** 预估中（已收码未定稿），不进毛利 */
  estimating: number
}

const inRange = (d: Date | null, from: Date, to: Date) => !!d && d.getTime() >= from.getTime() && d.getTime() < to.getTime()

export function summarizeFinance(rows: readonly FinanceRow[], from: Date, to: Date): FinanceSummary {
  const out: FinanceSummary = { finalized: 0, revenueCents: 0, chargedMicro: 0, costCents: 0, refundOffsetCents: 0, profitCents: 0, cancelled: { count: 0, topupCents: 0, cashCents: 0 }, lossCents: 0, estimating: 0 }
  for (const r of rows) {
    if (r.costFinal && (r.state === 'FINISHED' || r.state === 'REFUNDED') && inRange(r.costAt, from, to)) {
      out.finalized++
      out.revenueCents += r.priceCents
      out.chargedMicro += r.chargedMicro ?? 0
      out.costCents += r.costCents ?? 0
    }
    if (r.state === 'REFUNDED' && inRange(r.refundedAt, from, to)) out.refundOffsetCents += r.priceCents
    if (r.state === 'CANCELLED' && inRange(r.refundedAt, from, to)) {
      out.cancelled.count++
      out.cancelled.topupCents += r.refundTopupCents ?? 0
      out.cancelled.cashCents += r.refundCashCents ?? 0
      out.lossCents += r.lossCents ?? 0
    }
    if (!r.costFinal && r.costCents != null && r.state !== 'CANCELLED') out.estimating++
  }
  out.profitCents = out.revenueCents - out.costCents - out.refundOffsetCents
  return out
}

/**
 * 后台接码订单列表的页脚合计（当前筛选，§7.2）：只算「计成本」的单（costCents 不为空；已取消单落库为空 = 不计）。
 * 营收 = 这些单里不是售后退款的售价之和；真实成本 = Σ costCents；毛利 = Σ profitCents（完成单 = 售价 − 成本，售后单 = −成本），
 * 所以 营收 − 成本 = 毛利 恒成立。预估（未定稿）的单也算进去，页面另注「含预估 N 单」。
 */
export interface FooterRow {
  state: string
  priceCents: number
  costCents: number | null
  profitCents: number | null
  lossCents: number | null
  costFinal: boolean
}
export function listFooter(rows: readonly FooterRow[]): { orders: number; revenueCents: number; costCents: number; profitCents: number; lossCents: number; estimating: number; notCounted: number } {
  let revenue = 0
  let cost = 0
  let profit = 0
  let loss = 0
  let est = 0
  let orders = 0
  let not = 0
  for (const r of rows) {
    loss += r.lossCents ?? 0
    if (r.costCents == null || r.profitCents == null) {
      not++
      continue
    }
    orders++
    cost += r.costCents
    profit += r.profitCents
    if (r.state !== 'REFUNDED') revenue += r.priceCents
    if (!r.costFinal) est++
  }
  return { orders, revenueCents: revenue, costCents: cost, profitCents: profit, lossCents: loss, estimating: est, notCounted: not }
}

/** 后台「付款」一格的文字（§7.2）：「余额 ¥1.20（充值 0.70 / 返现 0.50）+ 支付宝 ¥0.50（实收 0.52）」 */
export function payCellText(p: { payMode: string; topupCents: number; cashCents: number; alipayCents: number; alipayPaidCents: number | null }): string {
  const y = (c: number) => `${Math.floor(c / 100)}.${String(Math.abs(c) % 100).padStart(2, '0')}`
  const bal = p.topupCents + p.cashCents
  const balPart = bal > 0 ? `余额 ¥${y(bal)}（充值 ${y(p.topupCents)} / 返现 ${y(p.cashCents)}）` : ''
  const aliPart = p.alipayCents > 0 ? `支付宝 ¥${y(p.alipayCents)}${p.alipayPaidCents != null ? `（实收 ${y(p.alipayPaidCents)}）` : ''}` : ''
  if (p.payMode === 'BALANCE') return balPart || '余额'
  if (p.payMode === 'MIXED') return [balPart, aliPart].filter(Boolean).join(' + ')
  return aliPart || '支付宝'
}
