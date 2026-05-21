import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

// 获取所有订单
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: { deliveryStatus?: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED' } = {}
    if (status && ['PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED'].includes(status)) {
      where.deliveryStatus = status as 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED'
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ])

    return success({
      list: orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    console.error('Get orders error:', err)
    return error('获取订单列表失败')
  }
}
