export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error } from '@/lib/api'
import { createOrGetVmqOrder, vmqConfigured, VmqError } from '@/lib/vmq'
import { assertExternalOrderAccess, BillingError } from '@/lib/order-billing'
import { assertShopOrderBillable, shopOrderIdOfExt } from '@/lib/order-invoice'
import { readProofDigests } from '@/lib/email-proof'
import { orderIdFromSourceKey } from '@/lib/order-link'
import { getStorefront, PLATFORM_TENANT_ID } from '@/lib/storefront/resolve'

const schema = z.object({
  // 匿名「邮箱查订阅」流程的归属凭证，与 POST /api/invoices 同一套
  accountEmail: z.string().trim().email().optional().nullable(),
})

/**
 * 对待支付税费的发票，重新发起 V免签 收款。
 *
 * 【这里原来完全没有鉴权】发票 id 是自增整数，任何人从 1 开始遍历就能：
 * 探出每一张待付发票的税费（= 订单金额 / 0.06），并且每调一次就在
 * vmq_orders / vmq_locks 里占掉一个唯一金额 —— 而唯一金额正是这套收款方案
 * 区分「谁付的款」的全部依据（lib/vmq.ts 的 allocateAmount 只有 50 次让位空间）。
 * 现在与提交发票走同一套归属校验：登录本人 / 已绑定账户 / 匿名需提供正确的账户邮箱。
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // 店面解析不进 try（设计 4.4 第 7 条）
  const sf = await getStorefront()
  if (!sf) return error('发票不存在或无权操作', 404)
  try {
    if (!vmqConfigured()) return error('支付未配置', 500)
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    // body 里的 accountEmail 已不作数（凭证改为邮箱验证码证明，lib/email-proof.ts）；
    // 仍然解析一下只是为了兼容老前端带 body 的请求，解析失败也不能 500
    schema.safeParse(await request.json().catch(() => ({})))

    /*
     * 【鉴权必须排在一切状态判断之前】否则「不存在 / 存在但不待付 / 存在且待付」
     * 三种不同的响应本身就是一台枚举机：发票 id 是自增整数，从 1 数上去就能
     * 摸清有多少张票、哪些还没付税费。所以鉴权没过一律回同一句话，
     * 具体原因只说给证明了归属的人听。
     */
    const invoice = await prisma.invoice.findUnique({ where: { id } })
    const user = await getCurrentUser()

    // 归属校验失败与「根本没这张票」返回完全一样的东西，不给任何区分信号
    const deny = () => error('发票不存在或无权操作', 404)
    if (!invoice) return deny()
    // 后台手动录入的发票（无关联订单）不对外开放支付入口：
    // 那些单的钱是线下收的，本来就不该出现在买家侧
    if (invoice.externalOrderId == null) return deny()
    // 税费发票只能在它所属的站付（设计 8.1「税费支付」归属写进 where、4.5 收银台按站）；不符与不存在同一句话
    if (invoice.tenantId !== sf.id) return deny()

    const ext = await prisma.externalOrder.findUnique({
      where: { id: invoice.externalOrderId },
      select: { id: true, sourceKey: true, claudeAccount: true, shopOrderId: true, tenantId: true },
    })
    if (!ext) return deny()
    // 店面归属：与 POST /api/invoices 同一套（渠道站只认本人本店站内订单；主站拒绝渠道的行）
    const linkedOrderId = ext.shopOrderId ?? orderIdFromSourceKey(ext.sourceKey)
    if (sf.kind === 'CHANNEL') {
      if (!user || ext.tenantId !== sf.id || !linkedOrderId) return deny()
      const own = await prisma.order.findFirst({ where: { id: linkedOrderId, userId: user.id, tenantId: sf.id }, select: { id: true } })
      if (!own) return deny()
    } else {
      if (ext.tenantId !== PLATFORM_TENANT_ID) return deny()
      if (linkedOrderId) {
        const linked = await prisma.order.findUnique({ where: { id: linkedOrderId }, select: { tenantId: true } })
        if (linked && linked.tenantId !== PLATFORM_TENANT_ID) return deny()
      }
    }
    try {
      await assertExternalOrderAccess(ext, { user, proofDigests: await readProofDigests() })
    } catch {
      return deny()
    }

    // —— 以下分支只有证明了归属的人才看得到 ——
    if (invoice.payStatus === 'PAID' || invoice.status !== 'AWAIT_PAY') {
      return error('该发票无需支付')
    }
    if (invoice.taxFee == null) return error('发票金额异常')
    // 关联的站内订单已取消（线下退款）/ 已退款：不再收这张发票的税费（抛 409，下面 catch 转成响应）
    await assertShopOrderBillable(shopOrderIdOfExt(ext))

    const vmq = await createOrGetVmqOrder({
      bizType: 'invoice',
      bizId: invoice.id,
      outTradeNo: invoice.invoiceNo,
      price: Number(invoice.taxFee),
    })

    return success({ payUrl: `/pay/${vmq.orderId}`, taxFee: Number(invoice.taxFee), reallyPrice: vmq.reallyPrice })
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    if (err instanceof VmqError) return error(err.message)
    console.error('Invoice pay error:', err)
    return error('发起支付失败')
  }
}
