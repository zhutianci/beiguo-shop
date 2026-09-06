/**
 * LLM 供应商抽象层。
 *
 * 规范见 .claude/skills/ai-news-pipeline/SKILL.md §5。
 * 三家国内供应商都兼容 OpenAI Chat Completions 格式，换供应商只需改 baseURL / apiKey / model。
 * 境外 API（api.openai.com 超时、api.anthropic.com 403）在大陆 ECS 上不可用，不作为生产选项。
 *
 * 结构化输出的支持度各家不一，这里写死三级降级：
 *   json_schema → json_object（要求 prompt 里出现 "json" 字样）→ 纯文本正则提取
 * 无论走哪条路径，最终都用 zod 校验。
 */
import { z } from 'zod'
import { prisma } from './db'

export type LlmStage = 'triage' | 'cluster' | 'compose' | 'digest'

export interface LlmResult<T> {
  data: T
  promptTokens: number
  completionTokens: number
  costMilli: number
  ms: number
}

export class LlmError extends Error {
  code: string
  constructor(message: string, code = 'llm_error') {
    super(message)
    this.name = 'LlmError'
    this.code = code
  }
}

// ---- 供应商配置 ----

interface ProviderConf {
  baseUrl: string
  apiKey: string
  /** 判断题用的便宜模型 */
  fastModel: string
  /** 写作题用的模型 */
  writeModel: string
  /** 每百万 token 价格（分），用于记账。上线前请到控制台核对。 */
  inPricePerM: number
  outPricePerM: number
}

const PROVIDERS: Record<string, ProviderConf> = {
  dashscope: {
    baseUrl: process.env.LLM_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.LLM_API_KEY || '',
    fastModel: process.env.LLM_FAST_MODEL || 'qwen-flash',
    writeModel: process.env.LLM_WRITE_MODEL || 'qwen-plus',
    inPricePerM: Number(process.env.LLM_IN_PRICE || 15),
    outPricePerM: Number(process.env.LLM_OUT_PRICE || 150),
  },
  deepseek: {
    baseUrl: process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1',
    apiKey: process.env.LLM_API_KEY || '',
    fastModel: process.env.LLM_FAST_MODEL || 'deepseek-chat',
    writeModel: process.env.LLM_WRITE_MODEL || 'deepseek-chat',
    inPricePerM: Number(process.env.LLM_IN_PRICE || 50),
    outPricePerM: Number(process.env.LLM_OUT_PRICE || 800),
  },
  glm: {
    baseUrl: process.env.LLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.LLM_API_KEY || '',
    fastModel: process.env.LLM_FAST_MODEL || 'glm-4-flash',
    writeModel: process.env.LLM_WRITE_MODEL || 'glm-4-plus',
    inPricePerM: Number(process.env.LLM_IN_PRICE || 10),
    outPricePerM: Number(process.env.LLM_OUT_PRICE || 100),
  },
}

export function llmProviderName(): string {
  return (process.env.LLM_PROVIDER || 'dashscope').toLowerCase()
}

function conf(): ProviderConf {
  const name = llmProviderName()
  const c = PROVIDERS[name]
  if (!c) throw new LlmError(`未知的 LLM_PROVIDER: ${name}（可选 dashscope | deepseek | glm）`, 'bad_provider')
  return c
}

export function llmConfigured(): boolean {
  try {
    return !!conf().apiKey
  } catch {
    return false
  }
}

/** 后台展示用：当前实际生效的供应商与模型（别名会被供应商重指，所以要显式暴露） */
export function llmInfo() {
  const name = llmProviderName()
  const c = PROVIDERS[name]
  return c
    ? { provider: name, fastModel: c.fastModel, writeModel: c.writeModel, configured: !!c.apiKey, baseUrl: c.baseUrl }
    : { provider: name, fastModel: '-', writeModel: '-', configured: false, baseUrl: '-' }
}

// ---- 预算闸门 ----

/** 当日已花费（毫分）。超预算时管线降级为「只去重、不写摘要」，而不是继续烧钱。 */
export async function spentTodayMilli(): Promise<number> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const agg = await prisma.newsLlmCall.aggregate({
    where: { createdAt: { gte: start } },
    _sum: { costMilli: true },
  })
  return Number(agg._sum.costMilli ?? 0)
}

/** 每日预算上限（毫分）。默认 300 分 = 3 元/天。 */
export function dailyBudgetMilli(): number {
  return Number(process.env.NEWS_DAILY_BUDGET_CENTS || 300) * 1000
}

export async function budgetExhausted(): Promise<boolean> {
  return (await spentTodayMilli()) >= dailyBudgetMilli()
}

// ---- 核心调用 ----

/** 从可能带 markdown 围栏或前后缀的文本里抠出第一个完整 JSON 对象 */
function extractJson(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fenced ? fenced[1] : text
  const start = body.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < body.length; i++) {
    const ch = body[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') inStr = true
    else if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return body.slice(start, i + 1)
    }
  }
  return null
}

interface ChatOpts<T> {
  stage: LlmStage
  system: string
  user: string
  schema: z.ZodType<T>
  /** JSON Schema，供应商支持结构化输出时使用 */
  jsonSchema?: Record<string, unknown>
  /** 用写作模型（默认用便宜的判断模型） */
  write?: boolean
  maxTokens?: number
  temperature?: number
  timeoutMs?: number
}

async function callOnce(
  c: ProviderConf,
  model: string,
  system: string,
  user: string,
  responseFormat: Record<string, unknown> | undefined,
  maxTokens: number,
  temperature: number,
  timeoutMs: number
): Promise<{ text: string; promptTokens: number; completionTokens: number; status: number }> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(`${c.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${c.apiKey}`,
      },
      body: JSON.stringify({
        model,
        // system prompt 逐字固定放最前：多数供应商有隐式上下文缓存，命中部分按输入价约 20% 计费
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature,
        max_tokens: maxTokens,
        ...(responseFormat ? { response_format: responseFormat } : {}),
      }),
      signal: ac.signal,
    })

    const raw = await res.text()
    if (!res.ok) {
      return { text: raw, promptTokens: 0, completionTokens: 0, status: res.status }
    }
    const j = JSON.parse(raw)
    return {
      text: j.choices?.[0]?.message?.content ?? '',
      promptTokens: j.usage?.prompt_tokens ?? 0,
      completionTokens: j.usage?.completion_tokens ?? 0,
      status: 200,
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 调用 LLM 并返回经 zod 校验的结构化结果。
 * 失败会记账到 news_llm_calls 后抛 LlmError，调用方负责决定重试还是降级。
 */
export async function llmJson<T>(opts: ChatOpts<T>): Promise<LlmResult<T>> {
  const c = conf()
  if (!c.apiKey) throw new LlmError('LLM_API_KEY 未配置', 'not_configured')
  if (await budgetExhausted()) throw new LlmError('当日 LLM 预算已用尽', 'budget_exhausted')

  const model = opts.write ? c.writeModel : c.fastModel
  const maxTokens = opts.maxTokens ?? (opts.write ? 900 : 400)
  const temperature = opts.temperature ?? (opts.write ? 0.3 : 0)
  const timeoutMs = opts.timeoutMs ?? 60_000
  // json_object 模式要求 messages 里出现 "json" 字样，否则服务端直接 400
  const system = `${opts.system}\n\n只输出一个 JSON 对象，不要任何解释文字或 markdown 围栏。`

  const started = Date.now()
  let promptTokens = 0
  let completionTokens = 0
  let lastErr = ''

  // 三级降级
  const attempts: (Record<string, unknown> | undefined)[] = [
    opts.jsonSchema
      ? { type: 'json_schema', json_schema: { name: 'result', strict: true, schema: opts.jsonSchema } }
      : { type: 'json_object' },
    { type: 'json_object' },
    undefined,
  ]

  for (const rf of attempts) {
    try {
      const r = await callOnce(c, model, system, opts.user, rf, maxTokens, temperature, timeoutMs)
      promptTokens = r.promptTokens
      completionTokens = r.completionTokens

      if (r.status !== 200) {
        lastErr = `HTTP ${r.status}: ${r.text.slice(0, 200)}`
        // 400 多半是不支持该 response_format，降级重试；其余状态码直接放弃
        if (r.status === 400) continue
        break
      }

      const jsonText = extractJson(r.text)
      if (!jsonText) {
        lastErr = `返回中未找到 JSON: ${r.text.slice(0, 200)}`
        continue
      }
      const parsed = opts.schema.safeParse(JSON.parse(jsonText))
      if (!parsed.success) {
        lastErr = `结构校验失败: ${parsed.error.errors[0]?.message}`
        continue
      }

      const ms = Date.now() - started
      const costMilli = Math.round(
        (promptTokens / 1_000_000) * c.inPricePerM * 1000 + (completionTokens / 1_000_000) * c.outPricePerM * 1000
      )
      await record(opts.stage, c, model, promptTokens, completionTokens, costMilli, ms, true, null)
      return { data: parsed.data, promptTokens, completionTokens, costMilli, ms }
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e)
      if (lastErr.includes('abort')) break // 超时就别再试了
    }
  }

  await record(opts.stage, c, model, promptTokens, completionTokens, 0, Date.now() - started, false, lastErr)
  throw new LlmError(lastErr || '调用失败')
}

async function record(
  stage: LlmStage,
  c: ProviderConf,
  model: string,
  promptTokens: number,
  completionTokens: number,
  costMilli: number,
  ms: number,
  ok: boolean,
  error: string | null
) {
  try {
    await prisma.newsLlmCall.create({
      data: {
        stage,
        provider: llmProviderName(),
        model,
        promptTokens,
        completionTokens,
        costMilli,
        ms,
        ok,
        error: error ? error.slice(0, 300) : null,
      },
    })
  } catch {
    /* 记账失败不能影响主流程 */
  }
}
