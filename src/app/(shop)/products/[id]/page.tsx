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
import { breadcrumbJsonLd } from '@/lib/seo/graph'
import ProductDetailClient from './product-client'

/**
 * 商品详情页。
 *
 * 【为什么要拆成外壳 + 客户端组件】此前整页是 'use client'，于是用不了
 * generateMetadata：`/products/3` 和 `/products/5` 的 <title> 与 <meta description>
 * 完全一样（都是 layout.tsx 的全站默认值），结构化数据 0 条。
 * 对搜索引擎来说，所有商品页是同一个页面，没有任何一个能靠自己的商品词排上去。
 *
 * 交互逻辑仍全部留在 product-client.tsx 里，一行没改。这个文件只负责 <head>。
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

const getProduct = cache(async (id: number): Promise<ProductLookup> => {
  if (!Number.isInteger(id) || id <= 0) return 'missing'
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
        image: true,
        category: { select: { name: true } },
      },
    })
    if (!p) return 'missing'
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      originalPrice: p.originalPrice == null ? null : Number(p.originalPrice),
      stock: p.stock,
      image: p.image,
      categoryName: p.category?.name ?? null,
    }
  } catch (err) {
    // 库挂了不能让商品页整页 500，也不能让它退回全站默认标题（那就是一个重复标题页）：
    // 返回 'error'，由调用方给一份带 canonical 的降级 metadata，页面照常渲染
    console.error('Product SEO query error:', err)
    return 'error'
  }
})

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = Number(params.id)
  const product = await getProduct(id)

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
      type: 'website',
      title: productTitle(product),
      description: productDescription(product),
      url: productPath(product.id),
    },
    twitter: {
      card: 'summary_large_image',
      title: productTitle(product),
      description: productDescription(product),
    },
  }
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const lookup = await getProduct(Number(params.id))
  // 商品真的不存在就返回 404。返回 200 的空壳既误导买家，也会被搜索引擎收录成软 404。
  if (lookup === 'missing') notFound()
  // 查库失败时不 404：库一会儿就回来了，而 404 一旦被抓到是要花很久才能撤销的
  const product = lookup === 'error' ? null : lookup

  return (
    <>
      {/* JSON-LD 必须在首屏 HTML 里，客户端注入的抓不到（同 ArticleJsonLd 的注释）。
          转义 `<` 由 JsonLd 组件统一负责——商品名是后台手填的，理论上可以含 "</script>"，
          少了那一步就是可注入的 XSS 口子。

          【面包屑三级，与页面上可见的那条逐级一致】分类不进层级：它是
          /products?category=N 这个筛选视图，canonical 指回 /products，
          写进 BreadcrumbList 等于宣称它是一个独立层级，与 canonical 自相矛盾。
          product-client.tsx 里那条可见面包屑同样没有分类级，两边必须一直对齐。 */}
      {product && (
        <JsonLd
          data={[
            productJsonLd(product),
            breadcrumbJsonLd([
              { name: '首页', path: '/' },
              { name: '全部商品', path: '/products' },
              { name: product.name },
            ]),
          ]}
        />
      )}
      <ProductDetailClient />
    </>
  )
}
