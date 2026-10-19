import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  LANG_AUTO_COOKIE,
  LANG_COOKIE,
  LANG_HEADER,
  LANG_REDIRECT_MARK,
  LANG_SUGGEST_COOKIE,
  autoSwitchMode,
  SWITCH_PARAM,
  detectPreferredLang,
  isCrawler,
  isLocalizablePath,
  localizePath,
  parseLang,
  type SiteLang,
} from './lang'

/**
 * 页面请求的简繁处理（middleware 调用；Edge 安全：只 import 纯函数）。docs/繁体香港版/设计.md §6。
 *
 * 当前地址是哪个版本：转换代理（zhhk/proxy.cjs）处理 /zh-hk/… 时去掉前缀并加 x-bg-lang: zh-HK，所以这里看请求头。
 * 规则按顺序：
 *  1. ?hl=zh-hk / ?hl=zh-cn（切换链接）：记住选择（爬虫不写 cookie），302 到目标版本、去掉参数的地址；
 *  2. 已有选择（cookie）且与当前版本不同：跳到选择的版本（文档请求与客户端导航的 RSC 请求都跳；RSC 用 307，fetch 跟随跳转后
 *     Next 的路由按最终地址更新地址栏——next/dist/client/components/router-reducer/fetch-server-response.js 的 res.redirected）；
 *  3. 没有选择、文档请求：按浏览器语言 / IP 所在地推断，与当前版本不同就跳，并留一次性提示 cookie；相同就把当前版本记下。
 * 爬虫只走第 1 条的「去参数跳转」，不写 cookie、不按所在地跳——每个地址给爬虫的就是它本身那个版本。
 * 返回 null = 不处理（放行）。
 */
export function langMiddleware(request: NextRequest): NextResponse | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null
  const { pathname, searchParams } = request.nextUrl
  if (!isLocalizablePath(pathname)) return null

  const current: SiteLang = parseLang(request.headers.get(LANG_HEADER))
  const crawler = isCrawler(request.headers.get('user-agent'))
  // 整页（文档）请求。客户端导航的 RSC 请求在 middleware 里看不出来——Next 进 middleware 前会删掉 RSC 请求头与 _rsc 参数
  // （next/dist/esm/server/web/adapter.js 的 FLIGHT_PARAMETERS）——只能反过来认文档请求：浏览器整页打开时 sec-fetch-dest=document；
  // 老浏览器没有这个头时看 Accept 里有没有 text/html（fetch 发的是 */*）
  const dest = request.headers.get('sec-fetch-dest')
  const isDocument = dest ? dest === 'document' : (request.headers.get('accept') || '').includes('text/html')

  const target = (lang: SiteLang, dropSwitch: boolean) => {
    const params = new URLSearchParams(searchParams)
    if (dropSwitch) params.delete(SWITCH_PARAM)
    const q = params.toString()
    return localizePath(pathname, lang) + (q ? `?${q}` : '')
  }
  const redirect = (location: string, cookies: [string, string, number][]) => {
    // Next 的 middleware 适配层要求 Location 是绝对地址（相对地址会抛 Invalid URL）；拼在 request.url 上——
    // standalone 下它的主机是 0.0.0.0:3000，但与请求同源的 Location 会被 Next 的路由层改回相对地址再发出去
    // （next/dist/server/lib/router-utils/resolve-routes.js 的 getRelativeURL），浏览器看到的仍是相对跳转
    const res = new NextResponse(null, {
      status: isDocument ? 302 : 307,
      headers: {
        Location: new URL(location, request.url).toString(),
        'Cache-Control': 'private, no-store',
        [LANG_REDIRECT_MARK]: '1',
      },
    })
    for (const [name, value, maxAge] of cookies) setLangCookie(res, request, name, value, maxAge)
    return res
  }

  // 1. 切换链接
  const sw = searchParams.get(SWITCH_PARAM)
  if (sw !== null) {
    const chosen = parseLang(sw)
    return redirect(target(chosen, true), crawler ? [] : [[LANG_COOKIE, chosen, 365 * 86400]])
  }
  if (crawler) return null

  // 2. 已有选择
  const saved = request.cookies.get(LANG_COOKIE)?.value
  if (saved) {
    const pref = parseLang(saved)
    if (pref !== current) return redirect(target(pref, false), [])
    return null
  }

  // 3. 首次访问：只对整页（文档）请求做识别
  if (!isDocument) return null
  const mode = autoSwitchMode()
  const detected =
    mode === 'off'
      ? null
      : detectPreferredLang({
          country: request.headers.get('cf-ipcountry'),
          acceptLanguage: request.headers.get('accept-language'),
        })
  if (detected && detected !== current && mode === 'redirect') {
    return redirect(target(detected, false), [
      [LANG_COOKIE, detected, 365 * 86400],
      [LANG_AUTO_COOKIE, detected, 120],
    ])
  }
  // 不跳转：记下当前版本（之后站内导航按它走）；横幅模式另留一次性的「建议切换」提示
  const res = NextResponse.next()
  setLangCookie(res, request, LANG_COOKIE, current, 365 * 86400)
  if (detected && detected !== current) setLangCookie(res, request, LANG_SUGGEST_COOKIE, detected, 120)
  return res
}

function setLangCookie(res: NextResponse, request: NextRequest, name: string, value: string, maxAge: number) {
  const https = request.headers.get('x-forwarded-proto') === 'https' || request.nextUrl.protocol === 'https:'
  // 不设 httpOnly：前台的自动切换提示要读、读完要删；内容只是语言代码
  res.cookies.set(name, value, { path: '/', maxAge, sameSite: 'lax', secure: https })
}
