/**
 * 发送策略的纯函数（同构、零依赖、可单测）：资格判定、频控、发送结果分类、预热等级、熔断、
 * 今日额度、收件人排序、预计完成时间模拟。worker / 检查接口 / 报表共用同一套口径。
 *
 * 【实现方：发送引擎】这里的签名是契约，其他模块按它调用；实现细节见 docs/营销推广-设计.md 第 5 节。
 *
 * 只依赖同构的 ./types（zod）与 ./time（固定 +8 运算）；不许 import prisma / fs / crypto。
 * 断言在 scripts/check-marketing-policy.ts。
 */
import {
  DEFAULT_CONFIG,
  isTestAddress,
  type MarketingConfig,
  type SkipReason,
  type Topic,
  type ConsentStatus,
  type EtaResult,
  type EtaDay,
  type SuppressionReason,
} from './types'
import { bjDateKey, bjDateToStart, bjDayStart, nextWindowStart } from './time'
import type { RpcOutcome } from '../aliyun'

const HOUR_MS = 3600_000
const DAY_MS = 86400_000

/* ---------------- 资格判定（设计 5.4 的 1–10；频控另见 freqDecision） ---------------- */

export interface EligibilityInput {
  user: { status: number; email: string | null; createdAt: Date } | null
  consent: { status: ConsentStatus; topicsOff: Topic[]; pausedUntil: Date | null } | null
  suppressed: SuppressionReason | null
  topic: Topic
  config: Pick<MarketingConfig, 'defaultEligible' | 'sunset'>
  /** 受众要求排除长期不活跃（ALL 默认 true） */
  excludeInactive: boolean
  /** 近 365 天有无付款、近 90 天有无付款、近 90/180 天有无营销有效点击、累计已收营销封数 */
  activity: {
    paidWithin90d: boolean
    paidWithin365d: boolean
    clickedWithin90d: boolean
    clickedWithin180d: boolean
    marketingReceived: number
  }
  now: Date
}

/** 收件地址形状（与 MarketingMessage.email 列宽 191 一致） */
const EMAIL_RE = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[^\s@<>()",;]+$/
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.length <= 191 && EMAIL_RE.test(email)
}

/** SUNSET：已收 ≥3 封、近 90 天无点击且无付款（仅 DEFAULT 用户） */
export const SUNSET_MIN_RECEIVED = 3
/** INACTIVE：注册超过 180 天、近 365 天无付款、近 180 天无营销点击 */
export const INACTIVE_REGISTERED_DAYS = 180

/**
 * 发送前复核时用的「活动数据」占位：设计 5.4 规定发送前只重算 1–8（+ 频控），
 * 调用方传 sunset.enabled=false、excludeInactive=false 与这组零值即可。
 */
export const NO_ACTIVITY: EligibilityInput['activity'] = {
  paidWithin90d: false,
  paidWithin365d: false,
  clickedWithin90d: false,
  clickedWithin180d: false,
  marketingReceived: 0,
}

/** 返回 null 表示可发；否则返回第一个命中的跳过原因（顺序即设计表格顺序） */
export function eligibility(input: EligibilityInput): SkipReason | null {
  const { user, consent, topic, config, now } = input
  // 1
  if (!user || user.status !== 1) return 'DISABLED'
  // 2
  const email = (user.email || '').trim().toLowerCase()
  if (!isValidEmail(email)) return 'NO_EMAIL'
  // 3
  if (isTestAddress(email)) return 'TEST_ADDRESS'
  // 4：抑制名单与订阅状态无关，命中即永不发
  if (input.suppressed) return 'SUPPRESSED'
  // 5
  const status: string = consent?.status ?? 'DEFAULT'
  if (status === 'UNSUBSCRIBED') return 'UNSUBSCRIBED'
  // 6
  if (consent?.pausedUntil && consent.pausedUntil.getTime() > now.getTime()) return 'PAUSED'
  // 7
  if (consent?.topicsOff && consent.topicsOff.includes(topic)) return 'TOPIC_OFF'
  // 8：只有亲手点过「确认订阅」的人不受 defaultEligible 影响（识别不了的状态也按未订阅处理）
  if (status !== 'SUBSCRIBED' && !config.defaultEligible) return 'NO_CONSENT'
  // 9：只对 DEFAULT 用户 —— 明确订阅的人即使不点也照发
  const a = input.activity
  if (
    config.sunset?.enabled &&
    status === 'DEFAULT' &&
    a.marketingReceived >= SUNSET_MIN_RECEIVED &&
    !a.clickedWithin90d &&
    !a.paidWithin90d
  ) {
    return 'SUNSET'
  }
  // 10
  if (input.excludeInactive) {
    const regAge = now.getTime() - user.createdAt.getTime()
    if (regAge > INACTIVE_REGISTERED_DAYS * DAY_MS && !a.paidWithin365d && !a.clickedWithin180d) return 'INACTIVE'
  }
  return null
}

/* ---------------- 频控（设计 5.4 #11） ---------------- */

export interface FreqHistory {
  /** 同邮箱已发（SENT/SENDING/UNKNOWN，时间取 COALESCE(sentAt, claimedAt)）的时间点，不含本行 */
  times: Date[]
}
export type FreqDecision = { kind: 'ok' } | { kind: 'skip' } | { kind: 'delay'; until: Date }

/**
 * 7 天 / 30 天封数到顶 → 跳过（FREQ_CAP）；距上一封不足 minHours → 延后到「上一封 + minHours」，不跳过。
 * 【为什么 minHours 是延后而不是跳过】v1 是跳过：两个活动前后脚发，后一个活动的大半名单会被永久跳过，
 * 而那些人其实只是「今天已经收过一封」，明天发完全合规（审查修订记录「频控永久跳过」）。
 */
export function freqDecision(history: FreqHistory, freq: MarketingConfig['freq'], now: Date): FreqDecision {
  const nowMs = now.getTime()
  const times = (history.times || [])
    .map((d) => (d instanceof Date ? d.getTime() : NaN))
    .filter((t) => Number.isFinite(t))
  let c7 = 0
  let c30 = 0
  let last = -Infinity
  for (const t of times) {
    if (t > nowMs - 7 * DAY_MS) c7++
    if (t > nowMs - 30 * DAY_MS) c30++
    if (t > last) last = t
  }
  if (c7 >= freq.max7d || c30 >= freq.max30d) return { kind: 'skip' }
  const gap = Math.max(0, freq.minHours) * HOUR_MS
  if (gap > 0 && Number.isFinite(last) && nowMs - last < gap) return { kind: 'delay', until: new Date(last + gap) }
  return { kind: 'ok' }
}

/* ---------------- 发送结果分类（设计 5.5） ---------------- */

export type SendAction =
  | 'SENT'
  | 'UNKNOWN'
  | 'RETRY' // 没发出去 / 服务端临时错误：attempts+1、退避
  | 'RETRY_THROTTLE' // 限流：不占 attempts、+2 分钟、本趟结束
  | 'FAIL_SUPPRESS' // 收件人无效：FAILED + 抑制 INVALID
  | 'FAIL_SPAM' // 反垃圾拒发：FAILED(SPAM_REJECT) + 暂停活动（连续 2 次不同行 → 急停 24h）
  | 'HALT_QUOTA' // 额度用尽：行放回、急停到次日发送时段
  | 'HALT_CONFIG' // 配置/账号问题：行放回、急停 24h
  | 'PAUSE_CONTENT' // 内容问题：行放回、暂停活动
  | 'FAIL' // 其他：FAILED(code)、failStreak+1

export interface SendClassification {
  action: SendAction
  /** 写进 message.errorCode 的值（成功时为 null） */
  errorCode: string | null
  /** 给人看的说明（写 errorMsg / statusNote） */
  note: string | null
}

/** 没发出去（连接阶段失败）落 FAILED 时的错误码；也是 requeue 认的「可重试类」 */
export const CONNECT_ERROR_CODE = 'CONNECT'
/** 反垃圾拒发落 FAILED 时的错误码（不许重排） */
export const SPAM_REJECT_CODE = 'SPAM_REJECT'
/** 进程被杀 / 超时回收的 UNKNOWN 行 */
export const INTERRUPTED_CODE = 'INTERRUPTED'
/** sync 对账 2 小时仍查不到的 UNKNOWN 行（此后才允许 requeue） */
export const UNKNOWN_NOT_FOUND_CODE = 'UNKNOWN_NOT_FOUND'

const THROTTLE_PREFIX = 'Throttling'
const TRANSIENT_SERVER_CODES = ['ServiceUnavailable', 'InternalError', 'InternalServiceError']
const RECIPIENT_INVALID_CODES = ['InvalidToAddress', 'InvalidToAddress.Spam', 'InvalidReceiverName.Malformed', 'EmailFormatError']
const QUOTA_PREFIX = 'InvalidQuota'
const SPAM_CODE = 'InvalidSendMail.Spam'
const CONFIG_EXACT = [
  'InvalidUser.NotFound',
  'InvalidIP.NotFound',
  'SignatureDoesNotMatch',
  // 以下三个是设计表之外补的：都是「每一封都会同样失败」的系统性问题，按配置问题急停，
  // 否则会被归进「其他」，一封封 FAILED 掉整份名单
  'LocalConfigMissing', // 本地没配 AccessKey / 营销发信地址（lib/aliyun.ts、transport.ts）
  'IncompleteSignature',
]
const CONFIG_PREFIXES = [
  'InvalidMailAddress',
  'InvalidUserStatus',
  'Forbidden',
  'InvalidAccessKeyId',
  'MissingParameter',
  'User.',
  'InvalidTimeStamp', // 服务器时钟偏了：每一封都会被拒（设计表之外补的）
]
const CONTENT_PREFIXES = ['InvalidSubject', 'InvalidBody', 'InvalidHtmlBody', 'InvalidTextBody', 'InvalidFromAlias', 'InvalidReplyAddress']

/** 管理员 requeue 允许把哪些 FAILED 行重新排队（请求确定没被阿里云受理的那几类） */
export const REQUEUEABLE_FAILED_CODES: string[] = [CONNECT_ERROR_CODE, ...TRANSIENT_SERVER_CODES]

function noteOf(o: RpcOutcome, fallback: string): string {
  const parts = [o.code || o.errName || fallback]
  if (o.httpStatus) parts.push(`HTTP ${o.httpStatus}`)
  if (o.message) parts.push(String(o.message))
  return parts.join(' · ').slice(0, 500)
}

export function classifySend(outcome: RpcOutcome): SendClassification {
  if (outcome.kind === 'ok') return { action: 'SENT', errorCode: null, note: null }
  if (outcome.kind === 'unknown_error') {
    // 超时 / 响应阶段异常 / 5xx 且无 Code：阿里云可能已受理，绝不自动重发
    return { action: 'UNKNOWN', errorCode: (outcome.errName || 'UNKNOWN').slice(0, 64), note: noteOf(outcome, 'UNKNOWN') }
  }
  if (outcome.kind === 'connect_error') {
    return { action: 'RETRY', errorCode: CONNECT_ERROR_CODE, note: noteOf(outcome, CONNECT_ERROR_CODE) }
  }

  const code = (outcome.code || '').trim()
  const note = noteOf(outcome, 'API_ERROR')
  if (!code) return { action: 'FAIL', errorCode: 'API_ERROR', note }
  const c64 = code.slice(0, 64)
  if (code.startsWith(THROTTLE_PREFIX)) return { action: 'RETRY_THROTTLE', errorCode: c64, note }
  if (TRANSIENT_SERVER_CODES.includes(code)) return { action: 'RETRY', errorCode: c64, note }
  if (RECIPIENT_INVALID_CODES.includes(code)) return { action: 'FAIL_SUPPRESS', errorCode: c64, note }
  if (code.startsWith(QUOTA_PREFIX)) return { action: 'HALT_QUOTA', errorCode: c64, note }
  if (code === SPAM_CODE) return { action: 'FAIL_SPAM', errorCode: SPAM_REJECT_CODE, note }
  if (CONFIG_EXACT.includes(code) || CONFIG_PREFIXES.some((p) => code.startsWith(p))) {
    return { action: 'HALT_CONFIG', errorCode: c64, note }
  }
  if (CONTENT_PREFIXES.some((p) => code.startsWith(p))) return { action: 'PAUSE_CONTENT', errorCode: c64, note }
  return { action: 'FAIL', errorCode: c64, note }
}

const BACKOFF_STEPS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * HOUR_MS]

/** 第 n 次（从 1 开始）失败后的退避：1m / 5m / 30m / 2h，之后仍 2h */
export function backoffMs(attempts: number): number {
  const n = Number.isFinite(attempts) ? Math.floor(attempts) : 1
  const i = Math.min(Math.max(n, 1), BACKOFF_STEPS_MS.length) - 1
  return BACKOFF_STEPS_MS[i]
}
export const MAX_CONNECT_ATTEMPTS = 5
/** 限流：+2 分钟、不占 attempts */
export const THROTTLE_DELAY_MS = 2 * 60_000

/* ---------------- 预热（设计 5.8） ---------------- */

export interface SendDayStat {
  /** 北京日期 YYYY-MM-DD */
  date: string
  sent: number
  results: number
  invalid: number
  spam: number
  complaints: number
  spamRejects: number
}

export const WARMUP_LOOKBACK_DAYS = 60
export const WARMUP_RESET_GAP_DAYS = 45
/** 达标日的回执样本门槛：不足视为达标（比率在小样本上没有意义） */
export const WARMUP_MIN_RESULTS = 20

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/

/** 两个北京日期之间相差几天（b − a） */
export function bjDayDiff(a: string, b: string): number {
  return Math.round((bjDateToStart(b).getTime() - bjDateToStart(a).getTime()) / DAY_MS)
}

/**
 * 一个发送日是否「达标」。
 * 投诉与反垃圾拒发是绝对数：哪怕当天回执不足 20，出现一次也不算达标（它们本身就是最强的负面信号）；
 * 无效率 <3%、垃圾率 <1% 只在回执 ≥20 时才有意义，不足 20 视为达标。
 */
export function isGoodSendDay(d: SendDayStat): boolean {
  if ((d.complaints || 0) > 0 || (d.spamRejects || 0) > 0) return false
  const results = d.results || 0
  if (results < WARMUP_MIN_RESULTS) return true
  return (d.invalid || 0) / results < 0.03 && (d.spam || 0) / results < 0.01
}

/** 按过去（不含今天）的发送日表现算预热等级；距上一个发送日超过 45 天归零 */
export function warmupLevel(days: SendDayStat[], today: string): number {
  if (!DATE_KEY_RE.test(today)) return 0
  // 同一天出现多行时合并（调用方按日分组，正常不会重复）
  const merged = new Map<string, SendDayStat>()
  for (const d of days || []) {
    if (!d || !DATE_KEY_RE.test(d.date)) continue
    if (d.date >= today) continue // 不含今天（也不信任未来日期）
    if (bjDayDiff(d.date, today) > WARMUP_LOOKBACK_DAYS) continue
    const prev = merged.get(d.date)
    merged.set(
      d.date,
      prev
        ? {
            date: d.date,
            sent: prev.sent + (d.sent || 0),
            results: prev.results + (d.results || 0),
            invalid: prev.invalid + (d.invalid || 0),
            spam: prev.spam + (d.spam || 0),
            complaints: prev.complaints + (d.complaints || 0),
            spamRejects: prev.spamRejects + (d.spamRejects || 0),
          }
        : { ...d }
    )
  }
  // 「发送日」= 那天真的调过阿里云（含被反垃圾拒发的日子，那种日子恰恰是不达标日）
  const sendDays = Array.from(merged.values())
    .filter((d) => (d.sent || 0) > 0 || (d.spamRejects || 0) > 0)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  let level = 0
  let prev: string | null = null
  for (const d of sendDays) {
    if (prev && bjDayDiff(prev, d.date) > WARMUP_RESET_GAP_DAYS) level = 0
    if (isGoodSendDay(d)) level++ // 不达标：保持（不降级）
    prev = d.date
  }
  if (prev && bjDayDiff(prev, today) > WARMUP_RESET_GAP_DAYS) level = 0
  return level
}

/** schedule[level]；超出长度返回 null（=不受预热限制） */
export function warmupCap(level: number, schedule: number[]): number | null {
  const sched = (schedule || []).filter((n) => Number.isFinite(n) && n >= 0)
  if (!sched.length) return null
  const lv = Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0
  return lv < sched.length ? Math.floor(sched[lv]) : null
}

/* ---------------- 熔断（设计 5.8） ---------------- */

export interface BreakerStats {
  /** 有回执的行数（delivery 非空，且 deliveryAt > breakerResetAt） */
  results: number
  invalid: number
  spam: number
  complaints: number
  /**
   * 回执里「发信方问题」的失败数（delivery=FAILED 且分类属 SENDER_SIDE_CLASSES：我方 SPF/DKIM/DMARC 失败、
   * 发信人或域名被拉黑）。缺省按 0（审查 C19）
   */
  senderFail?: number
}
export type BreakerVerdict = { trip: false } | { trip: true; reason: string }

export const BREAKER_MIN_SAMPLE = 30
export const BREAKER_INVALID_RATE = 0.05
export const BREAKER_SPAM_RATE = 0.025
export const BREAKER_COMPLAINTS_ABS = 2
export const BREAKER_LARGE_SAMPLE = 700
export const BREAKER_COMPLAINT_RATE = 0.003
/** 发信方问题失败率上限：超过说明我方发信出了故障（DNS 改坏了 DKIM、被收件方拉黑…），继续发只会白烧额度（审查 C19） */
export const BREAKER_SENDER_FAIL_RATE = 0.1

function pct(x: number): string {
  return `${(Math.round(x * 1000) / 10).toFixed(1)}%`
}

/**
 * 阈值依据：阿里云升级线（无效 <5%、垃圾 <2.5%）；降级线 9%/10%，封禁线 11%/15%。
 * 样本不足 30 不判（几封退信就熔断，等于每个小活动都会被误停）。
 */
export function evaluateBreaker(s: BreakerStats): BreakerVerdict {
  const n = Number.isFinite(s.results) ? s.results : 0
  if (n < BREAKER_MIN_SAMPLE) return { trip: false }
  const invalid = (s.invalid || 0) / n
  if (invalid > BREAKER_INVALID_RATE) return { trip: true, reason: `无效地址率 ${pct(invalid)}（阈值 5%，样本 ${n}）` }
  const spam = (s.spam || 0) / n
  if (spam > BREAKER_SPAM_RATE) return { trip: true, reason: `垃圾箱率 ${pct(spam)}（阈值 2.5%，样本 ${n}）` }
  // 阿里云的信誉规则还要求成功率 >92%；无效/垃圾都不高、却大量因我方认证或被拉黑投递失败，同样要停（审查 C19）
  const senderFail = (Number.isFinite(s.senderFail) ? (s.senderFail as number) : 0) / n
  if (senderFail > BREAKER_SENDER_FAIL_RATE) {
    return { trip: true, reason: `发信方认证失败/被拉黑的投递失败率 ${pct(senderFail)}（阈值 10%，样本 ${n}）：请检查发信域名的 SPF/DKIM/DMARC 与黑名单` }
  }
  const c = s.complaints || 0
  if (n >= BREAKER_LARGE_SAMPLE) {
    if (c / n > BREAKER_COMPLAINT_RATE) return { trip: true, reason: `投诉率 ${pct(c / n)}（阈值 0.3%，样本 ${n}）` }
  } else if (c >= BREAKER_COMPLAINTS_ABS) {
    return { trip: true, reason: `投诉 ${c} 次（样本 ${n}）` }
  }
  return { trip: false }
}

/* ---------------- 今日额度（设计 5.7） ---------------- */

export interface DailyLimitInput {
  config: Pick<MarketingConfig, 'dailyCap' | 'maxQuotaShare' | 'warmup'>
  /** 24 小时内取到的阿里云日额度；取不到传 null（按 500 计） */
  dailyQuota: number | null
  warmupLevel: number
}
export interface DailyLimit {
  limit: number
  parts: { dailyCap: number; quotaCap: number; warmupCap: number | null; quota: number; quotaAssumed: boolean }
}

/** 所有输入都做有限数检查：任何一项缺失/坏掉都回落到保守值，绝不产出 NaN（NaN 参与 min 会让预算判断全部失效） */
export function computeDailyLimit(input: DailyLimitInput): DailyLimit {
  const cfg = input.config
  const q = input.dailyQuota
  const quotaOk = typeof q === 'number' && Number.isFinite(q) && q > 0
  const quota = quotaOk ? Math.floor(q as number) : ASSUMED_QUOTA
  const shareRaw = Number(cfg?.maxQuotaShare)
  const share = Number.isFinite(shareRaw) && shareRaw > 0 && shareRaw <= 1 ? shareRaw : DEFAULT_CONFIG.maxQuotaShare
  // +1e-9：0.6 × 500 之类的浮点乘法可能落在 299.99999…，floor 之后白白少一封
  const quotaCap = Math.max(0, Math.floor(quota * share + 1e-9))
  const capRaw = Number(cfg?.dailyCap)
  const dailyCap = Number.isFinite(capRaw) && capRaw >= 0 ? Math.floor(capRaw) : DEFAULT_CONFIG.dailyCap
  const wcap = cfg?.warmup?.enabled ? warmupCap(input.warmupLevel, cfg.warmup.schedule) : null
  const limit = Math.max(0, Math.min(dailyCap, quotaCap, wcap == null ? Infinity : wcap))
  return { limit, parts: { dailyCap, quotaCap, warmupCap: wcap, quota, quotaAssumed: !quotaOk } }
}
export const ASSUMED_QUOTA = 500

/** 今日额度被哪一项卡住（报表「为什么还没发」与 ETA 用） */
export function bindingLimit(d: DailyLimit): 'warmup' | 'quota' | 'dailyCap' {
  if (d.parts.warmupCap != null && d.limit === d.parts.warmupCap) return 'warmup'
  if (d.limit === d.parts.quotaCap) return 'quota'
  return 'dailyCap'
}

/* ---------------- 收件人排序（设计 5.6 #4） ---------------- */

export interface SortInput {
  email: string
  domain: string
  /** 0 近 90 天付款 / 1 曾付款 / 2 近 90 天注册或点击 / 3 验证过邮箱 / 4 其余 */
  tier: number
}

export const TIER_STRIDE = 100000

/**
 * 返回与输入同序的 sortKey：层级 × 100000 + 层内按域名轮转的序号。
 *
 * 层内交错用「均匀铺开」而不是简单轮转：每个域名的第 k 封（共 n 封）放在 (k+0.5)/n 的位置上再排序。
 * 简单轮转在一个大域名（qq.com 占八成）+ 几个小域名时，会把小域名全挤在最前面、尾部变成一长串 qq.com；
 * 均匀铺开让大域名的封数平均分散在整层里（阿里云：不要频繁同时向同一个收信方服务商发送同样主旨的邮件）。
 * 同一域名内保持输入顺序。层内序号超过 99999 时封顶（同 key 再按 id 排），保证不串到下一层。
 */
export function assignSortKeys(rows: SortInput[]): number[] {
  const keys: number[] = new Array(rows.length).fill(0)
  const byTier = new Map<number, number[]>()
  rows.forEach((r, i) => {
    const t = Number.isFinite(r.tier) ? Math.min(9, Math.max(0, Math.floor(r.tier))) : 4
    const list = byTier.get(t)
    if (list) list.push(i)
    else byTier.set(t, [i])
  })
  byTier.forEach((idxs, tier) => {
    const domRank = new Map<string, number>()
    const byDom = new Map<string, number[]>()
    for (const i of idxs) {
      const r = rows[i]
      const d = (r.domain || r.email.slice(r.email.lastIndexOf('@') + 1) || '').toLowerCase()
      if (!domRank.has(d)) domRank.set(d, domRank.size)
      const list = byDom.get(d)
      if (list) list.push(i)
      else byDom.set(d, [i])
    }
    const items: { i: number; pos: number; rank: number }[] = []
    byDom.forEach((list, d) => {
      const n = list.length
      const rank = domRank.get(d) ?? 0
      list.forEach((i, k) => items.push({ i, pos: (k + 0.5) / n, rank }))
    })
    items.sort((a, b) => a.pos - b.pos || a.rank - b.rank || a.i - b.i)
    items.forEach((it, seq) => {
      keys[it.i] = tier * TIER_STRIDE + Math.min(seq, TIER_STRIDE - 1)
    })
  })
  return keys
}

/* ---------------- 预计完成时间（设计 11 check.eta） ---------------- */

export interface EtaInput {
  /** 本活动预计要发的封数 */
  count: number
  /** 计划开始时间（立即发送传 now） */
  startAt: Date
  now: Date
  config: Pick<MarketingConfig, 'dailyCap' | 'maxQuotaShare' | 'warmup' | 'sendWindow' | 'ratePerSec' | 'canarySize'>
  dailyQuota: number | null
  /** 已达标的预热等级（今天起算） */
  warmupLevel: number
  /** 今天已用掉的额度 */
  usedToday: number
  /** 排在本活动前面、还没发完的封数（先来先发） */
  aheadCount: number
}

/**
 * worker 每分钟一趟、每趟至多 35 秒在开始新发送（设计 5.3），所以实际吞吐 ≈ ratePerSec × 35/60。
 * 按标称速率估会把完成时间估早四成。
 */
export const WORKER_DUTY = 35 / 60
/** 试探：每个活动每个发送日先发 canarySize 封，最坏等 30 分钟回执 */
export const CANARY_WAIT_MS = 30 * 60_000
const ETA_MAX_DAYS = 400

/**
 * 逐日模拟：每天在发送时段内，先扣掉排在前面的活动，再按「今日额度（预热逐日升级、假设每天达标）
 * ∧ 时段内的速率上限 ∧ 试探等待」发本活动。模拟不了的（配置坏了 / 400 天都发不完）finishAt 为 null。
 */
export function simulateEta(input: EtaInput): EtaResult {
  const count = Number.isFinite(input.count) ? Math.max(0, Math.floor(input.count)) : 0
  if (!count) return { startAt: null, finishAt: null, perDay: [], blockedBy: [] }

  const cfg = input.config
  const win = cfg.sendWindow
  if (
    !win ||
    !Number.isFinite(win.start) ||
    !Number.isFinite(win.end) ||
    win.start < 0 ||
    win.end > 24 ||
    win.end <= win.start
  ) {
    return { startAt: null, finishAt: null, perDay: [], blockedBy: ['window'] }
  }
  const rateRaw = Number(cfg.ratePerSec)
  const rate = Number.isFinite(rateRaw) && rateRaw > 0 ? Math.min(2, Math.max(0.2, rateRaw)) : 1
  const perSec = rate * WORKER_DUTY
  const canaryRaw = Number(cfg.canarySize)
  const canary = Number.isFinite(canaryRaw) && canaryRaw > 0 ? Math.floor(canaryRaw) : 0
  const canaryPauseSlots = Math.floor((CANARY_WAIT_MS / 1000) * perSec)

  const blocked: string[] = []
  const note = (r: string) => {
    if (!blocked.includes(r)) blocked.push(r)
  }
  const nowMs = input.now.getTime()
  const todayKey = bjDateKey(input.now)
  let t = new Date(Math.max(input.startAt.getTime(), nowMs))
  let ahead = Number.isFinite(input.aheadCount) ? Math.max(0, Math.floor(input.aheadCount)) : 0
  let level = Number.isFinite(input.warmupLevel) ? Math.max(0, Math.floor(input.warmupLevel)) : 0
  let remaining = count
  let firstAt: Date | null = null
  let finishAt: Date | null = null
  const perDay: EtaDay[] = []

  for (let day = 0; day < ETA_MAX_DAYS && remaining > 0; day++) {
    const ws = nextWindowStart(win, t)
    if (day === 0 && ws.getTime() > t.getTime()) note('window')
    t = ws
    const key = bjDateKey(t)
    const dayEndMs = bjDayStart(t).getTime() + win.end * HOUR_MS
    const lim = computeDailyLimit({ config: cfg, dailyQuota: input.dailyQuota, warmupLevel: level })
    const used = key === todayKey ? Math.max(0, Number(input.usedToday) || 0) : 0
    let budget = Math.max(0, lim.limit - used)
    let slots = Math.max(0, Math.floor(((dayEndMs - t.getTime()) / 1000) * perSec))
    let cursorMs = t.getTime()

    // 先来先发：前面的活动先吃掉今天的额度与时段
    const takeAhead = Math.min(ahead, budget, slots)
    if (takeAhead > 0) {
      ahead -= takeAhead
      budget -= takeAhead
      slots -= takeAhead
      cursorMs += (takeAhead / perSec) * 1000
      note('queue')
    }

    // 本活动：试探批次之后最坏等 30 分钟（今日额度不足一个试探批次时不设试探）
    let mine = 0
    let elapsedSlots = 0
    if (budget > 0 && slots > 0) {
      const canaryApplies = canary > 0 && lim.limit >= canary
      if (canaryApplies && Math.min(remaining, budget, slots) > canary) {
        const afterCanary = Math.max(0, slots - canary - canaryPauseSlots)
        mine = Math.min(remaining, budget, canary + afterCanary)
        elapsedSlots = mine > canary ? mine + canaryPauseSlots : mine
      } else {
        mine = Math.min(remaining, budget, slots)
        elapsedSlots = mine
      }
    }
    if (mine > 0) {
      if (!firstAt) firstAt = new Date(cursorMs)
      remaining -= mine
      finishAt = new Date(cursorMs + (elapsedSlots / perSec) * 1000)
      perDay.push({ date: key, count: mine })
    }
    if (remaining > 0) {
      // 今天为什么没发完：额度到顶（按哪一项卡住）还是时段/速率不够
      if (budget - mine <= 0) {
        note(bindingLimit(lim))
      } else {
        note('window')
      }
    }
    // 假设当天表现达标：有发送的日子过后预热升一级（真实升级要看回执，ETA 只是乐观估计）
    if (takeAhead + mine > 0) level += 1
    t = new Date(bjDayStart(t).getTime() + DAY_MS + win.start * HOUR_MS)
  }

  if (remaining > 0) finishAt = null
  return {
    startAt: firstAt ? firstAt.toISOString() : null,
    finishAt: finishAt ? finishAt.toISOString() : null,
    perDay,
    blockedBy: blocked,
  }
}
