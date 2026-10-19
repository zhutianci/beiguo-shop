/**
 * 简体 / 繁体（香港）两个站点版本的公共口径（docs/繁体香港版/设计.md）。
 *
 * 【纯函数文件】不 import prisma / next/headers / React：middleware（Edge）、根布局、客户端组件、sitemap 都用这一份，
 * 与 zhhk/proxy.cjs（纯 node，不能 import TS）里的 isPagePath 是同一套规则——改这里要同步改那边（scripts/check-zhhk.ts 有对照断言）。
 *
 * 繁体版不是第二套代码：页面照常用简体写，经 /zh-hk 前缀访问时由 zhhk/proxy.cjs 在输出层逐字转繁体。
 * Next 这一侧只需要知道「这次请求是不是繁体」（请求头 x-bg-lang，由转换代理设置）来做三件事：
 * <html lang>、canonical 前缀（metadataBase）、站内链接带前缀（lib/i18n/link.tsx）。
 */

export type SiteLang = 'zh-CN' | 'zh-HK'

export const LANG_HEADER = 'x-bg-lang'
/** 用户的语言选择（自动识别或手动切换后写入），一年 */
export const LANG_COOKIE = 'bg_lang'
/** 「刚刚按所在地自动切换了」的一次性提示（前台读到就删），两分钟 */
export const LANG_AUTO_COOKIE = 'bg_lang_auto'
/** 横幅模式下「建议切换到某版本」的一次性提示（前台读到就删），两分钟 */
export const LANG_SUGGEST_COOKIE = 'bg_lang_suggest'
/** 切换链接的参数：/x?hl=zh-hk。middleware 收到后写 cookie 并跳到不带参数的地址 */
export const SWITCH_PARAM = 'hl'
/** middleware 发出的语言跳转带这个响应头：转换代理看到它就不再给 Location 补 /zh-hk（否则「切回简体」会被补回繁体） */
export const LANG_REDIRECT_MARK = 'x-bg-lang-redirect'
export const HK_PREFIX = '/zh-hk'

/** 繁体版总开关（运行时读环境变量；未设 = 关，站点行为与改造前完全相同） */
export function zhhkEnabled(): boolean {
  return process.env.ZHHK_ENABLED === '1'
}

/**
 * 首次访问按所在地处理的方式（ZHHK_AUTO_SWITCH，运行时读）：
 *  · redirect（默认，站长 2026-10-19 要求「根据所在地自动切换」）：直接跳到对应版本，顶部提示可一键切回；
 *  · banner：不跳转，只在顶部建议切换（Google 官方更推荐这种：自动跳转可能让用户和爬虫看不到另一个版本）；
 *  · off：不做识别，只认手动切换。
 */
export type AutoSwitchMode = 'redirect' | 'banner' | 'off'
export function autoSwitchMode(): AutoSwitchMode {
  const v = (process.env.ZHHK_AUTO_SWITCH || '').trim().toLowerCase()
  return v === 'banner' || v === 'off' ? v : 'redirect'
}

export function parseLang(v: string | null | undefined): SiteLang {
  return String(v || '').toLowerCase() === 'zh-hk' ? 'zh-HK' : 'zh-CN'
}

/** 不是「页面」的路径：接口、静态资源、后台、带令牌的票据页（这些在繁体版里一律不加前缀，见 proxy.cjs 的 NON_PAGE） */
const NON_PAGE = /^\/(?:api|_next|_next-hk|uploads|zh-hk|admin|partner|receipt|invoice-request|finance|reply|bot|unsubscribe|cdn-cgi)(?:\/|$|\?)/

/** 站内页面路径（可带查询串 / 锚点）是否参与简繁切换 */
export function isLocalizablePath(p: string): boolean {
  if (!p || p[0] !== '/' || p.startsWith('//')) return false
  if (NON_PAGE.test(p)) return false
  const pathOnly = p.split(/[?#]/)[0]
  const last = pathOnly.slice(pathOnly.lastIndexOf('/') + 1)
  return !last.includes('.')
}

export function isHkPath(p: string): boolean {
  return p === HK_PREFIX || p.startsWith(HK_PREFIX + '/') || p.startsWith(HK_PREFIX + '?') || p.startsWith(HK_PREFIX + '#')
}

/** /zh-hk → /，/zh-hk/x → /x；不带前缀的原样返回 */
export function stripHkPrefix(p: string): string {
  if (!isHkPath(p)) return p
  const rest = p.slice(HK_PREFIX.length)
  return rest === '' || rest[0] === '?' || rest[0] === '#' ? '/' + rest : rest
}

/** 页面路径在某个语言版本下的地址（/x → /zh-hk/x；首页 / → /zh-hk/）。非页面路径原样返回 */
export function localizePath(p: string, lang: SiteLang): string {
  const base = stripHkPrefix(p)
  if (lang !== 'zh-HK' || !isLocalizablePath(base)) return base
  return HK_PREFIX + base
}

/** 简繁切换链接：目标语言 + 当前（去前缀的）路径 + ?hl=。用普通 <a>（整页跳转），middleware 负责记住选择 */
export function switchHref(path: string, target: SiteLang): string {
  const base = stripHkPrefix(path.split(/[?#]/)[0] || '/')
  const p = target === 'zh-HK' ? localizePath(base, 'zh-HK') : base
  return `${p}?${SWITCH_PARAM}=${target === 'zh-HK' ? 'zh-hk' : 'zh-cn'}`
}

/**
 * 按访客所在地 / 浏览器语言推断该看哪个版本；没有任何中文信号时返回 null（不跳转）。
 * 浏览器语言优先于 IP：在香港的内地访客（浏览器 zh-CN）看简体，海外的香港人（浏览器 zh-HK）看繁体；
 * 浏览器没有中文（如 en-HK 的香港本地人）才看 IP 所在地。
 * Googlebot 多从美国 IP 抓取、不带中文 Accept-Language → null → 不跳转，两个版本都能被正常抓取。
 */
export function detectPreferredLang(input: { country?: string | null; acceptLanguage?: string | null }): SiteLang | null {
  const tags = String(input.acceptLanguage || '')
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((s) => s.trim()).find((s) => s.startsWith('q='))
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.slice(2)) || 0 : 1, i }
    })
    .filter((t) => t.tag && t.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i)
  const zh = tags.find((t) => t.tag === 'zh' || t.tag.startsWith('zh-'))
  if (zh) {
    if (/^zh-(?:hant|hk|tw|mo)\b/.test(zh.tag)) return 'zh-HK'
    return 'zh-CN'
  }
  const c = String(input.country || '').toUpperCase()
  if (c === 'HK' || c === 'MO' || c === 'TW') return 'zh-HK'
  if (c === 'CN') return 'zh-CN'
  return null
}

/** 搜索引擎与各类抓取器：语言自动跳转一律不对它们做（保证每个地址抓到的就是那个地址本身的版本） */
const CRAWLER_RE =
  /bot\b|bot\/|crawl|spider|slurp|bingpreview|mediapartners|google-inspectiontool|googleother|feedfetcher|lighthouse|chrome-lighthouse|headlesschrome|facebookexternalhit|embedly|quora link preview|whatsapp|telegrambot|python|curl\/|wget|httpclient|java\/|go-http|axios|node-fetch|okhttp|scrapy|petalbot|bytespider|semrush|ahrefs|mj12|dotbot|yandex|baiduspider|sogou|360spider|duckduck/i

export function isCrawler(ua: string | null | undefined): boolean {
  if (!ua) return true // 没有 UA 的请求不是浏览器
  return CRAWLER_RE.test(ua)
}

/** hreflang 组：简体页与繁体页互相声明（zhhk/proxy.cjs 在繁体页 <head> 里输出的是同一组值） */
export const HREFLANG_HANS = ['zh-Hans', 'zh-CN'] as const
export const HREFLANG_HANT = ['zh-Hant', 'zh-HK', 'zh-MO', 'zh-TW'] as const
