export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, notFound } from '@/lib/api'
import {
  submitReceiptForExternalOrder,
  assertExternalOrderAccess,
  BillingError,
} from '@/lib/order-billing'
import { settlePrepaidInvoiceByExternalOrder, shopOrderSourceKey } from '@/lib/order-invoice'
import { invoicesForOrder, orderIdFromSourceKey } from '@/lib/order-link'

const schema = z.object({
  externalOrderId: z.number().int().positive('缺少订单'),
  payerTitle: z.string().trim().min(1, '请填写付款人抬头').max(200),
  // 匿名「邮箱查订阅」流程的归属凭证：必须与该订单的账户邮箱一致。
  // 已登录且订单属于本人 / 本人邮箱 / 已绑定账户时可不传。
  accountEmail: z.string().trim().email().optional().nullable(),
  // 必选、无默认：与发票同一口径。不展示 → 收据「项目」一栏只印「技术咨询服务」
  showAiWording: z.boolean({ required_error: '请选择收据中是否展示 ChatGPT/Claude 相关字眼' }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const order = await prisma.externalOrder.findUnique({
      where: { id: d.externalOrderId },
      select: { id: true, sourceKey: true, claudeAccount: true, shopOrderId: true },
    })
    if (!order) return notFound('订单不存在')

    const user = await getCurrentUser()
    await assertExternalOrderAccess(order, {
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      claimedEmail: d.accountEmail ?? null,
    })

    /*
     * 【收据金额的口径要先对齐】三个兄弟路径都做了这一步，唯独这条漏了就不成体系。
     *
     * 结账时预收过 6% 的订单，买家实付的是含税额。submitReceiptForExternalOrder
     * 的判据是「这条外部订单上有没有一张 payStatus=PAID 的发票」—— 万一履约时那张
     * 发票没落地，它会退回按不含税的 quote 出具，买家拿到一张比实付少 6% 的收据。
     * 而收据一笔订单只能开一张、开错了改不回来，正是报销最怕的情况。
     */
    await settlePrepaidInvoiceByExternalOrder(order)

    /*
     * 【跨行查重 + 含税口径】与 /api/orders/[id]/receipt 同一套：这一行背后若是站内订单，
     *  · 它的任一条外部订单行上已经开过买家收据 → 不再开第二张（同一笔付款只有一张收据）
     *  · 它的任一条行上有已付税费的发票 → 收据按含税额出具（本行自己的已付发票仍优先）
     */
    let paidInvoiceAmount: number | null = null
    const shopOrderId = order.shopOrderId ?? orderIdFromSourceKey(order.sourceKey)
    if (shopOrderId) {
      const linkedExts = await prisma.externalOrder.findMany({
        where: { OR: [{ shopOrderId }, { sourceKey: shopOrderSourceKey(shopOrderId) }] },
        select: { id: true },
      })
      const existing = await prisma.receipt.findFirst({
        where: {
          source: 'BUYER',
          // 同 /api/orders/[id]/receipt：外部订单行被删后，收据上的 sourceKey 快照是唯一线索
          OR: [
            { externalOrderId: { in: linkedExts.map((e) => e.id).concat(order.id) } },
            { sourceKey: shopOrderSourceKey(shopOrderId) },
          ],
        },
        select: { id: true },
      })
      if (existing) return error('该订单已开具收据，如需重开请联系客服', 409)
      paidInvoiceAmount = (await invoicesForOrder(shopOrderId)).find((iv) => iv.payStatus === 'PAID')?.invoiceAmount ?? null
    }

    const result = await submitReceiptForExternalOrder(d.externalOrderId, d.payerTitle, {
      showAiWording: d.showAiWording,
      paidInvoiceAmount,
    })
    return success(result, '收据已生成')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    console.error('Create receipt error:', err)
    return error('生成收据失败')
  }
}
