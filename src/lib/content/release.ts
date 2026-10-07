/**
 * 定时放量（内容扩容 2026-10-07，docs/内容平台/扩容基础设施-1007.md）。
 *
 * 站方一次准备了约 1,900 条新内容。一天之内全部公开 = 站点的页面数一夜翻几倍、内容同一个模板——
 * 这正是 Google「规模化内容滥用」（scaled content abuse）的典型特征，而它的处罚是**站点级**的（商品页、充值落地页一起掉）。
 * 所以导入时用 --schedule 把它们建成 SCHEDULED（不公开），这里每天放出一批：
 *
 *  - 每天放多少：CONTENT_RELEASE_PER_DAY（默认 40；0 = 暂停）。按**上海自然日**封顶：数今天 released_at 落在当天的条数，
 *    当天重复调用只补足差额，调多少次都不会超（cron 重跑、手工补跑都安全）。
 *  - 放哪几条：release_rank 从小到大（导入时已按类型 / 大类 / 主题交错排好，prisma/release-order.ts），
 *    所以每天一批是混合的。只放 status=1、未删除的。
 *  - 放出时改什么：review_status=APPROVED、reviewed_at / released_at = 现在，**created_at 也改成现在**
 *    （它从没公开过，「发布时间」就该是今天：「最新」排序、页面上的发布日期、sitemap 的 lastmod 都从它来），
 *    同一批按队列顺序每条错开 1 秒，「最新」列表里也是交错的；content_updated_at 清空（发布前的编辑不算「更新」）。
 *  - 放出后：总开关打开时，把其中「可收录」的地址一次推给 IndexNow（和单条发布同一个判定 contentIndexable）。
 *    不触发 onPublished（积分、关注者通知）：这些是站方编辑账号的种子内容，每天 40 条通知会把关注者淹没——与导入 --publish 一致。
 *  - 并发：两个调用同时进来时用 vmq_locks 抢锁（前缀 content:），抢不到的直接返回「正在放量」。
 *
 * 只在服务端用（cron 路由与后台接口）。
 */
import { prisma } from '../db'
import { indexNowConfigured, submitUrls } from '../indexnow'
import { absUrl } from '../news/seo'
import { siteOrigin } from '../news/format'
import { INDEXING_OPEN, contentPath, releasePerDay, shanghaiDayStart } from './policy'
import { contentIndexable } from './queries'

/** 后台「立即放出」一次最多几条（防手滑） */
export const MAX_MANUAL_RELEASE = 200

const LOCK_KEY = 'content:release'
const LOCK_TTL_MS = 2 * 60_000

async function acquireLock(): Promise<string | null> {
  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  for (let i = 0; i < 2; i++) {
    // INSERT IGNORE：撞锁不在日志里刷 prisma:error（同 lib/bot/lock.ts）
    const r = await prisma.vmqLock.createMany({ data: [{ lockKey: LOCK_KEY, orderId: token, createdAt: new Date() }], skipDuplicates: true })
    if (r.count === 1) return token
    const existing = await prisma.vmqLock.findUnique({ where: { lockKey: LOCK_KEY } })
    if (!existing) continue
    if (Math.abs(Date.now() - existing.createdAt.getTime()) < LOCK_TTL_MS) return null
    await prisma.vmqLock.deleteMany({ where: { id: existing.id, orderId: existing.orderId } }).catch(() => {})
  }
  return null
}

async function releaseLock(token: string): Promise<void> {
  await prisma.vmqLock.deleteMany({ where: { lockKey: LOCK_KEY, orderId: token } }).catch(() => {})
}

export interface ReleaseStats {
  perDay: number
  releasedToday: number
  scheduled: number
  byType: Record<string, number>
}

/** 队列现状（后台卡片用） */
export async function releaseStats(now: Date = new Date()): Promise<ReleaseStats> {
  const [releasedToday, groups] = await Promise.all([
    prisma.forumPost.count({ where: { releasedAt: { gte: shanghaiDayStart(now) } } }),
    prisma.forumPost.groupBy({ by: ['type'], where: { reviewStatus: 'SCHEDULED', deletedAt: null }, _count: { _all: true } }),
  ])
  const byType: Record<string, number> = {}
  for (const g of groups) byType[g.type] = g._count._all
  return { perDay: releasePerDay(), releasedToday, scheduled: groups.reduce((n, g) => n + g._count._all, 0), byType }
}

export interface ReleaseResult {
  ok: boolean
  /** 没放的原因：paused（每天 0 条）/ capped（今天已放满）/ empty（队列空）/ busy（另一趟正在放） */
  reason?: 'paused' | 'capped' | 'empty' | 'busy'
  released: number
  ids: number[]
  releasedToday: number
  perDay: number
  remaining: number
  indexNow: number
}

/**
 * 放出下一批。mode=cron：按每天上限补足差额；mode=manual：后台「立即放出 N 条」，不看上限（但计入今天的条数，
 * 当天的 cron 会相应少放甚至不放）。
 */
export async function releaseScheduled(opts: { mode: 'cron' | 'manual'; count?: number; now?: Date }): Promise<ReleaseResult> {
  const now = opts.now ?? new Date()
  const perDay = releasePerDay()
  const base = { released: 0, ids: [] as number[], perDay, indexNow: 0 }
  const token = await acquireLock()
  if (!token) return { ...base, ok: false, reason: 'busy', releasedToday: 0, remaining: 0 }
  try {
    const dayStart = shanghaiDayStart(now)
    const releasedToday = await prisma.forumPost.count({ where: { releasedAt: { gte: dayStart } } })
    const queueWhere = { reviewStatus: 'SCHEDULED', deletedAt: null, status: 1 }
    let want: number
    if (opts.mode === 'manual') want = Math.max(0, Math.min(opts.count ?? 0, MAX_MANUAL_RELEASE))
    else if (perDay === 0) want = 0
    else want = Math.max(0, perDay - releasedToday)

    const remainingBefore = await prisma.forumPost.count({ where: queueWhere })
    if (opts.mode === 'cron' && perDay === 0) return { ...base, ok: true, reason: 'paused', releasedToday, remaining: remainingBefore }
    if (want === 0) return { ...base, ok: true, reason: 'capped', releasedToday, remaining: remainingBefore }
    if (remainingBefore === 0) return { ...base, ok: true, reason: 'empty', releasedToday, remaining: 0 }

    const next = await prisma.forumPost.findMany({
      where: queueWhere,
      // release_rank 为空的（不是导入排的）排在最前，MySQL 的 ASC 本来就把 NULL 放前面
      orderBy: [{ releaseRank: 'asc' }, { id: 'asc' }],
      take: want,
      select: { id: true },
    })
    // 每条单独 updateMany（带 reviewStatus 条件 = 只放还在队列里的，重复调用不会二次改），按队列顺序把 created_at 错开 1 秒
    const t0 = now.getTime()
    const results = await prisma.$transaction(
      next.map((p, i) =>
        prisma.forumPost.updateMany({
          where: { id: p.id, reviewStatus: 'SCHEDULED' },
          data: {
            reviewStatus: 'APPROVED',
            reviewNote: null,
            reviewedAt: now,
            releasedAt: now,
            createdAt: new Date(t0 - i * 1000),
            lastReplyAt: now,
            contentUpdatedAt: null,
          },
        }),
      ),
    )
    const ids = next.filter((_, i) => results[i].count === 1).map((p) => p.id)
    const indexNow = await pushIndexNow(ids)
    return {
      ok: true,
      released: ids.length,
      ids,
      releasedToday: releasedToday + ids.length,
      perDay,
      remaining: remainingBefore - ids.length,
      indexNow,
    }
  } finally {
    await releaseLock(token)
  }
}

/** 把刚放出的、现在可收录的地址一次推给 IndexNow（总开关关着 / 没配 key 时什么都不推）。返回推了几条 */
async function pushIndexNow(ids: number[]): Promise<number> {
  if (!ids.length || !INDEXING_OPEN || !indexNowConfigured()) return 0
  try {
    const rows = await prisma.forumPost.findMany({
      where: { id: { in: ids } },
      select: {
        id: true, type: true, slug: true, status: true, reviewStatus: true, deletedAt: true, userId: true, content: true,
        originality: true, aiAssist: true, commentCount: true, images: true, testedOn: true, checkedOn: true, featured: true,
        prompt: { select: { prompt: true } },
        app: { select: { selfPromo: true } },
        postTags: { select: { tag: { select: { kind: true, status: true, facet: true } } } },
      },
    })
    const urls = rows.filter((p) => contentIndexable(p)).map((p) => absUrl(contentPath(p.type, p.id, p.slug)))
    // submitUrls 一次最多 100 条；每天的量在这之内，超出的分批
    let n = 0
    for (let i = 0; i < urls.length; i += 100) n += await submitUrls(urls.slice(i, i + 100), siteOrigin())
    return n
  } catch (e) {
    console.warn('[content release] indexnow', e)
    return 0
  }
}
