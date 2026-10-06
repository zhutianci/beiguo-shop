export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { resolveActor } from '@/lib/forum'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { forumCrossSite } from '@/lib/forum-server'
import { deleteCommentAndRecount } from '@/lib/forum-moderation'

// 删除评论（作者或管理员）；删除顶层评论会级联删除其楼中楼
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  const crossSite = forumCrossSite(request.headers)
  if (crossSite) return crossSite
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const actor = await resolveActor(request)

    const comment = await prisma.forumComment.findUnique({ where: { id } })
    if (!comment) return error('评论不存在', 404)

    const isAuthor = !!comment.userId && comment.userId === actor.userId
    if (!actor.isAdmin && !isAuthor) return error('无权删除', 403)

    await deleteCommentAndRecount(comment)
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Delete comment error:', err)
    return error('删除失败')
  }
}
