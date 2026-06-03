export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { renderMarkdown } from '@/lib/markdown'
import { resolveActor, normalizeTags } from '@/lib/forum'

// 帖子详情（浏览量 +1，返回渲染后的 HTML 与点赞状态）
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
    if (!post || (post.status !== 1 && !actor.isAdmin)) return error('帖子不存在或已被隐藏', 404)

    // 浏览量 +1（不阻塞）
    prisma.forumPost.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {})

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
      authorName: post.authorName,
      avatar: post.user?.avatar || null,
      isMember: !!post.userId,
      category: post.category,
      categoryId: post.categoryId,
      tags: post.tags ? post.tags.split(',').filter(Boolean) : [],
      pinned: post.pinned,
      featured: post.featured,
      locked: post.locked,
      status: post.status,
      views: post.views + 1,
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

const patchSchema = z.object({
  // 作者编辑
  title: z.string().trim().min(2).max(200).optional(),
  content: z.string().trim().min(1).max(20000).optional(),
  tags: z.string().optional().nullable(),
  categoryId: z.number().int().positive().optional(),
  images: z.array(z.string()).optional(),
  // 管理员操作
  pinned: z.boolean().optional(),
  featured: z.boolean().optional(),
  locked: z.boolean().optional(),
  status: z.number().int().min(0).max(1).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const actor = await resolveActor(request)

    const post = await prisma.forumPost.findUnique({ where: { id } })
    if (!post) return error('帖子不存在', 404)

    const isAuthor = !!post.userId && post.userId === actor.userId
    if (!actor.isAdmin && !isAuthor) return error('无权操作', 403)

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const data: any = {}
    // 内容类编辑：作者或管理员
    if (d.title !== undefined) data.title = d.title
    if (d.content !== undefined) data.content = d.content
    if (d.tags !== undefined) data.tags = normalizeTags(d.tags)
    if (d.categoryId !== undefined) data.categoryId = d.categoryId
    if (d.images !== undefined) data.images = d.images.length ? JSON.stringify(d.images.slice(0, 9)) : null
    // 运营操作：仅管理员
    if (actor.isAdmin) {
      if (d.pinned !== undefined) data.pinned = d.pinned
      if (d.featured !== undefined) data.featured = d.featured
      if (d.locked !== undefined) data.locked = d.locked
      if (d.status !== undefined) data.status = d.status
    }

    if (Object.keys(data).length === 0) return error('没有可更新的内容')

    await prisma.forumPost.update({ where: { id }, data })
    return success({ id }, '已更新')
  } catch (err) {
    console.error('Update forum post error:', err)
    return error('更新失败')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const actor = await resolveActor(request)

    const post = await prisma.forumPost.findUnique({ where: { id } })
    if (!post) return error('帖子不存在', 404)

    const isAuthor = !!post.userId && post.userId === actor.userId
    if (!actor.isAdmin && !isAuthor) return error('无权删除', 403)

    await prisma.forumPost.delete({ where: { id } })
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Delete forum post error:', err)
    return error('删除失败')
  }
}
