/**
 * 出队（docs/微信机器人-设计.md §5.6、§12.1）：入队、租约、确认、重试、过期、合并、免打扰。
 *
 * 语义：至少一次。取一条时用条件更新把 PENDING → SENDING（lease_until = now + 90 秒），以影响行数为准；
 * 发送成功 SENT；失败回 PENDING 并按退避设 not_before；进程在途中重启 → 租约过期由 tick 收回。
 */
import { prisma } from '../db'
import { decryptCardContent, encryptCardContent } from '../cardkey'
import { renderDigest } from './render'
import { PRIORITY, type OutboxKind } from './types'

const LEASE_MS = 90_000
/** 失败退避：30 秒、2 分钟、10 分钟、30 分钟，第 5 次失败 → FAILED */
const BACKOFF_MS = [30_000, 120_000, 600_000, 1_800_000]
export const MAX_ATTEMPTS = 5
const TTL_MS: Record<OutboxKind, number> = {
  EVENT: 12 * 3600_000,
  DIGEST: 12 * 3600_000,
  ALERT: 12 * 3600_000,
  REPORT: 72 * 3600_000,
  REPLY: 10 * 60_000,
}
/** 合并门槛：同一会话待发普通动态 ≥ 3 条且最早一条已等 ≥ 60 秒 */
const DIGEST_MIN = 3
const DIGEST_WAIT_MS = 60_000
const DIGEST_MAX_LINES = 10

export interface EnqueueInput {
  conversationId: number
  kind: OutboxKind
  text: string
  dedupeKey: string
  priority?: number
  eventId?: number | null
  category?: string | null
  summary?: string | null
  notBefore?: Date
  expiresAt?: Date
}

function defaultPriority(kind: OutboxKind): number {
  if (kind === 'REPLY') return PRIORITY.REPLY
  if (kind === 'ALERT') return PRIORITY.URGENT
  if (kind === 'REPORT') return PRIORITY.REPORT
  return PRIORITY.EVENT
}

/** 批量入队；(conversation_id, dedupe_key) 唯一，重复的静默跳过。返回实际插入条数 */
export async function enqueueMany(items: EnqueueInput[], now: Date = new Date()): Promise<number> {
  if (!items.length) return 0
  const res = await prisma.botOutbox.createMany({
    data: items.map((i) => ({
      conversationId: i.conversationId,
      eventId: i.eventId ?? null,
      kind: i.kind,
      priority: i.priority ?? defaultPriority(i.kind),
      text: i.text,
      category: i.category ?? null,
      summary: i.summary ? i.summary.slice(0, 120) : null,
      dedupeKey: i.dedupeKey.slice(0, 80),
      status: 'PENDING',
      notBefore: i.notBefore ?? now,
      expiresAt: i.expiresAt ?? new Date(now.getTime() + TTL_MS[i.kind]),
    })),
    skipDuplicates: true,
  })
  return res.count
}

/**
 * 含卡密或一次性链接的消息（提卡回执、补货链接）在库里加密存放（附录 B 第 15 条：核销链接只出现在发出去的那条消息里）：
 * 与 card_keys 同一把密钥（CARDKEY_SECRET），bot_outbox.text 存「enc:<密文>」，发送器发之前才解开。
 * 合并（DIGEST）只合普通动态，碰不到它们；后台只看状态、不看正文。
 */
const SEALED_PREFIX = 'enc:'

export function sealOutboxText(plain: string): string {
  return SEALED_PREFIX + encryptCardContent(plain)
}

/** 发送器用：加密的解开，普通的原样返回。解不开（密钥换了）抛错，由调用方按发送失败处理 */
export function openOutboxText(stored: string): string {
  return stored.startsWith(SEALED_PREFIX) ? decryptCardContent(stored.slice(SEALED_PREFIX.length)) : stored
}

/** 指令回复：最高优先级，10 分钟发不出去就作废 */
export async function enqueueReply(conversationId: number, text: string, dedupeKey: string, now: Date = new Date()): Promise<number> {
  return enqueueMany([{ conversationId, kind: 'REPLY', text, dedupeKey }], now)
}

/**
 * 合并：某会话待发的普通动态（EVENT，不含紧急）≥ 3 条且最早一条已等 ≥ 60 秒 → 合成一条 DIGEST，原行标 MERGED。
 * 在一个事务里做；条件更新只认仍是 PENDING 的行，与发送器并发时不会把正在发的那条也合进去。
 */
export async function mergeDigest(conversationId: number, siteLabel: string, now: Date = new Date()): Promise<boolean> {
  const rows = await prisma.botOutbox.findMany({
    where: { conversationId, status: 'PENDING', kind: 'EVENT', priority: { lte: PRIORITY.EVENT }, notBefore: { lte: now } },
    orderBy: { id: 'asc' },
    take: 60,
    select: { id: true, summary: true, createdAt: true },
  })
  if (rows.length < DIGEST_MIN) return false
  if (now.getTime() - rows[0].createdAt.getTime() < DIGEST_WAIT_MS) return false
  const shown = rows.slice(0, DIGEST_MAX_LINES).map((r) => r.summary || '一条动态')
  const more = rows.length - shown.length
  const text = renderDigest(siteLabel, shown, more)
  return prisma.$transaction(async (tx) => {
    const digest = await tx.botOutbox.create({
      data: {
        conversationId,
        kind: 'DIGEST',
        priority: PRIORITY.EVENT,
        text,
        dedupeKey: `dg:${rows[0].id}-${rows[rows.length - 1].id}`,
        status: 'PENDING',
        notBefore: now,
        expiresAt: new Date(now.getTime() + TTL_MS.DIGEST),
      },
    })
    const r = await tx.botOutbox.updateMany({
      where: { id: { in: rows.map((x) => x.id) }, status: 'PENDING' },
      data: { status: 'MERGED', mergedInto: digest.id },
    })
    if (r.count !== rows.length) throw new Error('合并时有行已被取走，放弃这次合并') // 回滚，下轮再合
    return true
  }).catch((e) => {
    console.warn('[bot] 合并动态放弃', (e as Error)?.message)
    return false
  })
}

export interface LeasedItem {
  id: number
  conversationId: number
  kind: string
  text: string
  attempts: number
}

/** 取一条某会话最该发的消息并加租约；没有返回 null。onlyKinds：只取这几种（推送停用时只发指令回复） */
export async function leaseNext(conversationId: number, now: Date = new Date(), onlyKinds?: readonly OutboxKind[]): Promise<LeasedItem | null> {
  for (let i = 0; i < 3; i++) {
    const row = await prisma.botOutbox.findFirst({
      where: { conversationId, status: 'PENDING', notBefore: { lte: now }, expiresAt: { gt: now }, ...(onlyKinds ? { kind: { in: [...onlyKinds] } } : {}) },
      orderBy: [{ priority: 'desc' }, { id: 'asc' }],
      select: { id: true, conversationId: true, kind: true, text: true, attempts: true },
    })
    if (!row) return null
    const r = await prisma.botOutbox.updateMany({
      where: { id: row.id, status: 'PENDING' },
      data: { status: 'SENDING', leaseUntil: new Date(now.getTime() + LEASE_MS) },
    })
    if (r.count === 1) return row
  }
  return null
}

export async function markSent(id: number, now: Date = new Date()): Promise<void> {
  await prisma.botOutbox.updateMany({ where: { id, status: 'SENDING' }, data: { status: 'SENT', sentAt: now, leaseUntil: null, lastError: null } })
}

/** 发送失败：回 PENDING 并退避；第 5 次失败 → FAILED。返回是否已终结 */
export async function markFailed(item: { id: number; attempts: number }, error: string, now: Date = new Date()): Promise<boolean> {
  const attempts = item.attempts + 1
  const final = attempts >= MAX_ATTEMPTS
  await prisma.botOutbox.updateMany({
    where: { id: item.id, status: 'SENDING' },
    data: final
      ? { status: 'FAILED', attempts, leaseUntil: null, lastError: error.slice(0, 255) }
      : {
          status: 'PENDING',
          attempts,
          leaseUntil: null,
          lastError: error.slice(0, 255),
          notBefore: new Date(now.getTime() + BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)]),
        },
  })
  return final
}

/**
 * iLink（附录 E）：对方超过约 24 小时没说话，推送窗口关了。**不算失败**：取出的这条放回待发，同会话其它待发的也往后挪到 until，
 * lastError 记 NO_CONTEXT；对方一发消息，收消息循环调 flushDeferred 只把这些提前（免打扰、失败退避的不动）
 */
export const DEFER_NO_CONTEXT = 'NO_CONTEXT'

export async function deferConversation(conversationId: number, itemId: number, until: Date, reason: string = DEFER_NO_CONTEXT): Promise<void> {
  await prisma.botOutbox.updateMany({ where: { id: itemId, status: 'SENDING' }, data: { status: 'PENDING', leaseUntil: null, notBefore: until, lastError: reason } })
  await prisma.botOutbox.updateMany({ where: { conversationId, status: 'PENDING', notBefore: { lt: until } }, data: { notBefore: until, lastError: reason } })
}

export async function flushDeferred(conversationId: number, now: Date = new Date()): Promise<number> {
  const r = await prisma.botOutbox.updateMany({
    where: { conversationId, status: 'PENDING', lastError: DEFER_NO_CONTEXT, notBefore: { gt: now } },
    data: { notBefore: now, lastError: null },
  })
  return r.count
}

/** 租约过期（进程在发送途中死掉）→ 收回成 PENDING，计一次尝试 */
export async function recoverLeases(now: Date = new Date()): Promise<number> {
  const stale = await prisma.botOutbox.findMany({
    where: { status: 'SENDING', leaseUntil: { lt: now } },
    select: { id: true, attempts: true },
    take: 200,
  })
  let n = 0
  for (const s of stale) {
    const r = await prisma.botOutbox.updateMany({
      where: { id: s.id, status: 'SENDING', leaseUntil: { lt: now } },
      data: s.attempts + 1 >= MAX_ATTEMPTS ? { status: 'FAILED', attempts: s.attempts + 1, lastError: '租约过期（发送途中进程重启）' } : { status: 'PENDING', attempts: s.attempts + 1, leaseUntil: null },
    })
    n += r.count
  }
  return n
}

/** 过期作废；返回作废条数 */
export async function expireOld(now: Date = new Date()): Promise<number> {
  const r = await prisma.botOutbox.updateMany({ where: { status: 'PENDING', expiresAt: { lte: now } }, data: { status: 'EXPIRED' } })
  return r.count
}

/** 会话解绑 / 暂停时作废它的待发消息（日报除外的全部） */
export async function cancelPendingForConversation(conversationId: number): Promise<number> {
  const r = await prisma.botOutbox.updateMany({
    where: { conversationId, status: { in: ['PENDING'] } },
    data: { status: 'CANCELLED' },
  })
  return r.count
}

/** 免打扰：给定北京时间分钟区间 [from, to)（可跨零点），返回 now 若在区间内则返回区间结束时刻，否则 null */
export function quietUntil(now: Date, from: number | null, to: number | null): Date | null {
  if (from === null || to === null || from === to) return null
  const bj = new Date(now.getTime() + 8 * 3600_000)
  const minute = bj.getUTCHours() * 60 + bj.getUTCMinutes()
  const inQuiet = from < to ? minute >= from && minute < to : minute >= from || minute < to
  if (!inQuiet) return null
  let delta = to - minute
  if (delta <= 0) delta += 1440
  const end = new Date(now.getTime() + delta * 60_000)
  end.setUTCSeconds(0, 0)
  return end
}
