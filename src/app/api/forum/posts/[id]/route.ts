export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { renderMarkdown } from '@/lib/markdown'
import { resolveActor, normalizeTags, memberDisplayName } from '@/lib/forum'
import { forumViewCounted } from '@/lib/forum-throttle'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { flagsOf, forumCrossSite, trustLevelOf } from '@/lib/forum-server'
import { FLAG_LABELS, canView, isForumImageUrl, isPublic, postReviewOnEdit } from '@/lib/content/policy'
import { declarationShape } from '@/lib/content/schema'
import { notify } from '@/lib/notify'

// 帖子详情（浏览量去重 +1，返回渲染后的 HTML 与点赞状态）
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    const actor = await resolveActor(request)

    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        category: { select: { name: true, slug: true, icon: true, color: true } },
        user: { select: { nickname: true, avatar: true } },
      },
    })
    // 待审 / 驳回 / 隐藏的帖子只有作者本人和管理员能打开（作者要看到审核状态与驳回原因）；已删除的谁都打不开
    if (!post || !canView(post, actor)) return error('帖子不存在或已被隐藏', 404)
    const publicPost = isPublic(post)

    // 浏览量 +1（不阻塞）。同一读者同一帖 1 小时只计 1 次：以前每次 GET 都 +1，
    // 一个刷新循环就能刷穿 sort=hot（审计 G44）；前端每次点赞/评论后 loadPost 也会重复计数。
    // 非公开的帖子只有作者和管理员看得到，不计数
    const counted = publicPost && forumViewCounted(request.headers, actor, id)
    if (counted) prisma.forumPost.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {})

    let likedByMe = false
    if (actor.userId || actor.anonId) {
      const like = await prisma.forumLike.findFirst({
        where: {
          postId: id,
          ...(actor.userId ? { userId: actor.userId } : { anonId: actor.anonId }),
        },
      })
      likedByMe = !!like
    }

    const canEdit = actor.isAdmin || (!!post.userId && post.userId === actor.userId)

    return success({
      id: post.id,
      title: post.title,
      content: post.content, // 原始 markdown（编辑用）
      html: renderMarkdown(post.content),
      images: post.images ? (JSON.parse(post.images) as string[]) : [],
      // 会员按当前昵称现算：库里旧快照可能是邮箱前缀（审计 G48）
      authorName: post.userId ? memberDisplayName(post.user?.nickname, post.userId) : post.authorName,
      avatar: post.user?.avatar || null,
      isMember: !!post.userId,
      category: post.category,
      categoryId: post.categoryId,
      tags: post.tags ? post.tags.split(',').filter(Boolean) : [],
      pinned: post.pinned,
      featured: post.featured,
      locked: post.locked,
      status: post.status,
      reviewStatus: post.reviewStatus,
      // 驳回原因只给作者和管理员看（能走到这里的非公开帖，访客本来就只能是这两种人）
      reviewNote: publicPost ? null : post.reviewNote,
      originality: post.originality,
      sourceUrl: post.sourceUrl,
      aiAssist: post.aiAssist,
      views: post.views + (counted ? 1 : 0),
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      likedByMe,
      canEdit,
      isAdmin: actor.isAdmin,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    })
  } catch (err) {
    console.error('Get forum post error:', err)
    return error('获取失败')
  }
}

// 作者（或管理员）编辑内容。置顶 / 精华 / 锁帖 / 隐藏 / 审核这些运营操作已移到
// /api/admin/forum/posts/[id]（经 adminGuard），这里不再接收——公开接口不该承载后台权限
const patchSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  content: z.string().trim().min(1).max(20000).optional(),
  tags: z.string().optional().nullable(),
  categoryId: z.number().int().positive().optional(),
  images: z.array(z.string().refine(isForumImageUrl, '图片地址无效，请重新上传')).optional(),
  ...declarationShape,
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  const crossSite = forumCrossSite(request.headers)
  if (crossSite) return crossSite
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const actor = await resolveActor(request)

    const post = await prisma.forumPost.findUnique({ where: { id } })
    if (!post || post.deletedAt) return error('帖子不存在', 404)

    const isAuthor = !!post.userId && post.userId === actor.userId
    if (!actor.isAdmin && !isAuthor) return error('无权操作', 403)

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const data: any = {}
    if (d.title !== undefined) data.title = d.title
    if (d.content !== undefined) data.content = d.content
    if (d.tags !== undefined) data.tags = normalizeTags(d.tags)
    if (d.images !== undefined) data.images = d.images.length ? JSON.stringify(d.images.slice(0, 9)) : null
    if (d.categoryId !== undefined && d.categoryId !== post.categoryId) {
      // 换板块与发帖同一套规矩：板块必须存在且启用、公告板块只许管理员。
      // 以前这里直接写入，作者能把自己的帖子挪进「官方公告」或已停用的板块
      const category = await prisma.forumCategory.findUnique({ where: { id: d.categoryId } })
      if (!category || category.status !== 1) return error('板块不存在')
      if (category.slug === 'announce' && !actor.isAdmin) return error('公告板块仅管理员可发布')
      data.categoryId = d.categoryId
    }
    const originality = d.originality ?? post.originality
    const sourceUrl = d.sourceUrl !== undefined ? d.sourceUrl || null : post.sourceUrl
    if (d.originality !== undefined) data.originality = d.originality
    if (d.sourceUrl !== undefined) data.sourceUrl = sourceUrl
    if (d.aiAssist !== undefined) data.aiAssist = d.aiAssist
    if (originality !== 'ORIGINAL_FIRST' && !sourceUrl) return error('非首发或转载的内容，请填写原文地址')

    if (Object.keys(data).length === 0) return error('没有可更新的内容')

    // 标题 / 正文 / 原文地址是「实质修改」：更新 dateModified，并按信任等级决定是否重审
    // （防「先发干净内容过审、再改成广告」，规则见 lib/content/policy 的 postReviewOnEdit）
    const substantive =
      (d.title !== undefined && d.title !== post.title) ||
      (d.content !== undefined && d.content !== post.content) ||
      (d.sourceUrl !== undefined && sourceUrl !== post.sourceUrl)
    let pending = post.reviewStatus === 'PENDING'
    if (substantive) {
      data.contentUpdatedAt = new Date()
      const level = actor.isAdmin ? 9 : await trustLevelOf({ id: actor.userId!, role: 'USER' })
      const flags = flagsOf(data.title ?? post.title, data.content ?? post.content, data.tags ?? post.tags, sourceUrl)
      const next = postReviewOnEdit(level, flags, post.reviewStatus)
      if (next !== post.reviewStatus) {
        data.reviewStatus = next
        if (next === 'PENDING') data.reviewNote = null
      }
      pending = next === 'PENDING'
      if (pending && post.reviewStatus !== 'PENDING') {
        notify(
          'forum.review',
          [
            { label: '标题', value: data.title ?? post.title },
            { label: '作者', value: post.authorName },
            { label: '原因', value: flags.length ? `修改后重审：${flags.map((f) => FLAG_LABELS[f]).join('、')}` : '修改后重审' },
          ],
          { link: '/admin/forum?review=PENDING', linkText: '去审核' },
        )
      }
    }

    await prisma.forumPost.update({ where: { id }, data })
    return success({ id, pending }, pending ? '已保存，审核通过后公开显示' : '已更新')
  } catch (err) {
    console.error('Update forum post error:', err)
    return error('更新失败')
  }
}

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

    const post = await prisma.forumPost.findUnique({ where: { id } })
    if (!post || post.deletedAt) return error('帖子不存在', 404)

    const isAuthor = !!post.userId && post.userId === actor.userId
    if (!actor.isAdmin && !isAuthor) return error('无权删除', 403)

    // 软删除（设计 §10.3）：违规内容要能追溯，误删能恢复；前台按「不存在」处理
    await prisma.forumPost.update({ where: { id }, data: { deletedAt: new Date(), status: 0 } })
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Delete forum post error:', err)
    return error('删除失败')
  }
}
