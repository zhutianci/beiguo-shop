'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Mail, Sparkles, Package, CheckCircle, Clock, Calendar, BellRing, Smartphone, Save, FileText, X, AlertCircle } from 'lucide-react'

interface ExternalOrder {
  id: number
  startDate: string
  expireDate: string
  subscriptionType: string
  xianyuNickname: string | null
  claudeAccount: string
  createdAt: string
  updatedAt: string
  canInvoice: boolean
  sellingPrice: number | null
  invoiceAmount: number | null
  taxFee: number | null
  invoiceStatus: string // UNAPPLIED | AWAIT_PAY | SUBMITTED | ISSUED | CANNOT
  invoiceId: number | null
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
    <Suspense fallback={<div className="min-h-screen pt-32 text-center text-white/40">加载中...</div>}>
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

  // 实时刷新当前时间
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/external-orders/lookup?email=${encodeURIComponent(email.trim())}`)
      const data = await res.json()
      if (data.success) {
        setOrders(data.data.orders)
        setSearched(true)
      } else {
        setErrorMsg(data.error || '查询失败')
      }
    } catch {
      setErrorMsg('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 如果 URL 自带 email 参数，自动查询
  useEffect(() => {
    if (initialEmail) handleSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container relative max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/80">订单查询</span>
          </div>
          <h1 className="text-headline mb-4">
            <span className="gradient-text">查询你的</span>
            <span className="gradient-text-accent"> 订阅状态</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            输入你的 Claude / ChatGPT 账户邮箱，查看订阅类型与到期时间
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          onSubmit={handleSearch}
          className="mb-8"
        >
          <div className="relative">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-2xl blur-md opacity-30" />
            <div className="relative flex items-center gap-2 p-2 glass-strong rounded-2xl">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Mail className="w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="输入你的账户邮箱"
                  required
                  className="flex-1 bg-transparent border-0 outline-none text-white placeholder:text-white/30 py-3"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold flex items-center gap-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          {errorMsg && <p className="text-red-400 text-sm mt-3 ml-4">{errorMsg}</p>}
        </motion.form>

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
                <div className="space-y-4">
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
                        <div className="relative glass rounded-2xl p-6">
                          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-xl">{order.subscriptionType}</h3>
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
                                <div className="text-2xl font-bold text-gray-400 tabular-nums">已过期</div>
                              ) : (
                                <div className="flex items-baseline gap-1 tabular-nums">
                                  <span className="text-2xl font-bold gradient-text-accent">{r.days}</span>
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

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
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
                            {order.xianyuNickname && (
                              <div className="flex items-center gap-2">
                                <span className="text-white/40 w-20">闲鱼昵称</span>
                                <span className="text-white/80">{order.xianyuNickname}</span>
                              </div>
                            )}
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
                            {order.invoiceStatus === 'UNAPPLIED' && (
                              <button
                                onClick={() => setInvoiceOrder(order)}
                                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
                              >
                                申请发票
                              </button>
                            )}
                            {order.invoiceStatus === 'AWAIT_PAY' && order.invoiceId && (
                              <PayTaxButton invoiceId={order.invoiceId} />
                            )}
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
          className="mt-12 glass rounded-2xl p-6 text-center"
        >
          <p className="text-sm text-white/60">
            查询不到订单？联系客服微信 <span className="font-mono text-purple-400">GenuineMarxist</span>
          </p>
        </motion.div>
      </div>

      {invoiceOrder && (
        <InvoiceModal order={invoiceOrder} defaultEmail={email} onClose={() => setInvoiceOrder(null)} />
      )}
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
        const res = await fetch(`/api/external-orders/contact?email=${encodeURIComponent(account)}`)
        const data = await res.json()
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
        headers: { 'Content-Type': 'application/json' },
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
        <div className="relative glass rounded-2xl p-6">
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
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    setErr(null)
    if (!title.trim()) return setErr('请填写发票抬头')
    if (!taxNumber.trim()) return setErr('请填写税号')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr('请填写正确的接收邮箱')
    setSubmitting(true)
    try {
      const channel = typeof window !== 'undefined' && window.innerWidth < 768 ? 'wap' : 'page'
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalOrderId: order.id,
          title: title.trim(),
          taxNumber: taxNumber.trim(),
          address: address.trim() || null,
          phone: phone.trim() || null,
          bankName: bankName.trim() || null,
          bankAccount: bankAccount.trim() || null,
          email: email.trim(),
          channel,
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
