/**
 * SEO 装配：绝对地址 + Article JSON-LD。
 *
 * 【与 format.ts 的分工】站点地址与分类底图的取法已经在 `lib/news/format.ts` 里
 * （siteOrigin / ogImageForCategory），这里直接复用，不另起一套——
 * 两处各写一份「站点根地址」的取法，迟早会在换域名时漏改一处。
 *
 * 【JSON-LD 用 Article，不用 NewsArticle】这不是风格问题，是法律定性问题：
 * 我们刻意不让内容落入《互联网新闻信息服务管理规定》第二条的「新闻信息」定义
 * （SKILL.md §1）。结构化数据里自称 NewsArticle，等于对搜索引擎书面自证在做
 * 新闻信息服务，是最容易被引用的一份不利证据。Article 一样能拿富摘要，没有损失。
 *
 * 【author 用组织不用真人】固定为 constants.ts 的 AUTHOR_NAME，类型 Organization。
 * 署真人名等于自证在做采编发布（SKILL.md §1.1）。
 */
import { AI_DISCLAIMER, AUTHOR_NAME, categoryLabel } from './constants'
import { ogImageForCategory, siteOrigin } from './format'

/** 方形站标：favicon / JSON-LD publisher.logo。由 scripts/gen-og-image.js 离线生成 */
export const SITE_LOGO = '/logo-square.png'
/** 站点默认分享底图，也是 ogImageForCategory 的兜底 */
export const OG_DEFAULT = '/og-default.png'

/** 拼绝对地址（传入以 / 开头的路径）。og:image / og:url 都不接受相对路径 */
export function absUrl(path: string): string {
  return `${siteOrigin()}${path.startsWith('/') ? path : `/${path}`}`
}

export function newsUrl(slug: string): string {
  return absUrl(`/news/${slug}`)
}

export interface JsonLdSource {
  title: string
  url: string
  sourceName: string
}

export interface ArticleJsonLdInput {
  slug: string
  headline: string
  summary?: string | null
  category?: string | null
  tags?: string[] | string | null
  happenedAt?: Date | string | null
  updatedAt?: Date | string | null
  sources?: JsonLdSource[]
}

function toIso(d: Date | string | null | undefined): string | undefined {
  if (!d) return undefined
  const t = d instanceof Date ? d : new Date(d)
  return isNaN(t.getTime()) ? undefined : t.toISOString()
}

function toTags(t: ArticleJsonLdInput['tags']): string[] {
  if (!t) return []
  const arr = Array.isArray(t) ? t : t.split(',')
  return arr.map((s) => String(s).trim()).filter(Boolean)
}

/**
 * 详情页的 Article JSON-LD。
 *
 * `citation` 列出全部信源原文外链：既满足 SKILL.md §6 的来源标注硬要求，
 * 也是在向搜索引擎表明「本页是对公开信源的聚合摘要」，而不是原创新闻报道——
 * 与页面上「不做新闻定性」的整体姿态保持一致。
 */
export function articleJsonLd(e: ArticleJsonLdInput): Record<string, unknown> {
  const url = newsUrl(e.slug)
  const published = toIso(e.happenedAt)
  return {
    '@context': 'https://schema.org',
    '@type': 'Article', // 刻意不是 NewsArticle，理由见文件头
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: e.headline.slice(0, 110), // Google 对 headline 有 110 字符软上限，超了会被忽略
    description: (e.summary || '').replace(/\s+/g, ' ').trim().slice(0, 300),
    url,
    inLanguage: 'zh-CN',
    datePublished: published,
    dateModified: toIso(e.updatedAt) || published,
    author: { '@type': 'Organization', name: AUTHOR_NAME, url: siteOrigin() },
    publisher: {
      '@type': 'Organization',
      name: '贝果科技',
      url: siteOrigin(),
      logo: { '@type': 'ImageObject', url: absUrl(SITE_LOGO), width: 512, height: 512 },
    },
    image: [absUrl(ogImageForCategory(e.category))],
    articleSection: categoryLabel(e.category),
    keywords: toTags(e.tags),
    isAccessibleForFree: true,
    // 与页面上的六处 AI 标识保持一致：结构化数据里也明示内容为机器生成
    disambiguatingDescription: AI_DISCLAIMER,
    citation: (e.sources || []).map((s) => ({
      '@type': 'CreativeWork',
      name: s.title,
      url: s.url,
      publisher: { '@type': 'Organization', name: s.sourceName },
    })),
  }
}
