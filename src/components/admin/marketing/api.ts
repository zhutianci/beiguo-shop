/**
 * 营销后台页面共用的小工具：请求封装、格式化、北京时间输入框换算。
 *
 * 【只给浏览器用】这里只 import 同构模块（types / time），不许碰 prisma 或任何 server-only 的东西 ——
 * 后台页面全是 'use client'，引进服务端模块会把整个 Prisma 客户端打进浏览器包。
 */
import { bjDateTime, bjMinuteString } from '@/lib/marketing/time'

/* ============================== 请求 ============================== */

export interface ApiResult<T> {
  ok: boolean
  status: number
  data: T | null
  error: string | null
  message: string | null
}

export function isAbortError(e: unknown): boolean {
  return (e as { name?: string } | null)?.name === 'AbortError'
}

/**
 * 统一的后台接口调用。接口约定信封 {success, data?, error?, message?}。
 *
 * 【为什么要自己兜 JSON 解析】网关超时、进程重启时 nginx 会回一页 HTML，直接 res.json() 会抛
 * 「Unexpected token <」，界面上就只剩一句看不懂的报错。这里把它翻成「服务器返回异常（HTTP 502）」。
 * AbortError 原样抛出，由调用方按竞态规则静默丢弃。
 */
export async function mktFetch<T>(
  url: string,
  init: { method?: string; body?: unknown; signal?: AbortSignal } = {}
): Promise<ApiResult<T>> {
  const hasBody = init.body !== undefined
  let res: Response
  try {
    res = await fetch(url, {
      method: init.method || (hasBody ? 'POST' : 'GET'),
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(init.body) : undefined,
      signal: init.signal,
      cache: 'no-store',
    })
  } catch (e) {
    if (isAbortError(e)) throw e
    return { ok: false, status: 0, data: null, error: '网络错误，请检查网络后重试', message: null }
  }
  let json: { success?: boolean; data?: T; error?: string; message?: string } | null = null
  try {
    json = await res.json()
  } catch (e) {
    if (isAbortError(e)) throw e
    json = null
  }
  if (!json || typeof json !== 'object') {
    return { ok: false, status: res.status, data: null, error: `服务器返回异常（HTTP ${res.status}）`, message: null }
  }
  const ok = res.ok && json.success === true
  return {
    ok,
    status: res.status,
    data: (json.data ?? null) as T | null,
    error: ok ? null : json.error || `操作失败（HTTP ${res.status}）`,
    message: json.message ?? null,
  }
}

/* ============================== 格式化 ============================== */

/** 北京时间「2026-10-07 14:05」；空值显示「—」。与进程/浏览器时区无关 */
export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return bjDateTime(d)
}

/** 只要月-日 时:分（表格里省地方） */
export function fmtShortTime(iso: string | null | undefined): string {
  const s = fmtTime(iso)
  return s === '—' ? s : s.slice(5)
}

export function fmtMoney(v: string | number | null | undefined): string {
  const n = Number(v || 0)
  return `¥${(Number.isFinite(n) ? n : 0).toFixed(2)}`
}

export function fmtInt(v: number | null | undefined): string {
  return Number(v || 0).toLocaleString('zh-CN')
}

/** 比率（0–1）→「12.3%」；null/非数 → 「—」 */
export function fmtPct(v: number | null | undefined, digits = 1): string {
  if (v == null || !Number.isFinite(v)) return '—'
  return `${(v * 100).toFixed(digits)}%`
}

/** a/b，分母为 0 时返回 null（界面显示「—」而不是 NaN% 或 0%） */
export function ratio(a: number, b: number): number | null {
  return b > 0 ? a / b : null
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  return `${(n / 1024).toFixed(1)} KB`
}

/* ============================== 北京时间输入框 ============================== */

/**
 * <input type="datetime-local"> 的值一律按「北京时间」解释。
 *
 * 【为什么不用 new Date(value)】那样会按浏览器所在时区解析：站长出差到别的时区、或者电脑时区设错，
 * 定时发送就会整体偏几个小时。营销模块所有「几点发」都以北京时间为准（与发送时段、每日额度同口径）。
 */
export function parseBjLocalInput(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || '')
  if (!m) return null
  const [, y, mo, d, h, mi] = Array.from(m, Number)
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null
  const t = Date.UTC(y, mo - 1, d, h, mi) - 8 * 3600_000
  const out = new Date(t)
  return Number.isNaN(out.getTime()) ? null : out
}

/** Date → datetime-local 的值（北京时间） */
export function toBjLocalInput(d: Date): string {
  return bjMinuteString(d).replace(' ', 'T')
}
