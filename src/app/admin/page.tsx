'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, Users, DollarSign, Wallet } from 'lucide-react'
import OrderAnalytics from '@/components/admin/order-analytics'
import CardKeyAnalytics from '@/components/admin/cardkey-analytics'
import { SourceBadge, type SourceSite } from '@/components/admin/source-site'

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

const payStatusLabel: Record<string, { label: string; className: string }> = {
  UNPAID: { label: '待支付', className: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: '已支付', className: 'bg-green-100 text-green-700' },
  REFUNDED: { label: '已退款', className: 'bg-gray-100 text-gray-600' },
}

const deliveryStatusLabel: Record<string, { label: string; className: string }> = {
  PENDING: { label: '待处理', className: 'bg-yellow-100 text-yellow-700' },
  PROCESSING: { label: '处理中', className: 'bg-blue-100 text-blue-700' },
  DELIVERED: { label: '已完成', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: '已取消', className: 'bg-gray-100 text-gray-600' },
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  // 有渠道销售额时才在「总收入」下分列主站 / 渠道（休眠期只有主站，卡片与原来一样）
  const channelSites = (stats?.revenueBySite ?? []).filter((s) => s.tenantId !== 1)
  const revenueNote =
    stats && channelSites.length
      ? `主站 ¥${(stats.mainRevenue ?? 0).toFixed(2)} · 渠道 ¥${(stats.channelRevenue ?? 0).toFixed(2)}（${channelSites
          .map((s) => `${s.code} ¥${s.revenue.toFixed(2)}`)
          .join('，')}）`
      : null

  const statCards: { title: string; value: string | number; icon: typeof DollarSign; color: string; note?: string | null }[] = [
    {
      title: '总收入',
      value: stats ? `¥${stats.totalRevenue.toFixed(2)}` : '--',
      icon: DollarSign,
      color: 'bg-green-500',
      // 口径：已付款未取消、不含余额充值（充值是预收款，买家用余额消费时那张单才计营收）
      note: revenueNote ?? '已付款未取消，不含余额充值',
    },
    {
      title: '总订单',
      value: stats?.totalOrders ?? '--',
      icon: ShoppingCart,
      color: 'bg-blue-500',
      note: '已付款订单数，不含余额充值',
    },
    {
      title: '今日充值入账',
      value: stats?.todayTopup ? `¥${(stats.todayTopup.cents / 100).toFixed(2)}` : '--',
      icon: Wallet,
      color: 'bg-cyan-500',
      note: stats?.todayTopup ? `${stats.todayTopup.count} 笔 · 不计入营收（预收款）` : null,
    },
    {
      title: '商品数量',
      value: stats?.totalProducts ?? '--',
      icon: Package,
      color: 'bg-purple-500',
    },
    {
      title: '注册用户',
      value: stats?.totalUsers ?? '--',
      icon: Users,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {loading ? '加载中...' : stat.value}
                  </p>
                  {stat.note && <p className="mt-1 text-xs text-gray-500">{stat.note}</p>}
                </div>
                <div className={`rounded-lg ${stat.color} p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 短信接码（已定稿）：营收 / 真实成本 / 毛利 / 亏损（docs/短信接码-设计.md §6.6 第 28 条、§9.5） */}
      {stats?.jiema && (stats.jiema.last30.finalized > 0 || stats.jiema.last30.cancelled.count > 0 || stats.jiema.today.estimating > 0) && (
        <Card>
          <CardContent className="space-y-2 p-6 text-sm text-gray-700">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-gray-900">短信接码（已定稿）</h2>
              <a href="/admin/jiema" className="text-xs text-primary-600 hover:underline">
                接码后台 →
              </a>
            </div>
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
              上面的「总收入」按订单金额统计（含进行中的接码单），两者口径不同。
            </p>
          </CardContent>
        </Card>
      )}

      {/* ① 外部订单导入（数据源：ExternalOrder，人工/脚本导入的代开单） */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">外部订单导入</h2>
          <p className="text-xs text-gray-500">
            数据源：ExternalOrder（闲鱼等渠道代开的订阅单），按开通时间统计。
          </p>
        </div>
        <OrderAnalytics />
      </div>

      {/* ② 网站自助下单（数据源：CardKey，买家在站内下单后自动发货的卡密） */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">网站自助下单（卡密）</h2>
          <p className="text-xs text-gray-500">
            数据源：CardKey 发出记录（站内自动发货 + 外部站调库存 API 领卡），按发出时间统计成本 / 流水 / 利润。
          </p>
        </div>
        <CardKeyAnalytics />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近订单</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : !stats?.recentOrders || stats.recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">暂无订单</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">订单号</th>
                    <th className="pb-3 font-medium">来源站</th>
                    <th className="pb-3 font-medium">用户</th>
                    <th className="pb-3 font-medium">商品</th>
                    <th className="pb-3 font-medium">金额</th>
                    <th className="pb-3 font-medium">支付</th>
                    <th className="pb-3 font-medium">交付</th>
                    <th className="pb-3 font-medium">时间</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50">
                      <td className="py-3 font-medium text-gray-900">{order.orderNo}</td>
                      <td className="py-3">
                        <SourceBadge source={order.source ?? { tenantId: 1, code: 'main' }} />
                      </td>
                      <td className="py-3 text-gray-600">{order.user.nickname || order.user.email}</td>
                      <td className="py-3 text-gray-600">{order.productName}</td>
                      <td className="py-3 text-gray-900">¥{Number(order.amount).toFixed(2)}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            payStatusLabel[order.payStatus]?.className || ''
                          }`}
                        >
                          {payStatusLabel[order.payStatus]?.label}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            deliveryStatusLabel[order.deliveryStatus]?.className || ''
                          }`}
                        >
                          {deliveryStatusLabel[order.deliveryStatus]?.label}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
