/**
 * 发给买家 / 被邀请人的系统邮件（设计 11.4；WP3）。链接一律按数据行的 tenantId 取 origin（tenantOrigin），
 * 异步路径拿不到可信 Host，也绝不从 Host 拼链接（Host 头投毒，设计 4.5）。
 *
 *  · notifyBuyerOfReply：订单留言有了客服回复（渠道成员回复经 partner-facade 调用；站长回复的路由也可以调）。
 *    同一订单 10 分钟内只发一封（进程内节流），免得来回几句就刷屏；邮件正文不带回复内容。
 *  · sendTenantInviteMail：渠道后台成员邀请（WP5 发起），链接 = 渠道 origin + /partner/invite/<token>。
 * notifyBuyerOfReply 不抛（留言已经成立，提醒发不出去只记日志）；sendTenantInviteMail 发不出去**抛错**，
 * 由调用方（WP5）提示管理员把邀请链接手动发给对方（邀请行本身已经建好）。
 */
import { prisma } from '../db'
import { sendOrderReplyEmail, sendTenantInviteEmail, systemEmailConfigured } from '../mail'
import { tenantMailOpts, tenantOrigin } from '../storefront/origin'

const REPLY_WINDOW_MS = 10 * 60_000
const lastReply = new Map<number, number>()

export async function notifyBuyerOfReply(orderId: number): Promise<void> {
  try {
    if (!Number.isSafeInteger(orderId) || orderId <= 0) return
    const now = Date.now()
    const last = lastReply.get(orderId)
    if (last !== undefined && now - last < REPLY_WINDOW_MS) return
    const o = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNo: true, productName: true, tenantId: true, user: { select: { email: true } } },
    })
    const to = o?.user?.email
    if (!o || !to || !systemEmailConfigured()) return
    // 渠道单：链接用渠道 origin、页脚带店面客服邮箱（二期改动 4.5）；主站 undefined → 邮件逐字不变
    const mailOpts = await tenantMailOpts(o.tenantId)
    if (lastReply.size > 5000) lastReply.clear()
    lastReply.set(orderId, now)
    await sendOrderReplyEmail(to, { orderNo: o.orderNo, productName: o.productName }, mailOpts)
  } catch (e) {
    console.error('[buyer-notify] 客服回复提醒发送失败', orderId, (e as Error)?.message || e)
  }
}

/** 邀请有效期（小时），与 WP5 建 TenantInvite 的 expiresAt 一致（设计 6.7：24 小时） */
export const TENANT_INVITE_HOURS = 24

export async function sendTenantInviteMail(a: { tenantId: number; email: string; token: string }): Promise<void> {
  if (!Number.isInteger(a.tenantId) || a.tenantId < 2) throw new Error(`[buyer-notify] tenantId 非法：${a.tenantId}`)
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(a.token)) throw new Error('[buyer-notify] 邀请令牌格式非法')
  if (!systemEmailConfigured()) throw new Error('系统邮件未配置，请把邀请链接手动发给对方')
  const origin = await tenantOrigin(a.tenantId)
  const link = `${origin}/partner/invite/${encodeURIComponent(a.token)}`
  // 还没有账号的被邀请人先到主站注册（筹备期渠道站不开放注册）；主站地址取平台 Tenant.origin（tenantOrigin(1)），不从 Host 拼
  const registerUrl = `${await tenantOrigin(1)}/register`
  const r = await sendTenantInviteEmail(a.email.trim().toLowerCase(), { link, expiresHours: TENANT_INVITE_HOURS, registerUrl }, { origin })
  if (!r.ok) throw new Error(`邀请邮件发送失败：${r.detail ?? ''}`.slice(0, 200))
}
