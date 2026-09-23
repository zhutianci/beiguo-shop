'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, ArrowRight, Ticket, FileText, Check } from 'lucide-react'
import { useUserStore } from '@/store/user'
import { getRef } from '@/lib/ref'
import { InvoiceTitlePicker, useSavedTitles, type SavedTitle } from '@/components/invoice-title-picker'
// 无依赖的纯函数模块，与服务端校验共用同一份规则（lib/invoice.ts 引了 node:crypto，客户端不能引）
import { normalizeTaxNumber, TAX_NUMBER_MAX_LEN } from '@/lib/tax-number'

/** 税点。与服务端 lib/invoice.ts 的 TAX_RATE 必须一致，这里只用于展示 */
const TAX_RATE = 0.06

/** 含税开票金额与税费。**必须按分算**，且税费由减法导出 —— 与服务端 calcInvoiceAmounts 同一口径。
 *  两边各自 round(p*1.06) / round(p*0.06) 的写法会在 .25/.75 结尾的价格上差一分钱，
 *  而买家实付的就是这个数，差一分就是收银台金额和票面对不上。 */
function calcInvoice(price: number) {
  const sell = Math.round(price * 100)
  const inv = Math.round(sell * (1 + TAX_RATE))
  return { invoiceAmount: inv / 100, taxFee: (inv - sell) / 100 }
}

const EMPTY_FORM = {
  title: '',
  taxNumber: '',
  address: '',
  phone: '',
  bankName: '',
  bankAccount: '',
  email: '',
}

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
  /** 不用券时应付多少（服务端算；内推单即专属价） */
  const [baseline, setBaseline] = useState<number | null>(null)
  /** 这一单是不是通过内推链接下的。内推单按专属价成交，整块优惠券区不展示 */
  const [referral, setReferral] = useState(false)

  /* ---------------- 开发票 ---------------- */
  /** 勾上就按 货款 + 6% 税费 一次付清，付款成功后发货与提交开票同时发生 */
  const [wantInvoice, setWantInvoice] = useState(false)
  const { titles, loaded: titlesLoaded } = useSavedTitles(!!open && !!user)
  /** 买家动过任何一个开票字段后，就不再让迟到的接口结果覆盖他填的内容 */
  const touched = useRef(false)
  /** 选中的已保存抬头 id；null = 手填新抬头 */
  const [titleId, setTitleId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  /** 发票中是否展示 ChatGPT/Claude 字眼。null = 还没选，不给默认值 */
  const [showAiWording, setShowAiWording] = useState<boolean | null>(null)
  const [saveTitle, setSaveTitle] = useState(true)

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
      setReferral(false)
      return
    }
    let alive = true
    /*
     * 【必须带上 ref】带内推码访问时 product.price 已经被 /api/products 覆盖成专属价，
     * 前端手里那个数不是定价，拿它做任何加减都会和服务端算出不同的结果。
     * 把 ref 交给服务端，由它判定这是不是内推单、并把最终价直接算好返回。
     */
    const ref = getRef()
    const qs = new URLSearchParams({ usableOnly: '1', productId: String(product.id), quantity: '1' })
    if (ref) qs.set('ref', ref)
    fetch(`/api/coupons/mine?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d?.success) return
        const list: UsableCoupon[] = d.data.list || []
        setCoupons(list)
        setReferral(!!d.data.referral)
        setBaseline(typeof d.data.baseline === 'number' ? d.data.baseline : null)
        /*
         * 【默认不勾选任何券】站长 2026-09-11 定的规则。
         * 之前是自动选中最省钱的那张，看似贴心，但买家点开弹窗时价格已经被改过，
         * 和他在商品页看到的数字对不上 —— 少一次「这价怎么变了」的困惑，
         * 比多省几十块更重要。券要用，买家自己点。
         */
        setCouponId(null)
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
      // 关掉弹窗就把开票选项清空：下次打开不该延续上一次的勾选
      setWantInvoice(false)
      setTitleId(null)
      setForm({ ...EMPTY_FORM })
      setShowAiWording(null)
      setSaveTitle(true)
      touched.current = false
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  /*
   * 勾上「开发票」时自动带入默认抬头，少点两下。
   * 只在刚勾上、且用户还没做过任何选择（titleId 为空且抬头没填）时才带 ——
   * 否则买家手动改过抬头后，这个 effect 会把他改的内容盖回去。
   */
  useEffect(() => {
    if (!wantInvoice || !titlesLoaded || titleId !== null || touched.current) return
    const def = titles.find((t) => t.isDefault) || titles[0]
    if (def) applyTitle(def)
    else if (user?.email) setForm((f) => (f.email ? f : { ...f, email: user.email as string }))
    // applyTitle 是稳定的闭包（只 setState），不进依赖表，避免无谓重跑
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantInvoice, titlesLoaded, titles, user])

  const applyTitle = (t: SavedTitle) => {
    setTitleId(t.id)
    setForm({
      title: t.title,
      taxNumber: t.taxNumber,
      address: t.address || '',
      phone: t.phone || '',
      bankName: t.bankName || '',
      bankAccount: t.bankAccount || '',
      email: t.email || user?.email || '',
    })
    // 已经存过的抬头不用再存一遍
    setSaveTitle(false)
  }

  const startNewTitle = () => {
    // 【必须标记 touched】否则买家点了「填新抬头」、手填完 B 公司，
    // 只要 effect 因为任何原因再跑一次（取消再勾选开票、登录态同步刷新了 user 对象），
    // 就会把默认抬头 A 重新盖回去 —— 而这一单是货款+税费一次付清的，
    // 中间没有第二个确认步骤，买家直到收到开给 A 公司的发票才会发现。
    touched.current = true
    setTitleId(null)
    setForm({ ...EMPTY_FORM, email: user?.email || '' })
    setSaveTitle(true)
  }

  if (!product) return null

  /*
   * 展示用的应付价，**一律取服务端算好的数**，前端不再做任何减法。
   * 服务端和这里用的是同一个 quoteOrder，所以弹窗上的数字就是建单时会写进订单的数字。
   * baseline / finalAmount 拿不到时（接口还没回来、未登录）才退回 product.price 兜底显示。
   */
  const chosen = coupons.find((c) => c.id === couponId && c.applicable) || null
  const noCouponPrice = baseline ?? product.price
  /** 货款（不含税）。内推单这里就是专属价，所以下面的 ×1.06 天然按内推价算 */
  const goods = chosen?.finalAmount ?? noCouponPrice
  const { invoiceAmount, taxFee } = calcInvoice(goods)
  /** 收银台真正会收的数 */
  const payable = wantInvoice ? invoiceAmount : goods

  /*
   * 开票表单还差什么。
   *
   * 【返回「缺什么」而不是一个布尔】只给布尔的话，按钮一勾开票就变灰，
   * 而说明文字写在 handleConfirmPay 的早退里 —— 那行代码永远跑不到（禁用的按钮不触发 onClick），
   * 买家看到的就是一个不能点、也不告诉他为什么的按钮。
   */
  // 【必须用服务端那一份】JS 的 \s 不含零宽字符，自己写正则会把
  // 「18 位真税号里夹了 3 个零宽空格」算成 21 位，弹出一个买家怎么数都数不明白的报错
  const cleanTax = normalizeTaxNumber(form.taxNumber)
  const invoiceMissing = (() => {
    if (!wantInvoice) return null
    if (!form.title.trim()) return '请填写发票抬头'
    if (!cleanTax) return '请填写税号'
    // 税局批量导入的硬限制。放在前台拦一道，省得建单后才被服务端打回
    if (cleanTax.length > TAX_NUMBER_MAX_LEN)
      return `税号去掉空格后为 ${cleanTax.length} 位，超过税务系统允许的 ${TAX_NUMBER_MAX_LEN} 位，请检查是否填错`
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return '请填写正确的接收邮箱'
    if (showAiWording === null) return '请选择发票中是否展示 ChatGPT/Claude 相关字眼'
    return null
  })()

  const setF = (k: keyof typeof EMPTY_FORM) => (v: string) => {
    touched.current = true
    setForm((f) => ({ ...f, [k]: v }))
    /*
     * 【只有抬头和税号会让它「不再是那条抬头」】
     * 改地址/电话/开户行/卡号/邮箱仍然是同一个抬头，清掉 titleId 的话
     * touchInvoiceTitle 不会刷新它的最近使用时间，这条买家天天用的抬头
     * 反而会在候选列表里一路下沉。
     */
    if (k === 'title' || k === 'taxNumber') setTitleId(null)
  }

  // 确认支付：建单 → 发起支付宝 → 直接跳转收银台
  const bounceLogin = () => {
    onClose()
    router.push(`/login?redirect=/products/${product.id}`)
  }

  const handleConfirmPay = async () => {
    if (invoiceMissing) {
      setError(invoiceMissing)
      return
    }
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
          // 勾了才带这一块。服务端据此算税费、存开票草稿，
          // 付款成功后发货与提交开票同时发生（lib/vmq.ts fulfillOrder）
          invoice: wantInvoice
            ? {
                title: form.title.trim(),
                taxNumber: form.taxNumber.trim(),
                address: form.address.trim() || null,
                phone: form.phone.trim() || null,
                bankName: form.bankName.trim() || null,
                bankAccount: form.bankAccount.trim() || null,
                email: form.email.trim(),
                showAiWording,
                titleId,
                saveTitle: titleId === null && saveTitle,
              }
            : null,
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

  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    opts?: { required?: boolean; placeholder?: string; type?: string }
  ) => (
    <div>
      <label className="mb-1 block text-xs text-white/50">
        {label}
        {opts?.required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      <input
        type={opts?.type || 'text'}
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={opts?.placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-500/50"
      />
    </div>
  )

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
                  {wantInvoice && (
                    <>
                      <div className="h-px bg-white/10 my-3" />
                      <div className="flex items-center justify-between">
                        <div className="text-white/60 text-sm">商品金额</div>
                        <div className="text-sm text-white/80">¥{goods.toFixed(2)}</div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-amber-300/80 text-sm">发票税费（6%）</div>
                        <div className="text-sm text-amber-300">+¥{taxFee.toFixed(2)}</div>
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
                        !wantInvoice &&
                        product.originalPrice > product.price && (
                          <span className="text-sm text-white/30 line-through">¥{product.originalPrice}</span>
                        )
                      )}
                    </div>
                  </div>
                  {wantInvoice && (
                    <p className="mt-2 text-[11px] leading-relaxed text-white/35">
                      货款与税费一次付清，报销时只需要提供这一条付款记录。发票按商品金额 ×1.06 开具；
                      收银台可能为区分订单把实付额微调几分钱，不影响开票。
                    </p>
                  )}
                </div>

                {/* 开发票。放在金额下面、券上面：它直接改变「应付金额」，要让买家先看到钱再看到券 */}
                <div className="glass rounded-2xl p-5 mb-6">
                  <button
                    type="button"
                    onClick={() => setWantInvoice((v) => !v)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        wantInvoice ? 'border-purple-400 bg-purple-500' : 'border-white/25 bg-white/5'
                      }`}
                    >
                      {wantInvoice && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <FileText className="h-4 w-4 text-purple-300" />
                        同时开具增值税发票
                      </span>
                      <span className="mt-0.5 block text-xs text-white/40">
                        票面金额 = 商品金额 × 1.06，税费随货款一次付清；不勾选的话，付款后仍可在「我的订单」里单独申请
                      </span>
                    </span>
                  </button>

                  {wantInvoice && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      {!user ? (
                        <p className="text-xs text-white/40">登录后可选择已保存的抬头，现在填的抬头也会随订单一起提交。</p>
                      ) : (
                        <InvoiceTitlePicker
                          titles={titles}
                          selectedId={titleId}
                          onPick={applyTitle}
                          onNew={startNewTitle}
                        />
                      )}

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          {field('抬头', form.title, setF('title'), { required: true, placeholder: '公司名称 / 个人' })}
                        </div>
                        <div className="sm:col-span-2">
                          {field('税号', form.taxNumber, setF('taxNumber'), {
                            required: true,
                            placeholder: '纳税人识别号（带空格会自动去掉）',
                          })}
                          {cleanTax.length > TAX_NUMBER_MAX_LEN && (
                            <p className="mt-1 text-[11px] text-red-400">
                              去空格后 {cleanTax.length} 位，超过税务系统允许的 {TAX_NUMBER_MAX_LEN} 位
                            </p>
                          )}
                        </div>
                        {field('地址', form.address, setF('address'), { placeholder: '选填' })}
                        {field('电话', form.phone, setF('phone'), { placeholder: '选填' })}
                        {field('开户行', form.bankName, setF('bankName'), { placeholder: '选填' })}
                        {field('卡号', form.bankAccount, setF('bankAccount'), { placeholder: '选填' })}
                        <div className="sm:col-span-2">
                          {field('接收邮箱', form.email, setF('email'), {
                            required: true,
                            type: 'email',
                            placeholder: '发票将发送到此邮箱',
                          })}
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-1.5 block text-xs text-white/50">
                            发票中是否展示 ChatGPT/Claude 相关字眼<span className="ml-0.5 text-red-400">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { v: true, label: '展示', desc: '按实际订阅名称开具' },
                              { v: false, label: '不展示', desc: '使用通用名称' },
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
                                <div className="mt-0.5 text-[11px] text-white/40">{opt.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {user && titleId === null && (
                        <button
                          type="button"
                          onClick={() => setSaveTitle((v) => !v)}
                          className="mt-3 flex items-center gap-2 text-left text-xs text-white/50 hover:text-white/70"
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                              saveTitle ? 'border-purple-400 bg-purple-500' : 'border-white/25 bg-white/5'
                            }`}
                          >
                            {saveTitle && <Check className="h-3 w-3" />}
                          </span>
                          保存这个抬头，下次开票一键填入（可在个人中心管理）
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 优惠券选择。只有确实持有可用券时才出现，没有券的人看不到多余的一栏 */}
                {!referral && coupons.length > 0 && (
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
                      默认不使用优惠券，选中后上方应付金额会同步更新；一单只能用一张。
                    </p>
                  </div>
                )}

                {/* 内推单：不展示券，但要讲清楚为什么，否则买家会以为自己的券没了 */}
                {referral && (
                  <div className="glass rounded-2xl p-4 mb-6 flex items-start gap-2">
                    <Ticket className="h-4 w-4 mt-0.5 shrink-0 text-purple-300" />
                    <p className="text-xs leading-relaxed text-white/45">
                      本单通过推广链接下单，已按专属价计算，不再叠加优惠券。
                      你账户里的优惠券不受影响，直接从商品页下单时可以使用。
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
