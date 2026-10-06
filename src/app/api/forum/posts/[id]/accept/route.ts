export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { meOrDeny } from '@/lib/content/session'
import { award } from '@/lib/content/points'
import { notifyUser } from '@/lib/content/inbox'
import { contentPath } from '@/lib/content/policy'

/**
 * 问答采纳（P2）：帖子作者把某条顶层评论设为「最佳回答」，或传 null 取消。
 * 被采纳者 +20 积分并收到通知（同一条只记一次）。采纳后详情页的结构化数据从 DiscussionForumPosting 换成 QAPage。
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  const { user, denied } = await meOrDeny(request, true)
  if (denied) return denied
  try {
    const id = parseInt(params.id)
    const parsed = z.object({ commentId: z.number().int().positive().nullable() }).safeParse(await request.json())
    if (!parsed.success) return error('参数无效')
    const post = await prisma.forumPost.findUnique({ where: { id }, select: { id: true, userId: true, title: true, type: true, slug: true, deletedAt: true } })
    if (!post || post.deletedAt) return error('帖子不存在', 404)
    if (post.userId !== user!.id && user!.role !== 'ADMIN') return error('只有提问者可以采纳', 403)
    const commentId = parsed.data.commentId
    if (commentId) {
      const c = await prisma.forumComment.findUnique({
        where: { id: commentId },
        select: { postId: true, parentId: true, userId: true, status: true, reviewStatus: true },
      })
      if (!c || c.postId !== id || c.parentId || c.status !== 1 || c.reviewStatus !== 'APPROVED') return error('只能采纳本帖的公开顶层回答')
      if (c.userId === post.userId) return error('不能采纳自己的回答')
      await prisma.forumPost.update({ where: { id }, data: { acceptedCommentId: commentId } })
      if (await award(c.userId, 'ACCEPTED', commentId, user!.id)) {
        notifyUser(c.userId, 'ACCEPTED', `你在「${post.title}」的回答被采纳为最佳回答`, {
          link: `${contentPath(post.type, post.id, post.slug)}#comments`,
        })
      }
    } else {
      await prisma.forumPost.update({ where: { id }, data: { acceptedCommentId: null } })
    }
    return success({ acceptedCommentId: commentId })
  } catch (err) {
    console.error('Accept error:', err)
    return error('操作失败')
  }
}
