export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, notFound } from '@/lib/api'
import {
  submitReceiptForExternalOrder,
  assertExternalOrderAccess,
  BillingError,
} from '@/lib/order-billing'

const schema = z.object({
  externalOrderId: z.number().int().positive('缺少订单'),
  payerTitle: z.string().trim().min(1, '请填写付款人抬头').max(200),
  // 匿名「邮箱查订阅」流程的归属凭证：必须与该订单的账户邮箱一致。
  // 已登录且订单属于本人 / 本人邮箱 / 已绑定账户时可不传。
  accountEmail: z.string().trim().email().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
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

    const result = await submitReceiptForExternalOrder(d.externalOrderId, d.payerTitle)
    return success(result, '收据已生成')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    console.error('Create receipt error:', err)
    return error('生成收据失败')
  }
}
