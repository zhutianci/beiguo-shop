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

export function getRef(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}
