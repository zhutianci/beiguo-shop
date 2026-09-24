'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Wallet, Loader2, Gift, MessageCircle, Info } from 'lucide-react'
import { ContactModal } from '@/components/contact-modal'

/**
 * 账户余额（此前个人中心的「账户余额」入口一直是 404）。
 *
 * 【文案只写代码做得到的】余额唯一的来源是推荐返现（外加管理员手工调整）；
 * 全站没有「余额付款」也没有「自助提现」—— 提现是客服核实后线下打款，
 * 再由管理员在后台记一笔扣减（api/admin/referrals/balance）。页面上不出现「充值」「余额支付」等字样。
 */

interface LogItem {
  id: number
  type: string
  typeLabel: string
  delta: number
  balanceAfter: number
  note: string | null
  createdAt: string
  order: { orderNoMasked: string; productName: string } | null
}

interface WalletData {
  balance: number
  totals: { income: number; withdrawn: number }
  pendingReward: number
}

const PAGE_SIZE = 20

const TYPE_CLS: Record<string, string> = {
  REFERRAL: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300',
  ADJUST: 'border-sky-400/25 bg-sky-500/10 text-sky-300',
  WITHDRAW: 'border-rose-400/25 bg-rose-500/10 text-rose-300',
}

const money = (n: number) => `¥${n.toFixed(2)}`

function fmtTime(s: string) {
  return new Date(s).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null)
  const [logs, setLogs] = useState<LogItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  // 「还有没有下一页」看服务端的 totalPages，不看「已显示条数 < total」：翻页之间有新记录插到最前面时，
  // 下一页会带回一条已经显示过的（去重后丢掉），已显示条数永远追不上 total，按钮就再也不消失
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [failed, setFailed] = useState(false)
  const [needLogin, setNeedLogin] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const busy = useRef(false)

  const load = useCallback(async (targetPage: number, append: boolean) => {
    if (busy.current) return
    busy.current = true
    if (append) setLoadingMore(true)
    else setLoading(true)
    setFailed(false)
    try {
      const res = await fetch(`/api/account/wallet?page=${targetPage}&pageSize=${PAGE_SIZE}`)
      if (res.status === 401) {
        setNeedLogin(true)
        return
      }
      const d = await res.json()
      if (!d.success) {
        setFailed(true)
        return
      }
      setData({ balance: d.data.balance, totals: d.data.totals, pendingReward: d.data.pendingReward })
      const incoming = d.data.logs as LogItem[]
      setLogs((prev) => {
        if (!append) return incoming
        // 翻页期间有新流水写入会把上一页最后一条挤到下一页，按 id 去重
        const seen = new Set(prev.map((l) => l.id))
        return prev.concat(incoming.filter((l) => !seen.has(l.id)))
      })
      setPage(d.data.page)
      setTotal(d.data.total)
      setTotalPages(Math.max(1, Number(d.data.totalPages) || 1))
    } catch {
      setFailed(true)
    } finally {
      busy.current = false
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    load(1, false)
  }, [load])

  return (
    <div className="min-h-screen page-top pb-20">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none fixed left-1/4 top-24 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[128px]" />

      <div className="container relative max-w-2xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white/80"
        >
          <ArrowLeft className="h-4 w-4" />
          个人中心
        </Link>

        <header className="mb-6 mt-5">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Wallet className="h-6 w-6 text-cyan-300" />
            账户余额
          </h1>
        </header>

        {loading ? (
          <div className="flex justify-center py-16 text-white/30">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : needLogin ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
            <p className="text-sm text-white/45">登录后查看你的账户余额</p>
            <Link
              href="/login?redirect=/wallet"
              className="mt-4 inline-block rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 text-sm font-medium"
            >
              去登录
            </Link>
          </div>
        ) : !data ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
            <p className="text-sm text-white/45">加载失败</p>
            <button
              onClick={() => load(1, false)}
              className="mt-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm text-white/70 hover:bg-white/10"
            >
              重试
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 余额主卡 */}
            <section className="relative">
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-30 blur-md" />
              <div className="glass relative rounded-3xl p-6 sm:p-8">
                <div className="text-sm text-white/50">可用余额</div>
                <div className="mt-1 break-all text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
                  <span className="gradient-text-accent">{money(data.balance)}</span>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 sm:gap-4">
                  <div className="min-w-0">
                    <div className="text-xs text-white/45">累计入账</div>
                    <div className="mt-1 truncate text-base font-semibold tabular-nums text-white/85 sm:text-lg">
                      {money(data.totals.income)}
                    </div>
                  </div>
                  <div className="min-w-0 border-x border-white/10 px-2 sm:px-4">
                    <div className="text-xs text-white/45">已提现 / 扣减</div>
                    <div className="mt-1 truncate text-base font-semibold tabular-nums text-white/85 sm:text-lg">
                      {money(data.totals.withdrawn)}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-white/45">待结算返现</div>
                    <div className="mt-1 truncate text-base font-semibold tabular-nums text-amber-300 sm:text-lg">
                      {money(data.pendingReward)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/profile/referral"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-sm font-medium"
                  >
                    <Gift className="h-4 w-4" />
                    去推荐赚返现
                  </Link>
                  <button
                    onClick={() => setContactOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm text-white/80 transition-colors hover:bg-white/10"
                  >
                    <MessageCircle className="h-4 w-4" />
                    联系客服提现
                  </button>
                </div>
              </div>
            </section>

            {/* 余额说明 */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/85">
                <Info className="h-4 w-4 text-cyan-300" />
                余额说明
              </h2>
              <ul className="space-y-1.5 text-[13px] leading-relaxed text-white/50">
                <li>· 余额来自推荐返现：好友通过你的推广链接下单，订单完成后返现自动入账。</li>
                <li>· 余额暂不能直接用于支付订单。</li>
                <li>· 提现请联系客服，核实后线下打款，并在此记录一笔扣减。</li>
                <li>· 「待结算返现」是好友已付款、订单尚未完成的返现，订单完成后自动转入余额，不计入上方可用余额。</li>
              </ul>
            </section>

            {/* 余额明细 */}
            <section>
              <h2 className="mb-4 text-xl font-bold">余额明细</h2>

              {logs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-14 text-center">
                  <p className="text-sm text-white/45">还没有余额变动</p>
                  <p className="mt-1 text-xs text-white/30">推荐返现到账后会出现在这里</p>
                </div>
              ) : (
                <>
                  <ul className="space-y-3">
                    {logs.map((l) => {
                      const plus = l.delta >= 0
                      return (
                        <li key={l.id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 sm:px-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span
                                className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${
                                  TYPE_CLS[l.type] || 'border-white/10 bg-white/[0.04] text-white/60'
                                }`}
                              >
                                {l.typeLabel}
                              </span>
                              <div className="mt-2 text-xs text-white/35">{fmtTime(l.createdAt)}</div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div
                                className={`text-lg font-semibold tabular-nums ${plus ? 'text-emerald-300' : 'text-rose-300'}`}
                              >
                                {plus ? '+' : '−'}
                                {money(Math.abs(l.delta))}
                              </div>
                              <div className="text-xs tabular-nums text-white/35">余额 {money(l.balanceAfter)}</div>
                            </div>
                          </div>
                          {l.order ? (
                            <p className="mt-2 break-words text-[13px] text-white/55">
                              {l.order.productName}
                              <span className="text-white/35">
                                {' · 订单 '}
                                <span className="font-mono">{l.order.orderNoMasked}</span>
                              </span>
                            </p>
                          ) : (
                            l.note && <p className="mt-2 break-words text-[13px] text-white/55">{l.note}</p>
                          )}
                        </li>
                      )
                    })}
                  </ul>

                  {page < totalPages ? (
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <button
                        onClick={() => load(page + 1, true)}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-2.5 text-sm text-white/70 hover:bg-white/10 disabled:opacity-40"
                      >
                        {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                        {loadingMore ? '加载中...' : '加载更多'}
                      </button>
                      <span className="text-xs text-white/30">
                        {failed ? '加载失败，请重试' : `已显示 ${logs.length} / ${total} 条`}
                      </span>
                    </div>
                  ) : (
                    total > PAGE_SIZE && <p className="mt-4 text-center text-xs text-white/30">已显示全部 {total} 条</p>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}
