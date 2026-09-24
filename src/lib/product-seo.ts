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
// ORG_ID 来自站点级结构化数据模块。graph.ts 不反向依赖本文件，不存在循环引用。
import { ORG_ID } from './seo/graph'

export interface SeoProduct {
  id: number
  name: string
  description?: string | null
  price: number
  originalPrice?: number | null
  stock: number
  image?: string | null
  categoryName?: string | null
  /**
   * 交付方式（AUTO / SMS / MANUAL）。描述模板按它选口径——
   * 原来对全部商品一律写「卡密自助兑换」，而接码（SMS）与人工（MANUAL）商品根本不发卡密，
   * 这句假话同时出现在 meta description 和 Product JSON-LD 里。
   */
  deliveryType?: string | null
  /**
   * 自动发货里「发的是账号信息」的商品（谷歌成品号、普号）：没有卡密可兑换，
   * 描述模板不能写「卡密自助兑换」。由调用方用 lib/product-intro.ts 的 isAccountProduct 算好传进来
   * （本文件保持纯函数，不去 import 落地页规则）
   */
  accountLike?: boolean
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

/** 商品简介短于这个长度就不够当 meta description 用，要拼模板补齐 */
const MIN_USEFUL_DESC = 40

/**
 * 商品页描述。控制在 ~150 字内：超出部分 Google 会截断，写了也不显示。
 *
 * 【原来这里有个 bug，而且刚好打在主力商品上】判断写的是 `if (desc) return desc`——
 * 只要商品有**任何**简介就直接用。而后台大量商品的简介只有三五个字：
 * 商品 16「Claude pro 自助充值」（215 单，主力档）的简介就是「自助充值」四个字，
 * 于是它在搜索结果里的描述就是这四个字，下面那段带价格、支付宝、发票的模板
 * 永远不会触发。搜索结果里一条四个字的描述，点击率可想而知。
 *
 * 改成按「够不够用」判断而不是「有没有」：
 *   · 简介够长 → 直接用（作者写的肯定比模板贴切）
 *   · 简介太短 → 用它当开头，后面补上价格与这个站真正的卖点
 *   · 完全没有 → 纯模板
 * 卖点部分只写能兑现的，而且**按交付方式分口径**（见 deliveryPitch）：
 * 支付宝、可开票且标价不含税是全站通用的；「卡密自助兑换」只对 AUTO 成立。
 * 不写「最快 X 分钟」这类做不到的承诺（站上其他地方已经因此清理过一轮）。
 *
 * 【两处拼接细节】
 *   · 简介自己带了句末标点（「…无关。」）时先剥掉再补「。」，否则就是线上那种「…无关。。」
 *   · 简介整句已经包含在商品名里（商品 16：名「Claude pro 自助充值 | …」、简介「自助充值」）
 *     就不再重复一遍——百度摘要只有七八十个字，不该花在同一个词上两次。
 */
export function productDescription(p: SeoProduct): string {
  const desc = (p.description || '').replace(/\s+/g, ' ').trim()
  const clip = (t: string) => (t.length > 150 ? `${t.slice(0, 147)}…` : t)

  if (desc.length >= MIN_USEFUL_DESC) return clip(desc)

  const price = Number.isFinite(p.price) ? `￥${p.price.toFixed(2)}` : ''
  const head = [p.name.trim(), price].filter(Boolean).join(' ')
  const body = desc.replace(/[\s。．.!！？?；;，,、]+$/, '')
  const redundant = !body || p.name.toLowerCase().includes(body.toLowerCase())
  const lead = redundant ? `${head}。` : `${head}：${body}。`
  return clip(`${lead}${deliveryPitch(p.deliveryType, !!p.accountLike)}`)
}

/**
 * 描述模板后半句。事实来源：lib/vmq.ts fulfillOrder（AUTO 发卡、SMS 付款后 acquireForOrder 自动取号、
 * 其余置为处理中等人工）、收银台只有支付宝、lib/invoice.ts TAX_RATE（标价不含税）。
 * 不认识的交付方式（老调用方没传）走中性口径，不替它声称任何交付形式。
 */
function deliveryPitch(t: string | null | undefined, accountLike = false): string {
  const tail = '支付宝付款，可开增值税发票（标价不含税，税费另付）。'
  if (t === 'AUTO' && accountLike) return `付款后自动发放账号信息，无需信用卡，${tail}`
  if (t === 'AUTO') return `${SITE_NAME}卡密自助兑换，无需信用卡，${tail}`
  if (t === 'SMS') return `付款后系统自动取号接码，不发卡密；${tail}`
  if (t === 'MANUAL') return `人工服务，付款后由客服对接完成，不发卡密；${tail}`
  return `${SITE_NAME}：无需信用卡，${tail}`
}

/**
 * 图片转绝对地址。后台可以直接贴一个 https:// 的图片地址，
 * absUrl 不分青红皂白地加站点前缀，会拼出「https://bigolab.com/https://…」这种坏地址。
 */
function absImage(src: string): string {
  if (/^https?:\/\//i.test(src)) return src
  if (src.startsWith('//')) return `https:${src}`
  return absUrl(src)
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
    /*
     * seller 用 @id 引用 Organization 节点，而不是在这里再写一个匿名组织。
     * 前提是商品页同时输出 organizationJsonLd()——那一份里带着 legalName
     *「益阳市赫山区必高科技有限公司」。对一个卖 AI 会员的站，
     * 「卖家是谁、能不能查」是买家和检索系统共同关心的第一件事，
     * 而此前这条信息在商品页的 HTML 里一次都没出现过。
     */
    seller: { '@id': ORG_ID },
  }

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: productDescription(p),
    url,
    // 没有商品图时退回站标，总比缺字段强（缺 image 会丢富摘要资格）
    image: absImage(p.image || SITE_LOGO),
    sku: String(p.id),
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: offer,
  }
  if (p.categoryName) json.category = p.categoryName
  return json
}
