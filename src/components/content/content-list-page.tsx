/**
 * 提示词库 / 教程的列表与 hub 页（内容平台 P1，设计 §4 / §7.3 / §11.3）。服务端组件。
 *
 *   /prompts            ROOT   提示词总览
 *   /prompts/m/{slug}   MODEL  模型 hub（「GPT-Image-2 提示词大全」）
 *   /prompts/t/{slug}   TOPIC  主题 hub（「AI 证件照提示词」）
 *   /guides             ROOT   教程总览
 *   /guides/p/{slug}    PRODUCT 产品 hub（「ChatGPT 教程与使用技巧」）
 *
 * 标题里的条数与更新月份从库里实时算，**不写死**（交接文档：写死的数字迟早对不上）。
 * 能不能收录看 policy.isHubIndexable：要有站方介绍、且可收录条目够数，否则 noindex,follow（空短聚合页是劲风算法的打击对象）。
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { renderMarkdown } from '@/lib/markdown'
import { isHubIndexable, readableLength } from '@/lib/content/policy'
import { PUBLIC_WHERE, countIndexable, listContent, listHot } from '@/lib/content/queries'
import { FACET_LABELS, FACET_PATH, FACETS, ensureContentDefaults, type Facet } from '@/lib/content/tags'
import { SITE_NAME } from '@/lib/product-seo'
import { OG_IMAGES, OG_SITE } from '@/lib/seo/og'
import { JsonLd } from '@/lib/seo/jsonld'
import { breadcrumbJsonLd, type Crumb } from '@/lib/seo/graph'
import { absUrl } from '@/lib/news/seo'
import { siteOrigin } from '@/lib/news/format'
import { AppGrid, Crumbs, Empty, FilterBar, GuideFeature, GuideRows, LEARN_HOME, LearnPage, PageHead, Pager, PrimaryAction, PromptMasonry, SearchBox, SortTabs, SponsorStrip } from '@/components/learn/ui'
import { activeSponsors } from '@/lib/content/sponsor'

export type ListSort = 'curated' | 'hot' | 'new'
export function sortParam(v: string | string[] | undefined): ListSort {
  const s = Array.isArray(v) ? v[0] : v
  return s === 'hot' || s === 'new' ? s : 'curated'
}

export type HubKind = 'ROOT' | 'FACET' | 'SHOWCASE' | 'MODEL' | 'TOPIC' | 'PRODUCT'
type Section = 'PROMPT' | 'GUIDE' | 'APP'

const PAGE_SIZE = { PROMPT: 24, GUIDE: 20, APP: 20 } as const
const NOINDEX = { index: false, follow: true, googleBot: { index: false, follow: true } }

interface Resolved {
  section: Section
  kind: HubKind
  basePath: string
  tag: { id: number; slug: string; name: string; intro: string | null } | null
  /** 提示词大类：/prompts/image|video|text，或模型 / 主题标签自带的大类 */
  facet: Facet | null
  h1: string
  lede: string
  crumbs: Crumb[]
}

const ROOT = {
  PROMPT: {
    basePath: '/prompts',
    h1: 'AI 提示词库',
    lede: '作者实测、可直接复制的生图与视频提示词。每条都附效果图、模型和参数，[方括号] 里换成你自己的内容即可。',
    crumbs: [{ name: LEARN_HOME.name, path: LEARN_HOME.path }, { name: '提示词库' }],
  },
  GUIDE: {
    basePath: '/guides',
    h1: 'AI 使用教程与技巧',
    lede: 'ChatGPT、Claude、Codex 等工具的功能教程与踩坑记录，每篇注明测试日期和账号类型。',
    crumbs: [{ name: LEARN_HOME.name, path: LEARN_HOME.path }, { name: '教程' }],
  },
  APP: {
    basePath: '/apps',
    h1: 'AI 应用推荐与工作流分享',
    lede: '真实用户写的 AI 应用与工作流：用它解决了什么、怎么用、值不值。不收清单式推荐和软文。',
    crumbs: [{ name: LEARN_HOME.name, path: LEARN_HOME.path }, { name: 'AI 应用' }],
  },
} as const

async function resolve(section: Section, kind: HubKind, slug?: string): Promise<Resolved | null> {
  const root = ROOT[section]
  if (kind === 'ROOT') return { section, kind, basePath: root.basePath, tag: null, facet: null, h1: root.h1, lede: root.lede, crumbs: [...root.crumbs] }
  if (kind === 'SHOWCASE') {
    if (section !== 'APP') return null
    return {
      section,
      kind,
      basePath: '/apps/showcase',
      tag: null,
      facet: null,
      h1: 'AI 产品作者自荐',
      lede: '独立开发者与团队介绍自己做的 AI 产品。每条都标明与产品的利益关系、必须能免费试用；推广链接一律标注。',
      crumbs: [{ name: LEARN_HOME.name, path: LEARN_HOME.path }, { name: 'AI 应用', path: '/apps' }, { name: '作者自荐' }],
    }
  }
  if (kind === 'FACET') {
    const facet = (FACETS as readonly string[]).find((f) => f.toLowerCase() === slug) as Facet | undefined
    if (!facet || section !== 'PROMPT') return null
    const f = FACET_HEAD[facet]
    return {
      section,
      kind,
      basePath: FACET_PATH[facet],
      tag: null,
      facet,
      h1: f.h1,
      lede: f.lede,
      crumbs: [{ name: LEARN_HOME.name, path: LEARN_HOME.path }, { name: '提示词库', path: root.basePath }, { name: f.h1 }],
    }
  }
  await ensureContentDefaults()
  const tag = await prisma.tag.findFirst({
    where: { slug, kind, status: 1 },
    select: { id: true, slug: true, name: true, intro: true, facet: true },
  })
  if (!tag) return null
  const seg = kind === 'MODEL' ? 'm' : kind === 'TOPIC' ? 't' : 'p'
  const h1 = kind === 'MODEL' ? `${tag.name} 提示词大全` : kind === 'TOPIC' ? `AI ${tag.name}提示词` : `${tag.name} 教程与使用技巧`
  const isText = tag.facet === 'TEXT'
  const lede =
    kind === 'PRODUCT'
      ? `${tag.name} 的功能教程、使用技巧与常见问题，作者实测、注明测试日期。`
      : `${kind === 'MODEL' ? `适用于 ${tag.name} 的` : `${tag.name}方向的`}AI 提示词，${isText ? '结构化模板 + 使用说明 + 示例输出' : '附效果图与参数'}，复制即可用。`
  return {
    section,
    kind,
    basePath: `${root.basePath}/${seg}/${tag.slug}`,
    tag: { id: tag.id, slug: tag.slug, name: tag.name, intro: tag.intro },
    facet: (tag.facet as Facet | null) ?? null,
    h1,
    lede,
    crumbs: [{ name: LEARN_HOME.name, path: LEARN_HOME.path }, { name: root.crumbs[1].name, path: root.basePath }, { name: h1 }],
  }
}

const FACET_HEAD: Record<Facet, { h1: string; lede: string; title: string }> = {
  IMAGE: {
    h1: 'AI 绘画提示词大全',
    lede: 'GPT-Image、Nano Banana、Midjourney 等生图提示词：证件照、写真、电商主图、海报、手办、修图……每条附效果图，[变量] 换成你的内容即可。',
    title: 'AI 绘画提示词大全：GPT-Image / Nano Banana / Midjourney 生图提示词（可复制）',
  },
  VIDEO: {
    h1: 'AI 视频提示词大全',
    lede: 'Seedance、可灵、Veo 视频提示词：产品广告片、图生视频、电影感镜头、短剧分镜，写清镜头、运镜与节奏。',
    title: 'AI 视频提示词大全：Seedance / 可灵 / Veo 视频生成提示词（可复制）',
  },
  TEXT: {
    h1: 'ChatGPT 提示词大全',
    lede: '科研数据分析、科研绘图、论文写作、文案、新媒体、编程、职场……结构化的提示词模板，附使用说明与示例输出。',
    title: 'ChatGPT 提示词大全：科研、写作、文案、编程、职场提示词模板（可复制）',
  },
}

function tagWhere(r: Resolved): Prisma.ForumPostWhereInput {
  return {
    type: r.section,
    // AI 应用：作者自荐与普通分享分开放（设计 §9.1「隔离」）
    ...(r.section === 'APP' && r.kind === 'ROOT' ? { app: { selfPromo: false } } : {}),
    ...(r.kind === 'SHOWCASE' ? { app: { selfPromo: true } } : {}),
    ...(r.tag ? { postTags: { some: { tagId: r.tag.id } } } : {}),
    ...(r.kind === 'FACET' && r.facet ? { AND: [{ postTags: { some: { tag: { kind: 'MODEL', facet: r.facet, status: 1 } } } }] } : {}),
  }
}

async function stats(r: Resolved) {
  const where = { ...PUBLIC_WHERE, ...tagWhere(r) }
  const [total, latest, indexable] = await Promise.all([
    prisma.forumPost.count({ where }),
    prisma.forumPost.findFirst({ where, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    countIndexable(tagWhere(r)),
  ])
  return { total, latest: latest?.createdAt ?? null, indexable }
}

function titleOf(r: Resolved, total: number, latest: Date | null): string {
  const month = latest ? `${latest.getFullYear()}年${latest.getMonth() + 1}月更新` : ''
  if (r.kind === 'ROOT')
    return r.section === 'PROMPT'
      ? `AI 提示词大全：绘画、视频、ChatGPT 提示词（可复制）- ${SITE_NAME}`
      : r.section === 'APP'
        ? `AI 应用推荐 ${new Date().getFullYear()}：真实用户的 AI 工具与工作流分享 - ${SITE_NAME}`
        : `ChatGPT / Claude 使用教程与技巧 - ${SITE_NAME}`
  if (r.kind === 'SHOWCASE') return `AI 产品作者自荐 - ${SITE_NAME}`
  if (r.kind === 'FACET' && r.facet) return `${FACET_HEAD[r.facet].title} - ${SITE_NAME}`
  const name = r.tag!.name
  if (r.kind === 'MODEL') return `${name} 提示词大全：${total} 条实测可复制案例${month ? `（${month}）` : ''} - ${SITE_NAME}`
  if (r.kind === 'TOPIC') return `AI ${name}提示词：${total} 条可复制案例 - ${SITE_NAME}`
  return `${name} 教程与使用技巧（${total} 篇实测）- ${SITE_NAME}`
}

export async function contentListMetadata(section: Section, kind: HubKind, slug: string | undefined, page: number, sort: ListSort = 'curated'): Promise<Metadata> {
  const r = await resolve(section, kind, slug)
  // 不存在的专题在 metadata 这一步 404（有 loading.tsx 的路由在页面体里 notFound() 只能拿到 200 的软 404，见 content-detail-page）
  if (!r) notFound()
  const s = await stats(r)
  // 越界页码同理在这里 404（与页面体的 page > list.totalPages 同一口径：公开条数 / 每页条数）
  if (page > 1 && sort === 'curated' && page > Math.max(1, Math.ceil(s.total / PAGE_SIZE[section]))) notFound()
  // 大类页（/prompts/image 等）与总览同一门槛：不需要介绍，可收录条目够数即可
  // 作者自荐页不收录（推广内容的聚合页，设计 §9.2）
  const indexable = kind !== 'SHOWCASE' && isHubIndexable(kind === 'FACET' ? 'ROOT' : kind, readableLength(r.tag?.intro ?? ''), s.indexable)
  const url = page > 1 ? `${r.basePath}?page=${page}` : r.basePath
  const title = titleOf(r, s.total, s.latest) + (page > 1 ? `（第 ${page} 页）` : '')
  return {
    metadataBase: new URL(siteOrigin()),
    title,
    description: r.lede,
    // 每一页的 canonical 指向自己，不统一指向第 1 页（Google 分页文档）；
    // 带 sort 的排序视图是同一批内容换个顺序：canonical 指回不带参数的地址，且不收录
    alternates: { canonical: sort === 'curated' ? url : r.basePath },
    ...(indexable && sort === 'curated' ? {} : { robots: NOINDEX }),
    openGraph: { ...OG_SITE, type: 'website', title: r.h1, description: r.lede, url, images: OG_IMAGES },
  }
}

const EYEBROW: Record<HubKind, Record<Section, string>> = {
  ROOT: { PROMPT: 'Prompt Library · 提示词库', GUIDE: 'Guides · 教程', APP: 'AI Apps · 应用分享' },
  FACET: { PROMPT: 'Prompt Library · 提示词库', GUIDE: '', APP: '' },
  SHOWCASE: { PROMPT: '', GUIDE: '', APP: 'Showcase · 作者自荐' },
  MODEL: { PROMPT: 'Model · 模型专题', GUIDE: 'Model · 模型专题', APP: '' },
  TOPIC: { PROMPT: 'Topic · 主题专题', GUIDE: 'Topic · 主题专题', APP: '' },
  PRODUCT: { PROMPT: 'Product · 产品专题', GUIDE: 'Product · 产品专题', APP: '' },
}

export async function ContentListPage({ section, kind, slug, page, sort = 'curated' }: { section: Section; kind: HubKind; slug?: string; page: number; sort?: ListSort }) {
  const r = await resolve(section, kind, slug)
  if (!r) notFound()
  const [list, s, sponsors] = await Promise.all([
    sort === 'hot'
      ? listHot({
          type: section,
          tagSlug: r.tag?.slug,
          facet: r.kind === 'FACET' ? r.facet ?? undefined : undefined,
          selfPromo: section === 'APP' ? r.kind === 'SHOWCASE' : undefined,
          page,
          pageSize: PAGE_SIZE[section],
        })
      : listContent({
          type: section,
          tagSlug: r.tag?.slug,
          facet: r.kind === 'FACET' ? r.facet ?? undefined : undefined,
          selfPromo: section === 'APP' ? r.kind === 'SHOWCASE' : undefined,
          order: sort,
          page,
          pageSize: PAGE_SIZE[section],
        }),
    stats(r),
    // 赞助位只在第一页出，自荐区（本身就是推广）不出
    page === 1 && r.kind !== 'SHOWCASE' ? activeSponsors(section === 'PROMPT' ? 'PROMPTS' : section === 'APP' ? 'APPS' : 'GUIDES') : Promise.resolve([]),
  ])
  if (page > 1 && page > list.totalPages) notFound()

  // 筛选条只列「至少有一条公开内容」的标签，并带条数（免得把人领进空页）
  const navTags = await prisma.tag.findMany({
    where: {
      status: 1,
      kind: section === 'PROMPT' ? { in: ['MODEL', 'TOPIC'] } : section === 'APP' ? 'TOPIC' : 'PRODUCT',
      posts: { some: { post: { ...PUBLIC_WHERE, type: section } } },
    },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: { slug: true, name: true, kind: true, facet: true, _count: { select: { posts: { where: { post: { ...PUBLIC_WHERE, type: section } } } } } },
  })
  // 三大类各有多少条（类型那一行的条数）
  const facetCounts =
    section === 'PROMPT'
      ? await Promise.all(
          FACETS.map((f) =>
            prisma.forumPost.count({ where: { ...PUBLIC_WHERE, type: 'PROMPT', postTags: { some: { tag: { kind: 'MODEL', facet: f, status: 1 } } } } }),
          ),
        )
      : []
  // 当前在哪个大类下：模型 / 主题行只列这一类的标签
  const scope = r.facet
  const hrefOf = (t: { slug: string; kind: string }) =>
    t.kind === 'MODEL' ? `/prompts/m/${t.slug}` : t.kind === 'TOPIC' ? `/prompts/t/${t.slug}` : `/guides/p/${t.slug}`
  const root = ROOT[section]
  const chip = (t: (typeof navTags)[number]) => ({ name: t.name, href: hrefOf(t), count: t._count.posts })
  const inScope = (t: (typeof navTags)[number]) => !scope || t.facet === scope
  const groups =
    section === 'PROMPT'
      ? [
          {
            label: '类型',
            items: [
              { name: '全部', href: root.basePath },
              ...FACETS.map((f, i) => ({ name: FACET_LABELS[f], href: FACET_PATH[f], count: facetCounts[i] })).filter((x) => x.count > 0),
            ],
          },
          { label: '模型', items: navTags.filter((t) => t.kind === 'MODEL' && inScope(t)).map(chip) },
          { label: '主题', items: navTags.filter((t) => t.kind === 'TOPIC' && inScope(t)).map(chip) },
        ]
      : section === 'APP'
        ? [{ label: '分类', items: [{ name: '应用分享', href: '/apps' }, { name: '作者自荐', href: '/apps/showcase' }] }]
        : [{ label: '产品', items: [{ name: '全部', href: root.basePath }, ...navTags.map(chip)] }]
  // 类型行高亮当前大类（在模型 / 主题页时高亮它所属的大类），模型 / 主题行高亮当前标签
  const active = [r.basePath, ...(r.facet ? [FACET_PATH[r.facet]] : []), ...(r.kind === 'ROOT' ? [root.basePath] : [])]

  const newHref = `/forum/new?type=${section}`
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: list.items.map((c, i) => ({ '@type': 'ListItem', position: (page - 1) * PAGE_SIZE[section] + i + 1, url: absUrl(c.path), name: c.title })),
  }
  const latest = s.latest ? `${s.latest.getFullYear()}.${String(s.latest.getMonth() + 1).padStart(2, '0')}` : '—'

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(r.crumbs), ...(list.items.length ? [itemList] : [])]} />
      <LearnPage>
        <Crumbs crumbs={r.crumbs} />
        <PageHead
          eyebrow={EYEBROW[kind][section]}
          title={r.h1}
          lede={r.lede}
          action={<PrimaryAction href={newHref}>{section === 'PROMPT' ? '分享提示词' : section === 'APP' ? '分享一个 AI 应用' : '写一篇教程'}</PrimaryAction>}
          stats={[
            { label: section === 'PROMPT' ? '条提示词' : section === 'APP' ? '个应用' : '篇教程', value: s.total },
            { label: '最近更新', value: latest },
          ]}
        />

        {page === 1 && r.tag?.intro && (
          <section className="learn-card learn-in mb-12 grid gap-6 p-6 lg:grid-cols-[180px_minmax(0,1fr)] lg:p-9">
            <p className="learn-eyebrow pt-1">专题介绍</p>
            <div className="prose-forum learn-prose max-w-3xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(r.tag.intro) }} />
          </section>
        )}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchBox
            placeholder={
              section === 'PROMPT' ? '搜索提示词，例如：证件照、论文润色、产品图' : section === 'APP' ? '搜索 AI 应用，例如：PPT、会议纪要、自动化' : '搜索教程，例如：记忆、深度研究、Claude Code'
            }
          />
          <SortTabs basePath={r.basePath} sort={sort} />
        </div>
        <FilterBar groups={groups} active={active} />
        <SponsorStrip items={sponsors} />

        {list.items.length === 0 ? (
          <Empty
            title="这里还没有内容"
            desc="原创首发、附自己出图或实测截图的投稿，会优先进入精选。"
            href={newHref}
            cta="成为第一个投稿的人"
          />
        ) : section === 'PROMPT' ? (
          <PromptMasonry items={list.items} />
        ) : section === 'APP' ? (
          <AppGrid items={list.items} />
        ) : page === 1 && sort === 'curated' ? (
          <div className="space-y-10">
            <GuideFeature c={list.items[0]} />
            {list.items.length > 1 && <GuideRows items={list.items.slice(1)} start={2} />}
          </div>
        ) : (
          <GuideRows items={list.items} start={(page - 1) * PAGE_SIZE[section] + 1} />
        )}
        <Pager basePath={r.basePath} page={page} totalPages={list.totalPages} query={sort === 'curated' ? '' : `sort=${sort}`} />
      </LearnPage>
    </>
  )
}
