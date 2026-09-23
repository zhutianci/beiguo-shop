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
import { settlePrepaidOrderInvoice } from '@/lib/order-invoice'
import {
  buyerInvoiceSubmitSchema,
  normalizeInvoiceFields,
  afterInvoiceSubmitted,
} from '@/lib/invoice-input'

// 字段校验统一在 lib/invoice-input（route.ts 不能导出 handler 以外的东西，
// 而三个开票入口必须共用同一套规则 —— 尤其是税号去空格，漏一处等于没做）
const schema = buyerInvoiceSubmitSchema

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
    const fields = normalizeInvoiceFields(parsed.data)

    /*
     * 【防重复收税】这一单在结账时勾过「同时开发票」，6% 已经跟货款一起收过了。
     * 绝不能再开一张待付税费的收款单 —— 那是向同一个买家收第二遍。
     * 顺手把当初的草稿补落成正式发票（万一履约那一下失败过），
     * 并用这次填的抬头覆盖（票还没开出去时），买家填的内容不会白填。
     */
    const prepaid = await settlePrepaidOrderInvoice(order.id, fields)
    if (prepaid) {
      await afterInvoiceSubmitted(user.id, parsed.data, fields)
      return success(
        { alreadyPaid: true },
        '该订单下单时已选择开发票、税费也已随货款付清，无需再次支付；抬头已按本次填写更新'
      )
    }

    // 为该订单生成/复用背书外部订单，复用现有发票体系
    const ext = await ensureExternalOrderForShopOrder({
      id: order.id,
      productName: order.productName,
      amount: order.amount,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      user: order.user,
    })

    const result = await submitInvoiceForExternalOrder(ext.id, fields, { userId: user.id })
    await afterInvoiceSubmitted(user.id, parsed.data, fields)
    return success(result, '已提交，请支付税费')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    if (err instanceof VmqError) return error(err.message)
    console.error('Order invoice error:', err)
    return error('提交发票失败')
  }
}
