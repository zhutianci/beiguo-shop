export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized, notFound } from '@/lib/api'
import {
  ensureExternalOrderForShopOrder,
  submitReceiptForExternalOrder,
  BillingError,
} from '@/lib/order-billing'
import { settlePrepaidOrderInvoice, shopOrderSourceKey } from '@/lib/order-invoice'
import { invoicesForOrder } from '@/lib/order-link'

const schema = z.object({
  payerTitle: z.string().trim().min(1, '请填写付款人抬头').max(200),
  // 必选、无默认：与发票同一口径。不展示 → 收据「项目」一栏只印「技术咨询服务」。
  // 收据一笔订单只能开一次、开完改不了，所以不能替买家默认成任何一边
  showAiWording: z.boolean({ required_error: '请选择收据中是否展示 ChatGPT/Claude 相关字眼' }),
})

// 买家从「我的订单」直接申请收据（无需邮箱查询）
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const orderId = parseInt(params.id)
    if (!orderId) return error('订单无效')

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true, nickname: true } } },
    })
    if (!order || order.userId !== user.id) return notFound('订单不存在')
    if (order.payStatus !== 'PAID') return error('订单支付后才能申请收据')
    // 已付款又被取消 = 线下退款的惯例做法。提前给明确提示；lib 里的 assertShopOrderBillable / settlePrepaid 兜底
    if (order.deliveryStatus === 'CANCELLED') return error('订单已取消（已退款），不能申请收据', 409)

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    /*
     * 【收据金额的口径要先对齐】结账时预收过 6% 的订单，买家实付的是含税额，
     * 订单页的收据面板也按含税额显示。但 submitReceiptForExternalOrder 的判据是
     * 「有没有一张 payStatus=PAID 的发票」—— 万一履约时那张发票没落地，
     * 它会退回按不含税的 quote 出具，买家拿到一张比实付少 6% 的收据。
     * 而收据一笔订单只能开一张、开错了改不回来。所以先把发票补落地再计费。
     */
    await settlePrepaidOrderInvoice(order.id)

    /*
     * 【一张站内订单只开一张收据 —— 要查全所有关联的外部订单行】
     * 除了背书行（sourceKey=order:<id>），管理员「标记已完成」还会导入一条 WEB 行（只有 shopOrderId），
     * 买家也可能从「邮箱查订阅」在那一行上开过收据。submitReceiptForExternalOrder 只查本行，
     * 不在这里拦的话同一笔付款能开出两张收据。
     */
    const linkedExts = await prisma.externalOrder.findMany({
      where: { OR: [{ shopOrderId: order.id }, { sourceKey: shopOrderSourceKey(order.id) }] },
      select: { id: true },
    })
    // 还要看收据上的 sourceKey 快照：管理员删掉背书行之后，收据的 externalOrderId 指向一条已不存在的行，
    // 只按现存行查会漏掉它，同一笔付款就能再开出第二张收据
    const linkedIds = linkedExts.map((e) => e.id)
    const existing = await prisma.receipt.findFirst({
      where: {
        source: 'BUYER',
        OR: [
          ...(linkedIds.length ? [{ externalOrderId: { in: linkedIds } }] : []),
          { sourceKey: shopOrderSourceKey(order.id) },
        ],
      },
      select: { id: true },
    })
    if (existing) return error('该订单已开具收据，如需重开请联系客服', 409)
    // 任一关联行上已付过税费的发票 → 收据按含税额出具（背书行自己的已付发票仍优先，见 submitReceiptForExternalOrder）
    const paidInvoice = (await invoicesForOrder(order.id)).find((iv) => iv.payStatus === 'PAID')

    const ext = await ensureExternalOrderForShopOrder({
      id: order.id,
      productName: order.productName,
      amount: order.amount,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      user: order.user,
    })

    const result = await submitReceiptForExternalOrder(ext.id, parsed.data.payerTitle, {
      paidInvoiceAmount: paidInvoice?.invoiceAmount ?? null,
      showAiWording: parsed.data.showAiWording,
    })
    return success(result, '收据已生成')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    console.error('Order receipt error:', err)
    return error('生成收据失败')
  }
}
