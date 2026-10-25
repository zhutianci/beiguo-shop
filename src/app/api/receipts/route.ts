export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { invoiceItemField } from '@/lib/invoice-input'
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
import { readProofDigests } from '@/lib/email-proof'
import { getStorefront, PLATFORM_TENANT_ID } from '@/lib/storefront/resolve'
import { crossSiteWrite } from '@/lib/security/write-guard'
import { recordProbe } from '@/lib/security/probe'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'
import { ipKey } from '@/lib/ip-key'

const schema = z.object({
  externalOrderId: z.number().int().positive('缺少订单'),
  payerTitle: z.string().trim().min(1, '请填写付款人抬头').max(200),
  // 已废弃：以前是匿名流程的归属凭证（「说出邮箱就算本人」），现在忽略，只为老前端照传不报 400
  accountEmail: z.string().trim().email().optional().nullable(),
  // 必选、无默认：与发票同一口径。不展示 → 收据「项目」一栏只印「技术咨询服务」
  showAiWording: z.boolean({ required_error: '请选择收据中是否展示 ChatGPT/Claude 相关字眼' }),
  // 收据项目（可选，缺省 = 技术咨询服务；与发票同一份清单）
  invoiceItem: invoiceItemField,
})

export async function POST(request: NextRequest) {
  // 写请求同源校验：路由内自查、不只靠 middleware（lib/security/write-guard.ts，2026-10-24）
  const csrf = crossSiteWrite(request)
  if (csrf) return csrf
  // 店面解析不进 try（设计 4.4 第 7 条）
  const sf = await getStorefront()
  if (!sf) return notFound('订单不存在')
  // 按 IP 限频（2026-10-25：线上有人一天打了 50 多次在试别人的订单号）。正常买家一张单开一次收据
  if (rateLimited(`receipt-ip:${ipKey(clientIp(request.headers))}`, { windowMs: 10 * 60_000, max: 20 })) {
    return error('操作过于频繁，请稍后再试', 429)
  }
  let extId: number | null = null
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data
    extId = d.externalOrderId

    const order = await prisma.externalOrder.findUnique({
      where: { id: d.externalOrderId },
      select: { id: true, sourceKey: true, claudeAccount: true, shopOrderId: true, tenantId: true },
    })
    if (!order) return notFound('订单不存在')

    const user = await getCurrentUser()

    /*
     * 【店面归属，在路由内判】与 /api/invoices 同一套（设计 8.1、W2-5a）：
     *  · 渠道站：必须登录；这一行属于本店，且背后是本人、本店的站内订单；邮箱类分支一律不认；
     *  · 主站：拒绝属于渠道的行（行上或背后站内订单的 tenantId ≠ 1），其余与改造前相同。
     * 不满足一律 404，零写入。
     */
    const linkedOrderId = order.shopOrderId ?? orderIdFromSourceKey(order.sourceKey)
    if (sf.kind === 'CHANNEL') {
      if (!user || order.tenantId !== sf.id || !linkedOrderId) return notFound('订单不存在')
      const own = await prisma.order.findFirst({ where: { id: linkedOrderId, userId: user.id, tenantId: sf.id }, select: { id: true } })
      if (!own) return notFound('订单不存在')
    } else {
      if (order.tenantId !== PLATFORM_TENANT_ID) return notFound('订单不存在')
      if (linkedOrderId) {
        const linked = await prisma.order.findUnique({ where: { id: linkedOrderId }, select: { tenantId: true } })
        if (linked && linked.tenantId !== PLATFORM_TENANT_ID) return notFound('订单不存在')
      }
    }
    // 归属凭证见 lib/email-proof.ts；body 里的 accountEmail 已不作数
    await assertExternalOrderAccess(order, { user, proofDigests: await readProofDigests() })

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
    const shopOrderId = linkedOrderId
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
      invoiceItem: d.invoiceItem,
      paidInvoiceAmount,
    })
    return success(result, '收据已生成')
  } catch (err) {
    if (err instanceof BillingError) {
      // 别人的订单（403）/ 别站的订单（404）：登录了的按越权计数（lib/security/probe.ts IDOR，10 分钟 5 张 → 封号封 IP）
      if (err.status === 403 || err.status === 404) {
        const who = await getCurrentUser().catch(() => null)
        if (who) await recordProbe(request, 'IDOR', { path: `ext:${extId ?? '?'}` })
      }
      return error(err.message, err.status)
    }
    console.error('Create receipt error:', err)
    return error('生成收据失败')
  }
}
