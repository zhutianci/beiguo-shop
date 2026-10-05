/**
 * 「补发 <订单号 / 货号>」（docs/微信机器人-设计.md §7.3）：与后台订单页「补发」按钮同一个函数（lib/order/refill.ts 的 refillOrder，
 * 内部是幂等的 fulfillOrder 补缺口：只补尚缺的张数，不会重复记账、不会超发）。
 * 给货号时补该商品全部「付了款但缺卡」（PAID + PROCESSING）的单，最早的先补，一次最多 20 单；库存补完就停。
 */
import { prisma } from '../../db'
import { RefillError, refillOrder, type RefillResult } from '../../order/refill'

export const REFILL_BATCH_MAX = 20

/** 订单号的形状（generateOrderNo：北京日期 8 位 + 4–8 位大写字母数字）；不像订单号的参数按货号处理 */
export function looksLikeOrderNo(s: string): boolean {
  return /^\d{8}[0-9A-Z]{4,8}$/.test(s)
}

export async function refillByOrderNo(orderNo: string, actorUserId: number | null): Promise<RefillResult> {
  const order = await prisma.order.findUnique({ where: { orderNo }, select: { id: true } })
  if (!order) throw new RefillError('订单不存在', 404)
  return refillOrder(order.id, { userId: actorUserId, via: 'wechat-bot' })
}

export interface RefillBatchResult {
  /** 等卡的单一共几张（本次最多处理 REFILL_BATCH_MAX 张） */
  waiting: number
  tried: number
  completed: number
  added: number
  /** 补完后仍缺卡的单 */
  stillShort: { orderNo: string; short: number }[]
  errors: { orderNo: string; error: string }[]
}

export async function refillByProduct(productId: number, actorUserId: number | null): Promise<RefillBatchResult> {
  const where = { productId, payStatus: 'PAID', deliveryStatus: 'PROCESSING' } as const
  const [waiting, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, orderBy: { id: 'asc' }, take: REFILL_BATCH_MAX, select: { id: true, orderNo: true } }),
  ])
  const out: RefillBatchResult = { waiting, tried: 0, completed: 0, added: 0, stillShort: [], errors: [] }
  for (const o of orders) {
    out.tried++
    try {
      const r = await refillOrder(o.id, { userId: actorUserId, via: 'wechat-bot' })
      out.added += r.added
      if (r.owned >= r.due) out.completed++
      else {
        out.stillShort.push({ orderNo: r.orderNo, short: r.due - r.owned })
        break // 库存已经补完：后面的单不用再试
      }
    } catch (e) {
      out.errors.push({ orderNo: o.orderNo, error: e instanceof RefillError ? e.message : '补发出错' })
      if (!(e instanceof RefillError)) console.error('[bot] 批量补发出错', o.orderNo, (e as Error)?.message)
    }
  }
  return out
}
