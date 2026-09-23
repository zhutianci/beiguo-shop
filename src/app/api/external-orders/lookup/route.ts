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
        shopOrderId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    /*
     * 【结账时已预收 6% 的站内订单】它的发票挂在 `order:<id>` 那条背书行上，
     * 而管理员按真实订阅周期导入的那条（sourceKey = hashKey(...)）上没有发票，
     * 于是这一页会把它显示成「未开发票·可申请」，收据金额也按不含税的 quote 报。
     * 买家点进去虽然被服务端的 settlePrepaid* 挡住了不会被重复收钱，
     * 但页面先承诺一个数、提交后又变成另一个数，本身就是这次改造要消除的困惑。
     * 这里按 shopOrderId 反查一次，把状态和金额一次报对。
     */
    const shopOrderIds = orders.map((o) => o.shopOrderId).filter((v): v is number => v != null)
    const prepaidOrderIds = new Set<number>()
    if (shopOrderIds.length) {
      const paid = await prisma.order.findMany({
        where: { id: { in: shopOrderIds }, payStatus: 'PAID', invoiceTaxFee: { not: null } },
        select: { id: true },
      })
      paid.forEach((o) => prepaidOrderIds.add(o.id))
    }

    const orderIds = orders.map((o) => o.id)
    // 发票/收据均以「报价(quote)」为计费基准
    const [invoices, receipts] = await Promise.all([
      orderIds.length
        ? prisma.invoice.findMany({
            where: { externalOrderId: { in: orderIds } },
            select: { id: true, externalOrderId: true, status: true, payStatus: true },
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
      /** 这条订阅对应的站内订单在结账时已经把 6% 跟货款一起付清了 */
      const prepaid = o.shopOrderId != null && prepaidOrderIds.has(o.shopOrderId)
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
        // 预收过税费的：即使这条行上还没有发票记录也报「已提交开票」，
        // 不给「申请发票」的入口（服务端那道闸也会拒，这里只是不让它出现在眼前）
        invoiceStatus = existing ? existing.status : prepaid ? 'SUBMITTED' : 'UNAPPLIED'
      }

      const receipt = receiptMap.get(o.id)
      const { quote: _quote, ...rest } = o
      // 收据金额：买家已付发票税费(payStatus=PAID) → 含税开票金额；否则售价。
      // 须与 submitReceiptForExternalOrder 中的服务端计费口径保持一致。
      const receiptAmount =
        (existing?.payStatus === 'PAID' || prepaid) && invoiceAmount != null
          ? invoiceAmount
          : sellingPrice
      return {
        ...rest,
        canInvoice: price != null && invoiceStatus !== 'CANNOT' && !prepaid,
        sellingPrice,
        invoiceAmount,
        taxFee,
        receiptAmount,
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
