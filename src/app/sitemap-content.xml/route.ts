export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { absUrl } from '@/lib/news/seo'
import { getStorefront } from '@/lib/storefront/resolve'
import { INDEXING_OPEN, contentPath, isHubIndexable, readableLength } from '@/lib/content/policy'
import { PUBLIC_WHERE, contentIndexable, imagesOf } from '@/lib/content/queries'

/**
 * 内容平台的 sitemap（设计 §11.5），与主 sitemap.xml 分开：内容量会长，而且它的收录规则完全不同。
 *
 * 只放 policy 判定「可收录」的地址——页面上的 robots、这里、IndexNow 三处共用同一个判定函数，
 * sitemap 里绝不能出现一个页面自己说 noindex 的 URL。总开关 INDEXING_OPEN 关着时输出空的 urlset。
 * 提示词带 image:image 扩展（效果图是这类页面在 Google 图片里被找到的主要途径，设计 §11.4）。
 * lastmod 取实质修改时间（content_updated_at），没有就取发布时间——不用 updated_at（点赞、浏览都会碰它，是假新鲜度）。
 */
function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export async function GET() {
  const head = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
  const entries: string[] = []

  // 渠道站（以及没有店面的 Host）不输出任何地址（同 sitemap.ts，设计 4.8）。不包进 try
  const sf = await getStorefront()
  if (sf && sf.kind === 'PLATFORM' && INDEXING_OPEN) {
    try {
      const posts = await prisma.forumPost.findMany({
        where: { ...PUBLIC_WHERE, originality: 'ORIGINAL_FIRST' },
        orderBy: { id: 'desc' },
        take: 20000,
        include: { prompt: { select: { prompt: true } }, postTags: { select: { tag: { select: { kind: true, status: true } } } } },
      })
      for (const p of posts) {
        if (!contentIndexable(p)) continue
        const lastmod = (p.contentUpdatedAt ?? p.createdAt).toISOString()
        const images = p.type === 'PROMPT' ? imagesOf(p).slice(0, 9) : []
        entries.push(
          `<url><loc>${xmlEscape(absUrl(contentPath(p.type, p.id, p.slug)))}</loc><lastmod>${lastmod}</lastmod>` +
            images.map((u) => `<image:image><image:loc>${xmlEscape(absUrl(u))}</image:loc></image:image>`).join('') +
            '</url>',
        )
      }

      // hub 页：同一个门槛（介绍够长、可收录条目够数）
      const tags = await prisma.tag.findMany({ where: { status: 1 }, select: { id: true, slug: true, kind: true, intro: true } })
      const indexableIds = new Set(posts.filter((p) => contentIndexable(p)).map((p) => p.id))
      const links = await prisma.postTag.findMany({ where: { postId: { in: Array.from(indexableIds) } }, select: { tagId: true, post: { select: { type: true } } } })
      for (const t of tags) {
        const sectionType = t.kind === 'PRODUCT' ? 'GUIDE' : 'PROMPT'
        const n = links.filter((l) => l.tagId === t.id && l.post.type === sectionType).length
        if (!isHubIndexable(t.kind, readableLength(t.intro ?? ''), n)) continue
        const path = t.kind === 'MODEL' ? `/prompts/m/${t.slug}` : t.kind === 'TOPIC' ? `/prompts/t/${t.slug}` : `/guides/p/${t.slug}`
        entries.push(`<url><loc>${xmlEscape(absUrl(path))}</loc></url>`)
      }
      for (const [type, path] of [['PROMPT', '/prompts'], ['GUIDE', '/guides']] as const) {
        const n = posts.filter((p) => p.type === type && indexableIds.has(p.id)).length
        if (isHubIndexable('ROOT', 0, n)) entries.push(`<url><loc>${xmlEscape(absUrl(path))}</loc></url>`)
      }
    } catch (e) {
      // 库挂了就给空 sitemap，不给 500（爬虫对 500 的 sitemap 会降低抓取频率）
      console.error('[sitemap-content]', e)
    }
  }

  return new Response(`${head}\n${entries.join('\n')}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
