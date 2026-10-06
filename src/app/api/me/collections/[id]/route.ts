export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { meOrDeny } from '@/lib/content/session'

// 改合集名称 / 介绍 / 公开与否；删除合集（条目级联删除，内容本身不受影响）
async function mine(userId: number, id: number) {
  return prisma.collection.findFirst({ where: { id, userId }, select: { id: true } })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, denied } = await meOrDeny(request, true)
  if (denied) return denied
  try {
    const id = parseInt(params.id)
    if (!(await mine(user!.id, id))) return error('合集不存在', 404)
    const parsed = z
      .object({ title: z.string().trim().min(1).max(80).optional(), intro: z.string().trim().max(500).optional().nullable(), isPublic: z.boolean().optional() })
      .safeParse(await request.json())
    if (!parsed.success) return error(parsed.error.errors[0].message)
    await prisma.collection.update({ where: { id }, data: { ...parsed.data, intro: parsed.data.intro === undefined ? undefined : parsed.data.intro || null } })
    return success({ id }, '已保存')
  } catch (err) {
    console.error('Collection update error:', err)
    return error('保存失败')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, denied } = await meOrDeny(request, true)
  if (denied) return denied
  try {
    const id = parseInt(params.id)
    if (!(await mine(user!.id, id))) return error('合集不存在', 404)
    await prisma.collection.delete({ where: { id } })
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Collection delete error:', err)
    return error('删除失败')
  }
}
