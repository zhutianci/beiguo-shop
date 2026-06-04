'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Eye } from 'lucide-react'

interface Order {
  id: number
  orderNo: string
  productName: string
  amount: string | number
  payStatus: string
  deliveryStatus: string
  deliveryInfo: string | null
  remark: string | null
  createdAt: string
  user: { id: number; email: string | null; nickname: string | null }
  product: { id: number; name: string }
}

const payStatusMap: Record<string, { label: string; className: string }> = {
  UNPAID: { label: '待支付', className: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: '已支付', className: 'bg-green-100 text-green-700' },
  REFUNDED: { label: '已退款', className: 'bg-gray-100 text-gray-600' },
}

const deliveryStatusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: '待处理', className: 'bg-yellow-100 text-yellow-700' },
  PROCESSING: { label: '处理中', className: 'bg-blue-100 text-blue-700' },
  DELIVERED: { label: '已完成', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: '已取消', className: 'bg-gray-100 text-gray-600' },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [deliveryInfo, setDeliveryInfo] = useState('')
  const [deliveryStatus, setDeliveryStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // 交付完成时同步导入「订单」所需信息
  const [extSubscriptionType, setExtSubscriptionType] = useState('')
  const [extStartDate, setExtStartDate] = useState('')
  const [extXianyuNickname, setExtXianyuNickname] = useState('')
  const [extClaudeAccount, setExtClaudeAccount] = useState('')

  const todayIso = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const url = filterStatus
        ? `/api/admin/orders?status=${filterStatus}`
        : '/api/admin/orders'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) setOrders(data.data.list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterStatus])

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNo.includes(searchTerm) ||
      (o.user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order)
    setDeliveryInfo(order.deliveryInfo || '')
    setDeliveryStatus(order.deliveryStatus)
    // 预填导入「订单」的默认值
    setExtSubscriptionType(order.productName)
    setExtStartDate(todayIso())
    setExtXianyuNickname(order.user.nickname || order.user.email || '')
    setExtClaudeAccount('')
    setShowDetailModal(true)
  }

  const handleUpdate = async () => {
    if (!selectedOrder) return

    // 标记为「已完成」时要求填写 Claude 账户，才能同步导入到「订单」
    const willDeliver = deliveryStatus === 'DELIVERED'
    if (willDeliver && selectedOrder.deliveryStatus !== 'DELIVERED' && !extClaudeAccount.trim()) {
      if (!confirm('未填写 Claude 账户，将不会同步导入到「订单」列表。仍要继续吗？')) return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryStatus,
          deliveryInfo: deliveryInfo || null,
          external: willDeliver
            ? {
                subscriptionType: extSubscriptionType.trim() || null,
                startDate: extStartDate || null,
                xianyuNickname: extXianyuNickname.trim() || null,
                claudeAccount: extClaudeAccount.trim() || null,
              }
            : undefined,
        }),
      })
      const data = await res.json()

      if (!data.success) {
        alert(data.error || '更新失败')
        return
      }

      if (data.data?.imported) {
        alert('已保存，并已同步导入到「订单」列表')
      }

      setShowDetailModal(false)
      loadData()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索订单号/用户/商品..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
            >
              <option value="">全部状态</option>
              <option value="PENDING">待处理</option>
              <option value="PROCESSING">处理中</option>
              <option value="DELIVERED">已完成</option>
              <option value="CANCELLED">已取消</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无订单</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">订单号</th>
                    <th className="pb-3 font-medium">用户</th>
                    <th className="pb-3 font-medium">商品</th>
                    <th className="pb-3 font-medium">金额</th>
                    <th className="pb-3 font-medium">支付状态</th>
                    <th className="pb-3 font-medium">交付状态</th>
                    <th className="pb-3 font-medium">下单时间</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50">
                      <td className="py-4 font-medium text-gray-900">{order.orderNo}</td>
                      <td className="py-4 text-gray-600">{order.user.nickname || order.user.email}</td>
                      <td className="py-4 text-gray-600">{order.productName}</td>
                      <td className="py-4 text-gray-900">¥{Number(order.amount).toFixed(2)}</td>
                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            payStatusMap[order.payStatus]?.className || ''
                          }`}
                        >
                          {payStatusMap[order.payStatus]?.label}
                        </span>
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            deliveryStatusMap[order.deliveryStatus]?.className || ''
                          }`}
                        >
                          {deliveryStatusMap[order.deliveryStatus]?.label}
                        </span>
                      </td>
                      <td className="py-4 text-gray-500">
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => handleViewDetail(order)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-semibold">订单详情</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">订单号：</span>
                  <span className="font-medium">{selectedOrder.orderNo}</span>
                </div>
                <div>
                  <span className="text-gray-500">用户：</span>
                  <span className="font-medium">{selectedOrder.user.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">商品：</span>
                  <span className="font-medium">{selectedOrder.productName}</span>
                </div>
                <div>
                  <span className="text-gray-500">金额：</span>
                  <span className="font-medium text-primary-600">
                    ¥{Number(selectedOrder.amount).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">支付状态：</span>
                  <span className="font-medium">
                    {payStatusMap[selectedOrder.payStatus]?.label}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">下单时间：</span>
                  <span className="font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>

              {selectedOrder.remark && (
                <div className="text-sm">
                  <div className="text-gray-500 mb-1">用户备注：</div>
                  <div className="rounded-lg bg-gray-50 p-3">{selectedOrder.remark}</div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  交付状态
                </label>
                <select
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                >
                  <option value="PENDING">待处理</option>
                  <option value="PROCESSING">处理中</option>
                  <option value="DELIVERED">已完成</option>
                  <option value="CANCELLED">已取消</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  交付信息（账号/密码/备注等）
                </label>
                <textarea
                  value={deliveryInfo}
                  onChange={(e) => setDeliveryInfo(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                  rows={4}
                  placeholder="请输入交付信息..."
                />
              </div>

              {deliveryStatus === 'DELIVERED' && (
                <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-4 space-y-3">
                  <div className="text-sm font-medium text-primary-800">
                    同步导入到「订单」列表
                    <span className="ml-1 font-normal text-xs text-primary-600">
                      （标记为「已完成」后自动写入订单管理，可在订单页继续维护成本/报价、开发票等）
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">订阅类型</label>
                      <input
                        type="text"
                        value={extSubscriptionType}
                        onChange={(e) => setExtSubscriptionType(e.target.value)}
                        placeholder="默认 = 商品名称"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">开通时间</label>
                      <input
                        type="date"
                        value={extStartDate}
                        onChange={(e) => setExtStartDate(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">闲鱼昵称</label>
                      <input
                        type="text"
                        value={extXianyuNickname}
                        onChange={(e) => setExtXianyuNickname(e.target.value)}
                        placeholder="默认 = 用户名称"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Claude 账户 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={extClaudeAccount}
                        onChange={(e) => setExtClaudeAccount(e.target.value)}
                        placeholder="开通的 Claude 账户邮箱"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    到期时间将按「开通时间 + 1 个月」自动计算；报价默认取本订单金额 ¥{Number(selectedOrder.amount).toFixed(2)}。
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  关闭
                </Button>
                <Button onClick={handleUpdate} loading={submitting}>
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
