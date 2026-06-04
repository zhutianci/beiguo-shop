export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { alipayConfigured, buildPayUrl } from '@/lib/alipay'

// 对待支付税费的发票，重新生成支付链接
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!alipayConfigured()) return error('支付未配置', 500)
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    let channel: 'wap' | 'page' = 'wap'
    try {
      const body = await request.json()
      if (body?.channel === 'page') channel = 'page'
    } catch {
      /* 无 body 时默认 wap */
    }

    const invoice = await prisma.invoice.findUnique({ where: { id } })
    if (!invoice) return error('发票不存在', 404)
    if (invoice.payStatus === 'PAID' || invoice.status !== 'AWAIT_PAY') {
      return error('该发票无需支付')
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bigolab.com'
    const payUrl = buildPayUrl({
      outTradeNo: invoice.invoiceNo,
      totalAmount: Number(invoice.taxFee).toFixed(2),
      subject: `发票税费-${invoice.subscriptionType}`.slice(0, 256),
      channel,
      notifyUrl: `${appUrl}/api/pay/alipay/invoice-notify`,
      returnUrl: `${appUrl}/lookup?email=${encodeURIComponent(invoice.email || invoice.claudeAccount)}`,
      quitUrl: `${appUrl}/lookup?email=${encodeURIComponent(invoice.email || invoice.claudeAccount)}`,
    })
    return success({ payUrl, taxFee: Number(invoice.taxFee) })
  } catch (err) {
    console.error('Invoice pay error:', err)
    return error('发起支付失败')
  }
}
