export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

// 仅管理员可删除收据（删除后买家可重新申请生成）
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    await prisma.receipt.delete({ where: { id } })
    return success({ id }, '已删除，可重新生成')
  } catch (err) {
    console.error('Admin delete receipt error:', err)
    return error('删除失败')
  }
}
