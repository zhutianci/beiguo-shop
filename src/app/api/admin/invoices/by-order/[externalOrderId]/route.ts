export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { calcInvoiceAmounts, genInvoiceNo } from '@/lib/invoice'
import { isPrepaidShopOrder, shopOrderIdOf } from '@/lib/admin-invoice-row'
import { billingFieldsOrThrow, BillingError } from '@/lib/order-invoice'
import {
  adminOrResponse,
  taxRefundSchema,
  channelInvoiceLink,
  needsTaxDecision,
  applyInvoiceTaxDecision,
  TaxDecisionError,
} from '@/lib/admin/source-site'

const schema = z.object({
  status: z.enum(['UNAPPLIED', 'AWAIT_PAY', 'SUBMITTED', 'ISSUED', 'CANNOT']),
  /** 渠道单发票改 CANNOT / ISSUED → SUBMITTED 时必带（设计 8.4；与 admin/invoices/[id] 的 PATCH 同一口径） */
  taxRefund: taxRefundSchema.optional(),
})

class InvoiceStateChanged extends Error {}

// 管理员按「订单」直接设置发票状态（订单导入页 / 发票管理页通用）
// 无发票记录时按需创建；置为 UNAPPLIED 时删除记录还原默认态
// 两个 handler 都在 middleware 之外再验一次管理员（CVE-2025-29927：middleware 可被整个跳过）；渠道 Host → 404
export async function PUT(request: NextRequest, { params }: { params: { externalOrderId: string } }) {
  const auth = await adminOrResponse()
  if ('res' in auth) return auth.res

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
      const data = {
        status,
        ...(status === 'ISSUED' ? { issuedAt: new Date() } : {}),
        ...(status === 'SUBMITTED' && !existing.submittedAt ? { submittedAt: new Date() } : {}),
      }
      /*
       * 【渠道单发票与账本联动】（设计 8.4 末段）改 CANNOT、或 ISSUED 撤回 SUBMITTED，而税费已经收了：
       * 必须带 taxRefund（退税费 → 同一事务 applyRefund；保留 → 写审计），缺 → 400。主站票据走原来的单条更新。
       */
      const link = await channelInvoiceLink(existing.id)
      const needDecision = !!link && needsTaxDecision(existing, status)
      if (needDecision && !parsed.data.taxRefund) {
        return NextResponse.json(
          { success: false, error: '渠道订单的发票：请选择退还税费（填写金额）或保留税费（填写原因）', code: 'TAX_DECISION_REQUIRED' },
          { status: 400 },
        )
      }
      if (!needDecision) {
        const updated = await prisma.invoice.update({ where: { id: existing.id }, data })
        return success({ status: updated.status }, '发票状态已更新')
      }
      await prisma.$transaction(async (tx) => {
        const c = await tx.invoice.updateMany({ where: { id: existing.id, status: existing.status }, data })
        if (c.count !== 1) throw new InvoiceStateChanged()
        await applyInvoiceTaxDecision(tx, {
          link: link!,
          invoiceNo: existing.invoiceNo,
          from: existing.status,
          to: status,
          decision: parsed.data.taxRefund!,
          operatorId: auth.user.id,
          req: request,
        })
      })
      return success({ status }, '发票状态已更新')
    }

    /*
     * 凭空建票：来源站两列统一经 billingTenantFields 取（设计 5.5「全部写入点」、边界检查第 12 条）——
     * 外部订单行指回的站内订单是哪个站，发票就属于哪个站；跨站合并（行与订单不同站）→ 409，绝不按任何一边建票。
     */
    const billing = await billingFieldsOrThrow(order.id)
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
        tenantId: billing.tenantId,
        shopOrderId: billing.shopOrderId,
        ...(status === 'ISSUED' ? { issuedAt: new Date() } : {}),
        ...(status === 'SUBMITTED' ? { submittedAt: new Date() } : {}),
      },
    })
    return success({ status: created.status }, '发票状态已更新')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    if (err instanceof InvoiceStateChanged) return NextResponse.json({ success: false, error: '发票状态已变化，请刷新后重试', code: 'CONFLICT' }, { status: 409 })
    if (err instanceof TaxDecisionError) return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status })
    console.error('Set invoice status by order error:', err)
    return error('更新失败')
  }
}

// 删除发票记录（还原未开发票）。页面上没有调用方，但接口在；预收税费的订单同样不许删（理由见 PUT）
export async function DELETE(_request: NextRequest, { params }: { params: { externalOrderId: string } }) {
  const auth = await adminOrResponse()
  if ('res' in auth) return auth.res

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
      /*
       * 渠道单（设计 8.4 末段；契约 7.4）：发票分成已计提（ACCRUED / RELEASED）且税费未全额退还 → 拒绝，
       * 删了发票，对账就找不到分成的依据（L11），渠道余额里却留着那笔分成。要停开先退税费或改 CANNOT。
       */
      const link = await channelInvoiceLink(existing.id)
      if (link) {
        const o = await prisma.order.findUnique({ where: { id: link.orderId }, select: { invShareState: true, invoiceTaxFee: true, refundedTaxCents: true } })
        const T = existing.taxFee != null ? Math.round(Number(existing.taxFee) * 100) : o?.invoiceTaxFee != null ? Math.round(Number(o.invoiceTaxFee) * 100) : 0
        const fullyRefunded = T > 0 && (o?.refundedTaxCents ?? 0) >= T
        if (o && (o.invShareState === 'ACCRUED' || o.invShareState === 'RELEASED') && !fullyRefunded) {
          return error('该渠道订单的发票分成已计提且税费未全额退还：请先退还税费或改为「不可开据」')
        }
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
