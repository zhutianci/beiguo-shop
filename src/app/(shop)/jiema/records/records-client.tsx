'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, ClipboardList, Copy, Globe2, Loader2, Search, X } from 'lucide-react'
import { useHydrated } from '@/lib/use-hydrated'
import { useUserStore } from '@/store/user'
import { fmtYuan } from '@/lib/jiema/pricing'
import type { JiemaRecordItem } from '@/lib/jiema/dto'
import {
  RECORD_DAYS,
  RECORD_TABS,
  bjTime,
  groupNational,
  jiemaSelectionPath,
  loginHref,
  parseRecordDays,
  parseRecordTab,
  payModeShort,
  phoneQuery,
  recordStatusText,
  recordsEmptyState,
  type RecordTab,
} from '@/lib/jiema/ui'
import { cn } from '@/lib/utils'

/**
 * 我的接码记录（docs/短信接码-设计.md §1.11；S3）。
 *
 * tab：全部 / 进行中（含待支付、余额已预扣）/ 已完成 / 已退回（已取消 + 售后退款）/ 未支付（已关闭）；
 * 号码搜索（完整号或后 4 位）、日期筛选（近 7 / 30 / 90 天；进行中的单不受日期限制）；每页 20 条，「加载更多」。
 * 每行金额旁小字标付款方式；已关闭的单写「未支付 · 已关闭」（用过余额的加「预扣已退回」，关单后有到账退入的加「付款已退回余额」），
 * **不混进「已退回」**：纯支付宝的关闭单什么都没退。倒计时用服务端时间校正。
 * 登录门禁先等 useHydrated（水合那一次渲染 user 恒为 null）。选择存在 URL（replaceState），刷新不丢。
 * 换 tab / 日期 / 搜索（第 1 页）时先清空列表、显示骨架，出错时也不留上一个 tab 的行（S3 评审修复）；
 * 空列表按日期窗口说清楚（「近 30 天没有接码记录 [查看近 90 天]」，不说成「还没有接码记录」）。
 */

interface Resp {
  items: JiemaRecordItem[]
  total: number
  counts: Record<RecordTab, number>
  page: number
  pageSize: number
  hasMore: boolean
  serverNow: string
}

const TONE: Record<string, string> = {
  amber: 'text-amber-200',
  green: 'text-emerald-200',
  gray: 'text-white/55',
  red: 'text-red-200',
  cyan: 'text-cyan-100',
}

function Flag({ iso2 }: { iso2: string | null }) {
  if (!iso2) return <Globe2 aria-hidden="true" className="h-4 w-5 shrink-0 text-white/45" />
  return (
    <span aria-hidden="true" className="inline-flex h-4 w-6 shrink-0 items-center justify-center rounded border border-white/15 bg-white/[0.06] text-[9px] font-semibold tracking-wide text-white/70">
      {iso2}
    </span>
  )
}

export function JiemaRecordsClient() {
  const router = useRouter()
  const hydrated = useHydrated()
  const user = useUserStore((s) => s.user)

  const [tab, setTab] = useState<RecordTab>('all')
  const [days, setDays] = useState(30)
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [qErr, setQErr] = useState<string | null>(null)
  const [data, setData] = useState<Resp | null>(null)
  const [items, setItems] = useState<JiemaRecordItem[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const offset = useRef(0)
  const [now, setNow] = useState(() => Date.now())
  const reqId = useRef(0)

  // URL → 初始筛选（?tab=&q=&days=）
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    setTab(parseRecordTab(sp.get('tab')))
    setDays(parseRecordDays(sp.get('days')))
    const qq = (sp.get('q') || '').slice(0, 30)
    setQ(qq)
    setQInput(qq)
    setReady(true)
  }, [])

  // 筛选 → URL（replaceState，不产生历史记录）
  useEffect(() => {
    if (!ready) return
    const sp = new URLSearchParams()
    if (tab !== 'all') sp.set('tab', tab)
    if (days !== 30) sp.set('days', String(days))
    if (q) sp.set('q', q)
    const qs = sp.toString()
    try {
      window.history.replaceState(null, '', `/jiema/records${qs ? `?${qs}` : ''}`)
    } catch {
      /* 忽略 */
    }
  }, [ready, tab, days, q])

  const load = useCallback(
    async (page: number) => {
      const my = ++reqId.current
      setLoading(true)
      setErr(null)
      if (page === 1) {
        // 换了筛选：旧行属于上一个 tab / 日期，不能留在新 tab 下面（慢网下会以为是新结果；出错时更会挂在错误框下面）
        setItems([])
        setData((prev) => (prev ? { ...prev, hasMore: false } : prev))
      }
      try {
        const sp = new URLSearchParams({ tab, days: String(days), page: String(page) })
        if (q) sp.set('q', q)
        const res = await fetch(`/api/jiema/orders?${sp}`, { cache: 'no-store' })
        if (res.status === 401) {
          router.replace(loginHref('/jiema/records'))
          return
        }
        const d = await res.json().catch(() => null)
        if (my !== reqId.current) return
        if (!d?.success) {
          setErr((d?.error as string) || '加载失败')
          return
        }
        const r = d.data as Resp
        offset.current = Date.parse(r.serverNow) - Date.now()
        setData(r)
        setItems((prev) => (page === 1 ? r.items : [...prev, ...r.items.filter((x) => !prev.some((p) => p.orderNo === x.orderNo))]))
      } catch {
        if (my === reqId.current) setErr('网络不稳定，请重试')
      } finally {
        if (my === reqId.current) setLoading(false)
      }
    },
    [tab, days, q, router],
  )

  // 登录门禁：先等水合再看登录态
  useEffect(() => {
    if (!hydrated || !ready) return
    if (!user) {
      router.replace(loginHref('/jiema/records'))
      return
    }
    void load(1)
  }, [hydrated, ready, user, load, router])

  // 有进行中的单时每秒刷新倒计时
  const hasLive = items.some((x) => x.deadline)
  useEffect(() => {
    if (!hasLive) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [hasLive])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const v = qInput.trim()
    const pq = phoneQuery(v)
    if (pq === 'SHORT') {
      setQErr('请输入完整号码或至少后 4 位')
      return
    }
    setQErr(null)
    setQ(v)
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setToast('验证码已复制')
    } catch {
      setToast('复制失败，请长按手动复制')
    }
    setTimeout(() => setToast(null), 2000)
  }

  if (!hydrated || !user) return <div className="py-24 text-center text-sm text-white/40">加载中…</div>

  const serverNow = now + offset.current
  const counts = data?.counts
  const empty = recordsEmptyState({ q, tab, days })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ClipboardList className="h-6 w-6 text-cyan-300" />
          我的接码记录
        </h1>
        <Link href="/jiema" className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1.5 text-sm font-medium">
          去接码
        </Link>
      </div>

      {/* tab */}
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="记录分类">
        {RECORD_TABS.map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors', tab === k ? 'border-cyan-400/50 bg-cyan-500/10 text-white' : 'border-white/10 text-white/60 hover:bg-white/[0.06]')}
          >
            {label}
            {k === 'active' && counts && counts.active > 0 && <span className="ml-1 rounded-full bg-amber-500/25 px-1.5 text-[11px] text-amber-100">{counts.active}</span>}
          </button>
        ))}
      </div>

      {/* 搜索与日期 */}
      <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-white/40" />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            inputMode="tel"
            placeholder="按号码搜索（完整号或后 4 位）"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
            aria-label="按号码搜索"
          />
          {qInput && (
            <button
              type="button"
              onClick={() => {
                setQInput('')
                setQ('')
                setQErr(null)
              }}
              aria-label="清除"
              className="text-white/40 hover:text-white/80"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select value={days} onChange={(e) => setDays(parseRecordDays(e.target.value))} aria-label="日期" className="rounded-xl border border-white/10 bg-[#0b0b12] px-3 py-2 text-sm text-white/80">
          {RECORD_DAYS.map((d) => (
            <option key={d} value={d}>
              近 {d} 天
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
          搜索
        </button>
      </form>
      {qErr && <p className="text-xs text-amber-200/90">{qErr}</p>}
      {tab !== 'active' && <p className="text-[11px] text-white/35">进行中的订单不受日期筛选影响，始终显示。</p>}

      {err && (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {err}
          <button onClick={() => void load(1)} className="ml-2 text-cyan-300/90 hover:underline">
            重试
          </button>
        </div>
      )}

      {/* 列表 */}
      {loading && items.length === 0 ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.05]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        // 出错时只显示上面的错误框（不接着说「没有记录」）
        data && !err ? (
          <div className="glass rounded-3xl px-6 py-14 text-center">
            <p className="text-sm text-white/55">{empty.text}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {empty.widenTo && (
                <button onClick={() => setDays(empty.widenTo as number)} className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/80 hover:bg-white/10">
                  查看近 {empty.widenTo} 天
                </button>
              )}
              <Link href="/jiema" className="inline-block rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-medium">
                去接码
              </Link>
            </div>
          </div>
        ) : null
      ) : (
        <ul className="glass divide-y divide-white/[0.06] rounded-2xl">
          {items.map((r) => {
            const st = recordStatusText(r, serverNow)
            const again = jiemaSelectionPath(r.service.code, r.country.id, null, true)
            const doneLike = r.state === 'FINISHED' || r.state === 'RECEIVED'
            return (
              <li key={r.orderNo} className="px-4 py-3">
                <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-white/85">
                      <span className="font-medium">{r.service.name}</span>
                      <span className="text-white/30">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Flag iso2={r.country.iso2} />
                        {r.country.name}
                      </span>
                      <span className={cn('text-xs', TONE[st.tone])}>● {st.label}</span>
                      {st.extra && <span className={cn('font-mono text-xs tabular-nums', doneLike && r.code ? 'text-emerald-200' : 'text-white/60')}>{st.extra}</span>}
                      {doneLike && r.code && (
                        <button onClick={() => void copy(r.code as string)} className="inline-flex items-center gap-0.5 rounded-md border border-white/15 px-1.5 py-0.5 text-[11px] text-white/70 hover:bg-white/10" aria-label="复制验证码">
                          <Copy className="h-3 w-3" /> 复制
                        </button>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-white/45">
                      {r.number ? <span className="font-mono">{`${r.number.dial ? `+${r.number.dial} ` : '+'}${groupNational(r.number.national)}`}</span> : <span>—</span>}
                      <span> · {bjTime(r.createdAt).slice(5)}</span>
                      {r.complaint === 'OPEN' && <span className="text-amber-200/80"> · 售后处理中</span>}
                      {r.complaint === 'REJECTED' && <span> · 售后未通过</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm tabular-nums text-white/85">{fmtYuan(r.priceCents)}</div>
                    <div className="text-[11px] text-white/40">{payModeShort(r.payMode)}</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap justify-end gap-2 text-xs">
                  {(r.state === 'FINISHED' || r.state === 'CANCELLED' || r.state === 'REFUNDED' || r.state === 'CLOSED') && (
                    <Link href={again} className="rounded-lg border border-white/15 px-3 py-1 text-white/75 hover:bg-white/10">
                      再来一单
                    </Link>
                  )}
                  <Link href={`/jiema/order/${encodeURIComponent(r.orderNo)}`} className="inline-flex items-center gap-0.5 rounded-lg border border-white/15 px-3 py-1 text-white/80 hover:bg-white/10">
                    查看 <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {data?.hasMore && (
        <div className="text-center">
          <button onClick={() => void load((data?.page ?? 1) + 1)} disabled={loading} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-5 py-2 text-sm text-white/75 hover:bg-white/10 disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}加载更多
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-black/85 px-4 py-2 text-sm text-white shadow-lg">
          <Check className="mr-1 inline h-4 w-4 text-emerald-300" />
          {toast}
        </div>
      )}
    </div>
  )
}
