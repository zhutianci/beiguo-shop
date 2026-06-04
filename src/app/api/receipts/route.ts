export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { PAYEE, genReceiptNo, genReceiptToken } from '@/lib/receipt'

const schema = z.object({
  externalOrderId: z.number().int().positive('缺少订单'),
  payerTitle: z.string().trim().min(1, '请填写付款人抬头').max(200),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const order = await prisma.externalOrder.findUnique({ where: { id: d.externalOrderId } })
    if (!order) return error('订单不存在')

    // 一笔订单仅一张收据
    const existing = await prisma.receipt.findFirst({ where: { externalOrderId: order.id } })
    if (existing) return error('该订单已开具收据，如需重开请联系客服', 409)

    // 计费基准 = 报价(quote)；若发票已开具，则按发票金额（含税 = 报价×1.06）出具收据
    const quote = order.quote == null ? null : Number(order.quote)
    if (quote == null) return error('该订单暂不可开具收据')

    const invoice = await prisma.invoice.findUnique({ where: { externalOrderId: order.id } })
    const amount =
      invoice && invoice.status === 'ISSUED' ? Number(invoice.invoiceAmount) : quote

    const receipt = await prisma.receipt.create({
      data: {
        receiptNo: genReceiptNo(),
        token: genReceiptToken(),
        externalOrderId: order.id,
        sourceKey: order.sourceKey,
        claudeAccount: order.claudeAccount,
        subscriptionType: order.subscriptionType,
        orderStartDate: order.startDate,
        orderExpireDate: order.expireDate,
        payerTitle: d.payerTitle,
        payee: PAYEE,
        amount,
      },
    })

    return success({ token: receipt.token }, '收据已生成')
  } catch (err) {
    console.error('Create receipt error:', err)
    return error('生成收据失败')
  }
}
