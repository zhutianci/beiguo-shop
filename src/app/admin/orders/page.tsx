'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Eye, MessageSquare } from 'lucide-react'
import OrderChat from '@/components/order-chat'

interface Order {
  id: number
  orderNo: string
  productName: string
  amount: string | number
  payStatus: string
  deliveryStatus: string
  deliveryInfo: string | null
  remark: string | null
  quantity?: number
  createdAt: string
  user: { id: number; email: string | null; nickname: string | null }
  product: { id: number; name: string; categoryId?: number; category?: { id: number; name: string } | null }
  cards?: string[] // 自动发货实际发出的卡密
  unreadCount?: number // 买家发来、商家未读的留言数
  cardCost?: number | null // 卡密成本合计（无卡密订单为 null）
  cardProfit?: number | null // 卡密利润合计（含未知利润的卡时为 null）
  cardProfitUnknown?: boolean // 该单存在利润未知的卡（外部站发卡）
}

interface Category {
  id: number
  name: string
}

interface Totals {
  orders: number
  amount: number
  cost: number | null
  profit: number | null
  truncated: boolean
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [onlyUnreplied, setOnlyUnreplied] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [categoryId, setCategoryId] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [deliveryInfo, setDeliveryInfo] = useState('')
  const [deliveryStatus, setDeliveryStatus] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [refilling, setRefilling] = useState(false)
  // 交付完成时同步导入「订单」所需信息
  const [extSubscriptionType, setExtSubscriptionType] = useState('')
  const [extStartDate, setExtStartDate] = useState('')
  const [extXianyuNickname, setExtXianyuNickname] = useState('')
  const [extClaudeAccount, setExtClaudeAccount] = useState('')

  const todayIso = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const abortRef = useRef<AbortController | null>(null)

  const loadData = async () => {
    // 取消上一次仍在进行的请求，避免旧响应后到、覆盖新结果（检索竞态）
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      if (debouncedSearch) params.set('keyword', debouncedSearch)
      if (onlyUnreplied) params.set('unreplied', '1')
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)
      if (categoryId) params.set('categoryId', String(categoryId))
      params.set('page', String(page))
      const res = await fetch(`/api/admin/orders?${params.toString()}`, { signal: controller.signal })
      const data = await res.json()
      // 仅当本次仍是最新请求时才应用结果
      if (data.success && abortRef.current === controller) {
        setOrders(data.data.list)
        setTotalPages(data.data.totalPages || 1)
        setTotal(data.data.total || 0)
        setTotals(data.data.totals || null)
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return // 已被更新的请求取代
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }

  // 输入防抖：停止输入 350ms 后才真正发起服务端检索
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350)
    return () => clearTimeout(t)
  }, [searchTerm])

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filterStatus, onlyUnreplied, fromDate, toDate, categoryId, page])

  // 分类下拉数据
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(Array.isArray(d.data) ? d.data : d.data?.list || [])
      })
      .catch(() => {})
  }, [])

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order)
    setDeliveryInfo(order.deliveryInfo || '')
    setDeliveryStatus(order.deliveryStatus)
    setAmount(String(Number(order.amount)))
    // 预填导入「订单」的默认值
    setExtSubscriptionType(order.productName)
    setExtStartDate(todayIso())
    setExtXianyuNickname(order.user.nickname || order.user.email || '')
    setExtClaudeAccount('')
    setShowDetailModal(true)
  }

  // 补发卡密：只对已付款、尚未交付、卡密未发满的自动发货订单可用
  const handleRefill = async () => {
    if (!selectedOrder) return
    setRefilling(true)
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/refill`, { method: 'PUT' })
      const data = await res.json()
      if (data.success) {
        alert(data.message || '已补发')
        setShowDetailModal(false)
        loadData()
      } else {
        alert(data.error || '补发失败')
      }
    } finally {
      setRefilling(false)
    }
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
          ...(selectedOrder.payStatus === 'UNPAID' && amount && Number(amount) !== Number(selectedOrder.amount)
            ? { amount: Number(amount) }
            : {}),
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
                placeholder="搜索订单号 / 邮箱 / 用户名 / 商品..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
            >
              <option value="">全部状态</option>
              <option value="PENDING">待处理</option>
              <option value="PROCESSING">处理中</option>
              <option value="DELIVERED">已完成</option>
              <option value="CANCELLED">已取消</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setOnlyUnreplied((v) => !v)
                setPage(1)
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                onlyUnreplied
                  ? 'border-red-500 bg-red-50 text-red-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title="仅显示有买家留言且商家未读/未回复的订单"
            >
              <MessageSquare className="h-4 w-4" />
              只看未回复
            </button>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(Number(e.target.value))
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
            >
              <option value={0}>全部分类</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="whitespace-nowrap">下单时间</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setPage(1)
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <span>—</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setPage(1)
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {(fromDate || toDate || categoryId) && (
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('')
                    setToDate('')
                    setCategoryId(0)
                    setPage(1)
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  清除
                </button>
              )}
            </div>
          </div>

          {/* 当前筛选范围的汇总：流水来自订单金额，成本/利润来自卡密上落库的字段 */}
          {totals && (
            <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="text-xs text-gray-500">订单数</div>
                <div className="text-xl font-bold text-gray-800">{totals.orders}</div>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <div className="text-xs text-blue-700">流水合计</div>
                <div className="text-xl font-bold text-blue-700">¥{totals.amount.toFixed(2)}</div>
              </div>
              <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
                <div className="text-xs text-orange-700">成本合计</div>
                <div className="text-xl font-bold text-orange-700">
                  {totals.cost == null ? '—' : `¥${totals.cost.toFixed(2)}`}
                </div>
              </div>
              <div className="rounded-xl border border-green-100 bg-green-50 p-3">
                <div className="text-xs text-green-700">利润合计</div>
                <div className="text-xl font-bold text-green-700">
                  {totals.profit == null ? '—' : `¥${totals.profit.toFixed(2)}`}
                </div>
              </div>
              {totals.truncated && (
                <p className="col-span-2 sm:col-span-4 text-xs text-amber-600">
                  结果集过大（超过 10000 单），未统计成本与利润，请缩小日期范围后查看。
                </p>
              )}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {debouncedSearch || filterStatus || onlyUnreplied ? '没有符合条件的订单' : '暂无订单'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">订单号</th>
                    <th className="pb-3 font-medium">用户</th>
                    <th className="pb-3 font-medium">商品</th>
                    <th className="pb-3 font-medium">金额</th>
                    <th className="pb-3 font-medium">成本</th>
                    <th className="pb-3 font-medium">利润</th>
                    <th className="pb-3 font-medium">支付状态</th>
                    <th className="pb-3 font-medium">交付状态</th>
                    <th className="pb-3 font-medium">下单时间</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50">
                      <td className="py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{order.orderNo}</span>
                          {!!order.unreadCount && order.unreadCount > 0 && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white"
                              title={`买家有 ${order.unreadCount} 条未读留言`}
                            >
                              <MessageSquare className="h-3 w-3" />
                              {order.unreadCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-gray-600">{order.user.nickname || order.user.email}</td>
                      <td className="py-4 text-gray-600">
                        <div>{order.productName}</div>
                        {order.product?.category?.name && (
                          <div className="text-xs text-gray-400">{order.product.category.name}</div>
                        )}
                      </td>
                      <td className="py-4 text-gray-900">¥{Number(order.amount).toFixed(2)}</td>
                      <td className="py-4 text-gray-600">
                        {order.cardCost == null ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          `¥${order.cardCost.toFixed(2)}`
                        )}
                      </td>
                      <td className="py-4">
                        {order.cardProfit == null ? (
                          <span
                            className="text-gray-300"
                            title={
                              order.cardProfitUnknown
                                ? '该订单含外部站发出的卡密，收入未回传，利润未知'
                                : '该订单没有卡密（非自动发货），无法按卡密核算利润'
                            }
                          >
                            —
                          </span>
                        ) : (
                          <span className={order.cardProfit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            ¥{order.cardProfit.toFixed(2)}
                          </span>
                        )}
                      </td>
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

          {!loading && orders.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
              <div>
                共 {total} 条 · 第 {page} / {totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                >
                  下一页
                </Button>
              </div>
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

              {selectedOrder.cards && selectedOrder.cards.length > 0 && (
                <div className="text-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-gray-500">已发卡密（自动发货）：</span>
                    <span className="text-xs text-gray-400">
                      共 {selectedOrder.cards.length} 张
                      {selectedOrder.quantity ? ` / 应发 ${selectedOrder.quantity} 张` : ''}
                    </span>
                    {selectedOrder.quantity != null &&
                      selectedOrder.cards.length > selectedOrder.quantity && (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          ⚠ 发卡数量异常（超出应发）
                        </span>
                      )}
                  </div>
                  <div className="space-y-1.5 rounded-lg bg-gray-50 p-3">
                    {selectedOrder.cards.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 break-all font-mono text-xs text-gray-800"
                      >
                        <span className="select-none text-gray-400">{i + 1}.</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.payStatus === 'UNPAID' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    改价（仅待支付订单，单位元）
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    原价 ¥{Number(selectedOrder.amount).toFixed(2)}；改价后买家按新金额支付。
                  </p>
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

              {selectedOrder.payStatus === 'PAID' && (
                <div className="pt-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">订单沟通（与买家）</label>
                  <OrderChat apiBase={`/api/admin/orders/${selectedOrder.id}/messages`} selfRole="ADMIN" theme="light" />
                </div>
              )}

              {/* 缺货停在「处理中」的自动发货订单：补货后从这里补齐缺口，
                  不必再绕到「收款监控 → 补单」。fulfillOrder 幂等，不会超发。 */}
              {selectedOrder.payStatus === 'PAID' &&
                selectedOrder.deliveryStatus !== 'DELIVERED' &&
                (selectedOrder.cards?.length ?? 0) < (selectedOrder.quantity ?? 1) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="text-sm text-amber-800">
                      该订单已付款，但卡密只发出 {selectedOrder.cards?.length ?? 0}/{selectedOrder.quantity ?? 1} 张
                      （通常是付款时库存不足）。补货后可点右侧补发。
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button variant="outline" size="sm" loading={refilling} onClick={handleRefill}>
                        补发卡密
                      </Button>
                    </div>
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
