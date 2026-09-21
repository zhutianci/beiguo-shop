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

/**
 * meta description 收口。
 *
 * 【原来是 `.slice(0, 110)` 硬切】中文摘要是按 120–260 字的模板产出的，
 * 所以几乎每一条都被切在句子中间，搜索结果里长这样：
 *   「……OpenAI 宣布该功能将于下月面向所有 Plus 用户开放，同时公司表示将继续优化推」
 * 一条断在半个词上的描述，点击率和可信度都要打折，而这是纯粹的显示问题，
 * 和内容质量无关。
 *
 * 【为什么不按字数硬切到更短】更短只会切得更多。正确做法是**按句子收口**：
 * 在上限内找最后一个句末标点，从那里断开；找不到句号就退而求其次找逗号；
 * 都没有才硬切并补省略号。
 *
 * 【为什么上限是 120 而不是 160】那个 160 是拉丁字母的经验值。中文字符更宽，
 * Google 中文结果里实际能显示的大约是 75–80 个汉字，多写的部分不会显示。
 * 这里留到 120 是因为超出部分虽然不显示，但仍会参与匹配。
 */
const DESC_MAX = 120
/** 短于这个长度就别再往回找句号了，否则会把一句完整的话砍成一小截 */
const DESC_MIN = 45

export function clipDescription(raw: string | null | undefined, max = DESC_MAX): string {
  const t = (raw || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t

  const head = t.slice(0, max)
  // 句末标点优先（中英文都认），其次是分句标点
  const hard = Math.max(
    head.lastIndexOf('。'), head.lastIndexOf('！'), head.lastIndexOf('？'),
    head.lastIndexOf('；'), head.lastIndexOf('!'), head.lastIndexOf('?')
  )
  if (hard >= DESC_MIN) return head.slice(0, hard + 1)

  const soft = Math.max(head.lastIndexOf('，'), head.lastIndexOf('、'), head.lastIndexOf(','))
  if (soft >= DESC_MIN) return `${head.slice(0, soft)}…`

  return `${head.slice(0, max - 1)}…`
}
