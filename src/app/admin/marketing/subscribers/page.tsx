'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Info, Loader2, Search, ShieldBan } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CONSENT_STATUSES,
  SUPPRESSION_REASONS,
  SUPPRESSION_REASON_LABEL,
  TOPIC_LABEL,
  UNSUPPRESSIBLE_REASONS,
  type SubscriberRow,
  type SubscriberStats,
  type SuppressionReason,
} from '@/lib/marketing/types'
import { fmtInt, fmtShortTime, fmtTime, isAbortError, mktFetch } from '@/components/admin/marketing/api'
import { CONSENT_STATUS_CLS, CONSENT_STATUS_LABEL, SUPPRESSION_CLS, SUPPRESSION_SOURCE_LABEL } from '@/components/admin/marketing/labels'
import { StatTile } from '@/components/admin/marketing/stat-tile'
import { runSubscriberAction } from '@/components/admin/marketing/subscriber-actions'
import { cn } from '@/lib/utils'

/**
 * 营销推广 · 订阅与退订：谁能收、谁退订了、谁被抑制了。
 *
 * 管理员在这里只能「减少来信」（退订 / 暂停 / 加入抑制），不能替用户恢复订阅 —— 见页面上的说明与设计 10.3。
 */

type Tab = 'subscribers' | 'suppressions'
const PAGE_SIZE = 20

const STATUS_FILTERS: { v: string; label: string }[] = [
  { v: '', label: '全部' },
  ...CONSENT_STATUSES.map((s) => ({ v: s, label: CONSENT_STATUS_LABEL[s] })),
  { v: 'PAUSED', label: '暂停中' },
  { v: 'SUPPRESSED', label: '已抑制' },
]

export default function MarketingSubscribersPage() {
  const [tab, setTab] = useState<Tab>('subscribers')
  const [stats, setStats] = useState<SubscriberStats | null>(null)

  // 抑制名单页改动后单独刷新顶部统计（用户列表页每次加载都会顺带返回统计）
  const refreshStats = useCallback(async () => {
    try {
      const r = await mktFetch<{ stats: SubscriberStats }>('/api/admin/marketing/subscribers?page=1&pageSize=1')
      if (r.ok && r.data) setStats(r.data.stats)
    } catch {
      /* 统计只是展示，失败不打扰 */
    }
  }, [])

  return (
    <div className="space-y-6">
      <StatsRow stats={stats} />

      <Card>
        <div className="flex gap-1 border-b border-gray-100 px-4 pt-2">
          {(
            [
              { k: 'subscribers', label: '用户订阅状态' },
              { k: 'suppressions', label: '抑制名单' },
            ] as const
          ).map((t) => (
            <button
              key={t.k}
              type="button"
              onClick={() => setTab(t.k)}
              className={cn(
                '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium',
                tab === t.k ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-800'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'subscribers' ? <SubscribersTab onStats={setStats} /> : <SuppressionsTab onChanged={refreshStats} />}
      </Card>
    </div>
  )
}

function StatsRow({ stats }: { stats: SubscriberStats | null }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-[68px] animate-pulse rounded-lg bg-gray-200/60" />
        ))}
      </div>
    )
  }
  const suppressedTotal = Object.values(stats.suppressed).reduce((s, n) => s + (n || 0), 0)
  const suppressedDetail = (Object.entries(stats.suppressed) as [SuppressionReason, number][])
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${SUPPRESSION_REASON_LABEL[k]} ${n}`)
    .join(' · ')
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      <StatTile label="注册用户" value={fmtInt(stats.totalUsers)} sub={`有邮箱 ${fmtInt(stats.withEmail)}`} />
      <StatTile
        label="现在可发"
        value={fmtInt(stats.eligibleNow)}
        tone="good"
        hint="按当前设置能收到营销邮件的人数（有邮箱、没退订、没暂停、不在抑制名单；「仅明确订阅」模式下只算明确订阅的）"
      />
      <StatTile label="默认（未表态）" value={fmtInt(stats.byStatus.DEFAULT)} tone="muted" hint="没点过订阅也没退订。能不能发由「发送设置 → 默认可接收」决定" />
      <StatTile label="明确订阅" value={fmtInt(stats.byStatus.SUBSCRIBED)} tone="brand" hint="用户亲手点过「确认订阅」" />
      <StatTile label="已退订" value={fmtInt(stats.byStatus.UNSUBSCRIBED)} tone={stats.byStatus.UNSUBSCRIBED ? 'warn' : 'muted'} />
      <StatTile label="暂停中" value={fmtInt(stats.paused)} tone="muted" />
      <StatTile label="抑制名单" value={fmtInt(suppressedTotal)} tone={suppressedTotal ? 'bad' : 'muted'} sub={suppressedDetail || undefined} hint={suppressedDetail || undefined} />
    </div>
  )
}

/* ============================== 用户订阅状态 ============================== */

function SubscribersTab({ onStats }: { onStats: (s: SubscriberStats) => void }) {
  const [list, setList] = useState<SubscriberRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')
  const [debounced, setDebounced] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [flash, setFlash] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const onStatsRef = useRef(onStats)
  onStatsRef.current = onStats

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 350)
    return () => clearTimeout(t)
  }, [keyword])

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (status) q.set('status', status)
      if (debounced) q.set('keyword', debounced)
      const r = await mktFetch<{ stats: SubscriberStats; list: SubscriberRow[]; total: number; totalPages: number }>(
        `/api/admin/marketing/subscribers?${q}`,
        { signal: ctrl.signal }
      )
      if (abortRef.current !== ctrl) return
      if (r.ok && r.data) {
        setList(r.data.list)
        setTotal(r.data.total)
        setTotalPages(Math.max(1, r.data.totalPages || 1))
        onStatsRef.current(r.data.stats)
        setErr('')
      } else setErr(r.error || '加载失败')
    } catch (e) {
      if (!isAbortError(e)) setErr('加载失败')
    } finally {
      if (abortRef.current === ctrl) setLoading(false)
    }
  }, [page, status, debounced])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => () => abortRef.current?.abort(), [])

  const act = async (row: SubscriberRow, action: 'unsubscribe' | 'pause' | 'suppress') => {
    setBusyId(row.userId)
    try {
      const msg = await runSubscriberAction({
        action,
        userId: row.userId,
        email: action === 'suppress' ? row.email || undefined : undefined,
        who: `用户 #${row.userId}${row.email ? `（${row.email}）` : ''}`,
      })
      if (msg) {
        setFlash(msg)
        load()
      }
    } finally {
      setBusyId(null)
    }
  }

  const now = Date.now()

  return (
    <CardContent className="space-y-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(1)
            }}
            placeholder="搜 用户ID / 邮箱 / 昵称"
            className="w-64 rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.v || 'all'}
              type="button"
              onClick={() => {
                setStatus(f.v)
                setPage(1)
              }}
              className={cn(
                'rounded-md px-3 py-1 text-sm',
                status === f.v ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 rounded-lg bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-800">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div>
          这里只能<b>减少</b>来信：退订、暂停 30 天、加入抑制名单，且都要填备注（进审计）。
          <b>没有「恢复订阅」</b>：订阅必须是用户本人的意思，管理员替他改回来就等于伪造同意（广告法 §43、电子邮件服务管理办法 §13）。
          用户想恢复，请他在个人中心「邮件订阅」里自己打开，或点最近一封营销邮件底部的「调整订阅」。
        </div>
      </div>

      {flash && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{flash}</p>}

      {err && list.length === 0 ? (
        <p className="py-10 text-center text-sm text-red-600">{err}</p>
      ) : loading && list.length === 0 ? (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">没有符合条件的用户</p>
      ) : (
        <div className={cn('overflow-x-auto', loading && 'opacity-60')}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500">
                <th className="pb-2 pr-3">用户</th>
                <th className="pb-2 pr-3">订阅状态</th>
                <th className="pb-2 pr-3">关闭的分类</th>
                <th className="pb-2 pr-3">暂停到</th>
                <th className="pb-2 pr-3">抑制</th>
                <th className="pb-2 pr-3 text-right">已收营销</th>
                <th className="pb-2 pr-3 whitespace-nowrap">最近一封</th>
                <th className="pb-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const paused = !!r.pausedUntil && new Date(r.pausedUntil).getTime() > now
                return (
                  <tr key={r.userId} className="border-b border-gray-50 align-top">
                    <td className="py-2.5 pr-3">
                      <Link href={`/admin/users/${r.userId}`} className="font-medium text-gray-900 hover:text-primary-600 hover:underline">
                        {r.email || <span className="text-gray-400">（无邮箱）</span>}
                      </Link>
                      <div className="text-xs text-gray-400">
                        #{r.userId}
                        {r.nickname && ` · ${r.nickname}`}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={cn('inline-flex rounded px-1.5 py-0.5 text-xs', CONSENT_STATUS_CLS[r.status])}>{CONSENT_STATUS_LABEL[r.status]}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-gray-600">{r.topicsOff.length ? r.topicsOff.map((t) => TOPIC_LABEL[t]).join('、') : <span className="text-gray-300">—</span>}</td>
                    <td className="py-2.5 pr-3 text-xs">
                      {paused ? <span className="text-amber-700">{fmtShortTime(r.pausedUntil)}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-2.5 pr-3">
                      {r.suppressed ? (
                        <span className={cn('inline-flex rounded px-1.5 py-0.5 text-xs', SUPPRESSION_CLS[r.suppressed])}>
                          {SUPPRESSION_REASON_LABEL[r.suppressed]}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-gray-700">{fmtInt(r.sentCount)}</td>
                    <td className="py-2.5 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmtShortTime(r.lastSentAt)}</td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline" className="px-2 py-1 text-xs" disabled={busyId === r.userId || r.status === 'UNSUBSCRIBED'} onClick={() => act(r, 'unsubscribe')}>
                          退订
                        </Button>
                        <Button size="sm" variant="outline" className="px-2 py-1 text-xs" disabled={busyId === r.userId || paused || r.status === 'UNSUBSCRIBED'} onClick={() => act(r, 'pause')}>
                          暂停 30 天
                        </Button>
                        <Button size="sm" variant="outline" className="px-2 py-1 text-xs" disabled={busyId === r.userId || !!r.suppressed || !r.email} onClick={() => act(r, 'suppress')}>
                          加入抑制
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-gray-500">
            共 {fmtInt(total)} 人 · 第 {page} / {totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              上一页
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              下一页
            </Button>
          </div>
        </div>
      )}
    </CardContent>
  )
}

/* ============================== 抑制名单 ============================== */

interface SuppressionRow {
  email: string
  reason: string
  detail: string | null
  source: string
  createdAt: string
}

function SuppressionsTab({ onChanged }: { onChanged: () => void }) {
  const [list, setList] = useState<SuppressionRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [reason, setReason] = useState('')
  const [keyword, setKeyword] = useState('')
  const [debounced, setDebounced] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [flash, setFlash] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 350)
    return () => clearTimeout(t)
  }, [keyword])

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (reason) q.set('reason', reason)
      if (debounced) q.set('keyword', debounced)
      const r = await mktFetch<{ list: SuppressionRow[]; total: number; totalPages: number }>(`/api/admin/marketing/suppressions?${q}`, {
        signal: ctrl.signal,
      })
      if (abortRef.current !== ctrl) return
      if (r.ok && r.data) {
        setList(r.data.list)
        setTotal(r.data.total)
        setTotalPages(Math.max(1, r.data.totalPages || 1))
        setErr('')
      } else setErr(r.error || '加载失败')
    } catch (e) {
      if (!isAbortError(e)) setErr('加载失败')
    } finally {
      if (abortRef.current === ctrl) setLoading(false)
    }
  }, [page, reason, debounced])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => () => abortRef.current?.abort(), [])

  const addManual = async () => {
    const raw = prompt('要加入抑制名单的邮箱：')
    if (raw == null) return
    const email = raw.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('邮箱格式不正确')
    setBusy('__add__')
    try {
      const msg = await runSubscriberAction({ action: 'suppress', email, who: email })
      if (msg) {
        setFlash(msg)
        load()
        onChanged()
      }
    } finally {
      setBusy(null)
    }
  }

  const unsuppress = async (row: SuppressionRow) => {
    setBusy(row.email)
    try {
      const msg = await runSubscriberAction({ action: 'unsuppress', email: row.email, who: row.email })
      if (msg) {
        setFlash(msg)
        load()
        onChanged()
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <CardContent className="space-y-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(1)
            }}
            placeholder="搜邮箱"
            className="w-56 rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">全部原因</option>
          {SUPPRESSION_REASONS.map((r) => (
            <option key={r} value={r}>
              {SUPPRESSION_REASON_LABEL[r]}
            </option>
          ))}
        </select>
        <Button size="sm" variant="outline" className="ml-auto" onClick={addManual} loading={busy === '__add__'}>
          <ShieldBan className="mr-1 h-3.5 w-3.5" />
          手动加入邮箱
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-gray-500">
        抑制名单按邮箱生效，命中就永远不发营销邮件（与订阅状态无关）。硬退信、无效地址、投诉由发送与阿里云同步自动加入；
        <b className="text-gray-700">投诉（标记垃圾邮件）的永远不能解除</b>，其余原因确认已恢复后可以解除。
      </p>

      {flash && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{flash}</p>}

      {err && list.length === 0 ? (
        <p className="py-10 text-center text-sm text-red-600">{err}</p>
      ) : loading && list.length === 0 ? (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">{reason || debounced ? '没有符合条件的记录' : '抑制名单是空的'}</p>
      ) : (
        <div className={cn('overflow-x-auto', loading && 'opacity-60')}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500">
                <th className="pb-2 pr-3">邮箱</th>
                <th className="pb-2 pr-3">原因</th>
                <th className="pb-2 pr-3">说明</th>
                <th className="pb-2 pr-3">来源</th>
                <th className="pb-2 pr-3 whitespace-nowrap">加入时间</th>
                <th className="pb-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => {
                const reasonKey = s.reason as SuppressionReason
                const canUnsuppress = UNSUPPRESSIBLE_REASONS.includes(reasonKey)
                return (
                  <tr key={s.email} className="border-b border-gray-50 align-top">
                    <td className="py-2.5 pr-3 font-medium text-gray-900">{s.email}</td>
                    <td className="py-2.5 pr-3">
                      <span className={cn('inline-flex whitespace-nowrap rounded px-1.5 py-0.5 text-xs', SUPPRESSION_CLS[reasonKey] || 'bg-gray-100 text-gray-600')}>
                        {SUPPRESSION_REASON_LABEL[reasonKey] || s.reason}
                      </span>
                    </td>
                    <td className="max-w-[320px] py-2.5 pr-3 text-xs text-gray-500">
                      <span className="line-clamp-2 break-all" title={s.detail || undefined}>
                        {s.detail || '—'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-gray-500">{SUPPRESSION_SOURCE_LABEL[s.source] || s.source}</td>
                    <td className="py-2.5 pr-3 text-xs text-gray-500 whitespace-nowrap" title={fmtTime(s.createdAt)}>
                      {fmtShortTime(s.createdAt)}
                    </td>
                    <td className="py-2.5">
                      {canUnsuppress ? (
                        <Button size="sm" variant="outline" className="px-2 py-1 text-xs" disabled={busy === s.email} onClick={() => unsuppress(s)}>
                          解除
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400" title="投诉过的邮箱永久不再发送，不能解除">
                          不可解除
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-gray-500">
            共 {fmtInt(total)} 条 · 第 {page} / {totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              上一页
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              下一页
            </Button>
          </div>
        </div>
      )}
    </CardContent>
  )
}
