export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { plainExcerpt } from '@/lib/markdown'
import { resolveActor, normalizeTags } from '@/lib/forum'

// 列表：支持板块筛选、标签、关键词、排序、分页
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 50)
    const categorySlug = searchParams.get('category')?.trim()
    const tag = searchParams.get('tag')?.trim()
    const keyword = searchParams.get('keyword')?.trim()
    const sort = searchParams.get('sort') || 'latest' // latest | hot | featured

    const where: any = { status: 1 }
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
      authorName: p.authorName,
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
  images: z.array(z.string()).optional().default([]),
  anonName: z.string().trim().max(30).optional().nullable(), // 匿名昵称
  anonEmail: z.string().email().optional().nullable(),
})

// 发帖（登录或匿名）
export async function POST(request: NextRequest) {
  try {
    const actor = await resolveActor(request)
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const category = await prisma.forumCategory.findUnique({ where: { id: d.categoryId } })
    if (!category || category.status !== 1) return error('板块不存在')
    // 公告板块仅管理员可发
    if (category.slug === 'announce' && !actor.isAdmin) {
      return error('公告板块仅管理员可发布')
    }

    let authorName = actor.nickname
    if (!actor.userId) {
      authorName = (d.anonName || '').trim() || '匿名用户'
    }
    if (!authorName) authorName = '用户'

    const now = new Date()
    const post = await prisma.forumPost.create({
      data: {
        categoryId: d.categoryId,
        userId: actor.userId,
        authorName: authorName.slice(0, 50),
        authorEmail: actor.userId ? null : d.anonEmail || null,
        title: d.title,
        content: d.content,
        tags: normalizeTags(d.tags),
        images: d.images.length ? JSON.stringify(d.images.slice(0, 9)) : null,
        lastReplyAt: now,
      },
    })

    return success({ id: post.id }, '发布成功')
  } catch (err) {
    console.error('Create forum post error:', err)
    return error('发布失败')
  }
}
