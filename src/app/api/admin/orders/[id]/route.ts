export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'

const updateOrderSchema = z.object({
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

    const data: {
      deliveryStatus?: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED'
      deliveryInfo?: string | null
      deliveredAt?: Date
    } = { ...result.data }

    if (result.data.deliveryStatus === 'DELIVERED') {
      data.deliveredAt = new Date()
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
