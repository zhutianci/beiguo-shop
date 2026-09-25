/**
 * 受众：规则 → 用户集合、预估人数、物化收件人行。
 *
 * 【性能】全部集合查询（IN / groupBy），禁止逐人调用 vip-server 的单用户函数；
 * 物化 5000 人要在 worker 单趟内完成（设计 5.6）。
 *
 * 【实现方：发送引擎】签名是契约。
 *
 * 预估（previewAudience）与物化（buildRecipientRows）共用同一个装载器 loadAudience：
 * 「检查」弹窗里看到的可发人数，就是 worker 物化时真正写进发件箱的人数（launch 用它做 expectedCount 校验）。
 */
import { prisma } from '@/lib/db'
import { getVipTiers } from '@/lib/vip-server'
import { vipStatusOf } from '@/lib/vip'
import { getConfig } from './config'
import { loadConsents, loadSuppressed } from './consent'
import { assignSortKeys, eligibility, freqDecision, isValidEmail } from './policy'
import {
  MAX_USERS_AUDIENCE,
  clip,
  emailDomain,
  type AudiencePreview,
  type AudienceSpec,
  type MarketingConfig,
  type SegmentRules,
  type SkipReason,
  type Topic,
} from './types'

const DAY_MS = 86400_000
const IN_CHUNK = 1000

function chunks<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

function cents(n: number): number {
  return Math.round(n * 100)
}

/** 已付款统计（与 VIP 同口径：PAID 且未取消，Order.amount 不含税） */
interface PaidStat {
  spent: number
  count: number
  lastPaidAt: Date | null
}

async function loadPaidStats(userIds: number[]): Promise<Map<number, PaidStat>> {
  const out = new Map<number, PaidStat>()
  for (const part of chunks(userIds, IN_CHUNK)) {
    const rows = await prisma.order.groupBy({
      by: ['userId'],
      where: { userId: { in: part }, payStatus: 'PAID', deliveryStatus: { not: 'CANCELLED' } },
      _sum: { amount: true },
      _count: { _all: true },
      _max: { paidAt: true, createdAt: true },
    })
    for (const r of rows) {
      out.set(r.userId, {
        spent: Math.round(Number(r._sum.amount ?? 0) * 100) / 100,
        count: r._count._all,
        // 早期个别已付款订单没有 paidAt：退回用下单时间，不能当成「从没付过款」
        lastPaidAt: r._max.paidAt ?? r._max.createdAt ?? null,
      })
    }
  }
  return out
}

/* ============================== 规则 → 用户 id ============================== */

async function resolveSegment(rules: SegmentRules, now: Date): Promise<number[]> {
  const createdAt: { gte?: Date; lte?: Date } = {}
  if (rules.registeredWithinDays) createdAt.gte = new Date(now.getTime() - rules.registeredWithinDays * DAY_MS)
  if (rules.registeredBeforeDays) createdAt.lte = new Date(now.getTime() - rules.registeredBeforeDays * DAY_MS)
  const users = await prisma.user.findMany({
    where: { status: 1, email: { not: null }, ...(createdAt.gte || createdAt.lte ? { createdAt } : {}) },
    select: { id: true, vipLevel: true },
    orderBy: { id: 'asc' },
  })
  let list = users

  const needPaid =
    (rules.paid && rules.paid !== 'any') ||
    rules.lastPaidWithinDays != null ||
    rules.noPaidWithinDays != null ||
    rules.spendMin != null ||
    rules.spendMax != null ||
    !!rules.vipLevels?.length
  if (needPaid && list.length) {
    const stats = await loadPaidStats(list.map((u) => u.id))
    const tiers = rules.vipLevels?.length ? await getVipTiers() : []
    const vipSet = new Set(rules.vipLevels || [])
    list = list.filter((u) => {
      const s = stats.get(u.id)
      const count = s?.count ?? 0
      const spent = s?.spent ?? 0
      const last = s?.lastPaidAt ?? null
      if (rules.paid === 'yes' && count === 0) return false
      if (rules.paid === 'no' && count > 0) return false
      if (rules.lastPaidWithinDays != null) {
        if (!last || last.getTime() < now.getTime() - rules.lastPaidWithinDays * DAY_MS) return false
      }
      if (rules.noPaidWithinDays != null) {
        if (last && last.getTime() >= now.getTime() - rules.noPaidWithinDays * DAY_MS) return false
      }
      if (rules.spendMin != null && cents(spent) < cents(rules.spendMin)) return false
      if (rules.spendMax != null && cents(spent) > cents(rules.spendMax)) return false
      if (vipSet.size) {
        // 档位与 /vip 页同一口径：按累计消费算，后台手工等级只上调不下调
        const level = vipStatusOf(tiers, spent, u.vipLevel).current.level
        if (!vipSet.has(level)) return false
      }
      return true
    })
  }

  const productIds = new Set<number>(rules.boughtProductIds || [])
  if (rules.boughtCategoryIds?.length) {
    const ps = await prisma.product.findMany({
      where: { categoryId: { in: rules.boughtCategoryIds } },
      select: { id: true },
    })
    ps.forEach((p) => productIds.add(p.id))
  }
  if (rules.boughtProductIds?.length || rules.boughtCategoryIds?.length) {
    // 选了「买过」但分类下一个商品都没有：结果就是空集，而不是退化成「不限」
    if (!productIds.size) return []
    const buyers = new Set<number>()
    const pids = Array.from(productIds)
    for (const part of chunks(list.map((u) => u.id), IN_CHUNK)) {
      const rows = await prisma.order.groupBy({
        by: ['userId'],
        where: {
          userId: { in: part },
          productId: { in: pids },
          payStatus: 'PAID',
          deliveryStatus: { not: 'CANCELLED' },
        },
      })
      rows.forEach((r) => buyers.add(r.userId))
    }
    list = list.filter((u) => buyers.has(u.id))
  }
  return list.map((u) => u.id)
}

/**
 * 规则 → 命中用户 id（未做资格过滤；status=1 且有邮箱以外的排除都交给资格判定）
 *
 * ALL / SEGMENT 在 SQL 里就只取「正常状态、有邮箱」的账号（不给每个活动都写一堆「账号已禁用」的跳过行）；
 * USERS 是管理员手工点名的，原样保留已存在的 id —— 这样预估里能看到「其中 2 人账号已禁用 / 没有邮箱」。
 * 不排除管理员账号（管理员也是注册用户，且常用来自测收件）。
 */
export async function resolveAudienceUserIds(spec: AudienceSpec): Promise<number[]> {
  const now = new Date()
  if (spec.type === 'ALL') {
    const rows = await prisma.user.findMany({
      where: { status: 1, email: { not: null } },
      select: { id: true },
      orderBy: { id: 'asc' },
    })
    return rows.map((r) => r.id)
  }
  if (spec.type === 'USERS') {
    const wanted = Array.from(new Set(spec.userIds.filter((n) => Number.isInteger(n) && n > 0))).slice(0, MAX_USERS_AUDIENCE)
    const found = new Set<number>()
    for (const part of chunks(wanted, IN_CHUNK)) {
      const rows = await prisma.user.findMany({ where: { id: { in: part } }, select: { id: true } })
      rows.forEach((r) => found.add(r.id))
    }
    return wanted.filter((id) => found.has(id))
  }
  return resolveSegment(spec.rules || {}, now)
}

function excludeInactiveOf(spec: AudienceSpec): boolean {
  if (spec.type === 'ALL') return spec.excludeInactive
  if (spec.type === 'SEGMENT') return !!spec.rules?.excludeInactive
  return false // 手工点名的人不再按「长期不活跃」二次过滤
}

/* ============================== 共用装载器 ============================== */

interface AudienceEntry {
  userId: number
  /** 小写；没有邮箱时为空串 */
  email: string
  nickname: string | null
  reason: SkipReason | null
  tier: number
}

/**
 * 一次性批量取齐资格判定所需的全部数据（设计 5.6 第 2 步），逐人算 5.4 的 1–10。
 * 同一个小写邮箱对应多个账号时只保留一个（优先可发的那个）：发件箱 (campaignId, email) 唯一。
 */
async function loadAudience(
  spec: AudienceSpec,
  topic: Topic,
  now: Date,
  config: MarketingConfig
): Promise<{ matched: number; entries: AudienceEntry[] }> {
  const ids = await resolveAudienceUserIds(spec)
  if (!ids.length) return { matched: 0, entries: [] }

  const users: { id: number; email: string | null; nickname: string | null; status: number; createdAt: Date }[] = []
  for (const part of chunks(ids, IN_CHUNK)) {
    const rows = await prisma.user.findMany({
      where: { id: { in: part } },
      select: { id: true, email: true, nickname: true, status: true, createdAt: true },
    })
    users.push(...rows)
  }
  users.sort((a, b) => a.id - b.id)
  const userIds = users.map((u) => u.id)
  const emails = Array.from(
    new Set(users.map((u) => (u.email || '').trim().toLowerCase()).filter((e) => isValidEmail(e)))
  )

  const since90 = new Date(now.getTime() - 90 * DAY_MS)
  const since180 = new Date(now.getTime() - 180 * DAY_MS)
  const since365 = new Date(now.getTime() - 365 * DAY_MS)

  const [consents, suppressed, paid] = await Promise.all([
    loadConsents(userIds),
    loadSuppressed(emails),
    loadPaidStats(userIds),
  ])

  // 近 180 天的营销有效点击（tracking 只对非机器点击写 clickedAt / lastClickAt）
  const lastClick = new Map<number, Date>()
  // 已收营销封数（SENT / UNKNOWN：UNKNOWN 大概率也已送达，SUNSET 宁可多算）
  const received = new Map<number, number>()
  for (const part of chunks(userIds, IN_CHUNK)) {
    const [clicks, counts] = await Promise.all([
      prisma.marketingMessage.groupBy({
        by: ['userId'],
        where: { userId: { in: part }, OR: [{ lastClickAt: { gte: since180 } }, { clickedAt: { gte: since180 } }] },
        _max: { lastClickAt: true, clickedAt: true },
      }),
      prisma.marketingMessage.groupBy({
        by: ['userId'],
        where: { userId: { in: part }, status: { in: ['SENT', 'UNKNOWN'] } },
        _count: { _all: true },
      }),
    ])
    for (const c of clicks) {
      if (c.userId == null) continue
      const a = c._max.lastClickAt?.getTime() ?? 0
      const b = c._max.clickedAt?.getTime() ?? 0
      const t = Math.max(a, b)
      if (t) lastClick.set(c.userId, new Date(t))
    }
    for (const c of counts) if (c.userId != null) received.set(c.userId, c._count._all)
  }

  // 验证过的邮箱：email_codes 里 REGISTER 且 used（库的排序规则大小写不敏感，IN 能匹配到大小写不同的写法）
  const verified = new Set<string>()
  for (const part of chunks(emails, IN_CHUNK)) {
    const rows = await prisma.emailCode.findMany({
      where: { email: { in: part }, purpose: 'REGISTER', used: true },
      select: { email: true },
      distinct: ['email'],
    })
    rows.forEach((r) => verified.add(r.email.trim().toLowerCase()))
  }

  const excludeInactive = excludeInactiveOf(spec)
  const entries: AudienceEntry[] = []
  const byEmail = new Map<string, number>() // email → entries 下标
  for (const u of users) {
    const email = (u.email || '').trim().toLowerCase()
    const p = paid.get(u.id)
    const last = p?.lastPaidAt?.getTime() ?? 0
    const click = lastClick.get(u.id)?.getTime() ?? 0
    const activity = {
      paidWithin90d: last >= since90.getTime(),
      paidWithin365d: last >= since365.getTime(),
      clickedWithin90d: click >= since90.getTime(),
      clickedWithin180d: click >= since180.getTime(),
      marketingReceived: received.get(u.id) ?? 0,
    }
    const reason = eligibility({
      user: { status: u.status, email, createdAt: u.createdAt },
      consent: consents.get(u.id) ?? null,
      suppressed: suppressed.get(email) ?? null,
      topic,
      config,
      excludeInactive,
      activity,
      now,
    })
    // 层级（设计 5.6 #4）：越可能收得到、越可能点的人越先发 —— 投诉数据阿里云按天更新，
    // 预热第一天先发最活跃的人，熔断的滞后才伤不到信誉
    let tier = 4
    if (activity.paidWithin90d) tier = 0
    else if ((p?.count ?? 0) > 0) tier = 1
    else if (u.createdAt.getTime() >= since90.getTime() || activity.clickedWithin90d) tier = 2
    else if (verified.has(email)) tier = 3

    const entry: AudienceEntry = { userId: u.id, email: reason === 'NO_EMAIL' ? '' : email, nickname: u.nickname, reason, tier }
    if (entry.email) {
      const prev = byEmail.get(entry.email)
      if (prev != null) {
        // 同一个邮箱（大小写不同的两个账号）：保留可发的那个
        if (entries[prev].reason != null && entry.reason == null) entries[prev] = entry
        continue
      }
      byEmail.set(entry.email, entries.length)
    }
    entries.push(entry)
  }
  return { matched: ids.length, entries }
}

/* ============================== 预估 ============================== */

/** 同邮箱已发记录（SENT/SENDING/UNKNOWN，时间取 COALESCE(sentAt, claimedAt)），用于频控估算 */
async function loadSendTimes(emails: string[], since: Date): Promise<Map<string, Date[]>> {
  const out = new Map<string, Date[]>()
  for (const part of chunks(emails, IN_CHUNK)) {
    const rows = await prisma.marketingMessage.findMany({
      where: {
        email: { in: part },
        status: { in: ['SENT', 'SENDING', 'UNKNOWN'] },
        OR: [{ sentAt: { gte: since } }, { sentAt: null, claimedAt: { gte: since } }],
      },
      select: { email: true, sentAt: true, claimedAt: true },
    })
    for (const r of rows) {
      const t = r.sentAt ?? r.claimedAt
      if (!t) continue
      const k = r.email.toLowerCase()
      const list = out.get(k)
      if (list) list.push(t)
      else out.set(k, [t])
    }
  }
  return out
}

/** 预估：命中、可发、按原因排除、频控估算、样本 20 人 */
export async function previewAudience(spec: AudienceSpec, topic: Topic, opts: { at?: Date } = {}): Promise<AudiencePreview> {
  const now = new Date()
  const at = opts.at && !Number.isNaN(opts.at.getTime()) && opts.at.getTime() > now.getTime() ? opts.at : now
  const config = await getConfig()
  // 资格按「现在」算（与 launch 时的 expectedCount 同口径）；频控按计划发送时间估
  const { matched, entries } = await loadAudience(spec, topic, now, config)

  const excluded: Partial<Record<SkipReason, number>> = {}
  const ok: AudienceEntry[] = []
  for (const e of entries) {
    if (e.reason) excluded[e.reason] = (excluded[e.reason] ?? 0) + 1
    else ok.push(e)
  }

  let freqCapEstimate = 0
  if (ok.length) {
    const lookback = Math.max(30, Math.ceil(config.freq.minHours / 24) + 1)
    const history = await loadSendTimes(
      ok.map((e) => e.email),
      new Date(at.getTime() - lookback * DAY_MS)
    )
    for (const e of ok) {
      const d = freqDecision({ times: history.get(e.email) ?? [] }, config.freq, at)
      if (d.kind !== 'ok') freqCapEstimate++
    }
  }

  const keys = assignSortKeys(ok.map((e) => ({ email: e.email, domain: emailDomain(e.email), tier: e.tier })))
  const sample = ok
    .map((e, i) => ({ e, k: keys[i] }))
    .sort((a, b) => a.k - b.k || a.e.userId - b.e.userId)
    .slice(0, 20)
    .map(({ e }) => ({ id: e.userId, email: e.email, nickname: e.nickname }))

  return { matched, eligible: ok.length, excluded, freqCapEstimate, sample }
}

/** 「粘贴用户 ID 或邮箱」→ 用户 id（去重），并返回没找到的条目 */
export async function resolvePastedUsers(text: string): Promise<{ userIds: number[]; notFound: string[] }> {
  const tokens = Array.from(
    new Set(
      String(text || '')
        .split(/[\s,，;；、|]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ).slice(0, MAX_USERS_AUDIENCE * 2)

  const idTokens = tokens.filter((t) => /^\d{1,10}$/.test(t))
  const emailTokens = tokens.filter((t) => t.includes('@'))
  const ids = Array.from(new Set(idTokens.map(Number).filter((n) => Number.isSafeInteger(n) && n > 0)))
  const emails = Array.from(new Set(emailTokens.map((t) => t.toLowerCase()).filter((e) => e.length <= 100)))

  const foundIds = new Set<number>()
  for (const part of chunks(ids, IN_CHUNK)) {
    const rows = await prisma.user.findMany({ where: { id: { in: part } }, select: { id: true } })
    rows.forEach((r) => foundIds.add(r.id))
  }
  const byEmail = new Map<string, number>()
  for (const part of chunks(emails, IN_CHUNK)) {
    const rows = await prisma.user.findMany({ where: { email: { in: part } }, select: { id: true, email: true } })
    rows.forEach((r) => {
      if (r.email) byEmail.set(r.email.trim().toLowerCase(), r.id)
    })
  }

  const userIds: number[] = []
  const seen = new Set<number>()
  const notFound: string[] = []
  for (const t of tokens) {
    let id: number | undefined
    if (/^\d{1,10}$/.test(t)) id = foundIds.has(Number(t)) ? Number(t) : undefined
    else if (t.includes('@')) id = byEmail.get(t.toLowerCase())
    if (id == null) {
      notFound.push(clip(t, 100) || t)
      continue
    }
    if (!seen.has(id)) {
      seen.add(id)
      userIds.push(id)
    }
  }
  return { userIds, notFound }
}

export interface RecipientRow {
  userId: number
  email: string
  domain: string
  status: 'QUEUED' | 'SKIPPED'
  skipReason: SkipReason | null
  sortKey: number
}

/** 物化用：算出全部收件人行（含被排除的 SKIPPED 行）；没邮箱的只计数 */
export async function buildRecipientRows(spec: AudienceSpec, topic: Topic, now: Date): Promise<{ rows: RecipientRow[]; noEmail: number }> {
  // worker 路径：配置读不到就抛（fail closed），由 worker 把活动暂停并写明原因
  const config = await getConfig({ strict: true })
  const { entries } = await loadAudience(spec, topic, now, config)
  let noEmail = 0
  const withEmail: AudienceEntry[] = []
  for (const e of entries) {
    // 没有邮箱、或邮箱格式不对（被禁用的账号不会走到 NO_EMAIL 判定，这里再兜一次）：只计数、不写行
    if (e.reason === 'NO_EMAIL' || !isValidEmail(e.email)) noEmail++
    else withEmail.push(e)
  }
  const keys = assignSortKeys(withEmail.map((e) => ({ email: e.email, domain: emailDomain(e.email), tier: e.tier })))
  const rows: RecipientRow[] = withEmail.map((e, i) => ({
    userId: e.userId,
    email: e.email,
    domain: (clip(emailDomain(e.email), 100) || '').toLowerCase(),
    status: e.reason ? 'SKIPPED' : 'QUEUED',
    skipReason: e.reason,
    sortKey: keys[i],
  }))
  return { rows, noEmail }
}
