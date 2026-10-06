export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { meOrDeny } from '@/lib/content/session'

/**
 * 我的合集（设计 §7.5）：GET 列表（可带 ?postId= 标出哪些合集已包含这条内容，给「加入合集」弹层用），POST 新建。
 * 每人最多 50 个合集。
 */
export async function GET(request: NextRequest) {
  const { user, denied } = await meOrDeny(request, false)
  if (denied) return denied
  try {
    const postId = Number(new URL(request.url).searchParams.get('postId')) || null
    const rows = await prisma.collection.findMany({
      where: { userId: user!.id },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { items: true } }, ...(postId ? { items: { where: { postId }, select: { postId: true } } } : {}) },
    })
    return success({
      list: rows.map((c) => ({
        id: c.id,
        title: c.title,
        intro: c.intro,
        isPublic: c.isPublic,
        count: c._count.items,
        hasPost: postId ? ((c as unknown as { items?: unknown[] }).items?.length ?? 0) > 0 : false,
      })),
    })
  } catch (err) {
    console.error('Collections list error:', err)
    return error('获取失败')
  }
}

const createSchema = z.object({
  title: z.string().trim().min(1, '请填写合集名称').max(80),
  intro: z.string().trim().max(500).optional().nullable(),
  isPublic: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  const { user, denied } = await meOrDeny(request, true)
  if (denied) return denied
  try {
    const parsed = createSchema.safeParse(await request.json())
    if (!parsed.success) return error(parsed.error.errors[0].message)
    if ((await prisma.collection.count({ where: { userId: user!.id } })) >= 50) return error('合集最多 50 个')
    const c = await prisma.collection.create({
      data: { userId: user!.id, title: parsed.data.title, intro: parsed.data.intro || null, isPublic: parsed.data.isPublic ?? true },
    })
    return success({ id: c.id }, '已创建')
  } catch (err) {
    console.error('Collection create error:', err)
    return error('创建失败')
  }
}
