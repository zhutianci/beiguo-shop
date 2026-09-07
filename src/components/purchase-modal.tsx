'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, ArrowRight, Ticket } from 'lucide-react'
import { useUserStore } from '@/store/user'
import { getRef } from '@/lib/ref'

/** 结算页可选的券。形状与 /api/coupons/mine 返回一致 */
interface UsableCoupon {
  id: number
  label: string
  applicable: boolean | null
  applicableDiscount: number
  /** 选这张券后服务端会收的钱。前台直接用，不要自己拿 product.price 去减 */
  finalAmount: number | null
  reason: string | null
  expiresAt: string | null
  forever: boolean
}

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
  const [coupons, setCoupons] = useState<UsableCoupon[]>([])
  const [couponId, setCouponId] = useState<number | null>(null)
  /** 不用券时应付多少（服务端算，已含内推专属价） */
  const [baseline, setBaseline] = useState<number | null>(null)

  /*
   * 打开弹窗时拉一次「我的可用券」。
   * 让服务端算「这一单能不能用、能减多少」，前端不复刻规则 ——
   * 复刻就一定会出现「页面显示能减 20、下单却报不可用」这种最伤信任的偏差。
   */
  useEffect(() => {
    if (!open || !product || !user) {
      setCoupons([])
      setCouponId(null)
      setBaseline(null)
      return
    }
    let alive = true
    // 【必须带上 ref】带内推码访问时 product.price 已经是专属价，
    // 拿它去减券面额就成了「专属价 − 券」，而服务端算的是「定价 − 券」——
    // 两边差出来的钱会让买家在收银台看到跟弹窗不一样的数字。
    // 把 ref 交给服务端，让它把这一单的最终价直接算好返回。
    const ref = getRef()
    const qs = new URLSearchParams({ usableOnly: '1', productId: String(product.id), quantity: '1' })
    if (ref) qs.set('ref', ref)
    fetch(`/api/coupons/mine?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d?.success) return
        const list: UsableCoupon[] = d.data.list || []
        setCoupons(list)
        setBaseline(typeof d.data.baseline === 'number' ? d.data.baseline : null)
        // 默认替买家选中减得最多的那张。买家仍可改选或不用 ——
        // 默认不选等于把优惠藏起来，多数人不会主动点开这一栏
        const best = list
          .filter((c) => c.applicable)
          .sort((a, b) => (a.finalAmount ?? Infinity) - (b.finalAmount ?? Infinity))[0]
        setCouponId(best ? best.id : null)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [open, product, user])

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

  /*
   * 展示用的应付价，**一律取服务端算好的数**，前端不再做任何减法。
   * 服务端和这里用的是同一个 quoteOrder，所以弹窗上的数字就是建单时会写进订单的数字。
   * baseline / finalAmount 拿不到时（接口还没回来、未登录）才退回 product.price 兜底显示。
   */
  const chosen = coupons.find((c) => c.id === couponId && c.applicable) || null
  const noCouponPrice = baseline ?? product.price
  const payable = chosen?.finalAmount ?? noCouponPrice

  // 确认支付：建单 → 发起支付宝 → 直接跳转收银台
  const bounceLogin = () => {
    onClose()
    router.push(`/login?redirect=/products/${product.id}`)
  }

  const handleConfirmPay = async () => {
    setSubmitting(true)
    setError('')

    // 本地登录态可能与服务端 cookie 不同步：本地为空时先向服务端二次确认，避免误弹登录
    if (!user) {
      try {
        const me = await fetch('/api/auth/me')
        const md = await me.json()
        if (md.success && md.data?.user) {
          useUserStore.getState().setUser(md.data.user)
        } else {
          setSubmitting(false)
          bounceLogin()
          return
        }
      } catch {
        setSubmitting(false)
        bounceLogin()
        return
      }
    }

    try {
      // 1) 创建订单
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          remark: '支付方式: 支付宝',
          ref: getRef(),
          couponGrantId: couponId,
        }),
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
                  {chosen && (
                    <>
                      <div className="h-px bg-white/10 my-3" />
                      <div className="flex items-center justify-between">
                        <div className="text-white/60 text-sm">优惠券</div>
                        <div className="text-sm text-emerald-300">−¥{chosen.applicableDiscount.toFixed(2)}</div>
                      </div>
                    </>
                  )}
                  <div className="h-px bg-white/10 my-3" />
                  <div className="flex items-center justify-between">
                    <div className="text-white/60 text-sm">应付金额</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">¥{payable.toFixed(2)}</span>
                      {chosen ? (
                        <span className="text-sm text-white/30 line-through">¥{noCouponPrice.toFixed(2)}</span>
                      ) : (
                        product.originalPrice > product.price && (
                          <span className="text-sm text-white/30 line-through">¥{product.originalPrice}</span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* 优惠券选择。只有确实持有可用券时才出现，没有券的人看不到多余的一栏 */}
                {coupons.length > 0 && (
                  <div className="glass rounded-2xl p-5 mb-6">
                    <div className="mb-3 flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-purple-300" />
                      <span className="text-sm font-medium">使用优惠券</span>
                    </div>
                    <div className="space-y-2">
                      {coupons.map((c) => {
                        const active = couponId === c.id
                        const usable = !!c.applicable
                        return (
                          <button
                            key={c.id}
                            type="button"
                            disabled={!usable}
                            onClick={() => setCouponId(active ? null : c.id)}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                              active
                                ? 'border-purple-400/50 bg-purple-500/12'
                                : usable
                                  ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                                  : 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-45'
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="block text-sm text-white/85">{c.label}</span>
                              <span className="mt-0.5 block text-xs text-white/40">
                                {usable
                                  ? c.forever
                                    ? '长期有效'
                                    : `${new Date(c.expiresAt as string).toLocaleDateString('zh-CN')} 前有效`
                                  : c.reason || '本单不可用'}
                              </span>
                            </span>
                            {usable && (
                              <span className="shrink-0 text-sm text-emerald-300">
                                −¥{c.applicableDiscount.toFixed(2)}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-white/35">
                      与推广专属价不叠加，系统会自动为你采用更便宜的那个；最终以下单结果为准。
                    </p>
                  </div>
                )}

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
                      确认支付 ¥{payable.toFixed(2)}
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
