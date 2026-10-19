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
        // 繁体香港版（docs/繁体香港版/设计.md §5.3）：繁体页面发出的接口请求带上语言头，nginx 据此交给转换代理，
        // 返回的 JSON（商品名、提示文案……）转成繁体，与页面一致。<html lang> 由根布局按版本输出
        if (document.documentElement.lang === 'zh-HK' && !headers.has('x-bg-lang')) {
          headers.set('x-bg-lang', 'zh-HK')
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
