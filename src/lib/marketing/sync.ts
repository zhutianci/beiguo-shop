/**
 * 阿里云回执与名单同步（cron 每 5 分钟 POST /api/cron/marketing-sync，锁 mkt:sync，单趟 ≤45s）。
 * 步骤见设计文档 10.4：账户状态 → 投递回执 → ErrorClassification 映射 → UNKNOWN 对账 →
 * 投诉/退订屏蔽名单（ListBlockSending）→ 无效地址库（每天一次）→ 写 mkt_sync。
 *
 * 【实现方：同步与公开端】签名是契约。接口参数以 scratchpad 里核对过的官方元数据为准：
 *  - SenderStatisticsDetailByParam：AccountName / TagName / ToAddress 三选一；StartTime/EndTime 北京时间 yyyy-MM-dd HH:mm；
 *    返回 data.mailDetail[]，真实时间用 UtcLastUpdateTime（秒，可能是数字或字符串）；翻页 NextStart
 *  - ListBlockSending：BlockType=UNSUB|REPORT 必填；BeginTime/EndTime 为 Unix 秒；返回 Data[]（大写 D）；翻页 NextToken
 *  - QueryInvalidAddress：StartTime/EndTime 为 yyyy-MM-dd；返回 data.mailDetail[]；翻页 NextStart
 *  - DescAccountSummary：无参数；每分钟最多 10 次
 *
 * 【执行顺序为什么是 账户 → 屏蔽名单 → 回执 → 无效地址】时间预算只有 45 秒。
 * 屏蔽名单（投诉/退订）通常一两次调用就完，但它关系到「退订立即生效」这条法律义务，必须排在
 * 可能吃满预算的回执查询前面；无效地址库一天一次、不急，放最后，这一趟没时间就下一趟。
 *
 * 【UNKNOWN_NOT_FOUND 是能导致重复发信的判定】标上它之后管理员才可以重排这封信。
 * 所以只有同时满足下面几条才标：用**这封信自己的发信地址**查的窗口这一趟完整翻完（没被页数/时间截断、
 * 没报错、响应里有 data）、整个窗口里我们确知被阿里云受理的信几乎都在返回的数据里找得到（正对照，数据不完整就不信）、
 * 返回的地址没有被打码（打码就无从比对）、收件人没打开/点过（打开/点过 = 确实送到了，直接对账成 SENT）、
 * 且领取时间已超过 2 小时。宁可多等几轮，也不误判（审查 C14 / C15）。
 *
 * 【发信地址可以换】每封信记了自己的 sender：回执按地址分组、各查各的；屏蔽名单按整个账户拉（审查 C15）。
 *
 * 日志与 lastError 里只有计数和阿里云的错误码，不含任何邮箱。
 */
import { prisma } from '@/lib/db'
import { aliyunKeysConfigured, dmCall, type RpcOutcome } from '@/lib/aliyun'
import { applyConsentChange, suppressEmail } from './consent'
import {
  getAccountState,
  getConfig,
  getHalt,
  getSyncState,
  isDryRun,
  isHalted,
  marketingSender,
  saveAccountState,
  saveSyncState,
  setHalt,
} from './config'
import { acquireLock, releaseLock } from './lock'
import { addBjDays, bjDateKey, bjMinuteString } from './time'
import { SENDER_SIDE_CLASSES, clip, emailDomain, type AccountState, type DeliveryStatus, type SyncState } from './types'

export interface SyncSummary {
  skipped?: 'locked' | 'not_configured' | 'dry_run'
  account: 'fresh' | 'updated' | 'failed' | 'skipped'
  deliveries: { checked: number; matched: number; pages: number }
  unknownResolved: number
  blocks: { complaints: number; unsubscribes: number }
  invalid: number
  errors: string[]
  ms: number
}

/* ================================================================================================
 * 常量
 * ================================================================================================ */

const RUN_BUDGET_MS = 45_000
const API_TIMEOUT_MS = 10_000
const LOCK_TTL_MS = 3 * 60_000
const MAX_PAGES_PER_API = 30
const DETAIL_PAGE_SIZE = 100
const BLOCK_PAGE_SIZE = 500
const INVALID_PAGE_SIZE = 100
/** 回执查询窗口前后各放宽 2 小时（设计 10.4） */
const WINDOW_PAD_MS = 2 * 3600_000
/** 一个查询窗口预计最多多少条（留出页数给其它窗口；超过就把窗口切小） */
const WINDOW_MAX_ROWS = 2200
const PENDING_HOURS = 72
const ACCOUNT_REFRESH_MS = 3600_000
const UNKNOWN_NOT_FOUND_AFTER_MS = 2 * 3600_000
const DOMAIN_BACKOFF_MS = 3600_000
const BLOCK_FIRST_RUN_DAYS = 30
const BLOCK_OVERLAP_SEC = 3600
/** QueryInvalidAddress：「时间不能早于 30 日」—— 按北京日期取 29 天前，免得落在边界上被拒 */
const INVALID_LOOKBACK_DAYS = 29
const MAX_BACKOFF_DOMAINS = 200
/** 往回看多少天的信来收集「用过的营销发信地址」（审查 C15） */
const SENDER_LOOKBACK_DAYS = 31

/* ================================================================================================
 * 纯函数（scripts/check-marketing-public.ts 断言）
 * ================================================================================================ */

/** 硬退信：地址不存在 / 域名解析不了 / 命中账号级无效地址库 → 抑制 HARD_BOUNCE */
export const HARD_BOUNCE_CLASSES = [
  'SmtpNxBox',
  'SysOutRcptOnAccountLevelBounceList',
  'SysOutInvRcpt',
  'SysIncomingInvRcpt',
  'SmtpZPermErr',
  'SysOutDnsResolveFail',
]
/** 频率类：收件方嫌我们发得太快 → 该收件域名退避 1 小时（不是收件人的问题，不算软退信） */
export const RATE_CLASSES = ['SmtpMfFreq', 'SmtpMfdFreq', 'SmtpIPFreq', 'SmtpRcptFreq', 'SmtpMfLimit']

/**
 * 'sender'：发信方的问题（我方 SPF/DKIM/DMARC 坏了、发信人/域名被收件方拉黑，见 types.ts SENDER_SIDE_CLASSES）。
 * 收件人的邮箱是好的 —— 不抑制、不退避收件域名、不计入软退信连击（审查 C19）。
 * SysOut*Conn*（连不上收件方的服务器）不在其中：那是这个收件地址本身的信号，照旧按软退信算。
 */
export type DeliveryErrorKind = 'hard_bounce' | 'complaint' | 'unsubscribed' | 'rate' | 'sender' | 'other'

export function classifyDeliveryError(cls: string | null | undefined): DeliveryErrorKind {
  const c = (cls || '').trim()
  if (HARD_BOUNCE_CLASSES.includes(c)) return 'hard_bounce'
  if (c === 'SysOutRecipientReportedSpam') return 'complaint'
  if (c === 'SysOutRecipientUnsubscribed') return 'unsubscribed'
  if (RATE_CLASSES.includes(c)) return 'rate'
  if ((SENDER_SIDE_CLASSES as readonly string[]).includes(c)) return 'sender'
  return 'other'
}

/**
 * 软退信连击（设计 10.4）：同一邮箱最近 3 条有结果的回执都是「投递失败」，且都不是频率类、也不是发信方的问题（审查 C19）。
 * @param last 该邮箱最近的回执（按发送时间倒序，取 3 条）；deliveryDetail 以 ErrorClassification 开头
 */
export function isSoftBounceStreak(last: { delivery: string | null; deliveryDetail: string | null }[]): boolean {
  if (last.length < 3) return false
  return last.slice(0, 3).every((r) => {
    if (r.delivery !== 'FAILED') return false
    const k = classifyDeliveryError((r.deliveryDetail || '').split(' ')[0])
    return k !== 'rate' && k !== 'sender'
  })
}

/** 阿里云投递状态 → 我们的 delivery。0 成功 / 2 无效地址 / 3 垃圾邮件 / 4 其余失败；其它值（投递中）不认 */
export function deliveryFromStatus(status: number | null): DeliveryStatus | null {
  switch (status) {
    case 0:
      return 'DELIVERED'
    case 2:
      return 'INVALID'
    case 3:
      return 'SPAM'
    case 4:
      return 'FAILED'
    default:
      return null
  }
}

/**
 * UtcLastUpdateTime → Unix 秒。官方元数据里它一处写 string、一处写 integer，两种都收。
 * 万一给的是毫秒（13 位）也兜住。认不出 → null（这一条不参与匹配）。
 */
export function parseUtcSeconds(v: unknown): number | null {
  let n: number
  if (typeof v === 'number') n = v
  else if (typeof v === 'string' && /^\s*\d{9,13}(\.\d+)?\s*$/.test(v)) n = Number(v.trim())
  else return null
  if (!Number.isFinite(n) || n <= 0) return null
  if (n > 1e12) n = n / 1000
  return Math.floor(n)
}

export interface DeliveryRow {
  /** 小写 */
  toAddress: string
  subject: string
  utcSec: number | null
  status: number | null
  errorClassification: string
  message: string
  accountName: string | null
}

/** 阿里云返回的一条明细 → DeliveryRow；缺收件地址的丢弃 */
export function parseDeliveryRow(raw: unknown): DeliveryRow | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const toAddress = String(r.ToAddress ?? '').trim().toLowerCase()
  if (!toAddress || !toAddress.includes('@')) return null
  const st = typeof r.Status === 'number' ? r.Status : typeof r.Status === 'string' && r.Status.trim() !== '' ? Number(r.Status) : NaN
  return {
    toAddress,
    subject: String(r.Subject ?? ''),
    utcSec: parseUtcSeconds(r.UtcLastUpdateTime),
    status: Number.isInteger(st) ? st : null,
    errorClassification: String(r.ErrorClassification ?? '').trim(),
    message: String(r.Message ?? '').trim(),
    accountName: r.AccountName ? String(r.AccountName).trim().toLowerCase() : null,
  }
}

/** 地址被打码（接口示例里就是 b***@example.net 这种）：这样的数据无从比对，整批不可信 */
export function looksMasked(addr: string): boolean {
  return /\*{3}@/.test(addr)
}

export interface MatchableMessage {
  id: number
  email: string
  subjectSent: string | null
  claimedAt: Date | null
  /** 这封信用的营销发信地址（没有 = 不据此排除）。换过发信地址后，A 地址的回执不能记到 B 地址发的信上（审查 C15） */
  sender?: string | null
}

/** sender 参数 → 小写集合；null = 不按发信地址过滤 */
function senderSet(senders: string | Iterable<string> | null | undefined): Set<string> | null {
  if (senders == null) return null
  // 字符串本身也是 Iterable（逐字符），要先单独处理
  const list = typeof senders === 'string' ? [senders] : Array.from(senders)
  const set = new Set(list.map((s) => s.trim().toLowerCase()).filter(Boolean))
  return set.size ? set : null
}

/**
 * 回执匹配（设计 10.4）：收件地址（小写）相同 **且** 主题 = subjectSent **且** utc ≥ claimedAt − 60 秒；
 * 一封信有多条候选时取最早一条；一条回执只分给一封信。
 *
 * 【为什么不能按「最近一封」匹配】同一个人可能在几天里收到两场主题相同的活动（主题模板一样、昵称一样），
 * 只按邮箱配会把 B 的回执记到 A 头上。
 *
 * 【分配顺序：按回执时间从早到晚，每条回执给「在它之前领取的、最近的那封」】
 * 反过来按消息从早到晚挑（每封挑自己能挑的最早一条）是错的：一封旧信自己的回执不在这次查到的数据里时
 * （比如 72 小时内复查的投递失败、或者根本没发出去的 UNKNOWN），它会把后面那封同主题新信的回执抢走 ——
 * UNKNOWN 因此被误判成「已发出」、新信反而一直没回执。回执不可能早于它对应的那封信被领取，
 * 所以它属于「在它之前最近领取的那封」；一封信自己有多条回执时，时间最早的那条先到、先占住它，仍是「取最早一条」。
 *
 * 【messages 里要带上「锚点」】「在它之前最近领取的那封」必须在候选里，哪怕它已经有回执、不再待查 ——
 * 否则新信 B 有了回执后退出候选，下一趟 B 的那条回执又被查回来时，桶里只剩更早的 A，A 就把它抢走了。
 * 调用方把同邮箱、已发出的非待查消息作为锚点一起传进来，只对待查消息落库（审查 C17）。
 *
 * @param senders 已知的营销发信地址（一个或一组）。行上带了 AccountName 且不在其中的不参与（别的发信地址的邮件）；
 *                消息带了 sender、行也带了 AccountName 时，两者必须相同（审查 C15）
 */
export function matchDelivery(
  rows: DeliveryRow[],
  messages: MatchableMessage[],
  senders?: string | Iterable<string> | null
): Map<number, DeliveryRow> {
  const allowed = senderSet(senders)
  const keyOf = deliveryKey

  // 同一（邮箱, 主题）下的待查消息，按领取时间升序
  const msgBuckets = new Map<string, MatchableMessage[]>()
  for (const m of messages) {
    if (!m.subjectSent || !m.claimedAt) continue
    const key = keyOf(m.email, m.subjectSent)
    const arr = msgBuckets.get(key)
    if (arr) arr.push(m)
    else msgBuckets.set(key, [m])
  }
  msgBuckets.forEach((arr) => arr.sort((a, b) => (a.claimedAt as Date).getTime() - (b.claimedAt as Date).getTime() || a.id - b.id))

  const ordered = rows
    .filter((r) => r.utcSec != null && !(allowed && r.accountName && !allowed.has(r.accountName.toLowerCase())))
    .slice()
    .sort((a, b) => (a.utcSec as number) - (b.utcSec as number))

  const out = new Map<number, DeliveryRow>()
  for (const r of ordered) {
    const arr = msgBuckets.get(keyOf(r.toAddress, r.subject))
    if (!arr) continue
    const t = (r.utcSec as number) * 1000
    const rowSender = r.accountName ? r.accountName.toLowerCase() : null
    // 从最近领取的往前找：第一封「领取时间 − 60 秒 ≤ 回执时间」、发信地址对得上、且还没配上的
    for (let i = arr.length - 1; i >= 0; i--) {
      const m = arr[i]
      if ((m.claimedAt as Date).getTime() - 60_000 > t) continue
      if (rowSender && m.sender && m.sender.trim().toLowerCase() !== rowSender) continue
      if (out.has(m.id)) continue
      out.set(m.id, r)
      break
    }
  }
  return out
}

export interface PlannedWindow {
  /** 查询窗口（毫秒时间戳，已含前后放宽） */
  start: number
  end: number
  /** 这个窗口负责的待查消息 */
  ids: number[]
  /** 这些消息的领取时间范围（不含放宽） */
  coreStart: number
  coreEnd: number
  /** 按我们自己的发送记录估计的该窗口条数 */
  estRows: number
}

function lowerBound(sorted: number[], x: number): number {
  let lo = 0
  let hi = sorted.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid] < x) lo = mid + 1
    else hi = mid
  }
  return lo
}
function upperBound(sorted: number[], x: number): number {
  let lo = 0
  let hi = sorted.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid] <= x) lo = mid + 1
    else hi = mid
  }
  return lo
}

/**
 * 把待查消息切成若干查询窗口。
 *
 * 【为什么要切】一个窗口只能翻 30 页（3000 条）。72 小时里只要还有一封「投递失败待复查」的旧信，
 * 一个从它开始到现在的大窗口就会包含三天里的全部营销邮件，永远翻不完 —— 新发出去的信拿不到回执，
 * 试探放行和熔断都会卡住。按领取时间聚类、每个窗口的预计条数（用我们自己的发送记录估算）不超过上限，
 * 某一封周围实在太密就把放宽量减半，最少 10 分钟。
 *
 * @param pending   待查消息（at = claimedAt 毫秒）
 * @param sendTimes 该时段我们所有营销发送的领取时间（毫秒，升序），用来估算窗口里会有多少条
 */
export function planDeliveryWindows(
  pending: { id: number; at: number }[],
  sendTimes: number[],
  opts: { padMs: number; minPadMs: number; maxRows: number }
): PlannedWindow[] {
  const p = pending.slice().sort((a, b) => a.at - b.at || a.id - b.id)
  const times = sendTimes.slice().sort((a, b) => a - b)
  const countIn = (a: number, b: number) => Math.max(0, upperBound(times, b) - lowerBound(times, a))
  const out: PlannedWindow[] = []
  let i = 0
  while (i < p.length) {
    let pad = opts.padMs
    while (pad > opts.minPadMs && countIn(p[i].at - pad, p[i].at + pad) > opts.maxRows) {
      pad = Math.max(opts.minPadMs, Math.floor(pad / 2))
    }
    const start = p[i].at - pad
    let j = i
    while (j + 1 < p.length && countIn(start, p[j + 1].at + pad) <= opts.maxRows) j++
    const end = p[j].at + pad
    out.push({
      start,
      end,
      ids: p.slice(i, j + 1).map((x) => x.id),
      coreStart: p[i].at,
      coreEnd: p[j].at,
      estRows: countIn(start, end),
    })
    i = j + 1
  }
  return out
}

/**
 * 窗口的执行顺序：最新的窗口永远排第一（刚发出去的信要尽快拿到回执，试探放行与熔断等着用），
 * 其余按时间轮转 —— 起点随 5 分钟一格的时钟移动，页数预算不够时每个旧窗口轮流有机会被查到。
 */
export function orderWindows<W extends PlannedWindow>(windows: W[], now: Date): W[] {
  if (windows.length <= 1) return windows.slice()
  const sorted = windows.slice().sort((a, b) => a.start - b.start)
  const newest = sorted[sorted.length - 1]
  const rest = sorted.slice(0, -1)
  const offset = Math.floor(now.getTime() / 300_000) % rest.length
  return [newest, ...rest.slice(offset), ...rest.slice(0, offset)]
}

/** 回执匹配 / 完整性检查共用的键：小写邮箱 + 去空白的主题 */
export function deliveryKey(email: string, subject: string): string {
  return `${email.trim().toLowerCase()}\n${subject.trim()}`
}

/** 我们确知被阿里云受理（SENT 且有 EnvId）的一封：领取时间 + 匹配键 */
export interface AcceptedSend {
  at: number
  key: string
  /**
   * 这封信的回执我们之前已经见过（delivery 已有值）。告警只拿这类信当对照：
   * 见过的记录这次却不在 = 数据真的被截断；没见过的可能只是阿里云还没出记录（晚到），不能据此报错停发
   */
  known?: boolean
}

/** 完整性检查只看窗口去掉边缘后的部分：UtcLastUpdateTime 晚于领取时间，贴着窗口边的信可能被切到窗口外 */
export const COMPLETENESS_EDGE_MS = 10 * 60_000
/** 领取不到这么久的信阿里云那边可能还没有记录，不拿来当对照（否则每次刚发完一批都会误报「数据不完整」） */
export const COMPLETENESS_LAG_MS = 15 * 60_000
/** 受理的信里至少这么多在返回的数据里找得到，才相信「查不到 = 阿里云没有」 */
export const COMPLETENESS_TRUST_RATIO = 0.95
/** 低于这个比例说明是系统性问题（数据被截断、主题/地址格式变了），记进 lastError */
export const COMPLETENESS_ALARM_RATIO = 0.8
/** 告警至少要有这么多「见过回执」的对照，样本太少不下结论 */
export const COMPLETENESS_ALARM_MIN = 5

/**
 * 查询窗口是否完整可信（审查 C14）。
 *
 * 【为什么原来的检查拦不住】原来只比较「返回条数 ≥ 待查消息领取时间范围内受理的封数」。
 * 超过 2 小时还是 UNKNOWN 的信，邻居早都有回执、不再待查，它独自成一个窗口，那个范围只有一个时刻，
 * 受理数是 0 —— 条件恒成立，空页、短页、缺了这一条的响应都被当成「查过了没有」，然后标 UNKNOWN_NOT_FOUND、可以重排、重复发信。
 *
 * 【现在的检查：正对照】取整个查询窗口（去掉边缘、去掉刚发的）里我们确知被受理的信，
 * 看它们（邮箱 + 主题）有多少出现在返回的数据里。受理的都找得到，才相信找不到的那封是真的没有。
 *
 * @param accepted 按 at 升序
 */
export function windowCompleteness(
  w: Pick<PlannedWindow, 'start' | 'end' | 'coreStart'>,
  accepted: AcceptedSend[],
  rows: Pick<DeliveryRow, 'toAddress' | 'subject'>[],
  nowMs: number
): { accepted: number; matched: number; trusted: boolean; alarm: boolean; knownAccepted: number; knownMatched: number } {
  // 放宽量被缩小时（很密集），边缘也按比例少切一点，免得切没了
  const trim = Math.min(COMPLETENESS_EDGE_MS, Math.max(0, Math.floor((w.coreStart - w.start) / 2)))
  const lo = w.start + trim
  const hi = Math.min(w.end - trim, nowMs - COMPLETENESS_LAG_MS)
  let n = 0
  let matched = 0
  let kn = 0
  let km = 0
  if (hi >= lo) {
    const keys = new Set(rows.map((r) => deliveryKey(r.toAddress, r.subject)))
    // accepted 已按时间升序：二分找到第一封 ≥ lo 的，往后数到 > hi 为止
    let a = 0
    let b = accepted.length
    while (a < b) {
      const mid = (a + b) >> 1
      if (accepted[mid].at < lo) a = mid + 1
      else b = mid
    }
    for (let k = a; k < accepted.length && accepted[k].at <= hi; k++) {
      const hit = keys.has(accepted[k].key)
      n++
      if (hit) matched++
      if (accepted[k].known) {
        kn++
        if (hit) km++
      }
    }
  }
  // 可信：受理的几乎都找得到（包括还没见过回执的 —— 宁可不下「查不到」的结论）
  const trusted = rows.length >= n && matched >= Math.ceil(n * COMPLETENESS_TRUST_RATIO)
  // 告警：只看「之前见过回执」的对照。阿里云记录晚到 20、30 分钟时，新发的信本来就查不到，
  // 若拿它们告警，每趟都会记错误、lastOkAt 不前进，一小时后 worker 判定「同步中断」急停全部营销 ——
  // 把「阿里云慢」变成「营销停摆」（代码审查 C14 复核）
  const alarm = kn >= COMPLETENESS_ALARM_MIN && km < Math.floor(kn * COMPLETENESS_ALARM_RATIO)
  return { accepted: n, matched, trusted, alarm, knownAccepted: kn, knownMatched: km }
}

/** 查询接口的数组字段：可能是数组，也可能被包了一层对象（阿里云老接口的 XML→JSON 习惯） */
export function toArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v
  if (v && typeof v === 'object') {
    for (const x of Object.values(v as Record<string, unknown>)) if (Array.isArray(x)) return x
  }
  return []
}

/* ================================================================================================
 * 单趟
 * ================================================================================================ */

interface Ctx {
  t0: number
  deadline: number
  now: Date
  /** 当前的营销发信地址（ALIYUN_DM_MARKETING）；老数据没记 sender 的信按它算 */
  sender: string
  /** 已知的营销发信地址（小写）：当前地址 + 最近 31 天信上记过的地址（审查 C15） */
  senders: Set<string>
  errors: string[]
  /** 本趟新增的域名退避 */
  backoff: Record<string, string>
  summary: SyncSummary
}

function timeLeft(ctx: Ctx): number {
  return ctx.deadline - Date.now()
}
/** 还来得及发起一次接口调用吗（留出单次超时 + 1 秒余量） */
function canCall(ctx: Ctx): boolean {
  return timeLeft(ctx) > API_TIMEOUT_MS + 1000
}

function errText(r: RpcOutcome): string {
  return clip(r.code || r.errName || r.kind, 60) || 'error'
}

/**
 * 错误文字会进 mkt_sync.lastError（后台可见）与 cron.log。Prisma 的报错可能把查询参数原样带出来，
 * 所以先把长得像邮箱的片段抹掉，再截断。
 */
function scrub(s: string): string {
  return s.replace(/[^\s@'"`<>(),;:]+@[^\s@'"`<>(),;:]+/g, '***@***').replace(/\s+/g, ' ')
}

function pushError(ctx: Ctx, step: string, detail: string) {
  ctx.errors.push(clip(scrub(`${step}: ${detail}`), 160) as string)
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 191
}

function num(v: unknown): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

/**
 * 已知的营销发信地址（小写）：当前 ALIYUN_DM_MARKETING + 最近 31 天信上记过的地址（审查 C15）。
 * 设计允许换发信地址（迁到独立子域）不改代码 —— 换了之后旧地址发出的信的回执、投诉还会陆续来，
 * 只认当前地址就会把它们全丢掉。31 天覆盖屏蔽名单首次回溯的 30 天。
 * 用 groupBy（SQL GROUP BY）而不是 findMany distinct：后者是把行全取回来在内存里去重。
 */
async function knownMarketingSenders(current: string, now: Date): Promise<Set<string>> {
  const set = new Set<string>([current.trim().toLowerCase()])
  const rows = await prisma.marketingMessage.groupBy({
    by: ['sender'],
    where: {
      sender: { not: null },
      status: { in: ['SENDING', 'SENT', 'UNKNOWN', 'FAILED'] },
      claimedAt: { gte: new Date(now.getTime() - SENDER_LOOKBACK_DAYS * 86400_000) },
    },
  })
  for (const r of rows) if (r.sender && r.sender.trim()) set.add(r.sender.trim().toLowerCase())
  return set
}

export async function runSyncTick(): Promise<SyncSummary> {
  const t0 = Date.now()
  const summary: SyncSummary = {
    account: 'skipped',
    deliveries: { checked: 0, matched: 0, pages: 0 },
    unknownResolved: 0,
    blocks: { complaints: 0, unsubscribes: 0 },
    invalid: 0,
    errors: [],
    ms: 0,
  }
  const done = () => {
    summary.ms = Date.now() - t0
    return summary
  }

  // dry-run 的「已发送」都是假的 EnvId，阿里云那边什么都没有；没配置就更无从查起
  if (isDryRun()) {
    summary.skipped = 'dry_run'
    return done()
  }
  const sender = marketingSender()
  if (!aliyunKeysConfigured() || !sender) {
    summary.skipped = 'not_configured'
    return done()
  }

  const lock = await acquireLock('sync', LOCK_TTL_MS)
  if (!lock) {
    summary.skipped = 'locked'
    return done()
  }

  try {
    // 严格读（fail closed）：mkt_sync 读坏了若按空状态继续，会把游标、域名退避、lastOkAt 整块覆盖掉 ——
    // 所以它读不出来时连 lastRunAt 都不写，原样留给人看
    let prev: SyncState
    try {
      prev = await getSyncState({ strict: true })
    } catch (e) {
      summary.errors.push(clip(scrub(`同步状态读取失败，本趟中止：${(e as Error)?.message || e}`), 200) as string)
      console.error('[mkt/sync] mkt_sync 读取失败，本趟中止')
      return done()
    }
    try {
      await getConfig({ strict: true })
    } catch (e) {
      // 设计第 4 节：worker 与 sync 读配置失败即中止。lastOkAt 不前进 → worker 的同步健康检查会接着拦住发送
      summary.errors.push(clip(scrub(`营销配置读取失败，本趟中止：${(e as Error)?.message || e}`), 200) as string)
      console.error('[mkt/sync] marketing_config 读取失败，本趟中止')
      await saveSyncState({ ...prev, lastRunAt: new Date().toISOString(), lastError: summary.errors[0] })
      return done()
    }

    const ctx: Ctx = {
      t0,
      deadline: t0 + RUN_BUDGET_MS,
      now: new Date(),
      sender,
      senders: new Set([sender.toLowerCase()]),
      errors: summary.errors,
      backoff: {},
      summary,
    }
    try {
      ctx.senders = await knownMarketingSenders(sender, ctx.now)
    } catch (e) {
      // 读不出来就只认当前地址：回执查询本身按每封信记的地址分组，不受影响；只是旧地址的投诉/退订这一趟不记到信上
      pushError(ctx, 'senders', (e as Error)?.message || String(e))
    }

    const next: SyncState = {
      ...prev,
      domainBackoff: { ...(prev.domainBackoff || {}) },
    }

    // 各步骤互相独立：任何一步失败只记 lastError，不影响后面的步骤
    await stepAccount(ctx).catch((e) => pushError(ctx, 'account', (e as Error)?.message || String(e)))
    const cursor = await stepBlocks(ctx, prev.blockCursor).catch((e) => {
      pushError(ctx, 'block', (e as Error)?.message || String(e))
      return null
    })
    if (cursor != null) next.blockCursor = cursor
    await stepDeliveries(ctx).catch((e) => pushError(ctx, 'delivery', (e as Error)?.message || String(e)))
    const invalidCursor = await stepInvalid(ctx, prev.invalidCursor).catch((e) => {
      pushError(ctx, 'invalid', (e as Error)?.message || String(e))
      return null
    })
    if (invalidCursor) next.invalidCursor = invalidCursor

    // 域名退避：合并本趟新增，清掉已过期的，数量封顶（按到期时间保留最晚的）
    const nowMs = Date.now()
    const merged: Record<string, string> = {}
    const entries = Object.entries({ ...next.domainBackoff, ...ctx.backoff })
      .filter(([, until]) => {
        const t = Date.parse(until)
        return !Number.isNaN(t) && t > nowMs
      })
      .sort((a, b) => Date.parse(b[1]) - Date.parse(a[1]))
      .slice(0, MAX_BACKOFF_DOMAINS)
    for (const [d, until] of entries) merged[d] = until
    next.domainBackoff = merged

    const endIso = new Date().toISOString()
    next.lastRunAt = endIso
    if (summary.errors.length) {
      next.lastError = clip(summary.errors.join('；'), 500)
    } else {
      next.lastOkAt = endIso
      next.lastError = null
    }
    await saveSyncState(next)

    console.log(
      '[mkt/sync] account=%s deliveries=%d/%d pages=%d unknownResolved=%d complaints=%d unsubs=%d invalid=%d errors=%d',
      summary.account,
      summary.deliveries.matched,
      summary.deliveries.checked,
      summary.deliveries.pages,
      summary.unknownResolved,
      summary.blocks.complaints,
      summary.blocks.unsubscribes,
      summary.invalid,
      summary.errors.length
    )
    return done()
  } finally {
    await releaseLock('sync', lock)
  }
}

/* ------------------------------ 1. 账户 ------------------------------ */

const USER_STATUS_TEXT: Record<number, string> = { 1: '冻结', 2: '欠费', 4: '限制外发', 8: '已删除' }

async function stepAccount(ctx: Ctx): Promise<void> {
  const cur = await getAccountState()
  const fetched = cur ? Date.parse(cur.fetchedAt) : NaN
  if (cur && !Number.isNaN(fetched)) {
    const age = ctx.now.getTime() - fetched
    // 未来 5 分钟以内的时间戳当作时钟误差；更离谱的「未来」不可信，重新取
    if (age >= -5 * 60_000 && age < ACCOUNT_REFRESH_MS) {
      ctx.summary.account = 'fresh'
      return
    }
  }
  if (!canCall(ctx)) return
  const r = await dmCall('DescAccountSummary', {}, { timeoutMs: API_TIMEOUT_MS })
  if (r.kind !== 'ok') {
    ctx.summary.account = 'failed'
    pushError(ctx, 'DescAccountSummary', errText(r))
    return
  }
  const j = (r.json || {}) as Record<string, unknown>
  const dailyQuota = num(j.DailyQuota)
  const userStatus = num(j.UserStatus)
  if (dailyQuota == null || dailyQuota < 0 || userStatus == null) {
    // 字段缺失就不写：写进去一个 NaN/0，worker 会按它算出 0 额度或更糟
    ctx.summary.account = 'failed'
    pushError(ctx, 'DescAccountSummary', '返回缺少 DailyQuota/UserStatus')
    return
  }
  const state: AccountState = {
    dailyQuota,
    monthQuota: num(j.MonthQuota),
    quotaLevel: num(j.QuotaLevel),
    maxQuotaLevel: num(j.MaxQuotaLevel),
    userStatus,
    ipChannelType: typeof j.IpChannelType === 'string' ? clip(j.IpChannelType, 20) : null,
    remainFreeQuota: num(j.RemainFreeQuota),
    fetchedAt: new Date().toISOString(),
  }
  await saveAccountState(state)
  ctx.summary.account = 'updated'

  if (userStatus !== 0) {
    // 账户被冻结 / 欠费 / 限制外发：继续发只会一封封报错，还可能让处罚升级。急停 24 小时 + 通知。
    // 已经在更长的急停里就不重复设（setHalt 会发通知，每小时刷一次账户就每小时推一条没有意义）
    const halt = await getHalt()
    const until = halt.until ? Date.parse(halt.until) : NaN
    const longEnough = isHalted(halt, ctx.now) && !Number.isNaN(until) && until - ctx.now.getTime() > 12 * 3600_000
    if (!longEnough) {
      const bits = Object.keys(USER_STATUS_TEXT)
        .map(Number)
        .filter((b) => (userStatus & b) === b)
        .map((b) => USER_STATUS_TEXT[b])
      await setHalt(
        new Date(ctx.now.getTime() + 24 * 3600_000),
        `阿里云邮件推送账户状态异常（UserStatus=${userStatus}${bits.length ? `：${bits.join('、')}` : ''}），请到阿里云控制台处理`,
        'system'
      )
    }
  }
}

/* ------------------------------ 2. 投诉 / 退订屏蔽名单 ------------------------------ */

/**
 * 与这次投诉/退订最接近的那封营销邮件（发送时间不晚于事件时间 + 10 分钟里最近的一封）。
 * 记录带了发信地址时只找那个地址发的信（没记 sender 的老数据也算）—— 换过地址后，旧地址那封信的投诉不能记到新地址的信上
 */
async function nearestMessage(email: string, atSec: number | null, sender: string | null) {
  const cap = atSec ? new Date(atSec * 1000 + 10 * 60_000) : new Date()
  return prisma.marketingMessage.findFirst({
    where: {
      email,
      status: { in: ['SENT', 'UNKNOWN'] },
      sentAt: { not: null, lte: cap },
      ...(sender ? { OR: [{ sender }, { sender: null }] } : {}),
    },
    orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
    select: { id: true, campaignId: true, userId: true, complainedAt: true, unsubscribedAt: true },
  })
}

async function userIdForEmail(email: string, hint: number | null): Promise<number | null> {
  if (hint) {
    const u = await prisma.user.findUnique({ where: { id: hint }, select: { id: true } })
    if (u) return u.id
  }
  const u = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  return u?.id ?? null
}

async function handleBlock(
  ctx: Ctx,
  type: 'REPORT' | 'UNSUB',
  email: string,
  atSec: number | null,
  reason: number | null,
  senderEmail: string | null
): Promise<boolean> {
  // 屏蔽名单现在按整个账户拉（审查 C15）：交易邮件地址（no-reply@ 等）上的投诉/退订也会来。
  // 那些照样抑制营销、退订营销（阿里云按 mailfrom_domain 也会拦我们的营销信，提前停掉是安全方向），
  // 但不记到任何一封营销邮件上 —— 那场活动没招来这次投诉，记上去会误触发熔断。没给发信地址的记录按营销处理（与以前一致）
  const marketing = !senderEmail || ctx.senders.has(senderEmail)
  const msg = marketing ? await nearestMessage(email, atSec, senderEmail) : null
  const now = new Date()
  const origin = marketing ? '' : '（针对本站非营销发信地址的邮件）'
  if (type === 'REPORT') {
    // 投诉：永久抑制（管理员也解不开）+ 退订 + 记到就近那封信上
    await suppressEmail(email, 'COMPLAINT', 'aliyun_sync', clip(`ListBlockSending REPORT${reason != null ? ` reason=${reason}` : ''}${origin}`, 500), msg?.campaignId ?? null)
    if (msg && !msg.complainedAt) {
      await prisma.marketingMessage.updateMany({ where: { id: msg.id, complainedAt: null }, data: { complainedAt: now } })
    }
  } else if (msg && !msg.unsubscribedAt) {
    const { count } = await prisma.marketingMessage.updateMany({ where: { id: msg.id, unsubscribedAt: null }, data: { unsubscribedAt: now } })
    if (count === 1) {
      await prisma.marketingEvent.create({ data: { campaignId: msg.campaignId, messageId: msg.id, type: 'UNSUB', createdAt: now } })
    }
  }
  const userId = await userIdForEmail(email, msg?.userId ?? null)
  if (userId) {
    await applyConsentChange(
      userId,
      { kind: 'unsubscribe' },
      {
        source: type === 'REPORT' ? 'complaint' : 'aliyun_sync',
        email,
        campaignId: msg?.campaignId ?? null,
        messageId: msg?.id ?? null,
        note: (type === 'REPORT' ? '收件人向邮箱服务商投诉为垃圾邮件' : '收件人通过邮箱服务商的退订按钮退订') + origin,
      }
    )
  }
  return true
}

/**
 * 返回新的游标（Unix 秒）；这一趟没能完整拉完（截断/报错）返回 null —— 游标不动，下一趟重来（操作都是幂等的）。
 */
async function stepBlocks(ctx: Ctx, cursor: number | null): Promise<number | null> {
  const endSec = Math.floor(ctx.now.getTime() / 1000)
  // 首次运行从 30 天前开始：上线前阿里云已经积累的投诉/退订要一次导进来
  const beginSec = cursor != null && cursor > 0 && cursor < endSec ? cursor : endSec - BLOCK_FIRST_RUN_DAYS * 86400
  let pagesLeft = MAX_PAGES_PER_API
  let complete = true

  for (const type of ['REPORT', 'UNSUB'] as const) {
    let token = ''
    for (;;) {
      if (pagesLeft <= 0 || !canCall(ctx)) {
        complete = false
        break
      }
      pagesLeft--
      // 不带 SenderEmail，按整个账户拉（审查 C15）：换过营销发信地址后，旧地址那些信的投诉/退订还会陆续到，
      // 只查当前地址就永远漏掉；交易地址上的投诉/退订也一并停掉营销（handleBlock 里不记到活动头上）
      const params: Record<string, string> = {
        BlockType: type,
        BeginTime: String(beginSec),
        EndTime: String(endSec),
        MaxResults: String(BLOCK_PAGE_SIZE),
      }
      if (token) params.NextToken = token
      const r = await dmCall('ListBlockSending', params, { timeoutMs: API_TIMEOUT_MS })
      if (r.kind !== 'ok') {
        pushError(ctx, `ListBlockSending ${type}`, errText(r))
        complete = false
        break
      }
      const rows = toArray((r.json as Record<string, unknown> | undefined)?.Data)
      for (const raw of rows) {
        if (timeLeft(ctx) < 2000) {
          complete = false
          break
        }
        try {
          const row = (raw || {}) as Record<string, unknown>
          const email = String(row.BlockEmail ?? '').trim().toLowerCase()
          if (looksMasked(email)) {
            // 打码的地址对不上任何人：这批数据不能当「已处理」，游标不前进，并在 lastError 里提示
            complete = false
            pushError(ctx, `ListBlockSending ${type}`, '返回的收件地址被打码，无法比对')
            break
          }
          if (!isEmail(email)) continue
          const at = num(row.SendTime) ?? num(row.BlockTime)
          // 发信地址缺失或被打码 = 不知道是哪个地址发的，按营销处理（handleBlock）
          const rawSender = String(row.SenderEmail ?? '').trim().toLowerCase()
          const senderEmail = rawSender && !looksMasked(rawSender) ? rawSender : null
          if (await handleBlock(ctx, type, email, at, num(row.Reason), senderEmail)) {
            if (type === 'REPORT') ctx.summary.blocks.complaints++
            else ctx.summary.blocks.unsubscribes++
          }
        } catch (e) {
          complete = false
          pushError(ctx, `block ${type} row`, (e as Error)?.message || String(e))
        }
      }
      if (!complete) break
      const nextToken = String((r.json as Record<string, unknown> | undefined)?.NextToken ?? '').trim()
      if (!nextToken || !rows.length || nextToken === token) break
      token = nextToken
    }
    if (!complete) break
  }
  // 游标回退 1 小时：阿里云的名单写入有延迟，边界附近的记录下一趟再看一遍（处理是幂等的）
  return complete ? Math.max(beginSec, endSec - BLOCK_OVERLAP_SEC) : null
}

/* ------------------------------ 3. 投递回执 + UNKNOWN 对账 ------------------------------ */

interface PendingMsg {
  id: number
  campaignId: number
  userId: number | null
  email: string
  domain: string
  subjectSent: string | null
  claimedAt: Date | null
  sentAt: Date | null
  status: string
  delivery: string | null
  deliveryDetail: string | null
  errorCode: string | null
  /** 这封信实际用的营销发信地址；老数据没有 → 按当前地址 */
  sender: string | null
  openedAt: Date | null
  clickedAt: Date | null
}

/** 一个发信地址的待查消息与估算用的发送记录 */
interface SenderGroup {
  /** 查询时用的原样地址（AccountName） */
  name: string
  pending: PendingMsg[]
  /** 这个地址这段时间的全部发送（估算窗口条数） */
  sendTimes: number[]
  /** 这个地址确知被阿里云受理的发送（完整性正对照），按时间升序 */
  accepted: AcceptedSend[]
}

type SenderWindow = PlannedWindow & { sender: string }

async function stepDeliveries(ctx: Ctx): Promise<void> {
  const now = ctx.now
  const since = new Date(now.getTime() - PENDING_HOURS * 3600_000)
  // 「投递失败」(status 4) 72 小时内会复查，但每小时查一次就够了：
  // 它周围 ±2 小时的全部邮件都得跟着翻一遍，每 5 分钟翻一次纯属浪费
  const recheckFailed = Math.floor(now.getTime() / 300_000) % 12 === 0
  const pending: PendingMsg[] = await prisma.marketingMessage.findMany({
    where: {
      status: { in: ['SENT', 'UNKNOWN'] },
      claimedAt: { gte: since },
      subjectSent: { not: null },
      OR: recheckFailed ? [{ delivery: null }, { delivery: 'FAILED' }] : [{ delivery: null }],
    },
    select: {
      id: true,
      campaignId: true,
      userId: true,
      email: true,
      domain: true,
      subjectSent: true,
      claimedAt: true,
      sentAt: true,
      status: true,
      delivery: true,
      deliveryDetail: true,
      errorCode: true,
      sender: true,
      openedAt: true,
      clickedAt: true,
    },
    orderBy: { claimedAt: 'asc' },
    take: 20000,
  })
  ctx.summary.deliveries.checked = pending.length
  if (!pending.length) return

  // 每封信按它自己的发信地址查（审查 C15）：换过 ALIYUN_DM_MARKETING 后，旧地址发出的信只能用旧地址查到。
  // 分组键是小写地址；查询参数用信上记的原样地址
  const nameOf = (s: string | null | undefined) => (s && s.trim() ? s.trim() : ctx.sender)
  const groupKey = (s: string | null | undefined) => nameOf(s).toLowerCase()
  const groups = new Map<string, SenderGroup>()
  for (const m of pending) {
    const k = groupKey(m.sender)
    let g = groups.get(k)
    if (!g) {
      g = { name: nameOf(m.sender), pending: [], sendTimes: [], accepted: [] }
      groups.set(k, g)
    }
    g.pending.push(m)
  }

  // 估算窗口条数 + 完整性正对照：这段时间我们发出去（或可能发出去）的全部营销邮件
  const minAt = (pending[0].claimedAt as Date).getTime()
  const sends = await prisma.marketingMessage.findMany({
    where: { status: { in: ['SENT', 'UNKNOWN', 'FAILED', 'SENDING'] }, claimedAt: { gte: new Date(minAt - WINDOW_PAD_MS) } },
    select: { claimedAt: true, status: true, envId: true, sender: true, email: true, subjectSent: true, delivery: true },
    take: 200000,
  })
  for (const s of sends) {
    if (!s.claimedAt) continue
    const g = groups.get(groupKey(s.sender))
    if (!g) continue // 这个地址这趟没有待查的信，不用查
    const t = s.claimedAt.getTime()
    g.sendTimes.push(t)
    // 确知被阿里云受理（SENT 且有 EnvId）的才拿来当对照
    if (s.status === 'SENT' && s.envId && s.subjectSent) {
      g.accepted.push({ at: t, key: deliveryKey(s.email, s.subjectSent), known: s.delivery != null })
    }
  }

  const planned: SenderWindow[] = []
  groups.forEach((g, k) => {
    g.accepted.sort((a, b) => a.at - b.at)
    const ws = planDeliveryWindows(
      g.pending.map((m) => ({ id: m.id, at: (m.claimedAt as Date).getTime() })),
      g.sendTimes,
      { padMs: WINDOW_PAD_MS, minPadMs: 10 * 60_000, maxRows: WINDOW_MAX_ROWS }
    )
    for (const w of ws) planned.push({ ...w, sender: k })
  })
  const windows = orderWindows(planned, now)

  const rows: DeliveryRow[] = []
  // 「完整且可信」的窗口负责的消息 id，按发信地址分开：只有那个地址自己的查询这一趟完整跑完，才能对它的信下「查不到」的结论
  const trusted = new Map<string, Set<number>>()
  let pagesLeft = MAX_PAGES_PER_API
  let apiFailed = false
  for (const w of windows) {
    if (apiFailed || pagesLeft <= 0 || !canCall(ctx)) break
    const g = groups.get(w.sender) as SenderGroup
    const wRows: DeliveryRow[] = []
    let nextStart = ''
    let complete = false
    let noData = false
    for (;;) {
      if (pagesLeft <= 0 || !canCall(ctx)) break
      pagesLeft--
      ctx.summary.deliveries.pages++
      const params: Record<string, string> = {
        AccountName: g.name,
        StartTime: bjMinuteString(new Date(w.start)),
        // 结束时间按分钟截断，补 1 分钟保证包含
        EndTime: bjMinuteString(new Date(w.end + 60_000)),
        Length: String(DETAIL_PAGE_SIZE),
      }
      if (nextStart) params.NextStart = nextStart
      const r = await dmCall('SenderStatisticsDetailByParam', params, { timeoutMs: API_TIMEOUT_MS })
      if (r.kind !== 'ok') {
        pushError(ctx, 'SenderStatisticsDetailByParam', errText(r))
        apiFailed = true
        break
      }
      const j = (r.json || {}) as Record<string, unknown>
      const data = j.data
      // 审查 C14：200 却没有 data（比如 {}）—— 阿里云对「确实一封都没有」可能也这样回（SDK 里 data 是 omitempty），
      // 也可能是没拿到数据。两种分不清，所以：这个窗口**绝不据此判 NOT_FOUND**；
      // 但也不当成整趟失败（否则每 5 分钟报一次错、lastOkAt 冻住，一小时后急停全部营销）。
      // 是否真出了问题交给下面的正对照：之前见过回执的信这次全不见了，才告警
      if (!data || typeof data !== 'object') {
        noData = true
        complete = true
        break
      }
      const page = toArray((data as Record<string, unknown>).mailDetail ?? data)
      for (const raw of page) {
        const row = parseDeliveryRow(raw)
        if (!row) continue
        // 按发信地址查的：行上没带 AccountName 就记成查询用的地址，匹配时据此区分新旧地址的信
        if (!row.accountName) row.accountName = w.sender
        wRows.push(row)
      }
      const ns = String(j.NextStart ?? '').trim()
      if (page.length < DETAIL_PAGE_SIZE || !ns || ns === nextStart) {
        complete = true
        break
      }
      nextStart = ns
    }
    rows.push(...wRows)
    if (!complete) continue
    if (wRows.some((r) => looksMasked(r.toAddress))) {
      pushError(ctx, 'SenderStatisticsDetailByParam', '返回的收件地址被打码，无法比对')
      continue
    }
    // 可信度（审查 C14）：整个查询窗口里确知被受理的信，几乎都得在返回的数据里找得到
    const c = windowCompleteness(w, g.accepted, wRows, Date.now())
    if (noData) {
      if (c.alarm) {
        pushError(ctx, 'SenderStatisticsDetailByParam', `响应缺少 data，而该时段有 ${c.knownAccepted} 封之前查到过回执的信`)
      }
      continue // 不可信：这个窗口里的 UNKNOWN 这趟不下「查不到」的结论
    }
    if (c.trusted) {
      let set = trusted.get(w.sender)
      if (!set) trusted.set(w.sender, (set = new Set()))
      for (const id of w.ids) set.add(id)
    } else if (c.alarm) {
      // 大面积对不上（数据被截断、主题/地址格式变了）：记进 lastError，lastOkAt 不前进
      pushError(
        ctx,
        'SenderStatisticsDetailByParam',
        `回执数据不完整：该时段之前查到过回执的 ${c.knownAccepted} 封，这次只查到 ${c.knownMatched} 封`
      )
    } else {
      // 零星几封对不上（阿里云个别记录晚到）：这个窗口不下「查不到」的结论就够了，不必让整个同步算失败、停掉发送
      console.warn('[mkt/sync] 回执窗口不完整，暂不判定 NOT_FOUND：受理 %d、查到 %d', c.accepted, c.matched)
    }
  }

  // 锚点（审查 C17）：同邮箱、可能已发出、但不在待查里的信（比如已经有回执的新信）。
  // 它们参与匹配、占住自己的回执，免得被更早的待查信抢走；只有待查的信会落库
  const pendingIds = new Set(pending.map((m) => m.id))
  const rowEmails = new Set(rows.map((r) => r.toAddress))
  const emails = Array.from(new Set(pending.map((m) => m.email.trim().toLowerCase()))).filter((e) => rowEmails.has(e))
  const anchors: MatchableMessage[] = []
  for (let i = 0; i < emails.length; i += 1000) {
    const found = await prisma.marketingMessage.findMany({
      where: {
        email: { in: emails.slice(i, i + 1000) },
        status: { in: ['SENT', 'UNKNOWN', 'SENDING'] },
        subjectSent: { not: null },
        claimedAt: { gte: new Date(minAt - WINDOW_PAD_MS) },
      },
      select: { id: true, email: true, subjectSent: true, claimedAt: true, sender: true },
    })
    for (const a of found) if (!pendingIds.has(a.id)) anchors.push({ ...a, sender: nameOf(a.sender) })
  }

  // 行只认已知的营销发信地址（当前 + 最近用过的 + 这趟查询的）
  const allowed = new Set(ctx.senders)
  groups.forEach((_, k) => allowed.add(k))
  const candidates: MatchableMessage[] = pending.map((m) => ({
    id: m.id,
    email: m.email,
    subjectSent: m.subjectSent,
    claimedAt: m.claimedAt,
    sender: nameOf(m.sender),
  }))
  const matches = matchDelivery(rows, candidates.concat(anchors), allowed)
  ctx.summary.deliveries.matched = pending.reduce((n, m) => n + (matches.has(m.id) ? 1 : 0), 0)

  for (const m of pending) {
    if (timeLeft(ctx) < 1500) break
    const row = matches.get(m.id)
    try {
      if (row) {
        if (await applyDelivery(ctx, m, row)) ctx.summary.unknownResolved++
      } else if (m.status === 'UNKNOWN' && (m.openedAt || m.clickedAt)) {
        // 审查 C14：收件人真打开/点过（机器的不记这两列）= 信确实送到了 —— 像素和跳转链接只存在于发出去的信里。
        // 绝不能标 UNKNOWN_NOT_FOUND（那会允许重排、重复发信；已经标上的也改回来）。对账成 SENT，回执以后照常匹配
        const { count } = await prisma.marketingMessage.updateMany({
          where: { id: m.id, status: 'UNKNOWN' },
          data: { status: 'SENT', sentAt: m.sentAt ?? m.claimedAt, errorCode: null, errorMsg: null },
        })
        if (count === 1) ctx.summary.unknownResolved++
      } else if (
        m.status === 'UNKNOWN' &&
        m.errorCode !== 'UNKNOWN_NOT_FOUND' &&
        !apiFailed &&
        !!trusted.get(groupKey(m.sender))?.has(m.id) &&
        m.claimedAt &&
        now.getTime() - m.claimedAt.getTime() > UNKNOWN_NOT_FOUND_AFTER_MS
      ) {
        // 阿里云确实没有这封信的记录：此后才允许管理员重排（设计 5.1 requeue）
        await prisma.marketingMessage.updateMany({
          where: { id: m.id, status: 'UNKNOWN', openedAt: null, clickedAt: null },
          data: { errorCode: 'UNKNOWN_NOT_FOUND', errorMsg: '阿里云投递记录里查不到这封邮件（领取 2 小时后），可以重新排队' },
        })
      }
    } catch (e) {
      pushError(ctx, `delivery row #${m.id}`, (e as Error)?.message || String(e))
    }
  }
}

/** 把一条回执落到消息上；返回是否把一封 UNKNOWN 对账成了 SENT */
async function applyDelivery(ctx: Ctx, m: PendingMsg, row: DeliveryRow): Promise<boolean> {
  const delivery = deliveryFromStatus(row.status)
  if (!delivery) return false // 还在投递中（或未知状态值），下一趟再看
  const detail = clip(`${row.errorClassification} ${row.message}`.trim(), 255) || null
  const wasUnknown = m.status === 'UNKNOWN'
  const newlySeen = m.delivery !== delivery || (m.deliveryDetail || null) !== detail
  if (!newlySeen && !wasUnknown) return false

  // 送达时间取阿里云的更新时间（纪元秒，与进程 TZ 无关），夹在 [领取时间, 现在] 之间防脏数据
  const nowMs = Date.now()
  let atMs = row.utcSec != null ? row.utcSec * 1000 : nowMs
  if (m.claimedAt && atMs < m.claimedAt.getTime()) atMs = m.claimedAt.getTime()
  if (atMs > nowMs) atMs = nowMs

  const data: Record<string, unknown> = { delivery, deliveryDetail: detail, deliveryAt: new Date(atMs) }
  if (wasUnknown) {
    // 阿里云有这封信的记录 = 当时其实发出去了（超时/进程被杀导致我们不知道）
    data.status = 'SENT'
    data.sentAt = m.sentAt ?? m.claimedAt
    data.errorCode = null
    data.errorMsg = null
  }
  const { count } = await prisma.marketingMessage.updateMany({
    where: { id: m.id, status: m.status, OR: [{ delivery: null }, { delivery: 'FAILED' }] },
    data,
  })
  if (count !== 1) return false
  if (newlySeen) await applyClassification(ctx, m, row, delivery, detail)
  return wasUnknown
}

async function applyClassification(ctx: Ctx, m: PendingMsg, row: DeliveryRow, delivery: DeliveryStatus, detail: string | null) {
  const kind = classifyDeliveryError(row.errorClassification)
  const email = m.email.toLowerCase()
  const now = new Date()
  if (kind === 'hard_bounce') {
    await suppressEmail(email, 'HARD_BOUNCE', 'aliyun_sync', detail, m.campaignId)
    return
  }
  // 审查 C16：SysOutRecipientReportedSpam / SysOutRecipientUnsubscribed 的意思是「这个人**以前**投诉/退订过，
  // 阿里云直接拦下了这封」（560 / 562）。这封信根本没送到、什么也没招来：地址照样抑制、照样退订，
  // 但不在这封信上记 complainedAt / unsubscribedAt、留痕也不挂这封信 —— 否则这场活动平白多出投诉，
  // 活动熔断、账户级急停、预热达标日全被误触发（真正的那次投诉由屏蔽名单导入时记到原来那封信上）
  if (kind === 'complaint') {
    await suppressEmail(email, 'COMPLAINT', 'aliyun_sync', clip(`投递回执：此前已投诉，阿里云拦截（活动 #${m.campaignId}）${detail ? ` ${detail}` : ''}`, 500), null)
    const userId = await userIdForEmail(email, m.userId)
    if (userId) {
      await applyConsentChange(
        userId,
        { kind: 'unsubscribe' },
        { source: 'complaint', email, campaignId: null, messageId: null, note: `投递回执：收件人此前投诉过垃圾邮件，发送活动 #${m.campaignId} 时被阿里云拦截` }
      )
    }
    return
  }
  if (kind === 'unsubscribed') {
    const userId = await userIdForEmail(email, m.userId)
    if (userId) {
      await applyConsentChange(
        userId,
        { kind: 'unsubscribe' },
        { source: 'aliyun_sync', email, campaignId: null, messageId: null, note: `投递回执：收件人此前已在阿里云退订，发送活动 #${m.campaignId} 时被拦截` }
      )
    }
    return
  }
  if (kind === 'rate') {
    const domain = (m.domain || emailDomain(email)).toLowerCase()
    if (domain) ctx.backoff[domain] = new Date(now.getTime() + DOMAIN_BACKOFF_MS).toISOString()
    return
  }
  // 审查 C19：我方 SPF/DKIM/DMARC 坏了、发信人/域名被拉黑 —— 收件人的邮箱没问题：不抑制、不退避收件域名。
  // （这类失败的比例由 worker 的熔断去看，那是「我方发信出故障、该停发」的信号）
  if (kind === 'sender') return
  // 其它分类：无效地址（status 2）直接抑制；失败（status 4）看是不是连续第 3 次
  if (delivery === 'INVALID') {
    await suppressEmail(email, 'INVALID', 'aliyun_sync', detail, m.campaignId)
    return
  }
  if (delivery === 'FAILED') {
    const last = await prisma.marketingMessage.findMany({
      where: { email, delivery: { not: null } },
      orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
      take: 3,
      select: { delivery: true, deliveryDetail: true },
    })
    if (isSoftBounceStreak(last)) await suppressEmail(email, 'SOFT_BOUNCE', 'aliyun_sync', detail, m.campaignId)
  }
}

/* ------------------------------ 4. 无效地址库（每个北京日一次） ------------------------------ */

async function stepInvalid(ctx: Ctx, cursor: string | null): Promise<string | null> {
  const today = bjDateKey(ctx.now)
  if (cursor === today) return null
  const floor = addBjDays(today, -INVALID_LOOKBACK_DAYS)
  const start = cursor && /^\d{4}-\d{2}-\d{2}$/.test(cursor) && cursor > floor ? cursor : floor
  let nextStart = ''
  let pages = 0
  let rowFailed = false
  for (;;) {
    if (pages >= MAX_PAGES_PER_API || !canCall(ctx)) return null // 没拉完：游标不动，下一趟接着来
    pages++
    const params: Record<string, string> = { StartTime: start, EndTime: today, Length: String(INVALID_PAGE_SIZE) }
    if (nextStart) params.NextStart = nextStart
    const r = await dmCall('QueryInvalidAddress', params, { timeoutMs: API_TIMEOUT_MS })
    if (r.kind !== 'ok') {
      pushError(ctx, 'QueryInvalidAddress', errText(r))
      return null
    }
    const j = (r.json || {}) as Record<string, unknown>
    const data = j.data as Record<string, unknown> | undefined
    const page = toArray(data?.mailDetail ?? data)
    const emails: string[] = []
    for (const raw of page) {
      const e = String((raw as Record<string, unknown> | null)?.ToAddress ?? '').trim().toLowerCase()
      if (isEmail(e) && !looksMasked(e)) emails.push(e)
    }
    if (emails.length) {
      // 账户级无效地址库里也有交易邮件的收件人（比如下单时填错的邮箱）。只抑制本站注册用户的地址 ——
      // 只有他们才可能收到营销邮件，别的地址存进来只是多保管一份个人信息
      const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { email: true } })
      for (const u of users) {
        if (!u.email) continue
        try {
          await suppressEmail(u.email.toLowerCase(), 'INVALID', 'aliyun_sync', 'QueryInvalidAddress：阿里云无效地址库')
          ctx.summary.invalid++
        } catch (e) {
          rowFailed = true
          pushError(ctx, 'invalid row', (e as Error)?.message || String(e))
        }
      }
    }
    const ns = String(j.NextStart ?? '').trim()
    // 有行写失败就不推进游标：明天（或下一趟）重拉一遍，抑制是幂等的
    if (page.length < INVALID_PAGE_SIZE || !ns || ns === nextStart) return rowFailed ? null : today
    nextStart = ns
  }
}
