export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { tagFieldsShape } from '@/lib/content/tag-admin'

const patchSchema = z.object(tagFieldsShape)

// 改名称 / hub 介绍 / 落地页 / 排序 / 启停（slug 与种类不能改）
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const parsed = patchSchema.safeParse(await request.json())
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data
    const data: Record<string, unknown> = {}
    if (d.name !== undefined) data.name = d.name
    if (d.intro !== undefined) data.intro = d.intro || null
    if (d.landingPath !== undefined) data.landingPath = d.landingPath || null
    if (d.sortOrder !== undefined) data.sortOrder = d.sortOrder
    if (d.status !== undefined) data.status = d.status
    if (!Object.keys(data).length) return error('没有可更新的内容')
    await prisma.tag.update({ where: { id }, data })
    return success({ id }, '已保存')
  } catch (err) {
    console.error('Admin update tag error:', err)
    return error('保存失败')
  }
}

// 只能删没有任何内容在用的标签；有内容的请停用（停用后 hub 页 404、内容上不再显示这个标签）
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const used = await prisma.postTag.count({ where: { tagId: id } })
    if (used) return error(`还有 ${used} 条内容在用这个标签，请改为停用`)
    await prisma.tag.delete({ where: { id } })
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Admin delete tag error:', err)
    return error('删除失败')
  }
}
