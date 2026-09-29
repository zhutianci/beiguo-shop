/**
 * 短信接码 · 我的接码记录（GET /api/jiema/orders，docs/短信接码-设计.md §1.11、§1.4 进行中提示条、§6.4、§10.2）。
 *
 * 【只查本人】一律 `sms_orders.user_id = 本人`，订单行再加 tenantId=1（接码只在主站，D11）；号码搜索的原生 SQL 同样带 user_id。
 * 【tab】全部 / 进行中 / 已完成 / 已退回（CANCELLED + REFUNDED）/ 未支付（CLOSED）——ui.recordStatesOf，与页面同一份定义。
 * 【日期】近 7 / 30 / 90 天（默认 30）按下单时间筛；**进行中的单不受日期筛选影响**（买家回来一定要能找回在途的单，E18）。
 * 【号码】完整号或后 4 位（ui.phoneQuery：只取数字；4 位按结尾匹配，更长按包含）。
 * 【白名单】每行经 dto.toJiemaRecordItem；不出成本、cap、系数、activationId、上游原文。每页 20 条，按下单时间倒序。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { VMQ_TIMEOUT_MIN } from '../vmq'
import { toJiemaRecordItem, type JiemaRecordItem, type SmsOrderStateView } from './dto'
import { flagOf, operatorDisplayName, readOperatorNames } from './catalog'
import { phoneParts, finishDueAt } from './machine'
import { buyerComplaintState } from './complaint-rules'
import { RECORD_ACTIVE_STATES, recordStatesOf, recordTabOf, type RecordTab } from './ui'
import { jnow } from './runtime'

export const RECORD_PAGE_SIZE = 20

export interface RecordQuery {
  tab: RecordTab
  days: number
  /** ui.phoneQuery 的结果（null = 不按号码筛） */
  phone: { digits: string; like: string } | null
  page: number
  pageSize?: number
}

export interface RecordPage {
  items: JiemaRecordItem[]
  total: number
  counts: Record<RecordTab, number>
  page: number
  pageSize: number
  hasMore: boolean
  serverNow: string
}

/** 号码筛选：本人名下、号码（不带 +，带区号）匹配的接码单 id（最多 500 个） */
async function idsByPhone(userId: number, like: string): Promise<number[]> {
  const rows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT DISTINCT a.sms_order_id AS id
      FROM sms_attempts a JOIN sms_orders o ON o.id = a.sms_order_id
     WHERE o.user_id = ${userId} AND a.phone LIKE ${like}
     LIMIT 500`
  return rows.map((r) => Number(r.id))
}

export async function listBuyerRecords(userId: number, q: RecordQuery): Promise<RecordPage> {
  const now = jnow()
  const pageSize = Math.min(Math.max(q.pageSize ?? RECORD_PAGE_SIZE, 1), 50)
  const page = Math.max(1, Math.trunc(q.page) || 1)
  const since = new Date(now.getTime() - q.days * 86400_000)
  const base: Prisma.SmsOrderWhereInput = {
    userId,
    // 日期只筛非进行中的单：进行中的单任何时候都列出来
    OR: [{ createdAt: { gte: since } }, { state: { in: [...RECORD_ACTIVE_STATES] } }],
  }
  if (q.phone) {
    const ids = await idsByPhone(userId, q.phone.like)
    base.id = { in: ids.length ? ids : [-1] }
  }
  const states = recordStatesOf(q.tab)
  const where: Prisma.SmsOrderWhereInput = states ? { AND: [base, { state: { in: states } }] } : base
  const [grouped, total, rows] = await Promise.all([
    prisma.smsOrder.groupBy({ by: ['state'], where: base, _count: { _all: true } }),
    prisma.smsOrder.count({ where }),
    prisma.smsOrder.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }),
  ])
  const counts: Record<RecordTab, number> = { all: 0, active: 0, done: 0, cancelled: 0, closed: 0 }
  for (const g of grouped) {
    const n = g._count._all
    counts.all += n
    counts[recordTabOf(g.state)] += n
  }
  const items = rows.length ? await buildItems(userId, rows, now) : []
  return { items, total, counts, page, pageSize, hasMore: page * pageSize < total, serverNow: now.toISOString() }
}

type SoRow = Awaited<ReturnType<typeof prisma.smsOrder.findMany>>[number]

async function buildItems(userId: number, rows: SoRow[], now: Date): Promise<JiemaRecordItem[]> {
  const soIds = rows.map((r) => r.id)
  const orderIds = rows.map((r) => r.orderId)
  const pendingIds = rows.filter((r) => r.state === 'PENDING_PAY').map((r) => r.orderId)
  const [orders, atts, msgs, holds, lates, complaints, countries, names, vmqs] = await Promise.all([
    prisma.order.findMany({ where: { id: { in: orderIds }, userId, tenantId: 1 }, select: { id: true, orderNo: true } }),
    prisma.smsAttempt.findMany({ where: { smsOrderId: { in: soIds } }, select: { id: true, smsOrderId: true, seq: true, phone: true, dialCode: true, smsCount: true } }),
    prisma.smsMessage.findMany({ where: { smsOrderId: { in: soIds }, purgedAt: null }, orderBy: { receivedAt: 'desc' }, select: { smsOrderId: true, code: true }, take: 500 }),
    prisma.balanceHold.findMany({ where: { orderId: { in: orderIds }, userId }, select: { orderId: true, state: true, topupCents: true, cashCents: true } }),
    prisma.balanceLog.findMany({ where: { userId, orderId: { in: orderIds }, type: 'LATEPAY' }, select: { orderId: true, topupDeltaCents: true } }),
    prisma.smsComplaint.findMany({ where: { orderId: { in: orderIds }, userId }, select: { orderId: true, state: true } }),
    prisma.smsCountry.findMany({ where: { id: { in: Array.from(new Set(rows.map((r) => r.country))) } }, select: { id: true, iso2: true, dialCode: true } }),
    rows.some((r) => r.operator) ? readOperatorNames() : Promise.resolve({} as Record<string, string>),
    pendingIds.length
      ? prisma.vmqOrder.findMany({
          where: { bizType: 'order', bizId: { in: pendingIds }, state: 0, createdAt: { gte: new Date(Date.now() - VMQ_TIMEOUT_MIN * 60_000) } },
          orderBy: { createdAt: 'desc' },
          select: { bizId: true, createdAt: true },
        })
      : Promise.resolve([] as Array<{ bizId: number; createdAt: Date }>),
  ])
  const om = new Map(orders.map((o) => [o.id, o.orderNo]))
  const cm = new Map(countries.map((c) => [c.id, c]))
  const out: JiemaRecordItem[] = []
  for (const so of rows) {
    const orderNo = om.get(so.orderId)
    if (!orderNo) continue // 订单行不是本人 / 不是主站：不列（理论上不会发生）
    const all = atts.filter((a) => a.smsOrderId === so.id)
    const mine = all.filter((a) => a.phone)
    const cur = mine.find((a) => a.id === so.currentAttemptId) ?? mine.slice().sort((a, b) => b.seq - a.seq)[0] ?? null
    const c = cm.get(so.country)
    const num = cur?.phone ? phoneParts(cur.phone, cur.dialCode ?? c?.dialCode ?? null) : null
    const code = msgs.find((m) => m.smsOrderId === so.id && m.code)?.code ?? null
    const hold = holds.find((h) => h.orderId === so.orderId)
    const late = lates.filter((l) => l.orderId === so.orderId).reduce((a, l) => a + l.topupDeltaCents, 0)
    const comp = complaints.find((x) => x.orderId === so.orderId)
    let deadline: Date | null = null
    if (so.state === 'PENDING_PAY' && so.payMode !== 'BALANCE') {
      const v = vmqs.find((x) => x.bizId === so.orderId)
      deadline = v ? new Date(v.createdAt.getTime() + VMQ_TIMEOUT_MIN * 60_000) : so.quoteExpiresAt
    } else if (so.state === 'WAITING' || so.state === 'REPLACING') deadline = so.waitUntil ?? so.endsAt
    else if (so.state === 'RECEIVED' && so.endsAt) deadline = finishDueAt(so.endsAt)
    out.push(
      toJiemaRecordItem({
        orderNo,
        state: so.state as SmsOrderStateView,
        service: { code: so.service, name: so.serviceName },
        country: { id: so.country, name: so.countryName, iso2: flagOf(so.country, c?.iso2 ?? null)?.toUpperCase() ?? null },
        operator: so.operator ? operatorDisplayName(so.operator, names) : null,
        priceCents: so.priceCents,
        payMode: so.payMode as JiemaRecordItem['payMode'],
        number: num && cur ? { dial: num.dial, national: num.national, seq: cur.seq } : null,
        code,
        smsCount: all.reduce((a, x) => a + x.smsCount, 0),
        createdAt: so.createdAt.toISOString(),
        deadline: deadline && deadline.getTime() > now.getTime() ? deadline.toISOString() : null,
        refundCents: so.refundState === 'DONE' ? (so.refundTopupCents ?? 0) + (so.refundCashCents ?? 0) : null,
        releasedCents: so.state === 'CLOSED' && hold?.state === 'RELEASED' ? hold.topupCents + hold.cashCents : null,
        lateCents: late,
        complaint: comp ? buyerComplaintState(comp.state) : null,
      }),
    )
  }
  return out
}
