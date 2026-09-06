// 必须 force-dynamic：这里要连数据库，而 next build 的 builder 容器不在 app-network 上、
// 没有 DATABASE_URL，一旦被当成静态路由预渲染，整个构建会直接失败。
export const dynamic = 'force-dynamic'

import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'
import { absUrl } from '@/lib/news/seo'

/**
 * 站点地图。
 *
 * 【只收录该被收录的页面】带 token 的收据页、支付页、以及需要登录才有意义的
 * 订单/个人中心一概不进（robots.ts 里还会再堵一道）。
 *
 * 【为什么限定最近 90 天】新闻条目会持续累积，一年后就是几千条 URL。
 * sitemap 单文件上限是 50000 条 / 50MB，还没到硬上限，但把三个月前的低价值页面
 * 反复推给爬虫只会稀释抓取预算。旧页面仍可通过站内链接与搜索结果访问，
 * 不进 sitemap 不等于 noindex。
 */

const RECENT_DAYS = 90
const MAX_EVENTS = 2000

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // 主要静态页面。登录/注册/找回密码/订单/个人中心刻意不收录
  const staticPages: MetadataRoute.Sitemap = [
    { url: absUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absUrl('/products'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absUrl('/news'), lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: absUrl('/forum'), lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: absUrl('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absUrl('/support'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absUrl('/games'), lastModified: now, changeFrequency: 'weekly', priority: 0.3 },
    { url: absUrl('/iptools'), lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ]

  // 【为什么没有分类页】/news 的分类筛选是 NewsStream 里的客户端状态，不进 URL，
  // 所以 /news?c=xxx 渲染出来的 HTML 和 /news 完全一样。把这种地址塞进 sitemap
  // 就是主动向搜索引擎提交一批重复内容，只会稀释 /news 自己的权重。
  // 将来若把筛选做成 /news/c/<slug> 这样的真实路由，再在这里补上。

  // 数据库不可达时不能让整个 sitemap 变成 500：静态部分照常吐出来，
  // 爬虫拿到一份少了新闻的 sitemap，比拿到一个错误页强得多。
  let eventPages: MetadataRoute.Sitemap = []
  try {
    const since = new Date(now.getTime() - RECENT_DAYS * 86400000)
    const events = await prisma.newsEvent.findMany({
      where: { status: 'PUBLISHED', happenedAt: { gte: since } },
      select: { slug: true, updatedAt: true, happenedAt: true },
      orderBy: { happenedAt: 'desc' },
      take: MAX_EVENTS,
    })
    eventPages = events.map((e) => ({
      url: absUrl(`/news/${e.slug}`),
      lastModified: e.updatedAt || e.happenedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (err) {
    console.error('Sitemap news query error:', err)
  }

  // 商品详情页
  let productPages: MetadataRoute.Sitemap = []
  try {
    const products = await prisma.product.findMany({
      where: { status: 1 }, // 1 = 上架
      select: { id: true, updatedAt: true },
      orderBy: { id: 'asc' },
      take: 500,
    })
    productPages = products.map((p) => ({
      url: absUrl(`/products/${p.id}`),
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (err) {
    console.error('Sitemap product query error:', err)
  }

  return staticPages.concat(eventPages, productPages)
}
