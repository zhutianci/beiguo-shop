/**
 * 分享图（og:image / twitter:image）的共用常量。
 *
 * 【为什么需要这个文件：Next 的 metadata 是「整块替换」不是「深合并」】
 * 根 layout 里写了 openGraph.images，本以为全站继承得到。实测不是——
 * 只要子页面自己写了 `openGraph: { ... }`，这一整块就把父级的 openGraph 顶掉了，
 * 没写 images 就是没有 images。2026-09-22 线上抽查：
 *
 *   /                       og:image 无
 *   /chongzhi               og:image 无
 *   /chongzhi/chatgpt-plus  og:image 无
 *   /products/4             og:image 无
 *   /news                   og:image 有（只有新闻那几页自己写了）
 *
 * 也就是说，**站上每一个商业页在微信、Twitter、Slack、Telegram 里转发出去都是无图卡片**，
 * 而这些页面恰恰是最可能被人转发的那些。这不是排名问题，是转发出去有没有人点的问题。
 *
 * twitter 那一块同理，单独列一份。
 *
 * 【为什么用绝对地址】相对地址在 metadataBase 缺失或被覆盖时会原样输出，
 * 而微信与各家爬虫都不接受相对的 og:image——表现是「本地预览没问题、发到群里没缩略图」。
 * absUrl 统一走 siteOrigin()，和站内其他绝对地址同一个来源。
 */
import type { Metadata } from 'next'
import { absUrl } from '@/lib/news/seo'

/**
 * 站点默认分享底图。1200×630 由 scripts/gen-brand-assets.py 离线生成。
 * 带 ?v=：微信等平台按地址缓存缩略图，换图时不改地址会一直显示旧图（与 layout.tsx 的 ICON_VERSION 同步）
 */
export const OG_IMAGE_URL = absUrl('/og-default.png?v=3')

export const OG_IMAGES = [
  { url: OG_IMAGE_URL, width: 1200, height: 630, alt: '贝果科技 bigolab.com' },
]

export const TWITTER_IMAGES = [OG_IMAGE_URL]

/**
 * og:site_name / og:locale。
 *
 * 和 images 是同一个坑：根 layout 的 openGraph 里写了 siteName 与 locale，
 * 但子页面只要自己写了 `openGraph: {...}`，这两项就跟着整块被顶掉——
 * 2026-09-24 实测 /products/16 的 HTML 里没有 og:site_name、也没有 og:locale。
 * 覆盖 openGraph 的页面一律 `...OG_SITE` 展开进去。
 * 值与 app/layout.tsx 里 SITE_NAME / 'zh_CN' 保持一致。
 */
export const OG_SITE = { siteName: '贝果科技', locale: 'zh_CN' } as const

/** 分享图（与 OG_IMAGES 同形）。新闻页传各自的分类底图 */
export type PageOgImage = { url: string; width?: number; height?: number; alt?: string }

/**
 * 公开页的 openGraph + twitter 工厂（docs/SEO-重构/SEO-重构设计.md §6.8，A 包）。
 *
 * 【为什么要工厂】上面三个坑（images、site_name / locale 被整块顶掉）之外还有第四个：twitter。
 * Next 只在「twitter 里没有 title」时才拿 openGraph 的标题去补；而根 layout 的 twitter 自带 title，
 * 子页面只写 openGraph 不写 twitter 时，**twitter:title / twitter:description 仍是根 layout 那句全站默认文案**
 * （2026-09-30 核对：/about、/support、/terms、/privacy、/links、/iptools 都是这样，/products 的注释里也记过一次）。
 * 每页手写两块对象，漏一处就是一种新的不一致。所以统一从这里出：
 *   · og:title / twitter:title 与页面 <title> 同一个字符串（主干一致，check-seo-copy 断言）；
 *   · 必带 OG_SITE（site_name、locale）和分享图；
 *   · og:url 用站内路径，由 metadataBase 补成绝对地址（渠道站随 metadataBase 落到渠道域名）。
 *
 * 用法：`export const metadata: Metadata = { title, description, alternates: { canonical: path }, ...pageOg({ title, description, path }) }`
 */
export function pageOg({
  title,
  description,
  path,
  type = 'website',
  images,
}: {
  title: string
  description: string
  /** 站内路径，如 '/about'。layout 级别的 metadata 会被子路由继承，写父路径即可（见 games / forum 的注释） */
  path: string
  type?: 'website' | 'article'
  /** 省略时用站点默认分享底图 */
  images?: PageOgImage[]
}): { openGraph: NonNullable<Metadata['openGraph']>; twitter: NonNullable<Metadata['twitter']> } {
  return {
    openGraph: { ...OG_SITE, type, title, description, url: path, images: images ?? OG_IMAGES },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images ? images.map((i) => i.url) : TWITTER_IMAGES,
    },
  }
}
