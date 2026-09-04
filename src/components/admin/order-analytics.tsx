'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, ShoppingBag, Wallet, Percent, Coins, Users } from 'lucide-react'

interface SeriesPoint { period: string; count: number; quote: number; cost: number; profit: number }
interface TypeRow { type: string; count: number; quote: number; profit: number }
interface AccountRow { account: string; nickname: string | null; count: number; quote: number; profit: number }
interface Summary {
  orderCount: number
  totalQuote: number
  totalCost: number
  totalProfit: number
  avgQuote: number
  avgProfit: number
  profitMargin: number
  distinctAccounts: number
  withQuote: number
  withoutQuote: number
}
interface AnalyticsData {
  range: { start: string; end: string; granularity: 'day' | 'month'; excludeShop?: boolean }
  summary: Summary
  series: SeriesPoint[]
  byType: TypeRow[]
  topAccounts: AccountRow[]
}

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function money(n: number) {
  return '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

type Granularity = 'day' | 'month'

export default function OrderAnalytics() {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [start, setStart] = useState(iso(firstOfMonth))
  const [end, setEnd] = useState(iso(today))
  const [granularity, setGranularity] = useState<Granularity>('day')
  // 默认不勾：网站自助订单（importBatch=SHOP/WEB）已经在「卡密数据分析」里统计过，
  // 算进来会和卡密那块重复计数。勾上则看两个渠道的合并总量。
  const [includeShop, setIncludeShop] = useState(false)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ start, end, granularity, excludeShop: includeShop ? '0' : '1' })
      const res = await fetch(`/api/admin/analytics/orders?${q}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } finally {
      setLoading(false)
    }
  }, [start, end, granularity, includeShop])

  // 区间/粒度变化（含快捷区间）自动重新查询；首次挂载也会触发
  useEffect(() => {
    load()
  }, [load])

  // 快捷区间
  const presets: { label: string; apply: () => void }[] = [
    {
      label: '本月',
      apply: () => {
        setStart(iso(new Date(today.getFullYear(), today.getMonth(), 1)))
        setEnd(iso(today))
        setGranularity('day')
      },
    },
    {
      label: '上月',
      apply: () => {
        setStart(iso(new Date(today.getFullYear(), today.getMonth() - 1, 1)))
        setEnd(iso(new Date(today.getFullYear(), today.getMonth(), 0)))
        setGranularity('day')
      },
    },
    {
      label: '近7天',
      apply: () => {
        const s = new Date(today)
        s.setDate(s.getDate() - 6)
        setStart(iso(s))
        setEnd(iso(today))
        setGranularity('day')
      },
    },
    {
      label: '近30天',
      apply: () => {
        const s = new Date(today)
        s.setDate(s.getDate() - 29)
        setStart(iso(s))
        setEnd(iso(today))
        setGranularity('day')
      },
    },
    {
      label: '今年(按月)',
      apply: () => {
        setStart(iso(new Date(today.getFullYear(), 0, 1)))
        setEnd(iso(today))
        setGranularity('month')
      },
    },
  ]

  const s = data?.summary
  const cards = [
    { title: '订单数', value: s ? String(s.orderCount) : '--', icon: ShoppingBag, color: 'bg-blue-500', sub: s ? `${s.distinctAccounts} 个账户` : '' },
    { title: '付款额（报价）', value: s ? money(s.totalQuote) : '--', icon: Wallet, color: 'bg-emerald-500', sub: s ? `客单价 ${money(s.avgQuote)}` : '' },
    { title: '利润', value: s ? money(s.totalProfit) : '--', icon: TrendingUp, color: 'bg-green-600', sub: s ? `单均利润 ${money(s.avgProfit)}` : '' },
    { title: '利润率', value: s ? `${s.profitMargin}%` : '--', icon: Percent, color: 'bg-violet-500', sub: s ? `成本 ${money(s.totalCost)}` : '' },
  ]

  const maxQuote = data && data.series.length ? Math.max(...data.series.map((p) => p.quote), 1) : 1
  const maxTypeQuote = data && data.byType.length ? Math.max(...data.byType.map((t) => t.quote), 1) : 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-500" />
          订单数据分析
          <span className="text-xs font-normal text-gray-400">
            （数据源：订单导入{includeShop ? '，含网站自助订单' : '，不含网站自助订单'}）
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 筛选 */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">开始日期</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">结束日期</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">粒度</label>
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setGranularity('day')}
                className={`px-3 py-2 text-sm ${granularity === 'day' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
              >
                按天
              </button>
              <button
                onClick={() => setGranularity('month')}
                className={`px-3 py-2 text-sm ${granularity === 'month' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
              >
                按月
              </button>
            </div>
          </div>
          <Button onClick={load} loading={loading}>查询</Button>
          <label
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none py-2"
            title="网站自助下单（导入批次 SHOP / WEB）默认不计入，避免与「卡密数据分析」重复计数"
          >
            <input
              type="checkbox"
              checked={includeShop}
              onChange={(e) => setIncludeShop(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            包含网站自助订单
          </label>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={p.apply}
                className="px-2.5 py-1 text-xs rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 概览卡片 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.title} className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">{c.title}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 truncate">{loading ? '...' : c.value}</p>
                  {c.sub && <p className="mt-0.5 text-xs text-gray-400 truncate">{c.sub}</p>}
                </div>
                <div className={`rounded-lg ${c.color} p-2.5 shrink-0`}>
                  <c.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 趋势柱状图（堆叠：利润 + 成本 = 付款额） */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">付款额趋势（{granularity === 'month' ? '按月' : '按天'}）</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" />利润</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-300" />成本</span>
            </div>
          </div>
          {!data || data.series.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">该区间暂无订单</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-end gap-1.5 h-52 min-w-full pt-4" style={{ minWidth: Math.max(data.series.length * 28, 300) }}>
                {data.series.map((p) => {
                  const h = (p.quote / maxQuote) * 100
                  const profitH = p.quote > 0 ? Math.max((Math.max(p.profit, 0) / p.quote) * 100, 0) : 0
                  return (
                    <div key={p.period} className="flex-1 flex flex-col items-center justify-end group" title={`${p.period}\n订单 ${p.count}\n付款额 ${money(p.quote)}\n成本 ${money(p.cost)}\n利润 ${money(p.profit)}`}>
                      <span className="text-[10px] text-gray-400 mb-0.5 opacity-0 group-hover:opacity-100 whitespace-nowrap">{money(p.quote)}</span>
                      <div className="w-full max-w-[24px] rounded-t bg-gray-300 overflow-hidden flex flex-col justify-end" style={{ height: `${Math.max(h, 2)}%` }}>
                        <div className="w-full bg-green-500" style={{ height: `${profitH}%` }} />
                      </div>
                      <span className="mt-1 text-[10px] text-gray-400 -rotate-45 origin-top-left whitespace-nowrap h-6">
                        {granularity === 'month' ? p.period.slice(2) : p.period.slice(5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 按订阅类型 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">按订阅类型</h3>
            {!data || data.byType.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">暂无数据</div>
            ) : (
              <div className="space-y-2">
                {data.byType.map((t) => (
                  <div key={t.type}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span className="truncate">{t.type} <span className="text-gray-400">×{t.count}</span></span>
                      <span className="whitespace-nowrap">{money(t.quote)} · 利润 <span className="text-green-600">{money(t.profit)}</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${(t.quote / maxTypeQuote) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top 账户 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-gray-400" /> 利润 Top 账户
            </h3>
            {!data || data.topAccounts.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">暂无数据</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b">
                      <th className="pb-1 pr-2">账户</th>
                      <th className="pb-1 pr-2 text-right">单数</th>
                      <th className="pb-1 pr-2 text-right">付款额</th>
                      <th className="pb-1 text-right">利润</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topAccounts.map((a) => (
                      <tr key={a.account} className="border-b border-gray-50">
                        <td className="py-1.5 pr-2">
                          <div className="font-mono text-xs truncate max-w-[160px]" title={a.account}>{a.account}</div>
                          {a.nickname && <div className="text-[10px] text-gray-400 truncate max-w-[160px]">{a.nickname}</div>}
                        </td>
                        <td className="py-1.5 pr-2 text-right text-gray-600">{a.count}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-600">{money(a.quote)}</td>
                        <td className="py-1.5 text-right text-green-600 font-medium">{money(a.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {s && s.withoutQuote > 0 && (
          <p className="text-xs text-amber-600">
            注：本区间有 {s.withoutQuote} 笔订单未填写报价，未计入付款额/利润统计。可在「订单导入」中补充报价。
          </p>
        )}
      </CardContent>
    </Card>
  )
}
