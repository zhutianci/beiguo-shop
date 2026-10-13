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
    const paidScope = { payStatus: 'PAID' as const, deliveryStatus: { not: 'CANCELLED' as const }, ...excludeTopup() }
    const day0 = shanghaiDayStart()
    /*
     * 这些统计彼此独立，一次并发发出去（原来是五段先后 await，仪表盘首屏要等它们排队跑完）。
     * 口径都没变：
     *  · 总订单：只数已付款、非充值单（充值是预收款、不计营收，D40；未付款单不算成交）
     *  · 总收入：数据库 SUM；排除「已付款 + 已取消」（线下退款后就是这么标的）与充值单（D40、§6.6 第 17 条）
     *  · 按来源站拆分（设计 12.2、4.10 ④）：同一口径按 tenantId 分组，各组之和 = 总收入（W4-9）
     *  · 今日充值入账（北京时间当天，按实付含识别尾差；**不计入营收**）：充值格 TOPUP 流水合计
     *  · 短信接码（已定稿）的营收 / 真实成本 / 毛利 / 亏损（docs/短信接码-设计.md §6.6 第 28 条、§9.5）：今天与近 30 天，
     *    与接码后台概览同一个 report.summarizeFinance；读失败不影响其余部分（jiema 为 null）
     *  · 待办：已付款还在「处理中」的单（等人工发货 / 补发）、待支付的单
     */
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      revenueAgg,
      recentOrders,
      bySiteRaw,
      topupAgg,
      jiema,
      processingOrders,
      unpaidOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count({ where: { payStatus: 'PAID', ...excludeTopup() } }),
      prisma.order.aggregate({ where: paidScope, _sum: { amount: true } }),
      // 最近订单：只 select 前端真正用到的字段（避免带出 deliveryInfo 等大字段）
      prisma.order.findMany({
        take: 8,
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
      prisma.order.groupBy({
        by: ['tenantId'],
        where: paidScope,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.balanceLog.aggregate({
        where: { type: 'TOPUP', createdAt: { gte: day0 } },
        _sum: { topupDeltaCents: true },
        _count: { _all: true },
      }),
      (async () => {
        try {
          const end = new Date(day0.getTime() + 86400_000)
          const [today, last30] = await Promise.all([jiemaFinance(day0, end), jiemaFinance(new Date(day0.getTime() - 29 * 86400_000), end)])
          return { today, last30 }
        } catch (e) {
          console.error('[stats] 接码成本利润读取失败（不影响其余统计）', e)
          return null
        }
      })(),
      prisma.order.count({ where: { payStatus: 'PAID', deliveryStatus: 'PROCESSING', ...excludeTopup() } }),
      prisma.order.count({ where: { payStatus: 'UNPAID', deliveryStatus: { not: 'CANCELLED' }, ...excludeTopup() } }),
    ])

    const totalRevenue = Number(revenueAgg._sum.amount ?? 0)
    const todayTopup = { cents: topupAgg._sum.topupDeltaCents ?? 0, count: topupAgg._count._all }
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
      todo: { processing: processingOrders, unpaid: unpaidOrders },
      recentOrders: recentOrders.map((o) => ({ ...o, source: sourceOf(srcMap, o.tenantId) })),
    })
  } catch (err) {
    console.error('Get stats error:', err)
    return error('获取统计数据失败')
  }
}
