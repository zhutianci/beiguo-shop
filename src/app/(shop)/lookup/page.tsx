'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Mail, Sparkles, Package, CheckCircle, Clock } from 'lucide-react'

interface ExternalOrder {
  id: number
  startDate: string
  expireDate: string
  subscriptionType: string
  xianyuNickname: string | null
  claudeAccount: string
  createdAt: string
  updatedAt: string
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function daysUntil(s: string): number {
  const now = new Date()
  const target = new Date(s)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
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
          className="mb-10"
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
              {orders.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                  <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">未找到订单</h3>
                  <p className="text-white/40 text-sm">
                    该邮箱暂无订单记录。如果你刚刚下单，订单信息将在 24 小时内更新，请稍后再来查询。
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-white/60">
                    找到 <span className="text-white font-bold">{orders.length}</span> 条订阅记录
                  </div>
                  <div className="space-y-4">
                    {orders.map((order, i) => {
                      const days = daysUntil(order.expireDate)
                      const expired = days < 0
                      const expiringSoon = days >= 0 && days <= 7
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
                              expired
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
                                {expired ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/20 border border-gray-500/30 text-gray-300">
                                    已过期
                                  </span>
                                ) : expiringSoon ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 border border-amber-500/30 text-amber-300">
                                    <Clock className="w-3 h-3" />
                                    {days} 天后到期
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 border border-green-500/30 text-green-300">
                                    <CheckCircle className="w-3 h-3" />
                                    使用中
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-white/40">剩余</div>
                                <div className={`text-2xl font-bold ${expired ? 'text-gray-400' : 'gradient-text-accent'}`}>
                                  {expired ? '0 天' : `${days} 天`}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-white/40 w-20">开通时间</span>
                                <span className="text-white/80">{formatDate(order.startDate)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-white/40 w-20">到期时间</span>
                                <span className={expired ? 'text-gray-400' : 'text-white/80'}>{formatDate(order.expireDate)}</span>
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
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </>
              )}
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
    </div>
  )
}
