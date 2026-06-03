export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { resolveActor } from '@/lib/forum'

// 评论点赞 / 取消（切换）
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const actor = await resolveActor(request)
    if (!actor.userId && !actor.anonId) return error('无法识别身份，请刷新后重试')

    const comment = await prisma.forumComment.findUnique({ where: { id }, select: { id: true } })
    if (!comment) return error('评论不存在', 404)

    const existing = await prisma.forumLike.findFirst({
      where: { commentId: id, ...(actor.userId ? { userId: actor.userId } : { anonId: actor.anonId }) },
    })

    let liked: boolean
    if (existing) {
      await prisma.forumLike.delete({ where: { id: existing.id } })
      await prisma.forumComment.update({ where: { id }, data: { likeCount: { decrement: 1 } } })
      liked = false
    } else {
      await prisma.forumLike.create({
        data: { commentId: id, userId: actor.userId, anonId: actor.userId ? null : actor.anonId },
      })
      await prisma.forumComment.update({ where: { id }, data: { likeCount: { increment: 1 } } })
      liked = true
    }

    const fresh = await prisma.forumComment.findUnique({ where: { id }, select: { likeCount: true } })
    return success({ liked, likeCount: Math.max(fresh?.likeCount ?? 0, 0) })
  } catch (err) {
    console.error('Toggle comment like error:', err)
    return error('操作失败')
  }
}
