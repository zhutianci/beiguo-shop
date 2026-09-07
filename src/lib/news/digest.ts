/**
 * 【AI圈大事记】日报 / 周报的展示层。
 *
 * 管线的 buildDigest() 早就在写 news_digests 表了（每天 21:00 日报、每周一 09:00 周报），
 * 但一直没有任何前台入口 —— 数据攒了但没人看得到。这一层负责把它读出来。
 *
 * 【为什么 eventIds 存的是 JSON 而不是关联表】digest 是一份**快照**：
 * 它记录的是「生成那一刻，这十条按当时的热度排在前面」。事件后来热度变了、被下线了，
 * 都不该改变已发布日报的内容 —— 那是一份对外发过、可能已经被人转发的东西。
 * 所以这里读事件时要保序（按 eventIds 的顺序），而不是按当前 score 重排。
 */
import { prisma } from '@/lib/db'
import { EVENT_SELECT, dayKey, toEventDto, type NewsEventDto } from './format'

export type DigestType = 'DAILY' | 'WEEKLY'

/** URL 里的类型段。用中文语义更直白的 daily/weekly，不用数据库里的大写枚举 */
export const DIGEST_SLUG: Record<DigestType, string> = { DAILY: 'daily', WEEKLY: 'weekly' }

export function parseDigestType(seg: string): DigestType | null {
  const s = (seg || '').toLowerCase()
  if (s === 'daily') return 'DAILY'
  if (s === 'weekly') return 'WEEKLY'
  return null
}

/** 期号形状 YYYY-MM-DD。**必须锚定首尾**，否则会误吃别的路径段 */
export const DIGEST_PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

export interface DigestDto {
  type: DigestType
  /** 期号 = periodStart 的日期，也是 URL 的一部分 */
  period: string
  periodStart: string
  periodEnd: string
  title: string
  intro: string | null
  createdAt: string
  events: NewsEventDto[]
  /** eventIds 里有、但事件已被下线/删除而读不到的条数。展示时要如实说明，不能假装没有 */
  missing: number
}

function parseIds(raw: string): number[] {
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0).slice(0, 50)
  } catch {
    return []
  }
}

/**
 * 按 eventIds 的**原始顺序**取事件。
 *
 * 刻意不在 SQL 里 orderBy —— 那会按 id 或热度排，破坏日报的榜单顺序。
 * 先一次性取回，再在内存里按 ids 的下标归位。
 */
async function loadEventsInOrder(ids: number[]): Promise<{ events: NewsEventDto[]; missing: number }> {
  if (!ids.length) return { events: [], missing: 0 }
  const rows = await prisma.newsEvent.findMany({
    // 只出仍然公开的事件：日报里挂着一条已下线的内容，等于把下线动作作废了
    where: { id: { in: ids }, status: 'PUBLISHED' },
    select: EVENT_SELECT,
  })
  const byId = new Map(rows.map((r) => [r.id, r]))
  const events: NewsEventDto[] = []
  for (const id of ids) {
    const row = byId.get(id)
    if (row) events.push(toEventDto(row))
  }
  return { events, missing: ids.length - events.length }
}

function toPeriod(d: Date): string {
  return dayKey(d)
}

/** 取一期。找不到返回 null（调用方去 notFound） */
export async function getDigest(type: DigestType, period: string): Promise<DigestDto | null> {
  if (!DIGEST_PERIOD_RE.test(period)) return null
  const row = await prisma.newsDigest.findFirst({
    where: { type, status: 'PUBLISHED' },
    orderBy: { periodStart: 'desc' },
    // periodStart 是 @db.Date，直接按字符串比较不可靠，取回来后用 dayKey 比对
    take: 30,
  })
  // findFirst + take 不能同时用来做「按 period 精确查」，所以退回精确查询：
  // periodStart 存的是 Date 类型的当天零点（UTC），用范围匹配避开时区解释差异
  const start = new Date(`${period}T00:00:00.000Z`)
  const end = new Date(start.getTime() + 86400000)
  const hit = await prisma.newsDigest.findFirst({
    where: { type, status: 'PUBLISHED', periodStart: { gte: start, lt: end } },
  })
  const target = hit || (row && toPeriod(row.periodStart) === period ? row : null)
  if (!target) return null

  const { events, missing } = await loadEventsInOrder(parseIds(target.eventIds))
  return {
    type: target.type as DigestType,
    period: toPeriod(target.periodStart),
    periodStart: toPeriod(target.periodStart),
    periodEnd: toPeriod(target.periodEnd),
    title: target.title,
    intro: target.intro,
    createdAt: target.createdAt.toISOString(),
    events,
    missing,
  }
}

export interface DigestRef {
  type: DigestType
  period: string
  periodStart: string
  periodEnd: string
  title: string
  count: number
}

/** 最近几期的目录，用于页面上的切换器 */
export async function listDigests(type: DigestType, take: number): Promise<DigestRef[]> {
  const rows = await prisma.newsDigest.findMany({
    where: { type, status: 'PUBLISHED' },
    orderBy: { periodStart: 'desc' },
    take,
    select: { type: true, periodStart: true, periodEnd: true, title: true, eventIds: true },
  })
  return rows.map((r) => ({
    type: r.type as DigestType,
    period: toPeriod(r.periodStart),
    periodStart: toPeriod(r.periodStart),
    periodEnd: toPeriod(r.periodEnd),
    title: r.title,
    count: parseIds(r.eventIds).length,
  }))
}

/** 最新一期的期号，用于 /news/digest 的重定向落点 */
export async function latestPeriod(type: DigestType): Promise<string | null> {
  const row = await prisma.newsDigest.findFirst({
    where: { type, status: 'PUBLISHED' },
    orderBy: { periodStart: 'desc' },
    select: { periodStart: true },
  })
  return row ? toPeriod(row.periodStart) : null
}

/** 「9月7日」/「9月1日 - 9月7日」 */
export function formatPeriodLabel(d: DigestRef | DigestDto): string {
  const fmt = (k: string) => `${Number(k.slice(5, 7))}月${Number(k.slice(8, 10))}日`
  return d.periodStart === d.periodEnd ? fmt(d.periodStart) : `${fmt(d.periodStart)} - ${fmt(d.periodEnd)}`
}
