export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { calcInvoiceAmounts, genInvoiceNo } from '@/lib/invoice'
import { createOrGetVmqOrder, vmqConfigured, VmqError } from '@/lib/vmq'

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

    const order = await prisma.externalOrder.findUnique({ where: { id: d.externalOrderId } })
    if (!order) return error('订单不存在')

    // 计费基准 = 报价(quote)
    const price = order.quote == null ? null : Number(order.quote)
    if (price == null) return error('该订单暂不可开具发票')
    const { invoiceAmount, taxFee } = calcInvoiceAmounts(price)

    const email = d.email.trim().toLowerCase()
    const buyerFields = {
      title: d.title,
      taxNumber: d.taxNumber,
      address: d.address || null,
      phone: d.phone || null,
      bankName: d.bankName || null,
      bankAccount: d.bankAccount || null,
      email,
      sellingPrice: price,
      invoiceAmount,
      taxFee,
    }

    // 一笔订单一张发票
    const existing = await prisma.invoice.findUnique({ where: { externalOrderId: order.id } })
    let invoice
    if (existing) {
      if (existing.status === 'ISSUED' || existing.status === 'SUBMITTED') {
        return error('该订单已申请发票，请勿重复提交')
      }
      if (existing.status === 'CANNOT') {
        return error('该订单暂不可开具发票，请联系客服')
      }
      invoice = await prisma.invoice.update({
        where: { id: existing.id },
        data: { ...buyerFields, status: 'AWAIT_PAY' },
      })
    } else {
      invoice = await prisma.invoice.create({
        data: {
          invoiceNo: genInvoiceNo(),
          externalOrderId: order.id,
          sourceKey: order.sourceKey,
          claudeAccount: order.claudeAccount,
          subscriptionType: order.subscriptionType,
          orderStartDate: order.startDate,
          orderExpireDate: order.expireDate,
          ...buyerFields,
          status: 'AWAIT_PAY',
          payStatus: 'UNPAID',
        },
      })
    }

    // 发起 V免签 收款（支付税费）
    const vmq = await createOrGetVmqOrder({
      bizType: 'invoice',
      bizId: invoice.id,
      outTradeNo: invoice.invoiceNo,
      price: Number(invoice.taxFee),
    })

    return success({ payUrl: `/pay/${vmq.orderId}`, invoiceId: invoice.id, taxFee: Number(invoice.taxFee), reallyPrice: vmq.reallyPrice }, '已提交，请支付税费')
  } catch (err) {
    if (err instanceof VmqError) return error(err.message)
    console.error('Create invoice error:', err)
    return error('提交发票失败')
  }
}
