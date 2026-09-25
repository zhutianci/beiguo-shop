/**
 * 发送 worker 的一趟（cron 每分钟 POST /api/cron/marketing）。流程见设计文档 5.3。
 *
 * 【实现方：发送引擎】签名是契约。opts 只给集成测试用（注入假传输层、加速间隔、固定时钟），
 * 生产调用一律不传。
 *
 * 不重复发送的全部保证（设计第 12 节，改动前务必想清楚）：
 *  1. (campaignId, email) 唯一 → 物化可重入
 *  2. 行只有 QUEUED→CLAIMED 的 CAS 成功（count===1）才继续；CLAIMED→SENDING 同样是 CAS
 *  3. SENDING 超时一律 UNKNOWN，绝不自动重发（阿里云没有幂等键）
 *  4. 发出去之前一定重读活动状态与收件人资格（退订立即生效）
 *  5. 锁 mkt:send 保证同一时刻只有一个 worker；每发一封续一次锁
 *
 * 时间：业务时间（claimedAt / sentAt / 比较用的 now）一律取 opts.now ?? new Date() 由应用写入；
 * 单趟截止与发送间隔用真实流逝时间（Date.now()），与注入的时钟无关。
 */
import crypto from 'crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { siteOrigin } from '@/lib/news/format'
import { notifyMarketing } from '@/lib/notify'
import { audit } from './audit'
import { buildRecipientRows } from './audience'
import { todayUsage } from './budget'
import {
  ACCT_BREAKER_KIND,
  acctBreakerSince,
  backoffDomains,
  getConfig,
  getHalt,
  getSyncState,
  isDryRun,
  isHalted,
  marketingSender,
  senderReady,
  setHalt,
} from './config'
import { getConsent, loadSuppressed, suppressEmail } from './consent'
import { grantCampaignCoupon } from './coupon'
import { autoPauseCampaign } from './lifecycle'
import { acquireLock, releaseLock, renewLock } from './lock'
import { FIRST_NOTICE_TEXT, personalizeHtml, personalizeSubject, personalizeText } from './personalize'
import {
  CANARY_WAIT_MS,
  INTERRUPTED_CODE,
  MAX_CONNECT_ATTEMPTS,
  NO_ACTIVITY,
  SPAM_REJECT_CODE,
  THROTTLE_DELAY_MS,
  backoffMs,
  classifySend,
  eligibility,
  evaluateBreaker,
  freqDecision,
  type BreakerStats,
} from './policy'
import { cleanNickname } from './snapshot'
import { sendMarketingMail, type MarketingMailInput, type SendAttempt } from './transport'
import { bjDateCn, bjDateKey, bjDayStart, inSendWindow, nextDayWindowStart } from './time'
import {
  SENDER_SIDE_CLASSES,
  TOPICS,
  audienceSpecSchema,
  clip,
  type CampaignRefs,
  type HaltState,
  type MarketingConfig,
  type SkipReason,
  type Topic,
} from './types'

export interface TickSummary {
  skipped?: 'locked' | 'config_unreadable'
  recovered: { claimed: number; sending: number }
  materialized: number | null
  sent: number
  skippedRows: number
  failed: number
  unknown: number
  retried: number
  stoppedBy: string | null
  ms: number
}

export interface TickOptions {
  /** 单趟停止开始新发送的时间（默认 35_000ms） */
  deadlineMs?: number
  /** 替换间隔等待（测试传 0 等待） */
  sleep?: (ms: number) => Promise<void>
  /** 替换传输层（测试模拟各种阿里云返回） */
  transport?: (input: MarketingMailInput) => Promise<SendAttempt>
  /** 替换时钟 */
  now?: () => Date
}

/* ============================== 时间常量（设计第 3 节的不变量，测试钉住） ============================== */

/** 单趟 35 秒后不再开始新发送 */
export const TICK_DEADLINE_MS = 35_000
/** 锁 TTL：大于单趟最长耗时（35s + 最后一封的 10s 超时 + 收尾），小于 SENDING 回收阈值 */
export const SEND_LOCK_TTL_MS = 3 * 60_000
/** CLAIMED 超过 2 分钟 → QUEUED（请求一定没发出去：发之前会先翻成 SENDING） */
export const CLAIM_STALE_MS = 2 * 60_000
/** SENDING 超过 5 分钟 → UNKNOWN(INTERRUPTED)：进程在调用阿里云途中被杀，不知道发没发 */
export const SENDING_STALE_MS = 5 * 60_000
/** 发送循环里每 5 秒重读一次总开关与急停 */
const RECHECK_MS = 5_000
const MATERIALIZE_CHUNK = 500
const UNKNOWN_HALT_MS = 15 * 60_000
const SPAM_HALT_MS = 24 * 3600_000
const CONFIG_HALT_MS = 24 * 3600_000
const SPAM_REPEAT_WINDOW_MS = 10 * 60_000
const FAIL_STREAK_PAUSE = 5
const SYNC_STALE_MS = 60 * 60_000
const SYNC_HALT_MS = 60 * 60_000
const CANARY_RESULT_RATIO = 0.8
const ROW_ERROR_RETRY_MS = 5 * 60_000
const COUPON_ERROR_RETRY_MS = 2 * 60_000
const MAX_ROW_ERRORS = 5
const DAY_MS = 86400_000
const HOUR_MS = 3600_000

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function errMsg(e: unknown): string {
  return String((e as Error)?.message || e).slice(0, 300)
}

/* ============================== 一趟的上下文 ============================== */

interface Ctx {
  lockToken: string
  now: () => Date
  sleep: (ms: number) => Promise<void>
  transport: (input: MarketingMailInput) => Promise<SendAttempt>
  config: MarketingConfig
  summary: TickSummary
  /** 今天还能发几封（SENT/UNKNOWN 才扣） */
  budget: number
  /** 上一次真实调用阿里云结束的时刻（真实时间 ms） */
  lastCallAt: number
  /** 连续「结果未知」次数（跨趟：开始时从库里接上一趟的尾巴） */
  unknownStreak: number
  origin: string
  /**
   * 活动 id → 试探窗口内已发（SENT/SENDING/UNKNOWN）封数，试探闸门用。
   * since = 窗口起点（今日零点或「继续」的时刻）：同一趟里被暂停又继续，窗口变了就得重数（审查 C0）
   */
  sentToday: Map<number, { since: number; n: number }>
  lockLost: boolean
}

interface WorkRow {
  id: number
  campaignId: number
  userId: number | null
  email: string
  /** 退订 / 偏好页凭证：只进退订链接与 List-Unsubscribe 头 */
  token: string
  /** 点击跳转 / 打开像素凭证（与 token 分开，审查 C5） */
  trackToken: string
  attempts: number
  claimedAt: Date
}

interface RowResult {
  kind: 'sent' | 'unknown' | 'failed' | 'retry' | 'skipped' | 'delayed' | 'cancelled' | 'released'
  /** 本趟就此结束（写进 stoppedBy） */
  stop?: string
  /** 本趟不再从这个活动取行 */
  skipCampaign?: boolean
}

/* ============================== 行的状态写入（全部 CAS） ============================== */

/** CLAIMED/SENDING → QUEUED（请求没发出去 / 活动不在发送中）。nextAttemptAt 传 undefined 表示不改 */
async function releaseRow(
  id: number,
  from: 'CLAIMED' | 'SENDING',
  opts: { nextAttemptAt?: Date | null; errorCode?: string | null; errorMsg?: string | null; attempts?: number } = {}
): Promise<void> {
  await prisma.marketingMessage.updateMany({
    where: { id, status: from },
    data: {
      status: 'QUEUED',
      claimedAt: null,
      subjectSent: null,
      sender: null,
      ...(opts.nextAttemptAt !== undefined ? { nextAttemptAt: opts.nextAttemptAt } : {}),
      ...(opts.errorCode !== undefined ? { errorCode: clip(opts.errorCode, 64) } : {}),
      ...(opts.errorMsg !== undefined ? { errorMsg: clip(opts.errorMsg, 500) } : {}),
      ...(opts.attempts !== undefined ? { attempts: opts.attempts } : {}),
    },
  })
}

async function skipRow(id: number, reason: SkipReason, note?: string): Promise<void> {
  await prisma.marketingMessage.updateMany({
    where: { id, status: 'CLAIMED' },
    data: { status: 'SKIPPED', skipReason: reason, errorMsg: note ? clip(note, 500) : null },
  })
}

async function finishRow(id: number, data: Prisma.MarketingMessageUpdateManyMutationInput): Promise<void> {
  await prisma.marketingMessage.updateMany({ where: { id, status: 'SENDING' }, data })
}

/* ============================== 3. 回收与清扫 ============================== */

async function recoverStale(now: Date): Promise<{ claimed: number; sending: number }> {
  // CLAIMED 超时：还没翻成 SENDING，请求一定没发出去 → 安全放回队列
  const claimed = await prisma.marketingMessage.updateMany({
    where: {
      status: 'CLAIMED',
      OR: [{ claimedAt: null }, { claimedAt: { lt: new Date(now.getTime() - CLAIM_STALE_MS) } }],
    },
    data: { status: 'QUEUED', claimedAt: null, subjectSent: null },
  })
  // SENDING 超时：进程在调用阿里云途中死了。可能已发出 → UNKNOWN，sentAt=claimedAt（频控与额度照算），绝不重发。
  // sent_at = claimed_at 是列间复制，Prisma 的 updateMany 做不到，用原生 SQL；updated_at 也要手写（@updatedAt 是客户端维护的）
  const sending = await prisma.$executeRaw`
    UPDATE marketing_messages
       SET status = 'UNKNOWN',
           error_code = ${INTERRUPTED_CODE},
           error_msg = ${'发送途中被中断（进程退出或超时），结果未知，不自动重发'},
           sent_at = COALESCE(claimed_at, ${now}),
           updated_at = ${new Date()}
     WHERE status = 'SENDING'
       AND (claimed_at IS NULL OR claimed_at < ${new Date(now.getTime() - SENDING_STALE_MS)})`
  return { claimed: claimed.count, sending: Number(sending) || 0 }
}

/** 已取消活动残留的 QUEUED/CLAIMED → CANCELLED（取消与物化并发时，物化可能在取消之后又插入了行） */
async function sweepCancelled(): Promise<number> {
  const n = await prisma.$executeRaw`
    UPDATE marketing_messages m
      JOIN marketing_campaigns c ON c.id = m.campaign_id
       SET m.status = 'CANCELLED', m.updated_at = ${new Date()}
     WHERE c.status = 'CANCELLED' AND m.status IN ('QUEUED', 'CLAIMED')`
  return Number(n) || 0
}

/* ============================== 4. 物化（设计 5.6） ============================== */

async function materializeOne(ctx: Ctx): Promise<number | null> {
  const now = ctx.now()
  const due = await prisma.marketingCampaign.findFirst({
    where: { status: 'SCHEDULED', OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }] },
    orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
    select: { id: true, name: true, topic: true, audience: true, html: true, finalSubject: true, materializedAt: true, updatedAt: true },
  })
  if (!due) return null

  if (due.materializedAt) {
    // 自愈：「物化途中被暂停」只写了 materializedAt；若「继续」恰好读到旧值把它放回了 SCHEDULED，
    // 它就既不会再被物化、也不在发送循环里 —— 这里把它推回 SENDING
    await prisma.marketingCampaign.updateMany({
      where: { id: due.id, status: 'SCHEDULED', materializedAt: { not: null } },
      data: { status: 'SENDING' },
    })
    return 0
  }

  let inserted = 0
  try {
    const topic = (TOPICS as readonly string[]).includes(due.topic) ? (due.topic as Topic) : null
    if (!topic) throw new Error('活动主题分类不正确')
    if (!due.html || !due.finalSubject) throw new Error('活动快照缺失（正文或主题为空），请撤回后重新发送')
    let rawSpec: unknown
    try {
      rawSpec = JSON.parse(due.audience)
    } catch {
      throw new Error('受众设置格式损坏')
    }
    const parsedSpec = audienceSpecSchema.safeParse(rawSpec)
    if (!parsedSpec.success) throw new Error(`受众设置不正确：${parsedSpec.error.errors[0].message}`)
    const spec = parsedSpec.data
    const { rows, noEmail } = await buildRecipientRows(spec, topic, now)

    for (let i = 0; i < rows.length; i += MATERIALIZE_CHUNK) {
      const part = rows.slice(i, i + MATERIALIZE_CHUNK)
      const r = await prisma.marketingMessage.createMany({
        data: part.map((row) => ({
          campaignId: due.id,
          userId: row.userId,
          email: row.email,
          domain: row.domain,
          token: crypto.randomBytes(16).toString('hex'),
          status: row.status,
          skipReason: row.skipReason,
          sortKey: row.sortKey,
        })),
        // (campaignId, email) 唯一：上一趟物化到一半被杀，这一趟重跑只补缺的行
        skipDuplicates: true,
      })
      inserted += r.count
      if (!(await renewLock('send', ctx.lockToken))) {
        ctx.lockLost = true
        throw new Error('物化途中丢失发送锁')
      }
    }

    const skipped = rows.filter((r) => r.status === 'SKIPPED').length
    const recipients = await prisma.marketingMessage.count({ where: { campaignId: due.id, status: { not: 'SKIPPED' } } })
    // CAS：带上读到时的 updatedAt —— 物化期间被撤回又重新发送（内容/受众可能都变了）也能识别出来
    const ok = await prisma.marketingCampaign.updateMany({
      where: { id: due.id, status: 'SCHEDULED', materializedAt: null, updatedAt: due.updatedAt },
      data: { status: 'SENDING', materializedAt: now, startedAt: now, recipientCount: recipients, statusNote: null },
    })
    if (ok.count === 1) {
      notifyMarketing('started', {
        campaignId: due.id,
        campaignName: due.name,
        rows: [
          { label: '可发', value: `${recipients} 人` },
          { label: '排除', value: `${skipped + noEmail} 人` },
        ],
      })
      await audit('START', { campaignId: due.id, detail: { recipients, skipped, noEmail, inserted } })
      return inserted
    }

    // CAS 失败：物化期间活动被改了状态
    const cur = await prisma.marketingCampaign.findUnique({ where: { id: due.id }, select: { status: true } })
    if (!cur || cur.status === 'CANCELLED') {
      await prisma.marketingMessage.updateMany({
        where: { campaignId: due.id, status: { in: ['QUEUED', 'CLAIMED'] } },
        data: { status: 'CANCELLED' },
      })
    } else if (cur.status === 'PAUSED') {
      // 已物化但处于暂停：只写 materializedAt（「继续」据此回到 SENDING 而不是 SCHEDULED）
      await prisma.marketingCampaign.updateMany({
        where: { id: due.id, status: 'PAUSED', materializedAt: null },
        data: { materializedAt: now, recipientCount: recipients },
      })
    } else if (cur.status === 'DRAFT' || cur.status === 'SCHEDULED') {
      // 被撤回为草稿（或撤回后又重新发送）：这批行一封都还没发，全部删掉，下一趟按新快照重新物化。
      // 不能改成 CANCELLED —— (campaignId, email) 唯一，留着会让重新发送时这些人永远被跳过
      await prisma.marketingMessage.deleteMany({ where: { campaignId: due.id, status: { in: ['QUEUED', 'SKIPPED'] } } })
    }
    return inserted
  } catch (e) {
    console.error('[mkt/worker] 物化失败 campaign=', due.id, errMsg(e))
    if (!ctx.lockLost) await autoPauseCampaign(due.id, `物化收件人失败：${errMsg(e)}`).catch(() => {})
    return inserted
  }
}

/* ============================== 5–8. 闸门、健康检查、熔断、复核 ============================== */

function gateReason(config: MarketingConfig, halt: HaltState, now: Date): string | null {
  if (!config.enabled) return 'disabled'
  if (isHalted(halt, now)) return 'halted'
  if (!inSendWindow(config.sendWindow, now)) return 'window'
  // 页脚的联系邮箱是法定义务（广告法 §43、管理办法 §14）：配置被清空后，已排队的也不许再发
  if (!config.contactEmail) return 'no_contact'
  // 营销发信地址没配就停，绝不回落到别的地址
  if (!senderReady()) return 'no_sender'
  return null
}

/** 同步健康：有活动在发、回执同步却超过 60 分钟没成功 → 看不到退信与投诉，不能继续发 */
async function syncHealth(now: Date): Promise<'ok' | 'stale' | 'unreadable'> {
  if (isDryRun()) return 'ok'
  const sending = await prisma.marketingCampaign.findMany({
    where: { status: 'SENDING' },
    select: { startedAt: true, materializedAt: true },
  })
  if (!sending.length) return 'ok'
  let sync
  try {
    sync = await getSyncState({ strict: true })
  } catch {
    return 'unreadable'
  }
  const lastOk = sync.lastOkAt ? Date.parse(sync.lastOkAt) : NaN
  if (Number.isFinite(lastOk)) return now.getTime() - lastOk > SYNC_STALE_MS ? 'stale' : 'ok'
  // 从没成功过：给第一次同步留 60 分钟（从最早开始发送的活动算起）
  let earliest = Infinity
  for (const c of sending) {
    const t = (c.startedAt ?? c.materializedAt)?.getTime()
    if (t != null && t < earliest) earliest = t
  }
  return Number.isFinite(earliest) && now.getTime() - earliest > SYNC_STALE_MS ? 'stale' : 'ok'
}

/** 回执说明（deliveryDetail =「分类 原文」）以发信方问题分类开头：我方认证失败 / 被拉黑（审查 C19） */
const SENDER_FAIL_DETAIL: Prisma.MarketingMessageWhereInput[] = SENDER_SIDE_CLASSES.flatMap((c) => [
  { deliveryDetail: { startsWith: `${c} ` } },
  { deliveryDetail: c },
])

/** 有回执的行的熔断统计。since：只算这个时刻之后的回执（breakerResetAt / 今日 / 手动解除账户级熔断） */
async function breakerStats(where: { campaignId?: number; since: Date | null; inclusive?: boolean }): Promise<BreakerStats> {
  const timeCond = where.since ? (where.inclusive ? { gte: where.since } : { gt: where.since }) : undefined
  const base = where.campaignId != null ? { campaignId: where.campaignId } : {}
  const [groups, complaints, senderFail] = await Promise.all([
    prisma.marketingMessage.groupBy({
      by: ['delivery'],
      where: { ...base, delivery: { not: null }, ...(timeCond ? { deliveryAt: timeCond } : {}) },
      _count: { _all: true },
    }),
    prisma.marketingMessage.count({
      where: {
        ...base,
        complainedAt: timeCond ? timeCond : { not: null },
        // 投递被阿里云拦下（status 4，如「收件人之前投诉/退订过」）的信没送到任何人，不算新投诉（审查 C16 第 3 条）。
        // delivery 为空（回执还没同步到）照算：宁可多停，不可漏算
        OR: [{ delivery: null }, { delivery: { not: 'FAILED' } }],
      },
    }),
    // 发信方问题（SPF/DKIM/DMARC 失败、发信人或域名被拉黑）：比例高说明我方发信坏了，继续发只会白烧额度、伤信誉（审查 C19）
    prisma.marketingMessage.count({
      where: { ...base, delivery: 'FAILED', ...(timeCond ? { deliveryAt: timeCond } : {}), OR: SENDER_FAIL_DETAIL },
    }),
  ])
  let results = 0
  let invalid = 0
  let spam = 0
  for (const g of groups) {
    results += g._count._all
    if (g.delivery === 'INVALID') invalid += g._count._all
    if (g.delivery === 'SPAM') spam += g._count._all
  }
  return { results, invalid, spam, complaints, senderFail }
}

/** 按 refs 复核发送中活动的商品与券：下架 / 改价 / 券失效 → 返回原因 */
async function refsProblem(refsRaw: string | null, now: Date): Promise<string | null> {
  if (!refsRaw) return null
  let refs: CampaignRefs
  try {
    refs = JSON.parse(refsRaw) as CampaignRefs
  } catch {
    return '活动快照的商品/券引用损坏'
  }
  const products = Array.isArray(refs.products) ? refs.products : []
  if (products.length) {
    const rows = await prisma.product.findMany({
      where: { id: { in: products.map((p) => p.id) } },
      select: { id: true, name: true, status: true, price: true },
    })
    const byId = new Map(rows.map((r) => [r.id, r] as const))
    for (const ref of products) {
      const p = byId.get(ref.id)
      if (!p) return `邮件里的商品 #${ref.id} 已被删除`
      if (p.status !== 1) return `邮件里的商品「${p.name}」已下架`
      const now2 = Number(p.price).toFixed(2)
      if (now2 !== ref.price) {
        // 邮件里写的是旧价格：继续发就是对外宣传一个不存在的价格。恢复原价后可继续，否则取消另建
        return `邮件里的商品「${p.name}」已从 ¥${ref.price} 改价为 ¥${now2}：恢复原价后可继续发送，否则请取消活动另建`
      }
    }
  }
  // 券限定的商品（邮件里写了「适用商品：X」）：下架/删除后券就用不了，继续发等于送一张废券（审查 C9）。
  // 只核存在与在售，不核价格 —— 邮件里没写它的价格
  const couponProducts = Array.isArray(refs.couponProducts)
    ? refs.couponProducts.filter((id): id is number => Number.isInteger(id) && id > 0)
    : []
  if (couponProducts.length) {
    const rows = await prisma.product.findMany({
      where: { id: { in: couponProducts } },
      select: { id: true, name: true, status: true },
    })
    const byId = new Map(rows.map((r) => [r.id, r] as const))
    for (const id of couponProducts) {
      const p = byId.get(id)
      if (!p) return `券适用的商品 #${id} 已被删除`
      if (p.status !== 1) return `券适用的商品「${p.name}」已下架`
    }
  }
  if (refs.couponId) {
    const c = await prisma.coupon.findUnique({ where: { id: refs.couponId }, select: { status: true, endAt: true } })
    if (!c || c.status !== 'ACTIVE') return '直发券批次已停止发放或已结束'
    if (c.endAt && c.endAt.getTime() - now.getTime() < 48 * HOUR_MS) return '券剩余有效期不足 48 小时'
  }
  if (refs.claimCode) {
    const c = await prisma.coupon.findUnique({
      where: { code: refs.claimCode },
      select: { status: true, startAt: true, endAt: true, claimed: true, total: true },
    })
    if (!c || c.status !== 'ACTIVE' || (c.endAt && c.endAt.getTime() <= now.getTime())) return '邮件里的领取券已结束'
    if (c.claimed >= c.total) return '邮件里的领取券已被领完'
    // 批次开始时间被改到了后面：点「立即领取」只会看到「该活动尚未开始」（审查 C12）
    if (c.startAt && c.startAt.getTime() > now.getTime()) return '邮件里的领取券尚未开始领取：到开始时间后再继续发送'
  }
  return null
}

/** 8. 每个发送中的活动：活动级熔断 + 商品/券复核 */
async function recheckSendingCampaigns(now: Date): Promise<void> {
  const list = await prisma.marketingCampaign.findMany({
    where: { status: 'SENDING' },
    select: { id: true, refs: true, breakerResetAt: true },
    orderBy: { id: 'asc' },
  })
  for (const c of list) {
    try {
      const v = evaluateBreaker(await breakerStats({ campaignId: c.id, since: c.breakerResetAt }))
      if (v.trip) {
        await autoPauseCampaign(c.id, `活动熔断：${v.reason}`)
        continue
      }
      const problem = await refsProblem(c.refs, now)
      if (problem) await autoPauseCampaign(c.id, problem)
    } catch (e) {
      console.error('[mkt/worker] 复核活动失败 campaign=', c.id, errMsg(e))
    }
  }
}

/* ============================== 试探闸门（设计 5.8） ============================== */

async function countSentSince(campaignId: number, since: Date): Promise<number> {
  return prisma.marketingMessage.count({
    where: {
      campaignId,
      status: { in: ['SENT', 'SENDING', 'UNKNOWN'] },
      OR: [{ sentAt: { gte: since } }, { sentAt: null, claimedAt: { gte: since } }],
    },
  })
}

/**
 * 每个活动每个发送日先发 canarySize 封，然后停止选取该活动，直到「今日已发中 ≥80% 有回执」
 * 或「最后一封已过 30 分钟」，再用这批回执算活动熔断：通过 → canaryDay=今天放行；不通过 → 暂停。
 * 「继续发送」当天：试探从继续的那一刻重新做 —— 计数、等回执、熔断统计都只看 breakerResetAt 之后（审查 C0）。
 */
async function canaryGate(
  ctx: Ctx,
  cand: { id: number; canaryDay: string | null; breakerResetAt: Date | null }
): Promise<'ok' | 'wait' | 'paused'> {
  const now = ctx.now()
  const today = bjDateKey(now)
  if (cand.canaryDay === today) return 'ok'
  const size = ctx.config.canarySize
  const dayStart = bjDayStart(now)
  // 窗口起点：今日零点；今天「继续」过就从继续的那一刻起（之前那批已经熔断过，不能拿来凑数放行）
  const windowStart =
    cand.breakerResetAt && cand.breakerResetAt.getTime() > dayStart.getTime() ? cand.breakerResetAt : dayStart
  const hit = ctx.sentToday.get(cand.id)
  let n: number
  if (hit && hit.since === windowStart.getTime()) {
    n = hit.n
  } else {
    // 缓存按窗口起点区分：同一趟里被暂停又继续，旧窗口的计数不能沿用
    n = await countSentSince(cand.id, windowStart)
    ctx.sentToday.set(cand.id, { since: windowStart.getTime(), n })
  }
  if (n < size) return 'ok'

  const todays = {
    campaignId: cand.id,
    status: { in: ['SENT', 'SENDING', 'UNKNOWN'] },
    OR: [{ sentAt: { gte: windowStart } }, { sentAt: null, claimedAt: { gte: windowStart } }],
  }
  const [withResult, last] = await Promise.all([
    prisma.marketingMessage.count({ where: { ...todays, delivery: { not: null } } }),
    prisma.marketingMessage.findFirst({ where: todays, orderBy: { claimedAt: 'desc' }, select: { sentAt: true, claimedAt: true } }),
  ])
  const lastAt = (last?.sentAt ?? last?.claimedAt)?.getTime() ?? 0
  const ready = withResult >= CANARY_RESULT_RATIO * n || (lastAt > 0 && now.getTime() - lastAt >= CANARY_WAIT_MS)
  if (!ready) return 'wait'

  // 用本窗口这批的回执评估（今日零点起含边界；「继续」之后的不含 breakerResetAt 本身）
  const since = windowStart
  const v = evaluateBreaker(await breakerStats({ campaignId: cand.id, since, inclusive: since === dayStart }))
  if (v.trip) {
    await autoPauseCampaign(cand.id, `今日试探批次熔断：${v.reason}`)
    return 'paused'
  }
  await prisma.marketingCampaign.updateMany({ where: { id: cand.id, status: 'SENDING' }, data: { canaryDay: today } })
  return 'ok'
}

/* ============================== 10. 单行处理 ============================== */

/** 同邮箱已发时间（SENT/SENDING/UNKNOWN，COALESCE(sentAt, claimedAt)，不含本行） */
async function sendTimes(email: string, excludeId: number, now: Date, minHours: number): Promise<Date[]> {
  const lookback = Math.max(30 * DAY_MS, minHours * HOUR_MS) + DAY_MS
  const since = new Date(now.getTime() - lookback)
  const rows = await prisma.marketingMessage.findMany({
    where: {
      email,
      id: { not: excludeId },
      status: { in: ['SENT', 'SENDING', 'UNKNOWN'] },
      OR: [{ sentAt: { gte: since } }, { sentAt: null, claimedAt: { gte: since } }],
    },
    select: { sentAt: true, claimedAt: true },
  })
  const out: Date[] = []
  for (const r of rows) {
    const t = r.sentAt ?? r.claimedAt
    if (t) out.push(t)
  }
  return out
}

async function processRow(ctx: Ctx, row: WorkRow, stage: { called: boolean }): Promise<RowResult> {
  // 补足与上一次真实调用的间隔。放在复核之前、行还是 CLAIMED 的时候（审查 C4）：
  // 等待期间的退订 / 抑制由下面重读资格拦住，取消会把 CLAIMED 改成 CANCELLED 让翻 SENDING 的 CAS 落空，暂停由重读活动拦住。
  // 放在翻 SENDING 之后的话，最长 5 秒的等待里发生的退订/取消都拦不住。
  // 跳过的行也会等这一次，但下一封真实发送就不用再等了，吞吐不变
  const gap = 1000 / ctx.config.ratePerSec
  if (ctx.lastCallAt > 0) {
    const wait = ctx.lastCallAt + gap - Date.now()
    if (wait > 0) await ctx.sleep(wait)
  }
  const now = ctx.now()
  const config = ctx.config

  // e. 重读活动（取消 / 暂停立即生效）
  const c = await prisma.marketingCampaign.findUnique({
    where: { id: row.campaignId },
    select: { id: true, status: true, topic: true, html: true, text: true, finalSubject: true, couponId: true, failStreak: true },
  })
  if (!c || c.status === 'CANCELLED') {
    await prisma.marketingMessage.updateMany({ where: { id: row.id, status: 'CLAIMED' }, data: { status: 'CANCELLED' } })
    return { kind: 'cancelled', skipCampaign: true }
  }
  if (c.status !== 'SENDING') {
    await releaseRow(row.id, 'CLAIMED')
    return { kind: 'released', skipCampaign: true }
  }
  const topic = (TOPICS as readonly string[]).includes(c.topic) ? (c.topic as Topic) : null
  if (!topic || !c.html || !c.finalSubject) {
    await releaseRow(row.id, 'CLAIMED')
    await autoPauseCampaign(c.id, '活动快照缺失（正文或主题为空），请取消后重新创建')
    return { kind: 'released', skipCampaign: true }
  }

  // f. 复核资格（设计 5.4 的 1–8；9、10 只在物化时算）
  const user = row.userId
    ? await prisma.user.findUnique({ where: { id: row.userId }, select: { status: true, email: true, nickname: true, createdAt: true } })
    : null
  if (user && (user.email || '').trim().toLowerCase() !== row.email) {
    // 物化之后用户改了邮箱：这个地址已经不是他的了（可能被别人注册），不能再往这里发
    await skipRow(row.id, 'NO_EMAIL', '账户邮箱已变更')
    return { kind: 'skipped' }
  }
  const [consent, sup] = await Promise.all([user && row.userId ? getConsent(row.userId) : Promise.resolve(null), loadSuppressed([row.email])])
  const reason = eligibility({
    user: user ? { status: user.status, email: row.email, createdAt: user.createdAt } : null,
    consent,
    suppressed: sup.get(row.email) ?? null,
    topic,
    config: { defaultEligible: config.defaultEligible, sunset: { enabled: false } },
    excludeInactive: false,
    activity: NO_ACTIVITY,
    now,
  })
  if (reason) {
    await skipRow(row.id, reason)
    return { kind: 'skipped' }
  }
  const fd = freqDecision({ times: await sendTimes(row.email, row.id, now, config.freq.minHours) }, config.freq, now)
  if (fd.kind === 'skip') {
    await skipRow(row.id, 'FREQ_CAP')
    return { kind: 'skipped' }
  }
  if (fd.kind === 'delay') {
    // 距上一封不足 minHours：延后而不是跳过，不占额度、不占间隔
    await releaseRow(row.id, 'CLAIMED', { nextAttemptAt: fd.until })
    return { kind: 'delayed' }
  }

  // g. 直发券：先发券后发信（邮件里写「券已放入你的账户」，不能出现有信没券）
  let couponExpires = ''
  if (c.couponId) {
    if (!row.userId) {
      await skipRow(row.id, 'DISABLED', '收件人没有关联账户，无法发券')
      return { kind: 'skipped' }
    }
    const g = await grantCampaignCoupon(c.couponId, row.userId, now)
    if (!g.ok) {
      if (g.reason === 'NO_USER') {
        await skipRow(row.id, 'DISABLED', g.note)
        return { kind: 'skipped' }
      }
      if (g.reason === 'ERROR') {
        await releaseRow(row.id, 'CLAIMED', { nextAttemptAt: new Date(now.getTime() + COUPON_ERROR_RETRY_MS), errorMsg: g.note })
        throw new Error(g.note) // 计入本趟行错误，连续出错会停下
      }
      await releaseRow(row.id, 'CLAIMED')
      await autoPauseCampaign(c.id, g.note)
      return { kind: 'released', skipCampaign: true }
    }
    couponExpires = g.expiresAt ? bjDateCn(g.expiresAt) : ''
    await prisma.marketingMessage.updateMany({ where: { id: row.id, couponGrantId: null }, data: { couponGrantId: g.grantId } })
  }

  // h. 个性化（一次回调式替换，替换出来的值不会被再次扫描）
  // 已清洗；不可用时为 null → 用占位里作者写的默认值（{{nickname|老朋友}}）
  const nickname = cleanNickname(user?.nickname)
  const prior = await prisma.marketingMessage.findFirst({
    where: { email: row.email, status: 'SENT', id: { not: row.id } },
    select: { id: true },
  })
  const origin = ctx.origin
  const vars = {
    nickname,
    email: row.email,
    couponExpires,
    // 点击与打开用 trackToken：商品链接常被复制转发，拿到链接的人不能凭它改收件人的订阅（审查 C5）。
    // 退订 / 偏好页（以及 List-Unsubscribe 头）才用 token
    linkBase: `${origin}/api/mkt/c/${row.trackToken}/`,
    unsubscribeUrl: `${origin}/unsubscribe/${row.token}`,
    prefsUrl: `${origin}/unsubscribe/${row.token}?v=prefs`,
    openPixelUrl: `${origin}/api/mkt/o/${row.trackToken}`,
    notice: prior ? '' : FIRST_NOTICE_TEXT,
  }
  const html = personalizeHtml(c.html, vars)
  const text = config.includeTextBody && c.text ? personalizeText(c.text, vars) : null
  const subject = personalizeSubject(c.finalSubject, { nickname })

  // CLAIMED → SENDING（CAS）：之后才调用阿里云。
  // 同一条写入记下这封信用的发信地址：换了 ALIYUN_DM_MARKETING 之后，回执 / 投诉同步要按每封信自己的地址去查（审查 C15）。
  // 与传输层读的是同一个环境变量、同一个进程，二者一致
  const flip = await prisma.marketingMessage.updateMany({
    where: { id: row.id, status: 'CLAIMED' },
    data: { status: 'SENDING', subjectSent: clip(subject, 255), sender: clip(marketingSender(), 191) },
  })
  if (flip.count !== 1) return { kind: 'cancelled' } // 被取消/回收了：不发

  stage.called = true
  let attempt: SendAttempt
  try {
    attempt = await ctx.transport({
      to: row.email,
      subject,
      html,
      text,
      unsubscribeUrl: `${origin}/api/mkt/unsubscribe/${row.token}`,
      fromAlias: config.fromAlias,
      replyTo: config.contactEmail || null,
    })
  } catch (e) {
    // 传输层按约定不抛；万一抛了，不知道请求出没出去 → 按「结果未知」处理，不重发
    attempt = { kind: 'unknown_error', errName: 'TransportThrew', message: errMsg(e), envId: null, dryRun: false }
  }
  ctx.lastCallAt = Date.now()
  return applyOutcome(ctx, c, row, attempt)
}

/** i. 按设计 5.5 分类落库 */
async function applyOutcome(
  ctx: Ctx,
  c: { id: number; failStreak: number },
  row: WorkRow,
  attempt: SendAttempt
): Promise<RowResult> {
  const cls = classifySend(attempt)
  const at = ctx.now()
  const s = ctx.summary
  const bumpSentToday = () => {
    // 只在试探闸门数过的窗口上累加；没数过的（今日试探已通过）不需要
    const hit = ctx.sentToday.get(row.campaignId)
    if (hit) hit.n++
  }
  if (cls.action !== 'UNKNOWN') ctx.unknownStreak = 0

  switch (cls.action) {
    case 'SENT': {
      await finishRow(row.id, { status: 'SENT', sentAt: at, envId: clip(attempt.envId, 64), errorCode: null, errorMsg: null })
      if (c.failStreak > 0) {
        await prisma.marketingCampaign.updateMany({ where: { id: c.id, failStreak: { gt: 0 } }, data: { failStreak: 0 } })
      }
      ctx.budget--
      bumpSentToday()
      s.sent++
      return { kind: 'sent' }
    }

    case 'UNKNOWN': {
      // 可能已发出：sentAt=claimedAt（频控、额度照算），绝不自动重发；sync 对账查到了会改成 SENT
      await finishRow(row.id, { status: 'UNKNOWN', sentAt: row.claimedAt, errorCode: cls.errorCode, errorMsg: clip(cls.note, 500) })
      ctx.budget--
      bumpSentToday()
      s.unknown++
      ctx.unknownStreak++
      if (ctx.unknownStreak >= 2) {
        await setHalt(new Date(at.getTime() + UNKNOWN_HALT_MS), '连续 2 封发送结果未知（阿里云超时或响应异常），已急停 15 分钟', 'system')
        return { kind: 'unknown', stop: 'unknown_streak' }
      }
      return { kind: 'unknown' }
    }

    case 'RETRY': {
      const attempts = row.attempts + 1
      if (attempts >= MAX_CONNECT_ATTEMPTS) {
        await finishRow(row.id, { status: 'FAILED', attempts, errorCode: cls.errorCode, errorMsg: clip(cls.note, 500) })
        s.failed++
      } else {
        await releaseRow(row.id, 'SENDING', {
          attempts,
          nextAttemptAt: new Date(at.getTime() + backoffMs(attempts)),
          errorCode: cls.errorCode,
          errorMsg: cls.note,
        })
        s.retried++
      }
      // 连接阶段失败（DNS / 连不上）：网络有问题，本趟结束；服务端临时错误只退避这一行
      return { kind: 'retry', stop: attempt.kind === 'connect_error' ? 'connect_error' : undefined }
    }

    case 'RETRY_THROTTLE': {
      await releaseRow(row.id, 'SENDING', {
        nextAttemptAt: new Date(at.getTime() + THROTTLE_DELAY_MS),
        errorCode: cls.errorCode,
        errorMsg: cls.note,
      })
      s.retried++
      return { kind: 'retry', stop: 'throttled' }
    }

    case 'FAIL_SUPPRESS': {
      await finishRow(row.id, { status: 'FAILED', errorCode: cls.errorCode, errorMsg: clip(cls.note, 500) })
      await suppressEmail(row.email, 'INVALID', 'send', cls.errorCode, c.id).catch((e) =>
        console.error('[mkt/worker] 写抑制名单失败 message=', row.id, errMsg(e))
      )
      s.failed++
      return { kind: 'failed' }
    }

    case 'FAIL_SPAM': {
      await finishRow(row.id, { status: 'FAILED', errorCode: SPAM_REJECT_CODE, errorMsg: clip(cls.note, 500) })
      s.failed++
      const others = await prisma.marketingMessage.count({
        where: {
          status: 'FAILED',
          errorCode: SPAM_REJECT_CODE,
          id: { not: row.id },
          claimedAt: { gte: new Date(at.getTime() - SPAM_REPEAT_WINDOW_MS) },
        },
      })
      await autoPauseCampaign(c.id, '阿里云反垃圾拒发（InvalidSendMail.Spam）：请检查邮件内容（禁发词、链接、图片）后再继续')
      if (others > 0) {
        await setHalt(new Date(at.getTime() + SPAM_HALT_MS), '10 分钟内连续 2 封被阿里云反垃圾拒发，已急停 24 小时', 'system')
        return { kind: 'failed', stop: 'spam_halt' }
      }
      return { kind: 'failed', skipCampaign: true }
    }

    case 'HALT_QUOTA': {
      await releaseRow(row.id, 'SENDING', { errorCode: cls.errorCode, errorMsg: cls.note })
      await setHalt(nextDayWindowStart(ctx.config.sendWindow, at), '阿里云发信额度已用尽（InvalidQuota），次日发送时段自动恢复', 'system')
      return { kind: 'released', stop: 'quota' }
    }

    case 'HALT_CONFIG': {
      await releaseRow(row.id, 'SENDING', { errorCode: cls.errorCode, errorMsg: cls.note })
      await setHalt(
        new Date(at.getTime() + CONFIG_HALT_MS),
        `阿里云配置或账号问题（${cls.errorCode}）：请检查发信地址、AccessKey 与账号状态，处理后在后台解除急停`,
        'system'
      )
      return { kind: 'released', stop: 'config' }
    }

    case 'PAUSE_CONTENT': {
      await releaseRow(row.id, 'SENDING', { errorCode: cls.errorCode, errorMsg: cls.note })
      const tip = (cls.errorCode || '').startsWith('InvalidTextBody') ? '；可在发送设置里关闭「纯文本版」后继续' : ''
      await autoPauseCampaign(c.id, `阿里云拒收邮件内容（${cls.errorCode}）${tip}`)
      return { kind: 'released', skipCampaign: true }
    }

    case 'FAIL':
    default: {
      await finishRow(row.id, { status: 'FAILED', errorCode: cls.errorCode, errorMsg: clip(cls.note, 500) })
      s.failed++
      const upd = await prisma.marketingCampaign.update({
        where: { id: c.id },
        data: { failStreak: { increment: 1 } },
        select: { failStreak: true },
      })
      if (upd.failStreak >= FAIL_STREAK_PAUSE) {
        await autoPauseCampaign(c.id, `连续 ${upd.failStreak} 封发送失败（最近一次：${cls.errorCode}），已自动暂停`)
        return { kind: 'failed', skipCampaign: true }
      }
      return { kind: 'failed' }
    }
  }
}

/* ============================== 5–10. 发送阶段 ============================== */

async function sendPhase(ctx: Ctx, t0: number, deadlineMs: number, initialHalt: HaltState): Promise<string> {
  let now = ctx.now()
  // 5
  const gate = gateReason(ctx.config, initialHalt, now)
  if (gate) return gate

  // 6
  const health = await syncHealth(now)
  if (health === 'unreadable') return 'sync_unreadable'
  if (health === 'stale') {
    await setHalt(
      new Date(now.getTime() + SYNC_HALT_MS),
      '回执同步中断超过 60 分钟（marketing-sync 没有成功运行）：看不到退信与投诉时不能继续发送',
      'system'
    )
    return 'sync'
  }

  // 7. 账户级熔断：今日全部营销回执（管理员手动解除「账户级熔断」之后的才算；解除别的急停不影响，审查 C1）
  const dayStart = bjDayStart(now)
  const cleared = acctBreakerSince(initialHalt)
  const since = cleared && cleared.getTime() > dayStart.getTime() ? cleared : dayStart
  const acct = evaluateBreaker(await breakerStats({ since, inclusive: true }))
  if (acct.trip) {
    await setHalt(
      nextDayWindowStart(ctx.config.sendWindow, now),
      `账户级熔断（今日全部营销回执）：${acct.reason}`,
      'system',
      ACCT_BREAKER_KIND
    )
    return 'breaker'
  }

  // 8
  await recheckSendingCampaigns(now)

  // 9
  const usage = await todayUsage(ctx.config, now)
  ctx.budget = Math.max(0, usage.limit - usage.used)
  if (ctx.budget <= 0) return 'budget'

  // 连续「结果未知」接上一趟的尾巴：最近一次有结果的调用若是 UNKNOWN（且不是回收出来的），本趟起点记 1
  const lastOutcome = await prisma.marketingMessage.findFirst({
    where: { status: { in: ['SENT', 'UNKNOWN', 'FAILED'] }, claimedAt: { gte: new Date(now.getTime() - 30 * 60_000) } },
    orderBy: { claimedAt: 'desc' },
    select: { status: true, errorCode: true },
  })
  ctx.unknownStreak = lastOutcome?.status === 'UNKNOWN' && lastOutcome.errorCode !== INTERRUPTED_CODE ? 1 : 0

  let backoff = backoffDomains(await getSyncState(), now)
  let lastRecheck = Date.now()
  const skipIds = new Set<number>()
  let rowErrors = 0
  let casMisses = 0

  // 10
  for (;;) {
    if (Date.now() - t0 >= deadlineMs) return 'deadline'
    if (ctx.budget <= 0) return 'budget'
    now = ctx.now()

    if (Date.now() - lastRecheck >= RECHECK_MS) {
      lastRecheck = Date.now()
      if (!(await renewLock('send', ctx.lockToken))) return 'lock_lost'
      let halt: HaltState
      try {
        ctx.config = await getConfig({ strict: true })
        halt = await getHalt({ strict: true })
      } catch (e) {
        console.error('[mkt/worker] 重读配置/急停失败，本趟中止:', errMsg(e))
        return 'config_unreadable'
      }
      const g = gateReason(ctx.config, halt, now)
      if (g) return g
      backoff = backoffDomains(await getSyncState(), now)
    }

    // b. 选活动：发送中的，按 id 先来先发
    const cands = await prisma.marketingCampaign.findMany({
      where: { status: 'SENDING', ...(skipIds.size ? { id: { notIn: Array.from(skipIds) } } : {}) },
      orderBy: { id: 'asc' },
      select: { id: true, canaryDay: true, breakerResetAt: true },
      take: 10,
    })
    if (!cands.length) return 'idle'

    let row: WorkRow | null = null
    for (const cand of cands) {
      const cg = await canaryGate(ctx, cand)
      if (cg !== 'ok') {
        skipIds.add(cand.id)
        continue
      }
      // c. 选行：到点的 QUEUED、收件域名不在退避中，按 sortKey, id
      const pick = await prisma.marketingMessage.findFirst({
        where: {
          campaignId: cand.id,
          status: 'QUEUED',
          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
          ...(backoff.length ? { domain: { notIn: backoff } } : {}),
        },
        orderBy: [{ sortKey: 'asc' }, { id: 'asc' }],
        select: { id: true, campaignId: true, userId: true, email: true, token: true, trackToken: true, attempts: true },
      })
      if (!pick) {
        skipIds.add(cand.id)
        continue
      }
      // d. CAS QUEUED→CLAIMED
      const claimedAt = ctx.now()
      const r = await prisma.marketingMessage.updateMany({
        where: { id: pick.id, status: 'QUEUED' },
        data: { status: 'CLAIMED', claimedAt },
      })
      if (r.count !== 1) {
        casMisses++
        break // 被别人拿走了（不应发生：有锁）→ 重新选
      }
      row = { ...pick, claimedAt }
      break
    }
    if (!row) {
      if (casMisses > 20) return 'cas_contention'
      continue // 本轮的候选都被跳过了：重新查（skipIds 已排除它们），没有了就是 idle
    }

    const stage = { called: false }
    let res: RowResult
    try {
      res = await processRow(ctx, row, stage)
    } catch (e) {
      rowErrors++
      console.error('[mkt/worker] 处理失败 message=', row.id, errMsg(e))
      const retryAt = new Date(ctx.now().getTime() + ROW_ERROR_RETRY_MS)
      // 还没调用阿里云：放回队列稍后再试；已经调用过（落库失败）：留在 SENDING，由回收判 UNKNOWN，绝不重发
      await releaseRow(row.id, 'CLAIMED', { nextAttemptAt: retryAt, errorMsg: `处理异常：${errMsg(e)}` }).catch(() => {})
      if (!stage.called) {
        await releaseRow(row.id, 'SENDING', { nextAttemptAt: retryAt, errorMsg: `处理异常：${errMsg(e)}` }).catch(() => {})
      } else {
        ctx.budget--
      }
      if (rowErrors >= MAX_ROW_ERRORS) return 'errors'
      continue
    }
    if (res.kind === 'skipped') ctx.summary.skippedRows++
    if (res.skipCampaign) skipIds.add(row.campaignId)
    if (stage.called && !(await renewLock('send', ctx.lockToken))) return 'lock_lost'
    if (res.stop) return res.stop
  }
}

/* ============================== 11. 完成检测 ============================== */

/**
 * SENDING → COMPLETED：仅当已物化且没有 QUEUED/CLAIMED/SENDING 行。
 * 条件写在同一条 UPDATE 里（NOT EXISTS），与「重新排队」并发时不会把刚放回队列的行留在一个已完成的活动里；
 * 只有 CAS 成功的那一次发「完成」通知。
 */
async function completeFinished(now: Date): Promise<number> {
  const list = await prisma.marketingCampaign.findMany({
    where: { status: 'SENDING', materializedAt: { not: null } },
    select: { id: true, name: true },
  })
  let done = 0
  for (const c of list) {
    const n = await prisma.$executeRaw`
      UPDATE marketing_campaigns
         SET status = 'COMPLETED', completed_at = ${now}, updated_at = ${new Date()}
       WHERE id = ${c.id}
         AND status = 'SENDING'
         AND materialized_at IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM marketing_messages m
            WHERE m.campaign_id = ${c.id} AND m.status IN ('QUEUED', 'CLAIMED', 'SENDING')
         )`
    if (Number(n) !== 1) continue
    done++
    const groups = await prisma.marketingMessage.groupBy({
      by: ['status'],
      where: { campaignId: c.id },
      _count: { _all: true },
    })
    const cnt: Record<string, number> = {}
    for (const g of groups) cnt[g.status] = g._count._all
    notifyMarketing('finished', {
      campaignId: c.id,
      campaignName: c.name,
      rows: [
        { label: '已发送', value: String(cnt.SENT ?? 0) },
        { label: '失败', value: String(cnt.FAILED ?? 0) },
        { label: '结果未知', value: String(cnt.UNKNOWN ?? 0) },
        { label: '跳过', value: String(cnt.SKIPPED ?? 0) },
      ],
    })
    await audit('COMPLETE', { campaignId: c.id, detail: cnt })
  }
  return done
}

/* ============================== 一趟 ============================== */

export async function runSendTick(opts: TickOptions = {}): Promise<TickSummary> {
  const t0 = Date.now()
  const deadlineMs = opts.deadlineMs ?? TICK_DEADLINE_MS
  const summary: TickSummary = {
    recovered: { claimed: 0, sending: 0 },
    materialized: null,
    sent: 0,
    skippedRows: 0,
    failed: 0,
    unknown: 0,
    retried: 0,
    stoppedBy: null,
    ms: 0,
  }
  const finish = (): TickSummary => ({ ...summary, ms: Date.now() - t0 })

  // 1. 抢锁（抢不到：上一趟还在跑）
  const lockToken = await acquireLock('send', SEND_LOCK_TTL_MS)
  if (!lockToken) {
    summary.skipped = 'locked'
    return finish()
  }
  try {
    // 2. 严格读配置与急停：读不到就中止（绝不回落默认值 —— 默认值里没有急停）
    let config: MarketingConfig
    let halt: HaltState
    try {
      config = await getConfig({ strict: true })
      halt = await getHalt({ strict: true })
    } catch (e) {
      console.error('[mkt/worker] 读取营销配置/急停失败，本趟中止:', errMsg(e))
      summary.skipped = 'config_unreadable'
      return finish()
    }

    const ctx: Ctx = {
      lockToken,
      now: opts.now ?? (() => new Date()),
      sleep: opts.sleep ?? realSleep,
      transport: opts.transport ?? sendMarketingMail,
      config,
      summary,
      budget: 0,
      lastCallAt: 0,
      unknownStreak: 0,
      origin: siteOrigin(),
      sentToday: new Map(),
      lockLost: false,
    }

    // 3. 回收 + 清扫已取消活动的残留
    summary.recovered = await recoverStale(ctx.now())
    await sweepCancelled()

    // 4. 物化（每趟至多一个活动）
    summary.materialized = await materializeOne(ctx)
    if (ctx.lockLost) {
      summary.stoppedBy = 'lock_lost'
      return finish()
    }

    try {
      summary.stoppedBy = await sendPhase(ctx, t0, deadlineMs, halt)
    } finally {
      // 11. 完成检测：闸门关着（时段外/急停）时也要跑 —— 全员被排除的活动物化完就该完成
      await completeFinished(ctx.now()).catch((e) => console.error('[mkt/worker] 完成检测失败:', errMsg(e)))
    }
    return finish()
  } finally {
    // 12
    await releaseLock('send', lockToken)
  }
}
