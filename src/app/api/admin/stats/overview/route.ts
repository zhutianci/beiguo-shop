export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { excludeTopup } from '@/lib/order-scope'
import { toCents } from '@/lib/money'
import { profitCounted } from '@/lib/referral-report'
import { buildOverview, overviewWindow, parseOverviewDays } from '@/lib/admin/overview'

// 站内订单派生进 ExternalOrder 的批次（买家申请票据 / 后台置已完成时 upsert）：流水已在站内订单里计过，这里排除
const SHOP_BATCHES = ['SHOP', 'WEB']

/**
 * 仪表盘「经营概览」：近 7 / 30 / 90 天逐日的流水、利润、成交单数，加上一期合计（环比）与商品流水排行。
 * 口径与聚合都在 lib/admin/overview.ts；这里只取数。三张表都只取聚合要用的几列、都走时间索引，
 * 90 天窗口（取 180 天）在现在的数据量下是几千行。
 */
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const days = parseOverviewDays(new URL(request.url).searchParams.get('days'))
    const now = new Date()
    const w = overviewWindow(days, now)

    const [orders, cards, externals] = await Promise.all([
      // 命中 @@index([payStatus, paidAt])
      prisma.order.findMany({
        where: {
          payStatus: 'PAID',
          deliveryStatus: { not: 'CANCELLED' },
          paidAt: { gte: w.from, lt: w.to },
          ...excludeTopup(),
        },
        select: { paidAt: true, amount: true, productName: true },
      }),
      // 命中 @@index([status, usedAt])；只读利润与归属订单，不碰 content（绝不解密）
      prisma.cardKey.findMany({
        where: { status: 'USED', usedAt: { gte: w.from, lt: w.to } },
        select: { usedAt: true, profit: true, orderId: true },
      }),
      prisma.externalOrder.findMany({
        where: {
          startDate: { gte: w.extFrom, lte: w.extTo },
          // NOT IN 会把 NULL 行一起漏掉，必须显式写「为空 OR 不在名单里」（同 api/admin/analytics/orders）
          OR: [{ importBatch: null }, { importBatch: { notIn: SHOP_BATCHES } }],
        },
        select: { startDate: true, quote: true, cost: true, profit: true },
      }),
    ])

    // 已取消 / 已退款订单的卡不计利润（lib/referral-report.profitCounted）；查不到订单的按正常计
    const oids = Array.from(new Set(cards.map((c) => c.orderId).filter((x): x is number => x != null)))
    const voidOrders = new Set<number>()
    for (let i = 0; i < oids.length; i += 1000) {
      const os = await prisma.order.findMany({
        where: { id: { in: oids.slice(i, i + 1000) } },
        select: { id: true, payStatus: true, deliveryStatus: true },
      })
      for (const o of os) if (!profitCounted(o)) voidOrders.add(o.id)
    }

    const cents = (v: { toString(): string } | null) => (v == null ? null : toCents(v.toString()))
    return success(
      buildOverview(days, now, {
        orders: orders.map((o) => ({ paidAt: o.paidAt, amountCents: toCents(o.amount.toString()), productName: o.productName })),
        cards: cards.map((c) => ({
          usedAt: c.usedAt,
          profitCents: cents(c.profit),
          voided: c.orderId != null && voidOrders.has(c.orderId),
        })),
        externals: externals.map((e) => ({
          startDate: e.startDate,
          quoteCents: cents(e.quote),
          costCents: cents(e.cost),
          profitCents: cents(e.profit),
        })),
      })
    )
  } catch (err) {
    console.error('Get stats overview error:', err)
    return error('获取经营概览失败')
  }
}
