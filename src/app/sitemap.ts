// 必须 force-dynamic：这里要连数据库，而 next build 的 builder 容器不在 app-network 上、
// 没有 DATABASE_URL，一旦被当成静态路由预渲染，整个构建会直接失败。
export const dynamic = 'force-dynamic'

import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'
import { absUrl } from '@/lib/news/seo'
import { shouldNoindexEvent, thinNoindexEnabled } from '@/lib/news/thin'
import { parseDetail } from '@/lib/news/format'
import { LANDING_HUB, LANDINGS, landingPath } from '@/lib/landing/registry'
import { getStorefront } from '@/lib/storefront/resolve'

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
  // 渠道站（以及没有店面的 Host）返回空 sitemap（设计 4.8）：渠道站整站 noindex，且这里的地址全是主站 origin，
  // 在 lulu.bigolab.com/sitemap.xml 里列主站地址是跨域提交。不包进 try（理由同 robots.ts）
  const sf = await getStorefront()
  if (!sf || sf.kind !== 'PLATFORM') return []

  const now = new Date()

  // 主要静态页面。登录/注册/找回密码/订单/个人中心刻意不收录
  //
  // 【priority 的现实】Google 早就公开说过基本忽略 sitemap 里的 priority 与 changeFrequency。
  // 这里继续认真填，图的是它是一份人读得懂的「站点重要性清单」——
  // 下次有人加页面时能照着判断该给什么档，而不是随手抄一个 0.8。
  //
  // 【这些静态页刻意不写 lastModified】原来每一条都写 `lastModified: now`，
  // 意思是「每次爬虫来拉 sitemap，全站每个静态页都刚刚改过」。这是一个伪造的信号，
  // 而且自相矛盾：/terms 标着 changeFrequency: 'yearly' 却天天报告「今天改的」。
  // Google 的口径是 lastmod 必须准确，一眼看去不可信（比如所有 URL 都是当前时间）
  // 就会被整体忽略——连带那些**真实**的 lastmod（新闻、商品）一起失去可信度。
  // 手填一个常量日期同样不行：那是引入第二个必然腐烂的事实源，改完页面没人记得回来改它。
  // 所以这里干脆省略。下面 DB 驱动的条目继续带真实时间。
  const staticPages: MetadataRoute.Sitemap = [
    { url: absUrl('/'), changeFrequency: 'daily', priority: 1 },
    // 充值落地页是这一轮新增的商业主力页，权重仅次于首页
    { url: absUrl(LANDING_HUB.path), changeFrequency: 'weekly', priority: 0.9 },
    ...LANDINGS.map((l) => ({
      url: absUrl(landingPath(l.slug)),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    { url: absUrl('/products'), changeFrequency: 'daily', priority: 0.9 },
    { url: absUrl('/news'), changeFrequency: 'hourly', priority: 0.7 },
    { url: absUrl('/support'), changeFrequency: 'monthly', priority: 0.7 },
    { url: absUrl('/forum'), changeFrequency: 'daily', priority: 0.6 },
    { url: absUrl('/about'), changeFrequency: 'monthly', priority: 0.5 },
    // /links 是对外交换友链的落地页，必须可被收录：长期 noindex 的页面 Google
    // 最终会停止跟随其上的链接，对方拿不到任何权重，互挂也就没人愿意做了
    { url: absUrl('/links'), changeFrequency: 'weekly', priority: 0.4 },
    // 条款页不指望带流量，但要可被收录：对一个卖虚拟商品的站点，
    // 「有没有公开的条款与隐私政策」是 Google 判断主体可信度时会看的东西
    { url: absUrl('/terms'), changeFrequency: 'yearly', priority: 0.3 },
    { url: absUrl('/privacy'), changeFrequency: 'yearly', priority: 0.3 },
    // 游戏与关于已从顶部导航下架，但页面还在、仍值得收录，sitemap 保持原样
    { url: absUrl('/games'), changeFrequency: 'weekly', priority: 0.3 },
    { url: absUrl('/iptools'), changeFrequency: 'monthly', priority: 0.3 },
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
      where: {
        status: 'PUBLISHED',
        happenedAt: { gte: since },
        // 没有全文层的事件带 noindex（见 lib/news/thin.ts），
        // 把 noindex 的地址塞进 sitemap 是自相矛盾的信号：一边说「请收录这一批」，
        // 一边在页面上说「别收录我」。Search Console 会把它们报成
        // 「已提交的网址被标记为 noindex」的错误，白白污染覆盖率报告。
        //
        // 这里只做一次**粗筛**（能走索引、不拉 TEXT），真正的判定在下面用
        // shouldNoindexEvent 做——必须和详情页用同一个谓词，
        // 否则两处各写一套规则，改动其中一处就会静默漂移出「sitemap 收了一条 noindex 页」。
        ...(thinNoindexEnabled() ? { detailState: 'DONE' } : {}),
      },
      select: { slug: true, updatedAt: true, happenedAt: true, detail: true },
      orderBy: { happenedAt: 'desc' },
      take: MAX_EVENTS,
    })
    eventPages = events
      // 与 news/[slug] 的 generateMetadata 共用同一个判定，杜绝两份规则漂移
      .filter((e) => !shouldNoindexEvent(parseDetail(e.detail)))
      .map((e) => ({
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
