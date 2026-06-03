export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

const patchSchema = z.object({
  // 允许的状态流转：SUBMITTED→ISSUED（开具）；任意→CANNOT（不可开据）；CANNOT/ISSUED→SUBMITTED（撤回重置）
  status: z.enum(['SUBMITTED', 'ISSUED', 'CANNOT', 'AWAIT_PAY']).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const invoice = await prisma.invoice.findUnique({ where: { id } })
    if (!invoice) return error('发票不存在', 404)

    const data: any = {}
    if (parsed.data.status) {
      data.status = parsed.data.status
      if (parsed.data.status === 'ISSUED') data.issuedAt = new Date()
    }
    if (Object.keys(data).length === 0) return error('没有可更新的内容')

    await prisma.invoice.update({ where: { id }, data })
    return success({ id }, '已更新')
  } catch (err) {
    console.error('Admin update invoice error:', err)
    return error('更新失败')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    await prisma.invoice.delete({ where: { id } })
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Admin delete invoice error:', err)
    return error('删除失败')
  }
}
