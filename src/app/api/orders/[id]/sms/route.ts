export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized, notFound } from '@/lib/api'
import { getStorefront } from '@/lib/storefront/resolve'
import { pollActivation, acquireForOrder, SMS_MAX_RETRY, SMS_RETRY_COOLDOWN_SEC } from '@/lib/sms'

// 买家拉取本订单接码状态（号码 + 验证码）；缺号时按需补取号，并实时查码/超时取消
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  // 店面解析不进 try（设计 4.4 第 7 条）
  const sf = await getStorefront()
  if (!sf) return notFound('订单不存在')
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const orderId = parseInt(params.id)
    if (!orderId) return error('订单无效')

    // 归属写进 where：本人、本店（设计 8.1）。这里会按需向上游取号（花钱），别的站的会话绝不能驱动它（T11）
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id, tenantId: sf.id },
      select: {
        userId: true,
        payStatus: true,
        deliveryStatus: true,
        product: { select: { deliveryType: true, smsService: true, smsCountry: true, smsMaxPrice: true } },
      },
    })
    if (!order) return notFound('订单不存在')
    if (order.payStatus !== 'PAID') return error('订单支付后才有接码信息')
    if (order.product.deliveryType !== 'SMS') return success({ exists: false })

    // 自愈：已付款但还没取号（付款时未触发/手动标记支付等）→ 按需补取号。
    // 已取消的已付款单（线下退款的惯例做法）不补：补取号就是替一张退了款的订单继续花接码费。
    // 已有的记录照常往下走：pollActivation 会把残留的 WAITING 放掉，页面据此显示已取消
    const existing = await prisma.smsActivation.findUnique({ where: { orderId } })
    if (!existing && order.deliveryStatus !== 'CANCELLED') {
      try {
        await acquireForOrder(
          orderId,
          order.product.smsService || '',
          order.product.smsCountry || '',
          order.product.smsMaxPrice != null ? Number(order.product.smsMaxPrice) : null
        )
      } catch (e) {
        console.error('[sms] on-demand acquire failed', e)
      }
    }

    const a = await pollActivation(orderId)
    if (!a) return success({ exists: false })

    // 换号相关的状态一起返回，前端据此决定按钮是可点、冷却中、还是次数已用完。
    // canRetryAt 给的是绝对时间而不是剩余秒数：前端自己倒计时，
    // 不会因为轮询间隔（5 秒）而让倒计时一跳一跳的
    const issuedAt = a.numberAt ?? a.createdAt
    return success({
      exists: true,
      status: a.status,
      phone: a.phone || null,
      code: a.code || null,
      expireAt: a.expireAt,
      service: a.service,
      country: a.country,
      retryCount: a.retryCount,
      maxRetry: SMS_MAX_RETRY,
      canRetryAt: new Date(issuedAt.getTime() + SMS_RETRY_COOLDOWN_SEC * 1000),
    })
  } catch (err) {
    console.error('Get order sms error:', err)
    return error('获取失败')
  }
}
