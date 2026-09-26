/**
 * 渠道后台：商品池（WP6，设计 5.3、6.2「商品与价格」、7.2）。
 *
 * 只列 `tenantId = 本渠道 AND granted = true` 的上架行（站长没授权的商品渠道看不到，设计 6.3）。每行给：
 *  · 商品名、分类名、进货价（只有自己的）、主站售价参考（主站前台本来公开，设计 6.2）、库存**档位**（src/lib/stock-level，不给数字）；
 *  · 我的售价、上架状态、排序、本站销量、单件余额 / 单件预计打款（按当前渠道费率）、可售状态与原因、自动下架原因。
 * 不给：supplyVersion、supplyBaseKind / supplyBaseCents（COST 基准就是成本快照）、updatedBy、listing 自增 id、成本。
 *
 * 【可售原因的口径】先按「店铺已开业」判定这一行自身的问题（未定价、低于进货价、商品停售…），行本身没问题时
 * 再看店铺状态（DRAFT / SUSPENDED → TENANT_INACTIVE）。DRAFT 期渠道主正在选品定价，先看到「这一行还差什么」更有用。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { toCents } from '../money'
import { stockLevel } from '../stock-level'
import { mulBps } from '../tenant/math'
import { checkSellable } from '../tenant/sellable'
import type { NotSellableReason, PartnerListingDTO, TenantStatus } from '../tenant/types'
import { parsePublicNo } from '../tenant/public-no'
import { assertTenantId } from './_scope'
import { PARTNER_INTERNAL_LISTING_KEY_SELECT, PARTNER_LISTING_SELECT, PARTNER_PRODUCT_SELECT, PARTNER_TENANT_SELECT } from './selects'

export type ListingRaw = Prisma.TenantListingGetPayload<{ select: typeof PARTNER_LISTING_SELECT }>
export type ProductRaw = Prisma.ProductGetPayload<{ select: typeof PARTNER_PRODUCT_SELECT }>

export const LISTING_WITH_KEY = { ...PARTNER_LISTING_SELECT, ...PARTNER_INTERNAL_LISTING_KEY_SELECT } as const
export type ListingWithKey = Prisma.TenantListingGetPayload<{ select: typeof LISTING_WITH_KEY }>

export interface TenantPricing {
  status: TenantStatus
  feeRateBp: number
  code: string
}

/** 渠道当前的状态与费率（单件预计打款按当前费率估算；真正记账用下单时的快照） */
export async function tenantPricing(tenantId: number): Promise<TenantPricing> {
  assertTenantId(tenantId)
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: PARTNER_TENANT_SELECT })
  if (!t) throw new Error(`[partner] 渠道不存在：${tenantId}`)
  return { status: t.status as TenantStatus, feeRateBp: t.feeRateBp, code: t.code }
}

/** 单件余额 = 售价 − 进货价；单件预计打款 = 售价 − 售价 × 费率 − 进货价（设计 7.2 预览口径） */
export function unitEconomics(retailCents: number | null, supplyCents: number | null, feeRateBp: number): { unitBalanceCents: number | null; unitPayoutCents: number | null } {
  if (retailCents == null || supplyCents == null || retailCents < 0 || supplyCents < 0) return { unitBalanceCents: null, unitPayoutCents: null }
  return {
    unitBalanceCents: retailCents - supplyCents,
    unitPayoutCents: retailCents - mulBps(retailCents, feeRateBp) - supplyCents,
  }
}

/** 这一行为什么不可售（null = 可售）。见文件头「可售原因的口径」 */
export function listingReason(l: ListingRaw, productStatus: number, tenantStatus: TenantStatus): NotSellableReason | null {
  const own = checkSellable({ tenantStatus: 'ACTIVE', preview: false, listing: l, productStatus })
  if (own) return own
  return tenantStatus === 'ACTIVE' ? null : 'TENANT_INACTIVE'
}

export function toListingDto(l: ListingRaw, p: ProductRaw, t: TenantPricing): PartnerListingDTO {
  const reason = listingReason(l, p.status, t.status)
  const econ = unitEconomics(l.retailCents, l.supplyCents, t.feeRateBp)
  const dto: PartnerListingDTO = {
    listingNo: l.publicNo,
    productId: l.productId,
    name: p.name,
    category: p.category?.name ?? null,
    supplyCents: l.supplyCents,
    mainPriceCents: toCents(p.price.toString()),
    // 只给档位文案（设计 7.5）；stock 数字本身不出服务层
    stockLevel: stockLevel(p.stock).label,
    retailCents: l.retailCents,
    minRetailCents: l.minRetailCents,
    maxRetailCents: l.maxRetailCents,
    status: l.status === 1 ? 1 : 0,
    sortOrder: l.sortOrder,
    sales: l.sales,
    // 全站销量（Product.sales）：与前台两站显示的同一个数（二期 M1），只读；本店销量仍是上面的 sales
    globalSales: p.sales,
    unitBalanceCents: econ.unitBalanceCents,
    unitPayoutCents: econ.unitPayoutCents,
    sellable: reason === null,
  }
  if (reason) dto.reason = reason
  if (l.delistedReason) dto.delistedReason = l.delistedReason
  return dto
}

export interface CatalogQuery {
  categoryId?: number
  /** 商品名关键字（≤ 64 字） */
  q?: string
  status?: 0 | 1
}

/**
 * 商品池列表。行数 = 本渠道已授权的商品数（站长授权的在售商品，量级几十到几百），不分页。
 * where 顶层先放 tenantId 与 granted，分类 / 关键字只在这些行里再收窄。
 */
export async function partnerCatalog(tenantId: number, q: CatalogQuery = {}): Promise<PartnerListingDTO[]> {
  assertTenantId(tenantId)
  const t = await tenantPricing(tenantId)
  const listings = await prisma.tenantListing.findMany({
    where: { tenantId, granted: true, ...(q.status === 0 || q.status === 1 ? { status: q.status } : {}) },
    select: PARTNER_LISTING_SELECT,
    orderBy: [{ sortOrder: 'asc' }, { productId: 'asc' }],
    take: 2000,
  })
  if (listings.length === 0) return []
  const kw = (q.q ?? '').trim().slice(0, 64)
  const products = await prisma.product.findMany({
    where: {
      id: { in: listings.map((l) => l.productId) },
      ...(q.categoryId !== undefined ? { categoryId: q.categoryId } : {}),
      ...(kw ? { name: { contains: kw } } : {}),
    },
    select: PARTNER_PRODUCT_SELECT,
  })
  const byId = new Map<number, ProductRaw>()
  products.forEach((p) => byId.set(p.id, p))
  const out: PartnerListingDTO[] = []
  listings.forEach((l) => {
    const p = byId.get(l.productId)
    if (p) out.push(toListingDto(l, p, t))
  })
  return out
}

/** 单行（PATCH 之后回显用）。不存在 / 未授权 / 他站的 listingNo → null */
export async function partnerListingByNo(tenantId: number, listingNo: string): Promise<PartnerListingDTO | null> {
  assertTenantId(tenantId)
  const no = parsePublicNo(listingNo)
  if (!no) return null
  const l = await prisma.tenantListing.findFirst({ where: { publicNo: no, tenantId, granted: true }, select: PARTNER_LISTING_SELECT })
  if (!l) return null
  const [p, t] = await Promise.all([prisma.product.findUnique({ where: { id: l.productId }, select: PARTNER_PRODUCT_SELECT }), tenantPricing(tenantId)])
  return p ? toListingDto(l, p, t) : null
}
