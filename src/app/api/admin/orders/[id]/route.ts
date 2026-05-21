export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'

const updateOrderSchema = z.object({
  payStatus: z.enum(['UNPAID', 'PAID', 'REFUNDED']).optional(),
  deliveryStatus: z.enum(['PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED']).optional(),
  deliveryInfo: z.string().optional().nullable(),
})

// 更新订单
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)

    if (isNaN(orderId)) {
      return notFound('订单不存在')
    }

    const body = await request.json()
    const result = updateOrderSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    // 获取当前订单信息，用于判断状态变化
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    })

    if (!currentOrder) {
      return notFound('订单不存在')
    }

    const data: {
      payStatus?: 'UNPAID' | 'PAID' | 'REFUNDED'
      deliveryStatus?: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED'
      deliveryInfo?: string | null
      deliveredAt?: Date | null
      paidAt?: Date | null
    } = { ...result.data }

    const wasDelivered = currentOrder.deliveryStatus === 'DELIVERED'
    const willBeDelivered = result.data.deliveryStatus === 'DELIVERED'

    // 状态从未交付变为已交付：标记交付时间 + 自动标记支付 + 增加销量 / 扣减库存
    if (!wasDelivered && willBeDelivered) {
      data.deliveredAt = new Date()
      if (currentOrder.payStatus !== 'PAID') {
        data.payStatus = 'PAID'
        data.paidAt = new Date()
      }

      await prisma.product.update({
        where: { id: currentOrder.productId },
        data: {
          sales: { increment: currentOrder.quantity },
          ...(currentOrder.product.stock !== -1
            ? { stock: { decrement: currentOrder.quantity } }
            : {}),
        },
      })
    }

    // 从已交付撤回：减销量 + 恢复库存 + 清除交付时间
    if (
      wasDelivered &&
      result.data.deliveryStatus &&
      result.data.deliveryStatus !== 'DELIVERED'
    ) {
      data.deliveredAt = null

      await prisma.product.update({
        where: { id: currentOrder.productId },
        data: {
          sales: { decrement: currentOrder.quantity },
          ...(currentOrder.product.stock !== -1
            ? { stock: { increment: currentOrder.quantity } }
            : {}),
        },
      })
    }

    // 手动标记支付状态变更（独立于交付状态）
    if (result.data.payStatus === 'PAID' && currentOrder.payStatus !== 'PAID') {
      data.paidAt = new Date()
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data,
    })

    return success(order, '订单更新成功')
  } catch (err) {
    console.error('Update order error:', err)
    return error('更新订单失败')
  }
}
