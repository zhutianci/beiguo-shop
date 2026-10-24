/**
 * 买家侧写接口的路由内同源校验（2026-10-24 第二轮加固，docs/安全-第二轮加固-1024.md 2.3）。
 *
 * 【为什么还要这一层】全站 /api 写请求的同源校验以前只在 middleware 里做（lib/api-csrf.ts，2026-10-07），
 * 而 middleware 是不可信的一层（Next 14.2 出过整个绕过的漏洞，CVE-2025-29927）。后台（adminGuard）、渠道后台（partnerRoute）、
 * 论坛、上传、充值、接码早就在路由里自己校验；下单、付款、开票、领券、抽奖、改资料、改绑定这些用登录 cookie 的写接口没有——
 * 一旦 middleware 被绕过，兄弟子域（同行运营的渠道站）的页面发一个 simple POST 就能借访客的登录态生效。
 *
 * 判定与 middleware 逐字相同（apiWriteCrossSite：只管写方法、机器回调豁免、两个浏览器头都没有 = 非浏览器调用放行），
 * 拒绝的响应也相同，所以正常请求的行为不变：middleware 放行的，这里一定放行。
 * 构建检查 scripts/check-tenant-boundary.mjs 规则 20：用登录态的写 handler 必须调用它（或同类校验）。
 */
import { NextResponse } from 'next/server'
import { apiWriteCrossSite } from '../api-csrf'

/** null = 放行；否则直接 return 这个 403 */
export function crossSiteWrite(req: Request): NextResponse | null {
  let pathname = '/'
  try {
    pathname = new URL(req.url).pathname
  } catch {
    /* req.url 总是绝对地址；万一不是，按根路径判（不会落进豁免前缀，更严） */
  }
  const why = apiWriteCrossSite(req.method, pathname, req.headers)
  if (!why) return null
  console.warn('[csrf] 路由内拒绝非同源的写请求:', req.method, pathname, why)
  return NextResponse.json({ success: false, error: '请求来源不合法，请刷新页面后重试' }, { status: 403 })
}
