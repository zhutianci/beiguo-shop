/**
 * 【AI圈大事记】内容管线：collect / triage / cluster / compose / rank / digest 六段。
 *
 * 规范见 .claude/skills/ai-news-pipeline/SKILL.md §3。几条不能违反的：
 *  - 每一段独立可重入，任何一段失败都不能影响其他段（所以这里全部函数各自吞异常并返回结果对象）
 *  - collect 零 LLM、零依赖；单源熔断隔离；源与源之间让出事件循环
 *  - triage / cluster / compose 全部走 lib/llm.ts，预算闸门由 llmJson 内部把关
 *  - 只对 triageState='RAW' / composeState='RAW' 的行调用大模型 —— 成本失控的唯一现实路径是代码 bug
 *  - 「今日/本周」一律用固定 +8 偏移的 UTC 算术，不依赖进程 TZ
 */
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { llmJson, LlmError, budgetExhausted } from '@/lib/llm'
import { fetchText, parseFeed, urlHash, eventSlug, FetchFeedError, type FeedEntry } from './feed'
import { fetchArticles } from './extract'
import { SEED_SOURCES, relayUrl, relayConfigured } from './sources'
import { CATEGORIES, CATEGORY_SLUGS, TOPIC_BLOCKLIST, TAG_WHITELIST } from './constants'
import { computeScore, overlapRatio, unsupportedNumbers, needsReview } from './score'

// ============ 通用常量与小工具 ============

/** 业务时区固定东八区。所有日切换算都是 UTC 上的固定偏移算术，与进程 TZ 无关。 */
const TZ_OFFSET_MIN = 8 * 60
const DAY_MS = 86400000
const HOUR_MS = 3600000

/** 业务时区的「今天是哪一天」 */
function dayKey(d: Date): string {
  return new Date(d.getTime() + TZ_OFFSET_MIN * 60000).toISOString().slice(0, 10)
}
/** 业务时区 YYYY-MM-DD 当天 00:00 对应的 UTC 时刻 */
function dayStartUtc(day: string): Date {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) - TZ_OFFSET_MIN * 60000)
}
/** 业务时区 YYYY-MM-DD 当天 23:59:59.999 对应的 UTC 时刻 */
function dayEndUtc(day: string): Date {
  return new Date(Date.parse(`${day}T23:59:59.999Z`) - TZ_OFFSET_MIN * 60000)
}
/** @db.Date 列只存日期部分，必须传纯 UTC 零点，否则会因时区偏移错一天 */
function dateOnly(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`)
}

/** 让出事件循环：2MB XML 的同步解析会阻塞几百毫秒，前台会卡 */
const yieldTick = () => new Promise<void>((r) => setImmediate(r))

function clip(s: string, max: number): string {
  const t = (s || '').replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : t.slice(0, Math.max(1, max - 1)) + '…'
}

function errMsg(e: unknown): string {
  if (e instanceof FetchFeedError) return e.status ? `${e.message}（HTTP ${e.status}）` : e.message
  return e instanceof Error ? e.message : String(e)
}

/** LLM 不可用（未配置 / 预算耗尽）时应当立刻停止本轮，不要继续空转重试 */
function isFatalLlmError(e: unknown): boolean {
  return e instanceof LlmError && (e.code === 'budget_exhausted' || e.code === 'not_configured' || e.code === 'bad_provider')
}

function parseEntities(json: string | null): string[] {
  if (!json) return []
  try {
    const v: unknown = JSON.parse(json)
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

const normEnt = (s: string) => s.toLowerCase().replace(/\s+/g, '')

/** 标签只能来自白名单：允许自由造词会在三个月内长出几千个只有 1 条内容的话题页 */
function pickTags(text: string, entities: string[]): string {
  const hay = `${text} ${entities.join(' ')}`.toLowerCase()
  const hit: string[] = []
  for (const t of TAG_WHITELIST) {
    if (hay.includes(t.toLowerCase())) hit.push(t)
    if (hit.length >= 5) break
  }
  return hit.join(',')
}

/**
 * 连续 N 字重合检测。overlapRatio 用的是 2-gram 集合相似度，抓不住
 * 「整句照抄但整体改写率不高」的情况，这里补一道连续片段的硬检查。
 */
function sharedRun(summary: string, materials: string, n = 20): string | null {
  const a = summary.replace(/\s+/g, '')
  const b = materials.replace(/\s+/g, '')
  if (a.length < n || b.length < n) return null
  for (let i = 0; i + n <= a.length; i++) {
    const g = a.slice(i, i + n)
    if (b.includes(g)) return g
  }
  return null
}

/**
 * urlHash 折叠时的取舍顺序：非 signal 源优先、tier 小（更权威）的优先、入库早的优先。
 * 这个顺序会直接影响 tier1Count —— 一手源和 HN 撞同一篇原文时，必须保住一手源那条。
 */
function bestFirst<T extends { id: number; source: { tier: number; role: string } }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const sa = a.source.role === 'signal' ? 1 : 0
    const sb = b.source.role === 'signal' ? 1 : 0
    if (sa !== sb) return sa - sb
    if (a.source.tier !== b.source.tier) return a.source.tier - b.source.tier
    return a.id - b.id
  })
}

/** 先按 urlHash 去重（保留传入顺序里的第一条），再数 distinct sourceId —— 口径见 SKILL.md §3.3 */
function dedupeByUrl<T extends { urlHash: string }>(rows: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const r of rows) {
    if (seen.has(r.urlHash)) continue
    seen.add(r.urlHash)
    out.push(r)
  }
  return out
}

// ============ 防重叠锁（复用 VmqLock 的唯一约束，schema 已冻结不新增表） ============
// lockKey 命名空间 "news:<stage>"，与 vmq 的 "<分>-<type>"（纯数字开头）不会撞；
// closeExpired() 只按 orderId 删自己的锁，也不会误删这里的行。

const LOCK_PREFIX = 'news:'

/** 各段的锁 TTL：进程被 OOM 杀掉时靠它自愈，宁可稍长也不要短于任务本身耗时 */
export const STAGE_LOCK_TTL_MS: Record<string, number> = {
  collect: 12 * 60000,
  triage: 12 * 60000,
  cluster: 12 * 60000,
  compose: 15 * 60000,
  rank: 8 * 60000,
  digest: 12 * 60000,
  seed: 5 * 60000,
}

/** 抢锁；抢不到返回 null（本轮直接退出，不排队） */
export async function acquireStageLock(stage: string, ttlMs: number): Promise<string | null> {
  const lockKey = `${LOCK_PREFIX}${stage}`.slice(0, 40)
  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  for (let i = 0; i < 2; i++) {
    try {
      await prisma.vmqLock.create({ data: { lockKey, orderId: token } })
      return token
    } catch (e) {
      if ((e as { code?: string })?.code !== 'P2002') throw e
      const existing = await prisma.vmqLock.findUnique({ where: { lockKey } })
      if (!existing) continue // 刚被别人释放，再抢一次

      // 用绝对值判断「陈旧」，而不是 now - createdAt < ttl。
      //
      // 原因：MySQL 的 DATETIME 不带时区，一旦进程 TZ 变了（本项目就把 app 容器
      // 从 UTC 改成了 Asia/Shanghai），改动前写入的行会被按新时区重新解释，
      // createdAt 可能落到「未来」。那时 now - createdAt 是负数，恒小于 ttl，
      // 锁就永远不会自愈——线上出现过持有 27 分钟仍不释放的 compose 锁，
      // 而 MySQL 自己算出来的 TIMESTAMPDIFF 明明已经 27 分钟。
      // 时间戳落在未来本身就说明这行不可信，按陈旧处理才是对的。
      const age = Math.abs(Date.now() - existing.createdAt.getTime())
      if (age < ttlMs) return null // 有人正在跑
      // 陈旧锁（上一轮进程被杀）→ 精确按 id 清理后重试，避免误删刚续上的新锁
      await prisma.vmqLock.deleteMany({ where: { id: existing.id, orderId: existing.orderId } }).catch(() => {})
    }
  }
  return null
}

/** 只删自己那把锁 */
export async function releaseStageLock(stage: string, token: string): Promise<void> {
  const lockKey = `${LOCK_PREFIX}${stage}`.slice(0, 40)
  await prisma.vmqLock.deleteMany({ where: { lockKey, orderId: token } }).catch(() => {})
}

// ============ ① collect：抓 feed 入库，零 LLM ============

const FETCH_TIMEOUT_MS = 8000
const MAX_FAIL_BEFORE_DISABLE = 3
/**
 * 只收 7 天内的条目。两个原因：
 * 1) 比 30 天保留期短，避免「purge 删掉 → 下一轮又插回来 → 再花一次分诊的钱」
 * 2) 与 TRIAGE_STALE_DAYS 对齐，收进来的条目都还在值得分诊的窗口内
 */
const MAX_ITEM_AGE_DAYS = 7
const ITEM_RETENTION_DAYS = 30

type RawEntry = FeedEntry & { points?: number; comments?: number }

export interface CollectResult {
  sources: number
  ok: number
  failed: number
  skipped: number
  inserted: number
  disabled: string[]
  purged: number
  details: { key: string; inserted?: number; error?: string; skipped?: string }[]
}

/** hnrss 的 description 里带 "Points: 123" 与 "# Comments: 45"，解析出来做热度信号 */
function hnSignals(summary: string): { points: number; comments: number } {
  const p = summary.match(/points?\s*[:：]\s*(\d+)/i)
  const c = summary.match(/#\s*comments?\s*[:：]\s*(\d+)/i)
  return { points: p ? Number(p[1]) : 0, comments: c ? Number(c[1]) : 0 }
}

// --- JSON 源（HuggingFace 每日论文 / Reddit）。这类源都要走中继，未配置中继时根本不会走到这里。---
const asObj = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const numOf = (v: unknown): number => (typeof v === 'number' && isFinite(v) ? v : 0)

function parseJsonFeed(text: string, limit = 40): RawEntry[] {
  let root: unknown
  try {
    root = JSON.parse(text)
  } catch {
    return []
  }
  const out: RawEntry[] = []

  // Reddit listing: { data: { children: [{ data: {...} }] } }
  const children = asObj(asObj(root)?.data)?.children
  if (Array.isArray(children)) {
    for (const c of children) {
      const d = asObj(asObj(c)?.data)
      if (!d) continue
      const title = str(d.title)
      const permalink = str(d.permalink)
      const url = permalink ? `https://www.reddit.com${permalink}` : str(d.url)
      if (!title || !/^https?:\/\//i.test(url)) continue
      out.push({
        guid: str(d.id) || url,
        url: url.slice(0, 1000),
        title: title.slice(0, 500),
        summary: clip(str(d.selftext), 1200),
        author: str(d.author) || null,
        publishedAt: new Date(numOf(d.created_utc) * 1000 || Date.now()),
        points: Math.round(numOf(d.score)),
        comments: Math.round(numOf(d.num_comments)),
      })
      if (out.length >= limit) break
    }
    return out
  }

  // HuggingFace daily_papers: [{ paper: { id, title, summary }, publishedAt }]
  if (Array.isArray(root)) {
    for (const it of root) {
      const o = asObj(it)
      if (!o) continue
      const p = asObj(o.paper) || o
      const id = str(p.id)
      const title = str(p.title)
      if (!id || !title) continue
      out.push({
        guid: id,
        url: `https://huggingface.co/papers/${id}`,
        title: title.slice(0, 500),
        summary: clip(str(p.summary), 1200),
        author: null,
        publishedAt: new Date(Date.parse(str(o.publishedAt)) || Date.now()),
        points: Math.round(numOf(o.upvotes) || numOf(p.upvotes)),
        comments: 0,
      })
      if (out.length >= limit) break
    }
  }
  return out
}

export async function collect(): Promise<CollectResult> {
  const sources = await prisma.newsSource.findMany({ where: { enabled: true }, orderBy: { id: 'asc' } })
  const res: CollectResult = {
    sources: sources.length,
    ok: 0,
    failed: 0,
    skipped: 0,
    inserted: 0,
    disabled: [],
    purged: 0,
    details: [],
  }

  const now = Date.now()
  const minPublished = new Date(now - MAX_ITEM_AGE_DAYS * DAY_MS)

  for (const s of sources) {
    try {
      // 中继未配置 → 境外源直接跳过并记原因，不算失败（不该把这些源熔断掉）
      if (s.viaRelay && !relayConfigured()) {
        res.skipped++
        res.details.push({ key: s.key, skipped: '未配置 NEWS_RELAY_URL，境外源跳过' })
        await prisma.newsSource.update({
          where: { id: s.id },
          data: { lastFetchAt: new Date(), lastError: '未配置 NEWS_RELAY_URL' },
        })
        continue
      }

      const url = s.viaRelay ? relayUrl(s.feedUrl) : s.feedUrl
      const text = await fetchText(url, FETCH_TIMEOUT_MS)
      const entries: RawEntry[] = s.kind === 'JSON' ? parseJsonFeed(text) : parseFeed(text)

      // 同一批次内可能有重复 urlHash（少数源会重复推同一条），先在内存里去重
      const seen = new Set<string>()
      const rows: {
        sourceId: number
        guid: string
        url: string
        urlHash: string
        title: string
        summaryRaw: string | null
        author: string | null
        publishedAt: Date
        points: number
        comments: number
      }[] = []
      const hnRefresh: { urlHash: string; points: number; comments: number }[] = []

      for (const e of entries) {
        // 有的源发布时间带错时区，落在未来会污染时间轴排序，向前钳到当前时刻
        const pub = e.publishedAt.getTime() > now + HOUR_MS ? new Date(now) : e.publishedAt
        if (pub < minPublished) continue
        const h = urlHash(e.url)
        const sig = s.kind === 'HN' ? hnSignals(e.summary) : { points: e.points ?? 0, comments: e.comments ?? 0 }
        if (sig.points > 0 || sig.comments > 0) hnRefresh.push({ urlHash: h, ...sig })
        if (seen.has(h)) continue
        seen.add(h)
        rows.push({
          sourceId: s.id,
          guid: e.guid.slice(0, 255),
          url: e.url.slice(0, 1000),
          urlHash: h,
          title: e.title.slice(0, 500),
          summaryRaw: e.summary ? e.summary.slice(0, 4000) : null,
          author: e.author ? e.author.slice(0, 120) : null,
          publishedAt: pub,
          points: sig.points,
          comments: sig.comments,
        })
      }

      // 去重靠 @@unique([sourceId, urlHash])，skipDuplicates 交给数据库判，不做 select 预查
      const created = rows.length ? await prisma.newsItem.createMany({ data: rows, skipDuplicates: true }) : { count: 0 }

      // 热度会随时间涨（HN 帖子会往上爬），已存在的条目只在「变大」时更新，避免回退
      for (const r of hnRefresh.slice(0, 30)) {
        await prisma.newsItem
          .updateMany({
            where: { sourceId: s.id, urlHash: r.urlHash, points: { lt: r.points } },
            data: { points: r.points, comments: r.comments },
          })
          .catch(() => {})
      }

      await prisma.newsSource.update({
        where: { id: s.id },
        data: {
          lastFetchAt: new Date(),
          lastOkAt: new Date(),
          failCount: 0,
          lastError: null,
          itemCount: { increment: created.count },
        },
      })
      res.ok++
      res.inserted += created.count
      res.details.push({ key: s.key, inserted: created.count })
    } catch (e) {
      // 熔断隔离：单源失败只记账，绝不中断整批
      const msg = errMsg(e)
      const failCount = s.failCount + 1
      const disable = failCount >= MAX_FAIL_BEFORE_DISABLE
      await prisma.newsSource
        .update({
          where: { id: s.id },
          data: {
            lastFetchAt: new Date(),
            failCount,
            lastError: msg.slice(0, 500),
            ...(disable ? { enabled: false } : {}),
          },
        })
        .catch(() => {})
      res.failed++
      if (disable) res.disabled.push(s.key)
      res.details.push({ key: s.key, error: msg.slice(0, 200) })
    } finally {
      await yieldTick()
    }
  }

  // 保留期清理：只删没进过事件的孤儿条目，已聚合的条目是事件的证据链，不能删
  const purged = await prisma.newsItem.deleteMany({
    where: { publishedAt: { lt: new Date(now - ITEM_RETENTION_DAYS * DAY_MS) }, eventId: null },
  })
  res.purged = purged.count

  console.log('[news/collect]', JSON.stringify({ ok: res.ok, failed: res.failed, inserted: res.inserted, purged: res.purged }))
  return res
}

// ============ ② triage：批量分诊（判断题，用便宜模型） ============

// 一次让模型判断几条。
// 实测 glm-4-flash 配上完整的分诊提示词（黑名单 + 六个分类 + 实体抽取规则）时，
// 无论给 8 条还是 6 条，都只答第一条——批量越大浪费越多，而不是越省。
// 降到 3 条后每批答全，且单次响应变短、延迟从 13s 降下来，总耗时反而更少。
// 换更强的模型（如 glm-4-plus）可以把这个值调大，故做成可配。
const TRIAGE_BATCH = Math.max(1, Math.min(Number(process.env.NEWS_TRIAGE_BATCH || 3), 20))
const TRIAGE_MAX_ITEMS = 40
const TRIAGE_STALE_DAYS = 7

// 模型经常把可选字段写成 null、把布尔写成字符串。zod 的 .default() 只兜 undefined，
// 所以可选字段一律 .nullish() 收下，规整交给下面三个小函数 —— 别为了一个 null 让整批重试三次。
const boolish = z.union([z.boolean(), z.string(), z.number()])

function toBool(v: boolean | string | number | null | undefined): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return /^(true|1|yes|是)$/i.test(v.trim())
  return false
}
function toStr(v: string | null | undefined): string {
  return typeof v === 'string' ? v : ''
}
function toNum(v: number | null | undefined, fallback: number, min: number, max: number): number {
  return typeof v === 'number' && isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback
}

/**
 * 兼容各家模型的包装形态。实测 glm-4-flash 会直接吐裸对象
 * {"index":0,"isAiRelated":...} 而不是 {"results":[...]}，
 * 别家还可能用 items / data / list，或者直接给一个数组。
 * 与其和每个供应商的脾气较劲，不如在入口统一归一化。
 */
const unwrapResults = (raw: unknown): unknown => {
  if (Array.isArray(raw)) return { results: raw }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    for (const k of ['results', 'items', 'data', 'list']) {
      if (Array.isArray(o[k])) return { results: o[k] }
    }
    // 裸的单条结果对象：认 index 字段
    if ('index' in o || 'isAiRelated' in o) return { results: [o] }
  }
  return raw
}

const triageShape = z.object({
  results: z
    .array(
      z.object({
        // index / isAiRelated / blocked 是必填：缺失就让整批解析失败、条目留在 RAW 下轮重试，
        // 静默填默认值会导致「模型没答，我们却当成了判断结果」
        index: z.coerce.number().int(),
        isAiRelated: boolish,
        blocked: boolish,
        blockReason: z.string().nullish(),
        category: z.string().nullish(),
        entities: z.array(z.unknown()).nullish(),
        confidence: z.coerce.number().nullish(),
      })
    )
    .max(TRIAGE_BATCH * 2),
})

// z.preprocess 会把输出类型擦成 unknown，这里显式标注回来，调用处才能拿到 r.data.results
const triageSchema: z.ZodType<z.infer<typeof triageShape>> = z.preprocess(
  unwrapResults,
  triageShape
) as z.ZodType<z.infer<typeof triageShape>>

const TRIAGE_SYSTEM = [
  '你是 AI 行业资讯的分诊员。你只做判断，不写作，不做任何解读。',
  '',
  '【判定一：是否与人工智能产业相关】',
  '相关的范围：模型发布与版本更新、产品功能上线、开源项目与工具、论文与技术方法、',
  '融资并购与公司动态、基准测试与评测、开发者实践与教程、从业者公开观点。',
  '',
  '【判定二：是否命中禁止选题（blocked）】',
  '以下话题看起来是 AI 垂类，实际属于社会公共事务，必须拦掉：',
  ...TOPIC_BLOCKLIST.map((t, i) => `${i + 1}. ${t}`),
  '判断从严：拿不准就算命中。漏掉一条产业动态的成本，远低于一条政策解读带来的风险。',
  'blocked 为 true 时，blockReason 必填中文短句，说明命中哪一条。',
  '',
  '【判定三：分类 category，只能取下列 slug 之一】',
  ...CATEGORIES.map((c) => `${c.slug}（${c.label}）：${c.hint}`),
  '',
  '【判定四：entities 实体指纹】',
  '抽取 2-6 个用于识别「是同一件事」的专有名词：公司名、机构名、产品名、模型名、项目名。',
  '写规范全称，中文源里的外企也写常见中文或英文原名。',
  '不要写「人工智能」「大模型」「技术」这类通用词，它们对聚合没有区分度。',
  '',
  '【confidence】0 到 1 的小数，表示你对上述判断的把握。',
  '',
  // 这个示例必须完整地在同一行里。实测把它拆成两行后，glm-4-flash 会认成内层对象的形状，
  // 直接吐一个裸的 {"index":0,...} 且只答第一条——最外层的 results 数组整个丢掉。
  '输出 json，形如 {"results":[{"index":0,"isAiRelated":true,"blocked":false,"blockReason":null,"category":"ai-models","entities":["OpenAI","GPT-6"],"confidence":0.9}]}。',
  '最外层必须是带 results 数组的对象，不要直接输出单个结果对象。',
  '必须为每一条输入返回一个对象，index 与输入的编号严格一一对应，不要遗漏、不要合并。',
  'results 数组的长度必须严格等于本次输入的条数。',
].join('\n')

export interface TriageResult {
  pending: number
  processed: number
  ok: number
  blocked: number
  skipped: number
  failed: number
  stale: number
  batches: number
  error?: string
}

export async function triage(): Promise<TriageResult> {
  const res: TriageResult = { pending: 0, processed: 0, ok: 0, blocked: 0, skipped: 0, failed: 0, stale: 0, batches: 0 }

  // 太旧的条目不值得再花钱分诊，直接归档为 SKIP，避免队列越积越长
  const stale = await prisma.newsItem.updateMany({
    where: { triageState: 'RAW', publishedAt: { lt: new Date(Date.now() - TRIAGE_STALE_DAYS * DAY_MS) } },
    data: { triageState: 'SKIP' },
  })
  res.stale = stale.count

  const pending = await prisma.newsItem.findMany({
    where: { triageState: 'RAW' },
    orderBy: { publishedAt: 'desc' },
    take: TRIAGE_MAX_ITEMS,
    select: { id: true, title: true, summaryRaw: true, source: { select: { name: true } } },
  })
  res.pending = pending.length
  if (!pending.length) return res

  for (let i = 0; i < pending.length; i += TRIAGE_BATCH) {
    const batch = pending.slice(i, i + TRIAGE_BATCH)
    const user = batch
      .map(
        (it, idx) =>
          `[${idx}] 标题：${clip(it.title, 160)}\n来源：${it.source.name}\n摘要：${clip(it.summaryRaw || '', 500) || '（无）'}`
      )
      .join('\n\n')

    try {
      const r = await llmJson({
        stage: 'triage',
        system: TRIAGE_SYSTEM,
        user,
        schema: triageSchema,
        maxTokens: 900,
        temperature: 0,
      })
      res.batches++

      const answered = new Set<number>()
      for (const item of r.data.results) {
        const target = batch[item.index]
        if (!target || answered.has(item.index)) continue
        answered.add(item.index)

        const entities = (item.entities ?? [])
          .filter((e): e is string => typeof e === 'string')
          .map((e) => clip(e, 60))
          .filter(Boolean)
          .slice(0, 6)
        const rawCategory = toStr(item.category)
        const category = CATEGORY_SLUGS.includes(rawCategory as (typeof CATEGORY_SLUGS)[number]) ? rawCategory : 'industry'
        const confidence = Math.round(toNum(item.confidence, 0.6, 0, 1) * 100) / 100
        const blocked = toBool(item.blocked)

        // 命中黑名单的保留原始记录供审计，但不进入后续任何环节
        const triageState = blocked ? 'BLOCKED' : toBool(item.isAiRelated) ? 'OK' : 'SKIP'
        if (triageState === 'BLOCKED') res.blocked++
        else if (triageState === 'OK') res.ok++
        else res.skipped++

        await prisma.newsItem.update({
          where: { id: target.id },
          data: {
            triageState,
            blocked,
            blockReason: blocked ? clip(toStr(item.blockReason) || '命中选题黑名单', 200) : null,
            category: triageState === 'OK' ? category : null,
            entities: entities.length ? JSON.stringify(entities) : null,
            confidence,
          },
        })
        res.processed++
      }

      // 模型漏答的条目留在 RAW 等下一轮重试，不再直接判死。
      //
      // 原来标 FAILED 的理由是「留 RAW 会每小时重复计费」，但线上第一次跑就暴露了代价：
      // glm-4-flash 每批只答第一条，40 条里 35 条被永久判死、再也不会被处理。
      // 漏答是模型的脾气问题（换批量大小就好了），不是这条内容本身有问题，
      // 为此永久丢弃内容不划算。
      //
      // 重复计费的上限由 TRIAGE_STALE_DAYS 的陈旧清理兜住：超过 7 天仍是 RAW 的
      // 会被扫成 SKIP，所以最坏情况是重试若干轮后自动退出，不会无限烧钱。
      const missed = batch.filter((_, idx) => !answered.has(idx))
      if (missed.length) res.failed += missed.length
    } catch (e) {
      // 调用失败：条目留在 RAW，下一轮重试（SKILL §8）
      res.error = errMsg(e)
      break
    }
    await yieldTick()
  }

  console.log('[news/triage]', JSON.stringify(res))
  return res
}

// ============ ③ cluster：实体指纹召回 + 一次小模型判定 ============

const CLUSTER_MAX_ITEMS = 30
const CLUSTER_WINDOW_MS = 48 * HOUR_MS
const CLUSTER_MAX_CANDIDATES = 3
/** signal 源（HN / Reddit）只加热度不产条目，超过这个时长还没匹配上就不再尝试 */
const SIGNAL_GIVE_UP_MS = 72 * HOUR_MS

const clusterSchema = z.object({
  matchIndex: z.coerce.number().int(),
  reason: z.string().nullish(),
})

const CLUSTER_SYSTEM = [
  '你判断一条新资讯与若干已有事件是否在讲【同一件事】。',
  '',
  '同一件事的标准：同一主体的同一次动作。例如同一家公司发布同一个模型、同一笔融资、',
  '同一篇论文、同一个产品的同一次更新 —— 即使措辞、角度、语言不同也算同一件事。',
  '',
  '不算同一件事：同一家公司的两件不同事；同一主题的不同产品；',
  '对某事的后续评论与该事本身；时间相隔的两次独立发布。',
  '',
  '宁可判为新事件，也不要错误合并：错误合并会让用户在信源列表里看到明显不相关的原文。',
  '',
  '输出 json：{"matchIndex":0,"reason":"简短中文理由"}。',
  'matchIndex 是命中的候选编号；都不是同一件事时返回 -1。',
].join('\n')

export interface ClusterResult {
  pending: number
  attachedByUrl: number
  attachedByLlm: number
  created: number
  gaveUp: number
  llmCalls: number
  error?: string
}

/**
 * 重算事件的聚合列。sourceCount 口径：先按 urlHash 去重、再数 distinct sourceId ——
 * 否则两家媒体转载同一篇原文会把跨源交叉验证信号刷成假的 2（SKILL §3.3）。
 */
export async function recomputeEventAggregates(eventId: number): Promise<void> {
  const items = await prisma.newsItem.findMany({
    where: { eventId },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      urlHash: true,
      sourceId: true,
      points: true,
      publishedAt: true,
      source: { select: { tier: true, kind: true, role: true } },
    },
  })
  if (!items.length) return

  const reps = dedupeByUrl(bestFirst(items))
  const sourceCount = new Set(reps.map((r) => r.sourceId)).size
  const tier1Count = new Set(reps.filter((r) => r.source.tier === 1).map((r) => r.sourceId)).size
  const hnPoints = items.reduce((m, i) => (i.source.kind === 'HN' && i.points > m ? i.points : m), 0)
  const happenedAt = items.reduce((m, i) => (i.publishedAt < m ? i.publishedAt : m), items[0].publishedAt)

  await prisma.newsEvent.update({
    where: { id: eventId },
    data: { sourceCount, tier1Count, hnPoints, happenedAt },
  })
}

/** slug 撞车时退让加序号；slug 是外链地址的一部分，生成后不再改 */
async function uniqueSlug(base: string): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const s = i === 0 ? base : `${base}-${i + 1}`
    const hit = await prisma.newsEvent.findUnique({ where: { slug: s }, select: { id: true } })
    if (!hit) return s
  }
  return `${base}-${Math.random().toString(36).slice(2, 6)}`
}

export async function cluster(): Promise<ClusterResult> {
  const res: ClusterResult = { pending: 0, attachedByUrl: 0, attachedByLlm: 0, created: 0, gaveUp: 0, llmCalls: 0 }

  const pending = await prisma.newsItem.findMany({
    where: {
      triageState: 'OK',
      blocked: false,
      eventId: null,
      publishedAt: { gte: new Date(Date.now() - 7 * DAY_MS) },
    },
    orderBy: { publishedAt: 'desc' },
    take: CLUSTER_MAX_ITEMS,
    select: {
      id: true,
      title: true,
      summaryRaw: true,
      urlHash: true,
      entities: true,
      category: true,
      points: true,
      publishedAt: true,
      source: { select: { id: true, name: true, tier: true, role: true, kind: true } },
    },
  })
  res.pending = pending.length
  if (!pending.length) return res

  // 候选池：一次性拉出时间窗内已归属事件的条目，在内存里做实体交集召回，
  // 避免每条 pending 都打一次库。本轮新建的事件也会即时加进来。
  const minPub = pending.reduce((m, p) => (p.publishedAt < m ? p.publishedAt : m), pending[0].publishedAt)
  const maxPub = pending.reduce((m, p) => (p.publishedAt > m ? p.publishedAt : m), pending[0].publishedAt)
  const neighbours = await prisma.newsItem.findMany({
    where: {
      eventId: { not: null },
      triageState: 'OK',
      publishedAt: { gte: new Date(minPub.getTime() - CLUSTER_WINDOW_MS), lte: new Date(maxPub.getTime() + CLUSTER_WINDOW_MS) },
    },
    orderBy: { publishedAt: 'desc' },
    take: 1200,
    select: { eventId: true, entities: true, title: true, publishedAt: true },
  })
  const pool = neighbours.map((n) => ({
    eventId: n.eventId as number,
    ents: new Set(parseEntities(n.entities).map(normEnt)),
    title: n.title,
    publishedAt: n.publishedAt,
  }))

  const headlineCache = new Map<number, string>()
  async function headlineOf(ids: number[]): Promise<Map<number, string>> {
    const miss = ids.filter((id) => !headlineCache.has(id))
    if (miss.length) {
      const rows = await prisma.newsEvent.findMany({ where: { id: { in: miss } }, select: { id: true, headline: true } })
      for (const r of rows) headlineCache.set(r.id, r.headline)
    }
    return headlineCache
  }

  for (const item of pending) {
    try {
      // 1) 免费快路：同一篇原文被多家源收录时 urlHash 相同，直接并入，不花 LLM
      const twin = await prisma.newsItem.findFirst({
        where: { urlHash: item.urlHash, eventId: { not: null }, id: { not: item.id } },
        select: { eventId: true },
      })
      if (twin?.eventId) {
        await prisma.newsItem.update({ where: { id: item.id }, data: { eventId: twin.eventId } })
        await recomputeEventAggregates(twin.eventId)
        pool.push({ eventId: twin.eventId, ents: new Set(parseEntities(item.entities).map(normEnt)), title: item.title, publishedAt: item.publishedAt })
        res.attachedByUrl++
        continue
      }

      // 2) 实体指纹召回：48h 时间窗 + 实体交集
      const ents = new Set(parseEntities(item.entities).map(normEnt))
      const scores = new Map<number, number>()
      if (ents.size) {
        for (const p of pool) {
          if (Math.abs(p.publishedAt.getTime() - item.publishedAt.getTime()) > CLUSTER_WINDOW_MS) continue
          let hit = 0
          p.ents.forEach((e) => {
            if (ents.has(e)) hit++
          })
          if (hit > 0) scores.set(p.eventId, Math.max(scores.get(p.eventId) || 0, hit))
        }
      }
      const top = Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, CLUSTER_MAX_CANDIDATES)
        .map(([id]) => id)

      let matchedEventId: number | null = null
      if (top.length) {
        const cache = await headlineOf(top)
        const list = top.map((id) => ({ id, headline: cache.get(id) || '' })).filter((c) => c.headline)
        if (list.length) {
          const user = [
            `新资讯：${clip(item.title, 160)}`,
            `摘要：${clip(item.summaryRaw || '', 240) || '（无）'}`,
            '',
            '候选事件：',
            ...list.map((c, i) => `[${i}] ${clip(c.headline, 120)}`),
          ].join('\n')
          const r = await llmJson({
            stage: 'cluster',
            system: CLUSTER_SYSTEM,
            user,
            schema: clusterSchema,
            maxTokens: 200,
            temperature: 0,
          })
          res.llmCalls++
          const idx = r.data.matchIndex
          if (idx >= 0 && idx < list.length) matchedEventId = list[idx].id
        }
      }

      if (matchedEventId) {
        await prisma.newsItem.update({ where: { id: item.id }, data: { eventId: matchedEventId } })
        await recomputeEventAggregates(matchedEventId)
        pool.push({ eventId: matchedEventId, ents, title: item.title, publishedAt: item.publishedAt })
        res.attachedByLlm++
        continue
      }

      // 3) 没匹配上：signal 源不产条目（否则时间轴会被英文技术贴稀释），只等后续事件来认领
      if (item.source.role === 'signal') {
        if (Date.now() - item.publishedAt.getTime() > SIGNAL_GIVE_UP_MS) {
          await prisma.newsItem.update({ where: { id: item.id }, data: { triageState: 'SKIP' } })
          res.gaveUp++
        }
        continue
      }

      // 4) 新建事件。摘要还没写，先 DRAFT，compose 成功后才 PUBLISHED
      const headline = clip(item.title, 120)
      const slug = await uniqueSlug(eventSlug(headline, item.publishedAt))
      const ev = await prisma.newsEvent.create({
        data: {
          slug,
          headline: headline.slice(0, 300),
          summary: '',
          category: item.category || 'industry',
          aiScore: 0,
          sourceCount: 1,
          tier1Count: item.source.tier === 1 ? 1 : 0,
          hnPoints: item.source.kind === 'HN' ? item.points : 0,
          status: 'DRAFT',
          composeState: 'RAW',
          happenedAt: item.publishedAt,
        },
        select: { id: true },
      })
      await prisma.newsItem.update({ where: { id: item.id }, data: { eventId: ev.id } })
      pool.push({ eventId: ev.id, ents, title: item.title, publishedAt: item.publishedAt })
      res.created++
    } catch (e) {
      res.error = errMsg(e)
      if (isFatalLlmError(e)) break
      // 单条失败不影响其他条目：留在 eventId=null，下一轮重试
    }
    await yieldTick()
  }

  console.log('[news/cluster]', JSON.stringify(res))
  return res
}

// ============ ④ compose：写摘要（唯一的写作题，用好一点的模型） ============

const COMPOSE_MAX_EVENTS = 6
const COMPOSE_MAX_REWRITES = 2
/** LLM 不可用且事件已经放了这么久，就降级发「来源摘要」，不能让时间轴一直空着 */
const COMPOSE_DEGRADE_AFTER_MS = 6 * HOUR_MS
const MATERIAL_MAX_SOURCES = 8

const composeSchema = z.object({
  headline: z.string().min(2).max(500),
  summary: z.string().min(10).max(4000),
  whyItMatters: z.string().nullish(),
  aiScore: z.coerce.number().nullish(),
  facts: z.array(z.object({ text: z.string().max(500), sourceIndex: z.coerce.number().int().min(0) })).nullish(),
})

const COMPOSE_SYSTEM = [
  '你是 AI 行业资讯的摘要撰写员。只依据给定材料写作，不使用任何外部知识，不做推测。',
  '',
  '【硬约束，违反即作废】',
  '1. 材料不足就写短，宁可 80 字也不要补充材料里没有的信息。',
  '2. 不得出现材料中没有的数字、版本号、日期、人名、公司名。',
  '3. 不得使用「据悉」「业内人士称」「有消息表示」「据了解」等无主语转述。',
  '4. 与任何一条原文连续 20 个字不得重合，必须用自己的话重新组织。',
  '5. 不得出现「记者」「编辑部」「独家」「爆料」「本站原创」「本网讯」等字样，不做标题党。',
  '6. 只陈述企业经营动态与技术事实，不做政策解读、不做投资建议、不评价政治议题。',
  '',
  '【什么叫写得好】',
  '读者看完摘要就能判断「这事跟我有没有关系、要不要点开原文」，而不是只知道「发生了某件事」。',
  '所以要优先保留材料里的【具体信息】：版本号、参数量、价格、百分比、时间跨度、',
  '与谁对比、提升多少、什么时候可用、面向谁开放。',
  '反例（空话，不要这样写）：「该模型性能有所提升，受到业内关注。」',
  '正例（有信息量）：「上下文从 12.8 万扩到 100 万 token，定价不变，即日起对 Pro 订阅用户开放。」',
  '材料里若有正文，请从正文里取这些细节；材料确实只有一句话时，写短即可，不要凑字数。',
  '',
  '【输出 json 字段】',
  'headline：不超过 40 个字，事件级描述，说清「谁做了什么」。',
  'summary：120 到 260 个字，一段话讲清事实，密度优先于长度。材料少就写少，不许扩写。',
  'whyItMatters：不超过 60 个字的推荐理由，说明这件事为什么值得看。',
  'aiScore：0 到 100 的整数，这件事对 AI 从业者的重要性。请拉开差距，不要都给 70 分：',
  '  90-100 头部厂商发布新一代模型、行业格局级变化',
  '  75-89  重要产品/能力更新、有影响力的开源发布、大额融资并购',
  '  60-74  常规版本迭代、值得一看的技术方法或评测',
  '  40-59  小范围工具更新、个人项目、单一视角的观点',
  '  0-39   与 AI 产业关系很弱，或信息量太少不值得单独成条',
  'facts：2 到 5 条关键事实，每条形如 {"text":"事实","sourceIndex":材料编号}，',
  '      sourceIndex 必须是该事实真正的出处编号，供人工一键复核。',
  '',
  '输出 json，不要任何解释文字。',
].join('\n')

interface Material {
  index: number
  sourceName: string
  tier: number
  title: string
  desc: string
  /** 抓到的原文正文（仅用于让模型读懂，不落库、不对外展示） */
  body?: string
}

/**
 * 是否抓原文正文当素材。
 *
 * 关掉的话，摘要的信息量上限就是 feed 给的那一两句话——换再强的模型也写不出
 * 原文里没有的细节，只会被逼着扩写。抓正文是为了「读懂」，输出仍是自写摘要 + 外链，
 * 与整篇转载是两回事（SKILL.md §1.1）。出问题时可用 NEWS_FETCH_BODY=0 一键退回。
 */
const FETCH_BODY = process.env.NEWS_FETCH_BODY !== '0'
/** 每个事件最多抓几篇原文：多源事件抓前几个代表即可，再多是浪费 token */
const BODY_MAX_SOURCES = Math.max(1, Math.min(Number(process.env.NEWS_BODY_SOURCES || 3), 5))
/** 单篇正文喂给模型的上限 */
const BODY_CLIP = 2400

async function eventMaterials(eventId: number): Promise<{
  materials: Material[]
  text: string
  tiers: number[]
  minConfidence: number
  hasFeed: boolean
}> {
  const items = await prisma.newsItem.findMany({
    where: { eventId },
    orderBy: [{ id: 'asc' }],
    select: {
      id: true,
      urlHash: true,
      url: true,
      title: true,
      summaryRaw: true,
      confidence: true,
      source: { select: { name: true, tier: true, role: true } },
    },
  })
  // 一手源排在前面，既让 sourceIndex 稳定，也让写作模型先看到最权威的那份材料
  const reps = dedupeByUrl(bestFirst(items)).slice(0, MATERIAL_MAX_SOURCES)
  const materials: Material[] = reps.map((r, i) => ({
    index: i,
    sourceName: r.source.name,
    tier: r.source.tier,
    title: clip(r.title, 160),
    desc: clip(r.summaryRaw || '', 400),
  }))

  // 抓原文正文补充素材。抓不到就沿用 description，绝不因此中断——
  // 素材薄一点只是摘要写得短，抓取失败让整段挂掉才是事故。
  if (FETCH_BODY && reps.length) {
    const targets = reps.slice(0, BODY_MAX_SOURCES)
    try {
      const fetched = await fetchArticles(targets.map((r) => r.url))
      fetched.forEach((f, i) => {
        if (f.ok && f.text.length > (materials[i].desc?.length || 0)) {
          materials[i].body = clip(f.text, BODY_CLIP)
        }
      })
    } catch (e) {
      console.warn('[news] 正文抓取整体失败，退回 feed 摘要', e)
    }
  }

  const text = materials
    .map((m) => {
      const head = `[${m.index}] 来源：${m.sourceName}\n标题：${m.title}`
      // 有正文就以正文为主，description 往往只是正文首句的截断，两者都给等于重复占 token
      return m.body
        ? `${head}\n原文正文：\n${m.body}`
        : `${head}\n摘要：${m.desc || '（无）'}`
    })
    .join('\n\n---\n\n')
  const confidences = items.map((i) => (i.confidence == null ? 1 : Number(i.confidence))).filter((n) => !isNaN(n))
  return {
    materials,
    text,
    tiers: reps.map((r) => r.source.tier),
    minConfidence: confidences.length ? Math.min(...confidences) : 1,
    hasFeed: items.some((i) => i.source.role !== 'signal'),
  }
}

/**
 * 是否值得重写。默认已发布事件不重写；只在「sourceCount 从 1 涨到 ≥3」或「首次出现一手源」
 * 时重写一次，终身上限 1 次（SKILL §5.3）。
 * 首次发布时的口径用 fetchedAt <= publishedAt 反推，不需要额外快照列。
 */
async function rewriteReason(ev: { id: number; publishedAt: Date | null; rewriteCount: number }): Promise<string | null> {
  if (ev.rewriteCount >= 1 || !ev.publishedAt) return null
  const items = await prisma.newsItem.findMany({
    where: { eventId: ev.id },
    orderBy: { id: 'asc' },
    select: { id: true, urlHash: true, sourceId: true, fetchedAt: true, source: { select: { tier: true, role: true } } },
  })
  const at = ev.publishedAt
  const count = (rows: typeof items) => {
    const reps = dedupeByUrl(bestFirst(rows))
    return {
      sources: new Set(reps.map((r) => r.sourceId)).size,
      tier1: new Set(reps.filter((r) => r.source.tier === 1).map((r) => r.sourceId)).size,
    }
  }
  const before = count(items.filter((i) => i.fetchedAt <= at))
  const nowc = count(items)
  if (before.sources === 1 && nowc.sources >= 3) return `信源数从 1 涨到 ${nowc.sources}`
  if (before.tier1 === 0 && nowc.tier1 >= 1) return '首次出现一手官方信源'
  return null
}

export interface ComposeResult {
  candidates: number
  composed: number
  rewritten: number
  degraded: number
  flagged: number
  skipped: number
  error?: string
}

export async function compose(): Promise<ComposeResult> {
  const res: ComposeResult = { candidates: 0, composed: 0, rewritten: 0, degraded: 0, flagged: 0, skipped: 0 }
  const since = new Date(Date.now() - 7 * DAY_MS)

  // 只对 composeState='RAW' 的事件调用大模型 —— 这是成本的数据库级保证
  const fresh = await prisma.newsEvent.findMany({
    where: { composeState: 'RAW', status: { in: ['DRAFT', 'PUBLISHED'] }, happenedAt: { gte: since } },
    orderBy: [{ sourceCount: 'desc' }, { happenedAt: 'desc' }],
    take: COMPOSE_MAX_EVENTS,
  })

  // 重写候选：先用列条件粗筛，再用 rewriteReason 精确判定
  const maybeRewrite = await prisma.newsEvent.findMany({
    where: {
      composeState: 'DONE',
      rewriteCount: 0,
      publishedAt: { not: null },
      happenedAt: { gte: since },
      OR: [{ sourceCount: { gte: 3 } }, { tier1Count: { gte: 1 } }],
    },
    orderBy: { score: 'desc' },
    take: COMPOSE_MAX_REWRITES * 3,
  })

  const jobs: { ev: (typeof fresh)[number]; rewrite: string | null }[] = fresh.map((ev) => ({ ev, rewrite: null }))
  for (const ev of maybeRewrite) {
    if (jobs.filter((j) => j.rewrite).length >= COMPOSE_MAX_REWRITES) break
    const reason = await rewriteReason(ev)
    if (reason) jobs.push({ ev, rewrite: reason })
  }
  res.candidates = jobs.length

  for (const { ev, rewrite } of jobs) {
    try {
      const mat = await eventMaterials(ev.id)
      // 只由 signal 源构成的事件不该存在（cluster 不会建），保险起见跳过，不浪费写作模型
      if (!mat.materials.length || !mat.hasFeed) {
        await prisma.newsEvent.update({ where: { id: ev.id }, data: { composeState: 'FAILED', status: 'UNLISTED' } })
        res.skipped++
        continue
      }

      const r = await llmJson({
        stage: 'compose',
        system: COMPOSE_SYSTEM,
        user: `以下是同一件事的 ${mat.materials.length} 份材料：\n\n${mat.text}`,
        schema: composeSchema,
        write: true,
        maxTokens: 900,
        temperature: 0.3,
      })

      const headline = clip(r.data.headline, 40)
      const summary = clip(r.data.summary, 400)
      const whyItMatters = clip(toStr(r.data.whyItMatters), 60)
      const aiScore = Math.round(toNum(r.data.aiScore, 60, 0, 100))
      const facts = (r.data.facts ?? [])
        .filter((f) => f.sourceIndex >= 0 && f.sourceIndex < mat.materials.length && f.text.trim())
        .slice(0, 5)
        .map((f) => ({ text: clip(f.text, 120), sourceIndex: f.sourceIndex }))

      // 幻觉与抄袭双向防线（SKILL §7）：命中仍然发布，但不进首页与重点榜
      const overlap = overlapRatio(summary, mat.text)
      const unsupported = unsupportedNumbers(summary, mat.text)
      const review = needsReview({
        confidence: mat.minConfidence,
        overlap,
        unsupported,
        sourceCount: ev.sourceCount,
        maxTier: mat.tiers.length ? Math.max(...mat.tiers) : 3,
      })
      const run = sharedRun(summary, mat.text, 20)
      const flag = review.flag || !!run
      const note = review.reason || (run ? `与原文连续 20 字重合：「${clip(run, 24)}」` : null)

      const tags = pickTags(`${headline} ${summary}`, facts.map((f) => f.text))
      // DRAFT 首发时用最终标题重算 slug；已发布事件的 slug 是外链地址，绝不改
      const slug = ev.publishedAt ? ev.slug : await uniqueSlug(eventSlug(headline, ev.happenedAt))

      await prisma.newsEvent.update({
        where: { id: ev.id },
        data: {
          slug,
          headline,
          summary,
          whyItMatters: whyItMatters || null,
          facts: facts.length ? JSON.stringify(facts) : null,
          tags: tags || null,
          aiScore,
          status: 'PUBLISHED',
          publishedAt: ev.publishedAt ?? new Date(),
          composeState: 'DONE',
          needsReview: flag,
          reviewNote: flag ? clip(note || '需人工复核', 300) : null,
          ...(rewrite ? { rewriteCount: { increment: 1 } } : {}),
        },
      })

      if (flag) res.flagged++
      if (rewrite) res.rewritten++
      else res.composed++
    } catch (e) {
      res.error = errMsg(e)
      // LLM 不可用时的降级：用信源自带摘要先发出来，并显式标注「未经 AI 摘要」（SKILL §8）
      const degraded = await degradePublish(ev)
      if (degraded) res.degraded++
      if (isFatalLlmError(e)) break
    }
    await yieldTick()
  }

  console.log('[news/compose]', JSON.stringify(res))
  return res
}

/**
 * 降级发布：LLM 连续不可用时，直接引用 feed 自带的 description（本就是站点主动发布供订阅的摘要），
 * 前缀显式标注「未经 AI 摘要」。composeState 仍留在 RAW，等模型恢复后会被真正的摘要覆盖。
 */
async function degradePublish(ev: { id: number; status: string; happenedAt: Date; publishedAt: Date | null }): Promise<boolean> {
  if (ev.status === 'PUBLISHED' || ev.publishedAt) return false
  if (Date.now() - ev.happenedAt.getTime() < COMPOSE_DEGRADE_AFTER_MS) return false
  const mat = await eventMaterials(ev.id)
  const first = mat.materials[0]
  if (!first || !first.desc) return false
  await prisma.newsEvent.update({
    where: { id: ev.id },
    data: {
      summary: clip(`未经 AI 摘要 · 以下摘自${first.sourceName}：${first.desc}`, 240),
      status: 'PUBLISHED',
      publishedAt: new Date(),
      needsReview: true,
      reviewNote: '未经 AI 摘要（模型不可用），已直接引用信源摘要，待模型恢复后自动重写',
    },
  })
  return true
}

// ============ ⑤ rank：重算热度分 ============

const RANK_WINDOW_DAYS = 7
const RANK_MAX_EVENTS = 1000

export interface RankResult {
  scanned: number
  updated: number
}

export async function rank(): Promise<RankResult> {
  const since = new Date(Date.now() - RANK_WINDOW_DAYS * DAY_MS)
  const events = await prisma.newsEvent.findMany({
    where: { happenedAt: { gte: since } },
    orderBy: { happenedAt: 'desc' },
    take: RANK_MAX_EVENTS,
    select: {
      id: true,
      score: true,
      sourceCount: true,
      tier1Count: true,
      hnPoints: true,
      viewCount: true,
      shareCount: true,
      likeCount: true,
      aiScore: true,
      happenedAt: true,
    },
  })
  if (!events.length) return { scanned: 0, updated: 0 }

  // 站内浏览以 news_views 的去重行数为准（唯一约束 [eventId, viewerKey, hourBucket] 已做小时桶去重）。
  // 取 max(已存, 去重行数)：前台上报若已经自增过 viewCount，这里不会把它抹掉；
  // 若前台只写了 news_views 没自增，这里会把计数补上。两种实现都不会算错。
  const ids = events.map((e) => e.id)
  const grouped = await prisma.newsView.groupBy({ by: ['eventId'], where: { eventId: { in: ids } }, _count: { _all: true } })
  const viewMap = new Map<number, number>(grouped.map((g) => [g.eventId, g._count._all]))

  const now = new Date()
  let updated = 0
  const CHUNK = 20
  for (let i = 0; i < events.length; i += CHUNK) {
    const chunk = events.slice(i, i + CHUNK)
    await Promise.all(
      chunk.map(async (e) => {
        const viewCount = Math.max(e.viewCount, viewMap.get(e.id) ?? 0)
        const bd = computeScore({
          sourceCount: e.sourceCount,
          tier1Count: e.tier1Count,
          hnPoints: e.hnPoints,
          viewCount,
          shareCount: e.shareCount,
          likeCount: e.likeCount,
          aiScore: e.aiScore,
          happenedAt: e.happenedAt,
          now,
        })
        // 分数没变就不写，rank 每 15 分钟跑一次，无谓写入会白白产生 binlog 与磁盘压力
        if (Math.abs(Number(e.score) - bd.score) < 0.0005 && viewCount === e.viewCount) return
        await prisma.newsEvent.update({
          where: { id: e.id },
          data: {
            score: bd.score,
            viewCount,
            scoreDebug: JSON.stringify({ at: now.toISOString(), ...bd }),
          },
        })
        updated++
      })
    )
    await yieldTick()
  }

  console.log('[news/rank]', JSON.stringify({ scanned: events.length, updated }))
  return { scanned: events.length, updated }
}

// ============ ⑥ digest：日报 / 周报 ============

const DIGEST_LIMIT = { DAILY: 10, WEEKLY: 15 }

const digestSchema = z.object({ intro: z.string() })

export interface DigestResult {
  type: 'DAILY' | 'WEEKLY'
  periodStart: string
  periodEnd: string
  count: number
  id?: number
  skipped?: string
}

export async function buildDigest(type: 'DAILY' | 'WEEKLY'): Promise<DigestResult> {
  const now = new Date()
  const today = dayKey(now)

  let startDay = today
  let endDay = today
  if (type === 'WEEKLY') {
    // 周一 09:00 生成上一周（上周一 ~ 上周日）。星期几也用 +8 偏移算，不依赖进程 TZ。
    const shifted = new Date(now.getTime() + TZ_OFFSET_MIN * 60000)
    const daysSinceMonday = (shifted.getUTCDay() + 6) % 7
    const mondayMs = Date.parse(`${today}T00:00:00.000Z`) - daysSinceMonday * DAY_MS
    startDay = new Date(mondayMs - 7 * DAY_MS).toISOString().slice(0, 10)
    endDay = new Date(mondayMs - DAY_MS).toISOString().slice(0, 10)
  }

  const events = await prisma.newsEvent.findMany({
    where: {
      status: 'PUBLISHED',
      needsReview: false,
      happenedAt: { gte: dayStartUtc(startDay), lte: dayEndUtc(endDay) },
    },
    orderBy: [{ pinned: 'desc' }, { score: 'desc' }],
    take: DIGEST_LIMIT[type],
    select: { id: true, headline: true, whyItMatters: true },
  })

  if (!events.length) {
    return { type, periodStart: startDay, periodEnd: endDay, count: 0, skipped: '区间内没有可入选的事件' }
  }

  const title =
    type === 'DAILY'
      ? `AI圈大事记 · ${startDay.slice(5).replace('-', '月')}日速览`
      : `AI圈大事记 · ${startDay.slice(5)} 至 ${endDay.slice(5)} 周报`

  // 导语：预算允许就让模型写一句，失败或超预算就用确定性文案兜底，绝不因此让日报生不出来
  let intro = `本期收录 ${events.length} 条 AI 行业动态，按跨源报道数与站内热度排序。以下内容由 AI 自动聚合公开信源生成。`
  if (!(await budgetExhausted())) {
    try {
      const r = await llmJson({
        stage: 'digest',
        system: [
          '你为一份 AI 行业资讯榜单写导语。只依据给出的标题概括，不得添加标题里没有的信息。',
          '不超过 80 个字，一段话，客观陈述本期都发生了什么，不抒情、不做标题党、不下判断。',
          '不得使用「据悉」「业内人士称」等无主语转述。输出 json：{"intro":"……"}。',
        ].join('\n'),
        user: events.map((e, i) => `${i + 1}. ${clip(e.headline, 60)}`).join('\n'),
        schema: digestSchema,
        maxTokens: 300,
        temperature: 0.3,
      })
      const t = clip(r.data.intro, 120)
      if (t.length >= 10) intro = t
    } catch {
      /* 导语是锦上添花，失败就用兜底文案 */
    }
  }

  const eventIds = JSON.stringify(events.map((e) => e.id))
  const saved = await prisma.newsDigest.upsert({
    where: { type_periodStart: { type, periodStart: dateOnly(startDay) } },
    create: {
      type,
      periodStart: dateOnly(startDay),
      periodEnd: dateOnly(endDay),
      title,
      intro,
      eventIds,
      status: 'PUBLISHED',
    },
    update: { periodEnd: dateOnly(endDay), title, intro, eventIds, status: 'PUBLISHED' },
    select: { id: true },
  })

  console.log('[news/digest]', JSON.stringify({ type, startDay, endDay, count: events.length }))
  return { type, periodStart: startDay, periodEnd: endDay, count: events.length, id: saved.id }
}

// ============ 信源初始化 ============

export interface SeedResult {
  total: number
  created: number
  updated: number
}

/**
 * 把 SEED_SOURCES upsert 进 NewsSource，按 key 幂等。
 * 更新时只覆盖「描述性」字段：enabled / failCount / lastError 是运行态，
 * 管理员在后台停用过的源不能被一次重跑又打开。
 */
export async function seedSources(): Promise<SeedResult> {
  let created = 0
  let updated = 0
  for (const s of SEED_SOURCES) {
    const common = {
      name: s.name,
      homepage: s.homepage ?? null,
      feedUrl: s.feedUrl,
      kind: s.kind ?? 'RSS',
      lang: s.lang ?? 'zh',
      tier: s.tier,
      role: s.role ?? 'feed',
      weight: s.weight ?? 1,
      viaRelay: s.viaRelay ?? false,
    }
    const exists = await prisma.newsSource.findUnique({ where: { key: s.key }, select: { id: true } })
    if (exists) {
      await prisma.newsSource.update({ where: { key: s.key }, data: common })
      updated++
    } else {
      await prisma.newsSource.create({ data: { key: s.key, ...common, enabled: s.enabled ?? true } })
      created++
    }
  }
  return { total: SEED_SOURCES.length, created, updated }
}
