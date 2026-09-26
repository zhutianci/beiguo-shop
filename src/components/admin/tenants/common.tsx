'use client'

/**
 * 渠道管理后台页面（WP5）共用的小部件：请求封装、金额格式化与解析、状态徽章、弹窗、表单行。
 * 只在客户端用；金额在页面上以「元」输入、以「分」提交（服务端一律按整数分校验）。
 */
import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type ApiResult<T> = { success: true; data: T; message?: string } | { success: false; error: string; reason?: string }

/** 后台接口统一请求：JSON 进出；网络错误也收敛成 { success:false } */
export async function api<T = unknown>(url: string, opts: { method?: string; body?: unknown; form?: FormData } = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: opts.method ?? (opts.body !== undefined || opts.form ? 'POST' : 'GET'),
      headers: opts.form ? undefined : opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
      cache: 'no-store',
    })
    const json = (await res.json().catch(() => null)) as ApiResult<T> | null
    if (!json) return { success: false, error: `请求失败（HTTP ${res.status}）` }
    return json
  } catch {
    return { success: false, error: '网络错误，请重试' }
  }
}

/** 取数 hook：url 变化或 reload() 时重新请求 */
export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!url) return
    let alive = true
    setLoading(true)
    api<T>(url).then((r) => {
      if (!alive) return
      setLoading(false)
      if (r.success) {
        setData(r.data)
        setError(null)
      } else setError(r.error)
    })
    return () => {
      alive = false
    }
  }, [url, tick])
  return { data, error, loading, reload: () => setTick((t) => t + 1) }
}

/** 分 → 「¥1,234.56」；负数带负号 */
export function yuan(cents: number | null | undefined): string {
  if (cents == null || Number.isNaN(cents)) return '—'
  const neg = cents < 0
  const s = (Math.abs(cents) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${neg ? '-' : ''}¥${s}`
}

/** 输入框里的元（最多两位小数）→ 分；空串 → null；非法 → NaN（调用方提示） */
export function parseYuan(input: string): number | null {
  const s = input.trim()
  if (!s) return null
  const m = /^(-)?(\d{1,9})(?:\.(\d{1,2}))?$/.exec(s)
  if (!m) return Number.NaN
  const c = Number(m[2]) * 100 + Number((m[3] || '').padEnd(2, '0'))
  return m[1] ? -c : c
}

export const centsToInput = (c: number | null | undefined) => (c == null ? '' : (c / 100).toFixed(2))

/** bp → 「1.50%」 */
export const pct = (bp: number | null | undefined) => (bp == null ? '—' : `${(bp / 100).toFixed(2)}%`)

export function newRequestId(): string {
  const c = globalThis.crypto as Crypto | undefined
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, '')
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 12)
}

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('zh-CN', { hour12: false })
}

export const STATUS_LABEL: Record<string, string> = { DRAFT: '筹备中', ACTIVE: '营业中', SUSPENDED: '暂停营业', TERMINATED: '已停业' }
const STATUS_TONE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-amber-100 text-amber-800',
  TERMINATED: 'bg-red-100 text-red-700',
}

export function Badge({ children, tone = 'bg-gray-100 text-gray-700' }: { children: ReactNode; tone?: string }) {
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', tone)}>{children}</span>
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status] ?? status}</Badge>
}

export const STATEMENT_STATE_LABEL: Record<string, string> = {
  GENERATED: '已生成',
  CONFIRMED: '渠道已确认',
  DISPUTED: '有异议',
  PAYING: '打款中',
  PAID: '已打款',
  RECEIVED: '已到账',
  RETURNED: '已退回',
}

export const COMPONENT_LABEL: Record<string, string> = {
  SALE: '货款',
  PURCHASE: '进货款',
  INVOICE_SHARE: '发票分成',
  FEE: '手续费（货款）',
  INVOICE_FEE: '手续费（发票分成）',
  LOSS: '售后扣减',
  SHORT: '少付扣减',
  MANUAL: '调整',
  NET: '净额转移',
}
export const TYPE_LABEL: Record<string, string> = {
  ACCRUE: '计提',
  ACCRUE_INV: '发票分成计提',
  RELEASE: '解冻',
  RELEASE_INV: '发票分成解冻',
  REVERSE: '冲销',
  SHORTPAY: '少付',
  ADJUST: '调账',
  STATEMENT: '出结算单',
  PAYOUT: '打款',
  WITHHOLD: '代扣',
  RETURN: '结算单退回',
  REPAY: '渠道回款',
  BOUNCE: '退票',
  WRITEOFF: '核销',
  DEPOSIT_IN: '保证金转入',
  DEPOSIT_APPLY: '保证金抵扣',
  DEPOSIT_REFUND: '保证金退还',
}
export const BUCKET_LABEL: Record<string, string> = { PENDING: '冻结中', AVAILABLE: '可结算', IN_PAYOUT: '结算中', DEPOSIT: '保证金' }

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={cn('max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white p-6 shadow-xl', wide ? 'max-w-5xl' : 'max-w-lg')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  )
}

export const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none'

export function Notice({ kind = 'info', children }: { kind?: 'info' | 'warn' | 'error' | 'ok'; children: ReactNode }) {
  const tone = {
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    warn: 'border-amber-200 bg-amber-50 text-amber-800',
    error: 'border-red-200 bg-red-50 text-red-700',
    ok: 'border-green-200 bg-green-50 text-green-700',
  }[kind]
  return <div className={cn('rounded-lg border px-4 py-3 text-sm', tone)}>{children}</div>
}

/** 渠道子页面顶部的导航条：渠道名 + 详情 / 商品授权 / 账本 / 结算单 */
export function TenantTabs({ id, active, title }: { id: number | string; active: 'detail' | 'listings' | 'ledger' | 'statements'; title?: string }) {
  const tabs: [typeof active, string, string][] = [
    ['detail', '渠道详情', `/admin/tenants/${id}`],
    ['listings', '商品授权与进货价', `/admin/tenants/${id}/listings`],
    ['ledger', '账本与调账', `/admin/tenants/${id}/ledger`],
    ['statements', '结算单与打款', `/admin/tenants/${id}/statements`],
  ]
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Link href="/admin/tenants" className="mr-2 text-sm text-gray-500 hover:text-gray-800">
        ← 渠道列表
      </Link>
      {title && <span className="mr-4 text-base font-semibold text-gray-900">{title}</span>}
      {tabs.map(([k, label, href]) => (
        <Link
          key={k}
          href={href}
          className={cn('rounded-lg px-3 py-1.5 text-sm', k === active ? 'bg-primary-50 font-medium text-primary-700' : 'text-gray-600 hover:bg-gray-100')}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}

/** 三个数一行（余额 / 手续费 / 预计打款） */
export function Triple({ label, t }: { label: string; t: { balanceCents: number; feeCents: number; payoutCents: number } }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className="text-gray-400">余额</div>
          <div className={cn('font-semibold', t.balanceCents < 0 && 'text-red-600')}>{yuan(t.balanceCents)}</div>
        </div>
        <div>
          <div className="text-gray-400">手续费</div>
          <div className="font-semibold">{yuan(t.feeCents)}</div>
        </div>
        <div>
          <div className="text-gray-400">预计打款</div>
          <div className={cn('font-semibold', t.payoutCents < 0 && 'text-red-600')}>{yuan(t.payoutCents)}</div>
        </div>
      </div>
    </div>
  )
}

export function SubmitRow({ onCancel, loading, label = '保存' }: { onCancel: () => void; loading?: boolean; label?: string }) {
  return (
    <div className="flex justify-end gap-3 pt-4">
      <Button variant="outline" type="button" onClick={onCancel}>
        取消
      </Button>
      <Button type="submit" loading={loading}>
        {label}
      </Button>
    </div>
  )
}
