export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized, notFound } from '@/lib/api'
import {
  ensureExternalOrderForShopOrder,
  submitReceiptForExternalOrder,
  BillingError,
} from '@/lib/order-billing'

const schema = z.object({
  payerTitle: z.string().trim().min(1, '请填写付款人抬头').max(200),
})

// 买家从「我的订单」直接申请收据（无需邮箱查询）
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const orderId = parseInt(params.id)
    if (!orderId) return error('订单无效')

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true, nickname: true } } },
    })
    if (!order || order.userId !== user.id) return notFound('订单不存在')
    if (order.payStatus !== 'PAID') return error('订单支付后才能申请收据')

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const ext = await ensureExternalOrderForShopOrder({
      id: order.id,
      productName: order.productName,
      amount: order.amount,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      user: order.user,
    })

    const result = await submitReceiptForExternalOrder(ext.id, parsed.data.payerTitle)
    return success(result, '收据已生成')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    console.error('Order receipt error:', err)
    return error('生成收据失败')
  }
}
