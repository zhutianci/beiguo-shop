/**
 * 商品页的 SEO 装配：标题 / 描述 / Product 结构化数据。
 *
 * 【为什么单独有这个文件】2026-09-14 实测发现：`/products/3` 与 `/products/5`
 * 的 <title> 和 <meta description> **一模一样**，都是 layout.tsx 里那条全站默认值，
 * 结构化数据 0 条。原因是 `products/[id]/page.tsx` 第一行是 'use client'，
 * 客户端组件用不了 generateMetadata。
 * 结果就是：最该吃搜索流量的页面，在 Google 眼里是同一个页面，
 * 反倒不直接赚钱的新闻模块（Server Component + generateMetadata）做得很规范。
 *
 * 【价格与库存必须与页面上看得见的一致】Google 的结构化数据政策明确禁止
 * 标记用户看不到的内容。这里所有字段都取自商品本身，不做任何加工。
 *
 * 【刻意不输出 aggregateRating / review】站上没有真实评价体系。
 * 为了富摘要编一个评分是最典型的「结构化数据造假」，会吃人工处罚，
 * 而且一旦被判定，影响的是整个域名，不止这一个页面。sales 是真实数字，
 * 但它是销量不是评分，不能拿来充数。
 */
import { absUrl, SITE_LOGO } from './news/seo'
import { siteOrigin } from './news/format'

export interface SeoProduct {
  id: number
  name: string
  description?: string | null
  price: number
  originalPrice?: number | null
  stock: number
  image?: string | null
  categoryName?: string | null
}

/** 站点名。与 layout.tsx 的标题后缀保持一致 */
export const SITE_NAME = '贝果科技'

/** 商品页路径（不带任何查询参数，canonical 用它） */
export function productPath(id: number): string {
  return `/products/${id}`
}
export function productUrl(id: number): string {
  return absUrl(productPath(id))
}

/**
 * 商品页标题。
 *
 * 形如「Claude Max20x自助充值 | iOS订阅充值 - 贝果科技」。
 * 商品名本身就带着买家会搜的词（Claude / ChatGPT / Pro / Max / 充值），
 * 不额外堆砌关键词 —— 标题塞关键词在现在的排序里没有增益，还会被判垃圾。
 */
export function productTitle(p: SeoProduct): string {
  const name = p.name.trim()
  // 商品名已经很长时不再追加站名，避免 Google 在结果里截断掉有效信息
  return name.length > 40 ? name : `${name} - ${SITE_NAME}`
}

/**
 * 商品页描述。优先用商品自己的简介，没有就按模板兜底。
 * 控制在 ~150 字内：超出部分 Google 会截断，写了也不显示。
 */
export function productDescription(p: SeoProduct): string {
  const desc = (p.description || '').replace(/\s+/g, ' ').trim()
  if (desc) return desc.length > 150 ? `${desc.slice(0, 147)}…` : desc
  const price = Number.isFinite(p.price) ? `￥${p.price.toFixed(2)}` : ''
  return `${p.name} ${price}。${SITE_NAME}提供 Claude、ChatGPT 订阅代开与充值服务，下单后人工核验发货，支持开具发票。`.trim()
}

/**
 * Product 结构化数据（JSON-LD）。
 *
 * availability 只有两种取值，对应页面上买家看得见的状态：
 * stock === -1 表示无限库存（模型里的约定），其余按实际数量判断。
 */
export function productJsonLd(p: SeoProduct): Record<string, unknown> {
  const inStock = p.stock === -1 || p.stock > 0
  const url = productUrl(p.id)

  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    url,
    priceCurrency: 'CNY',
    price: p.price.toFixed(2),
    availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    seller: { '@type': 'Organization', name: SITE_NAME, url: siteOrigin() },
  }

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: productDescription(p),
    url,
    // 没有商品图时退回站标，总比缺字段强（缺 image 会丢富摘要资格）
    image: absUrl(p.image || SITE_LOGO),
    sku: String(p.id),
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: offer,
  }
  if (p.categoryName) json.category = p.categoryName
  return json
}
