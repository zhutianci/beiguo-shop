import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/product-seo'
import { OG_IMAGES, TWITTER_IMAGES } from '@/lib/seo/og'

/**
 * 小游戏已从主导航下架，页面仍在、仍在 sitemap 里。
 * 它对商业词没有任何帮助，这里给标题只是为了**不再和首页撞车**——
 * 一批同名页面互相稀释，受损的是首页自己。
 */
const TITLE = `在线小游戏 - 2048 / 贪吃蛇 / 俄罗斯方块 - ${SITE_NAME}`
const DESCRIPTION = '贝果科技提供的免费在线小游戏：2048、贪吃蛇、俄罗斯方块，无需下载，打开即玩。'

/*
 * 【这里刻意不写 alternates.canonical】layout 的 metadata 会被**所有子路由继承**。
 * 在这一层写死 canonical，/games/2048、/forum/<id> 这些子页就会集体自称是父页的副本，
 * 结果是除父页外全部被搜索引擎丢弃——与根 layout 不写 canonical 是同一条理由，
 * 只是换了一个层级重演。canonical 只能由「确实是那条地址」的页面自己声明。
 */
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { images: OG_IMAGES, type: 'website', title: TITLE, description: DESCRIPTION, url: '/games' },
}

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
