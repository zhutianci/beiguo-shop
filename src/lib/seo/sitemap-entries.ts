import { prisma } from '@/lib/db'
import { absUrl } from '@/lib/news/seo'
import { shouldNoindexEvent, thinNoindexEnabled } from '@/lib/news/thin'
import { parseDetail } from '@/lib/news/format'
import { LANDING_HUB, LANDING_HUB_REVIEWED_AT, LANDINGS, landingPath } from '@/lib/landing/registry'
import { getStorefront } from '@/lib/storefront/resolve'
import { readSmsConfigCached } from '@/lib/jiema/config'
import { jiemaPublicOpen } from '@/lib/jiema-config-schema'
import { JIEMA_TERMS_PATH, JIEMA_TERMS_VERSION } from '@/lib/terms/jiema-wallet'
import { PRIVACY_UPDATED_AT } from '@/lib/legal'

/**
 * 站点地图条目（docs/SEO-重构/SEO-重构设计.md §6.2，批 2 的 G 包）。
 *
 * 【为什么抽成纯数据】/sitemap.xml 改成 sitemap index，下分 6 段（/sitemaps/<段名>.xml）；
 * route handler 只负责序列化，条目怎么来、lastmod 取什么值都在这里，itest（wp1 W1-6、itest-jiema-catalog）也直接调这里。
 * 原 app/sitemap.ts 删掉（Next 14.2 里 app/sitemap.ts 与 app/sitemap.xml/route.ts 不能并存）。
 *
 * 【只收录该被收录的页面】带 token 的收据页、支付页、需要登录才有意义的订单 / 个人中心一概不进（robots.ts 里还会再堵一道）；
 * /forum、/games 是 noindex,follow（A 包），不进；新闻薄页 noindex，不进（与详情页共用 shouldNoindexEvent，杜绝两份规则漂移）。
 *
 * 【lastmod 只写真实值】（§1.3、附录 B-2）Google 只采用「一贯准确」的 lastmod，一眼假（全是当前时间、或成交就刷新）就整体忽略：
 *  · 静态页：不写；条款与隐私政策写版本日期常量；
 *  · 充值落地页：该页自己的 reviewedAt（registry 每页一个），hub 取子页里最新的那个；
 *  · 商品页：只写后台保存商品时记下的 Setting `product_edited_<id>`（lib/seo/commerce-push.ts）；没有就不写——
 *    Product.updatedAt 每笔付款都会刷新（vmq.ts 的 sales increment），是噪声；
 *  · 接码：/jiema 不写（价格每 10 分钟在变），/jiema/terms 写条款版本；
 *  · 新闻事件：max(publishedAt, reviewedAt)，不用 updatedAt（热度重算每 15 分钟写一次行，浏览、分享也会碰它）；
 *  · 日报周报：该期的生成时间（createdAt）；月度归档：当月最新一条的 publishedAt；/news：最新一条的 publishedAt。
 * 【数据库不可达】每段各自 try：静态部分照常吐出来，爬虫拿到一份少了动态条目的 sitemap，比拿到一个 500 强。
 * 【渠道站】一律返回空（渠道站整站 noindex，且这些地址全是主站 origin，在渠道域名的 sitemap 里列主站地址是跨域提交，设计 4.8）。
 * 店面解析 getStorefront() **不包进 try**（靠它转动态，同 robots.ts）。
 */

export interface SitemapImage {
  loc: string
}

export interface SitemapEntry {
  url: string
  lastModified?: string
  images?: SitemapImage[]
}

export const SITEMAP_SEGMENTS = ['core', 'chongzhi', 'products', 'jiema', 'news-hub', 'news-events'] as const
export type SitemapSegment = (typeof SITEMAP_SEGMENTS)[number]

export function isSitemapSegment(v: string): v is SitemapSegment {
  return (SITEMAP_SEGMENTS as readonly string[]).includes(v)
}

const RECENT_DAYS = 90
const MAX_EVENTS = 2000
const MAX_PRODUCTS = 500
const MAX_DIGESTS = 60
const MAX_MONTHS = 24

/** 「2026-09-24」这类日期常量 → ISO（按业务时区 +8 的当天零点） */
function dayIso(day: string): string {
  return new Date(`${day}T00:00:00+08:00`).toISOString()
}

function maxIso(...ds: (Date | null | undefined)[]): string | undefined {
  const t = ds.filter((d): d is Date => !!d).map((d) => d.getTime())
  return t.length ? new Date(Math.max(...t)).toISOString() : undefined
}

async function isPlatformHost(): Promise<boolean> {
  const sf = await getStorefront()
  return !!sf && sf.kind === 'PLATFORM'
}

// ---------------------------------------------------------------- 各段

function coreEntries(): SitemapEntry[] {
  return [
    { url: absUrl('/') },
    { url: absUrl('/about') },
    { url: absUrl('/support') },
    // /links 是对外交换友链的落地页，必须可被收录：长期 noindex 的页面 Google 最终会停止跟随其上的链接
    { url: absUrl('/links') },
    // 条款页不指望带流量，但要可被收录：「有没有公开的条款与隐私政策」是 Google 判断主体可信度时会看的东西。
    // /terms 的「最后更新」是几份条款版本里最新的那个（terms/page.tsx），这里不写，免得两处各算一遍；隐私政策写它的版本常量
    { url: absUrl('/terms') },
    { url: absUrl('/privacy'), lastModified: dayIso(PRIVACY_UPDATED_AT) },
    { url: absUrl('/iptools') },
  ]
}

function chongzhiEntries(): SitemapEntry[] {
  return [
    { url: absUrl(LANDING_HUB.path), lastModified: dayIso(LANDING_HUB_REVIEWED_AT) },
    ...LANDINGS.map((l) => ({ url: absUrl(landingPath(l.slug)), lastModified: dayIso(l.reviewedAt) })),
  ]
}

/** 商品主图只收站内上传的（/uploads/…）：外链图不是本站资源，图片 sitemap 里列外域地址没有意义 */
function productImage(src: string | null): SitemapImage[] | undefined {
  if (!src || !src.startsWith('/uploads/')) return undefined
  return [{ loc: absUrl(src) }]
}

async function productEntries(): Promise<SitemapEntry[]> {
  try {
    const products = await prisma.product.findMany({
      // 1 = 上架；系统载体商品（接码 / 余额充值挂单用）恒为下架，自然不在这里
      where: { status: 1 },
      select: { id: true, image: true },
      orderBy: { id: 'asc' },
      take: MAX_PRODUCTS,
    })
    const edited = await prisma.setting
      .findMany({ where: { key: { in: products.map((p) => `product_edited_${p.id}`) } }, select: { key: true, value: true } })
      .catch(() => [])
    const editedAt = new Map(edited.map((s) => [s.key, s.value]))
    // 商品目录页（导航型，canonical /products）放在这一段的第一条，不写 lastmod（它列的是全部在售商品，没有单一的修改时间）
    return [{ url: absUrl('/products') } as SitemapEntry].concat(products.map((p) => {
      const v = editedAt.get(`product_edited_${p.id}`)
      const t = v ? new Date(v) : null
      return {
        url: absUrl(`/products/${p.id}`),
        ...(t && !isNaN(t.getTime()) ? { lastModified: t.toISOString() } : {}),
        ...(productImage(p.image) ? { images: productImage(p.image) } : {}),
      }
    }))
  } catch (err) {
    console.error('[sitemap] products', err)
    return [{ url: absUrl('/products') }]
  }
}

/**
 * 短信接码（docs/短信接码-设计.md §1.3、D28）：只在「总开关开 + 受众全部用户」时收录（灰度期页面是 noindex，
 * 把 noindex 的地址塞进 sitemap 是自相矛盾的信号）。配置读不到按关（fail-closed）。
 */
async function jiemaEntries(): Promise<SitemapEntry[]> {
  const open = jiemaPublicOpen(await readSmsConfigCached().catch(() => null))
  if (!open) return []
  return [{ url: absUrl('/jiema') }, { url: absUrl(JIEMA_TERMS_PATH), lastModified: dayIso(JIEMA_TERMS_VERSION) }]
}

function bjDay(d: Date): string {
  return new Date(d.getTime() + 8 * 3600000).toISOString().slice(0, 10)
}

async function newsHubEntries(): Promise<SitemapEntry[]> {
  const out: SitemapEntry[] = []
  let latest: Date | null = null
  try {
    const row = await prisma.newsEvent.findFirst({ where: { status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' }, select: { publishedAt: true } })
    latest = row?.publishedAt ?? null
  } catch (err) {
    console.error('[sitemap] news latest', err)
  }
  out.push({ url: absUrl('/news'), ...(latest ? { lastModified: latest.toISOString() } : {}) })

  // 日报 / 周报：最近 60 期（更旧的靠页内「往期」互链走到）
  try {
    const rows = await prisma.newsDigest.findMany({
      where: { status: 'PUBLISHED' },
      select: { type: true, periodStart: true, createdAt: true },
      orderBy: { periodStart: 'desc' },
      take: MAX_DIGESTS,
    })
    for (const r of rows) {
      out.push({ url: absUrl(`/news/digest/${r.type === 'WEEKLY' ? 'weekly' : 'daily'}/${bjDay(r.periodStart)}`), lastModified: r.createdAt.toISOString() })
    }
  } catch (err) {
    console.error('[sitemap] news digest', err)
  }

  // 按月归档：RECENT_DAYS=90 的必要补充（90 天之前的事件本身不进 sitemap，归档页进）。月份按业务时区（+8）分组
  try {
    const rows = await prisma.$queryRaw<{ k: string; latest: Date | null }[]>`
      SELECT DATE_FORMAT(DATE_ADD(happened_at, INTERVAL 8 HOUR), '%Y-%m') AS k, MAX(published_at) AS latest
      FROM news_events
      WHERE status = 'PUBLISHED'
      GROUP BY k
      ORDER BY k DESC
      LIMIT ${MAX_MONTHS}
    `
    for (const r of rows) out.push({ url: absUrl(`/news/archive/${r.k}`), ...(r.latest ? { lastModified: new Date(r.latest).toISOString() } : {}) })
  } catch (err) {
    console.error('[sitemap] news archive', err)
  }
  return out
}

async function newsEventEntries(): Promise<SitemapEntry[]> {
  try {
    const since = new Date(Date.now() - RECENT_DAYS * 86400000)
    const events = await prisma.newsEvent.findMany({
      where: {
        status: 'PUBLISHED',
        happenedAt: { gte: since },
        // 粗筛（能走索引、不拉 TEXT），真正的判定在下面用 shouldNoindexEvent 做——必须和详情页用同一个谓词
        ...(thinNoindexEnabled() ? { detailState: 'DONE' } : {}),
      },
      select: { slug: true, happenedAt: true, publishedAt: true, reviewedAt: true, detail: true },
      orderBy: { happenedAt: 'desc' },
      take: MAX_EVENTS,
    })
    return events
      .filter((e) => !shouldNoindexEvent(parseDetail(e.detail)))
      .map((e) => ({ url: absUrl(`/news/${e.slug}`), lastModified: maxIso(e.publishedAt, e.reviewedAt) ?? e.happenedAt.toISOString() }))
  } catch (err) {
    console.error('[sitemap] news events', err)
    return []
  }
}

// ---------------------------------------------------------------- 对外

/** 一段的条目；渠道站（以及没有店面的 Host）返回空 */
export async function sitemapSegmentEntries(seg: SitemapSegment): Promise<SitemapEntry[]> {
  if (!(await isPlatformHost())) return []
  switch (seg) {
    case 'core':
      return coreEntries()
    case 'chongzhi':
      return chongzhiEntries()
    case 'products':
      return productEntries()
    case 'jiema':
      return jiemaEntries()
    case 'news-hub':
      return newsHubEntries()
    case 'news-events':
      return newsEventEntries()
  }
}

/** 全部条目拍平（itest 用；渠道站为空） */
export async function allSitemapEntries(): Promise<SitemapEntry[]> {
  if (!(await isPlatformHost())) return []
  const parts = await Promise.all(SITEMAP_SEGMENTS.map((s) => sitemapSegmentEntries(s)))
  return parts.flat()
}

/** 段内最新的 lastmod（sitemap index 的 <lastmod> 用；整段都没有 lastmod 就不写） */
export function latestLastmod(entries: SitemapEntry[]): string | undefined {
  let best: string | undefined
  for (const e of entries) if (e.lastModified && (!best || e.lastModified > best)) best = e.lastModified
  return best
}

// ---------------------------------------------------------------- 序列化

export function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export function urlsetXml(entries: SitemapEntry[]): string {
  const withImages = entries.some((e) => e.images?.length)
  const head = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${withImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ''}>`
  const body = entries
    .map(
      (e) =>
        `<url><loc>${xmlEscape(e.url)}</loc>${e.lastModified ? `<lastmod>${e.lastModified}</lastmod>` : ''}` +
        (e.images ?? []).map((i) => `<image:image><image:loc>${xmlEscape(i.loc)}</image:loc></image:image>`).join('') +
        '</url>',
    )
    .join('\n')
  return `${head}\n${body}${body ? '\n' : ''}</urlset>\n`
}

export function sitemapIndexXml(items: { loc: string; lastModified?: string }[]): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    items.map((i) => `<sitemap><loc>${xmlEscape(i.loc)}</loc>${i.lastModified ? `<lastmod>${i.lastModified}</lastmod>` : ''}</sitemap>`).join('\n') +
    '\n</sitemapindex>\n'
  )
}

export const XML_HEADERS = { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } as const
