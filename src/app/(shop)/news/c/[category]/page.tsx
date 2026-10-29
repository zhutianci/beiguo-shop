// 连库：必须 force-dynamic（builder 没有 DATABASE_URL，同 /news）
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { siteOrganizationJsonLd } from '@/lib/seo/pillars'
import { AiNoticeBlock } from '@/components/news/ai-notice-block'
import { PlatformJsonLd } from '@/components/seo/platform-json-ld'
import { breadcrumbJsonLd, collectionPageJsonLd, webSiteJsonLd } from '@/lib/seo/graph'
import { pageOg } from '@/lib/seo/og'
import { moduleMetadata } from '@/lib/storefront/module-meta'
import { AI_BADGE, CATEGORY_SLUGS, type CategorySlug } from '@/lib/news/constants'
import { EVENT_SELECT, NEWS_PAGE_SIZE, dayKey, formatDayHeading, ogImageForCategory, parseDetail, siteOrigin, sourceLabel, toEventDto } from '@/lib/news/format'
import { shouldNoindexEvent, thinNoindexEnabled } from '@/lib/news/thin'
import { CategoryNav } from '@/components/news/category-nav'

/**
 * 大事记分类分页 /news/c/[category]?page=N（SEO 批 3 的 E1，设计 §1.5、§3.3 支柱二）。
 *
 * 【为什么要有】/news 的时间流只直出第一页、「加载更多」走接口，搜索引擎从 /news 出发只能走到最近 20 条；
 * 更早的可索引事件只挂在 sitemap 里，没有一条服务端 <a> 能走到 —— 这正是「收录 0」的结构原因之一。
 * 分类分页给每一条可索引事件一条可抓取的站内路径，日报是另一条（digest 页补了当天全部可索引条目）。
 *
 * 【只列可索引事件】薄页（没有全文层）noindex，列进来就是在给爬虫指一批不进索引的页，
 * 粗筛用 detailState='DONE'（走索引），精筛与详情页、sitemap 共用 shouldNoindexEvent（同一个谓词，不另写规则）。
 * NEWS_THIN_NOINDEX=0 时薄页也可索引，这里同步不过滤。
 *
 * 【分页规则】?page=1 308 到无参地址；非数字、0、越界一律 404；canonical 指向本页自己（带 ?page=N）；
 * 导语只在第 1 页。合规：文案里没有新闻 / 快讯 / 头条 / 报道一类采编用语（SKILL §1），AI 标识照常（§6）。
 */

const COPY: Record<CategorySlug, { title: string; h1: string; lede: string }> = {
  'ai-models': { title: '大模型最新发布与版本更新', h1: '模型：大模型发布与版本更新', lede: '各家大模型的发布、版本更新与能力评测，同一件事的多家信源并成一条。' },
  'ai-products': { title: 'AI 产品更新与功能上线', h1: '产品：AI 产品功能上线与定价变化', lede: 'AI 产品的新功能上线、订阅方案与定价变化，按事件聚合。' },
  industry: { title: 'AI 公司动态：融资并购与生态合作', h1: '行业：AI 公司动态', lede: 'AI 公司的融资并购、合作与组织变化等经营动态，按事件聚合。' },
  paper: { title: 'AI 论文与技术方法速览', h1: '论文：AI 论文、技术方法与基准测试', lede: '值得关注的 AI 论文、技术方法与基准测试结果，附论文或项目原文链接。' },
  tool: { title: 'AI 开源项目与开发者工具', h1: '工具：开源项目与开发者工具', lede: '新发布或有重要更新的开源项目与开发者工具，附仓库或官方原文链接。' },
  opinion: { title: 'AI 从业者公开观点', h1: '观点：AI 从业者公开观点摘录', lede: 'AI 从业者在公开场合发表的观点摘录，每条附原文链接，请以原文为准。' },
}

const SUFFIX = ' - AI 圈大事记'

type Props = { params: { category: string }; searchParams: { page?: string | string[] } }

/** 返回合法页码；?page=1 → 'redirect'；非法 → null */
function parsePage(raw: string | string[] | undefined): number | 'redirect' | null {
  if (raw === undefined) return 1
  if (typeof raw !== 'string' || !/^[1-9]\d{0,4}$/.test(raw)) return null
  const n = Number(raw)
  return n === 1 ? 'redirect' : n
}

function isCategory(v: string): v is CategorySlug {
  return (CATEGORY_SLUGS as string[]).includes(v)
}

const pathOf = (cat: string, page: number) => `/news/c/${cat}${page > 1 ? `?page=${page}` : ''}`

async function load(cat: CategorySlug, page: number) {
  const where = { status: 'PUBLISHED', category: cat, ...(thinNoindexEnabled() ? { detailState: 'DONE' } : {}) }
  const [total, rows] = await Promise.all([
    prisma.newsEvent.count({ where }),
    prisma.newsEvent.findMany({
      where,
      select: { ...EVENT_SELECT, detail: true },
      orderBy: [{ happenedAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * NEWS_PAGE_SIZE,
      take: NEWS_PAGE_SIZE,
    }),
  ])
  const events = rows.filter((r) => !shouldNoindexEvent(parseDetail(r.detail))).map(toEventDto)
  return { total, totalPages: Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE)), events }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const page = parsePage(searchParams.page)
  if (!isCategory(params.category) || typeof page !== 'number') return {}
  const c = COPY[params.category]
  const nth = page > 1 ? `（第 ${page} 页）` : ''
  const title = `${c.title}${nth}${SUFFIX}`
  const description = `${c.lede.replace(/。$/, '')}${page > 1 ? `，第 ${page} 页` : ''}。AI 依据公开信源整理摘要，每条附原文链接，请以原文为准。`
  const path = pathOf(params.category, page)
  return moduleMetadata({
    metadataBase: new URL(siteOrigin()),
    alternates: { canonical: path },
    title,
    description,
    ...pageOg({ title, description, path, images: [{ url: ogImageForCategory(params.category), width: 1200, height: 630 }] }),
    // AI 标识第 4 处：页面元数据（SKILL §6）
    other: { 'ai-generated': 'true' },
  })
}

export default async function NewsCategoryPage({ params, searchParams }: Props) {
  if (!isCategory(params.category)) notFound()
  const cat = params.category
  const page = parsePage(searchParams.page)
  if (page === 'redirect') permanentRedirect(`/news/c/${cat}`)
  if (page === null) notFound()

  let data: Awaited<ReturnType<typeof load>>
  try {
    data = await load(cat, page)
  } catch (e) {
    console.error('[news/c]', e)
    throw e
  }
  if (page > data.totalPages) notFound()

  const c = COPY[cat]
  const path = pathOf(cat, page)
  const crumbs = [{ name: '首页', path: '/' }, { name: 'AI 圈大事记', path: '/news' }, { name: c.h1.split('：')[0] }]

  return (
    <div className="min-h-screen pb-20 pt-28 sm:page-top">
      <PlatformJsonLd
        data={[
          ...collectionPageJsonLd({
            path,
            name: `${c.title}${page > 1 ? `（第 ${page} 页）` : ''}`,
            description: c.lede,
            items: data.events.map((e) => ({ path: `/news/${e.slug}`, name: e.headline })),
          }),
          breadcrumbJsonLd(crumbs),
          webSiteJsonLd(),
          await siteOrganizationJsonLd(),
        ]}
      />
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <div className="container relative max-w-3xl lg:max-w-4xl">
        <nav aria-label="面包屑" className="flex flex-wrap items-center gap-x-1.5 text-sm text-white/45">
          <Link href="/" className="hover:text-white/80">首页</Link>
          <span className="text-white/20">/</span>
          <Link href="/news" className="hover:text-white/80">AI 圈大事记</Link>
          <span className="text-white/20">/</span>
          <span className="text-white/35">{crumbs[2].name}</span>
        </nav>

        <header className="mb-8 mt-5">
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {c.h1}
            {page > 1 && <span className="ml-2 text-xl font-medium text-white/45">第 {page} 页</span>}
          </h1>
          {page === 1 && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/55">{c.lede}</p>}
          <AiNoticeBlock className="mt-5" />
          <CategoryNav current={cat} />
        </header>

        {data.events.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center text-sm text-white/45">这一类暂时还没有整理好全文的条目。</p>
        ) : (
          <ol className="space-y-3">
            {data.events.map((e) => (
              <li key={e.id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-white/40">
                  <span className="rounded-full bg-purple-500/12 px-2 py-0.5 text-purple-200/85">{AI_BADGE}</span>
                  <time dateTime={e.happenedAt} className="tabular-nums">{formatDayHeading(dayKey(e.happenedAt))}</time>
                  <span>{sourceLabel(e.sources, e.sourceCount)}</span>
                </div>
                <h2 className="mt-2 text-[17px] font-semibold leading-snug">
                  <Link href={`/news/${e.slug}`} className="text-white/90 hover:text-white">{e.headline}</Link>
                </h2>
                <p className="mt-1.5 line-clamp-3 text-[14px] leading-relaxed text-white/55">{e.summary}</p>
              </li>
            ))}
          </ol>
        )}

        {data.totalPages > 1 && (
          <nav aria-label="分页" className="mt-10 flex items-center justify-between text-sm">
            {page > 1 ? <Link href={pathOf(cat, page - 1)} rel="prev" className="rounded-full border border-white/15 px-4 py-2 text-white/75 hover:text-white">← 上一页</Link> : <span />}
            <span className="tabular-nums text-white/40">{page} / {data.totalPages}</span>
            {page < data.totalPages ? <Link href={pathOf(cat, page + 1)} rel="next" className="rounded-full border border-white/15 px-4 py-2 text-white/75 hover:text-white">下一页 →</Link> : <span />}
          </nav>
        )}
      </div>
    </div>
  )
}
