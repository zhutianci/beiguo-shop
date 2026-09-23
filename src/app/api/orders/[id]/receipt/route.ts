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
import { settlePrepaidOrderInvoice } from '@/lib/order-invoice'

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

    /*
     * 【收据金额的口径要先对齐】结账时预收过 6% 的订单，买家实付的是含税额，
     * 订单页的收据面板也按含税额显示。但 submitReceiptForExternalOrder 的判据是
     * 「有没有一张 payStatus=PAID 的发票」—— 万一履约时那张发票没落地，
     * 它会退回按不含税的 quote 出具，买家拿到一张比实付少 6% 的收据。
     * 而收据一笔订单只能开一张、开错了改不回来。所以先把发票补落地再计费。
     */
    await settlePrepaidOrderInvoice(order.id)

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
