/**
 * 北京时间工具（固定 +8 运算，同构、零依赖）。
 *
 * 【为什么不用 getHours() / toLocaleString】交接文档第六节：容器 TZ 改过一次，
 * MySQL DATETIME 不带时区，凡是依赖进程 TZ 的日期运算都出过事。营销模块里的
 * 「今天」「发送时段」「次日 9 点」「第几个发送日」一律走这里，与进程 TZ 无关。
 * Prisma 存取的 DateTime 都是 UTC 瞬时值，这里只做「瞬时值 ↔ 北京日历」的换算。
 */

const BJ_OFFSET_MS = 8 * 3600_000
const DAY_MS = 86400_000

function bjShift(d: Date): Date {
  return new Date(d.getTime() + BJ_OFFSET_MS)
}

/** 北京日期 YYYY-MM-DD */
export function bjDateKey(d: Date = new Date()): string {
  return bjShift(d).toISOString().slice(0, 10)
}

/** 北京时间的小时 0–23 */
export function bjHour(d: Date = new Date()): number {
  return bjShift(d).getUTCHours()
}

/** d 所在北京日的 00:00（返回 UTC 瞬时值） */
export function bjDayStart(d: Date = new Date()): Date {
  const s = bjShift(d)
  return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()) - BJ_OFFSET_MS)
}

/** 北京日期字符串 → 该日 00:00 的 UTC 瞬时值 */
export function bjDateToStart(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d) - BJ_OFFSET_MS)
}

/** 北京日期字符串 → 该日 23:59:59.999 的 UTC 瞬时值 */
export function bjDateToEnd(key: string): Date {
  return new Date(bjDateToStart(key).getTime() + DAY_MS - 1)
}

export function addBjDays(key: string, days: number): string {
  return bjDateKey(new Date(bjDateToStart(key).getTime() + days * DAY_MS + 3600_000))
}

/** 是否在发送时段 [start, end)（北京时间整点） */
export function inSendWindow(win: { start: number; end: number }, d: Date = new Date()): boolean {
  const h = bjHour(d)
  return h >= win.start && h < win.end
}

/** 下一个发送时段的开始时刻。当前就在时段内时返回当前时刻 */
export function nextWindowStart(win: { start: number; end: number }, d: Date = new Date()): Date {
  if (inSendWindow(win, d)) return d
  const dayStart = bjDayStart(d)
  const todayStart = new Date(dayStart.getTime() + win.start * 3600_000)
  if (d.getTime() < todayStart.getTime()) return todayStart
  return new Date(todayStart.getTime() + DAY_MS)
}

/** 当前（或下一个）发送时段的结束时刻 */
export function windowEnd(win: { start: number; end: number }, d: Date = new Date()): Date {
  const start = nextWindowStart(win, d)
  return new Date(bjDayStart(start).getTime() + win.end * 3600_000)
}

/** 次日发送时段开始（用于「额度用尽 → 暂停到次日」） */
export function nextDayWindowStart(win: { start: number; end: number }, d: Date = new Date()): Date {
  return new Date(bjDayStart(d).getTime() + DAY_MS + win.start * 3600_000)
}

/** 阿里云 SenderStatisticsDetailByParam 的时间参数：北京时间 yyyy-MM-dd HH:mm */
export function bjMinuteString(d: Date): string {
  const s = bjShift(d).toISOString()
  return `${s.slice(0, 10)} ${s.slice(11, 16)}`
}

/** 展示用：2026年10月7日 */
export function bjDateCn(d: Date): string {
  const s = bjShift(d)
  return `${s.getUTCFullYear()}年${s.getUTCMonth() + 1}月${s.getUTCDate()}日`
}

/** 展示用：2026-10-07 14:05 */
export function bjDateTime(d: Date): string {
  return bjMinuteString(d)
}
