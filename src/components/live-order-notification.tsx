'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, MapPin } from 'lucide-react'

interface RecentOrder {
  id: number
  productName: string
  amount: number
  displayName: string
  city: string
}

// 没有真实订单时的预设示例（脱敏假数据，让网站更"活")
const FALLBACK_ORDERS: RecentOrder[] = [
  { id: 9001, productName: 'Claude Pro', amount: 150, displayName: 'zh***@gmail.com', city: '北京' },
  { id: 9002, productName: 'ChatGPT Plus', amount: 145, displayName: '李*星', city: '上海' },
  { id: 9003, productName: 'Claude MAX 5x', amount: 780, displayName: 'wa***@qq.com', city: '深圳' },
  { id: 9004, productName: 'ChatGPT Pro', amount: 1580, displayName: 'mi***@163.com', city: '杭州' },
  { id: 9005, productName: 'Claude MAX 20x', amount: 1580, displayName: '王*林', city: '广州' },
  { id: 9006, productName: 'Claude Pro', amount: 150, displayName: 'ti***@outlook.com', city: '成都' },
  { id: 9007, productName: 'ChatGPT Plus', amount: 145, displayName: '陈*洋', city: '武汉' },
  { id: 9008, productName: 'Claude MAX 5x', amount: 780, displayName: 'qi***@gmail.com', city: '南京' },
]

const gradients = [
  'from-violet-600 to-purple-600',
  'from-purple-600 to-pink-600',
  'from-pink-600 to-rose-600',
  'from-emerald-600 to-teal-600',
  'from-teal-600 to-cyan-600',
  'from-cyan-600 to-blue-600',
]

function getGradient(id: number) {
  return gradients[id % gradients.length]
}

function getRelativeTime(): string {
  const choices = ['刚刚', '1 分钟前', '2 分钟前', '3 分钟前', '5 分钟前', '8 分钟前', '10 分钟前']
  return choices[Math.floor(Math.random() * choices.length)]
}

export function LiveOrderNotification() {
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [current, setCurrent] = useState<{ order: RecentOrder; relativeTime: string } | null>(null)
  const indexRef = useRef(0)

  // 加载订单数据
  useEffect(() => {
    fetch('/api/orders/recent')
      .then((r) => r.json())
      .then((data) => {
        const realOrders: RecentOrder[] = data.success && data.data.length > 0 ? data.data : []
        // 混合真实订单和示例数据（让总数足够轮播）
        const combined = realOrders.length >= 5 ? realOrders : [...realOrders, ...FALLBACK_ORDERS]
        setOrders(combined)
      })
      .catch(() => setOrders(FALLBACK_ORDERS))
  }, [])

  // 定时弹出通知
  useEffect(() => {
    if (orders.length === 0) return

    // 首次延迟 3 秒
    const firstTimer = setTimeout(() => {
      showNext()
    }, 3000)

    function showNext() {
      const order = orders[indexRef.current % orders.length]
      indexRef.current++
      setCurrent({ order, relativeTime: getRelativeTime() })

      // 5 秒后隐藏
      setTimeout(() => setCurrent(null), 5000)
    }

    // 之后每 8-15 秒随机弹出
    const interval = setInterval(() => {
      showNext()
    }, 8000 + Math.random() * 7000)

    return () => {
      clearTimeout(firstTimer)
      clearInterval(interval)
    }
  }, [orders])

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.order.id + '-' + indexRef.current}
          initial={{ opacity: 0, x: -100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -100, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="fixed bottom-6 left-6 z-40 max-w-xs"
        >
          <div className="relative group">
            <div className={`absolute -inset-[1px] bg-gradient-to-r ${getGradient(current.order.id)} rounded-2xl blur-sm opacity-60`} />

            <div className="relative glass-strong rounded-2xl p-3 pr-4 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradient(current.order.id)} flex items-center justify-center flex-shrink-0`}>
                  <ShoppingBag className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
                    <MapPin className="w-3 h-3" />
                    <span>{current.order.city}</span>
                    <span className="text-white/20">·</span>
                    <span>{current.relativeTime}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-mono text-white/80">{current.order.displayName}</span>
                    <span className="text-white/40"> 刚刚购买了 </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-sm font-bold">{current.order.productName}</span>
                    <span className={`text-sm font-bold bg-gradient-to-r ${getGradient(current.order.id)} bg-clip-text text-transparent`}>
                      ¥{current.order.amount}
                    </span>
                  </div>
                </div>
              </div>

              {/* 底部进度条 */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${getGradient(current.order.id)} rounded-bl-2xl`}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
