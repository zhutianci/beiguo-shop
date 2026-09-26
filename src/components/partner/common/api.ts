/**
 * 渠道后台前端调用 /api/partner/* 的唯一入口（WP6；WP7 复用）。
 *
 *  · 写请求一律 JSON（服务端同源校验要求带请求体的写请求是 application/json）；
 *  · 只发同源相对地址，credentials: 'same-origin'（cookie 只在本渠道 Host 上，不跨子域）；
 *  · 统一返回 { ok, status, data | error }，页面不直接碰 Response；401 时给调用方 needLogin=true，由页面决定跳登录。
 */

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; reason?: string; needLogin: boolean }

export async function partnerApi<T = unknown>(url: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<ApiResult<T>> {
  if (!url.startsWith('/api/')) throw new Error('partnerApi 只能调用同源 /api 接口')
  const method = (init.method || 'GET').toUpperCase()
  const headers: Record<string, string> = { Accept: 'application/json' }
  let body: string | undefined
  if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(init.body)
  }
  let res: Response
  try {
    res = await fetch(url, { method, headers, body, credentials: 'same-origin', cache: 'no-store', signal: init.signal })
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') throw e
    return { ok: false, status: 0, error: '网络异常，请稍后重试', needLogin: false }
  }
  if (res.status === 204) return { ok: true, status: 204, data: null as T }
  let json: { success?: boolean; data?: T; error?: string; reason?: string } | null = null
  try {
    json = await res.json()
  } catch {
    json = null
  }
  if (res.ok && json && json.success !== false) return { ok: true, status: res.status, data: (json.data ?? null) as T }
  const fallback =
    res.status === 404 ? '内容不存在或无权访问' : res.status === 429 ? '操作过于频繁，请稍后再试' : res.status === 401 ? '请先登录' : '操作失败，请稍后重试'
  return { ok: false, status: res.status, error: json?.error || fallback, reason: json?.reason, needLogin: res.status === 401 }
}

/** 把筛选对象拼成查询串（空值不带） */
export function qs(params: Record<string, string | number | null | undefined>): string {
  const sp = new URLSearchParams()
  Object.keys(params).forEach((k) => {
    const v = params[k]
    if (v === null || v === undefined || v === '') return
    sp.set(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

/** 未登录时跳渠道登录页，并带上回跳地址（只允许回到 /partner 下） */
export function gotoLogin(): void {
  if (typeof window === 'undefined') return
  const next = window.location.pathname + window.location.search
  window.location.href = `/partner/login?next=${encodeURIComponent(next.startsWith('/partner') ? next : '/partner')}`
}
