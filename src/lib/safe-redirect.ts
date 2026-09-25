/**
 * 登录后回跳地址白名单：只收站内相对路径，其余一律回落 fallback。
 *
 * 【为什么】Next 14.2.3 的 router.push 把 origin 不同的 URL（包括 origin 为 'null' 的 javascript:）
 * 当外链直接 location.assign：/login?redirect=//evil.com 是开放重定向，
 * /login?redirect=javascript:... 则是在本站 origin 上执行脚本（登录 token 还在 localStorage 里）。
 * 以后凡是读 redirect / next / returnTo 参数的地方都复用这个函数。
 *
 * 纯函数，不依赖 window：SSR 与客户端都能用。
 */
const PARSE_BASE = 'http://same-origin.invalid'

export function safeRedirect(raw: string | null | undefined, fallback = '/'): string {
  if (!raw) return fallback
  // 必须以单个 '/' 开头；拒绝 '//x'（协议相对）和 '/\x'（浏览器把 \ 当 /）
  if (raw[0] !== '/' || raw[1] === '/' || raw[1] === '\\') return fallback
  // 控制字符（\t \n \r 会被 URL 解析器剥掉，可能拼出 '//'）一律拒绝
  if (/[\u0000-\u001f\u007f]/.test(raw)) return fallback
  try {
    const u = new URL(raw, PARSE_BASE)
    if (u.origin !== PARSE_BASE) return fallback // 兜底：解析后跑出本源的都拒绝
    const out = u.pathname + u.search + u.hash
    if (out === '/login' || out.startsWith('/login?')) return fallback // 避免登录完又回到登录页
    return out
  } catch {
    return fallback
  }
}
