export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { fulfillOrder } from '@/lib/vmq'
import { adminOrResponse } from '@/lib/admin/source-site'
import { writeAudit } from '@/lib/audit'

// 补发卡密：自动发货订单在付款时若库存不足会停在 PROCESSING（remark 标注「待人工补发」），
// 补货之后需要一个入口把缺口补齐。原先只能绕到「收款监控 → 补单」，这里给订单页一个直接入口。
// fulfillOrder 幂等：只补该订单「尚缺」的张数，不会重复记账、不会超发。
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // 路由内再验一次管理员（CVE-2025-29927，见交接文档第二十三节）：补发会从卡池里领卡；渠道 Host → 404
  const auth = await adminOrResponse()
  if ('res' in auth) return auth.res
  try {
    const id = parseInt(params.id)
    if (!id) return error('订单无效')

    const order = await prisma.order.findUnique({
      where: { id },
      include: { product: { select: { deliveryType: true } } },
    })
    if (!order) return notFound('订单不存在')
    if (order.product.deliveryType !== 'AUTO') return error('该订单不是自动发货商品')
    if (order.payStatus !== 'PAID') return error('订单尚未支付，无法补发')
    // fulfillOrder 对「已付款但已取消」的订单不再发卡（那通常是线下退了款），
    // 不拦的话这里会返回一句误导人的「已补发 0 张，仍缺 N 张（库存不足）」
    if (order.deliveryStatus === 'CANCELLED') {
      // 渠道单取消后不能恢复（设计 8.4），提示不同
      return error(order.tenantId !== 1 ? '渠道单已取消，不能补发' : '订单已取消，请先把订单状态改回「处理中」再补发')
    }

    const before = await prisma.cardKey.count({ where: { orderId: id, status: 'USED' } })
    await fulfillOrder(id)
    const after = await prisma.cardKey.count({ where: { orderId: id, status: 'USED' } })

    const fresh = await prisma.order.findUnique({
      where: { id },
      select: { deliveryStatus: true, quantity: true, refundedQty: true },
    })
    /*
     * 应发张数 = 数量 − 已按件退掉的件数（设计 8.3：发卡缺口 = quantity − refundedQty − 已发，fulfillOrder 已按它补）。
     * 主站单 refundedQty 恒为空，与原来一致
     */
    const quantity = fresh?.quantity ?? order.quantity
    const due = Math.max(0, quantity - (fresh?.refundedQty ?? order.refundedQty ?? 0))

    /*
     * 渠道单补发要留痕（设计 6.2「补发 / 换卡 / 重新交付 SA ✔审」、13.2）：补发会改交付状态与 deliveredAt（渠道冻结起点），
     * 渠道在操作日志里要能看到「平台补发了几张」。主站单与原来一致不写。审计失败不影响已发出的卡（卡已发、只记日志）。
     */
    if (order.tenantId !== 1) {
      await writeAudit(null, {
        actorUserId: auth.user.id,
        actorKind: 'PLATFORM',
        tenantId: order.tenantId,
        action: 'order.refill',
        targetType: 'order',
        targetId: order.orderNo,
        diff: { added: after - before, owned: after, due, from: order.deliveryStatus, to: fresh?.deliveryStatus ?? order.deliveryStatus },
        publicDiff: { added: after - before },
        req: request,
      }).catch((e) => console.error('[refill] 审计写入失败', id, e))
    }

    return success(
      {
        added: after - before,
        owned: after,
        quantity,
        due,
        deliveryStatus: fresh?.deliveryStatus ?? order.deliveryStatus,
      },
      after >= due
        ? `已补发 ${after - before} 张，订单已交付`
        : `已补发 ${after - before} 张，仍缺 ${due - after} 张（库存不足）`
    )
  } catch (err) {
    console.error('Refill order cards error:', err)
    return error('补发失败')
  }
}
