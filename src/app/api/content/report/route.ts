export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { meOrDeny } from '@/lib/content/session'
import { notify } from '@/lib/notify'
import { notifyUser } from '@/lib/content/inbox'
import { contentPath } from '@/lib/content/policy'
import { recountComments } from '@/lib/forum-moderation'

/**
 * 举报（设计 §10.1）。须登录；同一人对同一目标只能举报一次（唯一约束）。
 * 同一目标收到 3 个不同用户的未处理举报 → 自动暂时隐藏（帖子 status=0；评论转待审），等管理员处理。
 * 「暂时隐藏」可以在后台举报队列里一键恢复（驳回举报）。
 */
const AUTO_HIDE_REPORTS = 3
const schema = z
  .object({
    postId: z.number().int().positive().optional(),
    commentId: z.number().int().positive().optional(),
    reason: z.enum(['SPAM', 'AD', 'PLAGIARISM', 'ILLEGAL', 'WRONG', 'OTHER']),
    detail: z.string().trim().max(300).optional(),
  })
  .refine((d) => !!d.postId !== !!d.commentId, '请指定举报对象')

export async function POST(request: NextRequest) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  const { user, denied } = await meOrDeny(request, true)
  if (denied) return denied
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data
    const targetKey = d.postId ? `p:${d.postId}` : `c:${d.commentId}`
    const post = d.postId
      ? await prisma.forumPost.findUnique({ where: { id: d.postId }, select: { id: true, userId: true, title: true, type: true, slug: true } })
      : null
    const comment = d.commentId
      ? await prisma.forumComment.findUnique({ where: { id: d.commentId }, select: { id: true, userId: true, postId: true, content: true } })
      : null
    if (!post && !comment) return error('举报对象不存在', 404)
    if ((post?.userId ?? comment?.userId) === user!.id) return error('不能举报自己的内容')
    try {
      await prisma.contentReport.create({
        data: { targetKey, postId: d.postId ?? null, commentId: d.commentId ?? null, reporterId: user!.id, reason: d.reason, detail: d.detail || null },
      })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return success({ ok: true }, '你已经举报过了，我们会尽快处理')
      throw e
    }
    const open = await prisma.contentReport.count({ where: { targetKey, status: 'OPEN' } })
    if (open >= AUTO_HIDE_REPORTS) {
      if (post) {
        await prisma.forumPost.update({ where: { id: post.id }, data: { status: 0 } })
        notifyUser(post.userId, 'REPORT_HIDDEN', `「${post.title}」因多人举报被暂时隐藏，等待人工复核`, { link: contentPath(post.type, post.id, post.slug) })
      } else if (comment) {
        await prisma.forumComment.update({ where: { id: comment.id }, data: { reviewStatus: 'PENDING' } })
        await recountComments(comment.postId)
      }
    }
    notify(
      'forum.review',
      [
        { label: '标题', value: post ? `举报 · ${post.title}` : `举报评论 · ${comment!.content.slice(0, 40)}` },
        { label: '原因', value: `${d.reason}${d.detail ? `：${d.detail}` : ''}（累计 ${open} 条${open >= AUTO_HIDE_REPORTS ? '，已自动隐藏' : ''}）` },
      ],
      { link: '/admin/forum?tab=reports', linkText: '去处理' },
    )
    return success({ ok: true }, '已收到举报，我们会尽快处理')
  } catch (err) {
    console.error('Report error:', err)
    return error('举报失败')
  }
}
