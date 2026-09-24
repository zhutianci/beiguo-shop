'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Gift, Loader2, Share2, ShoppingBag, Coins, Wallet, Info } from 'lucide-react'
import ReferralPanel from '@/components/referral-panel'

/**
 * 推荐有奖（原个人中心里的「我的内推」块，2026-09-24 独立成页）。
 *
 * 【玩法说明必须与代码一致】下面每一句都能在代码里找到出处：
 *   · 专属价默认 = 网站售价、可按商品单独设、不能低于基础价 —— api/account/referral POST、api/orders 内推分支
 *   · 返现 =（专属价 − 基础价）× 数量，下单时就锁定在 Order.referralReward —— api/orders
 *   · 订单「已完成」(DELIVERED) 才结算进余额 —— lib/referral.ts settleReferral
 *   · 内推单不能用券 —— lib/coupon.ts quoteOrder 第一行就短路（交接文档 十八）
 *   · 推广码存在好友浏览器 localStorage、之后下单也带上 —— lib/ref.ts
 *   · 余额不能付款、提现走客服线下 —— 全站没有余额支付与自助提现接口
 * 改了上述任何一处逻辑，这里的文案要跟着改。
 */

type Filter = 'all' | 'pending' | 'settled' | 'inactive'
type OrderStatus = 'UNPAID' | 'PAID' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'

interface ReferralOrder {
  key: string
  orderNoMasked: string
  productName: string
  quantity: number
  amount: number
  status: OrderStatus
  buyer: string
  createdAt: string
  paidAt: string | null
  reward: number | null
  rewardState: 'SETTLED' | 'PENDING' | 'NONE'
}

interface Summary {
  orderCount: number
  paidCount: number
  settledReward: number
  settledCount: number
  pendingReward: number
  pendingCount: number
}

const PAGE_SIZE = 10

const FILTER_TABS: { id: Filter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'pending', label: '待结算' },
  { id: 'settled', label: '已到账' },
  { id: 'inactive', label: '未付款或已取消' },
]

const STATUS_META: Record<OrderStatus, { text: string; cls: string }> = {
  UNPAID: { text: '待付款', cls: 'border-yellow-400/25 bg-yellow-500/10 text-yellow-300' },
  PAID: { text: '已付款', cls: 'border-sky-400/25 bg-sky-500/10 text-sky-300' },
  DELIVERED: { text: '已完成', cls: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300' },
  CANCELLED: { text: '已取消', cls: 'border-white/10 bg-white/[0.04] text-white/40' },
  REFUNDED: { text: '已退款', cls: 'border-white/10 bg-white/[0.04] text-white/40' },
}

const EMPTY_TEXT: Record<Filter, string> = {
  all: '还没有人通过你的链接下单',
  pending: '没有待结算的返现',
  settled: '还没有到账的返现',
  inactive: '没有未付款或已取消的订单',
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

function RewardText({ o }: { o: ReferralOrder }) {
  const r = o.reward ?? 0
  if (o.rewardState === 'SETTLED') {
    return <span className="font-medium tabular-nums text-emerald-300">已到账 +{money(r)}</span>
  }
  if (o.rewardState === 'PENDING') {
    return <span className="tabular-nums text-amber-300">待结算 {money(r)}</span>
  }
  if (o.status === 'CANCELLED' || o.status === 'REFUNDED') {
    return <span className="text-white/35">不产生返现</span>
  }
  if (o.status === 'UNPAID' && r > 0) {
    return <span className="tabular-nums text-white/45">待买家付款 · {money(r)}</span>
  }
  // 专属价 = 基础价时这一单本来就没有差额
  return <span className="text-white/35">本单无返现</span>
}

export default function ReferralPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [list, setList] = useState<ReferralOrder[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  // 「还有没有下一页」看服务端的 totalPages，不看「已显示条数 < total」：翻页之间有新记录插到最前面时，
  // 下一页会带回一条已经显示过的（去重后丢掉），已显示条数永远追不上 total，按钮就再也不消失
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [counts, setCounts] = useState<Record<Filter, number> | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [failed, setFailed] = useState(false)
  const [needLogin, setNeedLogin] = useState(false)
  // 首次请求回来之前不知道登录态，推广链接面板要等确认登录后再挂（它自己也会请求接口）
  const [authed, setAuthed] = useState(false)
  // 快速切换筛选时，只认最后一次请求的结果
  const seq = useRef(0)

  const load = useCallback(async (f: Filter, targetPage: number, append: boolean) => {
    const my = ++seq.current
    if (append) setLoadingMore(true)
    else {
      setLoading(true)
      // 切换筛选时先清空，失败时不会把上一个筛选的列表当成这个筛选的结果留在屏幕上
      setList([])
    }
    setFailed(false)
    try {
      const res = await fetch(`/api/account/referral/orders?filter=${f}&page=${targetPage}&pageSize=${PAGE_SIZE}`)
      if (my !== seq.current) return
      if (res.status === 401) {
        setNeedLogin(true)
        return
      }
      setAuthed(true)
      const d = await res.json()
      if (my !== seq.current) return
      if (!d.success) {
        setFailed(true)
        return
      }
      const incoming = d.data.list as ReferralOrder[]
      setList((prev) => {
        if (!append) return incoming
        // 翻页期间有新单进来会让下一页多出一条重复的，按 key 去重
        const seen = new Set(prev.map((o) => o.key))
        return prev.concat(incoming.filter((o) => !seen.has(o.key)))
      })
      setPage(d.data.page)
      setTotal(d.data.total)
      setTotalPages(Math.max(1, Number(d.data.totalPages) || 1))
      setSummary(d.data.summary)
      setCounts(d.data.counts)
    } catch {
      if (my === seq.current) setFailed(true)
    } finally {
      if (my === seq.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [])

  useEffect(() => {
    load(filter, 1, false)
  }, [filter, load])

  return (
    <div className="min-h-screen page-top pb-20">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none fixed left-1/4 top-24 h-[420px] w-[420px] rounded-full bg-pink-500/10 blur-[128px]" />

      <div className="container relative max-w-3xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white/80"
        >
          <ArrowLeft className="h-4 w-4" />
          个人中心
        </Link>

        <header className="mb-6 mt-5">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Gift className="h-6 w-6 text-pink-400" />
            推荐有奖
          </h1>
          <p className="mt-2 text-sm text-white/45">分享你的专属链接，好友下单完成后，差价返现自动计入你的账户余额。</p>
        </header>

        {needLogin ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
            <p className="text-sm text-white/45">登录后获取你的专属推广链接</p>
            <Link
              href="/login?redirect=/profile/referral"
              className="mt-4 inline-block rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 text-sm font-medium"
            >
              去登录
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 玩法说明 */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white/90">
                <Info className="h-4 w-4 text-purple-300" />
                怎么赚返现
              </h2>
              <ol className="space-y-3.5">
                {[
                  {
                    icon: Share2,
                    title: '分享链接',
                    body: '复制下方你的专属推广链接（形如 …/products?ref=你的推广码）发给好友。',
                  },
                  {
                    icon: ShoppingBag,
                    title: '好友按专属价下单',
                    body: '专属价默认等于网站售价；你可以按商品单独设置，但不能低于本站给你的基础价（见下方商品列表）。',
                  },
                  {
                    icon: Coins,
                    title: '订单完成自动返现',
                    body: '订单状态变为「已完成」后，返现 =（专属价 − 基础价）× 购买数量，自动计入你的账户余额。返现金额在好友下单时就按当时的价格确定。',
                  },
                  {
                    icon: Wallet,
                    title: '联系客服提现',
                    body: '余额暂不能直接用于支付订单；需要提现请联系客服，核实后线下打款。',
                  },
                ].map((s, i) => (
                  <li key={s.title} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-white/85">
                        <s.icon className="h-3.5 w-3.5 text-white/45" />
                        {s.title}
                      </div>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-white/50">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <ul className="mt-4 space-y-1 border-t border-white/10 pt-3.5 text-xs leading-relaxed text-white/40">
                <li>· 通过推广链接下的订单按专属价结算，不能使用优惠券。</li>
                <li>· 用自己的推广链接给自己下单不产生返现。</li>
                <li>
                  · 好友打开链接后，推广码会保存在他当前使用的浏览器里，之后在这个浏览器下单也计入你的推荐；
                  换设备、清除浏览器数据或打开了别人的推广链接后不再计入。
                </li>
              </ul>
            </section>

            {/* 推广链接 + 专属价。确认登录后再挂，避免未登录时它自己请求失败显示「加载失败」 */}
            {authed && <ReferralPanel />}

            {/* 推广订单 */}
            <section>
              <h2 className="mb-4 text-xl font-bold">推广订单</h2>

              {summary && (
                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: '推广订单', value: String(summary.orderCount), cls: 'text-white' },
                    { label: '已付款', value: String(summary.paidCount), cls: 'text-white' },
                    { label: '已到账返现', value: money(summary.settledReward), cls: 'text-emerald-300' },
                    { label: '待结算返现', value: money(summary.pendingReward), cls: 'text-amber-300' },
                  ].map((t) => (
                    <div key={t.label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
                      <div className="text-xs text-white/45">{t.label}</div>
                      <div className={`mt-1 truncate text-xl font-bold tabular-nums ${t.cls}`}>{t.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* 375px 上四个标签放不下一行，允许横向滑动而不是换行把高度撑乱 */}
              <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <div className="flex w-max gap-2">
                  {FILTER_TABS.map((t) => {
                    const active = filter === t.id
                    return (
                      <button
                        key={t.id}
                        onClick={() => setFilter(t.id)}
                        className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors ${
                          active
                            ? 'border-pink-400/40 bg-pink-500/15 text-white'
                            : 'border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/10 hover:text-white/80'
                        }`}
                      >
                        {t.label}
                        {counts && <span className="ml-1 tabular-nums text-white/40">{counts[t.id]}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-16 text-white/30">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : failed && list.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center">
                  <p className="text-sm text-white/45">加载失败</p>
                  <button
                    onClick={() => load(filter, 1, false)}
                    className="mt-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm text-white/70 hover:bg-white/10"
                  >
                    重试
                  </button>
                </div>
              ) : list.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-14 text-center">
                  <p className="text-sm text-white/45">{EMPTY_TEXT[filter]}</p>
                  {filter === 'all' && <p className="mt-1 text-xs text-white/30">把上面的推广链接发给好友试试</p>}
                </div>
              ) : (
                <>
                  <ul className="space-y-3">
                    {list.map((o) => {
                      const meta = STATUS_META[o.status] || STATUS_META.UNPAID
                      return (
                        <li key={o.key} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 sm:px-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-[15px] font-medium text-white/90">
                                {o.productName}
                                {o.quantity > 1 && <span className="ml-1 text-white/45">×{o.quantity}</span>}
                              </div>
                              <div className="mt-1 text-xs text-white/45">
                                买家 {o.buyer} · 订单 <span className="font-mono">{o.orderNoMasked}</span>
                              </div>
                              <div className="mt-0.5 text-xs text-white/35">
                                下单 {fmtTime(o.createdAt)}
                                {o.paidAt && <> · 付款 {fmtTime(o.paidAt)}</>}
                              </div>
                            </div>
                            <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs ${meta.cls}`}>{meta.text}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-white/10 pt-2.5 text-sm">
                            <span className="text-white/45">
                              订单金额 <span className="tabular-nums text-white/80">{money(o.amount)}</span>
                            </span>
                            <RewardText o={o} />
                          </div>
                        </li>
                      )
                    })}
                  </ul>

                  {page < totalPages ? (
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <button
                        onClick={() => load(filter, page + 1, true)}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-2.5 text-sm text-white/70 hover:bg-white/10 disabled:opacity-40"
                      >
                        {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                        {loadingMore ? '加载中...' : '加载更多'}
                      </button>
                      <span className="text-xs text-white/30">
                        {failed ? '加载失败，请重试' : `已显示 ${list.length} / ${total} 条`}
                      </span>
                    </div>
                  ) : (
                    total > PAGE_SIZE && <p className="mt-4 text-center text-xs text-white/30">已显示全部 {total} 条</p>
                  )}
                </>
              )}

              <p className="mt-6 text-xs leading-relaxed text-white/30">
                为保护买家隐私，买家名称与订单号均已部分隐藏。「待结算」是好友已付款、订单尚未完成的返现，
                订单完成后自动转入余额。
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
