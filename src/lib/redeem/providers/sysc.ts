/**
 * 充值平台适配器：sysc（对方的「兑换中心」，chuanwen.applelll.com）。
 *
 * 【sysd 也用这个文件】对方是多店铺白标系统，niuniu888.applelll.com（sysd）的兑换页
 * 和 chuanwen 逐字节相同，只差店铺标识 ref。协议逻辑只此一份，按店铺配置生成适配器，
 * 见文件末尾的 createStore() 与 providers/sysd.ts。
 *
 * 协议来源：**对方不提供 API 文档，经对方明确授权**，由我们从其兑换中心前端整理。
 * 完整协议见 `docs/sysc-充值系统-协议逆向说明.md` —— 改这个文件之前先读那份文档，
 * 本文件里每一条判定都能在那份文档里找到对应小节。
 *
 * 【它是 sysa 的模型，不是 sysb，别照搬 sysb 的订单号那套】
 *   · 完全匿名：没有 Token、没有签名，凭 CDK 本身
 *   · 可以预先查卡，而且**查卡结果是权威的**（status 字段直接说卡有没有被消耗）
 *   · 异步：下单只是「已受理」，结果要轮询
 *   · 失败会**自动把卡回滚成未使用**，可以重充 —— 和 sysa / sysb 都不一样
 *
 * ================== 四条不能破的规则 ==================
 *
 * 【一】没有幂等键，所以下单前永远先查一次状态。
 * 对方的 `Idempotency-Key` 头是个幌子：它和 X-ASP-Nonce 同值、每次随机，
 * 服务端当 nonce 用，**不是「同值返回上次结果」的幂等语义**。
 * 同一张卡并发 POST 两次就是两笔真实扣款。所以 activate() 里：
 * 先 claimIrreversible() 拿锁 → 再 GET status 确认 active → 才允许 POST。
 * POST 超时**绝不重发 POST**，改去 GET status 问真实结果（见 submitOnce）。
 *
 * 【二】possible_success 既不交付也不重充。
 * 对方原文「余额已变动，可能成功，请等待人工核对」—— 钱已经动了、权益不确定。
 * 当成失败重充 = 扣两次钱；当成成功交付 = 买家拿不到东西。只能停下转人工。
 *
 * 【三】只发剥出来的 UUID 和邮箱，**绝不把整段 session 发给对方**。
 * 对方自己的前端就是这么做的，注释原话：「只送邮箱,不送整段 session
 * (里面有 access token,不该上传落库)」。我们没有理由比对方更松。
 *
 * 【四】不透传对方的 detail / message。
 * 那些文案里带对方的术语，透传出去既泄漏货源，买家也看不懂。
 * 全部按机器可读的 status / task_status 走下面的映射表。
 *
 * 【五】人机校验（2026-10-30 对方新增）绝不绕过，只如实告诉买家。
 * 对方给下单 / 强刷接口加了 Cloudflare Turnstile：body 里要带浏览器方框勾选后得到的一次性
 * `turnstile_token`，而且先于卡密校验（编造的卡也回同一句）。**服务器自己拿不到这个 token**，
 * 要通只有对方配合（放行我们的服务器 IP，或发专用凭据）。这里只做三件事，见 humanCheckRequired()：
 *   · 不让买家白填账号：check() 就把这个状态说清楚，不出表单
 *   · 不误导买家：原来这种拒绝会显示「请核对账号信息」，买家卡#3066 连试 5 次
 *   · 对方一放行就自动恢复：不用改配置、不用发版
 */
import crypto from 'crypto'
import {
  RedeemError,
  type RedeemActivateResult,
  type RedeemCheckResult,
  type RedeemFallback,
  type RedeemField,
  type RedeemGuideStep,
  type RedeemProvider,
  type RedeemState,
} from '../types'

/**
 * 一家「兑换中心」店铺。
 *
 * 【为什么要参数化】对方是一套多店铺的白标系统：同一个前端、同一套协议，按子域分店。
 * 2026-10-24 接入的 sysd（niuniu888.applelll.com）和 sysc（chuanwen）的兑换页
 * **逐字节相同**（md5 一致），差别只有店铺标识 ref。所以协议只写这一份，
 * 每家店一个配置 —— 复制一份适配器，以后对方改协议就得改两遍、漏一遍。
 */
export interface StoreConfig {
  /** 我们的适配器 key（写进 card_keys.redeem_provider，**用了就不能改**） */
  key: string
  /** 只在后台下拉里出现的辨识名 */
  adminLabel: string
  /** 对方站点根地址 */
  base: string
  /**
   * 店铺标识，每个请求都要带。对方前端是从域名里取的：
   * `chuanwen.applelll.com` → `chuanwen`。
   * **换店铺 / 对方给了我们单独的子域时要改这里**（会影响结价与归属）。
   */
  ref: string
  /** 本站商品名 → 对方 product_id 手工映射所在的环境变量名，见 productMap() */
  productMapEnv: string
  /** 追踪号前缀，只为排查时把日志串起来，见 activate() 里的 trace */
  tracePrefix: string
  /**
   * 备用充值地址所在的环境变量名。没配就不给买家按钮（默认），配了才出现。
   * 【默认关】这个按钮会把货源站告诉买家，要不要这么做是站长的决定（types.ts RedeemFallback）。
   */
  fallbackEnv: string
}

const TIMEOUT_MS = 20_000
/** 下单后在 activate() 里顺手等一会儿，接住「1 分钟内就好了」的常见情况 */
const ACTIVATE_WAIT_MS = 18_000
const ACTIVATE_POLL_MS = 3_000


/* ==================== 对方的协议类型 ==================== */

/** 卡密本身的状态。**这是「卡有没有被消耗」的权威字段** */
type CardStatus = 'active' | 'redeeming' | 'redeemed' | 'refunded'
/** 本次充值任务的状态 */
type TaskStatus =
  | 'pending'
  | 'queuing'
  | 'processing'
  | 'retrying'
  | 'success'
  | 'possible_success'
  | 'failed'
  | 'internal_error'
  | 'cancelled'
  | 'timeout'

interface StatusBody {
  /** 只有批量接口返回；单条接口查不到直接 404 */
  found?: boolean
  status?: CardStatus | null
  task_status?: TaskStatus | null
  /** 对方的失败原因原文。**只落日志给客服看，不给买家** */
  message?: string | null
  /** 对方的商品名，如 "GPT5x"。用它反查 product_id 与 platform */
  product_name?: string | null
  redeem_account_id?: string | null
  redeem_email?: string | null
  attempt?: number | null
  /** 对方会自动换号重试；为 true 时 status 仍是 redeeming */
  retried?: boolean
  redeemed_at?: string | null
  history?: { attempt?: number; status?: string; message?: string; updated_at?: string }[]
}

/** 对方商品清单里的一项（GET /api/store/site） */
interface SiteProduct {
  product_id: number
  name: string
  platform: string
  sku: string | null
  recharge_method: number | null
  upstream_pool: string | null
}

interface Store extends StoreConfig {
  /** 商品清单缓存。**每家店各一份** —— 两家店的清单不一样（niuniu888 只有 6 个商品） */
  siteCache: { at: number; products: SiteProduct[]; siteKey: string } | null
  /** 上一次判定「这家店现在要不要人机校验」的结果，见 humanCheckRequired() */
  humanCheck: { at: number; required: boolean } | null
}

/** 我们认识的平台。对方的 platform 字段只见过这三种 */
type Platform = 'gpt' | 'claude' | 'grok'

/* ==================== 文案映射 ==================== */

/**
 * status / task_status → 我们自己的文案。**不透传对方的 message**。
 *
 * 【失败那条必须写明「卡密已回滚，可以重新提交」】对方 FAQ 原话：
 * 「失败会自动回滚 CDK,可重试」。不说清楚，买家会以为卡废了直接开工单。
 */
const COPY = {
  active: '卡密有效，请填写要充值的账号后提交',
  activeAfterFail:
    '上一次充值没有成功，**这张卡密已经退回成未使用状态，可以直接重新提交**。' +
    '如果连续失败，请联系客服。',
  redeeming: '正在为你充值，请稍后回到本页查询结果，不要重复提交',
  redeemed: '充值已完成',
  refunded: '该卡密已退回作废，请联系客服',
  possibleSuccess:
    '本次充值需要人工确认：充值已经发起，但系统未能确认权益是否到账。' +
    '**请不要重复提交**（会重复扣费），请联系客服并提供卡密，我们会为你核对。',
  notFound: '卡密不存在，请检查是否复制完整',
  failed: '充值未成功，卡密已退回成未使用状态，可以重新提交',
  accepted: '已提交，正在为你充值，请稍后回到本页查询结果，不要重复提交',
  unknown: '卡密状态异常，请联系客服',
  unmapped: '该卡密对应的充值渠道暂未配置，请联系客服',
  busy: '操作过于频繁，请稍后再试',
  unavailable: '充值服务暂时不可用，请稍后再试',
  timeout: '充值服务响应超时，请稍后回到本页查询结果，不要重复提交',
  humanCheck:
    '这条充值通道正在升级安全验证，暂时无法在本站提交。**你的卡密有效，没有被消耗**，' +
    '不需要重新复制账号信息，请联系客服处理。',
} as const

/**
 * 对方「人机校验没过」的拒绝文案（2026-10-30 实抓）：
 *   400 {"detail":"人机校验还没完成,请等方框打上勾再点(网络连不上 Cloudflare 时会一直转)"}
 * 没有机器码，只能认文字。后面也可能换成「已过期或重复」这类，所以连 token 相关的词一起认。
 */
const HUMAN_CHECK_RE = /人机|turnstile|captcha/i

function isHumanCheckRejection(detail: string | undefined): boolean {
  return !!detail && HUMAN_CHECK_RE.test(detail)
}

/** 终态失败的 task_status。这几个值出现时，对方已经把卡回滚了 */
const FAILED_TASKS: ReadonlySet<string> = new Set(['failed', 'internal_error', 'cancelled', 'timeout'])

/* ==================== 账号凭据的本地解析 ==================== */

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const UUID_PATTERN = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
const EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/

/**
 * 从「裸 UUID」或「整段 session JSON」里取出账号 ID。
 *
 * 【只认 JSON.parse，不做正则兜底】和对方前端完全一致。正则兜底会在一段
 * session 里抓到第一个长得像 UUID 的东西 —— 很可能是 `user.id` 而不是
 * `account.id`，那是两个不同的 ID，充下去白费一张卡。
 */
function extractId(raw: string): string {
  const v = (raw || '').trim()
  if (!v) return ''
  if (UUID_RE.test(v)) return v
  try {
    const o = JSON.parse(v) as { account?: { id?: unknown } }
    const id = o?.account?.id
    if (typeof id === 'string' && UUID_RE.test(id)) return id
  } catch {
    /* 不是 JSON，原样返回，交给校验报错 */
  }
  return v
}

/**
 * 抠出邮箱。
 *
 * 【为什么必须单独带上】我们只往上游发纯 UUID，对方服务端再也解析不出邮箱，
 * 而「实际充到哪个邮箱」是售后唯一的凭据。对方前端同样是单独带 email 字段。
 */
function extractEmail(raw: string): string | undefined {
  const v = (raw || '').trim()
  if (!v) return undefined
  if (EMAIL_RE.test(v)) return v.slice(0, 255)
  try {
    const o = JSON.parse(v) as Record<string, unknown>
    const user = o.user as { email?: unknown } | undefined
    const account = o.account as { email?: unknown } | undefined
    for (const c of [user?.email, account?.email, o.email]) {
      if (typeof c === 'string' && EMAIL_RE.test(c.trim())) return c.trim().slice(0, 255)
    }
  } catch {
    /* ignore */
  }
  return undefined
}

/** 账号类型判据。**只送这两个字段，不送整段 session** */
function acctMeta(raw: string): { acct_structure?: string; acct_plan?: string } {
  try {
    const o = JSON.parse((raw || '').trim()) as { account?: Record<string, unknown> }
    const a = o?.account
    if (!a || typeof a !== 'object') return {}
    const st = typeof a.structure === 'string' ? a.structure.slice(0, 32) : undefined
    const pv = a.planType ?? a.plan_type ?? a.plan
    return { acct_structure: st, acct_plan: pv ? String(pv).slice(0, 32) : undefined }
  } catch {
    return {}
  }
}

/**
 * 这个账号现在有没有订阅。有就返回档位名（给文案用），没有/判不出返回 null。
 *
 * 【为什么是反向白名单：「不是 free 就算有订阅」】
 * 付费档位的名字会变也会加（plus / pro / go / pro_lite / pro_max…，
 * 对方商品列表里就有 GPTgo），列一张付费名单必然漏。而两种错判的代价差着量级：
 *   · 漏判 → 买家静默损失剩余会员时间，不可恢复，必然是客诉
 *   · 误判 → 多勾一个确认框
 * 所以只认 `free` 是免费，其余一概当成「有订阅」。
 *
 * 【两个来源都看，但先信 JWT —— 这是实测教训，别改回去】
 * session 里有两处写着档位：`account.planType` 和 accessToken JWT 里的
 * `chatgpt_plan_type`。2026-10-19 拿一个真实的已订阅账号对过：
 *   · session 的 `account.planType`      = "plus"      ← **错的**
 *   · 同一份 session 的 JWT claim        = "prolite"   ← 对的
 *   · ChatGPT 官方 accounts/check 接口   = "prolite" / "chatgptprolite"
 * 也就是说 `account.planType` 会过期/不准，而 JWT 那个claim 是 OpenAI 签过名的。
 * 所以**档位名以 JWT 为准**（展示给买家的那句话要说对档位）；
 * 但「是不是付费」两个来源任一命中就算，宁可多问一句，不能漏。
 *
 * 【裸 UUID 判不出来，这是已知局限】拿不到 session 就读不到档位，
 * 只能返回 null 放行。所以这道门**只在 Session 通道有效**，和 sysa 一样。
 * 真要堵死，就只能不给 uid 这条备选通道 —— 那会把拿不到 session 的买家卡死，不值得。
 */
function detectPaidPlan(raw: string): string | null {
  const v = (raw || '').trim()
  if (!v || UUID_RE.test(v)) return null
  let o: Record<string, unknown> | null = null
  try {
    o = JSON.parse(v) as Record<string, unknown>
  } catch {
    return null
  }
  if (!o || typeof o !== 'object') return null

  const paid = (x: unknown): string | null => {
    const s = String(x ?? '').trim().toLowerCase()
    if (!s) return null
    return s === 'free' ? null : s.slice(0, 32)
  }

  // 先问 JWT —— 它是 OpenAI 签过名的，而 account.planType 实测会不准（见上面的说明）
  const tok = o.accessToken ?? o.access_token
  if (typeof tok === 'string' && tok.split('.').length === 3) {
    const pl = b64urlObj(tok.split('.')[1]) || {}
    const au = pl['https://api.openai.com/auth']
    if (au && typeof au === 'object') {
      const hit = paid((au as Record<string, unknown>).chatgpt_plan_type)
      if (hit) return hit
    }
  }
  // JWT 读不出来（或说是 free）时再看 account.planType：
  // 它可能是过期的旧值，但「它说付费」仍然是一条不该忽略的线索
  const a = (o.account && typeof o.account === 'object' ? o.account : {}) as Record<string, unknown>
  for (const k of ['planType', 'plan_type', 'plan'] as const) {
    const hit = paid(a[k])
    if (hit) return hit
  }
  return null
}

const TEAM_WORDS = ['team', 'business', 'enterprise', 'workspace', 'edu']
function planIsTeam(v: unknown): string | null {
  const s = String(v ?? '').trim().toLowerCase()
  return s && TEAM_WORDS.some((w) => s.includes(w)) ? s.slice(0, 32) : null
}
function b64urlObj(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
  } catch {
    return null
  }
}

/**
 * GPT 的 Team / 企业工作区判据。命中就**在本地直接拒**，别浪费一张卡。
 *
 * 【宁可漏判也不能误拒】拿不到明确判据一律放行，不做文本正则兜底 ——
 * 误拒一个正常个人号，买家手上那张卡就卡死在这里，而他什么也做不了。
 * 返回值是证据字符串（只进日志，不给买家看原文）。
 */
function teamEvidence(raw: string): string | null {
  const v = (raw || '').trim()
  if (!v || UUID_RE.test(v)) return null
  let o: Record<string, unknown> | null = null
  try {
    o = JSON.parse(v) as Record<string, unknown>
  } catch {
    return null
  }
  if (!o || typeof o !== 'object') return null

  const accs: Record<string, unknown>[] = []
  if (o.account && typeof o.account === 'object') accs.push(o.account as Record<string, unknown>)
  const m = o.accounts
  const vals = Array.isArray(m) ? m : m && typeof m === 'object' ? Object.values(m) : []
  for (const x of vals) {
    if (x && typeof x === 'object') {
      const inner = (x as Record<string, unknown>).account
      accs.push((inner && typeof inner === 'object' ? inner : x) as Record<string, unknown>)
    }
  }
  for (const a of accs) {
    const st = String(a.structure ?? '').trim().toLowerCase()
    if (st && st !== 'personal') return `structure=${st.slice(0, 32)}`
    for (const k of ['planType', 'plan_type', 'plan'] as const) {
      const p = planIsTeam(a[k])
      if (p) return `${k}=${p}`
    }
  }
  const tok = o.accessToken ?? o.access_token
  if (typeof tok === 'string' && tok.split('.').length === 3) {
    const pl = b64urlObj(tok.split('.')[1]) || {}
    const au = pl['https://api.openai.com/auth']
    if (au && typeof au === 'object') {
      const p = planIsTeam((au as Record<string, unknown>).chatgpt_plan_type)
      if (p) return `chatgpt_plan_type=${p}`
    }
  }
  return null
}

/* ==================== 买家要填什么 ==================== */

function fieldsFor(platform: Platform): RedeemField[] {
  switch (platform) {
    case 'gpt':
      return [
        {
          name: 'session_json',
          kind: 'session_json',
          label: 'ChatGPT 账号 Session（推荐）',
          help:
            '登录 chatgpt.com 后打开 chatgpt.com/api/auth/session，把整段 JSON 完整复制进来。' +
            '我们只会从里面取出账号 ID 和邮箱，**不会把整段内容发给充值系统**。' +
            '账号需为个人版（不支持 Team / 企业工作区）。',
          placeholder: '{"accessToken":"ey...","user":{...},"account":{...}}',
          required: false,
          multiline: true,
        },
        {
          name: 'uid',
          kind: 'uuid',
          label: '账号 ID（备选）',
          help:
            '仅在拿不到 Session 时使用，填 chatgpt.com/api/auth/session 里的 account.id' +
            '（**不是 user.id**）。此方式无法核对账号归属与订阅状态，填错无法撤回。',
          placeholder: '96eae38f-b751-4079-b116-484bd746c477',
          pattern: UUID_PATTERN,
          required: false,
        },
        /*
         * 【这道门是我们自己加的，对方协议里没有】
         * 账号已有订阅时在它上面充值，原有会员的剩余时间很可能作废、也可能直接充不进去。
         * 不给这个开关，买家一提交就可能静默损失一段已经付过钱的会员时间。
         *
         * 【比 sysa 那套好在哪】sysa 是**被动**的：先提交、上游回
         * account.plan_not_allowed、买家才看到要勾这个框、再提交一次 —— 白费一次尝试。
         * 我们是**主动**的：从买家粘的 session 里当场读出档位（detectPaidPlan），
         * 在拿锁和发请求之前就拦下。拦下时卡密一点没动。
         *
         * 【只对 Session 通道有效】裸 UUID 读不出档位，见 detectPaidPlan 的说明。
         *
         * 【文案不敢把话说满】我们**没有验证过** sysc 收到一个已订阅的号会怎么处理
         * （覆盖？叠加？拒绝？对方前端根本不检查这个字段，无从推断）。
         * 所以说「可能作废」而不是「会作废」—— 等拿一张卡在已订阅的号上实测过再改。
         * 同理，force **不发给对方**：那是个没见过的参数，发过去可能直接 400。
         * 它只是我们这边的知情同意闸。
         */
        {
          name: 'force',
          kind: 'toggle',
          label: '账号已有订阅时，仍然强制充值',
          help:
            '只有在提示「这个账号已经有订阅」时才需要勾。在已有订阅的账号上充值，' +
            '原有会员的剩余时间**可能会作废、也可能充不进去，且不可恢复**。' +
            '如果你的账号现在没有订阅，不用管这一项。',
          required: false,
        },
      ]
    case 'claude':
      return [
        {
          name: 'session_key',
          kind: 'session_key',
          label: 'Claude SessionKey（推荐）',
          help:
            '登录 claude.ai 后，在浏览器 Cookie 里取 sessionKey，以 sk-ant-sid 开头。' +
            '用它可以在扣卡之前检查账号状态，避免「卡扣了订阅没到」。',
          placeholder: 'sk-ant-sid...',
          pattern: '^(sessionKey=)?sk-ant-sid',
          required: false,
          multiline: true,
        },
        {
          name: 'uid',
          kind: 'uuid',
          label: 'Organization ID（备选）',
          help:
            'Claude 账号 Settings → Account 页面里的 Organization ID。' +
            '此方式无法预先检查账号状态，账号异常时卡密会被消耗但订阅不到账。',
          placeholder: '96eae38f-b751-4079-b116-484bd746c477',
          pattern: UUID_PATTERN,
          required: false,
        },
      ]
    case 'grok':
      return [
        {
          name: 'uid',
          kind: 'uuid',
          label: 'Grok 账号 UID',
          help: '登录后打开 grok.com/api/auth/session，取其中的 session.userId；也可以把整段 JSON 粘进来。',
          placeholder: 'b8065aa5-03a3-4a78-9b88-88159f2d55b3',
          required: true,
          multiline: true,
        },
      ]
  }
}

function guideFor(platform: Platform): { intro: string; steps: RedeemGuideStep[] } {
  if (platform === 'gpt') {
    return {
      intro: '跟着 4 步完成：先确认卡密，再登录账号取一段 Session 信息贴进来。',
      steps: [
        { title: '确认卡密', detail: '上一步已经查过了，确认上面显示的商品与你购买的一致。' },
        {
          title: '登录 ChatGPT',
          detail: '先登录要充值的那个 ChatGPT 账号，确保处于已登录状态。个人版账号才能充，Team / 企业工作区不行。',
          link: { label: '打开 ChatGPT', url: 'https://chatgpt.com/' },
        },
        {
          title: '获取 Session 信息',
          detail: '登录状态下打开下面这个地址，把页面上**整段 JSON** 全选复制（不要只复制其中一段）。',
          link: { label: '打开 Session 页面', url: 'https://chatgpt.com/api/auth/session' },
        },
        { title: '粘贴并提交', detail: '把整段 JSON 粘进下面的输入框，确认账号无误后提交，通常 1-3 分钟到账。' },
      ],
    }
  }
  if (platform === 'grok') {
    return {
      intro: '跟着 3 步完成：登录 Grok 后取一个用户 UUID 贴进来。',
      steps: [
        { title: '确认卡密', detail: '上一步已经查过了，确认上面显示的商品与你购买的一致。' },
        {
          title: '获取用户 UUID',
          detail: '登录状态下打开下面这个地址，复制里面的 session.userId；也可以把整段 JSON 粘进来。',
          link: { label: '打开 Session 页面', url: 'https://grok.com/api/auth/session' },
        },
        { title: '粘贴并提交', detail: '把 UUID 粘进下面的输入框，确认无误后提交，通常 1-3 分钟到账。' },
      ],
    }
  }
  return {
    intro: '跟着 6 步完成：登录 Claude 后，从浏览器开发者工具里复制 sessionKey。',
    steps: [
      { title: '确认卡密', detail: '上一步已经查过了，确认上面显示的商品与你购买的一致。' },
      {
        title: '登录 Claude',
        detail: '打开 claude.ai，登录要充值的那个账号。',
        link: { label: '打开 Claude', url: 'https://claude.ai/' },
      },
      { title: '打开开发者工具', detail: '按 F12，切到顶部的「Application / 应用」面板。' },
      { title: '进入 Cookies', detail: '左侧 Storage → Cookies → 点 https://claude.ai。' },
      { title: '复制 sessionKey', detail: '在列表里找到名为 sessionKey 的那一行，复制它完整的 Value（sk-ant-sid… 开头）。' },
      { title: '粘贴并提交', detail: '把复制的内容粘进下面的输入框，确认无误后提交。' },
    ],
  }
}

/* ==================== HTTP ==================== */

/**
 * 写请求必须带的三个头。**这不是签名** —— 对方没有密钥、没有 HMAC，
 * 只是时间戳 + 随机数防重放，照着对方前端逐字抄。
 *
 * 【Idempotency-Key 与 nonce 同值是刻意的】对方前端就是同一个随机值塞两个头。
 * 它在服务端被当 nonce 校验，**不是幂等键**，所以我们也不给它一个确定性的值 ——
 * 万一服务端真的拒绝重复 nonce，确定性的键会让正常重试全部失败。
 * 防重复扣卡靠 activate() 里的「先拿锁 + 先查状态」，不靠这个头。
 */
function aspHeaders(): Record<string, string> {
  const nonce = crypto.randomBytes(18).toString('base64url')
  return {
    'Content-Type': 'application/json',
    'X-ASP-Timestamp': String(Math.floor(Date.now() / 1000)),
    'X-ASP-Nonce': nonce,
    'Idempotency-Key': nonce,
  }
}

interface RawResult {
  status: number
  body: Record<string, unknown>
}

async function request(
  s: Store,
  path: string,
  init: { method: 'GET' | 'POST'; payload?: Record<string, unknown>; timeoutMs?: number }
): Promise<RawResult> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), init.timeoutMs ?? TIMEOUT_MS)
  try {
    const res = await fetch(`${s.base}${path}`, {
      method: init.method,
      headers: init.method === 'POST' ? aspHeaders() : { Accept: 'application/json' },
      body: init.payload ? JSON.stringify(init.payload) : undefined,
      signal: ac.signal,
      /*
       * 【no-store 一个字都不能少】App Router 会把裸 fetch 的响应写进磁盘数据缓存
       * 并无限期复用。这里要是被缓存住：「已受理」的响应会被回放给后面每一个
       * 提交同样参数的人，而卡密其实根本没提交出去。
       * 2026-09-09 那次两天的静默宕机就是这个坑。
       */
      cache: 'no-store',
    })
    const text = await res.text()
    let body: Record<string, unknown> = {}
    try {
      body = text ? (JSON.parse(text) as Record<string, unknown>) : {}
    } catch {
      /*
       * Cloudflare 的 5xx 会返回 HTML，限流可能只返回一句话。
       * 不能崩，也不能把对方的原始内容吐给买家。
       */
      throw new RedeemError(res.status === 429 ? COPY.busy : COPY.unavailable, 'ERROR')
    }
    return { status: res.status, body }
  } catch (e) {
    if (e instanceof RedeemError) throw e
    const msg = e instanceof Error ? e.message : String(e)
    throw new RedeemError(/abort/i.test(msg) ? COPY.timeout : '无法连接充值服务，请稍后再试', 'ERROR')
  } finally {
    clearTimeout(timer)
  }
}

/* ==================== 商品清单（带缓存） ==================== */

const SITE_TTL_MS = 10 * 60_000

/**
 * 拉对方的商品清单。**这是把 product_name 翻译成 product_id / platform 的唯一依据**。
 * 拉不到就返回上一次的缓存（哪怕过期）—— 清单拿不到不该挡住一次正常兑换。
 */
async function siteProducts(s: Store): Promise<SiteProduct[]> {
  if (s.siteCache && Date.now() - s.siteCache.at < SITE_TTL_MS) return s.siteCache.products
  try {
    const r = await request(s, `/api/store/site?ref=${encodeURIComponent(s.ref)}`, { method: 'GET' })
    const list = Array.isArray(r.body.products) ? (r.body.products as SiteProduct[]) : []
    const products = list.filter((p) => typeof p?.product_id === 'number' && typeof p?.name === 'string')
    if (products.length) {
      const siteKey = typeof r.body.turnstile_site_key === 'string' ? r.body.turnstile_site_key.trim() : ''
      s.siteCache = { at: Date.now(), products, siteKey }
      return products
    }
  } catch {
    /* 落到下面用旧缓存 */
  }
  return s.siteCache?.products ?? []
}

function normPlatform(pf: string | null | undefined): Platform | null {
  const s = (pf || '').toLowerCase()
  if (s === 'gpt' || s === 'chatgpt') return 'gpt'
  if (s === 'claude' || s === 'claude_pro') return 'claude'
  if (s === 'grok') return 'grok'
  return null
}

/**
 * 站长在后台导入时，本站商品名 → 对方 product_id 的手工映射。
 * 形如 `{"GPT Pro 5x 月付":5}`。**只在对方的查卡结果没带 product_name 时才用得上**。
 */
function productMap(s: Store): Record<string, number> {
  const raw = (process.env[s.productMapEnv] || '').trim()
  if (!raw) return {}
  try {
    const o = JSON.parse(raw) as Record<string, unknown>
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(o)) {
      const n = Number(v)
      if (Number.isInteger(n) && n > 0) out[k.trim()] = n
    }
    return out
  } catch {
    console.error(`[${s.key}] ${s.productMapEnv} 不是合法 JSON，已忽略`)
    return {}
  }
}

interface Resolved {
  productId: number
  platform: Platform
  /** 展示给买家的商品名。用**我们自己的**商品名，不用对方的 */
  label?: string
}

/**
 * 判定这张卡该用对方的哪个 product_id、要填哪个平台的字段。
 *
 * 优先级（从最权威到最兜底）：
 *   1. 对方查卡结果里的 product_name —— 卡本身绑的商品，最可信
 *   2. SYSC_PRODUCT_MAP（sysd 是 SYSD_PRODUCT_MAP）里按本站商品名配的死映射
 *   3. 本站商品名与对方商品名做一次保守的包含匹配
 * 三条都不中就返回 null，由调用方报「渠道未配置」转人工 ——
 * **绝不猜一个 product_id 发出去**，猜错就是把 5x 的卡充成 plus。
 */
async function resolveProduct(
  s: Store,
  upstreamName: string | null | undefined,
  ourName: string | null | undefined
): Promise<Resolved | null> {
  const products = await siteProducts(s)
  if (!products.length) return null

  const up = (upstreamName || '').trim().toLowerCase()
  if (up) {
    const hit = products.find((p) => p.name.trim().toLowerCase() === up)
    const pf = hit ? normPlatform(hit.platform) : null
    if (hit && pf) return { productId: hit.product_id, platform: pf }
  }

  const our = (ourName || '').trim()
  if (our) {
    const mapped = productMap(s)[our]
    if (mapped) {
      const hit = products.find((p) => p.product_id === mapped)
      const pf = hit ? normPlatform(hit.platform) : null
      if (hit && pf) return { productId: hit.product_id, platform: pf, label: our }
    }
    /*
     * 保守的包含匹配：**必须是对方商品名出现在我们的商品名里**，且长度 ≥ 4。
     * 反向匹配（我们的名字出现在对方名字里）不做 —— 我们的商品名通常更长更花，
     * 反向会命中一堆无关项。长度门槛是为了挡住 "5x" 这种会同时命中
     * GPT5x / Claude 5x 的短串。
     */
    const lowOur = our.toLowerCase()
    const cands = products.filter((p) => {
      const n = p.name.trim().toLowerCase()
      return n.length >= 4 && lowOur.includes(n)
    })
    // 只有唯一命中才算 —— 多个命中说明判据不足，宁可转人工
    if (cands.length === 1) {
      const pf = normPlatform(cands[0].platform)
      if (pf) return { productId: cands[0].product_id, platform: pf, label: our }
    }
  }
  return null
}

/* ==================== 状态判定 ==================== */

/**
 * 把对方的 status / task_status 收敛成我们的状态。
 *
 * 【判定顺序和对方前端不一样，这是刻意的】对方的 classifyStatus 把
 * 「task_status 是终态失败」排在「status === active」之前，所以失败后显示红色报错。
 * 但我们的兑换页**只有 state === 'READY' 才渲染提交表单**，照抄那个顺序会让
 * 「失败已回滚、本来可以重充」的卡在我们站上变成一张死卡 —— 买家只能开工单。
 *
 * 所以我们以 `status`（卡有没有被消耗）为准：它回到 active 就是 READY，
 * 顺带把上次失败的事说清楚。
 *
 * 【但 possible_success 必须排在 active 之前】那一格钱已经动了，
 * 哪怕对方把卡回滚成 active 也绝不能让买家再提交一次。
 */
function classify(b: StatusBody): { state: RedeemState; message: string } {
  const st = b.status || ''
  const ts = b.task_status || ''

  if (b.found === false) return { state: 'NOT_FOUND', message: COPY.notFound }
  if (st === 'redeemed' || ts === 'success') return { state: 'COMPLETED', message: COPY.redeemed }
  if (st === 'refunded') return { state: 'VOID', message: COPY.refunded }
  // 顺序敏感：见上面的说明，这一条必须在 active 之前
  if (ts === 'possible_success') return { state: 'PROCESSING', message: COPY.possibleSuccess }
  if (st === 'redeeming') return { state: 'PROCESSING', message: COPY.redeeming }
  if (st === 'active') {
    return { state: 'READY', message: FAILED_TASKS.has(ts) ? COPY.activeAfterFail : COPY.active }
  }
  if (FAILED_TASKS.has(ts)) {
    /*
     * 走到这说明「任务失败了，但卡没回到 active」—— 协议里不该出现的组合。
     * 不敢当成可重试（可能卡已经被消耗），交人工。
     */
    return { state: 'ERROR', message: COPY.unknown }
  }
  return { state: 'ERROR', message: COPY.unknown }
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

/**
 * 查一张卡的状态。
 *
 * 【404 要翻译成 found:false，不能当成网络错误】对方单条接口查不到卡时直接
 * 404 + `{"detail":"CDK 无效"}`，而批量接口是 200 + `found:false`。
 * 统一成后者的形状，下游只认一套。
 */
async function fetchStatus(s: Store, cdk: string): Promise<StatusBody> {
  const r = await request(
    s,
    `/api/store/redeem/status?ref=${encodeURIComponent(s.ref)}&cdk=${encodeURIComponent(cdk)}`,
    { method: 'GET' }
  )
  if (r.status === 404) return { found: false }
  if (r.status === 429) throw new RedeemError(COPY.busy, 'ERROR')
  if (r.status >= 500) throw new RedeemError(COPY.unavailable, 'ERROR')
  if (r.status !== 200) throw new RedeemError(COPY.unavailable, 'ERROR')
  return { found: true, ...(r.body as StatusBody) }
}

/** 批量查。给对账脚本用，兑换链路不走这里 */
async function statusBatch(s: Store, cdks: string[]): Promise<StatusBody[]> {
  if (!cdks.length) return []
  if (cdks.length > 100) throw new RedeemError('一次最多查 100 张卡密', 'ERROR', false)
  const r = await request(s, '/api/store/redeem/status-batch', {
    method: 'POST',
    payload: { ref: s.ref, cdks },
  })
  if (r.status !== 200) throw new RedeemError(COPY.unavailable, 'ERROR')
  return Array.isArray(r.body.results) ? (r.body.results as StatusBody[]) : []
}

/* ==================== 人机校验 ==================== */

/** 判定结果缓存多久。要校验时短一点（对方放行后 5 分钟内恢复）；不要时长一点（少发探测） */
const HUMAN_CHECK_TTL = { required: 5 * 60_000, clear: 30 * 60_000 } as const
const HUMAN_CHECK_PROBE_TIMEOUT_MS = 8_000
/** 探测用的卡密。**不可能是真卡**：上游的卡都是 VCK-XXXX-XXXX-XXXX，这个多一段还是全 Z */
const HUMAN_CHECK_PROBE_CDK = 'ZZZZ-NOT-A-REAL-CARD-0000'

/**
 * 这家店现在会不会因为人机校验拒绝**我们这台服务器**的提交。
 *
 * 【为什么不能只看 turnstile_site_key】那个字段说明对方开了校验，但对方给我们放行之后
 * （我们的 IP 跳过校验）它照样有值。只看它，放行了我们还以为不通；非要配个开关的话又多一件要记住的事。
 *
 * 【所以发一个编造卡密的请求问一下】2026-10-30 实测对方**先验 token、后验卡密**，
 * 不带 token 发一张假卡：要校验 → 回人机校验那句；已放行 → 回卡密无效。两种都碰不到任何真卡，
 * 没有副作用。只在 site key 非空、且缓存过期时才发。
 *
 * 【问不到就当不需要】超时 / 网关错误不下结论、不缓存，让买家正常走，
 * 真被拒了 submitOnce 还会接住。不能因为一次网络抖动把通道说成不可用。
 */
async function humanCheckRequired(s: Store): Promise<boolean> {
  await siteProducts(s)
  if (!s.siteCache?.siteKey) {
    s.humanCheck = null
    return false
  }
  const c = s.humanCheck
  if (c && Date.now() - c.at < (c.required ? HUMAN_CHECK_TTL.required : HUMAN_CHECK_TTL.clear)) return c.required
  try {
    const r = await request(s, '/api/store/redeem', {
      method: 'POST',
      timeoutMs: HUMAN_CHECK_PROBE_TIMEOUT_MS,
      payload: {
        ref: s.ref,
        cdk: HUMAN_CHECK_PROBE_CDK,
        product_id: s.siteCache.products[0]?.product_id ?? 0,
        account_id: '00000000-0000-4000-8000-000000000000',
      },
    })
    // 网关错误 / 限流说明不了校验的事，不下结论
    if (r.status >= 500 || r.status === 429) return false
    const required = isHumanCheckRejection(str(r.body.detail))
    s.humanCheck = { at: Date.now(), required }
    return required
  } catch {
    return false
  }
}

/** 对方拒了 / 判定为要校验时给买家的结果。备用地址没配就没有按钮 */
function fallbackOf(s: Store): RedeemFallback | undefined {
  const url = (process.env[s.fallbackEnv] || '').trim()
  if (!/^https:\/\//i.test(url)) return undefined
  let host = ''
  try {
    host = new URL(url).host
  } catch {
    return undefined
  }
  return {
    text: '本站这条充值通道暂时无法提交。你的卡密有效、没有被消耗，可以直接到下面的网站完成充值。',
    label: `前往 ${host} 充值`,
    url,
  }
}

/* ==================== 提交参数 ==================== */

interface AccountArgs {
  account_id?: string
  session_key?: string
  email?: string
  acct_structure?: string
  acct_plan?: string
}

/**
 * 把买家填的东西翻译成对方的参数，并强制 either/or 规则。
 *
 * 【同时填了只发一个】对方没说清优先级，所以我们自己定：Session / SessionKey 优先。
 * 把两个都发过去、让买家以为 uid 生效而实际用了 session，是最难解释的一类客诉。
 */
function pickAccountArgs(platform: Platform, values: Record<string, string>): AccountArgs {
  const sk = (values.session_key || '').trim()
  const sj = (values.session_json || '').trim()
  const uid = (values.uid || '').trim()

  if (platform === 'claude') {
    /*
     * 【SessionKey 通道更安全，但要把 key 转发给对方】
     * 对方服务端拿 sessionKey 去 claude.ai 查 organization uuid，
     * 号被封 / 风控 / key 失效都会在**扣卡之前**被拦下。
     * 这是唯一一处我们会把凭据本体发给上游的地方，而它换来的是「不会白扣一张卡」。
     */
    if (sk) {
      if (!/^(sessionKey=)?sk-/.test(sk)) throw new RedeemError('SessionKey 格式不对，应以 sk-ant-sid 开头', 'ERROR')
      return { session_key: sk.replace(/^sessionKey=/, '') }
    }
    if (uid) {
      const id = extractId(uid)
      if (!UUID_RE.test(id)) throw new RedeemError('Organization ID 格式不正确，应为标准 UUID', 'ERROR')
      return { account_id: id }
    }
    throw new RedeemError('请填写 Claude SessionKey 或 Organization ID', 'ERROR')
  }

  if (platform === 'grok') {
    const id = extractId(uid)
    if (!id) throw new RedeemError('请填写 Grok 账号 UID', 'ERROR')
    if (!UUID_RE.test(id)) throw new RedeemError('账号 UID 格式不正确，应为标准 UUID', 'ERROR')
    return { account_id: id, email: extractEmail(uid) }
  }

  // gpt
  const raw = sj || uid
  if (!raw) throw new RedeemError('请填写 ChatGPT 账号 Session 或账号 ID', 'ERROR')

  /*
   * 【Team / 企业号在这里就拒掉】充下去必然白费一张卡，而对方那边不一定会拦。
   * 证据字符串不回给买家（里面是对方账号的内部字段），只给一句人话。
   */
  const ev = teamEvidence(raw)
  if (ev) {
    throw new RedeemError(
      '这个账号是 Team / 企业工作区账号，不支持充值。请换一个**个人版**账号后重试（卡密没有被消耗）。',
      'ERROR'
    )
  }

  const id = extractId(raw)
  if (!UUID_RE.test(id)) {
    throw new RedeemError(
      sj
        ? '没能从这段内容里读出账号 ID。请确认复制的是 chatgpt.com/api/auth/session 页面上的**整段 JSON**（卡密没有被消耗）。'
        : '账号 ID 格式不正确，应为标准 UUID',
      'ERROR'
    )
  }

  /*
   * 【已有订阅 → 必须勾了强制才放行】见 fieldsFor 里 force 那一项的说明。
   * 这里 throw 掉的时候：锁没拿、请求没发、卡密一点没动 ——
   * 因为 activate() 里 pickAccountArgs 排在 claimIrreversible 之前。
   */
  const plan = detectPaidPlan(raw)
  if (plan && (values.force || '').trim() !== '1') {
    throw new RedeemError(
      `这个账号现在已经有订阅（档位：${plan}）。充值会**直接覆盖**当前订阅，` +
        `原有会员的剩余时间会作废，且不可恢复。\n\n` +
        `如果你确认要继续，请勾选下面的「账号已有订阅时，仍然强制充值」再提交。\n` +
        `如果不想冒这个风险，请换一个没有订阅的账号，或等当前会员到期后再充。\n\n` +
        `（**这张卡密没有被消耗**，可以直接重新提交。）`,
      'ERROR'
    )
  }

  return { account_id: id, email: extractEmail(raw), ...acctMeta(raw) }
}

/* ==================== 下单 ==================== */

/**
 * 发一次下单请求，并把「超时了不知道有没有落地」这件事处理掉。
 *
 * 【POST 超时绝不重发 POST】对方没有幂等键，重发就是第二笔扣款。
 * 改成去查状态问真实结果 —— 对方的按卡查状态是权威且实时的，
 * 这是 sysc 比 sysb 好做的地方，代价是绝不能省掉这次查询。
 */
async function submitOnce(s: Store, payload: Record<string, unknown>, cdk: string): Promise<
  { landed: true; accountId?: string; email?: string } | { landed: false; message: string; humanCheck?: boolean }
> {
  try {
    const r = await request(s, '/api/store/redeem', { method: 'POST', payload })
    if (r.status === 200) {
      // 真实提交被受理，说明这台服务器现在不用过人机校验
      s.humanCheck = { at: Date.now(), required: false }
      return { landed: true, accountId: str(r.body.account_id), email: str(r.body.email) }
    }
    /*
     * 非 200 = 对方当场拒了，卡没动。
     * **不透传 detail**（那是对方的原文），只落日志。
     */
    const detail = str(r.body.detail)
    if (detail) console.error(`[${s.key}] 下单被拒 status=${r.status} detail=${detail}`)
    if (isHumanCheckRejection(detail)) {
      s.humanCheck = { at: Date.now(), required: true }
      return { landed: false, message: COPY.humanCheck, humanCheck: true }
    }
    if (r.status === 429) return { landed: false, message: COPY.busy }
    if (r.status >= 500) return { landed: false, message: COPY.unavailable }
    return {
      landed: false,
      message: '充值系统拒绝了本次提交，请核对账号信息后重试；若反复失败请联系客服（卡密没有被消耗）',
    }
  } catch (e) {
    /*
     * 超时 / 断网：**不知道**有没有落地。去查一次状态。
     * 查出 active 才敢说「没落地」；其余一律当成落地了，交给轮询。
     */
    try {
      const st = await fetchStatus(s, cdk)
      if (st.found !== false && st.status && st.status !== 'active') {
        return { landed: true, accountId: str(st.redeem_account_id), email: str(st.redeem_email) }
      }
    } catch {
      /* 连查都查不动，按下面的「说不清」处理 */
    }
    if (e instanceof RedeemError && e.message === COPY.timeout) {
      throw new RedeemError(COPY.timeout, 'PROCESSING', true)
    }
    throw e
  }
}

/**
 * 确认上游没动这张卡之后，把并发占位放掉。
 *
 * 【为什么非做不可】占位要 15 分钟才过期，而 sysc 有两种「卡还在、可以立刻重充」的情况：
 *   · 上游当场拒了（账号 ID 填错、Team 号）—— 卡一点没动
 *   · 充值失败，上游**自动把卡回滚成未使用** —— 这是 sysc 和另两家最不一样的地方
 * 两种都是「好卡 + 已经改对的输入」，不放锁就只能干等 15 分钟，必然来工单。
 *
 * 【举证责任在这里】`releaseIrreversible` 自己不做任何检查，所以这个函数必须
 * 向上游问一次。只有 `status === 'active'` 且不是 possible_success 才敢放 ——
 * 查不动、或者状态对不上，就**保留锁**：宁可让买家等 15 分钟，
 * 也不能在一张可能已经提交出去的卡上放开闸门。
 */
async function releaseIfUntouched(
  s: Store,
  cdk: string,
  trace: string,
  release: (() => Promise<void>) | undefined
): Promise<void> {
  if (!release) return
  try {
    const after = await fetchStatus(s, cdk)
    if (after.found !== false && after.status === 'active' && after.task_status !== 'possible_success') {
      await release()
      return
    }
    console.error(`[${s.key}] 卡状态不是 active，保留占位 trace=${trace} status=${after.status ?? 'null'}`)
  } catch {
    console.error(`[${s.key}] 查不动状态，保留占位 trace=${trace}`)
  }
}

/** 下单后短暂等一会儿，接住「很快就好了」的情况。等不到就返回 null，交给前端轮询 */
async function waitShortly(s: Store, cdk: string): Promise<StatusBody | null> {
  const deadline = Date.now() + ACTIVATE_WAIT_MS
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, ACTIVATE_POLL_MS))
    try {
      const st = await fetchStatus(s, cdk)
      const c = classify(st)
      if (c.state === 'COMPLETED' || (st.task_status && FAILED_TASKS.has(st.task_status))) return st
      if (st.task_status === 'possible_success') return st
    } catch {
      /* 查不动就继续等，别把一次下单成功判成失败 */
    }
  }
  return null
}

/* ==================== 适配器 ==================== */

function makeProvider(s: Store): RedeemProvider {
  return {
    key: s.key,
    /** 辨识名：只在后台导入卡密的下拉里出现，买家侧永远看不到 */
    adminLabel: s.adminLabel,

    async check(cdk, ctx): Promise<RedeemCheckResult> {
      const st = await fetchStatus(s, cdk)
      const { state, message } = classify(st)

      if (state !== 'READY') {
        return {
          state,
          message,
          // 商品名用我们自己的，不回对方的 product_name（那是货源信息）
          productName: ctx?.productName || undefined,
          fields: [],
          account: str(st.redeem_email) || str(st.redeem_account_id),
          completedAt: str(st.redeemed_at),
          notice: null,
        }
      }

      const resolved = await resolveProduct(s, st.product_name, ctx?.productName)
      if (!resolved) {
        /*
         * 卡是好的、能充，但我们判不出该发哪个 product_id。
         * **不猜**：猜错就是把 5x 的卡充成 plus。转人工，并在日志里留下线索。
         */
        console.error(
          `[${s.key}] 判不出 product_id：upstream_name=${st.product_name ?? 'null'} our_name=${ctx?.productName ?? 'null'}` +
            `（在 ${s.productMapEnv} 里补一条映射即可）`
        )
        return { state: 'ERROR', message: COPY.unmapped, fields: [], notice: null }
      }

      /*
       * 【别让买家白填】卡是好的，但这次提交注定被对方的人机校验拒掉。
       * 用 COOLDOWN 不用 ERROR：这不是卡或买家的问题，页面上是黄色提示，不是红色报错；
       * fields 为空所以不出表单。对方放行后最多 5 分钟自动恢复，见 humanCheckRequired()。
       */
      if (await humanCheckRequired(s)) {
        return {
          state: 'COOLDOWN',
          message: COPY.humanCheck,
          productName: ctx?.productName || undefined,
          fields: [],
          notice: null,
          fallback: fallbackOf(s),
        }
      }

      const g = guideFor(resolved.platform)
      return {
        state: 'READY',
        message,
        productName: ctx?.productName || undefined,
        fields: fieldsFor(resolved.platform),
        guide: g.steps,
        guideIntro: g.intro,
        notice: null,
      }
    },

    async activate({
      cdk,
      values,
      cardKeyId,
      productName,
      claimIrreversible,
      releaseIrreversible,
      saveOrderRef,
    }): Promise<RedeemActivateResult> {
      /*
       * ============ 第一道闸：并发锁 ============
       * 对方没有幂等键，同一张卡并发提交两次就是两笔真实扣款。
       * 先读再写挡不住并发，必须靠数据库那条
       * `WHERE redeem_lock_at IS NULL` 的 UPDATE 来裁决。
       */
      if (typeof cardKeyId !== 'number' || !claimIrreversible) {
        throw new RedeemError('兑换服务异常，请联系客服', 'ERROR', false)
      }

      /*
       * ============ 第二道闸：下单前先查状态 ============
       * 这一步不能省。它同时回答两件事：这张卡现在能不能充、该发哪个 product_id。
       */
      const pre = await fetchStatus(s, cdk)
      const preState = classify(pre)
      if (preState.state !== 'READY') {
        /*
         * 已完成 / 处理中 / possible_success / 已退回 —— 一律**不提交**。
         * 抛 RedeemError 让 service.ts 的 toActivateFailure 保住
         * COMPLETED / PROCESSING 这些状态，别染成红色报错。
         */
        throw new RedeemError(preState.message, preState.state, false)
      }

      const resolved = await resolveProduct(s, pre.product_name, productName)
      if (!resolved) {
        console.error(
          `[${s.key}] activate 判不出 product_id：upstream_name=${pre.product_name ?? 'null'} our_name=${productName ?? 'null'}`
        )
        throw new RedeemError(COPY.unmapped, 'ERROR', false)
      }

      // 凭据解析放在拿锁之前：格式不对、Team 号这类情况卡根本没动，不该白占一把锁
      const args = pickAccountArgs(resolved.platform, values)

      // 同理：已经知道会被人机校验拒掉，就别占锁、别发一次注定失败的提交
      if (await humanCheckRequired(s)) {
        return { state: 'ERROR', message: COPY.humanCheck, retriable: false, fallback: fallbackOf(s) }
      }

      const got = await claimIrreversible()
      if (!got) {
        /*
         * 抢不到锁只能证明「15 分钟内有过一次提交尝试」，**证明不了那次真的提交到了对方**。
         * 好在上面刚查过状态：卡还是 active 就说明上一次多半没提交成功。
         */
        throw new RedeemError(
          '这张卡密在 15 分钟内有过一次提交尝试，为防止重复扣卡被暂时锁定。' +
            '**经向充值系统核对，这张卡密仍未被消耗**。请稍等一会儿点「查询」确认，不要直接重复提交。',
          'PROCESSING',
          true
        )
      }

      /*
       * 【下单之前先把追踪号落库】对方不给订单号，我们用「卡 id + 账号」
       * 自己造一个稳定的追踪号，纯粹为了排查时能把日志串起来。
       * 它**不是**幂等键（对方不认），所以不参与任何去重判断。
       */
      const trace = `${s.tracePrefix}-${cardKeyId}-${crypto
        .createHash('sha256')
        .update(`${resolved.productId}|${args.account_id || args.session_key || ''}`)
        .digest('hex')
        .slice(0, 10)}`
      if (saveOrderRef) await saveOrderRef(trace)

      const sent = await submitOnce(
        s,
        {
          ref: s.ref,
          cdk,
          product_id: resolved.productId,
          ...(args.account_id ? { account_id: args.account_id } : {}),
          ...(args.session_key ? { session_key: args.session_key } : {}),
          ...(args.email ? { email: args.email } : {}),
          ...(args.acct_structure ? { acct_structure: args.acct_structure } : {}),
          ...(args.acct_plan ? { acct_plan: args.acct_plan } : {}),
        },
        cdk
      )

      if (!sent.landed) {
        /*
         * 上游当场拒了，卡大概率一点没动（最常见：账号 ID 填错、Team 号）。
         *
         * 【必须把锁放掉】锁要 15 分钟才过期。不放掉，买家改对了账号再提交
         * 会被自己的锁挡住、只能干等 —— 一张好卡、一个已经改对的输入，却动不了。
         *
         * 【但必须先向上游证明卡没被消耗】这是 releaseIrreversible 的举证责任。
         * 查不动、或者查出来卡已经不是 active，就**保留锁** —— 宁可让他等 15 分钟，
         * 也不能在一张可能已经提交出去的卡上放开闸门。
         */
        await releaseIfUntouched(s, cdk, trace, releaseIrreversible)
        if (sent.humanCheck) {
          // 买家再点多少次都一样，不给重试入口（卡#3066 就是连点了 5 次）
          return { state: 'ERROR', message: sent.message, retriable: false, orderRef: trace, fallback: fallbackOf(s) }
        }
        return { state: 'ERROR', message: sent.message, retriable: true, orderRef: trace }
      }

      // 已受理。顺手等一小会儿，接住「1 分钟内就好了」的常见情况
      const settled = await waitShortly(s, cdk)
      if (settled) {
        const c = classify(settled)
        if (c.state === 'COMPLETED') {
          return {
            state: 'COMPLETED',
            message: '充值成功',
            account: str(settled.redeem_email) || str(settled.redeem_account_id) || sent.email || sent.accountId,
            completedAt: str(settled.redeemed_at),
            retriable: false,
            orderRef: trace,
          }
        }
        if (settled.task_status === 'possible_success') {
          // 不交付、也绝不让他重试
          return { state: 'PROCESSING', message: COPY.possibleSuccess, retriable: false, orderRef: trace }
        }
        if (settled.task_status && FAILED_TASKS.has(settled.task_status)) {
          if (settled.message) console.error(`[${s.key}] 充值失败 trace=${trace} upstream_message=${settled.message}`)
          /*
           * 上游失败后会把卡回滚成未使用，所以这里的「可以重新提交」是真的 ——
           * 但前提是把我们自己的 15 分钟占位也放掉，否则那句话就是在骗买家。
           */
          await releaseIfUntouched(s, cdk, trace, releaseIrreversible)
          return { state: 'ERROR', message: COPY.failed, retriable: true, orderRef: trace }
        }
      }

      return {
        state: 'PROCESSING',
        message: COPY.accepted,
        account: sent.email || sent.accountId,
        retriable: false,
        retryAfter: 20,
        orderRef: trace,
      }
    },

    /**
     * 售后强刷。**只对 Claude 有效** —— 对方那个入口只校验 `sk-` 前缀，
     * 也只在 Claude 下给出。我们拿的是 GPT 5x，这条路平时用不上。
     */
    rebindFields(): RedeemField[] {
      return [
        {
          name: 'session_key',
          kind: 'session_key',
          label: 'Claude SessionKey',
          help: '需要使用**当初充值时那个账号**的 sessionKey，以 sk-ant-sid 开头。',
          placeholder: 'sk-ant-sid...',
          pattern: '^(sessionKey=)?sk-ant-sid',
          required: true,
          multiline: true,
        },
      ]
    },

    async rebind({ cdk, values }): Promise<RedeemActivateResult> {
      const sk = (values.session_key || '').trim().replace(/^sessionKey=/, '')
      if (!sk) throw new RedeemError('请填写 Claude SessionKey', 'ERROR')
      if (!sk.startsWith('sk-')) throw new RedeemError('SessionKey 格式不对，应以 sk-ant-sid 开头', 'ERROR')

      const r = await request(s, '/api/store/remedy', { method: 'POST', payload: { ref: s.ref, cdk, session_key: sk } })
      if (r.status !== 200) {
        const detail = str(r.body.detail)
        if (detail) console.error(`[${s.key}] 强刷被拒 status=${r.status} detail=${detail}`)
        if (isHumanCheckRejection(detail)) {
          s.humanCheck = { at: Date.now(), required: true }
          return { state: 'ERROR', message: COPY.humanCheck, retriable: false, fallback: fallbackOf(s) }
        }
        return {
          state: 'ERROR',
          message: r.status === 429 ? COPY.busy : '强刷失败，请稍后再试或联系客服',
          retriable: r.status !== 400,
        }
      }
      const mission = str(r.body.mission_id)
      if (!mission) return { state: 'ERROR', message: '强刷失败，请联系客服', retriable: true }

      /*
       * 对方前端是 2.5 秒一次轮 7.5 分钟。我们不能在一个 HTTP 请求里挂那么久，
       * 所以只等一小会儿；等不到就告诉买家稍后再提交一次同样的信息查看结果
       * （retriable:true 是刻意的 —— 续查走的就是同一个入口）。
       */
      const deadline = Date.now() + ACTIVATE_WAIT_MS
      while (Date.now() < deadline) {
        await new Promise((x) => setTimeout(x, ACTIVATE_POLL_MS))
        try {
          const q = await request(
            s,
            `/api/store/remedy/status?ref=${encodeURIComponent(s.ref)}&id=${encodeURIComponent(mission)}`,
            { method: 'GET' }
          )
          const st = str(q.body.status) || ''
          if (st === 'success') {
            const redeem = (q.body.redeem || {}) as Record<string, unknown>
            const exp = str(redeem.expires_date)
            return {
              state: 'COMPLETED',
              message: `强刷成功，请重新登录账号查看订阅${exp ? `（到期日 ${exp}）` : ''}`,
              retriable: false,
              orderRef: mission,
            }
          }
          if (FAILED_TASKS.has(st)) {
            const m = str(q.body.message)
            if (m) console.error(`[${s.key}] 强刷失败 mission=${mission} upstream_message=${m}`)
            return { state: 'ERROR', message: '强刷没有成功，请稍后再试或联系客服', retriable: true, orderRef: mission }
          }
        } catch {
          /* 查不动就继续等 */
        }
      }
      return {
        state: 'PROCESSING',
        message: '正在处理，请稍后用同样的信息再提交一次查看结果',
        retriable: true,
        retryAfter: 30,
        orderRef: mission,
      }
    },
  }
}

/**
 * 按店铺配置造出一个适配器，外加给对账脚本用的批量查询。
 * **新开一家店 = 一个配置 + 在 registry 注册一行**（sysd.ts 就是这么做的）。
 */
export function createStore(cfg: StoreConfig): {
  config: Readonly<StoreConfig>
  provider: RedeemProvider
  /** 批量查（一次最多 100 张）。给对账脚本用，兑换链路不走这里 */
  statusBatch: (cdks: string[]) => Promise<StatusBody[]>
  /** 这台机器现在提交会不会被人机校验拒。给探针脚本排查用 */
  humanCheckRequired: () => Promise<boolean>
} {
  const s: Store = {
    ...cfg,
    base: cfg.base.trim().replace(/\/+$/, ''),
    ref: cfg.ref.trim(),
    siteCache: null,
    humanCheck: null,
  }
  return {
    config: Object.freeze({ ...cfg, base: s.base, ref: s.ref }),
    provider: makeProvider(s),
    statusBatch: (cdks) => statusBatch(s, cdks),
    humanCheckRequired: () => humanCheckRequired(s),
  }
}

/** sysc：chuanwen 店。三个环境变量都不用配，见 docs/sysc-接入-部署说明.md 第二节 */
export const SYSC = createStore({
  key: 'sysc',
  adminLabel: 'C 系统（兑换中心 / chuanwen）',
  base: process.env.SYSC_BASE || 'https://chuanwen.applelll.com',
  ref: process.env.SYSC_STORE_REF || 'chuanwen',
  productMapEnv: 'SYSC_PRODUCT_MAP',
  tracePrefix: 'SC',
  fallbackEnv: 'SYSC_FALLBACK_URL',
})
export const sysc: RedeemProvider = SYSC.provider
export const syscStatusBatch = SYSC.statusBatch

/**
 * 仅供 scripts/check-redeem.ts 使用的内部导出。
 * 这些是纯函数（不发请求），但它们决定「把哪个凭据发到哪条通道」「一张卡能不能再提交」，
 * 错一次就是白扣一张卡或者重复扣费，必须有断言守着。
 */
export const __test = {
  classify,
  pickAccountArgs,
  fieldsFor,
  guideFor,
  extractId,
  extractEmail,
  acctMeta,
  teamEvidence,
  detectPaidPlan,
  normPlatform,
  aspHeaders,
  FAILED_TASKS,
  COPY,
  isHumanCheckRejection,
  HUMAN_CHECK_TTL,
  HUMAN_CHECK_PROBE_CDK,
}
