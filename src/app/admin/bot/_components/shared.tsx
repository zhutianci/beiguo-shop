'use client'

/**
 * 后台「微信机器人」页各标签共用的小工具（docs/微信机器人-设计.md §14）：请求封装、北京时间、文案、徽标、分页条。
 *
 * 【只给浏览器用】这里只 import 类型与零依赖的同构模块，不碰 prisma 与任何服务端模块——
 * 后台页面全是 'use client'，引进服务端模块会把整个 Prisma 客户端打进浏览器包。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ───────────────────────── 请求 ─────────────────────────

export interface ApiResult<T> {
  ok: boolean
  status: number
  data: T | null
  /** 失败时接口给的 error 文案：页面原样显示给站长 */
  error: string | null
  message: string | null
  /** 字段级错误（接口的 failFields）：键是字段路径，如 caps.issuePerDay */
  errors: Record<string, string> | null
}

/**
 * 统一的接口调用。接口约定信封 {success, data?, error?, message?, errors?}。
 * nginx 超时、进程重启时会回一页 HTML，直接 res.json() 会抛「Unexpected token <」——这里翻成「服务器返回异常（HTTP 502）」。
 */
export async function api<T>(url: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  const hasBody = init.body !== undefined
  let res: Response
  try {
    res = await fetch(url, {
      method: init.method || (hasBody ? 'POST' : 'GET'),
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    })
  } catch {
    return { ok: false, status: 0, data: null, error: '网络异常，请检查网络后重试', message: null, errors: null }
  }
  let j: { success?: boolean; data?: T; error?: string; message?: string; errors?: unknown } | null = null
  try {
    j = await res.json()
  } catch {
    j = null
  }
  if (!j || typeof j !== 'object') {
    return { ok: false, status: res.status, data: null, error: `服务器返回异常（HTTP ${res.status}）`, message: null, errors: null }
  }
  const ok = res.ok && j.success === true
  const errors = j.errors && typeof j.errors === 'object' && !Array.isArray(j.errors) ? (j.errors as Record<string, string>) : null
  return {
    ok,
    status: res.status,
    data: ok ? ((j.data ?? null) as T | null) : null,
    error: ok ? null : j.error || `操作失败（HTTP ${res.status}）`,
    message: j.message ?? null,
    errors,
  }
}

/**
 * GET 一个接口并持有结果。url 变了自动重拉；旧请求晚回来按序号丢掉（翻页、筛选连点时不会被旧结果覆盖）。
 * 失败时保留上一次的数据、另给 err——网络抖一下，表格不至于整个消失。
 */
export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const seq = useRef(0)
  const reload = useCallback(async () => {
    if (!url) return
    const my = ++seq.current
    setLoading(true)
    const r = await api<T>(url)
    if (my !== seq.current) return
    setLoading(false)
    if (r.ok) {
      setData(r.data)
      setErr(null)
    } else setErr(r.error)
  }, [url])
  useEffect(() => {
    void reload()
  }, [reload])
  return { data, err, loading, reload }
}

// ───────────────────────── 格式化 ─────────────────────────

/**
 * 北京时间「10-05 14:32」（withYear：2026-10-05 14:32）。机器人的日报、免打扰、每日上限都按北京时间，
 * 这里也按北京时间显示，与浏览器所在时区无关。
 */
export function bjTime(iso: string | null | undefined, withYear = false): string {
  if (!iso) return '—'
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return '—'
  const s = new Date(t + 8 * 3600_000).toISOString()
  return withYear ? `${s.slice(0, 10)} ${s.slice(11, 16)}` : `${s.slice(5, 10)} ${s.slice(11, 16)}`
}

/** 「刚刚」「12 分钟前」「3 小时前」「2 天前」 */
export function ago(iso: string | null | undefined): string {
  if (!iso) return '从未'
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return '—'
  const m = Math.floor((Date.now() - t) / 60_000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  return h < 48 ? `${h} 小时前` : `${Math.floor(h / 24)} 天前`
}

/** ¥1,234.00；空值「—」 */
export function yuan(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return `¥${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** 一天中的分钟 → 「23:00」 */
export function hhmm(m: number | null | undefined): string {
  if (m == null) return '—'
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** <input type="time"> 的「23:00」→ 1380；不合法 null */
export function minuteOf(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(s || '')
  if (!m) return null
  const h = Number(m[1])
  const mi = Number(m[2])
  return h <= 23 && mi <= 59 ? h * 60 + mi : null
}

// ───────────────────────── 文案 ─────────────────────────

export type Tone = 'gray' | 'green' | 'amber' | 'red' | 'blue'

const TONE_CLS: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-600',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
}

export const KIND_LABEL: Record<string, string> = { MGMT: '主站管理群', TENANT: '分站群', DM: '私聊' }

/** 指令能用的范围（指令注册表的 scopes） */
export const SCOPE_LABEL: Record<string, string> = { MGMT: '管理群', TENANT: '分站群', DM: '私聊', UNBOUND: '未登记的群' }

export const CONV_STATUS: Record<string, { text: string; tone: Tone }> = {
  ACTIVE: { text: '推送中', tone: 'green' },
  PAUSED: { text: '已暂停', tone: 'amber' },
  UNREACHABLE: { text: '发不出去', tone: 'red' },
  REVOKED: { text: '已解绑', tone: 'gray' },
}

/** 分站自身的状态（渠道 tenants.status） */
export const SITE_STATUS: Record<string, string> = { DRAFT: '筹备中', ACTIVE: '营业中', SUSPENDED: '暂停营业', TERMINATED: '已停业', UNKNOWN: '未知' }

/** 出队消息的状态（bot_outbox.status） */
export const OUTBOX_STATUS: Record<string, { text: string; tone: Tone }> = {
  PENDING: { text: '排队中', tone: 'blue' },
  SENDING: { text: '发送中', tone: 'blue' },
  SENT: { text: '已发出', tone: 'green' },
  FAILED: { text: '发送失败', tone: 'red' },
  EXPIRED: { text: '超时作废', tone: 'amber' },
  CANCELLED: { text: '已作废', tone: 'gray' },
  BLOCKED: { text: '被拦截', tone: 'red' },
  MERGED: { text: '已合并', tone: 'gray' },
}

/** 指令级别（§7.2） */
export const TIER_TEXT: Record<number, string> = {
  0: 'T0 帮助与状态',
  1: 'T1 查数据',
  2: 'T2 改设置与锁定',
  3: 'T3 提卡与补货',
}

/** 指令日志的结果（bot_commands.decision） */
export const DECISION: Record<string, { text: string; tone: Tone }> = {
  IGNORED: { text: '忽略', tone: 'gray' },
  REJECTED: { text: '拒绝', tone: 'amber' },
  OK: { text: '成功', tone: 'green' },
  ERROR: { text: '出错', tone: 'red' },
}

/** 指令日志的原因码（lib/bot/inbound.ts 写的 reason_code）；不认识的原样显示 */
export const REASON_TEXT: Record<string, string> = {
  NOT_ADMIN: '发送人不是管理员',
  UNKNOWN: '没看懂的指令',
  EMPTY: '空消息',
  SCOPE: '这个会话里不能用',
  TIER: '级别不够',
  CONFIG: '配置读取失败',
  DISABLED: '指令已在后台关闭',
  LOCKED: '机器人已锁定',
  NO_T3: '本群未开通提卡补货',
  USAGE: '格式不对',
  EXCEPTION: '执行出错',
  CLAIM_BAD: '认领码不对或已过期',
  CLAIM_TAKEN: '这个微信已属于别的管理员',
  CLAIM_RACE: '认领码刚被用掉',
}

// ───────────────────────── 小组件 ─────────────────────────

export function Badge({ tone = 'gray', className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', TONE_CLS[tone], className)}>{children}</span>
}

const NOTE_CLS: Record<'info' | 'ok' | 'warn' | 'err', string> = {
  info: 'border-blue-100 bg-blue-50 text-blue-800',
  ok: 'border-green-200 bg-green-50 text-green-800',
  warn: 'border-amber-200 bg-amber-50 text-amber-800',
  err: 'border-red-200 bg-red-50 text-red-700',
}

/** 提示框：操作结果、接口报错、风险提示 */
export function Note({ tone = 'info', className, children }: { tone?: 'info' | 'ok' | 'warn' | 'err'; className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-lg border px-3 py-2 text-sm', NOTE_CLS[tone], className)}>{children}</div>
}

/** 一次操作的结果（成功 / 失败的一句话） */
export type Flash = { tone: 'ok' | 'err' | 'warn'; text: string } | null

export function FlashNote({ flash, onClose }: { flash: Flash; onClose?: () => void }) {
  if (!flash) return null
  return (
    <Note tone={flash.tone} className="flex items-start justify-between gap-3">
      <span className="min-w-0 break-words">{flash.text}</span>
      {onClose && (
        <button type="button" onClick={onClose} className="shrink-0 text-xs opacity-60 hover:opacity-100">
          关闭
        </button>
      )}
    </Note>
  )
}

/** 分页条：总数 + 上一页 / 下一页 */
export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize && page <= 1) return <div className="text-xs text-gray-400">共 {total} 条</div>
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
      <span className="text-xs text-gray-400">
        共 {total} 条 · 第 {page} / {pages} 页
      </span>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="inline-flex items-center rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> 上一页
      </button>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="inline-flex items-center rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        下一页 <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export const inputCls =
  'rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-gray-50 disabled:text-gray-400'

/** 表格外壳：手机上横向滚动，不把整页撑宽 */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="-mx-2 overflow-x-auto px-2">{children}</div>
}

export const thCls = 'whitespace-nowrap pb-2 pr-3 text-left text-xs font-medium text-gray-500'
export const tdCls = 'py-2 pr-3 align-top'
