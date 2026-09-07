// Server Component：必须 force-dynamic，理由同 /news —— builder 容器连不上库，
// 一旦被当成静态路由预渲染，整个构建会失败。
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { prisma } from '@/lib/db'
import { AiNoticeBlock } from '@/components/news/ai-notice-block'
import {
  ARCHIVE_MONTH_RE,
  EVENT_SELECT,
  formatMonthHeading,
  NEWS_PAGE_SIZE,
  monthEndUtc,
  monthStartUtc,
  ogImageForCategory,
  siteOrigin,
  toEventDto,
  type NewsEventDto,
} from '@/lib/news/format'
import { ArchiveList } from './archive-list'

/**
 * 按月归档页。
 *
 * 【为什么单开 /news/archive/[month] 而不是挤进 /news/[slug]】
 * 后者要在同一个动态段里靠正则分流「2026-09」和「2026-09-06-a1b2c3d4e5」。
 * 两种形状确实不相交，但那条正则一旦写漏一个锚点，**全部新闻详情页会当场变成归档页** ——
 * 一个只为省 8 个字符 URL 而引入的全站级故障点，不划算。
 * 独立目录零分流逻辑、零正则、零全站故障面。
 *
 * 【这个页面的存在意义】compose 去掉 7 天窗口之后内容会持续累积，
 * 但时间流默认只出最近一页，「攒下来的东西」在页面上看不见。
 * 归档页把累积量变成可见的、可被搜索引擎抓取的结构。
 */

/** 页大小与 /api/news/list 共用同一个常量 —— 两边写死两个数会静默漏条，见 format.ts 的注释 */
const PAGE_SIZE = NEWS_PAGE_SIZE

function monthOf(params: { month: string }): string | null {
  const m = decodeURIComponent(params.month || '')
  return ARCHIVE_MONTH_RE.test(m) ? m : null
}

export async function generateMetadata({ params }: { params: { month: string } }): Promise<Metadata> {
  const month = monthOf(params)
  if (!month) return { title: '归档不存在 - AI 圈大事记' }
  const heading = formatMonthHeading(month)
  const title = `${heading} AI 圈大事记 · 全月归档`
  const description = `${heading}这一个月里 AI 圈发生的事，按事件聚合到一起：模型发布、产品更新、论文与工具。全部来自公开信源，由 AI 自动整理摘要。`
  return {
    metadataBase: new URL(siteOrigin()),
    title,
    description,
    alternates: { canonical: `/news/archive/${month}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `/news/archive/${month}`,
      siteName: '贝果科技',
      images: [{ url: ogImageForCategory(null), width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description },
    // AI 标识的第 4 处法定位置。新增列表页最容易漏的就是这一行
    other: { 'ai-generated': 'true' },
  }
}

export default async function NewsArchivePage({ params }: { params: { month: string } }) {
  const month = monthOf(params)
  if (!month) notFound()

  // 未来月份直接 404：不生成一个空页面让爬虫反复来抓
  if (monthStartUtc(month).getTime() > Date.now()) notFound()

  let list: NewsEventDto[] = []
  let total = 0
  let failed = false
  try {
    const where = {
      status: 'PUBLISHED',
      happenedAt: { gte: monthStartUtc(month), lt: monthEndUtc(month) },
    }
    const [rows, count] = await Promise.all([
      prisma.newsEvent.findMany({
        where,
        select: EVENT_SELECT,
        // 归档页按「这个月里哪几件事更重要」排，而不是按时间倒序 ——
        // 时间倒序在 /news 已经有了，归档再来一遍没有新增价值。
        // 用 baseScore（不含时间衰减）：score 三周后全 round 成 0.000，排不出先后。
        orderBy: [{ baseScore: 'desc' }, { happenedAt: 'desc' }, { id: 'desc' }],
        take: PAGE_SIZE,
      }),
      prisma.newsEvent.count({ where }),
    ])
    list = rows.map(toEventDto)
    total = count
  } catch (e) {
    console.error('[news/archive]', e)
    failed = true
  }

  const heading = formatMonthHeading(month)

  return (
    <div className="min-h-screen pb-20 pt-28 sm:page-top">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none fixed left-1/4 top-24 h-[420px] w-[420px] rounded-full bg-purple-500/10 blur-[128px]" />

      <div className="container relative max-w-3xl lg:max-w-5xl">
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white/80 lg:text-[15px]"
        >
          <ArrowLeft className="h-4 w-4" />
          AI 圈大事记
        </Link>

        <header className="mb-8 mt-5 lg:mb-10 lg:mt-7">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs text-white/65 lg:text-[13px]">全月归档</span>
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="gradient-text">{heading}</span>
            <span className="ml-3 text-base font-normal tabular-nums text-white/35 lg:text-lg">
              {total} 条
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/50 lg:max-w-2xl lg:text-[17px]">
            按事件重要度排列。同一件事的多家信源已并成一条，点进去能看到全部原文外链。
          </p>

          {/* AI 标识：新增列表页必须挂上，走共用组件避免漏 */}
          <AiNoticeBlock className="mt-5 lg:max-w-3xl" />
        </header>

        {failed ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center text-sm text-white/40">
            内容暂时无法加载，请稍后再看。
          </div>
        ) : total === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
            <p className="text-sm text-white/45">这个月还没有归档内容。</p>
            <Link href="/news" className="mt-3 inline-block text-sm text-purple-300/80 hover:text-purple-200">
              回到时间流 →
            </Link>
          </div>
        ) : (
          <ArchiveList initial={list} month={month} total={total} />
        )}
      </div>
    </div>
  )
}
