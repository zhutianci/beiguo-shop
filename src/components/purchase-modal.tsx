'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, CreditCard, AlertCircle, ArrowRight, Copy } from 'lucide-react'
import { useUserStore } from '@/store/user'

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

type PayMethod = 'alipay' | 'wechat'

const WECHAT_ID = 'GenuineMarxist'

export function PurchaseModal({ open, onClose, product }: PurchaseModalProps) {
  const router = useRouter()
  const { user } = useUserStore()
  const [step, setStep] = useState<'select' | 'contact'>('select')
  const [payMethod, setPayMethod] = useState<PayMethod>('wechat')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [orderNo, setOrderNo] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      setStep('select')
      setOrderNo('')
      setError('')
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!product) return null

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirmPay = async () => {
    // 未登录直接跳转登录
    if (!user) {
      onClose()
      router.push(`/login?redirect=/products/${product.id}`)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          remark: `支付方式: ${payMethod === 'wechat' ? '微信' : '支付宝'}`,
        }),
      })

      // 401: 服务端 cookie 失效（本地状态脏数据），清理并跳转登录
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

      setOrderNo(data.data.order.orderNo)
      setStep('contact')
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    // 如果已创建订单，跳转到订单页
    if (orderNo) {
      router.push('/orders')
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
          onClick={handleClose}
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
                onClick={handleClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${product.gradient} opacity-20 rounded-full blur-[80px] pointer-events-none`} />

              <div className="relative">
                {step === 'select' && (
                  <>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-1">确认订单</h2>
                      <p className="text-white/50 text-sm">请选择你的支付方式</p>
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

                    <div className="space-y-3 mb-6">
                      <button
                        onClick={() => setPayMethod('wechat')}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                          payMethod === 'wechat'
                            ? 'bg-white/10 border-green-500/50'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                              <path d="M8.691 2C4.768 2 1.5 4.65 1.5 7.913c0 1.873 1.075 3.534 2.715 4.642a.522.522 0 01.222.434.677.677 0 01-.027.187l-.352 1.336c-.016.072-.04.144-.04.216 0 .144.117.262.262.262.058 0 .115-.019.166-.047l1.722-.998a.766.766 0 01.4-.115c.077 0 .15.013.222.034a8.49 8.49 0 002.32.317c.207 0 .413-.013.617-.034A4.886 4.886 0 019.5 12.5c0-2.945 2.842-5.336 6.353-5.336.137 0 .272.005.404.013C15.677 4.06 12.477 2 8.691 2zM5.785 6.825a.965.965 0 110-1.93.965.965 0 010 1.93zm5.793 0a.965.965 0 110-1.93.965.965 0 010 1.93z"/>
                              <path d="M22.5 12.5c0-2.625-2.625-4.75-5.875-4.75-3.25 0-5.875 2.125-5.875 4.75 0 2.625 2.625 4.75 5.875 4.75.625 0 1.225-.075 1.775-.225.05-.013.1-.025.15-.025.087 0 .175.025.25.075l1.275.738a.21.21 0 00.125.038c.1 0 .175-.075.175-.175 0-.05-.013-.1-.025-.15l-.262-.988a.46.46 0 01-.025-.137.4.4 0 01.162-.325c1.213-.825 2.275-2.063 2.275-3.575zM15 11.5a.75.75 0 110-1.5.75.75 0 010 1.5zm4.5 0a.75.75 0 110-1.5.75.75 0 010 1.5z"/>
                            </svg>
                          </div>
                          <div className="text-left">
                            <div className="font-medium">微信支付</div>
                            <div className="text-xs text-white/40">推荐使用</div>
                          </div>
                        </div>
                        {payMethod === 'wechat' && (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </button>

                      <button
                        onClick={() => setPayMethod('alipay')}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                          payMethod === 'alipay'
                            ? 'bg-white/10 border-blue-500/50'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                              <path d="M22.97 17.96c-.83-.27-3.05-.96-5.85-1.97 1.65-2.85 2.39-5.97 1.66-6.6-.83-.71-3.05.45-4.91 1.55-.94-1.36-2.18-2.7-3.6-3.6.93-.5 1.95-.92 2.84-1.16.78-.22 1.56-.27 2.18-.07.43.14.66.39.66.74 0 .42-.39.96-1.31 1.43-.18.09-.27.31-.18.5.07.13.21.2.36.2.07 0 .14-.02.21-.05 1.13-.59 1.78-1.28 1.94-2.03.12-.61-.07-1.21-.55-1.66C15.97 4.55 14.95 4.27 13.71 4.55c-1.13.27-2.43.84-3.62 1.55C9.07 5.51 8.04 5 7.04 4.71c-1.36-.4-2.61-.13-3.34.71-1.27 1.43-.5 4.21 1.91 6.84-.36.16-.7.34-1.01.52-1.86 1.09-2.98 2.41-3.13 3.75-.13 1.14.43 2.17 1.55 2.86 1.14.7 2.71.83 4.46.36 1.7-.45 3.55-1.45 5.21-2.81.16.18.32.36.48.52 2.43 2.43 5.55 3.74 7.13 2.16 1.45-1.45.21-3.81-2.07-6.21l3.94-1.59c.18-.07.29-.27.21-.45-.07-.21-.27-.32-.43-.25z"/>
                            </svg>
                          </div>
                          <div className="text-left">
                            <div className="font-medium">支付宝</div>
                            <div className="text-xs text-white/40">安全便捷</div>
                          </div>
                        </div>
                        {payMethod === 'alipay' && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </button>
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
                      <p className="text-xs text-white/40 text-center mt-3">
                        未登录用户将跳转到登录页
                      </p>
                    )}
                  </>
                )}

                {step === 'contact' && (
                  <>
                    <div className="text-center mb-6">
                      <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', bounce: 0.5 }}
                        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 mb-4"
                      >
                        <Check className="w-7 h-7" />
                      </motion.div>
                      <h2 className="text-2xl font-bold mb-2">订单已创建</h2>
                      <p className="text-white/50 text-sm">
                        请添加客服微信完成支付，开通服务
                      </p>
                    </div>

                    {/* 订单号 */}
                    <div className="glass rounded-2xl p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-white/40 mb-1">订单号</div>
                          <div className="font-mono font-bold text-sm">{orderNo}</div>
                        </div>
                        <button
                          onClick={() => handleCopy(orderNo)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs glass hover:bg-white/10"
                        >
                          <Copy className="w-3 h-3" />
                          复制
                        </button>
                      </div>
                    </div>

                    {/* 二维码 */}
                    <div className="bg-white rounded-2xl p-4 mb-4">
                      <div className="relative aspect-square w-full max-w-[220px] mx-auto">
                        <Image
                          src="/wechat-qr.jpg"
                          alt="微信二维码"
                          fill
                          className="object-contain rounded-lg"
                          priority
                        />
                      </div>
                    </div>

                    {/* 微信号 */}
                    <div className="glass rounded-2xl p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-white/40 mb-1">客服微信</div>
                          <div className="font-mono font-bold">{WECHAT_ID}</div>
                        </div>
                        <button
                          onClick={() => handleCopy(WECHAT_ID)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            copied
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-gradient-to-r from-purple-600 to-pink-600'
                          }`}
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              复制
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-200/80 leading-relaxed">
                          请添加客服并发送订单号 <strong className="text-amber-200">{orderNo}</strong>，
                          客服将引导你完成支付并快速开通服务。
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleClose}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-semibold hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
                    >
                      我知道了，查看我的订单
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
