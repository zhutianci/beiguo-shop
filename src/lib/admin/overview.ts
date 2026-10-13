/**
 * 后台仪表盘「经营概览」的聚合（纯函数，不连库；src/app/api/admin/stats/overview/route.ts 取数后交给这里）。
 *
 * 【两条曲线的口径】（页面底部照此注明）
 *  · 流水 = 站内订单实收（已付款且未取消、不含余额充值，按到账日，Order.amount）
 *          + 外部导入订单的报价（ExternalOrder.quote，按开通日；不含站内订单派生的 SHOP / WEB 批次，否则同一笔钱记两次）。
 *  · 利润 = 卡密利润（Σ CardKey.profit，按发出日；已取消 / 已退款订单的卡不计、不扣内推返现——lib/referral-report 的口径）
 *          + 外部导入订单的利润（没填利润、但报价和成本都有的按 报价 − 成本 推算，与「订单数据分析」一致）。
 *    人工服务单、短信接码单没有逐单成本，利润不在这条线里（接码的成本利润在下方单列）。
 *
 * 日切点固定东八区，在 UTC 上做固定偏移的算术，不依赖进程时区（与 api/admin/analytics/cardkeys 同一做法）。
 * 金额全部先换成「分」累加，出口再除以 100，避免浮点累加出 0.30000000000000004。
 */

const TZ_OFFSET_MS = 8 * 3600_000
const DAY_MS = 86400_000

export const OVERVIEW_DAYS = [7, 30, 90] as const
export type OverviewDays = (typeof OVERVIEW_DAYS)[number]

/** ?days= 只认 7 / 30 / 90，其余一律 30 */
export function parseOverviewDays(v: string | null | undefined): OverviewDays {
  const n = Number(v)
  return (OVERVIEW_DAYS as readonly number[]).includes(n) ? (n as OverviewDays) : 30
}

/** 一个时刻落在东八区的哪一天（YYYY-MM-DD） */
export function shanghaiDayKey(d: Date): string {
  return new Date(d.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10)
}

/** 东八区 YYYY-MM-DD 当天 0 点对应的时刻 */
export function shanghaiDayStartOf(day: string): Date {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) - TZ_OFFSET_MS)
}

/**
 * 取数窗口：本期 days 天（含今天）+ 紧挨着的上一期 days 天（算环比）。
 * 返回两期的日期列表、站内数据的时刻范围 [from, to)、外部导入订单的日期范围（startDate 是 @db.Date，存成 UTC 零点）。
 */
export function overviewWindow(days: number, now = new Date()) {
  const today = shanghaiDayKey(now)
  const todayMs = Date.parse(`${today}T00:00:00.000Z`)
  const key = (ms: number) => new Date(ms).toISOString().slice(0, 10)
  const cur: string[] = []
  const prev: string[] = []
  for (let i = days - 1; i >= 0; i--) cur.push(key(todayMs - i * DAY_MS))
  for (let i = 2 * days - 1; i >= days; i--) prev.push(key(todayMs - i * DAY_MS))
  return {
    today,
    cur,
    prev,
    from: shanghaiDayStartOf(prev[0]),
    to: new Date(shanghaiDayStartOf(today).getTime() + DAY_MS),
    extFrom: new Date(`${prev[0]}T00:00:00.000Z`),
    extTo: new Date(`${today}T23:59:59.999Z`),
  }
}

export interface OverviewOrderRow {
  paidAt: Date | null
  amountCents: number
  productName: string
}
export interface OverviewCardRow {
  usedAt: Date | null
  /** null = 利润未知（外部站发卡、改造前的历史卡），不计入 */
  profitCents: number | null
  /** 所属订单已取消 / 已退款：不计利润 */
  voided: boolean
}
export interface OverviewExternalRow {
  /** @db.Date：UTC 零点 */
  startDate: Date
  quoteCents: number | null
  costCents: number | null
  profitCents: number | null
}

export interface OverviewDay {
  date: string
  /** 流水 = site + ext（元） */
  revenue: number
  siteRevenue: number
  extRevenue: number
  /** 利润 = card + ext（元） */
  profit: number
  cardProfit: number
  extProfit: number
  /** 成交单数 = 站内已付款订单 + 外部导入订单 */
  orders: number
  siteOrders: number
  extOrders: number
}

export interface OverviewTotals {
  revenue: number
  profit: number
  orders: number
}

export interface OverviewProduct {
  name: string
  revenue: number
  orders: number
}

export interface Overview {
  range: { days: number; from: string; to: string; today: string }
  daily: OverviewDay[]
  totals: OverviewTotals
  /** 紧挨着的上一期（同样天数）合计，算环比用 */
  prevTotals: OverviewTotals
  /** 本期站内订单按商品的流水排行（前 6，其余并入「其他」） */
  topProducts: OverviewProduct[]
  /** 本期有多少张已发出的卡利润未知、没计入利润 */
  unknownProfitCards: number
}

type Acc = { site: number; ext: number; card: number; extProfit: number; siteOrders: number; extOrders: number }
const newAcc = (): Acc => ({ site: 0, ext: 0, card: 0, extProfit: 0, siteOrders: 0, extOrders: 0 })

export function buildOverview(
  days: number,
  now: Date,
  rows: { orders: OverviewOrderRow[]; cards: OverviewCardRow[]; externals: OverviewExternalRow[] }
): Overview {
  const w = overviewWindow(days, now)
  const acc = new Map<string, Acc>()
  for (const d of w.prev) acc.set(d, newAcc())
  for (const d of w.cur) acc.set(d, newAcc())
  const curSet = new Set(w.cur)

  const byProduct = new Map<string, { cents: number; orders: number }>()
  for (const o of rows.orders) {
    if (!o.paidAt) continue
    const day = shanghaiDayKey(o.paidAt)
    const a = acc.get(day)
    if (!a) continue
    a.site += o.amountCents
    a.siteOrders++
    if (curSet.has(day)) {
      const p = byProduct.get(o.productName) ?? { cents: 0, orders: 0 }
      p.cents += o.amountCents
      p.orders++
      byProduct.set(o.productName, p)
    }
  }

  let unknownProfitCards = 0
  for (const c of rows.cards) {
    if (!c.usedAt) continue
    const day = shanghaiDayKey(c.usedAt)
    const a = acc.get(day)
    if (!a || c.voided) continue
    if (c.profitCents == null) {
      if (curSet.has(day)) unknownProfitCards++
      continue
    }
    a.card += c.profitCents
  }

  for (const e of rows.externals) {
    const a = acc.get(e.startDate.toISOString().slice(0, 10))
    if (!a) continue
    a.extOrders++
    if (e.quoteCents != null) a.ext += e.quoteCents
    const p = e.profitCents ?? (e.quoteCents != null && e.costCents != null ? e.quoteCents - e.costCents : null)
    if (p != null) a.extProfit += p
  }

  const yuan = (c: number) => c / 100
  const sum = (list: string[]): OverviewTotals => {
    let revenue = 0
    let profit = 0
    let orders = 0
    for (const d of list) {
      const a = acc.get(d)!
      revenue += a.site + a.ext
      profit += a.card + a.extProfit
      orders += a.siteOrders + a.extOrders
    }
    return { revenue: yuan(revenue), profit: yuan(profit), orders }
  }

  const daily: OverviewDay[] = w.cur.map((date) => {
    const a = acc.get(date)!
    return {
      date,
      revenue: yuan(a.site + a.ext),
      siteRevenue: yuan(a.site),
      extRevenue: yuan(a.ext),
      profit: yuan(a.card + a.extProfit),
      cardProfit: yuan(a.card),
      extProfit: yuan(a.extProfit),
      orders: a.siteOrders + a.extOrders,
      siteOrders: a.siteOrders,
      extOrders: a.extOrders,
    }
  })

  const ranked = Array.from(byProduct.entries())
    .map(([name, v]) => ({ name, cents: v.cents, orders: v.orders }))
    .sort((a, b) => b.cents - a.cents || b.orders - a.orders)
  const TOP = 6
  const top = ranked.slice(0, TOP).map((p) => ({ name: p.name, revenue: yuan(p.cents), orders: p.orders }))
  const rest = ranked.slice(TOP)
  if (rest.length) {
    top.push({
      name: `其他 ${rest.length} 个商品`,
      revenue: yuan(rest.reduce((s, p) => s + p.cents, 0)),
      orders: rest.reduce((s, p) => s + p.orders, 0),
    })
  }

  return {
    range: { days, from: w.cur[0], to: w.cur[w.cur.length - 1], today: w.today },
    daily,
    totals: sum(w.cur),
    prevTotals: sum(w.prev),
    topProducts: top,
    unknownProfitCards,
  }
}
