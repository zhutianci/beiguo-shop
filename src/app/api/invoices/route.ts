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
import { settlePrepaidInvoiceByExternalOrder } from '@/lib/order-invoice'
import {
  buyerInvoiceSubmitSchema,
  normalizeInvoiceFields,
  afterInvoiceSubmitted,
} from '@/lib/invoice-input'

// 抬头字段共用 lib/invoice-input 的定义，本路由只多两样：订单号与匿名归属凭证
const schema = buyerInvoiceSubmitSchema.extend({
  externalOrderId: z.number().int().positive('缺少订单'),
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
      select: { id: true, sourceKey: true, claudeAccount: true, shopOrderId: true },
    })
    if (!order) return notFound('订单不存在')

    const user = await getCurrentUser()
    await assertExternalOrderAccess(order, {
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      claimedEmail: d.accountEmail ?? null,
    })

    const fields = normalizeInvoiceFields(d)

    /*
     * 【防重复收税】这条外部订单背后的站内订单若在结账时已经预收过 6%，
     * 这条路就不能再收第二遍。与 /api/orders/[id]/invoice 同一道闸。
     * 走 shopOrderId 而不是解析 sourceKey —— 管理员交付时导入的那条外部订单
     * sourceKey 是 hashKey(账户,开通日,类型)，里面没有订单号。
     * 把本次填的抬头一并传进去：票还没开出去时就地覆盖，买家填的不会白填。
     */
    const prepaid = await settlePrepaidInvoiceByExternalOrder(order, fields)
    if (prepaid) {
      await afterInvoiceSubmitted(user?.id ?? null, d, fields)
      return success(
        { alreadyPaid: true },
        '该订单下单时已选择开发票、税费也已随货款付清，无需再次支付；抬头已按本次填写更新'
      )
    }
    const result = await submitInvoiceForExternalOrder(d.externalOrderId, fields, {
      userId: user?.id ?? null,
    })
    // 匿名流程没有身份，存不了抬头档案；登录用户走这条路时照常能存
    await afterInvoiceSubmitted(user?.id ?? null, d, fields)
    return success(result, '已提交，请支付税费')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    if (err instanceof VmqError) return error(err.message)
    console.error('Create invoice error:', err)
    return error('提交发票失败')
  }
}
