export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { calcInvoiceAmounts } from '@/lib/invoice'

// 发票管理：以「订单」为主表，同步展示所有订单的发票状态（无发票记录的默认「未开发票」）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 500)
    const keyword = searchParams.get('keyword')?.trim()
    const status = searchParams.get('status')?.trim()

    const where = keyword
      ? {
          OR: [
            { claudeAccount: { contains: keyword } },
            { subscriptionType: { contains: keyword } },
            { xianyuNickname: { contains: keyword } },
          ],
        }
      : {}

    const orders = await prisma.externalOrder.findMany({
      where,
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
    })

    const ids = orders.map((o) => o.id)
    const invoices = ids.length
      ? await prisma.invoice.findMany({ where: { externalOrderId: { in: ids } } })
      : []
    const invMap = new Map(invoices.map((iv) => [iv.externalOrderId, iv]))

    let rows = orders.map((o) => {
      const iv = invMap.get(o.id)
      const quote = o.quote == null ? null : Number(o.quote)

      let st: string
      let sellingPrice: number | null
      let invoiceAmount: number | null
      let taxFee: number | null
      let payStatus: string
      if (iv) {
        st = iv.status
        sellingPrice = Number(iv.sellingPrice)
        invoiceAmount = Number(iv.invoiceAmount)
        taxFee = Number(iv.taxFee)
        payStatus = iv.payStatus
      } else {
        st = 'UNAPPLIED'
        payStatus = 'UNPAID'
        if (quote != null) {
          sellingPrice = quote
          const amt = calcInvoiceAmounts(quote)
          invoiceAmount = amt.invoiceAmount
          taxFee = amt.taxFee
        } else {
          sellingPrice = null
          invoiceAmount = null
          taxFee = null
        }
      }

      return {
        externalOrderId: o.id,
        invoiceId: iv?.id ?? null,
        invoiceNo: iv?.invoiceNo ?? null,
        claudeAccount: o.claudeAccount,
        subscriptionType: o.subscriptionType,
        xianyuNickname: o.xianyuNickname,
        orderStartDate: o.startDate,
        orderExpireDate: o.expireDate,
        title: iv?.title ?? null,
        taxNumber: iv?.taxNumber ?? null,
        address: iv?.address ?? null,
        phone: iv?.phone ?? null,
        bankName: iv?.bankName ?? null,
        bankAccount: iv?.bankAccount ?? null,
        email: iv?.email ?? null,
        sellingPrice,
        invoiceAmount,
        taxFee,
        status: st,
        payStatus,
        paidAt: iv?.paidAt ?? null,
        submittedAt: iv?.submittedAt ?? null,
        issuedAt: iv?.issuedAt ?? null,
        createdAt: iv?.createdAt ?? o.createdAt,
      }
    })

    if (status) rows = rows.filter((r) => r.status === status)

    // 按提交时间倒序（无提交时间的回退到 paidAt / createdAt）
    const sortKey = (r: (typeof rows)[number]) =>
      new Date(r.submittedAt ?? r.paidAt ?? r.createdAt).getTime()
    rows.sort((a, b) => sortKey(b) - sortKey(a))

    // 统计：各状态数量 + 已支付税费合计 + 已开具发票金额（含税）合计
    const totals = {
      count: { UNAPPLIED: 0, AWAIT_PAY: 0, SUBMITTED: 0, ISSUED: 0, CANNOT: 0 } as Record<string, number>,
      paidTaxFee: 0, // 已支付的发票税费合计
      issuedInvoiceAmount: 0, // 已开具发票金额（含税 = 报价×1.06）合计
    }
    for (const r of rows) {
      totals.count[r.status] = (totals.count[r.status] || 0) + 1
      if (r.payStatus === 'PAID' && r.taxFee != null) totals.paidTaxFee += r.taxFee
      if (r.status === 'ISSUED' && r.invoiceAmount != null) totals.issuedInvoiceAmount += r.invoiceAmount
    }
    totals.paidTaxFee = Math.round(totals.paidTaxFee * 100) / 100
    totals.issuedInvoiceAmount = Math.round(totals.issuedInvoiceAmount * 100) / 100

    const total = rows.length
    const list = rows.slice((page - 1) * pageSize, page * pageSize)

    return success({ list, total, page, pageSize, totalPages: Math.ceil(total / pageSize), totals })
  } catch (err) {
    console.error('Admin list invoices error:', err)
    return error('查询失败')
  }
}
