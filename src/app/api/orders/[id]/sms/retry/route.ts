export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized, notFound } from '@/lib/api'
import { retryActivation, SMS_MAX_RETRY } from '@/lib/sms'
import { rateLimited } from '@/lib/news/rate-limit'

/**
 * 买家主动换一个接码号码。
 *
 * 【为什么单独一个 POST 而不是塞进 GET】GET /sms 是每 5 秒轮询一次的，
 * 换号会真的向上游取号（花钱）。把一个花钱的动作放在轮询接口里，
 * 迟早会因为某次重试或预取而多扣一笔。
 *
 * 【三道闸在 lib/sms.ts 的 retryActivation 里】次数上限、冷却、只在 WAITING 时可换。
 * 这里只负责身份校验和限流——业务规则不要在路由层再写一遍，两处迟早会打架。
 */
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const orderId = parseInt(params.id)
    if (!orderId) return error('订单无效')

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, payStatus: true, product: { select: { deliveryType: true } } },
    })
    if (!order || order.userId !== user.id) return notFound('订单不存在')
    if (order.payStatus !== 'PAID') return error('订单支付后才能换号')
    if (order.product.deliveryType !== 'SMS') return error('该商品不是接码商品')

    /*
     * 限流是第二道保险，不是主要手段——真正的上限是 retryActivation 里的次数与冷却。
     * 但那两条都读数据库，而按钮被连点或脚本连打时，光靠数据库判断会打出一串并发请求。
     * 这里按「订单」维度挡住连打：10 分钟 8 次，比业务上限（3 次）宽，
     * 正常人碰不到，脚本会被挡在数据库之前。
     */
    if (rateLimited(`sms-retry:${orderId}`, { windowMs: 10 * 60_000, max: 8 })) {
      return error('操作太频繁，请稍后再试')
    }

    const r = await retryActivation(orderId)
    // error() 的第二个参数是 HTTP 状态码，不是负载——失败时剩余次数由前端
    // 重新拉一次 GET /sms 拿，不要把它硬塞进错误响应
    if (!r.ok) return error(r.error || '换号失败')

    return success({ remaining: r.remaining ?? 0, maxRetry: SMS_MAX_RETRY })
  } catch (err) {
    console.error('Retry sms activation error:', err)
    return error('换号失败')
  }
}
