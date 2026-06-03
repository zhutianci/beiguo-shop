export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyNotify, getAppId } from '@/lib/alipay'

// 支付宝异步通知：到账的唯一依据。验签通过后将订单标记为已支付。
// 必须返回纯文本 "success"，否则支付宝会重复通知。
export async function POST(request: NextRequest) {
  const fail = () => new Response('failure', { status: 200 })
  const ok = () => new Response('success', { status: 200 })

  try {
    const form = await request.formData()
    const params: Record<string, string> = {}
    form.forEach((v, k) => {
      params[k] = String(v)
    })

    // 1) 验签
    if (!verifyNotify(params)) {
      console.error('[alipay notify] 验签失败', params.out_trade_no)
      return fail()
    }
    // 2) 校验 app_id
    if (params.app_id !== getAppId()) {
      console.error('[alipay notify] app_id 不匹配')
      return fail()
    }

    const outTradeNo = params.out_trade_no
    const tradeStatus = params.trade_status
    const tradeNo = params.trade_no
    const totalAmount = params.total_amount

    const order = await prisma.order.findUnique({ where: { orderNo: outTradeNo } })
    if (!order) {
      console.error('[alipay notify] 订单不存在', outTradeNo)
      return fail()
    }
    // 3) 金额校验
    if (Number(totalAmount) !== Number(order.amount)) {
      console.error('[alipay notify] 金额不匹配', totalAmount, order.amount)
      return fail()
    }

    // 4) 仅在成功状态处理；已处理过则幂等返回 success
    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      if (order.payStatus !== 'PAID') {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: {
              payStatus: 'PAID',
              payMethod: 'ALIPAY',
              deliveryStatus: 'PROCESSING',
              paidAt: new Date(),
            },
          }),
          prisma.payment.create({
            data: {
              orderId: order.id,
              tradeNo: tradeNo || null,
              payMethod: 'ALIPAY',
              amount: order.amount,
              status: 1,
              callbackData: JSON.stringify(params).slice(0, 4000),
            },
          }),
          prisma.product.update({
            where: { id: order.productId },
            data: { sales: { increment: order.quantity } },
          }),
        ])
        console.log('[alipay notify] 订单已支付', outTradeNo, tradeNo)
      }
      return ok()
    }

    return ok()
  } catch (err) {
    console.error('[alipay notify] 处理异常', err)
    return fail()
  }
}
