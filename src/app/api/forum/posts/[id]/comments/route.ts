export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { resolveActor } from '@/lib/forum'

// 评论列表（楼中楼，两层结构）
// 顶层评论分页，楼中楼回复跟随其父评论一起返回（不单独分页）
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const actor = await resolveActor(request)

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20') || 20, 1), 50)

    const include = { user: { select: { nickname: true, avatar: true } } }
    const topWhere = { postId: id, status: 1, parentId: null }

    // 只取本页顶层评论 + 总数
    const [topComments, total] = await Promise.all([
      prisma.forumComment.findMany({
        where: topWhere,
        // id 兜底，保证翻页稳定（不重不漏）
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.forumComment.count({ where: topWhere }),
    ])

    const topIds = topComments.map((c) => c.id)

    // 本页顶层评论下的回复
    const replies = topIds.length
      ? await prisma.forumComment.findMany({
          where: { postId: id, status: 1, parentId: { in: topIds } },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          include,
        })
      : []

    // 当前用户点赞过的评论（只查本页涉及的评论 id）
    const allIds = [...topIds, ...replies.map((r) => r.id)]
    let likedSet = new Set<number>()
    if ((actor.userId || actor.anonId) && allIds.length) {
      const likes = await prisma.forumLike.findMany({
        where: {
          commentId: { in: allIds },
          ...(actor.userId ? { userId: actor.userId } : { anonId: actor.anonId }),
        },
        select: { commentId: true },
      })
      likedSet = new Set(likes.map((l) => l.commentId!).filter(Boolean))
    }

    const shape = (c: (typeof topComments)[number]) => ({
      id: c.id,
      parentId: c.parentId,
      content: c.content,
      authorName: c.authorName,
      avatar: c.user?.avatar || null,
      isMember: !!c.userId,
      likeCount: c.likeCount,
      likedByMe: likedSet.has(c.id),
      canDelete: actor.isAdmin || (!!c.userId && c.userId === actor.userId),
      createdAt: c.createdAt,
    })

    // 按父评论分组，避免 O(n²) 过滤
    const repliesByParent = new Map<number, ReturnType<typeof shape>[]>()
    for (const r of replies) {
      const pid = r.parentId!
      const arr = repliesByParent.get(pid)
      if (arr) arr.push(shape(r))
      else repliesByParent.set(pid, [shape(r)])
    }

    const list = topComments.map((c) => ({
      ...shape(c),
      replies: repliesByParent.get(c.id) || [],
    }))

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    })
  } catch (err) {
    console.error('List comments error:', err)
    return error('获取评论失败')
  }
}

const createSchema = z.object({
  content: z.string().trim().min(1, '评论不能为空').max(5000, '评论过长'),
  parentId: z.number().int().positive().optional().nullable(),
  anonName: z.string().trim().max(30).optional().nullable(),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const actor = await resolveActor(request)

    const post = await prisma.forumPost.findUnique({ where: { id } })
    if (!post || post.status !== 1) return error('帖子不存在', 404)
    if (post.locked && !actor.isAdmin) return error('该帖已锁定，暂不可回复')

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    // 校验 parent 属于本帖
    if (d.parentId) {
      const parent = await prisma.forumComment.findUnique({ where: { id: d.parentId } })
      if (!parent || parent.postId !== id) return error('回复的评论不存在')
      // 楼中楼只保留两层：回复某条回复时归到其顶层父级
      if (parent.parentId) d.parentId = parent.parentId
    }

    let authorName = actor.nickname
    if (!actor.userId) authorName = (d.anonName || '').trim() || '匿名用户'
    if (!authorName) authorName = '用户'

    const comment = await prisma.forumComment.create({
      data: {
        postId: id,
        parentId: d.parentId || null,
        userId: actor.userId,
        authorName: authorName.slice(0, 50),
        content: d.content,
      },
    })

    await prisma.forumPost.update({
      where: { id },
      data: { commentCount: { increment: 1 }, lastReplyAt: new Date() },
    })

    return success({ id: comment.id }, '评论成功')
  } catch (err) {
    console.error('Create comment error:', err)
    return error('评论失败')
  }
}
