// 客户端 token 兜底存储。
// 微信内置浏览器（尤其 iOS WKWebView）经常不持久化 fetch 响应里下发的 httpOnly cookie，
// 导致页面看起来已登录（localStorage 在），但接口拿不到 cookie → 一支付就弹登录。
// 这里把登录返回的 token 也存一份到 localStorage，配合全局 fetch 拦截以 Authorization 头携带，
// 服务端 cookie 或 Bearer 任一通过即可。普通浏览器仍走 cookie，互不影响。
const TOKEN_KEY = 'auth-token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* 隐私模式等可能抛错，忽略 */
  }
}

export function clearToken() {
  setToken(null)
}
