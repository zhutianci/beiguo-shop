'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Wallet, Loader2, Gift, MessageCircle, Info, PlusCircle, MessageSquareText, ChevronDown, ChevronRight, BellRing } from 'lucide-react'
import { ContactModal } from '@/components/contact-modal'

/**
 * 账户余额（docs/短信接码-设计.md §1.15，B0 起按两格重做；结构沿用：主卡 + 说明 + 明细 + 加载更多）。
 *
 * 【一个余额分两格】充值余额（不可提现）+ 返现余额（可提现）；「可用余额」= 两格之和，预扣中的钱不在里面、单独一行。
 * 【文案只写代码做得到的】（交接文档 1816）「余额能付接码」「可抵扣」这类说法、[去接码] 按钮由服务端的
 * canUseForJiema 决定（B0 时为 false：保留旧口径「余额暂不能直接用于支付订单」）；[充值] 按钮只在充值对本人开放时出现；
 * 「暂不支持开票」一行只在充值开放或 canUseForJiema 时出现（免得说一件还不存在的事）。
 * 【备注不回显】流水只显示类型、金额、两格拆分与「服务 · 国家 · 打码单号」/「余额充值 · 打码单号」。
 */

interface LogRef {
  kind: 'SMS' | 'TOPUP' | 'REFERRAL'
  orderNoMasked: string
  title: string
}
interface LogItem {
  id: number
  type: string
  typeLabel: string
  deltaCents: number
  topupDeltaCents: number
  cashDeltaCents: number
  afterCents: number
  createdAt: string
  ref: LogRef | null
}
interface HoldItem {
  orderNo: string
  cents: number
  heldAt: string
  href: string
}
interface WalletData {
  balanceCents: number
  topupCents: number
  cashCents: number
  holdingCents: number
  holds: HoldItem[]
  totals: { topupIn: number; spent: number; refunded: number; referral: number; withdrawn: number }
  canUseForJiema: boolean
  topupOpen: boolean
  showInvoiceNotice: boolean
  recentLateCredits: { cents: number; at: string; ref: LogRef | null }[]
  pendingRewardCents: number
}

type Cat = 'all' | 'topup' | 'spend' | 'back' | 'referral' | 'withdraw'
const CATS: { id: Cat; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'topup', label: '充值' },
  { id: 'spend', label: '消费' },
  { id: 'back', label: '退回' },
  { id: 'referral', label: '返现' },
  { id: 'withdraw', label: '提现/调整' },
]

const PAGE_SIZE = 20

const TYPE_CLS: Record<string, string> = {
  REFERRAL: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300',
  TOPUP: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-300',
  REFUND: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-300',
  LATEPAY: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-300',
  RELEASE: 'border-white/15 bg-white/[0.06] text-white/70',
  HOLD: 'border-violet-400/25 bg-violet-500/10 text-violet-300',
  ADJUST: 'border-sky-400/25 bg-sky-500/10 text-sky-300',
  WITHDRAW: 'border-rose-400/25 bg-rose-500/10 text-rose-300',
  TOPUP_REFUND: 'border-rose-400/25 bg-rose-500/10 text-rose-300',
  CLAWBACK: 'border-rose-400/25 bg-rose-500/10 text-rose-300',
}

/** 整数分 → ¥x.xx（不经过浮点乘法） */
function yuan(cents: number): string {
  const a = Math.abs(cents)
  return `${cents < 0 ? '-' : ''}¥${Math.floor(a / 100)}.${String(a % 100).padStart(2, '0')}`
}

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
  const [cat, setCat] = useState<Cat>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  // 「还有没有下一页」看服务端的 totalPages，不看「已显示条数 < total」：翻页之间有新记录插到最前面时，
  // 下一页会带回一条已经显示过的（去重后丢掉），已显示条数永远追不上 total，按钮就再也不消失
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [failed, setFailed] = useState(false)
  const [needLogin, setNeedLogin] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [holdsOpen, setHoldsOpen] = useState(false)
  // 快速切换分类时只认最后一次请求
  const seq = useRef(0)

  const load = useCallback(async (c: Cat, targetPage: number, append: boolean, first = false) => {
    const my = ++seq.current
    if (append) setLoadingMore(true)
    else if (first) setLoading(true)
    else setListLoading(true)
    setFailed(false)
    try {
      const res = await fetch(`/api/account/wallet?page=${targetPage}&pageSize=${PAGE_SIZE}&cat=${c}`, { cache: 'no-store' })
      if (my !== seq.current) return
      if (res.status === 401) {
        setNeedLogin(true)
        return
      }
      const d = await res.json()
      if (my !== seq.current) return
      if (!d.success) {
        setFailed(true)
        return
      }
      setData(d.data as WalletData)
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
      if (my === seq.current) setFailed(true)
    } finally {
      if (my === seq.current) {
        setLoading(false)
        setListLoading(false)
        setLoadingMore(false)
      }
    }
  }, [])

  useEffect(() => {
    load('all', 1, false, true)
  }, [load])

  const pickCat = (c: Cat) => {
    if (c === cat) return
    setCat(c)
    setLogs([])
    load(c, 1, false)
  }

  const jiema = !!data?.canUseForJiema

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
              onClick={() => load(cat, 1, false, true)}
              className="mt-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm text-white/70 hover:bg-white/10"
            >
              重试
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 关单后才到账、已退回余额的付款（近 7 天，D41） */}
            {data.recentLateCredits.map((c, i) => (
              <div key={i} className="flex items-start gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-[13px] leading-relaxed text-cyan-100/90">
                <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <span>
                  {c.ref ? `${c.ref.kind === 'TOPUP' ? '充值单' : '订单'} ${c.ref.orderNoMasked} ` : ''}
                  关闭后收到一笔 {yuan(c.cents)} 付款，已退回你的余额（{fmtTime(c.at)}）
                </span>
              </div>
            ))}

            {/* 余额主卡 */}
            <section className="relative">
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-30 blur-md" />
              <div className="glass relative rounded-3xl p-6 sm:p-8">
                <div className="text-sm text-white/50">可用余额</div>
                <div className="mt-1 break-all text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
                  <span className="gradient-text-accent">{yuan(data.balanceCents)}</span>
                </div>
                <div className="mt-3 space-y-1 text-[13px] text-white/60">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span>充值余额</span>
                    <span className="font-semibold tabular-nums text-white/85">{yuan(data.topupCents)}</span>
                    <span className="text-white/40">· {jiema ? '可抵扣，' : ''}不可提现</span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span>返现余额</span>
                    <span className="font-semibold tabular-nums text-white/85">{yuan(data.cashCents)}</span>
                    <span className="text-white/40">· {jiema ? '可抵扣，' : ''}可提现</span>
                  </div>
                  {data.holdingCents > 0 && (
                    <div>
                      <button
                        onClick={() => setHoldsOpen((v) => !v)}
                        className="inline-flex flex-wrap items-center gap-x-1 text-left text-amber-200/90 hover:text-amber-100"
                      >
                        预扣中 {yuan(data.holdingCents)} · {data.holds.length} 笔接码订单等待支付宝付款，超时自动退回
                        {holdsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                      {holdsOpen && (
                        <ul className="mt-1.5 space-y-1 pl-2">
                          {data.holds.map((h) => (
                            <li key={h.orderNo}>
                              <Link href={h.href} className="text-xs text-white/60 underline-offset-2 hover:text-white/85 hover:underline">
                                订单 <span className="font-mono">{h.orderNo}</span> · {yuan(h.cents)} · {fmtTime(h.heldAt)} →
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-x-2 gap-y-4 border-t border-white/10 pt-5 sm:grid-cols-4 sm:gap-4">
                  {[
                    { label: '累计充值', v: data.totals.topupIn },
                    { label: '累计消费', v: data.totals.spent },
                    { label: '累计退回', v: data.totals.refunded },
                    { label: '已提现', v: data.totals.withdrawn },
                  ].map((x) => (
                    <div key={x.label} className="min-w-0">
                      <div className="text-xs text-white/45">{x.label}</div>
                      <div className="mt-1 truncate text-base font-semibold tabular-nums text-white/85 sm:text-lg">{yuan(x.v)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
                  <span>
                    累计返现 <span className="tabular-nums text-white/70">{yuan(data.totals.referral)}</span>
                  </span>
                  <span>
                    待结算返现 <span className="tabular-nums text-amber-300">{yuan(data.pendingRewardCents)}</span>
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                  {data.topupOpen && (
                    <Link
                      href="/wallet/topup"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-3 text-sm sm:px-5 font-medium"
                    >
                      <PlusCircle className="h-4 w-4" />
                      充值
                    </Link>
                  )}
                  {jiema && (
                    <Link
                      href="/jiema"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.06] px-3 py-3 text-sm sm:px-5 text-white/80 transition-colors hover:bg-white/10"
                    >
                      <MessageSquareText className="h-4 w-4" />
                      去接码
                    </Link>
                  )}
                  <button
                    onClick={() => setContactOpen(true)}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.06] px-3 py-3 text-sm sm:px-5 text-white/80 transition-colors hover:bg-white/10"
                  >
                    <MessageCircle className="h-4 w-4" />
                    联系客服提现
                  </button>
                  <Link
                    href="/profile/referral"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-3 text-sm sm:px-5 font-medium"
                  >
                    <Gift className="h-4 w-4" />
                    推荐赚返现
                  </Link>
                </div>
              </div>
            </section>

            {/* 余额说明：每一句都能在代码里找到出处（交接文档 1816） */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/85">
                <Info className="h-4 w-4 text-cyan-300" />
                余额说明
              </h2>
              <ul className="space-y-1.5 text-[13px] leading-relaxed text-white/50">
                {jiema ? (
                  <>
                    <li>· 余额目前可用于支付「短信接码」订单：下单时选「余额抵扣」，不够的部分用支付宝补齐。</li>
                    <li>· 抵扣时先用充值余额，再用返现余额。</li>
                    <li>· 接码没收到短信（号码到期或你取消）时，整单退回余额：余额抵扣的部分回到原来的那一格，支付宝付的部分进充值余额。</li>
                  </>
                ) : (
                  <li>· 余额暂不能直接用于支付订单。</li>
                )}
                <li>· 返现余额来自推荐返现：好友通过你的推广链接下单，订单完成后自动入账。</li>
                {(jiema || data.topupOpen) && <li>· 订单关闭后才到账的付款，会按实收退回充值余额。</li>}
                <li>· 充值余额不能提现、不退回支付宝；返现余额可以联系客服提现，核实后线下打款。</li>
                <li>· 「待结算返现」是好友已付款、订单尚未完成的返现，完成后自动转入返现余额，不计入上方可用余额。</li>
                {data.showInvoiceNotice && (
                  <li>
                    · 余额充值与短信接码订单暂不支持开票，可
                    <button onClick={() => setContactOpen(true)} className="text-cyan-300/90 underline-offset-2 hover:underline">
                      联系客服
                    </button>
                    开票处理。
                  </li>
                )}
              </ul>
            </section>

            {/* 余额明细 */}
            <section>
              <h2 className="mb-3 text-xl font-bold">余额明细</h2>
              <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
                {CATS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => pickCat(c.id)}
                    className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                      cat === c.id ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200' : 'border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/10'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {listLoading ? (
                <div className="flex justify-center py-12 text-white/30">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-14 text-center">
                  <p className="text-sm text-white/45">{failed ? '加载失败，请重试' : cat === 'all' ? '还没有余额变动' : '这一类暂时没有记录'}</p>
                  {cat === 'all' && !failed && <p className="mt-1 text-xs text-white/30">推荐返现到账后会出现在这里</p>}
                </div>
              ) : (
                <>
                  <ul className="space-y-3">
                    {logs.map((l) => {
                      const plus = l.deltaCents >= 0
                      const both = l.topupDeltaCents !== 0 && l.cashDeltaCents !== 0
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
                              <div className={`text-lg font-semibold tabular-nums ${plus ? 'text-emerald-300' : 'text-rose-300'}`}>
                                {plus ? '+' : '−'}
                                {yuan(Math.abs(l.deltaCents))}
                              </div>
                              <div className="text-xs tabular-nums text-white/35">余额 {yuan(l.afterCents)}</div>
                            </div>
                          </div>
                          {l.ref && (
                            <p className="mt-2 break-words text-[13px] text-white/55">
                              {l.ref.title}
                              <span className="text-white/35">
                                {' · 订单 '}
                                <span className="font-mono">{l.ref.orderNoMasked}</span>
                              </span>
                            </p>
                          )}
                          <p className="mt-1.5 text-[11px] text-white/35">
                            {both
                              ? `充值余额 ${l.topupDeltaCents > 0 ? '+' : '−'}${yuan(Math.abs(l.topupDeltaCents))} · 返现余额 ${
                                  l.cashDeltaCents > 0 ? '+' : '−'
                                }${yuan(Math.abs(l.cashDeltaCents))}`
                              : l.topupDeltaCents !== 0
                                ? '充值余额'
                                : l.cashDeltaCents !== 0
                                  ? '返现余额'
                                  : ''}
                          </p>
                        </li>
                      )
                    })}
                  </ul>

                  {page < totalPages ? (
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <button
                        onClick={() => load(cat, page + 1, true)}
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
