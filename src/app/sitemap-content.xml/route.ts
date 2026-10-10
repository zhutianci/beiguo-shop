export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { absUrl } from '@/lib/news/seo'
import { getStorefront } from '@/lib/storefront/resolve'
import { INDEXING_OPEN, contentPath, isHubIndexable, readableLength } from '@/lib/content/policy'
import { PUBLIC_WHERE, contentIndexable, imagesOf } from '@/lib/content/queries'
import { SKILLS_PATH, SKILL_TAG_SLUG, isSkillLibrary } from '@/lib/content/skill-lib'

/**
 * 内容平台的 sitemap（设计 §11.5），与主 sitemap.xml 分开：内容量会长，而且它的收录规则完全不同。
 *
 * 只放 policy 判定「可收录」的地址——页面上的 robots、这里、IndexNow 三处共用同一个判定函数，
 * sitemap 里绝不能出现一个页面自己说 noindex 的 URL。总开关 INDEXING_OPEN 关着时输出空的 urlset。
 * 提示词带 image:image 扩展（效果图是这类页面在 Google 图片里被找到的主要途径，设计 §11.4）。
 * lastmod 取实质修改时间（content_updated_at），没有就取发布时间——不用 updated_at（点赞、浏览都会碰它，是假新鲜度）。
 * 定时放量（10-07）放出的条目发布时间就是放出的那一刻（lib/content/release.ts 把 created_at 改成放出时间），lastmod 自然是放出时间。
 *
 * 【规模】内容扩容后约 2,400 提示词 + 300 教程 + 150 应用：一次查询取齐闸门要的列与标签（不再按 id 列表二次查 post_tags），
 * hub 条数在内存里用 Map 数；正文要参与闸门（可读字数）只能取出来，约几 MB、每小时最多被抓一次（Cache-Control 1 小时）。
 * 协议上限一个 sitemap 50,000 个地址 / 50MB（未压缩）：离上限很远，这里仍设硬上限 MAX_URLS，超了只告警不输出超出的部分；
 * 真到那个量级时改成 sitemap index 分段（sitemap.xml 已经是 index，见 SEO 批 2）。
 */
const MAX_URLS = 45_000
const MAX_BYTES = 45 * 1024 * 1024
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
        take: MAX_URLS,
        select: {
          id: true, type: true, slug: true, status: true, reviewStatus: true, deletedAt: true, userId: true, content: true,
          originality: true, aiAssist: true, commentCount: true, images: true, testedOn: true, checkedOn: true, featured: true,
          createdAt: true, contentUpdatedAt: true,
          prompt: { select: { prompt: true } },
          app: { select: { selfPromo: true } },
          postTags: { select: { tagId: true, tag: { select: { slug: true, kind: true, status: true, facet: true } } } },
        },
      })
      const indexable = posts.filter((p) => contentIndexable(p))
      // Skill 库（2026-10-10）：挂了 agent-skills 标签、非自荐的应用。它们列在 /skills，不列在 /apps（与两个页面自己的取数口径一致）
      const isSkill = (p: (typeof posts)[number]) =>
        isSkillLibrary({ type: p.type, selfPromo: !!p.app?.selfPromo, tagSlugs: p.postTags.filter((pt) => pt.tag.status === 1).map((pt) => pt.tag.slug) })
      for (const p of indexable) {
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
      // 每个标签在它那一栏（产品 → 教程，模型 / 主题 → 提示词）里有几条可收录的
      const perTag = new Map<string, number>()
      for (const p of indexable) for (const pt of p.postTags) perTag.set(`${pt.tagId}:${p.type}`, (perTag.get(`${pt.tagId}:${p.type}`) ?? 0) + 1)
      for (const t of tags) {
        // 「Skill 库」标签的聚合页是 /skills（下面单独判），/prompts/t/agent-skills 是 308，不进 sitemap
        if (t.slug === SKILL_TAG_SLUG) continue
        const sectionType = t.kind === 'PRODUCT' ? 'GUIDE' : 'PROMPT'
        const n = perTag.get(`${t.id}:${sectionType}`) ?? 0
        if (!isHubIndexable(t.kind, readableLength(t.intro ?? ''), n)) continue
        const path = t.kind === 'MODEL' ? `/prompts/m/${t.slug}` : t.kind === 'TOPIC' ? `/prompts/t/${t.slug}` : `/guides/p/${t.slug}`
        entries.push(`<url><loc>${xmlEscape(absUrl(path))}</loc></url>`)
      }
      for (const [type, path] of [['PROMPT', '/prompts'], ['GUIDE', '/guides'], ['APP', '/apps']] as const) {
        // /apps 总览只列普通分享：不含作者自荐（在 /apps/showcase，不收录）、不含 Skill 库——与页面自己的 robots 判定同一批条目
        const n = indexable.filter((p) => p.type === type && (type !== 'APP' || (!p.app?.selfPromo && !isSkill(p)))).length
        if (isHubIndexable('ROOT', 0, n)) entries.push(`<url><loc>${xmlEscape(absUrl(path))}</loc></url>`)
      }
      // Skill 库目录：同一个 ROOT 门槛（可收录的库够数才进 sitemap；不够时页面自己是 noindex,follow）
      if (isHubIndexable('ROOT', 0, indexable.filter(isSkill).length)) entries.push(`<url><loc>${xmlEscape(absUrl(SKILLS_PATH))}</loc></url>`)
      // 提示词三大类页（/prompts/image|video|text）：与总览同一门槛
      for (const f of ['IMAGE', 'VIDEO', 'TEXT'] as const) {
        const n = indexable.filter((p) => p.type === 'PROMPT' && p.postTags.some((pt) => pt.tag.kind === 'MODEL' && pt.tag.facet === f)).length
        if (isHubIndexable('ROOT', 0, n)) entries.push(`<url><loc>${xmlEscape(absUrl(`/prompts/${f.toLowerCase()}`))}</loc></url>`)
      }
      // 学习平台首页：与 /learn 页面自己的判定一致（提示词 + 教程合计够数）
      const learnN = indexable.filter((p) => p.type === 'PROMPT' || p.type === 'GUIDE').length
      if (isHubIndexable('ROOT', 0, learnN)) entries.push(`<url><loc>${xmlEscape(absUrl('/learn'))}</loc></url>`)
    } catch (e) {
      // 库挂了就给空 sitemap，不给 500（爬虫对 500 的 sitemap 会降低抓取频率）
      console.error('[sitemap-content]', e)
    }
  }

  if (entries.length > MAX_URLS) {
    console.warn(`[sitemap-content] ${entries.length} 个地址超过 ${MAX_URLS}，只输出前 ${MAX_URLS} 个：该改成分段 sitemap 了`)
    entries.length = MAX_URLS
  }
  const body = `${head}\n${entries.join('\n')}\n</urlset>\n`
  if (body.length > MAX_BYTES) console.warn(`[sitemap-content] 约 ${Math.round(body.length / 1048576)}MB，接近协议上限 50MB：该改成分段 sitemap 了`)
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
