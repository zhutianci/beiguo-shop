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
import { AI_BADGE, AI_DISCLAIMER } from '@/lib/news/constants'
import { withNewsRef } from '@/lib/news/attribution'
import { clipDescription, newsUrl } from '@/lib/news/seo'
import { shouldNoindexEvent } from '@/lib/news/thin'
import { AiNoticeBlock, LeadCredit } from '@/components/news/ai-notice-block'
import {
  EVENT_DETAIL_SELECT,
  dayKey,
  formatClock,
  formatDayHeading,
  ogImageForCategory,
  parseDetail,
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
  try {
    return await prisma.newsEvent.findFirst({
      where: { slug, status: 'PUBLISHED' },
      select: EVENT_DETAIL_SELECT,
    })
  } catch (e) {
    // 查询失败一律按「不存在」处理，绝不让整页 500。
    // 最现实的触发场景是发版时序错了：新镜像先于新列上线，select 里的列还不存在。
    // 那种时候给爬虫和买家一个 404 也比一个错误页强，而且列建好后自动恢复。
    console.error('[news/detail getEvent]', e)
    return null
  }
})

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const row = await getEvent(params.slug)
  if (!row) return { title: '内容不存在 - AI 圈大事记' }

  const ev = toEventDto(row)
  // 按句子收口，不再硬切在半个词上（实现与理由见 lib/news/seo.ts 的 clipDescription）
  const description = clipDescription(ev.summary)
  const image = ogImageForCategory(ev.category)
  // 没有全文层的事件不进索引（保留 follow）。理由与开关见 lib/news/thin.ts——
  // 简单说：97% 的站点 URL 是每小时批量产出的 147 字 AI 摘要页，
  // 这组特征正对着 Google 的 scaled content abuse，而那种判定是**站点级**的，
  // 真掉下去的是商品页。补齐 detail 后这里会自动恢复可索引，不需要回填。
  const noindex = shouldNoindexEvent(parseDetail(row.detail))

  return {
    metadataBase: new URL(siteOrigin()),
    title: `${ev.headline} - AI 圈大事记`,
    description,
    ...(noindex
      ? { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : {}),
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
  const detail = parseDetail(row.detail)
  // 这条事件里有没有来自第三方线索的信源。有才标注、才回链 —— 授权条件是「用了要标」，
  // 没用还标等于对读者虚构一个来源。
  const lead = ev.sources.find((s) => s.leadVia)

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
    <div className="relative min-h-screen pb-20 pt-28 sm:page-top">
      {/*
        微信抓缩略图的实测行为是「取 body 中靠前的、实际尺寸 ≥300×300 的 img」。
        这张图必须真的有渲染尺寸，所以用 position:absolute + visibility:hidden，
        **不能用 display:none**（display:none 的图不参与布局，微信不认）。
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" aria-hidden="true" width={600} height={315} className="news-wx-thumb" />

      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none fixed left-1/4 top-24 h-[420px] w-[420px] rounded-full bg-purple-500/10 blur-[128px]" />

      {/*
        正文页刻意 **不** 跟着列表页一起放宽：max-w-3xl（768px）在桌面端 18px 字号下
        约合 40 个汉字 / 72 个英文字符一行，正好落在阅读舒适区。
        桌面端要补的不是宽度而是字号——把正文从 17px 提到 18px、行高提到 1.95，
        视觉重量才配得上大屏，而不是让文字一路铺到 1400px。
      */}
      <div className="container relative max-w-3xl">
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white/80 lg:text-[15px]"
        >
          <ArrowLeft className="h-4 w-4" />
          AI 圈大事记
        </Link>

        <article className="mt-5 lg:mt-7">
          {/* ============ 标题 ============ */}
          {/* 桌面端标题必须明显大于移动端，否则和正文拉不开层级 */}
          <h1 className="text-balance text-[26px] font-bold leading-tight tracking-tight sm:text-4xl lg:text-[42px] lg:leading-[1.18]">
            {ev.headline}
          </h1>

          {/* ============ 元信息条 ============ */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-white/40 lg:mt-5 lg:gap-x-3.5 lg:text-sm">
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
          <AiNoticeBlock
            className="mt-6 lg:mt-7"
            leadNote={
              /*
                措辞必须在**所有**发布路径下都成立，包括 degradePublish 那条降级路径
                （模型不可用时会直接引用信源自带的 description，并在摘要开头标「未经 AI 摘要」）。
                所以这里不写「摘要由本站撰写」这种绝对断言 —— 那句话在降级路径下会和
                正文里的「以下摘自 XX」当场打架，而这是挂着授权号给授权方看的书面声明。
                只陈述两件永远为真的事：线索方的摘要我们没用；本页内容依据下方信源。
              */
              lead ? (
                <>
                  本条选题由第三方线索发现；线索方提供的摘要未被采用，本页内容依据下方信源整理。
                  <LeadCredit href={lead.leadUrl} className="ml-1" />
                </>
              ) : undefined
            }
          />

          {/* ============ 摘要 ============ */}
          {/* 正文是全页阅读密度最高的一块：桌面端 18px / 行高 1.95，长段落才不费眼 */}
          <div className="mt-7 whitespace-pre-line text-[16px] leading-[1.9] text-white/80 sm:text-[17px] lg:mt-9 lg:text-[18px] lg:leading-[1.95]">
            {ev.summary}
          </div>

          {/*
            ============ 全文梳理（detail）============
            没有就整块不渲染 —— 老事件（2026-09-07 之前的）本来就没有这一层，
            页面回到「只有摘要」的样子，与改造前完全一致，不会出现空标题或占位块。

            这一块同样是 AI 生成的，所以自带徽章与一句说明：
            标识义务是按「内容」算的，不是按「页面」算的，正文里多出一大块生成内容
            却只靠页头那一条提示，说服力不够。
          */}
          {detail.length > 0 && (
            <section className="mt-9 lg:mt-12">
              <div className="mb-4 flex flex-wrap items-center gap-2 lg:mb-5">
                <h2 className="text-base font-semibold tracking-wide text-white/85 lg:text-lg">全文梳理</h2>
                <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[11px] font-medium text-purple-200/90">
                  {AI_BADGE}
                </span>
                <span className="text-[12px] text-white/35 lg:text-[13px]">
                  依据下方信源原文自动整理，非原文转载
                </span>
              </div>
              <div className="space-y-6 lg:space-y-8">
                {detail.map((sec, i) => (
                  <div key={i}>
                    <h3 className="mb-2 text-[15px] font-semibold text-white/80 lg:mb-2.5 lg:text-[17px]">
                      {sec.heading}
                    </h3>
                    <p className="whitespace-pre-line text-[15px] leading-[1.9] text-white/65 sm:text-[16px] lg:text-[17px] lg:leading-[1.95]">
                      {sec.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ============ 为什么值得看 ============ */}
          {ev.whyItMatters && (
            <section className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-5 lg:mt-9 lg:p-6">
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-purple-200/90 lg:mb-2.5 lg:text-[15px]">为什么值得看</h2>
              <p className="text-[15px] leading-relaxed text-white/65 lg:text-base lg:leading-[1.85]">{ev.whyItMatters}</p>
            </section>
          )}

          {/* ============ 标签 ============ */}
          {ev.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2 lg:mt-6">
              {ev.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/45 lg:text-[13px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* ============ 信源列表：全部媒体名 + 可点外链（硬要求，SKILL.md §6） ============ */}
          <section className="mt-9 lg:mt-12">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-white/85 lg:mb-4 lg:text-base">
              信源
              <span className="ml-2 text-xs font-normal tabular-nums text-white/35 lg:text-[13px]">
                {ev.sources.length || ev.sourceCount} 家
              </span>
            </h2>
            {ev.sources.length === 0 ? (
              <p className="text-sm text-white/35 lg:text-[15px]">信源信息缺失，请以各家原文为准。</p>
            ) : (
              <ol className="space-y-2 lg:space-y-2.5">
                {ev.sources.map((s, i) => (
                  <li key={`${s.name}-${i}`} id={`src-${i + 1}`} className="scroll-below-header">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="group flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.07] lg:px-5 lg:py-3.5"
                    >
                      <span className="mt-0.5 shrink-0 font-mono text-[11px] tabular-nums text-white/25">
                        [{i + 1}]
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-medium text-white/80 lg:text-sm">{s.name}</span>
                          {s.tier === 1 && (
                            <span className="rounded-full bg-emerald-500/12 px-1.5 py-0.5 text-[10px] text-emerald-300/85">
                              一手信源
                            </span>
                          )}
                          {/* 线索标注挂在具体那一条上：读者要能看出「哪一条是别人帮我们发现的」，
                              而 s.name 始终是原发布者，不能被中介名顶替 */}
                          {s.leadVia && (
                            <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/45">
                              线索来自 {s.leadVia}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-[13px] text-white/45 group-hover:text-white/65 lg:text-sm">
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
            <section className="mt-8 lg:mt-12">
              <h2 className="mb-3 text-sm font-semibold tracking-wide text-white/85 lg:mb-4 lg:text-base">关键事实</h2>
              <ul className="space-y-2.5 lg:space-y-3">
                {ev.facts.map((f, i) => {
                  const idx = Math.min(Math.max(f.sourceIndex, 0), Math.max(ev.sources.length - 1, 0))
                  const src = ev.sources[idx]
                  return (
                    <li key={i} className="flex gap-3 rounded-xl bg-white/[0.03] px-4 py-3 lg:px-5 lg:py-3.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400/60 lg:mt-2" />
                      <p className="text-[14px] leading-relaxed text-white/65 lg:text-[15px] lg:leading-[1.8]">
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
            <section className="mt-9 lg:mt-12">
              <h2 className="mb-3 text-sm font-semibold tracking-wide text-white/85 lg:mb-4 lg:text-base">
                相关 · {ev.categoryLabel}
              </h2>
              {/* 相关事件在窄屏是单列，sm 起两列；桌面端只把内边距和字号放开，保持两列可扫读 */}
              <div className="grid gap-2 sm:grid-cols-2 lg:gap-3">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/news/${r.slug}`}
                    className="group rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.07] lg:px-5 lg:py-4"
                  >
                    <h3 className="line-clamp-2 text-balance text-[14px] font-medium leading-snug text-white/80 group-hover:text-white lg:text-[15px]">
                      {r.headline}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] tabular-nums text-white/30 lg:text-[12px]">
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
          <p className="mt-9 border-t border-white/10 pt-5 text-[12px] leading-relaxed text-white/35 lg:mt-12 lg:pt-6 lg:text-[13px]">
            {AI_DISCLAIMER}
          </p>
        </article>

        {/* ============ 分享：复制文案里带「AI 摘要」字样由 buildShareText 统一保证 ============ */}
        <div className="mt-8 lg:mt-10">
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
