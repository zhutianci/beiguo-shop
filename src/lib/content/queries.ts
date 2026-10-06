/**
 * 内容平台的服务端取数（内容平台 P1）。页面、sitemap、作者页、商品页的「相关内容」共用。
 *
 * 「对外公开」的口径只有一个：policy.isPublic（status=1 且已过审且未删除），这里的 where 条件 PUBLIC_WHERE 与它逐字对应。
 * 「能不能收录」只看 policy.isIndexable，入参由 toIndexableInput 统一拼——页面的 robots、sitemap、IndexNow 都走这一个函数。
 */
import { cache } from 'react'
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
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
  postTags: { include: { tag: { select: { id: true, slug: true, name: true, kind: true, landingPath: true, status: true } } } },
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
  prompt?: { prompt: string } | null
  postTags?: { tag: { kind: string; status: number } }[]
}): IndexableInput {
  return {
    ...p,
    promptText: p.prompt?.prompt ?? null,
    imageCount: imagesOf(p).length,
    hasModel: !!p.postTags?.some((pt) => pt.tag.kind === 'MODEL' && pt.tag.status === 1),
  }
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
  postTags: { include: { tag: { select: { slug: true, name: true, kind: true, status: true } } } },
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

export interface ListResult {
  items: ContentCard[]
  total: number
  page: number
  totalPages: number
}

export async function listContent(opts: {
  type: ContentType
  tagSlug?: string
  userId?: number
  page: number
  pageSize: number
}): Promise<ListResult> {
  const where: Prisma.ForumPostWhereInput = {
    ...PUBLIC_WHERE,
    type: opts.type,
    ...(opts.tagSlug ? { postTags: { some: { tag: { slug: opts.tagSlug, status: 1 } } } } : {}),
    ...(opts.userId ? { userId: opts.userId } : {}),
  }
  const [rows, total] = await Promise.all([
    prisma.forumPost.findMany({
      where,
      orderBy: LIST_ORDER,
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      include: CARD_INCLUDE,
    }),
    prisma.forumPost.count({ where }),
  ])
  return { items: rows.map(toCard), total, page: opts.page, totalPages: Math.max(Math.ceil(total / opts.pageSize), 1) }
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
      commentCount: true, type: true, images: true, testedOn: true,
      prompt: { select: { prompt: true } },
      postTags: { select: { tag: { select: { kind: true, status: true } } } },
    },
  })
  return rows.filter((r) => contentIndexable(r)).length
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
    const items = rows.map(toCard)
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
