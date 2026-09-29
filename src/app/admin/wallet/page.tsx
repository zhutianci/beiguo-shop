'use client'

/**
 * 余额与充值（docs/短信接码-设计.md §7.8；B0 提供只读、调整、流水、对账、设置，充值单 / 预扣两个 tab 在 B1 / S2 有数据后自然出现）。
 * 数据全部经 adminGuard 的 /api/admin/wallet/*；页面本身不是闸门。
 *
 * 【调整只能走这里的弹窗】选格 + 方向 + 金额 + 原因（必填，内部）+ 请求号（幂等）。这里**不能记 LATEPAY**：
 * 迟到 / 重复的付款一律从「收款监控 → 待核实」的「退入买家余额」走。预扣中的钱不在格里，调不到。
 * 预扣只读：后台不提供「手工释放」，释放只能跟着关单走。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, X, Download, Search } from 'lucide-react'

type Tab = 'users' | 'logs' | 'topups' | 'holds' | 'latepay' | 'reconcile' | 'settings'
const TABS: { id: Tab; label: string }[] = [
  { id: 'users', label: '用户余额' },
  { id: 'logs', label: '流水' },
  { id: 'topups', label: '充值单' },
  { id: 'holds', label: '预扣' },
  { id: 'latepay', label: '迟到付款' },
  { id: 'reconcile', label: '对账' },
  { id: 'settings', label: '设置' },
]

interface WalletConfig {
  version: number
  balancePayEnabled: boolean
  topupEnabled: boolean
  topupAudience: 'ADMIN_ONLY' | 'ALL'
  tiersCents: number[]
  minCents: number
  maxCents: number
  pendingTopupPerUser: number
  latepayAuto: boolean
}

interface Overview {
  liability: { topupCents: number; cashCents: number; heldCents: number; heldCount: number; totalCents: number }
  heldOldestMin: number | null
  stuckHoldMin: number
  today: {
    topup: { cents: number; count: number }
    spent: { cents: number; count: number }
    back: { cents: number; count: number }
    withdraw: { cents: number; count: number }
    byType: { type: string; label: string; count: number; cents: number }[]
  }
  config: { ok: true; config: WalletConfig } | { ok: false; reason: string }
  /** 充值功能交付了吗（B1 之前 false） */
  topupAvailable: boolean
  reconcile: { at: string; ok: boolean; full: boolean; failed: { code: string; count: number }[] } | null
}

interface UserRow {
  id: number
  email: string | null
  nickname: string | null
  topupCents: number
  cashCents: number
  totalCents: number
  heldCents: number
  heldCount: number
  logCount: number
  lastAt: string | null
}

interface AdminLog {
  id: number
  userId: number
  email?: string | null
  type: string
  typeLabel: string
  cashDeltaCents: number
  cashAfterCents: number
  topupDeltaCents: number
  topupAfterCents: number | null
  note: string | null
  orderId: number | null
  bizKey: string | null
  createdAt: string
}

interface Paged<T> {
  list: T[]
  total: number
  page: number
  totalPages: number
}

function yuan(cents: number | null | undefined): string {
  const c = Number(cents ?? 0)
  const a = Math.abs(c)
  return `${c < 0 ? '-' : ''}¥${Math.floor(a / 100).toLocaleString('zh-CN')}.${String(a % 100).padStart(2, '0')}`
}

function signed(cents: number): string {
  if (!cents) return '—'
  return `${cents > 0 ? '+' : '−'}${yuan(Math.abs(cents))}`
}

function fmt(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}

/** 「12.34」→ 1234 分；不合法返回 null（不经过浮点乘法） */
function parseYuan(s: string): number | null {
  const m = /^\s*(\d{1,7})(?:\.(\d{1,2}))?\s*$/.exec(s)
  if (!m) return null
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'))
}

function newReqId(): string {
  const c: Crypto = crypto
  if (typeof c.randomUUID === 'function') return c.randomUUID()
  return Array.from(c.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * GET 一个后台接口：{ data, err, reload }。
 *  · 非 success（登录过期、500、adminGuard 403）与网络异常都给 err，页面显示「加载失败 · 重试」，不会一直「加载中...」；
 *  · 只认最后一次请求（序号），快速输入搜索词时先发后到的旧响应不会盖掉新结果。
 * url 为 null 时不发请求。
 */
function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const seq = useRef(0)
  const reload = useCallback(async () => {
    if (!url) return
    const my = ++seq.current
    setErr(null)
    try {
      const res = await fetch(url, { cache: 'no-store' })
      const d = await res.json().catch(() => null)
      if (my !== seq.current) return
      if (d?.success) setData(d.data as T)
      else setErr(d?.error || `加载失败（HTTP ${res.status}）`)
    } catch {
      if (my === seq.current) setErr('网络异常，加载失败')
    }
  }, [url])
  useEffect(() => {
    reload()
  }, [reload])
  return { data, err, reload }
}

/** 输入框防抖：停手 ms 毫秒后才用新值（搜索、筛选不必每敲一个字发一次请求） */
function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/** 列表区的「加载中 / 加载失败 · 重试」占位 */
function LoadGate({ loaded, err, onRetry, children }: { loaded: boolean; err: string | null; onRetry: () => void; children: React.ReactNode }) {
  return (
    <>
      {err && (
        <div className="mb-3 flex flex-wrap items-center justify-center gap-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{err}</span>
          <Button size="sm" variant="outline" onClick={onRetry}>
            重试
          </Button>
        </div>
      )}
      {loaded ? children : !err && <div className="py-8 text-center text-gray-400">加载中...</div>}
    </>
  )
}

export default function AdminWalletPage() {
  const [tab, setTab] = useState<Tab>('users')
  const [adjustFor, setAdjustFor] = useState<{ userId?: number; label?: string } | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab') as Tab | null
    if (t && TABS.some((x) => x.id === t)) setTab(t)
  }, [])

  const { data: ov, err: ovErr, reload: loadOv } = useApi<Overview>('/api/admin/wallet/overview')
  useEffect(() => {
    if (refreshKey) loadOv()
  }, [loadOv, refreshKey])

  const cfg = ov?.config.ok ? ov.config.config : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">余额与充值</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
            <RefreshCw className="mr-1 h-4 w-4" /> 刷新
          </Button>
          <Button size="sm" onClick={() => setAdjustFor({})}>
            调整余额
          </Button>
        </div>
      </div>

      {/* 负债看板 */}
      <Card>
        <CardContent className="space-y-2 py-4 text-sm text-gray-700">
          <LoadGate loaded={!!ov} err={ovErr} onRetry={loadOv}>
            {ov && (
              <>
                <div className="text-base">
                  余额负债 <strong className="text-lg text-gray-900">{yuan(ov.liability.totalCents)}</strong>
                  {' = '}充值余额 {yuan(ov.liability.topupCents)} + 返现余额 {yuan(ov.liability.cashCents)} + 预扣中 {yuan(ov.liability.heldCents)}（
                  {ov.liability.heldCount} 单
                  {ov.heldOldestMin != null && (
                    <span className={ov.heldOldestMin > ov.stuckHoldMin ? 'text-red-600' : ''}>，最久 {ov.heldOldestMin} 分钟</span>
                  )}
                  ）
                </div>
                <div>
                  今日：充值 {signed(ov.today.topup.cents)}（{ov.today.topup.count} 笔）· 余额消费 {signed(ov.today.spent.cents)} · 退回{' '}
                  {signed(ov.today.back.cents)} · 提现 {signed(ov.today.withdraw.cents)}
                  {ov.today.byType.length > 0 && (
                    <span className="ml-2 text-xs text-gray-400">
                      （{ov.today.byType.map((t) => `${t.label} ${t.count} 笔 ${signed(t.cents)}`).join('；')}）
                    </span>
                  )}
                </div>
                <div>
                  对账{' '}
                  {ov.reconcile ? (
                    <>
                      {fmt(ov.reconcile.at)}{' '}
                      {ov.reconcile.ok ? (
                        <span className="text-green-600">✓ 全部一致</span>
                      ) : (
                        <span className="text-red-600">✗ {ov.reconcile.failed.map((f) => `${f.code}×${f.count}`).join('、')}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">还没有跑过</span>
                  )}
                </div>
                <div>
                  {cfg ? (
                    <>
                      充值：
                      {!ov.topupAvailable
                        ? '○ 未上线（B1 交付后可开）'
                        : cfg.topupEnabled
                          ? `● 已开放（${cfg.topupAudience === 'ALL' ? '全部用户' : '仅管理员'}）`
                          : '○ 未开放'}{' '}
                      · 余额支付：
                      {cfg.balancePayEnabled ? '● 开' : <span className="text-red-600">○ 急停中</span>} · 档位{' '}
                      {cfg.tiersCents.map((t) => `¥${t / 100}`).join('/')} · 自定义 ¥{cfg.minCents / 100}–{(cfg.maxCents / 100).toLocaleString('zh-CN')} ·
                      迟到自动退入：{cfg.latepayAuto ? '开' : '关'}
                    </>
                  ) : (
                    <span className="text-red-600">
                      wallet_config 读取失败（{ov.config.ok ? '' : ov.config.reason}）：充值、新单选余额、自动退入已按关闭处理 —— 到「设置」保存一次
                    </span>
                  )}
                </div>
              </>
            )}
          </LoadGate>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${
              tab === t.id ? 'border-primary-600 font-medium text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab key={`u${refreshKey}`} onAdjust={(id, label) => setAdjustFor({ userId: id, label })} onDetail={setDetailId} />}
      {tab === 'logs' && <LogsTab key={`l${refreshKey}`} />}
      {tab === 'topups' && <TopupsTab key={`t${refreshKey}`} />}
      {tab === 'holds' && <HoldsTab key={`h${refreshKey}`} />}
      {tab === 'latepay' && <LatepayTab key={`lp${refreshKey}`} />}
      {tab === 'reconcile' && <ReconcileTab key={`r${refreshKey}`} onDone={loadOv} />}
      {tab === 'settings' && <SettingsTab key={`s${refreshKey}`} onSaved={loadOv} />}

      {adjustFor && (
        <AdjustDialog
          init={adjustFor}
          onClose={() => setAdjustFor(null)}
          onDone={() => {
            setRefreshKey((k) => k + 1)
          }}
        />
      )}
      {detailId != null && <UserDetailDialog userId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  )
}

// ============================== 用户余额 ==============================

function UsersTab({ onAdjust, onDetail }: { onAdjust: (id: number, label: string) => void; onDetail: (id: number) => void }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('total')
  const [page, setPage] = useState(1)
  const qd = useDebounced(q)
  const { data, err, reload } = useApi<Paged<UserRow>>(`/api/admin/wallet/users?q=${encodeURIComponent(qd)}&sort=${sort}&page=${page}`)
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="搜索 邮箱 / 昵称 / ID"
            className="w-60 rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm"
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="total">按总余额</option>
          <option value="topup">按充值余额</option>
          <option value="cash">按返现余额</option>
          <option value="held">按预扣中</option>
          <option value="recent">按最近变动</option>
        </select>
      </CardHeader>
      <CardContent>
        <LoadGate loaded={!!data} err={err} onRetry={reload}>
          {!data ? null : data.list.length === 0 ? (
            <div className="py-8 text-center text-gray-400">没有余额或流水的用户</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-3">用户</th>
                    <th className="pb-2 pr-3 text-right">总余额</th>
                    <th className="pb-2 pr-3 text-right">充值余额</th>
                    <th className="pb-2 pr-3 text-right">返现余额</th>
                    <th className="pb-2 pr-3 text-right">预扣中</th>
                    <th className="pb-2 pr-3">最近变动</th>
                    <th className="pb-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.list.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <Link href={`/admin/users/${u.id}`} className="text-primary-600 hover:underline">
                          {u.email || u.nickname || `用户#${u.id}`}
                        </Link>
                        <span className="ml-1 text-xs text-gray-400">#{u.id}</span>
                      </td>
                      <td className="py-2 pr-3 text-right font-medium">{yuan(u.totalCents)}</td>
                      <td className="py-2 pr-3 text-right">{yuan(u.topupCents)}</td>
                      <td className="py-2 pr-3 text-right">{yuan(u.cashCents)}</td>
                      <td className="py-2 pr-3 text-right">{u.heldCents ? yuan(u.heldCents) : '—'}</td>
                      <td className="py-2 pr-3 text-xs text-gray-500">{fmt(u.lastAt)}</td>
                      <td className="whitespace-nowrap py-2">
                        <button onClick={() => onDetail(u.id)} className="mr-2 text-primary-600 hover:underline">
                          详情
                        </button>
                        <button onClick={() => onAdjust(u.id, u.email || `用户#${u.id}`)} className="text-primary-600 hover:underline">
                          调整
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data && data.totalPages > 1 && <Pager page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
        </LoadGate>
      </CardContent>
    </Card>
  )
}

function Pager({ page, totalPages, total, onChange }: { page: number; totalPages: number; total: number; onChange: (p: number) => void }) {
  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-sm text-gray-500">
      <span>共 {total} 条</span>
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        上一页
      </Button>
      <span>
        {page} / {totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        下一页
      </Button>
    </div>
  )
}

function LogTable({ list, showUser }: { list: AdminLog[]; showUser?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-gray-800">
        <thead>
          <tr className="border-b text-left text-xs text-gray-500">
            <th className="pb-2 pr-3">时间</th>
            {showUser && <th className="pb-2 pr-3">用户</th>}
            <th className="pb-2 pr-3">类型</th>
            <th className="pb-2 pr-3 text-right">充值格</th>
            <th className="pb-2 pr-3 text-right">返现格</th>
            <th className="pb-2 pr-3 text-right">变动后（充值 / 返现）</th>
            <th className="pb-2 pr-3">订单</th>
            <th className="pb-2 pr-3">bizKey</th>
            <th className="pb-2">备注（内部）</th>
          </tr>
        </thead>
        <tbody>
          {list.map((l) => (
            <tr key={l.id} className="border-b last:border-0">
              <td className="whitespace-nowrap py-2 pr-3 text-xs text-gray-500">{fmt(l.createdAt)}</td>
              {showUser && (
                <td className="py-2 pr-3 text-xs">
                  <Link href={`/admin/users/${l.userId}`} className="text-primary-600 hover:underline">
                    {l.email || `#${l.userId}`}
                  </Link>
                </td>
              )}
              <td className="whitespace-nowrap py-2 pr-3">{l.typeLabel}</td>
              <td className={`whitespace-nowrap py-2 pr-3 text-right ${l.topupDeltaCents > 0 ? 'text-green-600' : l.topupDeltaCents < 0 ? 'text-red-600' : 'text-gray-300'}`}>
                {signed(l.topupDeltaCents)}
              </td>
              <td className={`whitespace-nowrap py-2 pr-3 text-right ${l.cashDeltaCents > 0 ? 'text-green-600' : l.cashDeltaCents < 0 ? 'text-red-600' : 'text-gray-300'}`}>
                {signed(l.cashDeltaCents)}
              </td>
              <td className="whitespace-nowrap py-2 pr-3 text-right text-xs text-gray-600">
                {l.topupAfterCents == null ? '—' : yuan(l.topupAfterCents)} / {yuan(l.cashAfterCents)}
              </td>
              <td className="py-2 pr-3 text-xs">
                {l.orderId ? (
                  <Link href={`/admin/orders?orderId=${l.orderId}`} className="text-primary-600 hover:underline">
                    #{l.orderId}
                  </Link>
                ) : (
                  '—'
                )}
              </td>
              <td className="py-2 pr-3 font-mono text-[11px] text-gray-500">{l.bizKey || '—'}</td>
              <td className="py-2 text-xs text-gray-500">{l.note || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================== 流水 ==============================

function LogsTab() {
  const [f, setF] = useState({ userId: '', type: '', from: '', to: '', orderNo: '', bizKey: '' })
  const [page, setPage] = useState(1)
  const qs = useCallback(
    (extra = '') => {
      const p = new URLSearchParams()
      Object.entries(f).forEach(([k, v]) => {
        if (v.trim()) p.set(k, v.trim())
      })
      p.set('page', String(page))
      return `${p.toString()}${extra}`
    },
    [f, page],
  )
  const listUrl = useDebounced(`/api/admin/wallet/logs?${qs()}`)
  const { data, err, reload } = useApi<Paged<AdminLog>>(listUrl)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setF({ ...f, [k]: e.target.value })
    setPage(1)
  }
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-2">
        <input value={f.userId} onChange={set('userId')} placeholder="用户 ID" className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <select value={f.type} onChange={set('type')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">全部类型</option>
          {['TOPUP', 'HOLD', 'RELEASE', 'REFUND', 'LATEPAY', 'REFERRAL', 'CLAWBACK', 'ADJUST', 'WITHDRAW', 'TOPUP_REFUND'].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input type="date" value={f.from} onChange={set('from')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input type="date" value={f.to} onChange={set('to')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={f.orderNo} onChange={set('orderNo')} placeholder="订单号" className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={f.bizKey} onChange={set('bizKey')} placeholder="bizKey（结尾 * 前缀）" className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <a href={`/api/admin/wallet/logs?${qs('&format=csv')}`} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
          <Download className="h-4 w-4" /> 导出 CSV
        </a>
      </CardHeader>
      <CardContent>
        <LoadGate loaded={!!data} err={err} onRetry={reload}>
          {data && (data.list.length === 0 ? <div className="py-8 text-center text-gray-400">没有流水</div> : <LogTable list={data.list} showUser />)}
          {data && data.totalPages > 1 && <Pager page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
        </LoadGate>
      </CardContent>
    </Card>
  )
}

// ============================== 充值单 ==============================

function TopupsTab() {
  const [state, setState] = useState('all')
  const [page, setPage] = useState(1)
  const { data, err, reload } = useApi<
    Paged<{
      id: number
      orderNo: string
      userId: number
      email: string | null
      amountCents: number
      payStatus: string
      deliveryStatus: string
      createdAt: string
      paidAt: string | null
      creditedCents: number | null
    }>
  >(`/api/admin/wallet/topups?state=${state}&page=${page}`)
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        {[
          ['all', '全部'],
          ['pending', '待支付'],
          ['credited', '已入账'],
          ['closed', '已关闭'],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => {
              setState(k)
              setPage(1)
            }}
            className={`rounded-full border px-3 py-1 text-xs ${state === k ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}
          >
            {l}
          </button>
        ))}
      </CardHeader>
      <CardContent>
        <LoadGate loaded={!!data} err={err} onRetry={reload}>
          {!data ? null : data.list.length === 0 ? (
            <div className="py-8 text-center text-gray-400">还没有充值单（充值出厂关闭、受众仅管理员，在「设置」里打开）</div>
          ) : (
            <table className="w-full text-sm text-gray-800">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-2 pr-3">充值单</th>
                  <th className="pb-2 pr-3">用户</th>
                  <th className="pb-2 pr-3 text-right">金额</th>
                  <th className="pb-2 pr-3 text-right">入账（含尾差）</th>
                  <th className="pb-2 pr-3">状态</th>
                  <th className="pb-2">时间</th>
                </tr>
              </thead>
              <tbody>
                {data.list.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs">{t.orderNo}</td>
                    <td className="py-2 pr-3 text-xs">{t.email || `#${t.userId}`}</td>
                    <td className="py-2 pr-3 text-right">{yuan(t.amountCents)}</td>
                    <td className="py-2 pr-3 text-right">{t.creditedCents == null ? '—' : yuan(t.creditedCents)}</td>
                    <td className="py-2 pr-3 text-xs">
                      {t.payStatus}/{t.deliveryStatus}
                    </td>
                    <td className="py-2 text-xs text-gray-500">{fmt(t.paidAt ?? t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {data && data.totalPages > 1 && <Pager page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
        </LoadGate>
      </CardContent>
    </Card>
  )
}

// ============================== 预扣 ==============================

interface HoldRow {
  id: number
  orderId: number
  userId: number
  topupCents: number
  cashCents: number
  totalCents: number
  state: string
  reason: string | null
  heldAt: string
  minutes: number
  stuck?: boolean
  order: { orderNo: string; payStatus: string; deliveryStatus: string } | null
}

function HoldsTab() {
  const { data, err, reload } = useApi<{ held: HoldRow[]; recent: HoldRow[]; stuckMin: number }>('/api/admin/wallet/holds')
  const table = (rows: HoldRow[], live: boolean) => (
    <table className="w-full text-sm text-gray-800">
      <thead>
        <tr className="border-b text-left text-xs text-gray-500">
          <th className="pb-2 pr-3">订单</th>
          <th className="pb-2 pr-3">用户</th>
          <th className="pb-2 pr-3 text-right">预扣（充值 / 返现）</th>
          <th className="pb-2 pr-3">状态</th>
          <th className="pb-2">{live ? '已持续' : '原因'}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((h) => (
          <tr key={h.id} className={`border-b last:border-0 ${h.stuck ? 'bg-red-50' : ''}`}>
            <td className="py-2 pr-3 font-mono text-xs">{h.order?.orderNo ?? `#${h.orderId}`}</td>
            <td className="py-2 pr-3 text-xs">
              <Link href={`/admin/users/${h.userId}`} className="text-primary-600 hover:underline">
                #{h.userId}
              </Link>
            </td>
            <td className="py-2 pr-3 text-right">
              {yuan(h.totalCents)}
              <span className="ml-1 text-xs text-gray-400">
                （{yuan(h.topupCents)} / {yuan(h.cashCents)}）
              </span>
            </td>
            <td className="py-2 pr-3 text-xs">{h.state}</td>
            <td className={`py-2 text-xs ${h.stuck ? 'font-medium text-red-600' : 'text-gray-500'}`}>{live ? `${h.minutes} 分钟` : h.reason || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
  return (
    <Card>
      <CardContent className="space-y-6 py-4">
        <LoadGate loaded={!!data} err={err} onRetry={reload}>
          {data && (
            <>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  预扣中（HELD，超过 {data.stuckMin} 分钟标红）
                </h3>
                {data.held.length === 0 ? <div className="py-4 text-center text-sm text-gray-400">没有预扣中的订单</div> : table(data.held, true)}
                <p className="mt-2 text-xs text-gray-400">只读：预扣的变化只能由订单状态驱动；要处理请到接码后台对那张单用「关单并原路退回预扣」。</p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">最近确认 / 释放 / 退款</h3>
                {data.recent.length === 0 ? <div className="py-4 text-center text-sm text-gray-400">暂无</div> : table(data.recent, false)}
              </div>
            </>
          )}
        </LoadGate>
      </CardContent>
    </Card>
  )
}

// ============================== 对账 ==============================

interface Report {
  at: string
  full: boolean
  sinceHours: number
  exemptUserIds: number[]
  ok: boolean
  liability: { totalCents: number }
  items: { code: string; title: string; ok: boolean; count: number; samples: string[]; note?: string }[]
}

function ReconcileTab({ onDone }: { onDone: () => void }) {
  const { data, err, reload } = useApi<{ report: Report | null }>('/api/admin/wallet/reconcile')
  const [ran, setRan] = useState<Report | null>(null)
  const [busy, setBusy] = useState(false)
  const [runErr, setRunErr] = useState('')
  const report = ran ?? data?.report ?? null
  const run = async (full: boolean) => {
    setBusy(true)
    setRunErr('')
    try {
      const res = await fetch('/api/admin/wallet/reconcile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full }) })
      const d = await res.json().catch(() => null)
      if (d?.success) {
        setRan(d.data.report)
        onDone()
      } else setRunErr(d?.error || `对账失败（HTTP ${res.status}）`)
    } catch {
      setRunErr('网络异常，对账结果未知：稍后点「刷新」看最近一次报告')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>余额对账（W 系列）</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" loading={busy} onClick={() => run(false)}>
            跑一次（近 48 小时）
          </Button>
          <Button size="sm" variant="outline" loading={busy} onClick={() => run(true)}>
            全量跑一次
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {runErr && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{runErr}</div>}
        <LoadGate loaded={!!data || !!ran} err={ran ? null : err} onRetry={reload}>
          {!report ? (
            <div className="py-8 text-center text-gray-400">还没有对账报告（cron 每天 03:10 跑）</div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="text-gray-500">
                {fmt(report.at)} · {report.full ? '全量' : `近 ${report.sinceHours} 小时`} · 负债 {yuan(report.liability.totalCents)}
                {report.exemptUserIds.length > 0 && ` · 豁免用户 ${report.exemptUserIds.join('、')}`}
              </div>
              {report.items.map((i) => (
                <div key={i.code} className={`rounded-lg border px-3 py-2 ${i.ok ? 'border-green-100 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="font-medium">
                    {i.ok ? '✓' : '✗'} {i.code} {i.title}
                    {!i.ok && <span className="ml-2 text-red-600">{i.count} 处</span>}
                  </div>
                  {i.note && <div className="text-xs text-gray-500">{i.note}</div>}
                  {i.samples.map((s, k) => (
                    <div key={k} className="text-xs text-red-700">
                      · {s}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </LoadGate>
      </CardContent>
    </Card>
  )
}

// ============================== 设置 ==============================

function SettingsTab({ onSaved }: { onSaved: () => void }) {
  const [cfg, setCfg] = useState<WalletConfig | null>(null)
  const [reason, setReason] = useState<string | null>(null)
  // 库里那一行的版本号：读失败（校验不过、JSON 坏）时也有，保存用它作 expectVersion，坏掉的配置才能从这里修好
  const [storedVersion, setStoredVersion] = useState(0)
  const [topupAvailable, setTopupAvailable] = useState(false)
  const [factory, setFactory] = useState<WalletConfig | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState({ tiers: '', min: '', max: '', pending: '2', balancePayEnabled: true, topupEnabled: false, topupAudience: 'ADMIN_ONLY', latepayAuto: true })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const fill = (c: WalletConfig, available: boolean) =>
    setForm({
      tiers: c.tiersCents.map((t) => String(t / 100)).join(', '),
      min: String(c.minCents / 100),
      max: String(c.maxCents / 100),
      pending: String(c.pendingTopupPerUser),
      balancePayEnabled: c.balancePayEnabled,
      // B1 之前充值开关恒为关（服务端也拒绝打开）
      topupEnabled: available && c.topupEnabled,
      topupAudience: c.topupAudience,
      latepayAuto: c.latepayAuto,
    })
  const load = useCallback(async () => {
    setLoadErr(null)
    try {
      const res = await fetch('/api/admin/wallet/config', { cache: 'no-store' })
      const d = await res.json().catch(() => null)
      if (!d?.success) {
        setLoadErr(d?.error || `加载失败（HTTP ${res.status}）`)
        return
      }
      setCfg(d.data.config)
      setReason(d.data.reason)
      setStoredVersion(Number(d.data.storedVersion) || 0)
      setTopupAvailable(d.data.topupAvailable === true)
      setFactory(d.data.factory)
      fill(d.data.config ?? d.data.factory, d.data.topupAvailable === true)
      setLoaded(true)
    } catch {
      setLoadErr('网络异常，加载失败')
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const toCents = (s: string) => {
    const c = parseYuan(s)
    return c == null ? NaN : c
  }

  const save = async (confirmLatepay = false) => {
    setBusy(true)
    setMsg('')
    setErrors({})
    try {
      const config = {
        balancePayEnabled: form.balancePayEnabled,
        topupEnabled: form.topupEnabled,
        topupAudience: form.topupAudience,
        tiersCents: form.tiers
          .split(/[,，\s]+/)
          .filter(Boolean)
          .map(toCents),
        minCents: toCents(form.min),
        maxCents: toCents(form.max),
        pendingTopupPerUser: Number(form.pending),
        latepayAuto: form.latepayAuto,
      }
      const res = await fetch('/api/admin/wallet/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, expectVersion: storedVersion, confirmLatepay }),
      })
      const d = await res.json().catch(() => null)
      if (d?.success) {
        setMsg('已保存')
        await load()
        onSaved()
      } else if (d?.needConfirm && window.confirm(d.error)) {
        await save(true)
      } else {
        setErrors(d?.errors || {})
        setMsg(d?.error || `保存失败（HTTP ${res.status}）`)
      }
    } catch {
      setMsg('网络异常，结果未知：请刷新页面看版本号是否已变')
    } finally {
      setBusy(false)
    }
  }

  const err = (k: string) => {
    const hit = Object.entries(errors).filter(([key]) => key === k || key.startsWith(`${k}.`))
    return hit.length ? <div className="mt-1 text-xs text-red-600">{hit.map(([, v]) => v).join('；')}</div> : null
  }
  const box = (k: string) => `rounded-lg border px-3 py-2 text-sm ${Object.keys(errors).some((key) => key === k || key.startsWith(`${k}.`)) ? 'border-red-400 bg-red-50' : 'border-gray-300'}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>wallet_config{cfg ? `（版本 ${cfg.version}）` : storedVersion ? `（库里版本 ${storedVersion}，已损坏）` : ''}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {loadErr && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-red-50 px-3 py-2 text-red-700">
            <span>{loadErr}</span>
            <Button size="sm" variant="outline" onClick={load}>
              重试
            </Button>
          </div>
        )}
        {!loaded && !loadErr && <div className="py-8 text-center text-gray-400">加载中...</div>}
        {loaded && (
          <>
            {!cfg && reason && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
                当前读不到有效配置（{reason}）：充值、新单选余额、迟到付款自动退入都按关闭处理（释放、确认、退款、提现、返现入账不受影响）。下面填的是出厂值，保存一次即可。
              </div>
            )}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.balancePayEnabled} onChange={(e) => setForm({ ...form, balancePayEnabled: e.target.checked })} />
              余额支付（关掉 = 急停：新单不能选余额；已预扣的单照常确认或释放，退款照常入余额）
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className={`flex items-center gap-2 ${topupAvailable ? '' : 'text-gray-400'}`}>
                <input
                  type="checkbox"
                  checked={form.topupEnabled}
                  disabled={!topupAvailable}
                  onChange={(e) => setForm({ ...form, topupEnabled: e.target.checked })}
                />
                充值开关
              </label>
              <select
                value={form.topupAudience}
                disabled={!topupAvailable}
                onChange={(e) => setForm({ ...form, topupAudience: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="ADMIN_ONLY">仅管理员</option>
                <option value="ALL">全部用户</option>
              </select>
              <span className="text-xs text-gray-400">
                {topupAvailable ? '（跟接码一起对全部用户开放，D28）' : '（充值页面与接口在 B1 上线，之后才能打开）'}
              </span>
              {err('topupEnabled')}
            </div>
            <div>
              <div className="mb-1 text-gray-700">档位（元，逗号分隔，1–8 个，升序）</div>
              <input value={form.tiers} onChange={(e) => setForm({ ...form, tiers: e.target.value })} className={`${box('tiersCents')} w-72`} />
              {err('tiersCents')}
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <div className="mb-1 text-gray-700">单笔下限（元，整数，≥1）</div>
                <input value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value })} className={`${box('minCents')} w-32`} />
                {err('minCents')}
              </div>
              <div>
                <div className="mb-1 text-gray-700">单笔上限（元，整数，≤1000）</div>
                <input value={form.max} onChange={(e) => setForm({ ...form, max: e.target.value })} className={`${box('maxCents')} w-32`} />
                {err('maxCents')}
              </div>
              <div>
                <div className="mb-1 text-gray-700">每人待支付充值单上限（1–3）</div>
                <input value={form.pending} onChange={(e) => setForm({ ...form, pending: e.target.value })} className={`${box('pendingTopupPerUser')} w-24`} />
                {err('pendingTopupPerUser')}
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.latepayAuto} onChange={(e) => setForm({ ...form, latepayAuto: e.target.checked })} />
              迟到付款自动退入（关掉后「付完马上取消」等迟到付款全部要你手动退入；改动要二次确认）
            </label>
            <p className="text-xs text-gray-400">没有「充值余额总额上限」这一项（站长 09-29 决定不设，Q5）。</p>
            <div className="flex items-center gap-3">
              <Button onClick={() => save()} loading={busy}>
                保存
              </Button>
              {factory && (
                <Button variant="outline" onClick={() => fill(factory, topupAvailable)}>
                  填入出厂值
                </Button>
              )}
              {msg && <span className={msg === '已保存' ? 'text-green-600' : 'text-red-600'}>{msg}</span>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ============================== 调整弹窗 ==============================

const KIND_OPTIONS = [
  { k: 'CASH_ADD', label: '返现余额 +（余额调整）' },
  { k: 'CASH_SUB', label: '返现余额 −（提现：线下打款后记扣减）' },
  { k: 'TOPUP_ADD', label: '充值余额 +（补偿）' },
  { k: 'TOPUP_SUB', label: '充值余额 −（充值退还：线下原路退款后记扣减）' },
  { k: 'CLAWBACK', label: '返现扣回（推荐订单事后退款）' },
]

function AdjustDialog({ init, onClose, onDone }: { init: { userId?: number; label?: string }; onClose: () => void; onDone: () => void }) {
  const [kind, setKind] = useState('CASH_SUB')
  const [userId, setUserId] = useState(init.userId ? String(init.userId) : '')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [alipayNo, setAlipayNo] = useState('')
  const [refOrder, setRefOrder] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  // 请求号：弹窗打开时生成，只有成功后才换新的；结果不明时沿用，服务端按它去重
  const reqId = useRef(newReqId())

  const submit = async () => {
    setMsg('')
    const body: Record<string, unknown> = { kind, reason: reason.trim(), requestId: reqId.current }
    if (kind === 'CLAWBACK') {
      if (!/^\d+$/.test(refOrder.trim())) return setMsg('请填写产生返现的订单 ID')
      body.referralOrderId = Number(refOrder.trim())
      if (userId.trim()) body.userId = Number(userId.trim())
    } else {
      if (!/^\d+$/.test(userId.trim())) return setMsg('请填写用户 ID')
      const c = parseYuan(amount)
      if (!c) return setMsg('金额格式不对（最多两位小数）')
      body.userId = Number(userId.trim())
      body.amountCents = c
      if (kind === 'TOPUP_SUB') body.alipayNo = alipayNo.trim()
    }
    if (!reason.trim()) return setMsg('请填写原因（内部，不回显给买家）')
    setBusy(true)
    try {
      let d
      try {
        const res = await fetch('/api/admin/wallet/adjust', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        d = await res.json()
      } catch {
        setMsg('网络异常，结果未知：请先到「流水」核对；未入账可直接再点提交（同一请求号不会重复记账）')
        return
      }
      if (d.success) {
        reqId.current = newReqId()
        const r = d.data
        setMsg(
          `${d.message || '已记账'}：充值 ${yuan(r.after.topupCents)} · 返现 ${yuan(r.after.cashCents)}${r.shortfallCents ? `（扣回不足 ${yuan(r.shortfallCents)}）` : ''}`,
        )
        setAmount('')
        onDone()
      } else setMsg(d.error || '操作失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !busy && onClose()}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">调整余额{init.label ? ` · ${init.label}` : ''}</h3>
          <button onClick={() => !busy && onClose()} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
            {KIND_OPTIONS.map((o) => (
              <option key={o.k} value={o.k}>
                {o.label}
              </option>
            ))}
          </select>
          <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder={kind === 'CLAWBACK' ? '用户 ID（可空，取返现记录的推广人）' : '用户 ID'} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          {kind === 'CLAWBACK' ? (
            <>
              <input value={refOrder} onChange={(e) => setRefOrder(e.target.value)} placeholder="产生返现的订单 ID" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              <p className="text-xs text-gray-500">金额 = 那笔返现的入账额；先扣返现余额、不够再扣充值余额，两格合计不够就扣到 0，差额记进审计。同一张订单只扣一次。</p>
            </>
          ) : (
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="金额（元，正数，如 50 或 12.34）" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          )}
          {kind === 'TOPUP_SUB' && (
            <input value={alipayNo} onChange={(e) => setAlipayNo(e.target.value)} placeholder="支付宝流水号（必填，16–32 位数字；同一流水号只扣一次）" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          )}
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="原因（必填，内部，不回显给买家）" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          <p className="text-xs text-gray-400">
            这里不能记「付款退回余额」：迟到 / 重复的付款请到{' '}
            <Link href="/admin/vmq" className="text-primary-600 hover:underline">
              收款监控 → 待核实
            </Link>{' '}
            处理。预扣中的钱不在两格里，调不到。
          </p>
          {msg && <div className="rounded-lg bg-gray-50 px-3 py-2 text-gray-700">{msg}</div>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={busy}>
              关闭
            </Button>
            <Button onClick={submit} loading={busy}>
              提交
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================== 用户详情 ==============================

function UserDetailDialog({ userId, onClose }: { userId: number; onClose: () => void }) {
  const {
    data: d,
    err,
    reload,
  } = useApi<{
    user: { id: number; email: string | null; nickname: string | null }
    wallet: { topupCents: number; cashCents: number; totalCents: number; heldCents: number }
    holds: { id: number; orderId: number; topupCents: number; cashCents: number; state: string; heldAt: string }[]
    logs: AdminLog[]
    orders: { id: number; orderNo: string; productName: string; amount: string; payStatus: string; deliveryStatus: string; deliveryType: string; own: boolean }[]
  }>(`/api/admin/wallet/users/${userId}`)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">用户余额详情 #{userId}</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {!d ? (
          <LoadGate loaded={false} err={err} onRetry={reload}>
            {null}
          </LoadGate>
        ) : (
          <div className="space-y-5 text-sm">
            <div>
              {d.user.email || d.user.nickname} · 总余额 <strong>{yuan(d.wallet.totalCents)}</strong>（充值 {yuan(d.wallet.topupCents)} · 返现 {yuan(d.wallet.cashCents)}）
              {d.wallet.heldCents > 0 && ` · 预扣中 ${yuan(d.wallet.heldCents)}`}
            </div>
            {d.holds.length > 0 && (
              <div>
                <h4 className="mb-1 font-semibold text-gray-900">预扣</h4>
                {d.holds.map((h) => (
                  <div key={h.id} className="text-xs text-gray-600">
                    订单 #{h.orderId} · {h.state} · 充值 {yuan(h.topupCents)} · 返现 {yuan(h.cashCents)} · {fmt(h.heldAt)}
                  </div>
                ))}
              </div>
            )}
            <div>
              <h4 className="mb-1 font-semibold text-gray-900">最近流水</h4>
              {d.logs.length === 0 ? <div className="text-gray-400">没有流水</div> : <LogTable list={d.logs} />}
            </div>
            {d.orders.length > 0 && (
              <div>
                <h4 className="mb-1 font-semibold text-gray-900">关联订单</h4>
                {d.orders.map((o) => (
                  <div key={o.id} className="text-xs text-gray-600">
                    <Link href={`/admin/orders?orderId=${o.id}`} className="text-primary-600 hover:underline">
                      {o.orderNo}
                    </Link>{' '}
                    · {o.productName} · ¥{o.amount} · {o.payStatus}/{o.deliveryStatus} · {o.own ? '本人订单' : '产生返现的订单'}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 迟到付款（docs/短信接码-设计.md §7.8、§2.7、D41）：最近的 LATEPAY 流水（自动 / 手动、对应条目、订单、手动的支付宝交易号）；
 * 待核实列表里涉及接码 / 充值订单的条目数（到「收款监控」处理）；标为 OFFLINE / IGNORE 的条目（只读，W7 豁免）。
 * 这里只读：退入只能在「收款监控 → 待核实」用「退入买家余额」（钱和标记在同一个事务里）。
 */
function LatepayTab() {
  const { data, err, reload } = useApi<{
    carrierOpen: number
    openTotal: number
    logs: { logId: number; at: string; cents: number; userId: number; userEmail: string | null; orderNo: string | null; orderType: string | null; entryKey: string; reason: string | null; auto: boolean; tradeNo: string | null; vmqOrderNo: string | null }[]
    handledOther: { key: string; price: string; reason: string; handledAs: string | null; handledAt: number | null; handledBy: string | number | null }[]
  }>('/api/admin/wallet/latepay')
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">迟到付款退入余额</CardTitle>
      </CardHeader>
      <CardContent>
        <LoadGate loaded={!!data} err={err} onRetry={reload}>
          {!data ? null : (
            <div className="space-y-5 text-sm">
              <div className={`rounded-lg border p-3 ${data.carrierOpen ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-gray-100 text-gray-600'}`}>
                待核实的到账 {data.openTotal} 条，其中涉及短信接码 / 余额充值订单 {data.carrierOpen} 条。
                <a href="/admin/vmq" className="ml-1 text-primary-600 underline">
                  到「收款监控 → 待核实」处理
                </a>
                （核对支付宝账单 → 退入买家余额，必填支付宝交易号）
              </div>
              <div>
                <div className="mb-2 font-medium text-gray-800">最近的退入（LATEPAY 流水）</div>
                {data.logs.length === 0 ? (
                  <div className="py-4 text-center text-gray-400">还没有</div>
                ) : (
                  <table className="w-full text-xs text-gray-800">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-2 pr-3">时间</th>
                        <th className="pb-2 pr-3">用户</th>
                        <th className="pb-2 pr-3">订单</th>
                        <th className="pb-2 pr-3 text-right">退入充值余额</th>
                        <th className="pb-2 pr-3">方式</th>
                        <th className="pb-2">条目</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.map((l) => (
                        <tr key={l.logId} className="border-b last:border-0">
                          <td className="py-2 pr-3 whitespace-nowrap">{new Date(l.at).toLocaleString('zh-CN', { hour12: false })}</td>
                          <td className="py-2 pr-3">{l.userEmail || `#${l.userId}`}</td>
                          <td className="py-2 pr-3 font-mono">
                            {l.orderNo ?? '—'} {l.orderType === 'TOPUP' ? '（充值）' : l.orderType === 'SMS_POOL' ? '（接码）' : ''}
                          </td>
                          <td className="py-2 pr-3 text-right">{yuan(l.cents)}</td>
                          <td className="py-2 pr-3">{l.auto ? `自动（收款单 ${l.vmqOrderNo ?? '—'}）` : `手动（交易号 ${l.tradeNo ?? '—'}）`}</td>
                          <td className="py-2 font-mono text-[11px] text-gray-500">
                            {l.entryKey}
                            {l.reason ? ` · ${l.reason}` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div>
                <div className="mb-2 font-medium text-gray-800">标为「线下已原路退回 / 核实不是新到账」的条目（只读）</div>
                {data.handledOther.length === 0 ? (
                  <div className="py-4 text-center text-gray-400">没有</div>
                ) : (
                  <ul className="space-y-1 text-xs text-gray-600">
                    {data.handledOther.map((h) => (
                      <li key={h.key}>
                        ¥{h.price} · {h.reason} · {h.handledAs === 'OFFLINE' ? '线下已原路退回支付宝' : '核实不是新到账'} · 管理员 #{h.handledBy ?? '—'} ·{' '}
                        {h.handledAt ? new Date(h.handledAt).toLocaleString('zh-CN', { hour12: false }) : '—'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </LoadGate>
      </CardContent>
    </Card>
  )
}
