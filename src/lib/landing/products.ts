import { cache } from 'react'
import { prisma } from '@/lib/db'
import type { ProductMatch } from './registry'

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

/**
 * 按注册表里的规则从快照里挑出这一页该展示的商品。
 *
 * 【比较一律 trim + 忽略大小写】后台的分类名和商品名是手填的，
 * 多一个空格、大小写换一下，精确比较就会让整个落地页的价格表**静默变空**——
 * 不报错、不抛异常，页面照常渲染，只是表没了。这类事故只能靠比较本身宽松一点来防。
 */
function norm(v: string): string {
  return v.trim().toLowerCase()
}

export function matchProducts(all: LandingProduct[], m: ProductMatch): LandingProduct[] {
  return all.filter((p) => {
    const cat = norm(p.categoryName ?? '')
    if (m.categoryName && cat !== norm(m.categoryName)) return false
    if (m.categoryAny && !m.categoryAny.some((c) => cat === norm(c))) return false
    const name = norm(p.name)
    if (m.nameAny && !m.nameAny.some((k) => name.includes(norm(k)))) return false
    if (m.nameNone && m.nameNone.some((k) => name.includes(norm(k)))) return false
    return true
  })
}

/** 有货判定：stock === -1 是模型里「无限库存」的约定 */
export function inStock(p: LandingProduct): boolean {
  return p.stock === -1 || p.stock > 0
}

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
