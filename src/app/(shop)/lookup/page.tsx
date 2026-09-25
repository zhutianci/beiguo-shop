'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Mail, Sparkles, Package, CheckCircle, Clock, Calendar, BellRing, Smartphone, Save, FileText, X, AlertCircle, Check } from 'lucide-react'
import { InvoiceTitlePicker, useSavedTitles, type SavedTitle } from '@/components/invoice-title-picker'
import { emailProofHeaders, saveEmailProof, clearEmailProof } from '@/lib/email-proof-client'

interface ExternalOrder {
  id: number
  startDate: string
  expireDate: string
  subscriptionType: string
  claudeAccount: string
  createdAt: string
  updatedAt: string
  canInvoice: boolean
  sellingPrice: number | null
  invoiceAmount: number | null
  taxFee: number | null
  receiptAmount: number | null // 收据应开金额：已付发票税费=含税开票金额，否则=售价
  invoiceStatus: string // UNAPPLIED | AWAIT_PAY | SUBMITTED | ISSUED | CANNOT
  invoiceId: number | null
  canReceipt: boolean
  receiptToken: string | null
  // 背后是本站账号的订单：开票 / 开收据 / 付税费只认下单本人登录（服务端 lib/order-billing.ts 规则 A）
  ownerOnly?: boolean
}

/*
 * 【邮箱证明过期 / 没存下来的统一出口】查订阅、开票、付税费、开收据、设提醒都认同一张 30 分钟有效的
 * 服务端证明（lib/email-proof.ts）。子组件拿到「需要验证」类的失败时发这个事件，由页面重新弹出验证码框，
 * 而不是各自弹一句让买家摸不着头脑的错误（例如付税费的 404「发票不存在或无权操作」）。
 */
const PROOF_EXPIRED_EVENT = 'lookup:proof-expired'
function signalProofExpired() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PROOF_EXPIRED_EVENT))
}
/** 这次失败是不是「需要重新证明邮箱」造成的 */
function needsReverify(status: number, error: unknown): boolean {
  return status === 401 || (status === 403 && typeof error === 'string' && error.includes('验证'))
}

const INVOICE_LABELS: Record<string, string> = {
  UNAPPLIED: '可开据·未开发票',
  AWAIT_PAY: '可开据·待支付税费',
  SUBMITTED: '可开具·已提交开票',
  ISSUED: '已开具',
  CANNOT: '不可开据',
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatFullDateTime(d: Date) {
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

interface Remaining {
  total: number
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function getRemaining(target: string, now: Date): Remaining {
  const diff = new Date(target).getTime() - now.getTime()
  if (diff <= 0) {
    return { total: diff, days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return { total: diff, days, hours, minutes, seconds, expired: false }
}

export default function LookupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen page-top text-center text-white/40">加载中...</div>}>
      <LookupForm />
    </Suspense>
  )
}

function LookupForm() {
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [orders, setOrders] = useState<ExternalOrder[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [now, setNow] = useState<Date>(new Date())
  const [invoiceOrder, setInvoiceOrder] = useState<ExternalOrder | null>(null)
  const [receiptOrder, setReceiptOrder] = useState<ExternalOrder | null>(null)

  // 实时刷新当前时间
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  /*
   * 【查订阅要先证明邮箱是你的（2026-09-26）】以前只凭邮箱就能查到任何人的订阅与收据。
   * 现在接口没有证明时回 401 + needVerify：页面给这个邮箱发验证码，验过之后 30 分钟内
   * 查询、开票、付税费、开收据、设提醒都不用再验（服务端 cookie，lib/email-proof.ts）。
   * 登录用户查自己已验证的登录邮箱 / 已验证的绑定账户时不需要验证码。
   */
  const [needCode, setNeedCode] = useState(false)
  const [code, setCode] = useState('')
  const [codeMsg, setCodeMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const runLookup = async (addr: string): Promise<'ok' | 'need' | 'err'> => {
    const res = await fetch('/api/external-orders/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...emailProofHeaders() },
      body: JSON.stringify({ email: addr }),
    })
    const data = await res.json()
    if (data.success) {
      setOrders(data.data.orders)
      setSearched(true)
      setNeedCode(false)
      return 'ok'
    }
    if (data.needVerify) return 'need'
    setErrorMsg(data.error || '查询失败')
    return 'err'
  }

  const sendCode = async (addr: string) => {
    if (sending || cooldown > 0) return
    setSending(true)
    setCodeMsg('')
    setErrorMsg('')
    try {
      const res = await fetch('/api/external-orders/lookup/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addr }),
      })
      const data = await res.json()
      if (data.success) {
        setCodeMsg('验证码已发送到该邮箱，请查收（含垃圾箱）；若该邮箱没有订阅记录，邮件里会说明')
        setCooldown(60)
      } else {
        setErrorMsg(data.error || '验证码发送失败')
      }
    } catch {
      setErrorMsg('网络错误，请重试')
    } finally {
      setSending(false)
    }
  }

  const handleSearch = async (e?: React.FormEvent, opts: { autoSend?: boolean } = { autoSend: true }) => {
    e?.preventDefault()
    const addr = email.trim()
    if (!addr) return
    setLoading(true)
    setErrorMsg('')
    setSearched(false)
    try {
      const r = await runLookup(addr)
      if (r === 'need') {
        setNeedCode(true)
        setCode('')
        if (opts.autoSend) await sendCode(addr)
      }
    } catch {
      setErrorMsg('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const addr = email.trim()
    if (!addr || !code.trim()) return
    setVerifying(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/external-orders/lookup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addr, code: code.trim() }),
      })
      const data = await res.json()
      if (!data.success) {
        setErrorMsg(data.error || '验证失败')
        return
      }
      setCodeMsg('')
      saveEmailProof(data.data?.proof)
      const r = await runLookup(addr)
      if (r === 'need') {
        // 验证码已经用掉、服务端也认了，但浏览器没把证明 cookie 带回来（禁用了 Cookie、App 内置浏览器等）
        setErrorMsg('验证已通过，但浏览器没有保存验证状态（可能禁用了 Cookie 或在 App 内置浏览器中打开）。请用系统浏览器打开本页，或登录后在「我的订单」查看')
      }
    } catch {
      setErrorMsg('网络错误，请重试')
    } finally {
      setVerifying(false)
    }
  }

  useEffect(() => {
    const onExpired = () => {
      clearEmailProof()
      setNeedCode(true)
      setCode('')
      setErrorMsg('邮箱验证已过期（30 分钟有效），请重新获取验证码后再操作')
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener(PROOF_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(PROOF_EXPIRED_EVENT, onExpired)
  }, [])

  // URL 自带 email 参数（到期提醒邮件里的链接）时自动查询；需要验证时只展示验证码框，
  // 不自动发信——邮件网关的链接预取不能替用户触发一封验证码邮件
  useEffect(() => {
    if (initialEmail) handleSearch(undefined, { autoSend: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    /* 顶部留白走 .page-top，不再写死 pt-32：它从 globals.css 的 --header-h 推导，
       移动端仍是 112+16=128px（与原来的 pt-32 完全一致），lg 起跟着矮下来的
       头部收到 96+16=112px。以后改头部高度只改 --header-h 一处，不用再追七八个文件 */
    <div className="min-h-screen page-top pb-20 lg:pb-28">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

      {/* 表单型页面：宽度以「够用」为准而不是铺满。896 → xl 放宽到 1024，
          刚好让结果卡里的 md:grid-cols-2 信息行不再挤，再宽就只剩两侧空白了 */}
      <div className="container relative max-w-4xl xl:max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 rounded-full glass mb-6">
            <Sparkles className="w-4 h-4 lg:w-[18px] lg:h-[18px] text-purple-400" />
            <span className="text-sm lg:text-base text-white/80">订单查询</span>
          </div>
          <h1 className="text-headline mb-4">
            <span className="gradient-text">查询你的</span>
            <span className="gradient-text-accent"> 订阅状态</span>
          </h1>
          <p className="text-white/50 text-lg lg:text-xl max-w-xl lg:max-w-2xl mx-auto">
            输入你的 Claude / ChatGPT 账户邮箱，查看订阅类型与到期时间
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          onSubmit={handleSearch}
          className="mb-8 lg:mb-12"
        >
          {/* 单字段表单在桌面端不该被拉满整个容器宽：md 起收到 2xl(672px) 并居中，
              输入框与按钮的比例才合理；手机端仍是整条占满，不受影响 */}
          <div className="relative md:max-w-2xl md:mx-auto">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-2xl blur-md opacity-30" />
            <div className="relative flex items-center gap-2 p-2 lg:p-2.5 glass-strong rounded-2xl">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Mail className="w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    // 换了邮箱：之前那个邮箱的验证码框与结果都不再适用
                    setNeedCode(false)
                    setSearched(false)
                  }}
                  placeholder="输入你的账户邮箱"
                  required
                  className="flex-1 bg-transparent border-0 outline-none text-white placeholder:text-white/30 py-3 lg:text-[15px]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 lg:px-8 lg:py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold flex items-center gap-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                查询
              </button>
            </div>
          </div>
          {errorMsg && <p className="text-red-400 text-sm mt-3 ml-4 md:max-w-2xl md:mx-auto">{errorMsg}</p>}
        </motion.form>

        {needCode && (
          <form onSubmit={handleVerify} className="mb-8 lg:mb-12 md:max-w-2xl md:mx-auto glass rounded-2xl p-5 lg:p-6">
            <p className="text-sm text-white/70 mb-3">
              为保护订阅信息，查询前需要验证邮箱 <span className="font-mono text-white/90 break-all">{email.trim()}</span>。
              验证后 30 分钟内查询、开票、开收据、设置提醒都不用再验证。
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6 位验证码"
                className="flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none text-white placeholder:text-white/30 font-mono tracking-widest"
              />
              <button
                type="button"
                onClick={() => sendCode(email.trim())}
                disabled={sending || cooldown > 0}
                className="px-4 py-2.5 rounded-xl glass text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? '发送中…' : cooldown > 0 ? `${cooldown} 秒后可重发` : '获取验证码'}
              </button>
              <button
                type="submit"
                disabled={verifying || code.length < 6}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? '验证中…' : '验证并查询'}
              </button>
            </div>
            {codeMsg && <p className="text-green-300/90 text-xs mt-3">{codeMsg}</p>}
            <p className="text-white/40 text-xs mt-2">已注册的买家也可以直接登录，在「我的订单」查看。</p>
          </form>
        )}

        <AnimatePresence mode="wait">
          {searched && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* 实时当前时间 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between mb-4 px-2"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-white/40">当前时间</span>
                  <span className="font-mono text-white/80 tabular-nums">{formatFullDateTime(now)}</span>
                  <span className="inline-flex items-center gap-1.5 ml-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    实时
                  </span>
                </div>
                {orders.length > 0 && (
                  <div className="text-sm text-white/60">
                    共 <span className="text-white font-bold">{orders.length}</span> 条
                  </div>
                )}
              </motion.div>

              {orders.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                  <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">未找到订单</h3>
                  <p className="text-white/40 text-sm">
                    该邮箱暂无订单记录。如果你刚刚下单，订单信息将在 24 小时内更新，请稍后再来查询。
                  </p>
                </div>
              ) : (
                <div className="space-y-4 lg:space-y-5">
                  {orders.map((order, i) => {
                    const r = getRemaining(order.expireDate, now)
                    const expiringSoon = !r.expired && r.days <= 7
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className="relative group"
                      >
                        <div
                          className={`absolute -inset-[1px] rounded-2xl blur-md opacity-30 ${
                            r.expired
                              ? 'bg-gradient-to-r from-gray-500 to-gray-700'
                              : expiringSoon
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500'
                          }`}
                        />
                        {/* 桌面端卡片约 1000px 宽，p-6 会让两列信息浮在中间；lg 起加到 p-7 */}
                        <div className="relative glass rounded-2xl p-6 lg:p-7">
                          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-xl lg:text-2xl">{order.subscriptionType}</h3>
                              {r.expired ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/20 border border-gray-500/30 text-gray-300">
                                  已过期
                                </span>
                              ) : expiringSoon ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 border border-amber-500/30 text-amber-300">
                                  <Clock className="w-3 h-3" />
                                  即将到期
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 border border-green-500/30 text-green-300">
                                  <CheckCircle className="w-3 h-3" />
                                  使用中
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-white/40 mb-0.5">剩余</div>
                              {r.expired ? (
                                <div className="text-2xl lg:text-3xl font-bold text-gray-400 tabular-nums">已过期</div>
                              ) : (
                                <div className="flex items-baseline gap-1 tabular-nums">
                                  <span className="text-2xl lg:text-3xl font-bold gradient-text-accent">{r.days}</span>
                                  <span className="text-sm text-white/50">天</span>
                                  <span className="text-lg font-bold text-white/80 ml-1">{String(r.hours).padStart(2, '0')}</span>
                                  <span className="text-xs text-white/40">:</span>
                                  <span className="text-lg font-bold text-white/80">{String(r.minutes).padStart(2, '0')}</span>
                                  <span className="text-xs text-white/40">:</span>
                                  <span className="text-lg font-bold text-white/60">{String(r.seconds).padStart(2, '0')}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 lg:gap-x-10 gap-y-3 lg:gap-y-4 text-sm lg:text-[15px]">
                            <div className="flex items-center gap-2">
                              <span className="text-white/40 w-20">开通时间</span>
                              <span className="text-white/80">{formatDate(order.startDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-white/40 w-20">到期时间</span>
                              <span className={r.expired ? 'text-gray-400' : 'text-white/80'}>{formatDate(order.expireDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-white/40 w-20">账户</span>
                              <span className="font-mono text-white/80 break-all">{order.claudeAccount}</span>
                            </div>
                          </div>

                          {/* 发票 */}
                          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-white/40" />
                              <span className="text-white/40">发票</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  order.invoiceStatus === 'ISSUED'
                                    ? 'bg-green-500/15 text-green-300'
                                    : order.invoiceStatus === 'CANNOT'
                                      ? 'bg-gray-500/15 text-gray-400'
                                      : order.invoiceStatus === 'SUBMITTED'
                                        ? 'bg-cyan-500/15 text-cyan-300'
                                        : 'bg-amber-500/15 text-amber-300'
                                }`}
                              >
                                {INVOICE_LABELS[order.invoiceStatus] || order.invoiceStatus}
                              </span>
                            </div>
                            {order.ownerOnly && (order.invoiceStatus === 'UNAPPLIED' || order.invoiceStatus === 'AWAIT_PAY') && (
                              <a href="/orders" className="px-4 py-1.5 rounded-lg glass text-sm font-medium hover:bg-white/10 transition-colors">
                                {order.invoiceStatus === 'AWAIT_PAY'
                                  ? '本站订单，请登录后在「我的订单」支付税费'
                                  : '本站订单，请登录后在「我的订单」开具'}
                              </a>
                            )}
                            {!order.ownerOnly && order.invoiceStatus === 'UNAPPLIED' && (
                              <button
                                onClick={() => setInvoiceOrder(order)}
                                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
                              >
                                申请发票
                              </button>
                            )}
                            {!order.ownerOnly && order.invoiceStatus === 'AWAIT_PAY' && order.invoiceId && (
                              <PayTaxButton invoiceId={order.invoiceId} accountEmail={order.claudeAccount} />
                            )}
                          </div>

                          {/* 收据 */}
                          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-white/40" />
                              <span className="text-white/40">收据</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  order.receiptToken
                                    ? 'bg-green-500/15 text-green-300'
                                    : order.canReceipt
                                      ? 'bg-white/10 text-white/60'
                                      : 'bg-gray-500/15 text-gray-400'
                                }`}
                              >
                                {order.receiptToken ? '已开具' : order.canReceipt ? '可开具' : '不可开具'}
                              </span>
                            </div>
                            {order.receiptToken ? (
                              <a
                                href={`/receipt/${order.receiptToken}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-1.5 rounded-lg glass text-sm font-medium hover:bg-white/10 transition-colors"
                              >
                                查看收据
                              </a>
                            ) : order.canReceipt && order.ownerOnly ? (
                              <a href="/orders" className="px-4 py-1.5 rounded-lg glass text-sm font-medium hover:bg-white/10 transition-colors">
                                请登录后在「我的订单」开具
                              </a>
                            ) : order.canReceipt ? (
                              <button
                                onClick={() => setReceiptOrder(order)}
                                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-sm font-medium hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all"
                              >
                                申请收据
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {orders.length > 0 && <ReminderSettings account={orders[0].claudeAccount} />}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 lg:mt-16 glass rounded-2xl p-6 lg:p-8 text-center"
        >
          <p className="text-sm text-white/60">
            查询不到订单？联系客服微信 <span className="font-mono text-purple-400">GenuineMarxist</span>
          </p>
        </motion.div>
      </div>

      {invoiceOrder && (
        <InvoiceModal order={invoiceOrder} defaultEmail={email} onClose={() => setInvoiceOrder(null)} />
      )}
      {receiptOrder && <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
    </div>
  )
}

// 到期提醒设置：用户填写邮箱 / 手机，到期前自动收到续费提醒
function ReminderSettings({ account }: { account: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyPhone, setNotifyPhone] = useState(false)
  const [email, setEmail] = useState(account)
  const [phone, setPhone] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFeedback(null)
    ;(async () => {
      try {
        const res = await fetch(`/api/external-orders/contact?email=${encodeURIComponent(account)}`, { headers: emailProofHeaders() })
        const data = await res.json()
        if (!cancelled && needsReverify(res.status, data.error)) signalProofExpired()
        if (!cancelled && data.success) {
          const c = data.data.contact
          setNotifyEmail(c.notifyEmail)
          setNotifyPhone(c.notifyPhone)
          setEmail(c.email || account)
          setPhone(c.phone || '')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [account])

  const handleSave = async () => {
    setFeedback(null)
    if (!notifyEmail && !notifyPhone) {
      setFeedback({ type: 'err', text: '请至少选择一种提醒方式' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/external-orders/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...emailProofHeaders() },
        body: JSON.stringify({
          claudeAccount: account,
          notifyEmail,
          notifyPhone,
          email: email.trim() || account,
          phone: phone.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setFeedback({ type: 'ok', text: '已保存，到期前会自动提醒你续费 🎉' })
      } else {
        if (needsReverify(res.status, data.error)) signalProofExpired()
        setFeedback({ type: 'err', text: data.error || '保存失败' })
      }
    } catch {
      setFeedback({ type: 'err', text: '网络错误，请重试' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mt-8"
    >
      <div className="relative">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/40 to-cyan-500/40 rounded-2xl blur-md opacity-30" />
        <div className="relative glass rounded-2xl p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-2">
            <BellRing className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-lg">设置到期提醒</h3>
          </div>
          <p className="text-white/40 text-sm mb-5">
            订阅到期前 7 天内，我们会通过你选择的方式提醒你续费，避免服务中断。
          </p>

          {loading ? (
            <div className="text-white/40 text-sm py-4">加载中...</div>
          ) : (
            <div className="space-y-4">
              {/* 邮箱提醒 */}
              <div className="rounded-xl border border-white/10 p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-500"
                  />
                  <Mail className="w-4 h-4 text-white/60" />
                  <span className="text-white/90 font-medium">邮箱提醒</span>
                  <span className="text-white/30 text-xs">（推荐）</span>
                </label>
                {notifyEmail && (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="提醒邮箱（默认为你的账户邮箱）"
                    className="mt-3 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50"
                  />
                )}
              </div>

              {/* 短信提醒 */}
              <div className="rounded-xl border border-white/10 p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyPhone}
                    onChange={(e) => setNotifyPhone(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-500"
                  />
                  <Smartphone className="w-4 h-4 text-white/60" />
                  <span className="text-white/90 font-medium">短信提醒</span>
                </label>
                {notifyPhone && (
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    maxLength={11}
                    className="mt-3 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50"
                  />
                )}
              </div>

              {feedback && (
                <p className={`text-sm ${feedback.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                  {feedback.text}
                </p>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                保存提醒设置
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// 待支付税费：直接跳转支付宝
function PayTaxButton({ invoiceId, accountEmail }: { invoiceId: number; accountEmail: string }) {
  const [loading, setLoading] = useState(false)
  const pay = async () => {
    setLoading(true)
    try {
      const channel = typeof window !== 'undefined' && window.innerWidth < 768 ? 'wap' : 'page'
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...emailProofHeaders() },
        // accountEmail 是匿名流程的归属凭证，与「申请发票」用的是同一个
        body: JSON.stringify({ channel, accountEmail }),
      })
      const data = await res.json()
      if (data.success && data.data?.payUrl) {
        window.location.href = data.data.payUrl
      } else {
        if (res.status === 404 || needsReverify(res.status, data.error)) {
          // 服务端对「证明过期 / 无权」与「发票不存在」回同一个 404（防枚举）；在这一页只可能是前者
          signalProofExpired()
        } else {
          alert(data.error || '发起支付失败')
        }
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

// 发票申请弹窗
function InvoiceModal({
  order,
  defaultEmail,
  onClose,
}: {
  order: ExternalOrder
  defaultEmail: string
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [taxNumber, setTaxNumber] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [email, setEmail] = useState(defaultEmail || order.claudeAccount)
  // 必选项：发票中是否展示 ChatGPT/Claude 相关字眼。null = 尚未选择
  const [showAiWording, setShowAiWording] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  /*
   * 已保存的抬头。
   * 【这一页大多数访客是未登录的闲鱼买家】接口会回 401，useSavedTitles 把它当空数组，
   * 于是整块选择器不渲染，页面和改造前一模一样。
   * 只有「登录了、又恰好从邮箱查单进来」的人才会看到快捷选择 —— 多给一点，不少给一点。
   */
  const { titles, loaded: titlesLoaded, authed } = useSavedTitles(true)
  const [titleId, setTitleId] = useState<number | null>(null)
  const [saveTitle, setSaveTitle] = useState(true)
  /** 买家动过任何一个字段后，就不再让迟到的接口结果覆盖他填的内容 */
  const touched = useRef(false)

  const applyTitle = (t: SavedTitle) => {
    setTitleId(t.id)
    setTitle(t.title)
    setTaxNumber(t.taxNumber)
    setAddress(t.address || '')
    setPhone(t.phone || '')
    setBankName(t.bankName || '')
    setBankAccount(t.bankAccount || '')
    setEmail(t.email || defaultEmail || order.claudeAccount)
    setSaveTitle(false)
  }

  const startNewTitle = () => {
    // 标记 touched：这是买家的明确选择，不能再被迟到的「自动带入默认抬头」盖回去
    touched.current = true
    setTitleId(null)
    setTitle('')
    setTaxNumber('')
    setAddress('')
    setPhone('')
    setBankName('')
    setBankAccount('')
    setEmail(defaultEmail || order.claudeAccount)
    setSaveTitle(true)
  }

  // 自动带入默认抬头。
  // 【守的是 touched 而不是「抬头填了没」】买家完全可能先敲税号或邮箱，
  // 这时接口才返回，只看 title 的话会把他已经填好的其它字段整片盖掉。
  useEffect(() => {
    if (!titlesLoaded || titleId !== null || touched.current) return
    const def = titles.find((t) => t.isDefault) || titles[0]
    if (def) applyTitle(def)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titlesLoaded, titles])

  const submit = async () => {
    setErr(null)
    if (!title.trim()) return setErr('请填写发票抬头')
    if (!taxNumber.trim()) return setErr('请填写税号')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr('请填写正确的接收邮箱')
    if (showAiWording === null) return setErr('请选择发票中是否展示 ChatGPT/Claude 相关字眼')
    setSubmitting(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...emailProofHeaders() },
        body: JSON.stringify({
          externalOrderId: order.id,
          title: title.trim(),
          taxNumber: taxNumber.trim(),
          address: address.trim() || null,
          phone: phone.trim() || null,
          bankName: bankName.trim() || null,
          bankAccount: bankAccount.trim() || null,
          email: email.trim(),
          showAiWording,
          titleId,
          // 未登录时服务端会忽略这个字段（存抬头需要身份）
          saveTitle: titleId === null && saveTitle,
          // 归属凭证：证明调用方知道该订单的账户邮箱（匿名邮箱查询流程本就有这个信息）
          accountEmail: order.claudeAccount,
        }),
      })
      const data = await res.json()
      if (data.success && data.data?.payUrl) {
        window.location.href = data.data.payUrl
        return
      }
      // 结账时已经把 6% 跟货款一起付清的订单：服务端直接把发票落成「已提交」，
      // 不会再给收款链接。这是成功，不是失败——别让买家看到一个红色「提交失败」
      if (data.success) {
        alert(data.message || '发票申请已提交，税费已随订单支付，无需再付')
        onClose()
        return
      }
      if (needsReverify(res.status, data.error)) {
        signalProofExpired()
        onClose()
        return
      }
      setErr(data.error || '提交失败')
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * 包一层字段 setter：标记「买家动过表单」，并把「用的是哪条已保存抬头」清掉。
   * 后者很重要 —— 改过内容之后最终开出去的已经不是那条抬头了，
   * 再带着 titleId 提交会让候选里那条被错误地标成「刚用过」。
   */
  const edit = (setter: (v: string) => void, identity = false) => (v: string) => {
    touched.current = true
    // 只有抬头/税号会让它「不再是那条已保存抬头」。改地址电话仍是同一个抬头，
    // 清掉 titleId 只会让这条常用抬头的「最近使用时间」刷不上、在候选里一路下沉
    if (identity) setTitleId(null)
    setter(v)
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
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

        {/* 订单信息 + 金额 */}
        <div className="glass rounded-2xl p-4 mb-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-white/40">订阅</span>
            <span className="text-white/80 font-medium">{order.subscriptionType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">账户</span>
            <span className="text-white/70 font-mono text-xs break-all">{order.claudeAccount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">开通 / 到期</span>
            <span className="text-white/70">{formatDate(order.startDate)} ~ {formatDate(order.expireDate)}</span>
          </div>
          <div className="h-px bg-white/10 my-1" />
          <div className="flex justify-between">
            <span className="text-white/40">售价</span>
            <span className="text-white/80">¥{order.sellingPrice?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">开票金额（含税）</span>
            <span className="text-white/90 font-semibold">¥{order.invoiceAmount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-300/80">需支付税费（6%）</span>
            <span className="text-amber-300 font-bold">¥{order.taxFee?.toFixed(2)}</span>
          </div>
        </div>

        {/* 抬头信息 */}
        {/* 已保存抬头：点一下整份填入。未登录时 titles 为空，整块不渲染 */}
        <InvoiceTitlePicker titles={titles} selectedId={titleId} onPick={applyTitle} onNew={startNewTitle} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            {field('抬头', title, edit(setTitle, true), { required: true, placeholder: '公司名称 / 个人' })}
          </div>
          <div className="sm:col-span-2">
            {field('税号', taxNumber, edit(setTaxNumber, true), { required: true, placeholder: '纳税人识别号（带空格会自动去掉）' })}
          </div>
          {field('地址', address, edit(setAddress), { placeholder: '选填' })}
          {field('电话', phone, edit(setPhone), { placeholder: '选填' })}
          {field('开户行', bankName, edit(setBankName), { placeholder: '选填' })}
          {field('卡号', bankAccount, edit(setBankAccount), { placeholder: '选填' })}
          <div className="sm:col-span-2">{field('接收邮箱', email, edit(setEmail), { required: true, type: 'email', placeholder: '发票将发送到此邮箱' })}</div>

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

        {/* 【按真实登录态判断，不是按「有没有存过抬头」】已登录但一条都没存的人
            才是最需要这个开关的 —— 用 titles.length 当替身会让他们永远存不上第一条 */}
        {authed && titleId === null && (
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
            保存这个抬头，下次开票一键填入
          </button>
        )}
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
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : null}
          提交发票并支付税费 ¥{order.taxFee?.toFixed(2)}
        </button>
        <p className="text-xs text-white/30 text-center mt-2">提交后将跳转支付宝支付 6% 税费，支付完成即提交开票</p>
      </motion.div>
    </div>
  )
}

// 收据申请弹窗（仅填抬头，提交后生成并跳转收据页）
function ReceiptModal({ order, onClose }: { order: ExternalOrder; onClose: () => void }) {
  const [payerTitle, setPayerTitle] = useState('')
  // 必选项：收据中是否展示 ChatGPT/Claude 相关字眼（与发票同一口径）。
  // null = 尚未选择 —— 收据只能开一次、开完改不了，不能替买家默认成任何一边
  const [showAiWording, setShowAiWording] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    setErr(null)
    if (!payerTitle.trim()) return setErr('请填写付款人抬头')
    if (showAiWording === null) return setErr('请选择收据中是否展示 ChatGPT/Claude 相关字眼')
    setSubmitting(true)
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...emailProofHeaders() },
        body: JSON.stringify({
          externalOrderId: order.id,
          payerTitle: payerTitle.trim(),
          // 归属凭证：证明调用方知道该订单的账户邮箱
          accountEmail: order.claudeAccount,
          showAiWording,
        }),
      })
      const data = await res.json()
      if (data.success && data.data?.token) {
        window.open(`/receipt/${data.data.token}`, '_blank')
        onClose()
        return
      }
      if (needsReverify(res.status, data.error)) {
        signalProofExpired()
        onClose()
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        // 加了「是否展示字眼」一项后卡片变高，矮屏（375×667）上要能自己滚，否则按钮落到屏幕外
        className="relative w-full max-w-md glass-strong rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
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
          <div className="flex justify-between"><span className="text-white/40">订阅</span><span className="text-white/80">{order.subscriptionType}</span></div>
          <div className="flex justify-between"><span className="text-white/40">账户</span><span className="text-white/70 font-mono text-xs break-all">{order.claudeAccount}</span></div>
          <div className="flex justify-between"><span className="text-white/40">开通 / 到期</span><span className="text-white/70">{formatDate(order.startDate)} ~ {formatDate(order.expireDate)}</span></div>
          {order.receiptAmount != null && order.sellingPrice != null && order.receiptAmount > order.sellingPrice && (
            <>
              <div className="flex justify-between"><span className="text-white/40">售价</span><span className="text-white/70">¥{order.sellingPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-white/40">已付发票税费（6%）</span><span className="text-white/70">¥{(order.receiptAmount - order.sellingPrice).toFixed(2)}</span></div>
            </>
          )}
          <div className="flex justify-between"><span className="text-white/40">付款金额</span><span className="text-white/90 font-bold">¥{(order.receiptAmount ?? order.sellingPrice)?.toFixed(2)}</span></div>
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

        {/* 必选：收据「项目」一栏是否展示 AI 平台字眼。说明里直接写出会印成什么，免得买家猜 */}
        <div className="mt-4">
          <label className="block text-xs text-white/50 mb-1.5">
            收据中是否展示 ChatGPT/Claude 相关字眼<span className="text-red-400 ml-0.5">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: true, label: '展示', desc: `项目印「${order.subscriptionType} 会员订阅」` },
              { v: false, label: '不展示', desc: '项目只印「技术咨询服务」' },
            ].map((opt) => (
              <button
                key={String(opt.v)}
                type="button"
                onClick={() => setShowAiWording(opt.v)}
                className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  showAiWording === opt.v
                    ? 'border-cyan-500/60 bg-cyan-500/15'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="text-sm font-medium text-white/90">{opt.label}</div>
                <div className="text-[11px] text-white/40 mt-0.5 break-all">{opt.desc}</div>
              </button>
            ))}
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
