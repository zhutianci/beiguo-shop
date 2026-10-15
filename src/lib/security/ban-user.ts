/**
 * 封禁买家 + 清理他占着的东西（2026-10-15 攻防加固，docs/安全-攻防加固设计-1015.md 1.4 / 3.2 / 3.3）。
 *
 * 10-15 那次是手工 SQL 做的：禁用账号、session_epoch+1、取消未付单、收款单置过期、删金额锁。
 * 收进这里之后有两个调用方：
 *  · 蜜罐自动封号（lib/security/probe.ts，actor = SYSTEM）；
 *  · 后台「禁用用户」（api/admin/users/[id]，actor = PLATFORM）——以前只禁号，他名下的待付收款单还会把唯一金额占满 20 分钟。
 *
 * 【只动「没付钱」的东西】已付款、已发货、余额、卡密一概不碰；未付单的取消与关单复用 lib/vmq.ts 的 closeVmqSlip
 * （与超时关单同一条路径：CAS 翻状态、删金额锁、释放券与接码预扣），不另写一套。
 */
import { prisma } from '../db'
import { closeVmqSlip } from '../vmq'
import { cancelIfNoPayment } from '../order/abandon'
import { writeAudit } from '../audit'

export interface CancelSummary {
  closedSlips: number
  cancelledOrders: number
  /** 带余额预扣、没能在这里取消的单（留给接码 tick 按原流程收尾） */
  skipped: number
}

/**
 * 取消某个买家全部「未付款、未发货」的订单，并关掉它们仍在等待付款的收款单（释放唯一金额）。
 * 幂等：重复调用不会多做任何事。单条失败只记日志，不影响其余条。
 */
export async function cancelOpenOrdersOf(userId: number, releaseReason = 'BANNED'): Promise<CancelSummary> {
  const open = await prisma.order.findMany({
    where: { userId, payStatus: 'UNPAID', deliveryStatus: { in: ['PENDING', 'PROCESSING'] } },
    select: { id: true },
    take: 500,
  })
  const summary: CancelSummary = { closedSlips: 0, cancelledOrders: 0, skipped: 0 }
  if (!open.length) return summary
  const ids = open.map((o) => o.id)

  // 1) 有待支付收款单的：走与超时关单完全相同的路径（会顺带取消订单、放券、放预扣）
  const slips = await prisma.vmqOrder.findMany({
    where: { bizType: 'order', bizId: { in: ids }, state: 0 },
    select: { id: true, orderId: true, bizType: true, bizId: true },
  })
  for (const s of slips) {
    try {
      if (await closeVmqSlip(s, releaseReason)) summary.closedSlips++
    } catch (e) {
      console.error('[ban] 关闭收款单失败（超时关单会兜底）', s.orderId, (e as Error)?.message)
    }
  }

  // 2) 从没发起过付款（或收款单已结束）的：确认没有 0/1 收款单、没有余额预扣后再 CAS 取消（与过期未付单清理同一个函数）
  for (const id of ids) {
    try {
      const r = await cancelIfNoPayment(id)
      if (r === 'CANCELLED') summary.cancelledOrders++
      else if (r === 'HELD') summary.skipped++
    } catch (e) {
      console.error('[ban] 取消订单失败', id, (e as Error)?.message)
    }
  }
  // 第 1 步里关单成功的那些订单也已被取消
  summary.cancelledOrders += summary.closedSlips
  return summary
}

export type BanOutcome =
  | { ok: true; alreadyDisabled: boolean; email: string | null; summary: CancelSummary }
  | { ok: false; why: 'NOT_FOUND' | 'ADMIN' | 'MEMBER' }

/**
 * 封禁一个买家：禁用 + 会话版本 +1（手里的 token 立即失效）+ 取消未付单、释放金额锁 + 写审计。
 *  · 永远不封 ADMIN；
 *  · 自动封号（SYSTEM）不封有效的渠道成员（渠道站长 / 店员）——那是合作方，交给站长人工判断，调用方改为只告警。
 */
export async function banUser(
  userId: number,
  opts: { reason: string; actor: 'SYSTEM' | 'PLATFORM'; actorUserId?: number | null; req?: Request },
): Promise<BanOutcome> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, status: true, email: true } })
  if (!u) return { ok: false, why: 'NOT_FOUND' }
  if (u.role === 'ADMIN') return { ok: false, why: 'ADMIN' }
  if (opts.actor === 'SYSTEM') {
    const member = await prisma.tenantMember.findFirst({ where: { userId, status: 1 }, select: { id: true } })
    if (member) return { ok: false, why: 'MEMBER' }
  }
  const flip = await prisma.user.updateMany({
    where: { id: userId, status: 1, role: 'USER' },
    data: { status: 0, sessionEpoch: { increment: 1 } },
  })
  const summary = await cancelOpenOrdersOf(userId)
  await writeAudit(null, {
    actorKind: opts.actor,
    actorUserId: opts.actorUserId ?? null,
    action: 'sec.ban',
    targetType: 'user',
    targetId: String(userId),
    reason: opts.reason,
    diff: { disabled: flip.count === 1, ...summary },
    req: opts.req,
  }).catch((e) => console.error('[ban] 审计写入失败', (e as Error)?.message))
  return { ok: true, alreadyDisabled: flip.count === 0, email: u.email, summary }
}
