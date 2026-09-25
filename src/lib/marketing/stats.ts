/**
 * 报表与查询：活动列表汇总、活动报表（含「为什么还没发」与归因）、收件人明细/导出、
 * 订阅统计与列表、用户营销记录。
 *
 * 归因口径（设计 11.1）：末次有效点击后 attributionDays 天内付款（PAID 且未取消），
 * 金额 Order.amount（不含税）；「影响」单列：已送达、未点击、送达后 5 天内付款。
 *
 * 【实现方：同步与公开端】签名是契约。
 *
 * 【归因现算，不碰下单链路】订单表上不加任何「来自哪个活动」的列：下单是钱路径，
 * 为了报表去改它不值得。代价是报表要把「点过的人」的全部营销点击与订单拉出来在 Node 里配对 ——
 * 一个活动的点击人数是几十到几千，这点计算量完全可以接受。
 *
 * 【末次点击是跨活动的】同一个人点了 A 活动、又点了 B 活动、然后下单，订单只算 B 的。
 * 所以配对时要载入这批用户在**所有**活动里的点击，而不只是当前活动的。
 *
 * 【点击时间点从哪来】每封信上存了首次点击 clickedAt 与末次点击 lastClickAt；
 * 90 天内还有逐次的 CLICK 事件（非机器）。三者合并就是这个人的点击时间线。
 * 90 天后事件被清理，只剩首末两个点 —— 那时归因窗口（≤30 天）早就过了，不影响结论。
 *
 * 比率一律是 0–1 的小数（保留 4 位）；分母为 0 时为 null（界面显示「—」）。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getConfig, getHalt, getSyncState, isDryRun, isHalted, backoffDomains, senderReady } from './config'
import { todayUsage } from './budget'
import { bjDateKey, bjDateTime, bjDayStart, inSendWindow, nextDayWindowStart, nextWindowStart } from './time'
import {
  CONSENT_STATUSES,
  MESSAGE_STATUSES,
  MESSAGE_STATUS_LABEL,
  SKIP_REASONS,
  SKIP_REASON_LABEL,
  SUPPRESSION_REASONS,
  TOPICS,
  clip,
  parseTopicsOff,
  type SyncState,
  type CampaignListItem,
  type CampaignReport,
  type CampaignStatus,
  type ConsentAction,
  type ConsentStatus,
  type DeliveryStatus,
  type MessageRow,
  type MessageStatus,
  type SkipReason,
  type SubscriberRow,
  type SubscriberStats,
  type SuppressionReason,
  type Topic,
  type UserMarketingSummary,
  type WaitingReason,
} from './types'

const DAY_MS = 86400_000
/** IN 查询每批的上限（MySQL 占位符与包大小都有上限） */
const CHUNK = 1000

/* ================================================================================================
 * 纯函数：归因（scripts/check-marketing-public.ts 断言）
 * ================================================================================================ */

/** 一次有效（非机器）营销点击 */
export interface ClickPoint {
  userId: number
  campaignId: number
  messageId: number
  at: Date
}

/** 参与归因的订单（调用方已筛好：PAID 且未取消、paidAt 非空） */
export interface OrderLite {
  id: number
  userId: number
  paidAt: Date
}

export interface Attribution {
  orderId: number
  userId: number
  campaignId: number
  messageId: number
  clickedAt: Date
}

function byTimeThenId(a: ClickPoint, b: ClickPoint): number {
  return a.at.getTime() - b.at.getTime() || a.messageId - b.messageId
}

/**
 * 末次点击归因：订单记给「该用户在付款前最近的一次营销点击」，且付款距那次点击不超过 days 天。
 * 最近那次点击超出窗口 → 不归因（不会退而求其次去找更早的点击：更早的只会更远）。
 * 同一时刻多次点击取 messageId 大的（确定性，测试可复现）。
 */
export function attributeOrders(clicks: ClickPoint[], orders: OrderLite[], days: number): Attribution[] {
  const windowMs = Math.max(0, days) * DAY_MS
  const byUser = new Map<number, ClickPoint[]>()
  for (const c of clicks) {
    if (!(c.at instanceof Date) || Number.isNaN(c.at.getTime())) continue
    const arr = byUser.get(c.userId)
    if (arr) arr.push(c)
    else byUser.set(c.userId, [c])
  }
  byUser.forEach((arr) => arr.sort(byTimeThenId))

  const out: Attribution[] = []
  for (const o of orders) {
    const arr = byUser.get(o.userId)
    if (!arr || !arr.length) continue
    const t = o.paidAt.getTime()
    // 二分：最后一个 at <= paidAt 的点击
    let lo = 0
    let hi = arr.length - 1
    let found = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (arr[mid].at.getTime() <= t) {
        found = mid
        lo = mid + 1
      } else hi = mid - 1
    }
    if (found < 0) continue
    const c = arr[found]
    if (t - c.at.getTime() > windowMs) continue
    out.push({ orderId: o.id, userId: o.userId, campaignId: c.campaignId, messageId: c.messageId, clickedAt: c.at })
  }
  return out
}

/** 已送达的一封信（用于「影响」口径） */
export interface DeliveredPoint {
  userId: number
  at: Date
}

/**
 * 「影响」：送达后 days 天内付款、且这笔订单没有被任何点击归因走。
 * 同一笔订单只算一次（哪怕这个人收到过多封）。返回订单 id。
 */
export function influencedOrders(delivered: DeliveredPoint[], orders: OrderLite[], days: number, exclude: Set<number>): number[] {
  const windowMs = Math.max(0, days) * DAY_MS
  const byUser = new Map<number, number[]>()
  for (const d of delivered) {
    const arr = byUser.get(d.userId)
    if (arr) arr.push(d.at.getTime())
    else byUser.set(d.userId, [d.at.getTime()])
  }
  const out: number[] = []
  for (const o of orders) {
    if (exclude.has(o.id)) continue
    const arr = byUser.get(o.userId)
    if (!arr) continue
    const t = o.paidAt.getTime()
    if (arr.some((at) => t >= at && t - at <= windowMs)) out.push(o.id)
  }
  return out
}

/** 比率：分母为 0 → null；保留 4 位小数 */
export function ratio(num: number, den: number): number | null {
  if (!den || !Number.isFinite(num) || !Number.isFinite(den)) return null
  return Math.round((num / den) * 10000) / 10000
}

/**
 * CSV 单元格：双引号转义；以 = + - @ 制表 回车 开头的前置单引号（防 Excel 公式注入 ——
 * 昵称是买家自己填的，「=HYPERLINK(...)」这种东西导出后在站长电脑上会被当公式执行）。
 */
export function csvCell(v: unknown): string {
  let s = v == null ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

/* ================================================================================================
 * 取数工具
 * ================================================================================================ */

function chunks<T>(arr: T[], n = CHUNK): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}

const PAID_ORDER_WHERE = { payStatus: 'PAID' as const, deliveryStatus: { not: 'CANCELLED' as const }, paidAt: { not: null } }

interface OrderRow {
  id: number
  orderNo: string
  userId: number
  productName: string
  amount: Prisma.Decimal
  paidAt: Date | null
}

async function loadPaidOrders(userIds: number[], since: Date | null): Promise<OrderRow[]> {
  const out: OrderRow[] = []
  for (const part of chunks(uniq(userIds))) {
    const rows = await prisma.order.findMany({
      where: {
        userId: { in: part },
        ...PAID_ORDER_WHERE,
        ...(since ? { paidAt: { gte: since } } : {}),
      },
      select: { id: true, orderNo: true, userId: true, productName: true, amount: true, paidAt: true },
    })
    out.push(...rows)
  }
  return out
}

function toOrderLite(rows: OrderRow[]): OrderLite[] {
  const out: OrderLite[] = []
  for (const r of rows) if (r.paidAt) out.push({ id: r.id, userId: r.userId, paidAt: r.paidAt })
  return out
}

/** 这批用户在所有活动里的有效点击时间线（首次 + 末次 + 90 天内逐次事件） */
async function loadClickPoints(userIds: number[]): Promise<ClickPoint[]> {
  const points: ClickPoint[] = []
  for (const part of chunks(uniq(userIds))) {
    const msgs = await prisma.marketingMessage.findMany({
      where: { userId: { in: part }, clickedAt: { not: null } },
      select: { id: true, campaignId: true, userId: true, clickedAt: true, lastClickAt: true },
    })
    const byId = new Map<number, { campaignId: number; userId: number }>()
    for (const m of msgs) {
      if (m.userId == null) continue
      byId.set(m.id, { campaignId: m.campaignId, userId: m.userId })
      if (m.clickedAt) points.push({ userId: m.userId, campaignId: m.campaignId, messageId: m.id, at: m.clickedAt })
      if (m.lastClickAt && (!m.clickedAt || m.lastClickAt.getTime() !== m.clickedAt.getTime())) {
        points.push({ userId: m.userId, campaignId: m.campaignId, messageId: m.id, at: m.lastClickAt })
      }
    }
    for (const idPart of chunks(Array.from(byId.keys()))) {
      const events = await prisma.marketingEvent.findMany({
        where: { messageId: { in: idPart }, type: 'CLICK', bot: false },
        select: { messageId: true, createdAt: true },
      })
      for (const e of events) {
        const m = byId.get(e.messageId)
        if (m) points.push({ userId: m.userId, campaignId: m.campaignId, messageId: e.messageId, at: e.createdAt })
      }
    }
  }
  return points
}

interface CampaignAttribution {
  orders: { order: OrderRow; clickedAt: Date; messageId: number }[]
  revenue: Prisma.Decimal
}

/** 一批活动的点击归因。结果只含 campaignIds 里的活动 */
async function attributionFor(campaignIds: number[], days: number): Promise<Map<number, CampaignAttribution>> {
  const result = new Map<number, CampaignAttribution>()
  for (const id of campaignIds) result.set(id, { orders: [], revenue: new Prisma.Decimal(0) })
  if (!campaignIds.length) return result

  const clickers = await prisma.marketingMessage.findMany({
    where: { campaignId: { in: campaignIds }, clickedAt: { not: null }, userId: { not: null } },
    select: { userId: true },
    distinct: ['userId'],
  })
  const userIds = clickers.map((c) => c.userId).filter((x): x is number => x != null)
  if (!userIds.length) return result

  const points = await loadClickPoints(userIds)
  if (!points.length) return result
  const earliest = points.reduce((m, p) => (p.at < m ? p.at : m), points[0].at)
  const orderRows = await loadPaidOrders(userIds, earliest)
  const orderById = new Map<number, OrderRow>()
  for (const o of orderRows) orderById.set(o.id, o)

  for (const a of attributeOrders(points, toOrderLite(orderRows), days)) {
    const bucket = result.get(a.campaignId)
    const order = orderById.get(a.orderId)
    if (!bucket || !order) continue
    bucket.orders.push({ order, clickedAt: a.clickedAt, messageId: a.messageId })
    bucket.revenue = bucket.revenue.plus(order.amount)
  }
  return result
}

async function attributionDays(): Promise<number> {
  const cfg = await getConfig()
  return cfg.attributionDays
}

/* ================================================================================================
 * 活动列表
 * ================================================================================================ */

function emptyCounts() {
  return { sent: 0, failed: 0, skipped: 0, queued: 0, unknown: 0 }
}

export async function listCampaigns(q: {
  page: number
  pageSize: number
  status?: CampaignStatus | null
  keyword?: string | null
}): Promise<{ list: CampaignListItem[]; total: number }> {
  const pageSize = Math.min(100, Math.max(1, Math.floor(q.pageSize) || 20))
  const page = Math.max(1, Math.floor(q.page) || 1)
  const where: Prisma.MarketingCampaignWhereInput = {}
  if (q.status) where.status = q.status
  const kw = (q.keyword || '').trim()
  if (kw) {
    const or: Prisma.MarketingCampaignWhereInput[] = [{ name: { contains: kw } }, { subject: { contains: kw } }]
    const n = Number(kw.replace(/^#/, ''))
    if (Number.isInteger(n) && n > 0) or.push({ id: n })
    where.OR = or
  }

  const [rows, total] = await Promise.all([
    prisma.marketingCampaign.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        topic: true,
        status: true,
        statusNote: true,
        subject: true,
        scheduledAt: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        recipientCount: true,
      },
    }),
    prisma.marketingCampaign.count({ where }),
  ])
  const ids = rows.map((r) => r.id)
  if (!ids.length) return { list: [], total }

  // 只对「这一页」的活动做聚合，全部走 (campaignId, status, sortKey) 前缀索引
  const [byStatus, byDelivery, clicks, unsubs, complaints, days] = await Promise.all([
    prisma.marketingMessage.groupBy({ by: ['campaignId', 'status'], where: { campaignId: { in: ids } }, _count: { _all: true } }),
    prisma.marketingMessage.groupBy({
      by: ['campaignId', 'delivery'],
      where: { campaignId: { in: ids }, delivery: { not: null } },
      _count: { _all: true },
    }),
    prisma.marketingMessage.groupBy({ by: ['campaignId'], where: { campaignId: { in: ids }, clickedAt: { not: null } }, _count: { _all: true } }),
    prisma.marketingMessage.groupBy({
      by: ['campaignId'],
      where: { campaignId: { in: ids }, unsubscribedAt: { not: null } },
      _count: { _all: true },
    }),
    prisma.marketingMessage.groupBy({
      by: ['campaignId'],
      where: { campaignId: { in: ids }, complainedAt: { not: null } },
      _count: { _all: true },
    }),
    attributionDays(),
  ])
  const attribution = await attributionFor(ids, days)

  const counts = new Map<number, ReturnType<typeof emptyCounts>>()
  for (const r of byStatus) {
    const c = counts.get(r.campaignId) || emptyCounts()
    const n = r._count._all
    if (r.status === 'SENT') c.sent += n
    else if (r.status === 'FAILED') c.failed += n
    else if (r.status === 'SKIPPED') c.skipped += n
    else if (r.status === 'UNKNOWN') c.unknown += n
    else if (r.status === 'QUEUED' || r.status === 'CLAIMED' || r.status === 'SENDING') c.queued += n
    counts.set(r.campaignId, c)
  }
  const delivered = new Map<number, number>()
  for (const r of byDelivery) if (r.delivery === 'DELIVERED') delivered.set(r.campaignId, r._count._all)
  const toMap = (arr: { campaignId: number; _count: { _all: number } }[]) => {
    const m = new Map<number, number>()
    for (const r of arr) m.set(r.campaignId, r._count._all)
    return m
  }
  const clickMap = toMap(clicks)
  const unsubMap = toMap(unsubs)
  const complaintMap = toMap(complaints)

  const list: CampaignListItem[] = rows.map((r) => {
    const a = attribution.get(r.id)
    return {
      id: r.id,
      name: r.name,
      topic: (TOPICS as readonly string[]).includes(r.topic) ? (r.topic as Topic) : 'PROMO',
      status: r.status as CampaignStatus,
      statusNote: r.statusNote,
      subject: r.subject,
      scheduledAt: iso(r.scheduledAt),
      startedAt: iso(r.startedAt),
      completedAt: iso(r.completedAt),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      recipientCount: r.recipientCount,
      counts: counts.get(r.id) || emptyCounts(),
      delivered: delivered.get(r.id) || 0,
      uniqueClicks: clickMap.get(r.id) || 0,
      unsubscribes: unsubMap.get(r.id) || 0,
      complaints: complaintMap.get(r.id) || 0,
      orders: a ? a.orders.length : 0,
      revenue: a ? a.revenue.toFixed(2) : '0.00',
    }
  })
  return { list, total }
}

/* ================================================================================================
 * 活动报表
 * ================================================================================================ */

export async function campaignReport(id: number): Promise<CampaignReport | null> {
  const row = await prisma.marketingCampaign.findUnique({ where: { id } })
  if (!row) return null
  // 活动详情的形状与指纹口径只在 campaign-repo 定义一次（doc 规范化 + contentHash）。
  // 动态 import：报表之外（公开端点、纯函数自测）不必把编辑器那一整套依赖拉进来
  const { toCampaignDetail } = await import('./campaign-repo')
  const campaign = toCampaignDetail(row)
  const days = await attributionDays()

  const [byStatus, byDelivery, byReason, opens, clicks, unsubs, complaints, botClicks, links, audits] = await Promise.all([
    prisma.marketingMessage.groupBy({ by: ['status'], where: { campaignId: id }, _count: { _all: true } }),
    prisma.marketingMessage.groupBy({ by: ['delivery'], where: { campaignId: id, delivery: { not: null } }, _count: { _all: true } }),
    prisma.marketingMessage.groupBy({ by: ['skipReason'], where: { campaignId: id, status: 'SKIPPED' }, _count: { _all: true } }),
    // 打开数不可靠（图片代理、隐私保护），点击了必然打开过 —— 两者取并集，点开率不会 >100%
    prisma.marketingMessage.count({ where: { campaignId: id, OR: [{ openedAt: { not: null } }, { clickedAt: { not: null } }] } }),
    prisma.marketingMessage.count({ where: { campaignId: id, clickedAt: { not: null } } }),
    prisma.marketingMessage.count({ where: { campaignId: id, unsubscribedAt: { not: null } } }),
    prisma.marketingMessage.count({ where: { campaignId: id, complainedAt: { not: null } } }),
    prisma.marketingEvent.count({ where: { campaignId: id, type: 'CLICK', bot: true } }),
    prisma.marketingLink.findMany({ where: { campaignId: id }, orderBy: [{ clicks: 'desc' }, { idx: 'asc' }], take: 100 }),
    prisma.marketingAudit.findMany({ where: { campaignId: id }, orderBy: { id: 'asc' }, take: 300 }),
  ])

  const st: Partial<Record<MessageStatus, number>> = {}
  let recipients = 0
  for (const r of byStatus) {
    st[r.status as MessageStatus] = (st[r.status as MessageStatus] || 0) + r._count._all
    recipients += r._count._all
  }
  const dv: Partial<Record<DeliveryStatus, number>> = {}
  for (const r of byDelivery) if (r.delivery) dv[r.delivery as DeliveryStatus] = r._count._all
  const skipReasons: Partial<Record<SkipReason, number>> = {}
  for (const r of byReason) {
    if (r.skipReason && (SKIP_REASONS as readonly string[]).includes(r.skipReason)) {
      skipReasons[r.skipReason as SkipReason] = r._count._all
    }
  }

  const sent = st.SENT || 0
  const unknown = st.UNKNOWN || 0
  const queued = (st.QUEUED || 0) + (st.CLAIMED || 0) + (st.SENDING || 0)
  const done = sent + unknown + (st.FAILED || 0)
  const delivered = dv.DELIVERED || 0
  const invalid = dv.INVALID || 0
  const spam = dv.SPAM || 0
  const results = delivered + invalid + spam + (dv.FAILED || 0)
  // 「失败」= 阿里云拒发（行 FAILED）+ 已发出但投递失败（回执 status 4）
  const failed = (st.FAILED || 0) + (dv.FAILED || 0)
  // 点击率等的分母：有送达回执就用送达数，回执还没回来时先用已发出数（含结果未知）
  const base = delivered > 0 ? delivered : sent + unknown

  // ---- 归因 ----
  const attr = (await attributionFor([id], days)).get(id) || { orders: [], revenue: new Prisma.Decimal(0) }
  const influenced = await influencedFor(id, days)

  const emailByUser = new Map<number, string>()
  if (attr.orders.length) {
    const msgs = await prisma.marketingMessage.findMany({
      where: { campaignId: id, userId: { in: uniq(attr.orders.map((o) => o.order.userId)) } },
      select: { userId: true, email: true },
    })
    for (const m of msgs) if (m.userId != null) emailByUser.set(m.userId, m.email)
  }
  const orders = attr.orders
    .slice()
    .sort((a, b) => (b.order.paidAt?.getTime() || 0) - (a.order.paidAt?.getTime() || 0))
    .slice(0, 100)
    .map((o) => ({
      orderNo: o.order.orderNo,
      userId: o.order.userId,
      email: emailByUser.get(o.order.userId) || '',
      productName: o.order.productName,
      amount: o.order.amount.toFixed(2),
      paidAt: iso(o.order.paidAt) || '',
      clickedAt: o.clickedAt.toISOString(),
    }))

  // ---- 审计时间线 ----
  const actorIds = uniq(audits.map((a) => a.actorId).filter((x): x is number => x != null))
  const actors = new Map<number, string>()
  if (actorIds.length) {
    const users = await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, nickname: true, email: true } })
    for (const u of users) actors.set(u.id, u.nickname || u.email || `#${u.id}`)
  }
  const timeline = audits.map((a) => ({
    at: a.createdAt.toISOString(),
    action: a.action,
    actor: a.actorId != null ? actors.get(a.actorId) || `#${a.actorId}` : null,
    detail: a.detail ? clip(a.detail, 500) : null,
  }))

  // ---- 直发券 ----
  let coupon: CampaignReport['coupon'] = null
  if (row.couponId) {
    const [c, granted, used] = await Promise.all([
      prisma.coupon.findUnique({ where: { id: row.couponId }, select: { id: true, code: true } }),
      prisma.couponGrant.count({ where: { couponId: row.couponId } }),
      prisma.couponGrant.count({ where: { couponId: row.couponId, state: 'USED' } }),
    ])
    if (c) coupon = { id: c.id, code: c.code, granted, used }
  }

  const total = done + queued
  return {
    campaign,
    waiting: await waitingReason(id),
    progress: {
      total,
      done,
      queued,
      percent: total > 0 ? Math.floor((done * 100) / total) : campaign.status === 'COMPLETED' ? 100 : 0,
    },
    funnel: {
      recipients,
      sent,
      delivered,
      invalid,
      spam,
      failed,
      unknown,
      skipped: st.SKIPPED || 0,
      uniqueOpens: opens,
      uniqueClicks: clicks,
      botClicks,
      unsubscribes: unsubs,
      complaints,
      orders: attr.orders.length,
      revenue: attr.revenue.toFixed(2),
      influencedOrders: influenced.count,
      influencedRevenue: influenced.revenue.toFixed(2),
    },
    rates: {
      deliveryRate: ratio(delivered, results),
      clickRate: ratio(clicks, base),
      clickToOpen: ratio(clicks, opens),
      unsubscribeRate: ratio(unsubs, base),
      complaintRate: ratio(complaints, base),
      invalidRate: ratio(invalid, results),
    },
    skipReasons,
    links: links.map((l) => ({ idx: l.idx, url: l.url, label: l.label, clicks: l.clicks })),
    orders,
    timeline,
    coupon,
  }
}

/** 「影响」：本活动已送达、没点击的收件人，送达后 days 天内付款（且没被任何点击归因走） */
async function influencedFor(campaignId: number, days: number): Promise<{ count: number; revenue: Prisma.Decimal }> {
  const zero = { count: 0, revenue: new Prisma.Decimal(0) }
  const msgs = await prisma.marketingMessage.findMany({
    where: { campaignId, delivery: 'DELIVERED', clickedAt: null, userId: { not: null } },
    select: { userId: true, deliveryAt: true, sentAt: true },
  })
  const delivered: DeliveredPoint[] = []
  for (const m of msgs) {
    const at = m.deliveryAt || m.sentAt
    if (m.userId != null && at) delivered.push({ userId: m.userId, at })
  }
  if (!delivered.length) return zero
  const userIds = uniq(delivered.map((d) => d.userId))
  const since = delivered.reduce((min, d) => (d.at < min ? d.at : min), delivered[0].at)
  const orderRows = await loadPaidOrders(userIds, since)
  if (!orderRows.length) return zero

  // 这批人的订单里，已被（任何活动的）点击归因走的不再算「影响」，避免同一笔钱记两次
  const points = await loadClickPoints(userIds)
  const attributed = new Set(attributeOrders(points, toOrderLite(orderRows), days).map((a) => a.orderId))
  const ids = new Set(influencedOrders(delivered, toOrderLite(orderRows), days, attributed))
  let revenue = new Prisma.Decimal(0)
  for (const o of orderRows) if (ids.has(o.id)) revenue = revenue.plus(o.amount)
  return { count: ids.size, revenue }
}

/* ================================================================================================
 * 为什么还没发
 * ================================================================================================ */

/** 「为什么还没发」：急停 / 关闭 / 时段外 / 今日额度用完 / 试探等待 / 排队 / 定时未到 / 暂停 … */
export async function waitingReason(campaignId: number): Promise<WaitingReason> {
  const now = new Date()
  const c = await prisma.marketingCampaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      status: true,
      statusNote: true,
      scheduledAt: true,
      materializedAt: true,
      startedAt: true,
      canaryDay: true,
      breakerResetAt: true,
    },
  })
  if (!c) return { code: 'none', text: '活动不存在' }
  switch (c.status) {
    case 'DRAFT':
      return { code: 'none', text: '草稿，尚未发送' }
    case 'COMPLETED':
      return { code: 'none', text: '已全部发送完毕' }
    case 'CANCELLED':
      return { code: 'none', text: '活动已取消' }
    case 'PAUSED':
      return { code: 'paused', text: c.statusNote ? `已暂停：${c.statusNote}` : '已暂停，点「继续发送」后恢复' }
  }

  if (c.status === 'SCHEDULED' && c.scheduledAt && c.scheduledAt.getTime() > now.getTime()) {
    return { code: 'scheduled', text: `定时发送，${bjDateTime(c.scheduledAt)} 开始`, until: c.scheduledAt.toISOString() }
  }

  // 下面的全局状态读失败时回落默认值（getConfig/getHalt 非 strict）：这里只是展示，
  // 真正发不发由 worker 的 strict 读决定
  const [config, halt] = await Promise.all([getConfig(), getHalt()])
  if (!config.enabled) return { code: 'disabled', text: '「发送设置」里的总开关已关闭，所有活动暂停发送' }
  if (isHalted(halt, now)) {
    const until = halt.until && !Number.isNaN(Date.parse(halt.until)) ? halt.until : null
    return {
      code: 'halted',
      text: `全局急停中${halt.reason ? `：${halt.reason}` : ''}${until ? `（到 ${bjDateTime(new Date(until))}）` : ''}`,
      until,
    }
  }
  const win = config.sendWindow
  if (!inSendWindow(win, now)) {
    const next = nextWindowStart(win, now)
    return {
      code: 'window',
      text: `不在发送时段（每天 ${win.start}:00–${win.end}:00），${bjDateTime(next)} 自动开始`,
      until: next.toISOString(),
    }
  }
  // 审查 C18：worker 在这几处也会停（gateReason 的 no_contact / no_sender、syncHealth 的 sync_unreadable）。
  // 这里不报，页面就只剩一个「发送中」徽章、进度不动、没有任何解释。code 不能是 'none'（报表页不显示 none）
  if (!config.contactEmail) {
    return { code: 'disabled', text: '「发送设置」里的联系邮箱未填写（页脚的法定联系方式），已停止发送；填写后自动继续' }
  }
  if (!senderReady()) {
    return {
      code: 'disabled',
      text: '营销发信地址（服务器环境变量 ALIYUN_DM_MARKETING）或阿里云 AccessKey 未配置，已停止发送；配置好并重启后自动继续',
    }
  }
  // 与 worker 一样严格读：读坏了 worker 就停发，这里若回落空状态，只会在 60 分钟后给出一个指错方向的「同步超时」
  let sync: SyncState | null = null
  if (!isDryRun()) {
    try {
      sync = await getSyncState({ strict: true })
    } catch {
      return { code: 'sync', text: '回执同步状态（mkt_sync）读取失败，为安全起见已停止发送（到「发送设置」查看同步状态）' }
    }
  }

  if (c.status === 'SCHEDULED') return { code: 'queue', text: '正在准备收件人名单，一两分钟内开始发送' }

  // ---- 以下都是 SENDING ----
  if (sync) {
    const lastOk = sync.lastOkAt ? Date.parse(sync.lastOkAt) : NaN
    const stale = Number.isNaN(lastOk)
      ? !!c.startedAt && now.getTime() - c.startedAt.getTime() > 60 * 60_000
      : now.getTime() - lastOk > 60 * 60_000
    if (stale) {
      return { code: 'sync', text: '阿里云回执同步已超过 60 分钟没有成功，为安全起见暂停发送（到「发送设置」查看同步状态）' }
    }
  }

  try {
    const usage = await todayUsage(config, now)
    if (usage.used >= usage.limit) {
      const next = nextDayWindowStart(win, now)
      return {
        code: 'budget',
        text: `今日额度已用完（${usage.used}/${usage.limit}），${bjDateTime(next)} 继续`,
        until: next.toISOString(),
      }
    }
  } catch (e) {
    console.error('[marketing/stats] 读取今日额度失败:', (e as Error)?.message)
  }

  const remaining = await prisma.marketingMessage.groupBy({
    by: ['status'],
    where: { campaignId, status: { in: ['QUEUED', 'CLAIMED', 'SENDING'] } },
    _count: { _all: true },
  })
  const left = remaining.reduce((s, r) => s + r._count._all, 0)
  if (left === 0) return { code: 'none', text: '剩余邮件正在收尾，马上完成' }

  // 试探：这一批（今天，或今天恢复发送之后）已发 ≥ canarySize 且今天还没放行 → 等回执。
  // 审查 C0：计数起点与 worker 的 canaryGate 相同 = max(北京今天 0 点, breakerResetAt)。
  // 当天暂停后恢复，试探要重新做一批：从恢复那一刻数起，否则恢复后 worker 在发新的一批，这里却说在等回执
  const today = bjDateKey(now)
  if (c.canaryDay !== today) {
    const dayStart = bjDayStart(now)
    const resumed = !!c.breakerResetAt && c.breakerResetAt.getTime() > dayStart.getTime()
    const windowStart = resumed ? (c.breakerResetAt as Date) : dayStart
    const sentBatch = await prisma.marketingMessage.count({
      where: {
        campaignId,
        status: { in: ['SENT', 'SENDING', 'UNKNOWN'] },
        OR: [{ sentAt: { gte: windowStart } }, { sentAt: null, claimedAt: { gte: windowStart } }],
      },
    })
    if (sentBatch >= config.canarySize) {
      return {
        code: 'canary',
        text: `${resumed ? '恢复发送后' : '今天'}先发出的 ${sentBatch} 封正在等待投递回执（最多约 30 分钟），回执正常后自动继续`,
      }
    }
  }

  // 先来先发：前面还有可发的活动
  const ahead = await prisma.marketingCampaign.findMany({
    where: { status: 'SENDING', id: { lt: campaignId } },
    select: { id: true },
    orderBy: { id: 'asc' },
    take: 20,
  })
  for (const a of ahead) {
    const ready = await prisma.marketingMessage.count({
      where: { campaignId: a.id, status: 'QUEUED', OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] },
    })
    if (ready > 0) return { code: 'queue', text: `排在活动 #${a.id} 之后（先来先发）` }
  }

  const readyWhere: Prisma.MarketingMessageWhereInput = {
    campaignId,
    status: 'QUEUED',
    OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
  }
  const readyCount = await prisma.marketingMessage.count({ where: readyWhere })
  if (readyCount === 0) {
    const next = await prisma.marketingMessage.findFirst({
      where: { campaignId, status: 'QUEUED', nextAttemptAt: { gt: now } },
      orderBy: { nextAttemptAt: 'asc' },
      select: { nextAttemptAt: true, attempts: true },
    })
    if (next?.nextAttemptAt) {
      return next.attempts > 0
        ? { code: 'backoff', text: `上次发送没成功，${bjDateTime(next.nextAttemptAt)} 自动重试`, until: next.nextAttemptAt.toISOString() }
        : {
            code: 'freq',
            text: `剩下的收件人距上一封营销邮件不足 ${config.freq.minHours} 小时，已自动延后到 ${bjDateTime(next.nextAttemptAt)}`,
            until: next.nextAttemptAt.toISOString(),
          }
    }
    return { code: 'none', text: '剩余邮件正在收尾，马上完成' }
  }

  // 收件域名退避（回执里出现频率限制类错误时，sync 会让该域名歇 1 小时）
  const syncForBackoff = sync ?? (await getSyncState())
  const backing = backoffDomains(syncForBackoff, now)
  if (backing.length) {
    const domains = await prisma.marketingMessage.groupBy({ by: ['domain'], where: readyWhere, _count: { _all: true } })
    const set = new Set(backing)
    if (domains.length && domains.every((d) => set.has(d.domain.toLowerCase()))) {
      let until: number | null = null
      for (const d of domains) {
        const t = Date.parse(syncForBackoff.domainBackoff[d.domain.toLowerCase()] || '')
        if (!Number.isNaN(t) && (until == null || t < until)) until = t
      }
      return {
        code: 'backoff',
        text: '收件方邮箱服务商提示发送过快，已自动放慢，稍后继续',
        until: until != null ? new Date(until).toISOString() : null,
      }
    }
  }

  return { code: 'none', text: `正在发送（每秒至多 ${config.ratePerSec} 封），剩余 ${left} 封` }
}

/* ================================================================================================
 * 收件人明细 / 导出
 * ================================================================================================ */

export interface MessageQuery {
  page: number
  pageSize: number
  status?: MessageStatus | null
  keyword?: string | null
  filter?: 'clicked_no_order' | null
}

const MESSAGE_SELECT = {
  id: true,
  userId: true,
  email: true,
  status: true,
  skipReason: true,
  sentAt: true,
  delivery: true,
  deliveryDetail: true,
  errorCode: true,
  openedAt: true,
  clickedAt: true,
  lastClickAt: true,
  clickCount: true,
  unsubscribedAt: true,
  complainedAt: true,
} satisfies Prisma.MarketingMessageSelect

type MessageSelected = Prisma.MarketingMessageGetPayload<{ select: typeof MESSAGE_SELECT }>

/**
 * 「点了没买」：点过本活动的链接，且从首次点击到末次点击后 attributionDays 天内没有付款订单。
 * 返回这些消息的 id（升序）。点击人数是几十到几千，在 Node 里配对即可。
 */
async function clickedNoOrderIds(campaignId: number): Promise<number[]> {
  const days = await attributionDays()
  const msgs = await prisma.marketingMessage.findMany({
    where: { campaignId, clickedAt: { not: null } },
    select: { id: true, userId: true, clickedAt: true, lastClickAt: true },
    orderBy: { id: 'asc' },
  })
  if (!msgs.length) return []
  const userIds = uniq(msgs.map((m) => m.userId).filter((x): x is number => x != null))
  const since = msgs.reduce((min, m) => (m.clickedAt && m.clickedAt < min ? m.clickedAt : min), msgs[0].clickedAt as Date)
  const orders = await loadPaidOrders(userIds, since)
  const byUser = new Map<number, number[]>()
  for (const o of orders) {
    if (!o.paidAt) continue
    const arr = byUser.get(o.userId)
    if (arr) arr.push(o.paidAt.getTime())
    else byUser.set(o.userId, [o.paidAt.getTime()])
  }
  const out: number[] = []
  for (const m of msgs) {
    if (m.userId == null || !m.clickedAt) {
      out.push(m.id) // 没有账户的收件人不可能下单
      continue
    }
    const from = m.clickedAt.getTime()
    const to = (m.lastClickAt || m.clickedAt).getTime() + days * DAY_MS
    const paid = (byUser.get(m.userId) || []).some((t) => t >= from && t <= to)
    if (!paid) out.push(m.id)
  }
  return out
}

async function messageWhere(
  campaignId: number,
  q: Omit<MessageQuery, 'page' | 'pageSize'>
): Promise<Prisma.MarketingMessageWhereInput | null> {
  const where: Prisma.MarketingMessageWhereInput = { campaignId }
  if (q.status && (MESSAGE_STATUSES as readonly string[]).includes(q.status)) where.status = q.status
  const kw = (q.keyword || '').trim().toLowerCase()
  if (kw) where.email = { contains: kw }
  if (q.filter === 'clicked_no_order') {
    const ids = await clickedNoOrderIds(campaignId)
    if (!ids.length) return null
    where.id = { in: ids }
  }
  return where
}

async function nicknames(userIds: number[]): Promise<Map<number, string | null>> {
  const m = new Map<number, string | null>()
  for (const part of chunks(uniq(userIds))) {
    const users = await prisma.user.findMany({ where: { id: { in: part } }, select: { id: true, nickname: true } })
    for (const u of users) m.set(u.id, u.nickname)
  }
  return m
}

function toMessageRow(r: MessageSelected, nick: Map<number, string | null>): MessageRow {
  return {
    id: r.id,
    userId: r.userId,
    email: r.email,
    nickname: r.userId != null ? nick.get(r.userId) ?? null : null,
    status: r.status as MessageStatus,
    skipReason: (r.skipReason as SkipReason | null) ?? null,
    sentAt: iso(r.sentAt),
    delivery: (r.delivery as DeliveryStatus | null) ?? null,
    deliveryDetail: r.deliveryDetail,
    errorCode: r.errorCode,
    openedAt: iso(r.openedAt),
    clickedAt: iso(r.clickedAt),
    clickCount: r.clickCount,
    unsubscribedAt: iso(r.unsubscribedAt),
    complainedAt: iso(r.complainedAt),
  }
}

export async function listMessages(campaignId: number, q: MessageQuery): Promise<{ list: MessageRow[]; total: number }> {
  const pageSize = Math.min(200, Math.max(1, Math.floor(q.pageSize) || 50))
  const page = Math.max(1, Math.floor(q.page) || 1)
  const where = await messageWhere(campaignId, q)
  if (!where) return { list: [], total: 0 }
  const [rows, total] = await Promise.all([
    prisma.marketingMessage.findMany({
      where,
      // 按发送顺序看：先发的在前（sortKey 就是发送优先级），同层按 id
      orderBy: [{ sortKey: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: MESSAGE_SELECT,
    }),
    prisma.marketingMessage.count({ where }),
  ])
  const nick = await nicknames(rows.map((r) => r.userId).filter((x): x is number => x != null))
  return { list: rows.map((r) => toMessageRow(r, nick)), total }
}

export const CSV_MAX_ROWS = 20000

const DELIVERY_LABEL: Record<DeliveryStatus, string> = {
  DELIVERED: '已送达',
  INVALID: '无效地址',
  SPAM: '判为垃圾邮件',
  FAILED: '投递失败',
}

function csvTime(d: Date | null): string {
  return d ? bjDateTime(d) : ''
}

/** CSV（UTF-8 BOM，Excel 直接打开不乱码）；最多 20000 行 */
export async function messagesCsv(campaignId: number, q: Omit<MessageQuery, 'page' | 'pageSize'>): Promise<string> {
  const header = [
    '邮箱',
    '昵称',
    '用户ID',
    '状态',
    '跳过原因',
    '发送时间（北京）',
    '投递结果',
    '投递详情',
    '错误码',
    '打开时间',
    '首次点击',
    '末次点击',
    '点击次数',
    '退订时间',
    '投诉时间',
  ]
  const lines: string[] = [header.map(csvCell).join(',')]
  const where = await messageWhere(campaignId, q)
  if (where) {
    // 分批取，避免一次把 2 万行连同所有列读进内存再排序
    let lastId = 0
    let taken = 0
    while (taken < CSV_MAX_ROWS) {
      const batch = await prisma.marketingMessage.findMany({
        where: { AND: [where, { id: { gt: lastId } }] },
        orderBy: { id: 'asc' },
        take: Math.min(2000, CSV_MAX_ROWS - taken),
        select: MESSAGE_SELECT,
      })
      if (!batch.length) break
      const nick = await nicknames(batch.map((r) => r.userId).filter((x): x is number => x != null))
      for (const r of batch) {
        lines.push(
          [
            r.email,
            r.userId != null ? nick.get(r.userId) ?? '' : '',
            r.userId ?? '',
            MESSAGE_STATUS_LABEL[r.status as MessageStatus] || r.status,
            r.skipReason ? SKIP_REASON_LABEL[r.skipReason as SkipReason] || r.skipReason : '',
            csvTime(r.sentAt),
            r.delivery ? DELIVERY_LABEL[r.delivery as DeliveryStatus] || r.delivery : '',
            r.deliveryDetail || '',
            r.errorCode || '',
            csvTime(r.openedAt),
            csvTime(r.clickedAt),
            csvTime(r.lastClickAt),
            r.clickCount,
            csvTime(r.unsubscribedAt),
            csvTime(r.complainedAt),
          ]
            .map(csvCell)
            .join(',')
        )
      }
      taken += batch.length
      lastId = batch[batch.length - 1].id
      if (batch.length < 2000) break
    }
  }
  // Excel 认 CRLF；BOM 让它按 UTF-8 解码中文
  return '﻿' + lines.join('\r\n') + '\r\n'
}

/* ================================================================================================
 * 订阅统计 / 列表
 * ================================================================================================ */

/** 测试域名（与 types.isTestAddress 同口径），SQL 版 */
const NOT_TEST_ADDRESS_SQL = Prisma.sql`u.email LIKE '%@%'
  AND u.email NOT REGEXP '[.](local|test|invalid|example)$'
  AND SUBSTRING_INDEX(u.email, '@', -1) NOT IN ('example.com', 'example.org', 'example.net')`

export async function subscriberStats(): Promise<SubscriberStats> {
  const now = new Date()
  const config = await getConfig()
  const [totalUsers, withEmail, consentGroups, paused, suppressedGroups, eligibleRows] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { email: { not: null } } }),
    prisma.marketingConsent.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.marketingConsent.count({ where: { pausedUntil: { gt: now } } }),
    prisma.marketingSuppression.groupBy({ by: ['reason'], _count: { _all: true } }),
    // 「现在能收到」的粗估：有邮箱、账号正常、非测试地址、不在抑制名单、未退订、未暂停、
    // 且（明确订阅 或 默认可发）。不含主题、sunset、不活跃、频控 —— 那些要到具体活动才算得出
    prisma.$queryRaw<{ n: bigint | number }[]>`
      SELECT COUNT(*) AS n
      FROM users u
      LEFT JOIN marketing_consents c ON c.user_id = u.id
      LEFT JOIN marketing_suppressions s ON s.email = u.email
      WHERE u.email IS NOT NULL AND u.status = 1
        AND ${NOT_TEST_ADDRESS_SQL}
        AND s.id IS NULL
        AND (c.id IS NULL OR c.status <> 'UNSUBSCRIBED')
        AND (c.paused_until IS NULL OR c.paused_until <= ${now})
        AND (c.status = 'SUBSCRIBED' OR ${config.defaultEligible ? 1 : 0} = 1)
    `,
  ])
  const byStatus: Record<ConsentStatus, number> = { DEFAULT: 0, SUBSCRIBED: 0, UNSUBSCRIBED: 0 }
  let explicit = 0
  for (const g of consentGroups) {
    if ((CONSENT_STATUSES as readonly string[]).includes(g.status)) {
      byStatus[g.status as ConsentStatus] += g._count._all
      if (g.status !== 'DEFAULT') explicit += g._count._all
    }
  }
  // 没有偏好行的用户 ≡ DEFAULT
  byStatus.DEFAULT = Math.max(0, totalUsers - explicit)
  const suppressed: Partial<Record<SuppressionReason, number>> = {}
  for (const g of suppressedGroups) {
    if ((SUPPRESSION_REASONS as readonly string[]).includes(g.reason)) suppressed[g.reason as SuppressionReason] = g._count._all
  }
  return {
    totalUsers,
    withEmail,
    eligibleNow: Number(eligibleRows[0]?.n ?? 0),
    byStatus,
    paused,
    suppressed,
  }
}

function likePattern(kw: string): string {
  return `%${kw.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

export async function listSubscribers(q: {
  page: number
  pageSize: number
  keyword?: string | null
  status?: ConsentStatus | 'SUPPRESSED' | 'PAUSED' | null
}): Promise<{ list: SubscriberRow[]; total: number }> {
  const pageSize = Math.min(100, Math.max(1, Math.floor(q.pageSize) || 20))
  const page = Math.max(1, Math.floor(q.page) || 1)
  const now = new Date()

  const conds: Prisma.Sql[] = []
  const kw = (q.keyword || '').trim()
  if (kw) {
    const like = likePattern(kw.toLowerCase())
    const n = Number(kw.replace(/^#/, ''))
    conds.push(
      Number.isInteger(n) && n > 0
        ? Prisma.sql`(u.email LIKE ${like} OR u.nickname LIKE ${likePattern(kw)} OR u.id = ${n})`
        : Prisma.sql`(u.email LIKE ${like} OR u.nickname LIKE ${likePattern(kw)})`
    )
  }
  switch (q.status) {
    case 'DEFAULT':
      conds.push(Prisma.sql`(c.id IS NULL OR c.status = 'DEFAULT')`)
      break
    case 'SUBSCRIBED':
      conds.push(Prisma.sql`c.status = 'SUBSCRIBED'`)
      break
    case 'UNSUBSCRIBED':
      conds.push(Prisma.sql`c.status = 'UNSUBSCRIBED'`)
      break
    case 'SUPPRESSED':
      conds.push(Prisma.sql`s.id IS NOT NULL`)
      break
    case 'PAUSED':
      conds.push(Prisma.sql`c.paused_until > ${now}`)
      break
  }
  const where = conds.length ? Prisma.sql`WHERE ${Prisma.join(conds, ' AND ')}` : Prisma.empty
  const from = Prisma.sql`FROM users u
    LEFT JOIN marketing_consents c ON c.user_id = u.id
    LEFT JOIN marketing_suppressions s ON s.email = u.email`

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<
      {
        userId: number
        email: string | null
        nickname: string | null
        status: string | null
        topicsOff: string | null
        pausedUntil: Date | null
        suppressed: string | null
      }[]
    >`SELECT u.id AS userId, u.email AS email, u.nickname AS nickname, c.status AS status,
        c.topics_off AS topicsOff, c.paused_until AS pausedUntil, s.reason AS suppressed
      ${from} ${where}
      ORDER BY u.id DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
    prisma.$queryRaw<{ n: bigint | number }[]>`SELECT COUNT(*) AS n ${from} ${where}`,
  ])

  const ids = rows.map((r) => Number(r.userId))
  const sentStats = ids.length
    ? await prisma.marketingMessage.groupBy({
        by: ['userId'],
        where: { userId: { in: ids }, status: { in: ['SENT', 'UNKNOWN'] } },
        _count: { _all: true },
        _max: { sentAt: true },
      })
    : []
  const sentMap = new Map<number, { count: number; last: Date | null }>()
  for (const s of sentStats) if (s.userId != null) sentMap.set(s.userId, { count: s._count._all, last: s._max.sentAt })

  const list: SubscriberRow[] = rows.map((r) => {
    const uid = Number(r.userId)
    const p = r.pausedUntil && r.pausedUntil.getTime() > now.getTime() ? r.pausedUntil : null
    const sent = sentMap.get(uid)
    return {
      userId: uid,
      email: r.email,
      nickname: r.nickname,
      status: (CONSENT_STATUSES as readonly string[]).includes(r.status || '') ? (r.status as ConsentStatus) : 'DEFAULT',
      topicsOff: parseTopicsOff(r.topicsOff),
      pausedUntil: iso(p),
      suppressed: r.suppressed && (SUPPRESSION_REASONS as readonly string[]).includes(r.suppressed) ? (r.suppressed as SuppressionReason) : null,
      lastSentAt: iso(sent?.last ?? null),
      sentCount: sent?.count ?? 0,
    }
  })
  return { list, total: Number(countRows[0]?.n ?? 0) }
}

export async function listSuppressions(q: {
  page: number
  pageSize: number
  reason?: string | null
  keyword?: string | null
}): Promise<{ list: { email: string; reason: string; detail: string | null; source: string; createdAt: string }[]; total: number }> {
  const pageSize = Math.min(100, Math.max(1, Math.floor(q.pageSize) || 20))
  const page = Math.max(1, Math.floor(q.page) || 1)
  const where: Prisma.MarketingSuppressionWhereInput = {}
  if (q.reason && (SUPPRESSION_REASONS as readonly string[]).includes(q.reason)) where.reason = q.reason
  const kw = (q.keyword || '').trim().toLowerCase()
  if (kw) where.email = { contains: kw }
  const [rows, total] = await Promise.all([
    prisma.marketingSuppression.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { email: true, reason: true, detail: true, source: true, createdAt: true },
    }),
    prisma.marketingSuppression.count({ where }),
  ])
  return {
    list: rows.map((r) => ({ email: r.email, reason: r.reason, detail: r.detail, source: r.source, createdAt: r.createdAt.toISOString() })),
    total,
  }
}

export async function userMarketingSummary(userId: number): Promise<UserMarketingSummary | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } })
  if (!user) return null
  const now = new Date()
  const email = user.email ? user.email.toLowerCase() : null
  const [consent, suppression, logs, messages] = await Promise.all([
    prisma.marketingConsent.findUnique({ where: { userId } }),
    email ? prisma.marketingSuppression.findUnique({ where: { email } }) : Promise.resolve(null),
    prisma.marketingConsentLog.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      take: 50,
      select: { createdAt: true, action: true, source: true, detail: true },
    }),
    prisma.marketingMessage.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      take: 20,
      select: { campaignId: true, status: true, sentAt: true, delivery: true, clickedAt: true, unsubscribedAt: true },
    }),
  ])
  const campaignIds = uniq(messages.map((m) => m.campaignId))
  const names = new Map<number, string>()
  if (campaignIds.length) {
    const cs = await prisma.marketingCampaign.findMany({ where: { id: { in: campaignIds } }, select: { id: true, name: true } })
    for (const c of cs) names.set(c.id, c.name)
  }
  const p = consent?.pausedUntil && consent.pausedUntil.getTime() > now.getTime() ? consent.pausedUntil : null
  return {
    userId: user.id,
    email: user.email,
    status: consent && (CONSENT_STATUSES as readonly string[]).includes(consent.status) ? (consent.status as ConsentStatus) : 'DEFAULT',
    topicsOff: parseTopicsOff(consent?.topicsOff),
    pausedUntil: iso(p),
    suppressed: suppression
      ? { reason: suppression.reason as SuppressionReason, at: suppression.createdAt.toISOString(), detail: suppression.detail }
      : null,
    logs: logs.map((l) => ({ at: l.createdAt.toISOString(), action: l.action as ConsentAction, source: l.source, detail: l.detail })),
    messages: messages.map((m) => ({
      campaignId: m.campaignId,
      campaignName: names.get(m.campaignId) || `#${m.campaignId}`,
      status: m.status as MessageStatus,
      sentAt: iso(m.sentAt),
      delivery: (m.delivery as DeliveryStatus | null) ?? null,
      clickedAt: iso(m.clickedAt),
      unsubscribedAt: iso(m.unsubscribedAt),
    })),
  }
}
