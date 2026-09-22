// 【必须 force-dynamic】这一页现在要连库（服务端直出价格表 + ItemList 结构化数据），
// 而 next build 的 builder 容器不在 app-network 上、没有 DATABASE_URL。
// 一旦被当成静态路由预渲染，整个构建会直接失败（/news、/links、sitemap 同理）。
export const dynamic = 'force-dynamic'

import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { SITE_NAME } from '@/lib/product-seo'
import { JsonLd } from '@/lib/seo/jsonld'
import { breadcrumbJsonLd, productItemListJsonLd } from '@/lib/seo/graph'
import { Breadcrumbs } from '@/components/landing/landing-ui'
import ProductsClient from './products-client'
import { OG_IMAGES, TWITTER_IMAGES } from '@/lib/seo/og'

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

const TITLE = `AI 会员代充商品与价格 - ChatGPT Plus / Claude Pro 充值 - ${SITE_NAME}`
const DESCRIPTION =
  'ChatGPT Plus / Pro、Claude Pro / Max 5x 会员代充值价目表，另有 Codex 与 Claude 注册验证码接码、谷歌邮箱成品号。卡密自助充值，支持支付宝，可开增值税发票。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // 列表页会被带 ?ref= / ?category= 分享与抓取，canonical 一律指回干净地址
  alternates: { canonical: '/products' },
  openGraph: { images: OG_IMAGES, type: 'website', title: TITLE, description: DESCRIPTION, url: '/products' },
}

export default async function ProductsPage() {
  const rows = await getProducts()

  // 映射成客户端组件的形状。Decimal 必须在服务端转成 number：
  // Prisma 的 Decimal 不是可序列化的普通值，直接当 props 传会报
  //「Only plain objects can be passed to Client Components」
  const products = rows.map((p) => ({
    id: p.id,
    categoryId: p.categoryId,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    originalPrice: p.originalPrice == null ? null : Number(p.originalPrice),
    image: p.image,
    stock: p.stock,
    sales: p.sales,
    deliveryType: p.deliveryType ?? null,
    categoryName: p.category?.name ?? '其他',
  }))

  return (
    <>
      <JsonLd
        data={[
          // 库不可达时 rows 是空数组，这时不要输出一个 numberOfItems:0 的空 ItemList——
          // 那等于主动告诉搜索引擎「这个列表页什么都没有」，比不输出更糟
          ...(rows.length ? [productItemListJsonLd(rows, '/products')] : []),
          breadcrumbJsonLd([{ name: '首页', path: '/' }, { name: '全部商品' }]),
        ]}
      />
      {/* 可见面包屑。上面输出了 BreadcrumbList，页面上就必须真的有这一条——
          标记用户看不到的内容是 Google 结构化数据政策明令禁止的。 */}
      <div className="container relative page-top pb-0">
        <Breadcrumbs crumbs={[{ name: '首页', path: '/' }, { name: '全部商品' }]} />
      </div>

      <ProductsClient products={products} />

      {rows.length > 0 && (
        <section className="container relative pb-20">
          <p className="mx-auto max-w-5xl text-sm text-white/40">
            价格随上游成本与汇率浮动，以下单时页面显示的实付金额为准；
            <strong className="text-white/70">标价均为不含税价</strong>
            ，需要增值税发票的须在售价之外另付 6% 税费（开票金额 = 售价 × 1.06），收据不涉及税费。
            不确定该买哪一个？先看{' '}
            <Link href="/support" className="text-purple-400 hover:text-purple-300">
              常见问题
            </Link>
            ，或直接联系客服微信 <span className="font-mono text-white/60">GenuineMarxist</span>。
          </p>
        </section>
      )}
    </>
  )
}
