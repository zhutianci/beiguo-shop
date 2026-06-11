'use client'

import { getToken } from '@/lib/auth-token'

// 在客户端模块加载时（早于页面组件的 effect）就给同源 /api 请求自动注入 Authorization: Bearer。
// 这样所有现成的 fetch 调用无需逐个改动，微信内置浏览器丢 cookie 时也能凭 Bearer 头通过鉴权。
if (typeof window !== 'undefined' && !(window as unknown as { __authFetchPatched?: boolean }).__authFetchPatched) {
  ;(window as unknown as { __authFetchPatched?: boolean }).__authFetchPatched = true

  const origFetch = window.fetch.bind(window)

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : (input as Request).url

      const origin = window.location.origin
      const isSameOriginApi =
        url.startsWith('/api') || url.startsWith(`${origin}/api`)

      if (isSameOriginApi) {
        const token = getToken()
        const headers = new Headers(
          init?.headers || (input instanceof Request ? input.headers : undefined)
        )
        if (token && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`)
        }
        init = { ...init, headers, credentials: init?.credentials || 'include' }
      }
    } catch {
      /* 出错则不拦截，按原样发出 */
    }
    return origFetch(input as RequestInfo | URL, init)
  }
}

export function AuthFetchPatch() {
  return null
}
