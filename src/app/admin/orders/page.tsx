'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Eye, MessageSquare, Loader2 } from 'lucide-react'
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
  cardProfit?: number | null // 卡密利润合计，已扣内推返现（含未知利润的卡时为 null）
  cardReferral?: number | null // 该单已扣的内推返现（无卡密的单为 null）
  cardProfitUnknown?: boolean // 该单存在利润未知的卡（外部站发卡）
  invoiceTaxFee?: string | number | null // 下单时勾选「同时开发票」预收的税费（不计入 amount）
  cardCount?: number // 仅深链打开时有：不在当前页的订单拿不到卡密明文，只知道发了几张
}

/** GET /api/admin/orders/[id]/detail 的返回（Decimal 已转 number，时间是 ISO 字符串） */
interface InvoiceBrief {
  id: number
  invoiceNo: string
  externalOrderId: number | null
  status: string
  payStatus: string
  source: string | null
  title: string | null
  taxNumber: string | null
  email: string | null
  sellingPrice: number | null
  invoiceAmount: number | null
  taxFee: number | null
  paidAt: string | null
  submittedAt: string | null
  issuedAt: string | null
  createdAt: string
}

interface OrderDetail {
  order: {
    id: number
    orderNo: string
    productName: string
    productPrice: number
    quantity: number
    amount: number
    invoiceTaxFee: number | null
    payable: number
    payMethod: string | null
    payStatus: string
    deliveryStatus: string
    deliveryInfo: string | null
    remark: string | null
    referrerId: number | null
    referralReward: number | null
    couponGrantId: number | null
    couponDiscount: number | null
    originalAmount: number | null
    createdAt: string
    paidAt: string | null
    deliveredAt: string | null
  }
  user: { id: number; email: string | null; nickname: string | null; phone: string | null }
  product: { id: number; name: string; deliveryType: string }
  payments: { id: number; tradeNo: string | null; payMethod: string; amount: number; status: number; createdAt: string }[]
  coupon: {
    grantId: number
    state: string
    grantOrderId: number | null
    usedAt: string | null
    name: string
    code: string
    source: string | null
    label: string
  } | null
  referral: {
    referrer: { id: number; email: string | null; nickname: string | null }
    referrerMissing: boolean
    rewardSnapshot: number | null
    rewardRow: { amount: number; status: string; createdAt: string; settledAt: string | null } | null
  } | null
  invoices: InvoiceBrief[]
  invoiceDraft: { title: string; taxNumber: string; email: string } | null
  externalOrders: { id: number; sourceKey: string; importBatch: string | null; claudeAccount: string }[]
  receipts: {
    id: number
    receiptNo: string
    amount: number
    payerTitle: string
    issuedAt: string | null
    createdAt: string
    link: string | null
  }[]
  lottery: {
    state: string
    won: boolean | null
    prizeName: string | null
    prizeType: string | null
    prizeLabel: string | null
    fulfillState: string | null
    fulfilledAt: string | null
    fulfillNote: string | null
    drawnAt: string | null
    couponGrantId: number | null
    couponGrant: { id: number; state: string; expiresAt: string | null; usedAt: string | null } | null
  } | null
  vmqOrders: {
    id: number
    state: number
    price: number
    reallyPrice: number
    createdAt: string
    payDate: string | null
  }[]
  cardCount: number
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
  /** 利润合计里已扣掉的内推返现（truncated 时为 null） */
  referral?: number | null
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

// 与 /admin/invoices 页同一套文案与配色
const invoiceStatusMap: Record<string, { label: string; className: string }> = {
  UNAPPLIED: { label: '未开发票', className: 'bg-gray-100 text-gray-600' },
  AWAIT_PAY: { label: '待支付税费', className: 'bg-amber-100 text-amber-700' },
  SUBMITTED: { label: '已提交开票', className: 'bg-cyan-100 text-cyan-700' },
  ISSUED: { label: '已开具', className: 'bg-green-100 text-green-700' },
  CANNOT: { label: '不可开据', className: 'bg-gray-200 text-gray-500' },
}

const GRANT_STATE: Record<string, string> = {
  AVAILABLE: '未使用',
  LOCKED: '已锁定（挂在待付款订单上）',
  USED: '已使用',
  EXPIRED: '已过期',
  VOID: '已作废',
}

const PAY_METHOD: Record<string, string> = { ALIPAY: '支付宝', WECHAT: '微信', BALANCE: '余额' }
const PAYMENT_STATUS: Record<number, string> = { 0: '待支付', 1: '成功', 2: '失败' }
const VMQ_STATE: Record<number, string> = { 0: '待支付', 1: '已支付', [-1]: '已过期' }

function yuan(n: number | string | null | undefined) {
  return n == null ? '—' : `¥${Number(n).toFixed(2)}`
}

function fmtTime(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}

/** 深链打开时订单不一定在当前页：由详情接口的数据拼出弹窗需要的列表行形状 */
function orderFromDetail(d: OrderDetail): Order {
  return {
    id: d.order.id,
    orderNo: d.order.orderNo,
    productName: d.order.productName,
    amount: d.order.amount,
    payStatus: d.order.payStatus,
    deliveryStatus: d.order.deliveryStatus,
    deliveryInfo: d.order.deliveryInfo,
    remark: d.order.remark,
    quantity: d.order.quantity,
    createdAt: d.order.createdAt,
    user: { id: d.user.id, email: d.user.email, nickname: d.user.nickname },
    product: { id: d.product.id, name: d.product.name },
    invoiceTaxFee: d.order.invoiceTaxFee,
    cardCount: d.cardCount,
  }
}

// useSearchParams 必须包在 Suspense 里，否则整页在构建时退化为纯客户端渲染并报警（与卡密页同一写法）
export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-400">加载中...</div>}>
      <OrdersInner />
    </Suspense>
  )
}

function OrdersInner() {
  const sp = useSearchParams()
  const router = useRouter()
  /** 深链 /admin/orders?orderId=123：从发票详情、余额流水等处直接打开某张订单 */
  const deepLinkId = sp.get('orderId')
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
  // 弹窗里的只读明细（金额 / 发票 / 券 / 内推 / 抽奖），打开时单独拉一次
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const detailSeq = useRef(0)

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

  // 拉订单明细。序号防串：快速切换订单时，只认最后一次请求的结果
  const loadDetail = async (id: number): Promise<OrderDetail | null> => {
    const seq = ++detailSeq.current
    setDetailLoading(true)
    setDetailError('')
    try {
      const res = await fetch(`/api/admin/orders/${id}/detail`)
      const data = await res.json()
      if (seq !== detailSeq.current) return null
      if (data.success) {
        setDetail(data.data as OrderDetail)
        return data.data as OrderDetail
      }
      setDetailError(data.error || '明细加载失败')
      return null
    } catch {
      if (seq === detailSeq.current) setDetailError('网络错误，明细加载失败')
      return null
    } finally {
      if (seq === detailSeq.current) setDetailLoading(false)
    }
  }

  /** preloaded：深链路径已经拿到了明细，不必再拉一次 */
  const handleViewDetail = (order: Order, preloaded?: OrderDetail) => {
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
    if (preloaded) {
      detailSeq.current++ // 作废可能还在路上的旧请求
      setDetail(preloaded)
      setDetailError('')
      setDetailLoading(false)
    } else {
      setDetail(null)
      loadDetail(order.id)
    }
  }

  // 关弹窗时顺手去掉地址栏的 ?orderId=，否则刷新页面会再弹一次
  const closeDetail = () => {
    setShowDetailModal(false)
    if (deepLinkId) router.replace('/admin/orders', { scroll: false })
  }

  // 深链：按 id 直接拉明细开弹窗，不依赖这张订单是否在当前列表页
  useEffect(() => {
    const id = parseInt(deepLinkId || '')
    if (!Number.isSafeInteger(id) || id <= 0) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/orders/${id}/detail`)
        const data = await res.json()
        if (cancelled) return
        if (!data.success) {
          alert(data.error || '订单不存在')
          return
        }
        const d = data.data as OrderDetail
        handleViewDetail(orderFromDetail(d), d)
      } catch {
        if (!cancelled) alert('网络错误，订单详情加载失败')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkId])

  // 补发卡密：只对已付款、尚未交付、卡密未发满的自动发货订单可用
  const handleRefill = async () => {
    if (!selectedOrder) return
    setRefilling(true)
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/refill`, { method: 'PUT' })
      const data = await res.json()
      if (data.success) {
        alert(data.message || '已补发')
        closeDetail()
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

    // 已付款订单改成「已取消」= 线下退款的惯例做法，会连带回滚一串东西，先让站长看清楚再点
    if (
      deliveryStatus === 'CANCELLED' &&
      selectedOrder.deliveryStatus !== 'CANCELLED' &&
      selectedOrder.payStatus === 'PAID'
    ) {
      const ok = confirm(
        [
          '这是一张已付款订单，取消后（视为已线下退款）：',
          '· 未开出的发票会转为「不可开据」，买家不能再申请发票和收据',
          '· 卡密的站内兑换、接码服务会停止',
          '· 已入账的内推返现不会自动扣回',
          '· 钱不会自动退回，请确认已线下退款',
          '',
          '确定要取消吗？',
        ].join('\n')
      )
      if (!ok) return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryStatus,
          deliveryInfo: deliveryInfo || null,
          // 已取消（或这次就要改成已取消）的订单不发改价：接口会拒绝，买家也已经不能再付款
          ...(selectedOrder.payStatus === 'UNPAID' &&
          selectedOrder.deliveryStatus !== 'CANCELLED' &&
          deliveryStatus !== 'CANCELLED' &&
          amount &&
          Number(amount) !== Number(selectedOrder.amount)
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
      // 服务端的联动提示：改价同步收款单的异常、取消已付款单时作废了几张发票 / 需红冲 / 返现未扣回等
      const warnings: string[] = Array.isArray(data.data?.warnings) ? data.data.warnings : []
      if (warnings.length) alert(`已保存，请留意：\n\n${warnings.join('\n')}`)

      closeDetail()
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
                {totals.referral != null && totals.referral > 0 && (
                  <div className="text-[11px] text-green-700/80 mt-0.5">已扣内推返现 ¥{totals.referral.toFixed(2)}</div>
                )}
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
                      <td className="py-4 text-gray-900 whitespace-nowrap">
                        ¥{Number(order.amount).toFixed(2)}
                        {Number(order.invoiceTaxFee || 0) > 0 && (
                          <span
                            className="ml-1 rounded bg-amber-50 px-1 py-0.5 text-[10px] font-medium text-amber-700"
                            title={`下单时勾选了随单开票，另收税费 ¥${Number(order.invoiceTaxFee).toFixed(2)}（不计入金额）`}
                          >
                            +税
                          </span>
                        )}
                      </td>
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
                          <span
                            className={order.cardProfit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}
                            title={
                              order.cardReferral
                                ? `卡差价 − 内推返现 ¥${order.cardReferral.toFixed(2)}`
                                : '卡差价（售价 − 成本）'
                            }
                          >
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
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 max-h-[90vh] overflow-y-auto">
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

              {/* 只读明细：金额构成 / 发票 / 抽奖。加载失败不影响下面的编辑控件 */}
              {detail && detail.order.id === selectedOrder.id ? (
                <OrderDetailSections d={detail} />
              ) : detailError ? (
                <div className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  <span>{detailError}</span>
                  <button
                    type="button"
                    onClick={() => loadDetail(selectedOrder.id)}
                    className="text-xs underline hover:text-red-900"
                  >
                    重试
                  </button>
                </div>
              ) : detailLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> 加载金额、发票明细...
                </div>
              ) : null}

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

              {/* 深链打开、订单不在当前页：详情接口刻意不回传卡密明文（明文只在列表里解密展示），只给张数 */}
              {!selectedOrder.cards && (selectedOrder.cardCount ?? 0) > 0 && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  已发卡密 {selectedOrder.cardCount} 张
                  {selectedOrder.quantity ? ` / 应发 ${selectedOrder.quantity} 张` : ''}。
                  <span className="text-xs text-gray-400">卡密内容请在列表中按订单号搜索后查看。</span>
                </div>
              )}

              {selectedOrder.payStatus === 'UNPAID' && selectedOrder.deliveryStatus !== 'CANCELLED' && (
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
                (selectedOrder.cards?.length ?? selectedOrder.cardCount ?? 0) < (selectedOrder.quantity ?? 1) &&
                // 明细到手后才知道发货方式：人工 / 接码商品没有卡密可补（补发接口也会拒绝），不再误显示
                !(detail && detail.order.id === selectedOrder.id && detail.product.deliveryType !== 'AUTO') && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="text-sm text-amber-800">
                      该订单已付款，但卡密只发出 {selectedOrder.cards?.length ?? selectedOrder.cardCount ?? 0}/{selectedOrder.quantity ?? 1} 张
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
                <Button variant="outline" onClick={closeDetail}>
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

// ============ 订单详情弹窗里的只读明细 ============

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 text-sm">
      <h4 className="mb-2 font-medium text-gray-800">{title}</h4>
      {children}
    </div>
  )
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-1.5 last:border-b-0">
      <span className="shrink-0 text-gray-500">{k}</span>
      <span className="break-all text-right font-medium text-gray-900">{v}</span>
    </div>
  )
}

function Pill({ label, className }: { label: string; className: string }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>
}

function OrderDetailSections({ d }: { d: OrderDetail }) {
  const o = d.order
  const paid = o.payStatus === 'PAID'
  const taxFee = o.invoiceTaxFee ?? 0

  return (
    <div className="space-y-3">
      <Section title="金额明细">
        <KV k="商品标价" v={`${yuan(o.productPrice)} × ${o.quantity}`} />
        <KV k="货款（不含税）" v={yuan(o.amount)} />
        <KV
          k="随单发票税费"
          v={taxFee > 0 ? `${yuan(taxFee)}（下单时勾选了同时开发票）` : <span className="text-gray-400">—</span>}
        />
        <KV
          k={paid ? '实付' : '应付'}
          v={
            <span className="text-primary-600">
              {yuan(o.payable)}
              {taxFee > 0 && <span className="ml-1 text-xs font-normal text-gray-400">= 货款 + 税费</span>}
            </span>
          }
        />
        {d.coupon && (
          <KV
            k="优惠券"
            v={
              <span>
                原价 {yuan(o.originalAmount)} · 减免 −{yuan(o.couponDiscount)}
                <span className="block text-xs font-normal text-gray-500">
                  {d.coupon.name}（{d.coupon.label}）
                  {d.coupon.source === 'LOTTERY' ? ' · 下单有奖奖品' : ''} · 券{GRANT_STATE[d.coupon.state] || d.coupon.state}
                  {d.coupon.grantOrderId != null && d.coupon.grantOrderId !== o.id
                    ? ` · 现挂在订单 #${d.coupon.grantOrderId}`
                    : ''}
                </span>
              </span>
            }
          />
        )}
        {d.referral && <ReferralRow d={d} />}
        {d.payments.length > 0 && (
          <div className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600">
            <div className="mb-1 text-gray-400">付款记录</div>
            {d.payments.map((p) => (
              <div key={p.id} className="flex flex-wrap gap-x-2">
                <span>{PAY_METHOD[p.payMethod] || p.payMethod}</span>
                <span>{yuan(p.amount)}</span>
                <span>{PAYMENT_STATUS[p.status] ?? p.status}</span>
                <span className="font-mono text-gray-400">{p.tradeNo || '—'}</span>
                <span className="text-gray-400">{fmtTime(p.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
        {d.vmqOrders.length > 0 && (
          <div className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600">
            <div className="mb-1 text-gray-400">收款单（含重新发起的）</div>
            {d.vmqOrders.map((v) => (
              <div key={v.id} className="flex flex-wrap gap-x-2">
                <span>{VMQ_STATE[v.state] ?? v.state}</span>
                <span>
                  应付 {yuan(v.price)} · 实付(唯一) {yuan(v.reallyPrice)}
                </span>
                <span className="text-gray-400">创建 {fmtTime(v.createdAt)}</span>
                {v.payDate && <span className="text-gray-400">到账 {fmtTime(v.payDate)}</span>}
              </div>
            ))}
          </div>
        )}
      </Section>

      <InvoiceSection d={d} />

      {d.lottery && <LotterySection d={d} />}
    </div>
  )
}

function ReferralRow({ d }: { d: OrderDetail }) {
  const r = d.referral!
  const snap = r.rewardSnapshot ?? 0
  const who = r.referrer.nickname || r.referrer.email || `用户#${r.referrer.id}`
  let settle: React.ReactNode
  if (r.rewardRow) {
    settle =
      r.rewardRow.status === 'SETTLED' ? (
        <span className="text-green-700">
          已入推广人余额 {yuan(r.rewardRow.amount)}（{fmtTime(r.rewardRow.settledAt || r.rewardRow.createdAt)}）
        </span>
      ) : (
        <span className="text-gray-500">
          {r.rewardRow.status === 'CANCELLED' ? '已取消' : r.rewardRow.status} · {yuan(r.rewardRow.amount)}
        </span>
      )
  } else if (snap <= 0) {
    // 建单时用了券就不记返现快照（api/orders 建单处：couponGrantId 非空 → referralReward 置空）
    settle = (
      <span className="text-gray-400">{d.coupon ? '无返现（本单用了优惠券，不计返现）' : '无返现（返现为 0）'}</span>
    )
  } else if (d.order.deliveryStatus === 'DELIVERED') {
    settle = <span className="text-amber-700">订单已交付，但返现未入账</span>
  } else {
    settle = <span className="text-gray-500">待结算（订单交付完成时自动计入推广人余额）</span>
  }
  return (
    <KV
      k="内推"
      v={
        <span>
          推广人{' '}
          <Link href={`/admin/users/${r.referrer.id}`} className="text-primary-600 hover:underline">
            {who}
          </Link>
          {r.referrerMissing && <span className="text-xs text-red-600">（该用户已不存在）</span>} · 返现快照{' '}
          {snap > 0 ? yuan(snap) : '—'}
          <span className="block text-xs font-normal">{settle}</span>
        </span>
      }
    />
  )
}

function InvoiceSection({ d }: { d: OrderDetail }) {
  const o = d.order
  const taxFee = o.invoiceTaxFee ?? 0

  let body: React.ReactNode
  if (d.invoices.length > 0) {
    body = (
      <div className="space-y-3">
        {d.invoices.length > 1 && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
            这张订单关联了 {d.invoices.length} 张发票记录，请核对是否重复开票 / 重复收取税费。
          </div>
        )}
        {d.invoices.map((iv) => {
          const st = invoiceStatusMap[iv.status] || { label: iv.status, className: 'bg-gray-100 text-gray-600' }
          return (
            <div key={iv.id} className="rounded-lg bg-gray-50 px-3 py-2">
              <KV k="发票号" v={<span className="font-mono text-xs">{iv.invoiceNo}</span>} />
              <KV k="状态" v={<Pill label={st.label} className={st.className} />} />
              <KV k="抬头" v={iv.title || <span className="text-gray-400">（未填）</span>} />
              <KV k="税号" v={iv.taxNumber || <span className="text-gray-400">（未填）</span>} />
              <KV k="开票金额（含税）" v={yuan(iv.invoiceAmount)} />
              <KV k="税费 · 支付状态" v={`${yuan(iv.taxFee)} · ${iv.payStatus === 'PAID' ? '已支付' : '未支付'}`} />
              <KV k="提交 / 开具时间" v={`${fmtTime(iv.submittedAt)} / ${fmtTime(iv.issuedAt)}`} />
              <div className="pt-1.5 text-right">
                <Link
                  href={`/admin/invoices?invoiceId=${iv.id}`}
                  className="text-xs text-primary-600 hover:underline"
                >
                  在发票管理中查看 →
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    )
  } else if (d.invoiceDraft && o.payStatus !== 'PAID') {
    body = (
      <div className="space-y-1">
        <div className="text-gray-700">
          {o.payStatus === 'UNPAID' ? '已勾选随单开票（待付款）' : '已勾选随单开票（订单已退款，未开票）'}
        </div>
        <KV k="抬头（草稿）" v={d.invoiceDraft.title} />
        <KV k="税号（草稿）" v={d.invoiceDraft.taxNumber} />
      </div>
    )
  } else if (taxFee > 0 && o.payStatus === 'PAID' && o.deliveryStatus !== 'CANCELLED') {
    body = (
      <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
        税费已随单收取，但发票记录未落地 —— 重新保存该订单可重试
      </div>
    )
  } else {
    body = <div className="text-gray-400">未申请发票</div>
  }

  return (
    <Section title="发票">
      {body}
      {d.receipts.length > 0 && (
        <div className="mt-3 rounded bg-gray-50 p-2 text-xs text-gray-600">
          <div className="mb-1 text-gray-400">收据</div>
          {d.receipts.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-x-2">
              <span className="font-mono">{r.receiptNo}</span>
              <span>{yuan(r.amount)}</span>
              <span>付款人 {r.payerTitle}</span>
              <span className="text-gray-400">{fmtTime(r.issuedAt || r.createdAt)}</span>
              {r.link && (
                <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  查看收据 →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      {d.externalOrders.length > 0 && (
        <div className="mt-2 text-xs text-gray-400">
          关联的外部订单行：
          {d.externalOrders
            .map(
              (e) =>
                `#${e.id} ${e.claudeAccount}（${
                  e.importBatch === 'SHOP' ? '开票背书行' : e.importBatch === 'WEB' ? '标记完成时导入' : e.importBatch || '导入'
                }）`
            )
            .join('；')}
        </div>
      )}
    </Section>
  )
}

function LotterySection({ d }: { d: OrderDetail }) {
  const l = d.lottery!
  let body: React.ReactNode
  if (l.state === 'PENDING') {
    body = <div className="text-gray-700">有抽奖资格，买家尚未抽奖</div>
  } else if (l.state === 'VOID') {
    body = <div className="text-gray-500">抽奖资格已作废，不能再抽</div>
  } else if (!l.won) {
    body = <div className="text-gray-700">已抽奖 · 未中奖（{fmtTime(l.drawnAt)}）</div>
  } else {
    const fulfill: Record<string, string> = { PENDING: '待兑现', DONE: '已兑现', VOID: '已作废' }
    body = (
      <div>
        <KV k="结果" v={<span className="text-green-700">中奖：{l.prizeName || '—'}</span>} />
        {l.prizeLabel && l.prizeLabel !== l.prizeName && <KV k="奖品说明" v={l.prizeLabel} />}
        <KV k="抽奖时间" v={fmtTime(l.drawnAt)} />
        {l.prizeType === 'COUPON' ? (
          <KV
            k="奖券状态"
            v={
              l.couponGrant
                ? `${GRANT_STATE[l.couponGrant.state] || l.couponGrant.state}${
                    l.couponGrant.expiresAt ? ` · ${fmtTime(l.couponGrant.expiresAt)} 到期` : ' · 长期有效'
                  }`
                : '—'
            }
          />
        ) : (
          <KV
            k="兑现状态"
            v={
              <span>
                {l.fulfillState ? fulfill[l.fulfillState] || l.fulfillState : '—'}
                {l.fulfilledAt ? `（${fmtTime(l.fulfilledAt)}）` : ''}
                {l.fulfillNote && <span className="block text-xs font-normal text-gray-500">{l.fulfillNote}</span>}
              </span>
            }
          />
        )}
      </div>
    )
  }
  return <Section title="下单有奖">{body}</Section>
}
