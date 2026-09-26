/**
 * 统一定价入口（设计 7.4，WP2）。「这个店面、这个商品、此刻卖多少钱、能不能卖」只在这里回答。
 *
 * 【两种店面，两条互不相交的分支】
 *  · PLATFORM（主站）：现有逻辑原样搬入——定价 → 内推 ref → ReferralPrice → effectiveBasePrice → referralSellUnit。
 *    **不读任何租户表**（主站分支零依赖新表，设计 4.10）；券不在这里算，仍由 lib/coupon.ts 的 quoteOrder 收口。
 *  · CHANNEL（渠道站）：只查 TenantListing + Product；**忽略 ref**（渠道站内推硬关，设计 7.6）；
 *    任何一项缺失都是 sellable:false——没配置 = 不可售，绝不当 0、绝不回落主站价（设计 5.3、S5）。
 *
 * 【下单事务内必须传 tx】（Dujiao #271）渠道分支的全部读取都走 opt.db，下单时与建单同一连接、同一快照：
 * 读到的售价 / 进货价 / 店面状态与写进订单的快照是同一时刻的值，也不会在事务里再去占第二个连接。
 * 主站分支的内推底价 effectiveBasePrice 属于 lib/referral.ts（WP3），它自己用全局 prisma；主站下单本来就在事务外定价
 * （券要在建单前 CAS 锁定，见 api/orders/route.ts），所以这不构成事务内的第二个连接。
 *
 * 【渠道站给浏览器的东西】PublicProductCard 只有公开字段：price 是**本店售价**（元），没有进货价、没有站长价、
 * 没有成本；stock 只给档位代表值（lib/stock-level.ts）。字段形状与主站 /api/products 一致，前台组件不用分叉。
 */
import { Prisma } from '@prisma/client'
import { prisma } from './db'
import { effectiveBasePrice, referralSellUnit } from './referral'
import { publicStock, stockLevel } from './stock-level'
import { toCents } from './money'
import { checkSellable, type SellableListing } from './tenant/sellable'
import { isPreviewUser, PLATFORM_TENANT_ID, type Storefront, type TenantStatus } from './storefront/resolve'
import type { NotSellableReason, PublicProductDetail, ReferralQuote } from './tenant/types'

type Db = Prisma.TransactionClient | typeof prisma

// ============================== 报价 ==============================

/**
 * 主站内推报价。在 ReferralQuote（refCode、unitCents）之外带上建单要用的内部口径：
 * 推广人 id 与每件返现（分）。只在服务端用，**不进任何响应**。
 */
export interface PlatformReferralQuote extends ReferralQuote {
  referrerId: number
  /** 每件返现（分）= max(0, 专属价成交价 − 推广人当前基础价)，与改造前 per 的口径逐分相同 */
  rewardUnitCents: number
}

export type UnitPriceQuote =
  | { sellable: false; reason: NotSellableReason }
  | { sellable: true; kind: 'PLATFORM'; unitCents: number; referral: PlatformReferralQuote | null }
  | { sellable: true; kind: 'CHANNEL'; unitCents: number; supplyUnitCents: number; listingId: number; mainPriceCents: number }

/**
 * 单件价格。
 *  · PLATFORM：商品不存在 → NOT_LISTED；已下架 → PRODUCT_OFF；否则按定价，带 ref 且推广人有效时按内推成交价。
 *  · CHANNEL：店面状态（DRAFT 只放行 previewUserId）+ 上架行 + 商品状态，全部经 checkSellable 判定。
 * opt.buyerId：主站内推「自己推自己不算」的判定；opt.previewUserId：渠道 DRAFT 期预览账号。
 */
export async function resolveUnitPrice(
  sf: Storefront,
  productId: number,
  opt: { ref?: string | null; buyerId?: number; db?: Prisma.TransactionClient; previewUserId?: number } = {},
): Promise<UnitPriceQuote> {
  const db: Db = opt.db ?? prisma
  if (!Number.isSafeInteger(productId) || productId <= 0) return { sellable: false, reason: 'NOT_LISTED' }
  if (sf.kind === 'PLATFORM') return platformQuote(db, productId, opt)
  return channelQuote(db, sf, productId, opt.previewUserId ?? null)
}

async function platformQuote(db: Db, productId: number, opt: { ref?: string | null; buyerId?: number }): Promise<UnitPriceQuote> {
  const product = await db.product.findUnique({ where: { id: productId }, select: { status: true, price: true } })
  if (!product) return { sellable: false, reason: 'NOT_LISTED' }
  if (product.status !== 1) return { sellable: false, reason: 'PRODUCT_OFF' }

  // —— 以下是 api/orders/route.ts 改造前 433-459 行的内推逻辑，逐句搬迁（WP2 回归重点，itest W2-1 对照旧算法）——
  const base = Number(product.price)
  const ref = typeof opt.ref === 'string' ? opt.ref.trim() : ''
  if (ref) {
    const referrer = await db.user.findUnique({ where: { referralCode: ref }, select: { id: true, status: true } })
    if (referrer && referrer.status === 1 && referrer.id !== opt.buyerId) {
      const rp = await db.referralPrice.findUnique({ where: { userId_productId: { userId: referrer.id, productId } } })
      // 返现 = 售卖价 − 我给推广人的基础价
      const effBase = (await effectiveBasePrice(referrer.id, productId)) ?? base
      // 专属价默认 = 网站售价；专属价低于「当前」基础价 → 按基础价成交、返现为 0（lib/referral.ts referralSellUnit）
      const sellUnit = referralSellUnit(rp ? Number(rp.price) : null, effBase, base)
      if (rp && sellUnit !== Number(rp.price)) {
        console.warn(`[referral] 专属价低于基础价，按基础价成交 referrer=${referrer.id} product=${productId} rp=${rp.price} base=${effBase}`)
      }
      return {
        sellable: true,
        kind: 'PLATFORM',
        unitCents: toCents(sellUnit),
        // 原写法 per = max(0, round((sellUnit−effBase)·100)/100)、reward = round(per·100)·qty/100；
        // round(round(d·100)/100·100) 恒等于 round(d·100)，所以按分存每件返现与原口径逐分相同
        referral: { refCode: ref, unitCents: toCents(sellUnit), referrerId: referrer.id, rewardUnitCents: Math.max(0, Math.round((sellUnit - effBase) * 100)) },
      }
    }
  }
  return { sellable: true, kind: 'PLATFORM', unitCents: toCents(base), referral: null }
}

const LISTING_SELLABLE_SELECT = {
  id: true,
  granted: true,
  status: true,
  supplyCents: true,
  retailCents: true,
  minRetailCents: true,
  maxRetailCents: true,
} as const satisfies Prisma.TenantListingSelect

async function channelQuote(db: Db, sf: Storefront, productId: number, previewUserId: number | null): Promise<UnitPriceQuote> {
  if (sf.kind !== 'CHANNEL' || !Number.isInteger(sf.id) || sf.id < 2) throw new Error(`[pricing] 渠道店面非法：${sf.id}`)
  // 店面状态以库里此刻为准（同一事务快照），不用 sf 上请求开始时的值：后台刚把店停掉的那一秒也拦得住
  const t = await db.tenant.findUnique({ where: { id: sf.id }, select: { status: true, previewUserIds: true } })
  if (!t) return { sellable: false, reason: 'TENANT_INACTIVE' }
  const preview =
    t.status === 'DRAFT' &&
    typeof previewUserId === 'number' &&
    Array.isArray(t.previewUserIds) &&
    t.previewUserIds.some((x) => x === previewUserId)
  const listing = await db.tenantListing.findUnique({
    where: { tenantId_productId: { tenantId: sf.id, productId } },
    select: LISTING_SELLABLE_SELECT,
  })
  const product = await db.product.findUnique({ where: { id: productId }, select: { status: true, price: true } })
  if (!product) return { sellable: false, reason: 'NOT_LISTED' }
  const reason = checkSellable({ tenantStatus: t.status as TenantStatus, preview, listing, productStatus: product.status })
  if (reason) return { sellable: false, reason }
  // checkSellable 通过即保证下面两个值是正整数且 retail ≥ supply；这里再断言一次，类型上也收窄
  const l = listing as NonNullable<typeof listing>
  if (l.retailCents == null || l.supplyCents == null) return { sellable: false, reason: 'NOT_PRICED' }
  return {
    sellable: true,
    kind: 'CHANNEL',
    unitCents: l.retailCents,
    supplyUnitCents: l.supplyCents,
    listingId: l.id,
    mainPriceCents: toCents(Number(product.price)),
  }
}

// ============================== 前台展示 ==============================

/**
 * 前台商品卡片 / 详情的公开形状。键与主站 /api/products（lib/product-select.ts 的 PUBLIC_PRODUCT_SELECT）一致，
 * 所以 home-client、products-client、product-client 不用按店面分叉：
 *  · price：**本店售价**（元）。渠道站 = TenantListing.retailCents；主站 = Product.price。
 *  · stock：档位代表值（publicStock），不是精确张数。
 *  · sales：渠道站 = 本店销量 TenantListing.sales（设计 7.5）；主站 = Product.sales。
 * 渠道站额外带 priceCents / stockLevel 两个便利字段。**不含** 进货价、站长价、成本、listing 内部 id。
 */
export interface PublicProductCard {
  id: number
  categoryId: number | null
  name: string
  description: string | null
  price: number
  priceCents: number
  originalPrice: number | null
  features: string | null
  image: string | null
  stock: number
  stockLevel: string
  sales: number
  deliveryType: string | null
  category: { id: number; name: string } | null
}

export type StorefrontProductDetail = PublicProductDetail & PublicProductCard & { priceCents: number }

const PRODUCT_PUBLIC_FIELDS = {
  id: true,
  categoryId: true,
  name: true,
  description: true,
  price: true,
  originalPrice: true,
  features: true,
  stock: true,
  sales: true,
  deliveryType: true,
  image: true,
  status: true,
  sortOrder: true,
  createdAt: true,
  category: { select: { id: true, name: true } },
} as const satisfies Prisma.ProductSelect

type ProductRow = Prisma.ProductGetPayload<{ select: typeof PRODUCT_PUBLIC_FIELDS }>

function toCard(p: ProductRow, priceCents: number, sales: number): PublicProductCard {
  const stock = publicStock(p.stock)
  return {
    id: p.id,
    categoryId: p.categoryId ?? null,
    name: p.name,
    description: p.description ?? null,
    price: priceCents / 100,
    priceCents,
    originalPrice: p.originalPrice == null ? null : Number(p.originalPrice),
    features: p.features ?? null,
    image: p.image ?? null,
    stock,
    stockLevel: stockLevel(stock).label,
    sales,
    deliveryType: p.deliveryType ?? null,
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
  }
}

/**
 * 渠道店面此刻能不能「展示」商品（与能不能「下单」分开）：
 *   ACTIVE、SUSPENDED → 展示（SUSPENDED「商品页照常浏览但不可下单」，设计 6.7；下单由 resolveUnitPrice 拒绝）
 *   DRAFT            → 只对预览账号展示（前台外壳也只放行他们，设计 4.4）
 *   TERMINATED       → 不展示（商品接口返回空，外壳显示停业页）
 */
async function channelDisplayable(sf: Storefront, previewUserId: number | null | undefined): Promise<boolean> {
  if (sf.status === 'ACTIVE' || sf.status === 'SUSPENDED') return true
  if (sf.status === 'DRAFT') return isPreviewUser(sf.id, previewUserId ?? null)
  return false
}

/** 展示口径的可售判定：店面状态已由 channelDisplayable 判过，这里按 ACTIVE 看上架行本身 */
function listingDisplayable(l: SellableListing, productStatus: number): boolean {
  return checkSellable({ tenantStatus: 'ACTIVE', preview: false, listing: l, productStatus }) === null
}

const LISTING_DISPLAY_SELECT = { ...LISTING_SELLABLE_SELECT, productId: true, sortOrder: true, sales: true } as const satisfies Prisma.TenantListingSelect

/**
 * 店面的在售商品。主站：status=1 的全部商品（与改造前 /products 页同一排序）；渠道：本店可售的上架行。
 * 渠道排序：渠道自己的 sortOrder 优先，其次沿用站长的商品排序。
 */
export async function listStorefrontProducts(
  sf: Storefront,
  opt: { categoryId?: number; previewUserId?: number | null } = {},
): Promise<PublicProductCard[]> {
  const categoryFilter = typeof opt.categoryId === 'number' && Number.isInteger(opt.categoryId) ? { categoryId: opt.categoryId } : {}
  if (sf.kind === 'PLATFORM') {
    const rows = await prisma.product.findMany({
      where: { status: 1, ...categoryFilter },
      select: PRODUCT_PUBLIC_FIELDS,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: 200,
    })
    return rows.map((p) => toCard(p, toCents(Number(p.price)), p.sales))
  }

  if (!(await channelDisplayable(sf, opt.previewUserId))) return []
  const listings = await prisma.tenantListing.findMany({
    where: { tenantId: sf.id, granted: true, status: 1, supplyCents: { not: null }, retailCents: { not: null } },
    select: LISTING_DISPLAY_SELECT,
    take: 500,
  })
  if (!listings.length) return []
  const products = await prisma.product.findMany({
    where: { id: { in: listings.map((l) => l.productId) }, status: 1, ...categoryFilter },
    select: PRODUCT_PUBLIC_FIELDS,
  })
  const byId = new Map(products.map((p) => [p.id, p]))
  const rows: { l: (typeof listings)[number]; p: ProductRow }[] = []
  for (const l of listings) {
    const p = byId.get(l.productId)
    if (p && listingDisplayable(l, p.status)) rows.push({ l, p })
  }
  rows.sort(
    (a, b) =>
      a.l.sortOrder - b.l.sortOrder ||
      a.p.sortOrder - b.p.sortOrder ||
      b.p.createdAt.getTime() - a.p.createdAt.getTime() ||
      b.p.id - a.p.id,
  )
  return rows.map(({ l, p }) => toCard(p, l.retailCents as number, l.sales))
}

/** 单个商品（详情页、/api/products/[id]）。不存在 / 不在本店可售 → null（调用方 404） */
export async function getStorefrontProduct(
  sf: Storefront,
  id: number,
  opt: { previewUserId?: number | null } = {},
): Promise<StorefrontProductDetail | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null
  if (sf.kind === 'PLATFORM') {
    const p = await prisma.product.findFirst({ where: { id, status: 1 }, select: PRODUCT_PUBLIC_FIELDS })
    return p ? toCard(p, toCents(Number(p.price)), p.sales) : null
  }
  if (!(await channelDisplayable(sf, opt.previewUserId))) return null
  const l = await prisma.tenantListing.findUnique({
    where: { tenantId_productId: { tenantId: sf.id, productId: id } },
    select: LISTING_DISPLAY_SELECT,
  })
  if (!l) return null
  const p = await prisma.product.findUnique({ where: { id }, select: PRODUCT_PUBLIC_FIELDS })
  if (!p || !listingDisplayable(l, p.status)) return null
  return toCard(p, l.retailCents as number, l.sales)
}

/** 渠道单在主站企业微信群里的标签（设计 8.1 第 7 步：「[lulu]」）。主站单返回空串 */
export function siteTag(sf: Pick<Storefront, 'id' | 'code'>): string {
  return sf.id === PLATFORM_TENANT_ID ? '' : `[${sf.code}] `
}
