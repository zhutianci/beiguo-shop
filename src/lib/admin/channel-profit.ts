/**
 * 渠道单在主站后台「订单管理」里的站长利润（二期改动第 2 节 M2）。列表、筛选汇总、详情三处共用这一个纯函数，
 * 免得三处各算一遍、口径漂移。只给超管用：渠道层（partner-*）不得 import —— 这里有站长成本。
 *
 * 口径（逐单，全部是分）：
 *   A  = toCents(order.amount)                        渠道售价（不含税）
 *   RG = refundedGoodsCents ?? 0                      累计退给买家的货款
 *   Rg = settleRefundedCents ?? 0                     其中渠道分担的部分（站长承担时不累加，ledger.applyRefund）
 *   P  = mulDivRound(supplyCents, A − min(Rg, A), A)  进货净额；与账本 remainingByComponent 的 PURCHASE 同一公式，
 *                                                     对账 L5 保证两者一致；未计提（NULL / MISSING）也按快照算
 *   G  = P + L − (RG − Rg)                            站长所得货款：加渠道承担的损失 LOSS，减站长承担、退给买家的货款
 *   C  = Σ USED 卡 cost（发卡单）| SmsActivation.cost（接码单）| null（人工交付 / 没有成本数据）
 *        AUTO 单全部退掉、一张卡没发 → C = 0（成本确定为 0，不算未登记；否则站长承担的退款亏损会被藏掉）
 *   利润 = G − C；C 为 null → 利润 null（页面显示「进货 ¥x · 成本未登记」，不能显示成 0 或等于进货价）
 *
 * 【EXCLUDED（成员自买）与契约字面的偏差】契约写的是 P = A − RG，G 仍套 P + L − (RG − Rg)。
 * 但 A − RG 已经扣掉了**全部**退给买家的货款：站长承担（Rg 不累加）时再减 (RG − Rg) 会把同一笔退款扣两次；
 * 而 EXCLUDED 单从不计提、账本里没有它的分录，渠道承担的 LOSS 也不会真的记到渠道头上，加上去是虚增。
 * 所以 EXCLUDED 单 G = P = A − RG（站长全收、退多少少多少），L 与 RG − Rg 都不再参与。
 *
 * 【为什么不查账本】账本只对已计提的单有分录；按订单列算，未计提 / MISSING 的单也有数，且一次批量查询就够。
 * 手续费、发票分成利润**不计入**这一列（站长原话只说「进货价 − 成本」），详情页另列供参考。
 *
 * 纯函数，只 import tenant/math（同样是纯函数）：itest 可以直接喂数断言。
 */
import { mulDivRound } from '../tenant/math'

/** 订单侧输入：全部取自 Order 列 */
export interface ChannelProfitOrder {
  /** A = toCents(order.amount) */
  amountCents: number
  supplyCents: number | null
  settleState: string | null
  refundedGoodsCents: number | null
  settleRefundedCents: number | null
  settleLossCents: number | null
}

/** 成本侧输入 */
export interface ChannelCostInput {
  /** 该单 status=USED 的卡密的 cost（元；Decimal / 字符串 / 数字 / null 都行）。没有卡 = 空数组 */
  cardCosts: readonly unknown[]
  /** SmsActivation.cost（元；一单最多一条，orderId 唯一）。没有接码记录 = null / undefined */
  smsCost?: unknown
  /** 商品当前的发货方式：AUTO 单用来判断「还有件没发卡」 */
  deliveryType?: string | null
  /** 还应发出的件数 = quantity − refundedQty；AUTO 单已发卡数少于它时，成本只含已发的卡 */
  expectQty?: number
}

export type ChannelCostSource = 'CARD' | 'SMS'

export interface ChannelProfit {
  /** P 进货净额（已扣渠道分担的退款） */
  supplyNetCents: number
  /** L 渠道承担、付给站长的损失（EXCLUDED 时 0，理由见文件头） */
  lossCents: number
  /** RG − Rg 站长承担、退给买家的货款（EXCLUDED 时 0：已并进 P） */
  platformRefundCents: number
  /** G 站长所得货款 = P + L − (RG − Rg) */
  ownerGoodsCents: number
  /**
   * 成员自买（settleState=EXCLUDED）：不给渠道分钱，P 是站长全收的售价（已扣退款），不是「进货净额」。
   * 页面据此换文案（「站长全收」而不是「进货」），免得把 A − RG 解释成「扣除渠道分担的退款后的进货净额」
   */
  excluded: boolean
  /** C 成本；null = 没有成本数据（人工交付、尚未发卡、接码没回成本） */
  costCents: number | null
  costSource: ChannelCostSource | null
  /** 有卡 cost 为 0 / null：按 0 计，但要提示「部分卡密成本未录入」 */
  costUnknown: boolean
  /** AUTO 单还没发卡的件数（> 0 时成本只含已发的卡） */
  pendingCards: number
  /** G − C；C 为 null 时 null */
  profitCents: number | null
}

/**
 * 接码记录实际付给上游的号费（元）：取消 / 超时 / 取号失败的号上游不收费或已退回，按 0 计。
 * 否则这些单的利润被整份号费压低、甚至为负（上线前复核 2026-09-26）。列表与详情共用。
 */
export const SMS_UNCHARGED_STATUSES: ReadonlySet<string> = new Set(['CANCELLED', 'TIMEOUT', 'FAILED'])
export function smsChargedCost(cost: unknown, status: string | null | undefined): unknown {
  return status && SMS_UNCHARGED_STATUSES.has(status) ? 0 : cost
}

/** Decimal / 字符串 / 数字（元）→ 分；空值或非有限数 → null */
export function yuanToCentsOrNull(v: unknown): number | null {
  if (v == null) return null
  const n = Number(typeof v === 'object' ? String(v) : v)
  return Number.isFinite(n) ? Math.round(n * 100) : null
}

const nn = (v: number | null | undefined): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.trunc(v) : 0)

/**
 * 按订单列算 P / L / RG−Rg / G。supplyCents 缺失或金额非法（历史脏数据）→ null，调用方显示「—」而不是编一个数。
 */
export function channelGoods(o: ChannelProfitOrder): Pick<ChannelProfit, 'supplyNetCents' | 'lossCents' | 'platformRefundCents' | 'ownerGoodsCents' | 'excluded'> | null {
  const A = o.amountCents
  const S = o.supplyCents
  if (!Number.isSafeInteger(A) || A <= 0) return null
  if (S == null || !Number.isSafeInteger(S) || S < 0) return null
  const RG = Math.min(nn(o.refundedGoodsCents), A)
  const Rg = Math.min(nn(o.settleRefundedCents), A)
  if (o.settleState === 'EXCLUDED') {
    const P = A - RG
    return { supplyNetCents: P, lossCents: 0, platformRefundCents: 0, ownerGoodsCents: P, excluded: true }
  }
  const P = mulDivRound(S, A - Rg, A)
  const L = nn(o.settleLossCents)
  // RG ≥ Rg 恒成立（Rg 是 RG 里渠道分担的那部分）；防御脏数据取非负
  const PR = Math.max(0, RG - Rg)
  return { supplyNetCents: P, lossCents: L, platformRefundCents: PR, ownerGoodsCents: P + L - PR, excluded: false }
}

/**
 * 成本 C。有卡就按卡（与卡密分析同源）；没有卡再看接码记录；都没有 → null。
 * 不只看 deliveryType：商品事后改过发货方式时，已经发出的卡 / 接码记录才是这单真实的成本来源。
 */
export function channelCost(c: ChannelCostInput): Pick<ChannelProfit, 'costCents' | 'costSource' | 'costUnknown' | 'pendingCards'> {
  if (c.cardCosts.length > 0) {
    let sum = 0
    let unknown = false
    for (const v of c.cardCosts) {
      const cents = yuanToCentsOrNull(v)
      // 与 supply-pricing.costBasisCents 同一判定：cost ≤ 0 视为未录入（历史卡回填的是 0）
      if (cents == null || cents <= 0) unknown = true
      else sum += cents
    }
    const expect = Math.max(0, Math.trunc(c.expectQty ?? 0))
    const pending = c.deliveryType === 'AUTO' ? Math.max(0, expect - c.cardCosts.length) : 0
    return { costCents: sum, costSource: 'CARD', costUnknown: unknown, pendingCards: pending }
  }
  const sms = yuanToCentsOrNull(c.smsCost)
  if (sms != null && sms >= 0) return { costCents: sms, costSource: 'SMS', costUnknown: false, pendingCards: 0 }
  // AUTO 单一张卡没发、而且已经没有要发的件（全部退掉）：成本**确定是 0**，不是「未登记」。
  // 否则站长承担的全额退款（G 为负）会被「成本未登记」吞掉：列表显示成进货价、汇总里也不计这笔亏损。
  // 只认调用方明确给了 expectQty（≤ 0）；没传时不猜，仍按未登记处理。
  if (c.deliveryType === 'AUTO' && c.expectQty != null && Math.trunc(c.expectQty) <= 0) {
    return { costCents: 0, costSource: 'CARD', costUnknown: false, pendingCards: 0 }
  }
  const expect = Math.max(0, Math.trunc(c.expectQty ?? 0))
  return { costCents: null, costSource: null, costUnknown: false, pendingCards: c.deliveryType === 'AUTO' ? expect : 0 }
}

/** 一单的完整利润。订单侧算不出（缺快照）→ null */
export function channelProfit(o: ChannelProfitOrder, c: ChannelCostInput): ChannelProfit | null {
  const g = channelGoods(o)
  if (!g) return null
  // 货款已全额退（RG ≥ A）就没有待发的件了：历史 / 人工退款可能没回填 refundedQty，expectQty 会仍等于 quantity，
  // 那样「全退且没发卡」的单会被误判成「尚未发卡、成本未登记」。这里以货款为准把 expectQty 归零。
  const fullyRefunded = nn(o.refundedGoodsCents) >= o.amountCents
  const cost = channelCost(fullyRefunded && c.expectQty != null ? { ...c, expectQty: 0 } : c)
  return { ...g, ...cost, profitCents: cost.costCents == null ? null : g.ownerGoodsCents - cost.costCents }
}

const yuan = (cents: number) => `¥${(cents / 100).toFixed(2)}`

/**
 * 利润列的悬停提示（列表与详情同一套文案）。口径写在第一行，其余是这单的扣减明细与成本缺口。
 */
export function channelProfitHint(p: ChannelProfit): string {
  const lines = ['渠道单利润 = 进货净额（扣除退款）− 成本；手续费、发票利润不计入']
  // 成员自买：没有「进货」这回事，P = 售价 − 退给买家的货款，全归站长；换一行说清，别写成「进货净额」
  if (p.excluded) lines.push(`成员自买：不给渠道分钱，站长全收 ${yuan(p.supplyNetCents)}（已扣退款）`)
  else lines.push(`进货净额 ${yuan(p.supplyNetCents)}`)
  if (p.lossCents > 0) lines.push(`+ 渠道承担损失 ${yuan(p.lossCents)}`)
  if (p.platformRefundCents > 0) lines.push(`− 站长承担的退款 ${yuan(p.platformRefundCents)}`)
  if (p.costCents == null) lines.push(p.pendingCards > 0 ? '尚未发卡，成本未登记' : '成本未登记（人工交付或无成本数据）')
  else lines.push(`− 成本 ${yuan(p.costCents)}${p.costSource === 'SMS' ? '（接码）' : ''}`)
  if (p.costUnknown) lines.push('部分卡密成本未录入，按 0 计')
  if (p.pendingCards > 0 && p.costCents != null) lines.push(`尚有 ${p.pendingCards} 件未发卡，成本只含已发的卡`)
  return lines.join('\n')
}
