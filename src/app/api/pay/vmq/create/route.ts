export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { createOrGetVmqOrder, VmqError } from '@/lib/vmq'
import { assertCouponForPayment } from '@/lib/coupon'

const schema = z.object({
  orderNo: z.string().min(1, '缺少订单号'),
})

// 为商品订单发起 V免签 收款，返回收银台地址
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const order = await prisma.order.findUnique({ where: { orderNo: parsed.data.orderNo } })
    if (!order || order.userId !== user.id) return error('订单不存在')
    if (order.payStatus === 'PAID') return error('订单已支付')
    if (order.payStatus === 'REFUNDED') return error('订单已退款，无法支付')
    if (order.deliveryStatus === 'CANCELLED') return error('订单已超时取消，请重新下单')

    // 站长明确要求的那道复验：提交收款监控之前，确认「账户与券一致、券处于可用（锁定）状态」。
    // 建单时已经校验并锁定过一次，这里防的是另一件事 —— 订单与券的关联在中途被改坏。
    const couponOk = await assertCouponForPayment(order.id, user.id)
    if (!couponOk.ok) return error(couponOk.message)

    const vmq = await createOrGetVmqOrder({
      bizType: 'order',
      bizId: order.id,
      outTradeNo: order.orderNo,
      price: Number(order.amount),
    })

    return success({ payUrl: `/pay/${vmq.orderId}`, orderId: vmq.orderId, reallyPrice: vmq.reallyPrice })
  } catch (err) {
    if (err instanceof VmqError) return error(err.message)
    console.error('Vmq create error:', err)
    return error('发起支付失败')
  }
}
