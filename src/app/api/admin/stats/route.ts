export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

export async function GET() {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      revenueAgg,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      // 总收入：交给数据库 SUM，不再把所有 PAID 订单拉进内存 reduce
      prisma.order.aggregate({
        where: { payStatus: 'PAID' },
        _sum: { amount: true },
      }),
      // 最近订单：只取 5 条，并只 select 前端真正用到的字段（避免带出 deliveryInfo 等大字段）
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNo: true,
          productName: true,
          amount: true,
          payStatus: true,
          deliveryStatus: true,
          createdAt: true,
          user: {
            select: { email: true, nickname: true },
          },
        },
      }),
    ])

    const totalRevenue = Number(revenueAgg._sum.amount ?? 0)

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
