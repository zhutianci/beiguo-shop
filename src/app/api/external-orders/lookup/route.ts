export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { calcInvoiceAmounts } from '@/lib/invoice'

const querySchema = z.object({
  email: z.string().email('请输入正确的邮箱'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const result = querySchema.safeParse({ email: searchParams.get('email') })
    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    const email = result.data.email.trim().toLowerCase()

    const orders = await prisma.externalOrder.findMany({
      where: { claudeAccount: email },
      orderBy: [{ expireDate: 'desc' }, { startDate: 'desc' }],
      select: {
        id: true,
        startDate: true,
        expireDate: true,
        subscriptionType: true,
        xianyuNickname: true,
        claudeAccount: true,
        quote: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const orderIds = orders.map((o) => o.id)
    // 发票/收据均以「报价(quote)」为计费基准
    const [invoices, receipts] = await Promise.all([
      orderIds.length
        ? prisma.invoice.findMany({
            where: { externalOrderId: { in: orderIds } },
            select: { id: true, externalOrderId: true, status: true },
          })
        : Promise.resolve([]),
      orderIds.length
        ? prisma.receipt.findMany({
            where: { externalOrderId: { in: orderIds } },
            select: { token: true, externalOrderId: true },
          })
        : Promise.resolve([]),
    ])
    const invoiceMap = new Map(invoices.map((iv) => [iv.externalOrderId, iv]))
    const receiptMap = new Map(receipts.map((r) => [r.externalOrderId, r]))

    const list = orders.map((o) => {
      const price = o.quote == null ? null : Number(o.quote)
      const existing = invoiceMap.get(o.id)
      let invoiceStatus: string
      let sellingPrice: number | null = null
      let invoiceAmount: number | null = null
      let taxFee: number | null = null

      if (price == null) {
        invoiceStatus = existing ? existing.status : 'CANNOT' // 无报价 → 暂不可开据
      } else {
        sellingPrice = price
        const amt = calcInvoiceAmounts(price)
        invoiceAmount = amt.invoiceAmount
        taxFee = amt.taxFee
        invoiceStatus = existing ? existing.status : 'UNAPPLIED'
      }

      const receipt = receiptMap.get(o.id)
      const { quote: _quote, ...rest } = o
      return {
        ...rest,
        canInvoice: price != null && invoiceStatus !== 'CANNOT',
        sellingPrice,
        invoiceAmount,
        taxFee,
        invoiceStatus,
        invoiceId: existing?.id ?? null,
        canReceipt: price != null,
        receiptToken: receipt?.token ?? null,
      }
    })

    return success({ orders: list, count: list.length })
  } catch (err) {
    console.error('Lookup error:', err)
    return error('查询失败')
  }
}
