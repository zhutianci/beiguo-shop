// Server Component：必须 force-dynamic。否则 next build 会在 builder 阶段预渲染并连库，
// 而 builder 容器不在 app-network 上、没有 DATABASE_URL，构建直接失败。
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'
import { prisma } from '@/lib/db'
import { AI_NOTICE, AUTHOR_NAME } from '@/lib/news/constants'
import {
  EVENT_SELECT,
  hoursAgo,
  ogImageForCategory,
  siteOrigin,
  toEventDto,
  todayStartUtc,
  weekStartUtc,
  type NewsEventDto,
} from '@/lib/news/format'
import { NewsStream } from './news-stream'

const PAGE_SIZE = 20
const HIGHLIGHT_TAKE = 6

const TITLE = 'AI 圈大事记 - 每日 AI 动态聚合'
const DESC = '把一天里 AI 圈发生的事按事件聚合到一起：模型发布、产品更新、论文与工具。全部来自公开信源，由 AI 自动整理摘要。'

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: TITLE,
  description: DESC,
  openGraph: {
    type: 'website',
    title: TITLE,
    description: DESC,
    url: '/news',
    siteName: '贝果科技',
    images: [{ url: ogImageForCategory(null), width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC },
  // AI 标识的第 4 处法定位置：页面 HTML 元数据
  other: { 'ai-generated': 'true' },
}

/** 榜单口径：needsReview=true 的条目照常进时间流，但不进重点榜（SKILL.md §7） */
const HIGHLIGHT_WHERE = { status: 'PUBLISHED', needsReview: false }
const HIGHLIGHT_ORDER = [{ pinned: 'desc' as const }, { score: 'desc' as const }]

export default async function NewsPage() {
  const now = new Date()

  let timeline: NewsEventDto[] = []
  let total = 0
  let today: NewsEventDto[] = []
  let week: NewsEventDto[] = []
  let fallbackRange: string | null = null
  let dbFailed = false

  try {
    const [rows, count, todayRows, weekRows] = await Promise.all([
      prisma.newsEvent.findMany({
        where: { status: 'PUBLISHED' },
        select: EVENT_SELECT,
        orderBy: [{ happenedAt: 'desc' }, { id: 'desc' }],
        take: PAGE_SIZE,
      }),
      prisma.newsEvent.count({ where: { status: 'PUBLISHED' } }),
      prisma.newsEvent.findMany({
        where: { ...HIGHLIGHT_WHERE, happenedAt: { gte: todayStartUtc(now) } },
        select: EVENT_SELECT,
        orderBy: HIGHLIGHT_ORDER,
        take: HIGHLIGHT_TAKE,
      }),
      prisma.newsEvent.findMany({
        where: { ...HIGHLIGHT_WHERE, happenedAt: { gte: weekStartUtc(now) } },
        select: EVENT_SELECT,
        orderBy: HIGHLIGHT_ORDER,
        take: HIGHLIGHT_TAKE,
      }),
    ])

    timeline = rows.map(toEventDto)
    total = count
    today = todayRows.map(toEventDto)
    week = weekRows.map(toEventDto)

    // 今日为空（凌晨、或当天信源都没产出）就回退到最近 72 小时，
    // 前端据 fallbackRange 文案化说明，而不是给用户一个空列表
    if (today.length === 0) {
      const recent = await prisma.newsEvent.findMany({
        where: { ...HIGHLIGHT_WHERE, happenedAt: { gte: hoursAgo(72, now) } },
        select: EVENT_SELECT,
        orderBy: HIGHLIGHT_ORDER,
        take: HIGHLIGHT_TAKE,
      })
      today = recent.map(toEventDto)
      if (today.length > 0) fallbackRange = '72h'
    }
  } catch (e) {
    // 新闻区挂了绝不能连累整站：降级成一句说明，页面其余部分照常
    console.error('[news/page]', e)
    dbFailed = true
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="min-h-screen pb-20 pt-28 sm:pt-32">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none fixed left-1/4 top-24 h-[420px] w-[420px] rounded-full bg-purple-500/10 blur-[128px]" />
      <div className="pointer-events-none fixed bottom-1/4 right-10 h-[380px] w-[380px] rounded-full bg-cyan-500/[0.07] blur-[128px]" />

      <div className="container relative max-w-3xl">
        {/* ============ 栏目头 ============ */}
        <header className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs text-white/65">公开信源聚合 · 每小时更新</span>
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="gradient-text">AI 圈</span>
            <span className="gradient-text-accent">大事记</span>
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/50">
            把一天里 AI 圈发生的事按事件聚合到一起——模型发布、产品更新、论文与工具，
            同一件事的多家信源并成一条，省掉重复阅读。
          </p>

          {/* AI 聚合说明条（AI 标识法定位置之一，见 SKILL.md §6） */}
          <div className="mt-5 flex gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <span className="mt-px shrink-0 rounded-full bg-purple-500/15 px-2 py-0.5 text-[11px] font-medium text-purple-200/90">
              AI 聚合
            </span>
            <p className="text-[13px] leading-relaxed text-white/50">
              {AI_NOTICE}整理者：{AUTHOR_NAME}。
            </p>
          </div>
        </header>

        {dbFailed ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center text-sm text-white/40">
            内容暂时无法加载，请稍后再看。
          </div>
        ) : total === 0 && today.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
            <p className="text-sm text-white/45">内容正在整理中，稍后回来看看。</p>
          </div>
        ) : (
          <NewsStream
            initial={timeline}
            initialTotalPages={totalPages}
            total={total}
            now={now.toISOString()}
            highlights={{ today, week, fallbackRange }}
          />
        )}
      </div>
    </div>
  )
}
