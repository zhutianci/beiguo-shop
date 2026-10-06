export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { CONTENT_TYPES, REVIEW_STATUSES, contentPath, qualityGateReason } from '@/lib/content/policy'
import { toIndexableInput } from '@/lib/content/queries'

// 后台帖子列表（含隐藏帖、待审帖，用于审核管理）
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '30'), 100)
    const keyword = searchParams.get('keyword')?.trim()
    const status = searchParams.get('status') // '0' | '1' | 'deleted' | null(全部未删除)
    const review = searchParams.get('review') // PENDING | APPROVED | REJECTED | null(全部)
    const type = searchParams.get('type') // DISCUSSION | PROMPT | GUIDE | null(全部)

    const where: any = { deletedAt: null }
    if (status === '0' || status === '1') where.status = parseInt(status)
    if (status === 'deleted') where.deletedAt = { not: null }
    if (review && (REVIEW_STATUSES as readonly string[]).includes(review)) where.reviewStatus = review
    if (type && (CONTENT_TYPES as readonly string[]).includes(type)) where.type = type
    if (keyword) where.OR = [{ title: { contains: keyword } }, { authorName: { contains: keyword } }]

    const [rows, total, pendingPosts, pendingComments] = await Promise.all([
      prisma.forumPost.findMany({
        where,
        // 待审队列按提交先后处理（先来先审）；其余按置顶 + 新到旧
        orderBy: review === 'PENDING' ? [{ createdAt: 'asc' }] : [{ pinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { name: true, icon: true } },
          prompt: { select: { prompt: true } },
          app: { select: { selfPromo: true } },
          postTags: { select: { tag: { select: { name: true, kind: true, status: true, facet: true } } } },
        },
      }),
      prisma.forumPost.count({ where }),
      prisma.forumPost.count({ where: { reviewStatus: 'PENDING', deletedAt: null } }),
      prisma.forumComment.count({ where: { reviewStatus: 'PENDING' } }),
    ])

    const list = rows.map((p) => ({
      id: p.id,
      title: p.title,
      authorName: p.authorName,
      isMember: !!p.userId,
      category: p.category,
      pinned: p.pinned,
      featured: p.featured,
      locked: p.locked,
      status: p.status,
      reviewStatus: p.reviewStatus,
      reviewNote: p.reviewNote,
      originality: p.originality,
      sourceUrl: p.sourceUrl,
      aiAssist: p.aiAssist,
      deletedAt: p.deletedAt,
      type: p.type,
      slug: p.slug,
      excerpt: p.excerpt,
      path: contentPath(p.type, p.id, p.slug),
      verified: !!p.verifiedAt,
      tagNames: p.postTags.map((pt) => pt.tag.name),
      // 为什么（总开关打开后）也不会被收录：给编辑判断「要不要补内容再精选」
      qualityReason: qualityGateReason(toIndexableInput(p)),
      views: p.views,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      createdAt: p.createdAt,
    }))

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      pending: { posts: pendingPosts, comments: pendingComments },
    })
  } catch (err) {
    console.error('Admin list posts error:', err)
    return error('获取失败')
  }
}
