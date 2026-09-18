/**
 * 充值平台适配器：sysb（HongyunAI Partner API v2）。
 *
 * 【和 sysa 是两种完全不同的模型，别照搬】
 *   sysa：无鉴权、可以先查卡、同步出结果
 *   sysb：Bearer Token 鉴权、**文档明确禁止预检卡密**、异步下单后轮询
 *
 * V2 本身**查不了卡密**。查卡的能力来自另一套只读接口（见 sysb-lookup.ts，
 * 站长授权使用 V1），它同时回答了两件事：这张卡用过没有、它属于哪条通道。
 * 真正的充值结果仍然要等 activate() 下单之后轮询 V2。
 *
 * ================== 三条不能破的规则 ==================
 *
 * 【一】Token 只在服务端。文档原文：「不要放在网页、App、小程序、浏览器插件、
 * Git、日志或截图里」。本文件从环境变量读，绝不出现在任何响应里。
 *
 * 【二】订单号就是幂等锚，必须复用。文档原文：「POST 超时或断网后先查原订单，
 * 不能换一个新订单号再提交」。换号重下 = 重复扣卡密。
 * 所以下单前先读回这张卡上次的订单号：有就直接查，**不重新下单**。
 *
 * 【三】manual_review 必须停止自动处理，不重提交。
 */
import crypto from 'crypto'
import {
  RedeemError,
  type RedeemActivateResult,
  type RedeemCheckResult,
  type RedeemField,
  type RedeemGuideStep,
  type RedeemProvider,
  type RedeemVariant,
} from '../types'
import { lookupSysbCard, type SysbLookupHit } from './sysb-lookup'
import { cardV1Enabled, redeemCardV1 } from './sysb-card-v1'

const BASE = 'https://hongyunai.pro/api/v2'
const TIMEOUT_MS = 30_000

/** 上游产品编码 */
type Product = 'chatgpt_card' | 'chatgpt_ios' | 'claude_ios'

function token(): string {
  const t = (process.env.SYSB_API_TOKEN || '').trim()
  if (!t) throw new RedeemError('充值服务暂未配置，请联系客服', 'ERROR', false)
  return t
}

export function sysbConfigured(): boolean {
  return !!(process.env.SYSB_API_TOKEN || '').trim()
}

interface UpstreamBody {
  ok?: boolean
  request_id?: string
  data?: Record<string, unknown>
  error?: { code?: string; message?: string; retryable?: boolean }
}

/** 上游错误码 → 我们自己的文案。**不透传上游 message**，那里面带对方品牌与内部术语 */
const ERRORS: Record<string, string> = {
  INVALID_REQUEST: '提交内容有误，请检查后重试',
  ORDER_ID_INVALID: '订单号格式异常，请联系客服',
  CREDENTIAL_INVALID: '账号凭据无效或不完整，请重新复制完整内容后再试',
  TOKEN_INVALID: '充值服务凭据异常，请联系客服',
  IP_NOT_ALLOWED: '充值服务拒绝了本次请求，请联系客服',
  PERMISSION_DENIED: '充值服务拒绝了本次请求，请联系客服',
  ORDER_NOT_FOUND: '未找到该笔充值记录',
  ROUTE_NOT_FOUND: '充值服务接口异常，请联系客服',
  METHOD_NOT_ALLOWED: '充值服务接口异常，请联系客服',
  ORDER_ID_CONFLICT: '这张卡密已经用不同的账号信息提交过了，请联系客服核对',
  PAYLOAD_TOO_LARGE: '提交内容过大，请确认只粘贴了账号凭据本身',
  PRODUCT_UNAVAILABLE: '该充值渠道暂时不可用，请稍后再试',
  RATE_LIMITED: '当前充值人数较多，请稍后再试',
  API_DATABASE_UNAVAILABLE: '充值服务暂时不可用，请稍后再试',
  API_NOT_CONFIGURED: '充值服务暂时不可用，请稍后再试',
  API_CRYPTO_UNAVAILABLE: '充值服务暂时不可用，请稍后再试',
  ORDER_WORKER_OFFLINE: '充值服务正在维护，请稍后再试',
  ORDER_QUEUE_BUSY: '充值队列繁忙，请稍后再试',
  ORDER_FAILED: '充值未完成，请联系客服处理',
}

/** 这些错误重试没有意义，必须走人工 */
const TERMINAL_ERRORS = new Set([
  'ORDER_ID_CONFLICT',
  'TOKEN_INVALID',
  'IP_NOT_ALLOWED',
  'PERMISSION_DENIED',
  'ORDER_ID_INVALID',
  'ROUTE_NOT_FOUND',
  'METHOD_NOT_ALLOWED',
])

function copy(code: string | undefined, fallback: string): string {
  return (code && ERRORS[code]) || fallback
}

async function call(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown
): Promise<{ status: number; body: UpstreamBody; retryAfter?: number }> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ac.signal,
      // 与 lib/news/feed.ts 同一个理由：裸 fetch 会被 Next 的磁盘数据缓存冻住。
      // 这里被缓存的后果是「下单成功」被回放给后面每一个人，而订单根本没发出去
      cache: 'no-store',
    })
    const ra = Number(res.headers.get('Retry-After') || '')
    const text = await res.text()
    let parsed: UpstreamBody
    try {
      parsed = JSON.parse(text) as UpstreamBody
    } catch {
      // 网关错误可能是 HTML，不能崩，也不能把原始内容吐给买家
      throw new RedeemError('充值服务暂时不可用，请稍后再试', 'ERROR')
    }
    return { status: res.status, body: parsed, retryAfter: Number.isFinite(ra) && ra > 0 ? ra : undefined }
  } catch (e) {
    if (e instanceof RedeemError) throw e
    const msg = e instanceof Error ? e.message : String(e)
    throw new RedeemError(
      msg.includes('abort') ? '充值服务响应超时，请稍后回到本页查询结果' : '无法连接充值服务，请稍后再试',
      'ERROR'
    )
  } finally {
    clearTimeout(timer)
  }
}

const AUTH_SESSION_FIELD: RedeemField = {
  name: 'session_json',
  kind: 'session_json',
  label: 'ChatGPT 账号 Session',
  help: '登录 chatgpt.com 后打开 session 接口，把整段 JSON 完整复制进来（不要只复制其中一段，也不要再转成字符串）。',
  placeholder: '{"accessToken":"ey...","user":{"email":"..."}}',
  required: true,
  multiline: true,
}

const GPT_GUIDE = (label: string): { intro: string; steps: RedeemGuideStep[] } => ({
  intro: `跟着 4 步完成${label}：登录账号 → 复制一段 Session JSON → 粘贴提交。`,
  steps: [
    {
      title: '登录 ChatGPT',
      detail: '用浏览器打开并登录要充值的那个 ChatGPT 账号，确保处于已登录状态。',
      link: { label: '打开 ChatGPT', url: 'https://chatgpt.com/' },
    },
    {
      title: '复制 Session JSON',
      detail: '登录状态下打开下面这个地址，把页面上**整段 JSON** 全选复制。',
      link: { label: '打开 session 页面', url: 'https://chatgpt.com/api/auth/session' },
    },
    { title: '粘贴并核对账号', detail: '粘进下面的输入框，系统会自动识别出账号邮箱，请确认是你要充值的那个号。' },
    { title: '提交充值', detail: '确认无误后提交，随后在本页等待结果，不要重复提交。' },
  ],
})

const VARIANTS: RedeemVariant[] = [
  {
    code: 'chatgpt_card',
    label: 'ChatGPT 信用卡充值',
    hint: '信用卡通道的 PLUS / 5X / 20X 卡密',
    fields: [AUTH_SESSION_FIELD],
    guide: GPT_GUIDE('信用卡充值').steps,
    guideIntro: GPT_GUIDE('信用卡充值').intro,
  },
  {
    code: 'chatgpt_ios',
    label: 'ChatGPT iOS 充值',
    hint: 'iOS 通道的 PLUS / 5X / 20X 卡密',
    fields: [
      AUTH_SESSION_FIELD,
      {
        name: 'overwrite',
        kind: 'toggle',
        label: '覆盖账号已有的订阅',
        help: '仅当账号已有订阅、且你确认要覆盖时才勾选。不确定就别勾。',
        required: false,
      },
    ],
    guide: GPT_GUIDE('iOS 充值').steps,
    guideIntro: GPT_GUIDE('iOS 充值').intro,
  },
  {
    code: 'claude_ios',
    label: 'Claude 充值',
    hint: 'Claude 卡密',
    fields: [
      {
        name: 'org_id',
        kind: 'uuid',
        label: 'Claude Organization ID',
        help: 'Claude 账号 Settings → Account 页面里的 Organization ID。',
        placeholder: '96eae38f-b751-4079-b116-484bd746c477',
        required: true,
      },
    ],
    guide: [
      {
        title: '登录 Claude',
        detail: '打开 claude.ai，登录要充值的那个账号。',
        link: { label: '打开 Claude', url: 'https://claude.ai/' },
      },
      { title: '进入账号设置', detail: '点左下角头像 → Settings → Account。' },
      { title: '复制 Organization ID', detail: '把 Organization ID 完整复制下来，形如 96eae38f-xxxx-xxxx-xxxx-xxxxxxxxxxxx。' },
      { title: '粘贴并提交', detail: '粘进下面的输入框，确认无误后提交。' },
    ],
    guideIntro: '跟着 4 步完成：登录 Claude → 在账号设置里复制 Organization ID → 粘贴提交。',
  },
]

/**
 * 从**本站商品名**猜这张卡该走哪条充值渠道。
 *
 * 【这只是提示，不是结论】真正的结论来自 sysb-lookup.ts：直接问上游
 * 「你认不认得这张卡」，三条通道里只有一条认得。这里判出的通道有两个用处：
 *   1. 决定**先查哪条通道** —— 猜对了就只发一次请求
 *   2. 上游三条都查不到时（接口改版、超时）的兜底，此时会把三条渠道都列出来让买家能改
 *
 * 线上实际的商品名：
 *   ChatGPT Plus自助充值 | 信用卡冲                  → chatgpt_card
 *   ChatGPT Pro 20x 自助充值 | 信用卡充值（…）        → chatgpt_card
 *   ChatGPT Pro 5x 自助充值 | iOS订阅充值（可覆盖plus）→ chatgpt_ios
 *   Claude pro 自助充值 | iOS订阅充值                 → claude_ios
 *   Claude Pro 自助充值                               → claude_ios
 *
 * 判定顺序有讲究：**先判 Claude**。因为 Claude 的商品名里也常带「iOS订阅充值」，
 * 先匹配 iOS 会把 Claude 的卡错判成 ChatGPT iOS 通道。
 *
 * 判不出来就返回 null，退回让买家自己选 —— 宁可多问一步，也不要猜错渠道。
 */
export function detectVariant(productName: string | undefined): Product | null {
  const n = (productName || '').toLowerCase()
  if (!n) return null
  // Claude 在 sysb 只有一条通道，认出是 Claude 就够了
  if (n.includes('claude')) return 'claude_ios'
  const isGpt = n.includes('chatgpt') || n.includes('gpt')
  if (!isGpt) return null // Grok、成品号、谷歌邮箱这些 sysb 根本不支持
  if (n.includes('信用卡')) return 'chatgpt_card'
  if (n.includes('ios')) return 'chatgpt_ios'
  return null
}

/** 上游给的是 ISO 时间，直接显示太丑。统一按北京时间展示 */
function fmtTime(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d)
}

/**
 * V1 只读查询的结果 → 买家看到的状态页。
 *
 * 【返回非 null 就等于「到此为止，不出表单」】站长的原话：
 * 「核销完的卡密去查询的话，直接展示充值状态，不要进入到下一步填账号信息」。
 * 所以这里每一条分支的 fields 都是空数组，state 也都不是 READY ——
 * 前端的 showForm 同时要求这两点，少一个就会漏出表单。
 *
 * 只有 UNUSED 返回 null：那是唯一一个「可以继续去充」的状态。
 */
function fromLookup(hit: SysbLookupHit): RedeemCheckResult | null {
  /*
   * 这两个状态都是「可以继续去充」，所以返回 null 让流程往下走、正常出表单。
   * RETRYABLE 是上一笔失败了、但上游**明说卡没被消耗、可以重新提交**
   * （customer_state=safe_retry）。把它当成「已核销」拦下来，
   * 就是把一张还能用的卡判死 —— 卡#1771 就是这么被判死的。
   */
  if (hit.status === 'UNUSED' || hit.status === 'RETRYABLE') return null

  const label = VARIANTS.find((v) => v.code === hit.channel)?.label || '充值'
  const base = {
    fields: [] as RedeemField[],
    productName: hit.planName,
    account: hit.account,
    completedAt: fmtTime(hit.usedAt),
  }
  switch (hit.status) {
    case 'USED_OK':
      return { ...base, state: 'COMPLETED', message: `这张卡密已经充值完成（${label}），无需重复提交` }
    case 'USED_PENDING':
      return {
        ...base,
        state: 'PROCESSING',
        message: `这张卡密已经提交充值（${label}），上游仍在处理中，请稍后再点「查询」，不要重复提交`,
        cooldownSeconds: 30,
      }
    case 'USED_FAILED':
      /*
       * 卡已经被消耗掉了，但那一笔没成功。让买家再填一遍账号只会再失败一次 ——
       * 这是售后，不是重试。
       */
      return {
        ...base,
        state: 'ERROR',
        message: `这张卡密已核销（${label}），但那一笔充值没有成功。请联系客服并提供卡密，我们会跟进处理`,
      }
    case 'LOCKED':
      return {
        ...base,
        state: 'PROCESSING',
        message: '这张卡密正在处理上一笔请求，请稍后再点「查询」',
        cooldownSeconds: 60,
      }
    case 'VOID':
      return { ...base, state: 'VOID', message: '这张卡密已被换卡作废，请联系客服处理' }
    case 'UNCONFIRMED':
      return {
        ...base,
        state: 'PROCESSING',
        message: '上游正在核对这张卡密的状态，请稍后再点「查询」',
        cooldownSeconds: 60,
      }
  }
}

/** 卡付单该走哪条路 */
export type CardRoute = 'v1' | 'v2' | 'block' | 'unknown'

/**
 * 决定一张卡该走 V1 还是 V2。**纯函数，为的是能被穷举断言**。
 *
 * 站长问的是「改完之后会不会变成只有 Plus 能充、5x 和 iOS 反而坏了」。
 * 这个函数就是那个问题的答案，scripts/check-redeem.ts 里对它做了穷举：
 *
 *   chatgpt_ios / claude_ios  → 永远 'v2'，**一行分叉逻辑都不进**，零影响
 *   开关关闭                   → 永远 'v2'，等于这次改动不存在
 *   chatgpt_card + autosub     → 'v2'（这条实测能成：BG-1759、BG-1874）
 *   chatgpt_card + gpt1        → 'v1'（这条走 V2 实测 0 成功 / 6 次）
 *
 * 【查不到时必须 'unknown'，绝不能落回 V2】这是一个会重复扣卡的洞：
 * 只读查卡失败会返回 null，而这张卡可能正走在 V1 的半路上。
 * 落回 V2 之后，loadOrderRef 会读到 V1 的 TASK 单号，
 * 拿它打 GET /v2/orders 必然 404，而那段代码对 404 的处置是
 * 「上游没有这笔单，可以正常下单」—— 于是在一张 V1 可能已经扣掉的卡上再下一单。
 * 宁可让买家等一会儿再点一次「查询」，也不能冒这个险。
 */
export function decideCardRoute(
  product: string,
  v1Enabled: boolean,
  hit: SysbLookupHit | null
): CardRoute {
  // 其它通道与开关关闭时，行为与改动前完全一致
  if (product !== 'chatgpt_card' || !v1Enabled) return 'v2'
  if (!hit) return 'unknown'
  // 卡已经不是「可充」状态，两条路都不该走，直接把真实状态回给买家
  if (hit.status !== 'UNUSED' && hit.status !== 'RETRYABLE') return 'block'
  return hit.backend === 'gpt1' ? 'v1' : 'v2'
}

/**
 * 拼出这一单的上游订单号。
 *
 * 规则：`BG-<卡密id>-<内容指纹>`，满足上游的 8–64 位、仅 [A-Za-z0-9._:-]。
 *
 * 【指纹里必须含凭据】同样的卡 + 同样的账号 = 同一个订单号 → 上游按幂等重放，
 * 不会重复扣卡；买家改了账号信息 = 另一个订单号 → 是一次新的尝试。
 * 【但换号重下由上层把关】真正防重复扣卡的是 activate() 里「先查原单」那一步，
 * 订单号只是让「同样内容的重试」天然安全。
 */
function buildOrderId(cardKeyId: number, product: Product, cdk: string, credential: string): string {
  const fp = crypto.createHash('sha256').update(`${product}|${cdk}|${credential}`).digest('hex').slice(0, 20)
  return `BG-${cardKeyId}-${fp}`
}

const ORDER_ID_RE = /^[A-Za-z0-9._:-]{8,64}$/

interface OrderData {
  order_id?: string
  status?: string
  final?: boolean
  message?: string
  next_poll_seconds?: number
  failure?: { code?: string; message?: string; retryable?: boolean }
}

/** 上游订单状态 → 我们的结果 */
function toResult(d: OrderData, requestId: string | undefined, orderRef: string): RedeemActivateResult {
  const status = d.status || ''
  const nextPoll = typeof d.next_poll_seconds === 'number' ? Math.max(15, d.next_poll_seconds) : 15

  if (status === 'succeeded') {
    return { state: 'COMPLETED', message: '充值成功', retriable: false, requestId, orderRef }
  }
  if (status === 'pending' || status === 'processing') {
    return {
      state: 'PROCESSING',
      // 文档要求至少间隔 15 秒查一次，且 next_poll_seconds 更大时以它为准
      message: `正在为你充值，请等待约 ${nextPoll} 秒后在本页点「查询结果」，不要重复提交`,
      retryAfter: nextPoll,
      // 可重试 = 可以再点一次「查询结果」续查；不会重新下单
      retriable: true,
      requestId,
      orderRef,
    }
  }
  if (status === 'manual_review') {
    /*
     * 【必须停止自动处理】文档原文：「manual_review 或无法确认结果时，
     * 停止自动重试并联系管理员」。给买家一个重试入口只会让他反复戳。
     */
    return {
      state: 'ERROR',
      message: '这笔充值需要人工核对，请联系客服并提供卡密，我们会尽快处理',
      retriable: false,
      requestId,
      orderRef,
    }
  }
  if (status === 'failed') {
    const code = d.failure?.code
    return {
      state: 'ERROR',
      message: copy(code, '充值未完成，请联系客服处理'),
      // 上游说可重试才让重试；它没说就当作不可重试，避免买家反复撞同一堵墙
      retriable: d.failure?.retryable === true,
      requestId,
      orderRef,
    }
  }
  return { state: 'ERROR', message: '充值状态未知，请联系客服', retriable: false, requestId, orderRef }
}

export const sysb: RedeemProvider = {
  key: 'sysb',
  /** 辨识名：只在后台导入卡密的下拉里出现，买家侧永远看不到 */
  adminLabel: 'B 系统（HongyunAI）',

  /**
   * check() 按这个顺序回答「这张卡现在能不能充、该走哪条通道」：
   *
   *   1. 本站记下的上游订单号 —— 最权威，但只覆盖「从我们站里充的」卡
   *   2. V1 只读查询（sysb-lookup.ts）—— 覆盖**在任何地方**充掉的卡，
   *      顺便由上游直接告诉我们这张卡属于哪条通道
   *   3. /account + /products —— 确认服务与通道此刻能接单
   *
   * 前两步任何一步认定「已核销 / 处理中 / 已作废」，就**只展示状态、不出表单**。
   */
  async check(cdk, ctx): Promise<RedeemCheckResult> {
    /*
     * 【第一件事：这张卡是不是从我们站里充过】
     *
     * 本站记下的上游订单号是最权威的判据 —— 它直接对应 V2 的一笔真实订单，
     * 能拿到 pending / processing / manual_review 这些中间态。
     * 覆盖面窄（只认从我们站里充的卡），但只要有，就以它为准。
     *
     * 在别处充掉的卡由下面那一步（V1 只读查询）负责。
     */
    const prevRef = ctx?.loadOrderRef ? await ctx.loadOrderRef() : null
    /*
     * 【只有 V2 自己下的单才拿去查 V2】我们的 V2 订单号一律是 BG- 开头（buildOrderId），
     * 而卡付走 V1 时存下来的是上游的 TASK00027056 这种。
     * 拿 TASK 号去打 GET /v2/orders 是没意义的，而且这段代码的走向
     * 完全取决于对方回 404 还是别的码 —— 回别的码就会让买家永远停在
     * 「正在确认上一次的充值结果」。不赌这个，按前缀直接分开。
     * V1 的单由下面那一步（只读查卡）负责，它本来就能查到真实状态。
     */
    if (prevRef && prevRef.startsWith('BG-')) {
      const q = await call('GET', `/orders/${encodeURIComponent(prevRef)}`)
      if (q.status === 200 && q.body.ok) {
        const d = (q.body.data || {}) as OrderData
        const status = d.status || ''
        if (status === 'succeeded') {
          return {
            state: 'COMPLETED',
            message: '这张卡密已经充值成功，无需重复提交',
            fields: [],
            requestId: q.body.request_id,
          }
        }
        if (status === 'pending' || status === 'processing') {
          const wait = typeof d.next_poll_seconds === 'number' ? Math.max(15, d.next_poll_seconds) : 15
          return {
            state: 'PROCESSING',
            message: `这张卡密正在充值中，请等待约 ${wait} 秒后再次点「查询」，不要重复提交`,
            fields: [],
            cooldownSeconds: wait,
            requestId: q.body.request_id,
          }
        }
        if (status === 'manual_review') {
          return {
            state: 'ERROR',
            message: '这笔充值需要人工核对，请联系客服并提供卡密，我们会尽快处理',
            fields: [],
            requestId: q.body.request_id,
          }
        }
        // failed：卡可能还能再充一次（上游会自己判），所以继续往下走、正常出表单
      }
      // 404 或查询失败：当作没充过，继续正常流程
    }

    /*
     * 【第二件事：问上游这张卡到底什么状态】
     *
     * 上面那一步只认得「从我们站里充的」卡。卡如果是在别处充掉的 ——
     * 站长给的 PLUS-1160C3F21B78B903 就是这种 —— 我们没有订单号，
     * 于是照样摆出充值表单，买家反复填账号。这正是站长指出的问题。
     *
     * V1 的只读查询接口能覆盖这种情况，而且顺带把**通道**也告诉了我们：
     * 三条通道里只有一条认得这张卡。见 sysb-lookup.ts。
     *
     * 【查不到不等于卡是坏的】接口可能改版、可能超时，所以 hit 为 null 时
     * 一律退回原来的流程，绝不拒绝买家。
     */
    const hint = detectVariant(ctx?.productName)
    const hit = await lookupSysbCard(cdk, hint)
    const blocked = hit ? fromLookup(hit) : null
    if (blocked) return blocked

    /*
     * 上一笔失败了、但上游明说卡没被消耗（customer_state=safe_retry）。
     * 表单照出，但要把这句实话告诉买家 —— 否则他会以为自己在重复充值。
     */
    const retryNotice =
      hit?.status === 'RETRYABLE'
        ? { level: 'unstable' as const, text: '上一笔充值没有成功，但这张卡密没有被消耗，可以重新提交一次。' }
        : null

    const [acct, prods] = await Promise.all([call('GET', '/account'), call('GET', '/products')])

    if (acct.status === 401 || acct.body.error?.code === 'TOKEN_INVALID') {
      throw new RedeemError('充值服务凭据异常，请联系客服', 'ERROR', false)
    }
    const a = acct.body.data || {}
    if (a.enabled === false) throw new RedeemError('充值服务暂时不可用，请联系客服', 'ERROR')
    if (a.order_worker === 'offline') {
      throw new RedeemError('充值服务正在维护，请稍后再试', 'ERROR')
    }

    // 只保留上游此刻愿意接单的渠道 —— 停开的渠道让买家选了也只是白填一遍
    const accepting = new Set(
      (((prods.body.data || {}).products as { product?: string; accepting_orders?: boolean }[]) || [])
        .filter((p) => p.accepting_orders === true)
        .map((p) => p.product || '')
    )
    const variants = VARIANTS.filter((v) => accepting.has(v.code))
    if (variants.length === 0) {
      throw new RedeemError('当前没有可用的充值渠道，请稍后再试', 'OUT_OF_STOCK')
    }

    const notice =
      a.service_status === 'degraded'
        ? { level: 'unstable' as const, text: '充值服务当前状态不稳定，可以提交但可能需要等待更久' }
        : null

    /*
     * 【上游已经确认了通道 —— 不给选择器，直接出表单】
     * hit.status === 'UNUSED' 意味着某一条通道认得这张卡、且它还没被用掉。
     * 这是上游亲口说的，不是我们猜的，没有第二种可能，**没有让买家选的余地**。
     * 只返回这一条渠道，前端看到只有一条就不渲染选择器。
     */
    // RETRYABLE 的卡上游同样认得它属于哪条通道，没有让买家再选一遍的道理
    if (hit && (hit.status === 'UNUSED' || hit.status === 'RETRYABLE')) {
      const only = VARIANTS.find((v) => v.code === hit.channel)
      if (only) {
        if (!accepting.has(only.code)) {
          // 通道认得这张卡，但此刻停开了。列别的渠道给他选毫无意义 —— 那些渠道不认这张卡
          throw new RedeemError(`「${only.label}」通道暂时停止接单，请稍后再试`, 'OUT_OF_STOCK')
        }
        return {
          state: 'READY',
          message:
            hit.status === 'RETRYABLE'
              ? `上一笔充值没有成功，但这张卡密没有被消耗。已确认为「${only.label}」，可以重新提交一次`
              : `卡密有效，已确认为「${only.label}」，请按下面的步骤填写要充值的账号`,
          productName: hit.planName,
          fields: only.fields,
          guide: only.guide,
          guideIntro: only.guideIntro,
          variants: [only],
          variantDefault: only.code,
          variantLabel: '充值渠道',
          variantHint: '已按卡密自动确认，无需选择。',
          notice: retryNotice || notice,
          requestId: acct.body.request_id,
        }
      }
    }

    /*
     * 上游没认出来（接口改版、超时、或这张卡属于我们还没接的通道）。
     * 退回到按**本站商品名**猜：猜得出就默认选上，仍把三条渠道都列出来让他能改；
     * 猜不出就老老实实让他选 —— 宁可多问一步，也不要猜错渠道。
     */
    const guess = hint ? variants.find((v) => v.code === hint) : null
    if (guess) {
      return {
        state: 'READY',
        // 刻意不说「卡密有效」—— 这一条路径上我们并没有从上游查到这张卡
        message: `已按你购买的商品识别为「${guess.label}」，请按下面的步骤填写要充值的账号`,
        fields: guess.fields,
        guide: guess.guide,
        guideIntro: guess.guideIntro,
        variants,
        variantDefault: guess.code,
        variantLabel: '充值渠道',
        variantHint: '已按你购买的商品自动选好。如果不对，可以点其它渠道切换。',
        notice: retryNotice || notice,
        requestId: acct.body.request_id,
      }
    }

    return {
      state: 'READY',
      message: '请选择与你卡密对应的充值渠道，然后填写要充值的账号',
      fields: [],
      variants,
      variantLabel: '充值渠道',
      variantHint: '按你购买的卡密类型选择。选错渠道会充值失败，但不会扣卡。',
      notice: retryNotice || notice,
      requestId: acct.body.request_id,
    }
  },

  async activate({
    cdk,
    values,
    variant,
    cardKeyId,
    loadOrderRef,
    saveOrderRef,
    claimIrreversible,
  }): Promise<RedeemActivateResult> {
    const product = (variant || '') as Product
    if (!VARIANTS.some((v) => v.code === product)) {
      throw new RedeemError('请选择充值渠道', 'ERROR')
    }
    if (typeof cardKeyId !== 'number') {
      // 订单号要靠卡密 id 才能稳定复现，拿不到就不能下单
      throw new RedeemError('兑换服务异常，请联系客服', 'ERROR', false)
    }

    /*
     * ============ 卡付 gpt1：改走 V1 三段式 ============
     *
     * 【为什么要分叉】V2 的 chatgpt_card 对 gpt1 的卡实测 0 成功 / 3 失败：
     * 三笔都是 pending 约 6 分 26 秒、从未进入 processing、失败后连订单都没建出来。
     * 同一张卡在官网走 V1 是 51 秒成功。详见 sysb-card-v1.ts 的文件头。
     *
     * 【为什么必须放在这里，在 V2 查原单之前】V1 存下来的订单号是 TASK00027056 这种，
     * 拿它去打 GET /v2/orders/{id} 必然 404，而下面那段对 404 的处理是
     * 「上游没有这笔单，可以正常下单」—— 那就会在一张 V1 已经扣掉的卡上再下一单。
     * 两套协议的单号绝不能流进对方的查单逻辑。
     *
     * 【autosub 不走这里】autosub 的卡走 V2 是实测成功过的（BG-1759，55 秒），
     * 那条路没坏，不要动它。backend 从只读查卡拿，不额外调写接口。
     */
    if (product === 'chatgpt_card' && cardV1Enabled()) {
      const hit = await lookupSysbCard(cdk, 'chatgpt_card')
      const route = decideCardRoute(product, true, hit)

      if (route === 'unknown') {
        /*
         * 查不到这张卡的状态就必须停下 —— 见 decideCardRoute 的说明：
         * 落回 V2 会让 V1 的 TASK 单号撞上 404，被当成「没下过单」而重复提交。
         */
        throw new RedeemError(
          '暂时无法确认这张卡密的状态，请稍等一会儿回到本页点「查询」，不要重复提交',
          'PROCESSING',
          true
        )
      }

      if (route === 'block' && hit) {
        const blocked = fromLookup(hit)
        if (blocked) throw new RedeemError(blocked.message, blocked.state, false)
      }

      if (route === 'v1') {
        if (!claimIrreversible) throw new RedeemError('兑换服务异常，请联系客服', 'ERROR', false)
        return redeemCardV1({
          cdk,
          sessionRaw: values.session_json || '',
          /*
           * 占位必须发生在 precheckAccount 之前 —— 那一步一成功，上游就预留了卡。
           * 抢不到说明同一张卡已经有一次提交在路上（或刚崩在半路），
           * 这时候再发一次就是第二笔真实扣款。
           */
          markIrreversible: async () => {
            const ok = await claimIrreversible()
            if (!ok) {
              throw new RedeemError(
                '这张卡密已经提交过一次充值，正在处理中。请不要重复提交，稍后回到本页点「查询」确认结果',
                'PROCESSING',
                true
              )
            }
          },
          saveOrderRef: async (ref) => {
            if (saveOrderRef) await saveOrderRef(ref)
          },
        })
      }
      // route === 'v2'：明确是 autosub，落回下面那条实测能成的老路
    }

    /*
     * 【第一步永远是「先查原单」，不是下单】
     * 文档原文：「POST 超时或断网后先查原订单，不能换一个新订单号再提交」。
     * 只要这张卡上次留下过订单号，就直接查它：
     *   · 还在处理 → 告诉买家等着，**绝不重新下单**
     *   · 已成功   → 直接返回成功
     *   · 已失败   → 才允许这次用新内容重新下单
     * 少了这一步，买家多点一次「提交」就可能被扣两张卡。
     */
    const prev = loadOrderRef ? await loadOrderRef() : null
    if (prev) {
      const q = await call('GET', `/orders/${encodeURIComponent(prev)}`)
      if (q.status === 200 && q.body.ok) {
        const d = (q.body.data || {}) as OrderData
        const r = toResult(d, q.body.request_id, prev)
        // 只有「明确失败且上游说可重试」才放行去下新单；其余一律返回现状
        const canResubmit = d.status === 'failed' && d.failure?.retryable === true
        if (!canResubmit) return r
      } else if (q.status !== 404) {
        // 查不动就别乱下单 —— 宁可让买家等，也不能冒重复扣卡的险
        return {
          state: 'PROCESSING',
          message: '正在确认上一次的充值结果，请稍后在本页点「查询结果」',
          retryAfter: 15,
          retriable: true,
          requestId: q.body.request_id,
          orderRef: prev,
        }
      }
      // 404 = 上游没有这笔单，说明上次根本没提交成功，可以正常下单
    }

    /*
     * 【提交前再问一次上游：这张卡还在不在】
     * 页面上不出表单只挡住了正常买家；直接打 /activate 的请求绕得过去。
     * 这一步用的还是那三个只读查询接口，命中即停，通常只多一次请求。
     *
     * **只在上游明确说「不是未使用」时才拦**。查不到、超时、接口改版一律放行 ——
     * 一个非正式接口不该有权力让买家充不了值（见 sysb-lookup.ts 规则二）。
     */
    const guard = await lookupSysbCard(cdk, product)
    if (guard && guard.status !== 'UNUSED') {
      const blocked = fromLookup(guard)
      if (blocked) throw new RedeemError(blocked.message, blocked.state, false)
    }

    // ---- 组装凭据 ----
    let credential: unknown
    let credFingerprint: string
    if (product === 'claude_ios') {
      const org = (values.org_id || '').trim()
      if (!org) throw new RedeemError('请填写 Claude Organization ID', 'ERROR')
      credential = org
      credFingerprint = org
    } else {
      const raw = (values.session_json || '').trim()
      if (!raw) throw new RedeemError('请粘贴 ChatGPT 账号 Session', 'ERROR')
      /*
       * 【必须传 JSON 对象，不是字符串】文档原文：「ChatGPT 凭证应传入完整 JSON 对象，
       * 不是把 JSON 再编码成字符串」。这里解析一次，顺便挡掉「只粘了半段」的情况 ——
       * 让买家在本地就看到「格式不对」，比提交上去等一轮失败强得多。
       */
      try {
        credential = JSON.parse(raw)
      } catch {
        throw new RedeemError('账号 Session 不是完整的 JSON，请回到 session 页面全选复制整段内容', 'ERROR')
      }
      if (!credential || typeof credential !== 'object' || Array.isArray(credential)) {
        throw new RedeemError('账号 Session 格式不正确，请复制整段 JSON 对象', 'ERROR')
      }
      if (!(credential as Record<string, unknown>).accessToken) {
        throw new RedeemError('账号 Session 里缺少 accessToken，请确认复制的是完整内容', 'ERROR')
      }
      credFingerprint = raw
    }

    const orderId = buildOrderId(cardKeyId, product, cdk, credFingerprint)
    if (!ORDER_ID_RE.test(orderId)) {
      throw new RedeemError('兑换服务异常，请联系客服', 'ERROR', false)
    }

    const payload: Record<string, unknown> = { order_id: orderId, product, cdk, credential }
    // overwrite 只有 chatgpt_ios 认；省略与显式 false 等价，所以只在勾选时才带上
    if (product === 'chatgpt_ios' && (values.overwrite || '').trim() === '1') payload.overwrite = true

    // 先把订单号落库再发请求：万一 POST 超时，下次进来才知道要去查哪一单
    if (saveOrderRef) await saveOrderRef(orderId)

    const res = await call('POST', '/orders', payload)

    if (res.status === 202 || res.status === 200) {
      if (res.body.ok) return toResult((res.body.data || {}) as OrderData, res.body.request_id, orderId)
    }
    if (res.status === 429) {
      return {
        state: 'COOLDOWN',
        message: '当前充值人数较多，请稍后再试',
        retryAfter: res.retryAfter || 60,
        retriable: true,
        requestId: res.body.request_id,
        orderRef: orderId,
      }
    }

    const code = res.body.error?.code
    return {
      state: 'ERROR',
      message: copy(code, '提交失败，请稍后再试或联系客服'),
      retriable: !(code && TERMINAL_ERRORS.has(code)) && res.body.error?.retryable !== false,
      requestId: res.body.request_id,
      orderRef: orderId,
    }
  },
}

/** 仅供自测使用的内部导出 */
export const __test = {
  buildOrderId,
  detectVariant,
  ORDER_ID_RE,
  VARIANTS,
  ERRORS,
  TERMINAL_ERRORS,
  toResult,
  fromLookup,
  decideCardRoute,
  fmtTime,
}
