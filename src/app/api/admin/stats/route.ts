export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { sourceMap, sourceOf } from '@/lib/admin/source-site'
import { excludeTopup } from '@/lib/order-scope'
import { shanghaiDayStart } from '@/lib/wallet/admin-query'
import { jiemaFinance } from '@/lib/jiema/admin-orders'

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
      // 总订单：只数已付款、非充值单（充值是预收款、不计营收，D40；未付款单不算成交）。页面注明口径
      prisma.order.count({ where: { payStatus: 'PAID', ...excludeTopup() } }),
      // 总收入：交给数据库 SUM，不再把所有 PAID 订单拉进内存 reduce。
      // 排除「已付款 + 已取消」：后台没有退款按钮，线下退款后就是这么标的，钱已经退回去了。
      // 排除充值单（D40、§6.6 第 17 条）：买家用余额消费时那张单才计营收，充值再计一次就是同一笔钱记两次
      prisma.order.aggregate({
        where: { payStatus: 'PAID', deliveryStatus: { not: 'CANCELLED' }, ...excludeTopup() },
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
      where: { payStatus: 'PAID', deliveryStatus: { not: 'CANCELLED' }, ...excludeTopup() },
      _sum: { amount: true },
      _count: { _all: true },
    })
    // 今日充值入账（北京时间当天，按实付含识别尾差；**不计入营收**，D40）：充值格的 TOPUP 流水合计
    const topupAgg = await prisma.balanceLog.aggregate({
      where: { type: 'TOPUP', createdAt: { gte: shanghaiDayStart() } },
      _sum: { topupDeltaCents: true },
      _count: { _all: true },
    })
    const todayTopup = { cents: topupAgg._sum.topupDeltaCents ?? 0, count: topupAgg._count._all }
    /*
     * 短信接码（已定稿）的营收 / 真实成本 / 毛利 / 亏损（docs/短信接码-设计.md §6.6 第 28 条、§9.5）：今天与近 30 天（北京时间）。
     * 口径与接码后台概览同一个 report.summarizeFinance（只算定稿单；已取消单只计亏损），与上面的「总收入」（Order.amount，含进行中的接码单）不同，页面各自注明。
     * 读失败不影响仪表盘其余部分（jiema 为 null）。
     */
    let jiema: { today: Awaited<ReturnType<typeof jiemaFinance>>; last30: Awaited<ReturnType<typeof jiemaFinance>> } | null = null
    try {
      const day0 = shanghaiDayStart()
      const end = new Date(day0.getTime() + 86400_000)
      const [today, last30] = await Promise.all([jiemaFinance(day0, end), jiemaFinance(new Date(day0.getTime() - 29 * 86400_000), end)])
      jiema = { today, last30 }
    } catch (e) {
      console.error('[stats] 接码成本利润读取失败（不影响其余统计）', e)
    }
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
      todayTopup,
      jiema,
      recentOrders: recentOrders.map((o) => ({ ...o, source: sourceOf(srcMap, o.tenantId) })),
    })
  } catch (err) {
    console.error('Get stats error:', err)
    return error('获取统计数据失败')
  }
}
