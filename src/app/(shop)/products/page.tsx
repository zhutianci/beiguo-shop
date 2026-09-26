// 【必须 force-dynamic】这一页现在要连库（服务端直出价格表 + ItemList 结构化数据），
// 而 next build 的 builder 容器不在 app-network 上、没有 DATABASE_URL。
// 一旦被当成静态路由预渲染，整个构建会直接失败（/news、/links、sitemap 同理）。
export const dynamic = 'force-dynamic'

import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { SITE_NAME } from '@/lib/product-seo'
import { JsonLd } from '@/lib/seo/jsonld'
import { breadcrumbJsonLd, productItemListJsonLd } from '@/lib/seo/graph'
import { Breadcrumbs } from '@/components/landing/landing-ui'
import { LANDINGS, landingPath, matchProducts } from '@/lib/landing/registry'
import ProductsClient, { type CategoryGuide } from './products-client'
import { OG_IMAGES, OG_SITE, TWITTER_IMAGES } from '@/lib/seo/og'
import { publicStock } from '@/lib/stock-level'
import { getStorefront } from '@/lib/storefront/resolve'
import { listStorefrontProducts } from '@/lib/pricing'
import { getCurrentUser } from '@/lib/auth'
import type { StoreContact } from '@/lib/contact'

/**
 * 商品列表页。
 *
 * 【这一页此前在 Google 眼里几乎是空的】商品卡片全靠 products-client.tsx 的
 * useEffect + fetch('/api/products') 客户端取数，服务端 HTML 里一个商品名都没有。
 * 更要命的是 robots.txt 里 disallow 了 /api/ —— 连 Googlebot 的渲染器都不会去抓那个接口，
 * 所以「Google 会执行 JS」这条退路在这里是不成立的。
 * 结果就是：全站最该吃「ChatGPT 代充」「Claude 充值」这类词的列表页，
 * 正文里没有任何一个商品词、没有任何一个价格。
 *
 * 【现在的做法：服务端一次取好，客户端只管展示与切换】
 * 曾经的折中是「客户端卡片区 + 服务端补一张价格表」，两块内容重复、维护两套。
 * 现在把数据一次性传给客户端组件——客户端组件同样会被 SSR，
 * 所以商品名、价格、分类全部落在首屏 HTML 里，同时切分类/换视图不再发请求。
 * 在售商品只有二十来个，全量下发比分页简单也快；真涨到几百个再谈分页。
 *
 * 【默认列表模式】信息密度高，一屏扫完型号与价格；卡片模式保留，选择记在 localStorage。
 * 服务端固定渲染列表模式，避免 hydration 不一致。
 */

const getProducts = cache(async () => {
  try {
    return await prisma.product.findMany({
      where: { status: 1 },
      // 字段与 components/products 里 ListProduct 对齐。刻意不取 cardUsage /
      // cardRedeemUrl / referrerBasePrice 这些内部字段——列表页用不到，
      // 而它们会随 props 一起进到客户端 HTML 里（和 api/products 泄露是同一类问题）
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        price: true,
        originalPrice: true,
        image: true,
        stock: true,
        sales: true,
        deliveryType: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: 200,
    })
  } catch (err) {
    // 库挂了不能让整页 500：价格表这一块直接不渲染，上面的客户端卡片区照常工作
    console.error('Products list SEO query error:', err)
    return []
  }
})

/*
 * 【2026-09-24 改词】原标题是「AI 会员代充商品与价格 - …」，50 个字符，而且拿零需求词开头：
 * 实测 ai会员代充 / ai代充 的 Google 下拉联想数为 0，百度标题又只显示前 30 个汉字左右。
 * 现在用实测有量的说法打头：chatgpt plus 购买（10 条联想）、chatgpt plus 充值、
 * claude pro 充值、chatgpt plus 价格（价格表 / 人民币）。
 * 描述原来只写了「Max 5x」（20x、Pro 20x、Grok 都在卖），还用了零需求的「谷歌邮箱」，一并改掉；
 * 「卡密自助充值」也不对全部商品成立（接码、KYC、账号类不是），改成只说充值类。
 */
const TITLE = `ChatGPT Plus / Claude Pro 充值与购买价格表 - ${SITE_NAME}`
const DESCRIPTION =
  'ChatGPT Plus / Pro、Claude Pro / Max 会员充值与购买价格表，另有 Grok Super 充值、Codex 与 Claude 注册接码、谷歌账号。充值类为卡密自助兑换，仅支持支付宝；标价不含税，开票另付 6%。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // 列表页会被带 ?ref= / ?category= 分享与抓取，canonical 一律指回干净地址
  alternates: { canonical: '/products' },
  openGraph: {
    ...OG_SITE,
    images: OG_IMAGES,
    type: 'website',
    title: TITLE,
    description: DESCRIPTION,
    url: '/products',
  },
  // 原来没写 twitter：会继承根 layout 那份全站标题/描述，与本页的 og 对不上
  twitter: { images: TWITTER_IMAGES, card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

/**
 * 页面上的展示顺序：按分类分组（分类按首次出现的先后），组内按价格从低到高。
 *
 * 【ItemList 必须和页面看到的顺序一致】原来 ItemList 用的是库里的 sortOrder 顺序，
 * 而列表模式实际是「分组 + 组内价格升序」——结构化数据里的第 1 名和页面上的第 1 行不是同一个商品。
 * 现在服务端先排好，ItemList 与传给客户端组件的数组是同一个顺序；
 * 客户端分组时保持这个顺序，组内再按（可能被专属价覆盖的）价格排一次，公开价下是原样。
 * Array.prototype.sort 是稳定的，同价商品保持库里的先后，两边一致。
 */
function displayOrder<T extends { categoryName: string; price: number }>(rows: T[]): T[] {
  const groups = new Map<string, T[]>()
  rows.forEach((p) => {
    const arr = groups.get(p.categoryName)
    if (arr) arr.push(p)
    else groups.set(p.categoryName, [p])
  })
  // 不 for...of 直接迭代 Map：tsconfig 没开 downlevelIteration
  const out: T[] = []
  groups.forEach((arr) => {
    arr.slice().sort((a, b) => a.price - b.price).forEach((p) => out.push(p))
  })
  return out
}

/**
 * 每个分类组对应的选购指南（充值落地页）。
 *
 * 【为什么在服务端算】匹配规则在 lib/landing/registry.ts，和落地页价格表同一套；
 * 客户端组件只拿结果。一个分类可能对应多页（Claude 分类下有 Pro / Max / KYC 三页），
 * 按注册表顺序去重列出。此前 /products 到 9 个落地页一条站内链接都没有（页头页脚除外）。
 */
function guidesByCategory(
  products: { name: string; categoryName: string }[]
): Record<string, CategoryGuide[]> {
  const out: Record<string, CategoryGuide[]> = {}
  products.forEach((p) => {
    const list = out[p.categoryName] || (out[p.categoryName] = [])
    LANDINGS.forEach((l) => {
      if (!matchProducts([p], l.match).length) return
      if (list.some((g) => g.href === landingPath(l.slug))) return
      list.push({ href: landingPath(l.slug), label: l.navLabel })
    })
  })
  // 保持注册表顺序，而不是商品遍历到的顺序
  const order = LANDINGS.map((l) => landingPath(l.slug))
  Object.keys(out).forEach((k) => out[k].sort((a, b) => order.indexOf(a.href) - order.indexOf(b.href)))
  return out
}

/**
 * 渠道站的商品列表（设计 7.4、W2-6）：只列本店可售的上架行，price = 本店售价。
 * 【传给客户端组件的 props 会进 HTML 与 RSC payload】所以这里逐字段构造，只有公开字段：
 * 没有站长价、进货价、成本（lib/pricing.ts 的 PublicProductCard 本身就不含这些）。
 * 查库失败与主站同样降级为空列表（客户端卡片区照常工作），但 getStorefront 本身不进 try。
 */
async function channelProducts(sf: NonNullable<Awaited<ReturnType<typeof getStorefront>>>) {
  const previewUserId = sf.status === 'DRAFT' ? ((await getCurrentUser())?.id ?? null) : null
  try {
    const cards = await listStorefrontProducts(sf, { previewUserId })
    return cards.map((p) => ({
      id: p.id,
      categoryId: p.categoryId ?? 0,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      image: p.image,
      stock: p.stock,
      sales: p.sales,
      deliveryType: p.deliveryType,
      categoryName: p.category?.name ?? '其他',
    }))
  } catch (err) {
    console.error('Channel products list query error:', err)
    return []
  }
}

export default async function ProductsPage() {
  // 店面解析不进 try（设计 4.4 第 7 条）。没有店面的 Host（严格期未知 Host、域名停用）一律 404：
  // (shop)/layout 的 requireShopStorefront 已经挡过，这里再挡一次，绝不回落成主站列表
  const sf = await getStorefront()
  if (!sf) notFound()
  if (sf.kind === 'CHANNEL') {
    const products = displayOrder(await channelProducts(sf))
    /*
     * 渠道站：不输出 ItemList 结构化数据（整站 noindex，设计 4.8）；不给「选购指南」链接（充值落地页在渠道站关闭，
     * 设计 11.2——给了就是一排点进去 404 的链接）；底部说明与主站相同（统一品牌）。
     */
    return (
      <>
        <div className="container relative page-top pb-0">
          <Breadcrumbs crumbs={[{ name: '首页', path: '/' }, { name: '全部商品' }]} />
        </div>
        <ProductsClient products={products} guides={{}} />
        {products.length > 0 && <PriceNote contact={sf.contact} />}
      </>
    )
  }

  const rows = await getProducts()

  // 映射成客户端组件的形状。Decimal 必须在服务端转成 number：
  // Prisma 的 Decimal 不是可序列化的普通值，直接当 props 传会报
  //「Only plain objects can be passed to Client Components」
  const products = displayOrder(
    rows.map((p) => ({
      id: p.id,
      categoryId: p.categoryId,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      originalPrice: p.originalPrice == null ? null : Number(p.originalPrice),
      image: p.image,
      stock: publicStock(p.stock), // RSC props 会进页面源码：只给档位代表值
      sales: p.sales,
      deliveryType: p.deliveryType ?? null,
      categoryName: p.category?.name ?? '其他',
    }))
  )

  return (
    <>
      <JsonLd
        data={[
          // 库不可达时 rows 是空数组，这时不要输出一个 numberOfItems:0 的空 ItemList——
          // 那等于主动告诉搜索引擎「这个列表页什么都没有」，比不输出更糟
          ...(products.length ? [productItemListJsonLd(products, '/products')] : []),
          breadcrumbJsonLd([{ name: '首页', path: '/' }, { name: '全部商品' }]),
        ]}
      />
      {/* 可见面包屑。上面输出了 BreadcrumbList，页面上就必须真的有这一条——
          标记用户看不到的内容是 Google 结构化数据政策明令禁止的。 */}
      <div className="container relative page-top pb-0">
        <Breadcrumbs crumbs={[{ name: '首页', path: '/' }, { name: '全部商品' }]} />
      </div>

      <ProductsClient products={products} guides={guidesByCategory(products)} />

      {rows.length > 0 && <PriceNote contact={sf.contact} />}
    </>
  )
}

/**
 * 列表底部的价格与开票说明（两站相同，统一品牌）。
 * 末尾的客服微信按店面取（二期改动 4.2）：主站 sf.contact = PLATFORM_CONTACT，渲染与原来写死的 GenuineMarxist 逐字相同；
 * 渠道只传了二维码没填微信号时，不写出空的微信号，改指向右下角的客服入口。
 */
function PriceNote({ contact }: { contact: StoreContact }) {
  return (
    <section className="container relative pb-20">
      <p className="mx-auto max-w-5xl text-sm text-white/40">
        价格随上游成本与汇率浮动，以下单时页面显示的实付金额为准；
        <strong className="text-white/70">标价均为不含税价</strong>
        ，需要增值税发票的须在售价之外另付 6% 税费（开票金额 = 售价 × 1.06），收据不涉及税费。
        不确定该买哪一个？先看{' '}
        <Link href="/support" className="text-purple-400 hover:text-purple-300">
          常见问题
        </Link>
        {contact.wechat ? (
          <>
            ，或直接联系客服微信 <span className="font-mono text-white/60">{contact.wechat}</span>。
          </>
        ) : (
          '，或直接点右下角「联系客服」。'
        )}
      </p>
    </section>
  )
}
