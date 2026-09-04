'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KeyRound, Wallet, TrendingUp, PackageSearch, Layers, Server } from 'lucide-react'

interface Bucket {
  cards: number
  cost: number
  revenue: number
  profit: number
  unknownProfitCards: number
}
interface DailyRow extends Bucket {
  date: string
}
interface ProductRow extends Bucket {
  productId: number
  productName: string
}
interface Totals {
  cards: number
  cost: number
  revenue: number
  profit: number
  profitMargin: number
  unknownProfitCards: number
  externalUnknownProfitCards: number
  externalCards: number
  externalCost: number
  localCards: number
}
interface CardKeyAnalyticsData {
  range: { from: string; to: string; days: number; tzLabel: string; productId: number | null }
  totals: Totals
  daily: DailyRow[]
  byProduct: ProductRow[]
  bySource: { local: Bucket; external: Bucket }
}

interface ProductOption {
  id: number
  name: string
  deliveryType: string
}

/** 本地日历日 YYYY-MM-DD（后端按 UTC+8 分组，管理员在国内浏览器上口径一致） */
function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function money(n: number) {
  return '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
/** 毛利率：只有已知流水 > 0 才有意义 */
function margin(revenue: number, profit: number) {
  if (revenue <= 0) return '—'
  return `${Math.round((profit / revenue) * 1000) / 10}%`
}

export default function CardKeyAnalytics() {
  const today = new Date()
  const last30 = new Date(today)
  last30.setDate(last30.getDate() - 29)

  const [from, setFrom] = useState(iso(last30))
  const [to, setTo] = useState(iso(today))
  const [productId, setProductId] = useState('')
  const [products, setProducts] = useState<ProductOption[]>([])
  const [data, setData] = useState<CardKeyAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errMsg, setErrMsg] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // 商品下拉：只列自动发货（卡密）商品
  useEffect(() => {
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProducts(
            (d.data as ProductOption[]).filter((p) => p.deliveryType === 'AUTO')
          )
        }
      })
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setErrMsg('')
    try {
      const q = new URLSearchParams({ from, to })
      if (productId) q.set('productId', productId)
      const res = await fetch(`/api/admin/analytics/cardkeys?${q}`, { signal: controller.signal })
      const json = await res.json()
      if (abortRef.current !== controller) return
      if (json.success) setData(json.data)
      else {
        setData(null)
        setErrMsg(json.error || '统计失败')
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
      setErrMsg('网络异常，请重试')
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [from, to, productId])

  // 区间/商品变化自动重查（首次挂载也会触发）
  useEffect(() => {
    load()
  }, [load])

  const presets: { label: string; apply: () => void }[] = [
    {
      label: '近7天',
      apply: () => {
        const s = new Date()
        s.setDate(s.getDate() - 6)
        setFrom(iso(s))
        setTo(iso(new Date()))
      },
    },
    {
      label: '近30天',
      apply: () => {
        const s = new Date()
        s.setDate(s.getDate() - 29)
        setFrom(iso(s))
        setTo(iso(new Date()))
      },
    },
    {
      label: '本月',
      apply: () => {
        const n = new Date()
        setFrom(iso(new Date(n.getFullYear(), n.getMonth(), 1)))
        setTo(iso(n))
      },
    },
  ]

  const t = data?.totals
  const cards = [
    {
      title: '卡密张数',
      value: t ? `${t.cards} 张` : '--',
      sub: t ? `本站 ${t.localCards} · 外部站 ${t.externalCards}` : '',
      icon: KeyRound,
      color: 'bg-blue-500',
      text: 'text-gray-900',
    },
    {
      title: '成本合计',
      value: t ? money(t.cost) : '--',
      sub: t && t.cards > 0 ? `单卡均成本 ${money(Math.round((t.cost / t.cards) * 100) / 100)}` : '',
      icon: Layers,
      color: 'bg-orange-500',
      text: 'text-orange-600',
    },
    {
      title: '流水合计',
      value: t ? money(t.revenue) : '--',
      sub: t ? `毛利率 ${t.revenue > 0 ? t.profitMargin : 0}%` : '',
      icon: Wallet,
      color: 'bg-emerald-500',
      text: 'text-gray-900',
    },
    {
      title: '利润合计',
      value: t ? money(t.profit) : '--',
      sub: t && t.unknownProfitCards > 0 ? `${t.unknownProfitCards} 张利润未知，未计入` : '已知利润全部计入',
      icon: TrendingUp,
      color: 'bg-green-600',
      text: 'text-green-600',
    },
  ]

  // 柱状图刻度：流水与利润共用一个刻度，负利润取绝对值参与比例
  const maxDaily =
    data && data.daily.length
      ? Math.max(1, ...data.daily.map((d) => Math.max(d.revenue, Math.abs(d.profit))))
      : 1
  // 柱高直接算成像素：柱子的父级是 flex 列且高度由内容决定，
  // 用百分比高度在 flex item 上解析不稳定（不同浏览器可能退化成 auto 导致柱子不可见），这里给定值最稳。
  const BAR_MAX_PX = 150
  const barPx = (v: number) => (v === 0 ? 1 : Math.max(Math.round((Math.abs(v) / maxDaily) * BAR_MAX_PX), 2))
  const maxProductRevenue =
    data && data.byProduct.length ? Math.max(1, ...data.byProduct.map((p) => p.revenue)) : 1
  const hasDaily = !!data && data.daily.some((d) => d.cards > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <KeyRound className="w-5 h-5 text-blue-500" />
          卡密数据分析
          <span className="text-xs font-normal text-gray-400">
            （数据源：卡密发出记录，按发出时间统计 · 日切点 {data?.range.tzLabel || 'UTC+8'}）
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 筛选 */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">开始日期</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">结束日期</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">商品</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm max-w-[220px]"
            >
              <option value="">全部卡密商品</option>
              {products.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={load} loading={loading}>
            查询
          </Button>
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

        {errMsg && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            {errMsg}
          </div>
        )}

        {/* 概览卡片 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.title} className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">{c.title}</p>
                  <p className={`mt-1 text-2xl font-bold truncate ${c.text}`}>
                    {loading ? '...' : c.value}
                  </p>
                  {c.sub && <p className="mt-0.5 text-xs text-gray-400 truncate">{c.sub}</p>}
                </div>
                <div className={`rounded-lg ${c.color} p-2.5 shrink-0`}>
                  <c.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 每日趋势：流水 / 利润 双柱 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">每日流水与利润</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />流水
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-green-600" />利润
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-400" />亏损
              </span>
            </div>
          </div>
          {!hasDaily ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              {loading ? '加载中...' : '该区间暂无卡密发出记录'}
            </div>
          ) : (
            <div className="overflow-x-auto pt-5">
              <div
                className="flex items-end gap-1.5"
                style={{ minWidth: Math.max(data!.daily.length * 30, 300) }}
              >
                {data!.daily.map((d) => {
                  const loss = d.profit < 0
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center justify-end group"
                      title={`${d.date}\n卡密 ${d.cards} 张\n成本 ${money(d.cost)}\n流水 ${money(d.revenue)}\n利润 ${money(d.profit)}${
                        d.unknownProfitCards > 0 ? `\n利润未知 ${d.unknownProfitCards} 张` : ''
                      }`}
                    >
                      <span className="text-[10px] text-gray-400 mb-0.5 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                        {money(d.revenue)}
                      </span>
                      <div className="w-full flex items-end justify-center gap-[2px]">
                        <div
                          className="w-[40%] max-w-[11px] rounded-t bg-emerald-500"
                          style={{ height: barPx(d.revenue) }}
                        />
                        <div
                          className={`w-[40%] max-w-[11px] rounded-t ${loss ? 'bg-red-400' : 'bg-green-600'}`}
                          style={{ height: barPx(d.profit) }}
                        />
                      </div>
                      <span className="mt-1 text-[10px] text-gray-400 -rotate-45 origin-top-left whitespace-nowrap h-6">
                        {d.date.slice(5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 商品分布 */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
            <PackageSearch className="w-4 h-4 text-gray-400" />
            商品分布
          </h3>
          {!data || data.byProduct.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              {loading ? '加载中...' : '暂无数据'}
            </div>
          ) : (
            <div className="space-y-4">
              {/* 横向条形图 */}
              <div className="space-y-2">
                {data.byProduct.map((p) => (
                  <div key={p.productId}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5 gap-2">
                      <span className="truncate">
                        {p.productName} <span className="text-gray-400">×{p.cards}</span>
                      </span>
                      <span className="whitespace-nowrap">
                        {money(p.revenue)} · 利润{' '}
                        <span className={p.profit < 0 ? 'text-red-500' : 'text-green-600'}>
                          {money(p.profit)}
                        </span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.min((p.revenue / maxProductRevenue) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 明细表 */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b">
                      <th className="pb-1 pr-2">商品</th>
                      <th className="pb-1 pr-2 text-right">张数</th>
                      <th className="pb-1 pr-2 text-right">成本</th>
                      <th className="pb-1 pr-2 text-right">流水</th>
                      <th className="pb-1 pr-2 text-right">利润</th>
                      <th className="pb-1 text-right">毛利率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byProduct.map((p) => (
                      <tr key={p.productId} className="border-b border-gray-50">
                        <td className="py-1.5 pr-2">
                          <div className="truncate max-w-[200px]" title={p.productName}>
                            {p.productName}
                          </div>
                          {p.unknownProfitCards > 0 && (
                            <div className="text-[10px] text-gray-400">
                              {p.unknownProfitCards} 张利润未知
                            </div>
                          )}
                        </td>
                        <td className="py-1.5 pr-2 text-right text-gray-600">{p.cards}</td>
                        <td className="py-1.5 pr-2 text-right text-orange-600">{money(p.cost)}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-600">{money(p.revenue)}</td>
                        <td
                          className={`py-1.5 pr-2 text-right font-medium ${
                            p.profit < 0 ? 'text-red-500' : 'text-green-600'
                          }`}
                        >
                          {money(p.profit)}
                        </td>
                        <td className="py-1.5 text-right text-gray-500">
                          {margin(p.revenue, p.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="text-sm font-medium text-gray-700">
                      <td className="pt-2 pr-2">合计</td>
                      <td className="pt-2 pr-2 text-right">{t?.cards ?? 0}</td>
                      <td className="pt-2 pr-2 text-right text-orange-600">{money(t?.cost ?? 0)}</td>
                      <td className="pt-2 pr-2 text-right">{money(t?.revenue ?? 0)}</td>
                      <td className="pt-2 pr-2 text-right text-green-600">{money(t?.profit ?? 0)}</td>
                      <td className="pt-2 text-right text-gray-500">
                        {margin(t?.revenue ?? 0, t?.profit ?? 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 外部站发卡：收入未回传，单独灰块说明 */}
        {t && t.externalCards > 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-gray-400 p-2 shrink-0">
                <Server className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 text-sm">
                <p className="font-medium text-gray-700">外部站发卡（库存 API）</p>
                <p className="mt-1 text-gray-500">
                  本区间共发出{' '}
                  <span className="font-semibold text-gray-700">{t.externalCards}</span> 张，成本合计{' '}
                  <span className="font-semibold text-orange-600">{money(t.externalCost)}</span>。
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  其中 <span className="font-semibold text-gray-700">{t.externalUnknownProfitCards}</span>{' '}
                  张为外部站发卡，售价不由本站决定、收入未回传，利润未计入上方「利润合计」；
                  这部分成本已计入「成本合计」，因此整体毛利率会被低估。
                </p>
              </div>
            </div>
          </div>
        )}

        {t && t.unknownProfitCards > t.externalUnknownProfitCards && (
          <p className="text-xs text-amber-600">
            注：本区间另有 {t.unknownProfitCards - t.externalUnknownProfitCards} 张本站发出的卡密没有售价快照
            （多为改造前的历史发卡），利润未知，未计入利润合计。
          </p>
        )}
      </CardContent>
    </Card>
  )
}
