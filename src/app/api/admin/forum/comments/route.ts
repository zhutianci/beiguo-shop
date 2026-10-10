export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { sourceSiteCodes } from '@/lib/content/source-site'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { REVIEW_STATUSES } from '@/lib/content/policy'

// 后台评论列表（默认只看待审的）。以前评论没有任何后台入口，只能到帖子页逐条删
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '30'), 100)
    const review = searchParams.get('review') || 'PENDING'
    const keyword = searchParams.get('keyword')?.trim()

    const where: any = {}
    if ((REVIEW_STATUSES as readonly string[]).includes(review)) where.reviewStatus = review
    if (keyword) where.OR = [{ content: { contains: keyword } }, { authorName: { contains: keyword } }]

    const [rows, total] = await Promise.all([
      prisma.forumComment.findMany({
        where,
        orderBy: review === 'PENDING' ? [{ createdAt: 'asc' }] : [{ createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { post: { select: { id: true, title: true } } },
      }),
      prisma.forumComment.count({ where }),
    ])

    // 内容模块下放：渠道站上发的评论标出来源站
    const sites = await sourceSiteCodes(rows.map((c) => c.sourceTenantId))
    return success({
      list: rows.map((c) => ({
        sourceSite: sites.get(c.sourceTenantId) ?? null,
        id: c.id,
        postId: c.postId,
        postTitle: c.post.title,
        parentId: c.parentId,
        authorName: c.authorName,
        userId: c.userId,
        content: c.content,
        reviewStatus: c.reviewStatus,
        status: c.status,
        createdAt: c.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    console.error('Admin list comments error:', err)
    return error('获取失败')
  }
}
