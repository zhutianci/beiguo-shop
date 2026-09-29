/**
 * 短信接码 · 售后申请（docs/短信接码-设计.md E17、§5.2 SmsComplaint、§6.4、§7.5、§7.7 sms.complaint、§8.2）。
 *
 * 【买家】收码后 complaintWindowH（出厂 24）小时内对 RECEIVED / FINISHED 的单提交一次（原因 + 说明 ≤500；截图走微信）。
 *   提交事务里按锁顺序（订单 → 接码单）共享锁住两行再判一次前提：与 T16 售后退款、T13 收码互斥，不会出现「单已退款却多出一条待处理售后」。
 *   每单最多一条靠 sms_complaints.order_id 唯一；新申请推一次 sms.complaint（每条一次）。
 * 【站长】「通过并退款到余额」= T16（engine.adminRefund：先放掉 / 完成还开着的号，再整单原路退回余额，成本照计、利润 = −成本），
 *   「驳回」必填回复、同一事务写进订单留言。两个操作互斥靠 state 的 CAS：通过先把 OPEN 占成 APPROVING（驳回只收 OPEN），
 *   退款成功后 APPROVING → REFUNDED 并在同一事务里写一条买家留言；退款没做成就退回 OPEN（可以改为驳回或稍后再试）。
 *   进程在中途崩溃留下的 APPROVING 可以再点一次「通过」（退款本身有 refundState CAS + 预扣 CAS + 流水 bizKey 三道幂等）。
 * 【资金只经过引擎】这里不直接改余额、不碰预扣；退款一律 engine.adminRefund → refund.refundAfterSale（附录 B 第 2、14 条）。
 * 【订单详情里直接「售后退款到余额」】（后台接码订单抽屉）同样会把这张单还在待处理的售后申请收成 REFUNDED 并写留言（finalizeComplaintAfterRefund）。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { notify, fmtTime } from '../notify'
import * as engine from './engine'
import type { BuyerResult } from './engine'
import type { BuyerOrderRef } from './view'
import { logEvent, logEventQuiet } from './events'
import { complaintWindowHours } from './config'
import { jnow } from './runtime'
import { fmtYuan } from './pricing'
import { phoneTail } from './machine'
import {
  approveMessageText,
  rejectMessageText,
  complaintBlock,
  complaintNoResend,
  complaintReasonText,
  passedCount30d,
  upstreamAppealDeadline,
  COMPLAINT_PASS_LIMIT,
  COMPLAINT_PASS_WINDOW_MS,
  COMPLAINT_PENDING_STATES,
  type ComplaintBlockCode,
  type ComplaintReason,
} from './complaint-rules'

const fail = (status: number, code: string, message: string, extra?: Record<string, unknown>): BuyerResult => ({ ok: false, status, code, message, extra })
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null)
const hasCode = (a: { smsCount: number; codeAt: Date | null; state: string }) => a.smsCount > 0 || a.codeAt != null || a.state === 'RECEIVED' || a.state === 'FINISHED'

class ComplaintRefused extends Error {
  constructor(public readonly code: ComplaintBlockCode, message: string) {
    super(message)
  }
}

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
}

// ───────────────────────── 买家提交（POST /api/jiema/orders/[orderNo]/complaint） ─────────────────────────

export async function submitComplaint(ref: BuyerOrderRef, input: { reason: ComplaintReason; detail: string | null }): Promise<BuyerResult> {
  const { so, order } = ref
  const windowH = await complaintWindowHours()
  const existing = await prisma.smsComplaint.findUnique({ where: { orderId: order.id }, select: { id: true } })
  const pre = complaintBlock({
    state: so.state,
    refundState: so.refundState,
    firstCodeAt: so.firstCodeAt,
    now: jnow(),
    windowH,
    hasComplaint: !!existing,
    orderPaid: order.payStatus === 'PAID',
  })
  if (pre) return fail(409, pre.code, pre.message)
  const detail = input.detail ? input.detail.trim().slice(0, 500) || null : null
  let id: number
  try {
    id = await prisma.$transaction(
      async (tx) => {
        // 锁顺序：订单 → 接码单（与 T13 / T16 一致）。共享锁：它们要改这两行就得等本事务提交，这里读到的就是提交时刻的真相
        const o = await tx.$queryRaw<{ pay_status: string }[]>`SELECT pay_status FROM orders WHERE id = ${order.id} LOCK IN SHARE MODE`
        const rows = await tx.$queryRaw<{ state: string; refund_state: string; first_code_at: Date | null }[]>`
          SELECT state, refund_state, first_code_at FROM sms_orders WHERE id = ${so.id} LOCK IN SHARE MODE`
        const cur = rows[0]
        if (!cur || !o[0]) throw new ComplaintRefused('STATE', '订单状态异常，请联系客服')
        const block = complaintBlock({
          state: cur.state,
          refundState: cur.refund_state,
          firstCodeAt: cur.first_code_at,
          now: jnow(),
          windowH,
          hasComplaint: false,
          orderPaid: o[0].pay_status === 'PAID',
        })
        if (block) throw new ComplaintRefused(block.code, block.message)
        const c = await tx.smsComplaint.create({ data: { orderId: order.id, smsOrderId: so.id, userId: order.userId, reason: input.reason, detail } })
        await logEvent(tx, { smsOrderId: so.id, type: 'COMPLAINT', actor: 'BUYER', actorId: order.userId, detail: { complaintId: c.id, reason: input.reason } })
        return c.id
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 5_000, timeout: 10_000 },
    )
  } catch (e) {
    if (e instanceof ComplaintRefused) return fail(409, e.code, e.message)
    if (isUniqueViolation(e)) return fail(409, 'EXISTS', '这张订单已经申请过售后，结果会在订单留言里告诉你')
    throw e
  }
  await notifyNewComplaint(id).catch((e) => console.error('[jiema] 售后申请推送失败', id, (e as Error)?.message))
  return { ok: true }
}

/** sms.complaint（§7.7：每条一次）。只给站长看：号码只给后 4 位，不写上游名称 */
async function notifyNewComplaint(id: number): Promise<void> {
  const c = await prisma.smsComplaint.findUnique({ where: { id } })
  if (!c) return
  const [so, order, user, atts] = await Promise.all([
    prisma.smsOrder.findUnique({ where: { id: c.smsOrderId }, select: { serviceName: true, countryName: true, operator: true, priceCents: true, payMode: true, firstCodeAt: true, state: true } }),
    prisma.order.findUnique({ where: { id: c.orderId }, select: { orderNo: true } }),
    prisma.user.findUnique({ where: { id: c.userId }, select: { email: true, nickname: true } }),
    prisma.smsAttempt.findMany({ where: { smsOrderId: c.smsOrderId }, select: { phone: true, seq: true, smsCount: true, state: true, codeAt: true, canGetAnotherSms: true } }),
  ])
  const passed = await passedFor([c.userId], jnow())
  const noResend = complaintNoResend(atts)
  const got = atts.filter(hasCode)
  notify(
    'sms.complaint',
    [
      { label: '订单', value: order?.orderNo ?? `#${c.orderId}` },
      { label: '用户', value: user?.email || user?.nickname || `#${c.userId}` },
      { label: '接码', value: so ? `${so.serviceName} / ${so.countryName}（${so.operator ?? '任意运营商'}）· ${fmtYuan(so.priceCents)}` : '—' },
      { label: '原因', value: complaintReasonText(c.reason), color: 'warning' },
      { label: '说明', value: (c.detail ?? '（未填写）').slice(0, 200) },
      { label: '收码', value: `${so?.firstCodeAt ? fmtTime(so.firstCodeAt) : '—'} · ${got.map((a) => `第 ${a.seq} 个号尾号 ${phoneTail(a.phone)}`).join('、') || '—'}` },
      { label: '再次收码', value: noResend ? '号码不支持再次收码（放宽受理，不计入次数）' : '号码可以再次收码（可引导买家在目标平台重新发送）' },
      { label: '30 天内已通过', value: `${passed.get(c.userId) ?? 0} 次${(passed.get(c.userId) ?? 0) >= COMPLAINT_PASS_LIMIT ? '（已超出正常受理次数，人工酌情）' : ''}` },
    ],
    { link: `/admin/jiema?tab=complaints&id=${c.id}`, extraTitle: order?.orderNo ?? undefined },
  )
}

/** 这些用户 30 天内已通过的售后次数（号码不支持再次收码的不计入，E17） */
async function passedFor(userIds: number[], now: Date): Promise<Map<number, number>> {
  const out = new Map<number, number>()
  if (!userIds.length) return out
  const rows = await prisma.smsComplaint.findMany({
    where: { userId: { in: userIds }, state: 'REFUNDED', handledAt: { gte: new Date(now.getTime() - COMPLAINT_PASS_WINDOW_MS) } },
    select: { userId: true, smsOrderId: true, state: true, handledAt: true },
    take: 2000,
  })
  const nr = await noResendMap(rows.map((r) => r.smsOrderId))
  for (const u of userIds) {
    out.set(u, passedCount30d(rows.filter((r) => r.userId === u).map((r) => ({ state: r.state, handledAt: r.handledAt, noResend: nr.get(r.smsOrderId) ?? false })), now))
  }
  return out
}

async function noResendMap(smsOrderIds: number[]): Promise<Map<number, boolean>> {
  const out = new Map<number, boolean>()
  if (!smsOrderIds.length) return out
  const atts = await prisma.smsAttempt.findMany({
    where: { smsOrderId: { in: Array.from(new Set(smsOrderIds)) } },
    select: { smsOrderId: true, smsCount: true, state: true, codeAt: true, canGetAnotherSms: true },
  })
  for (const id of smsOrderIds) out.set(id, complaintNoResend(atts.filter((a) => a.smsOrderId === id)))
  return out
}

// ───────────────────────── 后台列表 / 详情（/api/admin/jiema/complaints，第一行 adminGuard） ─────────────────────────

export type ComplaintListState = 'PENDING' | 'DONE' | 'ALL'

export async function pendingComplaintCount(): Promise<number> {
  return prisma.smsComplaint.count({ where: { state: { in: [...COMPLAINT_PENDING_STATES] } } })
}

/** 列表：待处理（OPEN / APPROVING）在前、先到先处理；其余按提交时间倒序（§7.5「OPEN 在前」） */
export async function listComplaintsAdmin(q: { state: ComplaintListState; page: number; pageSize: number }) {
  const pending = [...COMPLAINT_PENDING_STATES]
  const where: Prisma.SmsComplaintWhereInput = q.state === 'PENDING' ? { state: { in: pending } } : q.state === 'DONE' ? { state: { notIn: pending } } : {}
  const cond =
    q.state === 'PENDING'
      ? Prisma.sql`WHERE state IN (${Prisma.join(pending)})`
      : q.state === 'DONE'
        ? Prisma.sql`WHERE state NOT IN (${Prisma.join(pending)})`
        : Prisma.empty
  const [total, pendingTotal, idRows] = await Promise.all([
    prisma.smsComplaint.count({ where }),
    pendingComplaintCount(),
    prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM sms_complaints ${cond}
       ORDER BY (state IN (${Prisma.join(pending)})) DESC,
                CASE WHEN state IN (${Prisma.join(pending)}) THEN created_at END ASC,
                created_at DESC, id DESC
       LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
  ])
  const ids = idRows.map((r) => Number(r.id))
  const rows = ids.length ? await prisma.smsComplaint.findMany({ where: { id: { in: ids } } }) : []
  const byId = new Map(rows.map((r) => [r.id, r]))
  const list0 = ids.map((id) => byId.get(id)).filter((x): x is NonNullable<typeof x> => !!x)
  const [orders, sos, users, passed, nr] = await Promise.all([
    prisma.order.findMany({ where: { id: { in: list0.map((c) => c.orderId) } }, select: { id: true, orderNo: true, payStatus: true } }),
    prisma.smsOrder.findMany({ where: { id: { in: list0.map((c) => c.smsOrderId) } }, select: { id: true, state: true, serviceName: true, countryName: true, operator: true, priceCents: true, firstCodeAt: true, costCents: true } }),
    prisma.user.findMany({ where: { id: { in: Array.from(new Set(list0.map((c) => c.userId))) } }, select: { id: true, email: true, nickname: true } }),
    passedFor(Array.from(new Set(list0.map((c) => c.userId))), jnow()),
    noResendMap(list0.map((c) => c.smsOrderId)),
  ])
  const om = new Map(orders.map((o) => [o.id, o]))
  const sm = new Map(sos.map((s) => [s.id, s]))
  const um = new Map(users.map((u) => [u.id, u]))
  const list = list0.map((c) => {
    const so = sm.get(c.smsOrderId)
    const u = um.get(c.userId)
    return {
      id: c.id,
      state: c.state,
      reason: c.reason,
      reasonText: complaintReasonText(c.reason),
      detail: c.detail,
      adminNote: c.adminNote,
      createdAt: iso(c.createdAt),
      handledAt: iso(c.handledAt),
      handledBy: c.handledBy,
      orderId: c.orderId,
      orderNo: om.get(c.orderId)?.orderNo ?? null,
      smsOrderId: c.smsOrderId,
      orderState: so?.state ?? null,
      combo: so ? `${so.serviceName} · ${so.countryName} · ${so.operator ?? '任意'}` : '—',
      priceCents: so?.priceCents ?? null,
      costCents: so?.costCents ?? null,
      user: { id: c.userId, email: u?.email ?? null, nickname: u?.nickname ?? null },
      noResend: nr.get(c.smsOrderId) ?? false,
      passed30d: passed.get(c.userId) ?? 0,
    }
  })
  return { list, total, pendingTotal, page: q.page, totalPages: Math.max(1, Math.ceil(total / q.pageSize)) }
}

export async function complaintDetailAdmin(id: number) {
  const c = await prisma.smsComplaint.findUnique({ where: { id } })
  if (!c) return null
  const [so, order, user, atts, msgs, passed] = await Promise.all([
    prisma.smsOrder.findUnique({ where: { id: c.smsOrderId } }),
    prisma.order.findUnique({ where: { id: c.orderId }, select: { id: true, orderNo: true, payStatus: true, deliveryStatus: true, amount: true } }),
    prisma.user.findUnique({ where: { id: c.userId }, select: { id: true, email: true, nickname: true } }),
    prisma.smsAttempt.findMany({ where: { smsOrderId: c.smsOrderId }, orderBy: { seq: 'asc' } }),
    prisma.smsMessage.findMany({ where: { smsOrderId: c.smsOrderId }, orderBy: { receivedAt: 'desc' }, take: 50 }),
    passedFor([c.userId], jnow()),
  ])
  const got = atts.filter(hasCode)
  // 上游申诉截止：收到过码的号里最早的取号时刻 + 7 天（只给站长看，§7.5；不在任何买家可见的地方提上游）
  const bought = got.map((a) => a.respondedAt ?? a.requestedAt).sort((a, b) => a.getTime() - b.getTime())[0] ?? null
  const withCode = got.length > 0
  const pending = COMPLAINT_PENDING_STATES.includes(c.state)
  const refundable = !!so && (so.state === 'RECEIVED' || so.state === 'FINISHED' || (so.state === 'MANUAL' && withCode)) && order?.payStatus === 'PAID' && so.refundState === 'NONE'
  return {
    complaint: {
      id: c.id,
      state: c.state,
      reason: c.reason,
      reasonText: complaintReasonText(c.reason),
      detail: c.detail,
      adminNote: c.adminNote,
      handledBy: c.handledBy,
      createdAt: iso(c.createdAt),
      handledAt: iso(c.handledAt),
    },
    order: order ? { id: order.id, orderNo: order.orderNo, payStatus: order.payStatus, deliveryStatus: order.deliveryStatus, amount: String(order.amount) } : null,
    user: user ? { id: user.id, email: user.email, nickname: user.nickname } : { id: c.userId, email: null, nickname: null },
    so: so
      ? {
          id: so.id,
          state: so.state,
          service: so.service,
          serviceName: so.serviceName,
          countryName: so.countryName,
          operator: so.operator,
          priceCents: so.priceCents,
          payMode: so.payMode,
          firstCodeAt: iso(so.firstCodeAt),
          costCents: so.costCents,
          profitCents: so.profitCents,
          costFinal: so.costFinal,
          refundTopupCents: so.refundTopupCents,
          refundCashCents: so.refundCashCents,
          refundedAt: iso(so.refundedAt),
        }
      : null,
    attempts: atts.map((a) => ({ id: a.id, seq: a.seq, state: a.state, phone: a.phone, smsCount: a.smsCount, canGetAnotherSms: a.canGetAnotherSms, respondedAt: iso(a.respondedAt), codeAt: iso(a.codeAt), charged: a.charged })),
    messages: msgs.map((m) => ({ id: m.id, attemptId: m.attemptId, code: m.purgedAt ? null : m.code, text: m.purgedAt ? null : m.text, sender: m.sender, receivedAt: iso(m.receivedAt), purged: !!m.purgedAt })),
    noResend: complaintNoResend(atts),
    passed30d: passed.get(c.userId) ?? 0,
    passLimit: COMPLAINT_PASS_LIMIT,
    appealDeadline: bought ? iso(upstreamAppealDeadline(bought)) : null,
    actions: {
      approve: pending && (refundable || so?.state === 'REFUNDED'),
      reject: c.state === 'OPEN' && so?.state !== 'REFUNDED',
    },
  }
}

// ───────────────────────── 后台操作：通过（T16）/ 驳回 ─────────────────────────

export type ComplaintActionResult = { ok: boolean; status: number; message: string }

const REFUND_WHY: Record<string, string> = {
  MANUAL: '前提不满足（支付宝实收核对不上或预扣状态不对），订单已在人工处理中，请到「订单」里核实',
  RACE: '另一个操作刚处理了这张单，请刷新',
  ERROR: '前提不满足（支付宝实收核对不上或预扣状态不对），已记一条 REFUND_ERR 并告警，请到「订单」里核实',
  NOT_READY: '订单状态刚刚变化，请刷新',
}

/**
 * 通过并退款到余额（§7.5 → T16）。OPEN 先 CAS 成 APPROVING（与驳回互斥），再走引擎的售后退款；
 * 成功（或这张单已经是售后退款）→ finalize：APPROVING → REFUNDED + 同一事务写买家留言；没退成 → 退回 OPEN。
 */
export async function approveComplaint(id: number, adminId: number, note: string | null): Promise<ComplaintActionResult> {
  const c = await prisma.smsComplaint.findUnique({ where: { id } })
  if (!c) return { ok: false, status: 404, message: '售后申请不存在' }
  if (c.state === 'REFUNDED') return { ok: false, status: 409, message: '这条售后已经通过并退款' }
  if (c.state === 'REJECTED') return { ok: false, status: 409, message: '这条售后已经驳回（要退款请到「订单」里对这张单「售后退款到余额」）' }
  if (c.state === 'OPEN') {
    const w = await prisma.smsComplaint.updateMany({ where: { id, state: 'OPEN' }, data: { state: 'APPROVING', handledBy: adminId } })
    if (w.count !== 1) return { ok: false, status: 409, message: '另一个操作刚处理了这条售后，请刷新' }
  }
  let refunded = false
  let why = ''
  try {
    const so = await prisma.smsOrder.findUnique({ where: { id: c.smsOrderId } })
    if (!so) why = '接码单不存在'
    else if (so.state === 'REFUNDED') refunded = true
    else {
      const [order, atts] = await Promise.all([
        prisma.order.findUnique({ where: { id: so.orderId }, select: { payStatus: true } }),
        prisma.smsAttempt.findMany({ where: { smsOrderId: so.id }, select: { smsCount: true, codeAt: true, state: true } }),
      ])
      const manual = so.state === 'MANUAL'
      if (manual && !(order?.payStatus === 'PAID' && atts.some(hasCode))) why = '订单是人工处理中、而且没有收到过短信或没有付款，不能售后退款'
      else if (!manual && so.state !== 'RECEIVED' && so.state !== 'FINISHED') why = `订单当前是 ${so.state}，只有已收码 / 已完成的单能售后退款`
      else if (order?.payStatus !== 'PAID') why = '订单不是已付款状态'
      else {
        const r = await engine.adminRefund(so.id, adminId, 'COMPLAINT', { allowManual: manual })
        if (r.ok) refunded = true
        else {
          const again = await prisma.smsOrder.findUnique({ where: { id: so.id }, select: { state: true } })
          if (again?.state === 'REFUNDED') refunded = true
          else why = REFUND_WHY[r.why ?? ''] ?? '前提不满足'
        }
      }
    }
  } catch (e) {
    const again = await prisma.smsOrder.findUnique({ where: { id: c.smsOrderId }, select: { state: true } }).catch(() => null)
    if (again?.state !== 'REFUNDED') await prisma.smsComplaint.updateMany({ where: { id, state: 'APPROVING' }, data: { state: 'OPEN', handledBy: null } }).catch(() => undefined)
    throw e
  }
  if (!refunded) {
    await prisma.smsComplaint.updateMany({ where: { id, state: 'APPROVING' }, data: { state: 'OPEN', handledBy: null } })
    return { ok: false, status: 409, message: `没有退款：${why}（售后申请回到待处理）` }
  }
  await finalizeComplaintAfterRefund(c.orderId, adminId, note)
  return { ok: true, status: 200, message: '已通过：整单原路退回余额，成本照计（利润 = −成本）；结果已发到订单留言' }
}

/**
 * 这张单已经售后退款（REFUNDED）之后，把它还没收尾的售后申请收成 REFUNDED，并在同一事务里给买家写一条留言（带两格退回金额）。
 * 两个入口：售后申请「通过」、后台接码订单抽屉里直接「售后退款到余额」（opts.fromOrderDrawer：连已驳回的也改成通过——站长改了主意、钱已经退了，
 * 记录要和钱对得上，30 天通过次数也要算上）。返回是否本次收尾（CAS 赢了才写留言，重放不会写第二条）。
 */
export async function finalizeComplaintAfterRefund(orderId: number, adminId: number, note: string | null, opts: { fromOrderDrawer?: boolean } = {}): Promise<boolean> {
  const so = await prisma.smsOrder.findUnique({ where: { orderId }, select: { id: true, state: true, refundTopupCents: true, refundCashCents: true } })
  if (!so || so.state !== 'REFUNDED') return false
  const from = opts.fromOrderDrawer ? [...COMPLAINT_PENDING_STATES, 'REJECTED'] : [...COMPLAINT_PENDING_STATES]
  const n = (note ?? '').trim() || null
  return prisma.$transaction(async (tx) => {
    const w = await tx.smsComplaint.updateMany({
      where: { orderId, state: { in: from } },
      data: { state: 'REFUNDED', handledBy: adminId, handledAt: jnow(), ...(n ? { adminNote: n.slice(0, 500) } : {}) },
    })
    if (w.count !== 1) return false
    // order_messages 对 orders 有外键：插入会给订单行加共享锁；本事务不持有其他行锁，不会与资金事务成环
    await tx.orderMessage.create({
      data: {
        orderId,
        sender: 'ADMIN',
        content: approveMessageText(so.refundTopupCents ?? 0, so.refundCashCents ?? 0, n),
        readByAdmin: true,
        readByBuyer: false,
        senderRole: 'PLATFORM',
        senderUserId: adminId,
      },
    })
    await logEvent(tx, { smsOrderId: so.id, type: 'COMPLAINT_OK', actor: 'ADMIN', actorId: adminId, detail: { fromOrderDrawer: !!opts.fromOrderDrawer } })
    return true
  })
}

/** 驳回（§7.5：必填回复，会自动发到订单留言）。只收 OPEN；接码单已经售后退款的不能驳回。锁顺序：订单 → 接码单（共享锁，与 T16 互斥） */
export async function rejectComplaint(id: number, adminId: number, reply: string): Promise<ComplaintActionResult> {
  const text = reply.trim()
  if (text.length < 2) return { ok: false, status: 400, message: '请填写回复（会发到买家的订单留言里）' }
  const c = await prisma.smsComplaint.findUnique({ where: { id } })
  if (!c) return { ok: false, status: 404, message: '售后申请不存在' }
  if (c.state === 'APPROVING') return { ok: false, status: 409, message: '正在退款中，不能驳回（退款失败会回到待处理）' }
  if (c.state !== 'OPEN') return { ok: false, status: 409, message: c.state === 'REFUNDED' ? '这条售后已经通过并退款' : '这条售后已经驳回' }
  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM orders WHERE id = ${c.orderId} LOCK IN SHARE MODE`
        const rows = await tx.$queryRaw<{ state: string; refund_state: string }[]>`SELECT state, refund_state FROM sms_orders WHERE id = ${c.smsOrderId} LOCK IN SHARE MODE`
        if (rows[0]?.state === 'REFUNDED' || (rows[0] && rows[0].refund_state !== 'NONE')) throw new ComplaintRefused('STATE', '这张单已经退款了，不能驳回')
        const w = await tx.smsComplaint.updateMany({ where: { id, state: 'OPEN' }, data: { state: 'REJECTED', adminNote: text.slice(0, 500), handledBy: adminId, handledAt: jnow() } })
        if (w.count !== 1) throw new ComplaintRefused('STATE', '另一个操作刚处理了这条售后，请刷新')
        await tx.orderMessage.create({
          data: { orderId: c.orderId, sender: 'ADMIN', content: rejectMessageText(text), readByAdmin: true, readByBuyer: false, senderRole: 'PLATFORM', senderUserId: adminId },
        })
        await logEvent(tx, { smsOrderId: c.smsOrderId, type: 'COMPLAINT_REJECT', actor: 'ADMIN', actorId: adminId })
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 5_000, timeout: 10_000 },
    )
  } catch (e) {
    if (e instanceof ComplaintRefused) {
      if (e.message.includes('已经退款')) await finalizeComplaintAfterRefund(c.orderId, adminId, null).catch(() => false)
      return { ok: false, status: 409, message: e.message }
    }
    throw e
  }
  return { ok: true, status: 200, message: '已驳回，回复已发到买家的订单留言' }
}

/** 管理员打开了含短信内容的售后详情（§10.2：管理员查看短信内容时写一条 SmsEvent(ADMIN_VIEW)） */
export async function logComplaintView(smsOrderId: number, adminId: number, complaintId: number): Promise<void> {
  await logEventQuiet({ smsOrderId, type: 'ADMIN_VIEW', actor: 'ADMIN', actorId: adminId, detail: { complaintId } })
}

/** 号码页 / 记录页用：这张单的售后申请（买家可见的几个字段） */
export async function buyerComplaintRow(orderId: number) {
  return prisma.smsComplaint.findUnique({ where: { orderId }, select: { state: true, reason: true, detail: true, adminNote: true, createdAt: true, handledAt: true } })
}
