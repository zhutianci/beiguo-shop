export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

export async function GET() {
  try {
    const categories = await prisma.forumCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: { _count: { select: { posts: true } } },
    })
    return success(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
        color: c.color,
        sortOrder: c.sortOrder,
        status: c.status,
        postCount: c._count.posts,
      }))
    )
  } catch (err) {
    console.error('Admin list categories error:', err)
    return error('获取失败')
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1, '名称必填').max(50),
  slug: z.string().trim().min(1, 'slug 必填').max(50).regex(/^[a-z0-9-]+$/, 'slug 只能是小写字母/数字/连字符'),
  description: z.string().trim().max(255).optional().nullable(),
  icon: z.string().trim().max(20).optional().nullable(),
  color: z.string().trim().max(20).optional().nullable(),
  sortOrder: z.number().int().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const dup = await prisma.forumCategory.findUnique({ where: { slug: d.slug } })
    if (dup) return error('slug 已存在')

    const cat = await prisma.forumCategory.create({
      data: {
        name: d.name,
        slug: d.slug,
        description: d.description || null,
        icon: d.icon || null,
        color: d.color || null,
        sortOrder: d.sortOrder ?? 0,
      },
    })
    return success({ id: cat.id }, '已创建')
  } catch (err) {
    console.error('Admin create category error:', err)
    return error('创建失败')
  }
}
