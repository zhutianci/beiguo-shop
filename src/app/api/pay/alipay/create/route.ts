export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { alipayConfigured, buildPayUrl } from '@/lib/alipay'

const schema = z.object({
  orderNo: z.string().min(1, '缺少订单号'),
  channel: z.enum(['wap', 'page']).optional().default('wap'),
})

export async function POST(request: NextRequest) {
  try {
    if (!alipayConfigured()) return error('支付宝支付未配置', 500)

    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const { orderNo, channel } = parsed.data

    const order = await prisma.order.findUnique({ where: { orderNo } })
    if (!order || order.userId !== user.id) return error('订单不存在')
    if (order.payStatus === 'PAID') return error('订单已支付')
    if (order.payStatus === 'REFUNDED') return error('订单已退款，无法支付')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bigolab.com'
    const payUrl = buildPayUrl({
      outTradeNo: order.orderNo,
      totalAmount: Number(order.amount).toFixed(2),
      subject: order.productName.slice(0, 256),
      channel,
      notifyUrl: `${appUrl}/api/pay/alipay/notify`,
      returnUrl: `${appUrl}/api/pay/alipay/return`,
      quitUrl: `${appUrl}/orders`,
    })

    // 记下本次选择的支付方式
    await prisma.order.update({ where: { id: order.id }, data: { payMethod: 'ALIPAY' } })

    return success({ payUrl })
  } catch (err) {
    console.error('Alipay create error:', err)
    return error('发起支付失败')
  }
}
