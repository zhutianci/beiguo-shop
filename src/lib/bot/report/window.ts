/**
 * 日报与日报类指令的统计窗口（docs/微信机器人-设计.md §6.1、§6.4；附录 B 第 13 条）。纯函数，不连库；
 * scripts/check-bot-report.ts 覆盖跨月、跨年、北京时间零点边界。
 *
 * 【一律按北京时间】窗口边界用 lib/marketing/time.ts 的 bjDayStart / bjDateToStart / addBjDays 算，与容器 TZ 无关
 * （交接文档第六节：改过一次 TZ，凡是依赖进程时区的日期运算都出过事）。北京没有夏令时，所以「前一日 / 上周同日」
 * 直接按 86400 秒平移，等价于按日历平移。
 *
 * 窗口一律是左闭右开 [start, end)：
 *  - 日（日报 / 昨日 / 补看）：北京自然日 [D 0 点, D+1 0 点)；
 *  - 今日：[今天 0 点, 现在)；
 *  - 本周：[本周一 0 点, 现在)；本月：[本月 1 日 0 点, 现在)。
 * dayFrom / dayTo 是窗口覆盖的北京日期（含两端），给 page_views.day_key 用（那一列写入时已按东八区算成字符串）。
 *
 * 对比窗口（§6.2「较前一日、较上周同日」）：日 = 前一日、上周同日；今日 = 昨日同时段、上周同日同时段（拿半天和整天比没有意义）；
 * 本周 = 上周同期；本月 = 上月同期（上月 1 日起同样长的一段，最长到上月月底）。
 */
import { addBjDays, bjDateKey, bjDateToStart, bjDayStart } from '../../marketing/time'

const DAY_MS = 86400_000
const BJ_OFFSET_MS = 8 * 3600_000
/** 补看的最早日期（再早没有业务数据，也防止写错年份查出一串 0） */
export const REPORT_MIN_DAY = '2020-01-01'

export type ReportWindowKind = 'day' | 'today' | 'week' | 'month'

/** 一段时间：[start, end) 与它覆盖的北京日期 */
export interface ReportSpan {
  start: Date
  end: Date
  /** 区间第一天（北京日期 YYYY-MM-DD） */
  dayFrom: string
  /** 区间最后一天（含）；end 恰好是零点时不含 end 那一天 */
  dayTo: string
}

/** 对比用的一段时间，label 是渲染时的前缀：较前日 / 较上周同日 / 较昨日同时段 … */
export interface CompareSpan extends ReportSpan {
  label: string
}

export interface ReportWindow extends ReportSpan {
  kind: ReportWindowKind
  /** 标题：10月4日 / 今日（10月5日 截至 14:32）/ 本周（9月29日–10月5日）/ 本月（10月1日–10月5日）；跨年的日期带年份 */
  title: string
  /** 「本日收益」这类词：本日 / 今日 / 本周 / 本月 */
  word: string
  /** 「昨日发送」这类词：昨日（报的是昨天）/ 当日（补看更早的）/ 今日 / 本周 / 本月 */
  relWord: string
  /** 对比窗口，按渲染顺序 */
  compares: CompareSpan[]
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** YYYY-MM-DD 且是真实存在的日期（挡 2026-02-30、2026-13-01） */
export function isRealDayKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false
  const [y, m, d] = key.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

/** 2026-10-04 → 10月4日（withYear：2026年10月4日） */
export function cnDay(key: string, withYear = false): string {
  const [y, m, d] = key.split('-').map(Number)
  return `${withYear ? `${y}年` : ''}${m}月${d}日`
}

/** 北京时间 HH:mm */
export function bjHm(d: Date): string {
  return new Date(d.getTime() + BJ_OFFSET_MS).toISOString().slice(11, 16)
}

/** [start, end) 覆盖的北京日期。空区间（start = end）算 start 那一天 */
export function spanOf(start: Date, end: Date): ReportSpan {
  const last = new Date(Math.max(start.getTime(), end.getTime() - 1))
  return { start, end, dayFrom: bjDateKey(start), dayTo: bjDateKey(last) }
}

function shifted(s: ReportSpan, days: number, label: string): CompareSpan {
  return { ...spanOf(new Date(s.start.getTime() + days * DAY_MS), new Date(s.end.getTime() + days * DAY_MS)), label }
}

/** 北京日期 key 那一整天：[key 0 点, key+1 0 点) */
function wholeDay(key: string): ReportSpan {
  return spanOf(bjDateToStart(key), bjDateToStart(addBjDays(key, 1)))
}

/** 某一个北京自然日（日报、昨日、补看）。now 只用来判断「昨日 / 当日」与要不要写年份 */
export function dayWindow(key: string, now: Date = new Date()): ReportWindow {
  const todayKey = bjDateKey(now)
  return {
    kind: 'day',
    ...wholeDay(key),
    title: cnDay(key, key.slice(0, 4) !== todayKey.slice(0, 4)),
    word: '本日',
    relWord: key === addBjDays(todayKey, -1) ? '昨日' : '当日',
    compares: [
      { ...wholeDay(addBjDays(key, -1)), label: '较前日' },
      { ...wholeDay(addBjDays(key, -7)), label: '较上周同日' },
    ],
  }
}

/** 刚结束的北京自然日（零点日报的窗口：[今天 0 点 − 1 天, 今天 0 点)） */
export function yesterdayWindow(now: Date = new Date()): ReportWindow {
  return dayWindow(addBjDays(bjDateKey(now), -1), now)
}

/** 今日：[今天 0 点, 现在) */
export function todayWindow(now: Date = new Date()): ReportWindow {
  const span = spanOf(bjDayStart(now), now)
  return {
    kind: 'today',
    ...span,
    title: `今日（${cnDay(span.dayFrom)} 截至 ${bjHm(now)}）`,
    word: '今日',
    relWord: '今日',
    compares: [shifted(span, -1, '较昨日同时段'), shifted(span, -7, '较上周同日同时段')],
  }
}

/** 本周（周一起）：[本周一 0 点, 现在) */
export function weekWindow(now: Date = new Date()): ReportWindow {
  const key = bjDateKey(now)
  const dow = new Date(bjDateToStart(key).getTime() + BJ_OFFSET_MS).getUTCDay() // 0 = 周日
  const monday = addBjDays(key, -((dow + 6) % 7))
  const span = spanOf(bjDateToStart(monday), now)
  return {
    kind: 'week',
    ...span,
    title: `本周（${cnDay(monday)}–${cnDay(key)}）`,
    word: '本周',
    relWord: '本周',
    compares: [shifted(span, -7, '较上周同期')],
  }
}

/** 本月：[本月 1 日 0 点, 现在)；对比上月 1 日起同样长的一段（最长到上月月底） */
export function monthWindow(now: Date = new Date()): ReportWindow {
  const key = bjDateKey(now)
  const first = `${key.slice(0, 8)}01`
  const start = bjDateToStart(first)
  const span = spanOf(start, now)
  const y = Number(key.slice(0, 4))
  const m = Number(key.slice(5, 7))
  const prevFirst = m === 1 ? `${y - 1}-12-01` : `${y}-${pad2(m - 1)}-01`
  const prevStart = bjDateToStart(prevFirst)
  const prevEnd = new Date(Math.min(prevStart.getTime() + (now.getTime() - start.getTime()), start.getTime()))
  return {
    kind: 'month',
    ...span,
    title: `本月（${cnDay(first)}–${cnDay(key)}）`,
    word: '本月',
    relWord: '本月',
    compares: [{ ...spanOf(prevStart, prevEnd), label: '较上月同期' }],
  }
}

/** 「日报 <日期>」的日期写法（只看形状，不看是不是未来）：10-03、10/3、10月3日、2026-10-03、2026年10月3日、20261003、1003、今天 / 昨天 / 前天 */
const DATE_FORMS: RegExp[] = [
  /^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/,
  /^(\d{4})(\d{2})(\d{2})$/,
  /^(\d{1,2})[-/.月](\d{1,2})日?$/,
  /^(\d{2})(\d{2})$/,
]
const RELATIVE_DAYS: Record<string, number> = { 今天: 0, 今日: 0, 昨天: -1, 昨日: -1, 前天: -2 }

export function isReportDateSyntax(s: string): boolean {
  const t = String(s ?? '').trim()
  return t in RELATIVE_DAYS || DATE_FORMS.some((re) => re.test(t))
}

export type ReportDateParse = { ok: true; key: string } | { ok: false; error: string }

/**
 * 解析「日报 <日期>」的日期 → 北京日期 key。不写年份时取「不晚于今天的最近那一个」（今天 10-05 写 10-06 = 去年的 10-06）。
 * 未来的日期、不存在的日期（02-30）、早于 2020 年的拒绝。
 */
export function parseReportDate(input: string, now: Date = new Date()): ReportDateParse {
  const s = String(input ?? '').trim()
  const todayKey = bjDateKey(now)
  if (s in RELATIVE_DAYS) return { ok: true, key: addBjDays(todayKey, RELATIVE_DAYS[s]) }
  let y: number | null = null
  let m = 0
  let d = 0
  const [full, compact, short, shortCompact] = DATE_FORMS.map((re) => s.match(re))
  if (full || compact) {
    const g = (full || compact)!
    y = Number(g[1])
    m = Number(g[2])
    d = Number(g[3])
  } else if (short || shortCompact) {
    const g = (short || shortCompact)!
    m = Number(g[1])
    d = Number(g[2])
  } else {
    return { ok: false, error: '日期格式不对' }
  }
  let key: string
  if (y === null) {
    key = `${todayKey.slice(0, 4)}-${pad2(m)}-${pad2(d)}`
    if (key > todayKey) key = `${Number(todayKey.slice(0, 4)) - 1}-${pad2(m)}-${pad2(d)}`
  } else {
    key = `${y}-${pad2(m)}-${pad2(d)}`
  }
  if (!isRealDayKey(key)) return { ok: false, error: `没有 ${key} 这一天` }
  if (key > todayKey) return { ok: false, error: `${key} 还没到` }
  if (key < REPORT_MIN_DAY) return { ok: false, error: `${key} 太早了，没有数据` }
  return { ok: true, key }
}

/** 补看某一天：今天 = 今日的实时窗口（还没过完），其余 = 那一整天 */
export function windowForDay(key: string, now: Date = new Date()): ReportWindow {
  return key === bjDateKey(now) ? todayWindow(now) : dayWindow(key, now)
}
