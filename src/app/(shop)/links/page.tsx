// 【必须 force-dynamic】这一页要连数据库，而 next build 的 builder 容器不在 app-network 上、
// 没有 DATABASE_URL。一旦被当成静态路由预渲染，整个构建会直接失败（/news、sitemap 同理）。
export const dynamic = 'force-dynamic'

// Server Component：数据在服务端取好、直出到 HTML，交互（申请弹窗、复制、点击打点）
// 留在 links-client.tsx。
//
// 【为什么友链页不能像 /products 那样「server 壳只管 metadata、数据客户端拉」】
// 这一页存在的意义就是让出站链接**真的出现在 HTML 里**：对方站长验证我们有没有挂他，
// 用的基本都是「纯 HTTP 拉 HTML + 匹配域名」的工具（本项目自己的 checkBacklink 就是这么干的），
// 百度爬虫也基本不执行 JS。更要命的是 robots.ts 里 disallow 了 /api/，
// 连 Googlebot 的渲染器都不会去抓 /api/links —— 客户端取数等于所有爬虫都看见一个空壳。
// 商品数据没有这个包袱，友链有。
//
// 【为什么不加 noindex】长期 noindex 的页面 Google 最终会停止跟随其上的链接
// （noindex 事实上退化成 nofollow），对方一点权重都拿不到就会撤链。
// 权重控制靠逐条的 rel（见 src/lib/friend-link-client.ts 的 outboundRel）。
import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/product-seo'
import { getLinksPageData } from '@/lib/friend-link'
import LinksClient from './links-client'

const TITLE = `友情链接 · 招商合作 - ${SITE_NAME}`
const DESCRIPTION =
  '贝果科技友情链接页：AI 工具、开发者服务、效率工具等优质站点推荐，欢迎同类站点互换友链，也开放少量招商合作位。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/links' },
  openGraph: { type: 'website', title: TITLE, description: DESCRIPTION, url: '/links' },
}

export default async function LinksPage() {
  const data = await getLinksPageData()
  return <LinksClient data={data} />
}
