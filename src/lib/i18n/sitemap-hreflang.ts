import { HK_PREFIX, HREFLANG_HANS, HREFLANG_HANT, isLocalizablePath, zhhkEnabled } from './lang'
// 与 zhhk/proxy.cjs 共用的收录范围（名单外的繁体页是 noindex，站点地图里就不能给它写 hreflang，否则互指指向一个不收录的页面）
import policy from '../../../zhhk/policy.json'

const INDEX_EXACT = new Set<string>(policy.indexExact)
export function hkIndexable(path: string): boolean {
  const p = path.split(/[?#]/)[0] || '/'
  return INDEX_EXACT.has(p) || policy.indexPrefixes.some((x) => p.startsWith(x))
}

/**
 * 站点地图里的简繁互指（docs/繁体香港版/设计.md §7.2）。
 *
 * 简体页面不经过转换代理，<head> 里没有 hreflang；Google 支持「只在站点地图里声明 hreflang」，所以简体侧靠这里：
 * 每个页面地址展开成两条 <url>（简体 + 繁体），两条各带同一组 xhtml:link（含自身、x-default 指简体）。
 * 繁体页 <head> 里转换代理输出的是同一组值（zhhk/proxy.cjs 的 processHead），两处一致。
 *
 * 纯字符串处理：两个 sitemap 路由（分段 sitemap、内容平台 sitemap）序列化完之后套一层，条目怎么选完全不动。
 * 总开关没开时原样返回。
 */
function unescapeXml(s: string): string {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
}
function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export function hantUrl(hansUrl: string): string | null {
  try {
    const u = new URL(hansUrl)
    if (!isLocalizablePath(u.pathname) || !hkIndexable(u.pathname)) return null
    return u.origin + HK_PREFIX + u.pathname + u.search
  } catch {
    return null
  }
}

export function withHreflang(xml: string): string {
  if (!zhhkEnabled()) return xml
  let touched = false
  const out = xml.replace(/<url><loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/g, (m, locEsc: string, rest: string) => {
    const hans = unescapeXml(locEsc)
    const hant = hantUrl(hans)
    if (!hant) return m
    touched = true
    const link = (lang: string, href: string) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(href)}"/>`
    const links =
      HREFLANG_HANS.map((l) => link(l, hans)).join('') +
      HREFLANG_HANT.map((l) => link(l, hant)).join('') +
      link('x-default', hans)
    return `<url><loc>${locEsc}</loc>${rest}${links}</url>\n<url><loc>${escapeXml(hant)}</loc>${rest}${links}</url>`
  })
  return touched ? out.replace('<urlset ', '<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml" ') : out
}
