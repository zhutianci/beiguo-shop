/**
 * 论坛的审核 / 删除副作用（前台删除接口与后台审核接口共用）。
 *
 * commentCount 的口径是「对外可见的评论数（含楼中楼）」= status=1 且 reviewStatus=APPROVED。
 * 以前是逐次 increment / decrement：删一条顶层评论时按「1 + 子回复数」去减，
 * 而子回复里可能有待审的（本来就没加进去），一减就把计数减成负的或偏小。
 * 现在每次变动后按口径重数一遍：一个帖子的评论量级很小，count 走 post_id 索引，
 * 而且能顺手把历史上漂移的计数纠正回来。
 */
import { prisma } from './db'
import { onCommentPublished } from './content/events'

export async function recountComments(postId: number): Promise<number> {
  const n = await prisma.forumComment.count({ where: { postId, status: 1, reviewStatus: 'APPROVED' } })
  await prisma.forumPost.update({ where: { id: postId }, data: { commentCount: n } })
  return n
}

/** 硬删除一条评论（顶层评论的楼中楼由外键级联删除），然后重数 */
export async function deleteCommentAndRecount(comment: { id: number; postId: number }): Promise<void> {
  await prisma.forumComment.delete({ where: { id: comment.id } })
  await recountComments(comment.postId)
}

/**
 * 评论审核：通过 → 计入评论数并顶帖（lastReplyAt 取评论的发表时间，不是审核时间，免得深夜审一批把老帖全顶上来）；
 * 驳回 → 只改状态（保留记录便于追溯），不对外显示。
 */
export async function setCommentReview(id: number, reviewStatus: 'APPROVED' | 'REJECTED'): Promise<boolean> {
  const c = await prisma.forumComment.findUnique({ where: { id } })
  if (!c) return false
  await prisma.forumComment.update({ where: { id }, data: { reviewStatus } })
  await recountComments(c.postId)
  if (reviewStatus === 'APPROVED' && c.reviewStatus !== 'APPROVED') void onCommentPublished(c.id)
  if (reviewStatus === 'APPROVED') {
    const post = await prisma.forumPost.findUnique({ where: { id: c.postId }, select: { lastReplyAt: true } })
    if (!post?.lastReplyAt || post.lastReplyAt < c.createdAt) {
      await prisma.forumPost.update({ where: { id: c.postId }, data: { lastReplyAt: c.createdAt } })
    }
  }
  return true
}
