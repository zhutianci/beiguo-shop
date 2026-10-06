// 内推码客户端工具：从 URL 捕获 ?ref= 并持久化，下单时带上
const KEY = 'ref_code'

export function captureRefFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const ref = new URLSearchParams(window.location.search).get('ref')?.trim()
    if (ref) {
      localStorage.setItem(KEY, ref)
      return ref
    }
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

// 内容带单归因（内容平台 P3）：落地页带 ?from=c{id} 进来时记下内容 id，7 天内下单时随订单上报
const FROM_KEY = 'content_from'
const FROM_TTL = 7 * 86_400_000

export function captureContentFrom(id: number): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(FROM_KEY, JSON.stringify({ id, t: Date.now() }))
  } catch {
    /* 隐私模式拿不到 storage */
  }
}

export function getContentFrom(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const v = JSON.parse(localStorage.getItem(FROM_KEY) || 'null') as { id?: number; t?: number } | null
    return v && Number.isInteger(v.id) && v.id! > 0 && Date.now() - (v.t ?? 0) < FROM_TTL ? v.id! : null
  } catch {
    return null
  }
}

export function getRef(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}
