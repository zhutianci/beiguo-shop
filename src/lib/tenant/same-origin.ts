/**
 * 渠道后台写接口的同源校验（设计 4.6 C4）。比 src/lib/same-origin.ts（超管侧）更严，原因是渠道 Host 与主站是兄弟子域：
 *
 *  · 超管侧的 crossSiteReason 把 NEXT_PUBLIC_APP_URL（bigolab.com）和 X-Forwarded-Host 也算「本站」。放到渠道 Host 上，
 *    这等于允许 bigolab.com 页面向 lulu.bigolab.com/api/partner/* 发 simple POST——两者同站（same-site），
 *    Lax cookie 照样带上。主站任何一处 XSS 就能以渠道主身份改价、拉黑、申请结算。
 *  · 所以这里只认「Origin 的 hostname 与本请求 Host 完全相同」，Sec-Fetch-Site 只认 same-origin（写请求不存在合法的 none）。
 *  · 写请求带了请求体时必须是 JSON（application/json）：`<form enctype=text/plain>` 与 `no-cors` fetch 发不出 JSON 类型，
 *    这是 Origin 之外的第二道。无请求体的写请求（如 POST …/read）不要求 Content-Type。
 *  · 两个头都没有：不是浏览器发起的（curl、itest、服务器调用）。CSRF 只能借受害者浏览器发起，而浏览器对 POST 一定带 Origin，
 *    现代浏览器一定带 Sec-Fetch-Site，缺头放行不留可利用的口子（与超管侧同一论证）。
 *
 * 只比 hostname、忽略端口与协议（与超管侧一致：Cloudflare 隧道后面端口 / 协议经常不一致）。
 */
import { headers } from 'next/headers'
import { crossSiteReason } from '../same-origin'
import { normalizeHost } from '../storefront/hosts'

type HeaderLike = { get(name: string): string | null }

function originHostname(origin: string): string | null {
  if (origin === 'null') return null
  try {
    return normalizeHost(new URL(origin).host)
  } catch {
    return null
  }
}

/** 纯函数版本（方便 scripts/check-* 直接测）：返回 null = 同源放行；字符串 = 拒绝原因（只写日志） */
export function crossOriginReason(h: HeaderLike, method: string, hasBody: boolean): string | null {
  const host = normalizeHost(h.get('host'))
  const origin = h.get('origin')
  if (origin) {
    const o = originHostname(origin)
    if (!o || !host || o !== host) return `origin=${origin.slice(0, 100)}`
  }
  const sfs = h.get('sec-fetch-site')
  if (sfs && sfs !== 'same-origin') return `sec-fetch-site=${sfs.slice(0, 30)}`
  const m = method.toUpperCase()
  const isWrite = m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS'
  if (isWrite && hasBody) {
    const ct = (h.get('content-type') || '').toLowerCase()
    // multipart 留给将来的上传接口（渠道 P0 没有上传入口）；其余一律要求 JSON
    if (!ct.startsWith('application/json') && !ct.startsWith('multipart/form-data')) return `content-type=${ct.slice(0, 60) || '(none)'}`
  }
  return null
}

/**
 * 按 HTTP 语义判断有没有请求体（RFC 9112 6.3：请求既无 Content-Length 也无 Transfer-Encoding 就没有消息体）。
 * 不能看 req.body：Next 给不带体的 DELETE 也挂了一个空的 body 流，原来「有流又没 Content-Length 就当 chunked」
 * 会把裸 DELETE（/api/partner/settings/contact-qr）当成带体、再因缺 Content-Type 拒成 404（终审 2026-09-26）。
 * 真带体的请求一定带这两个头之一（浏览器 fetch / 表单都会带），Content-Type 校验照旧生效；
 * 何况跨站请求在前面的 Origin / Sec-Fetch-Site 两道就已经拦下，这里只是第二道。
 */
export function hasBodyByHeaders(h: HeaderLike): boolean {
  const len = h.get('content-length')
  if (len !== null && len.trim() !== '' && len.trim() !== '0') return true
  return h.get('transfer-encoding') !== null
}

function requestHasBody(req: Request): boolean {
  return hasBodyByHeaders(req.headers)
}

export function isSameOrigin(req: Request): boolean {
  const reason = crossOriginReason(req.headers, req.method, requestHasBody(req))
  if (reason) console.warn('[partner] 拒绝非同源请求:', reason)
  return reason === null
}

/**
 * auth 写接口（login / register / send-code / reset-password / logout）的同源校验（设计 4.6 C4「auth 路由由本项目实现」；
 * 集成阶段补，WP8 跨租户扫描 T7 发现缺失）。兄弟子域页面可以对渠道站（或主站）发 simple POST 做登录 CSRF——
 * 把受害者登进攻击者的账号，之后受害者下的单、填的开票信息都落在攻击者账号里。
 *  · 渠道店面：与 partnerRoute 同一套严格规则（Origin 必须与 Host 完全相同、Sec-Fetch-Site 只认 same-origin、带体写请求须 JSON）；
 *  · 平台店面（含休眠期任何 Host）：超管侧的 crossSiteReason（认 Host / APP_URL，Sec-Fetch-Site 认 same-origin 与 none）。
 *    主站自己的页面发起的请求都是同源，行为不变；缺 Origin 与 Sec-Fetch-Site 的非浏览器请求（itest、curl）照常放行。
 * 返回 null = 放行；字符串 = 拒绝原因（只写日志，不回给客户端）。
 */
export function authCrossSiteReason(req: Request, kind: 'PLATFORM' | 'CHANNEL'): string | null {
  const reason = kind === 'CHANNEL' ? crossOriginReason(req.headers, req.method, requestHasBody(req)) : crossSiteReason(req.headers)
  if (reason) console.warn(`[auth] 拒绝非同源写请求（${kind}）:`, reason)
  return reason
}

/**
 * Server Component / Server Action 里用（拿不到 Request 对象时）。headers() 不带方法与请求体信息，
 * 所以只校验 Origin 与 Sec-Fetch-Site 两条。不要在 try 里调用（headers() 在构建期抛 DynamicServerError）。
 */
export function isSameOriginFromHeaders(): boolean {
  return crossOriginReason(headers(), 'GET', false) === null
}
