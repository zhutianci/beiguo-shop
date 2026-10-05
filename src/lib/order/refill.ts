/**
 * 补发卡密：后台订单页「补发」按钮（PUT /api/admin/orders/[id]/refill）与微信机器人「补发」指令共用
 * （docs/微信机器人-设计.md §7.3「与后台补发按钮同一个函数」）。原来整段写在路由里，原样抽出，行为不变：
 *
 * 自动发货订单在付款时若库存不足会停在 PROCESSING（remark 标注「待人工补发」），补货之后用这里把缺口补齐。
 * fulfillOrder 幂等：只补该订单「尚缺」的张数，不会重复记账、不会超发。
 *
 * 渠道单补发要留痕（多渠道设计 6.2「补发 / 换卡 / 重新交付 SA ✔审」、13.2）：补发会改交付状态与 deliveredAt（渠道冻结起点），
 * 渠道在操作日志里要能看到「平台补发了几张」。主站单与原来一致不写。审计失败不影响已发出的卡（卡已发、只记日志）。
 */
import { prisma } from '../db'
import { fulfillOrder } from '../vmq'
import { writeAudit } from '../audit'

/** 业务性拒绝：message 就是原接口回给前端的那句原文；status 404 = 订单不存在 */
export class RefillError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'RefillError'
    this.status = status
  }
}

export interface RefillResult {
  orderNo: string
  tenantId: number
  added: number
  owned: number
  quantity: number
  due: number
  deliveryStatus: string
  /** 给人看的结果（原接口的成功提示原文） */
  message: string
}

export async function refillOrder(orderId: number, actor: { userId: number | null; req?: Request; via?: 'wechat-bot' }): Promise<RefillResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: { select: { deliveryType: true } } },
  })
  if (!order) throw new RefillError('订单不存在', 404)
  if (order.product.deliveryType !== 'AUTO') throw new RefillError('该订单不是自动发货商品')
  if (order.payStatus !== 'PAID') throw new RefillError('订单尚未支付，无法补发')
  // fulfillOrder 对「已付款但已取消」的订单不再发卡（那通常是线下退了款），
  // 不拦的话这里会返回一句误导人的「已补发 0 张，仍缺 N 张（库存不足）」
  if (order.deliveryStatus === 'CANCELLED') {
    // 渠道单取消后不能恢复（设计 8.4），提示不同
    throw new RefillError(order.tenantId !== 1 ? '渠道单已取消，不能补发' : '订单已取消，请先把订单状态改回「处理中」再补发')
  }

  const before = await prisma.cardKey.count({ where: { orderId, status: 'USED' } })
  await fulfillOrder(orderId)
  const after = await prisma.cardKey.count({ where: { orderId, status: 'USED' } })

  const fresh = await prisma.order.findUnique({
    where: { id: orderId },
    select: { deliveryStatus: true, quantity: true, refundedQty: true },
  })
  /*
   * 应发张数 = 数量 − 已按件退掉的件数（设计 8.3：发卡缺口 = quantity − refundedQty − 已发，fulfillOrder 已按它补）。
   * 主站单 refundedQty 恒为空，与原来一致
   */
  const quantity = fresh?.quantity ?? order.quantity
  const due = Math.max(0, quantity - (fresh?.refundedQty ?? order.refundedQty ?? 0))
  const deliveryStatus = fresh?.deliveryStatus ?? order.deliveryStatus

  if (order.tenantId !== 1) {
    await writeAudit(null, {
      actorUserId: actor.userId,
      actorKind: 'PLATFORM',
      tenantId: order.tenantId,
      action: 'order.refill',
      targetType: 'order',
      targetId: order.orderNo,
      diff: { added: after - before, owned: after, due, from: order.deliveryStatus, to: deliveryStatus, ...(actor.via ? { via: actor.via } : {}) },
      publicDiff: { added: after - before },
      req: actor.req,
    }).catch((e) => console.error('[refill] 审计写入失败', orderId, e))
  }

  return {
    orderNo: order.orderNo,
    tenantId: order.tenantId,
    added: after - before,
    owned: after,
    quantity,
    due,
    deliveryStatus,
    message: after >= due ? `已补发 ${after - before} 张，订单已交付` : `已补发 ${after - before} 张，仍缺 ${due - after} 张（库存不足）`,
  }
}
