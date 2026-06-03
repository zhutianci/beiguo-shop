export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { resolveActor } from '@/lib/forum'

// 删除评论（作者或管理员）；删除顶层评论会级联删除其楼中楼
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const actor = await resolveActor(request)

    const comment = await prisma.forumComment.findUnique({ where: { id } })
    if (!comment) return error('评论不存在', 404)

    const isAuthor = !!comment.userId && comment.userId === actor.userId
    if (!actor.isAdmin && !isAuthor) return error('无权删除', 403)

    // 计算需要从帖子计数中扣除的数量（自身 + 子回复）
    const replyCount = comment.parentId
      ? 0
      : await prisma.forumComment.count({ where: { parentId: id } })

    await prisma.forumComment.delete({ where: { id } })
    await prisma.forumPost.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 + replyCount } },
    })

    return success({ id }, '已删除')
  } catch (err) {
    console.error('Delete comment error:', err)
    return error('删除失败')
  }
}
