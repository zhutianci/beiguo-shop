/**
 * 主站管理群日报（MGMT）的取数（docs/微信机器人-设计.md §6.2，口径逐行照那张表；附录 A「主站日报」；§8.7 提卡账号排除）。
 * 指令「今日 / 昨日 / 日报 / 本周 / 本月」在管理群与私聊里用的也是这里（commands/report.ts）。全部只读。
 *
 * 【范围】「主站」= orders.tenant_id = 1；订单类一律排除余额充值载体单（order-scope.excludeTopup，充值是预收款、不计营收）；
 * 成交 = paid_at ∈ 窗口且 pay_status ∈ (PAID, REFUNDED)（含之后退款的单）；金额不含税（Order.amount 永远不含税，发票税费另列）。
 * 「按站」的流量 / 订单取数与分站日报共用 report/tenant.ts 的函数（tenantId = 1）。
 *
 * 【提卡专用账号】（bot_config.issueUserId，§8.7）它的单只计入成交单数、成交额、利润、商品销量（热销）；
 * 不计入下单数、下单人数、支付转化、访客下单率、取消 / 仍未付款 / 退款、新注册、累计用户；成交人数也不算它（它不是真买家）。
 *
 * 【与后台数字的关系】（§6.2 末段）日报按付款时间、含后来退款的单，不承诺与后台某个页面逐项相等；每项口径写在取数处的注释里。
 *
 * 【资源】服务器只有 1.8G：能 count / aggregate / groupBy 的不拉明细；必须拉的（窗口内付款的订单 id、渠道单的利润列、接码定稿行）
 * 只取窄列并封顶；同一份报表的查询分批 Promise.all，每批 ≤ 4 条。
 */
import { prisma } from '../../db'
import { addBjDays, bjDateKey } from '../../marketing/time'
import { excludeTopup } from '../../order-scope'
import { settledReferralCents } from '../../referral-report'
import { summarizeFinance } from '../../jiema/report'
import { CHANNEL_PROFIT_ORDER_SELECT, channelProfitMap } from '../../admin/channel-profit-batch'
import { NOT_MANUAL_DELIVERY } from '../data/todo'
import { getTenantBrand } from '../../tenant/brand'
import { maskEmails, oneLine } from '../mask'
import { PLATFORM_SITE_LABEL } from '../route'
import { OFFLINE_MINUTES_KEEP_DAYS, readBotState } from '../state'
import { centsOf, paidWhere, siteOrders, sitePaidTotals, siteTraffic, siteUv } from './tenant'
import type { ChannelSummaryRow, CompareRow, MainReport } from './text'
import type { ReportSpan, ReportWindow } from './window'

/** 主站 = tenant_id 1（storefront PLATFORM_TENANT_ID） */
const MAIN_TENANT_ID = 1
/** IN 列表分块 */
const ID_CHUNK = 1000
/** channelProfitMap 每批的单数（它按 orderId 批量取卡密成本与接码成本） */
const PROFIT_CHUNK = 500
/** 必须拉明细的查询封顶（一个月的量也远小于它；到顶记日志，数字偏小） */
const MAX_ROWS = 20_000
const DAY_MS = 86400_000
/** 库存告警阈值：与付款时的库存提醒同一个（vmq.ts 发卡后 notifyLowStock 的 LOW_STOCK_THRESHOLD，默认 3） */
const lowStockThreshold = () => Number(process.env.LOW_STOCK_THRESHOLD || 3)

export interface MainReportOptions {
  /** 提卡专用账号的 users.id（bot_config.issueUserId）；null = 还没建，不排除 */
  issueUserId: number | null
  /** 补看历史（指令里的昨日 / 日报 <日期>）：待办等是当前值，回复里注明 */
  historical?: boolean
  /** 「当前值」类指标（到期、离线分钟的保留期）以它为准；缺省 = 现在 */
  now?: Date
}

function capWarn(what: string, n: number): void {
  if (n >= MAX_ROWS) console.warn(`[bot] 主站日报 ${what} 达到上限 ${MAX_ROWS} 行，数字可能偏小`)
}

/**
 * 利润 · 卡密利润：窗口内付款的主站单所发卡（status = USED）的 Σ card_keys.profit，扣这些单已结算的内推返现——
 * 与后台订单列表合计同一组条件（admin/orders/route.ts 合计部分：只数 USED 卡；profit IS NULL 的卡 SUM 不计；
 * 只对「有卡的单」扣 settledReferralCents）。有 profit IS NULL 的卡的单数单列（「另有 N 单利润未知」）。
 */
async function cardProfit(w: ReportSpan): Promise<{ cents: number; unknownOrders: number }> {
  const orders = await prisma.order.findMany({ where: paidWhere(MAIN_TENANT_ID, w), select: { id: true }, orderBy: { id: 'asc' }, take: MAX_ROWS })
  capWarn('卡密利润的订单', orders.length)
  const ids = orders.map((o) => o.id)
  let profitCents = 0
  let unknownOrders = 0
  const cardOrderIds: number[] = []
  for (let i = 0; i < ids.length; i += ID_CHUNK) {
    const chunk = ids.slice(i, i + ID_CHUNK)
    const [agg, withCards, nullProfit] = await Promise.all([
      prisma.cardKey.aggregate({ where: { orderId: { in: chunk }, status: 'USED' }, _sum: { profit: true } }),
      prisma.cardKey.groupBy({ by: ['orderId'], where: { orderId: { in: chunk }, status: 'USED' }, _count: { _all: true } }),
      prisma.cardKey.groupBy({ by: ['orderId'], where: { orderId: { in: chunk }, status: 'USED', profit: null }, _count: { _all: true } }),
    ])
    profitCents += centsOf(agg._sum.profit)
    for (const g of withCards) if (g.orderId != null) cardOrderIds.push(g.orderId)
    unknownOrders += nullProfit.length
  }
  let refCents = 0
  if (cardOrderIds.length) (await settledReferralCents(cardOrderIds)).forEach((v) => (refCents += v))
  return { cents: profitCents - refCents, unknownOrders }
}

/**
 * 利润 · 接码利润（预估）：lib/jiema/report.ts summarizeFinance 的定稿口径（接码后台概览、仪表盘、09:00 接码日报同一个函数），
 * 窗口内定稿或退款的单。接码成本会被 03:00–03:20 的对账事后修正（jiema/reconcile.ts），所以文本里标「预估」。
 */
async function jiemaProfit(w: ReportSpan): Promise<number> {
  const rows = await prisma.smsOrder.findMany({
    where: { OR: [{ costAt: { gte: w.start, lt: w.end } }, { refundedAt: { gte: w.start, lt: w.end } }] },
    select: { state: true, priceCents: true, chargedMicro: true, costCents: true, profitCents: true, lossCents: true, costFinal: true, costAt: true, refundedAt: true, refundTopupCents: true, refundCashCents: true },
    take: MAX_ROWS,
  })
  capWarn('接码定稿行', rows.length)
  return summarizeFinance(rows, w.start, w.end).profitCents
}

interface ChannelAcc {
  created: number
  paid: number
  amountCents: number
  ownerGoodsCents: number
  profitCents: number
  profitUnknown: number
  newCustomers: number
}

/**
 * 渠道汇总（§6.2「渠道汇总」「利润 · 渠道带来的站长利润」）：每个分站一行——下单 / 成交 / 成交额（渠道售价）/ 站长所得货款 /
 * 站长利润 / 新客户。站长所得货款与利润 = 窗口内付款的渠道单逐单 channelProfit()（lib/admin/channel-profit.ts；批量取数
 * channelProfitMap 与后台订单列表同一份），算不出的单（缺快照、成本未登记）单列不计。新客户 = tenant_customers.created_at ∈ 窗口
 * （在该站注册或首次在该站下单）。只发管理群：这里有站长成本与利润。
 */
async function channelBlock(w: ReportSpan): Promise<{ block: MainReport['channels']; profitCents: number; unknown: number }> {
  const [tenants, paidRows, createdBy, joinedBy] = await Promise.all([
    prisma.tenant.findMany({ where: { kind: 'CHANNEL' }, select: { id: true, code: true, status: true }, orderBy: { id: 'asc' } }),
    prisma.order.findMany({
      where: { AND: [{ tenantId: { not: MAIN_TENANT_ID }, payStatus: { in: ['PAID', 'REFUNDED'] }, paidAt: { gte: w.start, lt: w.end } }, excludeTopup()] },
      select: { ...CHANNEL_PROFIT_ORDER_SELECT, tenantId: true },
      orderBy: { id: 'asc' },
      take: MAX_ROWS,
    }),
    prisma.order.groupBy({
      by: ['tenantId'],
      where: { AND: [{ tenantId: { not: MAIN_TENANT_ID }, createdAt: { gte: w.start, lt: w.end } }, excludeTopup()] },
      _count: { _all: true },
    }),
    prisma.tenantCustomer.groupBy({ by: ['tenantId'], where: { createdAt: { gte: w.start, lt: w.end } }, _count: { _all: true } }),
  ])
  capWarn('渠道已付单', paidRows.length)
  const acc = new Map<number, ChannelAcc>()
  const of = (id: number) => {
    let a = acc.get(id)
    if (!a) acc.set(id, (a = { created: 0, paid: 0, amountCents: 0, ownerGoodsCents: 0, profitCents: 0, profitUnknown: 0, newCustomers: 0 }))
    return a
  }
  for (const g of createdBy) of(g.tenantId).created += g._count._all
  for (const g of joinedBy) if (g.tenantId !== MAIN_TENANT_ID) of(g.tenantId).newCustomers += g._count._all
  let profitCents = 0
  let unknown = 0
  for (let i = 0; i < paidRows.length; i += PROFIT_CHUNK) {
    const chunk = paidRows.slice(i, i + PROFIT_CHUNK)
    const pm = await channelProfitMap(chunk)
    for (const r of chunk) {
      const a = of(r.tenantId)
      a.paid += 1
      a.amountCents += centsOf(r.amount)
      const p = pm.get(r.id)
      // 与后台订单列表合计同一处理：缺快照（p 为 null）算不出所得货款与利润，计作「未知」，不编数
      if (!p) {
        a.profitUnknown += 1
        unknown += 1
        continue
      }
      a.ownerGoodsCents += p.ownerGoodsCents
      if (p.profitCents == null) {
        a.profitUnknown += 1
        unknown += 1
      } else {
        a.profitCents += p.profitCents
        profitCents += p.profitCents
      }
    }
  }
  if (!tenants.length && !acc.size) return { block: null, profitCents, unknown }

  const codeOf = new Map(tenants.map((t) => [t.id, t.code]))
  const active = Array.from(acc.entries())
    .filter(([, a]) => a.created || a.paid || a.newCustomers)
    .sort(([ia, a], [ib, b]) => b.amountCents - a.amountCents || b.paid - a.paid || b.created - a.created || ia - ib)
  const rows: ChannelSummaryRow[] = []
  // 站名逐个取（getTenantBrand 进程内缓存 60 秒；只取有动态的站，串行）
  for (const [id, a] of active) {
    const brand = await getTenantBrand(id)
    rows.push({ name: brand.name, code: codeOf.get(id) ?? `#${id}`, ...a })
  }
  const activeIds = new Set(active.map(([id]) => id))
  const idle = tenants.filter((t) => t.status !== 'TERMINATED' && !activeIds.has(t.id)).length
  return { block: { rows, idle }, profitCents, unknown }
}

/** 订阅账户打码：邮箱 ab***@qq.com；不是邮箱的只留前两个字 */
function maskAccount(s: string): string {
  const t = oneLine(s, 80)
  if (t.includes('@')) return maskEmails(t)
  return `${Array.from(t).slice(0, 2).join('')}***`
}

/** 一个窗口的主站日报指标 */
export async function collectMainReport(w: ReportWindow, opts: MainReportOptions): Promise<MainReport> {
  const now = opts.now ?? new Date()
  const issue = opts.issueUserId && opts.issueUserId > 0 ? opts.issueUserId : null
  const notIssue = issue ? { id: { not: issue } } : {}
  const range = { gte: w.start, lt: w.end }
  // 待办、库存、到期、机器人运行情况只在「日」与「今日」带；本周 / 本月是区间汇总
  const snapshot = w.kind === 'day' || w.kind === 'today'

  // 流量：page_views day_key ∈ 窗口且 tenant_id = 1（同后台流量分析）；访客 COUNT(DISTINCT viewer_key)；新访客 visitors.first_seen ∈ 窗口；
  // 来源前三、手机占比按 source、device 分组（按浏览量）
  const traffic = await siteTraffic(MAIN_TENANT_ID, w)
  // 订单：下单 / 下单人数（含未付款，不含提卡账号）、成交 / 成交人数、成交额、发票税费、支付转化分子、取消 / 过期、仍未付款、退款
  const orders = await siteOrders(MAIN_TENANT_ID, w, issue)

  const [registered, total, top, jiemaOrders] = await Promise.all([
    // 用户：新注册 = users.registered_tenant_id = 1 且 created_at ∈ 窗口，排除提卡账号；累计 = 同条件、到窗口结束为止
    prisma.user.count({ where: { registeredTenantId: MAIN_TENANT_ID, createdAt: range, ...notIssue } }),
    prisma.user.count({ where: { registeredTenantId: MAIN_TENANT_ID, createdAt: { lt: w.end }, ...notIssue } }),
    // 商品 · 热销前三：窗口内成交单按商品分组，件数、金额（含提卡单：商品销量照常计入，Q12）
    prisma.order.groupBy({
      by: ['productName'],
      where: paidWhere(MAIN_TENANT_ID, w),
      _sum: { quantity: true, amount: true },
      orderBy: [{ _sum: { quantity: 'desc' } }, { _sum: { amount: 'desc' } }],
      take: 3,
    }),
    // 其它 · 接码：窗口内付款的接码单数（jiema/reconcile.ts buildDaily 的口径：sms_orders.paid_at ∈ 窗口）
    prisma.smsOrder.count({ where: { paidAt: range } }),
  ])

  const card = await cardProfit(w)
  const jiemaCents = await jiemaProfit(w)
  const ch = await channelBlock(w)

  const [topup, couponsUsed, invoices, receipts] = await Promise.all([
    // 其它 · 余额充值：balance_logs.type = 'TOPUP'（笔数、充值格入账 Σ topup_delta_cents；不计营收，同仪表盘「今日充值」）
    prisma.balanceLog.aggregate({ where: { type: 'TOPUP', createdAt: range }, _count: { _all: true }, _sum: { topupDeltaCents: true } }),
    // 其它 · 用券：coupon_grants.used_at ∈ 窗口
    prisma.couponGrant.count({ where: { state: 'USED', usedAt: range } }),
    // 其它 · 开票：主站发票里税费在窗口内到账的（invoices.pay_status = PAID 且 paid_at ∈ 窗口）
    prisma.invoice.count({ where: { tenantId: MAIN_TENANT_ID, payStatus: 'PAID', paidAt: range } }),
    // 其它 · 收据：receipts.tenant_id = 1 且 created_at ∈ 窗口
    prisma.receipt.count({ where: { tenantId: MAIN_TENANT_ID, createdAt: range } }),
  ])
  // 其它 · 抽奖：lottery_entries 窗口内抽中的（state = DRAWN、won、drawn_at ∈ 窗口）
  const lotteryWins = await prisma.lotteryEntry.count({ where: { state: 'DRAWN', won: true, drawnAt: range } })

  let todo: MainReport['todo'] = null
  let lowStock: MainReport['lowStock'] = null
  let expiring: MainReport['expiring'] = null
  if (snapshot) {
    const [processing, pendingInvoices, unread, afterSales] = await Promise.all([
      // 待办 · 待人工发货：PAID 且 PROCESSING，全部来源站（渠道单也是站长发货），排除接码 / 充值商品（它们的「处理中」由接码流程自己推进）——
      // 与「待办」指令（data/todo.ts）同一个口径，两边数字对得上
      prisma.order.count({ where: { AND: [{ payStatus: 'PAID', deliveryStatus: 'PROCESSING' }, { product: { deliveryType: { notIn: NOT_MANUAL_DELIVERY } } }] } }),
      // 待办 · 待开发票：invoices.status = SUBMITTED 且 pay_status = PAID（同财务台口径，默认全部来源站）
      prisma.invoice.count({ where: { status: 'SUBMITTED', payStatus: 'PAID' } }),
      // 待办 · 未读留言：order_messages.sender = BUYER 且 read_by_admin = false 的订单数（同后台订单列表「只看未回复」，全部来源站）。
      // 不限时间、可能积累很多，去重计数留在库里做（不把订单号拉回 Node）
      prisma.$queryRaw<{ n: unknown }[]>`SELECT COUNT(DISTINCT order_id) AS n FROM order_messages WHERE sender = 'BUYER' AND read_by_admin = FALSE`,
      // 待办 · 售后待处理：全部渠道 tenant_after_sales 待处理数
      prisma.tenantAfterSale.count({ where: { status: 'PENDING' } }),
    ])
    todo = { processing, invoices: pendingInvoices, unreadOrders: Number(unread[0]?.n ?? 0) || 0, afterSales }

    // 到期：external_orders.expire_date ∈ [今天, 今天+3)。expire_date 是 DATE 列，Prisma 按 UTC 零点比较（同 lib/reminder.ts），
    // 「今天」取北京日期；排除 sourceKey 以 order: 开头的背书行（它们的到期日是硬写的假日期，到期提醒模块同样排除）
    const todayKey = bjDateKey(now)
    const from = new Date(`${todayKey}T00:00:00.000Z`)
    const expWhere = { expireDate: { gte: from, lt: new Date(from.getTime() + 3 * DAY_MS) }, NOT: { sourceKey: { startsWith: 'order:' } } }
    const threshold = lowStockThreshold()
    const [low, expCount, expTop] = await Promise.all([
      // 库存告警：deliveryType = AUTO 且上架且 0 ≤ stock ≤ 阈值（付款时才检查的那条提醒，这里每天补扫一次）
      prisma.product.findMany({
        where: { deliveryType: 'AUTO', status: 1, stock: { gte: 0, lte: threshold } },
        select: { name: true, stock: true },
        orderBy: [{ stock: 'asc' }, { id: 'asc' }],
        take: 50,
      }),
      prisma.externalOrder.count({ where: expWhere }),
      prisma.externalOrder.findMany({
        where: expWhere,
        select: { expireDate: true, claudeAccount: true, subscriptionType: true },
        orderBy: [{ expireDate: 'asc' }, { id: 'asc' }],
        take: 5,
      }),
    ])
    lowStock = low
    expiring = {
      count: expCount,
      items: expTop.map((e) => ({ date: e.expireDate.toISOString().slice(5, 10), account: maskAccount(e.claudeAccount), type: oneLine(e.subscriptionType, 20) })),
    }
  }

  // 对比：成交金额、成交单数（各对比窗口），访客只在整日窗口比（较前一日、较上周同日）
  const compares: CompareRow[] = await Promise.all(
    w.compares.slice(0, 2).map(async (c) => {
      const t = await sitePaidTotals(MAIN_TENANT_ID, c)
      return { label: c.label, ...t, uv: w.kind === 'day' ? await siteUv(MAIN_TENANT_ID, c.dayFrom, c.dayTo) : null }
    })
  )

  // 机器人运行情况：窗口内发出（bot_outbox SENT、sent_at ∈ 窗口）与失败（FAILED、updated_at ∈ 窗口）的条数；
  // 离线分钟来自 bot_state.offlineMinutes（tick 按北京日期累计，只留 7 天；没登录过或超出保留期 = 不显示）
  let robot: MainReport['robot'] = null
  if (snapshot) {
    const [sent, failed, state] = await Promise.all([
      prisma.botOutbox.count({ where: { status: 'SENT', sentAt: range } }),
      prisma.botOutbox.count({ where: { status: 'FAILED', updatedAt: range } }),
      readBotState(),
    ])
    let offlineMinutes: number | null = null
    if (state.loginAt && w.dayFrom >= addBjDays(bjDateKey(now), -(OFFLINE_MINUTES_KEEP_DAYS - 1))) {
      offlineMinutes = 0
      for (let k = w.dayFrom; k <= w.dayTo; k = addBjDays(k, 1)) offlineMinutes += state.offlineMinutes?.[k] ?? 0
    }
    robot = { sent, failed, offlineMinutes }
  }

  return {
    siteLabel: PLATFORM_SITE_LABEL,
    window: w,
    historical: !!opts.historical,
    traffic,
    users: { registered, total },
    orders,
    profit: { cardCents: card.cents, cardUnknownOrders: card.unknownOrders, jiemaCents, channelCents: ch.profitCents, channelUnknownOrders: ch.unknown },
    top: top.map((t) => ({ name: t.productName, qty: t._sum.quantity ?? 0, amountCents: centsOf(t._sum.amount) })),
    todo,
    lowStock,
    expiring,
    others: {
      topupCount: topup._count._all,
      topupCents: topup._sum.topupDeltaCents ?? 0,
      jiemaOrders,
      couponsUsed,
      invoices,
      receipts,
      lotteryWins,
    },
    channels: ch.block,
    compares,
    robot,
  }
}
