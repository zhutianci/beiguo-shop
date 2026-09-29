/**
 * 短信接码 · 状态机的纯函数与常量（docs/短信接码-设计.md 第 2 章、§3、§4.6、D42、D43、§2.4）。
 *
 * 【零依赖】不 import prisma、不 import 上游客户端；scripts/check-jiema-engine.ts 直接断言。
 * 引擎（engine.ts / refund.ts / claim.ts / holds.ts）只在这里取常量与判定，免得同一个阈值在几处各写一遍。
 * 金额一律整数（微美元 / 分 / 系数 ×10000）；时间一律 Date（应用写的时刻，§5.1「用于比较大小的时间字段一律由应用写」）。
 */
import { realCostCents, effCapMicro } from './pricing'

// ───────────────────────── 状态 ─────────────────────────

export type SmsOrderState =
  | 'PENDING_PAY'
  | 'CLOSED'
  | 'READY'
  | 'ACQUIRING'
  | 'WAITING'
  | 'REPLACING'
  | 'CANCELLING'
  | 'RECEIVED'
  | 'FINISHED'
  | 'REFUNDING'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'MANUAL'

export type AttemptState = 'REQUESTING' | 'ACTIVE' | 'RECEIVED' | 'RELEASING' | 'CANCELLED' | 'FINISHED' | 'FAILED' | 'UNKNOWN'

/** 订单终态（§2.1 表格「是否终态」） */
export const ORDER_TERMINAL: ReadonlySet<string> = new Set(['CLOSED', 'FINISHED', 'CANCELLED', 'REFUNDED'])
/** 「进行中」：D27 同时进行中 ≤3 计数用（余额已预扣、等支付宝的待支付单也算；MANUAL 不算，免得一张人工单把买家锁死） */
export const ORDER_ACTIVE_FOR_LIMIT: readonly string[] = Object.freeze(['PENDING_PAY', 'READY', 'ACQUIRING', 'WAITING', 'REPLACING', 'CANCELLING', 'REFUNDING', 'RECEIVED'])

/** 尝试终态（§2.2）：FAILED / CANCELLED / FINISHED。RECEIVED 不是终态（号码还开着，要等 finish） */
export const ATTEMPT_TERMINAL: ReadonlySet<string> = new Set(['CANCELLED', 'FINISHED', 'FAILED'])
/** 在途取号：同一张单同一时刻最多一个（§2.2、I6） */
export const ATTEMPT_ACQ_INFLIGHT: ReadonlySet<string> = new Set(['REQUESTING', 'UNKNOWN'])
/** 占着上游线程的号码（含在途取号）：maxActiveNumbers、线程受限的余量都按它数 */
export const ATTEMPT_LIVE: readonly string[] = Object.freeze(['REQUESTING', 'UNKNOWN', 'ACTIVE', 'RECEIVED', 'RELEASING'])

export const isOrderTerminal = (s: string) => ORDER_TERMINAL.has(s)
export const isAttemptTerminal = (s: string) => ATTEMPT_TERMINAL.has(s)

// ───────────────────────── 时间常量（§2、§3、§6.5） ─────────────────────────

/** 可取消时刻 = 我方收到响应 + 120 秒 + 3 秒余量（附录 B 第 12 条：不用上游 activationTime） */
export const CAN_CANCEL_SEC = 123
/** 没码的号在到期前 45 秒主动取消（D42） */
export const WAIT_LEAD_SEC = 45
/** 收码的号在到期前 30 秒主动完成（D42） */
export const FINISH_LEAD_SEC = 30
/** 例外时长判定：这个号的有效期 > 21 分钟（D42、T12） */
export const LONG_NUMBER_MIN = 21
/** 例外时长组合在 longWaitOk=false 时取号后 19 分钟主动取消 */
export const LONG_WAIT_MIN = 19
/** activationEndTime 无效时的兜底有效期：响应 + 20 分钟 − 30 秒（E16） */
export const FALLBACK_DURATION_SEC = 20 * 60 - 30
/** REQUESTING 超过 60 秒 → UNKNOWN（§2.4） */
export const REQUESTING_STUCK_SEC = 60
/** UNKNOWN 超过 10 分钟没解开 → MANUAL（§2.1） */
export const UNKNOWN_MANUAL_SEC = 600
/** 确认没买到：距发起请求超过 180 秒且连续两轮有效扫描都没有候选（§2.4） */
export const NOT_BOUGHT_AFTER_SEC = 180
export const NOT_BOUGHT_EMPTY_SCANS = 2
/** 「连续两轮有效扫描」的两轮之间至少隔多久（一个 tick 周期；tick 与号码页轮询不到 1 秒各扫一次不算两轮，S2a 评审修复） */
export const NOT_BOUGHT_SCAN_GAP_SEC = 5
/** 没有校准样本时，认领时间窗两头各再放宽多少（上游与我方的时钟偏差没法校准；只会多出候选、导向 MANUAL，S2a 评审修复） */
export const CLAIM_UNCALIBRATED_SLACK_MS = 60_000
/** ACQUIRING 被停售 / 熔断 / 拒绝挡住满 90 秒 → 退回余额（E58、E59、T9） */
export const BLOCKED_REFUND_SEC = 90
/** 过了 endsAt 60 分钟仍确认不了 → 按「上游已自动退款」推定 CANCELLED（E20） */
export const ASSUMED_AFTER_END_SEC = 60 * 60
/** finish 一直拿不到确定结果：endsAt + 60 秒后按 history 收尾（T14） */
export const FINISH_HISTORY_AFTER_END_SEC = 60
/** READY 超过 24 小时不操作 → 退回余额（T6） */
export const READY_EXPIRE_SEC = 24 * 3600
/** T4 ①：一张收款单都没有过、锁价到期 + 60 秒 → 关单 */
export const QUOTE_NO_VMQ_CLOSE_SEC = 60
/** T4 ②：有过收款单、锁价到期 + 20 分钟、没有 0/1 收款单 → 关单兜底 */
export const QUOTE_VMQ_CLOSE_SEC = 20 * 60
/** T2：READY 的两个条件（判定本身在零依赖的 lib/jiema-paid.ts，vmq.ts 与这里共用） */
export { LATE_READY_AFTER_QUOTE_SEC, LATE_READY_RECON_SEC, paidTarget } from '../jiema-paid'
/** T19：余额付清单建单超过 30 秒还停在 PENDING_PAY → 补调 fulfillOrder；连续失败 5 次 → MANUAL */
export const T19_AFTER_SEC = 30
export const T19_MANUAL_FAILS = 5
/** T15：连续失败 10 次推 sms.refund_failed */
export const T15_ALERT_FAILS = 10
/** MANUAL 超过 24 小时没人处理再推一次（之后每 24 小时一次，T17） */
export const MANUAL_REALERT_SEC = 24 * 3600
/** 首次取号的重试间隔：第 1 次 0 秒、第 2 次 20 秒、第 3 次 45 秒（E1），之后每 25 秒 */
export const ACQUIRE_DELAYS_SEC: readonly number[] = Object.freeze([0, 20, 45])
/** E58：请求被拒（认不出的 4xx、1020、没发出去）后全局退避 10–15 秒再试，不占首次取号的次数 */
export const REJECTED_BACKOFF_SEC = 12
/** 买家 GET 的惰性推进：距上次 ≥3 秒（CAS advancedAt，§6.5） */
export const LAZY_ADVANCE_SEC = 3
/** 买家页对当前号码 getStatus 单查：≥4 秒（CAS checkedAt，D10） */
export const STATUS_CHECK_SEC = 4
/** 查 history 的最小间隔（没有信息时按退避，至少 10 秒） */
export const HISTORY_CHECK_SEC = 10
/** REPLACING / CANCELLING 超过 60 秒没动静 → 恢复逻辑（§6.5） */
export const STUCK_MID_SEC = 60
/** 放号 / 完成的调用占位（CAS nextCheckAt）：拿到占位的进程在这段时间内独占这次调用 */
export const CALL_LEASE_SEC = 30
/** 线程受限每天 21:00 UTC 重置（E5） */
export const THREADS_RESET_UTC_HOUR = 21
/** 心跳超过 3 分钟 → 告警（E19） */
export const HEARTBEAT_STALE_SEC = 180

const S = 1000

// ───────────────────────── 号码的时间点（E16、D42、T12） ─────────────────────────

/**
 * 我方计时器 = 上游 activationEndTime；格式无效，或不在 [响应 + 5 分钟, 响应 + 3 小时] 内时，用「响应 + 20 分钟 − 30 秒」（E16）。
 */
export function endsAtFrom(activationEndTime: Date | null | undefined, respondedAt: Date): Date {
  const r = respondedAt.getTime()
  if (activationEndTime instanceof Date && Number.isFinite(activationEndTime.getTime())) {
    const e = activationEndTime.getTime()
    if (e >= r + 5 * 60 * S && e <= r + 3 * 3600 * S) return new Date(e)
  }
  return new Date(r + FALLBACK_DURATION_SEC * S)
}

/** 可取消时刻：响应 + 123 秒（认领时 = 认领时刻 + 123 秒，保守） */
export function canCancelAtFrom(at: Date): Date {
  return new Date(at.getTime() + CAN_CANCEL_SEC * S)
}

/** 这个号是不是例外时长（有效期 > 21 分钟；只看取号返回的有效期，不查 custom-durations 缓存，D42） */
export function isLongNumber(startAt: Date, endsAt: Date): boolean {
  return endsAt.getTime() - startAt.getTime() > LONG_NUMBER_MIN * 60 * S
}

/**
 * 没码时我方主动取消的时刻（T12）：普通号 = max(canCancelAt, endsAt − 45 秒)；
 * 例外时长的号（有效期 > 21 分钟）且本单快照 longWaitOk=false = max(canCancelAt, 取号响应 + 19 分钟)。
 */
export function waitUntilFor(p: { startAt: Date; canCancelAt: Date; endsAt: Date; longWaitOk: boolean }): Date {
  const cc = p.canCancelAt.getTime()
  if (isLongNumber(p.startAt, p.endsAt) && !p.longWaitOk) return new Date(Math.max(cc, p.startAt.getTime() + LONG_WAIT_MIN * 60 * S))
  return new Date(Math.max(cc, p.endsAt.getTime() - WAIT_LEAD_SEC * S))
}

/** 收码的号到期前 30 秒由系统完成（T14） */
export function finishDueAt(endsAt: Date): Date {
  return new Date(endsAt.getTime() - FINISH_LEAD_SEC * S)
}

/** 线程受限的解除时刻：下一个 21:00 UTC（严格晚于 now，E5） */
export function nextThreadsReset(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), THREADS_RESET_UTC_HOUR, 0, 0, 0))
  if (d.getTime() <= now.getTime()) d.setUTCDate(d.getUTCDate() + 1)
  return d
}

/** 首次取号第 n 次（从 0 起，n = 已经算数的失败次数）最早什么时候能发起：以第一次取号的请求时刻为基准 */
export function acquireDelaySec(countedTries: number): number {
  if (countedTries < ACQUIRE_DELAYS_SEC.length) return ACQUIRE_DELAYS_SEC[countedTries]
  return ACQUIRE_DELAYS_SEC[ACQUIRE_DELAYS_SEC.length - 1] + 25 * (countedTries - ACQUIRE_DELAYS_SEC.length + 1)
}

/** 第 n 次首次取号用哪个运营商：买家指定了运营商、并且允许改任意的，第 2 次起（或上一次撞了 WRONG_MAX_PRICE）改任意（E1、E2、E35） */
export function operatorForTry(p: { operator: string | null; fallback: boolean; countedTries: number; hadPriceMissWithOperator: boolean }): string | null {
  if (!p.operator) return null
  if (p.fallback && (p.countedTries >= 1 || p.hadPriceMissWithOperator)) return null
  return p.operator
}

// ───────────────────────── 成本与利润（§4.6、D39、T20） ─────────────────────────

export interface CostAttemptLike {
  state: string
  charged: boolean
  costMicro: number | null
  maxPriceMicro: number
  upstreamRefundMicro: number | null
}

export interface SettleResult {
  chargedMicro: number | null
  costCents: number | null
  profitCents: number | null
  lossCents: number | null
  /** FINISHED / REFUNDED 且所有尝试都终态 */
  costFinal: boolean
}

/**
 * 成本核算（T20，纯函数，可重算：同样的输入得同样的结果）：
 *  · 订单 CANCELLED → 成本、利润、扣费一律 null（不计）；有 charged 尝试（E55 / 对账翻案）的另算 lossCents；
 *  · 否则 chargedMicro = Σ charged 尝试的 costMicro − Σ upstreamRefundMicro（换号途中被取消的号不计）；
 *    costCents = ⌈chargedMicro × costFx4 ÷ 10⁸⌉（快照里的成本汇率）；profitCents = 售价 − 成本（售后退款 REFUNDED = −成本）；
 *  · FINISHED / REFUNDED 且所有尝试都终态 → costFinal=true（定稿），否则 false（预估）。
 * charged 的尝试没有 costMicro（文本形态的取号响应拿不到成本）按它的上限 maxPriceMicro 计：利润宁低勿高。
 */
export function settleCost(order: { state: string; priceCents: number; costFx4: number }, attempts: readonly CostAttemptLike[]): SettleResult {
  const chargedSum = attempts.reduce((s, a) => (a.charged ? s + (a.costMicro ?? a.maxPriceMicro) : s), 0)
  if (order.state === 'CANCELLED') {
    return { chargedMicro: null, costCents: null, profitCents: null, lossCents: chargedSum > 0 ? realCostCents(chargedSum, order.costFx4) : null, costFinal: false }
  }
  const refunded = attempts.reduce((s, a) => s + (a.upstreamRefundMicro ?? 0), 0)
  const chargedMicro = Math.max(0, chargedSum - refunded)
  const costCents = realCostCents(chargedMicro, order.costFx4)
  const profitCents = order.state === 'REFUNDED' ? -costCents : order.priceCents - costCents
  const allTerminal = attempts.every((a) => isAttemptTerminal(a.state))
  return { chargedMicro, costCents, profitCents, lossCents: null, costFinal: (order.state === 'FINISHED' || order.state === 'REFUNDED') && allTerminal }
}

// ───────────────────────── 防封号：本站口径与上游口径（D43、§10.1） ─────────────────────────

export interface AutoHoldParams {
  zero: { minAttempts: number; windowH: number }
  ratio: { minAttempts: number; minRatePct: number; windowH: number }
  upstreamCombo: { minCount: number; minRatePct: number }
  upstreamAccount: { minCount: number; minRatePct: number }
  holdH: number
}

/**
 * 本站口径（纯函数）：一个组合近 24 小时「取到号并已有结论」的号码数 count 与其中收到码的 success。
 * ≥ zero.minAttempts 个号且 0 收码 → ZERO；≥ ratio.minAttempts 个号且收码率 < ratio.minRatePct% → RATIO；否则 null。
 */
export function localComboVerdict(count: number, success: number, p: Pick<AutoHoldParams, 'zero' | 'ratio'>): 'ZERO' | 'RATIO' | null {
  if (count >= p.zero.minAttempts && success === 0) return 'ZERO'
  if (count >= p.ratio.minAttempts && success * 100 < p.ratio.minRatePct * count) return 'RATIO'
  return null
}

/** 上游口径：组合 ≥ minCount 个号且成功率 < minRatePct% → 停售并预警（接近上游「≥100、<6%」的封禁线） */
export function upstreamComboVerdict(count: number, success: number, p: Pick<AutoHoldParams, 'upstreamCombo'>): boolean {
  return count >= p.upstreamCombo.minCount && success * 100 < p.upstreamCombo.minRatePct * count
}

/** 上游口径：账户整体 ≥ minCount 个号且成功率 < minRatePct% → 收紧换号次数并推送（接近「≥500、<3%」的限线程线） */
export function upstreamAccountVerdict(count: number, success: number, p: Pick<AutoHoldParams, 'upstreamAccount'>): boolean {
  return count >= p.upstreamAccount.minCount && success * 100 < p.upstreamAccount.minRatePct * count
}

/** 账户整体接近限线程线时，新单的免费换号次数收紧到 2 次（§10.1） */
export const TIGHT_MAX_REPLACE = 2

// ───────────────────────── 线程受限（E5） ─────────────────────────

/** 线程受限记录里的上限：max_allowed > 0 用它；否则用 current_threads（规格示例 max_allowed = −1）；都没有 = 0（不收单，直到重置） */
export function threadsLimitOf(note: { maxAllowed: number | null; currentThreads: number | null } | null): number {
  if (!note) return 0
  if (note.maxAllowed != null && note.maxAllowed > 0) return note.maxAllowed
  if (note.currentThreads != null && note.currentThreads > 0) return note.currentThreads
  return 0
}

/** 线程受限时还能不能再占一个线程：上游在用 + 我方在途取号 < 上限 − 给旧单品留的线程数 */
export function threadsRoom(p: { limit: number; upstreamInUse: number; ourAcquiring: number; legacyReserve: number }): boolean {
  return p.upstreamInUse + p.ourAcquiring < p.limit - p.legacyReserve
}

export function parseThreadsNote(note: string | null | undefined): { maxAllowed: number | null; currentThreads: number | null } | null {
  if (!note) return null
  try {
    const v = JSON.parse(note) as { maxAllowed?: unknown; currentThreads?: unknown }
    const n = (x: unknown) => (typeof x === 'number' && Number.isSafeInteger(x) ? x : null)
    return { maxAllowed: n(v.maxAllowed), currentThreads: n(v.currentThreads) }
  } catch {
    return null
  }
}

// ───────────────────────── UNKNOWN 认领（§2.4、D19） ─────────────────────────

/** 时钟校准：近 24 小时正常取到号的尝试，上游 createdAt − 我方 respondedAt 的中位数（毫秒）；没有样本 → null（不做自动认领） */
export function calibrationOffsetMs(samples: ReadonlyArray<{ respondedAt: Date; upstreamCreatedAt: Date }>): number | null {
  const d = samples.map((s) => s.upstreamCreatedAt.getTime() - s.respondedAt.getTime()).filter((x) => Number.isFinite(x))
  if (!d.length) return null
  d.sort((a, b) => a - b)
  const m = Math.floor(d.length / 2)
  return d.length % 2 ? d[m] : Math.round((d[m - 1] + d[m]) / 2)
}

export interface ClaimCandidate {
  id: string
  service: string | null
  country: number | null
  operator: string | null
  priceMicro: number | null
  createdAt: Date | null
}

/**
 * 纯函数：一个 UNKNOWN 尝试在（已排除本站已知激活的）上游 v1 活跃列表里的候选。
 *  · broad：只按服务、国家、时间窗（校准后的 createdAt ∈ 认领窗）——用来判「确认没买到」（不看闸门）；
 *  · strict：再加运营商一致（尝试指定了运营商时）、价格 ≤ maxPriceMicro——自动认领要求恰好 1 个。
 * 没有校准样本（offsetMs=null）时按原始 createdAt 比较、时间窗两头各再放宽 CLAIM_UNCALIBRATED_SLACK_MS（只影响 broad 的「有没有候选」，
 * 认领本身另要求有样本）：上游时钟比我方慢几秒，真买到的号就会落在 ±3 秒的窗外、被判 NOT_BOUGHT 再买一次；放宽只会多出候选（→ 10 分钟后 MANUAL）。
 */
export function claimCandidates(
  u: { service: string; country: number; operator: string | null; maxPriceMicro: number; window: { fromMs: number; toMs: number } },
  list: readonly ClaimCandidate[],
  offsetMs: number | null,
): { broad: ClaimCandidate[]; strict: ClaimCandidate[] } {
  const slack = offsetMs == null ? CLAIM_UNCALIBRATED_SLACK_MS : 0
  const broad = list.filter((c) => {
    if (c.service !== u.service || c.country !== u.country || !c.createdAt) return false
    const t = c.createdAt.getTime() - (offsetMs ?? 0)
    return t >= u.window.fromMs - slack && t <= u.window.toMs + slack
  })
  const strict = broad.filter((c) => (!u.operator || (c.operator ?? 'any') === u.operator) && c.priceMicro != null && c.priceMicro <= u.maxPriceMicro)
  return { broad, strict }
}

// ───────────────────────── 后台「认领上游激活」的纯判定（§7.2、D19；S2b 评审修复） ─────────────────────────

/**
 * 手动认领的硬闸门（D19、附录 B 第 5、10 条「宁可人工，不能把别人的号给错人」「成本不能记到 cap 以上」）：
 * 按上游规则**不可能**是这次取号买到的候选一律拒绝，不再只作提示：
 *  · 价格未知，或高于实际传给上游的上限 eff(cap) = max(cap, 6700)（上游不会按高于 maxPrice 的价卖；认领了成本就记到 cap 以上）→ OVER_CAP；
 *  · 这次取号指定了运营商、候选的运营商不同（上游没给运营商也算不同：证明不了是它）→ OPERATOR。
 * 时间窗仍只提示（上游时钟可能有偏差，§2.4）。
 */
export function adminClaimReject(u: { operator: string | null; maxPriceMicro: number }, c: { operator: string | null; priceMicro: number | null }): 'OVER_CAP' | 'OPERATOR' | null {
  if (c.priceMicro == null || c.priceMicro > effCapMicro(u.maxPriceMicro)) return 'OVER_CAP'
  if (u.operator && c.operator !== u.operator) return 'OPERATOR'
  return null
}

/** 候选价格是否超过这次取号的真实上限 eff(cap)（后台候选列表标红用；与 adminClaimReject 的 OVER_CAP 同一口径） */
export function overEffCap(priceMicro: number | null, capMicro: number): boolean {
  return priceMicro != null && priceMicro > effCapMicro(capMicro)
}

export type ClaimReopen = 'ACQUIRING' | 'REPLACING' | 'WAITING' | 'RECEIVED' | 'CANCELLING' | 'REFUNDING' | null

export interface ClaimReopenInput {
  attempt: { id: number; reason: string }
  /**
   * 最近一条 MANUAL 事件：attemptId = 因哪个「结果未知」的尝试冻结；from = 冻结前的状态（toManual 记下的）；
   * legacy = 旧版本写的事件（detail 里没有 from 这个键，不知道起因与冻结前状态）。没有事件 = null。
   */
  manual: { attemptId: number | null; from: string | null; legacy: boolean } | null
  payStatus: string
  refundReason: string | null
  /** 这张单有没有任何号收到过短信 */
  anyCode: boolean
  /** 当前号（currentAttemptId 指的尝试） */
  cur: { id: number; state: string; smsCount: number } | null
  /** 除了要认领的这个，还有别的 REQUESTING / UNKNOWN 尝试 */
  otherInflight: boolean
  /** 除了要认领的这个，还有别的 ACTIVE / RECEIVED 号 */
  otherLive: boolean
}

/**
 * 纯函数：后台认领一个 UNKNOWN 尝试时，MANUAL 单恢复到哪个状态。null = 不恢复：照样认领（结束「结果未知」），订单保持 MANUAL，
 * afterClaim 把认领来的号转 RELEASING、canCancelAt 之后放掉（号不给买家；订单留给管理员用别的操作收尾）。
 *  · 冻结的起因必须就是这个尝试（事件的 attemptId）；起因是别的（退款核对不上、T19 失败、E44…）→ null；
 *  · 同一张单还有别的在途取号（恢复了也会被扫描器再冻结）、订单不是已付款 → null；
 *  · 按冻结前的状态 from 恢复，并逐项核对事实：
 *      ACQUIRING：首次取号 / 重试的尝试、没有号收过码、没有别的活着的号、没有退款原因（afterClaim → T8，号给买家）；
 *      REPLACING：换号尝试、没有号收过码、没有退款原因、当前号（旧号）仍 ACTIVE 且没收到短信（afterClaim → 完成换号）；
 *      WAITING：当前号 ACTIVE、没有号收过码、没有退款原因；
 *      RECEIVED：确有号收过码（订单照常完成，不给买家换成新号、不扣换号次数）；
 *      CANCELLING / REFUNDING：已有退款原因（随后整单退回，不给正在退款的买家发新号，§12.2 第 111 条）；
 *    后四种 afterClaim 都走 releaseUnattached；
 *  · 旧事件（不知道 from）或没有事件：只按事实判 ACQUIRING / REPLACING（条件同上），其余 null。
 */
export function claimReopenTarget(p: ClaimReopenInput): ClaimReopen {
  if (p.otherInflight || p.payStatus !== 'PAID') return null
  const m = p.manual
  if (m && !m.legacy && m.attemptId !== p.attempt.id) return null
  const replace = p.attempt.reason === 'REPLACE'
  const okAcq = !replace && !p.anyCode && !p.otherLive && p.refundReason == null
  const okRep = replace && !p.anyCode && p.refundReason == null && !!p.cur && p.cur.id !== p.attempt.id && p.cur.state === 'ACTIVE' && p.cur.smsCount === 0
  const from = m && !m.legacy ? m.from : null
  if (from == null) return okAcq ? 'ACQUIRING' : okRep ? 'REPLACING' : null
  switch (from) {
    case 'ACQUIRING':
      return okAcq ? 'ACQUIRING' : null
    case 'REPLACING':
      return okRep ? 'REPLACING' : null
    case 'WAITING':
      return !p.anyCode && p.refundReason == null && !!p.cur && p.cur.id !== p.attempt.id && p.cur.state === 'ACTIVE' ? 'WAITING' : null
    case 'RECEIVED':
      return p.anyCode ? 'RECEIVED' : null
    case 'CANCELLING':
    case 'REFUNDING':
      return p.refundReason != null ? from : null
    default:
      return null
  }
}

// ───────────────────────── 后台「解除 MANUAL」的前提（§7.2；S2b 评审修复） ─────────────────────────

/** 还有结果未知（REQUESTING / UNKNOWN）的取号时，解除 MANUAL / 取消并退回余额一律拒绝的提示 */
export const INFLIGHT_TEXT = '还有结果未知的取号：请先「认领上游激活」，或等扫描器判定没买到后再操作（否则扫描器下一轮会把订单再转回人工）'

/**
 * 纯函数：解除 MANUAL 的前提（§7.2「系统会先校验订单、尝试和预扣的状态是否允许」）。返回 null = 允许，否则是拒绝原因。
 * S2b 评审修复：原来只看了订单与尝试，没看**预扣、收款单**，也没看**结果未知的尝试**：
 *  · 任何目标：有 REQUESTING / UNKNOWN 尝试 → 拒绝（扫描器对任何非终态单都会因 UNKNOWN 再转 MANUAL；REFUNDING 还会先放掉买家手上的号）；
 *  · PENDING_PAY：订单未付款且未取消；**没有 state=1 的收款单**（钱到了却回到待支付，tick 不会再推进它、24 小时后对账也不再看——
 *    改用「关单并把到账退入余额」）；余额付清 / 组合单的预扣必须还是 HELD（否则 T19 / 付款确认都会因预扣状态失败）；
 *  · ACQUIRING / WAITING / REFUNDING：订单已付款、没有号收过码；余额付清 / 组合单的预扣必须是 CAPTURED（T15 只退 CAPTURED 的预扣）；
 *    ACQUIRING 另要求没有活着的号（ACTIVE / RECEIVED / RELEASING），WAITING 要求当前号 ACTIVE。
 */
export function unmanualBlock(p: {
  target: string
  payStatus: string
  deliveryStatus: string
  payMode: string
  holdState: string | null
  paidVmq: boolean
  attempts: ReadonlyArray<{ id: number; state: string; smsCount: number; codeAt: Date | null }>
  currentAttemptId: number | null
}): string | null {
  if (!['PENDING_PAY', 'ACQUIRING', 'WAITING', 'REFUNDING'].includes(p.target)) return '目标状态只能是 PENDING_PAY / ACQUIRING / WAITING / REFUNDING'
  if (p.attempts.some((a) => a.state === 'REQUESTING' || a.state === 'UNKNOWN')) return INFLIGHT_TEXT
  const usesHold = p.payMode === 'BALANCE' || p.payMode === 'MIXED'
  if (p.target === 'PENDING_PAY') {
    if (p.payStatus !== 'UNPAID' || p.deliveryStatus === 'CANCELLED') return '订单不是「未付款且未取消」'
    if (p.paidVmq) return '这张单已有到账（state=1）的收款单：请用「关单并把到账退入余额」'
    if (usesHold && p.holdState !== 'HELD') return `预扣不是 HELD（${p.holdState ?? '没有预扣'}）：回到待支付也确认不了付款，请人工核实预扣`
    return null
  }
  if (p.payStatus !== 'PAID') return '订单还没付款'
  if (p.attempts.some((a) => a.smsCount > 0 || a.codeAt != null || a.state === 'RECEIVED' || a.state === 'FINISHED')) return '已有号码收到过短信：请用「售后退款到余额」'
  if (usesHold && p.holdState !== 'CAPTURED') return `预扣不是 CAPTURED（${p.holdState ?? '没有预扣'}）：付款没有确认完整，请人工核实预扣`
  if (p.target === 'ACQUIRING' && p.attempts.some((a) => ['ACTIVE', 'RECEIVED', 'RELEASING'].includes(a.state))) return '还有活着的号：请选 WAITING 或 REFUNDING'
  if (p.target === 'WAITING') {
    const cur = p.attempts.find((a) => a.id === p.currentAttemptId)
    if (!cur || cur.state !== 'ACTIVE') return '当前号不是 ACTIVE'
  }
  return null
}

/** 解析 MANUAL 事件（sms_events.detail 是 JSON 串）成 claimReopenTarget 的 manual 参数 */
export function manualEventInfo(ev: { attemptId: number | null; detail: string | null } | null): ClaimReopenInput['manual'] {
  if (!ev) return null
  let d: Record<string, unknown> = {}
  try {
    d = ev.detail ? (JSON.parse(ev.detail) as Record<string, unknown>) : {}
  } catch {
    d = {}
  }
  const legacy = !d || typeof d !== 'object' || !('from' in d)
  const aid = ev.attemptId ?? (typeof d.attemptId === 'number' ? d.attemptId : null)
  return { attemptId: aid, from: typeof d.from === 'string' ? d.from : null, legacy }
}

/** 旧单品换号备注里的旧号（`sms.ts`：「接码换号 n/m（旧号 xxx 已取消）」，§2.4「本站已知的激活」） */
export function legacyOldPhones(remark: string | null | undefined): string[] {
  if (!remark) return []
  const out: string[] = []
  const re = /旧号\s*\+?(\d{6,20})\s*已取消/g
  let m: RegExpExecArray | null
  while ((m = re.exec(remark))) out.push(m[1])
  return out
}

// ───────────────────────── 号码展示（§1.10） ─────────────────────────

/** 号码拆分：以区号开头时拆成「+区号」与本地号；否则整串（复制文本不带空格） */
export function phoneParts(phone: string, dial: string | null): { dial: string | null; national: string; full: string } {
  const p = phone.replace(/\D/g, '')
  if (dial && /^\d{1,6}$/.test(dial) && p.startsWith(dial) && p.length > dial.length) return { dial, national: p.slice(dial.length), full: `+${p}` }
  return { dial: null, national: p, full: `+${p}` }
}

/** 号码后 4 位（日志、推送里只打这个） */
export function phoneTail(phone: string | null | undefined): string {
  return phone ? phone.slice(-4) : '—'
}

// ───────────────────────── 售价拆分的纯函数（下单事务里用） ─────────────────────────

/** 付款方式（D1、D34）：余额付清 BALANCE / 余额 + 支付宝 MIXED / 支付宝全额 ALIPAY */
export function payModeOf(payWith: 'ALIPAY' | 'BALANCE', holdCents: number, priceCents: number): 'ALIPAY' | 'BALANCE' | 'MIXED' {
  if (payWith === 'ALIPAY' || holdCents <= 0) return 'ALIPAY'
  return holdCents >= priceCents ? 'BALANCE' : 'MIXED'
}
