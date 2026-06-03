export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 200)
    const keyword = searchParams.get('keyword')?.trim()
    const status = searchParams.get('status')?.trim()

    const where: any = {}
    if (status) where.status = status
    if (keyword) {
      where.OR = [
        { claudeAccount: { contains: keyword } },
        { title: { contains: keyword } },
        { taxNumber: { contains: keyword } },
        { invoiceNo: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ])

    return success({ list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    console.error('Admin list invoices error:', err)
    return error('查询失败')
  }
}
