export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '100'), 200)
    const keyword = searchParams.get('keyword')?.trim()

    const where: any = {}
    if (keyword) {
      where.OR = [
        { claudeAccount: { contains: keyword } },
        { payerTitle: { contains: keyword } },
        { receiptNo: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.receipt.count({ where }),
    ])

    return success({ list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    console.error('Admin list receipts error:', err)
    return error('查询失败')
  }
}
