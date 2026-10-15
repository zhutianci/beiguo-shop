/**
 * 「从没付款」的订单收尾（2026-10-15 攻防加固，docs/安全-攻防加固设计-1015.md 3.1 第 6 条）。
 *
 * 发起过付款的订单，收款单超时时由 closeExpired 取消；**没发起过付款的订单以前永远停在「待支付」**——
 * 刷单脚本下完不付的单、买家放弃的单都躺在后台和买家列表里。这里两个入口：
 *  · cancelAbandonedOrders：每分钟的 vmq-close cron 调用，取消超过付款期限（ORDER_PAY_WINDOW_MIN，默认 24 小时，
 *    与 api/pay/vmq/create「超过期限不能再付」同一口径）的这类订单——它们本来就已经付不了了；
 *  · cancelIfNoPayment：后台封禁买家（lib/security/ban-user.ts）立刻取消他名下的这类订单。
 *
 * 取消条件（同一个小事务里、锁订单行之后判断）：仍是 UNPAID + PENDING/PROCESSING，且**没有任何 0（待付）/ 1（已到账）收款单**。
 * 有余额预扣（接码组合单）的不碰，留给接码 tick 按原流程收尾。取消后放券（与 closeExpired 同一个函数）。
 */
import { prisma } from '../db'
import { releaseCouponForOrder } from '../coupon'

const MIN = 60_000
export const ORDER_PAY_WINDOW_MIN = Math.max(60, Number(process.env.ORDER_PAY_WINDOW_MIN) || 1440)
const BATCH = 50

export type CancelOutcome = 'CANCELLED' | 'HELD' | 'NOOP'

export async function cancelIfNoPayment(orderId: number): Promise<CancelOutcome> {
  const hold = await prisma.balanceHold.findFirst({ where: { orderId, state: 'HELD' }, select: { id: true } })
  if (hold) return 'HELD'
  const cancelled = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`
    const live = await tx.vmqOrder.count({ where: { bizType: 'order', bizId: orderId, state: { in: [0, 1] } } })
    if (live > 0) return false
    const r = await tx.order.updateMany({
      where: { id: orderId, payStatus: 'UNPAID', deliveryStatus: { in: ['PENDING', 'PROCESSING'] } },
      data: { deliveryStatus: 'CANCELLED' },
    })
    return r.count === 1
  })
  if (!cancelled) return 'NOOP'
  await releaseCouponForOrder(orderId).catch((e) => console.error('[order] 取消后释放券失败（兜底清扫会处理）', orderId, e))
  return 'CANCELLED'
}

/** 每分钟一批：超过付款期限、仍待支付、从没（或不再有）收款单的订单 → 已取消。返回本次取消条数 */
export async function cancelAbandonedOrders(now: number = Date.now()): Promise<number> {
  const cutoff = new Date(now - ORDER_PAY_WINDOW_MIN * MIN)
  // 有收款单 / 余额预扣的在 SQL 里就排除：否则它们永远排在批次最前面，后面的订单一直轮不到
  const rows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT o.id FROM orders o
     WHERE o.pay_status = 'UNPAID' AND o.delivery_status IN ('PENDING', 'PROCESSING')
       AND o.created_at < ${cutoff} AND o.updated_at < ${cutoff}
       AND NOT EXISTS (SELECT 1 FROM vmq_orders v WHERE v.biz_type = 'order' AND v.biz_id = o.id AND v.state IN (0, 1))
       AND NOT EXISTS (SELECT 1 FROM balance_holds h WHERE h.order_id = o.id AND h.state = 'HELD')
     ORDER BY o.id
     LIMIT ${BATCH}`
  let n = 0
  for (const r of rows) {
    try {
      if ((await cancelIfNoPayment(Number(r.id))) === 'CANCELLED') n++
    } catch (e) {
      console.error('[order] 取消过期未付订单失败（下一分钟重试）', r.id, (e as Error)?.message)
    }
  }
  return n
}
