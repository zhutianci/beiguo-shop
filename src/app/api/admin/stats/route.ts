export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { sourceMap, sourceOf } from '@/lib/admin/source-site'

export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
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
      // 总收入：交给数据库 SUM，不再把所有 PAID 订单拉进内存 reduce。
      // 排除「已付款 + 已取消」：后台没有退款按钮，线下退款后就是这么标的，钱已经退回去了
      prisma.order.aggregate({
        where: { payStatus: 'PAID', deliveryStatus: { not: 'CANCELLED' } },
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
          tenantId: true,
          user: {
            select: { email: true, nickname: true },
          },
        },
      }),
    ])

    const totalRevenue = Number(revenueAgg._sum.amount ?? 0)

    /*
     * 按来源站拆分（设计 12.2「仪表盘按站拆分」、4.10 ④）：同一口径（已付且未取消）按 tenantId 分组。
     * 主站销售额 = tenantId=1 那一组；渠道销售额 = 其余之和（渠道单的 amount 是渠道售价，即买家实付货款）。
     * 「全部」的 totalRevenue 仍是上面那条 SUM，与分组之和相等（W4-9）。
     */
    const bySiteRaw = await prisma.order.groupBy({
      by: ['tenantId'],
      where: { payStatus: 'PAID', deliveryStatus: { not: 'CANCELLED' } },
      _sum: { amount: true },
      _count: { _all: true },
    })
    const srcMap = await sourceMap([...bySiteRaw.map((g) => g.tenantId), ...recentOrders.map((o) => o.tenantId)])
    const cents = (v: unknown) => Math.round(Number(v ?? 0) * 100)
    const revenueBySite = bySiteRaw
      .map((g) => ({ ...sourceOf(srcMap, g.tenantId), revenue: cents(g._sum.amount) / 100, orders: g._count._all }))
      .sort((a, b) => a.tenantId - b.tenantId)
    const mainRevenue = cents(bySiteRaw.find((g) => g.tenantId === 1)?._sum.amount) / 100
    const channelRevenue = bySiteRaw.filter((g) => g.tenantId !== 1).reduce((s, g) => s + cents(g._sum.amount), 0) / 100

    return success({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      mainRevenue,
      channelRevenue,
      revenueBySite,
      recentOrders: recentOrders.map((o) => ({ ...o, source: sourceOf(srcMap, o.tenantId) })),
    })
  } catch (err) {
    console.error('Get stats error:', err)
    return error('获取统计数据失败')
  }
}
