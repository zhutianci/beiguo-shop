export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { award } from '@/lib/content/points'
import { recountComments } from '@/lib/forum-moderation'

/**
 * 后台举报队列（设计 §10.1）。GET：按目标聚合的未处理举报；POST：处理一个目标。
 *   action=uphold   举报成立：帖子软删除 / 评论驳回，作者 -50 积分（违规），该目标的举报全部记为已处理
 *   action=dismiss  举报不成立：恢复被自动隐藏的内容，举报记为已驳回
 */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const rows = await prisma.contentReport.findMany({ where: { status: 'OPEN' }, orderBy: { createdAt: 'asc' }, take: 500 })
    const groups = new Map<string, { targetKey: string; postId: number | null; commentId: number | null; count: number; reasons: string[]; details: string[]; first: Date }>()
    for (const r of rows) {
      const g = groups.get(r.targetKey) ?? { targetKey: r.targetKey, postId: r.postId, commentId: r.commentId, count: 0, reasons: [], details: [], first: r.createdAt }
      g.count++
      g.reasons.push(r.reason)
      if (r.detail) g.details.push(r.detail)
      groups.set(r.targetKey, g)
    }
    const list = Array.from(groups.values())
    const postIds = list.map((g) => g.postId).filter((x): x is number => !!x)
    const commentIds = list.map((g) => g.commentId).filter((x): x is number => !!x)
    const [posts, comments] = await Promise.all([
      prisma.forumPost.findMany({ where: { id: { in: postIds } }, select: { id: true, title: true, status: true } }),
      prisma.forumComment.findMany({ where: { id: { in: commentIds } }, select: { id: true, content: true, postId: true, reviewStatus: true } }),
    ])
    return success({
      list: list.map((g) => ({
        ...g,
        post: g.postId ? posts.find((p) => p.id === g.postId) ?? null : null,
        comment: g.commentId ? comments.find((c) => c.id === g.commentId) ?? null : null,
      })),
    })
  } catch (err) {
    console.error('Admin reports error:', err)
    return error('获取失败')
  }
}

const schema = z.object({ targetKey: z.string().regex(/^[pc]:\d+$/), action: z.enum(['uphold', 'dismiss']) })

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return error('参数无效')
    const { targetKey, action } = parsed.data
    const id = Number(targetKey.slice(2))
    const isPost = targetKey.startsWith('p:')
    if (action === 'uphold') {
      if (isPost) {
        const p = await prisma.forumPost.update({ where: { id }, data: { deletedAt: new Date(), status: 0 }, select: { userId: true } })
        await award(p.userId, 'VIOLATION', id)
      } else {
        const c = await prisma.forumComment.update({ where: { id }, data: { reviewStatus: 'REJECTED' }, select: { userId: true, postId: true } })
        await recountComments(c.postId)
        await award(c.userId, 'VIOLATION', -id)
      }
    } else if (isPost) {
      await prisma.forumPost.update({ where: { id }, data: { status: 1 } })
    } else {
      const c = await prisma.forumComment.update({ where: { id }, data: { reviewStatus: 'APPROVED' }, select: { postId: true } })
      await recountComments(c.postId)
    }
    await prisma.contentReport.updateMany({ where: { targetKey, status: 'OPEN' }, data: { status: action === 'uphold' ? 'HANDLED' : 'DISMISSED' } })
    return success({ ok: true }, action === 'uphold' ? '已处理（内容已下线）' : '已驳回举报（内容已恢复）')
  } catch (err) {
    console.error('Admin report action error:', err)
    return error('操作失败')
  }
}
