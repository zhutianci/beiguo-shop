export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { resolveActor } from '@/lib/forum'
import { forumWriteGate } from '@/lib/forum-throttle'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { flagsOf, forumCrossSite, loadCommentPage, trustLevelOf } from '@/lib/forum-server'
import { FLAG_LABELS, commentReviewOnCreate, isPublic } from '@/lib/content/policy'
import { notify } from '@/lib/notify'
import { onCommentPublished } from '@/lib/content/events'

// 评论列表（楼中楼，两层结构）
// 顶层评论分页，楼中楼回复跟随其父评论一起返回（不单独分页）。取数与拼装在 lib/forum-server（详情页服务端直出共用）
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const actor = await resolveActor(request)

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20') || 20, 1), 50)

    return success(await loadCommentPage(id, page, pageSize, actor))
  } catch (err) {
    console.error('List comments error:', err)
    return error('获取评论失败')
  }
}

const createSchema = z.object({
  content: z.string().trim().min(1, '评论不能为空').max(5000, '评论过长'),
  parentId: z.number().int().positive().optional().nullable(),
})

// 发表评论：必须登录（内容平台 P0 关闭匿名评论）；命中风险检测的进待审，其余即发即显
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  const crossSite = forumCrossSite(request.headers)
  if (crossSite) return crossSite
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const actor = await resolveActor(request)
    if (!actor.userId) return error('请先登录后再评论', 401)

    const post = await prisma.forumPost.findUnique({ where: { id } })
    // 只能评论公开的帖子：待审帖的作者自己也不能先在下面盖楼
    if (!post || !isPublic(post)) return error('帖子不存在', 404)
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

    // 限流放在校验之后、落库之前：校验失败不消耗额度（审计 G44，阈值见 lib/forum-throttle）
    const denied = forumWriteGate(request.headers, actor, 'comment')
    if (denied) return error(denied, 429)

    const authorName = actor.nickname || '用户'
    const level = await trustLevelOf({ id: actor.userId, role: actor.isAdmin ? 'ADMIN' : 'USER' })
    const flags = flagsOf(d.content)
    const reviewStatus = commentReviewOnCreate(level, flags)

    const comment = await prisma.forumComment.create({
      data: {
        postId: id,
        parentId: d.parentId || null,
        userId: actor.userId,
        authorName: authorName.slice(0, 50),
        content: d.content,
        reviewStatus,
      },
    })

    if (reviewStatus === 'PENDING') {
      // 待审评论不计入 commentCount、不顶帖：审核通过时再加（/api/admin/forum/comments/[id]）
      notify(
        'forum.review',
        [
          { label: '标题', value: `评论 · ${post.title}` },
          { label: '作者', value: authorName },
          { label: '内容', value: d.content.slice(0, 120) },
          { label: '原因', value: flags.map((f) => FLAG_LABELS[f]).join('、') },
        ],
        { link: '/admin/forum?tab=comments', linkText: '去审核' },
      )
      return success({ id: comment.id, pending: true }, '评论已提交，审核通过后显示')
    }

    await prisma.forumPost.update({
      where: { id },
      data: { commentCount: { increment: 1 }, lastReplyAt: new Date() },
    })

    void onCommentPublished(comment.id)
    return success({ id: comment.id, pending: false }, '评论成功')
  } catch (err) {
    console.error('Create comment error:', err)
    return error('评论失败')
  }
}
