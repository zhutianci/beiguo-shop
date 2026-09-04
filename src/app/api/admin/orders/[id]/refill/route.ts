export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { fulfillOrder } from '@/lib/vmq'

// 补发卡密：自动发货订单在付款时若库存不足会停在 PROCESSING（remark 标注「待人工补发」），
// 补货之后需要一个入口把缺口补齐。原先只能绕到「收款监控 → 补单」，这里给订单页一个直接入口。
// fulfillOrder 幂等：只补该订单「尚缺」的张数，不会重复记账、不会超发。
export async function PUT(_request: NextRequest, { params }: { params: { id: string } }) {
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

    const before = await prisma.cardKey.count({ where: { orderId: id, status: 'USED' } })
    await fulfillOrder(id)
    const after = await prisma.cardKey.count({ where: { orderId: id, status: 'USED' } })

    const fresh = await prisma.order.findUnique({
      where: { id },
      select: { deliveryStatus: true, quantity: true },
    })

    return success(
      {
        added: after - before,
        owned: after,
        quantity: fresh?.quantity ?? order.quantity,
        deliveryStatus: fresh?.deliveryStatus ?? order.deliveryStatus,
      },
      after >= (fresh?.quantity ?? order.quantity)
        ? `已补发 ${after - before} 张，订单已交付`
        : `已补发 ${after - before} 张，仍缺 ${(fresh?.quantity ?? order.quantity) - after} 张（库存不足）`
    )
  } catch (err) {
    console.error('Refill order cards error:', err)
    return error('补发失败')
  }
}
