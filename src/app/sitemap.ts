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

  // 按月归档页。
  // 这是 RECENT_DAYS=90 的必要补充：90 天之前的事件本身不进 sitemap，
  // 但它们的归档页进，爬虫顺着归档页仍然能走到每一条旧内容。
  // 月份分组必须用业务时区（+8），否则每月 1 号的凌晨 8 小时会被归到上个月。
  let archivePages: MetadataRoute.Sitemap = []
  try {
    const rows = await prisma.$queryRaw<{ k: string; latest: Date }[]>`
      SELECT DATE_FORMAT(DATE_ADD(happened_at, INTERVAL 8 HOUR), '%Y-%m') AS k, MAX(updated_at) AS latest
      FROM news_events
      WHERE status = 'PUBLISHED'
      GROUP BY k
      ORDER BY k DESC
      LIMIT 24
    `
    const thisMonth = new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 7)
    archivePages = rows.map((r) => ({
      url: absUrl(`/news/archive/${r.k}`),
      lastModified: r.latest || now,
      // 当月还在长，历史月份定型了
      changeFrequency: r.k === thisMonth ? ('daily' as const) : ('monthly' as const),
      priority: 0.6,
    }))
  } catch (err) {
    console.error('Sitemap news archive query error:', err)
  }

  // 日报 / 周报。每天一期，收录最近 60 期足够 —— 更旧的靠页内「往期」互链走到
  let digestPages: MetadataRoute.Sitemap = []
  try {
    const rows = await prisma.newsDigest.findMany({
      where: { status: 'PUBLISHED' },
      select: { type: true, periodStart: true, updatedAt: true },
      orderBy: { periodStart: 'desc' },
      take: 60,
    })
    digestPages = rows.map((r) => ({
      url: absUrl(
        `/news/digest/${r.type === 'WEEKLY' ? 'weekly' : 'daily'}/${new Date(
          r.periodStart.getTime() + 8 * 3600000
        )
          .toISOString()
          .slice(0, 10)}`
      ),
      lastModified: r.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch (err) {
    console.error('Sitemap news digest query error:', err)
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

  return staticPages.concat(eventPages, archivePages, digestPages, productPages)
}
