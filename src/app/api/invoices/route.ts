export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { vmqConfigured, VmqError } from '@/lib/vmq'
import { submitInvoiceForExternalOrder, BillingError } from '@/lib/order-billing'

const schema = z.object({
  externalOrderId: z.number().int().positive('缺少订单'),
  title: z.string().trim().min(1, '抬头必填').max(200),
  taxNumber: z.string().trim().min(1, '税号必填').max(64),
  address: z.string().trim().max(255).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  bankName: z.string().trim().max(128).optional().nullable(),
  bankAccount: z.string().trim().max(64).optional().nullable(),
  email: z.string().email('接收邮箱格式不正确'),
})

export async function POST(request: NextRequest) {
  try {
    if (!vmqConfigured()) return error('支付未配置，暂无法提交发票', 500)

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const result = await submitInvoiceForExternalOrder(d.externalOrderId, d)
    return success(result, '已提交，请支付税费')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    if (err instanceof VmqError) return error(err.message)
    console.error('Create invoice error:', err)
    return error('提交发票失败')
  }
}
