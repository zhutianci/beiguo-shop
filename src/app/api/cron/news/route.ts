export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { budgetExhausted, dailyBudgetMilli, llmInfo } from '@/lib/llm'
import {
  collect,
  triage,
  cluster,
  compose,
  rank,
  buildDigest,
  seedSources,
  acquireStageLock,
  releaseStageLock,
  STAGE_LOCK_TTL_MS,
} from '@/lib/news/pipeline'

/**
 * 【AI圈大事记】管线入口。由 cron 容器调用，用 ?stage= 分派：
 *   ?stage=collect|triage|cluster|compose|rank|digest|seed
 *   支持逗号串联：?stage=collect,triage —— 逐段独立执行，任何一段失败都不影响其他段
 *   ?stage=digest&type=DAILY|WEEKLY
 *
 * 该路由不在 middleware 拦截范围（仅 /api/admin/*），必须自查 CRON_SECRET。
 * 防重叠：每段用 VmqLock 同款的唯一约束抢锁，本轮没抢到就直接返回，不排队。
 */

const STAGES = ['collect', 'triage', 'cluster', 'compose', 'rank', 'digest', 'seed'] as const
type Stage = (typeof STAGES)[number]

/** 需要花钱的段：预算耗尽时直接跳过，降级为「只抓取去重、不写摘要」的简讯站 */
const LLM_STAGES: Stage[] = ['triage', 'cluster', 'compose']

interface StageOutcome {
  stage: Stage
  ok: boolean
  ms: number
  skipped?: string
  error?: string
  data?: unknown
}

async function runStage(stage: Stage, digestType: 'DAILY' | 'WEEKLY', budgetOut: boolean): Promise<StageOutcome> {
  const started = Date.now()

  if (budgetOut && LLM_STAGES.includes(stage)) {
    return {
      stage,
      ok: true,
      ms: 0,
      skipped: `当日 LLM 预算（${dailyBudgetMilli() / 1000} 分）已用尽，本段跳过，抓取与去重不受影响`,
    }
  }

  const ttl = STAGE_LOCK_TTL_MS[stage] ?? 10 * 60000
  const token = await acquireStageLock(stage, ttl)
  if (!token) return { stage, ok: true, ms: Date.now() - started, skipped: '上一轮仍在执行，本轮跳过' }

  try {
    let data: unknown
    switch (stage) {
      case 'collect':
        data = await collect()
        break
      case 'triage':
        data = await triage()
        break
      case 'cluster':
        data = await cluster()
        break
      case 'compose':
        data = await compose()
        break
      case 'rank':
        data = await rank()
        break
      case 'digest':
        data = await buildDigest(digestType)
        break
      case 'seed':
        data = await seedSources()
        break
    }
    return { stage, ok: true, ms: Date.now() - started, data }
  } catch (e) {
    console.error(`[cron/news] ${stage} 执行失败:`, e)
    return { stage, ok: false, ms: Date.now() - started, error: e instanceof Error ? e.message : String(e) }
  } finally {
    await releaseStageLock(stage, token)
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)

    const secret = process.env.CRON_SECRET
    if (secret) {
      const auth = request.headers.get('authorization')
      const qs = url.searchParams.get('secret')
      if (auth !== `Bearer ${secret}` && qs !== secret) return error('无权限', 401)
    }

    const raw = (url.searchParams.get('stage') || '').trim()
    if (!raw) return error(`缺少 stage 参数（可选 ${STAGES.join(' | ')}，支持逗号串联）`, 400)

    const stages: Stage[] = []
    for (const part of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
      if (!STAGES.includes(part as Stage)) return error(`未知的 stage: ${part}`, 400)
      if (!stages.includes(part as Stage)) stages.push(part as Stage)
    }

    const typeParam = (url.searchParams.get('type') || 'DAILY').toUpperCase()
    if (typeParam !== 'DAILY' && typeParam !== 'WEEKLY') return error('type 只能是 DAILY 或 WEEKLY', 400)

    // 预算只查一次，避免每段都打一次聚合查询
    const budgetOut = stages.some((s) => LLM_STAGES.includes(s)) ? await budgetExhausted() : false

    const results: StageOutcome[] = []
    for (const stage of stages) {
      // 逐段独立：上一段抛错不会中断后面的段
      results.push(await runStage(stage, typeParam, budgetOut))
    }

    return success({
      stages: results,
      llm: llmInfo(),
      budgetExhausted: budgetOut,
    })
  } catch (err) {
    console.error('[cron/news] 入口异常:', err)
    return error('新闻管线执行失败', 500)
  }
}
