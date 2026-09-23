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
import { settlePrepaidInvoiceByExternalOrder } from '@/lib/order-invoice'

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
      select: { id: true, sourceKey: true, claudeAccount: true, shopOrderId: true },
    })
    if (!order) return notFound('订单不存在')

    const user = await getCurrentUser()
    await assertExternalOrderAccess(order, {
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      claimedEmail: d.accountEmail ?? null,
    })

    /*
     * 【收据金额的口径要先对齐】三个兄弟路径都做了这一步，唯独这条漏了就不成体系。
     *
     * 结账时预收过 6% 的订单，买家实付的是含税额。submitReceiptForExternalOrder
     * 的判据是「这条外部订单上有没有一张 payStatus=PAID 的发票」—— 万一履约时那张
     * 发票没落地，它会退回按不含税的 quote 出具，买家拿到一张比实付少 6% 的收据。
     * 而收据一笔订单只能开一张、开错了改不回来，正是报销最怕的情况。
     */
    await settlePrepaidInvoiceByExternalOrder(order)

    const result = await submitReceiptForExternalOrder(d.externalOrderId, d.payerTitle)
    return success(result, '收据已生成')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    console.error('Create receipt error:', err)
    return error('生成收据失败')
  }
}
