export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { resolveActor } from '@/lib/forum'

// 点赞 / 取消点赞（切换）
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const actor = await resolveActor(request)
    if (!actor.userId && !actor.anonId) return error('无法识别身份，请刷新后重试')

    const post = await prisma.forumPost.findUnique({ where: { id }, select: { id: true } })
    if (!post) return error('帖子不存在', 404)

    const existing = await prisma.forumLike.findFirst({
      where: { postId: id, ...(actor.userId ? { userId: actor.userId } : { anonId: actor.anonId }) },
    })

    let liked: boolean
    if (existing) {
      await prisma.forumLike.delete({ where: { id: existing.id } })
      await prisma.forumPost.update({ where: { id }, data: { likeCount: { decrement: 1 } } })
      liked = false
    } else {
      await prisma.forumLike.create({
        data: { postId: id, userId: actor.userId, anonId: actor.userId ? null : actor.anonId },
      })
      await prisma.forumPost.update({ where: { id }, data: { likeCount: { increment: 1 } } })
      liked = true
    }

    const fresh = await prisma.forumPost.findUnique({ where: { id }, select: { likeCount: true } })
    return success({ liked, likeCount: Math.max(fresh?.likeCount ?? 0, 0) })
  } catch (err) {
    console.error('Toggle post like error:', err)
    return error('操作失败')
  }
}
