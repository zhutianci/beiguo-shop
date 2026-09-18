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
  /**
   * 上一笔失败了，但**上游明确说卡没被消耗、可以重新提交**。
   *
   * 【这个状态是踩了坑之后加的】卡#1771 上游返回
   *   cdk_status=activated, order.status=failed,
   *   customer_state='safe_retry', error='本次充值未完成，卡密未消耗；请返回后重新提交'
   * 原来的代码只看 cdk_status + order.status，把它判成「已核销但失败，请联系客服」——
   * 等于把一张上游说还能用的卡判死了。
   *
   * 判据只认上游的显式表态（customer_state / safe_to_retry），不自己推断。
   */
  | 'RETRYABLE'

export interface SysbLookupHit {
  channel: SysbChannel
  status: SysbCardStatus
  /**
   * 上游的后端标识（目前见到 'gpt1' 与 'autosub'）。**它是卡自带的属性**，
   * 由上游按卡密判定，我们无从指定 —— V2 的 POST /orders 里根本没有这个字段。
   * 用途：决定卡付单走 V1 还是 V2。gpt1 走 V2 实测 0/3 成功，autosub 走 V2 实测成功。
   */
  backend?: string
  /** 已打码的充值账号，如 tan***@163.com */
  account?: string
  /** 核销时间，原样来自上游 */
  usedAt?: string
  /** 上游的套餐/产品名，用来让买家确认卡对不对 */
  planName?: string
  /**
   * 上一笔失败的**真实原因**（已翻成我们自己的文案）。
   *
   * 【为什么非要它不可】V2 的订单只会回一句笼统的「订单执行失败」，
   * 而上游自己的查卡接口里带着真正的原因：
   *   卡#1909 三笔单全是 order.error="Payment was not approved" ——
   *   上游拿信用卡给那个 ChatGPT 账号付款被拒了。
   * 我们却对买家说「充值未完成，请联系客服处理」，
   * 于是每一次拒付都变成站长的一张工单，而且谁都不知道该怎么办。
   */
  failureReason?: string
}

/**
 * 上游的失败原因 → 我们自己的文案。
 * 前一半是他们前端 friendlyRechargeFailure 里的 reason_code；
 * 后一半是 order.error 里实际出现过的英文原文（reason_code 并不总是有值）。
 */
const FAILURE_REASONS: Record<string, string> = {
  payment_declined: '上游用于付款的银行卡这次没有通过，卡密没有被消耗，可以稍后再试一次',
  payment_not_submitted: '上游的支付通道当时繁忙，本次没有提交支付，卡密没有被消耗，可以稍后再试',
  inventory_unavailable: '上游充值资源当时繁忙，卡密没有被消耗，可以稍后再试',
  no_charge_released: '上游未确认扣款、也没查到会员，卡密已经恢复，可以重新提交',
  review_timeout_released: '上游核对结束但未确认扣款，卡密已经恢复，可以重新提交',
  membership_not_found_released: '上游没查到会员到账，卡密已经恢复，可以重新提交',
  already_member: '这个账号已经是会员了，请更换一个没有订阅的账号',
  unsupported_region: '这个账号暂不支持该通道充值，请更换其它账号',
  token_expired: '账号登录内容已过期，请重新复制一份新的 Session 再提交',
  login_content_invalid: '账号登录内容不完整，请从官方页面重新复制完整内容',
}

/** order.error 里出现过的英文原文 → 我们的文案。reason_code 为空时靠它 */
const FAILURE_TEXTS: [RegExp, string][] = [
  [/payment\s+was\s+not\s+approved|payment\s+declined/i, FAILURE_REASONS.payment_declined],
  [/already\s+(a\s+)?(member|subscriber)/i, FAILURE_REASONS.already_member],
  [/token\s+expired|session\s+expired/i, FAILURE_REASONS.token_expired],
  [/卡密未消耗/, '这一笔没有成功，但卡密没有被消耗，可以重新提交'],
]

function failureReasonOf(order: Record<string, unknown>): string | undefined {
  const code = String(order.reason_code || '').trim().toLowerCase()
  if (code && FAILURE_REASONS[code]) return FAILURE_REASONS[code]
  const raw = String(order.error || '').trim()
  if (!raw) return undefined
  for (const [re, text] of FAILURE_TEXTS) if (re.test(raw)) return text
  return undefined
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
  // backend 跟着卡走，决定这张卡付卡该走 V1 还是 V2
  const backend = firstString(row.backend)
  const order = (row.order && typeof row.order === 'object' ? row.order : {}) as Record<string, unknown>

  /*
   * 【判定顺序照抄上游自己的分类器】它们前端的 classifyUncertainCardQuery 是这么分的：
   *   processing = customer_state==='verifying'
   *             || order.status ∈ {processing,pending,created,running,retrying,unknown}
   *             || cdk_status   ∈ {processing,locked,reserved}
   *   completed  = customer_state==='success' || order.status ∈ {success,completed,complete}
   *   consumed   = cdk_status ∈ {activated,redeemed,used}
   *   成功必须 completed && consumed **两个都成立**；
   *   然后才轮到 action_required / safe_retry；都不是才算 unknown。
   *
   * 我们原来只看 cdk_status 与 order.status 两个字段，比这套窄，
   * 结果把 cdk_status=activated + order.status=failed + customer_state=safe_retry
   * 的卡判成了「已核销但失败」—— 而上游那一行的 error 原文是
   * 「本次充值未完成，卡密未消耗；请返回后重新提交」。
   */
  const orderStatus = String(order.status || '').trim().toLowerCase()
  const customerState = String(order.customer_state || row.customer_state || '').trim().toLowerCase()
  const safeToRetry = order.safe_to_retry === true || row.safe_to_retry === true
  const consumed = ['activated', 'redeemed', 'used'].includes(cdkStatus)
  const completed = customerState === 'success' || ['success', 'completed', 'complete'].includes(orderStatus)
  const processing =
    customerState === 'verifying' ||
    ['processing', 'pending', 'created', 'running', 'retrying', 'unknown'].includes(orderStatus) ||
    ['processing', 'locked', 'reserved'].includes(cdkStatus)

  const withOrder = (status: SysbCardStatus): SysbLookupHit => ({
    channel: 'chatgpt_card',
    status,
    backend,
    failureReason: failureReasonOf(order),
    account: maskAccount(order.account),
    usedAt: firstString(order.updated_at, order.started_at, order.created_at),
    planName: firstString(order.product_name, row.product_name),
  })

  // ① 成功：两个条件都成立才算，这是上游自己的口径
  if (completed && consumed) return withOrder('USED_OK')
  // ② 还在跑
  if (processing) return withOrder(consumed || row.order ? 'USED_PENDING' : 'LOCKED')
  /*
   * ③ 上游**显式表态**可以重来。只认它自己给的信号，绝不自己推断 ——
   *    上游源码里那句注释说得很清楚：「卡还是 unused 不能当作没扣款的证据，
   *    只有服务端显式的 safe-to-retry 才能重开这条流程」。反过来也成立：
   *    它既然显式说了 safe_retry，我们就不该把卡判死。
   *    action_required 同理（上游文案是「请返回修改资料，本次未提交支付」）。
   */
  if (customerState === 'safe_retry' || safeToRetry || customerState === 'action_required') {
    return withOrder('RETRYABLE')
  }
  // ④ 还没被用掉
  if (['unused', 'available'].includes(cdkStatus)) {
    return { channel: 'chatgpt_card', status: 'UNUSED', planName, backend }
  }
  // ⑤ 卡被消耗了，上游又没说能重来 —— 只能走售后
  if (consumed) return withOrder('USED_FAILED')
  // 上游认得这张卡，但自己也还没核对完
  return { channel: 'chatgpt_card', status: 'UNCONFIRMED', planName, backend }
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
export const __test = { maskAccount, lookupOrder, parseCard, parseGptIos, parseClaude, CARD_PAY_SHAPE, failureReasonOf, FAILURE_REASONS }
