/**
 * 渠道后台：订单留言（WP6，设计 5.6、6.5.3、11.4 售后闭环）。
 *
 * 【谁回复的】渠道回复写 OrderMessage(sender='ADMIN', senderRole='PARTNER', senderUserId=成员)：
 *  · sender 仍写 'ADMIN'——买家端未读统计认它（src/app/api/orders/route.ts），买家看到的一律是「客服」；
 *  · senderRole / senderUserId 只给平台后台（显示「渠道回复」）与渠道自己（mine）用，永不进买家响应（WP2）。
 * 【已读】渠道只动 readByTenant：回复时把该单买家留言置已读、自己的回复 readByTenant=true。
 *  **不动买家留言的 readByAdmin**——站长那边的红点不能因为渠道回了就消失（W6-9）。
 *  渠道自己这条回复 readByAdmin=true：平台未读统计只数 sender='BUYER'（admin/orders），与站长回复写法一致。
 * 【买家提醒】提交后经 partner-facade 的 notifyBuyerOfReply（WP3）发「客服回复」邮件，与站长回复同一封；
 *  渠道层不直接调 notifyBuyerMessage / quickReplyUrl（设计 6.5.3 禁用清单）。
 */
import { prisma } from '../db'
import { writeAudit } from '../audit'
import { notifyBuyerOfReply } from '../tenant/partner-facade'
import type { PartnerMessageRow } from '../tenant/types'
import { findTenantOrder } from './_scope'
import { PARTNER_INTERNAL_MESSAGE_KEY_SELECT, PARTNER_INTERNAL_ORDER_KEY_SELECT, PARTNER_MESSAGE_SELECT, PARTNER_ORDER_LIST_SELECT } from './selects'

const MESSAGE_WITH_KEY = { ...PARTNER_MESSAGE_SELECT, ...PARTNER_INTERNAL_MESSAGE_KEY_SELECT } as const
/**
 * 回复要把库里的规范 orderNo 写进审计：URL 里的单号可能大小写不同（MySQL 默认排序规则不区分大小写也能命中），
 * 审计记原文会让按单号查操作日志漏行。
 */
const ORDER_KEY_WITH_NO = { ...PARTNER_INTERNAL_ORDER_KEY_SELECT, orderNo: PARTNER_ORDER_LIST_SELECT.orderNo } as const
/** 一单的留言远少于此；超出只给最近的 500 条 */
const MAX_MESSAGES = 500
export const MESSAGE_MAX_LEN = 2000

function senderOf(m: { sender: string; senderRole: string | null }): PartnerMessageRow['sender'] {
  if (m.sender === 'BUYER') return 'BUYER'
  return m.senderRole === 'PARTNER' ? 'PARTNER' : 'PLATFORM'
}

/** 不存在 / 不是本渠道的单 → null（handler 统一 404） */
export async function partnerListMessages(tenantId: number, orderNo: string, userId: number): Promise<PartnerMessageRow[] | null> {
  const o = await findTenantOrder(tenantId, orderNo, PARTNER_INTERNAL_ORDER_KEY_SELECT)
  if (!o) return null
  const rows = await prisma.orderMessage.findMany({
    where: { orderId: o.id },
    select: MESSAGE_WITH_KEY,
    orderBy: { createdAt: 'desc' },
    take: MAX_MESSAGES,
  })
  return rows.reverse().map((m) => ({
    sender: senderOf(m),
    messageText: m.content,
    createdAt: m.createdAt.toISOString(),
    mine: m.sender !== 'BUYER' && m.senderRole === 'PARTNER' && m.senderUserId === userId,
  }))
}

/**
 * 渠道回复。返回 false = 订单不存在或不是本渠道的（handler 404）。
 * 事务内：订单归属复查 → 建留言 → 买家留言置 readByTenant → 审计；提交后异步提醒买家（失败只记日志，不影响回复本身）。
 */
export async function partnerPostMessage(tenantId: number, orderNo: string, userId: number, messageText: string, req?: Request): Promise<boolean> {
  const text = String(messageText ?? '').trim()
  if (!text || text.length > MESSAGE_MAX_LEN) throw new Error('[partner] messageText 长度非法（handler 应已校验）')
  const o = await findTenantOrder(tenantId, orderNo, ORDER_KEY_WITH_NO)
  if (!o) return false

  await prisma.$transaction(async (tx) => {
    // 事务内按 (id, tenantId) 再确认一次归属：只是防御，正常情况下订单的 tenantId 永不改变
    const owned = await tx.order.count({ where: { id: o.id, tenantId } })
    if (owned !== 1) throw new Error('[partner] 订单归属复查失败')
    await tx.orderMessage.create({
      data: {
        orderId: o.id,
        sender: 'ADMIN',
        senderRole: 'PARTNER',
        senderUserId: userId,
        content: text,
        readByTenant: true,
        readByBuyer: false,
        readByAdmin: true,
      },
    })
    await tx.orderMessage.updateMany({ where: { orderId: o.id, sender: 'BUYER', readByTenant: false }, data: { readByTenant: true } })
    await writeAudit(tx, {
      actorKind: 'TENANT',
      actorUserId: userId,
      tenantId,
      action: 'order.message',
      targetType: 'order',
      targetId: o.orderNo,
      // 渠道自己的操作：publicDiff = diff。只记长度，留言原文已在留言表里，不在审计里再存一份
      diff: { length: text.length },
      req,
    })
  })

  notifyBuyerOfReply(o.id).catch((e) => console.error('[partner] 买家回复提醒失败', (e as Error)?.message || e))
  return true
}

/** 渠道已读：只动 readByTenant。返回 false = 订单不存在或不是本渠道的 */
export async function partnerMarkRead(tenantId: number, orderNo: string): Promise<boolean> {
  const o = await findTenantOrder(tenantId, orderNo, PARTNER_INTERNAL_ORDER_KEY_SELECT)
  if (!o) return false
  await prisma.orderMessage.updateMany({ where: { orderId: o.id, sender: 'BUYER', readByTenant: false }, data: { readByTenant: true } })
  return true
}
