export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { dailyBudgetMilli, llmInfo, spentTodayMilli } from '@/lib/llm'
import { relayConfigured } from '@/lib/news/sources'

/**
 * 管线状态与成本（SKILL.md §9）。
 *
 * 三件必须显式暴露的事：
 *   1. 各段最近一次跑成没跑成（存 Setting，key 前缀 news_；Setting.key 是 VarChar(50)）
 *   2. 今日 LLM 花费与预算余量——超预算会自动降级成「只去重不写摘要」，不看这里不知道为什么没摘要
 *   3. 当前实际生效的供应商与模型——qwen-flash / deepseek-chat 都是别名，
 *      供应商可以把它重新指向新版本并静默涨价（§5.4），所以不能只显示配置里写了什么
 */

// 业务时区固定东八区，用固定偏移的 UTC 算术，不依赖进程 TZ
// （范式同 api/admin/analytics/cardkeys/route.ts）
const TZ_OFFSET_MIN = 8 * 60
const DAY_MS = 86400000

function dayStartUtc(day: string): Date {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) - TZ_OFFSET_MIN * 60000)
}
function dayKey(d: Date): string {
  return new Date(d.getTime() + TZ_OFFSET_MIN * 60000).toISOString().slice(0, 10)
}

// 管线五段 + 日报。每段都是独立 cron，任何一段失败不影响其他段。
// 注意：route.ts 只允许导出 Next 认识的字段，这里不能加 export，否则 next build 类型校验会报错。
const STAGES = [
  { key: 'collect', label: '① 抓取 collect', desc: '拉 feed → 原始条目入库，零 LLM' },
  { key: 'triage', label: '② 分诊 triage', desc: '是否 AI 相关 / 是否命中黑名单 / 归类' },
  { key: 'cluster', label: '③ 聚类 cluster', desc: '实体指纹召回 + 小模型判定是否同一事件' },
  { key: 'compose', label: '④ 摘要 compose', desc: '为够格的事件写摘要与推荐理由' },
  { key: 'rank', label: '⑤ 排序 rank', desc: '重算热度分' },
  { key: 'digest', label: '日报 / 周报 digest', desc: '每日 21:00 生成日报，每周一 09:00 生成周报' },
  { key: 'seed', label: '导入种子信源 seed', desc: '把 SEED_SOURCES 按 key 幂等 upsert 进信源表' },
] as const

type StageKey = (typeof STAGES)[number]['key']

/** 运行状态写进 Setting 的键名。Setting.key 是 VarChar(50)，最长的 news_run_collect 才 16 字符。 */
function runKey(stage: string): string {
  return `news_run_${stage}`
}

/**
 * 各段把「最近一次运行」写进 Setting。这里对 key 与 value 的形状都做兼容解析——
 * 后台是只读展示，宁可显示原始值，也不能因为管线换了个字段名就白屏。
 */
function runKeyCandidates(stage: string): string[] {
  return [runKey(stage), `news_${stage}_run`, `news_last_${stage}`, `news_${stage}`]
}

interface RunStatus {
  stage: string
  key: string | null
  at: string | null
  ok: boolean | null
  message: string | null
  detail: Record<string, unknown> | null
  raw: string | null
  /** setting = 有人写了运行记录；inferred = Setting 里没有，只能从库里的数据痕迹倒推 */
  source: 'setting' | 'inferred' | 'none'
}

function parseRun(stage: string, key: string | null, raw: string | null): RunStatus {
  const base: RunStatus = { stage, key, at: null, ok: null, message: null, detail: null, raw, source: key ? 'setting' : 'none' }
  if (!raw) return base

  let v: unknown
  try {
    v = JSON.parse(raw)
  } catch {
    // 不是 JSON：可能直接存了一个 ISO 时间串
    const t = Date.parse(raw)
    return { ...base, at: isNaN(t) ? null : new Date(t).toISOString(), message: isNaN(t) ? raw.slice(0, 300) : null }
  }
  if (!v || typeof v !== 'object') return { ...base, message: String(v).slice(0, 300) }

  const o = v as Record<string, unknown>
  const pick = (...keys: string[]) => {
    for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k]
    return undefined
  }
  const atRaw = pick('at', 'ranAt', 'finishedAt', 'endedAt', 'time', 'ts', 'updatedAt')
  let at: string | null = null
  if (typeof atRaw === 'string' || typeof atRaw === 'number') {
    const t = Date.parse(String(atRaw))
    at = isNaN(t) ? null : new Date(t).toISOString()
  }
  const okRaw = pick('ok', 'success')
  const errRaw = pick('error', 'err')
  const msgRaw = pick('message', 'msg', 'note', 'summary')

  return {
    ...base,
    at,
    ok: typeof okRaw === 'boolean' ? okRaw : errRaw ? false : null,
    message: [msgRaw, errRaw].filter(Boolean).map(String).join(' / ').slice(0, 300) || null,
    detail: o,
  }
}

// ---------- GET 状态与成本 ----------

export async function GET() {
  try {
    const now = new Date()
    const todayStart = dayStartUtc(dayKey(now))
    const weekStart = new Date(todayStart.getTime() - 6 * DAY_MS)

    const [settings, byStageRows, failures, todayAgg, weekAgg, counts, srcAgg] = await Promise.all([
      // 所有 news_ 开头的配置项，原样返回一份，管线新写的键也能在后台看到
      prisma.setting.findMany({ where: { key: { startsWith: 'news_' } }, orderBy: { key: 'asc' } }),
      prisma.newsLlmCall.groupBy({
        by: ['stage', 'ok'],
        where: { createdAt: { gte: todayStart } },
        _count: { _all: true },
        _sum: { costMilli: true, promptTokens: true, completionTokens: true },
        _avg: { ms: true },
      }),
      prisma.newsLlmCall.findMany({
        where: { ok: false },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, stage: true, provider: true, model: true, ms: true, error: true, createdAt: true },
      }),
      prisma.newsLlmCall.aggregate({
        where: { createdAt: { gte: todayStart } },
        _count: { _all: true },
        _sum: { costMilli: true, promptTokens: true, completionTokens: true },
      }),
      prisma.newsLlmCall.aggregate({
        where: { createdAt: { gte: weekStart } },
        _sum: { costMilli: true },
        _count: { _all: true },
      }),
      Promise.all([
        prisma.newsItem.count(),
        prisma.newsItem.count({ where: { triageState: 'RAW' } }),
        prisma.newsItem.count({ where: { blocked: true } }),
        prisma.newsItem.count({ where: { eventId: null, triageState: 'OK' } }),
        prisma.newsEvent.count(),
        prisma.newsEvent.count({ where: { composeState: 'RAW' } }),
        prisma.newsEvent.count({ where: { needsReview: true } }),
        prisma.newsEvent.count({ where: { status: 'PUBLISHED' } }),
      ]),
      prisma.newsSource.findMany({
        select: { enabled: true, failCount: true, viaRelay: true, lastOkAt: true },
      }),
    ])

    // 预算：spentTodayMilli() 是预算闸门的口径，必须用它，不能自己另算一份
    const [spent, budget] = [await spentTodayMilli(), dailyBudgetMilli()]

    // Setting 里没有运行记录时的兜底：从库里的数据痕迹倒推每段最近一次动过的时间。
    // 不如显式记录准（推断不出「跑了但什么都没产出」），但总比一片「从未运行」强。
    const [srcMax, llmMax, evMax, digestMax] = await Promise.all([
      prisma.newsSource.aggregate({ _max: { lastFetchAt: true, createdAt: true } }),
      prisma.newsLlmCall.groupBy({ by: ['stage'], _max: { createdAt: true } }),
      prisma.newsEvent.aggregate({ _max: { createdAt: true, updatedAt: true } }),
      prisma.newsDigest.aggregate({ _max: { createdAt: true } }),
    ])
    const llmMaxMap = new Map(llmMax.map((r) => [r.stage, r._max.createdAt]))
    const inferred: Record<string, { at: Date | null; how: string }> = {
      collect: { at: srcMax._max.lastFetchAt, how: '按信源最近抓取时间推断' },
      triage: { at: llmMaxMap.get('triage') ?? null, how: '按最近一次 triage LLM 调用推断' },
      cluster: { at: llmMaxMap.get('cluster') ?? null, how: '按最近一次 cluster LLM 调用推断' },
      compose: { at: llmMaxMap.get('compose') ?? null, how: '按最近一次 compose LLM 调用推断' },
      rank: { at: evMax._max.updatedAt, how: '按事件最近更新时间推断' },
      digest: { at: digestMax._max.createdAt, how: '按最近生成的日报/周报推断' },
      seed: { at: srcMax._max.createdAt, how: '按最近新增的信源推断' },
    }

    const settingMap = new Map(settings.map((s) => [s.key, s.value]))
    const runs = STAGES.map((s) => {
      const key = runKeyCandidates(s.key).find((k) => settingMap.has(k)) || null
      const parsed = parseRun(s.key, key, key ? settingMap.get(key)! : null)
      if (!parsed.at) {
        const guess = inferred[s.key]
        if (guess?.at) {
          return {
            ...parsed,
            at: guess.at.toISOString(),
            message: guess.how,
            source: 'inferred' as const,
            label: s.label,
            desc: s.desc,
          }
        }
      }
      return { ...parsed, label: s.label, desc: s.desc }
    })

    // 按 stage 汇总调用数与成功率
    const stageMap = new Map<
      string,
      { stage: string; calls: number; ok: number; failed: number; costMilli: number; tokens: number; avgMs: number }
    >()
    for (const r of byStageRows) {
      const cur =
        stageMap.get(r.stage) || { stage: r.stage, calls: 0, ok: 0, failed: 0, costMilli: 0, tokens: 0, avgMs: 0 }
      const n = r._count._all
      cur.calls += n
      if (r.ok) cur.ok += n
      else cur.failed += n
      cur.costMilli += r._sum.costMilli || 0
      cur.tokens += (r._sum.promptTokens || 0) + (r._sum.completionTokens || 0)
      // 分组平均按调用数加权还原
      cur.avgMs = cur.calls ? Math.round((cur.avgMs * (cur.calls - n) + (r._avg.ms || 0) * n) / cur.calls) : 0
      stageMap.set(r.stage, cur)
    }
    const byStage = Array.from(stageMap.values())
      .map((s) => ({ ...s, okRate: s.calls ? Math.round((s.ok / s.calls) * 1000) / 10 : 0 }))
      .sort((a, b) => b.calls - a.calls)

    const [itemsTotal, itemsRaw, itemsBlocked, itemsUnclustered, eventsTotal, eventsRaw, eventsReview, eventsPublished] =
      counts

    const relayOn = relayConfigured()
    const relaySources = srcAgg.filter((s) => s.viaRelay && s.enabled)

    return success({
      llm: {
        ...llmInfo(),
        spentMilli: spent,
        budgetMilli: budget,
        remainingMilli: Math.max(budget - spent, 0),
        usedPct: budget > 0 ? Math.round((spent / budget) * 1000) / 10 : 0,
        exhausted: spent >= budget,
        callsToday: todayAgg._count._all,
        tokensToday: (todayAgg._sum.promptTokens || 0) + (todayAgg._sum.completionTokens || 0),
        costWeekMilli: weekAgg._sum.costMilli || 0,
        callsWeek: weekAgg._count._all,
      },
      byStage,
      failures,
      runs,
      // 管线积压：RAW 一直不降说明对应那段没在跑或一直失败
      pipeline: {
        itemsTotal,
        itemsRaw,
        itemsBlocked,
        itemsUnclustered,
        eventsTotal,
        eventsRaw,
        eventsReview,
        eventsPublished,
      },
      sources: {
        total: srcAgg.length,
        enabled: srcAgg.filter((s) => s.enabled).length,
        failing: srcAgg.filter((s) => s.failCount > 0).length,
        autoDisabled: srcAgg.filter((s) => !s.enabled && s.failCount >= 3).length,
      },
      relay: {
        configured: relayOn,
        sources: relaySources.length,
        // 中继挂掉时所有一手境外源同时失联，后台必须标红（§8）
        degraded: relaySources.length > 0 && !relayOn,
      },
      settings: settings.map((s) => ({ key: s.key, value: s.value.slice(0, 500), updatedAt: s.updatedAt })),
      tz: { offsetMinutes: TZ_OFFSET_MIN, label: 'UTC+8', dayStart: todayStart },
    })
  } catch (err) {
    console.error('News runs status error:', err)
    return error('获取管线状态失败')
  }
}

// ---------- POST 手动触发某一段 ----------

const triggerSchema = z.object({
  stage: z.enum(['collect', 'triage', 'cluster', 'compose', 'rank', 'digest', 'seed']),
  /** digest 段专用：日报还是周报 */
  type: z.enum(['DAILY', 'WEEKLY']).optional(),
})

/**
 * 手动触发走的是 cron 那个入口：GET /api/cron/news?stage=xxx，鉴权用 Authorization: Bearer <CRON_SECRET>。
 *
 * 刻意不直接 import 管线函数：cron 入口里每段都用 VmqLock 同款唯一约束抢锁（§8 cron 重叠执行），
 * 绕过它直接调函数，就会出现「后台点一下」和整点任务并发跑同一段的情况。
 * 自调地址走容器内回环，不经 Cloudflare Tunnel 绕一圈。
 */
function cronUrl(stage: StageKey, type: 'DAILY' | 'WEEKLY'): string {
  const base = (process.env.NEWS_INTERNAL_BASE || `http://127.0.0.1:${process.env.PORT || 3000}`).replace(/\/$/, '')
  const qs = new URLSearchParams({ stage })
  if (stage === 'digest') qs.set('type', type)
  return `${base}/api/cron/news?${qs}`
}

// 软上限 240s：宁可这一次跑不完，也不拖成长任务（§8）
const TRIGGER_TIMEOUT_MS = 240_000

/** 把这次运行结果记进 Setting，后台「最近一次运行」就有确定值而不是靠推断 */
async function recordRun(stage: string, payload: Record<string, unknown>) {
  try {
    const value = JSON.stringify({ at: new Date().toISOString(), ...payload }).slice(0, 2000)
    await prisma.setting.upsert({
      where: { key: runKey(stage) },
      create: { key: runKey(stage), value },
      update: { value },
    })
  } catch {
    /* 记录失败不能影响触发本身 */
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = triggerSchema.safeParse(body)
    if (!parsed.success) return error('要触发的管线段不合法')
    const stage = parsed.data.stage
    const type = parsed.data.type || 'DAILY'

    const secret = process.env.CRON_SECRET
    if (!secret) return error('CRON_SECRET 未配置，无法触发管线', 500)

    const url = cronUrl(stage, type)
    const started = Date.now()
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), TRIGGER_TIMEOUT_MS)

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${secret}` },
        signal: ac.signal,
      })
      const text = (await res.text()).slice(0, 4000)
      const ms = Date.now() - started

      let payload: { success?: boolean; data?: { stages?: unknown[] }; error?: string } | null = null
      try {
        payload = JSON.parse(text)
      } catch {
        payload = null
      }

      if (!res.ok || payload?.success === false) {
        const msg = payload?.error || `HTTP ${res.status}`
        await recordRun(stage, { ok: false, manual: true, ms, error: msg })
        return error(`${stage} 触发失败：${msg}`, 502)
      }

      // cron 入口的返回形状：{ stages: [{ stage, ok, ms, skipped?, error?, data? }] }
      const outcome = (payload?.data?.stages?.[0] || null) as
        | { ok?: boolean; ms?: number; skipped?: string; error?: string; data?: Record<string, unknown> }
        | null
      const ok = outcome?.ok !== false
      await recordRun(stage, {
        ok,
        manual: true,
        ms: outcome?.ms ?? ms,
        ...(outcome?.skipped ? { message: outcome.skipped } : {}),
        ...(outcome?.error ? { error: outcome.error } : {}),
        ...(outcome?.data && typeof outcome.data === 'object' ? outcome.data : {}),
      })

      return success(
        { stage, url, status: res.status, ms, result: payload?.data ?? text },
        outcome?.skipped ? `${stage} 已跳过：${outcome.skipped}` : ok ? `${stage} 已执行（${outcome?.ms ?? ms}ms）` : `${stage} 执行失败：${outcome?.error || '未知错误'}`
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const ms = Date.now() - started
      if (msg.includes('abort')) {
        // 抢锁在 cron 那边，任务仍会跑完；这里只是不再等它
        return success(
          { stage, url, status: 0, ms, result: null },
          `已触发 ${stage}，但等待超过 ${TRIGGER_TIMEOUT_MS / 1000}s 未返回。任务仍在后台执行，稍后刷新查看运行状态。`
        )
      }
      await recordRun(stage, { ok: false, manual: true, ms, error: msg })
      return error(`触发失败：${msg}（自调地址 ${url}，可用 NEWS_INTERNAL_BASE 覆盖）`, 502)
    } finally {
      clearTimeout(timer)
    }
  } catch (err) {
    console.error('Trigger news pipeline error:', err)
    return error('触发失败')
  }
}
