'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
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
  MessageSquare,
  FileText,
  X,
  type LucideIcon,
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
  cardItems?: { secret: string; redeemUrl: string | null }[] // 每张卡的专属兑换地址，为空回落 product.cardRedeemUrl
  unreadCount?: number // 客服发来、买家未读的回复数
  billing?: Billing | null
}

interface Billing {
  canInvoice: boolean
  canReceipt: boolean
  sellingPrice: number
  invoiceAmount: number
  taxFee: number
  receiptAmount: number // 收据应开金额：已付发票税费=含税开票金额，否则=售价
  invoiceStatus: string // UNAPPLIED | AWAIT_PAY | SUBMITTED | ISSUED | CANNOT
  invoiceId: number | null
  receiptToken: string | null
}

// 弹窗类型：发货详情 / 发票收据 / 在线沟通
type PanelType = 'delivery' | 'billing' | 'chat'

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
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  // 徽标计数来自服务端全量口径，不能用当前页的数组长度算
  const [counts, setCounts] = useState({ all: 0, UNPAID: 0, PROCESSING: 0, DELIVERED: 0 })
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [panel, setPanel] = useState<{ order: Order; type: PanelType } | null>(null)
  const [payingNo, setPayingNo] = useState<string | null>(null)
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null)
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null)

  // 服务端分页 + 服务端筛选/检索。分段加载：翻页追加到列表尾部（「加载更多」式），
  // 切筛选/改关键词时从第 1 页重新开始。
  const loadOrders = useCallback(
    async (opts?: { append?: boolean }) => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      if (opts?.append) setLoadingMore(true)
      else setLoading(true)
      try {
        const q = new URLSearchParams({ page: String(opts?.append ? page + 1 : 1), pageSize: '10' })
        if (activeFilter !== 'all') q.set('filter', activeFilter)
        if (debouncedSearch) q.set('keyword', debouncedSearch)
        const r = await fetch(`/api/orders?${q}`, { signal: ac.signal })
        const data = await r.json()
        if (ac.signal.aborted) return
        if (data.success) {
          const d = data.data
          setOrders((prev) => (opts?.append ? [...prev, ...d.list] : d.list))
          setPage(d.page)
          setTotalPages(d.totalPages || 1)
          setCounts(d.counts)
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [page, activeFilter, debouncedSearch]
  )

  // 打开某订单的弹窗；打开「在线沟通」时顺手清掉本订单的未读红点
  const openPanel = (order: Order, type: PanelType) => {
    setPanel({ order, type })
    if (type === 'chat' && order.unreadCount) {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, unreadCount: 0 } : o)))
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

  // 搜索防抖，避免每敲一个字就打一次服务端
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350)
    return () => clearTimeout(t)
  }, [searchTerm])

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/orders')
      return
    }
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router, activeFilter, debouncedSearch])

  if (!user) return null

  const statusFilters = [
    { id: 'all', label: '全部', count: counts.all },
    { id: 'UNPAID', label: '待支付', count: counts.UNPAID },
    { id: 'PROCESSING', label: '处理中', count: counts.PROCESSING },
    { id: 'DELIVERED', label: '已完成', count: counts.DELIVERED },
  ]

  // 筛选与检索已下推到服务端，这里直接用返回的当前列表
  const filteredOrders = orders

  const copyOrderNo = (orderNo: string) => {
    navigator.clipboard.writeText(orderNo)
  }

  return (
    /* pt-32 保持不动：固定头部移动端 112px(py-6+64 药丸)、lg 起 96px(py-4+64)，
       128px 的顶部留白在手机上只余 16px，在桌面上已自动余出 32px ——
       头部变矮腾出的空间就是桌面端的呼吸位，再往上加就成了「顶部一片空」 */
    <div className="min-h-screen pt-32 pb-20 lg:pb-28">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

      {/* 订单卡是「一行一条记录」的横向布局，不是正文，行长约束不适用：
          xl 起把容器从 1024 放宽到 1152，让订单号+时间+金额+按钮排在同一视觉行内，
          横向空白转成信息密度；再宽就没意义了（右侧金额会离左侧商品名太远） */}
      <div className="container relative max-w-5xl xl:max-w-6xl">
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
          className="flex flex-col md:flex-row md:items-center gap-4 mb-8 lg:mb-10"
        >
          {/* 手机端筛选条要能横滑，所以基础样式保留 overflow-x-auto；
              桌面端一行放得下，改成换行排布并去掉滚动条占位，胶囊也放大一档 */}
          <div className="flex-1 flex gap-2 overflow-x-auto md:overflow-visible md:flex-wrap pb-1 md:pb-0">
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 lg:px-5 lg:py-3 rounded-full text-sm lg:text-[15px] font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter.id
                    ? 'bg-white text-black'
                    : 'glass text-white/60 hover:text-white lg:hover:bg-white/10'
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

          <div className="relative md:w-72 lg:w-80 md:shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索订单号或商品..."
              className="w-full pl-11 pr-4 py-2.5 lg:py-3 rounded-full bg-white/5 border border-white/10 text-sm lg:text-[15px] placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
              className="space-y-4 lg:space-y-5"
            >
              {filteredOrders.map((order, index) => {
                const status = getStatusConfig(order.payStatus, order.deliveryStatus)
                const gradient = getGradient(order.productId)
                const paid = order.payStatus === 'PAID'
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="group relative"
                  >
                    <div className={`absolute -inset-[1px] bg-gradient-to-r ${gradient} rounded-2xl opacity-0 group-hover:opacity-30 blur-md transition-opacity`} />

                    {/* 桌面端卡片宽度到 1088px，沿用手机端 p-6 + 14px 正文会让内容浮在中间一条；
                        lg 起加大内边距、图标与标题，把信息「铺开」到实际可用宽度上 */}
                    <div className="relative glass rounded-2xl p-6 lg:p-7 hover:bg-white/10 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 lg:gap-6">
                        <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                          <Sparkles className="w-7 h-7 lg:w-8 lg:h-8" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <h3 className="font-bold text-lg lg:text-xl">{order.productName}</h3>
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
                          <div className="flex items-center gap-4 lg:gap-6 text-sm text-white/40 flex-wrap">
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

                        <div className="flex items-center justify-between md:justify-end gap-4 lg:gap-6">
                          <div className="text-right">
                            <div className="text-2xl lg:text-3xl font-bold">¥{Number(order.amount).toFixed(0)}</div>
                            <div className="text-xs text-white/40">订单金额</div>
                          </div>
                          {order.payStatus === 'UNPAID' && order.deliveryStatus !== 'CANCELLED' && (
                            <button
                              onClick={() => handleAlipay(order)}
                              disabled={payingNo === order.orderNo}
                              className="px-4 py-2 lg:px-5 lg:py-2.5 rounded-lg bg-[#1677FF] text-white text-sm lg:text-[15px] font-medium hover:bg-[#0e5fd8] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5 md:whitespace-nowrap"
                            >
                              {payingNo === order.orderNo ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              ) : null}
                              支付宝支付
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 状态提示 + 操作按钮（不点开详情，直接分项处理） */}
                      {/* 状态提示与操作按钮：手机端必须上下堆叠（横向放不下），
                          但桌面端卡片有 1000px 可用宽，堆叠会白白多占一行、右侧还全是空白。
                          lg 起改成「左提示 / 右按钮」一行 —— 这就是桌面端信息密度的主要来源。
                          四个提示互斥（同一时刻最多渲染一个），没有提示时按钮组自然回到左侧 */}
                      <div className="mt-4 lg:mt-5 pt-4 lg:pt-5 border-t border-white/10 lg:flex lg:items-center lg:justify-between lg:gap-6">
                        {order.deliveryStatus === 'DELIVERED' && (
                          <div className="flex items-center gap-2 text-sm lg:text-[15px] text-green-400 mb-3 lg:mb-0">
                            <CheckCircle className="w-4 h-4" />
                            <span>服务已交付</span>
                          </div>
                        )}
                        {order.payStatus === 'PAID' && order.deliveryStatus === 'PROCESSING' && (
                          <div className="flex items-center gap-2 text-sm lg:text-[15px] text-blue-400 mb-3 lg:mb-0">
                            <Clock className="w-4 h-4" />
                            <span>正在为你开通服务，预计 10 分钟内完成</span>
                          </div>
                        )}
                        {order.payStatus === 'UNPAID' && order.deliveryStatus !== 'CANCELLED' && (
                          <div className="flex items-center gap-2 text-sm lg:text-[15px] text-yellow-400 mb-3 lg:mb-0">
                            <AlertCircle className="w-4 h-4" />
                            <span>请点击「支付宝支付」完成付款</span>
                          </div>
                        )}
                        {order.deliveryStatus === 'CANCELLED' && order.payStatus === 'UNPAID' && (
                          <div className="flex items-center gap-2 text-sm lg:text-[15px] text-white/40 mb-3 lg:mb-0">
                            <XCircle className="w-4 h-4" />
                            <span>订单已超时取消，请重新下单</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 lg:shrink-0">
                          <ActionButton
                            icon={Package}
                            label="发货详情"
                            onClick={() => openPanel(order, 'delivery')}
                          />
                          {paid && order.billing && (
                            <ActionButton
                              icon={FileText}
                              label="开具发票 / 收据"
                              onClick={() => openPanel(order, 'billing')}
                            />
                          )}
                          {paid && (
                            <ActionButton
                              icon={MessageSquare}
                              label="与客服在线沟通"
                              onClick={() => openPanel(order, 'chat')}
                              badge={order.unreadCount}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 分段加载：每次追加一页，避免订单多时一次性拉全量 */}
        {!loading && orders.length > 0 && (
          <div className="mt-6 flex flex-col items-center gap-2">
            {page < totalPages ? (
              <button
                onClick={() => loadOrders({ append: true })}
                disabled={loadingMore}
                className="px-6 py-3 lg:px-10 lg:py-3.5 rounded-xl glass hover:bg-white/10 lg:hover:border-white/25 text-sm lg:text-base font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {loadingMore && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {loadingMore ? '加载中...' : '加载更多订单'}
              </button>
            ) : (
              <span className="text-xs text-white/30">没有更多了</span>
            )}
          </div>
        )}

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
                setPanel(null)
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

      {/* 发货详情弹窗 */}
      {panel && panel.type === 'delivery' && (
        <DeliveryPanel order={panel.order} onClose={() => setPanel(null)} />
      )}

      {/* 发票 / 收据弹窗 */}
      {panel && panel.type === 'billing' && panel.order.billing && (
        <BillingPanel
          order={panel.order}
          onClose={() => setPanel(null)}
          onApplyInvoice={() => setInvoiceOrder(panel.order)}
          onApplyReceipt={() => setReceiptOrder(panel.order)}
        />
      )}

      {/* 在线沟通弹窗 */}
      {panel && panel.type === 'chat' && (
        <ChatPanel order={panel.order} onClose={() => setPanel(null)} />
      )}

      {/* 发票表单（叠加在「发票/收据」弹窗之上） */}
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
            setPanel((prev) =>
              prev && prev.order.id === receiptOrder.id && prev.order.billing
                ? { ...prev, order: { ...prev.order, billing: { ...prev.order.billing, receiptToken: token } } }
                : prev
            )
            setReceiptOrder(null)
            loadOrders()
          }}
        />
      )}

      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
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

// 订单卡片上的操作按钮（发货详情 / 发票收据 / 在线沟通）
function ActionButton({
  icon: Icon,
  label,
  onClick,
  badge,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center gap-1.5 px-4 py-2 lg:px-5 lg:py-2.5 rounded-lg glass hover:bg-white/10 lg:hover:border-white/25 text-sm lg:text-[15px] font-medium transition-colors"
    >
      <Icon className="w-4 h-4" />
      {label}
      {!!badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
      )}
    </button>
  )
}

// 通用弹窗外壳（标题栏 + 关闭按钮 + 可滚动内容区）
//
// 弹窗宽度按断点递进的原因：w-full + max-w-md 在手机上是被屏幕宽度先卡住的，
// 448px 这个上限只有桌面端才真正生效 —— 于是 1920 屏上同一个弹窗就变成正中一条细长条，
// 卡密/订单号这类等宽长串还会被迫折行。所以 sm 起 512、lg 起 576，手机端表现完全不变。
// 高度同理：90vh 在 1080p 上等于顶天立地，lg 收到 82vh 让弹窗四周留出可见的暗底边界。
function PanelModal({
  title,
  icon,
  onClose,
  children,
  maxW = 'max-w-md sm:max-w-lg lg:max-w-xl',
}: {
  title: string
  icon: ReactNode
  onClose: () => void
  children: ReactNode
  maxW?: string
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${maxW} glass-strong rounded-3xl p-6 lg:p-8 max-h-[90vh] lg:max-h-[82vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-5 lg:mb-6">
          <h3 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 lg:w-9 lg:h-9 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/50 flex-shrink-0">{label}</span>
      <span className="text-right break-all">{value}</span>
    </div>
  )
}

// 发货详情：订单信息 + 卡密 + 交付信息 + 短信接码
function DeliveryPanel({ order, onClose }: { order: Order; onClose: () => void }) {
  // 兼容：新接口返回 cardItems（带每张卡的专属兑换地址），旧数据只有 cards: string[]
  const cardRows: { secret: string; redeemUrl: string | null }[] =
    order.cardItems && order.cardItems.length > 0
      ? order.cardItems
      : (order.cards || []).map((s) => ({ secret: s, redeemUrl: null }))
  const hasCards = cardRows.length > 0
  const isHttp = (u?: string | null) => !!u && /^https?:\/\//i.test(u)
  const fallbackRedeemUrl = isHttp(order.product?.cardRedeemUrl) ? order.product!.cardRedeemUrl! : null
  // 兑换地址优先级：卡密自带 → 商品级默认
  const primaryRedeemUrl = cardRows.find((c) => isHttp(c.redeemUrl))?.redeemUrl || fallbackRedeemUrl
  const showHint = !hasCards && !order.deliveryInfo && order.product?.deliveryType !== 'SMS'
  return (
    <PanelModal title="发货详情" icon={<Package className="w-5 h-5 text-emerald-400" />} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <InfoRow label="订单号" value={<span className="font-mono">{order.orderNo}</span>} />
        <InfoRow label="商品" value={<span className="font-medium">{order.productName}</span>} />
        <InfoRow label="金额" value={<span className="font-bold text-lg">¥{Number(order.amount).toFixed(2)}</span>} />
        <InfoRow label="下单时间" value={formatDate(order.createdAt)} />
        {order.paidAt && <InfoRow label="支付时间" value={formatDate(order.paidAt)} />}
        {order.deliveredAt && <InfoRow label="交付时间" value={formatDate(order.deliveredAt)} />}

        {hasCards && (
          <div>
            <div className="text-white/50 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" /> 卡密（请妥善保管）
            </div>
            <div className="space-y-2">
              {cardRows.map((row, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 rounded-lg bg-white/5 border border-green-500/30 font-mono text-xs break-all">
                      {row.secret}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(row.secret)}
                      className="px-3 py-2 rounded-lg glass hover:bg-white/10 text-xs whitespace-nowrap"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* 该卡有专属兑换地址且与商品默认不同时，单独给一个入口 */}
                  {row.redeemUrl && row.redeemUrl !== fallbackRedeemUrl && (
                    <a
                      href={row.redeemUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1.5 inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200"
                    >
                      本卡兑换地址
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
            {/* 统一入口：优先用第一张卡的专属地址，没有才回落商品级默认链接 */}
            {primaryRedeemUrl && (
              <a
                href={primaryRedeemUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 group flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold hover:shadow-[0_0_24px_rgba(16,185,129,0.4)] transition-all"
              >
                去充值 / 兑换
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            )}
            <p className="text-[11px] text-white/40 mt-2">卡密仅本人可见，请按说明使用；如有问题联系客服。</p>
            {order.product?.cardUsage && (
              <div className="mt-3">
                <div className="text-white/50 mb-1.5 text-sm">使用说明</div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 whitespace-pre-wrap leading-relaxed">
                  {order.product.cardUsage}
                </div>
              </div>
            )}
          </div>
        )}

        {order.deliveryInfo && (
          <div>
            <div className="text-white/50 mb-2">交付信息</div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-xs whitespace-pre-wrap">
              {order.deliveryInfo}
            </div>
          </div>
        )}

        {order.payStatus === 'PAID' && order.product?.deliveryType === 'SMS' && (
          <div className="pt-1">
            <div className="text-white/50 mb-2">短信接码</div>
            <OrderSms orderId={order.id} />
          </div>
        )}

        {showHint && (
          <div className="text-xs text-white/40 pt-1">
            {order.payStatus !== 'PAID'
              ? '订单支付后将在此显示发货信息'
              : order.deliveryStatus === 'DELIVERED'
                ? '本订单已交付，如未收到请联系客服'
                : '商家正在为你开通服务，请稍候或联系客服'}
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full mt-6 py-3 rounded-xl glass hover:bg-white/10 text-sm font-medium transition-colors"
      >
        关闭
      </button>
    </PanelModal>
  )
}

// 发票 / 收据：状态与申请入口
function BillingPanel({
  order,
  onClose,
  onApplyInvoice,
  onApplyReceipt,
}: {
  order: Order
  onClose: () => void
  onApplyInvoice: () => void
  onApplyReceipt: () => void
}) {
  const b = order.billing!
  return (
    <PanelModal title="发票 / 收据" icon={<FileText className="w-5 h-5 text-purple-400" />} onClose={onClose}>
      <div className="glass rounded-2xl p-4 mb-4 text-sm space-y-2">
        <div className="flex justify-between"><span className="text-white/40">商品</span><span className="text-white/80 font-medium text-right">{order.productName}</span></div>
        <div className="flex justify-between"><span className="text-white/40">订单号</span><span className="text-white/70 font-mono text-xs break-all text-right">{order.orderNo}</span></div>
        <div className="flex justify-between"><span className="text-white/40">售价</span><span className="text-white/90 font-semibold">¥{b.sellingPrice.toFixed(2)}</span></div>
      </div>

      {/* 发票 */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-white/40" />
          <span className="text-white/50">发票</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              b.invoiceStatus === 'ISSUED'
                ? 'bg-green-500/15 text-green-300'
                : b.invoiceStatus === 'CANNOT'
                  ? 'bg-gray-500/15 text-gray-400'
                  : b.invoiceStatus === 'SUBMITTED'
                    ? 'bg-cyan-500/15 text-cyan-300'
                    : 'bg-amber-500/15 text-amber-300'
            }`}
          >
            {INVOICE_LABELS[b.invoiceStatus] || b.invoiceStatus}
          </span>
        </div>
        {b.invoiceStatus === 'UNAPPLIED' && b.canInvoice && (
          <button
            onClick={onApplyInvoice}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
          >
            申请发票
          </button>
        )}
        {b.invoiceStatus === 'AWAIT_PAY' && b.invoiceId && <PayTaxButton invoiceId={b.invoiceId} />}
      </div>

      {/* 收据 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-white/40" />
          <span className="text-white/50">收据</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              b.receiptToken
                ? 'bg-green-500/15 text-green-300'
                : b.canReceipt
                  ? 'bg-white/10 text-white/60'
                  : 'bg-gray-500/15 text-gray-400'
            }`}
          >
            {b.receiptToken ? '已开具' : b.canReceipt ? '可开具' : '不可开具'}
          </span>
        </div>
        {b.receiptToken ? (
          <a
            href={`/receipt/${b.receiptToken}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-1.5 rounded-lg glass text-sm font-medium hover:bg-white/10 transition-colors"
          >
            查看收据
          </a>
        ) : b.canReceipt ? (
          <button
            onClick={onApplyReceipt}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-sm font-medium hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all"
          >
            申请收据
          </button>
        ) : null}
      </div>

      <p className="text-[11px] text-white/30 mt-4 leading-relaxed">
        发票需在线支付 6% 税费后由商家开具并发送至邮箱；收据可即时生成、仅可开具一次。如有疑问请联系客服。
      </p>
    </PanelModal>
  )
}

// 在线沟通：本订单专属客服会话
function ChatPanel({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <PanelModal title="与客服在线沟通" icon={<MessageSquare className="w-5 h-5 text-cyan-400" />} onClose={onClose} maxW="max-w-lg lg:max-w-2xl">
      <p className="text-xs text-white/40 mb-3">
        {order.productName} · 订单号 <span className="font-mono">{order.orderNo}</span>
      </p>
      <OrderChat apiBase={`/api/orders/${order.id}/messages`} selfRole="BUYER" theme="dark" />
    </PanelModal>
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
  // 必选项：发票中是否展示 ChatGPT/Claude 相关字眼。null = 尚未选择（不给默认值，强制买家表态）
  const [showAiWording, setShowAiWording] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    setErr(null)
    if (!title.trim()) return setErr('请填写发票抬头')
    if (!taxNumber.trim()) return setErr('请填写税号')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr('请填写正确的接收邮箱')
    if (showAiWording === null) return setErr('请选择发票中是否展示 ChatGPT/Claude 相关字眼')
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
          showAiWording,
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
      <label className="block text-xs lg:text-[13px] text-white/50 mb-1 lg:mb-1.5">
        {label}
        {opts?.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={opts?.type || 'text'}
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={opts?.placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 lg:px-4 lg:py-2.5 text-white placeholder:text-white/25 outline-none focus:border-purple-500/50 text-sm lg:text-[15px]"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg lg:max-w-2xl glass-strong rounded-3xl p-6 lg:p-8 max-h-[90vh] lg:max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4 lg:mb-5">
          <h3 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400" /> 申请发票
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
          <div className="sm:col-span-2">{field('抬头', title, setTitle, { required: true, placeholder: '公司名称 / 个人' })}</div>
          <div className="sm:col-span-2">{field('税号', taxNumber, setTaxNumber, { required: true, placeholder: '纳税人识别号' })}</div>
          {field('地址', address, setAddress, { placeholder: '选填' })}
          {field('电话', phone, setPhone, { placeholder: '选填' })}
          {field('开户行', bankName, setBankName, { placeholder: '选填' })}
          {field('卡号', bankAccount, setBankAccount, { placeholder: '选填' })}
          <div className="sm:col-span-2">{field('接收邮箱', email, setEmail, { required: true, type: 'email', placeholder: '发票将发送到此邮箱' })}</div>

          {/* 必选：发票内容是否展示 AI 平台字眼 */}
          <div className="sm:col-span-2">
            <label className="block text-xs text-white/50 mb-1.5">
              发票中是否展示 ChatGPT/Claude 相关字眼<span className="text-red-400 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: true, label: '展示', desc: '发票项目按实际订阅名称开具' },
                { v: false, label: '不展示', desc: '发票项目使用通用名称' },
              ].map((opt) => (
                <button
                  key={String(opt.v)}
                  type="button"
                  onClick={() => setShowAiWording(opt.v)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    showAiWording === opt.v
                      ? 'border-purple-500/60 bg-purple-500/15'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-sm font-medium text-white/90">{opt.label}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md lg:max-w-lg glass-strong rounded-3xl p-6 lg:p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4 lg:mb-5">
          <h3 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400" /> 申请收据
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="glass rounded-2xl p-4 mb-4 text-sm space-y-2">
          <div className="flex justify-between"><span className="text-white/40">收款人</span><span className="text-white/80 text-right">益阳市赫山区必高科技有限公司</span></div>
          <div className="flex justify-between"><span className="text-white/40">商品</span><span className="text-white/80">{order.productName}</span></div>
          <div className="flex justify-between"><span className="text-white/40">订单号</span><span className="text-white/70 font-mono text-xs break-all">{order.orderNo}</span></div>
          {b.receiptAmount > b.sellingPrice && (
            <>
              <div className="flex justify-between"><span className="text-white/40">商品售价</span><span className="text-white/70">¥{b.sellingPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-white/40">已付发票税费（6%）</span><span className="text-white/70">¥{(b.receiptAmount - b.sellingPrice).toFixed(2)}</span></div>
            </>
          )}
          <div className="flex justify-between"><span className="text-white/40">付款金额</span><span className="text-white/90 font-bold">¥{b.receiptAmount.toFixed(2)}</span></div>
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
