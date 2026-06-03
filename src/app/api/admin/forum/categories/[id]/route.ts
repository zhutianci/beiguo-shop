export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

const patchSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  description: z.string().trim().max(255).optional().nullable(),
  icon: z.string().trim().max(20).optional().nullable(),
  color: z.string().trim().max(20).optional().nullable(),
  sortOrder: z.number().int().optional(),
  status: z.number().int().min(0).max(1).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const d = parsed.data
    const data: any = {}
    for (const k of ['name', 'description', 'icon', 'color', 'sortOrder', 'status'] as const) {
      if (d[k] !== undefined) data[k] = d[k]
    }
    if (data.description === '') data.description = null

    await prisma.forumCategory.update({ where: { id }, data })
    return success({ id }, '已更新')
  } catch (err) {
    console.error('Admin update category error:', err)
    return error('更新失败')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    const count = await prisma.forumPost.count({ where: { categoryId: id } })
    if (count > 0) return error(`该板块下还有 ${count} 个帖子，无法删除（可改为停用）`)

    await prisma.forumCategory.delete({ where: { id } })
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Admin delete category error:', err)
    return error('删除失败')
  }
}
