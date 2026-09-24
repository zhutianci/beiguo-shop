'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Crown, Loader2, Check, Info } from 'lucide-react'

/**
 * 会员中心（此前个人中心的「会员中心」入口一直是 404）。
 *
 * 【权益一个字都不自己加】档位名称、门槛、权益全部来自后台「系统设置 → 会员等级」，
 * 页面照原样展示。交接文档反复记录过「页面承诺与代码行为对不上」的事故，
 * 这里宁可显得朴素，也不写「专属折扣」「优先发货」之类代码里并不存在的东西。
 * 定级口径见 lib/vip.ts：已付款订单的商品货款累计，后台手工等级只往上调。
 */

interface VipTier {
  level: number
  name: string
  minSpend: number
  benefits: string[]
}

interface VipData {
  spent: number
  current: VipTier
  next: VipTier | null
  remaining: number
  progress: number
  byAdmin: boolean
  tiers: VipTier[]
}

// 档位名称可在后台改，配色按档位序号取；超出的档位沿用最后一种
const ACCENTS = [
  { grad: 'from-purple-500 to-pink-500', chip: 'border-purple-400/30 bg-purple-500/15 text-purple-200', ring: 'border-purple-400/40' },
  { grad: 'from-slate-300 to-zinc-500', chip: 'border-slate-300/30 bg-slate-300/10 text-slate-100', ring: 'border-slate-300/40' },
  { grad: 'from-amber-400 to-orange-500', chip: 'border-amber-400/30 bg-amber-500/15 text-amber-200', ring: 'border-amber-400/40' },
  { grad: 'from-cyan-400 to-blue-500', chip: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-100', ring: 'border-cyan-400/40' },
  { grad: 'from-fuchsia-500 to-rose-500', chip: 'border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-200', ring: 'border-fuchsia-400/40' },
  { grad: 'from-emerald-400 to-teal-500', chip: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200', ring: 'border-emerald-400/40' },
]
const accentOf = (level: number) => ACCENTS[Math.max(0, Math.min(level, ACCENTS.length - 1))]

const money = (n: number) => `¥${n.toFixed(2)}`
/** 门槛多是整数，500.00 显示成 500 更好读 */
const threshold = (n: number) => `¥${Number.isInteger(n) ? n.toFixed(0) : n.toFixed(2)}`

export default function VipPage() {
  const [data, setData] = useState<VipData | null>(null)
  const [loading, setLoading] = useState(true)
  const [needLogin, setNeedLogin] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/account/vip')
      if (res.status === 401) {
        setNeedLogin(true)
        return
      }
      const d = await res.json()
      if (d.success) setData(d.data)
    } catch {
      // 失败走下方「加载失败」
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const accent = data ? accentOf(data.current.level) : ACCENTS[0]

  return (
    <div className="min-h-screen page-top pb-20">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none fixed left-1/4 top-24 h-[420px] w-[420px] rounded-full bg-amber-500/10 blur-[128px]" />

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
            <Crown className="h-6 w-6 text-amber-300" />
            会员中心
          </h1>
        </header>

        {loading ? (
          <div className="flex justify-center py-16 text-white/30">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : needLogin ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
            <p className="text-sm text-white/45">登录后查看你的会员等级</p>
            <Link
              href="/login?redirect=/vip"
              className="mt-4 inline-block rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 text-sm font-medium"
            >
              去登录
            </Link>
          </div>
        ) : !data ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
            <p className="text-sm text-white/45">加载失败</p>
            <button
              onClick={load}
              className="mt-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm text-white/70 hover:bg-white/10"
            >
              重试
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 当前等级 */}
            <section className="relative">
              <div className={`absolute -inset-[1px] rounded-3xl bg-gradient-to-r ${accent.grad} opacity-30 blur-md`} />
              <div className="glass relative rounded-3xl p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent.grad}`}
                  >
                    <Crown className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-white/45">当前等级</div>
                    <div className="truncate text-2xl font-bold">{data.current.name}</div>
                  </div>
                </div>
                {data.byAdmin && <p className="mt-3 text-xs text-white/45">当前等级由客服为你单独调整。</p>}

                <div className="mt-6 border-t border-white/10 pt-5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-white/50">累计消费</span>
                    <span className="text-lg font-semibold tabular-nums">{money(data.spent)}</span>
                  </div>
                  {data.next ? (
                    <>
                      <div
                        className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
                        role="progressbar"
                        aria-valuenow={data.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${accentOf(data.next.level).grad}`}
                          style={{ width: `${data.progress}%` }}
                        />
                      </div>
                      <p className="mt-2.5 text-sm text-white/60">
                        再消费 <span className="font-semibold tabular-nums text-white">{money(data.remaining)}</span> 升级为{' '}
                        <span className="font-semibold text-white">{data.next.name}</span>
                      </p>
                    </>
                  ) : (
                    <p className="mt-2.5 text-sm text-white/60">你已是最高等级。</p>
                  )}
                </div>
              </div>
            </section>

            {/* 等级阶梯 */}
            <section>
              <h2 className="mb-4 text-xl font-bold">等级与权益</h2>
              <ul className="space-y-3">
                {data.tiers.map((t) => {
                  const a = accentOf(t.level)
                  const isCurrent = t.level === data.current.level
                  const reached = t.level < data.current.level
                  const gap = Math.max(0, Math.round((t.minSpend - data.spent) * 100) / 100)
                  return (
                    <li
                      key={t.level}
                      className={`rounded-2xl border px-4 py-4 sm:px-5 ${
                        isCurrent ? `${a.ring} bg-white/[0.07]` : 'border-white/10 bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${a.grad}`}
                          >
                            <Crown className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-white/90">{t.name}</div>
                            <div className="text-xs text-white/40">
                              {t.minSpend > 0 ? `累计消费满 ${threshold(t.minSpend)}` : '无消费门槛'}
                            </div>
                          </div>
                        </div>
                        {isCurrent ? (
                          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs ${a.chip}`}>当前等级</span>
                        ) : reached ? (
                          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-white/45">
                            已达成
                          </span>
                        ) : (
                          <span className="shrink-0 text-xs tabular-nums text-white/40">还差 {money(gap)}</span>
                        )}
                      </div>
                      {t.benefits.length > 0 ? (
                        <ul className="mt-3 space-y-1.5">
                          {t.benefits.map((b, i) => (
                            <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-white/60">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300/80" />
                              <span className="min-w-0 break-words">{b}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-[13px] text-white/35">暂无额外权益</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>

            {/* 规则 */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/85">
                <Info className="h-4 w-4 text-amber-300" />
                等级规则
              </h2>
              <p className="text-[13px] leading-relaxed text-white/50">
                按已付款订单的商品金额累计（不含开票税费、已取消/退款订单不计），付款后自动计入；客服也可能为你单独调整等级。
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
