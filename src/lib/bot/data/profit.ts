/**
 * 「利润」指令的取数（docs/微信机器人-设计.md §7.3，口径见 §6.2「利润」行）：按商品的成交件数、成交额、利润。只读、只给管理群与私聊。
 *
 * 【成交】paid_at 在窗口内、pay_status ∈ (PAID, REFUNDED)（含之后退款的单，与日报同口径）；不含接码与充值两种载体单
 *  （它们没有卡密利润，接码利润看接码日报）。提卡单照常计入（§8.7）。成交额 = Σ amount（不含税；渠道单是渠道售价）。
 * 【利润】与后台订单列表合计同一组条件（src/app/api/admin/orders/route.ts）：
 *  · 主站单 = 所发卡（status = USED）的 Σ card_keys.profit，减去这些有卡订单已结算（SETTLED）的内推返现；profit 为 NULL 的卡不累加，
 *    单列「利润未知」的单数；
 *  · 渠道单 = 站长利润（进货净额 − 成本，lib/admin/channel-profit 的 channelProfit，与后台列表同一个批量函数）；成本未登记的单列「未知」。
 * 【不把订单拉回 Node】主站单的卡密利润与返现在数据库里按商品聚合（走 (pay_status, paid_at) 与 card_keys.order_id 索引）；
 *  只有渠道单要逐单套公式，按行取回（渠道单量小；超过 CHANNEL_ROWS_CAP 就不算渠道利润并如实标出，不给错数）。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../../db'
import { CHANNEL_PROFIT_ORDER_SELECT, channelProfitMap } from '../../admin/channel-profit-batch'
import type { ChannelProfit } from '../../admin/channel-profit'
import { CARRIER_DELIVERY_TYPES } from '../../order-scope'
import { centsOrNull, countOf, PLATFORM_TENANT_ID, requirePlatformScope, type BotScope, type TimeWindow } from './scope'

const CHANNEL_ROWS_CAP = 5000

export interface ProductProfit {
  productId: number
  name: string
  botCode: string | null
  deliveryType: string
  /** 成交单数 */
  orders: number
  /** 成交件数 */
  quantity: number
  /** 成交额（分） */
  amountCents: number
  /** 主站单卡密利润（已扣返现，分）；这个商品没有发过卡的主站单为 null */
  mainProfitCents: number | null
  /** 渠道单站长利润（分）；没有算得出的渠道单为 null */
  channelProfitCents: number | null
  /** 合计利润（分）= 主站 + 渠道；两者都为 null 时为 null（人工发货商品没有卡密利润） */
  profitCents: number | null
  /** 利润未知的单数（有卡没录利润 / 渠道单成本未登记） */
  unknownOrders: number
}

export interface ProfitResult {
  /** 按成交额从高到低 */
  rows: ProductProfit[]
  /** 渠道单太多、没有计算渠道利润 */
  channelTruncated: boolean
}

/** 窗口内按商品的成交与利润；productId 给了就只算这一个商品 */
export async function profitByProduct(scope: BotScope, w: TimeWindow, productId: number | null): Promise<ProfitResult> {
  requirePlatformScope(scope, '利润')
  const paidInWindow: Prisma.OrderWhereInput = {
    payStatus: { in: ['PAID', 'REFUNDED'] },
    paidAt: { gte: w.from, lt: w.to },
    ...(productId ? { productId } : {}),
  }
  const groups = await prisma.order.groupBy({
    by: ['productId'],
    where: { AND: [paidInWindow, { product: { deliveryType: { notIn: [...CARRIER_DELIVERY_TYPES] } } }] },
    _count: { _all: true },
    _sum: { quantity: true, amount: true },
  })
  if (!groups.length) return { rows: [], channelTruncated: false }
  const pids = groups.map((g) => g.productId)
  const pidList = Prisma.join(pids)
  const [products, cardRows, refRows, chRows] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: pids } }, select: { id: true, name: true, botCode: true, deliveryType: true } }),
    prisma.$queryRaw<Array<{ pid: number; profit: unknown; unknown_orders: unknown }>>`
      SELECT o.product_id AS pid,
             SUM(c.profit) AS profit,
             COUNT(DISTINCT CASE WHEN c.profit IS NULL THEN o.id END) AS unknown_orders
        FROM orders o
        JOIN card_keys c ON c.order_id = o.id AND c.status = 'USED'
       WHERE o.tenant_id = ${PLATFORM_TENANT_ID}
         AND o.pay_status IN ('PAID', 'REFUNDED')
         AND o.paid_at >= ${w.from} AND o.paid_at < ${w.to}
         AND o.product_id IN (${pidList})
       GROUP BY o.product_id`,
    // 只扣「有卡的单」的返现：人工发货单本来就没有卡密利润，扣了会凭空出负数（与后台列表同一条规则）
    prisma.$queryRaw<Array<{ pid: number; ref: unknown }>>`
      SELECT o.product_id AS pid, SUM(r.amount) AS ref
        FROM orders o
        JOIN referral_rewards r ON r.order_id = o.id AND r.status = 'SETTLED'
       WHERE o.tenant_id = ${PLATFORM_TENANT_ID}
         AND o.pay_status IN ('PAID', 'REFUNDED')
         AND o.paid_at >= ${w.from} AND o.paid_at < ${w.to}
         AND o.product_id IN (${pidList})
         AND EXISTS (SELECT 1 FROM card_keys c WHERE c.order_id = o.id AND c.status = 'USED')
       GROUP BY o.product_id`,
    prisma.order.findMany({
      where: { ...paidInWindow, productId: { in: pids }, tenantId: { not: PLATFORM_TENANT_ID } },
      select: { ...CHANNEL_PROFIT_ORDER_SELECT, productId: true },
      orderBy: { id: 'asc' },
      take: CHANNEL_ROWS_CAP + 1,
    }),
  ])
  const channelTruncated = chRows.length > CHANNEL_ROWS_CAP
  const chProfit: Map<number, ChannelProfit | null> = channelTruncated ? new Map() : await channelProfitMap(chRows)

  const productOf = new Map(products.map((p) => [p.id, p]))
  const cardOf = new Map(cardRows.map((r) => [Number(r.pid), r]))
  const refOf = new Map(refRows.map((r) => [Number(r.pid), centsOrNull(r.ref) ?? 0]))
  const chAgg = new Map<number, { sum: number; known: number; unknown: number }>()
  if (!channelTruncated) {
    chRows.forEach((o) => {
      const a = chAgg.get(o.productId) ?? { sum: 0, known: 0, unknown: 0 }
      const p = chProfit.get(o.id)
      if (!p || p.profitCents == null) a.unknown += 1
      else {
        a.sum += p.profitCents
        a.known += 1
      }
      chAgg.set(o.productId, a)
    })
  }

  const rows = groups.map((g): ProductProfit => {
    const p = productOf.get(g.productId)
    const card = cardOf.get(g.productId)
    const mainProfitCents = card ? (centsOrNull(card.profit) ?? 0) - (refOf.get(g.productId) ?? 0) : null
    const ch = chAgg.get(g.productId)
    const channelProfitCents = ch && ch.known > 0 ? ch.sum : null
    const profitCents = mainProfitCents === null && channelProfitCents === null ? null : (mainProfitCents ?? 0) + (channelProfitCents ?? 0)
    return {
      productId: g.productId,
      name: p?.name ?? `商品 #${g.productId}`,
      botCode: p?.botCode ?? null,
      deliveryType: p?.deliveryType ?? '',
      orders: g._count._all,
      quantity: g._sum.quantity ?? 0,
      amountCents: centsOrNull(g._sum.amount) ?? 0,
      mainProfitCents,
      channelProfitCents,
      profitCents,
      unknownOrders: (card ? countOf(card.unknown_orders) : 0) + (ch ? ch.unknown : 0),
    }
  })
  rows.sort((a, b) => b.amountCents - a.amountCents || a.productId - b.productId)
  return { rows, channelTruncated }
}
