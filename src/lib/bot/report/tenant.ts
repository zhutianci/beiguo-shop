/**
 * 分站群日报（TENANT，渠道视角）的取数，以及主站 / 分站共用的「按站」取数（docs/微信机器人-设计.md §6.3、§6.4、§6.5 第 7 条）。
 * 指令「今日 / 昨日 / 日报」在分站群里用的也是这里（commands/report.ts 传 ctx.scopeTenantId）。只读。
 *
 * 【分站隔离】每个函数第一个参数是站点 id（参数里显式带分站范围，边界检查 B4 的要求），所有查询都带 tenant_id = 它。
 * 分站日报绝不出现：站长的进货成本、卡差价、站长利润、别的分站的任何数字、买家邮箱（附录 B 第 3 条）——
 * TenantReport 这个类型里就没有这些字段。收益与余额只经 partner-facade：
 *   收益 = 窗口内付款（PAID / REFUNDED）的本站订单逐单 orderSettlementViewsForPartner 求和——与渠道后台首页「今日」块
 *          同一套视图（partner-services/dashboard.ts），只是把「今日 0 点之后」换成精确的 [开始, 结束)；
 *   余额 = balancesForPartner（即 tenant/balances.ts 的 computeBalances，按渠道 DTO 裁剪），是查询那一刻的值（零点日报 ≈ 00:00）。
 * 本文件不 import 任何站长侧模块（admin/*、referral-report、jiema、channel-profit*）；main.ts 反过来用这里的「按站」函数算主站。
 *
 * 【与 §6.3 的偏差】§6.3 列了「主站老用户首次在本站下单（tenant_customers.joined_via = 'ORDER'）」，这里不给分站：
 * joined_via 在渠道层是刻意不给的字段（partner-services/customers.ts：「ORDER 即暗示他站已有账号」），分站群只给「新注册客户」。
 *
 * 【口径】（与 §6.2 相同，只是 tenant_id = 本站）
 *  - 订单类一律排除余额充值载体单（order-scope.excludeTopup）；成交 = paid_at ∈ 窗口且 pay_status ∈ (PAID, REFUNDED)；
 *    成交额 = Σ amount（不含税；渠道单就是渠道售价）；下单 = created_at ∈ 窗口（含未付款）。
 *  - 流量：page_views 的 day_key ∈ 窗口覆盖的北京日期且 tenant_id = 本站；访客 = COUNT(DISTINCT viewer_key)（与后台流量分析同一写法，
 *    去重留在库里做，不把 viewer_key 拉回 Node）；新访客 = visitors.first_seen ∈ 窗口（不超过访客数，同 analytics/traffic 路由）。
 *  - 查询都落在索引上：orders (tenant_id, created_at)、(pay_status, paid_at)；page_views (tenant_id, day_key)；visitors (tenant_id, first_seen)。
 *  - 同一份报表的查询并发 ≤ 4（分批 Promise.all），服务器只有 1.8G。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '../../db'
import { toCents } from '../../money'
import { excludeTopup } from '../../order-scope'
import { getTenantBrand } from '../../tenant/brand'
import { balancesForPartner, orderSettlementViewsForPartner } from '../../tenant/partner-facade'
import type { CompareRow, OrderBlock, TenantReport, TrafficBlock } from './text'
import type { ReportSpan, ReportWindow } from './window'

const PAID_STATES = ['PAID', 'REFUNDED'] as const
/** partner-facade 每次最多接 100 个订单号（与渠道后台看板同样分批） */
const VIEW_CHUNK = 100
/** 一个窗口最多统计这么多张已付单的收益（远超单个分站一个月的单量；到上限记日志，数字偏小） */
const MAX_PAID_ORDERS = 20_000

/** Decimal / 字符串 / 数字（元）→ 分；空值 → 0 */
export function centsOf(v: unknown): number {
  return v == null ? 0 : toCents(String(v))
}

/** 窗口内下单（含未付款）。excludeUserId：主站排除提卡专用账号（§8.7） */
export function createdWhere(tenantId: number, w: ReportSpan, excludeUserId: number | null = null): Prisma.OrderWhereInput {
  return {
    AND: [{ tenantId, createdAt: { gte: w.start, lt: w.end }, ...(excludeUserId ? { userId: { not: excludeUserId } } : {}) }, excludeTopup()],
  }
}

/** 窗口内付款（成交）：paid_at ∈ 窗口且 pay_status ∈ (PAID, REFUNDED) */
export function paidWhere(tenantId: number, w: ReportSpan): Prisma.OrderWhereInput {
  return { AND: [{ tenantId, payStatus: { in: [...PAID_STATES] }, paidAt: { gte: w.start, lt: w.end } }, excludeTopup()] }
}

/** 访客数（COUNT DISTINCT 留在库里做） */
export async function siteUv(tenantId: number, dayFrom: string, dayTo: string): Promise<number> {
  const rows = await prisma.$queryRaw<{ uv: unknown }[]>`
    SELECT COUNT(DISTINCT viewer_key) AS uv FROM page_views
     WHERE tenant_id = ${tenantId} AND day_key BETWEEN ${dayFrom} AND ${dayTo}`
  return Number(rows[0]?.uv ?? 0) || 0
}

/** 流量块（4 条查询并发） */
export async function siteTraffic(tenantId: number, w: ReportSpan): Promise<TrafficBlock> {
  const dayWhere = { tenantId, dayKey: { gte: w.dayFrom, lte: w.dayTo } }
  const [pvuv, fresh, bySource, byDevice] = await Promise.all([
    prisma.$queryRaw<{ pv: unknown; uv: unknown }[]>`
      SELECT COUNT(*) AS pv, COUNT(DISTINCT viewer_key) AS uv FROM page_views
       WHERE tenant_id = ${tenantId} AND day_key BETWEEN ${w.dayFrom} AND ${w.dayTo}`,
    prisma.visitor.count({ where: { tenantId, firstSeen: { gte: w.start, lt: w.end } } }),
    prisma.pageView.groupBy({ by: ['source'], where: dayWhere, _count: { _all: true } }),
    prisma.pageView.groupBy({ by: ['device'], where: dayWhere, _count: { _all: true } }),
  ])
  const pv = Number(pvuv[0]?.pv ?? 0) || 0
  const uv = Number(pvuv[0]?.uv ?? 0) || 0
  return {
    pv,
    uv,
    // 同 analytics/traffic 路由：历史补写、时钟回拨会让新访客偶尔超过访客，钳住
    newVisitors: Math.min(fresh, uv),
    sources: bySource.map((s) => ({ source: s.source, pv: s._count._all })).sort((a, b) => b.pv - a.pv || a.source.localeCompare(b.source)),
    mobilePv: byDevice.find((d) => d.device === 'mobile')?._count._all ?? 0,
  }
}

/** 成交单数与成交额（对比窗口用；1 条查询） */
export async function sitePaidTotals(tenantId: number, w: ReportSpan): Promise<{ paid: number; amountCents: number }> {
  const agg = await prisma.order.aggregate({ where: paidWhere(tenantId, w), _count: { _all: true }, _sum: { amount: true } })
  return { paid: agg._count._all, amountCents: centsOf(agg._sum.amount) }
}

/**
 * 订单块（4 + 1 条查询）。excludeUserId = 提卡专用账号：它的单只计入成交单数、成交额（§8.7），
 * 不计入下单数 / 下单人数 / 支付转化 / 取消 / 仍未付款 / 退款，成交人数也不算它（它不是真买家）。
 */
export async function siteOrders(tenantId: number, w: ReportSpan, excludeUserId: number | null = null): Promise<OrderBlock> {
  const cw = createdWhere(tenantId, w, excludeUserId)
  const pw = paidWhere(tenantId, w)
  const notIssue: Prisma.OrderWhereInput = excludeUserId ? { userId: { not: excludeUserId } } : {}
  const [byState, createdUsers, refunded, paidAgg] = await Promise.all([
    // 一次分组拿到下单数、已付、取消、仍未付款
    prisma.order.groupBy({ by: ['payStatus', 'deliveryStatus'], where: cw, _count: { _all: true } }),
    prisma.order.groupBy({ by: ['userId'], where: cw, _count: { _all: true } }),
    // 退款：没有退款时间列，按最后更新时间近似（§6.2）
    prisma.order.count({ where: { AND: [{ tenantId, payStatus: 'REFUNDED', updatedAt: { gte: w.start, lt: w.end } }, notIssue, excludeTopup()] } }),
    prisma.order.aggregate({ where: pw, _count: { _all: true }, _sum: { amount: true, invoiceTaxFee: true } }),
  ])
  const paidUsers = await prisma.order.groupBy({ by: ['userId'], where: { AND: [pw, notIssue] }, _count: { _all: true } })
  let created = 0
  let createdPaid = 0
  let cancelled = 0
  let unpaid = 0
  for (const g of byState) {
    const n = g._count._all
    created += n
    if (g.payStatus === 'PAID' || g.payStatus === 'REFUNDED') createdPaid += n
    else if (g.deliveryStatus === 'CANCELLED') cancelled += n
    else unpaid += n
  }
  return {
    created,
    createdUsers: createdUsers.length,
    createdPaid,
    cancelled,
    unpaid,
    refunded,
    paid: paidAgg._count._all,
    paidUsers: paidUsers.length,
    amountCents: centsOf(paidAgg._sum.amount),
    taxCents: centsOf(paidAgg._sum.invoiceTaxFee),
  }
}

function assertChannel(tenantId: number): void {
  if (!Number.isInteger(tenantId) || tenantId < 2) throw new Error(`[bot] 分站日报的分站 id 非法：${tenantId}`)
}

/** 收益：窗口内付款的本站订单逐单结算视图之和（partner-facade，每次 ≤ 100 单，串行） */
async function tenantIncome(tenantId: number, w: ReportSpan): Promise<TenantReport['income']> {
  const sum = { goodsCents: 0, purchaseCents: 0, invShareCents: 0, feeCents: 0, otherCents: 0, balanceCents: 0, payoutCents: 0 }
  const rows = await prisma.order.findMany({ where: paidWhere(tenantId, w), select: { orderNo: true }, orderBy: { id: 'asc' }, take: MAX_PAID_ORDERS })
  if (rows.length === MAX_PAID_ORDERS) console.warn(`[bot] 分站日报收益统计达到上限 ${MAX_PAID_ORDERS} 单（tenant=${tenantId}），数字可能偏小`)
  for (let i = 0; i < rows.length; i += VIEW_CHUNK) {
    const views = await orderSettlementViewsForPartner(
      tenantId,
      rows.slice(i, i + VIEW_CHUNK).map((r) => r.orderNo)
    )
    views.forEach((v) => {
      sum.goodsCents += v.goodsCents
      sum.purchaseCents += v.purchaseCents
      sum.invShareCents += v.invShareCents
      sum.feeCents += v.feeCents
      sum.otherCents += v.otherCents
      sum.balanceCents += v.balanceCents
      sum.payoutCents += v.payoutCents
    })
  }
  return sum
}

export interface TenantReportOptions {
  /** 补看历史（指令里的昨日 / 日报 <日期>）：余额、待办是当前值，回复里注明 */
  historical?: boolean
}

/** 一个分站在一个窗口里的分站日报指标。同一分站被几个群绑定时，调用方只调一次 */
export async function collectTenantReport(tenantId: number, w: ReportWindow, opts: TenantReportOptions = {}): Promise<TenantReport> {
  assertChannel(tenantId)
  const brand = await getTenantBrand(tenantId)

  // 第 1 批：流量统计起始日、新注册、热销、未读留言
  const [first, registered, top, unreadMessages] = await Promise.all([
    // 本站流量数据的第一天：(tenant_id, day_key) 索引上取第一行；没有 = 埋点开关还没打开（§6.5）
    prisma.pageView.findFirst({ where: { tenantId }, orderBy: { dayKey: 'asc' }, select: { dayKey: true } }),
    prisma.user.count({ where: { registeredTenantId: tenantId, createdAt: { gte: w.start, lt: w.end } } }),
    prisma.order.groupBy({
      by: ['productName'],
      where: paidWhere(tenantId, w),
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 3,
    }),
    // 与渠道后台首页待办同口径（partner-services/dashboard.ts）：本站买家留言里渠道未读的条数
    prisma.orderMessage.count({ where: { sender: 'BUYER', readByTenant: false, order: { tenantId } } }),
  ])
  // 第 2 批：流量（4 条并发；还没有任何流量数据就不查）
  const traffic = first ? await siteTraffic(tenantId, w) : null
  // 第 3 批：订单（4 + 1）
  const orders = await siteOrders(tenantId, w, null)
  // 第 4 批：售后、自动下架、对比。分站只比「较前一日」（§6.3）；今日比「较昨日同时段」；本周 / 本月分站群不开放
  const cmp = w.kind === 'day' || w.kind === 'today' ? w.compares[0] : null
  const [afterSales, autoDelisted, prev] = await Promise.all([
    prisma.tenantAfterSale.count({ where: { tenantId, status: 'PENDING' } }),
    prisma.tenantListing.count({ where: { tenantId, granted: true, status: 0, delistedReason: { not: null } } }),
    cmp ? sitePaidTotals(tenantId, cmp) : Promise.resolve(null),
  ])
  // 第 5 批：收益（串行分块）与余额
  const income = await tenantIncome(tenantId, w)
  let balances: TenantReport['balances'] = null
  try {
    const b = await balancesForPartner(tenantId)
    balances = { availableCents: b.available.balanceCents, availablePayoutCents: b.available.payoutCents, pendingCents: b.pending.balanceCents }
  } catch (e) {
    console.error(`[bot] 分站日报读余额失败（tenant=${tenantId}），这一块不显示`, (e as Error)?.message)
  }

  const compares: CompareRow[] = cmp && prev ? [{ label: cmp.label, paid: prev.paid, amountCents: prev.amountCents, uv: null }] : []

  return {
    siteName: brand.name,
    window: w,
    historical: !!opts.historical,
    traffic,
    trafficSince: first?.dayKey ?? null,
    registered,
    orders,
    income,
    balances,
    top: top.map((t) => ({ name: t.productName, qty: t._sum.quantity ?? 0 })),
    todo: { unreadMessages, afterSales, autoDelisted },
    compares,
  }
}
