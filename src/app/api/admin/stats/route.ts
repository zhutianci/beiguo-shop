export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

export async function GET() {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      paidOrders,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.findMany({
        where: { payStatus: 'PAID' },
        select: { amount: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { email: true, nickname: true },
          },
        },
      }),
    ])

    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + Number(order.amount),
      0
    )

    return success({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
    })
  } catch (err) {
    console.error('Get stats error:', err)
    return error('获取统计数据失败')
  }
}
