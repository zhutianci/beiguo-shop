export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyNotify, getAppId } from '@/lib/alipay'

// 发票税费支付的异步通知：付款成功后将发票置为「已提交开票」
export async function POST(request: NextRequest) {
  const fail = () => new Response('failure', { status: 200 })
  const ok = () => new Response('success', { status: 200 })

  try {
    const form = await request.formData()
    const params: Record<string, string> = {}
    form.forEach((v, k) => {
      params[k] = String(v)
    })

    if (!verifyNotify(params)) {
      console.error('[invoice notify] 验签失败', params.out_trade_no)
      return fail()
    }
    if (params.app_id !== getAppId()) return fail()

    const invoice = await prisma.invoice.findUnique({ where: { invoiceNo: params.out_trade_no } })
    if (!invoice) {
      console.error('[invoice notify] 发票不存在', params.out_trade_no)
      return fail()
    }
    if (Number(params.total_amount) !== Number(invoice.taxFee)) {
      console.error('[invoice notify] 金额不匹配', params.total_amount, invoice.taxFee)
      return fail()
    }

    if (params.trade_status === 'TRADE_SUCCESS' || params.trade_status === 'TRADE_FINISHED') {
      if (invoice.payStatus !== 'PAID') {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            payStatus: 'PAID',
            status: 'SUBMITTED', // 已支付税费 → 已提交开票，待开具
            tradeNo: params.trade_no || null,
            paidAt: new Date(),
          },
        })
        console.log('[invoice notify] 税费已支付', invoice.invoiceNo)
      }
      return ok()
    }
    return ok()
  } catch (err) {
    console.error('[invoice notify] 异常', err)
    return fail()
  }
}
