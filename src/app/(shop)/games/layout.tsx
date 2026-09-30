import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/product-seo'
import { pageOg } from '@/lib/seo/og'
import { notFoundOnChannel } from '@/lib/storefront/resolve'

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
  /*
   * 【noindex,follow（2026-09-30，docs/SEO-重构/SEO-重构设计.md §1.3、§6.8，A 包）】整组页面（含子路由）退出索引，
   * 但保留 follow：页头页脚的站内链接照常被跟随。同时移出 sitemap（app/sitemap.ts）。
   * googleBot 一起写成 noindex：子页面的 robots 是整块替换根 layout 的那一份（根 layout 的 googleBot 是 index），
   * 显式写出两条，读代码的人不用去猜 Next 的合并规则。
   */
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
  ...pageOg({ title: TITLE, description: DESCRIPTION, path: '/games' }),
}

// 渠道分站（设计 11.2、实施分包 WP1）：本模块在渠道站关闭，渠道 Host 上整组页面 404（第一行、不包进 try）。
// 主站（含休眠期的任何 Host）照常渲染；接口层另有 denyOnChannel 与 nginx 白名单兜底
export default async function GamesLayout({ children }: { children: React.ReactNode }) {
  await notFoundOnChannel()
  return <>{children}</>
}
