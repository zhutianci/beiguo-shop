/**
 * 短信接码 · 每日对账（S4）的纯函数（docs/短信接码-设计.md §9.4 的 I、R 系列、§9.5 日报、§7.1「未关联激活」、§10.1 知会）。
 *
 * 【零依赖】不连库、不调上游；scripts/check-jiema-s4.ts 直接断言（§12.1 第 98 条：用 probe2.out 脱敏的真实 history 行作样本）。
 * 连库与调上游的部分在 reconcile.ts / unlinked.ts，判定一律在这里，免得同一个口径在几处各写一遍。
 *
 * 【上游口径（实测 probe2.out，调研 §3.4 第 6 条）】history 的 `cost` 在**已取消的行上也有值**（就是号码标价），
 * 所以「上游实扣」只认**状态 6 的行、以及 moreCodes 非空的行**（状态 10 除外：那是上游事后把收过码的号退了，走 R6），
 * 与 cost 字段有没有值无关。对账一律只查 statuses[]=6/8/10（结束了的号）。
 *
 * 【只改钱的事实，不改状态】R1 / R6 只写尝试的 charged / chargeSource=RECON / costMicro / upstreamRefundMicro 并重跑 T20
 * （已取消单只写 lossCents，附录 B 第 18 条）；尝试与订单的**状态**是引擎的事——没到终态的尝试一律「交给引擎」，这里不判不一致、不改。
 */
import { USD, type HistoryRow } from './parse'
import { settleCost, isAttemptTerminal } from './machine'
import { realCostCents } from './pricing'
import { fmtCents } from '../wallet/buckets'

const MIN = 60_000

/** R1：成本相等的容差（$0.0001，§9.4「差额 ≤ $0.0001」） */
export const RECON_COST_TOLERANCE_MICRO = 100
/** I4：尝试过了 endsAt 多少分钟还没结束就报（§9.4 I4） */
export const I4_STALE_MIN = 90
/** I8：订单结束、号码全部终态超过多少分钟仍没定稿就补算（§9.4 I8） */
export const I8_SETTLE_MIN = 10
/** R4：尝试结束后多少分钟才要求它出现在上游 history 里（刚结束的号 history 可能还没有） */
export const R4_SETTLE_MIN = 10
/** R3 / 未关联激活：旧单品订单付款后多少分钟内出现的同服务激活算「旧链路遗留」（§9.4 R3、D19） */
export const LEGACY_WINDOW_MIN = 30
/** 知会（§10.1）：同一用户 24 小时内「支付宝付款后取消、退回充值格」合计超过 ¥50 */
export const ALIPAY_CANCEL_NOTICE_CENTS = 5000
/** 知会（§10.1）：24 小时内取消 ≥10 单的用户（只标记、不封禁） */
export const CANCEL_NOTICE_COUNT = 10
/**
 * 可疑用户标记的文字（§10.1，只标记、不限制；后台用户列表与接码订单列表的徽章）：没到标记线返回 null。
 * 与每日知会同一口径：24 小时内取消 ≥ CANCEL_NOTICE_COUNT 单，或支付宝付款后取消、退回充值格合计 > ALIPAY_CANCEL_NOTICE_CENTS。
 */
export function userFlagText(r: { cancels: number; alipayCents: number }): string | null {
  const parts: string[] = []
  if (r.cancels >= CANCEL_NOTICE_COUNT) parts.push(`24 小时取消 ${r.cancels} 单`)
  if (r.alipayCents > ALIPAY_CANCEL_NOTICE_CENTS) parts.push(`支付宝付款后取消 ${fmtCents(r.alipayCents)}`)
  return parts.length ? parts.join(' · ') : null
}

/** 没有 endsAt 的尝试（还没取到号）按取号时刻 + 20 分钟当作有效期末（I4） */
const FALLBACK_LIFE_MIN = 20

const ENDED = new Set([6, 8, 10])

// ───────────────────────── 上游 history 的口径 ─────────────────────────

export type ReconRow = Pick<HistoryRow, 'id' | 'status' | 'moreCodes' | 'costMicro'> & Partial<Pick<HistoryRow, 'createdAt' | 'service' | 'country' | 'phone'>>

export const rowHasCode = (r: Pick<HistoryRow, 'moreCodes'>): boolean => !!(r.moreCodes && r.moreCodes.trim())
export const rowEnded = (r: Pick<HistoryRow, 'status'>): boolean => r.status != null && ENDED.has(r.status)

/**
 * 币种异常（E56）的行：状态照样可用，金额不可信 → costMicro 置空（不拿它修正成本、不进 R5 汇总）。
 * currency 为 null = 缺省（按规格默认 840）；认不出的币种（"RUB"）由 parse.currencyOf 解析成 −1，同样置空（S4 评审修复）。
 */
export function usableCostRows<T extends Pick<HistoryRow, 'currency' | 'costMicro'>>(rows: readonly T[]): T[] {
  return rows.map((r) => (r.currency != null && r.currency !== USD ? { ...r, costMicro: null } : r))
}

/** R1：上游扣了费、而且没有退（状态 6，或 moreCodes 非空且状态不是 10） */
export function upstreamChargedKept(r: Pick<HistoryRow, 'status' | 'moreCodes'>): boolean {
  if (!rowEnded(r)) return false
  return r.status === 6 || (rowHasCode(r) && r.status !== 10)
}

/** R6：上游事后退了收过码的号（状态 10 且 moreCodes 非空；多半是站长申诉成功，§7.5） */
export function upstreamRefundedAfterCode(r: Pick<HistoryRow, 'status' | 'moreCodes'>): boolean {
  return r.status === 10 && rowHasCode(r)
}

/** R2：上游已取消 / 已退款且没有收到码（状态 8 或 10、moreCodes 为空）——没扣费，**不管 cost 字段有没有值** */
export function upstreamNotCharged(r: Pick<HistoryRow, 'status' | 'moreCodes'>): boolean {
  return (r.status === 8 || r.status === 10) && !rowHasCode(r)
}

/**
 * R5 的上游实扣：只汇总 upstreamChargedKept 的行的 cost（微美元）。
 * probe2.out：73 行里 23 行成功，`totals.sum = 7.5494` 正是这 23 行的 cost 之和；把状态 8 的行也加进来就会严重高估。
 */
export function sumUpstreamCharged(rows: readonly ReconRow[]): { micro: number; count: number; unknownCost: number } {
  let micro = 0
  let count = 0
  let unknownCost = 0
  for (const r of rows) {
    if (!upstreamChargedKept(r)) continue
    count++
    if (r.costMicro == null) unknownCost++
    else micro += r.costMicro
  }
  return { micro, count, unknownCost }
}

// ───────────────────────── R1 / R2 / R6：一行 history 对一个我方尝试 ─────────────────────────

export interface ReconAttempt {
  id: number
  smsOrderId: number
  state: string
  charged: boolean
  chargeSource: string | null
  costMicro: number | null
  maxPriceMicro: number
  upstreamRefundMicro: number | null
  assumed: boolean
}

export interface ReconPatch {
  charged?: true
  chargeSource?: 'RECON'
  costMicro?: number
  upstreamRefundMicro?: number
  /** 推定退款（assumed）的尝试在这里得到核实（不论核实结果是扣了还是没扣），清掉 */
  assumed?: false
}

export type ReconAction =
  /** 一致，什么都不做 */
  | { kind: 'NONE'; rule: 'R1' | 'R2' | 'R6' | null }
  /** 尝试还没到终态：交给引擎（history 定终态是引擎的事），这里不判、不改 */
  | { kind: 'PENDING'; rule: 'R1' | 'R2' | 'R6' }
  /** 以上游为准修正钱的事实并重算：T20（订单没取消）或只写亏损（订单已取消，R1 的亏损分支） */
  | { kind: 'FIX'; rule: 'R1' | 'R6'; patch: ReconPatch; recompute: 'T20' | 'LOSS'; why: string }
  /** 推定退款 / 推定完成（assumed）的尝试在这里得到核实、钱的事实本来就对：只清掉 assumed（不算不一致） */
  | { kind: 'CLEAR_ASSUMED'; rule: 'R1' | 'R2' | 'R6' }
  /** R2：上游说没扣费、我方记着 FREE_CANCELLATION_EXPIRED 的扣费——以我方为准，报告里单列 */
  | { kind: 'EXPIRED_KEPT'; rule: 'R2' }
  /** 说不通的不一致：只报告、不自动改（转人工核对） */
  | { kind: 'MISMATCH'; rule: 'R2' | 'R6'; why: string }

const onlyAssumed = (p: ReconPatch): boolean => Object.keys(p).length === 1 && p.assumed === false

/**
 * 对账只修正**订单状态稳定**的尝试（S4 评审修复）：已收码 / 已完成 / 售后退款 / 已取消 / 转人工。
 * 其余状态（取号中、等码、换号中、取消中、退款中……）订单还在推进，一律 PENDING、下一次对账再核：
 *  · REFUNDING 时 T15 在锁接码单行之前普通读尝试、算好亏损再 CAS——对账的修正若落在它「读」与「CAS」之间，
 *    T15 会拿旧的尝试写 lossCents（已取消单上挂着 charged 的号、亏损却为空，I7 天天报、不会自愈）；
 *  · 进行中的单之后还可能被取消：这时写的 upstreamRefundMicro（R6）在 CANCELLED 分支不参与亏损，会把上游退了的号记成亏损。
 * 订单几十分钟内就会落到稳定状态，而对账窗口覆盖前两天，下一次对账照样核得到。
 */
export const RECON_STABLE_ORDER_STATES: ReadonlySet<string> = new Set(['RECEIVED', 'FINISHED', 'REFUNDED', 'CANCELLED', 'MANUAL'])

/**
 * 一行 history（6 / 8 / 10）对我方一个尝试（§9.4 R1、R2、R6）。orderState 是这个尝试所属接码单的状态。
 *  · R1 上游扣了费：尝试该是 charged、成本相等（≤ $0.0001）；不是就以上游为准（charged=true、chargeSource=RECON、costMicro=上游 cost），
 *    订单不是 CANCELLED → 重跑 T20；是 CANCELLED（多半是推定退款后翻案）→ 只写 lossCents，不跑 T20、不写成本利润；
 *  · R2 上游没扣费：尝试该是没 charged 的 CANCELLED（或 FAILED）；chargeSource=EXPIRED 的以我方为准单列；assumed 的在这里核实（清掉）；
 *  · R6 上游事后退了收过码的号：upstreamRefundMicro = 这个号计的扣费，重跑 T20（REFUNDED 单利润 = −成本 + 冲回）；
 *    已取消的单不该收过码，只报告。
 */
export function judgeReconRow(row: Pick<HistoryRow, 'status' | 'moreCodes' | 'costMicro'>, att: ReconAttempt, orderState: string): ReconAction {
  if (!rowEnded(row)) return { kind: 'NONE', rule: null }
  const terminal = isAttemptTerminal(att.state)
  const rule = upstreamRefundedAfterCode(row) ? 'R6' : upstreamChargedKept(row) ? 'R1' : upstreamNotCharged(row) ? 'R2' : null
  // 订单还在推进（含取消中 / 退款中）：不判、不改，下一次再核（RECON_STABLE_ORDER_STATES 的注释）
  if (rule && !RECON_STABLE_ORDER_STATES.has(orderState)) return { kind: 'PENDING', rule }
  if (upstreamRefundedAfterCode(row)) {
    if (!terminal) return { kind: 'PENDING', rule: 'R6' }
    if (orderState === 'CANCELLED') return { kind: 'MISMATCH', rule: 'R6', why: '订单已取消（没收到码、已整单退回），上游却显示这个号收过码后被退款' }
    // 转人工的单之后可能被后台「取消并退回余额」：CANCELLED 的亏损不看 upstreamRefundMicro，这里先写冲回会把上游退了的号记成亏损
    if (orderState === 'MANUAL') return { kind: 'MISMATCH', rule: 'R6', why: '订单转人工中，上游显示这个号收过码后被退款（对账不改，人工处理时核对）' }
    const patch: ReconPatch = {}
    if (!att.charged) {
      patch.charged = true
      patch.chargeSource = 'RECON'
    }
    if (att.costMicro == null && row.costMicro != null) patch.costMicro = row.costMicro
    const eff = patch.costMicro ?? att.costMicro ?? att.maxPriceMicro
    if (att.upstreamRefundMicro !== eff) patch.upstreamRefundMicro = eff
    if (att.assumed) patch.assumed = false
    if (!Object.keys(patch).length) return { kind: 'NONE', rule: 'R6' }
    if (onlyAssumed(patch)) return { kind: 'CLEAR_ASSUMED', rule: 'R6' }
    return { kind: 'FIX', rule: 'R6', patch, recompute: 'T20', why: `上游状态 10 且收过码：冲回 ${usd4(eff)}` }
  }
  if (upstreamChargedKept(row)) {
    if (!terminal) return { kind: 'PENDING', rule: 'R1' }
    const patch: ReconPatch = {}
    if (!att.charged) {
      patch.charged = true
      patch.chargeSource = 'RECON'
    }
    if (row.costMicro != null && (att.costMicro == null || Math.abs(att.costMicro - row.costMicro) > RECON_COST_TOLERANCE_MICRO)) patch.costMicro = row.costMicro
    if (att.assumed) patch.assumed = false
    if (!Object.keys(patch).length) return { kind: 'NONE', rule: 'R1' }
    if (onlyAssumed(patch)) return { kind: 'CLEAR_ASSUMED', rule: 'R1' }
    const why = [
      patch.charged ? `我方没计扣费（${att.state}），上游状态 ${row.status}${rowHasCode(row) ? '、收过码' : ''}` : null,
      patch.costMicro != null ? `成本 ${att.costMicro == null ? '空' : usd4(att.costMicro)} → ${usd4(patch.costMicro)}` : null,
    ]
      .filter(Boolean)
      .join('；')
    return { kind: 'FIX', rule: 'R1', patch, recompute: orderState === 'CANCELLED' ? 'LOSS' : 'T20', why }
  }
  if (upstreamNotCharged(row)) {
    if (!terminal) return { kind: 'PENDING', rule: 'R2' }
    if (att.charged && att.chargeSource === 'EXPIRED') return { kind: 'EXPIRED_KEPT', rule: 'R2' }
    if (!att.charged && (att.state === 'CANCELLED' || att.state === 'FAILED')) return att.assumed ? { kind: 'CLEAR_ASSUMED', rule: 'R2' } : { kind: 'NONE', rule: 'R2' }
    return { kind: 'MISMATCH', rule: 'R2', why: `上游状态 ${row.status} 且没有收到码，我方是 ${att.state}${att.charged ? `、计了扣费（${att.chargeSource ?? '—'}）` : ''}` }
  }
  return { kind: 'NONE', rule: null }
}

/** 把补丁套到尝试上（R5 用修正后的值汇总） */
export function applyPatch(att: ReconAttempt, p: ReconPatch): ReconAttempt {
  return {
    ...att,
    charged: p.charged ?? att.charged,
    chargeSource: p.chargeSource ?? att.chargeSource,
    costMicro: p.costMicro ?? att.costMicro,
    upstreamRefundMicro: p.upstreamRefundMicro ?? att.upstreamRefundMicro,
    assumed: p.assumed ?? att.assumed,
  }
}

/** 我方一个尝试「实际被扣、没被退」的金额（与 settleCost 同一口径：charged 的按 costMicro，没有就按 cap；减上游事后退款） */
export function attemptNetChargedMicro(a: Pick<ReconAttempt, 'charged' | 'costMicro' | 'maxPriceMicro' | 'upstreamRefundMicro'>): number {
  if (!a.charged) return 0
  return Math.max(0, (a.costMicro ?? a.maxPriceMicro) - (a.upstreamRefundMicro ?? 0))
}

// ───────────────────────── R3 / 未关联激活的分类 ─────────────────────────

export type UnlinkedKind = 'LEGACY' | 'EXTERNAL'

/**
 * 本站两张表与旧单品备注里都没有的激活：落在旧单品会卖的服务、且在某张旧单品订单**付款后 30 分钟内**创建的 → 「旧链路遗留」（不推送）；
 * 其余 → 「外部激活」（站长手动购买或孤儿号，推送）。legacyPaidMs 是旧单品订单的付款时刻（毫秒）。创建时间未知的一律按外部。
 */
export function classifyUnlinked(a: { service: string | null; createdAt: Date | null }, legacyServices: ReadonlySet<string>, legacyPaidMs: readonly number[]): UnlinkedKind {
  if (!a.service || !a.createdAt || !legacyServices.has(a.service.toLowerCase())) return 'EXTERNAL'
  const t = a.createdAt.getTime()
  return legacyPaidMs.some((p) => p <= t && t - p <= LEGACY_WINDOW_MIN * MIN) ? 'LEGACY' : 'EXTERNAL'
}

// ───────────────────────── I 系列：一张接码单 ─────────────────────────

export interface IAttempt {
  id: number
  state: string
  charged: boolean
  costMicro: number | null
  maxPriceMicro: number
  upstreamRefundMicro: number | null
  requestedAt: Date
  endsAt: Date | null
  closedAt: Date | null
  updatedAt: Date
}

export interface IOrderInput {
  smsOrderId: number
  orderId: number
  state: string
  payMode: string
  priceCents: number
  balanceCents: number
  alipayPaidCents: number | null
  costFx4: number
  chargedMicro: number | null
  costCents: number | null
  profitCents: number | null
  lossCents: number | null
  costFinal: boolean
  refundTopupCents: number | null
  refundCashCents: number | null
  /** 订单（null = 找不到，I1 另报） */
  order: { payStatus: string; deliveryStatus: string } | null
  attempts: IAttempt[]
  /** 这张单的短信条数 */
  messages: number
  hold: { state: string; topupCents: number; cashCents: number } | null
  /** refund:<orderId> 流水（两格）；没有 = null */
  refundLog: { topupCents: number; cashCents: number } | null
  /** ALIPAY 支付流水 tradeNo 所指收款单的 reallyPrice（分）；没有 ALIPAY 流水 = null；有流水但收款单对不上 = 'MISMATCH' */
  alipayReallyCents: number | null | 'MISMATCH'
}

export interface IIssue {
  code: 'I2' | 'I3' | 'I4' | 'I5' | 'I6' | 'I7' | 'I8'
  msg: string
}

const LIVE_I4 = new Set(['REQUESTING', 'UNKNOWN', 'ACTIVE', 'RELEASING'])
const REFUNDED_STATES = new Set(['CANCELLED', 'REFUNDED'])

/**
 * 一张接码单的 I2–I8（§9.4）。I1（载体订单 ⇔ 接码单 1:1）是集合层面的，在 reconcile.ts 用 SQL 查。
 * 返回问题清单，以及 I8 是否需要补算（FINISHED / REFUNDED、号码全部终态超过 10 分钟仍 costFinal=false）。
 */
export function checkOrderI(o: IOrderInput, now: Date): { issues: IIssue[]; recompute: boolean } {
  const issues: IIssue[] = []
  const tag = `接码单 #${o.smsOrderId}（订单 #${o.orderId}，${o.state}）`
  const push = (code: IIssue['code'], msg: string) => issues.push({ code, msg: `${tag}：${msg}` })
  const paid = !!o.order && (o.order.payStatus === 'PAID' || o.order.payStatus === 'REFUNDED')

  // I2：CANCELLED / REFUNDED ⇔ 订单 REFUNDED ⇔ refund 流水；两格金额与合计
  {
    const smsRefunded = REFUNDED_STATES.has(o.state)
    const orderRefunded = o.order?.payStatus === 'REFUNDED'
    const hasLog = !!o.refundLog
    if (smsRefunded !== orderRefunded || smsRefunded !== hasLog) {
      push('I2', `接码单${smsRefunded ? '已退款' : '未退款'}、订单 ${o.order?.payStatus ?? '不存在'}、refund 流水${hasLog ? '有' : '没有'}（三者应当一致）`)
    }
    if (smsRefunded && o.refundLog) {
      if (o.refundLog.cashCents !== (o.refundCashCents ?? -1) || o.refundLog.topupCents !== (o.refundTopupCents ?? -1)) {
        push('I2', `refund 流水两格（充值 ${fmtCents(o.refundLog.topupCents)} / 返现 ${fmtCents(o.refundLog.cashCents)}）≠ 接码单记的退回额（充值 ${o.refundTopupCents == null ? '空' : fmtCents(o.refundTopupCents)} / 返现 ${o.refundCashCents == null ? '空' : fmtCents(o.refundCashCents)}）`)
      }
      const want = o.balanceCents + (o.alipayPaidCents ?? 0)
      const got = o.refundLog.cashCents + o.refundLog.topupCents
      if (got !== want) push('I2', `退回合计 ${fmtCents(got)} ≠ 余额部分 ${fmtCents(o.balanceCents)} + 支付宝实收 ${fmtCents(o.alipayPaidCents ?? 0)}`)
    }
    if (paid) {
      if (o.payMode === 'BALANCE') {
        if (o.alipayPaidCents !== 0) push('I2', `余额付清的单 alipayPaidCents 应为 0，实际 ${o.alipayPaidCents ?? '空'}`)
        if (o.alipayReallyCents != null) push('I2', '余额付清的单却有支付宝支付流水')
      } else if (o.alipayReallyCents === 'MISMATCH' || o.alipayReallyCents == null) {
        push('I2', '找不到让它付款的收款单（ALIPAY 支付流水的 tradeNo 对不上已到账的本单收款单）')
      } else if (o.alipayPaidCents !== o.alipayReallyCents) {
        push('I2', `alipayPaidCents ${o.alipayPaidCents ?? '空'} ≠ 收款单实付 ${o.alipayReallyCents}`)
      }
    }
  }

  // I3：余额付清 / 组合的已付款单 ⇔ 预扣 CAPTURED（退款后 REFUNDED）、合计 = balanceCents；支付宝单没有预扣。待支付 → HELD；已关闭 → RELEASED
  {
    const h = o.hold
    const usesBalance = o.payMode === 'BALANCE' || o.payMode === 'MIXED'
    if (!usesBalance) {
      if (h) push('I3', `支付宝全额的单却有预扣（${h.state}）`)
    } else if (!h) {
      push('I3', `${o.payMode} 的单没有预扣行`)
    } else {
      if (h.topupCents + h.cashCents !== o.balanceCents) push('I3', `预扣合计 ${fmtCents(h.topupCents + h.cashCents)} ≠ 余额部分 ${fmtCents(o.balanceCents)}`)
      if (paid) {
        const want = REFUNDED_STATES.has(o.state) ? 'REFUNDED' : 'CAPTURED'
        if (h.state !== want) push('I3', `已付款的单预扣应是 ${want}，实际 ${h.state}`)
      } else if (o.state === 'PENDING_PAY' && h.state !== 'HELD') push('I3', `待支付的单预扣应是 HELD，实际 ${h.state}`)
      else if (o.state === 'CLOSED' && h.state !== 'RELEASED') push('I3', `已关闭的单预扣应是 RELEASED，实际 ${h.state}`)
    }
  }

  // I4：过了 endsAt + 90 分钟仍 REQUESTING / UNKNOWN / ACTIVE / RELEASING 的尝试
  for (const a of o.attempts) {
    if (!LIVE_I4.has(a.state)) continue
    const end = a.endsAt ? a.endsAt.getTime() : a.requestedAt.getTime() + FALLBACK_LIFE_MIN * MIN
    if (now.getTime() > end + I4_STALE_MIN * MIN) push('I4', `尝试 #${a.id} 仍是 ${a.state}，已过有效期末 ${Math.round((now.getTime() - end) / MIN)} 分钟`)
  }

  // I5：FINISHED / RECEIVED 至少一条短信、订单 DELIVERED
  if (o.state === 'FINISHED' || o.state === 'RECEIVED') {
    if (o.messages < 1) push('I5', '已收码 / 已完成却没有任何短信')
    if (o.order?.deliveryStatus !== 'DELIVERED') push('I5', `订单交付状态应是 DELIVERED，实际 ${o.order?.deliveryStatus ?? '—'}`)
  }

  // I6：同一张单 REQUESTING / UNKNOWN 的尝试 ≤ 1
  {
    const n = o.attempts.filter((a) => a.state === 'REQUESTING' || a.state === 'UNKNOWN').length
    if (n > 1) push('I6', `同时有 ${n} 个取号中 / 结果未知的尝试`)
  }

  // I7：成本利润可重算
  {
    const s = settleCost({ state: o.state, priceCents: o.priceCents, costFx4: o.costFx4 }, o.attempts)
    if (o.state === 'CANCELLED') {
      if (o.chargedMicro != null || o.costCents != null || o.profitCents != null) push('I7', '已取消的单成本利润应为空（不计），实际写了值')
      if (o.costFinal) push('I7', '已取消的单不应定稿')
      if (o.lossCents !== s.lossCents) push('I7', `亏损应为 ${s.lossCents == null ? '空' : fmtCents(s.lossCents)}，实际 ${o.lossCents == null ? '空' : fmtCents(o.lossCents)}`)
    } else if (o.costFinal) {
      if (o.chargedMicro !== s.chargedMicro || o.costCents !== s.costCents || o.profitCents !== s.profitCents) {
        push('I7', `已定稿的成本利润重算不一致：扣费 ${o.chargedMicro ?? '空'} / 成本 ${o.costCents ?? '空'} / 利润 ${o.profitCents ?? '空'}，重算 ${s.chargedMicro} / ${s.costCents} / ${s.profitCents}`)
      }
      if (o.lossCents != null) push('I7', '没取消的单不应有亏损')
    }
  }

  // I8：FINISHED / REFUNDED、号码全部终态超过 10 分钟仍没定稿 → 补算并告警
  let recompute = false
  if ((o.state === 'FINISHED' || o.state === 'REFUNDED') && !o.costFinal && o.attempts.every((a) => isAttemptTerminal(a.state))) {
    const last = Math.max(0, ...o.attempts.map((a) => (a.closedAt ?? a.updatedAt).getTime()))
    if (now.getTime() - last >= I8_SETTLE_MIN * MIN) {
      recompute = true
      push('I8', `订单已结束、号码全部终态超过 ${I8_SETTLE_MIN} 分钟仍没有定稿成本利润（已补算）`)
    }
  }
  return { issues, recompute }
}

/** 已取消单的亏损（与 settleCost 同一口径；I7 与 R1 的亏损分支都用它） */
export function lossOf(attempts: readonly Pick<IAttempt, 'charged' | 'costMicro' | 'maxPriceMicro'>[], costFx4: number): number | null {
  const sum = attempts.reduce((s, a) => (a.charged ? s + (a.costMicro ?? a.maxPriceMicro) : s), 0)
  return sum > 0 ? realCostCents(sum, costFx4) : null
}

// ───────────────────────── 报告落库的大小（settings.value 是 TEXT：65,535 字节） ─────────────────────────

/** 报告 JSON 的字节上限（utf8mb4 下中文 3 字节：按字节量，不按字符数；留 5KB 余量） */
export const REPORT_MAX_BYTES = 60_000

export const utf8Bytes = (s: string): number => Buffer.byteLength(s, 'utf8')

/** fitReportJson 需要的最小形状（reconcile.ts 的 JiemaReconcileReport 满足它） */
export interface SlimmableReport {
  items: Array<{ code: string; title: string; ok: boolean; count: number; samples: string[]; note?: string }>
  unlinked: { external: unknown[]; legacy: unknown[]; externalCount: number; legacyCount: number; externalIds?: string[] }
  r5: unknown[]
  notices: string[]
  fixes: { lossOrders: unknown[]; lossOrdersTotal?: number }
  truncated?: number
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s)

/**
 * 把报告压到 maxBytes 字节以内再存（S4 评审修复：原来按字符数判 60,000，中文一多就超 64KB 存不进去、页面停在上一次的结论）。
 * 逐级瘦身：0 原样 → 1 例子 3 条 / 清单 20 条 / 亏损单 20 张 → 2 例子 1 条 / 清单 5 条 / 亏损单 5 张 → 3 只留各项结论与计数。
 * 计数（count、externalCount、lossOrdersTotal）与外部激活的 id 清单（R3「只报新出现的」去重用）一直保留；truncated = 用到的级别。
 */
export function fitReportJson<T extends SlimmableReport>(report: T, maxBytes: number = REPORT_MAX_BYTES): { value: string; level: number } {
  const total = Math.max(report.fixes.lossOrdersTotal ?? 0, report.fixes.lossOrders.length)
  const levels: Array<{ samples: number; sampleLen: number; note: number; list: number; r5: number; notices: number; loss: number; ids: number }> = [
    { samples: 3, sampleLen: 200, note: 500, list: 20, r5: 7, notices: 10, loss: 20, ids: 1000 },
    { samples: 1, sampleLen: 120, note: 200, list: 5, r5: 3, notices: 3, loss: 5, ids: 1000 },
    { samples: 0, sampleLen: 0, note: 80, list: 0, r5: 0, notices: 0, loss: 0, ids: 300 },
  ]
  let value = JSON.stringify(report)
  if (utf8Bytes(value) <= maxBytes) return { value, level: 0 }
  for (let i = 0; i < levels.length; i++) {
    const L = levels[i]
    const slim: T = {
      ...report,
      items: report.items.map((it) => ({ ...it, samples: it.samples.slice(0, L.samples).map((x) => clip(x, L.sampleLen)), ...(it.note ? { note: clip(it.note, L.note) } : {}) })),
      unlinked: {
        ...report.unlinked,
        external: report.unlinked.external.slice(0, L.list),
        legacy: report.unlinked.legacy.slice(0, L.list),
        ...(report.unlinked.externalIds ? { externalIds: report.unlinked.externalIds.slice(0, L.ids) } : {}),
      },
      r5: L.r5 ? report.r5.slice(-L.r5) : [],
      notices: report.notices.slice(0, L.notices).map((x) => clip(x, 200)),
      fixes: { ...report.fixes, lossOrders: report.fixes.lossOrders.slice(0, L.loss), lossOrdersTotal: total },
      truncated: i + 1,
    }
    value = JSON.stringify(slim)
    if (utf8Bytes(value) <= maxBytes || i === levels.length - 1) return { value, level: i + 1 }
  }
  return { value, level: levels.length }
}

// ───────────────────────── 北京时间的日子 ─────────────────────────

/** 北京时间的日期串（YYYY-MM-DD）；容器 TZ 不可靠（交接文档六·4），一律按 UTC+8 自己算 */
export function bjDate(d: Date): string {
  return new Date(d.getTime() + 8 * 3600_000).toISOString().slice(0, 10)
}

/** 北京时间当天 00:00 对应的 UTC 时刻 */
export function bjDayStart(d: Date): Date {
  const s = bjDate(d)
  return new Date(Date.parse(`${s}T00:00:00.000Z`) - 8 * 3600_000)
}

/** 日报该不该发：报告是 day 那一天的，现在是 day 之后那一天的北京 09:00 之后（再晚一天就不发了，过期的日报没有意义） */
export function dailyDue(day: string, now: Date): 'WAIT' | 'SEND' | 'STALE' {
  const next = new Date(Date.parse(`${day}T00:00:00.000Z`) + 86400_000).toISOString().slice(0, 10)
  const today = bjDate(now)
  if (today < next) return 'WAIT'
  if (today > next) return 'STALE'
  const bjHour = new Date(now.getTime() + 8 * 3600_000).getUTCHours()
  return bjHour >= 9 ? 'SEND' : 'WAIT'
}

// ───────────────────────── 日报（sms.daily，§7.7、§9.5 的日报示例） ─────────────────────────

export interface DailyData {
  /** 北京日期 YYYY-MM-DD */
  day: string
  paid: { ALIPAY: number; BALANCE: number; MIXED: number }
  /** 当天付款的单里收到码的单数 */
  received: number
  finance: {
    finalized: number
    revenueCents: number
    chargedMicro: number
    costCents: number
    refundOffsetCents: number
    profitCents: number
    cancelled: { count: number; topupCents: number; cashCents: number }
    lossCents: number
  }
  /** 当天售后退款的单数 */
  afterSale: number
  upstreamBalanceMicro: number | null
  /** 对账不一致的项数（I + R 系列）、MANUAL 单数、外部激活数 */
  anomalies: { recon: number; manual: number; external: number }
  /** 知会（§10.1）：只标记、不限制 */
  notices: string[]
  /**
   * 当天（北京）对账写下的修正（sms_events 的 RECON 事件，S4 评审修复）：R1 / R6 改的是**原来定稿 / 取消那天**的单，
   * 那几天的日报早发了，这里按「修正发生的那天」单列，Σ 日报才对得上 Σ profitCents / lossCents（§9.5）。
   * costDeltaCents / lossDeltaCents 是修正前后的差（正 = 多计），refundBackCents 是 R6「上游事后退款冲回」按快照汇率折算的分；
   * unknown = 没带前后值的旧事件（只计条数）。
   */
  recon?: { fixes: number; r1: number; r6: number; costDeltaCents: number; refundBackCents: number; lossDeltaCents: number; unknown: number }
}

/** 一条 RECON 事件的 detail 里修正前后的成本数字（applyFix 写） */
export interface ReconMoneySnap {
  state: string
  costCents: number | null
  lossCents: number | null
}

/** 把当天的 RECON 事件汇总成日报的「对账修正」（纯函数；detail 是 sms_events.detail 原文） */
export function summarizeReconEvents(details: ReadonlyArray<string | null>): NonNullable<DailyData['recon']> {
  const out = { fixes: 0, r1: 0, r6: 0, costDeltaCents: 0, refundBackCents: 0, lossDeltaCents: 0, unknown: 0 }
  for (const d of details) {
    out.fixes++
    type Ev = { rule?: string; before?: ReconMoneySnap | null; after?: ReconMoneySnap | null }
    let x: Ev | null = null
    try {
      x = d ? (JSON.parse(d) as Ev) : null
    } catch {
      x = null
    }
    if (x?.rule === 'R1') out.r1++
    else if (x?.rule === 'R6') out.r6++
    const b = x?.before
    const a = x?.after
    if (!b || !a) {
      out.unknown++
      continue
    }
    const dc = (a.costCents ?? 0) - (b.costCents ?? 0)
    out.costDeltaCents += dc
    if (x?.rule === 'R6' && dc < 0) out.refundBackCents += -dc
    out.lossDeltaCents += (a.lossCents ?? 0) - (b.lossCents ?? 0)
  }
  return out
}

export function usd2(micro: number): string {
  return `$${(Math.round(micro / 10_000) / 100).toFixed(2)}`
}
export function usd4(micro: number): string {
  const neg = micro < 0
  const a = Math.abs(micro)
  const unit = Math.floor(a / 100)
  return `${neg ? '-' : ''}$${Math.floor(unit / 10000)}.${String(unit % 10000).padStart(4, '0')}`
}

/**
 * 日报的文字（§9.5 示例）。「真实成本」一律是 Σ costCents（逐单按下单时的成本汇率向上取整），**不出现乘号**；
 * 已取消单只计单数与退回金额，不进营收、成本、毛利。第一行是标题（MM-DD 接码日报）。
 */
export function dailyLines(d: DailyData): string[] {
  const paidTotal = d.paid.ALIPAY + d.paid.BALANCE + d.paid.MIXED
  const f = d.finance
  const rate = paidTotal ? `${Math.round((d.received / paidTotal) * 100)}%` : '—'
  const lines = [
    `${d.day.slice(5)} 接码日报`,
    `付款 ${paidTotal} 单（支付宝 ${d.paid.ALIPAY} · 余额付清 ${d.paid.BALANCE} · 组合 ${d.paid.MIXED}）· 收码 ${d.received} 单（收码率 ${rate}）`,
    `完成 ${f.finalized} 单：营收 ${fmtCents(f.revenueCents)}；实际扣费 ${usd2(f.chargedMicro)}；真实成本 ${fmtCents(f.costCents)}（逐单按下单时的成本汇率向上取整）；毛利 ${fmtCents(f.profitCents)}`,
    `已取消 ${f.cancelled.count} 单：退回余额 ${fmtCents(f.cancelled.topupCents + f.cancelled.cashCents)}（充值余额 ${fmtCents(f.cancelled.topupCents)} · 返现余额 ${fmtCents(f.cancelled.cashCents)}），不计成本利润`,
    `售后退款 ${d.afterSale} 单${f.refundOffsetCents ? `（冲减营收 ${fmtCents(f.refundOffsetCents)}）` : ''} · 亏损 ${fmtCents(f.lossCents)} · 上游余额 ${d.upstreamBalanceMicro == null ? '未知' : usd2(d.upstreamBalanceMicro)}`,
    `异常：对账不一致 ${d.anomalies.recon} 项 · 转人工 ${d.anomalies.manual} 单 · 外部激活 ${d.anomalies.external} 个`,
  ]
  const rc = d.recon
  if (rc && rc.fixes > 0) {
    const sign = (c: number) => (c > 0 ? `+${fmtCents(c)}` : c < 0 ? `−${fmtCents(-c)}` : fmtCents(0))
    lines.push(
      `对账修正 ${rc.fixes} 条（R1 ${rc.r1} · R6 ${rc.r6}）：成本 ${sign(rc.costDeltaCents)}（其中上游事后退款冲回 ${fmtCents(rc.refundBackCents)}）· 亏损 ${sign(rc.lossDeltaCents)}` +
        `${rc.unknown ? `（${rc.unknown} 条没有前后值）` : ''}；改在原来定稿 / 取消那天的单上，不在上面的完成 / 亏损数里`,
    )
  }
  for (const n of d.notices) lines.push(`知会：${n}`)
  return lines
}

/** 企业微信 markdown 最多 4096 字节，整条超了会被拒（日报已标记「已推」，不会重推）：推送行按字节预算截断 */
export const DAILY_PUSH_MAX_BYTES = 3400
/** 推送里最多列几条知会（全部知会在后台「短信接码 → 对账」） */
export const DAILY_PUSH_MAX_NOTICES = 5

/**
 * 日报的推送行：第一行是标题（extraTitle），其余每行一条；知会行去掉「知会：」前缀、标签写「知会」。
 * 知会最多列 DAILY_PUSH_MAX_NOTICES 条、且整体不超过 DAILY_PUSH_MAX_BYTES 字节，其余合并成一行「另有 N 条」（S4 评审修复）。
 */
export function dailyNotifyRows(lines: readonly string[], maxBytes: number = DAILY_PUSH_MAX_BYTES): Array<{ label: string; value: string }> {
  const labels = ['付款', '完成', '已取消', '售后', '异常']
  const rowBytes = (r: { label: string; value: string }) => utf8Bytes(`**${r.label}**：${r.value}
`)
  const base: Array<{ label: string; value: string }> = []
  const notices: string[] = []
  lines.slice(1).forEach((l, i) => {
    if (l.startsWith('知会：')) notices.push(l.slice(3))
    else base.push({ label: l.startsWith('对账修正') ? '修正' : i < labels.length ? labels[i] : '说明', value: l.length > 400 ? `${l.slice(0, 400)}…` : l })
  })
  const out = [...base]
  let used = out.reduce((a, r) => a + rowBytes(r), 0)
  const tailReserve = 120 // 「另有 N 条」那一行
  let shown = 0
  for (const n of notices) {
    const r = { label: '知会', value: n.length > 200 ? `${n.slice(0, 200)}…` : n }
    if (shown >= DAILY_PUSH_MAX_NOTICES || used + rowBytes(r) + tailReserve > maxBytes) break
    out.push(r)
    used += rowBytes(r)
    shown++
  }
  if (shown < notices.length) out.push({ label: '知会', value: `另有 ${notices.length - shown} 条，见后台「短信接码 → 对账」` })
  return out
}
