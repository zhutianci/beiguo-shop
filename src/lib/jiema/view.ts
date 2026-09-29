/**
 * 短信接码 · 买家号码页的数据（GET /api/jiema/orders/[orderNo] 与各个操作接口的返回，docs/短信接码-设计.md §1.10、§6.4、§10.2）。
 *
 * 【归属】一律按 `orderNo + userId + tenantId=1` 查（不符就 404，E34）；反查余额流水也带 userId = 本人。
 * 【白名单】结果经 dto.toJiemaOrderView 逐字段构造：成本、上限、两个系数、activationId、raw、错误码原文、成本利润一律不出（附录 B 第 7 条）。
 * 短信内容 30 天后清空（purgedAt），这里原样给 null。
 */
import type { SmsAttempt, SmsOrder } from '@prisma/client'
import { prisma } from '../db'
import { VMQ_TIMEOUT_MIN } from '../vmq'
import { COMPLAINT_AVAILABLE, pollMsFor, refundReasonText, toJiemaOrderView, type JiemaOrderView, type SmsOrderStateView } from './dto'
import { flagOf, operatorDisplayName, readOperatorNames } from './catalog'
import { phoneParts } from './machine'
import { threadsLimited, acquireBlock } from './sellable'
import { jnow } from './runtime'
import { complaintWindowHours } from './config'
import { buyerComplaintState, complaintBlock, complaintDeadline, complaintReasonText } from './complaint-rules'

export interface BuyerOrderRef {
  so: SmsOrder
  order: { id: number; orderNo: string; payStatus: string; deliveryStatus: string; userId: number }
}

/** 本人、主站的接码单（不符 = null → 404） */
/** 订单号的格式（买家接口先拿它校验路径参数，再拼限频 key、查库） */
export const JIEMA_ORDER_NO_RE = /^[0-9A-Za-z]{8,32}$/

export async function findBuyerOrder(userId: number, orderNo: string): Promise<BuyerOrderRef | null> {
  if (typeof orderNo !== 'string' || !JIEMA_ORDER_NO_RE.test(orderNo)) return null
  const order = await prisma.order.findFirst({
    where: { orderNo, userId, tenantId: 1, product: { deliveryType: 'SMS_POOL' } },
    select: { id: true, orderNo: true, payStatus: true, deliveryStatus: true, userId: true },
  })
  if (!order) return null
  const so = await prisma.smsOrder.findUnique({ where: { orderId: order.id } })
  if (!so || so.userId !== userId) return null
  return { so, order }
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null)

function historyOutcome(a: SmsAttempt, currentId: number | null): 'REPLACED' | 'CANCELLED' | 'FAILED' | 'RECEIVED' {
  if (a.smsCount > 0 || a.state === 'RECEIVED' || a.state === 'FINISHED') return 'RECEIVED'
  if (a.state === 'FAILED') return 'FAILED'
  if (a.reason !== 'FIRST' || (currentId != null && a.id !== currentId)) return a.state === 'CANCELLED' ? 'REPLACED' : 'CANCELLED'
  return 'CANCELLED'
}

export async function buildOrderView(ref: BuyerOrderRef): Promise<JiemaOrderView> {
  const { so, order } = ref
  const now = jnow()
  const [atts, msgs, hold, country, names, lateLogs, threads, vmq, startBlock, complaintRow, windowH] = await Promise.all([
    prisma.smsAttempt.findMany({ where: { smsOrderId: so.id }, orderBy: { seq: 'asc' } }),
    prisma.smsMessage.findMany({ where: { smsOrderId: so.id }, orderBy: { receivedAt: 'desc' }, take: 50 }),
    prisma.balanceHold.findUnique({ where: { orderId: order.id }, select: { topupCents: true, cashCents: true, state: true } }),
    prisma.smsCountry.findUnique({ where: { id: so.country }, select: { iso2: true, dialCode: true } }),
    so.operator ? readOperatorNames() : Promise.resolve({} as Record<string, string>),
    prisma.balanceLog.findMany({ where: { userId: order.userId, orderId: order.id, type: 'LATEPAY' }, orderBy: { id: 'asc' }, select: { topupDeltaCents: true, createdAt: true } }),
    so.state === 'WAITING' ? threadsLimited() : Promise.resolve(false),
    so.state === 'PENDING_PAY'
      ? prisma.vmqOrder.findFirst({ where: { bizType: 'order', bizId: order.id, state: 0, createdAt: { gte: new Date(Date.now() - VMQ_TIMEOUT_MIN * 60_000) } }, orderBy: { createdAt: 'desc' }, select: { orderId: true, createdAt: true } })
      : Promise.resolve(null),
    // READY：组合正处于停售时「开始接码」置灰并写原因（§1.10、T5；与 buyerStart 同一个 acquireBlock，BUSY 只是名额满、不算停售）
    so.state === 'READY' ? acquireBlock({ service: so.service, country: so.country, selfSmsOrderId: so.id }).catch(() => null) : Promise.resolve(null),
    // 售后申请（S3，E17）：每单最多一条；只有收过码的单才可能有
    so.firstCodeAt ? prisma.smsComplaint.findUnique({ where: { orderId: order.id }, select: { state: true, reason: true, detail: true, adminNote: true, createdAt: true, handledAt: true } }) : Promise.resolve(null),
    so.firstCodeAt ? complaintWindowHours() : Promise.resolve(24),
  ])
  const cur = atts.find((a) => a.id === so.currentAttemptId) ?? null
  const seqOf = new Map(atts.map((a) => [a.id, a.seq]))
  const received = atts.some((a) => a.smsCount > 0 || a.state === 'RECEIVED' || a.state === 'FINISHED')
  const inflight = atts.some((a) => a.state === 'REQUESTING' || a.state === 'UNKNOWN')
  const left = Math.max(0, so.maxReplace + so.replaceBonus - so.replaceCount)
  const numberLive = cur && cur.phone && cur.endsAt && ['ACTIVE', 'RECEIVED', 'RELEASING'].includes(cur.state) && !['CANCELLED', 'CLOSED', 'REFUNDED'].includes(so.state)
  const number = numberLive && cur
    ? (() => {
        const p = phoneParts(cur.phone as string, cur.dialCode ?? country?.dialCode ?? null)
        return {
          dial: p.dial,
          national: p.national,
          full: p.full,
          endsAt: (cur.endsAt as Date).toISOString(),
          waitUntil: cur.smsCount > 0 || cur.state === 'RECEIVED' ? null : iso(cur.waitUntil),
          canActAt: iso(cur.canCancelAt) ?? (cur.endsAt as Date).toISOString(),
          seq: cur.seq,
          canGetAnotherSms: cur.canGetAnotherSms,
        }
      })()
    : null
  const holdCents = hold ? hold.topupCents + hold.cashCents : 0
  const pendingPay = so.state === 'PENDING_PAY' && order.payStatus === 'UNPAID' && order.deliveryStatus !== 'CANCELLED'
  // 售后申请：能不能申请与截止时刻（complaint-rules.complaintBlock，与买家接口、事务里的复核同一个函数）
  const complainBlock = complaintBlock({
    state: so.state,
    refundState: so.refundState,
    firstCodeAt: so.firstCodeAt,
    now,
    windowH,
    hasComplaint: !!complaintRow,
    orderPaid: order.payStatus === 'PAID',
  })
  const canComplain = COMPLAINT_AVAILABLE && !complainBlock
  const closedLike = order.payStatus === 'UNPAID' && order.deliveryStatus === 'CANCELLED'
  const view: JiemaOrderView = {
    orderNo: order.orderNo,
    orderId: order.id,
    state: so.state as SmsOrderStateView,
    version: so.version,
    service: { code: so.service, name: so.serviceName },
    // iso2 只用来显示旗帜：台湾（55）不显示旗帜（D44，与目录同一个 flagOf），号码页显示中性图标
    country: { id: so.country, name: so.countryName, iso2: flagOf(so.country, country?.iso2 ?? null)?.toUpperCase() ?? null, dial: country?.dialCode || null },
    operator: so.operator ? { code: so.operator, name: operatorDisplayName(so.operator, names) } : null,
    priceCents: so.priceCents,
    pay: {
      mode: so.payMode as JiemaOrderView['pay']['mode'],
      balanceCents: holdCents || so.balanceCents,
      balanceTopupCents: hold?.topupCents ?? 0,
      balanceCashCents: hold?.cashCents ?? 0,
      alipayCents: so.alipayCents,
      alipayPaidCents: so.alipayPaidCents,
      holdState: (hold?.state as JiemaOrderView['pay']['holdState']) ?? null,
    },
    quoteExpiresAt: so.state === 'PENDING_PAY' ? so.quoteExpiresAt.toISOString() : null,
    cashierUrl: pendingPay && vmq ? `/pay/${vmq.orderId}` : null,
    cashierExpiresAt: pendingPay && vmq ? new Date(vmq.createdAt.getTime() + VMQ_TIMEOUT_MIN * 60_000).toISOString() : null,
    createdAt: so.createdAt.toISOString(),
    progress:
      so.state === 'ACQUIRING' || so.state === 'REPLACING'
        ? {
            tries: atts.filter((a) => a.reason === 'FIRST' || a.reason === 'RETRY').length,
            maxTries: so.acquireTries,
            confirming: atts.some((a) => a.state === 'UNKNOWN'),
          }
        : null,
    number,
    replace: { used: so.replaceCount, left },
    messages: msgs.map((m) => ({
      id: m.id,
      code: m.purgedAt ? null : m.code,
      text: m.purgedAt ? null : m.text,
      sender: m.sender,
      at: m.receivedAt.toISOString(),
      seq: seqOf.get(m.attemptId) ?? 0,
      toOldNumber: cur != null && m.attemptId !== cur.id,
    })),
    history: atts
      .filter((a) => a.phone && a.id !== so.currentAttemptId)
      .map((a) => ({ seq: a.seq, phone: a.phone as string, outcome: historyOutcome(a, so.currentAttemptId), at: (a.closedAt ?? a.respondedAt ?? a.requestedAt).toISOString() })),
    refund:
      so.refundState === 'DONE'
        ? {
            cents: (so.refundTopupCents ?? 0) + (so.refundCashCents ?? 0),
            topupCents: so.refundTopupCents ?? 0,
            cashCents: so.refundCashCents ?? 0,
            at: (so.refundedAt ?? so.updatedAt).toISOString(),
            reason: refundReasonText(so.state === 'REFUNDED' ? 'COMPLAINT' : so.refundReason),
          }
        : null,
    lateCredits: lateLogs.map((l) => ({ cents: l.topupDeltaCents, at: l.createdAt.toISOString(), kind: closedLike ? 'LATE' : 'DUPLICATE' })),
    replaceBlocked: threads ? 'THREADS' : null,
    actions: {
      pay: pendingPay && so.payMode !== 'BALANCE',
      close: pendingPay && so.payMode !== 'BALANCE',
      replace: so.state === 'WAITING' && !!cur && cur.state === 'ACTIVE' && !received && !inflight && left > 0 && !threads,
      cancel: so.state === 'WAITING' && !!cur && cur.state === 'ACTIVE' && !received && !inflight,
      finish: so.state === 'RECEIVED',
      start: so.state === 'READY' && !(startBlock && startBlock.code !== 'BUSY'),
      refundReady: so.state === 'READY',
      // 售后申请（S3，E17）：RECEIVED / FINISHED、收码后 complaintWindowH 小时内、没申请过、没退过款
      complain: canComplain,
      // 订单留言对接码单放开（§6.6 第 29 条，S2b）：待支付、已关闭、已取消、已退款的接码单同样能读写留言
      message: true,
    },
    complaint: complaintRow
      ? {
          state: buyerComplaintState(complaintRow.state),
          reason: complaintRow.reason,
          reasonText: complaintReasonText(complaintRow.reason),
          detail: complaintRow.detail,
          // 驳回的回复（通过时的备注已随「售后审核通过」那条订单留言发给买家，这里不重复）
          reply: complaintRow.state === 'REJECTED' ? complaintRow.adminNote : null,
          createdAt: complaintRow.createdAt.toISOString(),
          handledAt: iso(complaintRow.handledAt),
        }
      : null,
    complainUntil: canComplain && so.firstCodeAt ? complaintDeadline(so.firstCodeAt, windowH).toISOString() : null,
    notice: so.notice,
    serverNow: now.toISOString(),
    pollMs: pollMsFor(so.state),
  }
  return toJiemaOrderView(view)
}

