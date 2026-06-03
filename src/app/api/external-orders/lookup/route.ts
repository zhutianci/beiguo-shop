export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { matchPriceFromProducts, calcInvoiceAmounts } from '@/lib/invoice'

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
        createdAt: true,
        updatedAt: true,
      },
    })

    // 取商品价格做售价匹配 + 取已有发票记录
    const [products, invoices] = await Promise.all([
      prisma.product.findMany({ where: { status: 1 }, select: { name: true, price: true } }),
      orders.length
        ? prisma.invoice.findMany({
            where: { externalOrderId: { in: orders.map((o) => o.id) } },
            select: { id: true, externalOrderId: true, status: true },
          })
        : Promise.resolve([]),
    ])
    const invoiceMap = new Map(invoices.map((iv) => [iv.externalOrderId, iv]))

    const list = orders.map((o) => {
      const price = matchPriceFromProducts(products, o.subscriptionType)
      const existing = invoiceMap.get(o.id)
      let invoiceStatus: string
      let sellingPrice: number | null = null
      let invoiceAmount: number | null = null
      let taxFee: number | null = null

      if (price == null) {
        invoiceStatus = 'CANNOT' // 匹配不到售价 → 不可开据
      } else {
        sellingPrice = price
        const amt = calcInvoiceAmounts(price)
        invoiceAmount = amt.invoiceAmount
        taxFee = amt.taxFee
        invoiceStatus = existing ? existing.status : 'UNAPPLIED'
      }

      return {
        ...o,
        canInvoice: price != null,
        sellingPrice,
        invoiceAmount,
        taxFee,
        invoiceStatus,
        invoiceId: existing?.id ?? null,
      }
    })

    return success({ orders: list, count: list.length })
  } catch (err) {
    console.error('Lookup error:', err)
    return error('查询失败')
  }
}
