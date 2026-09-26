export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, notFound } from '@/lib/api'
import { vmqConfigured, VmqError } from '@/lib/vmq'
import {
  submitInvoiceForExternalOrder,
  assertExternalOrderAccess,
  BillingError,
} from '@/lib/order-billing'
import { settlePrepaidInvoiceByExternalOrder } from '@/lib/order-invoice'
import { crossRowInvoiceBlock, orderIdFromSourceKey } from '@/lib/order-link'
import { readProofDigests } from '@/lib/email-proof'
import {
  buyerInvoiceSubmitSchema,
  normalizeInvoiceFields,
  afterInvoiceSubmitted,
} from '@/lib/invoice-input'
import { getStorefront, PLATFORM_TENANT_ID } from '@/lib/storefront/resolve'

// 抬头字段共用 lib/invoice-input 的定义，本路由只多两样：订单号与匿名归属凭证
const schema = buyerInvoiceSubmitSchema.extend({
  externalOrderId: z.number().int().positive('缺少订单'),
  // 已废弃：以前是匿名流程的归属凭证（「说出邮箱就算本人」），现在忽略，只为老前端照传不报 400
  accountEmail: z.string().trim().email().optional().nullable(),
})

export async function POST(request: NextRequest) {
  // 店面解析不进 try（设计 4.4 第 7 条）
  const sf = await getStorefront()
  if (!sf) return notFound('订单不存在')
  try {
    if (!vmqConfigured()) return error('支付未配置，暂无法提交发票', 500)

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const order = await prisma.externalOrder.findUnique({
      where: { id: d.externalOrderId },
      select: { id: true, sourceKey: true, claudeAccount: true, shopOrderId: true, tenantId: true },
    })
    if (!order) return notFound('订单不存在')

    const user = await getCurrentUser()

    /*
     * 【店面归属，在路由内判】（设计 8.1、9.3、W2-5a）ExternalOrder.id 是自增整数，而 assertExternalOrderAccess 除了
     * 「本人站内订单」还接受三条只比对邮箱的分支——渠道手里有大量买家邮箱，所以：
     *  · 渠道站：必须登录；这一行必须属于本店（ExternalOrder.tenantId）且背后是**本人、本店**的站内订单；
     *    邮箱类分支一律不认。成员自买单不可开票（设计 7.7）。
     *  · 主站：拒绝属于渠道的行（行上的 tenantId，或背后站内订单的 tenantId ≠ 1），其余与改造前相同。
     * 不满足一律按「不存在」404，响应体与找不到这一行时相同，零写入。与 /api/receipts、/api/invoices/[id]/pay 同一套判断。
     */
    const linkedOrderId = order.shopOrderId ?? orderIdFromSourceKey(order.sourceKey)
    if (sf.kind === 'CHANNEL') {
      if (!user || order.tenantId !== sf.id || !linkedOrderId) return notFound('订单不存在')
      const own = await prisma.order.findFirst({
        where: { id: linkedOrderId, userId: user.id, tenantId: sf.id },
        select: { settleExcludeReason: true },
      })
      if (!own) return notFound('订单不存在')
      if (own.settleExcludeReason != null) return error('该订单不支持开具发票')
    } else {
      if (order.tenantId !== PLATFORM_TENANT_ID) return notFound('订单不存在')
      if (linkedOrderId) {
        const linked = await prisma.order.findUnique({ where: { id: linkedOrderId }, select: { tenantId: true } })
        if (linked && linked.tenantId !== PLATFORM_TENANT_ID) return notFound('订单不存在')
      }
    }
    // 归属凭证 = 邮箱验证码换来的证明 cookie / 已验证的登录邮箱或绑定（lib/email-proof.ts）。
    // body 里的 accountEmail 不再作数（知道邮箱不等于是本人），老前端照传也不报错
    await assertExternalOrderAccess(order, { user, proofDigests: await readProofDigests() })

    const fields = normalizeInvoiceFields(d)

    /*
     * 【防重复收税】这条外部订单背后的站内订单若在结账时已经预收过 6%，
     * 这条路就不能再收第二遍。与 /api/orders/[id]/invoice 同一道闸。
     * 走 shopOrderId 而不是解析 sourceKey —— 管理员交付时导入的那条外部订单
     * sourceKey 是 hashKey(账户,开通日,类型)，里面没有订单号。
     * 把本次填的抬头一并传进去：票还没开出去时就地覆盖，买家填的不会白填。
     */
    const prepaid = await settlePrepaidInvoiceByExternalOrder(order, fields)
    if (prepaid) {
      await afterInvoiceSubmitted(user?.id ?? null, d, fields)
      return success(
        { alreadyPaid: true },
        '该订单下单时已选择开发票、税费也已随货款付清，无需再次支付；抬头已按本次填写更新'
      )
    }
    /*
     * 【跨行查重】这一行背后的站内订单，若在另一条外部订单行上已经开过 / 付过发票
     * （最常见：买家先在「我的订单」申请并付了 6%，这里是管理员交付时导入的 WEB 行），
     * 不能在这一行再收一次税。与 /api/orders/[id]/invoice 的跨行检查同一口径。
     */
    const shopOrderId = linkedOrderId
    if (shopOrderId) {
      const blocked = await crossRowInvoiceBlock(shopOrderId, order.id)
      if (blocked) return error(blocked, 409)
    }
    const result = await submitInvoiceForExternalOrder(d.externalOrderId, fields, {
      userId: user?.id ?? null,
    })
    // 匿名流程没有身份，存不了抬头档案；登录用户走这条路时照常能存
    await afterInvoiceSubmitted(user?.id ?? null, d, fields)
    return success(result, '已提交，请支付税费')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    if (err instanceof VmqError) return error(err.message)
    console.error('Create invoice error:', err)
    return error('提交发票失败')
  }
}
