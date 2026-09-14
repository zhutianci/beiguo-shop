// Server Component 外壳：只做 <head> 里的事（标题、描述、canonical、结构化数据）。
// 必须 force-dynamic —— 构建阶段没有 DATABASE_URL，预渲染会直接让构建失败
// （与 news/[slug] 同样的原因，那边注释里写过一次）。
export const dynamic = 'force-dynamic'

import { cache } from 'react'
import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import {
  productDescription,
  productJsonLd,
  productPath,
  productTitle,
  type SeoProduct,
} from '@/lib/product-seo'
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

const getProduct = cache(async (id: number): Promise<SeoProduct | null> => {
  if (!Number.isInteger(id) || id <= 0) return null
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
    if (!p) return null
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
    // 库挂了不能让商品页整页 500 —— 退回全站默认 metadata，页面照常渲染
    console.error('Product SEO query error:', err)
    return null
  }
})

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProduct(Number(params.id))
  if (!product) return {}

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
  const product = await getProduct(Number(params.id))

  return (
    <>
      {/* JSON-LD 必须在首屏 HTML 里，客户端注入的抓不到（同 ArticleJsonLd 的注释） */}
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // 商品名/简介是后台手填的，理论上可能含 "</script>"。转义 < 是必要的一步，
            // 少了它就是可注入的 XSS 口子，而 JSON 里的 < 语义完全等价
            __html: JSON.stringify(productJsonLd(product)).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <ProductDetailClient />
    </>
  )
}
