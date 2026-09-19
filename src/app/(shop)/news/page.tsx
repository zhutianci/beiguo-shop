// Server Component：必须 force-dynamic。否则 next build 会在 builder 阶段预渲染并连库，
// 而 builder 容器不在 app-network 上、没有 DATABASE_URL，构建直接失败。
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, CalendarRange, Sparkles } from 'lucide-react'
import { prisma } from '@/lib/db'
import { AiNoticeBlock } from '@/components/news/ai-notice-block'
import {
  EVENT_SELECT,
  NEWS_PAGE_SIZE,
  formatMonthHeading,
  hoursAgo,
  ogImageForCategory,
  siteOrigin,
  toEventDto,
  todayStartUtc,
  weekStartUtc,
  type NewsEventDto,
} from '@/lib/news/format'
import { DIGEST_SLUG, formatPeriodLabel, listDigests } from '@/lib/news/digest'
import { NewsStream } from './news-stream'

/** 与 /api/news/list 共用，不要在这里写死数字（见 format.ts 的注释） */
const PAGE_SIZE = NEWS_PAGE_SIZE
const HIGHLIGHT_TAKE = 6

const TITLE = 'AI 圈大事记 - 每日 AI 动态聚合'
const DESC = '把一天里 AI 圈发生的事按事件聚合到一起：模型发布、产品更新、论文与工具。全部来自公开信源，由 AI 自动整理摘要。'

export const metadata: Metadata = {
  // 自指 canonical：/news 会被带 ?s= / ?n= 分享出去，也会被 sitemap 提交，
  // 没有它就是 sitemap 里唯一一条不声明规范地址的 URL
  alternates: { canonical: '/news' },
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

/**
 * 「最近补录」的判据：事件本身发生得早（36 小时以前），摘要却是最近 7 天才写出来的。
 *
 * 去掉 compose 的 7 天窗口之后，积压车道会持续把老事件补写出来。这类条目按 happenedAt
 * 排会插进时间流中间，用户在首屏根本看不见 —— 「刚发布」和「时间轴位置」对不上。
 *
 * 【必须复用 HIGHLIGHT_WHERE】这是一个重点位，needsReview=true 的条目不能进（SKILL.md §7）。
 * 而「happenedAt 很旧 + publishedAt 很新」几乎就是降级发布条目的特征
 * （degradePublish 写的正是 needsReview=true），不过滤的话这一行会精准地
 * 把最不该推的那批条目推上去。所以这里展开常量而不是重写一遍字面量。
 */
const BACKFILL_TAKE = 5

export default async function NewsPage() {
  const now = new Date()

  let timeline: NewsEventDto[] = []
  let total = 0
  let today: NewsEventDto[] = []
  let week: NewsEventDto[] = []
  let backfills: NewsEventDto[] = []
  let months: { key: string; count: number }[] = []
  let digests: { type: 'DAILY' | 'WEEKLY'; period: string; periodStart: string; periodEnd: string; title: string; count: number }[] = []
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

    // 最近补录 + 归档月份。两个查询都不能拖垮主列表，所以放在主查询之后单独 try。
    try {
      const [backfillRows, monthRows] = await Promise.all([
        prisma.newsEvent.findMany({
          where: {
            ...HIGHLIGHT_WHERE,
            publishedAt: { gte: hoursAgo(24 * 7, now) },
            happenedAt: { lt: hoursAgo(36, now) },
          },
          select: EVENT_SELECT,
          orderBy: [{ publishedAt: 'desc' }],
          // 多取一些再在内存里按 isBackfilled 精筛。
          // 【为什么不能只靠 where】上面两个条件是「事件较早」且「最近发布」，
          // 而 isBackfilled 判的是「两者相差 ≥36h」——不是一回事：
          // happenedAt=37h前、publishedAt=36h前 满足 where，但间隔只有 1 小时，不算补录。
          // 而「两列相减再比较」在 Prisma 里表达不出来，只能查宽一点再筛。
          take: BACKFILL_TAKE * 4,
        }),
        // 有哪些月份有内容。用原生 SQL 做 GROUP BY —— Prisma 的 groupBy 没法按
        // 「东八区的月份」分组，而这里必须用业务时区，否则每月 1 号的凌晨 8 小时会归到上个月。
        prisma.$queryRaw<{ k: string; n: bigint }[]>`
          SELECT DATE_FORMAT(DATE_ADD(happened_at, INTERVAL 8 HOUR), '%Y-%m') AS k, COUNT(*) AS n
          FROM news_events
          WHERE status = 'PUBLISHED'
          GROUP BY k
          ORDER BY k DESC
          LIMIT 12
        `,
      ])
      // 精筛：口径与卡片上的「补录」角标（toEventDto 里的 backfilled）必须是同一套，
      // 否则会出现「列在补录区里、卡片上却没有补录角标」这种自相矛盾的展示
      backfills = backfillRows.map(toEventDto).filter((e) => e.backfilled).slice(0, BACKFILL_TAKE)
      months = monthRows.map((r) => ({ key: r.k, count: Number(r.n) }))
      // 最近 3 期日报 + 最近 1 期周报。管线一直在生成，之前没有任何前台入口
      const [d, w] = await Promise.all([listDigests('DAILY', 3), listDigests('WEEKLY', 1)])
      digests = [...d, ...w]
    } catch (e) {
      console.error('[news/page extras]', e)
    }

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
    <div className="min-h-screen pb-20 pt-28 sm:page-top">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none fixed left-1/4 top-24 h-[420px] w-[420px] rounded-full bg-purple-500/10 blur-[128px]" />
      <div className="pointer-events-none fixed bottom-1/4 right-10 h-[380px] w-[380px] rounded-full bg-cyan-500/[0.07] blur-[128px]" />

      {/*
        列表页是「卡片流」而不是「正文」，所以桌面端应当放宽而不是死守单栏阅读宽度：
        - 768px（max-w-3xl）以下保持移动端单列不动；
        - lg 起放宽到 5xl、xl 起 6xl，配合下面时间流的两列网格，
          1440/1920 屏上就不会只剩中间一条窄带、两侧全是空白。
        真正需要控行长的是 /news/[slug] 正文页，那边保持 3xl 不动。
      */}
      <div className="container relative max-w-3xl lg:max-w-5xl xl:max-w-6xl">
        {/* ============ 栏目头 ============ */}
        <header className="mb-8 lg:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs text-white/65 lg:text-[13px]">公开信源聚合 · 每小时更新</span>
          </div>
          {/* 桌面端屏幕更远、可视面积更大，标题再上一档才拉得开层级 */}
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="gradient-text">AI 圈</span>
            <span className="gradient-text-accent">大事记</span>
          </h1>
          {/* 容器变宽后导语跟着放宽到 2xl（≈672px），仍在 40 个汉字/行以内，不会拉成长条 */}
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/50 lg:mt-4 lg:max-w-2xl lg:text-[17px] lg:leading-[1.85]">
            把一天里 AI 圈发生的事按事件聚合到一起——模型发布、产品更新、论文与工具，
            同一件事的多家信源并成一条，省掉重复阅读。
          </p>

          {/* AI 聚合说明条（AI 标识法定位置之一，见 SKILL.md §6） */}
          <AiNoticeBlock className="mt-5 lg:max-w-3xl" />
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
          <>
            <NewsStream
              initial={timeline}
              initialTotalPages={totalPages}
              total={total}
              now={now.toISOString()}
              highlights={{ today, week, fallbackRange }}
              backfills={backfills}
            />

            {/*
              ============ 日报 / 周报入口 ============
              管线每天 21:00 生成日报、每周一 09:00 生成周报，数据早就在 news_digests 里，
              但此前没有任何前台入口 —— 生成了却没人看得到。
            */}
            {digests.length > 0 && (
              <nav aria-label="速览与周报" className="mt-12 border-t border-white/10 pt-6 lg:mt-16 lg:pt-8">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/70 lg:mb-4 lg:text-[15px]">
                  <CalendarRange className="h-4 w-4 text-white/40" />
                  速览与周报
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:gap-3">
                  {digests.map((d) => (
                    <Link
                      key={`${d.type}-${d.period}`}
                      href={`/news/digest/${DIGEST_SLUG[d.type]}/${d.period}`}
                      className="group rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.07] lg:px-5 lg:py-3.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-purple-500/12 px-2 py-0.5 text-[10px] text-purple-200/85">
                          {d.type === 'DAILY' ? '日报' : '周报'}
                        </span>
                        <span className="text-[13px] tabular-nums text-white/40">{formatPeriodLabel(d)}</span>
                        <span className="ml-auto text-[11px] tabular-nums text-white/30">{d.count} 条</span>
                      </div>
                      <h3 className="mt-1.5 line-clamp-1 text-[14px] font-medium text-white/80 group-hover:text-white lg:text-[15px]">
                        {d.title}
                      </h3>
                    </Link>
                  ))}
                </div>
              </nav>
            )}

            {/*
              ============ 按月归档入口 ============
              内容会持续累积（compose 不再有 7 天窗口），但时间流默认只出一页，
              「攒下来的东西」在页面上是看不见的。这一排就是把累积量变成可见的结构，
              同时给搜索引擎一条能走到旧内容的路。
            */}
            {months.length > 1 && (
              <nav aria-label="按月归档" className="mt-12 border-t border-white/10 pt-6 lg:mt-16 lg:pt-8">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/70 lg:mb-4 lg:text-[15px]">
                  <CalendarDays className="h-4 w-4 text-white/40" />
                  按月回看
                </h2>
                <div className="flex flex-wrap gap-2">
                  {months.map((m) => (
                    <Link
                      key={m.key}
                      href={`/news/archive/${m.key}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[13px] text-white/60 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white/85"
                    >
                      {formatMonthHeading(m.key)}
                      <span className="tabular-nums text-white/30">{m.count}</span>
                    </Link>
                  ))}
                </div>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  )
}
