/**
 * 内容平台的服务端取数（内容平台 P1）。页面、sitemap、作者页、商品页的「相关内容」共用。
 *
 * 「对外公开」的口径只有一个：policy.isPublic（status=1 且已过审且未删除），这里的 where 条件 PUBLIC_WHERE 与它逐字对应。
 * 「能不能收录」只看 policy.isIndexable，入参由 toIndexableInput 统一拼——页面的 robots、sitemap、IndexNow 都走这一个函数。
 */
import { cache } from 'react'
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { storefrontCached } from '../storefront/cache'
import { PLATFORM_TENANT_ID } from '../storefront/resolve'
import { memberDisplayName } from '../forum'
import { plainExcerpt } from '../markdown'
import {
  INDEXING_OPEN,
  contentPath,
  isIndexable,
  type ContentType,
  type IndexableInput,
} from './policy'

export const PUBLIC_WHERE = { status: 1, reviewStatus: 'APPROVED', deletedAt: null } as const

const DETAIL_INCLUDE = {
  category: { select: { name: true, slug: true, icon: true, color: true } },
  user: { select: { nickname: true, avatar: true } },
  prompt: true,
  app: true,
  postTags: { include: { tag: { select: { id: true, slug: true, name: true, kind: true, facet: true, landingPath: true, status: true } } } },
} satisfies Prisma.ForumPostInclude

export type ContentRow = Prisma.ForumPostGetPayload<{ include: typeof DETAIL_INCLUDE }>

/** 详情页取数（generateMetadata 与页面本体用 React cache 去重）。查询失败按不存在处理，不让整页 500 */
export const getContentPost = cache(async (id: number): Promise<ContentRow | null> => {
  if (!Number.isInteger(id) || id <= 0) return null
  try {
    return await prisma.forumPost.findUnique({ where: { id }, include: DETAIL_INCLUDE })
  } catch (e) {
    console.error('[content getContentPost]', e)
    return null
  }
})

export function imagesOf(p: { images: string | null }): string[] {
  try {
    return p.images ? (JSON.parse(p.images) as unknown[]).filter((u): u is string => typeof u === 'string') : []
  } catch {
    return []
  }
}

export function authorNameOf(p: { userId: number | null; authorName: string; user?: { nickname: string | null } | null }): string {
  // 会员按当前昵称现算：库里旧快照可能是邮箱前缀（审计 G48）
  return p.userId ? memberDisplayName(p.user?.nickname, p.userId) : p.authorName
}

export function tagsOf(p: ContentRow, kind?: string) {
  return p.postTags.map((pt) => pt.tag).filter((t) => t.status === 1 && (!kind || t.kind === kind))
}

export function toIndexableInput(p: {
  status: number
  reviewStatus: string
  deletedAt: Date | null
  userId: number | null
  content: string
  originality: string
  aiAssist: string
  commentCount: number
  type: string
  images: string | null
  testedOn: Date | null
  checkedOn?: Date | null
  prompt?: { prompt: string } | null
  app?: { selfPromo: boolean } | null
  featured?: boolean
  postTags?: { tag: { kind: string; status: number; facet?: string | null } }[]
}): IndexableInput {
  const model = p.postTags?.find((pt) => pt.tag.kind === 'MODEL' && pt.tag.status === 1)
  return {
    ...p,
    promptText: p.prompt?.prompt ?? null,
    imageCount: imagesOf(p).length,
    hasModel: !!model,
    facet: model?.tag.facet ?? null,
    selfPromo: !!p.app?.selfPromo,
  }
}

/** 一条提示词属于图像 / 视频 / 文本哪一类：由它的模型标签决定 */
export function facetOf(p: { postTags: { tag: { kind: string; facet?: string | null; status: number } }[] }): string | null {
  return p.postTags.find((pt) => pt.tag.kind === 'MODEL' && pt.tag.status === 1)?.tag.facet ?? null
}

export function contentIndexable(p: Parameters<typeof toIndexableInput>[0], open: boolean = INDEXING_OPEN): boolean {
  return isIndexable(toIndexableInput(p), open)
}

/** 列表卡片 */
export interface ContentCard {
  id: number
  type: string
  path: string
  title: string
  excerpt: string
  cover: string | null
  /** 封面宽高（上传时记录，见 media_assets）；读不到为空，前端按 4:5 兜底 */
  coverW: number | null
  coverH: number | null
  /** 提示词大类 IMAGE | VIDEO | TEXT（文本类在列表里用文字卡片展示） */
  facet: string | null
  /** 文本卡片上的提示词节选 */
  promptExcerpt: string | null
  /** 第一个主题标签（文本卡片上的领域角标） */
  topicName: string | null
  /** AI 应用：应用名、是否作者自荐（列表上要显示「自荐」标注） */
  appName: string | null
  selfPromo: boolean
  modelName: string | null
  tags: { slug: string; name: string; kind: string }[]
  authorName: string
  userId: number | null
  copyCount: number
  likeCount: number
  commentCount: number
  featured: boolean
  verified: boolean
  createdAt: string
}

const CARD_INCLUDE = {
  user: { select: { nickname: true } },
  prompt: { select: { useCase: true, prompt: true } },
  app: { select: { name: true, selfPromo: true } },
  postTags: { include: { tag: { select: { slug: true, name: true, kind: true, facet: true, status: true } } } },
} satisfies Prisma.ForumPostInclude

type CardRow = Prisma.ForumPostGetPayload<{ include: typeof CARD_INCLUDE }>

function toCard(p: CardRow): ContentCard {
  const tags = p.postTags.map((pt) => pt.tag).filter((t) => t.status === 1)
  return {
    id: p.id,
    type: p.type,
    path: contentPath(p.type, p.id, p.slug),
    title: p.title,
    excerpt: p.excerpt || p.prompt?.useCase || plainExcerpt(p.content, 90),
    cover: imagesOf(p)[0] ?? null,
    coverW: null,
    coverH: null,
    facet: tags.find((t) => t.kind === 'MODEL')?.facet ?? null,
    promptExcerpt: p.prompt?.prompt ? p.prompt.prompt.replace(/\s+/g, ' ').slice(0, 160) : null,
    topicName: tags.find((t) => t.kind === 'TOPIC')?.name ?? null,
    appName: p.app?.name ?? null,
    selfPromo: !!p.app?.selfPromo,
    modelName: tags.find((t) => t.kind === 'MODEL')?.name ?? null,
    tags: tags.map(({ slug, name, kind }) => ({ slug, name, kind })),
    authorName: authorNameOf(p),
    userId: p.userId,
    copyCount: p.copyCount,
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    featured: p.featured,
    verified: !!p.verifiedAt,
    createdAt: p.createdAt.toISOString(),
  }
}

/** 精选在前（按进精选的时间），其余按发布先后。不按点赞 / 浏览排：那是热门榜的事（P2） */
const LIST_ORDER: Prisma.ForumPostOrderByWithRelationInput[] = [
  { featured: 'desc' },
  { featuredAt: 'desc' },
  { createdAt: 'desc' },
  { id: 'desc' },
]

/** 按图片地址查上传时记录的宽高 */
export async function dimsFor(urls: string[]): Promise<Map<string, { w: number; h: number }>> {
  const list = Array.from(new Set(urls.filter(Boolean)))
  const m = new Map<string, { w: number; h: number }>()
  if (!list.length) return m
  const rows = await prisma.mediaAsset.findMany({ where: { url: { in: list } }, select: { url: true, width: true, height: true } })
  for (const r of rows) if (r.width && r.height) m.set(r.url, { w: r.width, h: r.height })
  return m
}

/** 给卡片补上封面宽高（一次查询） */
export async function withDims(cards: ContentCard[]): Promise<ContentCard[]> {
  const dims = await dimsFor(cards.map((c) => c.cover ?? ''))
  return cards.map((c) => {
    const d = c.cover ? dims.get(c.cover) : undefined
    return d ? { ...c, coverW: d.w, coverH: d.h } : c
  })
}

export interface ListResult {
  items: ContentCard[]
  total: number
  page: number
  totalPages: number
}

export async function listContent(opts: {
  type: ContentType
  tagSlug?: string
  /** 提示词大类：按模型标签的 facet 过滤 */
  facet?: string
  userId?: number
  /** curated（默认）：精选在前；new：纯按发布时间 */
  order?: 'curated' | 'new'
  /** AI 应用：只看作者自荐（true）/ 只看普通分享（false） */
  selfPromo?: boolean
  page: number
  pageSize: number
}): Promise<ListResult> {
  const where: Prisma.ForumPostWhereInput = {
    ...PUBLIC_WHERE,
    type: opts.type,
    ...(opts.tagSlug ? { postTags: { some: { tag: { slug: opts.tagSlug, status: 1 } } } } : {}),
    ...(opts.facet ? { AND: [{ postTags: { some: { tag: { kind: 'MODEL', facet: opts.facet, status: 1 } } } }] } : {}),
    ...(opts.userId ? { userId: opts.userId } : {}),
    ...(opts.selfPromo !== undefined ? { app: { selfPromo: opts.selfPromo } } : {}),
  }
  const [rows, total] = await Promise.all([
    prisma.forumPost.findMany({
      where,
      orderBy: opts.order === 'new' ? [{ createdAt: 'desc' }, { id: 'desc' }] : LIST_ORDER,
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      include: CARD_INCLUDE,
    }),
    prisma.forumPost.count({ where }),
  ])
  return { items: await withDims(rows.map(toCard)), total, page: opts.page, totalPages: Math.max(Math.ceil(total / opts.pageSize), 1) }
}

/**
 * 某个集合里「可收录」的条数（hub 能不能收录看它，policy.isHubIndexable）。
 * 闸门要看正文与附表，只能取出来逐条算；量级是一个 hub 几十到几百条，取上限 1000 足够。
 * 总开关关着时直接返回 0，不查库。
 */
export async function countIndexable(where: Prisma.ForumPostWhereInput): Promise<number> {
  if (!INDEXING_OPEN) return 0
  const rows = await prisma.forumPost.findMany({
    where: { ...PUBLIC_WHERE, originality: 'ORIGINAL_FIRST', ...where },
    take: 1000,
    select: {
      status: true, reviewStatus: true, deletedAt: true, userId: true, content: true, originality: true, aiAssist: true,
      commentCount: true, type: true, images: true, testedOn: true, checkedOn: true,
      featured: true,
      prompt: { select: { prompt: true } },
      app: { select: { selfPromo: true } },
      postTags: { select: { tag: { select: { kind: true, status: true, facet: true } } } },
    },
  })
  return rows.filter((r) => contentIndexable(r)).length
}

/*
 * countIndexable 的跨请求缓存（性能优化 2026-10-07）。它要把最多 1000 条帖子的正文、提示词全文取出来逐条判定，
 * 是 /learn、/prompts、/guides 及各专题页每次请求里最重的一次查询，而它只决定这一页的 robots 是否 noindex。
 *  · 为什么能跨请求缓存：结果只取决于公开内容本身，与登录用户、店面都无关——内容平台只在主站开放（这些路由的 layout 都
 *    notFoundOnChannel），所以键固定用主站的店面 id；走全仓唯一允许的跨请求缓存 storefrontCached（边界检查第 9 条）。
 *  · 为什么能接受 5 分钟的滞后：新内容过审后，专题页从 noindex 变成可收录最多晚 5 分钟，爬虫本来就是按天回访；
 *    下线内容同理。条数、标题等展示数据不走这里，照常实时。
 *  · /u/[handle] 作者页仍直接调 countIndexable（按作者、量小）。
 */
const countIndexableShared = storefrontCached(
  'content-indexable',
  (_sfId: number, where: Prisma.ForumPostWhereInput) => countIndexable(where),
  5 * 60_000,
)
export function countIndexableCached(where: Prisma.ForumPostWhereInput): Promise<number> {
  return countIndexableShared(PLATFORM_TENANT_ID, where)
}

/** 详情页底部的相关内容（设计 §5.1 第 6 点：作者的更多 / 同主题其他模型 / 同模型相关主题） */
export async function relatedContent(p: ContentRow, limit = 6): Promise<{ title: string; items: ContentCard[] }[]> {
  const groups: { title: string; items: ContentCard[] }[] = []
  const seen = new Set<number>([p.id])
  const take = async (title: string, where: Prisma.ForumPostWhereInput) => {
    const rows = await prisma.forumPost.findMany({
      where: { ...PUBLIC_WHERE, type: p.type, id: { notIn: Array.from(seen) }, ...where },
      orderBy: LIST_ORDER,
      take: limit,
      include: CARD_INCLUDE,
    })
    const items = await withDims(rows.map(toCard))
    items.forEach((i) => seen.add(i.id))
    if (items.length) groups.push({ title, items })
  }
  const models = tagsOf(p, 'MODEL').map((t) => t.id)
  const topics = tagsOf(p, 'TOPIC').map((t) => t.id)
  const products = tagsOf(p, 'PRODUCT').map((t) => t.id)
  if (p.userId) await take(`${authorNameOf(p)} 的更多内容`, { userId: p.userId })
  if (topics.length) {
    await take('同主题', {
      postTags: { some: { tagId: { in: topics } } },
      ...(models.length ? { NOT: { postTags: { some: { tagId: { in: models } } } } } : {}),
    })
  }
  if (models.length) await take('同模型', { postTags: { some: { tagId: { in: models } } } })
  if (products.length) await take('同产品的其他教程', { postTags: { some: { tagId: { in: products } } } })
  return groups
}

/** 阅读时长（分钟）：中文按每分钟 400 字估，至少 1 分钟 */
export function readingMinutes(md: string): number {
  const n = md.replace(/```[\s\S]*?```/g, '').replace(/\s+/g, '').length
  return Math.max(1, Math.round(n / 400))
}

/**
 * 学习平台首页（/learn）的聚合数据。全部是公开内容；任何一块查询失败都降级成空，不让首页 500。
 */
export async function learnHomeData() {
  const safe = async <T>(f: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await f()
    } catch (e) {
      console.error('[learn home]', e)
      return fallback
    }
  }
  const empty = { items: [], total: 0, page: 1, totalPages: 1 } as ListResult
  const [prompts, hot, textPrompts, videoPrompts, apps, guides, totals, tags, creators] = await Promise.all([
    safe(() => listContent({ type: 'PROMPT', facet: 'IMAGE', page: 1, pageSize: 12 }), empty),
    safe(() => listHot({ type: 'PROMPT', page: 1, pageSize: 8 }), empty),
    safe(() => listContent({ type: 'PROMPT', facet: 'TEXT', page: 1, pageSize: 9 }), empty),
    safe(() => listContent({ type: 'PROMPT', facet: 'VIDEO', page: 1, pageSize: 4 }), empty),
    safe(() => listContent({ type: 'APP', selfPromo: false, page: 1, pageSize: 6 }), empty),
    safe(() => listContent({ type: 'GUIDE', page: 1, pageSize: 7 }), { items: [], total: 0, page: 1, totalPages: 1 } as ListResult),
    safe(
      async () => {
        const [prompt, guide, discussion] = await Promise.all(
          (['PROMPT', 'GUIDE', 'DISCUSSION'] as const).map((type) => prisma.forumPost.count({ where: { ...PUBLIC_WHERE, type } })),
        )
        return { prompt, guide, discussion }
      },
      { prompt: 0, guide: 0, discussion: 0 },
    ),
    safe(
      () =>
        prisma.tag.findMany({
          where: { status: 1 },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: {
            slug: true,
            name: true,
            kind: true,
            intro: true,
            _count: { select: { posts: { where: { post: PUBLIC_WHERE } } } },
            posts: {
              where: { post: { ...PUBLIC_WHERE, type: 'PROMPT' } },
              take: 3,
              orderBy: { post: { createdAt: 'desc' } },
              select: { post: { select: { images: true } } },
            },
          },
        }),
      [],
    ),
    safe(
      async () => {
        // 创作者榜（P2）：按积分排（积分来自被精选、收藏、同款、采纳，而不是发帖数量）
        const profiles = await prisma.creatorProfile.findMany({ where: { points: { gt: 0 } }, orderBy: { points: 'desc' }, take: 8 })
        const ids = profiles.map((p) => p.userId)
        const [users, counts] = await Promise.all([
          prisma.user.findMany({ where: { id: { in: ids }, status: 1 }, select: { id: true, nickname: true } }),
          prisma.forumPost.groupBy({ by: ['userId'], where: { ...PUBLIC_WHERE, userId: { in: ids } }, _count: { _all: true } }),
        ])
        return profiles
          .map((pf) => {
            const u = users.find((x) => x.id === pf.userId)
            return u
              ? { name: memberDisplayName(u.nickname, u.id), href: `/u/${pf.handle}`, count: counts.find((c) => c.userId === pf.userId)?._count._all ?? 0, points: pf.points }
              : null
          })
          .filter((x): x is { name: string; href: string; count: number; points: number } => !!x)
          .slice(0, 6)
      },
      [],
    ),
  ])
  const hubs = tags
    .filter((t) => t._count.posts > 0)
    .map((t) => ({
      slug: t.slug,
      name: t.name,
      kind: t.kind,
      count: t._count.posts,
      hasIntro: !!t.intro,
      covers: t.posts.map((pt) => imagesOf(pt.post)[0]).filter((u): u is string => !!u),
    }))
  return { prompts: prompts.items, hot: hot.items, textPrompts: textPrompts.items, videoPrompts: videoPrompts.items, apps: apps.items, guides: guides.items, totals, hubs, creators }
}

/** 按给定顺序取一组公开内容的卡片（收藏、合集用）；不公开的静默跳过 */
export async function cardsByIds(ids: number[]): Promise<ContentCard[]> {
  if (!ids.length) return []
  const rows = await prisma.forumPost.findMany({ where: { id: { in: ids }, ...PUBLIC_WHERE }, include: CARD_INCLUDE })
  const byId = new Map(rows.map((r) => [r.id, toCard(r)]))
  return withDims(ids.map((id) => byId.get(id)).filter((c): c is ContentCard => !!c))
}

/**
 * 热度排序（设计 §7.1）：奖励「被拿去用」而不是「被看到」——
 *   hot = (复制×3 + 同款×5 + 收藏×2 + 赞 + 评论×2 + 1) / (发布小时数 + 2)^1.2
 * Prisma 不能按表达式排序，所以取近 180 天的候选（≤1500 条）在内存里算。量级上来后改成定时任务写分数列。
 */
export async function listHot(opts: { type: ContentType; facet?: string; tagSlug?: string; selfPromo?: boolean; page: number; pageSize: number }): Promise<ListResult> {
  const where: Prisma.ForumPostWhereInput = {
    ...PUBLIC_WHERE,
    type: opts.type,
    createdAt: { gte: new Date(Date.now() - 180 * 86_400_000) },
    ...(opts.tagSlug ? { postTags: { some: { tag: { slug: opts.tagSlug, status: 1 } } } } : {}),
    ...(opts.facet ? { AND: [{ postTags: { some: { tag: { kind: 'MODEL', facet: opts.facet, status: 1 } } } }] } : {}),
    ...(opts.selfPromo !== undefined ? { app: { selfPromo: opts.selfPromo } } : {}),
  }
  const rows = await prisma.forumPost.findMany({
    where,
    take: 1500,
    select: { id: true, copyCount: true, remixCount: true, favoriteCount: true, likeCount: true, commentCount: true, createdAt: true },
  })
  const now = Date.now()
  const score = (r: (typeof rows)[number]) =>
    (r.copyCount * 3 + r.remixCount * 5 + r.favoriteCount * 2 + r.likeCount + r.commentCount * 2 + 1) /
    Math.pow((now - r.createdAt.getTime()) / 3_600_000 + 2, 1.2)
  const sorted = rows.sort((a, b) => score(b) - score(a))
  const pageIds = sorted.slice((opts.page - 1) * opts.pageSize, opts.page * opts.pageSize).map((r) => r.id)
  return { items: await cardsByIds(pageIds), total: sorted.length, page: opts.page, totalPages: Math.max(Math.ceil(sorted.length / opts.pageSize), 1) }
}
