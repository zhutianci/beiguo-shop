export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { renderMarkdown } from '@/lib/markdown'
import { resolveActor, normalizeTags, memberDisplayName } from '@/lib/forum'
import { forumViewCounted } from '@/lib/forum-throttle'
import { denyUnlessModule } from '@/lib/storefront/resolve'
import { flagsOf, forumCrossSite, trustLevelOf } from '@/lib/forum-server'
import { FLAG_LABELS, asContentType, canView, contentPath, isForumImageUrl, isPublic, postReviewOnEdit } from '@/lib/content/policy'
import { declarationShape } from '@/lib/content/schema'
import { checkTyped, typedShape } from '@/lib/content/write'
import { notifyContentChanged } from '@/lib/content/indexnow'
import { IMAGE_REUSE_NOTE, dedupText, findImageReuse, findNearDuplicate } from '@/lib/content/events'
import { simhash } from '@/lib/content/simhash'
import { notify } from '@/lib/notify'

// 帖子详情（浏览量去重 +1，返回渲染后的 HTML 与点赞状态）
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // 渠道分站：本模块渠道站默认关闭，超管授权且渠道上架才开（docs/多渠道分销-内容模块下放.md）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyUnlessModule('learn')
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
        prompt: true,
        app: true,
        postTags: { select: { tagId: true } },
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
    // P2：我收藏了没有（收藏须登录，匿名访客恒为 false）
    const favoritedByMe = actor.userId
      ? !!(await prisma.favorite.findUnique({ where: { userId_postId: { userId: actor.userId, postId: id } } }))
      : false

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
      // 内容平台 P1：类型与附表（编辑页回填用）
      type: post.type,
      path: contentPath(post.type, post.id, post.slug),
      prompt: post.prompt
        ? {
            prompt: post.prompt.prompt,
            negativePrompt: post.prompt.negativePrompt,
            modelLabel: post.prompt.modelLabel,
            aspectRatio: post.prompt.aspectRatio,
            needsRefImage: post.prompt.needsRefImage,
            useCase: post.prompt.useCase,
          }
        : null,
      app: post.app
        ? {
            name: post.app.name,
            url: post.app.url,
            pricing: post.app.pricing,
            platforms: post.app.platforms,
            trialNote: post.app.trialNote,
            selfPromo: post.app.selfPromo,
            relation: post.app.relation,
          }
        : null,
      tagIds: post.postTags.map((pt) => pt.tagId),
      testedOn: post.testedOn ? post.testedOn.toISOString().slice(0, 10) : null,
      checkedOn: post.checkedOn ? post.checkedOn.toISOString().slice(0, 10) : null,
      accountTier: post.accountTier,
      excerpt: post.excerpt,
      favoriteCount: post.favoriteCount,
      favoritedByMe,
      acceptedCommentId: post.acceptedCommentId,
      remixOfId: post.remixOfId,
      // 提问者（或管理员）可以采纳回答
      canAccept: actor.isAdmin || (!!post.userId && post.userId === actor.userId),
      loggedIn: !!actor.userId,
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
  content: z.string().trim().max(20000).optional(),
  tags: z.string().optional().nullable(),
  categoryId: z.number().int().positive().optional(),
  images: z.array(z.string().refine(isForumImageUrl, '图片地址无效，请重新上传')).optional(),
  ...declarationShape,
  // 类型发出后不能改（URL 跟着类型走）；传了也只用来核对
  ...typedShape,
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // 渠道分站：本模块渠道站默认关闭，超管授权且渠道上架才开（docs/多渠道分销-内容模块下放.md）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyUnlessModule('learn')
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
    const type = asContentType(post.type)
    if (d.type !== undefined && d.type !== type) return error('发布后不能更改内容类型')
    if (d.content !== undefined && !d.content && type !== 'PROMPT') return error('内容不能为空')

    const images = d.images ?? (post.images ? (JSON.parse(post.images) as string[]) : [])
    const typed = await checkTyped(type, d, { full: false, imageCount: images.length, content: d.content ?? post.content })
    if ('error' in typed) return error(typed.error)
    if (type === 'PROMPT' && d.images !== undefined && d.images.length < 1) {
      // 只有图像类必须有图：facet 取本次提交的模型标签，没改标签就取库里的
      const facet =
        typed.facet !== undefined
          ? typed.facet
          : (await prisma.postTag.findFirst({ where: { postId: id, tag: { kind: 'MODEL' } }, select: { tag: { select: { facet: true } } } }))?.tag.facet
      if (facet === 'IMAGE') return error('图像类提示词至少保留 1 张效果图')
    }

    const data: any = {}
    if (d.title !== undefined) data.title = d.title
    if (d.content !== undefined) data.content = d.content
    if (d.tags !== undefined && type === 'DISCUSSION') data.tags = normalizeTags(d.tags)
    if (d.images !== undefined) data.images = d.images.length ? JSON.stringify(d.images.slice(0, 9)) : null
    if (type !== 'DISCUSSION') {
      if (d.excerpt !== undefined) data.excerpt = d.excerpt || null
      if (d.accountTier !== undefined) data.accountTier = d.accountTier
      if (typed.testedOn !== undefined) data.testedOn = typed.testedOn
      if (type === 'PROMPT' && d.prompt) {
        const pr = {
          prompt: d.prompt.prompt,
          negativePrompt: d.prompt.negativePrompt || null,
          modelLabel: d.prompt.modelLabel || null,
          aspectRatio: d.prompt.aspectRatio || null,
          needsRefImage: d.prompt.needsRefImage,
          useCase: d.prompt.useCase,
        }
        data.prompt = { upsert: { create: pr, update: pr } }
      }
      if (typed.tagIds) data.postTags = { deleteMany: {}, create: typed.tagIds.map((tagId) => ({ tagId })) }
      if (type === 'APP' && d.app) {
        // 自荐这个开关发出后不能改（改成「不是自荐」就绕过了自荐的门槛与 sponsored 标注）
        const was = await prisma.appSpec.findUnique({ where: { postId: id }, select: { selfPromo: true } })
        if (was && was.selfPromo !== !!d.app.selfPromo && !actor.isAdmin) return error('「作者自荐」发布后不能更改')
        const ap = {
          name: d.app.name,
          url: d.app.url,
          pricing: d.app.pricing || null,
          platforms: d.app.platforms || null,
          trialNote: d.app.trialNote || null,
          selfPromo: !!d.app.selfPromo,
          relation: d.app.selfPromo ? d.app.relation ?? 'OTHER' : null,
        }
        data.app = { upsert: { create: ap, update: ap } }
      }
    }
    if (d.categoryId !== undefined && d.categoryId !== post.categoryId && type === 'DISCUSSION') {
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
    const before = await prisma.promptSpec.findUnique({ where: { postId: id }, select: { prompt: true, useCase: true, negativePrompt: true, modelLabel: true } })
    // 应用卡片的字段（地址、名称、价格、平台、试用说明）同样算实质修改（2026-10-07：以前改 app.url 成钓鱼 / 返利链接、
    // 在试用说明里塞微信号不触发重审，也不进风险检测）
    const beforeApp = type === 'APP' && d.app
      ? await prisma.appSpec.findUnique({ where: { postId: id }, select: { name: true, url: true, pricing: true, platforms: true, trialNote: true } })
      : null
    const appChanged =
      type === 'APP' && !!d.app &&
      (!beforeApp ||
        d.app.name !== beforeApp.name ||
        d.app.url !== beforeApp.url ||
        (d.app.pricing || null) !== beforeApp.pricing ||
        (d.app.platforms || null) !== beforeApp.platforms ||
        (d.app.trialNote || null) !== beforeApp.trialNote)
    const substantive =
      (d.title !== undefined && d.title !== post.title) ||
      (d.content !== undefined && d.content !== post.content) ||
      (d.sourceUrl !== undefined && sourceUrl !== post.sourceUrl) ||
      (!!d.prompt &&
        (d.prompt.prompt !== before?.prompt ||
          d.prompt.useCase !== before?.useCase ||
          (d.prompt.negativePrompt || null) !== (before?.negativePrompt ?? null) ||
          (d.prompt.modelLabel || null) !== (before?.modelLabel ?? null))) ||
      (type !== 'DISCUSSION' && d.excerpt !== undefined && (d.excerpt || null) !== post.excerpt) ||
      appChanged ||
      (d.images !== undefined && JSON.stringify(d.images.slice(0, 9)) !== (post.images ?? 'null'))
    let pending = post.reviewStatus === 'PENDING'
    if (substantive) {
      data.contentUpdatedAt = new Date()
      const level = actor.isAdmin ? 9 : await trustLevelOf({ id: actor.userId!, role: 'USER' })
      const flags = flagsOf(
        data.title ?? post.title,
        data.content ?? post.content,
        data.tags ?? post.tags,
        sourceUrl,
        d.prompt?.prompt ?? before?.prompt,
        d.prompt?.useCase ?? before?.useCase,
        data.excerpt ?? post.excerpt,
        d.prompt?.negativePrompt ?? before?.negativePrompt,
        d.app?.name,
        d.app?.url,
        d.app?.pricing,
        d.app?.platforms,
        d.app?.trialNote,
      )
      let next = postReviewOnEdit(level, flags, post.reviewStatus)
      const text = dedupText({ prompt: d.prompt?.prompt ?? before?.prompt, content: data.content ?? post.content })
      data.simhash = simhash(text)
      const dup = level === 9 ? null : await findNearDuplicate(post.type, text, id)
      if (dup && dup.id !== post.remixOfId) {
        next = 'PENDING'
        data.reviewNote = `疑似与 #${dup.id}「${dup.title.slice(0, 40)}」重复（相似度距离 ${dup.distance}），请人工确认`
      }
      // 图片查重（P3）：换了图、且新图与别的账号上传过的图字节相同 → 转人工
      const reuse = level === 9 || d.images === undefined ? null : await findImageReuse(d.images, post.userId)
      if (reuse) {
        next = 'PENDING'
        data.reviewNote = [data.reviewNote, IMAGE_REUSE_NOTE].filter(Boolean).join('；')
      }
      if (next !== post.reviewStatus) {
        data.reviewStatus = next
        if (next === 'PENDING' && !data.reviewNote) data.reviewNote = null
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
    notifyContentChanged(id)
    return success({ id, pending, path: contentPath(type, id, post.slug) }, pending ? '已保存，审核通过后公开显示' : '已更新')
  } catch (err) {
    console.error('Update forum post error:', err)
    return error('更新失败')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // 渠道分站：本模块渠道站默认关闭，超管授权且渠道上架才开（docs/多渠道分销-内容模块下放.md）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyUnlessModule('learn')
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
    notifyContentChanged(id)
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Delete forum post error:', err)
    return error('删除失败')
  }
}
