export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { calcInvoiceAmounts, genInvoiceNo } from '@/lib/invoice'
import { isPrepaidShopOrder, shopOrderIdOf } from '@/lib/admin-invoice-row'

const schema = z.object({
  status: z.enum(['UNAPPLIED', 'AWAIT_PAY', 'SUBMITTED', 'ISSUED', 'CANNOT']),
})

// 管理员按「订单」直接设置发票状态（订单导入页 / 发票管理页通用）
// 无发票记录时按需创建；置为 UNAPPLIED 时删除记录还原默认态
// 两个 handler 都在 middleware 之外再验一次管理员（CVE-2025-29927：middleware 可被整个跳过）
export async function PUT(request: NextRequest, { params }: { params: { externalOrderId: string } }) {
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

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
     * （判定与下方 DELETE、按 id 的 DELETE 共用 lib/admin-invoice-row.ts 的 isPrepaidShopOrder）
     */
    // 税费已收的票改回「待支付税费」：买家订单页会出现一个「去支付」，付款接口却回「无需支付」，
    // 票也从待开清单里消失。要停开用「不可开据」
    if (status === 'AWAIT_PAY' && existing?.payStatus === 'PAID') {
      return error('该发票的税费已经收取，不能改回「待支付税费」')
    }
    if (status === 'UNAPPLIED') {
      if (await isPrepaidShopOrder(shopOrderIdOf(order, existing?.sourceKey))) {
        return error('该订单的税费已随货款收取，不能重置为「未开发票」；如需停开请选择「不可开据」')
      }
      // 【单独付过 6% 的也不许删】结账没勾开票、事后在订单页申请并付了税费的票，Order.invoiceTaxFee 为空，
      // 上面那道闸拦不住它。删掉之后：已收税费从统计与导出里消失，买家订单页又出现「申请发票」，
      // 再申请一次就是第二次收 6%
      if (existing?.payStatus === 'PAID') {
        return error('该发票的税费已经收取，不能重置为「未开发票」；如需停开请选择「不可开据」')
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

// 删除发票记录（还原未开发票）。页面上没有调用方，但接口在；预收税费的订单同样不许删（理由见 PUT）
export async function DELETE(_request: NextRequest, { params }: { params: { externalOrderId: string } }) {
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const externalOrderId = parseInt(params.externalOrderId)
    if (!externalOrderId) return error('订单 ID 无效')
    const existing = await prisma.invoice.findUnique({ where: { externalOrderId } })
    if (existing) {
      const ext = await prisma.externalOrder.findUnique({
        where: { id: externalOrderId },
        select: { shopOrderId: true, sourceKey: true },
      })
      if (await isPrepaidShopOrder(shopOrderIdOf(ext, existing.sourceKey))) {
        return error('该订单的税费已随货款收取，不能删除这张发票；如需停开请改为「不可开据」')
      }
      if (existing.payStatus === 'PAID') {
        return error('该发票的税费已经收取，不能删除；如需停开请改为「不可开据」')
      }
      await prisma.invoice.delete({ where: { id: existing.id } })
    }
    return success({ externalOrderId }, '已删除发票记录')
  } catch (err) {
    console.error('Delete invoice by order error:', err)
    return error('删除失败')
  }
}
