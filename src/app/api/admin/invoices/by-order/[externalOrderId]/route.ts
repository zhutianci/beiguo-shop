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

    /*
     * 还原为「未开发票」：删除发票记录。
     *
     * 【预收过税费的订单不许这么重置】买家结账时已经把 6% 跟货款一起付了，
     * 钱在账上。删掉发票行并不会把 Order.invoiceTaxFee 清掉，于是买家订单页
     * 仍然显示「已提交开票」、仍然不给「申请发票」的按钮（那个判据读的是
     * invoiceTaxFee，见 api/orders/route.ts），管理员这一下重置对买家完全不可见，
     * 而票却从待开清单里消失了 —— 收了钱、没开票、两边都不知道。
     * 真要停开这张票，用「不可开据」，它留痕且买家看得见。
     */
    if (status === 'UNAPPLIED') {
      const shopOrderId =
        order.shopOrderId ?? (() => {
          const m = /^order:(\d+)$/.exec(order.sourceKey || '')
          return m ? parseInt(m[1]) : null
        })()
      if (shopOrderId) {
        const paidPrepaid = await prisma.order.findFirst({
          where: { id: shopOrderId, payStatus: 'PAID', invoiceTaxFee: { not: null } },
          select: { id: true },
        })
        if (paidPrepaid) {
          return error('该订单的税费已随货款收取，不能重置为「未开发票」；如需停开请选择「不可开据」')
        }
      }
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
          ...(status === 'SUBMITTED' && !existing.submittedAt ? { submittedAt: new Date() } : {}),
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
        ...(status === 'SUBMITTED' ? { submittedAt: new Date() } : {}),
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
