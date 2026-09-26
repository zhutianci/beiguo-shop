/**
 * 可售判定（设计 5.3、7.4）：下单、展示、渠道保存售价、批量改价预览共用这一个函数，fail closed。
 *
 *   Tenant.status = 'ACTIVE'（DRAFT 仅预览用户）
 *   AND listing.granted AND listing.status = 1
 *   AND listing.supplyCents > 0
 *   AND listing.retailCents >= listing.supplyCents
 *   AND listing.retailCents >= COALESCE(minRetailCents, 0)
 *   AND (maxRetailCents IS NULL OR retailCents <= maxRetailCents)
 *   AND Product.status = 1
 *
 * 【没配置 = 不可售】任何一项为 NULL 都返回原因，绝不把 NULL 当 0、也绝不回落到主站价（压价与 0 元单，S5）。
 * 纯函数，无 import 副作用（只 import 类型）。
 */
import type { NotSellableReason, TenantStatus } from './types'

export type { NotSellableReason } from './types'

/**
 * 售价本身是否合规（保存售价、批量改价预览时用；不看上下架、授权、店面状态）。
 * 返回 null = 合规。顺序：进货价缺失 → 未定价 → 低于进货价 → 超出上下限。
 */
export function checkRetail(
  l: { supplyCents: number | null; minRetailCents: number | null; maxRetailCents: number | null },
  retailCents: number | null,
): NotSellableReason | null {
  if (l.supplyCents == null || !Number.isSafeInteger(l.supplyCents) || l.supplyCents <= 0) return 'NO_SUPPLY'
  if (retailCents == null || !Number.isSafeInteger(retailCents) || retailCents <= 0) return 'NOT_PRICED'
  if (retailCents < l.supplyCents) return 'BELOW_SUPPLY'
  if (l.minRetailCents != null && retailCents < l.minRetailCents) return 'OUT_OF_RANGE'
  if (l.maxRetailCents != null && retailCents > l.maxRetailCents) return 'OUT_OF_RANGE'
  return null
}

export interface SellableListing {
  granted: boolean
  status: number
  supplyCents: number | null
  retailCents: number | null
  minRetailCents: number | null
  maxRetailCents: number | null
}

/**
 * 完整可售判定。返回 null = 可售。
 *  · tenantStatus：ACTIVE 可售；DRAFT 只有 preview=true（当前用户在 previewUserIds 里）时可售；SUSPENDED / TERMINATED 不可售。
 *    （SUSPENDED 时「商品页照常浏览但不可下单」由调用方决定展示口径，下单一律以本函数为准。）
 *  · listing 为 null（本店没有这个商品的上架行）→ NOT_LISTED。
 */
export function checkSellable(input: {
  tenantStatus: TenantStatus
  preview: boolean
  listing: SellableListing | null
  productStatus: number
}): NotSellableReason | null {
  const { tenantStatus, preview, listing, productStatus } = input
  if (!(tenantStatus === 'ACTIVE' || (tenantStatus === 'DRAFT' && preview === true))) return 'TENANT_INACTIVE'
  if (!listing) return 'NOT_LISTED'
  if (listing.granted !== true) return 'NOT_GRANTED'
  if (productStatus !== 1) return 'PRODUCT_OFF'
  if (listing.status !== 1) return 'NOT_LISTED'
  return checkRetail(listing, listing.retailCents)
}
