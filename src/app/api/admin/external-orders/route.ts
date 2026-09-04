export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20'), 1), 200)
    const keyword = searchParams.get('keyword')?.trim()
    const status = searchParams.get('status')?.trim() // valid | expired | 空=全部

    const where: Prisma.ExternalOrderWhereInput = {}
    if (keyword) {
      where.OR = [
        { claudeAccount: { contains: keyword } },
        { xianyuNickname: { contains: keyword } },
        { subscriptionType: { contains: keyword } },
      ]
    }
    // 到期时间为 @db.Date（UTC 零点），与前端 new Date(expireDate) < new Date() 的判定一致
    if (status === 'expired') where.expireDate = { lt: new Date() }
    else if (status === 'valid') where.expireDate = { gte: new Date() }

    const [list, total] = await Promise.all([
      prisma.externalOrder.findMany({
        where,
        orderBy: [{ expireDate: 'desc' }, { startDate: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.externalOrder.count({ where }),
    ])

    // 附带发票信息（每笔订单最多关联一张发票）
    const ids = list.map((o) => o.id)
    const invoices = ids.length
      ? await prisma.invoice.findMany({
          where: { externalOrderId: { in: ids } },
          select: { externalOrderId: true, status: true, invoiceNo: true },
        })
      : []
    const invoiceMap = new Map(invoices.map((iv) => [iv.externalOrderId, iv]))

    const enriched = list.map((o) => {
      const iv = invoiceMap.get(o.id)
      return {
        ...o,
        invoiceStatus: iv?.status ?? null,
        invoiceNo: iv?.invoiceNo ?? null,
      }
    })

    return success({
      list: enriched,
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
