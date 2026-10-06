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
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PenLine } from 'lucide-react'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { renderMarkdown } from '@/lib/markdown'
import { isHubIndexable, readableLength } from '@/lib/content/policy'
import { PUBLIC_WHERE, countIndexable, listContent } from '@/lib/content/queries'
import { ensureContentDefaults } from '@/lib/content/tags'
import { SITE_NAME } from '@/lib/product-seo'
import { OG_IMAGES, OG_SITE } from '@/lib/seo/og'
import { JsonLd } from '@/lib/seo/jsonld'
import { breadcrumbJsonLd, type Crumb } from '@/lib/seo/graph'
import { absUrl } from '@/lib/news/seo'
import { siteOrigin } from '@/lib/news/format'
import { ArticleList, EmptyState, ListShell, Pagination, PromptGrid, TagNav } from '@/components/content/content-ui'

export type HubKind = 'ROOT' | 'MODEL' | 'TOPIC' | 'PRODUCT'
type Section = 'PROMPT' | 'GUIDE'

const PAGE_SIZE = { PROMPT: 24, GUIDE: 20 } as const
const NOINDEX = { index: false, follow: true, googleBot: { index: false, follow: true } }

interface Resolved {
  section: Section
  kind: HubKind
  basePath: string
  tag: { id: number; slug: string; name: string; intro: string | null } | null
  h1: string
  lede: string
  crumbs: Crumb[]
}

const ROOT = {
  PROMPT: {
    basePath: '/prompts',
    h1: 'AI 提示词库',
    lede: '作者实测、可直接复制的生图与视频提示词。每条都附效果图、模型和参数，[方括号] 里换成你自己的内容即可。',
    crumbs: [{ name: '首页', path: '/' }, { name: '提示词库' }],
  },
  GUIDE: {
    basePath: '/guides',
    h1: 'AI 使用教程与技巧',
    lede: 'ChatGPT、Claude、Codex 等工具的功能教程与踩坑记录，每篇注明测试日期和账号类型。',
    crumbs: [{ name: '首页', path: '/' }, { name: '教程' }],
  },
} as const

async function resolve(section: Section, kind: HubKind, slug?: string): Promise<Resolved | null> {
  const root = ROOT[section]
  if (kind === 'ROOT') return { section, kind, basePath: root.basePath, tag: null, h1: root.h1, lede: root.lede, crumbs: [...root.crumbs] }
  await ensureContentDefaults()
  const tag = await prisma.tag.findFirst({
    where: { slug, kind, status: 1 },
    select: { id: true, slug: true, name: true, intro: true },
  })
  if (!tag) return null
  const seg = kind === 'MODEL' ? 'm' : kind === 'TOPIC' ? 't' : 'p'
  const h1 = kind === 'MODEL' ? `${tag.name} 提示词大全` : kind === 'TOPIC' ? `AI ${tag.name}提示词` : `${tag.name} 教程与使用技巧`
  const lede =
    kind === 'PRODUCT'
      ? `${tag.name} 的功能教程、使用技巧与常见问题，作者实测、注明测试日期。`
      : `${kind === 'MODEL' ? `用 ${tag.name} 生成的` : `${tag.name}方向的`}AI 提示词，附效果图与参数，复制即可用。`
  return {
    section,
    kind,
    basePath: `${root.basePath}/${seg}/${tag.slug}`,
    tag,
    h1,
    lede,
    crumbs: [{ name: '首页', path: '/' }, { name: root.crumbs[1].name, path: root.basePath }, { name: h1 }],
  }
}

function tagWhere(r: Resolved): Prisma.ForumPostWhereInput {
  return { type: r.section, ...(r.tag ? { postTags: { some: { tagId: r.tag.id } } } : {}) }
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
  if (r.kind === 'ROOT') return r.section === 'PROMPT' ? `AI 提示词大全：生图与视频提示词（可复制）- ${SITE_NAME}` : `ChatGPT / Claude 使用教程与技巧 - ${SITE_NAME}`
  const name = r.tag!.name
  if (r.kind === 'MODEL') return `${name} 提示词大全：${total} 条实测可复制案例${month ? `（${month}）` : ''} - ${SITE_NAME}`
  if (r.kind === 'TOPIC') return `AI ${name}提示词：${total} 条可复制案例 - ${SITE_NAME}`
  return `${name} 教程与使用技巧（${total} 篇实测）- ${SITE_NAME}`
}

export async function contentListMetadata(section: Section, kind: HubKind, slug: string | undefined, page: number): Promise<Metadata> {
  const r = await resolve(section, kind, slug)
  if (!r) return { title: `内容不存在 - ${SITE_NAME}`, robots: { index: false, follow: false } }
  const s = await stats(r)
  const indexable = isHubIndexable(kind, readableLength(r.tag?.intro ?? ''), s.indexable)
  const url = page > 1 ? `${r.basePath}?page=${page}` : r.basePath
  const title = titleOf(r, s.total, s.latest) + (page > 1 ? `（第 ${page} 页）` : '')
  return {
    metadataBase: new URL(siteOrigin()),
    title,
    description: r.lede,
    // 每一页的 canonical 指向自己，不统一指向第 1 页（Google 分页文档）
    alternates: { canonical: url },
    ...(indexable ? {} : { robots: NOINDEX }),
    openGraph: { ...OG_SITE, type: 'website', title: r.h1, description: r.lede, url, images: OG_IMAGES },
  }
}

export async function ContentListPage({ section, kind, slug, page }: { section: Section; kind: HubKind; slug?: string; page: number }) {
  const r = await resolve(section, kind, slug)
  if (!r) notFound()
  const list = await listContent({ type: section, tagSlug: r.tag?.slug, page, pageSize: PAGE_SIZE[section] })
  if (page > 1 && page > list.totalPages) notFound()

  // 只列出「至少有一条公开内容」的标签，免得把人领进空页
  const navTags = await prisma.tag.findMany({
    where: {
      status: 1,
      kind: section === 'PROMPT' ? { in: ['MODEL', 'TOPIC'] } : 'PRODUCT',
      posts: { some: { post: { ...PUBLIC_WHERE, type: section } } },
    },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: { slug: true, name: true, kind: true },
  })
  const hrefOf = (t: { slug: string; kind: string }) =>
    t.kind === 'MODEL' ? `/prompts/m/${t.slug}` : t.kind === 'TOPIC' ? `/prompts/t/${t.slug}` : `/guides/p/${t.slug}`
  const root = ROOT[section]
  const groups =
    section === 'PROMPT'
      ? [
          { label: '模型', items: [{ name: '全部', href: root.basePath }, ...navTags.filter((t) => t.kind === 'MODEL').map((t) => ({ name: t.name, href: hrefOf(t) }))] },
          { label: '主题', items: navTags.filter((t) => t.kind === 'TOPIC').map((t) => ({ name: t.name, href: hrefOf(t) })) },
        ]
      : [{ label: '产品', items: [{ name: '全部', href: root.basePath }, ...navTags.map((t) => ({ name: t.name, href: hrefOf(t) }))] }]

  const newHref = `/forum/new?type=${section}`
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: list.items.map((c, i) => ({ '@type': 'ListItem', position: (page - 1) * PAGE_SIZE[section] + i + 1, url: absUrl(c.path), name: c.title })),
  }

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(r.crumbs), ...(list.items.length ? [itemList] : [])]} />
      <ListShell
        crumbs={r.crumbs}
        h1={r.h1}
        lede={r.lede}
        introHtml={page === 1 && r.tag?.intro ? renderMarkdown(r.tag.intro) : null}
        nav={<TagNav groups={groups} active={r.basePath} />}
        action={
          <Link href={newHref} className="inline-flex items-center gap-2 self-start sm:self-auto px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90">
            <PenLine className="w-4 h-4" /> {section === 'PROMPT' ? '分享提示词' : '写教程'}
          </Link>
        }
      >
        {list.items.length === 0 ? (
          <EmptyState text="这里还没有内容。原创首发、附自己的出图或实测截图的投稿，会优先进入精选。" href={newHref} cta="去投稿" />
        ) : section === 'PROMPT' ? (
          <PromptGrid items={list.items} />
        ) : (
          <ArticleList items={list.items} />
        )}
        <Pagination basePath={r.basePath} page={page} totalPages={list.totalPages} />
      </ListShell>
    </>
  )
}
