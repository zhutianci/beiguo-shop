/**
 * 短信接码 · 售后退款（T16）之后把这张单的售后申请收成「已通过」（docs/短信接码-设计.md E17、§7.2、§7.5；S3 评审修复）。
 *
 * 【为什么在 T16 的同一个事务里做】原来是退款提交之后另开一个事务收尾，出错被吞掉；对已驳回（REJECTED）的申请，
 * 之后就再没有路径能把它收成 REFUNDED（通过对 REJECTED 回 409、抽屉里订单已是 REFUNDED 不能再退），结果钱退了、记录停在「已驳回」，
 * 买家号码页同时显示「已退款」和「售后申请未通过」，30 天通过次数也少算一次。现在由 refund.refundAfterSale 在退款的同一个事务末尾调用：
 * 钱、售后申请状态、给买家的「售后审核通过」留言三者同成同败。
 *
 * 【锁】调用方（T16）已经按「订单 → 接码单 → 用户」拿了排他锁；这里对 sms_complaints 用 `FOR UPDATE` 当前读（不是快照读：
 * 提交售后的事务先共享锁订单行，它要么在 T16 拿订单锁之前已提交、要么等 T16 提交后在锁内重判被拒，当前读都能看到正确的行），
 * 然后按主键 CAS。插留言对 orders 的外键共享锁本事务已经持有排他锁，不新增锁顺序。只 import 纯函数与事件流水，不引 complaint.ts（避免循环依赖）。
 */
import type { Prisma } from '@prisma/client'
import { logEvent } from './events'
import { approveMessageText, COMPLAINT_NOTE_MAX, COMPLAINT_PENDING_STATES } from './complaint-rules'
import { jnow } from './runtime'

/** 从哪些状态收成 REFUNDED：待处理（OPEN / APPROVING），以及已驳回（站长改了主意、钱已经退了，记录要和钱对得上） */
export const COMPLAINT_CLOSE_FROM: readonly string[] = Object.freeze([...COMPLAINT_PENDING_STATES, 'REJECTED'])

export interface CloseComplaintInput {
  orderId: number
  smsOrderId: number
  adminId: number
  /** 站长填的备注（随留言发给买家）；没有就不改 adminNote */
  note: string | null
  topupCents: number
  cashCents: number
  /** APPROVE = 售后申请「通过」；ORDER = 后台接码订单抽屉里直接「售后退款到余额」；REPAIR = 退款早已完成、补记 */
  via: 'APPROVE' | 'ORDER' | 'REPAIR'
  /** 是否连已驳回的也收（T16 与抽屉入口 = true；只收待处理的 = false） */
  includeRejected?: boolean
}

/** 在调用方的事务里收尾。返回是否本次收尾（CAS 赢了才写留言，重放不会写第二条） */
export async function closeComplaintInTx(tx: Prisma.TransactionClient, p: CloseComplaintInput): Promise<boolean> {
  const rows = await tx.$queryRaw<{ id: number; state: string }[]>`SELECT id, state FROM sms_complaints WHERE order_id = ${p.orderId} FOR UPDATE`
  const c = rows[0]
  const from = p.includeRejected === false ? [...COMPLAINT_PENDING_STATES] : [...COMPLAINT_CLOSE_FROM]
  if (!c || !from.includes(c.state)) return false
  const n = (p.note ?? '').trim() || null
  const w = await tx.smsComplaint.updateMany({
    where: { id: Number(c.id), state: { in: from } },
    data: { state: 'REFUNDED', handledBy: p.adminId, handledAt: jnow(), ...(n ? { adminNote: n.slice(0, COMPLAINT_NOTE_MAX) } : {}) },
  })
  if (w.count !== 1) return false
  await tx.orderMessage.create({
    data: {
      orderId: p.orderId,
      sender: 'ADMIN',
      content: approveMessageText(p.topupCents, p.cashCents, n),
      readByAdmin: true,
      readByBuyer: false,
      senderRole: 'PLATFORM',
      senderUserId: p.adminId,
    },
  })
  await logEvent(tx, { smsOrderId: p.smsOrderId, type: 'COMPLAINT_OK', actor: 'ADMIN', actorId: p.adminId, detail: { via: p.via, from: c.state, fromOrderDrawer: p.via === 'ORDER' } })
  return true
}
