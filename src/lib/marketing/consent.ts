/**
 * 订阅偏好、留痕、抑制名单的读写。退订页、个人中心、后台、同步任务都经过这里，
 * 保证「只在状态真的变化时写留痕」「管理员只能减少来信」这两条规矩只写一遍。
 *
 * 【实现方：发送引擎】签名是契约。权限规则见设计文档 10.1–10.3。
 */
import { prisma } from '@/lib/db'
import { PRIVACY_UPDATED_AT } from '@/lib/legal'
import { audit } from './audit'
import { bjDateKey } from './time'
import {
  CONSENT_STATUSES,
  TOPICS,
  UNSUPPRESSIBLE_REASONS,
  clip,
  parseTopicsOff,
  serializeTopicsOff,
  type ConsentAction,
  type ConsentSource,
  type ConsentStatus,
  type SuppressionReason,
  type Topic,
} from './types'

export interface ConsentView {
  status: ConsentStatus
  topicsOff: Topic[]
  pausedUntil: Date | null
}
export const DEFAULT_CONSENT_VIEW: ConsentView = { status: 'DEFAULT', topicsOff: [], pausedUntil: null }

/** IN 查询每批的上限（MySQL 的 max_allowed_packet 与执行计划都受 IN 列表长度影响） */
const IN_CHUNK = 1000

function chunks<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

function toView(row: { status: string; topicsOff: string | null; pausedUntil: Date | null }): ConsentView {
  // 只可能由本文件写入；万一出现认不出的状态值，按「已退订」处理 —— 宁可少发，不能多发
  const status = (CONSENT_STATUSES as readonly string[]).includes(row.status) ? (row.status as ConsentStatus) : 'UNSUBSCRIBED'
  return { status, topicsOff: parseTopicsOff(row.topicsOff), pausedUntil: row.pausedUntil }
}

/** 批量取偏好（没有行的用户不出现在 Map 里 ≡ DEFAULT_CONSENT_VIEW） */
export async function loadConsents(userIds: number[]): Promise<Map<number, ConsentView>> {
  const out = new Map<number, ConsentView>()
  const ids = Array.from(new Set(userIds.filter((n) => Number.isInteger(n) && n > 0)))
  for (const part of chunks(ids, IN_CHUNK)) {
    const rows = await prisma.marketingConsent.findMany({
      where: { userId: { in: part } },
      select: { userId: true, status: true, topicsOff: true, pausedUntil: true },
    })
    for (const r of rows) out.set(r.userId, toView(r))
  }
  return out
}

export async function getConsent(userId: number): Promise<ConsentView> {
  const row = await prisma.marketingConsent.findUnique({
    where: { userId },
    select: { status: true, topicsOff: true, pausedUntil: true },
  })
  return row ? toView(row) : { ...DEFAULT_CONSENT_VIEW, topicsOff: [] }
}

/** 批量查抑制名单（key 为小写邮箱） */
export async function loadSuppressed(emails: string[]): Promise<Map<string, SuppressionReason>> {
  const out = new Map<string, SuppressionReason>()
  const list = Array.from(new Set(emails.map((e) => (e || '').trim().toLowerCase()).filter(Boolean)))
  for (const part of chunks(list, IN_CHUNK)) {
    const rows = await prisma.marketingSuppression.findMany({
      where: { email: { in: part } },
      select: { email: true, reason: true },
    })
    for (const r of rows) out.set(r.email.toLowerCase(), r.reason as SuppressionReason)
  }
  return out
}

export type ConsentChange =
  | { kind: 'subscribe' } // → SUBSCRIBED（仅用户本人）
  | { kind: 'unsubscribe' } // → UNSUBSCRIBED
  | { kind: 'resubscribe' } // UNSUBSCRIBED → DEFAULT（token 页 30 天内 / 用户本人）
  | { kind: 'topics'; topicsOff: Topic[] } // 不改 status
  | { kind: 'pause'; days: number } // 不改 status
  | { kind: 'resume' } // 清 pausedUntil

export interface ConsentChangeMeta {
  source: ConsentSource
  email: string
  campaignId?: number | null
  messageId?: number | null
  ip?: string | null
  ua?: string | null
  note?: string | null
}

/** 暂停天数上限（界面只给 30 天；这里防的是接口被直接调用） */
const MAX_PAUSE_DAYS = 365

/** 生效中的暂停（过期的 pausedUntil 视同没有） */
function activePause(v: ConsentView, now: Date): Date | null {
  return v.pausedUntil && v.pausedUntil.getTime() > now.getTime() ? v.pausedUntil : null
}

/**
 * 应用一次偏好变更。状态没变则不写库、不写留痕（changed=false）。
 * 权限（「增加来信」的动作谁能做）由调用方先判；这里只负责一致地落库 + 留痕。
 *
 * 规矩（设计 4、10.2）：
 *  · 只调主题 / 暂停不改变 status —— 否则 opt-out 下的一次微调会被误记成明确同意
 *  · resubscribe 回到 DEFAULT 而不是 SUBSCRIBED：「点错了恢复」不等于「明确同意」
 *  · pause 只会把暂停往后延，不会缩短（减少来信的动作不能被用来提前恢复来信）
 *  · 退订带 messageId 时同时记下那封邮件的 unsubscribedAt（报表的退订数来自这里，幂等）
 */
export async function applyConsentChange(
  userId: number,
  change: ConsentChange,
  meta: ConsentChangeMeta
): Promise<{ changed: boolean; state: ConsentView }> {
  const now = new Date()

  const attempt = async (): Promise<{ changed: boolean; state: ConsentView }> =>
    prisma.$transaction(async (tx) => {
      const row = await tx.marketingConsent.findUnique({
        where: { userId },
        select: { id: true, status: true, topicsOff: true, pausedUntil: true },
      })
      const cur: ConsentView = row ? toView(row) : { ...DEFAULT_CONSENT_VIEW, topicsOff: [] }
      const next: ConsentView = { status: cur.status, topicsOff: [...cur.topicsOff], pausedUntil: activePause(cur, now) }
      let action: ConsentAction
      let detail: string | null = null

      switch (change.kind) {
        case 'subscribe':
          next.status = 'SUBSCRIBED'
          action = 'SUBSCRIBE'
          break
        case 'unsubscribe':
          next.status = 'UNSUBSCRIBED'
          action = 'UNSUBSCRIBE'
          break
        case 'resubscribe':
          if (cur.status === 'UNSUBSCRIBED') next.status = 'DEFAULT'
          action = 'SUBSCRIBE'
          detail = '恢复订阅（回到默认状态）'
          break
        case 'topics': {
          const list = (change.topicsOff || []).filter((t): t is Topic => (TOPICS as readonly string[]).includes(t))
          next.topicsOff = parseTopicsOff(serializeTopicsOff(list))
          action = 'TOPICS'
          detail = `关闭主题：${next.topicsOff.join(',') || '无'}`
          break
        }
        case 'pause': {
          const days = Math.min(MAX_PAUSE_DAYS, Math.max(1, Math.floor(Number(change.days) || 0)))
          const until = new Date(now.getTime() + days * 86400_000)
          const curPause = activePause(cur, now)
          next.pausedUntil = curPause && curPause.getTime() >= until.getTime() ? curPause : until
          action = 'PAUSE'
          detail = `暂停 ${days} 天，至 ${bjDateKey(next.pausedUntil)}`
          break
        }
        case 'resume':
          next.pausedUntil = null
          action = 'RESUME'
          break
        default:
          throw new Error('未知的订阅变更')
      }

      const before = { s: cur.status, t: serializeTopicsOff(cur.topicsOff), p: activePause(cur, now)?.getTime() ?? null }
      const after = { s: next.status, t: serializeTopicsOff(next.topicsOff), p: next.pausedUntil?.getTime() ?? null }
      const changed = before.s !== after.s || before.t !== after.t || before.p !== after.p
      if (!changed) return { changed: false, state: cur }

      const data = {
        status: next.status,
        topicsOff: serializeTopicsOff(next.topicsOff),
        pausedUntil: next.pausedUntil,
        source: meta.source,
      }
      if (row) await tx.marketingConsent.update({ where: { id: row.id }, data })
      else await tx.marketingConsent.create({ data: { userId, ...data, createdAt: now } })

      const note = meta.note ? String(meta.note).trim() : ''
      await tx.marketingConsentLog.create({
        data: {
          userId,
          email: clip((meta.email || '').trim().toLowerCase(), 191) || '',
          action,
          detail: clip([detail, note].filter(Boolean).join('；') || null, 255),
          source: meta.source,
          campaignId: meta.campaignId ?? null,
          messageId: meta.messageId ?? null,
          ip: clip(meta.ip ?? null, 64),
          ua: clip(meta.ua ?? null, 255),
          policyVersion: PRIVACY_UPDATED_AT,
          createdAt: now,
        },
      })

      if (change.kind === 'unsubscribe' && meta.messageId) {
        await tx.marketingMessage.updateMany({
          where: { id: meta.messageId, unsubscribedAt: null },
          data: { unsubscribedAt: now },
        })
      }
      return { changed: true, state: next }
    })

  try {
    return await attempt()
  } catch (e) {
    // 同一用户第一次变更被并发触发（两个标签页 / 一键退订 + 页面同时点）：userId 唯一约束撞了，
    // 另一边已经建好行 —— 重来一次，按已有行比较
    if ((e as { code?: string })?.code === 'P2002') return attempt()
    throw e
  }
}

/** 注册成功时记一条 NOTICE 留痕（证明告知语已展示） */
export async function logRegisterNotice(user: { id: number; email: string }, ip: string | null, ua: string | null): Promise<void> {
  try {
    await prisma.marketingConsentLog.create({
      data: {
        userId: user.id,
        email: clip((user.email || '').trim().toLowerCase(), 191) || '',
        action: 'NOTICE',
        detail: '注册页展示了营销邮件告知语',
        source: 'register',
        ip: clip(ip, 64),
        ua: clip(ua, 255),
        policyVersion: PRIVACY_UPDATED_AT,
        createdAt: new Date(),
      },
    })
  } catch (err) {
    // 留痕失败不能让注册失败；只记用户 id
    console.error('[marketing] 注册告知留痕失败 user=', user.id, (err as Error)?.message)
  }
}

/** 加入抑制名单（已存在则保留原原因，除非新原因是 COMPLAINT —— 投诉优先级最高） */
export async function suppressEmail(
  email: string,
  reason: SuppressionReason,
  source: 'send' | 'aliyun_sync' | 'admin',
  detail?: string | null,
  campaignId?: number | null
): Promise<void> {
  const e = (email || '').trim().toLowerCase()
  if (!e || e.length > 191) return
  const data = {
    reason,
    source,
    detail: clip(detail ?? null, 500),
    campaignId: campaignId ?? null,
  }
  const upgrade = async () => {
    // 已存在：只有「升级为投诉」才改（投诉永不解除，覆盖掉 MANUAL/INVALID 之类可解除的原因）
    if (reason !== 'COMPLAINT') return
    await prisma.marketingSuppression.updateMany({ where: { email: e, reason: { not: 'COMPLAINT' } }, data })
  }
  const existing = await prisma.marketingSuppression.findUnique({ where: { email: e }, select: { id: true } })
  if (existing) return upgrade()
  try {
    await prisma.marketingSuppression.create({ data: { email: e, ...data, createdAt: new Date() } })
  } catch (err) {
    // 并发插入（sync 与 worker 同时判定同一个地址）：按已存在处理
    if ((err as { code?: string })?.code === 'P2002') return upgrade()
    throw err
  }
}

/** 管理员解除抑制：COMPLAINT 一律拒绝（返回 false） */
export async function unsuppressEmail(email: string, actorId: number): Promise<boolean> {
  const e = (email || '').trim().toLowerCase()
  if (!e) return true
  const row = await prisma.marketingSuppression.findUnique({ where: { email: e }, select: { id: true, reason: true } })
  if (!row) return true // 本来就不在名单里：幂等
  if (!UNSUPPRESSIBLE_REASONS.includes(row.reason as SuppressionReason)) return false
  // 条件删除：读和删之间若被 sync 升级成了 COMPLAINT，这里删不掉（count=0）→ 如实返回 false
  const r = await prisma.marketingSuppression.deleteMany({
    where: { id: row.id, reason: { in: UNSUPPRESSIBLE_REASONS } },
  })
  if (r.count !== 1) {
    const still = await prisma.marketingSuppression.findUnique({ where: { email: e }, select: { id: true } })
    return !still // 被别人先删了 = 目的已达成；还在 = 已被升级成投诉
  }
  // 审计不写邮箱原文（PII），只写原因与名单行号
  await audit('UNSUPPRESS', { actorId, detail: { suppressionId: row.id, reason: row.reason } })
  return true
}
