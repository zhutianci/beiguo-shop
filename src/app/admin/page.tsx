'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, Users, DollarSign } from 'lucide-react'
import OrderAnalytics from '@/components/admin/order-analytics'

interface Stats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  recentOrders: Array<{
    id: number
    orderNo: string
    productName: string
    amount: number
    payStatus: string
    deliveryStatus: string
    createdAt: string
    user: { email: string | null; nickname: string | null }
  }>
}

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

  const statCards = [
    {
      title: '总收入',
      value: stats ? `¥${stats.totalRevenue.toFixed(2)}` : '--',
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: '总订单',
      value: stats?.totalOrders ?? '--',
      icon: ShoppingCart,
      color: 'bg-blue-500',
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {loading ? '加载中...' : stat.value}
                  </p>
                </div>
                <div className={`rounded-lg ${stat.color} p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 订单数据分析（数据源：订单导入 / ExternalOrder） */}
      <OrderAnalytics />

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
