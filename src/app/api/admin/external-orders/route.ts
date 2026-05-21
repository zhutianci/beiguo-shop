export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 200)
    const keyword = searchParams.get('keyword')?.trim()

    const where = keyword
      ? {
          OR: [
            { claudeAccount: { contains: keyword } },
            { xianyuNickname: { contains: keyword } },
            { subscriptionType: { contains: keyword } },
          ],
        }
      : {}

    const [list, total] = await Promise.all([
      prisma.externalOrder.findMany({
        where,
        orderBy: [{ expireDate: 'desc' }, { startDate: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.externalOrder.count({ where }),
    ])

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    console.error('Get external orders error:', err)
    return error('查询失败')
  }
}

export async function DELETE() {
  try {
    const { count } = await prisma.externalOrder.deleteMany({})
    return success({ deleted: count }, `已删除 ${count} 条记录`)
  } catch (err) {
    console.error('Clear error:', err)
    return error('清空失败')
  }
}
