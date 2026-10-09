import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/product-seo'
import { pageOg } from '@/lib/seo/og'
import { notFoundUnlessModule } from '@/lib/storefront/resolve'
import { moduleMetadata } from '@/lib/storefront/module-meta'

/**
 * 论坛列表页。详情页 /forum/[id] 是用户发的内容，标题各不相同才有意义，
 * 但它也是 'use client' —— 这里的 layout 会被详情页继承，
 * 所以描述写得通用一些，不要写死成「列表页」。
 * 详情页要拿到自己的标题，得单独拆 server 外壳（见第二十二节的待办）。
 */
const TITLE = `社区讨论 - ChatGPT / Claude 使用交流 - ${SITE_NAME}`
const DESCRIPTION =
  '贝果科技社区：ChatGPT、Claude 等 AI 工具的使用经验、充值与订阅问题排查、封号与风控讨论，买家与站长在这里交流。'

/*
 * 【这里刻意不写 alternates.canonical】layout 的 metadata 会被**所有子路由继承**。
 * 在这一层写死 canonical，/games/2048、/forum/<id> 这些子页就会集体自称是父页的副本，
 * 结果是除父页外全部被搜索引擎丢弃——与根 layout 不写 canonical 是同一条理由，
 * 只是换了一个层级重演。canonical 只能由「确实是那条地址」的页面自己声明。
 */
const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  /*
   * 【noindex,follow（2026-09-30，docs/SEO-重构/SEO-重构设计.md §1.3、§6.8，A 包）】整组页面（含子路由）退出索引，
   * 但保留 follow：页头页脚的站内链接照常被跟随。同时移出 sitemap（app/sitemap.ts）。
   * googleBot 一起写成 noindex：子页面的 robots 是整块替换根 layout 的那一份（根 layout 的 googleBot 是 index），
   * 显式写出两条，读代码的人不用去猜 Next 的合并规则。/forum 按交接文档 §28 的要求，先加限流再决定是否重新开放收录。
   */
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
  ...pageOg({ title: TITLE, description: DESCRIPTION, path: '/forum' }),
}

// 渠道分站（设计 11.2、实施分包 WP1）：本模块在渠道站关闭，渠道 Host 上整组页面 404（第一行、不包进 try）。
// 主站（含休眠期的任何 Host）照常渲染；接口层另有 denyOnChannel 与 nginx 白名单兜底
export default async function ForumLayout({ children }: { children: React.ReactNode }) {
  await notFoundUnlessModule('learn')
  return <>{children}</>
}

// 内容模块下放：渠道站换站名 / 地址 / robots（主站原样返回，lib/storefront/module-meta.ts）
export async function generateMetadata(): Promise<Metadata> {
  return moduleMetadata(metadata)
}
