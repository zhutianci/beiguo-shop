import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/product-seo'

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
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { type: 'website', title: TITLE, description: DESCRIPTION, url: '/forum' },
}

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
