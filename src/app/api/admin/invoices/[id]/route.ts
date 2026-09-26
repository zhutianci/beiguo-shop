export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { buildAdminInvoiceRows, isPrepaidShopOrder, shopOrderIdOf } from '@/lib/admin-invoice-row'
import {
  adminOrResponse,
  sourceMap,
  sourceOf,
  taxRefundSchema,
  channelInvoiceLink,
  needsTaxDecision,
  applyInvoiceTaxDecision,
  TaxDecisionError,
} from '@/lib/admin/source-site'

// 本目录三个 handler 都在 middleware 之外再验一次管理员（CVE-2025-29927：middleware 可被整个跳过）；渠道 Host → 404。
// 动态参数沿用本文件原有的 { params: { id: string } } 写法，同一路由段不能混用两种签名。

const patchSchema = z.object({
  // 允许的状态流转：SUBMITTED→ISSUED（开具）；任意→CANNOT（不可开据）；CANNOT/ISSUED→SUBMITTED（撤回重置）
  status: z.enum(['SUBMITTED', 'ISSUED', 'CANNOT', 'AWAIT_PAY']).optional(),
  /**
   * 渠道单发票改 CANNOT、或 ISSUED → SUBMITTED 撤回时必带（设计 8.4；契约见实施分包 7.4）：
   * { refundTaxCents, expectedVersion, requestId } = 同一事务退税费（applyRefund 冲销发票分成）；
   * { keep: true, reason } = 保留税费（写审计）。主站票据忽略。
   */
  taxRefund: taxRefundSchema.optional(),
})

class InvoiceStateChanged extends Error {}

/**
 * 单张发票，行形状与列表（GET /api/admin/invoices）完全一致。
 * 给深链 /admin/invoices?invoiceId=… 用：从订单详情点「在发票管理中查看」时，
 * 那张票多半不在列表当前页（列表默认只看「已提交开票」），不能指望从列表里找。
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await adminOrResponse()
  if ('res' in auth) return auth.res

  try {
    const id = parseInt(params.id)
    if (!Number.isSafeInteger(id) || id <= 0) return error('ID 无效')

    const iv = await prisma.invoice.findUnique({ where: { id } })
    if (!iv) return notFound('发票不存在')

    // 挂的外部订单可能已被删掉（没有外键）：那就按「没有订单可挂」的行返回，
    // 关联订单仍会顺着发票上的 sourceKey 快照去找
    const ext =
      iv.externalOrderId != null
        ? await prisma.externalOrder.findUnique({ where: { id: iv.externalOrderId } })
        : null
    const [row] = await buildAdminInvoiceRows([{ ext, iv }])
    // 渠道单发票：带上结算版本号，弹窗「退税费」要用它做 expectedVersion
    const link = await channelInvoiceLink(iv.id)
    return success({
      ...row,
      site: sourceOf(await sourceMap([iv.tenantId]), iv.tenantId),
      channelOrder: link ? { orderId: link.orderId, orderNo: link.orderNo, settleVersion: link.settleVersion } : null,
    })
  } catch (err) {
    console.error('Admin get invoice error:', err)
    return error('查询失败')
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await adminOrResponse()
  if ('res' in auth) return auth.res

  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const invoice = await prisma.invoice.findUnique({ where: { id } })
    if (!invoice) return error('发票不存在', 404)

    const data: { status?: string; issuedAt?: Date } = {}
    if (parsed.data.status === 'AWAIT_PAY' && invoice?.payStatus === 'PAID') {
      return error('该发票的税费已经收取，不能改回「待支付税费」')
    }
    if (parsed.data.status) {
      data.status = parsed.data.status
      if (parsed.data.status === 'ISSUED') data.issuedAt = new Date()
    }
    if (Object.keys(data).length === 0) return error('没有可更新的内容')

    /*
     * 【渠道单发票与账本联动】（设计 8.4 末段）改 CANNOT、或 ISSUED 撤回 SUBMITTED，而税费已经收了：
     * 必须选「退税费」（同一事务 applyRefund，发票分成按 Rt 冲销）或「保留税费」（写审计、原因必填），缺 → 400。
     * 主站票据、税费未收的票据不需要，走原来的单条更新。
     */
    const to = parsed.data.status as string
    // 归属按发票 → 站内订单现查（不只看 Invoice.tenantId：历史数据或写错的来源站不能让渠道单绕过联动）
    const link = await channelInvoiceLink(invoice.id)
    const needDecision = !!link && needsTaxDecision(invoice, to)
    if (needDecision && !parsed.data.taxRefund) {
      return NextResponse.json(
        { success: false, error: '渠道订单的发票：请选择退还税费（填写金额）或保留税费（填写原因）', code: 'TAX_DECISION_REQUIRED' },
        { status: 400 },
      )
    }

    if (!needDecision) {
      await prisma.invoice.update({ where: { id }, data })
      return success({ id }, '已更新')
    }

    // 状态 CAS 与税费决定同一事务：两人同时改同一张票，后一个 409
    await prisma.$transaction(async (tx) => {
      const c = await tx.invoice.updateMany({ where: { id, status: invoice.status }, data })
      if (c.count !== 1) throw new InvoiceStateChanged()
      await applyInvoiceTaxDecision(tx, {
        link: link!,
        invoiceNo: invoice.invoiceNo,
        from: invoice.status,
        to,
        decision: parsed.data.taxRefund!,
        operatorId: auth.user.id,
        req: request,
      })
    })
    return success({ id }, '已更新')
  } catch (err) {
    if (err instanceof InvoiceStateChanged) return NextResponse.json({ success: false, error: '发票状态已变化，请刷新后重试', code: 'CONFLICT' }, { status: 409 })
    if (err instanceof TaxDecisionError) return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status })
    console.error('Admin update invoice error:', err)
    return error('更新失败')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await adminOrResponse()
  if ('res' in auth) return auth.res

  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    const iv = await prisma.invoice.findUnique({
      where: { id },
      select: { id: true, externalOrderId: true, sourceKey: true, source: true, payStatus: true, tenantId: true },
    })
    if (!iv) return notFound('发票不存在')

    /*
     * 【预收过税费的订单不许删票】与 by-order 的「重置为未开发票」同一条规矩、同一个判定
     * （lib/admin-invoice-row.ts 的 isPrepaidShopOrder）：买家结账时已把 6% 跟货款一起付了，
     * 删掉发票行不会清掉 Order.invoiceTaxFee —— 买家那边仍显示「已提交开票」，票却从待开清单消失。
     * 页面上这个接口只给手动录入的发票用（它们没有订单，判定直接放行），
     * 这道闸挡的是直接调接口删站内订单发票的情况。
     */
    const ext =
      iv.externalOrderId != null
        ? await prisma.externalOrder.findUnique({
            where: { id: iv.externalOrderId },
            select: { shopOrderId: true, sourceKey: true },
          })
        : null
    if (await isPrepaidShopOrder(shopOrderIdOf(ext, iv.sourceKey))) {
      return error('该订单的税费已随货款收取，不能删除这张发票；如需停开请改为「不可开据」')
    }
    // 渠道单：发票分成已计提且税费未全额退还 → 拒绝（设计 8.4 末段，与 by-order 的 DELETE 同口径）
    const link = await channelInvoiceLink(iv.id)
    if (link) {
      const o = await prisma.order.findUnique({ where: { id: link.orderId }, select: { invShareState: true } })
      if (o && (o.invShareState === 'ACCRUED' || o.invShareState === 'RELEASED')) {
        return error('该渠道订单的发票分成已计提：请先退还税费或改为「不可开据」')
      }
    }
    // 站内买家单独付过 6% 的票同样不能删（理由同 by-order 的重置）。
    // 手动录入（MANUAL）的票钱是线下收的、记录是管理员自己建的，删它不影响任何买家，放行
    if (iv.source !== 'MANUAL' && iv.payStatus === 'PAID') {
      return error('该发票的税费已经收取，不能删除；如需停开请改为「不可开据」')
    }

    await prisma.invoice.delete({ where: { id } })
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Admin delete invoice error:', err)
    return error('删除失败')
  }
}
