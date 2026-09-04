export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, notFound } from '@/lib/api'
import { vmqConfigured, VmqError } from '@/lib/vmq'
import {
  submitInvoiceForExternalOrder,
  assertExternalOrderAccess,
  BillingError,
} from '@/lib/order-billing'

const schema = z.object({
  externalOrderId: z.number().int().positive('缺少订单'),
  title: z.string().trim().min(1, '抬头必填').max(200),
  taxNumber: z.string().trim().min(1, '税号必填').max(64),
  address: z.string().trim().max(255).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  bankName: z.string().trim().max(128).optional().nullable(),
  bankAccount: z.string().trim().max(64).optional().nullable(),
  email: z.string().email('接收邮箱格式不正确'),
  // 必选：发票内容是否展示 ChatGPT/Claude 等字眼。
  // 用 boolean 而非 optional，缺失时 zod 会直接报「请选择…」，不允许静默默认。
  showAiWording: z.boolean({ required_error: '请选择发票中是否展示 ChatGPT/Claude 相关字眼' }),
  // 匿名「邮箱查订阅」流程的归属凭证
  accountEmail: z.string().trim().email().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    if (!vmqConfigured()) return error('支付未配置，暂无法提交发票', 500)

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const order = await prisma.externalOrder.findUnique({
      where: { id: d.externalOrderId },
      select: { id: true, sourceKey: true, claudeAccount: true },
    })
    if (!order) return notFound('订单不存在')

    const user = await getCurrentUser()
    await assertExternalOrderAccess(order, {
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      claimedEmail: d.accountEmail ?? null,
    })

    const result = await submitInvoiceForExternalOrder(d.externalOrderId, d)
    return success(result, '已提交，请支付税费')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    if (err instanceof VmqError) return error(err.message)
    console.error('Create invoice error:', err)
    return error('提交发票失败')
  }
}
