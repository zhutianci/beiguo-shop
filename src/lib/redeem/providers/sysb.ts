/**
 * 充值平台适配器：sysb（HongyunAI Partner API v2）。
 *
 * 【和 sysa 是两种完全不同的模型，别照搬】
 *   sysa：无鉴权、可以先查卡、同步出结果
 *   sysb：Bearer Token 鉴权、**文档明确禁止预检卡密**、异步下单后轮询
 *
 * 所以这个适配器的 check() **查不了卡密**：它只能确认服务可用、并让买家
 * 先选充值渠道。真正的结果要等 activate() 下单之后轮询。
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
 * 从**本站商品名**判断这张卡该走哪条充值渠道。
 *
 * 【为什么不去「轮流查三个渠道」】上游的 V2 partner API 根本没有验卡接口，
 * 文档还明确写着「无需提前调用验卡或账户预检」。他们网页上那个验卡步骤走的是
 * /api/v1/sub/verifyCdk、/gateway/claude、/gateway/gpt 三个**内部前端接口**，
 * 不在给代理的授权范围内、随时可能改；而且他们页面自己写着
 * 「验证后会锁定当前 CDK 约 3 分钟」—— 拿买家的卡去挨个试，是在用真卡做探测。
 *
 * 我们手上本来就有更可靠的依据：这张卡是从**我们自己的哪个商品**发出去的，
 * 而商品名里就写着渠道。线上实际的商品名：
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
   * 【这里查不了卡密】上游文档明确写着「无需提前调用验卡或账户预检」，
   * V2 也根本没有验卡接口。所以 check() 做的是另外两件事：
   *   1. 确认服务可用（/account 与 /products 都是只读，不消耗卡密）
   *   2. 把充值渠道列出来让买家选 —— 卡密前缀只说明档位，区分不了通道
   */
  async check(_cdk, ctx): Promise<RedeemCheckResult> {
    /*
     * 【第一件事：看这张卡是不是已经充过了】
     *
     * 上游没有验卡接口，所以「已充过的卡」唯一的判据是我们自己记下的订单号。
     * 有订单号就直接查它，把真实状态显示出来 —— 而不是若无其事地再摆一遍充值表单。
     * 少了这一步，买家会对着一张已经用掉的卡反复填账号、反复提交，
     * 最后以为是我们的系统坏了。
     *
     * 只对「本站充的」有效：卡若是在别处充掉的，我们没有订单号，也就无从得知 ——
     * 这是上游不提供验卡接口的直接后果，不是这里的疏漏。
     */
    const prevRef = ctx?.loadOrderRef ? await ctx.loadOrderRef() : null
    if (prevRef) {
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
     * 【能自动判出渠道就别让买家选】站长的原话：「应该输入卡密之后，直接展示是
     * 哪个渠道的，而不是让买家去选择」。依据是本站商品名，见 detectVariant。
     * 判出来了就只返回这一条渠道 —— 前端看到只有一条时不渲染选择器，
     * 直接出对应的表单与指引。
     */
    const detected = detectVariant(ctx?.productName)
    const hit = detected ? variants.find((v) => v.code === detected) : null
    if (hit) {
      return {
        state: 'READY',
        // 刻意不说「卡密有效」—— 上游没有验卡接口，我们根本没查过，说了就是骗人
        message: `已识别为「${hit.label}」，请按下面的步骤填写要充值的账号`,
        fields: hit.fields,
        guide: hit.guide,
        guideIntro: hit.guideIntro,
        // 仍然把全部渠道带上：万一识别错了，买家可以自己改（默认选中识别出的那条）
        variants,
        variantDefault: hit.code,
        variantLabel: '充值渠道',
        variantHint: '已按你购买的商品自动选好。如果不对，可以点其它渠道切换。',
        notice,
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
      notice,
      requestId: acct.body.request_id,
    }
  },

  async activate({ cdk, values, variant, cardKeyId, loadOrderRef, saveOrderRef }): Promise<RedeemActivateResult> {
    const product = (variant || '') as Product
    if (!VARIANTS.some((v) => v.code === product)) {
      throw new RedeemError('请选择充值渠道', 'ERROR')
    }
    if (typeof cardKeyId !== 'number') {
      // 订单号要靠卡密 id 才能稳定复现，拿不到就不能下单
      throw new RedeemError('兑换服务异常，请联系客服', 'ERROR', false)
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
export const __test = { buildOrderId, detectVariant, ORDER_ID_RE, VARIANTS, ERRORS, TERMINAL_ERRORS, toResult }
