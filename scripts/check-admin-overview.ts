/**
 * 仪表盘「经营概览」聚合的纯函数自检（不连库）：npx tsx scripts/check-admin-overview.ts
 * 带期望值断言，不符就 exitCode=1。改 lib/admin/overview.ts 后必跑。
 */
import { buildOverview, overviewWindow, parseOverviewDays, shanghaiDayKey } from '../src/lib/admin/overview'

let failed = 0
function ok(name: string, cond: boolean, extra = '') {
  if (!cond) failed++
  console.log(`${cond ? '✓' : '✗'} ${name}${cond || !extra ? '' : `  —— ${extra}`}`)
}

// 北京时间 2026-10-13 21:30
const NOW = new Date('2026-10-13T13:30:00.000Z')
const bj = (s: string) => new Date(`${s}+08:00`)

console.log('[区间与日切点]')
{
  ok('days 只认 7 / 30 / 90', parseOverviewDays('7') === 7 && parseOverviewDays('90') === 90)
  ok('其余一律 30', parseOverviewDays('15') === 30 && parseOverviewDays(null) === 30 && parseOverviewDays('abc') === 30)
  ok('北京时间 0 点前后归到不同的两天', shanghaiDayKey(bj('2026-10-12T23:59:59')) === '2026-10-12' && shanghaiDayKey(bj('2026-10-13T00:00:00')) === '2026-10-13')
  const w = overviewWindow(7, NOW)
  ok('本期 7 天、含今天', w.cur.length === 7 && w.cur[0] === '2026-10-07' && w.cur[6] === '2026-10-13')
  ok('上一期紧挨着、同样 7 天', w.prev.length === 7 && w.prev[0] === '2026-09-30' && w.prev[6] === '2026-10-06')
  ok('取数起点 = 上一期第一天北京时间 0 点', w.from.toISOString() === '2026-09-29T16:00:00.000Z')
  ok('取数终点 = 明天北京时间 0 点（不含）', w.to.toISOString() === '2026-10-13T16:00:00.000Z')
  ok('外部订单按日期列（UTC 零点）取', w.extFrom.toISOString() === '2026-09-30T00:00:00.000Z' && w.extTo.toISOString() === '2026-10-13T23:59:59.999Z')
}

console.log('\n[聚合]')
{
  const o = buildOverview(7, NOW, {
    orders: [
      { paidAt: bj('2026-10-13T00:00:01'), amountCents: 13500, productName: 'A' },
      { paidAt: bj('2026-10-13T20:00:00'), amountCents: 10, productName: 'A' },
      { paidAt: bj('2026-10-13T20:00:00'), amountCents: 20, productName: 'B' },
      { paidAt: bj('2026-10-12T23:59:59'), amountCents: 78000, productName: 'B' },
      // 上一期
      { paidAt: bj('2026-10-06T12:00:00'), amountCents: 50000, productName: 'C' },
      // 区间外、没有到账时间：都丢弃
      { paidAt: bj('2026-09-29T23:59:59'), amountCents: 99999, productName: 'X' },
      { paidAt: null, amountCents: 99999, productName: 'X' },
    ],
    cards: [
      { usedAt: bj('2026-10-13T00:00:02'), profitCents: 2900, voided: false },
      { usedAt: bj('2026-10-13T08:00:00'), profitCents: -500, voided: false },
      // 已取消订单的卡：不计
      { usedAt: bj('2026-10-13T09:00:00'), profitCents: 8800, voided: true },
      // 利润未知：不计，但计数
      { usedAt: bj('2026-10-13T10:00:00'), profitCents: null, voided: false },
      // 上一期的未知利润不进本期的计数
      { usedAt: bj('2026-10-05T10:00:00'), profitCents: null, voided: false },
      { usedAt: bj('2026-10-06T10:00:00'), profitCents: 1000, voided: false },
    ],
    externals: [
      { startDate: new Date('2026-10-13T00:00:00.000Z'), quoteCents: 15000, costCents: 12000, profitCents: null },
      { startDate: new Date('2026-10-13T00:00:00.000Z'), quoteCents: 20000, costCents: 12000, profitCents: 7000 },
      // 没填报价：只计单数
      { startDate: new Date('2026-10-12T00:00:00.000Z'), quoteCents: null, costCents: null, profitCents: null },
    ],
  })
  const today = o.daily[o.daily.length - 1]
  const yday = o.daily[o.daily.length - 2]
  ok('daily 逐日补零、共 7 天', o.daily.length === 7 && o.daily[0].date === '2026-10-07' && o.daily[0].revenue === 0 && o.daily[0].orders === 0)
  ok('今日站内流水 135.30', today.siteRevenue === 135.3, String(today.siteRevenue))
  ok('今日外部流水 350', today.extRevenue === 350)
  ok('今日流水 = 站内 + 外部 = 485.30', today.revenue === 485.3, String(today.revenue))
  ok('今日卡密利润 = 29 − 5 = 24（已取消的、未知的不计）', today.cardProfit === 24, String(today.cardProfit))
  ok('今日外部利润 = 推算 30 + 已填 70 = 100', today.extProfit === 100, String(today.extProfit))
  ok('今日利润 124', today.profit === 124)
  ok('今日单数 = 站内 3 + 外部 2', today.orders === 5 && today.siteOrders === 3 && today.extOrders === 2)
  ok('昨天 23:59:59 的单算昨天', yday.siteRevenue === 780 && yday.siteOrders === 1)
  ok('昨天没报价的外部单只计单数', yday.extOrders === 1 && yday.extRevenue === 0 && yday.extProfit === 0)
  ok('本期合计：流水 1265.30 / 利润 124 / 7 单', o.totals.revenue === 1265.3 && o.totals.profit === 124 && o.totals.orders === 7, JSON.stringify(o.totals))
  ok('合计 = 每日之和', Math.round(o.daily.reduce((s, d) => s + d.revenue, 0) * 100) === Math.round(o.totals.revenue * 100))
  ok('上一期合计：流水 500 / 利润 10 / 1 单', o.prevTotals.revenue === 500 && o.prevTotals.profit === 10 && o.prevTotals.orders === 1, JSON.stringify(o.prevTotals))
  ok('本期利润未知的卡 1 张', o.unknownProfitCards === 1)
  ok('商品排行只算本期站内单、按流水降序', o.topProducts.length === 2 && o.topProducts[0].name === 'B' && o.topProducts[0].revenue === 780.2 && o.topProducts[0].orders === 2 && o.topProducts[1].name === 'A')
  ok('range', o.range.days === 7 && o.range.from === '2026-10-07' && o.range.to === '2026-10-13' && o.range.today === '2026-10-13')
}

console.log('\n[商品超过 6 个并入「其他」]')
{
  const orders = Array.from({ length: 9 }, (_, i) => ({ paidAt: bj('2026-10-13T10:00:00'), amountCents: (i + 1) * 100, productName: `P${i + 1}` }))
  const o = buildOverview(7, NOW, { orders, cards: [], externals: [] })
  ok('前 6 + 其他', o.topProducts.length === 7 && o.topProducts[0].name === 'P9' && o.topProducts[6].name === '其他 3 个商品')
  ok('其他 = 余下之和', o.topProducts[6].revenue === 6 && o.topProducts[6].orders === 3)
  ok('排行之和 = 站内流水', Math.round(o.topProducts.reduce((s, p) => s + p.revenue, 0) * 100) === 4500)
}

console.log(`\n${failed ? `失败 ${failed} 条` : '全部通过'}`)
if (failed) process.exitCode = 1
