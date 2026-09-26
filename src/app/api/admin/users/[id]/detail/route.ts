export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { referralOrderIdOf } from '@/lib/balance'
import { adminOrResponse, parseTenantFilter, INVALID_TENANT_FILTER, siteOptions, sourceMap, sourceOf } from '@/lib/admin/source-site'
import { shopOrderSourceKey } from '@/lib/order-invoice'
import { orderIdFromSourceKey } from '@/lib/order-link'

// 每个区块自带分页，避免大户一次拉爆
function readPager(sp: URLSearchParams, pageKey: string, sizeKey: string, defSize = 10) {
  const page = Math.max(parseInt(sp.get(pageKey) || '1') || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(sp.get(sizeKey) || String(defSize)) || defSize, 1), 50)
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}

function num(v: unknown): number {
  return v == null ? 0 : Number(v)
}

// 用户全景详情：基础信息 + 统计 + 订单 / 付款 / 余额流水 / 绑定账户 / 内推
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 中间件之外再验一次（CVE-2025-29927：带特定请求头可整个跳过 middleware）；渠道 Host → 404
  const auth = await adminOrResponse()
  if ('res' in auth) return auth.res

  try {
    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) return notFound('用户不存在')

    const { searchParams } = new URL(request.url)
    const orderPager = readPager(searchParams, 'orderPage', 'orderPageSize')
    const payPager = readPager(searchParams, 'payPage', 'payPageSize')
    const balancePager = readPager(searchParams, 'balancePage', 'balancePageSize')
    // 按站分 tab（设计 12.2）：site=<tenantId> 时订单 / 付款两块只看该站；不传 = 全部（与原来一致）
    const site = parseTenantFilter(searchParams, 'site')
    if (site === 'invalid') return error(INVALID_TENANT_FILTER)
    const orderWhere = site == null ? { userId } : { userId, tenantId: site }

    const [
      user,
      orders,
      orderTotal,
      payments,
      payTotal,
      balanceLogs,
      balanceTotal,
      boundAccounts,
      paidCount,
      deliveredCount,
      paidAmountAgg,
      referralPriceCount,
      referrerBasePriceCount,
      rewardAgg,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          phone: true,
          nickname: true,
          avatar: true,
          balance: true,
          vipLevel: true,
          role: true,
          status: true,
          referralCode: true,
          registeredTenantId: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: orderWhere,
        select: {
          id: true,
          tenantId: true,
          orderNo: true,
          productName: true,
          quantity: true,
          amount: true,
          payMethod: true,
          payStatus: true,
          deliveryStatus: true,
          createdAt: true,
          paidAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: orderPager.skip,
        take: orderPager.take,
      }),
      prisma.order.count({ where: orderWhere }),
      prisma.payment.findMany({
        where: { order: orderWhere },
        select: {
          id: true,
          tradeNo: true,
          payMethod: true,
          amount: true,
          status: true,
          createdAt: true,
          order: { select: { orderNo: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: payPager.skip,
        take: payPager.take,
      }),
      prisma.payment.count({ where: { order: orderWhere } }),
      prisma.balanceLog.findMany({
        where: { userId },
        select: {
          id: true,
          delta: true,
          balanceAfter: true,
          type: true,
          note: true,
          orderId: true,
          createdAt: true,
        },
        // id 兜底：同一秒写入的多条流水只按 createdAt 排序时顺序不稳定，翻页会重复/漏行
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: balancePager.skip,
        take: balancePager.take,
      }),
      prisma.balanceLog.count({ where: { userId } }),
      prisma.userAccount.findMany({
        where: { userId },
        select: {
          id: true,
          accountEmail: true,
          platform: true,
          label: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      // 已付款订单数 / 累计付款都排除「已付款 + 已取消」（线下退款的惯例做法，钱已退回）
      prisma.order.count({ where: { userId, payStatus: 'PAID', deliveryStatus: { not: 'CANCELLED' } } }),
      prisma.order.count({ where: { userId, deliveryStatus: 'DELIVERED' } }),
      prisma.order.aggregate({
        where: { userId, payStatus: 'PAID', deliveryStatus: { not: 'CANCELLED' } },
        _sum: { amount: true },
      }),
      prisma.referralPrice.count({ where: { userId } }),
      prisma.referrerBasePrice.count({ where: { userId } }),
      prisma.referralReward.aggregate({
        where: { referrerId: userId, status: 'SETTLED' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ])

    if (!user) return notFound('用户不存在')

    const pageInfo = (total: number, p: { page: number; pageSize: number }) => ({
      total,
      page: p.page,
      pageSize: p.pageSize,
      totalPages: Math.max(Math.ceil(total / p.pageSize), 1),
    })

    const sites = await siteRelations(userId, user.registeredTenantId)
    const regSrc = sourceOf(await sourceMap([user.registeredTenantId]), user.registeredTenantId)
    const orderSrc = await sourceMap(orders.map((o) => o.tenantId))

    return success({
      user: { ...user, balance: num(user.balance), registeredTenant: regSrc },
      /** 按站分 tab：每个与该用户有关的站一项（订单 / 卡密 / 发票 / 收据 / 留言计数、客户关系、成员身份） */
      sites,
      site: site ?? null,
      siteOptions: await siteOptions(),
      stats: {
        orderCount: orderTotal,
        paidOrderCount: paidCount,
        deliveredOrderCount: deliveredCount,
        totalPaidAmount: num(paidAmountAgg._sum.amount),
        balance: num(user.balance),
        referralRewardTotal: num(rewardAgg._sum.amount),
        boundAccountCount: boundAccounts.length,
      },
      orders: {
        list: orders.map((o) => ({ ...o, amount: num(o.amount), source: sourceOf(orderSrc, o.tenantId) })),
        ...pageInfo(orderTotal, orderPager),
      },
      payments: {
        list: payments.map((p) => ({
          id: p.id,
          tradeNo: p.tradeNo,
          orderNo: p.order?.orderNo ?? null,
          payMethod: p.payMethod,
          amount: num(p.amount),
          status: p.status,
          createdAt: p.createdAt,
        })),
        ...pageInfo(payTotal, payPager),
      },
      balanceLogs: {
        // orderId：REFERRAL 流水对应的站内订单（新流水读列，历史流水从 note 解析），前端据此展示「关联订单」
        list: balanceLogs.map((b) => ({
          id: b.id,
          delta: num(b.delta),
          balanceAfter: num(b.balanceAfter),
          type: b.type,
          note: b.note,
          createdAt: b.createdAt,
          orderId: referralOrderIdOf(b),
        })),
        ...pageInfo(balanceTotal, balancePager),
      },
      boundAccounts,
      referral: {
        referralCode: user.referralCode,
        referralPriceCount,
        referrerBasePriceCount,
        rewardCount: rewardAgg._count._all,
        rewardTotal: num(rewardAgg._sum.amount),
      },
    })
  } catch (err) {
    console.error('Get user detail error:', err)
    return error('获取用户详情失败')
  }
}

/**
 * 用户与各站的关系（设计 12.2「详情按站分 tab」、6.2「全局禁用弹窗列出影响范围」）。
 * 超管侧全字段：渠道备注与标签、平台备注、拉黑（含操作方与原因）、joinedVia、成员身份。
 * 计数只算该站的数据：订单按 Order.tenantId；卡密经订单；发票 / 收据按「挂在该站的哪张订单上」归站；留言经订单。
 * 主站注册、从未下单的普通用户只有一项「主站」。
 *
 * 发票 / 收据挂到订单的线索与 lib/order-link 同口径（shop_order_id ∪ 外部订单行的 shopOrderId / sourceKey ∪ 票据上的 sourceKey 快照）：
 * shop_order_id 是渠道分站新加的列、**零回填**，存量主站票据该列为空，只按它数会让「主站」tab 的发票 / 收据恒为 0（终审部署 #12）。
 */
async function billsPerSite(
  kind: 'invoice' | 'receipt',
  orderIds: number[],
  extToOrder: Map<number, number>,
  tOf: Map<number, number>,
): Promise<Map<number, number>> {
  const keys = orderIds.map(shopOrderSourceKey)
  const extIds = Array.from(extToOrder.keys())
  const where = {
    OR: [{ shopOrderId: { in: orderIds } }, ...(extIds.length ? [{ externalOrderId: { in: extIds } }] : []), { sourceKey: { in: keys } }],
  }
  const select = { id: true, shopOrderId: true, externalOrderId: true, sourceKey: true } as const
  const rows = kind === 'invoice' ? await prisma.invoice.findMany({ where, select }) : await prisma.receipt.findMany({ where, select })
  const out = new Map<number, number>()
  for (const r of rows) {
    const oid =
      (r.shopOrderId != null && tOf.has(r.shopOrderId) ? r.shopOrderId : null) ??
      (r.externalOrderId != null ? extToOrder.get(r.externalOrderId) ?? null : null) ??
      orderIdFromSourceKey(r.sourceKey)
    const tid = oid != null ? tOf.get(oid) : undefined
    if (tid != null) out.set(tid, (out.get(tid) ?? 0) + 1)
  }
  return out
}

async function siteRelations(userId: number, registeredTenantId: number) {
  const [orders, customers, members] = await Promise.all([
    prisma.order.findMany({ where: { userId }, select: { id: true, tenantId: true, payStatus: true, deliveryStatus: true, amount: true } }),
    prisma.tenantCustomer.findMany({
      where: { userId },
      select: {
        tenantId: true,
        publicNo: true,
        joinedVia: true,
        firstOrderAt: true,
        lastOrderAt: true,
        blockedAt: true,
        blockedBy: true,
        blockedByKind: true,
        blockReason: true,
        note: true,
        platformNote: true,
        tags: true,
        createdAt: true,
      },
    }),
    prisma.tenantMember.findMany({ where: { userId }, select: { tenantId: true, role: true, status: true, createdAt: true } }),
  ])
  const orderIds = orders.map((o) => o.id)
  const tOf = new Map(orders.map((o) => [o.id, o.tenantId]))
  const extToOrder = new Map<number, number>()
  if (orderIds.length) {
    const exts = await prisma.externalOrder.findMany({
      where: { OR: [{ shopOrderId: { in: orderIds } }, { sourceKey: { in: orderIds.map(shopOrderSourceKey) } }] },
      select: { id: true, shopOrderId: true, sourceKey: true },
    })
    for (const e of exts) {
      const oid = e.shopOrderId ?? orderIdFromSourceKey(e.sourceKey)
      if (oid != null && tOf.has(oid)) extToOrder.set(e.id, oid)
    }
  }
  const [cards, invoices, receipts, messages] = orderIds.length
    ? await Promise.all([
        prisma.cardKey.groupBy({ by: ['orderId'], where: { orderId: { in: orderIds }, status: 'USED' }, _count: { _all: true } }),
        billsPerSite('invoice', orderIds, extToOrder, tOf),
        billsPerSite('receipt', orderIds, extToOrder, tOf),
        prisma.orderMessage.groupBy({ by: ['orderId'], where: { orderId: { in: orderIds } }, _count: { _all: true } }),
      ])
    : [[], new Map<number, number>(), new Map<number, number>(), []]
  const ids = new Set<number>([registeredTenantId, ...orders.map((o) => o.tenantId), ...customers.map((c) => c.tenantId), ...members.map((m) => m.tenantId)])
  const srcMap = await sourceMap(ids)
  const out = Array.from(ids)
    .sort((a, b) => a - b)
    .map((tid) => {
      const os = orders.filter((o) => o.tenantId === tid)
      const paid = os.filter((o) => o.payStatus === 'PAID' && o.deliveryStatus !== 'CANCELLED')
      const c = customers.find((x) => x.tenantId === tid) ?? null
      const m = members.find((x) => x.tenantId === tid) ?? null
      return {
        ...sourceOf(srcMap, tid),
        isRegistered: tid === registeredTenantId,
        orderCount: os.length,
        paidOrderCount: paid.length,
        paidAmount: Math.round(paid.reduce((s, o) => s + Number(o.amount) * 100, 0)) / 100,
        cardCount: cards.filter((g) => g.orderId != null && tOf.get(g.orderId) === tid).reduce((s, g) => s + g._count._all, 0),
        invoiceCount: invoices.get(tid) ?? 0,
        receiptCount: receipts.get(tid) ?? 0,
        messageCount: messages.filter((g) => tOf.get(g.orderId) === tid).reduce((s, g) => s + g._count._all, 0),
        customer: c
          ? {
              ...c,
              customerNo: c.publicNo,
              blocked: c.blockedAt != null,
              // 操作方：渠道设的拉黑显示「渠道」，平台设的显示「平台」（W4-8）
              blockedByLabel: c.blockedAt == null ? null : c.blockedByKind === 'PLATFORM' ? '平台' : '渠道',
            }
          : null,
        member: m,
      }
    })
  return out
}
