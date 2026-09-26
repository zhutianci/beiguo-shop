import { cache } from 'react'
import { prisma } from '@/lib/db'
import { inStock } from './registry'
import { getStorefront } from '@/lib/storefront/resolve'
import { listStorefrontProducts } from '@/lib/pricing'
import { getCurrentUser } from '@/lib/auth'

// 匹配与有货判定是纯函数，实现搬到了 registry.ts（理由见那边的注释）。
// 这里原样导出，已有的 `from '@/lib/landing/products'` 调用方不用改。
export { inStock, matchProducts } from './registry'

export interface LandingProduct {
  id: number
  name: string
  description: string | null
  price: number
  originalPrice: number | null
  stock: number
  sales: number
  categoryName: string | null
}

/**
 * 落地页用的在售商品快照。
 *
 * 【整表取一次再在内存里筛】在售商品只有十几个，一次查询喂给页面上的所有区块
 * （价格表、结构化数据、相关商品）比按规则分别查库简单得多，也少打几次 MySQL。
 * React cache 保证同一次请求内 generateMetadata 与页面主体共用同一份结果。
 *
 * 【库挂了返回空数组而不是抛】落地页的正文是这一页的主体，价格表只是其中一块。
 * 数据库不可达时应该少显示一张表，而不是给买家和爬虫一个 500。
 */
export const getLandingProducts = cache(async (): Promise<LandingProduct[]> => {
  /*
   * 【按店面取数】（设计 7.4）商品详情页的「同系列档位」、首页统计都用这份快照：渠道站必须是本店可售的商品、
   * 本店售价与本店销量，否则会把主站兄弟商品的价格写进渠道站 HTML（W2-6 值扫描）。
   * 放在这里而不是让每个调用方自己判断：将来多一个调用方也不会漏。店面解析不进 try（设计 4.4 第 7 条）。
   * 充值落地页（/chongzhi/*）在渠道站整组 404（WP1），但它们也经这里，拿到的同样是本店数据。
   */
  const sf = await getStorefront()
  if (!sf) return []
  if (sf.kind === 'CHANNEL') {
    const previewUserId = sf.status === 'DRAFT' ? ((await getCurrentUser())?.id ?? null) : null
    try {
      const cards = await listStorefrontProducts(sf, { previewUserId })
      return cards.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        stock: p.stock, // 档位代表值：只用于 inStock 判断，-1 / 0 / >0 三类与真实库存一致
        sales: p.sales,
        categoryName: p.category?.name ?? null,
      }))
    } catch (err) {
      console.error('Landing products (channel) query error:', err)
      return []
    }
  }
  try {
    const rows = await prisma.product.findMany({
      where: { status: 1 },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        originalPrice: true,
        stock: true,
        sales: true,
        category: { select: { name: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      take: 200,
    })
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      originalPrice: p.originalPrice == null ? null : Number(p.originalPrice),
      stock: p.stock,
      sales: p.sales,
      categoryName: p.category?.name ?? null,
    }))
  } catch (err) {
    console.error('Landing products query error:', err)
    return []
  }
})

/** 这一组商品里的最低价，用于标题/描述里的「￥X 起」。没有商品时返回 null */
export function lowestPrice(items: LandingProduct[]): number | null {
  const prices = items.filter(inStock).map((p) => p.price)
  const pool = prices.length ? prices : items.map((p) => p.price)
  return pool.length ? Math.min(...pool) : null
}

/**
 * 把描述里那个价格数字换成实时价。
 *
 * 【为什么不直接 String.replace 字面量】各页原本写的是
 * `DEF.description.replace('￥135 起', ...)` —— 只要有人改了 registry 里那半句的写法
 * （数字变了、空格没了、「起」换成「上下」），替换就**静默失配**：
 * 没有报错、没有类型错误，SERP 上从此一直挂着 registry 里那个写死的旧价。
 * 按模式匹配就没有这个问题：只要形如「￥数字」就能换掉。
 *
 * @param description registry 里的原文
 * @param price       实时价格；null（库不可达）时原样返回，
 *                    宁可发一个可能过时几分钟的价格，也好过发一个空描述
 */
export function withLivePrice(
  description: string,
  price: number | null,
  /**
   * 要替换的那一处价格的匹配模式。默认匹配第一个「￥数字」。
   * 有的页面 description 里那个数字**特指某一档**而不是全站最低价
   * （例如 codex 页写的是「美区实体手机卡接码（￥15/次）」，
   * 拿全站最低价 ￥8 去替换就会写出一句假话），这时候传一个更窄的模式进来。
   */
  pattern: RegExp = /￥\d+(?:\.\d+)?/
): string {
  if (price == null) return description
  if (!pattern.test(description)) {
    // 匹配不上通常意味着 registry 里的文案改了格式，而这里没跟着改。
    // 不抛异常（描述照旧发出去总比页面挂掉好），但要在日志里留痕，否则永远发现不了。
    console.warn('[landing] withLivePrice 未命中价格模式，description 将原样输出:', description.slice(0, 40))
    return description
  }
  return description.replace(pattern, `￥${price.toFixed(0)}`)
}
