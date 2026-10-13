'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Clock,
  Minus,
  Package,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  Users,
  Wallet,
  Coins,
} from 'lucide-react'
import { SourceBadge, type SourceSite } from '@/components/admin/source-site'
import { ColumnChart, Sparkline, TrendChart, dateLabel } from '@/components/admin/dashboard/charts'
import type { Overview } from '@/lib/admin/overview'

/*
 * 两块明细分析（各带自己的筛选、图和表，合计近千行组件、挂载即各发 1~2 个请求）不进首屏：
 * 滚到附近才加载代码并取数，而且同一时间只挂载选中的那一块。首屏只发两个请求（总览 + 经营概览）。
 */
const AnalyticsFallback = () => <div className="py-16 text-center text-sm text-gray-400">加载分析模块…</div>
const CardKeyAnalytics = dynamic(() => import('@/components/admin/cardkey-analytics'), { ssr: false, loading: AnalyticsFallback })
const OrderAnalytics = dynamic(() => import('@/components/admin/order-analytics'), { ssr: false, loading: AnalyticsFallback })

interface Stats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  /** 按来源站拆分（设计 12.2、4.10 ④）：口径同 totalRevenue（已付且未取消），各项之和 = totalRevenue */
  mainRevenue?: number
  channelRevenue?: number
  revenueBySite?: Array<SourceSite & { revenue: number; orders: number }>
  /** 今日（北京时间）充值入账：充值格 TOPUP 流水合计（分），**不计入营收**（docs/短信接码-设计.md D40、§6.6 第 17 条） */
  todayTopup?: { cents: number; count: number }
  /** 短信接码（已定稿）的营收 / 真实成本 / 毛利 / 亏损（分；§9.5 口径，今天与近 30 天） */
  jiema?: { today: JiemaFinance; last30: JiemaFinance } | null
  /** 待办：已付款还在处理中的单、待支付的单 */
  todo?: { processing: number; unpaid: number }
  recentOrders: Array<{
    id: number
    orderNo: string
    productName: string
    amount: number
    payStatus: string
    deliveryStatus: string
    createdAt: string
    source?: SourceSite
    user: { email: string | null; nickname: string | null }
  }>
}

interface JiemaFinance {
  finalized: number
  revenueCents: number
  chargedMicro: number
  costCents: number
  refundOffsetCents: number
  profitCents: number
  cancelled: { count: number; topupCents: number; cashCents: number }
  lossCents: number
  estimating: number
}

const yc = (c: number) => `¥${(c / 100).toFixed(2)}`
const money = (n: number) => '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
/** 大数字用：过万不带小数，免得一行放不下 */
const moneyBig = (n: number) =>
  '¥' + n.toLocaleString('zh-CN', Math.abs(n) >= 10000 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// 三个指标各一个固定颜色，整页一致：流水蓝、利润绿、单数紫
const C_REVENUE = '#2a78d6'
const C_PROFIT = '#12a06e'
const C_ORDERS = '#6a5acd'

const payStatusLabel: Record<string, { label: string; className: string }> = {
  UNPAID: { label: '待支付', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  PAID: { label: '已支付', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  REFUNDED: { label: '已退款', className: 'bg-gray-50 text-gray-600 ring-gray-200' },
}

const deliveryStatusLabel: Record<string, { label: string; className: string }> = {
  PENDING: { label: '待处理', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  PROCESSING: { label: '处理中', className: 'bg-sky-50 text-sky-700 ring-sky-200' },
  DELIVERED: { label: '已完成', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  CANCELLED: { label: '已取消', className: 'bg-gray-50 text-gray-600 ring-gray-200' },
}

/*
 * 【先显示上次的数，再静默刷新】仪表盘是进后台的第一屏，也是从别的页面点回来最多的一屏。
 * 把上一次成功的响应放在 sessionStorage（只在这个标签页、关掉就没），再进来时立刻画出来，同时在后台取新的。
 * 存取都包 try：隐私模式 / 存储被禁用时照常工作，只是没有「秒开」。
 */
function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function writeCache(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 存不下就算了 */
  }
}

const RANGES = [7, 30, 90] as const
type Range = (typeof RANGES)[number]

/** 环比：上一期为 0 时没有百分比可言 */
function Delta({ now, prev, label, dark = false }: { now: number; prev: number; label: string; dark?: boolean }) {
  if (prev === 0 && now === 0) {
    return <span className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>{label}持平</span>
  }
  if (prev <= 0) {
    return <span className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>{label}无可比数据</span>
  }
  const pct = ((now - prev) / prev) * 100
  const flat = Math.abs(pct) < 0.05
  const up = pct > 0
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  const tone = flat
    ? dark
      ? 'bg-white/10 text-white/60'
      : 'bg-gray-100 text-gray-500'
    : up
      ? dark
        ? 'bg-emerald-400/15 text-emerald-300'
        : 'bg-emerald-50 text-emerald-700'
      : dark
        ? 'bg-rose-400/15 text-rose-300'
        : 'bg-rose-50 text-rose-700'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium tabular-nums ${tone}`}>
        <Icon className="h-3 w-3" />
        {flat ? '0%' : `${Math.abs(pct) >= 1000 ? '999+' : Math.abs(pct).toFixed(1)}%`}
      </span>
      <span className={dark ? 'text-white/40' : 'text-gray-400'}>{label}</span>
    </span>
  )
}

function Panel({ title, sub, right, children, className = '' }: { title: string; sub?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-gray-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-gray-900">{title}</h2>
          {sub && <div className="mt-0.5 text-xs text-gray-500">{sub}</div>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function TipRow({ color, label, value }: { color?: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="inline-flex items-center gap-1.5 text-gray-500">
        {color ? <span className="h-2 w-2 rounded-full" style={{ background: color }} /> : <span className="w-2" />}
        {label}
      </span>
      <span className="tabular-nums text-gray-900">{value}</span>
    </div>
  )
}

/** 滚到附近才渲染 children（一次性） */
function WhenVisible({ children, minHeight = 240 }: { children: ReactNode; minHeight?: number }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen])
  return (
    <div ref={ref} style={seen ? undefined : { minHeight }}>
      {seen ? children : null}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [range, setRange] = useState<Range>(30)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [tab, setTab] = useState<'cardkeys' | 'external'>('cardkeys')
  const seq = useRef(0)

  const load = useCallback(async (days: Range, opts?: { manual?: boolean }) => {
    const my = ++seq.current
    setRefreshing(true)
    setLoadError('')
    try {
      const [s, o] = await Promise.all([
        fetch('/api/admin/stats').then((r) => r.json()),
        fetch(`/api/admin/stats/overview?days=${days}`).then((r) => r.json()),
      ])
      if (my !== seq.current) return
      if (s?.success) {
        setStats(s.data)
        writeCache('admin:stats', s.data)
      }
      if (o?.success) {
        setOverview(o.data)
        writeCache(`admin:overview:${days}`, o.data)
      }
      if (!s?.success || !o?.success) setLoadError(s?.error || o?.error || '部分数据加载失败')
      else setUpdatedAt(new Date())
    } catch {
      if (my === seq.current) setLoadError(opts?.manual ? '刷新失败，请检查网络后重试' : '数据加载失败，请稍后刷新')
    } finally {
      if (my === seq.current) setRefreshing(false)
    }
  }, [])

  // 进页面 / 切区间：先摆上次的数（有的话），再取新的
  useEffect(() => {
    const cachedStats = readCache<Stats>('admin:stats')
    if (cachedStats) setStats((cur) => cur ?? cachedStats)
    const cachedOverview = readCache<Overview>(`admin:overview:${range}`)
    if (cachedOverview) setOverview(cachedOverview)
    load(range)
  }, [range, load])

  // 切回这个标签页时，数据超过 2 分钟就自动刷新一次（不做定时轮询：开着不看的后台标签页不该一直打库）
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (!updatedAt || Date.now() - updatedAt.getTime() > 120_000) load(range)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [updatedAt, range, load])

  const daily = overview?.daily ?? []
  const today = daily[daily.length - 1]
  const yesterday = daily[daily.length - 2]
  const ov = overview
  // 文案里的天数跟着「正在显示的数据」走：切区间后新数据还没回来的那一下，标题不能先变成新区间
  const days = overview?.range.days ?? range
  const totals = ov?.totals
  const prevTotals = ov?.prevTotals
  const marginPct = totals && totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : null
  const maxProduct = Math.max(1, ...(ov?.topProducts ?? []).map((p) => p.revenue))
  const firstLoad = !overview

  const channelSites = (stats?.revenueBySite ?? []).filter((s) => s.tenantId !== 1)

  const heroTiles: { label: string; value: string; delta: ReactNode; spark: number[]; color: string }[] = [
    {
      label: '今日流水',
      value: today ? moneyBig(today.revenue) : '—',
      delta: today && yesterday ? <Delta dark now={today.revenue} prev={yesterday.revenue} label="较昨日全天" /> : null,
      spark: daily.slice(-14).map((d) => d.revenue),
      color: '#7fb6ff',
    },
    {
      label: '今日利润',
      value: today ? moneyBig(today.profit) : '—',
      delta: today && yesterday ? <Delta dark now={today.profit} prev={yesterday.profit} label="较昨日全天" /> : null,
      spark: daily.slice(-14).map((d) => d.profit),
      color: '#5fe0b0',
    },
    {
      label: `近 ${days} 天流水`,
      value: totals ? moneyBig(totals.revenue) : '—',
      delta: totals && prevTotals ? <Delta dark now={totals.revenue} prev={prevTotals.revenue} label={`较前 ${days} 天`} /> : null,
      spark: daily.map((d) => d.revenue),
      color: '#7fb6ff',
    },
    {
      label: `近 ${days} 天利润`,
      value: totals ? moneyBig(totals.profit) : '—',
      delta: totals && prevTotals ? <Delta dark now={totals.profit} prev={prevTotals.profit} label={`较前 ${days} 天`} /> : null,
      spark: daily.map((d) => d.profit),
      color: '#5fe0b0',
    },
  ]

  const quickTiles: { label: string; value: string; note?: string; icon: typeof Clock; href?: string; alert?: boolean }[] = [
    {
      label: '待发货 / 处理中',
      value: stats?.todo ? String(stats.todo.processing) : '—',
      note: '已付款、还没完成的单',
      icon: PackageCheck,
      href: '/admin/orders',
      alert: (stats?.todo?.processing ?? 0) > 0,
    },
    { label: '待支付', value: stats?.todo ? String(stats.todo.unpaid) : '—', note: '下了单还没付款', icon: Clock, href: '/admin/orders' },
    {
      label: '今日充值入账',
      value: stats?.todayTopup ? yc(stats.todayTopup.cents) : '—',
      note: stats?.todayTopup ? `${stats.todayTopup.count} 笔 · 预收款，不计入流水` : undefined,
      icon: Wallet,
      href: '/admin/wallet',
    },
    {
      label: '累计收入',
      value: stats ? moneyBig(stats.totalRevenue) : '—',
      // 口径：已付款未取消、不含余额充值（充值是预收款，买家用余额消费时那张单才计营收）
      note: channelSites.length
        ? `主站 ¥${(stats?.mainRevenue ?? 0).toFixed(0)} · 渠道 ¥${(stats?.channelRevenue ?? 0).toFixed(0)}`
        : '站内订单，已付款未取消',
      icon: Coins,
    },
    { label: '累计订单', value: stats ? stats.totalOrders.toLocaleString('zh-CN') : '—', note: '已付款，不含余额充值', icon: ShoppingCart, href: '/admin/orders' },
    { label: '注册用户', value: stats ? stats.totalUsers.toLocaleString('zh-CN') : '—', icon: Users, href: '/admin/users' },
    { label: '商品', value: stats ? String(stats.totalProducts) : '—', icon: Package, href: '/admin/products' },
  ]

  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      {/* ── 经营概览：深色主视觉，四个关键数字 ── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1020] p-6 text-white shadow-[0_24px_60px_-28px_rgba(11,16,32,0.7)] sm:p-7">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#2a78d6] opacity-25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-96 rounded-full bg-[#12a06e] opacity-15 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">经营概览</h2>
            <p className="mt-1 text-xs text-white/50">
              {overview ? `${overview.range.from} 至 ${overview.range.to}` : '加载中…'}
              {updatedAt && ` · 更新于 ${updatedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`}
              {loadError && <span className="ml-2 text-rose-300">{loadError}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full bg-white/[0.08] p-1 ring-1 ring-inset ring-white/10" role="group" aria-label="统计区间">
              {RANGES.map((d) => (
                <button
                  key={d}
                  onClick={() => setRange(d)}
                  aria-pressed={range === d}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    range === d ? 'bg-white text-gray-900 shadow-sm' : 'text-white/60 hover:text-white'
                  }`}
                >
                  近 {d} 天
                </button>
              ))}
            </div>
            <button
              onClick={() => load(range, { manual: true })}
              disabled={refreshing}
              title="刷新"
              aria-label="刷新数据"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white/70 ring-1 ring-inset ring-white/10 transition-colors hover:text-white disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {heroTiles.map((t) => (
            <div key={t.label} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/[0.08] backdrop-blur-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-white/60">{t.label}</span>
                {t.spark.length > 1 && <Sparkline values={t.spark} color={t.color} width={96} height={30} />}
              </div>
              <div className={`mt-2 text-[28px] font-semibold leading-none tracking-tight ${firstLoad ? 'animate-pulse text-white/30' : ''}`}>{t.value}</div>
              <div className="mt-3 min-h-[20px]">{t.delta}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 流水曲线 / 利润曲线：量级不同，各用自己的纵轴，不挤在一张图上 ── */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="流水曲线"
          sub={
            totals ? (
              <>
                近 {days} 天合计 <b className="font-semibold text-gray-900">{money(totals.revenue)}</b> · 日均 {money(totals.revenue / days)}
              </>
            ) : (
              '加载中…'
            )
          }
          right={
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
              <span className="h-0.5 w-4 rounded-full" style={{ background: C_REVENUE }} />
              每日流水（元）
            </span>
          }
        >
          {daily.length ? (
            <TrendChart
              data={daily.map((d) => ({ date: d.date, value: d.revenue }))}
              color={C_REVENUE}
              ariaLabel={`近 ${days} 天每日流水曲线`}
              renderTooltip={(i) => {
                const d = daily[i]
                return (
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{dateLabel(d.date)}</div>
                    <TipRow color={C_REVENUE} label="流水" value={money(d.revenue)} />
                    <TipRow label={`站内订单 ${d.siteOrders} 单`} value={money(d.siteRevenue)} />
                    <TipRow label={`外部导入 ${d.extOrders} 单`} value={money(d.extRevenue)} />
                  </div>
                )
              }}
            />
          ) : (
            <ChartSkeleton />
          )}
        </Panel>

        <Panel
          title="利润曲线"
          sub={
            totals ? (
              <>
                近 {days} 天合计 <b className="font-semibold text-gray-900">{money(totals.profit)}</b>
                {marginPct != null && ` · 利润率 ${marginPct.toFixed(1)}%`} · 日均 {money(totals.profit / days)}
              </>
            ) : (
              '加载中…'
            )
          }
          right={
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
              <span className="h-0.5 w-4 rounded-full" style={{ background: C_PROFIT }} />
              每日利润（元）
            </span>
          }
        >
          {daily.length ? (
            <TrendChart
              data={daily.map((d) => ({ date: d.date, value: d.profit }))}
              color={C_PROFIT}
              ariaLabel={`近 ${days} 天每日利润曲线`}
              renderTooltip={(i) => {
                const d = daily[i]
                return (
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{dateLabel(d.date)}</div>
                    <TipRow color={C_PROFIT} label="利润" value={money(d.profit)} />
                    <TipRow label="卡密利润" value={money(d.cardProfit)} />
                    <TipRow label="外部导入利润" value={money(d.extProfit)} />
                    {d.revenue > 0 && <TipRow label="利润率" value={`${((d.profit / d.revenue) * 100).toFixed(1)}%`} />}
                  </div>
                )
              }}
            />
          ) : (
            <ChartSkeleton />
          )}
        </Panel>
      </div>

      {/* ── 成交单数 + 商品流水排行 ── */}
      <div className="grid gap-5 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          title="每日成交单数"
          sub={
            totals ? (
              <>
                近 {days} 天共 <b className="font-semibold text-gray-900">{totals.orders.toLocaleString('zh-CN')}</b> 单
                {totals.orders > 0 && ` · 客单价 ${money(totals.revenue / totals.orders)}`}
                {prevTotals && (
                  <span className="ml-2 inline-block align-middle">
                    <Delta now={totals.orders} prev={prevTotals.orders} label={`较前 ${days} 天`} />
                  </span>
                )}
              </>
            ) : (
              '加载中…'
            )
          }
        >
          {daily.length ? (
            <ColumnChart
              data={daily.map((d) => ({ date: d.date, value: d.orders }))}
              color={C_ORDERS}
              height={228}
              ariaLabel={`近 ${days} 天每日成交单数`}
              renderTooltip={(i) => {
                const d = daily[i]
                return (
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{dateLabel(d.date)}</div>
                    <TipRow color={C_ORDERS} label="成交" value={`${d.orders} 单`} />
                    <TipRow label="站内订单" value={`${d.siteOrders} 单`} />
                    <TipRow label="外部导入" value={`${d.extOrders} 单`} />
                  </div>
                )
              }}
            />
          ) : (
            <ChartSkeleton height={228} />
          )}
        </Panel>

        <Panel className="xl:col-span-2" title="商品流水排行" sub={`近 ${days} 天站内订单，按流水从高到低`}>
          {!ov ? (
            <ChartSkeleton height={228} />
          ) : ov.topProducts.length === 0 ? (
            <div className="flex h-[228px] items-center justify-center text-sm text-gray-400">这段时间还没有站内成交</div>
          ) : (
            <ol className="space-y-3">
              {ov.topProducts.map((p, i) => (
                <li key={p.name}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="min-w-0 truncate text-gray-700" title={p.name}>
                      <span className="mr-2 inline-block w-4 text-right tabular-nums text-gray-400">{i + 1}</span>
                      {p.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-gray-900">
                      {money(p.revenue)}
                      <span className="ml-1.5 text-xs text-gray-400">{p.orders} 单</span>
                    </span>
                  </div>
                  <div className="ml-6 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(2, (p.revenue / maxProduct) * 100)}%`, background: C_REVENUE }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      {/* 口径说明：两条曲线是两类来源相加，写清楚免得和下面明细的数对不上时不知道差在哪 */}
      <p className="px-1 text-xs leading-relaxed text-gray-400">
        口径：流水 = 站内订单实收（已付款未取消、不含余额充值，按到账日）+ 外部导入订单的报价（按开通日）；利润 = 卡密利润（按发出日，已取消 / 已退款的单不计、不扣内推返现）+
        外部导入订单的利润。人工服务单与短信接码没有逐单成本，不在利润曲线里。日切点为北京时间 0 点。
        {ov && ov.unknownProfitCards > 0 && ` 本期另有 ${ov.unknownProfitCards} 张已发出的卡利润未知（外部站发卡等），未计入。`}
      </p>

      {/* ── 待办与累计 ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        {quickTiles.map((t) => {
          const body = (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-gray-500">{t.label}</span>
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${t.alert ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                  <t.icon className="h-4 w-4" />
                </span>
              </div>
              <div className={`mt-2 text-xl font-semibold tracking-tight ${t.alert ? 'text-amber-600' : 'text-gray-900'}`}>{t.value}</div>
              <div className="mt-1 min-h-[16px] truncate text-xs text-gray-400" title={t.note}>
                {t.note}
              </div>
            </>
          )
          const cls = 'block rounded-2xl border border-gray-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
          return t.href ? (
            <Link key={t.label} href={t.href} className={`${cls} transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)]`}>
              {body}
            </Link>
          ) : (
            <div key={t.label} className={cls}>
              {body}
            </div>
          )
        })}
      </div>

      {/* 短信接码（已定稿）：营收 / 真实成本 / 毛利 / 亏损（docs/短信接码-设计.md §6.6 第 28 条、§9.5） */}
      {stats?.jiema && (stats.jiema.last30.finalized > 0 || stats.jiema.last30.cancelled.count > 0 || stats.jiema.today.estimating > 0) && (
        <Panel
          title="短信接码（已定稿）"
          right={
            <Link href="/admin/jiema" className="inline-flex items-center text-xs text-primary-600 hover:underline">
              接码后台
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="space-y-2 text-sm text-gray-700">
            {(
              [
                ['今天', stats.jiema.today],
                ['近 30 天', stats.jiema.last30],
              ] as const
            ).map(([label, f]) => (
              <div key={label} className="flex flex-wrap gap-x-5 gap-y-1">
                <span className="w-16 text-gray-500">{label}</span>
                <span>
                  营收 <b>{yc(f.revenueCents)}</b>（{f.finalized} 单）
                </span>
                <span>
                  真实成本 <b>{yc(f.costCents)}</b>
                </span>
                {f.refundOffsetCents > 0 && <span>售后冲减 −{yc(f.refundOffsetCents)}</span>}
                <span>
                  毛利 <b className={f.profitCents >= 0 ? 'text-green-700' : 'text-red-600'}>{yc(f.profitCents)}</b>
                </span>
                <span>
                  亏损 <b className={f.lossCents > 0 ? 'text-red-600' : ''}>{yc(f.lossCents)}</b>
                </span>
                <span className="text-gray-500">
                  已取消 {f.cancelled.count} 单（退回余额 {yc(f.cancelled.topupCents + f.cancelled.cashCents)}，不计成本利润）
                </span>
              </div>
            ))}
            <p className="text-xs text-gray-400">
              只算定稿的单（订单结束、所有号码都终态）；真实成本 = Σ 逐单成本（上游实扣 × 下单时的成本汇率，向上取整到分）。预估中 {stats.jiema.today.estimating} 单不计入。
              上面的流水按订单金额统计（含进行中的接码单），两者口径不同。
            </p>
          </div>
        </Panel>
      )}

      {/* ── 最近订单 ── */}
      <Panel
        title="最近订单"
        right={
          <Link href="/admin/orders" className="inline-flex items-center text-xs text-primary-600 hover:underline">
            全部订单
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {!stats ? (
          <div className="py-8 text-center text-sm text-gray-400">加载中…</div>
        ) : stats.recentOrders.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">暂无订单</div>
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400">
                  <th className="px-2 pb-2 font-medium">订单号</th>
                  <th className="px-2 pb-2 font-medium">来源站</th>
                  <th className="px-2 pb-2 font-medium">用户</th>
                  <th className="px-2 pb-2 font-medium">商品</th>
                  <th className="px-2 pb-2 text-right font-medium">金额</th>
                  <th className="px-2 pb-2 font-medium">支付</th>
                  <th className="px-2 pb-2 font-medium">交付</th>
                  <th className="px-2 pb-2 text-right font-medium">时间</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-100 transition-colors hover:bg-gray-50/70">
                    <td className="px-2 py-2.5 font-mono text-[13px] text-gray-900">{order.orderNo}</td>
                    <td className="px-2 py-2.5">
                      <SourceBadge source={order.source ?? { tenantId: 1, code: 'main' }} />
                    </td>
                    <td className="max-w-[180px] truncate px-2 py-2.5 text-gray-600">{order.user.nickname || order.user.email}</td>
                    <td className="max-w-[260px] truncate px-2 py-2.5 text-gray-600" title={order.productName}>
                      {order.productName}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-gray-900">¥{Number(order.amount).toFixed(2)}</td>
                    <td className="px-2 py-2.5">
                      <StatusPill {...(payStatusLabel[order.payStatus] ?? { label: order.payStatus, className: 'bg-gray-50 text-gray-600 ring-gray-200' })} />
                    </td>
                    <td className="px-2 py-2.5">
                      <StatusPill {...(deliveryStatusLabel[order.deliveryStatus] ?? { label: order.deliveryStatus, className: 'bg-gray-50 text-gray-600 ring-gray-200' })} />
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-gray-500">
                      {new Date(order.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ── 明细分析：可自选区间 / 商品，带表格。滚到这里才加载，两块只挂载选中的一块 ── */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">明细分析</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {tab === 'cardkeys'
                ? '网站自助下单：CardKey 发出记录（站内自动发货 + 外部站调库存 API 领卡），按发出时间统计成本 / 流水 / 利润。'
                : '外部订单导入：ExternalOrder（闲鱼等渠道代开的订阅单），按开通时间统计。'}
            </p>
          </div>
          <div className="inline-flex rounded-full bg-gray-200/70 p-1" role="tablist" aria-label="明细分析">
            {(
              [
                ['cardkeys', '网站自助下单（卡密）'],
                ['external', '外部订单导入'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <WhenVisible minHeight={320}>{tab === 'cardkeys' ? <CardKeyAnalytics /> : <OrderAnalytics />}</WhenVisible>
      </section>
    </div>
  )
}

function StatusPill({ label, className }: { label: string; className: string }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>{label}</span>
}

function ChartSkeleton({ height = 248 }: { height?: number }) {
  return (
    <div className="flex animate-pulse items-end gap-1.5" style={{ height }} aria-hidden>
      {[38, 52, 44, 66, 58, 72, 49, 80, 62, 70, 55, 88, 74, 60].map((h, i) => (
        <div key={i} className="flex-1 rounded-t bg-gray-100" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}
