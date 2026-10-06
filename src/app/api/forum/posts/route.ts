export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { plainExcerpt } from '@/lib/markdown'
import { resolveActor, normalizeTags, memberDisplayName } from '@/lib/forum'
import { forumWriteGate } from '@/lib/forum-throttle'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { flagsOf, forumCrossSite, trustLevelOf } from '@/lib/forum-server'
import { FLAG_LABELS, isForumImageUrl, postReviewOnCreate } from '@/lib/content/policy'
import { declarationShape } from '@/lib/content/schema'
import { notify } from '@/lib/notify'

// 列表：支持板块筛选、标签、关键词、排序、分页
export async function GET(request: NextRequest) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 50)
    const categorySlug = searchParams.get('category')?.trim()
    const tag = searchParams.get('tag')?.trim()
    const keyword = searchParams.get('keyword')?.trim()
    const sort = searchParams.get('sort') || 'latest' // latest | hot | featured

    // 只列对所有人公开的：已过审、未隐藏、未删除（口径同 lib/content/policy 的 isPublic）
    const where: any = { status: 1, reviewStatus: 'APPROVED', deletedAt: null }
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
  categoryId: z.number().int().positive('请选择板块'),
  title: z.string().trim().min(2, '标题至少 2 个字').max(200, '标题过长'),
  content: z.string().trim().min(1, '内容不能为空').max(20000, '内容过长'),
  tags: z.string().optional().nullable(),
  // 只收本站论坛上传目录里的图（以前什么字符串都收：外站热链、追踪像素都能进库）
  images: z.array(z.string().refine(isForumImageUrl, '图片地址无效，请重新上传')).optional().default([]),
  ...declarationShape,
})

// 发帖：必须登录（内容平台 P0：关闭匿名发帖，设计 §18 第 2 条）；新人先审后发
export async function POST(request: NextRequest) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
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

    const category = await prisma.forumCategory.findUnique({ where: { id: d.categoryId } })
    if (!category || category.status !== 1) return error('板块不存在')
    // 公告板块仅管理员可发
    if (category.slug === 'announce' && !actor.isAdmin) {
      return error('公告板块仅管理员可发布')
    }

    // 限流放在校验之后、落库之前：校验失败不消耗额度（审计 G44，阈值见 lib/forum-throttle）
    const denied = forumWriteGate(request.headers, actor, 'post')
    if (denied) return error(denied, 429)

    const authorName = actor.nickname || '用户'
    const level = await trustLevelOf({ id: actor.userId, role: actor.isAdmin ? 'ADMIN' : 'USER' })
    const flags = flagsOf(d.title, d.content, d.tags, sourceUrl)
    const reviewStatus = postReviewOnCreate(level, flags)

    const now = new Date()
    const post = await prisma.forumPost.create({
      data: {
        categoryId: d.categoryId,
        userId: actor.userId,
        authorName: authorName.slice(0, 50),
        title: d.title,
        content: d.content,
        tags: normalizeTags(d.tags),
        images: d.images.length ? JSON.stringify(d.images.slice(0, 9)) : null,
        lastReplyAt: now,
        // 显式写入，不靠库默认值（库默认 APPROVED 只为加列那一刻的存量行，见 schema 注释）
        reviewStatus,
        reviewedAt: reviewStatus === 'APPROVED' ? now : null,
        originality,
        sourceUrl,
        aiAssist: d.aiAssist ?? 'NONE',
      },
    })

    if (reviewStatus === 'PENDING') {
      notify(
        'forum.review',
        [
          { label: '标题', value: d.title },
          { label: '作者', value: authorName },
          { label: '原因', value: flags.length ? flags.map((f) => FLAG_LABELS[f]).join('、') : '新人内容先审后发' },
        ],
        { link: '/admin/forum?review=PENDING', linkText: '去审核' },
      )
      return success({ id: post.id, pending: true }, '已提交，审核通过后公开显示（工作日 24 小时内处理）')
    }
    return success({ id: post.id, pending: false }, '发布成功')
  } catch (err) {
    console.error('Create forum post error:', err)
    return error('发布失败')
  }
}
