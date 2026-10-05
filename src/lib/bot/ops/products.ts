/**
 * 按「货号」找商品（docs/微信机器人-设计.md §8.2）：提卡、补货、上下架、补发共用。只读。
 * 货号存大写；群里写小写也认。只有自动发货（AUTO）商品有货号的意义。
 */
import { prisma } from '../../db'
import { normalizeBotCode } from '../../product-status'

export interface BotProduct {
  id: number
  name: string
  price: number
  status: number
  deliveryType: string
  botCode: string
  stock: number
  cardRedeemUrl: string | null
}

export class BotProductError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BotProductError'
  }
}

/** 货号 → 自动发货商品；货号格式不对、找不到、不是自动发货都抛 BotProductError（文案直接回给管理员） */
export async function findAutoProductByCode(raw: string): Promise<BotProduct> {
  const code = normalizeBotCode(raw)
  if (!code) throw new BotProductError(`货号「${String(raw).slice(0, 20)}」格式不对：只有字母、数字与 _ -，最多 16 位`)
  const p = await prisma.product.findUnique({
    where: { botCode: code },
    select: { id: true, name: true, price: true, status: true, deliveryType: true, botCode: true, stock: true, cardRedeemUrl: true },
  })
  if (!p) throw new BotProductError(`没有货号「${code}」：发送「@贝果助手 货号」查看可提卡的商品`)
  if (p.deliveryType !== 'AUTO') throw new BotProductError(`货号「${code}」对应的商品不是自动发货，不能提卡 / 补货`)
  return { ...p, price: Number(p.price), botCode: p.botCode ?? code }
}

/** 补货页的商品下拉：全部自动发货商品（含下架的），带货号与当前库存 */
export async function listAutoProductsForRestock(): Promise<{ id: number; name: string; botCode: string | null; status: number; stock: number }[]> {
  return prisma.product.findMany({
    where: { deliveryType: 'AUTO' },
    orderBy: [{ status: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    select: { id: true, name: true, botCode: true, status: true, stock: true },
    take: 300,
  })
}

/** 某商品最近一批卡的兑换方式（补货页默认沿用，§9.1 第 3 步） */
export async function lastBatchDefaults(productId: number): Promise<{ redeemProvider: string | null; redeemUrl: string | null; cost: number | null }> {
  const last = await prisma.cardKey.findFirst({
    where: { productId },
    orderBy: { id: 'desc' },
    select: { redeemProvider: true, redeemUrl: true, cost: true },
  })
  return { redeemProvider: last?.redeemProvider ?? null, redeemUrl: last?.redeemUrl ?? null, cost: last?.cost == null ? null : Number(last.cost) }
}

/**
 * 全部商品各自最近一批卡的兑换方式与成本（补货页切换商品时就地换默认值，不用再回服务端查）。
 * 每个商品取 id 最大的那张卡：GROUP BY product_id 走 product_id 开头的索引，一次查询。
 */
export async function lastBatchDefaultsAll(): Promise<Map<number, { redeemProvider: string | null; redeemUrl: string | null; cost: number | null }>> {
  const rows = await prisma.$queryRaw<{ product_id: number; redeem_provider: string | null; redeem_url: string | null; cost: unknown }[]>`
    SELECT c.product_id, c.redeem_provider, c.redeem_url, c.cost
      FROM card_keys c
      JOIN (SELECT product_id, MAX(id) AS id FROM card_keys GROUP BY product_id) m ON m.id = c.id`
  return new Map(rows.map((r) => [Number(r.product_id), { redeemProvider: r.redeem_provider, redeemUrl: r.redeem_url, cost: r.cost == null ? null : Number(r.cost) }]))
}

/** 某商品「付了款、还在等卡」的订单数（补货回执提示用补发，§9.1 第 4 步） */
export async function countAwaitingCards(productId: number): Promise<number> {
  return prisma.order.count({ where: { productId, payStatus: 'PAID', deliveryStatus: 'PROCESSING' } })
}
