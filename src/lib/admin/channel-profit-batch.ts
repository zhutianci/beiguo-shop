/**
 * 渠道单站长利润的批量取数（二期 M2；口径见 ./channel-profit.ts）。
 *
 * 原来是后台订单路由（src/app/api/admin/orders/route.ts）里的私有函数；路由文件只能导出 handler，
 * 微信机器人日报（docs/微信机器人-设计.md §6.2「渠道带来的站长利润」）也要用同一份，所以原样抽到这里，
 * 后台路由改为 import 它，行为逐字不变。
 *
 * 只给超管侧用：渠道层（partner-*）不得 import —— 这里有站长成本。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { toCents } from '../money'
import { channelProfit, smsChargedCost, type ChannelProfit } from './channel-profit'

/** 渠道单算利润要的订单列（二期 M2；口径见 lib/admin/channel-profit.ts） */
export const CHANNEL_PROFIT_ORDER_SELECT = {
  id: true,
  amount: true,
  quantity: true,
  supplyCents: true,
  settleState: true,
  refundedGoodsCents: true,
  settleRefundedCents: true,
  settleLossCents: true,
  refundedQty: true,
  product: { select: { deliveryType: true } },
} as const satisfies Prisma.OrderSelect

export type ChannelProfitOrderRow = Prisma.OrderGetPayload<{ select: typeof CHANNEL_PROFIT_ORDER_SELECT }>

/**
 * 一批渠道单（已付 / 已退款）的站长利润。卡密成本与接码成本都按 orderId 批量取，一批两次查询。
 * 只数 status=USED 的卡：已退件但已发出的卡成本照样计入（卡已经送出去了）。
 */
export async function channelProfitMap(rows: ChannelProfitOrderRow[]): Promise<Map<number, ChannelProfit | null>> {
  const out = new Map<number, ChannelProfit | null>()
  if (!rows.length) return out
  const ids = rows.map((r) => r.id)
  const [cards, sms] = await Promise.all([
    prisma.cardKey.findMany({ where: { orderId: { in: ids }, status: 'USED' }, select: { orderId: true, cost: true } }),
    // orderId 在 sms_activations 上唯一，一单最多一条（与详情 channelSection 同口径）
    prisma.smsActivation.findMany({ where: { orderId: { in: ids } }, select: { orderId: true, cost: true, status: true } }),
  ])
  const costsOf = new Map<number, unknown[]>()
  for (const c of cards) {
    const arr = costsOf.get(c.orderId as number) ?? []
    arr.push(c.cost)
    costsOf.set(c.orderId as number, arr)
  }
  const smsOf = new Map(sms.map((x) => [x.orderId, smsChargedCost(x.cost, x.status)]))
  for (const r of rows) {
    out.set(
      r.id,
      channelProfit(
        {
          amountCents: toCents(Number(r.amount)),
          supplyCents: r.supplyCents,
          settleState: r.settleState,
          refundedGoodsCents: r.refundedGoodsCents,
          settleRefundedCents: r.settleRefundedCents,
          settleLossCents: r.settleLossCents,
        },
        {
          cardCosts: costsOf.get(r.id) ?? [],
          smsCost: smsOf.get(r.id),
          deliveryType: r.product?.deliveryType ?? null,
          expectQty: r.quantity - (r.refundedQty ?? 0),
        },
      ),
    )
  }
  return out
}
