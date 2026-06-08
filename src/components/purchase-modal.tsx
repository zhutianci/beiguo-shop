'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, ArrowRight } from 'lucide-react'
import { useUserStore } from '@/store/user'
import { getRef } from '@/lib/ref'

interface PurchaseModalProps {
  open: boolean
  onClose: () => void
  product: {
    id: number
    name: string
    price: number
    originalPrice: number
    gradient: string
  } | null
}

export function PurchaseModal({ open, onClose, product }: PurchaseModalProps) {
  const router = useRouter()
  const { user } = useUserStore()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      setError('')
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!product) return null

  // 确认支付：建单 → 发起支付宝 → 直接跳转收银台
  const handleConfirmPay = async () => {
    if (!user) {
      onClose()
      router.push(`/login?redirect=/products/${product.id}`)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      // 1) 创建订单
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1, remark: '支付方式: 支付宝', ref: getRef() }),
      })
      if (res.status === 401) {
        useUserStore.getState().setUser(null)
        onClose()
        router.push(`/login?redirect=/products/${product.id}`)
        return
      }
      const data = await res.json()
      if (!data.success) {
        setError(data.error || '订单创建失败')
        return
      }

      // 2) 发起收款，拿到收银台地址
      const payRes = await fetch('/api/pay/vmq/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo: data.data.order.orderNo }),
      })
      const payData = await payRes.json()
      if (payData.success && payData.data?.payUrl) {
        // 3) 跳转到收银台（扫码支付）
        router.push(payData.data.payUrl)
        return
      }
      // 发起失败：退回订单页，可在订单页再次支付
      setError(payData.error || '发起支付失败，请到「我的订单」重试')
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md"
          >
            <div className={`absolute -inset-[1px] bg-gradient-to-r ${product.gradient} rounded-3xl blur-md opacity-60`} />

            <div className="relative glass-strong rounded-3xl p-8 overflow-hidden">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${product.gradient} opacity-20 rounded-full blur-[80px] pointer-events-none`} />

              <div className="relative">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-1">确认订单</h2>
                  <p className="text-white/50 text-sm">使用支付宝完成支付</p>
                </div>

                <div className="glass rounded-2xl p-5 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-white/60 text-sm">商品</div>
                    <div className="font-semibold">{product.name}</div>
                  </div>
                  <div className="h-px bg-white/10 my-3" />
                  <div className="flex items-center justify-between">
                    <div className="text-white/60 text-sm">应付金额</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">¥{product.price}</span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm text-white/30 line-through">¥{product.originalPrice}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 支付方式：仅支付宝 */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-blue-500/40 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[#1677FF] flex items-center justify-center">
                    <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                      <path d="M22.97 17.96c-.83-.27-3.05-.96-5.85-1.97 1.65-2.85 2.39-5.97 1.66-6.6-.83-.71-3.05.45-4.91 1.55-.94-1.36-2.18-2.7-3.6-3.6.93-.5 1.95-.92 2.84-1.16.78-.22 1.56-.27 2.18-.07.43.14.66.39.66.74 0 .42-.39.96-1.31 1.43-.18.09-.27.31-.18.5.07.13.21.2.36.2.07 0 .14-.02.21-.05 1.13-.59 1.78-1.28 1.94-2.03.12-.61-.07-1.21-.55-1.66-.62-.55-1.64-.83-2.88-.55-1.13.27-2.43.84-3.62 1.55C9.07 5.51 8.04 5 7.04 4.71c-1.36-.4-2.61-.13-3.34.71-1.27 1.43-.5 4.21 1.91 6.84-.36.16-.7.34-1.01.52-1.86 1.09-2.98 2.41-3.13 3.75-.13 1.14.43 2.17 1.55 2.86 1.14.7 2.71.83 4.46.36 1.7-.45 3.55-1.45 5.21-2.81.16.18.32.36.48.52 2.43 2.43 5.55 3.74 7.13 2.16 1.45-1.45.21-3.81-2.07-6.21l3.94-1.59c.18-.07.29-.27.21-.45-.07-.21-.27-.32-.43-.25z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">支付宝</div>
                    <div className="text-xs text-white/40">安全便捷，支持手机/电脑</div>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleConfirmPay}
                  disabled={submitting}
                  className={`group w-full py-4 rounded-xl font-semibold bg-gradient-to-r ${product.gradient} flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      确认支付 ¥{product.price}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {!user && (
                  <p className="text-xs text-white/40 text-center mt-3">未登录用户将跳转到登录页</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
