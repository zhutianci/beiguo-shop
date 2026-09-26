/**
 * 渠道后台：看板（WP6，设计 10.8、12.1）。
 *
 * 【三个时间段】今日 / 近 7 日 / 本月（东八区自然日、自然月），按**付款时间**统计本渠道已付订单（含之后退款的）。
 * 每段给：订单数、货款、进货款、发票分成、手续费、余额、预计打款。金额**全部经 partner-facade 的
 * orderSettlementViewsForPartner**（WP3）按单取结算快照再求和——与结算中心、订单明细同一口径（冲销后剩余值），
 * 本文件不自己推公式、不读账本表（边界检查规则 3：渠道层只能经 facade）。
 * 【余额】冻结中 / 可结算两组三个数直接用 balancesForPartner（设计 10.8）。
 *  **只给有 finance.read 的人**（opts.withFinance，由 handler 按 partnerRoute 同一口径判定）：设计 6.1 里
 *  dashboard.read 可授予 STAFF，而渠道账户级的余额 / 结算中 / 累计打款 / 可申请结算属于 finance.read（仅 OWNER）。
 *  没有时 balances 与 todo.canApply 为 null，且根本不调 balancesForPartner / lastRequestAt（不查就不会漏）。
 *  三个时间段里的「余额 / 预计打款」同样只给有 finance.read 的人（主会话 D5，最小权限）：虽然它们只是本段订单
 *  结算快照之和，但汇总后与账户余额同量级、容易被当作「渠道能拿多少钱」，STAFF 不需要；没有时这两项为 null。
 *  订单数、货款、进货款、发票分成、手续费照常给（与订单详情里 order.read 可见的成分同口径）。
 * 【待办】未读买家留言、待处理售后申请、被系统自动下架的商品、「可申请结算」提示（只是提示；真正的前置条件由出单函数判定）。
 */
import { prisma } from '../db'
import { balancesForPartner, lastRequestAt, orderSettlementViewsForPartner } from '../tenant/partner-facade'
import type { OrderSettlementView, TenantBalances } from '../tenant/types'
import { assertTenantId } from './_scope'
import { PARTNER_ORDER_LIST_SELECT, PARTNER_TENANT_SELECT } from './selects'
import { cnDayStart, cnMonthStart } from './orders'

export interface PeriodStats {
  orders: number
  goodsCents: number
  purchaseCents: number
  invShareCents: number
  feeCents: number
  /** 无 finance.read 时为 null（D5） */
  balanceCents: number | null
  /** 无 finance.read 时为 null（D5） */
  payoutCents: number | null
}

export interface PartnerDashboard {
  today: PeriodStats
  d7: PeriodStats
  month: PeriodStats
  /** 无 finance.read 时为 null（见文件头） */
  balances: TenantBalances | null
  /** canApply：无 finance.read 时为 null */
  todo: { unreadMessages: number; pendingAfterSales: number; autoDelisted: number; canApply: boolean | null }
  topProducts: { name: string; qty: number }[]
}

/** 一次最多给 facade 传多少个单号（facade 每次最多接受 100 个；一个月的单量可能上千，分批取） */
const VIEW_CHUNK = 100
/** 看板只统计最近这么多张已付单（远超 P0 单店月单量；超出时本月数字偏小并在日志告警） */
const MAX_PERIOD_ORDERS = 20_000

function emptyStats(): PeriodStats {
  return { orders: 0, goodsCents: 0, purchaseCents: 0, invShareCents: 0, feeCents: 0, balanceCents: 0, payoutCents: 0 }
}

function addView(s: PeriodStats, v: OrderSettlementView | undefined): void {
  if (!v) return
  s.goodsCents += v.goodsCents
  s.purchaseCents += v.purchaseCents
  s.invShareCents += v.invShareCents
  s.feeCents += v.feeCents
  s.balanceCents = (s.balanceCents ?? 0) + v.balanceCents
  s.payoutCents = (s.payoutCents ?? 0) + v.payoutCents
}

/** D5：没有 finance.read 时把时段里的「余额 / 预计打款」置 null（算是在内存里算了，但不出服务端） */
function stripFinance(s: PeriodStats): PeriodStats {
  return { ...s, balanceCents: null, payoutCents: null }
}

export async function partnerDashboard(
  tenantId: number,
  opts: { withFinance: boolean },
  now: Date = new Date(),
): Promise<PartnerDashboard> {
  assertTenantId(tenantId)
  const todayStart = cnDayStart(now)
  const d7Start = new Date(todayStart.getTime() - 6 * 24 * 3600_000)
  const monthStart = cnMonthStart(now)
  const earliest = d7Start < monthStart ? d7Start : monthStart

  const paidWhere = { tenantId, payStatus: { in: ['PAID' as const, 'REFUNDED' as const] }, paidAt: { gte: earliest } }
  const orders = await prisma.order.findMany({
    where: paidWhere,
    select: PARTNER_ORDER_LIST_SELECT,
    orderBy: { paidAt: 'desc' },
    take: MAX_PERIOD_ORDERS,
  })
  if (orders.length === MAX_PERIOD_ORDERS) console.warn(`[partner] 看板统计单量达到上限 ${MAX_PERIOD_ORDERS}（tenant=${tenantId}），数字可能偏小`)

  const views = new Map<string, OrderSettlementView>()
  for (let i = 0; i < orders.length; i += VIEW_CHUNK) {
    const part = await orderSettlementViewsForPartner(
      tenantId,
      orders.slice(i, i + VIEW_CHUNK).map((o) => o.orderNo),
    )
    part.forEach((v, k) => views.set(k, v))
  }

  const today = emptyStats()
  const d7 = emptyStats()
  const month = emptyStats()
  orders.forEach((o) => {
    const at = o.paidAt ? o.paidAt.getTime() : 0
    const v = views.get(o.orderNo)
    if (at >= todayStart.getTime()) {
      today.orders++
      addView(today, v)
    }
    if (at >= d7Start.getTime()) {
      d7.orders++
      addView(d7, v)
    }
    if (at >= monthStart.getTime()) {
      month.orders++
      addView(month, v)
    }
  })

  const withFinance = opts.withFinance === true
  const [balances, unreadMessages, pendingAfterSales, autoDelisted, tenant, lastReq, top] = await Promise.all([
    withFinance ? balancesForPartner(tenantId) : Promise.resolve(null),
    prisma.orderMessage.count({ where: { sender: 'BUYER', readByTenant: false, order: { tenantId } } }),
    prisma.tenantAfterSale.count({ where: { tenantId, status: 'PENDING' } }),
    prisma.tenantListing.count({ where: { tenantId, granted: true, status: 0, delistedReason: { not: null } } }),
    withFinance ? prisma.tenant.findUnique({ where: { id: tenantId }, select: PARTNER_TENANT_SELECT }) : Promise.resolve(null),
    withFinance ? lastRequestAt(tenantId) : Promise.resolve(null),
    prisma.order.groupBy({
      by: ['productName'],
      where: { tenantId, payStatus: { in: ['PAID', 'REFUNDED'] }, paidAt: { gte: monthStart } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ])

  // 「可申请结算」只是提示：可结算预计打款达到最低结算额、不为负、未暂停结算、收款信息已设置、距上次申请已满间隔
  let canApply: boolean | null = withFinance ? false : null
  if (withFinance && tenant && balances) {
    const intervalOk = !lastReq || now.getTime() - lastReq.getTime() >= tenant.requestIntervalDays * 24 * 3600_000
    canApply =
      tenant.status !== 'TERMINATED' &&
      !balances.negative &&
      !tenant.payoutHold &&
      !!tenant.payeeAccountMasked &&
      balances.available.payoutCents > 0 &&
      balances.available.payoutCents >= tenant.minPayoutCents &&
      intervalOk
  }

  return {
    today: withFinance ? today : stripFinance(today),
    d7: withFinance ? d7 : stripFinance(d7),
    month: withFinance ? month : stripFinance(month),
    balances,
    todo: { unreadMessages, pendingAfterSales, autoDelisted, canApply },
    topProducts: top.map((g) => ({ name: g.productName, qty: g._sum.quantity ?? 0 })),
  }
}
