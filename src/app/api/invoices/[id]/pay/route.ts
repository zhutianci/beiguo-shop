export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { createOrGetVmqOrder, vmqConfigured, VmqError } from '@/lib/vmq'

// 对待支付税费的发票，重新发起 V免签 收款
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!vmqConfigured()) return error('支付未配置', 500)
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    const invoice = await prisma.invoice.findUnique({ where: { id } })
    if (!invoice) return error('发票不存在', 404)
    if (invoice.payStatus === 'PAID' || invoice.status !== 'AWAIT_PAY') {
      return error('该发票无需支付')
    }
    if (invoice.taxFee == null) return error('发票金额异常')

    const vmq = await createOrGetVmqOrder({
      bizType: 'invoice',
      bizId: invoice.id,
      outTradeNo: invoice.invoiceNo,
      price: Number(invoice.taxFee),
    })

    return success({ payUrl: `/pay/${vmq.orderId}`, taxFee: Number(invoice.taxFee), reallyPrice: vmq.reallyPrice })
  } catch (err) {
    if (err instanceof VmqError) return error(err.message)
    console.error('Invoice pay error:', err)
    return error('发起支付失败')
  }
}
