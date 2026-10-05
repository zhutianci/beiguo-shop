/**
 * 商品与卡池的查询数据（docs/微信机器人-设计.md §7.3「货号」「库存」、§8.2）。只读、只给管理群与私聊（卡池是站长的，渠道共用同一批卡）。
 *
 * 卡池统计一律按 (product_id, status) 索引分组计数，不把卡取回来；货号查商品走 bot_code 唯一索引。
 * 「未用卡平均成本」只平均录了成本的卡（cost 为 NULL 的单列张数），金额按分整数运算（money.ts 的 toCents）。
 * 货号的格式与规范化（大写、字母数字 _ -、≤ 16 位）以 src/lib/product-status.ts 的 normalizeBotCode 为准，由调用方先规范化。
 */
import { prisma } from '../../db'
import { centsOrNull, requirePlatformScope, type BotScope } from './scope'

export interface ProductRef {
  id: number
  name: string
  botCode: string | null
  deliveryType: string
  /** 1 上架 0 下架 */
  status: number
  priceCents: number
}

/** 按（已规范化的）货号找商品；不限发货方式，调用方自己判断是不是自动发货 */
export async function findProductByCode(scope: BotScope, code: string): Promise<ProductRef | null> {
  requirePlatformScope(scope, '按货号找商品')
  const p = await prisma.product.findUnique({ where: { botCode: code }, select: { id: true, name: true, botCode: true, deliveryType: true, status: true, price: true } })
  return p ? { id: p.id, name: p.name, botCode: p.botCode, deliveryType: p.deliveryType, status: p.status, priceCents: centsOrNull(p.price) ?? 0 } : null
}

interface CostAgg {
  /** 张数 */
  count: number
  /** 录了成本的张数 */
  costCount: number
  /** 录了成本的那些卡的成本合计（分） */
  costSumCents: number
}

/** 未用卡平均成本（分）：只算录了成本的卡；一张都没录为 null */
export function avgCostCents(a: { costCount: number; costSumCents: number }): number | null {
  return a.costCount > 0 ? Math.round(a.costSumCents / a.costCount) : null
}

/** 一批商品的未用卡：张数、录了成本的张数与成本合计 */
async function unusedCostAgg(productIds: number[]): Promise<Map<number, CostAgg>> {
  const out = new Map<number, CostAgg>()
  if (!productIds.length) return out
  const rows = await prisma.cardKey.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds }, status: 'UNUSED' },
    _count: { _all: true, cost: true },
    _sum: { cost: true },
  })
  rows.forEach((r) => out.set(r.productId, { count: r._count._all, costCount: r._count.cost, costSumCents: centsOrNull(r._sum.cost) ?? 0 }))
  return out
}

export interface IssuableProduct extends ProductRef {
  botCode: string
  unused: number
  /** 未用卡平均成本（分）；没有录成本的卡为 null */
  avgCostCents: number | null
  /** 未用卡里没录成本的张数 */
  costMissing: number
}

/** 「货号」：可提卡商品 = 自动发货（AUTO）且有货号；下架的也列（标「已下架」，§8.3 已下架也允许提卡）。按货号排序 */
export async function listIssuableProducts(scope: BotScope): Promise<IssuableProduct[]> {
  requirePlatformScope(scope, '可提卡商品')
  const rows = await prisma.product.findMany({
    where: { deliveryType: 'AUTO', botCode: { not: null } },
    orderBy: { botCode: 'asc' },
    take: 200,
    select: { id: true, name: true, botCode: true, deliveryType: true, status: true, price: true },
  })
  const agg = await unusedCostAgg(rows.map((r) => r.id))
  return rows.map((p) => {
    const a = agg.get(p.id) ?? { count: 0, costCount: 0, costSumCents: 0 }
    return {
      id: p.id,
      name: p.name,
      botCode: p.botCode ?? '',
      deliveryType: p.deliveryType,
      status: p.status,
      priceCents: centsOrNull(p.price) ?? 0,
      unused: a.count,
      avgCostCents: avgCostCents(a),
      costMissing: a.count - a.costCount,
    }
  })
}

export interface PoolCounts {
  unused: number
  used: number
  disabled: number
}

export type StockRow = ProductRef & PoolCounts

/** 「库存」不带货号：全部自动发货商品的卡池简表（上架的在前） */
export async function stockOverview(scope: BotScope): Promise<StockRow[]> {
  requirePlatformScope(scope, '库存简表')
  const rows = await prisma.product.findMany({
    where: { deliveryType: 'AUTO' },
    orderBy: [{ status: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    take: 200,
    select: { id: true, name: true, botCode: true, deliveryType: true, status: true, price: true },
  })
  const ids = rows.map((r) => r.id)
  const groups = ids.length
    ? await prisma.cardKey.groupBy({ by: ['productId', 'status'], where: { productId: { in: ids } }, _count: { _all: true } })
    : []
  const counts = new Map<number, PoolCounts>()
  groups.forEach((g) => {
    const c = counts.get(g.productId) ?? { unused: 0, used: 0, disabled: 0 }
    if (g.status === 'UNUSED') c.unused += g._count._all
    else if (g.status === 'USED') c.used += g._count._all
    else if (g.status === 'DISABLED') c.disabled += g._count._all
    counts.set(g.productId, c)
  })
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    botCode: p.botCode,
    deliveryType: p.deliveryType,
    status: p.status,
    priceCents: centsOrNull(p.price) ?? 0,
    ...(counts.get(p.id) ?? { unused: 0, used: 0, disabled: 0 }),
  }))
}

export interface StockDetail extends PoolCounts {
  /** 未用卡的成本分布：每个成本档的张数，按成本升序；costCents = null 是没录成本的 */
  costBuckets: Array<{ costCents: number | null; count: number }>
  /** 未用卡平均成本（分）；没有录成本的卡为 null */
  avgCostCents: number | null
  /** 最近一次导入（最新的一张卡）：时间、批次、这一批共几张 */
  lastImport: { at: Date; batch: string | null; batchCount: number | null } | null
}

/** 「库存 <货号>」：一个商品的卡池统计 */
export async function stockDetail(scope: BotScope, productId: number): Promise<StockDetail> {
  requirePlatformScope(scope, '卡池统计')
  const [byStatus, byCost, last] = await Promise.all([
    prisma.cardKey.groupBy({ by: ['status'], where: { productId }, _count: { _all: true } }),
    prisma.cardKey.groupBy({ by: ['cost'], where: { productId, status: 'UNUSED' }, _count: { _all: true }, orderBy: { cost: 'asc' }, take: 100 }),
    prisma.cardKey.findFirst({ where: { productId }, orderBy: { id: 'desc' }, select: { createdAt: true, batch: true } }),
  ])
  const pool: PoolCounts = { unused: 0, used: 0, disabled: 0 }
  byStatus.forEach((g) => {
    if (g.status === 'UNUSED') pool.unused += g._count._all
    else if (g.status === 'USED') pool.used += g._count._all
    else if (g.status === 'DISABLED') pool.disabled += g._count._all
  })
  let costCount = 0
  let costSumCents = 0
  const costBuckets = byCost.map((g) => {
    const c = centsOrNull(g.cost)
    const n = g._count._all
    if (c !== null) {
      costCount += n
      costSumCents += c * n
    }
    return { costCents: c, count: n }
  })
  const batchCount = last?.batch ? await prisma.cardKey.count({ where: { productId, batch: last.batch } }) : null
  return {
    ...pool,
    costBuckets,
    avgCostCents: avgCostCents({ costCount, costSumCents }),
    lastImport: last ? { at: last.createdAt, batch: last.batch, batchCount } : null,
  }
}
