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
import { absUrl } from '@/lib/news/seo'

/** 站点默认分享底图。1200×630 由 scripts/gen-og-image.js 离线生成 */
export const OG_IMAGE_URL = absUrl('/og-default.png')

export const OG_IMAGES = [
  { url: OG_IMAGE_URL, width: 1200, height: 630, alt: '贝果科技 bigolab.com' },
]

export const TWITTER_IMAGES = [OG_IMAGE_URL]
