/**
 * 今日额度与预计完成时间的「取数」层（纯计算在 policy.ts）。
 * worker、设置页、检查接口、报表的「为什么还没发」共用同一个口径。
 *
 * 【实现方：发送引擎】签名是契约。
 *
 * 时间口径：「今天」= 北京日（lib/marketing/time.ts，固定 +8 运算，与进程 TZ 无关）；
 * SQL 里按北京日期分组一律 `DATE_FORMAT(col + INTERVAL 8 HOUR, '%Y-%m-%d')`（Prisma 存的是 UTC）。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { freshDailyQuota, getAccountState } from './config'
import { computeDailyLimit, simulateEta, warmupLevel, WARMUP_LOOKBACK_DAYS } from './policy'
import { bjDateKey, bjDayStart, inSendWindow } from './time'
import type { EtaResult, MarketingConfig } from './types'
import type { SendDayStat } from './policy'

const DAY_MS = 86400_000

export interface TodayUsage {
  /** 北京日期 */
  date: string
  /** 营销 SENT+SENDING+UNKNOWN（今天）+ 今天的测试发送封数 */
  used: number
  limit: number
  parts: { dailyCap: number; quotaCap: number; warmupCap: number | null; quota: number; quotaAssumed: boolean }
  warmupLevel: number
  inWindow: boolean
}

/** $queryRaw 的 COUNT 是 BigInt、SUM 是 Decimal：统一成 number，坏值按 0 */
function num(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  if (typeof v === 'bigint') return Number(v)
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  const maybe = v as { toNumber?: () => number }
  if (typeof maybe.toNumber === 'function') {
    const n = maybe.toNumber()
    return Number.isFinite(n) ? n : 0
  }
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** 最近 60 天（不含今天）每个北京日的发送与回执统计 */
export async function loadSendDayStats(now: Date): Promise<SendDayStat[]> {
  const end = bjDayStart(now)
  const start = new Date(end.getTime() - WARMUP_LOOKBACK_DAYS * DAY_MS)
  // claimed_at 先粗筛（走 [status, claimedAt] 索引；每一行发送前都先被 CLAIMED，sentAt ≥ claimedAt），
  // 再用 COALESCE(sent_at, claimed_at) 精确落日。FAILED 行只为数「反垃圾拒发」，不计入 sent。
  // 投诉不数投递被阿里云拦下（delivery=FAILED）的行：那是收件人之前的投诉/退订被执行，不是这天的信招来的（审查 C16 第 3 条）
  const rows = await prisma.$queryRaw<
    { d: string; sent: unknown; results: unknown; invalid: unknown; spam: unknown; complaints: unknown; spamRejects: unknown }[]
  >(Prisma.sql`
    SELECT DATE_FORMAT(COALESCE(sent_at, claimed_at) + INTERVAL 8 HOUR, '%Y-%m-%d') AS d,
           SUM(status IN ('SENT','SENDING','UNKNOWN')) AS sent,
           SUM(status IN ('SENT','SENDING','UNKNOWN') AND delivery IS NOT NULL) AS results,
           SUM(delivery = 'INVALID') AS invalid,
           SUM(delivery = 'SPAM') AS spam,
           SUM(complained_at IS NOT NULL AND (delivery IS NULL OR delivery <> 'FAILED')) AS complaints,
           SUM(status = 'FAILED' AND error_code = 'SPAM_REJECT') AS spamRejects
      FROM marketing_messages
     WHERE status IN ('SENT','SENDING','UNKNOWN','FAILED')
       AND claimed_at >= ${new Date(start.getTime() - DAY_MS)}
       AND claimed_at < ${end}
       AND COALESCE(sent_at, claimed_at) >= ${start}
       AND COALESCE(sent_at, claimed_at) < ${end}
     GROUP BY d
     ORDER BY d
  `)
  return rows
    .filter((r) => typeof r.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.d))
    .map((r) => ({
      date: r.d,
      sent: num(r.sent),
      results: num(r.results),
      invalid: num(r.invalid),
      spam: num(r.spam),
      complaints: num(r.complaints),
      spamRejects: num(r.spamRejects),
    }))
}

/**
 * 今天测试发送了几封：测试发送写审计 TEST_SEND，detail JSON 里带 {count}（发出去的封数）。
 * 读不懂的按 1 封算（宁可多算用量，不少算）。
 */
async function testSendsToday(dayStart: Date): Promise<number> {
  const rows = await prisma.marketingAudit.findMany({
    where: { action: 'TEST_SEND', createdAt: { gte: dayStart } },
    select: { detail: true },
    take: 1000,
  })
  let n = 0
  for (const r of rows) {
    let c = 1
    try {
      const d: unknown = r.detail ? JSON.parse(r.detail) : null
      if (d && typeof d === 'object') {
        const o = d as { count?: unknown; sent?: unknown }
        if (typeof o.count === 'number' && Number.isFinite(o.count)) c = Math.max(0, Math.floor(o.count))
        else if (Array.isArray(o.sent)) c = o.sent.length
      }
    } catch {
      c = 1
    }
    n += c
  }
  return n
}

/** 今天已调用阿里云成功受理（或不确定）的营销封数：SENT+SENDING+UNKNOWN，时间取 COALESCE(sentAt, claimedAt) */
export async function marketingSentToday(now: Date = new Date()): Promise<number> {
  const dayStart = bjDayStart(now)
  return prisma.marketingMessage.count({
    where: {
      status: { in: ['SENT', 'SENDING', 'UNKNOWN'] },
      OR: [{ sentAt: { gte: dayStart } }, { sentAt: null, claimedAt: { gte: dayStart } }],
    },
  })
}

export async function todayUsage(config: MarketingConfig, now: Date = new Date()): Promise<TodayUsage> {
  const dayStart = bjDayStart(now)
  const [marketing, tests, stats, account] = await Promise.all([
    marketingSentToday(now),
    testSendsToday(dayStart),
    loadSendDayStats(now),
    getAccountState(),
  ])
  const date = bjDateKey(now)
  const level = warmupLevel(stats, date)
  const lim = computeDailyLimit({ config, dailyQuota: freshDailyQuota(account, now), warmupLevel: level })
  return {
    date,
    used: marketing + tests,
    limit: lim.limit,
    parts: lim.parts,
    warmupLevel: level,
    inWindow: inSendWindow(config.sendWindow, now),
  }
}

/**
 * 排在某个活动前面、还没发完的封数。worker 按活动 id 先来先发（设计 5.3），所以：
 * id 比它小的 SENDING 活动剩下的 QUEUED/CLAIMED 行 + id 比它小、还没物化的 SCHEDULED 活动的收件人（按 0 估，拿不到）。
 * excludeCampaignId 为空（还没建的活动）= 所有发送中的都在前面。
 */
async function queuedAhead(excludeCampaignId: number | null): Promise<number> {
  const campaigns = await prisma.marketingCampaign.findMany({
    where: {
      status: 'SENDING',
      ...(excludeCampaignId != null ? { id: { lt: excludeCampaignId } } : {}),
    },
    select: { id: true },
  })
  if (!campaigns.length) return 0
  return prisma.marketingMessage.count({
    where: { campaignId: { in: campaigns.map((c) => c.id) }, status: { in: ['QUEUED', 'CLAIMED'] } },
  })
}

/** 本活动（count 封）从 startAt 开始的预计完成时间；排在它前面的未发完活动都算进去 */
export async function estimateEta(
  config: MarketingConfig,
  count: number,
  startAt: Date,
  excludeCampaignId: number | null
): Promise<EtaResult> {
  const now = new Date()
  const [usage, ahead, account] = await Promise.all([todayUsage(config, now), queuedAhead(excludeCampaignId), getAccountState()])
  return simulateEta({
    count,
    startAt,
    now,
    config,
    dailyQuota: freshDailyQuota(account, now),
    warmupLevel: usage.warmupLevel,
    usedToday: usage.used,
    aheadCount: ahead,
  })
}
