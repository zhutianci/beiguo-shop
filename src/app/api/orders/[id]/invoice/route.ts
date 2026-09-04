export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized, notFound } from '@/lib/api'
import { vmqConfigured, VmqError } from '@/lib/vmq'
import {
  ensureExternalOrderForShopOrder,
  submitInvoiceForExternalOrder,
  BillingError,
} from '@/lib/order-billing'

const schema = z.object({
  title: z.string().trim().min(1, '抬头必填').max(200),
  taxNumber: z.string().trim().min(1, '税号必填').max(64),
  address: z.string().trim().max(255).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  bankName: z.string().trim().max(128).optional().nullable(),
  bankAccount: z.string().trim().max(64).optional().nullable(),
  email: z.string().email('接收邮箱格式不正确'),
  // 必选：发票内容是否展示 ChatGPT/Claude 等字眼
  showAiWording: z.boolean({ required_error: '请选择发票中是否展示 ChatGPT/Claude 相关字眼' }),
})

// 买家从「我的订单」直接申请发票（无需邮箱查询）
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!vmqConfigured()) return error('支付未配置，暂无法提交发票', 500)

    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const orderId = parseInt(params.id)
    if (!orderId) return error('订单无效')

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true, nickname: true } } },
    })
    if (!order || order.userId !== user.id) return notFound('订单不存在')
    if (order.payStatus !== 'PAID') return error('订单支付后才能申请发票')

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    // 为该订单生成/复用背书外部订单，复用现有发票体系
    const ext = await ensureExternalOrderForShopOrder({
      id: order.id,
      productName: order.productName,
      amount: order.amount,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      user: order.user,
    })

    const result = await submitInvoiceForExternalOrder(ext.id, parsed.data)
    return success(result, '已提交，请支付税费')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    if (err instanceof VmqError) return error(err.message)
    console.error('Order invoice error:', err)
    return error('提交发票失败')
  }
}
