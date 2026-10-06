// 必须 force-dynamic：要连数据库、要按 Host 取店面；构建期被当成静态路由预渲染会触发 Dockerfile 的 PRERENDER_STRICT 硬闸
export const dynamic = 'force-dynamic'

import { absUrl } from '@/lib/news/seo'
import { getStorefront } from '@/lib/storefront/resolve'
import { INDEXING_OPEN } from '@/lib/content/policy'
import { SITEMAP_SEGMENTS, XML_HEADERS, latestLastmod, sitemapIndexXml, sitemapSegmentEntries, urlsetXml } from '@/lib/seo/sitemap-entries'

/**
 * /sitemap.xml = sitemap index（docs/SEO-重构/SEO-重构设计.md §6.2，批 2 的 G 包）。
 *
 * 地址不变（GSC、Bing、百度里已经提交过的就是它），内容从单个 urlset 改成 index，下挂 6 段 /sitemaps/<段名>.xml
 * （core、chongzhi、products、jiema、news-hub、news-events），这样 Search Console 的「网页」报告能按业务线分别看收录。
 * 内容平台的 /sitemap-content.xml 也挂进来（只在收录总开关 INDEXING_OPEN 打开时；robots.txt 里它照旧单列一行）。
 * 某一段当前为空（例如接码灰度期）就不列这一段：列一个空 urlset 没有意义。
 * 每一段的 <lastmod> 取段内最新的真实 lastmod；段内一条 lastmod 都没有就不写。
 *
 * 【渠道站】输出空 urlset，不输出空的 <sitemapindex>（sitemaps.org 的 XSD 规定 sitemapindex 至少一个子项，§6.2）。
 * getStorefront() 不包进 try（靠它转动态，同 robots.ts）。
 */
export async function GET() {
  const sf = await getStorefront()
  if (!sf || sf.kind !== 'PLATFORM') return new Response(urlsetXml([]), { headers: XML_HEADERS })

  const parts = await Promise.all(SITEMAP_SEGMENTS.map(async (seg) => ({ seg, entries: await sitemapSegmentEntries(seg) })))
  const items = parts
    .filter((p) => p.entries.length > 0)
    .map((p) => ({ loc: absUrl(`/sitemaps/${p.seg}.xml`), lastModified: latestLastmod(p.entries) }))
  if (INDEXING_OPEN) items.push({ loc: absUrl('/sitemap-content.xml'), lastModified: undefined })
  return new Response(sitemapIndexXml(items), { headers: XML_HEADERS })
}
