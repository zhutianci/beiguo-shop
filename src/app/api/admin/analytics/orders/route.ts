export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

// 订单数据分析，数据源 = ExternalOrder（“订单导入”），按开通时间(startDate)统计
// 查询参数：start=YYYY-MM-DD, end=YYYY-MM-DD, granularity=day|month
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startStr = searchParams.get('start')?.trim()
    const endStr = searchParams.get('end')?.trim()
    const granularity = searchParams.get('granularity') === 'month' ? 'month' : 'day'

    const dateRe = /^\d{4}-\d{2}-\d{2}$/
    if (!startStr || !dateRe.test(startStr)) return error('start 日期格式错误')
    if (!endStr || !dateRe.test(endStr)) return error('end 日期格式错误')

    // 以 UTC 边界过滤（startDate 为 @db.Date，存储为 UTC 零点）
    const gte = new Date(`${startStr}T00:00:00.000Z`)
    const lte = new Date(`${endStr}T23:59:59.999Z`)
    if (gte > lte) return error('开始日期不能晚于结束日期')

    const orders = await prisma.externalOrder.findMany({
      where: { startDate: { gte, lte } },
      select: {
        startDate: true,
        subscriptionType: true,
        claudeAccount: true,
        xianyuNickname: true,
        cost: true,
        quote: true,
        profit: true,
      },
      orderBy: { startDate: 'asc' },
    })

    const num = (v: unknown) => (v == null ? null : Number(v))
    const periodKey = (d: Date) =>
      granularity === 'month' ? d.toISOString().slice(0, 7) : d.toISOString().slice(0, 10)

    // 汇总
    let totalQuote = 0
    let totalCost = 0
    let totalProfit = 0
    let withQuote = 0
    let withCost = 0
    let withProfit = 0

    // 时间序列
    const seriesMap = new Map<string, { period: string; count: number; quote: number; cost: number; profit: number }>()
    // 按订阅类型
    const typeMap = new Map<string, { type: string; count: number; quote: number; profit: number }>()
    // 按账户
    const acctMap = new Map<string, { account: string; nickname: string | null; count: number; quote: number; profit: number }>()

    for (const o of orders) {
      const q = num(o.quote)
      const c = num(o.cost)
      // 利润：有就用；否则若报价、成本都有则推算
      let p = num(o.profit)
      if (p == null && q != null && c != null) p = Math.round((q - c) * 100) / 100

      if (q != null) { totalQuote += q; withQuote++ }
      if (c != null) { totalCost += c; withCost++ }
      if (p != null) { totalProfit += p; withProfit++ }

      const key = periodKey(o.startDate)
      const s = seriesMap.get(key) || { period: key, count: 0, quote: 0, cost: 0, profit: 0 }
      s.count++
      s.quote += q || 0
      s.cost += c || 0
      s.profit += p || 0
      seriesMap.set(key, s)

      const t = (o.subscriptionType || '未分类').trim() || '未分类'
      const tv = typeMap.get(t) || { type: t, count: 0, quote: 0, profit: 0 }
      tv.count++
      tv.quote += q || 0
      tv.profit += p || 0
      typeMap.set(t, tv)

      const a = o.claudeAccount
      const av = acctMap.get(a) || { account: a, nickname: o.xianyuNickname, count: 0, quote: 0, profit: 0 }
      av.count++
      av.quote += q || 0
      av.profit += p || 0
      acctMap.set(a, av)
    }

    const round2 = (n: number) => Math.round(n * 100) / 100
    const orderCount = orders.length

    const series = Array.from(seriesMap.values())
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((s) => ({ ...s, quote: round2(s.quote), cost: round2(s.cost), profit: round2(s.profit) }))

    const byType = Array.from(typeMap.values())
      .map((t) => ({ ...t, quote: round2(t.quote), profit: round2(t.profit) }))
      .sort((a, b) => b.quote - a.quote)

    const topAccounts = Array.from(acctMap.values())
      .map((a) => ({ ...a, quote: round2(a.quote), profit: round2(a.profit) }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)

    const summary = {
      orderCount,
      totalQuote: round2(totalQuote),       // 付款额合计（报价）
      totalCost: round2(totalCost),         // 成本合计
      totalProfit: round2(totalProfit),     // 利润合计
      avgQuote: withQuote ? round2(totalQuote / withQuote) : 0,   // 客单价（有报价订单均值）
      avgProfit: withProfit ? round2(totalProfit / withProfit) : 0,
      profitMargin: totalQuote > 0 ? round2((totalProfit / totalQuote) * 100) : 0, // 利润率 %
      distinctAccounts: acctMap.size,
      withQuote,
      withoutQuote: orderCount - withQuote,
      withCost,
      withProfit,
    }

    return success({
      range: { start: startStr, end: endStr, granularity },
      summary,
      series,
      byType,
      topAccounts,
    })
  } catch (err) {
    console.error('Order analytics error:', err)
    return error('统计失败')
  }
}
