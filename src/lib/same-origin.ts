/**
 * 同源校验（防「同站 CSRF」，2026-09-25 审计 G09）。纯函数，不 import next/*，方便 scripts/check-* 直接测。
 *
 * 【为什么 SameSite=Lax 不够】
 *  SameSite 按注册域 bigolab.com 判断「同站」：view.bigolab.com（RDViewer，已上线）、将来的
 *  lulu.bigolab.com 发来的请求都算 same-site，Lax cookie 照样带上。兄弟子域只要有一处 XSS /
 *  悬空 DNS 被接管，就能用 `fetch(..., {mode:'no-cors', credentials:'include'})` 或
 *  `<form enctype=text/plain>` 发 simple POST（不触发预检），打 /api/admin/vmq/complete 把自己的
 *  收款单记成已到账、打 referrals/balance 给自己加余额。攻击者读不到响应，但副作用已经发生。
 *
 * 【规则】返回 null = 放行；返回字符串 = 拒绝原因（只写日志，不回给客户端）
 *  1. 有 Origin：hostname 必须是本站（Host / X-Forwarded-Host / NEXT_PUBLIC_APP_URL 之一）。
 *     Origin: null（沙箱 iframe、跨站重定向后的请求）一律拒绝。
 *  2. 有 Sec-Fetch-Site：只认 same-origin 与 none（地址栏直接打开 / 书签）。
 *     same-site 恰恰是本漏洞要挡的兄弟子域，不能放。
 *  3. 两个头都没有：不是现代浏览器发起的（curl、scripts/itest-*、SmsForwarder、cron、服务器回调），放行。
 *     CSRF 只能借受害者的浏览器发起，而浏览器对 POST 一定带 Origin（老 Safari 也带），
 *     现代浏览器还一定带 Sec-Fetch-Site —— 缺头放行不会留下可利用的口子。
 *  1 和 2 同时存在时两条都要过（任一判为跨站就拒），不存在「一个头说同源就放过另一个」的情况。
 *
 * 【只比 hostname、忽略端口和协议】
 *  http 直连 IP、localhost:3000、Cloudflare 隧道后面 Host 与 Origin 端口/协议不一致都很常见，
 *  端口不同会误伤站长自己；而本漏洞的攻击者在「不同子域」，比 hostname 已经足够挡住。
 *  NEXT_PUBLIC_APP_URL 进白名单是兜底隧道改写 Host 的情况（nginx 目前是 proxy_set_header Host $host）。
 *
 * 【调用范围——极易误伤，务必只用在这里列出的地方】
 *  只给「浏览器发起、带登录 cookie、会改状态」的接口用：目前是后台 /api/admin/*（经 adminGuard /
 *  requireAdmin）。绝不能加到收款回调（SmsForwarder / VMQ）、cron、外部发卡 API、退订链接、
 *  快捷回复 / 财务令牌页这类机器调用或跨站跳转进来的接口上。
 *  也不要用在 server component / 页面里：从飞书、企业微信点链接进后台页面时 Sec-Fetch-Site 是 cross-site，会被误拒。
 */

export type HeaderLike = { get(name: string): string | null }

/** 取 hostname（小写）。支持带协议的 URL（Origin / APP_URL）与裸 host[:port]（Host 头）；逗号分隔的取第一个 */
export function hostnameOf(v: string | null | undefined): string | null {
  if (!v) return null
  const first = v.split(',')[0].trim()
  if (!first) return null
  try {
    return new URL(first.includes('://') ? first : `http://${first}`).hostname.toLowerCase() || null
  } catch {
    return null
  }
}

/** 本站认可的 hostname 集合 */
function allowedHosts(h: HeaderLike): Set<string> {
  return new Set(
    [hostnameOf(h.get('host')), hostnameOf(h.get('x-forwarded-host')), hostnameOf(process.env.NEXT_PUBLIC_APP_URL), hostnameOf(process.env.APP_URL)].filter(
      (x): x is string => !!x,
    ),
  )
}

export function crossSiteReason(h: HeaderLike): string | null {
  const origin = h.get('origin')
  if (origin) {
    const o = origin === 'null' ? null : hostnameOf(origin)
    if (!o || !allowedHosts(h).has(o)) return `origin=${origin.slice(0, 100)}`
  }
  const sfs = h.get('sec-fetch-site')
  if (sfs && sfs !== 'same-origin' && sfs !== 'none') return `sec-fetch-site=${sfs.slice(0, 30)}`
  return null
}
