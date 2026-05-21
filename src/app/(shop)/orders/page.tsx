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
} from 'lucide-react'
import { useUserStore } from '@/store/user'
import { ContactModal } from '@/components/contact-modal'

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
  product: { id: number; name: string; image: string | null }
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

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/orders')
      return
    }

    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrders(data.data)
      })
      .finally(() => setLoading(false))
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
                            {order.payStatus === 'UNPAID' && (
                              <button
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setContactOpen(true)
                                }}
                                className={`px-4 py-2 rounded-lg bg-gradient-to-r ${gradient} text-sm font-medium hover:shadow-lg transition-shadow`}
                              >
                                联系客服支付
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-4 py-2 rounded-lg glass hover:bg-white/10 text-sm font-medium transition-colors flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              详情
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

                      {order.payStatus === 'UNPAID' && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2 text-sm text-yellow-400">
                            <AlertCircle className="w-4 h-4" />
                            <span>请联系客服微信 GenuineMarxist 完成支付</span>
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
                {selectedOrder.deliveryInfo && (
                  <div>
                    <div className="text-white/50 mb-2">交付信息</div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-xs whitespace-pre-wrap">
                      {selectedOrder.deliveryInfo}
                    </div>
                  </div>
                )}
              </div>
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
