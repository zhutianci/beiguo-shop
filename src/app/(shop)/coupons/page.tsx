'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Ticket } from 'lucide-react'

/**
 * 我的优惠券。
 *
 * 【不展示券 id】站长明确要求。列表里连数字都不出现 —— 买家不需要知道，
 * 展示出来只会让人截图问客服「我这张 138 号券为什么用不了」。
 * 结算页选券用的是接口返回的实例 id，但那个只在表单里流转，页面上不露出。
 */

interface MyCoupon {
  id: number
  name: string
  label: string
  state: string
  expiresAt: string | null
  forever: boolean
}

const STATE_META: Record<string, { text: string; cls: string }> = {
  AVAILABLE: { text: '可使用', cls: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300' },
  LOCKED: { text: '订单占用中', cls: 'border-amber-400/25 bg-amber-500/10 text-amber-300' },
  USED: { text: '已使用', cls: 'border-white/10 bg-white/[0.04] text-white/35' },
  EXPIRED: { text: '已过期', cls: 'border-white/10 bg-white/[0.04] text-white/35' },
  VOID: { text: '已失效', cls: 'border-white/10 bg-white/[0.04] text-white/35' },
}

export default function MyCouponsPage() {
  const [list, setList] = useState<MyCoupon[]>([])
  const [counts, setCounts] = useState({ available: 0, locked: 0, used: 0 })
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
              className="mt-4 inline-block rounded-full border border-white/12 bg-white/[0.04] px-6 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.09]"
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
                    dead(c.state) ? 'border-white/8 bg-white/[0.02] opacity-55' : 'border-white/12 bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[17px] font-semibold text-white/90">{c.label}</div>
                      <div className="mt-1 text-[13px] text-white/45">{c.name}</div>
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

        <p className="mt-8 text-xs leading-relaxed text-white/30">
          优惠券在商品结算页选择使用，订单按优惠后的金额支付。与推广专属价不叠加，
          系统会自动为你采用更便宜的那个。发票税费等场景不可使用。
        </p>
      </div>
    </div>
  )
}
