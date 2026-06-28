'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Search,
  Sparkles,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Copy,
  Eye,
  MessageSquare,
  FileText,
  X,
} from 'lucide-react'
import { useUserStore } from '@/store/user'
import { ContactModal } from '@/components/contact-modal'
import OrderChat from '@/components/order-chat'
import OrderSms from '@/components/order-sms'

interface Order {
  id: number
  orderNo: string
  productId: number
  productName: string
  productPrice: string | number
  amount: string | number
  payStatus: string
  deliveryStatus: string
  deliveryInfo: string | null
  remark: string | null
  createdAt: string
  paidAt: string | null
  deliveredAt: string | null
  product: { id: number; name: string; image: string | null; deliveryType?: string; cardUsage?: string | null; cardRedeemUrl?: string | null }
  cards?: string[]
  unreadCount?: number // 客服发来、买家未读的回复数
  billing?: Billing | null
}

interface Billing {
  canInvoice: boolean
  canReceipt: boolean
  sellingPrice: number
  invoiceAmount: number
  taxFee: number
  invoiceStatus: string // UNAPPLIED | AWAIT_PAY | SUBMITTED | ISSUED | CANNOT
  invoiceId: number | null
  receiptToken: string | null
}

const INVOICE_LABELS: Record<string, string> = {
  UNAPPLIED: '可开据·未开发票',
  AWAIT_PAY: '可开据·待支付税费',
  SUBMITTED: '可开具·已提交开票',
  ISSUED: '已开具',
  CANNOT: '不可开据',
}

const gradients = [
  'from-violet-600 to-purple-600',
  'from-purple-600 to-pink-600',
  'from-pink-600 to-rose-600',
  'from-emerald-600 to-teal-600',
  'from-teal-600 to-cyan-600',
  'from-cyan-600 to-blue-600',
  'from-amber-600 to-orange-600',
]

function getGradient(id: number) {
  return gradients[id % gradients.length]
}

const getStatusConfig = (payStatus: string, deliveryStatus: string) => {
  if (deliveryStatus === 'CANCELLED') {
    return {
      label: '已取消',
      icon: XCircle,
      color: 'text-white/40',
      bg: 'bg-white/5',
      border: 'border-white/10',
    }
  }
  if (payStatus === 'UNPAID') {
    return {
      label: '待支付',
      icon: AlertCircle,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
    }
  }
  if (payStatus === 'REFUNDED') {
    return {
      label: '已退款',
      icon: XCircle,
      color: 'text-white/40',
      bg: 'bg-white/5',
      border: 'border-white/10',
    }
  }
  if (deliveryStatus === 'DELIVERED') {
    return {
      label: '已完成',
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    }
  }
  if (deliveryStatus === 'PROCESSING') {
    return {
      label: '处理中',
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    }
  }
  if (deliveryStatus === 'CANCELLED') {
    return {
      label: '已取消',
      icon: XCircle,
      color: 'text-white/40',
      bg: 'bg-white/5',
      border: 'border-white/10',
    }
  }
  return {
    label: '待处理',
    icon: Clock,
    color: 'text-white/60',
    bg: 'bg-white/5',
    border: 'border-white/10',
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OrdersPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [contactOpen, setContactOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [payingNo, setPayingNo] = useState<string | null>(null)
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null)
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null)

  const loadOrders = async () => {
    try {
      const r = await fetch('/api/orders')
      const data = await r.json()
      if (data.success) setOrders(data.data)
    } finally {
      setLoading(false)
    }
  }

  const handleAlipay = async (order: Order) => {
    setPayingNo(order.orderNo)
    try {
      const res = await fetch('/api/pay/vmq/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo: order.orderNo }),
      })
      const data = await res.json()
      if (data.success && data.data?.payUrl) {
        router.push(data.data.payUrl)
      } else {
        alert(data.error || '发起支付失败')
        setPayingNo(null)
      }
    } catch {
      alert('网络错误，请重试')
      setPayingNo(null)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/orders')
      return
    }

    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router])

  if (!user) return null

  // 计算各状态数量
  const counts = {
    all: orders.length,
    UNPAID: orders.filter((o) => o.payStatus === 'UNPAID').length,
    PROCESSING: orders.filter(
      (o) => o.payStatus === 'PAID' && (o.deliveryStatus === 'PENDING' || o.deliveryStatus === 'PROCESSING')
    ).length,
    DELIVERED: orders.filter((o) => o.deliveryStatus === 'DELIVERED').length,
  }

  const statusFilters = [
    { id: 'all', label: '全部', count: counts.all },
    { id: 'UNPAID', label: '待支付', count: counts.UNPAID },
    { id: 'PROCESSING', label: '处理中', count: counts.PROCESSING },
    { id: 'DELIVERED', label: '已完成', count: counts.DELIVERED },
  ]

  const filteredOrders = orders.filter((order) => {
    let matchesFilter = true
    if (activeFilter === 'UNPAID') {
      matchesFilter = order.payStatus === 'UNPAID'
    } else if (activeFilter === 'PROCESSING') {
      matchesFilter =
        order.payStatus === 'PAID' &&
        (order.deliveryStatus === 'PENDING' || order.deliveryStatus === 'PROCESSING')
    } else if (activeFilter === 'DELIVERED') {
      matchesFilter = order.deliveryStatus === 'DELIVERED'
    }

    const matchesSearch =
      !searchTerm ||
      order.orderNo.includes(searchTerm) ||
      order.productName.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const copyOrderNo = (orderNo: string) => {
    navigator.clipboard.writeText(orderNo)
  }

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container relative max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/80">订单管理</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="gradient-text">我的</span>
            <span className="gradient-text-accent"> 订单</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter.id
                    ? 'bg-white text-black'
                    : 'glass text-white/60 hover:text-white'
                }`}
              >
                {filter.label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeFilter === filter.id ? 'bg-black/10' : 'bg-white/10'
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索订单号或商品..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 text-white/40"
            >
              加载中...
            </motion.div>
          ) : filteredOrders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-3xl p-16 text-center"
            >
              <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">
                {activeFilter === 'all' ? '暂无订单' : '该状态下暂无订单'}
              </h3>
              <p className="text-white/40 mb-8">快去选购心仪的 AI 服务吧</p>
              <Link href="/products">
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-medium hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all">
                  <ShoppingBag className="w-4 h-4" />
                  立即选购
                </button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {filteredOrders.map((order, index) => {
                const status = getStatusConfig(order.payStatus, order.deliveryStatus)
                const gradient = getGradient(order.productId)
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="group relative"
                  >
                    <div className={`absolute -inset-[1px] bg-gradient-to-r ${gradient} rounded-2xl opacity-0 group-hover:opacity-30 blur-md transition-opacity`} />

                    <div className="relative glass rounded-2xl p-6 hover:bg-white/10 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                          <Sparkles className="w-7 h-7" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <h3 className="font-bold text-lg">{order.productName}</h3>
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.border} border ${status.color}`}>
                              <status.icon className="w-3 h-3" />
                              {status.label}
                            </div>
                            {!!order.unreadCount && order.unreadCount > 0 && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/15 border border-red-500/30 text-red-400">
                                <MessageSquare className="w-3 h-3" />
                                客服新回复 {order.unreadCount}
                              </div>
                            )}

                            {/* 发票标识 */}
                            {order.billing && order.billing.invoiceStatus === 'ISSUED' && (
                              <BillingChip color="green" label="发票已开具" />
                            )}
                            {order.billing && order.billing.invoiceStatus === 'AWAIT_PAY' && (
                              <BillingChip color="amber" label="发票待付税费" />
                            )}
                            {order.billing && order.billing.invoiceStatus === 'SUBMITTED' && (
                              <BillingChip color="cyan" label="发票已提交" />
                            )}
                            {order.billing &&
                              order.billing.invoiceStatus === 'UNAPPLIED' &&
                              order.billing.canInvoice && <BillingChip color="purple" label="可开发票" />}

                            {/* 收据标识 */}
                            {order.billing &&
                              (order.billing.receiptToken ? (
                                <BillingChip color="green" label="收据已开具" />
                              ) : order.billing.canReceipt ? (
                                <BillingChip color="cyan" label="可开收据" />
                              ) : null)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-white/40 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span>订单号:</span>
                              <span className="font-mono text-white/60">{order.orderNo}</span>
                              <button
                                onClick={() => copyOrderNo(order.orderNo)}
                                className="ml-1 p-1 hover:text-white transition-colors"
                                title="复制订单号"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(order.createdAt)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold">¥{Number(order.amount).toFixed(0)}</div>
                            <div className="text-xs text-white/40">订单金额</div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            {order.payStatus === 'UNPAID' && order.deliveryStatus !== 'CANCELLED' && (
                              <button
                                onClick={() => handleAlipay(order)}
                                disabled={payingNo === order.orderNo}
                                className="px-4 py-2 rounded-lg bg-[#1677FF] text-white text-sm font-medium hover:bg-[#0e5fd8] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                              >
                                {payingNo === order.orderNo ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : null}
                                支付宝支付
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedOrder(order)
                                if (order.unreadCount) {
                                  setOrders((prev) =>
                                    prev.map((o) => (o.id === order.id ? { ...o, unreadCount: 0 } : o))
                                  )
                                }
                              }}
                              className="relative px-4 py-2 rounded-lg glass hover:bg-white/10 text-sm font-medium transition-colors flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              详情
                              {!!order.unreadCount && order.unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {order.deliveryStatus === 'DELIVERED' && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2 text-sm text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span>服务已交付</span>
                          </div>
                        </div>
                      )}

                      {order.payStatus === 'PAID' && order.deliveryStatus === 'PROCESSING' && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2 text-sm text-blue-400">
                            <Clock className="w-4 h-4" />
                            <span>正在为你开通服务，预计 10 分钟内完成</span>
                          </div>
                        </div>
                      )}

                      {order.payStatus === 'UNPAID' && order.deliveryStatus !== 'CANCELLED' && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2 text-sm text-yellow-400">
                            <AlertCircle className="w-4 h-4" />
                            <span>请点击「支付宝支付」完成付款</span>
                          </div>
                        </div>
                      )}

                      {order.deliveryStatus === 'CANCELLED' && order.payStatus === 'UNPAID' && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2 text-sm text-white/40">
                            <XCircle className="w-4 h-4" />
                            <span>订单已超时取消，请重新下单</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 glass rounded-2xl p-6 text-center"
          >
            <p className="text-sm text-white/60 mb-3">
              订单遇到问题？联系我们的专属客服
            </p>
            <button
              onClick={() => {
                setSelectedOrder(null)
                setContactOpen(true)
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.691 2C4.768 2 1.5 4.65 1.5 7.913c0 1.873 1.075 3.534 2.715 4.642a.522.522 0 01.222.434.677.677 0 01-.027.187l-.352 1.336c-.016.072-.04.144-.04.216 0 .144.117.262.262.262.058 0 .115-.019.166-.047l1.722-.998a.766.766 0 01.4-.115c.077 0 .15.013.222.034a8.49 8.49 0 002.32.317c.207 0 .413-.013.617-.034A4.886 4.886 0 019.5 12.5c0-2.945 2.842-5.336 6.353-5.336.137 0 .272.005.404.013C15.677 4.06 12.477 2 8.691 2z" />
              </svg>
              联系客服
            </button>
          </motion.div>
        )}
      </div>

      {invoiceOrder && invoiceOrder.billing && (
        <InvoiceModal
          order={invoiceOrder}
          defaultEmail={user.email || ''}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
      {receiptOrder && receiptOrder.billing && (
        <ReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
          onSuccess={(token) => {
            // 本地即时反映「已开具」，并刷新列表
            setOrders((prev) =>
              prev.map((o) =>
                o.id === receiptOrder.id && o.billing
                  ? { ...o, billing: { ...o.billing, receiptToken: token } }
                  : o
              )
            )
            setSelectedOrder((prev) =>
              prev && prev.id === receiptOrder.id && prev.billing
                ? { ...prev, billing: { ...prev.billing, receiptToken: token } }
                : prev
            )
            setReceiptOrder(null)
            loadOrders()
          }}
        />
      )}

      <ContactModal
        open={contactOpen}
        onClose={() => {
          setContactOpen(false)
          setSelectedOrder(null)
        }}
      />

      {/* 订单详情弹窗 */}
      <AnimatePresence>
        {selectedOrder && !contactOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md glass-strong rounded-3xl p-8"
            >
              <h3 className="text-xl font-bold mb-6">订单详情</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">订单号</span>
                  <span className="font-mono">{selectedOrder.orderNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">商品</span>
                  <span className="font-medium">{selectedOrder.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">金额</span>
                  <span className="font-bold text-lg">¥{Number(selectedOrder.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">下单时间</span>
                  <span>{formatDate(selectedOrder.createdAt)}</span>
                </div>
                {selectedOrder.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-white/50">支付时间</span>
                    <span>{formatDate(selectedOrder.paidAt)}</span>
                  </div>
                )}
                {selectedOrder.deliveredAt && (
                  <div className="flex justify-between">
                    <span className="text-white/50">交付时间</span>
                    <span>{formatDate(selectedOrder.deliveredAt)}</span>
                  </div>
                )}
                {selectedOrder.cards && selectedOrder.cards.length > 0 && (
                  <div>
                    <div className="text-white/50 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" /> 卡密（请妥善保管）
                    </div>
                    <div className="space-y-2">
                      {selectedOrder.cards.map((card, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex-1 p-3 rounded-lg bg-white/5 border border-green-500/30 font-mono text-xs break-all">
                            {card}
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(card)}
                            className="px-3 py-2 rounded-lg glass hover:bg-white/10 text-xs whitespace-nowrap"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {selectedOrder.product?.cardRedeemUrl && /^https?:\/\//i.test(selectedOrder.product.cardRedeemUrl) && (
                      <a
                        href={selectedOrder.product.cardRedeemUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-3 group flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold hover:shadow-[0_0_24px_rgba(16,185,129,0.4)] transition-all"
                      >
                        去充值 / 兑换
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    )}
                    <p className="text-[11px] text-white/40 mt-2">卡密仅本人可见，请按说明使用；如有问题联系客服。</p>
                    {selectedOrder.product?.cardUsage && (
                      <div className="mt-3">
                        <div className="text-white/50 mb-1.5 text-sm">使用说明</div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 whitespace-pre-wrap leading-relaxed">
                          {selectedOrder.product.cardUsage}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedOrder.deliveryInfo && (
                  <div>
                    <div className="text-white/50 mb-2">交付信息</div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-xs whitespace-pre-wrap">
                      {selectedOrder.deliveryInfo}
                    </div>
                  </div>
                )}
              </div>
              {selectedOrder.payStatus === 'PAID' && selectedOrder.product?.deliveryType === 'SMS' && (
                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="text-white/50 mb-2 text-sm">短信接码</div>
                  <OrderSms orderId={selectedOrder.id} />
                </div>
              )}
              {selectedOrder.payStatus === 'PAID' && selectedOrder.billing && (
                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="text-white/50 mb-3 text-sm">发票 / 收据</div>

                  {/* 发票 */}
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-white/40" />
                      <span className="text-white/50">发票</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          selectedOrder.billing.invoiceStatus === 'ISSUED'
                            ? 'bg-green-500/15 text-green-300'
                            : selectedOrder.billing.invoiceStatus === 'CANNOT'
                              ? 'bg-gray-500/15 text-gray-400'
                              : selectedOrder.billing.invoiceStatus === 'SUBMITTED'
                                ? 'bg-cyan-500/15 text-cyan-300'
                                : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {INVOICE_LABELS[selectedOrder.billing.invoiceStatus] || selectedOrder.billing.invoiceStatus}
                      </span>
                    </div>
                    {selectedOrder.billing.invoiceStatus === 'UNAPPLIED' && selectedOrder.billing.canInvoice && (
                      <button
                        onClick={() => setInvoiceOrder(selectedOrder)}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
                      >
                        申请发票
                      </button>
                    )}
                    {selectedOrder.billing.invoiceStatus === 'AWAIT_PAY' && selectedOrder.billing.invoiceId && (
                      <PayTaxButton invoiceId={selectedOrder.billing.invoiceId} />
                    )}
                  </div>

                  {/* 收据 */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-white/40" />
                      <span className="text-white/50">收据</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          selectedOrder.billing.receiptToken
                            ? 'bg-green-500/15 text-green-300'
                            : selectedOrder.billing.canReceipt
                              ? 'bg-white/10 text-white/60'
                              : 'bg-gray-500/15 text-gray-400'
                        }`}
                      >
                        {selectedOrder.billing.receiptToken ? '已开具' : selectedOrder.billing.canReceipt ? '可开具' : '不可开具'}
                      </span>
                    </div>
                    {selectedOrder.billing.receiptToken ? (
                      <a
                        href={`/receipt/${selectedOrder.billing.receiptToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-1.5 rounded-lg glass text-sm font-medium hover:bg-white/10 transition-colors"
                      >
                        查看收据
                      </a>
                    ) : selectedOrder.billing.canReceipt ? (
                      <button
                        onClick={() => setReceiptOrder(selectedOrder)}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-sm font-medium hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all"
                      >
                        申请收据
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {selectedOrder.payStatus === 'PAID' && (
                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="text-white/50 mb-2 text-sm">和客服沟通（本订单）</div>
                  <OrderChat apiBase={`/api/orders/${selectedOrder.id}/messages`} selfRole="BUYER" theme="dark" />
                </div>
              )}

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full mt-6 py-3 rounded-xl glass hover:bg-white/10 text-sm font-medium transition-colors"
              >
                关闭
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 订单列表上的票据小标识
function BillingChip({ color, label }: { color: 'green' | 'amber' | 'cyan' | 'purple'; label: string }) {
  const cls: Record<string, string> = {
    green: 'bg-green-500/15 border-green-500/30 text-green-300',
    amber: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    cyan: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
    purple: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
  }
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cls[color]}`}>
      <FileText className="w-3 h-3" />
      {label}
    </div>
  )
}

// 待支付税费：跳转支付宝
function PayTaxButton({ invoiceId }: { invoiceId: number }) {
  const [loading, setLoading] = useState(false)
  const pay = async () => {
    setLoading(true)
    try {
      const channel = typeof window !== 'undefined' && window.innerWidth < 768 ? 'wap' : 'page'
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      })
      const data = await res.json()
      if (data.success && data.data?.payUrl) {
        window.location.href = data.data.payUrl
      } else {
        alert(data.error || '发起支付失败')
        setLoading(false)
      }
    } catch {
      alert('网络错误，请重试')
      setLoading(false)
    }
  }
  return (
    <button
      onClick={pay}
      disabled={loading}
      className="px-4 py-1.5 rounded-lg bg-[#1677FF] text-white text-sm font-medium hover:bg-[#0e5fd8] transition-colors disabled:opacity-60"
    >
      {loading ? '处理中...' : '去支付税费'}
    </button>
  )
}

// 发票申请弹窗（从「我的订单」直接申请）
function InvoiceModal({
  order,
  defaultEmail,
  onClose,
}: {
  order: Order
  defaultEmail: string
  onClose: () => void
}) {
  const b = order.billing!
  const [title, setTitle] = useState('')
  const [taxNumber, setTaxNumber] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [email, setEmail] = useState(defaultEmail || '')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    setErr(null)
    if (!title.trim()) return setErr('请填写发票抬头')
    if (!taxNumber.trim()) return setErr('请填写税号')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr('请填写正确的接收邮箱')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          taxNumber: taxNumber.trim(),
          address: address.trim() || null,
          phone: phone.trim() || null,
          bankName: bankName.trim() || null,
          bankAccount: bankAccount.trim() || null,
          email: email.trim(),
        }),
      })
      const data = await res.json()
      if (data.success && data.data?.payUrl) {
        window.location.href = data.data.payUrl
        return
      }
      setErr(data.error || '提交失败')
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    opts?: { required?: boolean; placeholder?: string; type?: string }
  ) => (
    <div>
      <label className="block text-xs text-white/50 mb-1">
        {label}
        {opts?.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={opts?.type || 'text'}
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={opts?.placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/25 outline-none focus:border-purple-500/50 text-sm"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg glass-strong rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" /> 申请发票
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="glass rounded-2xl p-4 mb-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-white/40">商品</span>
            <span className="text-white/80 font-medium">{order.productName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">订单号</span>
            <span className="text-white/70 font-mono text-xs break-all">{order.orderNo}</span>
          </div>
          <div className="h-px bg-white/10 my-1" />
          <div className="flex justify-between">
            <span className="text-white/40">售价</span>
            <span className="text-white/80">¥{b.sellingPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">开票金额（含税）</span>
            <span className="text-white/90 font-semibold">¥{b.invoiceAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-300/80">需支付税费（6%）</span>
            <span className="text-amber-300 font-bold">¥{b.taxFee.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">{field('抬头', title, setTitle, { required: true, placeholder: '公司名称 / 个人' })}</div>
          <div className="sm:col-span-2">{field('税号', taxNumber, setTaxNumber, { required: true, placeholder: '纳税人识别号' })}</div>
          {field('地址', address, setAddress, { placeholder: '选填' })}
          {field('电话', phone, setPhone, { placeholder: '选填' })}
          {field('开户行', bankName, setBankName, { placeholder: '选填' })}
          {field('卡号', bankAccount, setBankAccount, { placeholder: '选填' })}
          <div className="sm:col-span-2">{field('接收邮箱', email, setEmail, { required: true, type: 'email', placeholder: '发票将发送到此邮箱' })}</div>
        </div>

        {err && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" /> {err}
          </div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50"
        >
          {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          提交发票并支付税费 ¥{b.taxFee.toFixed(2)}
        </button>
        <p className="text-xs text-white/30 text-center mt-2">提交后将跳转支付宝支付 6% 税费，支付完成即提交开票</p>
      </motion.div>
    </div>
  )
}

// 收据申请弹窗（从「我的订单」直接申请）
function ReceiptModal({
  order,
  onClose,
  onSuccess,
}: {
  order: Order
  onClose: () => void
  onSuccess: (token: string) => void
}) {
  const b = order.billing!
  const [payerTitle, setPayerTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    setErr(null)
    if (!payerTitle.trim()) return setErr('请填写付款人抬头')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payerTitle: payerTitle.trim() }),
      })
      const data = await res.json()
      if (data.success && data.data?.token) {
        window.open(`/receipt/${data.data.token}`, '_blank')
        onSuccess(data.data.token)
        return
      }
      setErr(data.error || '生成失败')
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md glass-strong rounded-3xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" /> 申请收据
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="glass rounded-2xl p-4 mb-4 text-sm space-y-2">
          <div className="flex justify-between"><span className="text-white/40">收款人</span><span className="text-white/80 text-right">益阳市赫山区必高科技有限公司</span></div>
          <div className="flex justify-between"><span className="text-white/40">商品</span><span className="text-white/80">{order.productName}</span></div>
          <div className="flex justify-between"><span className="text-white/40">订单号</span><span className="text-white/70 font-mono text-xs break-all">{order.orderNo}</span></div>
          <div className="flex justify-between"><span className="text-white/40">付款金额</span><span className="text-white/90 font-bold">¥{b.sellingPrice.toFixed(2)}</span></div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">
            付款人抬头<span className="text-red-400 ml-0.5">*</span>
          </label>
          <input
            value={payerTitle}
            onChange={(e) => setPayerTitle(e.target.value)}
            placeholder="公司名称 / 个人姓名"
            maxLength={200}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/25 outline-none focus:border-cyan-500/50 text-sm"
          />
        </div>

        {err && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" /> {err}
          </div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all disabled:opacity-50"
        >
          {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          生成收据
        </button>
        <p className="text-xs text-white/30 text-center mt-2">收据仅可开具一次，生成后不可修改；如需重开请联系客服</p>
      </motion.div>
    </div>
  )
}
