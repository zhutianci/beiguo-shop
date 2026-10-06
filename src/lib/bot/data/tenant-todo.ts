/**
 * 分站「待办」的取数（docs/微信机器人-设计.md 附录 E.5：iLink 分站绑定里代理自己查；分站群里管理员也能用）。
 *
 * 口径与渠道后台首页的待办一致（partner-services/dashboard.ts），代理在后台看到的数和这里对得上：
 *  · 未读留言：本站订单里买家发来、渠道还没读的留言（read_by_tenant = 0，按条数计）；列最近有留言的几单。
 *  · 售后申请：本站发起、站长还没处理的（tenant_after_sales PENDING）；先到的在前。
 *  · 自动下架：被系统下架的本站商品（granted、status 0、delisted_reason 非空）。
 * 另加一行「等站长发货」：本站已付款、处理中、要人工发货的单（同主站「待办」的待人工发货口径，按本站收窄），方便代理回答买家。
 * 只读；第一行 requireTenantScope：只接分站范围，主站范围直接抛错（主站用 todo.ts）。每个查询都带本站 tenant_id。
 * 留言预览是买家写的字：整段先过 sanitizeUserText（邮箱、手机号、疑似卡密打码，网址中性化）再截断。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../../db'
import { sanitizeUserText, truncate } from '../mask'
import { requireTenantScope, type BotScope } from './scope'
import { NOT_MANUAL_DELIVERY } from './todo'

export interface TenantTodoSnapshot {
  unread: { total: number; items: { orderNo: string; productName: string; unread: number; at: Date | null; preview: string }[] }
  afterSales: { total: number; items: { requestNo: string; kind: string; orderNo: string | null; at: Date }[] }
  delisted: { total: number; items: { name: string; reason: string | null }[] }
  awaitingShip: { total: number; oldestPaidAt: Date | null }
}

export async function tenantTodoSnapshot(scope: BotScope, limit = 3): Promise<TenantTodoSnapshot> {
  const tenantId = requireTenantScope(scope, '分站待办')
  const take = Math.min(Math.max(1, Math.trunc(limit)), 5)
  const unreadWhere: Prisma.OrderMessageWhereInput = { sender: 'BUYER', readByTenant: false, order: { tenantId } }
  const afterSaleWhere: Prisma.TenantAfterSaleWhereInput = { tenantId, status: 'PENDING' }
  const delistedWhere: Prisma.TenantListingWhereInput = { tenantId, granted: true, status: 0, delistedReason: { not: null } }
  const shipWhere: Prisma.OrderWhereInput = {
    AND: [{ tenantId, payStatus: 'PAID', deliveryStatus: 'PROCESSING' }, { product: { deliveryType: { notIn: NOT_MANUAL_DELIVERY } } }],
  }

  const [unreadTotal, unreadGroups, afterSaleTotal, afterSaleRows, delistedTotal, delistedRows, shipTotal, shipOldest] = await Promise.all([
    prisma.orderMessage.count({ where: unreadWhere }),
    prisma.orderMessage.groupBy({
      by: ['orderId'],
      where: unreadWhere,
      _count: { _all: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
      take,
    }),
    prisma.tenantAfterSale.count({ where: afterSaleWhere }),
    prisma.tenantAfterSale.findMany({ where: afterSaleWhere, orderBy: { createdAt: 'asc' }, take, select: { requestNo: true, kind: true, orderId: true, createdAt: true } }),
    prisma.tenantListing.count({ where: delistedWhere }),
    prisma.tenantListing.findMany({ where: delistedWhere, orderBy: { id: 'desc' }, take, select: { productId: true, delistedReason: true } }),
    prisma.order.count({ where: shipWhere }),
    prisma.order.findFirst({ where: shipWhere, orderBy: { paidAt: 'asc' }, select: { paidAt: true } }),
  ])

  // 订单号、商品名、最近一条未读留言——每个查询都再带一次本站 tenant_id（第二道）
  const msgOrderIds = unreadGroups.map((g) => g.orderId)
  const refOrderIds = Array.from(new Set([...msgOrderIds, ...afterSaleRows.map((a) => a.orderId).filter((x): x is number => x != null)]))
  const [refOrders, lastMsgs, products] = await Promise.all([
    refOrderIds.length ? prisma.order.findMany({ where: { id: { in: refOrderIds }, tenantId }, select: { id: true, orderNo: true, productName: true } }) : Promise.resolve([]),
    msgOrderIds.length
      ? prisma.orderMessage.findMany({ where: { ...unreadWhere, orderId: { in: msgOrderIds } }, orderBy: { id: 'desc' }, take: 30, select: { orderId: true, content: true } })
      : Promise.resolve([]),
    delistedRows.length ? prisma.product.findMany({ where: { id: { in: delistedRows.map((d) => d.productId) } }, select: { id: true, name: true } }) : Promise.resolve([]),
  ])
  const orderOf = new Map(refOrders.map((o) => [o.id, o]))
  const lastMsgOf = new Map<number, string>()
  lastMsgs.forEach((m) => {
    if (!lastMsgOf.has(m.orderId)) lastMsgOf.set(m.orderId, m.content)
  })
  const nameOf = new Map(products.map((p) => [p.id, p.name]))

  return {
    unread: {
      total: unreadTotal,
      items: unreadGroups
        .filter((g) => orderOf.has(g.orderId))
        .map((g) => {
          const o = orderOf.get(g.orderId)!
          const raw = lastMsgOf.get(g.orderId)
          return { orderNo: o.orderNo, productName: o.productName, unread: g._count._all, at: g._max.createdAt ?? null, preview: raw ? truncate(sanitizeUserText(raw), 30) : '' }
        }),
    },
    afterSales: {
      total: afterSaleTotal,
      items: afterSaleRows.map((a) => ({ requestNo: a.requestNo, kind: a.kind, orderNo: a.orderId != null ? orderOf.get(a.orderId)?.orderNo ?? null : null, at: a.createdAt })),
    },
    delisted: { total: delistedTotal, items: delistedRows.map((d) => ({ name: nameOf.get(d.productId) || `商品 #${d.productId}`, reason: d.delistedReason })) },
    awaitingShip: { total: shipTotal, oldestPaidAt: shipOldest?.paidAt ?? null },
  }
}
