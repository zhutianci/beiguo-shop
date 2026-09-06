// Server Component + generateMetadata：新闻页能被微信/搜索引擎抓到标题与缩略图的技术前提。
// 必须 force-dynamic，否则 builder 阶段会尝试预渲染并连库（没有 DATABASE_URL，构建直接失败）。
export const dynamic = 'force-dynamic'

import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, ChevronRight, MessagesSquare, ShoppingBag } from 'lucide-react'
import { prisma } from '@/lib/db'
import { ArticleJsonLd } from '@/components/news/article-jsonld'
import { ShareBar } from '@/components/news/share-bar'
import { AI_BADGE, AI_DISCLAIMER, AI_NOTICE, AUTHOR_NAME } from '@/lib/news/constants'
import { withNewsRef } from '@/lib/news/attribution'
import { newsUrl } from '@/lib/news/seo'
import {
  EVENT_SELECT,
  dayKey,
  formatClock,
  formatDayHeading,
  ogImageForCategory,
  siteOrigin,
  sourceLabel,
  toEventDto,
} from '@/lib/news/format'
import { ViewBeacon } from './detail-client'

/**
 * generateMetadata 与页面主体会各查一次库，用 React cache 去重（同一次请求内只打一次 MySQL）。
 * UNLISTED / DRAFT 一律按不存在处理——下线是保留证据用的，不是给外部继续访问的。
 */
const getEvent = cache(async (slug: string) => {
  return prisma.newsEvent.findFirst({
    where: { slug, status: 'PUBLISHED' },
    select: EVENT_SELECT,
  })
})

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const row = await getEvent(params.slug)
  if (!row) return { title: '内容不存在 - AI 圈大事记' }

  const ev = toEventDto(row)
  const description = ev.summary.replace(/\s+/g, ' ').slice(0, 110)
  const image = ogImageForCategory(ev.category)

  return {
    metadataBase: new URL(siteOrigin()),
    title: `${ev.headline} - AI 圈大事记`,
    description,
    alternates: { canonical: `/news/${ev.slug}` },
    openGraph: {
      type: 'article',
      title: ev.headline,
      description,
      url: `/news/${ev.slug}`,
      siteName: '贝果科技',
      publishedTime: ev.happenedAt,
      // 一律用静态分类底图。原文配图多为视觉中国/Getty 授权，单张索赔 2000–8000 元（SKILL.md §1.1）
      images: [{ url: image, width: 1200, height: 630, alt: ev.headline }],
    },
    twitter: { card: 'summary_large_image', title: ev.headline, description, images: [image] },
    // AI 标识的第 4 处法定位置：页面 HTML 元数据
    other: { 'ai-generated': 'true' },
  }
}

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const row = await getEvent(params.slug)
  if (!row) notFound()

  const ev = toEventDto(row)
  const image = ogImageForCategory(ev.category)
  // 绝对地址统一走 seo.ts 的 newsUrl，别在这里再拼一次域名——换域名时最容易漏改的就是这种散落拼接
  const shareUrl = newsUrl(ev.slug)

  // 相关事件：同分类的近期条目。查询失败不能拖垮正文
  let related: { slug: string; headline: string; happenedAt: Date; aiScore: number }[] = []
  try {
    related = await prisma.newsEvent.findMany({
      where: { status: 'PUBLISHED', category: ev.category, slug: { not: ev.slug } },
      select: { slug: true, headline: true, happenedAt: true, aiScore: true },
      orderBy: [{ happenedAt: 'desc' }],
      take: 4,
    })
  } catch (e) {
    console.error('[news/detail related]', e)
  }

  return (
    <div className="relative min-h-screen pb-20 pt-28 sm:pt-32">
      {/*
        微信抓缩略图的实测行为是「取 body 中靠前的、实际尺寸 ≥300×300 的 img」。
        这张图必须真的有渲染尺寸，所以用 position:absolute + visibility:hidden，
        **不能用 display:none**（display:none 的图不参与布局，微信不认）。
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" aria-hidden="true" width={600} height={315} className="news-wx-thumb" />

      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none fixed left-1/4 top-24 h-[420px] w-[420px] rounded-full bg-purple-500/10 blur-[128px]" />

      <div className="container relative max-w-3xl">
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white/80"
        >
          <ArrowLeft className="h-4 w-4" />
          AI 圈大事记
        </Link>

        <article className="mt-5">
          {/* ============ 标题 ============ */}
          <h1 className="text-balance text-[26px] font-bold leading-tight tracking-tight sm:text-4xl">
            {ev.headline}
          </h1>

          {/* ============ 元信息条 ============ */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-white/40">
            <time dateTime={ev.happenedAt} className="tabular-nums text-white/55">
              {formatDayHeading(dayKey(ev.happenedAt))} {formatClock(ev.happenedAt)}
            </time>
            <span className="h-3 w-px bg-white/12" />
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-white/60">
              {ev.categoryLabel}
            </span>
            <span
              className={
                ev.aiScore >= 80
                  ? 'inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-0.5 text-amber-300/90'
                  : 'inline-flex items-center gap-1 rounded-full border border-purple-400/25 bg-purple-400/10 px-2.5 py-0.5 text-purple-200/90'
              }
              title="AI 对这条重要性的判断"
            >
              AI 评分 <span className="tabular-nums font-medium">{ev.aiScore}</span>
              <span className="opacity-50">/100</span>
            </span>
            <span className="text-white/40">{sourceLabel(ev.sources, ev.sourceCount)}</span>
            {ev.needsReview && (
              <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-white/35" title="尚未人工复核">
                待复核
              </span>
            )}
          </div>

          {/* ============ AI 提示条（法定位置：正文开头） ============ */}
          <div className="mt-6 flex gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <span className="mt-px shrink-0 rounded-full bg-purple-500/15 px-2 py-0.5 text-[11px] font-medium text-purple-200/90">
              {AI_BADGE}
            </span>
            <p className="text-[13px] leading-relaxed text-white/50">
              {AI_NOTICE}整理者：{AUTHOR_NAME}。
            </p>
          </div>

          {/* ============ 摘要正文 ============ */}
          <div className="mt-7 whitespace-pre-line text-[16px] leading-[1.9] text-white/80 sm:text-[17px]">
            {ev.summary}
          </div>

          {/* ============ 为什么值得看 ============ */}
          {ev.whyItMatters && (
            <section className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-purple-200/90">为什么值得看</h2>
              <p className="text-[15px] leading-relaxed text-white/65">{ev.whyItMatters}</p>
            </section>
          )}

          {/* ============ 标签 ============ */}
          {ev.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {ev.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/45"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* ============ 信源列表：全部媒体名 + 可点外链（硬要求，SKILL.md §6） ============ */}
          <section className="mt-9">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-white/85">
              信源
              <span className="ml-2 text-xs font-normal tabular-nums text-white/35">
                {ev.sources.length || ev.sourceCount} 家
              </span>
            </h2>
            {ev.sources.length === 0 ? (
              <p className="text-sm text-white/35">信源信息缺失，请以各家原文为准。</p>
            ) : (
              <ol className="space-y-2">
                {ev.sources.map((s, i) => (
                  <li key={`${s.name}-${i}`} id={`src-${i + 1}`} className="scroll-mt-28">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="group flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
                    >
                      <span className="mt-0.5 shrink-0 font-mono text-[11px] tabular-nums text-white/25">
                        [{i + 1}]
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-white/80">{s.name}</span>
                          {s.tier === 1 && (
                            <span className="rounded-full bg-emerald-500/12 px-1.5 py-0.5 text-[10px] text-emerald-300/85">
                              一手信源
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-[13px] text-white/45 group-hover:text-white/65">
                          {s.title}
                        </span>
                      </span>
                      <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-white/60" />
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* ============ 关键事实：每条标注来自第几个信源，可一键跳转复核 ============ */}
          {ev.facts.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-sm font-semibold tracking-wide text-white/85">关键事实</h2>
              <ul className="space-y-2.5">
                {ev.facts.map((f, i) => {
                  const idx = Math.min(Math.max(f.sourceIndex, 0), Math.max(ev.sources.length - 1, 0))
                  const src = ev.sources[idx]
                  return (
                    <li key={i} className="flex gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400/60" />
                      <p className="text-[14px] leading-relaxed text-white/65">
                        {f.text}
                        {src && (
                          <a
                            href={`#src-${idx + 1}`}
                            className="ml-1.5 align-baseline text-[11px] text-purple-300/70 transition-colors hover:text-purple-200"
                            title={`来自信源：${src.name}`}
                          >
                            [{idx + 1}]
                          </a>
                        )}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* ============ 相关事件 ============ */}
          {related.length > 0 && (
            <section className="mt-9">
              <h2 className="mb-3 text-sm font-semibold tracking-wide text-white/85">
                相关 · {ev.categoryLabel}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/news/${r.slug}`}
                    className="group rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
                  >
                    <h3 className="line-clamp-2 text-balance text-[14px] font-medium leading-snug text-white/80 group-hover:text-white">
                      {r.headline}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] tabular-nums text-white/30">
                      <span>{formatDayHeading(dayKey(r.happenedAt))}</span>
                      <span>·</span>
                      <span>AI {r.aiScore}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ============ 免责声明（法定位置：正文末尾） ============ */}
          <p className="mt-9 border-t border-white/10 pt-5 text-[12px] leading-relaxed text-white/35">
            {AI_DISCLAIMER}
          </p>
        </article>

        {/* ============ 分享：复制文案里带「AI 摘要」字样由 buildShareText 统一保证 ============ */}
        <div className="mt-8">
          <ShareBar
            eventId={ev.id}
            slug={ev.slug}
            headline={ev.headline}
            summary={ev.summary}
            whyItMatters={ev.whyItMatters}
            category={ev.category}
            sources={ev.sources.map((s) => s.name)}
            happenedAt={ev.happenedAt}
            url={shareUrl}
            className="flex flex-wrap items-center gap-2"
          />
        </div>

        {/* ============ 讨论导流：本页不设评论区，也不提供任何用户可输入的 AI 入口（SKILL.md §1.1） ============ */}
        <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* ?n=<slug> 由 attribution.ts 在商品页捕获，用来回答「哪条内容带来了成交」 */}
          <Link
            href={withNewsRef('/products', ev.slug)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.09]"
          >
            <ShoppingBag className="h-4 w-4" />
            看看本站在售的 AI 订阅
          </Link>
          <Link
            href="/forum"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 text-sm font-medium transition-shadow hover:shadow-[0_0_28px_rgba(168,85,247,0.32)]"
          >
            <MessagesSquare className="h-4 w-4" />
            去论坛讨论
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* 结构化数据：类型是 Article 而不是 NewsArticle，理由见 lib/news/seo.ts 文件头 */}
      <ArticleJsonLd
        slug={ev.slug}
        headline={ev.headline}
        summary={ev.summary}
        category={ev.category}
        tags={ev.tags}
        happenedAt={ev.happenedAt}
        sources={ev.sources.map((s) => ({ title: s.title, url: s.url, sourceName: s.name }))}
      />
      <ViewBeacon eventId={ev.id} />
    </div>
  )
}
