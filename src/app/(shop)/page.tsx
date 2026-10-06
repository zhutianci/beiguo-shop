// 【必须 force-dynamic】首页底部那块「按服务找」要连库取实时最低价，
// 而 builder 容器没有 DATABASE_URL，被当成静态路由预渲染会让整个构建失败。
export const dynamic = 'force-dynamic'

// Server 外壳：首页此前整页是客户端组件，于是拿不到 canonical，也输出不了任何结构化数据
// （线上实测：首页 JSON-LD 块数 = 0）。交互与动效全留在 home-client.tsx。
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { JsonLd } from '@/lib/seo/jsonld'
import { organizationJsonLd, productItemListJsonLd, webSiteJsonLd } from '@/lib/seo/graph'
import { getLandingProducts, getPlatformTotalSales, inStock, lowestPrice, matchProducts } from '@/lib/landing/products'
import { LANDING_HUB, LANDINGS, landingPath } from '@/lib/landing/registry'
import HomeClient from './home-client'
import { pageOg } from '@/lib/seo/og'
import { getStorefront } from '@/lib/storefront/resolve'
import { listStorefrontProducts } from '@/lib/pricing'
import { getCurrentUser } from '@/lib/auth'
import { brandMetadata, brandShareImages, currentBrand, withBrandName } from '@/lib/storefront/brand-meta'
import { sitePillars, jiemaPayText, type SitePillars } from '@/lib/seo/pillars'
import { storefrontCached } from '@/lib/storefront/cache'
import { hotNewsEvents } from '@/lib/news/hot'
import { readSmsConfigCached } from '@/lib/jiema/config'
import { catalogSnapshot } from '@/lib/jiema/catalog'
import type { CatalogService } from '@/lib/jiema/dto'
import type { NewsEventDto } from '@/lib/news/format'
import { HomeBrandFaq, HomeJiemaSection, HomeLearnSection } from '@/components/home/home-pillars'
import { TAX_RATE } from '@/lib/invoice'

/**
 * 首页标题与描述。
 *
 * 【为什么要改掉原来那条】原标题是「贝果科技 - Claude & ChatGPT AI 订阅服务」，
 * 描述里写的是「专业的 AI 服务代开平台」。问题出在「代开」这个词上：
 * 2026-09-19 实测 Google 中文下拉建议，`chatgpt代开` 与 `claude代开` 的联想数都是 **0**，
 * 而同位置 `chatgpt充值` 有 8 条、`chatgpt plus 购买` 有 10 条。
 * 也就是说全站把主营业务写成了一个没有人搜的词——不是排得靠后，是根本没有 query 能匹配进来。
 *
 * 【主词的选择】「充值」最贴合本站的卡密交付方式，「代充」只有 3 条联想
 * 且全是信任审查意图（靠谱吗 / 知乎 / v2ex），所以「代充」不当首页主词，
 * 放到 /chongzhi 那一页去承接。品牌词放最后：搜「贝果科技」的人本来就找得到，
 * 最前面的位置该留给品类词。
 */
// 【SEO 批 2 起只给渠道站用】主站首页的 title / description 见下面的 homeTitle / homeDescription（按开放状态）。
// 渠道站整站 noindex，这两句原样保留（渠道白标的 withBrandName 也基于它们），不动渠道站的输出。
const TITLE = 'ChatGPT Plus / Claude Pro 充值代充 - 卡密自助兑换 - 贝果科技'
const DESCRIPTION =
  '贝果科技提供 ChatGPT Plus / Pro、Claude Pro / Max 5x 会员充值与代充：卡密自助兑换，无需信用卡，支付宝付款，可开增值税发票。另有 Codex 接码、Claude 注册与 KYC 认证。'

const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // 根 layout 刻意不写 canonical（写了会让全站每页都自称首页副本），
  // 所以首页自己的 canonical 只能写在这里。带 ?ref= / ?s= 的分享链接全部指回这条干净地址。
  alternates: { canonical: '/' },
  // 只补 og:site_name / og:locale（A 包，设计 §6.8 的 pageOg）；首页的 title / description 归 C 包改，这里一字不动
  ...pageOg({ title: TITLE, description: DESCRIPTION, path: '/' }),
}

/**
 * 主站首页的 title / description（docs/SEO-重构/SEO-重构设计.md §3.3 首页、§0.3 #5，批 2 的 C 包）。
 *
 * 【定位】品牌 + 几条业务的分发页：品牌放最前面（百度规范「品牌 - slogan」；「贝果科技」被台湾同名公司占住，加 BigoLab 区分，§9.3），
 * 不再和 /chongzhi/chatgpt-plus 抢「ChatGPT Plus 充值」，也不和 hub 的「AI 会员价格对比与充值」、/products 的「全部商品与价格」同短语。
 * 【用词依据】docs/SEO-重构/kw7（2026-10-07 Google 下拉实测）：chatgpt 充值 8、claude 充值 5（09-19 时是 0）、短信接码 8、海外手机号 9；
 * 「代充」不进 title（零需求词与自称，§3.4）；「会员」只用在 Claude 上（§9.4 #19 默认）；「AI 动态」是描述语、不是要排名的词。
 * 【按开放状态两个版本】短信接码没对全部用户开放时（灰度期）title、H1、description 都不写它（§3.3、D28）；
 * 学习平台总开关没开（整组 noindex）时 description 不提它。开票写到就带 6%（§3.1）。
 * 渠道站不走这里：保持原来那份 metadata（渠道站整站 noindex，白标规则见 generateMetadata）。
 */
const INVOICE_TAX_TEXT = `标价不含税，开票另付 ${Math.round(TAX_RATE * 100)}%`

function homeTitle(p: Pick<SitePillars, 'jiema'>): string {
  return p.jiema ? '贝果科技 BigoLab - ChatGPT/Claude 充值、短信接码、AI 动态' : '贝果科技 BigoLab - ChatGPT/Claude 充值与每日 AI 动态'
}

function homeDescription(p: Pick<SitePillars, 'jiema' | 'news' | 'learnIndexable'>): string {
  const parts = [`ChatGPT Plus / Pro、Claude Pro / Max 会员充值：卡密自助兑换，支付宝付款，可开增值税发票（${INVOICE_TAX_TEXT}）`]
  if (p.jiema) parts.push('短信接码用海外手机号在线接收验证码')
  const extra = [p.news ? '每日 AI 圈大事记' : null, p.learnIndexable ? '可复制的 AI 提示词与实测教程' : null].filter(Boolean)
  if (extra.length) parts.push(`另有${extra.join('与')}`)
  return `${parts.join('；')}。`
}

/**
 * 渠道白标（docs/多渠道分销-渠道品牌与公告.md）：渠道设了浏览器标题 / 分享摘要就用渠道的，没设则把原文里的「贝果科技」换成渠道站名；
 * 分享图换成渠道 logo。没有白标的渠道原样返回上面的 metadata（渠道站整站 noindex）。主站按开放状态出新的 title / description。
 */
export async function generateMetadata(): Promise<Metadata> {
  const sf = await getStorefront()
  if (sf && sf.kind === 'PLATFORM') {
    const p = await sitePillars()
    const title = homeTitle(p)
    const description = homeDescription(p)
    return { title, description, alternates: { canonical: '/' }, ...pageOg({ title, description, path: '/' }) }
  }
  const brand = await currentBrand()
  if (!brand.seoTitle && !brand.seoDescription) return brandMetadata(metadata)
  const title = brand.seoTitle ?? withBrandName(TITLE, brand)
  const description = brand.seoDescription ?? withBrandName(DESCRIPTION, brand)
  return brandShareImages(
    {
      ...metadata,
      title,
      description,
      // og:site_name 也换成渠道站名：A 包起 metadata.openGraph 经 pageOg 带着 OG_SITE（siteName「贝果科技」），这条分支不过 brandMetadata，要自己换
      openGraph: { ...metadata.openGraph, siteName: brand.name, title, description },
      twitter: { ...metadata.twitter, title, description },
    },
    brand,
  )
}

/** 首页热点：与 /api/news/hot 同一口径（lib/news/hot.ts），按店面缓存 60 秒（仓库唯一允许的跨请求缓存，设计 §6.6-8 Ha） */
const cachedHotNews = storefrontCached('home-hot-news', async (_sfId: number) => hotNewsEvents(5), 60_000)

export default async function HomePage() {
  // 店面解析不进 try（设计 4.4 第 7 条）。getLandingProducts 按店面取数：渠道站是本店可售商品与本店售价
  const sf = await getStorefront()
  // 没有店面的 Host 一律 404（(shop)/layout 已挡过一次），绝不回落成主站首页
  if (!sf) notFound()
  const channel = sf.kind === 'CHANNEL'
  const all = await getLandingProducts()
  // 复用 lowestPrice，不要在这里再实现一遍——两份实现迟早会漂。
  // hasStock 也要带上：唯一档位缺货的服务不能在首页被当成有货推出去。
  // 渠道站不渲染「按服务找」：每张卡片都链到充值落地页，而落地页在渠道站关闭（设计 11.2，W1-9 要求零 404 请求）
  const cards = channel ? [] : LANDINGS.map((l) => {
    const items = matchProducts(all, l.match)
    return { def: l, low: lowestPrice(items), hasStock: items.some(inStock) }
  })

  /*
   * 首页「精选服务」那六行。
   *
   * 【为什么在这里取而不是让客户端 fetch】原来 home-client 自己 useEffect 拉 /api/products?page=1&pageSize=6，
   * 服务端 HTML 里一个商品名、一个价格都没有（robots.txt 还 disallow 了 /api/，爬虫连那个接口都不会去抓）。
   * listStorefrontProducts 正是那个接口内部调的**同一个函数**，拿到的是本店可售商品与本店售价，
   * 只是从「JS 跑完才有」变成「HTML 里就有」。
   *
   * 【排序：销量优先，有货的排前面】（站长 2026-10-06 要求「按销量前几的展示」）
   * 原来跟着后台 sortOrder 走，首页第一位是一个只卖出过 1 单的代理开店服务，
   * 而卖了 242 单的 Claude Pro 排在它后面——首页这六行是转化率最高的位置，该让真正好卖的占着。
   * 「有货」放在销量之前比较：卖得最好的那档一旦断货，顶在首页第一行写着「补货中」是负转化。
   * 它不会消失，只是掉到有货的后面。销量是 Product.sales（全站累计，与落地页价格表同源，不是编的）。
   *
   * 【不传 ref】旧的客户端 fetch 也没带 ?ref=，首页从来就不按内推价展示，这里保持原样。
   * 【stock 已是档位代表值】listStorefrontProducts 出口过了 publicStock，不会把精确张数写进 HTML。
   */
  const previewUserId = sf.status === 'DRAFT' ? ((await getCurrentUser())?.id ?? null) : null
  const featured = (await listStorefrontProducts(sf, { previewUserId }))
    .slice()
    .sort((a, b) => Number(inStock(b)) - Number(inStock(a)) || b.sales - a.sales)
    .slice(0, 6)
    .map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice,
    stock: p.stock,
    sales: p.sales,
    image: p.image,
    deliveryType: p.deliveryType,
    categoryName: p.category?.name ?? null,
  }))

  // 首页那条信任数据带的数字。复用上面同一份快照，不额外打库。
  // 传给客户端组件是有意的：客户端组件同样会被服务端渲染，值会进服务端 HTML——
  // 而这正是要解决的问题（原来写死 useState(0)，爬虫读到的是「0 个用户」）。
  // 渠道站：与主站同一个合计 —— 全站在售商品 Product.sales 之和（二期 M1，站长要求两站显示同一个总销量），
  // 不是只加本店上架的那几个；skuCount 仍按本店可售商品数。主站分支原样不变。
  // 主站的业务开放状态与服务端直出区块（C 包，§1.10）。渠道站一概不取：渠道站首页不出大事记、接码、学习平台（W1-9、§6.7）
  const pillars = channel ? null : await sitePillars()
  let hotNews: NewsEventDto[] | undefined
  if (pillars?.news) {
    try {
      hotNews = await cachedHotNews(sf.id)
    } catch (e) {
      // 取不到就交回客户端自己拉（与改造前相同），不让首页 500
      console.error('[home] hot news', e)
    }
  }
  let jiemaServices: CatalogService[] | null = null
  if (pillars?.jiema) {
    try {
      const cfg = await readSmsConfigCached()
      if (cfg) jiemaServices = (await catalogSnapshot(cfg)).services
    } catch (e) {
      // 目录读不到：区块照常出入口、不写价格（§1.10：读不到数据不能让首页 500）
      console.error('[home] jiema catalog', e)
    }
  }

  const stats = {
    totalSales: channel ? await getPlatformTotalSales() : all.reduce((n, p) => n + (p.sales || 0), 0),
    skuCount: all.length,
  }

  return (
    <>
      {/* Organization 与 WebSite 全站只在首页输出一次，其余页面通过 @id 引用即可。
          每页都重复一遍不会加分，只会让每一页多出几百字节。 */}
      {/* 渠道站传 sf.origin：WebSite 的 @id / url 必须指向本店域名（设计 4.5 SITE_ID 按请求生成），
          否则渠道站 HTML 里会出现指向 bigolab.com 的绝对链接。主站仍不传参，输出逐字不变。
          Organization 是平台主体（统一品牌「贝果科技」），两站同值。 */}
      {/* 精选服务那六行现在是服务端直出的、买家肉眼可见的，所以可以（也只有这时才可以）标 ItemList：
          结构化数据政策明令禁止标记「用户在页面上看不到的内容」。改造前那一段是 JS 拉的，标了就是 cloaking。
          渠道站传 sf.origin，链接必须落在本店域名上（与上面 webSiteJsonLd 同一个口径）。 */}
      <JsonLd
        data={[
          // 主站按开放状态写各业务（§4.2）；渠道站保守口径（只写充值），主体两站相同
          organizationJsonLd(pillars ? { jiema: pillars.jiema, news: pillars.news, learn: pillars.learnIndexable } : {}),
          channel ? webSiteJsonLd(sf.origin) : webSiteJsonLd(),
          ...(featured.length ? [productItemListJsonLd(featured, '/', channel ? sf.origin : undefined)] : []),
        ]}
      />

      <HomeClient
        stats={stats}
        featured={featured}
        pillars={pillars ? { jiema: pillars.jiema, news: pillars.news } : undefined}
        hotNews={hotNews}
        pillarSections={
          pillars ? (
            <>
              {pillars.jiema && <HomeJiemaSection services={jiemaServices} />}
              {pillars.learn && <HomeLearnSection />}
            </>
          ) : undefined
        }
      />

      {/*
        服务端直出的「按服务找」区块。
        首页原本的商品卡片是 home-client.tsx 里 useEffect + fetch('/api/products') 拉的，
        服务端 HTML 里一个商品词、一个价格都没有；而 robots.txt 里 disallow 了 /api/，
        连 Googlebot 的渲染器都不会去抓那个接口——「反正 Google 会执行 JS」这条退路不成立。
        这一块补上真实价格与带关键词的内链，同时它也是买家真的用得上的一个入口。
      */}
      {cards.length > 0 && (
        <section className="container relative pb-24" aria-labelledby="home-services-heading">
          <div className="mx-auto max-w-6xl">
            <h2 id="home-services-heading" className="mb-3 text-2xl font-bold lg:text-3xl">
              按服务找：充值、注册与认证
            </h2>
            <p className="mb-8 text-sm text-white/40 lg:text-[15px]">
              每一项都有独立的说明页，写清楚了当前价格、该选哪个档位，以及兑换前必须先确认的事。
              <br />
              <strong className="text-white/60">所有标价均为不含税价</strong>
              ，需要发票的在售价之外另付 6% 税费，收据不涉及税费。
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map(({ def, low, hasStock }) => (
                <Link
                  key={def.slug}
                  href={landingPath(def.slug)}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <span className="font-semibold text-white transition-colors group-hover:text-purple-300">
                      {def.navLabel}
                    </span>
                    {low != null && (
                      <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-white/80">
                        ￥{low.toFixed(0)} 起
                      </span>
                    )}
                  </div>
                  <span className="mb-4 flex-1 text-sm leading-relaxed text-white/45">{def.blurb}</span>
                  <span className="inline-flex items-center gap-1 text-sm text-purple-400">
                    {hasStock ? '查看详情' : '查看详情（补货中）'}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>

            <p className="mt-8 text-sm text-white/40">
              也可以看{' '}
              <Link href={LANDING_HUB.path} className="text-purple-400 hover:text-purple-300">
                充值总览与价格表
              </Link>
              ，或直接翻{' '}
              <Link href="/products" className="text-purple-400 hover:text-purple-300">
                全部商品
              </Link>
              。第一次买建议先看{' '}
              <Link href="/support" className="text-purple-400 hover:text-purple-300">
                常见问题
              </Link>
              。
            </p>
          </div>
        </section>
      )}

      {/* 品牌级问答（§1.10 第 6 条，只在主站；不标 FAQPage） */}
      {pillars && <HomeBrandFaq jiema={pillars.jiema} jiemaPay={jiemaPayText(pillars.jiemaBalancePay)} news={pillars.news} invoiceTaxText={INVOICE_TAX_TEXT} />}
    </>
  )
}
