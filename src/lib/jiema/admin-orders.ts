/**
 * 短信接码 · 后台「接码订单」与「概览」的数据与操作（docs/短信接码-设计.md §7.1、§7.2、§9.5、§6.6 第 28 条）。
 *
 * 【只给管理员】调用方是 /api/admin/jiema/**（每个 handler 第一行 adminGuard，写操作写审计）；这里能看到成本、cap、两个系数、
 * activationId、上游原文——这些**绝不**进任何买家响应（买家只走 dto.toJiemaOrderView）。
 * 【资金动作只经过引擎】售后退款、取消并退回余额、关单并退回预扣、关单并把到账退入余额都调 engine 的现成函数（它们内部只经过
 * wallet.hold / ledger 的 postInTx 与 bizKey 幂等、状态 CAS），这里不直接改余额、不直接改预扣。
 * 【口径】营收 / 真实成本 / 毛利一律按 report.ts（Σ costCents，不出现「扣费 × 当前汇率」），已取消单显示「不计」。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { shanghaiDayStart } from '../wallet/admin-query'
import { carrierFlags, type LatepayEntry } from '../wallet/latepay'
import { centsOf } from '../wallet/buckets'
import { e26Rejects, rt, jnow } from './runtime'
import { ensureFreshBalance } from './upbalance'
import { loadInflightSnapshot } from './sellable'
import { inflightMicro } from './gate'
import { runtimeParams } from './config'
import { activeThreadsHold } from './holds'
import { summarizeFinance, listFooter, payCellText, type FinanceRow, type FinanceSummary } from './report'
import { settleCost, ATTEMPT_TERMINAL, unmanualBlock, INFLIGHT_TEXT } from './machine'
import { recomputeCostInTx } from './refund'
import { adminClaimActivation, adminClaimCandidates } from './claim'
import { logEventQuiet } from './events'
import * as engine from './engine'
import { alertFinalizeFailed, finalizeComplaintAfterRefund, pendingComplaintCount } from './complaint'
import { complaintReasonText } from './complaint-rules'

const S = 1000
export const ADMIN_STATES = ['PENDING_PAY', 'CLOSED', 'READY', 'ACQUIRING', 'WAITING', 'REPLACING', 'CANCELLING', 'RECEIVED', 'FINISHED', 'REFUNDING', 'CANCELLED', 'REFUNDED', 'MANUAL'] as const
const ACTIVE_STATES = ['READY', 'ACQUIRING', 'WAITING', 'REPLACING', 'CANCELLING', 'REFUNDING', 'RECEIVED']
const hasCode = (a: { smsCount: number; codeAt: Date | null; state: string }) => a.smsCount > 0 || a.codeAt != null || a.state === 'RECEIVED' || a.state === 'FINISHED'

export class AdminJiemaError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message)
  }
}

// ───────────────────────── 列表（§7.2） ─────────────────────────

export interface AdminListQuery {
  state?: string | null
  payMode?: string | null
  service?: string | null
  country?: number | null
  from?: Date | null
  to?: Date | null
  user?: string | null
  q?: string | null
  page: number
  pageSize: number
}

export async function listJiemaOrdersAdmin(q: AdminListQuery) {
  const where: Prisma.SmsOrderWhereInput = {}
  if (q.state && q.state !== 'ALL') {
    if (q.state === 'ACTIVE') where.state = { in: ACTIVE_STATES }
    else if ((ADMIN_STATES as readonly string[]).includes(q.state)) where.state = q.state
  }
  if (q.payMode && ['ALIPAY', 'BALANCE', 'MIXED'].includes(q.payMode)) where.payMode = q.payMode
  if (q.service && /^[a-z0-9]{2,4}$/.test(q.service)) where.service = q.service
  if (q.country != null && Number.isInteger(q.country)) where.country = q.country
  if (q.from || q.to) where.createdAt = { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lt: q.to } : {}) }
  const and: Prisma.SmsOrderWhereInput[] = []
  const u = (q.user ?? '').trim()
  if (u) {
    if (/^\d{1,10}$/.test(u)) and.push({ userId: Number(u) })
    else {
      const us = await prisma.user.findMany({ where: { email: { contains: u } }, select: { id: true }, take: 100 })
      and.push({ userId: { in: us.map((x) => x.id) } })
    }
  }
  const kw = (q.q ?? '').trim()
  if (kw) {
    const or: Prisma.SmsOrderWhereInput[] = []
    if (/^[0-9A-Za-z]{8,32}$/.test(kw)) {
      const o = await prisma.order.findUnique({ where: { orderNo: kw }, select: { id: true } })
      if (o) or.push({ orderId: o.id })
    }
    const digits = kw.replace(/\D/g, '')
    if (digits.length >= 4) {
      const atts = await prisma.smsAttempt.findMany({ where: { phone: { contains: digits } }, select: { smsOrderId: true }, take: 200 })
      if (atts.length) or.push({ id: { in: Array.from(new Set(atts.map((a) => a.smsOrderId))) } })
    }
    and.push(or.length ? { OR: or } : { id: -1 })
  }
  if (and.length) where.AND = and

  const [total, rows, footRows] = await Promise.all([
    prisma.smsOrder.count({ where }),
    prisma.smsOrder.findMany({ where, orderBy: { id: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.smsOrder.findMany({ where, select: { state: true, priceCents: true, costCents: true, profitCents: true, lossCents: true, costFinal: true }, take: 20_000, orderBy: { id: 'desc' } }),
  ])
  const orderIds = rows.map((r) => r.orderId)
  const [orders, users, holds, attCounts] = await Promise.all([
    orderIds.length ? prisma.order.findMany({ where: { id: { in: orderIds } }, select: { id: true, orderNo: true, payStatus: true, deliveryStatus: true } }) : Promise.resolve([]),
    rows.length ? prisma.user.findMany({ where: { id: { in: Array.from(new Set(rows.map((r) => r.userId))) } }, select: { id: true, email: true, nickname: true } }) : Promise.resolve([]),
    orderIds.length ? prisma.balanceHold.findMany({ where: { orderId: { in: orderIds } }, select: { orderId: true, topupCents: true, cashCents: true, state: true } }) : Promise.resolve([]),
    rows.length ? prisma.smsAttempt.groupBy({ by: ['smsOrderId'], where: { smsOrderId: { in: rows.map((r) => r.id) } }, _count: { _all: true } }) : Promise.resolve([]),
  ])
  const om = new Map(orders.map((o) => [o.id, o]))
  const um = new Map(users.map((x) => [x.id, x]))
  const hm = new Map(holds.map((h) => [h.orderId, h]))
  const am = new Map(attCounts.map((a) => [a.smsOrderId, a._count._all]))
  const list = rows.map((r) => {
    const o = om.get(r.orderId)
    const h = hm.get(r.orderId)
    const user = um.get(r.userId)
    return {
      id: r.id,
      orderId: r.orderId,
      orderNo: o?.orderNo ?? null,
      payStatus: o?.payStatus ?? null,
      deliveryStatus: o?.deliveryStatus ?? null,
      user: { id: r.userId, email: user?.email ?? null, nickname: user?.nickname ?? null },
      service: r.service,
      serviceName: r.serviceName,
      country: r.country,
      countryName: r.countryName,
      operator: r.operator,
      priceCents: r.priceCents,
      payMode: r.payMode,
      payText: payCellText({ payMode: r.payMode, topupCents: h?.topupCents ?? 0, cashCents: h?.cashCents ?? 0, alipayCents: r.alipayCents, alipayPaidCents: r.alipayPaidCents }),
      holdState: h?.state ?? null,
      attempts: am.get(r.id) ?? 0,
      state: r.state,
      notice: r.notice,
      chargedMicro: r.chargedMicro,
      costCents: r.costCents,
      profitCents: r.profitCents,
      costFinal: r.costFinal,
      lossCents: r.lossCents,
      createdAt: r.createdAt.toISOString(),
    }
  })
  return { list, total, page: q.page, pageSize: q.pageSize, totalPages: Math.max(1, Math.ceil(total / q.pageSize)), footer: { ...listFooter(footRows), truncated: total > footRows.length } }
}

// ───────────────────────── 详情抽屉（§7.2） ─────────────────────────

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null)

export async function jiemaOrderDetailAdmin(id: number) {
  const so = await prisma.smsOrder.findUnique({ where: { id } })
  if (!so) return null
  const [order, user, hold, payments, vmqs, logs, atts, msgs, events, complaint] = await Promise.all([
    prisma.order.findUnique({ where: { id: so.orderId }, select: { id: true, orderNo: true, userId: true, payStatus: true, deliveryStatus: true, amount: true, paidAt: true, createdAt: true, productName: true } }),
    prisma.user.findUnique({ where: { id: so.userId }, select: { id: true, email: true, nickname: true, topupCents: true, balance: true } }),
    prisma.balanceHold.findUnique({ where: { orderId: so.orderId } }),
    prisma.payment.findMany({ where: { orderId: so.orderId }, orderBy: { id: 'asc' }, select: { id: true, payMethod: true, amount: true, status: true, tradeNo: true, createdAt: true } }),
    prisma.vmqOrder.findMany({ where: { bizType: 'order', bizId: so.orderId }, orderBy: { id: 'asc' }, select: { id: true, orderId: true, price: true, reallyPrice: true, state: true, createdAt: true, payDate: true } }),
    prisma.balanceLog.findMany({ where: { orderId: so.orderId, userId: so.userId }, orderBy: { id: 'asc' }, select: { id: true, type: true, delta: true, topupDeltaCents: true, bizKey: true, note: true, createdAt: true } }),
    prisma.smsAttempt.findMany({ where: { smsOrderId: so.id }, orderBy: { seq: 'asc' } }),
    prisma.smsMessage.findMany({ where: { smsOrderId: so.id }, orderBy: { receivedAt: 'desc' }, take: 100 }),
    prisma.smsEvent.findMany({ where: { smsOrderId: so.id }, orderBy: { id: 'desc' }, take: 300 }),
    // 售后申请（S3，§7.2 详情抽屉「售后申请」）
    prisma.smsComplaint.findUnique({ where: { orderId: so.orderId } }),
  ])
  const cost = settleCost({ state: so.state, priceCents: so.priceCents, costFx4: so.costFx4 }, atts)
  const withCode = atts.some(hasCode)
  const paidVmq = vmqs.some((v) => v.state === 1)
  const openVmq = vmqs.some((v) => v.state === 0)
  const unpaid = order?.payStatus === 'UNPAID'
  const orderCancelled = order?.deliveryStatus === 'CANCELLED'
  // 还有结果未知的取号：解除 MANUAL / 取消并退回余额都不给（扫描器会把单再转回人工；先「认领上游激活」或等判定没买到）
  const inflight = atts.some((a) => a.state === 'REQUESTING' || a.state === 'UNKNOWN')
  const actions = {
    // 售后退款到余额：RECEIVED、FINISHED、MANUAL（收过码的）；先放掉仍 ACTIVE 的号，再 T16（成本照计）
    refund: (so.state === 'RECEIVED' || so.state === 'FINISHED' || (so.state === 'MANUAL' && withCode)) && order?.payStatus === 'PAID' && so.refundState === 'NONE',
    // 取消并退回余额：MANUAL、订单已付款、没有任何号收到过短信、没有结果未知的取号（T15，不计成本；有扣费的号记亏损）
    cancelRefund: so.state === 'MANUAL' && order?.payStatus === 'PAID' && !withCode && !inflight,
    // 关单并原路退回预扣：MANUAL（或卡在 PENDING_PAY）且订单 UNPAID、没有 state 0 / 1 收款单（与 T4 同一个事务）
    closeRelease: (so.state === 'MANUAL' || so.state === 'PENDING_PAY') && unpaid && !orderCancelled && !paidVmq && !openVmq,
    // 关单并把到账退入余额（E44）：MANUAL、订单 UNPAID 且未取消、有 state=1 的收款单、预扣不是 HELD
    closeLatepay: so.state === 'MANUAL' && unpaid && !orderCancelled && paidVmq && hold?.state !== 'HELD',
    // 加赠换号：WAITING
    bonusReplace: so.state === 'WAITING',
    // 解除 MANUAL（回到 PENDING_PAY / ACQUIRING / WAITING / REFUNDING，按前提逐个核对；有结果未知的取号时不给）
    unmanual: so.state === 'MANUAL' && !inflight,
    recompute: so.state !== 'CANCELLED' && so.state !== 'CLOSED' && so.state !== 'PENDING_PAY',
  }
  return {
    so: {
      ...so,
      createdAt: iso(so.createdAt),
      updatedAt: iso(so.updatedAt),
    },
    order: order ? { ...order, amount: String(order.amount), paidAt: iso(order.paidAt), createdAt: iso(order.createdAt) } : null,
    user: user ? { id: user.id, email: user.email, nickname: user.nickname, topupCents: user.topupCents, cashCents: centsOf(user.balance) } : null,
    hold,
    payments: payments.map((p) => ({ ...p, amount: String(p.amount) })),
    vmqs: vmqs.map((v) => ({ ...v, price: String(v.price), reallyPrice: String(v.reallyPrice) })),
    logs: logs.map((l) => ({ id: l.id, type: l.type, cashDeltaCents: centsOf(l.delta), topupDeltaCents: l.topupDeltaCents, bizKey: l.bizKey, note: l.note, createdAt: iso(l.createdAt) })),
    attempts: atts,
    messages: msgs,
    events: events.map((e) => ({ id: e.id, type: e.type, actor: e.actor, actorId: e.actorId, attemptId: e.attemptId, detail: e.detail, createdAt: iso(e.createdAt) })),
    cost: {
      preview: cost,
      charged: atts.filter((a) => a.charged).map((a) => ({ seq: a.seq, costMicro: a.costMicro, chargeSource: a.chargeSource, upstreamRefundMicro: a.upstreamRefundMicro })),
    },
    actions,
    complaint: complaint
      ? { id: complaint.id, state: complaint.state, reason: complaint.reason, reasonText: complaintReasonText(complaint.reason), detail: complaint.detail, adminNote: complaint.adminNote, createdAt: iso(complaint.createdAt), handledAt: iso(complaint.handledAt) }
      : null,
    unknownAttempts: atts.filter((a) => a.state === 'UNKNOWN').map((a) => a.id),
    releasable: atts.filter((a) => a.state === 'ACTIVE' || a.state === 'RELEASING').map((a) => a.id),
  }
}

// ───────────────────────── 操作（§7.2；都要填原因，调用方写审计） ─────────────────────────

export type AdminActionKind = 'refund' | 'cancel_refund' | 'close_release' | 'close_latepay' | 'bonus_replace' | 'release_attempt' | 'unmanual' | 'recompute' | 'claim'
export interface AdminActionInput {
  action: AdminActionKind
  reason: string
  n?: number
  attemptId?: number
  target?: string
  activationId?: string
}

const CLOSE_TEXT: Record<string, string> = {
  CLOSED: '已关单，预扣已原路退回',
  PAID_PROCESSING: '这张单已有到账的收款单：改用「关单并把到账退入余额」或「取消并退回余额」',
  PAYING: '买家手里还有一张有效的二维码（state=0 收款单）：等它超时关闭或让买家取消后再操作（不替买家作废收款单）',
  VERSION: '状态刚刚变化，请刷新',
  STATE: '前提不满足（订单状态已变化，或预扣已不是 HELD——人工改过库，请另行核实）',
}
const LATEPAY_WHY: Record<string, string> = {
  STATE: '接码单已不是 MANUAL',
  ORDER: '订单不是「未付款且未取消」',
  NO_PAID_VMQ: '这张单没有已到账（state=1）的收款单',
  HOLD_HELD: '预扣还是 HELD：请改用「关单并原路退回预扣」',
}
const CLAIM_WHY: Record<string, string> = {
  BUSY: '扫描器正在运行，稍后再试',
  NOT_UNKNOWN: '这个尝试已经不是「结果未知」（可能刚被自动认领或判定没买到）',
  UPSTREAM: '拉不全上游活跃列表，稍后再试',
  NOT_FOUND: '上游活跃列表里没有这个激活',
  KNOWN: '这个激活已经属于本站的某一单（或旧单品），不能认领',
  MISMATCH: '这个激活的服务 / 国家与这次取号不一致',
  OVER_CAP: '这个激活的价格未知或高于这次取号的上限 max(cap, $0.0067)：上游不会按这个价卖给这次取号，不能认领',
  OPERATOR: '这次取号指定了运营商，这个激活的运营商不同（或上游没给运营商）：不能认领',
  STATE: '接码单不存在或状态已变化，未认领',
}
const REOPEN_TEXT: Record<string, string> = {
  ACQUIRING: '订单恢复为「分配号码中」',
  REPLACING: '订单恢复为「换号中」',
  WAITING: '订单恢复为「等待短信」',
  RECEIVED: '订单恢复为「已收码」',
  CANCELLING: '订单恢复为「取消中」',
  REFUNDING: '订单恢复为「退款中」',
}

export async function runAdminAction(id: number, adminId: number, input: AdminActionInput): Promise<{ ok: boolean; message: string; data?: unknown }> {
  const so = await prisma.smsOrder.findUnique({ where: { id } })
  if (!so) throw new AdminJiemaError('接码单不存在', 404)
  switch (input.action) {
    case 'refund': {
      // MANUAL（收过码的）：不再先在事务外 CAS 回 RECEIVED——直接让 T16 在同一个事务里 MANUAL → REFUNDED（S2b 评审修复）：
      // 退款失败、抛错、被 tick 抢先改状态时，订单一直留在 MANUAL（人工队列里），不会悄悄变成 RECEIVED / FINISHED 又没退款
      const manual = so.state === 'MANUAL'
      if (manual) {
        const [o, atts] = await Promise.all([prisma.order.findUnique({ where: { id: so.orderId }, select: { payStatus: true } }), prisma.smsAttempt.findMany({ where: { smsOrderId: id } })])
        if (o?.payStatus !== 'PAID' || !atts.some(hasCode)) return { ok: false, message: '只有收到过短信的已付款单才能售后退款' }
      } else if (so.state !== 'RECEIVED' && so.state !== 'FINISHED') return { ok: false, message: '只有已收码 / 已完成的单能售后退款' }
      // 这张单还有没收尾的售后申请（S3；待处理或已驳回）：T16 在**同一个事务里**一并收成「已通过」并给买家写一条留言（带两格退回金额），
      // 30 天通过次数也算上（S3 评审修复：原来在退款提交后另开事务、出错被吞，已驳回的申请就再也收不回来）
      const r = await engine.adminRefund(id, adminId, 'COMPLAINT', { allowManual: manual, complaint: { note: null, via: 'ORDER' } })
      if (r.ok) {
        // 兜底：售后申请在 T16 之后才可见的极端情况（CAS 落空时什么都不写）；失败推 sms.alert，到「售后」里点「通过」可补记
        const late = await finalizeComplaintAfterRefund(so.orderId, adminId, null, { fromOrderDrawer: true }).catch((e) => {
          alertFinalizeFailed(so.orderId, null, e)
          return false
        })
        const closed = !!r.complaintClosed || late
        return { ok: true, message: `已售后退款：整单原路退回余额，成本照计（利润 = −成本）${closed ? '；这张单的售后申请已记为通过，结果已发到订单留言' : ''}` }
      }
      const why =
        r.why === 'MANUAL'
          ? manual
            ? '前提不满足（支付宝实收核对不上或预扣状态不对），订单仍是人工处理中'
            : '前提不满足，已转人工（支付宝实收核对不上或预扣状态不对）'
          : r.why === 'RACE'
            ? '另一个操作刚处理了这张单'
            : '前提不满足'
      return { ok: false, message: `没有退款：${why}` }
    }
    case 'cancel_refund': {
      // 有结果未知的取号时不做：REFUNDING 会先放掉买家手上的号，扫描器随后又把单转回 MANUAL——钱没退、号也没了（S2b 评审修复）
      if ((await prisma.smsAttempt.count({ where: { smsOrderId: id, state: { in: ['REQUESTING', 'UNKNOWN'] } } })) > 0) return { ok: false, message: INFLIGHT_TEXT }
      const ok = await engine.adminCancelRefund(id, adminId)
      return ok ? { ok: true, message: '已转为退款中：放掉还开着的号后整单退回余额（不计成本；有扣费的号记亏损）' } : { ok: false, message: '前提不满足：要求 MANUAL、订单已付款、没有任何号收到过短信、没有结果未知的取号' }
    }
    case 'close_release': {
      const r = await engine.adminCloseAndRelease(id, adminId)
      return { ok: r === 'CLOSED', message: CLOSE_TEXT[r] ?? r }
    }
    case 'close_latepay': {
      const r = await engine.adminCloseWithLatepay(id, adminId)
      if (!r.ok) return { ok: false, message: LATEPAY_WHY[r.why ?? 'STATE'] ?? '前提不满足' }
      return { ok: true, message: `已关单。到账已记为待核实条目并按规则自动退入（${r.keys.length} 条）；不满足自动条件的请到「支付监控 → 待核实」退入买家余额`, data: { keys: r.keys } }
    }
    case 'bonus_replace': {
      const n = Math.trunc(Number(input.n))
      if (!(n >= 1 && n <= 5)) return { ok: false, message: '加赠次数 1–5' }
      const r = await prisma.smsOrder.updateMany({ where: { id, state: 'WAITING' }, data: { replaceBonus: { increment: n }, version: { increment: 1 } } })
      if (r.count !== 1) return { ok: false, message: '只有等待短信（WAITING）的单能加赠换号' }
      await logEventQuiet({ smsOrderId: id, type: 'ADMIN_BONUS', actor: 'ADMIN', actorId: adminId, detail: { n } })
      return { ok: true, message: `已加赠换号 ${n} 次` }
    }
    case 'release_attempt': {
      const att = input.attemptId ? await prisma.smsAttempt.findUnique({ where: { id: input.attemptId } }) : null
      if (!att || att.smsOrderId !== id) return { ok: false, message: '尝试不存在' }
      if (att.state === 'ACTIVE') {
        const f = await prisma.smsAttempt.updateMany({ where: { id: att.id, state: 'ACTIVE' }, data: { state: 'RELEASING', nextCheckAt: null } })
        if (f.count !== 1) {
          const again = await prisma.smsAttempt.findUnique({ where: { id: att.id }, select: { state: true } })
          if (again?.state !== 'RELEASING') return { ok: false, message: `这个号刚刚变成 ${again?.state ?? '—'}，没有释放，请刷新` }
        }
      } else if (att.state !== 'RELEASING') return { ok: false, message: '只有 ACTIVE / RELEASING 的号能释放' }
      // 从这里起号已经是 RELEASING：推进任务一定会把它放掉——这次操作就算成功（S2b 评审修复：原来 SKIP 报 DENIED，审计与事实对不上）
      await logEventQuiet({ smsOrderId: id, attemptId: att.id, type: 'ADMIN_RELEASE', actor: 'ADMIN', actorId: adminId })
      const r = await engine.releaseAttempt(att.id, 'SYSTEM').catch((e) => {
        console.error('[jiema] 后台释放号码：调上游失败（推进任务稍后重试）', att.id, (e as Error)?.message)
        return { r: 'NOINFO' as const, minSec: undefined }
      })
      const text: Record<string, string> = {
        CANCELLED: '上游已确认取消',
        EARLY: `还没到可取消时间，${r.minSec ?? 0} 秒后由推进任务自动再放`,
        RECEIVED: '放号时发现已收到短信，已按收码处理',
        EXPIRED: '上游按免费取消期已过扣了费（记亏损 / 成本）',
        NOINFO: '上游暂时没有确定结果，已安排释放，推进任务稍后重试',
        SKIP: '已安排释放（推进任务正在放这个号）',
      }
      return { ok: true, message: text[r.r] ?? r.r }
    }
    case 'unmanual':
      return unmanual(so, input.target ?? '', adminId)
    case 'recompute': {
      const changed = await recomputeCostInTx(prisma, id, 'ADMIN')
      return { ok: true, message: changed ? '已按下单快照重新核算成本利润' : '核算结果没有变化' }
    }
    case 'claim': {
      if (!input.attemptId || !input.activationId || !/^[0-9A-Za-z_-]{1,32}$/.test(input.activationId)) return { ok: false, message: '请选择要认领的激活' }
      const att = await prisma.smsAttempt.findUnique({ where: { id: input.attemptId }, select: { smsOrderId: true } })
      if (!att || att.smsOrderId !== id) return { ok: false, message: '尝试不存在' }
      const r = await adminClaimActivation(input.attemptId, input.activationId, adminId)
      if (!r.ok) return { ok: false, message: CLAIM_WHY[r.why] ?? r.why }
      // 认领本身一定发生了（「结果未知」已结束、成本按上游记下）；号给没给买家按落地后的当前号如实说
      const how = r.reopened ? `${REOPEN_TEXT[r.reopened] ?? r.reopened}；` : ''
      return r.outcome === 'ATTACHED'
        ? { ok: true, message: `已认领激活 ${input.activationId}：${how}号码已给买家（订单 ${r.orderState}）`, data: r }
        : {
            ok: true,
            message: `已认领激活 ${input.activationId}，结束了结果未知的取号；${how}订单不在等这个号（${r.orderState}），号码没有给买家，已转为释放（满 2 分钟后由推进任务放掉）${r.orderState === 'MANUAL' ? '；订单仍是人工处理中，请用其他操作收尾' : ''}`,
            data: r,
          }
    }
    default:
      throw new AdminJiemaError('未知操作')
  }
}

class UnmanualRefused extends Error {
  constructor(public readonly why: string) {
    super(why)
  }
}

/**
 * 解除 MANUAL（§7.2）：**一个事务**里按锁顺序（订单 → 接码单 → 预扣）锁住行，读尝试与收款单，按 unmanualBlock 核对前提，
 * 再 CAS（state=MANUAL + version）——校验与改状态之间不会被并发的付款、关单、预扣变化钻空子（S2b 评审修复）。
 * 回到 PENDING_PAY 以外的状态后立刻推进一次（allowAcquire 只对 ACQUIRING 为 true）。
 */
async function unmanual(so: { id: number; orderId: number; version: number; currentAttemptId: number | null; refundReason: string | null }, target: string, adminId: number): Promise<{ ok: boolean; message: string }> {
  if (!['PENDING_PAY', 'ACQUIRING', 'WAITING', 'REFUNDING'].includes(target)) return { ok: false, message: '目标状态只能是 PENDING_PAY / ACQUIRING / WAITING / REFUNDING' }
  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM orders WHERE id = ${so.orderId} FOR UPDATE`
        const o = await tx.order.findUnique({ where: { id: so.orderId }, select: { payStatus: true, deliveryStatus: true } })
        if (!o) throw new UnmanualRefused('订单不存在')
        const rows = await tx.$queryRaw<{ state: string; version: number; pay_mode: string; current_attempt_id: number | null; refund_reason: string | null }[]>`
          SELECT state, version, pay_mode, current_attempt_id, refund_reason FROM sms_orders WHERE id = ${so.id} FOR UPDATE`
        const cur = rows[0]
        if (!cur || cur.state !== 'MANUAL' || Number(cur.version) !== so.version) throw new UnmanualRefused(CLOSE_TEXT.VERSION)
        const holdRows = await tx.$queryRaw<{ state: string }[]>`SELECT state FROM balance_holds WHERE order_id = ${so.orderId} FOR SHARE`
        const [atts, paidVmq] = await Promise.all([
          tx.smsAttempt.findMany({ where: { smsOrderId: so.id }, select: { id: true, state: true, smsCount: true, codeAt: true } }),
          tx.vmqOrder.count({ where: { bizType: 'order', bizId: so.orderId, state: 1 } }),
        ])
        const why = unmanualBlock({
          target,
          payStatus: o.payStatus,
          deliveryStatus: o.deliveryStatus,
          payMode: cur.pay_mode,
          holdState: holdRows[0]?.state ?? null,
          paidVmq: paidVmq > 0,
          attempts: atts,
          currentAttemptId: cur.current_attempt_id == null ? null : Number(cur.current_attempt_id),
        })
        if (why) throw new UnmanualRefused(`不能回到 ${target}：${why}`)
        const data: Prisma.SmsOrderUpdateManyMutationInput = { state: target, version: { increment: 1 }, manualAt: null, failCount: 0, notice: null, blockedSince: null }
        if (target === 'REFUNDING') data.refundReason = cur.refund_reason ?? 'ADMIN_CANCEL'
        const r = await tx.smsOrder.updateMany({ where: { id: so.id, state: 'MANUAL', version: so.version }, data })
        if (r.count !== 1) throw new UnmanualRefused(CLOSE_TEXT.VERSION)
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    )
  } catch (e) {
    if (e instanceof UnmanualRefused) return { ok: false, message: e.why }
    throw e
  }
  await logEventQuiet({ smsOrderId: so.id, type: 'STATE', actor: 'ADMIN', actorId: adminId, detail: { from: 'MANUAL', to: target, why: 'admin-unmanual' } })
  if (target !== 'PENDING_PAY') await engine.advanceOrder(so.id, 'CRON', { allowAcquire: target === 'ACQUIRING' }).catch((e) => console.error('[jiema] 解除人工后推进失败', so.id, (e as Error)?.message))
  return { ok: true, message: `已回到 ${target}` }
}

export { adminClaimCandidates }

// ───────────────────────── 营收 / 成本 / 利润（§9.5；概览与仪表盘） ─────────────────────────

/** 读区间内（costAt 或 refundedAt 落在 [from, to)）的单，按 report.summarizeFinance 汇总 */
export async function jiemaFinance(from: Date, to: Date): Promise<FinanceSummary> {
  const rows = await prisma.smsOrder.findMany({
    where: { OR: [{ costAt: { gte: from, lt: to } }, { refundedAt: { gte: from, lt: to } }] },
    select: { state: true, priceCents: true, chargedMicro: true, costCents: true, profitCents: true, lossCents: true, costFinal: true, costAt: true, refundedAt: true, refundTopupCents: true, refundCashCents: true },
    take: 50_000,
  })
  const s = summarizeFinance(rows as FinanceRow[], from, to)
  s.estimating = await prisma.smsOrder.count({ where: { costFinal: false, costCents: { not: null }, state: { not: 'CANCELLED' } } })
  return s
}

// ───────────────────────── 概览（§7.1 的 S2 部分） ─────────────────────────

export async function jiemaOverviewS2() {
  const now = jnow()
  const dayStart = shanghaiDayStart(new Date())
  // 上游余额与在途占用（口径与 E26 判定逐字相同：inflightMicro 不排除任何订单）
  const cache = await ensureFreshBalance().catch(() => null)
  const cur = rt().balance
  let inflight: { a: number; b: number; c: number; total: number } | null = null
  if (cache) {
    const snap = await loadInflightSnapshot(new Date(cache.balanceAt), now)
    inflight = inflightMicro(snap, new Date(cache.balanceAt), null, now)
  }
  const params = runtimeParams()
  const [hb, threads, created, paidBy, received, inProgress, manualRows, closedToday, releaseLogs, avgRows, today, combos, latepayOpen, complaintsOpen] = await Promise.all([
    prisma.setting.findUnique({ where: { key: engine.SMS_RUNTIME_KEY } }),
    activeThreadsHold(now),
    prisma.smsOrder.count({ where: { createdAt: { gte: dayStart } } }),
    prisma.smsOrder.groupBy({ by: ['payMode'], where: { paidAt: { gte: dayStart } }, _count: { _all: true } }),
    prisma.smsOrder.count({ where: { firstCodeAt: { gte: dayStart } } }),
    prisma.smsOrder.count({ where: { state: { in: ACTIVE_STATES } } }),
    prisma.smsOrder.findMany({ where: { state: 'MANUAL' }, orderBy: { manualAt: 'asc' }, take: 20, select: { id: true, orderId: true, notice: true, manualAt: true } }),
    prisma.smsOrder.count({ where: { state: 'CLOSED', updatedAt: { gte: dayStart } } }),
    prisma.balanceLog.findMany({ where: { type: 'RELEASE', createdAt: { gte: dayStart } }, select: { delta: true, topupDeltaCents: true } }),
    prisma.smsOrder.findMany({ where: { paidAt: { gte: dayStart } }, select: { paidAt: true, firstCodeAt: true, replaceCount: true, state: true, refundReason: true, refundedAt: true } }),
    jiemaFinance(dayStart, new Date(dayStart.getTime() + 86400_000)),
    comboTable(new Date(Date.now() - 7 * 86400_000)),
    latepayCarrierOpenCount(),
    pendingComplaintCount(),
  ])
  let tickAt: string | null = null
  try {
    tickAt = hb ? ((JSON.parse(hb.value) as { tickAt?: string }).tickAt ?? null) : null
  } catch {
    tickAt = null
  }
  const manualOrders = manualRows.length ? await prisma.order.findMany({ where: { id: { in: manualRows.map((m) => m.orderId) } }, select: { id: true, orderNo: true } }) : []
  const mo = new Map(manualOrders.map((o) => [o.id, o.orderNo]))
  const codeSecs = avgRows.filter((r) => r.paidAt && r.firstCodeAt).map((r) => (r.firstCodeAt!.getTime() - r.paidAt!.getTime()) / S)
  const cancelledReasons: Record<string, number> = {}
  const todayCancelled = await prisma.smsOrder.findMany({ where: { state: 'CANCELLED', refundedAt: { gte: dayStart } }, select: { refundReason: true } })
  for (const r of todayCancelled) cancelledReasons[r.refundReason ?? 'OTHER'] = (cancelledReasons[r.refundReason ?? 'OTHER'] ?? 0) + 1
  const st = rt().upstreamStats
  return {
    upstream: {
      balanceMicro: cache ? cache.balanceMicro : null,
      balanceAt: cache ? new Date(cache.balanceAt).toISOString() : null,
      unknown: !cache || cur === 'UNKNOWN',
      alertLineUsd: params.upstream.balanceAlertUsd,
      inflight: inflight ? { aMicro: inflight.a, bMicro: inflight.b, cMicro: inflight.c, totalMicro: inflight.total } : null,
      sellableMicro: cache && inflight ? cache.balanceMicro - inflight.total : null,
      insufficientRejectsToday: e26Rejects(Date.now()),
      stats: st ? { at: new Date(st.at).toISOString(), total: st.total, success: st.success, worst: st.worst } : null,
    },
    heartbeat: { tickAt, stale: !tickAt || Date.now() - Date.parse(tickAt) > 180 * S },
    breaker: { open: rt().breaker.open },
    threads: threads ? { note: threads.note, until: iso(threads.until) } : null,
    today: {
      created,
      paid: Object.fromEntries(paidBy.map((p) => [p.payMode, p._count._all])) as Record<string, number>,
      received,
      inProgress,
      cancelledReasons,
      closed: closedToday,
      releasedCents: releaseLogs.reduce((a, l) => a + centsOf(l.delta) + l.topupDeltaCents, 0),
      avgCodeSec: codeSecs.length ? Math.round(codeSecs.reduce((a, b) => a + b, 0) / codeSecs.length) : null,
      avgReplace: avgRows.length ? Math.round((avgRows.reduce((a, r) => a + r.replaceCount, 0) / avgRows.length) * 10) / 10 : null,
      finance: today,
    },
    attention: {
      manual: manualRows.map((m) => ({ id: m.id, orderNo: mo.get(m.orderId) ?? null, notice: m.notice, manualAt: iso(m.manualAt) })),
      latepayOpen,
      // 售后申请待处理（S3，§7.1「● 2 条售后申请待处理 → 查看」、§8.5「MANUAL 单和售后申请在概览里置顶」）
      complaintsOpen,
    },
    combos,
  }
}

/** 组合成功率与毛利（近 7 天，≥5 单，§7.1）：号码数 / 收码按尝试算，营收 / 成本 / 毛利按订单快照（与页脚同一口径） */
async function comboTable(since: Date) {
  const [orders, atts] = await Promise.all([
    prisma.$queryRaw<Array<{ service: string; country: number; name_s: string; name_c: string; n: bigint | number; cancelled: unknown; revenue: unknown; cost: unknown; profit: unknown; avg_code: unknown }>>`
      SELECT service, country, MAX(service_name) AS name_s, MAX(country_name) AS name_c, COUNT(*) AS n,
             SUM(CASE WHEN state = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
             SUM(CASE WHEN profit_cents IS NOT NULL AND state <> 'REFUNDED' THEN price_cents ELSE 0 END) AS revenue,
             SUM(COALESCE(cost_cents, 0)) AS cost,
             SUM(COALESCE(profit_cents, 0)) AS profit,
             AVG(CASE WHEN first_code_at IS NOT NULL AND paid_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, paid_at, first_code_at) END) AS avg_code
        FROM sms_orders WHERE created_at >= ${since} AND paid_at IS NOT NULL
       GROUP BY service, country HAVING COUNT(*) >= 5
       ORDER BY COUNT(*) DESC LIMIT 100`,
    prisma.$queryRaw<Array<{ service: string; country: number; nums: bigint | number; ok: unknown }>>`
      SELECT service, country, COUNT(*) AS nums,
             SUM(CASE WHEN sms_count > 0 OR state IN ('RECEIVED', 'FINISHED') THEN 1 ELSE 0 END) AS ok
        FROM sms_attempts WHERE activation_id IS NOT NULL AND requested_at >= ${since}
       GROUP BY service, country`,
  ])
  const am = new Map(atts.map((a) => [`${a.service}:${Number(a.country)}`, a]))
  return orders.map((o) => {
    const a = am.get(`${o.service}:${Number(o.country)}`)
    const nums = Number(a?.nums ?? 0)
    const ok = Number(a?.ok ?? 0)
    return {
      service: o.service,
      country: Number(o.country),
      serviceName: o.name_s,
      countryName: o.name_c,
      orders: Number(o.n),
      numbers: nums,
      received: ok,
      ratePct: nums ? Math.round((ok / nums) * 100) : null,
      cancelled: Number(o.cancelled ?? 0),
      avgCodeSec: o.avg_code == null ? null : Math.round(Number(o.avg_code)),
      revenueCents: Number(o.revenue ?? 0),
      costCents: Number(o.cost ?? 0),
      profitCents: Number(o.profit ?? 0),
    }
  })
}

/** 待核实到账里涉及载体单、还没处理的条目数（概览「需要处理」一行；与 /admin/vmq 同一个 carrierFlags 判定） */
async function latepayCarrierOpenCount(): Promise<number> {
  const rows = await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' }, value: { contains: '"handledAt":null' } }, select: { value: true }, take: 300 })
  const entries: LatepayEntry[] = []
  for (const r of rows) {
    try {
      entries.push(JSON.parse(r.value) as LatepayEntry)
    } catch {
      /* 坏条目在 /admin/vmq 里看 */
    }
  }
  if (!entries.length) return 0
  const flags = await carrierFlags(entries)
  return flags.filter(Boolean).length
}

/** 管理员详情里「尝试时间线」用：尝试是否终态 */
export const isTerminalAttempt = (s: string) => ATTEMPT_TERMINAL.has(s)
