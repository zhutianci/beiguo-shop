/**
 * 「余额与充值」后台的只读查询（/admin/wallet，docs/短信接码-设计.md §7.8）。路由只做 adminGuard + 参数解析，查询都在这里。
 * 后台可以看到流水备注与 bizKey（买家侧不回显，见 dto.ts）。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { BALANCE_TYPE_LABELS, referralOrderIdOf, ledgerOrderIdOf } from '../balance'
import { centsOf, yuanStr } from './buckets'
import { liabilityNow, lastReconcileReport, STUCK_HOLD_MIN } from './reconcile'
import { readWalletConfig } from './config'

const n = (v: unknown) => Number(v ?? 0)

/** 北京时间当天 0 点（UTC 时刻）。容器 TZ 与数据库时区都不参与计算（交接文档六·1 的教训） */
export function shanghaiDayStart(now = new Date()): Date {
  const DAY = 86400_000
  const OFF = 8 * 3600_000
  return new Date(Math.floor((now.getTime() + OFF) / DAY) * DAY - OFF)
}

/** 'YYYY-MM-DD'（北京时间）→ 当天 0 点；endOfDay 时给次日 0 点（查询用 < ） */
export function shanghaiDay(s: string | null | undefined, endOfDay: boolean): Date | undefined {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined
  const t = Date.parse(`${s}T00:00:00+08:00`)
  if (Number.isNaN(t)) return undefined
  return new Date(endOfDay ? t + 86400_000 : t)
}

export async function walletOverview(now = new Date()) {
  const dayStart = shanghaiDayStart(now)
  const [liability, today, cfg, report, oldestHeld] = await Promise.all([
    liabilityNow(),
    prisma.balanceLog.groupBy({
      by: ['type'],
      where: { createdAt: { gte: dayStart } },
      _sum: { delta: true, topupDeltaCents: true },
      _count: { _all: true },
    }),
    readWalletConfig(),
    lastReconcileReport(),
    prisma.balanceHold.findFirst({ where: { state: 'HELD' }, orderBy: { heldAt: 'asc' }, select: { heldAt: true } }),
  ])
  const byType = today.map((t) => ({
    type: t.type,
    label: BALANCE_TYPE_LABELS[t.type] || t.type,
    count: t._count._all,
    cents: centsOf(t._sum.delta ?? 0) + (t._sum.topupDeltaCents ?? 0),
  }))
  const pick = (types: string[]) => byType.filter((t) => types.includes(t.type)).reduce((a, t) => ({ cents: a.cents + t.cents, count: a.count + t.count }), { cents: 0, count: 0 })
  return {
    liability,
    heldOldestMin: oldestHeld ? Math.round(Math.abs(now.getTime() - oldestHeld.heldAt.getTime()) / 60_000) : null,
    stuckHoldMin: STUCK_HOLD_MIN,
    today: {
      topup: pick(['TOPUP']),
      spent: pick(['HOLD']),
      back: pick(['RELEASE', 'REFUND', 'LATEPAY']),
      withdraw: pick(['WITHDRAW']),
      byType,
    },
    config: cfg.ok ? { ok: true as const, config: cfg.config } : { ok: false as const, reason: cfg.reason },
    reconcile: report ? { at: report.at, ok: report.ok, full: report.full, failed: report.items.filter((i) => !i.ok).map((i) => ({ code: i.code, count: i.count })) } : null,
  }
}

export type UserSort = 'total' | 'topup' | 'cash' | 'held' | 'recent'
const SORT_SQL: Record<UserSort, Prisma.Sql> = {
  total: Prisma.sql`(u.balance * 100 + u.topup_cents)`,
  topup: Prisma.sql`u.topup_cents`,
  cash: Prisma.sql`u.balance`,
  held: Prisma.sql`COALESCE(h.held, 0)`,
  recent: Prisma.sql`l.last_at`,
}

/** 用户余额列表：有任何一格、预扣或流水的用户（其余用户余额恒为 0，没必要列） */
export async function walletUsers(p: { q?: string; sort?: UserSort; page?: number; pageSize?: number }) {
  const page = Math.max(p.page ?? 1, 1)
  const pageSize = Math.min(Math.max(p.pageSize ?? 20, 1), 100)
  const sort = SORT_SQL[p.sort ?? 'total'] ?? SORT_SQL.total
  const q = (p.q ?? '').trim().slice(0, 100)
  const asId = /^\d+$/.test(q) ? Number(q) : 0
  const kw = q
    ? Prisma.sql`AND (u.email LIKE ${`%${q}%`} OR u.nickname LIKE ${`%${q}%`} OR u.id = ${asId})`
    : Prisma.empty
  const base = Prisma.sql`
    FROM users u
    LEFT JOIN (SELECT user_id, SUM(topup_cents + cash_cents) AS held, COUNT(*) AS held_n FROM balance_holds WHERE state = 'HELD' GROUP BY user_id) h ON h.user_id = u.id
    LEFT JOIN (SELECT user_id, MAX(created_at) AS last_at, COUNT(*) AS log_n FROM balance_logs GROUP BY user_id) l ON l.user_id = u.id
    WHERE (u.balance <> 0 OR u.topup_cents <> 0 OR h.held IS NOT NULL OR l.last_at IS NOT NULL) ${kw}`
  const [rows, cnt] = await Promise.all([
    prisma.$queryRaw<{ id: number; email: string | null; nickname: string | null; balance: unknown; topup_cents: number; held: unknown; held_n: unknown; last_at: Date | null; log_n: unknown }[]>`
      SELECT u.id, u.email, u.nickname, u.balance, u.topup_cents, h.held, h.held_n, l.last_at, l.log_n ${base}
      ORDER BY ${sort} DESC, u.id DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
    prisma.$queryRaw<{ c: unknown }[]>`SELECT COUNT(*) AS c ${base}`,
  ])
  const total = n(cnt[0]?.c)
  return {
    list: rows.map((r) => {
      const cash = centsOf(r.balance)
      return {
        id: Number(r.id),
        email: r.email,
        nickname: r.nickname,
        topupCents: n(r.topup_cents),
        cashCents: cash,
        totalCents: cash + n(r.topup_cents),
        heldCents: n(r.held),
        heldCount: n(r.held_n),
        logCount: n(r.log_n),
        lastAt: r.last_at,
      }
    }),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  }
}

/** 流水行（后台全字段，含备注与 bizKey） */
function adminLog(l: {
  id: number
  userId: number
  type: string
  delta: unknown
  balanceAfter: unknown
  topupDeltaCents: number
  topupAfterCents: number | null
  note: string | null
  orderId: number | null
  bizKey: string | null
  createdAt: Date
}) {
  return {
    id: l.id,
    userId: l.userId,
    type: l.type,
    typeLabel: BALANCE_TYPE_LABELS[l.type] || l.type,
    cashDeltaCents: centsOf(l.delta),
    cashAfterCents: centsOf(l.balanceAfter),
    topupDeltaCents: l.topupDeltaCents,
    topupAfterCents: l.topupAfterCents,
    note: l.note,
    orderId: referralOrderIdOf(l) ?? ledgerOrderIdOf(l) ?? (l.type === 'CLAWBACK' ? l.orderId : null),
    bizKey: l.bizKey,
    createdAt: l.createdAt,
  }
}

export async function walletUserDetail(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, nickname: true, balance: true, topupCents: true, createdAt: true, status: true },
  })
  if (!user) return null
  const [holds, logs] = await Promise.all([
    prisma.balanceHold.findMany({ where: { userId }, orderBy: { id: 'desc' }, take: 50 }),
    prisma.balanceLog.findMany({ where: { userId }, orderBy: { id: 'desc' }, take: 50 }),
  ])
  const orderIds = Array.from(new Set([...holds.map((h) => h.orderId), ...logs.map((l) => adminLog(l).orderId).filter((x): x is number => !!x)]))
  const orders = orderIds.length
    ? await prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, orderNo: true, productName: true, amount: true, payStatus: true, deliveryStatus: true, userId: true, product: { select: { deliveryType: true } } },
      })
    : []
  const cash = centsOf(user.balance)
  return {
    user: { id: user.id, email: user.email, nickname: user.nickname, status: user.status, createdAt: user.createdAt },
    wallet: {
      topupCents: user.topupCents,
      cashCents: cash,
      totalCents: user.topupCents + cash,
      heldCents: holds.filter((h) => h.state === 'HELD').reduce((a, h) => a + h.topupCents + h.cashCents, 0),
    },
    holds,
    logs: logs.map(adminLog),
    orders: orders.map((o) => ({ ...o, amount: yuanStr(centsOf(o.amount)), deliveryType: o.product.deliveryType, own: o.userId === userId })),
  }
}

export interface LogFilter {
  userId?: number
  type?: string
  from?: Date
  to?: Date
  orderNo?: string
  bizKey?: string
  page?: number
  pageSize?: number
}

export async function walletLogs(f: LogFilter, opts: { all?: boolean } = {}) {
  const where: Prisma.BalanceLogWhereInput = {}
  if (f.userId) where.userId = f.userId
  if (f.type) where.type = f.type
  if (f.from || f.to) where.createdAt = { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lt: f.to } : {}) }
  if (f.bizKey) where.bizKey = f.bizKey.endsWith('*') ? { startsWith: f.bizKey.slice(0, -1) } : f.bizKey
  if (f.orderNo) {
    const o = await prisma.order.findUnique({ where: { orderNo: f.orderNo }, select: { id: true } })
    where.orderId = o?.id ?? -1
  }
  const page = Math.max(f.page ?? 1, 1)
  const pageSize = opts.all ? 5000 : Math.min(Math.max(f.pageSize ?? 50, 1), 200)
  const [total, rows] = await Promise.all([
    prisma.balanceLog.count({ where }),
    prisma.balanceLog.findMany({ where, orderBy: { id: 'desc' }, skip: opts.all ? 0 : (page - 1) * pageSize, take: pageSize }),
  ])
  const userIds = Array.from(new Set(rows.map((r) => r.userId)))
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } }) : []
  const um = new Map(users.map((u) => [u.id, u.email]))
  return {
    list: rows.map((r) => ({ ...adminLog(r), email: um.get(r.userId) ?? null })),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  }
}

/** CSV（含两格变动与变动后余额，§7.8）。首行 BOM 让 Excel 按 UTF-8 打开 */
export function logsToCsv(list: Awaited<ReturnType<typeof walletLogs>>['list']): string {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    // 以 = + - @ 开头的单元格前加 '，防 CSV 公式注入
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  const head = ['流水ID', '时间', '用户ID', '邮箱', '类型', '返现格变动', '返现格余额', '充值格变动', '充值格余额', '订单ID', 'bizKey', '备注']
  const lines = list.map((l) =>
    [
      l.id,
      new Date(l.createdAt).toISOString(),
      l.userId,
      l.email,
      l.typeLabel,
      yuanStr(l.cashDeltaCents),
      yuanStr(l.cashAfterCents),
      yuanStr(l.topupDeltaCents),
      l.topupAfterCents == null ? '' : yuanStr(l.topupAfterCents),
      l.orderId ?? '',
      l.bizKey ?? '',
      l.note ?? '',
    ]
      .map(esc)
      .join(','),
  )
  return '﻿' + [head.join(','), ...lines].join('\r\n')
}

export type TopupState = 'pending' | 'credited' | 'closed' | 'all'

/** 充值单（TOPUP 载体订单；B1 之前恒为空） */
export async function walletTopups(p: { state?: TopupState; page?: number; pageSize?: number }) {
  const page = Math.max(p.page ?? 1, 1)
  const pageSize = Math.min(Math.max(p.pageSize ?? 20, 1), 100)
  const where: Prisma.OrderWhereInput = { product: { deliveryType: 'TOPUP' } }
  if (p.state === 'pending') Object.assign(where, { payStatus: 'UNPAID', deliveryStatus: { not: 'CANCELLED' } })
  if (p.state === 'credited') Object.assign(where, { payStatus: { in: ['PAID', 'REFUNDED'] } })
  if (p.state === 'closed') Object.assign(where, { payStatus: 'UNPAID', deliveryStatus: 'CANCELLED' })
  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, orderNo: true, userId: true, amount: true, payStatus: true, deliveryStatus: true, createdAt: true, paidAt: true, user: { select: { email: true } } },
    }),
  ])
  const keys = rows.map((r) => `topup:${r.id}`)
  const logs = keys.length ? await prisma.balanceLog.findMany({ where: { bizKey: { in: keys } }, select: { id: true, bizKey: true, topupDeltaCents: true } }) : []
  const lm = new Map(logs.map((l) => [l.bizKey, l]))
  return {
    list: rows.map((r) => ({
      id: r.id,
      orderNo: r.orderNo,
      userId: r.userId,
      email: r.user.email,
      amountCents: centsOf(r.amount),
      payStatus: r.payStatus,
      deliveryStatus: r.deliveryStatus,
      createdAt: r.createdAt,
      paidAt: r.paidAt,
      creditedCents: lm.get(`topup:${r.id}`)?.topupDeltaCents ?? null,
      logId: lm.get(`topup:${r.id}`)?.id ?? null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  }
}

/** 预扣：HELD 全部列出（超过 STUCK_HOLD_MIN 分钟标红）+ 最近释放 / 确认 / 退款的 50 条。只读（§7.8：不提供手工释放） */
export async function walletHolds(now = new Date()) {
  const [held, recent] = await Promise.all([
    prisma.balanceHold.findMany({ where: { state: 'HELD' }, orderBy: { heldAt: 'asc' }, take: 500 }),
    prisma.balanceHold.findMany({ where: { state: { not: 'HELD' } }, orderBy: { updatedAt: 'desc' }, take: 50 }),
  ])
  const ids = Array.from(new Set([...held, ...recent].map((h) => h.orderId)))
  const orders = ids.length ? await prisma.order.findMany({ where: { id: { in: ids } }, select: { id: true, orderNo: true, payStatus: true, deliveryStatus: true } }) : []
  const om = new Map(orders.map((o) => [o.id, o]))
  const shape = (h: (typeof held)[number]) => ({
    ...h,
    totalCents: h.topupCents + h.cashCents,
    order: om.get(h.orderId) ?? null,
    minutes: Math.round(Math.abs(now.getTime() - h.heldAt.getTime()) / 60_000),
  })
  return { held: held.map((h) => ({ ...shape(h), stuck: shape(h).minutes > STUCK_HOLD_MIN })), recent: recent.map(shape), stuckMin: STUCK_HOLD_MIN }
}
