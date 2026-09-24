'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Gift, Loader2, Ticket } from 'lucide-react'

/**
 * 我的优惠券。
 *
 * 【不展示券 id】站长明确要求。列表里连数字都不出现 —— 买家不需要知道，
 * 展示出来只会让人截图问客服「我这张 138 号券为什么用不了」。
 * 结算页选券用的是接口返回的实例 id，但那个只在表单里流转，页面上不露出。
 *
 * 「下单有奖」抽中的券就是普通的券（系统在中奖时发的单张批次），混在同一个列表里、
 * 用法完全一样，只多一个「下单有奖」角标说明来源。抽中的**自定义奖品**不是券，
 * 放在下面单独的「我的奖品」里，写清楚怎么兑。
 */

interface MyCoupon {
  id: number
  name: string
  label: string
  state: string
  expiresAt: string | null
  forever: boolean
  fromLottery?: boolean
}

interface MyPrize {
  orderNo: string
  prizeName: string | null
  prizeType: string | null
  label: string | null
  description: string | null
  fulfillState: string | null
  fulfilledAt: string | null
  drawnAt: string | null
}

const STATE_META: Record<string, { text: string; cls: string }> = {
  AVAILABLE: { text: '可使用', cls: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300' },
  LOCKED: { text: '订单占用中', cls: 'border-amber-400/25 bg-amber-500/10 text-amber-300' },
  USED: { text: '已使用', cls: 'border-white/10 bg-white/[0.04] text-white/35' },
  EXPIRED: { text: '已过期', cls: 'border-white/10 bg-white/[0.04] text-white/35' },
  VOID: { text: '已失效', cls: 'border-white/10 bg-white/[0.04] text-white/35' },
}

/** 自定义奖品的兑现状态（线下兑现，后台标记） */
const FULFILL_META: Record<string, { text: string; cls: string }> = {
  PENDING: { text: '待兑现', cls: 'border-amber-400/25 bg-amber-500/10 text-amber-300' },
  DONE: { text: '已兑现', cls: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300' },
  VOID: { text: '已作废', cls: 'border-white/10 bg-white/[0.04] text-white/35' },
}

export default function MyCouponsPage() {
  const [list, setList] = useState<MyCoupon[]>([])
  const [counts, setCounts] = useState({ available: 0, locked: 0, used: 0 })
  const [prizes, setPrizes] = useState<MyPrize[]>([])
  const [loading, setLoading] = useState(true)
  const [needLogin, setNeedLogin] = useState(false)

  useEffect(() => {
    fetch('/api/coupons/mine')
      .then(async (r) => {
        if (r.status === 401) {
          setNeedLogin(true)
          return null
        }
        return r.json()
      })
      .then((d) => {
        if (d?.success) {
          setList(d.data.list)
          setCounts(d.data.counts)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    // 奖品是附加信息：失败了不影响券列表，静默即可
    fetch('/api/lottery/mine')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.success) setPrizes((d.data.list as MyPrize[]).filter((p) => p.prizeType === 'CUSTOM'))
      })
      .catch(() => {})
  }, [])

  const dead = (s: string) => s === 'USED' || s === 'EXPIRED' || s === 'VOID'

  return (
    <div className="min-h-screen page-top pb-20">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none fixed left-1/4 top-24 h-[420px] w-[420px] rounded-full bg-purple-500/10 blur-[128px]" />

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
            <Ticket className="h-6 w-6 text-purple-400" />
            我的优惠券
          </h1>
          {!loading && !needLogin && (
            <p className="mt-2 text-sm text-white/45">
              可用 <span className="tabular-nums text-emerald-300">{counts.available}</span> 张
              {counts.locked > 0 && (
                <>
                  {' · '}
                  <span className="tabular-nums text-amber-300">{counts.locked}</span> 张正被订单占用
                </>
              )}
            </p>
          )}
        </header>

        {loading ? (
          <div className="flex justify-center py-16 text-white/30">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : needLogin ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
            <p className="text-sm text-white/45">登录后查看你的优惠券</p>
            <Link
              href="/login?redirect=/coupons"
              className="mt-4 inline-block rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 text-sm font-medium"
            >
              去登录
            </Link>
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
            <p className="text-sm text-white/45">还没有优惠券</p>
            <p className="mt-1 text-xs text-white/30">领到券后会出现在这里</p>
            <Link
              href="/products"
              className="mt-4 inline-block rounded-full border border-white/[0.12] bg-white/[0.04] px-6 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.09]"
            >
              去看看在售商品
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((c) => {
              const meta = STATE_META[c.state] || STATE_META.VOID
              return (
                <li
                  key={c.id}
                  className={`rounded-2xl border px-5 py-4 ${
                    dead(c.state)
                      ? 'border-white/[0.08] bg-white/[0.02] opacity-55'
                      : 'border-white/[0.12] bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[17px] font-semibold text-white/90">{c.label}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-white/45">
                        <span>{c.name}</span>
                        {c.fromLottery && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-pink-400/25 bg-pink-500/10 px-2 py-0.5 text-[11px] text-pink-300">
                            <Gift className="h-3 w-3" />
                            下单有奖
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-white/35">
                        {c.forever ? '长期有效' : `${new Date(c.expiresAt as string).toLocaleDateString('zh-CN')} 前有效`}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${meta.cls}`}>{meta.text}</span>
                  </div>

                  {c.state === 'AVAILABLE' && (
                    <Link
                      href="/products"
                      className="mt-3 inline-block text-[13px] text-purple-300/80 transition-colors hover:text-purple-200"
                    >
                      去使用 →
                    </Link>
                  )}
                  {c.state === 'LOCKED' && (
                    <p className="mt-3 text-xs leading-relaxed text-white/35">
                      这张券正挂在一笔待支付订单上。付款后自动核销；订单超时取消后会自动放回可用。
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {/* 我的奖品：只列抽中的自定义奖品（券奖已经在上面的券列表里了）。没有就整块不显示 */}
        {!loading && !needLogin && prizes.length > 0 && (
          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white/90">
              <Gift className="h-5 w-5 text-pink-400" />
              我的奖品
            </h2>
            <p className="mt-1 text-xs text-white/35">「下单有奖」抽中的实物或服务类奖品，由客服线下兑现。</p>
            <ul className="mt-4 space-y-3">
              {prizes.map((p) => {
                const meta = (p.fulfillState && FULFILL_META[p.fulfillState]) || FULFILL_META.PENDING
                const done = p.fulfillState === 'DONE' || p.fulfillState === 'VOID'
                return (
                  <li
                    key={p.orderNo}
                    className={`rounded-2xl border px-5 py-4 ${
                      p.fulfillState === 'VOID'
                        ? 'border-white/[0.08] bg-white/[0.02] opacity-55'
                        : 'border-white/[0.12] bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[17px] font-semibold text-white/90">{p.prizeName || p.label}</div>
                        {p.label && p.label !== p.prizeName && (
                          <div className="mt-1 text-[13px] text-white/55">{p.label}</div>
                        )}
                        {p.description && (
                          <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-white/45">
                            {p.description}
                          </p>
                        )}
                        <div className="mt-2 text-xs text-white/35">
                          订单号 <span className="font-mono text-white/55">{p.orderNo}</span>
                          {p.drawnAt && <> · {new Date(p.drawnAt).toLocaleDateString('zh-CN')} 抽中</>}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${meta.cls}`}>{meta.text}</span>
                    </div>

                    {!done && (
                      <p className="mt-3 text-xs leading-relaxed text-amber-300/80">
                        请在对应订单内联系客服兑奖。
                        <Link href="/orders" className="ml-1 text-purple-300/80 transition-colors hover:text-purple-200">
                          去我的订单 →
                        </Link>
                      </p>
                    )}
                    {p.fulfillState === 'DONE' && p.fulfilledAt && (
                      <p className="mt-3 text-xs text-white/35">
                        {new Date(p.fulfilledAt).toLocaleDateString('zh-CN')} 已兑现
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* 规则与 lib/coupon.ts 的 quoteOrder 同口径（2026-09-11 起）：内推单按专属价、券不参与 */}
        <p className="mt-8 text-xs leading-relaxed text-white/30">
          优惠券在商品结算页选择使用，订单按优惠后的金额支付。通过推广链接下单时按推广专属价计算，
          不能使用优惠券（券会保留在账户里）。券只抵扣货款，开票税费按抵扣后的货款另计。
        </p>
      </div>
    </div>
  )
}
