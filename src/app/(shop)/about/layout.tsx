import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/product-seo'

/**
 * 【为什么用 layout 而不是把 page 拆成 server 外壳】
 * /about 整页是 'use client'，客户端组件用不了 generateMetadata，
 * 于是它继承 layout.tsx 的全站默认标题——线上实测 /about、/support、/forum、
 * /iptools、/games 这些页的 <title> 与首页**一字不差**。
 * 对 Google 来说，一批标题完全相同的页面互相稀释，谁也排不上。
 *
 * 路由级 layout 是 Server Component，可以导出 metadata，而且**一行业务代码都不用动**。
 * 比把每一页拆成外壳 + 客户端组件风险低得多（那是 /products 那种页面才值得付的成本）。
 */
const TITLE = `关于贝果科技 - AI 会员代充服务商 - ${SITE_NAME}`
const DESCRIPTION =
  '贝果科技（bigolab.com）由益阳市赫山区必高科技有限公司运营，提供 ChatGPT Plus / Pro、Claude Pro / Max 等 AI 会员代充值与订阅开通服务，已服务 1000+ 用户，支持开具增值税发票。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: { type: 'website', title: TITLE, description: DESCRIPTION, url: '/about' },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
