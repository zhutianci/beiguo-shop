export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { plainExcerpt } from '@/lib/markdown'
import { resolveActor, normalizeTags, memberDisplayName } from '@/lib/forum'
import { forumWriteGate } from '@/lib/forum-throttle'
import { denyUnlessModule, getStorefront, PLATFORM_TENANT_ID } from '@/lib/storefront/resolve'
import { flagsOf, forumCrossSite, trustLevelOf } from '@/lib/forum-server'
import { FLAG_LABELS, contentPath, isForumImageUrl, postReviewOnCreate } from '@/lib/content/policy'
import { declarationShape } from '@/lib/content/schema'
import { checkTyped, typedShape } from '@/lib/content/write'
import { contentBoardId } from '@/lib/content/tags'
import { ensureHandle } from '@/lib/content/creator'
import { notify } from '@/lib/notify'
import { IMAGE_REUSE_NOTE, dedupText, findImageReuse, findNearDuplicate, onPublished } from '@/lib/content/events'
import { simhash } from '@/lib/content/simhash'
import { searchThrottled } from '@/lib/search-throttle'

// 列表：支持板块筛选、标签、关键词、排序、分页
export async function GET(request: NextRequest) {
  // 渠道分站：本模块渠道站默认关闭，超管授权且渠道上架才开（docs/多渠道分销-内容模块下放.md）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyUnlessModule('learn')
  if (channelDenied) return channelDenied
  try {
    const { searchParams } = new URL(request.url)
    // 非数字 / 负数以前会变成 NaN、负的 take 交给 Prisma，回 500
    const page = Math.min(Math.max(parseInt(searchParams.get('page') || '1') || 1, 1), 10000)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20') || 20, 1), 50)
    const categorySlug = searchParams.get('category')?.trim().slice(0, 60)
    const tag = searchParams.get('tag')?.trim().slice(0, 40)
    const keyword = searchParams.get('keyword')?.trim().slice(0, 60)
    // 关键词搜索是正文 LIKE 全表扫，匿名可达：限频（lib/search-throttle）
    if (keyword && searchThrottled(request.headers, 'forum')) return error('搜索太频繁了，请稍等一分钟再试', 429)
    const sort = searchParams.get('sort') || 'latest' // latest | hot | featured

    // 只列对所有人公开的：已过审、未隐藏、未删除（口径同 lib/content/policy 的 isPublic）。
    // 论坛列表只列讨论帖：提示词与教程有自己的栏目（/prompts、/guides，服务端直出，不走这个接口）
    const where: any = { status: 1, reviewStatus: 'APPROVED', deletedAt: null, type: 'DISCUSSION' }
    if (categorySlug && categorySlug !== 'all') {
      const cat = await prisma.forumCategory.findUnique({ where: { slug: categorySlug } })
      if (cat) where.categoryId = cat.id
    }
    if (tag) where.tags = { contains: tag }
    if (keyword) {
      where.OR = [{ title: { contains: keyword } }, { content: { contains: keyword } }]
    }
    if (sort === 'featured') where.featured = true

    let orderBy: any
    if (sort === 'hot') {
      orderBy = [{ pinned: 'desc' }, { likeCount: 'desc' }, { views: 'desc' }, { lastReplyAt: 'desc' }]
    } else {
      orderBy = [{ pinned: 'desc' }, { lastReplyAt: 'desc' }, { createdAt: 'desc' }]
    }

    const [rows, total] = await Promise.all([
      prisma.forumPost.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { name: true, slug: true, icon: true, color: true } },
          user: { select: { nickname: true, avatar: true } },
        },
      }),
      prisma.forumPost.count({ where }),
    ])

    const list = rows.map((p) => ({
      id: p.id,
      title: p.title,
      excerpt: plainExcerpt(p.content),
      // 会员按当前昵称现算：库里旧快照可能是邮箱前缀（审计 G48）
      authorName: p.userId ? memberDisplayName(p.user?.nickname, p.userId) : p.authorName,
      avatar: p.user?.avatar || null,
      isMember: !!p.userId,
      category: p.category,
      tags: p.tags ? p.tags.split(',').filter(Boolean) : [],
      pinned: p.pinned,
      featured: p.featured,
      locked: p.locked,
      views: p.views,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      lastReplyAt: p.lastReplyAt,
      createdAt: p.createdAt,
    }))

    return success({ list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    console.error('List forum posts error:', err)
    return error('获取帖子失败')
  }
}

const createSchema = z.object({
  // 提示词 / 教程不用选板块（挂在各自的专用板块下），讨论帖必选
  categoryId: z.number().int().positive('请选择板块').optional(),
  title: z.string().trim().min(2, '标题至少 2 个字').max(200, '标题过长'),
  // 提示词的正文是「心得与说明」，可以空着；讨论与教程在下面按类型要求非空
  content: z.string().trim().max(20000, '内容过长').default(''),
  tags: z.string().optional().nullable(),
  // 只收本站论坛上传目录里的图（以前什么字符串都收：外站热链、追踪像素都能进库）
  images: z.array(z.string().refine(isForumImageUrl, '图片地址无效，请重新上传')).optional().default([]),
  ...declarationShape,
  ...typedShape,
  /** 「同款自」：原提示词的 id（只对提示词有效，设计 §7.4） */
  remixOfId: z.number().int().positive().optional().nullable(),
})

// 发帖：必须登录（内容平台 P0：关闭匿名发帖，设计 §18 第 2 条）；新人先审后发
export async function POST(request: NextRequest) {
  // 渠道分站：本模块渠道站默认关闭，超管授权且渠道上架才开（docs/多渠道分销-内容模块下放.md）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyUnlessModule('learn')
  if (channelDenied) return channelDenied
  // 来源站（内容模块下放）：渠道发的帖 / 评论在后台审核时显示来源。getStorefront 不包进 try
  const sourceTenantId = (await getStorefront())?.id ?? PLATFORM_TENANT_ID
  const crossSite = forumCrossSite(request.headers)
  if (crossSite) return crossSite
  try {
    const actor = await resolveActor(request)
    if (!actor.userId) return error('请先登录后再发帖', 401)
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data
    const originality = d.originality ?? 'ORIGINAL_FIRST'
    const sourceUrl = d.sourceUrl ? d.sourceUrl : null
    if (originality !== 'ORIGINAL_FIRST' && !sourceUrl) return error('非首发或转载的内容，请填写原文地址')

    const type = d.type ?? 'DISCUSSION'
    let categoryId: number
    if (type === 'DISCUSSION') {
      if (!d.content) return error('内容不能为空')
      if (!d.categoryId) return error('请选择板块')
      const category = await prisma.forumCategory.findUnique({ where: { id: d.categoryId } })
      if (!category || category.status !== 1) return error('板块不存在')
      // 公告板块仅管理员可发；提示词 / 教程的专用板块不能当讨论板块用
      if (category.slug === 'announce' && !actor.isAdmin) return error('公告板块仅管理员可发布')
      if (category.slug === 'prompts' || category.slug === 'guides') return error('请在发布类型里选择「提示词」或「教程」')
      categoryId = category.id
    } else {
      categoryId = await contentBoardId(type)
    }
    const typed = await checkTyped(type, d, { full: true, imageCount: d.images.length, content: d.content })
    if ('error' in typed) return error(typed.error)

    // 限流放在校验之后、落库之前：校验失败不消耗额度（审计 G44，阈值见 lib/forum-throttle）
    const denied = forumWriteGate(request.headers, actor, 'post')
    if (denied) return error(denied, 429)

    const authorName = actor.nickname || '用户'
    const level = await trustLevelOf({ id: actor.userId, role: actor.isAdmin ? 'ADMIN' : 'USER' })
    // 应用卡片的字段也进风险检测（2026-10-07：试用说明 / 价格里塞联系方式以前查不到）
    const flags = flagsOf(d.title, d.content, d.tags, sourceUrl, d.prompt?.prompt, d.prompt?.useCase, d.excerpt, d.prompt?.negativePrompt, d.app?.name, d.app?.url, d.app?.pricing, d.app?.platforms, d.app?.trialNote)
    let reviewStatus = postReviewOnCreate(level, flags)

    // 作者自荐（设计 §9.1 四件套）：L2 创作者以上才能发、每 30 天 1 条、一律人工审核
    if (type === 'APP' && d.app?.selfPromo && level !== 9) {
      if (level < 2) return error('作者自荐需要先成为创作者（3 篇精选或 300 积分），先分享一些对大家有用的内容吧')
      const recent = await prisma.forumPost.count({
        where: { userId: actor.userId, type: 'APP', deletedAt: null, createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) }, app: { selfPromo: true } },
      })
      if (recent >= 1) return error('作者自荐每 30 天限 1 条')
      reviewStatus = 'PENDING'
    }

    // 同款自：原作必须是公开的提示词
    let remixOfId: number | null = null
    if (type === 'PROMPT' && d.remixOfId) {
      const origin = await prisma.forumPost.findFirst({
        where: { id: d.remixOfId, type: 'PROMPT', status: 1, reviewStatus: 'APPROVED', deletedAt: null },
        select: { id: true },
      })
      if (!origin) return error('「同款自」的原提示词不存在或未公开')
      remixOfId = origin.id
    }

    // 查重（设计 §6.2）：与站内已有内容高度相似的，非管理员一律转人工，并在审核备注里写明像哪一条
    const text = dedupText({ prompt: d.prompt?.prompt, content: d.content })
    const dup = level === 9 ? null : await findNearDuplicate(type, text)
    if (dup && dup.id !== remixOfId) reviewStatus = 'PENDING'
    // 图片查重（P3）：与别的账号上传过的图字节相同 → 转人工
    const reuse = level === 9 ? null : await findImageReuse(d.images, actor.userId)
    if (reuse) reviewStatus = 'PENDING'

    const now = new Date()
    const post = await prisma.forumPost.create({
      data: {
        type,
        categoryId,
        userId: actor.userId,
        authorName: authorName.slice(0, 50),
        sourceTenantId,
        title: d.title,
        content: d.content,
        // 提示词 / 教程用策展标签（post_tags），不用自由标签
        tags: type === 'DISCUSSION' ? normalizeTags(d.tags) : '',
        excerpt: type === 'DISCUSSION' ? null : d.excerpt || null,
        testedOn: typed.testedOn ?? null,
        accountTier: type === 'DISCUSSION' ? null : d.accountTier ?? null,
        ...(type === 'PROMPT' && d.prompt
          ? {
              prompt: {
                create: {
                  prompt: d.prompt.prompt,
                  negativePrompt: d.prompt.negativePrompt || null,
                  modelLabel: d.prompt.modelLabel || null,
                  aspectRatio: d.prompt.aspectRatio || null,
                  needsRefImage: d.prompt.needsRefImage,
                  useCase: d.prompt.useCase,
                },
              },
            }
          : {}),
        ...(type === 'APP' && d.app
          ? {
              app: {
                create: {
                  name: d.app.name,
                  url: d.app.url,
                  pricing: d.app.pricing || null,
                  platforms: d.app.platforms || null,
                  trialNote: d.app.trialNote || null,
                  selfPromo: !!d.app.selfPromo,
                  relation: d.app.selfPromo ? d.app.relation ?? 'OTHER' : null,
                },
              },
            }
          : {}),
        ...(typed.tagIds?.length ? { postTags: { create: typed.tagIds.map((tagId) => ({ tagId })) } } : {}),
        images: d.images.length ? JSON.stringify(d.images.slice(0, 9)) : null,
        lastReplyAt: now,
        // 显式写入，不靠库默认值（库默认 APPROVED 只为加列那一刻的存量行，见 schema 注释）
        reviewStatus,
        reviewedAt: reviewStatus === 'APPROVED' ? now : null,
        originality,
        sourceUrl,
        aiAssist: d.aiAssist ?? 'NONE',
        remixOfId,
        simhash: simhash(text),
        reviewNote:
          [dup && dup.id !== remixOfId ? `疑似与 #${dup.id}「${dup.title.slice(0, 40)}」重复（相似度距离 ${dup.distance}），请人工确认` : null, reuse ? IMAGE_REUSE_NOTE : null]
            .filter(Boolean)
            .join('；') || null,
      },
    })

    // 作者主页短码：第一次发内容时建好（失败不影响发帖，页面上会懒生成）
    ensureHandle(actor.userId).catch(() => {})
    const path = contentPath(type, post.id, null)

    if (reviewStatus === 'PENDING') {
      notify(
        'forum.review',
        [
          { label: '标题', value: d.title },
          { label: '作者', value: authorName },
          {
            label: '原因',
            value: dup && dup.id !== remixOfId ? `疑似重复 #${dup.id}` : reuse ? '图片与别的账号相同' : flags.length ? flags.map((f) => FLAG_LABELS[f]).join('、') : '新人内容先审后发',
          },
        ],
        { link: '/admin/forum?review=PENDING', linkText: '去审核' },
      )
      return success({ id: post.id, path, pending: true }, '已提交，审核通过后公开显示（工作日 24 小时内处理）')
    }
    void onPublished(post.id, { reviewed: false })
    return success({ id: post.id, path, pending: false }, '发布成功')
  } catch (err) {
    console.error('Create forum post error:', err)
    return error('发布失败')
  }
}
