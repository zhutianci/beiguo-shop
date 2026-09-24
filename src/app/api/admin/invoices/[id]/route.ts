export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { buildAdminInvoiceRows, isPrepaidShopOrder, shopOrderIdOf } from '@/lib/admin-invoice-row'

// 本目录三个 handler 都在 middleware 之外再验一次管理员（CVE-2025-29927：middleware 可被整个跳过）。
// 动态参数沿用本文件原有的 { params: { id: string } } 写法，同一路由段不能混用两种签名。

const patchSchema = z.object({
  // 允许的状态流转：SUBMITTED→ISSUED（开具）；任意→CANNOT（不可开据）；CANNOT/ISSUED→SUBMITTED（撤回重置）
  status: z.enum(['SUBMITTED', 'ISSUED', 'CANNOT', 'AWAIT_PAY']).optional(),
})

/**
 * 单张发票，行形状与列表（GET /api/admin/invoices）完全一致。
 * 给深链 /admin/invoices?invoiceId=… 用：从订单详情点「在发票管理中查看」时，
 * 那张票多半不在列表当前页（列表默认只看「已提交开票」），不能指望从列表里找。
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

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
    return success(row)
  } catch (err) {
    console.error('Admin get invoice error:', err)
    return error('查询失败')
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const invoice = await prisma.invoice.findUnique({ where: { id } })
    if (!invoice) return error('发票不存在', 404)

    const data: any = {}
    if (parsed.data.status === 'AWAIT_PAY' && invoice?.payStatus === 'PAID') {
      return error('该发票的税费已经收取，不能改回「待支付税费」')
    }
    if (parsed.data.status) {
      data.status = parsed.data.status
      if (parsed.data.status === 'ISSUED') data.issuedAt = new Date()
    }
    if (Object.keys(data).length === 0) return error('没有可更新的内容')

    await prisma.invoice.update({ where: { id }, data })
    return success({ id }, '已更新')
  } catch (err) {
    console.error('Admin update invoice error:', err)
    return error('更新失败')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    const iv = await prisma.invoice.findUnique({
      where: { id },
      select: { id: true, externalOrderId: true, sourceKey: true, source: true, payStatus: true },
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
