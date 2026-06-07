export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { decryptCardContent, syncAutoStock } from '@/lib/cardkey'

// 查看单条明文（管理员）
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const c = await prisma.cardKey.findUnique({ where: { id } })
    if (!c) return notFound('卡密不存在')
    let secret = ''
    try {
      secret = decryptCardContent(c.content)
    } catch {
      secret = '(无法解密)'
    }
    return success({ id: c.id, secret })
  } catch (err) {
    console.error('Reveal cardkey error:', err)
    return error('获取失败')
  }
}

const patchSchema = z.object({ status: z.enum(['UNUSED', 'DISABLED']) })

// 启用/停用（不允许改 USED）
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const c = await prisma.cardKey.findUnique({ where: { id } })
    if (!c) return notFound('卡密不存在')
    if (c.status === 'USED') return error('已发出的卡密不可修改')

    await prisma.cardKey.update({ where: { id }, data: { status: parsed.data.status } })
    await syncAutoStock(c.productId)
    return success({ id }, '已更新')
  } catch (err) {
    console.error('Update cardkey error:', err)
    return error('更新失败')
  }
}

// 删除（已发出的保留以备查，不删）
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const c = await prisma.cardKey.findUnique({ where: { id } })
    if (!c) return notFound('卡密不存在')
    if (c.status === 'USED') return error('已发出的卡密不可删除（保留发货记录）')
    await prisma.cardKey.delete({ where: { id } })
    await syncAutoStock(c.productId)
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Delete cardkey error:', err)
    return error('删除失败')
  }
}
