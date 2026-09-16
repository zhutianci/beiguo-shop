/**
 * sysb：卡密状态只读查询（V1）。
 *
 * ================== 这个文件为什么存在 ==================
 *
 * V2 代理接口只有 4 个（/account、/products、POST /orders、GET /orders/{id}），
 * **没有验卡接口**，文档还写着「无需提前调用验卡」。于是出现两个真实的坏体验：
 *   1. 已经充完的卡，页面照样摆出充值表单，买家反复填账号、反复提交；
 *   2. 买家得自己猜这张卡走哪条通道（信用卡 / iOS / Claude）。
 * 我们原本只能靠**本站商品名**去猜通道，靠**本站记下的订单号**去判断是否充过 ——
 * 卡如果是在别处充掉的，我们就完全无从得知。
 *
 * 站长明确授权「可以使用 v1 的」。这里用的是上游自己网页上那个
 * 「卡密查询」工具所调用的三个接口 —— 它们是**只读查询**，不是验卡：
 *
 *   信用卡通道  POST /api/v1/sub/queryOrder                          { cdks: [cdk] }
 *   iOS 通道    POST /gateway/gpt?action=query                       { cdks: "cdk" }
 *   Claude 通道 POST /gateway/claude?service=claude&action=cardQuery { codes: [cdk] }
 *
 * 【为什么用「查询」而不是「验卡」】上游页面自己写着，验卡（verifyCdk /
 * gateway 的 action=verify）会**锁定当前卡密约 3 分钟**。一张卡挨个通道去验，
 * 等于拿买家花钱买的卡做探测，还会把它锁死。查询接口没有这个副作用 ——
 * 上游自己的文案就是「该卡密已使用，请点击右上角『卡密查询』查看结果」。
 *
 * ================== 三条必须守住的规则 ==================
 *
 * 【一】绝不带 V2 Token。这些是另一套（面向浏览器的）接口，
 * 把代理 Token 发过去没有任何用处，只会扩大它的暴露面。本文件不 import token()。
 *
 * 【二】查不动就当没查过。这些接口不在代理授权范围内，随时可能改版或下线。
 * 任何失败一律返回 null，让 check() 退回原来的流程 ——
 * **绝不能因为一个非正式接口挂了，就让买家充不了值。**
 *
 * 【三】不回传上游原始字段。买家侧看到的永远是我们自己的文案，
 * 账号邮箱一律打码（卡有可能已经转手，完整邮箱不该给到当前查询的人）。
 */

/** 上游产品编码，与 sysb.ts 里的 Product 一致 */
export type SysbChannel = 'chatgpt_card' | 'chatgpt_ios' | 'claude_ios'

export type SysbCardStatus =
  | 'UNUSED' // 未使用，可以充
  | 'USED_OK' // 已核销且充值成功
  | 'USED_PENDING' // 已核销，上游仍在处理
  | 'USED_FAILED' // 已核销但失败 —— 卡已消耗，只能走售后
  | 'LOCKED' // 正在处理上一笔请求
  | 'VOID' // 已换卡作废
  | 'UNCONFIRMED' // 上游认得这张卡，但状态它自己也还没核对完

export interface SysbLookupHit {
  channel: SysbChannel
  status: SysbCardStatus
  /** 已打码的充值账号，如 tan***@163.com */
  account?: string
  /** 核销时间，原样来自上游 */
  usedAt?: string
  /** 上游的套餐/产品名，用来让买家确认卡对不对 */
  planName?: string
}

/** 单个通道的超时。Claude 那条上游自己就慢，页面给了 35s，这里压到 20s */
const PER_CALL_TIMEOUT: Record<SysbChannel, number> = {
  chatgpt_card: 15_000,
  chatgpt_ios: 12_000,
  claude_ios: 20_000,
}

/**
 * 整轮查询的总预算。买家在页面上等着，不能三条通道各慢一次加起来等 47 秒。
 * 预算用完就停，返回 null 退回原流程。
 */
const TOTAL_BUDGET_MS = 26_000

const ORIGIN = 'https://hongyunai.pro'

/**
 * 信用卡通道的卡密长相。上游前端里的原版正则，用来决定**先查哪条通道**，
 * 仅仅是排序优化 —— 判断结果始终以上游的回答为准，不以这个正则为准。
 */
const CARD_PAY_SHAPE = /^(?:PLUS|20X)-[0-9A-F]{16}$|^PLUS-(?:PLUS|20X|PRO20X)-[0-9A-F]{16}$/

/** 邮箱打码：tangwei104@163.com → tan***@163.com */
export function maskAccount(raw: unknown): string | undefined {
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (!s) return undefined
  const at = s.lastIndexOf('@')
  if (at <= 0) {
    // 不是邮箱（可能是 UID / Organization ID），留头留尾
    return s.length <= 6 ? `${s.slice(0, 2)}***` : `${s.slice(0, 3)}***${s.slice(-2)}`
  }
  const local = s.slice(0, at)
  const domain = s.slice(at)
  const keep = local.length <= 3 ? 1 : 3
  return `${local.slice(0, keep)}***${domain}`
}

function firstString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return undefined
}

/**
 * 发一次只读查询。
 * **不带 Authorization**（见文件头规则一），失败一律吞掉返回 null。
 */
async function post(path: string, body: unknown, timeoutMs: number): Promise<Record<string, unknown> | null> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(`${ORIGIN}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // 这几个接口是给自家页面用的，带上来源更像正常调用
        Referer: `${ORIGIN}/`,
        Origin: ORIGIN,
      },
      body: JSON.stringify(body),
      signal: ac.signal,
      // 与 lib/news/feed.ts 同一个理由：裸 fetch 会被 Next 的磁盘数据缓存冻住。
      // 这里被冻住的后果是「这张卡未使用」被无限回放给后面每一个人
      cache: 'no-store',
    })
    if (!res.ok) return null
    const text = await res.text()
    const parsed: unknown = JSON.parse(text)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    // 超时、断网、返回 HTML —— 都当作「查不到」，绝不往上抛
    return null
  } finally {
    clearTimeout(timer)
  }
}

/*
 * 下面每条通道都拆成「发请求」与「读响应」两半。
 * 读响应那一半是纯函数，scripts/check-redeem.ts 用**线上真实抓到的报文**
 * 直接喂给它做断言 —— 状态映射错一个字，买家就会对着一张废卡反复重试。
 */

/** 信用卡通道：读 POST /api/v1/sub/queryOrder 的响应 */
export function parseCard(d: Record<string, unknown> | null, cdk: string): SysbLookupHit | null {
  if (!d || Number(d.code) !== 200) return null

  const results = Array.isArray(d.results) ? (d.results as Record<string, unknown>[]) : []
  const item = results.find((r) => String(r?.cdk || '').trim().toUpperCase() === cdk.toUpperCase())
  // 上游偶尔会把单卡结果平铺在顶层（它自己的页面也做了这个兜底）
  const row = item || (d.order ? d : null)
  if (!row) return null

  const cdkStatus = String(row.cdk_status || '').trim().toLowerCase()
  if (!cdkStatus) return null // 没有状态 = 这条通道不认识这张卡

  const planName = firstString(row.product_name)
  if (['unused', 'available'].includes(cdkStatus)) {
    return { channel: 'chatgpt_card', status: 'UNUSED', planName }
  }
  if (['locked', 'reserved'].includes(cdkStatus)) {
    return { channel: 'chatgpt_card', status: 'LOCKED', planName }
  }
  if (['activated', 'redeemed', 'used'].includes(cdkStatus)) {
    const order = (row.order && typeof row.order === 'object' ? row.order : {}) as Record<string, unknown>
    const orderStatus = String(order.status || '').trim().toLowerCase()
    /*
     * 【已核销 + 订单失败，仍然不出表单】卡确实被消耗掉了（cdk_status 还是
     * activated），上游也没把它放回未使用。这时候让买家再填一遍账号，
     * 只会换来一次「卡密已使用」的失败 —— 该走的是售后。
     */
    const status: SysbCardStatus = ['success', 'completed', 'complete'].includes(orderStatus)
      ? 'USED_OK'
      : ['processing', 'pending', 'created', 'running', 'retrying'].includes(orderStatus)
        ? 'USED_PENDING'
        : ['failed', 'failure', 'error', 'cancelled', 'canceled'].includes(orderStatus)
          ? 'USED_FAILED'
          : 'USED_PENDING'
    return {
      channel: 'chatgpt_card',
      status,
      account: maskAccount(order.account),
      usedAt: firstString(order.updated_at, order.started_at, order.created_at),
      planName: firstString(order.product_name, row.product_name),
    }
  }
  // 上游认得这张卡，但自己也还没核对完
  return { channel: 'chatgpt_card', status: 'UNCONFIRMED', planName }
}

/** iOS 通道：读 POST /gateway/gpt?action=query 的响应 */
export function parseGptIos(d: Record<string, unknown> | null, cdk: string): SysbLookupHit | null {
  if (!d || d.status !== 'success') return null

  const rows = Array.isArray(d.data) ? (d.data as Record<string, unknown>[]) : []
  const row = rows.find((r) => String(r?.cdk || '').trim().toUpperCase() === cdk.toUpperCase()) || rows[0]
  if (!row) return null

  const status = String(row.status || '').trim().toLowerCase()
  // 'invalid' = 这条通道不认识这张卡（信用卡的卡在这里实测就是 invalid）
  if (!status || status === 'invalid') return null

  const PLANS: Record<string, string> = {
    plus: 'ChatGPT Plus（月付）',
    plus_year: 'ChatGPT Plus（年付）',
    pro100: 'ChatGPT Pro 5x',
    pro200: 'ChatGPT Pro 20x',
    go: 'ChatGPT Go',
  }
  const planName = PLANS[String(row.plan_type || '')] || undefined

  if (status === 'unused') return { channel: 'chatgpt_ios', status: 'UNUSED', planName }
  if (status === 'replaced') return { channel: 'chatgpt_ios', status: 'VOID', planName }
  if (status === 'used') {
    const isEmail = row.account_type === 'email' && typeof row.account === 'string' && row.account.includes('@')
    return {
      channel: 'chatgpt_ios',
      status: 'USED_OK',
      account: isEmail ? maskAccount(row.account) : undefined,
      usedAt: firstString(row.time),
      planName,
    }
  }
  return { channel: 'chatgpt_ios', status: 'UNCONFIRMED', planName }
}

/** Claude 通道：读 POST /gateway/claude?service=claude&action=cardQuery 的响应 */
export function parseClaude(d: Record<string, unknown> | null, cdk: string): SysbLookupHit | null {
  const okEnvelope =
    !!d && (Number(d.code) === 0 || Number(d.code) === 200 || d.msg === '成功' || d.msg === 'Success')
  if (!d || !okEnvelope) return null

  const rows = Array.isArray(d.data) ? (d.data as Record<string, unknown>[]) : []
  const row = rows.find((r) => String(r?.code || '').trim().toUpperCase() === cdk.toUpperCase()) || rows[0]
  if (!row) return null

  const n = Number(row.status)
  const planName = firstString(row.productName)
  // 0=未使用，1/2=已使用，其余（实测信用卡的卡在这里是 3）= 不属于本通道
  if (n === 0) return { channel: 'claude_ios', status: 'UNUSED', planName }
  if (n === 1 || n === 2) {
    return {
      channel: 'claude_ios',
      status: 'USED_OK',
      account: maskAccount(row.email ?? row.organizationId),
      usedAt: firstString(row.usedTime),
      planName,
    }
  }
  return null
}

/** 发请求 + 读响应。请求失败时 post 返回 null，各 parse 都把 null 当「查不到」 */
const LOOKUPS: Record<SysbChannel, (cdk: string) => Promise<SysbLookupHit | null>> = {
  chatgpt_card: async (cdk) =>
    parseCard(await post('/api/v1/sub/queryOrder', { cdks: [cdk] }, PER_CALL_TIMEOUT.chatgpt_card), cdk),
  chatgpt_ios: async (cdk) =>
    parseGptIos(await post('/gateway/gpt?action=query', { cdks: cdk }, PER_CALL_TIMEOUT.chatgpt_ios), cdk),
  claude_ios: async (cdk) =>
    parseClaude(
      await post('/gateway/claude?service=claude&action=cardQuery', { codes: [cdk] }, PER_CALL_TIMEOUT.claude_ios),
      cdk
    ),
}

/**
 * 决定三条通道的**查询顺序**。命中即停，所以顺序对了就只发一次请求。
 *
 * 优先级：本站商品名判出的通道 → 卡密长相判出的通道 → 其余。
 * 这两个只是提示，**结论永远以上游的回答为准**；猜错了最多多发一两次查询。
 */
export function lookupOrder(cdk: string, hint: SysbChannel | null): SysbChannel[] {
  const order: SysbChannel[] = []
  const push = (c: SysbChannel) => {
    if (!order.includes(c)) order.push(c)
  }
  if (hint) push(hint)
  if (CARD_PAY_SHAPE.test(cdk.trim().toUpperCase())) push('chatgpt_card')
  push('chatgpt_card')
  push('chatgpt_ios')
  push('claude_ios')
  return order
}

/**
 * 依次问三条通道「你认识这张卡吗、它什么状态」，第一条认识的就是答案。
 *
 * 全部查不到 → 返回 null。这**不代表卡是坏的**：也可能是接口改了、网络不通、
 * 或者这张卡属于我们还没接的通道。调用方必须把 null 当作「不知道」，
 * 退回到原来的流程，而不是拒绝买家。
 */
export async function lookupSysbCard(cdk: string, hint: SysbChannel | null): Promise<SysbLookupHit | null> {
  const key = cdk.trim()
  if (!key) return null
  const deadline = Date.now() + TOTAL_BUDGET_MS
  for (const channel of lookupOrder(key, hint)) {
    if (Date.now() >= deadline) break
    const hit = await LOOKUPS[channel](key)
    if (hit) return hit
  }
  return null
}

/** 仅供自测使用的内部导出 */
export const __test = { maskAccount, lookupOrder, parseCard, parseGptIos, parseClaude, CARD_PAY_SHAPE }
