export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized, notFound } from '@/lib/api'
import { pollActivation } from '@/lib/sms'

// 买家拉取本订单接码状态（号码 + 验证码），并实时向 hero-sms 查码 / 超时取消
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const orderId = parseInt(params.id)
    if (!orderId) return error('订单无效')

    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true, payStatus: true } })
    if (!order || order.userId !== user.id) return notFound('订单不存在')
    if (order.payStatus !== 'PAID') return error('订单支付后才有接码信息')

    // 实时轮询（收码/超时处理），返回最新
    const a = await pollActivation(orderId)
    if (!a) return success({ exists: false })

    return success({
      exists: true,
      status: a.status, // WAITING | CODE | TIMEOUT | CANCELLED | FAILED
      phone: a.phone || null,
      code: a.code || null,
      expireAt: a.expireAt,
      service: a.service,
      country: a.country,
    })
  } catch (err) {
    console.error('Get order sms error:', err)
    return error('获取失败')
  }
}
