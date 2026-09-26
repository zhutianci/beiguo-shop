// Server Component 外壳：只做 <head> 里的事（标题、描述、canonical、结构化数据）。
// 必须 force-dynamic —— 构建阶段没有 DATABASE_URL，预渲染会直接让构建失败
// （与 news/[slug] 同样的原因，那边注释里写过一次）。
export const dynamic = 'force-dynamic'

import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import {
  SITE_NAME,
  productDescription,
  productJsonLd,
  productPath,
  productTitle,
  type SeoProduct,
} from '@/lib/product-seo'
import { JsonLd } from '@/lib/seo/jsonld'
import { breadcrumbJsonLd, organizationJsonLd } from '@/lib/seo/graph'
import ProductDetailClient from './product-client'
import { OG_IMAGES, OG_SITE, TWITTER_IMAGES } from '@/lib/seo/og'
import { getLandingProducts } from '@/lib/landing/products'
import { buildProductIntro, isAccountProduct } from '@/lib/product-intro'
import { ProductIntroSection } from '@/components/products/product-intro'
import { publicStock } from '@/lib/stock-level'
import { getStorefront, type Storefront } from '@/lib/storefront/resolve'
import { getStorefrontProduct } from '@/lib/pricing'
import { getCurrentUser } from '@/lib/auth'

/**
 * 商品详情页。
 *
 * 【为什么要拆成外壳 + 客户端组件】此前整页是 'use client'，于是用不了
 * generateMetadata：`/products/3` 和 `/products/5` 的 <title> 与 <meta description>
 * 完全一样（都是 layout.tsx 的全站默认值），结构化数据 0 条。
 * 对搜索引擎来说，所有商品页是同一个页面，没有任何一个能靠自己的商品词排上去。
 *
 * 交互逻辑仍全部留在 product-client.tsx 里。这个文件负责 <head>，
 * 以及（2026-09-24 起）服务端直出的「商品介绍」区——见页面体里的注释。
 *
 * 【generateMetadata 与客户端各查一次库是可接受的】外壳查库只取 SEO 需要的几个字段，
 * 且用 React cache 去重（同一次请求内只打一次 MySQL）。
 * 让外壳把数据传给客户端组件反而要改动那 414 行的取数逻辑 —— 风险不划算。
 */

/**
 * 三态返回，不能合并成 null：
 *   SeoProduct → 正常
 *   'missing'  → 商品真的不存在（或已下架）→ 页面体里 notFound()，返回 404
 *   'error'    → 查库失败 → 页面照常渲染，metadata 走降级但**仍然带 canonical**
 * 合并成 null 的后果是：下架商品返回 200 + 全站默认标题 + 没有 canonical，
 * 正好又造出一批与首页重复的标题——这一轮花了力气才把它们清掉。
 */
type ProductLookup = SeoProduct | 'missing' | 'error'

/**
 * 客户端组件需要的完整形状。
 *
 * 【为什么要和 SeoProduct 分开】SeoProduct 是给 <head> 用的子集；
 * 客户端那 400 多行还要 features / sales / deliveryType / category.id。
 * 一次查库同时喂两边，不要为了省字段再打一次 MySQL。
 *
 * 【Decimal 必须转成 number】Prisma 的 Decimal 跨不过 Server → Client 的序列化边界，
 * 直接传会在运行时报「Only plain objects can be passed to Client Components」。
 */
export interface ClientProduct {
  id: number
  name: string
  description: string | null
  price: number
  originalPrice: number | null
  features: string | null
  image: string | null
  stock: number
  sales: number
  deliveryType?: string
  category: { id: number; name: string }
}

/**
 * 渠道站的同一份数据（设计 7.4、W2-6）：商品必须在本店可售（上架、授权、进货价已配、站长在售），price = 本店售价。
 * 【RSC props 会进页面源码】client 逐字段构造，只有公开字段；lib/pricing.ts 的结果本身就不含站长价、进货价、成本。
 * sales 是全站总销量 Product.sales（二期改动 M1：两站显示同一个总销量；本店销量只在渠道后台看）。
 */
async function getChannelProduct(sf: Storefront, id: number): Promise<{ seo: ProductLookup; client: ClientProduct | null }> {
  const previewUserId = sf.status === 'DRAFT' ? ((await getCurrentUser())?.id ?? null) : null
  try {
    const p = await getStorefrontProduct(sf, id, { previewUserId })
    if (!p) return { seo: 'missing', client: null }
    const categoryName = p.category?.name ?? null
    return {
      seo: {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        stock: p.stock,
        image: p.image,
        categoryName,
        deliveryType: p.deliveryType,
        accountLike: isAccountProduct({ name: p.name, categoryName, deliveryType: p.deliveryType ?? undefined }),
      },
      client: {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        features: p.features,
        image: p.image,
        stock: p.stock,
        sales: p.sales,
        deliveryType: p.deliveryType ?? undefined,
        category: p.category ?? { id: 0, name: '' },
      },
    }
  } catch (err) {
    console.error('Channel product query error:', err)
    return { seo: 'error', client: null }
  }
}

const getProduct = cache(
  async (id: number): Promise<{ seo: ProductLookup; client: ClientProduct | null }> => {
    if (!Number.isInteger(id) || id <= 0) return { seo: 'missing', client: null }
    // 店面解析不进 try（设计 4.4 第 7 条）。React cache 在同一请求内按 id 去重，店面也是同一请求内记忆的
    const sf = await getStorefront()
    if (!sf) return { seo: 'missing', client: null }
    if (sf.kind === 'CHANNEL') return getChannelProduct(sf, id)
    try {
      const p = await prisma.product.findFirst({
        where: { id, status: 1 },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          originalPrice: true,
          stock: true,
          sales: true,
          image: true,
          features: true,
          deliveryType: true,
          category: { select: { id: true, name: true } },
        },
      })
      if (!p) return { seo: 'missing', client: null }
      const price = Number(p.price)
      const originalPrice = p.originalPrice == null ? null : Number(p.originalPrice)
      return {
        seo: {
          id: p.id,
          name: p.name,
          description: p.description,
          price,
          originalPrice,
          stock: p.stock,
          image: p.image,
          categoryName: p.category?.name ?? null,
          // 描述模板按交付方式分口径：接码 / 人工商品不发卡密，不能跟着写「卡密自助兑换」
          deliveryType: p.deliveryType ?? null,
          // 发账号信息的自动发货商品（成品号 / 普号）同样没有卡密可兑换
          accountLike: isAccountProduct({ name: p.name, categoryName: p.category?.name ?? null, deliveryType: p.deliveryType }),
        },
        client: {
          id: p.id,
          name: p.name,
          description: p.description,
          price,
          originalPrice,
          features: p.features,
          // image 要跟着一起下发：详情页主视觉用它，漏了就永远是渐变块
          image: p.image,
          stock: publicStock(p.stock), // RSC props 会进页面源码：只给档位代表值（lib/stock-level.ts）
          sales: p.sales,
          deliveryType: p.deliveryType ?? undefined,
          category: p.category ?? { id: 0, name: '' },
        },
      }
    } catch (err) {
      // 库挂了不能让商品页整页 500，也不能让它退回全站默认标题（那就是一个重复标题页）：
      // 返回 'error'，由调用方给一份带 canonical 的降级 metadata，
      // 页面照常渲染——客户端组件挂载后自己还会再取一次数
      console.error('Product SEO query error:', err)
      return { seo: 'error', client: null }
    }
  }
)

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = Number(params.id)
  const { seo: product } = await getProduct(id)

  // 商品不存在：页面体会 notFound()，这里只需要一个不参与索引的标题
  if (product === 'missing') {
    return { title: `商品不存在 - ${SITE_NAME}`, robots: { index: false, follow: true } }
  }
  // 查库失败：页面照常渲染（客户端组件自己还会再取一次），
  // 但绝不能退回全站默认 metadata —— 那就是一个没有 canonical 的重复标题页
  if (product === 'error') {
    return {
      title: `商品详情 - ${SITE_NAME}`,
      alternates: { canonical: productPath(id) },
    }
  }

  return {
    title: productTitle(product),
    description: productDescription(product),
    /*
     * 【canonical 在这里不是可选项】推广人分享出去的是 /products/3?ref=CODE，
     * 这些链接会被真实地抓取。带 ref 时 /api/products 返回的是**专属价**，
     * 而专属价可能高于网站定价（线上有 19 个商品是这样，最大一例 1700 → 1800）。
     * 不声明 canonical，Google 很可能收录带 ref 的那个副本，
     * 于是搜索结果里显示的价格比你官网还贵，而且是一批重复页面互相稀释权重。
     */
    alternates: { canonical: productPath(product.id) },
    openGraph: {
      // siteName / locale 必须每页带上：子页面的 openGraph 是整块替换根 layout 的那一份
      ...OG_SITE,
      images: OG_IMAGES,
      type: 'website',
      title: productTitle(product),
      description: productDescription(product),
      url: productPath(product.id),
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: 'summary_large_image',
      title: productTitle(product),
      description: productDescription(product),
    },
  }
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const { seo, client } = await getProduct(Number(params.id))
  // 商品真的不存在就返回 404。返回 200 的空壳既误导买家，也会被搜索引擎收录成软 404。
  if (seo === 'missing') notFound()
  // 查库失败时不 404：库一会儿就回来了，而 404 一旦被抓到是要花很久才能撤销的
  const product = seo === 'error' ? null : seo

  /*
   * 「商品介绍」区：交付方式与时效、购买步骤、价格与发票、购买须知、同系列其他档位、常见问题，
   * 以及指向对应充值落地页的「完整购买指南」。内容由 lib/product-intro.ts 按交付方式与
   * 匹配到的落地页装配，每一句的出处写在那边的注释里。
   *
   * 【为什么在外壳里做、而不是在客户端组件里】它必须进服务端 HTML，而且不该带上任何客户端 JS。
   * 作为 children 传给 ProductDetailClient，由它摆进左栏——客户端组件只负责「放在哪」。
   *
   * 同系列档位用的是落地页那份在售快照（React cache，与落地页价格表同一份数据、同一套匹配规则）。
   * 快照查询失败时返回空数组，那一小节不渲染，其余照常。
   */
  // 同系列档位：getLandingProducts 按店面取数，渠道站只列本店可售商品、价格为本店售价（不会把主站兄弟商品价格写进渠道站 HTML，设计 7.4）
  const catalog = product ? await getLandingProducts() : []
  // 店面在装配商品介绍之前取：介绍里的客服微信号与服务时间按店面取值（二期改动 4.2，主站 = PLATFORM_CONTACT，文案逐字不变）。
  // getStorefront 按请求缓存，这里提前取不多查库；不进 try
  const sf = await getStorefront()
  const built = product
    ? buildProductIntro(
        { id: product.id, name: product.name, categoryName: product.categoryName, deliveryType: product.deliveryType },
        catalog,
        sf ? sf.contact : undefined
      )
    : null
  // 渠道站没有充值落地页（设计 11.2 关闭 /chongzhi），「完整购买指南」链接去掉，否则是一个点进去 404 的入口
  const channel = !!sf && sf.kind === 'CHANNEL'
  const intro = built && channel ? { ...built, guide: null } : built

  return (
    <>
      {/* JSON-LD 必须在首屏 HTML 里，客户端注入的抓不到（同 ArticleJsonLd 的注释）。
          转义 `<` 由 JsonLd 组件统一负责——商品名是后台手填的，理论上可以含 "</script>"，
          少了那一步就是可注入的 XSS 口子。

          【面包屑三级，与页面上可见的那条逐级一致】分类不进层级：它是
          /products?category=N 这个筛选视图，canonical 指回 /products，
          写进 BreadcrumbList 等于宣称它是一个独立层级，与 canonical 自相矛盾。
          product-client.tsx 里那条可见面包屑同样没有分类级，两边必须一直对齐。 */}
      {/* 渠道站不输出 Product JSON-LD：整站 noindex，且 Offer 价是渠道价（设计 4.8） */}
      {product && !channel && (
        <JsonLd
          data={[
            productJsonLd(product),
            /*
             * Organization 在这里必须跟着一起输出。
             * Offer.seller 现在写的是 { '@id': ORG_ID } —— 一个引用；
             * 如果这一页不输出被引用的那个节点，引用就是悬空的，等于没写卖家。
             * 而这一份里带着 legalName「益阳市赫山区必高科技有限公司」：
             * 在此之前，商品页的 HTML 里从来没出现过经营主体是谁。
             * 对一个卖 AI 会员的站，这条信息是相对无照个人卖家唯一的结构性优势。
             */
            organizationJsonLd(),
            breadcrumbJsonLd([
              { name: '首页', path: '/' },
              { name: '全部商品', path: '/products' },
              { name: product.name },
            ]),
          ]}
        />
      )}
      {/* initialProduct 是这一页能被搜索引擎读到的关键：客户端组件会被 SSR，
          但此前它的数据来自 useEffect 里的 fetch，SSR 那一刻还是 null，
          渲染出来只有「加载中…」——H1、商品名、价格、说明一个都不在 HTML 里。
          传了之后整页直出；带 ?ref= 的专属价仍由客户端挂载后那次 fetch 覆盖。 */}
      <ProductDetailClient initialProduct={client}>
        {intro && product && <ProductIntroSection intro={intro} productId={product.id} />}
      </ProductDetailClient>
    </>
  )
}
