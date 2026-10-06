// 必须 force-dynamic：理由同 /sitemap.xml（连库、按 Host 取店面；不能被构建期预渲染）
export const dynamic = 'force-dynamic'

import { getStorefront } from '@/lib/storefront/resolve'
import { XML_HEADERS, isSitemapSegment, sitemapSegmentEntries, urlsetXml } from '@/lib/seo/sitemap-entries'

/**
 * /sitemaps/<段名>.xml（docs/SEO-重构/SEO-重构设计.md §6.2，批 2 的 G 包）。段名只认白名单（SITEMAP_SEGMENTS），其余 404。
 * 渠道站（以及没有店面的 Host）一律 404：渠道站只有 /sitemap.xml 的空 urlset。getStorefront() 不包进 try。
 * 不用 <news:news> 扩展、也不把任何一段命名为 news sitemap（那等于自证是新闻站，R5 §1.3）：大事记两段叫 news-hub / news-events，
 * 只是「/news 路径下的页面」的意思。
 */
export async function GET(_req: Request, { params }: { params: { name: string } }) {
  const sf = await getStorefront()
  const m = /^([a-z-]+)\.xml$/.exec(params.name || '')
  if (!sf || sf.kind !== 'PLATFORM' || !m || !isSitemapSegment(m[1])) return new Response('Not Found', { status: 404 })
  const entries = await sitemapSegmentEntries(m[1])
  return new Response(urlsetXml(entries), { headers: XML_HEADERS })
}
