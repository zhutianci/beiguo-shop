export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { calcInvoiceAmounts, genInvoiceNo } from '@/lib/invoice'

const schema = z.object({
  status: z.enum(['UNAPPLIED', 'AWAIT_PAY', 'SUBMITTED', 'ISSUED', 'CANNOT']),
})

// 管理员按「订单」直接设置发票状态（订单导入页 / 发票管理页通用）
// 无发票记录时按需创建；置为 UNAPPLIED 时删除记录还原默认态
export async function PUT(request: NextRequest, { params }: { params: { externalOrderId: string } }) {
  try {
    const externalOrderId = parseInt(params.externalOrderId)
    if (!externalOrderId) return error('订单 ID 无效')

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const status = parsed.data.status

    const order = await prisma.externalOrder.findUnique({ where: { id: externalOrderId } })
    if (!order) return error('订单不存在', 404)

    const existing = await prisma.invoice.findUnique({ where: { externalOrderId } })

    // 还原为「未开发票」：删除发票记录
    if (status === 'UNAPPLIED') {
      if (existing) await prisma.invoice.delete({ where: { id: existing.id } })
      return success({ status: 'UNAPPLIED' }, '已重置为未开发票')
    }

    const quote = order.quote == null ? null : Number(order.quote)
    const amounts =
      quote == null
        ? { sellingPrice: null, invoiceAmount: null, taxFee: null }
        : { sellingPrice: quote, ...calcInvoiceAmounts(quote) }

    if (existing) {
      const updated = await prisma.invoice.update({
        where: { id: existing.id },
        data: {
          status,
          ...(status === 'ISSUED' ? { issuedAt: new Date() } : {}),
        },
      })
      return success({ status: updated.status }, '发票状态已更新')
    }

    const created = await prisma.invoice.create({
      data: {
        invoiceNo: genInvoiceNo(),
        externalOrderId: order.id,
        sourceKey: order.sourceKey,
        claudeAccount: order.claudeAccount,
        subscriptionType: order.subscriptionType,
        orderStartDate: order.startDate,
        orderExpireDate: order.expireDate,
        sellingPrice: amounts.sellingPrice,
        invoiceAmount: amounts.invoiceAmount,
        taxFee: amounts.taxFee,
        status,
        payStatus: 'UNPAID',
        ...(status === 'ISSUED' ? { issuedAt: new Date() } : {}),
      },
    })
    return success({ status: created.status }, '发票状态已更新')
  } catch (err) {
    console.error('Set invoice status by order error:', err)
    return error('更新失败')
  }
}

// 删除发票记录（还原未开发票）
export async function DELETE(_request: NextRequest, { params }: { params: { externalOrderId: string } }) {
  try {
    const externalOrderId = parseInt(params.externalOrderId)
    if (!externalOrderId) return error('订单 ID 无效')
    const existing = await prisma.invoice.findUnique({ where: { externalOrderId } })
    if (existing) await prisma.invoice.delete({ where: { id: existing.id } })
    return success({ externalOrderId }, '已删除发票记录')
  } catch (err) {
    console.error('Delete invoice by order error:', err)
    return error('删除失败')
  }
}
