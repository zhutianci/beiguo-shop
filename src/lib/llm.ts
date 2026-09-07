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
  /**
   * 每百万 token 价格（**分**），用于记账。
   *
   * 【这两个数必须到控制台核对，不能沿用默认值】它们不影响调用本身，只影响记账，
   * 而记账是 budgetExhausted() 这道最后兜底的唯一依据 —— 单价填小 50 倍，
   * 预算闸门就形同虚设，真实花费会一路跑到供应商欠费为止。
   * 下面的默认值是写代码时的估算，**不是核对过的报价**。
   * 生产环境请在 .env.production 里显式设 LLM_IN_PRICE / LLM_OUT_PRICE。
   * 供应商还会改价、也会把 `glm-4-plus` 这类别名重指到新版本（SKILL.md §5.4），
   * 所以这是个需要定期回看的数字，不是一次性配置。
   */
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
  // thinking 一并暴露：它对成本的影响比换模型还大（实测 glm-4.7 开/关差 5.3 倍输出 token），
  // 后台状态页看不到它就等于看不到真实成本结构
  return c
    ? {
        provider: name, fastModel: c.fastModel, writeModel: c.writeModel,
        configured: !!c.apiKey, baseUrl: c.baseUrl, thinking: thinkingMode(),
      }
    : { provider: name, fastModel: '-', writeModel: '-', configured: false, baseUrl: '-', thinking: thinkingMode() }
}

// ---- 预算闸门 ----

/**
 * 当日已花费（毫分）。超预算时管线降级为「只去重、不写摘要」，而不是继续烧钱。
 *
 * 【日界用固定 +8 算术，不依赖进程 TZ】原来这里是 `new Date(y, m, d)`，
 * 它取的是**进程本地时区**的零点。容器虽然设了 TZ=Asia/Shanghai，但 alpine 镜像
 * 不装 tzdata 时 TZ 会被静默忽略、进程仍跑 UTC（交接文档第六节踩过）——
 * 那样日界会偏 8 小时，预算在每天 08:00 才归零，凌晨那几小时算在前一天头上。
 * 与 news/format.ts、analytics 的口径统一成显式偏移算术，换机器不漂移。
 */
export async function spentTodayMilli(): Promise<number> {
  const now = new Date()
  const TZ_OFFSET_MS = 8 * 3600000
  const dayKey = new Date(now.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10)
  const start = new Date(Date.parse(`${dayKey}T00:00:00.000Z`) - TZ_OFFSET_MS)
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

/**
 * 思考（推理链）控制。
 *
 * 【为什么必须显式控制，不能靠默认值】2026-09-07 从生产 ECS 实测智谱各模型：
 *
 *   glm-4.7        默认开思考 → 单次输出 2534 token（其中 3626 字推理链）；
 *                  关掉之后 476 token，质量反而更好。差 5.3 倍，全是白花的钱。
 *   glm-5.3 系列   **强制思考，关不掉**。不带控制参数直接把 max_tokens 烧穿，
 *                  返回被截断的 JSON → 走三级降级 → 三次全废。等于管线瘫痪。
 *   glm-4-plus     不支持这些参数，多传会 400。
 *
 * 两种模型两套参数名，这是实测出来的，不是文档抄的：
 *   关思考   → thinking: { type: 'disabled' }
 *   调档位   → reasoning_effort: 'low' | 'high' | 'max'
 *             （给强制思考的模型传 thinking:{type:'low'} 会被 400 拒绝，
 *               错误码 1210「该模型始终思考，不支持关闭思考；请使用 low、high 或 max」）
 *
 * 配置：LLM_THINKING = disabled | low | high | max | off
 *   off / 留空 = 一个字段都不传（老模型如 glm-4-plus / glm-4-flash 用这个）
 */
type ThinkingMode = 'disabled' | 'low' | 'high' | 'max' | 'off'

function thinkingMode(): ThinkingMode {
  const v = (process.env.LLM_THINKING || '').trim().toLowerCase()
  return v === 'disabled' || v === 'low' || v === 'high' || v === 'max' ? v : 'off'
}

/** 把档位翻译成请求字段。两种模型两套参数名，见上方注释 */
function thinkingPayload(mode: ThinkingMode): Record<string, unknown> {
  if (mode === 'off') return {}
  if (mode === 'disabled') return { thinking: { type: 'disabled' } }
  return { reasoning_effort: mode }
}

/**
 * 该错误是不是「这个模型关不掉思考」。
 * 命中后调用方会自动改用最低档重试一次 —— 换模型时不至于因为一个参数名把整段打挂。
 */
function isAlwaysThinkingError(body: string): boolean {
  return body.includes('1210') || body.includes('始终思考')
}

async function callOnce(
  c: ProviderConf,
  model: string,
  system: string,
  user: string,
  responseFormat: Record<string, unknown> | undefined,
  maxTokens: number,
  temperature: number,
  timeoutMs: number,
  thinking: ThinkingMode
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
        ...thinkingPayload(thinking),
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
  // 【累加，不是覆盖】下面是三级降级循环，每一级都是一次真实的、供应商会计费的调用。
  // 原来这里写的是 `promptTokens = r.promptTokens`，后一次直接覆盖前一次，
  // 结果「试了三次才成功」在账上只留下最后一次的用量 —— 预算闸门看到的是被低估的数字。
  let promptTokens = 0
  let completionTokens = 0
  let lastErr = ''

  const cost = (pt: number, ct: number) =>
    Math.round((pt / 1_000_000) * c.inPricePerM * 1000 + (ct / 1_000_000) * c.outPricePerM * 1000)

  // 三级降级
  const attempts: (Record<string, unknown> | undefined)[] = [
    opts.jsonSchema
      ? { type: 'json_schema', json_schema: { name: 'result', strict: true, schema: opts.jsonSchema } }
      : { type: 'json_object' },
    { type: 'json_object' },
    undefined,
  ]

  // 思考档位。遇到「该模型始终思考」的 400 会就地降到最低档重试，不算掉一次降级机会
  let thinking = thinkingMode()

  for (const rf of attempts) {
    try {
      let r = await callOnce(c, model, system, opts.user, rf, maxTokens, temperature, timeoutMs, thinking)
      promptTokens += r.promptTokens
      completionTokens += r.completionTokens

      // 思考参数与模型不匹配时就地纠正，**不占用三级降级的机会**。
      // 否则换一次模型就会把三次降级全耗在同一个参数问题上，白花三次钱还是失败。
      //
      // 两种不匹配都见过：
      //   ① glm-5.3 系列关不掉思考（错误码 1210）→ 改用最低档
      //   ② 老模型（glm-4-plus / glm-4-flash）压根不认这些字段 → 干脆不传
      // 纠正后的档位保留到本次调用的后续降级里，不必每一级都撞一次墙。
      if (r.status === 400 && thinking !== 'off') {
        const next: ThinkingMode = isAlwaysThinkingError(r.text) ? 'low' : 'off'
        if (next !== thinking) {
          console.warn(
            `[llm] ${model} 不接受当前思考档位（${thinking}），本次起改用 ${next}。原始返回：${r.text.slice(0, 120)}`
          )
          thinking = next
          r = await callOnce(c, model, system, opts.user, rf, maxTokens, temperature, timeoutMs, thinking)
          promptTokens += r.promptTokens
          completionTokens += r.completionTokens
        }
      }

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
        // 把出错路径和原始返回一起记下来。只写「结构校验失败: Required」等于没说，
        // 排查时既不知道是哪个字段、也不知道模型到底吐了什么——换供应商/换模型时这是最常踩的坑。
        const e = parsed.error.errors[0]
        const path = e?.path?.length ? e.path.join('.') : '(根)'
        lastErr = `结构校验失败 字段=${path} 原因=${e?.message} 原始返回=${jsonText.slice(0, 400)}`
        continue
      }

      const ms = Date.now() - started
      const costMilli = cost(promptTokens, completionTokens)
      await record(opts.stage, c, model, promptTokens, completionTokens, costMilli, ms, true, null)
      return { data: parsed.data, promptTokens, completionTokens, costMilli, ms }
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e)
      if (lastErr.includes('abort')) break // 超时就别再试了
    }
  }

  // 记账列只有 300 字，原始返回会被截掉；完整内容打到应用日志，docker compose logs app 可查
  console.error(`[llm] ${opts.stage} 调用失败 model=${model} :: ${lastErr}`)
  // 【失败也要按真实用量记费】原来这里写死 costMilli=0。可供应商是按 token 计费的，
  // 请求发出去、模型吐了字、只是我们没解析出想要的 JSON —— 这笔钱照付。
  // 记 0 的后果是：失败率一升高，真实花费涨、账面花费反而不动，
  // budgetExhausted() 这道最后的兜底就永远不会触发。
  await record(
    opts.stage, c, model, promptTokens, completionTokens,
    cost(promptTokens, completionTokens), Date.now() - started, false, lastErr
  )
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
        error: error ? error.slice(0, 300) : null, // 列宽 300；更长的原始返回在应用日志里
      },
    })
  } catch {
    /* 记账失败不能影响主流程 */
  }
}
