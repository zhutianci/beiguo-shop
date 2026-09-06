/**
 * 【AI圈大事记】前台展示层的纯函数：DTO 映射、东八区日期、来源文案。
 *
 * 为什么单独一层：/news 与 /news/[slug] 是 Server Component 直连 prisma，
 * 首页热点区与「加载更多」走 /api/news/*，两条路径必须产出**完全一致**的数据形状，
 * 否则同一张卡片在两个入口会长得不一样。映射只写一次，放这里。
 *
 * 时间一律用固定 +8 偏移的 UTC 算术，不调用任何本地时间方法——
 * 与 api/admin/analytics/cardkeys/route.ts 同一套口径，换机器/容器没设 TZ 都不漂移。
 */

import { CATEGORIES, CATEGORY_SLUGS, categoryLabel } from './constants'

// ============ 时间：固定东八区 ============

const TZ_OFFSET_MS = 8 * 60 * 60 * 1000
const DAY_MS = 86400000
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 把绝对时刻归到业务时区的哪一天，YYYY-MM-DD */
export function dayKey(d: Date | string): string {
  const t = typeof d === 'string' ? Date.parse(d) : d.getTime()
  return new Date(t + TZ_OFFSET_MS).toISOString().slice(0, 10)
}

/** 业务时区「今天 00:00」对应的 UTC 时刻 */
export function todayStartUtc(now: Date = new Date()): Date {
  const key = dayKey(now)
  return new Date(Date.parse(`${key}T00:00:00.000Z`) - TZ_OFFSET_MS)
}

/** 业务时区「本周一 00:00」对应的 UTC 时刻（周一为一周之始） */
export function weekStartUtc(now: Date = new Date()): Date {
  const shifted = new Date(now.getTime() + TZ_OFFSET_MS)
  const dow = shifted.getUTCDay() // 0=周日
  const backDays = dow === 0 ? 6 : dow - 1
  return new Date(todayStartUtc(now).getTime() - backDays * DAY_MS)
}

/** N 小时之前的时刻 */
export function hoursAgo(hours: number, now: Date = new Date()): Date {
  return new Date(now.getTime() - hours * 3600000)
}

/** 「9月6日 周六」 */
export function formatDayHeading(key: string): string {
  const t = Date.parse(`${key}T00:00:00.000Z`)
  const d = new Date(t)
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日 ${WEEKDAYS[d.getUTCDay()]}`
}

/** 「今天」「昨天」，更早返回 null（时间流的日期头用它加小标记） */
export function dayRelativeTag(key: string, now: Date = new Date()): string | null {
  const today = dayKey(now)
  if (key === today) return '今天'
  const yesterday = dayKey(new Date(now.getTime() - DAY_MS))
  if (key === yesterday) return '昨天'
  return null
}

/** 东八区的 HH:mm */
export function formatClock(d: Date | string): string {
  const t = typeof d === 'string' ? Date.parse(d) : d.getTime()
  return new Date(t + TZ_OFFSET_MS).toISOString().slice(11, 16)
}

/** 「刚刚 / 3 小时前 / 2 天前」，首页热点条用 */
export function relativeTime(d: Date | string, now: Date = new Date()): string {
  const t = typeof d === 'string' ? Date.parse(d) : d.getTime()
  const min = Math.floor((now.getTime() - t) / 60000)
  if (min < 5) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时前`
  const day = Math.floor(hour / 24)
  if (day < 30) return `${day} 天前`
  return formatDayHeading(dayKey(new Date(t)))
}

// ============ DTO ============

/** 信源：媒体名 + 可点外链。展示全部信源是硬要求，见 SKILL.md §6 */
export interface NewsSourceDto {
  name: string
  url: string
  title: string
  tier: number
  publishedAt: string
}

/** 关键事实：标注来自第几个信源，供人工一键复核 */
export interface NewsFactDto {
  text: string
  sourceIndex: number
}

export interface NewsEventDto {
  id: number
  slug: string
  headline: string
  summary: string
  whyItMatters: string | null
  category: string
  categoryLabel: string
  aiScore: number
  score: number
  sourceCount: number
  tier1Count: number
  needsReview: boolean
  pinned: boolean
  happenedAt: string
  tags: string[]
  sources: NewsSourceDto[]
  facts: NewsFactDto[]
}

/** prisma 查询结果的结构性约束（不 import Prisma 生成类型，select 字段变动时更宽容） */
export interface NewsEventRow {
  id: number
  slug: string
  headline: string
  summary: string
  whyItMatters: string | null
  facts?: string | null
  category: string
  tags: string | null
  aiScore: number
  score: unknown
  sourceCount: number
  tier1Count: number
  needsReview: boolean
  pinned: boolean
  happenedAt: Date
  items?: {
    url: string
    title: string
    publishedAt: Date
    source: { name: string; tier: number }
  }[]
}

/** 同一家媒体在一个事件里可能有多条抓取记录，展示时按媒体名去重，保留最早一条 */
function toSources(items: NewsEventRow['items']): NewsSourceDto[] {
  if (!items?.length) return []
  const seen = new Map<string, NewsSourceDto>()
  for (const it of items) {
    const name = it.source?.name || '公开信源'
    if (seen.has(name)) continue
    seen.set(name, {
      name,
      url: it.url,
      title: it.title,
      tier: it.source?.tier ?? 3,
      publishedAt: it.publishedAt.toISOString(),
    })
  }
  return Array.from(seen.values()).sort((a, b) => a.tier - b.tier)
}

function parseFacts(raw: string | null | undefined): NewsFactDto[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
      .filter((f) => f && typeof f.text === 'string' && f.text.trim())
      .map((f) => ({ text: String(f.text).trim(), sourceIndex: Number(f.sourceIndex) || 0 }))
      .slice(0, 8)
  } catch {
    return []
  }
}

export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6)
}

export function toEventDto(row: NewsEventRow): NewsEventDto {
  return {
    id: row.id,
    slug: row.slug,
    headline: row.headline,
    summary: row.summary,
    whyItMatters: row.whyItMatters,
    category: row.category,
    categoryLabel: categoryLabel(row.category),
    aiScore: row.aiScore,
    score: Number(row.score) || 0,
    sourceCount: row.sourceCount,
    tier1Count: row.tier1Count,
    needsReview: row.needsReview,
    pinned: row.pinned,
    happenedAt: row.happenedAt.toISOString(),
    tags: parseTags(row.tags),
    sources: toSources(row.items),
    facts: parseFacts(row.facts),
  }
}

/** prisma select：列表与详情共用一套，保证两条路径字段一致 */
export const EVENT_SELECT = {
  id: true,
  slug: true,
  headline: true,
  summary: true,
  whyItMatters: true,
  facts: true,
  category: true,
  tags: true,
  aiScore: true,
  score: true,
  sourceCount: true,
  tier1Count: true,
  needsReview: true,
  pinned: true,
  happenedAt: true,
  items: {
    select: {
      url: true,
      title: true,
      publishedAt: true,
      source: { select: { name: true, tier: true } },
    },
    orderBy: { publishedAt: 'asc' },
  },
} as const

// ============ 文案 ============

/** 「量子位 等 3 家」——多源时只露出第一家，避免卡片一行被媒体名撑爆 */
export function sourceLabel(sources: { name: string }[], sourceCount?: number): string {
  const n = Math.max(sources.length, sourceCount ?? 0)
  if (!sources.length) return '公开信源'
  if (n <= 1) return sources[0].name
  return `${sources[0].name} 等 ${n} 家`
}

/** og 底图：按分类取静态底图，未知分类回退默认图（绝不用原文配图，见 SKILL.md §1.1） */
export function ogImageForCategory(category: string | null | undefined): string {
  return category && (CATEGORY_SLUGS as string[]).includes(category)
    ? `/news-og/${category}.png`
    : '/og-default.png'
}

const FALLBACK_ORIGIN = 'https://bigolab.com'

/**
 * 站点绝对地址：og:image / og:url 必须是绝对路径，微信与搜索引擎都不接受相对路径。
 *
 * 【为什么要挡 localhost】.env 里的 NEXT_PUBLIC_APP_URL 长期是 http://localhost:3000，
 * 而 NEXT_PUBLIC_* 是**构建期内联**的：一旦带着它构建生产镜像，
 * 每条分享出去的 og:image / og:url 都会指向 localhost，微信卡片直接变成空白图，
 * 而且这种错误在服务器上看日志是看不出来的。所以生产环境下的本地地址一律视为未配置。
 */
export function siteOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim()
  const origin = raw.replace(/\/+$/, '')
  if (!origin) return FALLBACK_ORIGIN
  if (process.env.NODE_ENV === 'production' && /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(origin)) {
    return FALLBACK_ORIGIN
  }
  return origin
}

/** 分类芯片用（含「全部」） */
export const CATEGORY_CHIPS = [{ slug: '', label: '全部', hint: '' }, ...CATEGORIES]

/** AI 评分的视觉档位，只用来决定颜色深浅，不额外造语义 */
export function scoreTone(aiScore: number): 'high' | 'mid' | 'low' {
  if (aiScore >= 80) return 'high'
  if (aiScore >= 60) return 'mid'
  return 'low'
}
