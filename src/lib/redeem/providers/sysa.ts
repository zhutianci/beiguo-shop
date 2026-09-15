/**
 * 充值平台适配器：sysa。
 *
 * 【这个文件是唯一知道上游长什么样的地方】上游的 URL、字段名、状态码、错误文案
 * 全部锁在这里，对外只吐 types.ts 里那套与厂商无关的类型。
 * 接第二家平台时复制这个文件改实现即可，页面与接口一行都不用动。
 *
 * 【买家看不到上游是谁】所有展示文案都是我们自己按稳定机器码（code）映射的，
 * **不透传上游的 msg** —— 对方的文案里带自家术语和品牌，透传出去既泄漏货源，
 * 又会出现「卡密」「礼物」「gift」混用这种买家看不懂的措辞。
 *
 * 对接要点（来自对方 2026-09-10 版文档）：
 *  · 业务失败也可能是 HTTP 200，必须同时看 HTTP 状态和 success 字段
 *  · 限流/媒体类型错误等框架错误只返回 {"detail": "..."}，网关错误甚至是 HTML，
 *    所以 JSON 解析失败要当成「上游异常」处理，不能崩
 *  · X-Request-ID 响应头要留存，排查时和卡密一起给对方
 */
import {
  RedeemError,
  type RedeemActivateResult,
  type RedeemCheckResult,
  type RedeemField,
  type RedeemGuideStep,
  type RedeemProvider,
  type RedeemState,
} from '../types'

const BASE = 'https://redeemgpt.com'
const TIMEOUT_MS = 20_000

/** 上游的产品标识 */
type UpstreamApp = 'gpt' | 'claude' | 'claude_s' | 'grok'

interface UpstreamResponse {
  success?: boolean
  code?: string
  msg?: string
  data?: Record<string, unknown> | string
}

/** 上游稳定机器码 → 我们自己的展示文案。没收录的码回落到通用文案，绝不透传上游 msg */
const MESSAGES: Record<string, string> = {
  'activation.ready': '卡密有效，请填写要充值的账号后提交',
  'activation.processing': '正在为你充值，请稍后回到本页查询结果，不要重复提交',
  'activation.completed': '充值已完成',
  'activation.cooldown': '这张卡密刚提交过，请稍后再试',
  'activation.verify_failed': '充值已完成，但系统未能二次确认到账。请重新登录账号查看；若仍未到账，用下方「订阅未到账」重新绑定',
  'stock.out_of_stock': '该商品暂时缺货，请稍后再试或联系客服',
  'provider.temporary_error': '充值服务暂时不可用，请稍后再试',
  'provider.uncredited': '本次充值需要人工确认，请联系客服并提供卡密',
  'cdk.not_found': '卡密不存在，请检查是否复制完整',
  'cdk.voided': '该卡密已作废，请联系客服',
  'cdk.abnormal': '该卡密状态异常，请联系客服',
  'cdk.after_sale_processed': '该卡密已做过售后处理，请联系客服',
  'cdk.exchanged': '该卡密已换新，请使用换取后的新卡密',
  'input.uid_required': '请填写账号 UID',
  'input.uid_invalid': '账号 UID 格式不正确，应为标准 UUID',
  'input.session_required': '请填写账号凭据',
  'account.session_invalid': '账号凭据无效或已过期，请重新获取后再试',
  'account.workspace_not_supported': '不支持团队 / 工作区账号，请换用个人账号',
  'account.plan_not_allowed': '该账号当前套餐不支持充值，请换用未订阅的账号',
  'account.recent_activation_blocked': '该账号 10 分钟内已充值成功过，请更换账号或稍后再试',
  'account.not_submittable': '该账号已有订阅或状态异常，无法充值',
  'account.idv_required': '该账号需要先完成身份验证才能绑定订阅',
  'account.billing_abnormal': '该账号存在账单异常，暂时无法绑定',
  'account.bind_error': '订单账号异常，需要人工处理，请联系客服',
  'gift.not_found': '该卡密对应的商品配置不存在，请联系客服',
  'gift.inactive': '该商品已停用，请联系客服',
  'gift.unsupported_app': '暂不支持该产品类型',
  'server.internal_error': '充值服务异常，请稍后再试',
  // 重绑
  'rebind.success': '重新绑定成功，请重新登录账号查看订阅',
  'rebind.processing': '正在处理，请稍后用同样的信息再提交一次查看结果',
  'rebind.cooldown': '刚提交过，请稍后再试',
  'rebind.uid_mismatch': '提交的账号与当初充值的账号不一致，请换用充值时那个账号的凭据',
  'rebind.order_not_found': '没有找到这张卡密的充值记录',
  'rebind.not_claude': '该卡密不支持此操作',
  'rebind.no_receipt': '这笔订单不支持自助重绑，请联系客服',
  'rebind.session_expired': '凭据已失效，请重新获取后再试',
  'rebind.idv_required': '该账号需要先完成身份验证才能绑定',
  'rebind.billing_abnormal': '该账号存在账单异常，暂时无法绑定',
  'rebind.receipt_invalid': '订单凭证异常，需要人工处理，请联系客服',
  'rebind.account_error': '订单账号异常，需要人工处理，请联系客服',
  'rebind.no_entitlement': '已执行重绑，但未检测到订阅权益，请联系客服',
  'rebind.transaction_lose_oid': '订单凭证缺少账号信息，无法自助重绑，请联系客服',
  'rebind.account_disabled': '该账号已被停用或受限，无法绑定',
  'rebind.failed': '重新绑定失败，请稍后再试或联系客服',
  'input.invalid': '参数有误，请重新填写',
}

/** 上游 code → 我们的状态。未收录的码按 ERROR 处理 */
const STATE_BY_CODE: Record<string, RedeemState> = {
  'activation.ready': 'READY',
  'activation.processing': 'PROCESSING',
  'activation.completed': 'COMPLETED',
  // 【verify_failed 归到 COMPLETED 是刻意的】卡已经消耗、钱已经花了，
  // 只是没二次确认到账。归到 ERROR 会让买家以为可以再充一次，那是二次损失。
  'activation.verify_failed': 'COMPLETED',
  'activation.cooldown': 'COOLDOWN',
  'stock.out_of_stock': 'OUT_OF_STOCK',
  'cdk.not_found': 'NOT_FOUND',
  'cdk.voided': 'VOID',
  'cdk.abnormal': 'VOID',
  'cdk.after_sale_processed': 'VOID',
  'cdk.exchanged': 'VOID',
}

/** use_status 兜底映射：上游没给 code 时用它 */
const STATE_BY_USE_STATUS: Record<number, RedeemState> = {
  0: 'READY',
  [-1]: 'PROCESSING',
  1: 'COMPLETED',
  [-9]: 'OUT_OF_STOCK',
  [-999]: 'ERROR',
  [-1000]: 'VOID',
  [-1001]: 'VOID',
  [-1002]: 'VOID',
}

/**
 * 这些码代表「这张卡本身废了」，重试没有意义，必须走售后。
 * 与「稍后再试」分开是刚需：让买家对着一张废卡反复重试是最典型的客服工单来源。
 */
const TERMINAL_CODES = new Set([
  'cdk.not_found',
  'cdk.voided',
  'cdk.abnormal',
  'cdk.after_sale_processed',
  'cdk.exchanged',
  'gift.not_found',
  'gift.inactive',
  'gift.unsupported_app',
  'provider.uncredited',
  'account.bind_error',
])

function copy(code: string | undefined, fallback: string): string {
  if (code && MESSAGES[code]) return MESSAGES[code]
  return fallback
}

const UUID_RE = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'

/**
 * 按上游产品类型决定买家要填什么。
 *
 * 【either/or 的表达方式】gpt 与 claude 都是「凭据或 UID 二选一」，
 * 所以两个字段都标 required:false，由下面的 pickAccountArgs 强制「至少填一个」。
 * 推荐项排在前面，help 里说清为什么推荐。
 */
function fieldsFor(app: UpstreamApp): RedeemField[] {
  switch (app) {
    case 'claude':
      return [
        {
          name: 'session_key',
          kind: 'session_key',
          label: 'Claude SessionKey（推荐）',
          help: '登录 claude.ai 后，在浏览器 Cookie 里取 sessionKey，以 sk-ant-sid 开头。用它可以在扣卡前检查账号状态，避免「卡扣了订阅没到」。',
          placeholder: 'sk-ant-sid...',
          pattern: '^(sessionKey=)?sk-ant-sid',
          required: false,
          multiline: true,
        },
        {
          name: 'uid',
          kind: 'uuid',
          label: 'Organization ID（备选）',
          help: 'Claude 账号 Settings → Account 页面里的 Organization ID。此方式无法预先检查账号状态，账号异常时卡密会被消耗但订阅不到账。',
          placeholder: '96eae38f-b751-4079-b116-484bd746c477',
          pattern: UUID_RE,
          required: false,
        },
      ]
    case 'claude_s':
      return [
        {
          name: 'session_key',
          kind: 'session_key',
          label: 'Claude SessionKey',
          help: '登录 claude.ai 后，在浏览器 Cookie 里取 sessionKey，以 sk-ant-sid 开头。',
          placeholder: 'sk-ant-sid...',
          pattern: '^(sessionKey=)?sk-ant-sid',
          required: true,
          multiline: true,
        },
      ]
    case 'gpt':
      return [
        {
          name: 'session_json',
          kind: 'session_json',
          label: 'ChatGPT 账号 Session（推荐）',
          help: '登录 chatgpt.com 后打开 chatgpt.com/api/auth/session，把整段 JSON 完整复制进来。账号需为个人版且当前无订阅。',
          placeholder: '{"accessToken":"ey...","user":{...}}',
          required: false,
          multiline: true,
        },
        {
          name: 'uid',
          kind: 'uuid',
          label: '账号 UID（备选）',
          help: '仅在拿不到 Session 时使用。此方式无法预先核对账号归属与订阅状态，填错无法撤回，也不能更换账号。',
          placeholder: '96eae38f-b751-4079-b116-484bd746c477',
          pattern: UUID_RE,
          required: false,
        },
        /*
         * 【force：账号已有订阅时的唯一出路】上游默认要求 GPT 账号为 personal 且 plan=free，
         * 否则直接返回 account.plan_not_allowed。不给这个开关，
         * 手上还有剩余会员时间的买家会被卡死在那条错误上、而且看不懂为什么。
         * 代价是剩余时间作废，所以文案必须把这一点说在前面。只对 Session 通道有效。
         */
        {
          name: 'force',
          kind: 'toggle',
          label: '放弃剩余会员时间，强制充值',
          help: '仅当账号已有订阅、提示「套餐不支持充值」时才勾选。勾选后原有会员的剩余时间会作废，且不可恢复。',
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

/**
 * 分步取号指引。内容参照上游官方页面的引导整理，措辞是我们自己的。
 *
 * 【两个产品的步数不一样，这正是指引必须按产品给的原因】
 * Claude 要开发者工具翻 Cookie（6 步），ChatGPT 打开一个 URL 复制整段 JSON（4 步）。
 * 把它写死在页面里，接第二家平台就得改前端。
 */
function guideFor(app: UpstreamApp): { intro: string; steps: RedeemGuideStep[] } {
  if (app === 'gpt') {
    return {
      intro: '跟着 4 步完成：先确认卡密，再登录账号取一段 Session 信息贴进来。',
      steps: [
        { title: '确认卡密', detail: '上一步已经查过了，确认上面显示的商品与你购买的一致。' },
        {
          title: '登录 ChatGPT',
          detail: '先登录要充值的那个 ChatGPT 账号，确保处于已登录状态。',
          link: { label: '打开 ChatGPT', url: 'https://chatgpt.com/' },
        },
        {
          title: '获取 Session 信息',
          detail: '登录状态下打开下面这个地址，把页面上**整段 JSON** 全选复制（不要只复制其中一段）。',
          link: { label: '打开 Session 页面', url: 'https://chatgpt.com/api/auth/session' },
        },
        { title: '粘贴并提交', detail: '把整段 JSON 粘进下面的输入框，确认账号无误后提交，通常 1 分钟左右到账。' },
      ],
    }
  }
  // claude / claude_s 共用同一套取值路径
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

/**
 * 把我们的字段名翻译成上游的参数，并强制 either/or 规则。
 *
 * 【同时填了怎么办】上游规定 session 优先、uid 被忽略。这里**只发送优先的那个**，
 * 不把两个都发过去 —— 让买家以为 uid 生效、实际用的是 session，是最难解释的一类客诉。
 */
function pickAccountArgs(app: UpstreamApp, values: Record<string, string>): Record<string, string> {
  const sk = (values.session_key || '').trim()
  const sj = (values.session_json || '').trim()
  const uid = (values.uid || '').trim()

  if (app === 'grok') {
    if (!uid) throw new RedeemError('请填写 Grok 账号 UID', 'ERROR')
    return { uid }
  }
  if (app === 'claude_s') {
    if (!sk) throw new RedeemError('请填写 Claude SessionKey', 'ERROR')
    return { session_info: sk }
  }
  if (app === 'claude') {
    if (sk) return { session_info: sk }
    if (uid) return { uid }
    throw new RedeemError('请填写 Claude SessionKey 或 Organization ID', 'ERROR')
  }
  // gpt
  // force 只对 Session 通道有效，UID 直充不参与 plan 校验，带上去是噪音
  const force = (values.force || '').trim() === '1'
  if (sj) return force ? { session_info: sj, force: '1' } : { session_info: sj }
  if (uid) return { uid }
  throw new RedeemError('请填写 ChatGPT 账号 Session 或 UID', 'ERROR')
}

interface CallResult {
  body: UpstreamResponse
  requestId?: string
}

async function call(path: string, payload: Record<string, unknown>): Promise<CallResult> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ac.signal,
      /*
       * 【no-store 一个字都不能少】App Router 会把裸 fetch 的响应写进磁盘数据缓存
       * 并无限期复用。这里要是被缓存住，后果比新闻抓取那次严重得多：
       * 「激活成功」的响应会被回放给后面每一个提交同样参数的人，
       * 而卡密其实根本没提交出去。2026-09-09 那次两天的静默宕机就是这个坑。
       */
      cache: 'no-store',
    })

    const requestId = res.headers.get('X-Request-ID') || undefined
    const text = await res.text()

    let body: UpstreamResponse
    try {
      body = JSON.parse(text) as UpstreamResponse
    } catch {
      // 限流返回 {"detail":...}、网关错误返回 HTML，都会走到这里。
      // 不能崩，也不能把上游的原始内容吐给买家
      throw new RedeemError(
        res.status === 429 ? '操作过于频繁，请稍后再试' : '充值服务暂时不可用，请稍后再试',
        'ERROR'
      )
    }
    return { body, requestId }
  } catch (e) {
    if (e instanceof RedeemError) throw e
    const msg = e instanceof Error ? e.message : String(e)
    throw new RedeemError(msg.includes('abort') ? '充值服务响应超时，请稍后再试' : '无法连接充值服务，请稍后再试', 'ERROR')
  } finally {
    clearTimeout(timer)
  }
}

function asObj(d: UpstreamResponse['data']): Record<string, unknown> {
  return d && typeof d === 'object' ? d : {}
}
function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

/** 服务状态横幅。拉取失败一律当作「没有横幅」，绝不能挡住主流程 */
async function serviceNotice(product: string | undefined) {
  if (!product) return null
  try {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 6000)
    try {
      const res = await fetch(`${BASE}/api/service_status?product=${encodeURIComponent(product)}`, {
        signal: ac.signal,
        cache: 'no-store',
      })
      const body = (await res.json()) as UpstreamResponse
      const level = str(asObj(body.data).level)
      if (level === 'unstable') return { level: 'unstable' as const, text: '该商品近期存在充值失败，可以提交但可能需要重试' }
      if (level === 'abnormal') return { level: 'abnormal' as const, text: '该商品近期失败率较高，建议稍后再试' }
      return null // normal / unknown 都不展示，少一条噪音
    } finally {
      clearTimeout(timer)
    }
  } catch {
    return null
  }
}

export const sysa: RedeemProvider = {
  key: 'sysa',
  /** 辨识名：只在后台导入卡密的下拉里出现，买家侧永远看不到 */
  adminLabel: 'A 系统（redeemgpt）',

  async check(cdk: string): Promise<RedeemCheckResult> {
    const { body, requestId } = await call('/api/check', { cdkey: cdk })
    const data = asObj(body.data)
    const code = body.code || str(data.status_code)
    const useStatus = typeof data.use_status === 'number' ? data.use_status : undefined

    /*
     * 三级判定：优先信稳定机器码，其次 use_status，最后按 success 兜底。
     * 【不能写成 `code && STATE_BY_CODE[code]`】code 为空串时整个表达式是 ''，
     * 而 ?? 只拦 null/undefined，空串会被当成有效值一路传下去。
     */
    const state: RedeemState =
      (code ? STATE_BY_CODE[code] : undefined) ??
      (useStatus !== undefined ? STATE_BY_USE_STATUS[useStatus] : undefined) ??
      (body.success ? 'READY' : 'ERROR')

    const app = (str(data.app) || 'claude') as UpstreamApp
    const cooldown = typeof data.cooldown_remaining === 'number' ? data.cooldown_remaining : undefined

    return {
      state,
      message: copy(code, body.success ? '卡密有效' : '无法查询该卡密，请稍后再试或联系客服'),
      productName: str(data.gift_name),
      fields: state === 'READY' ? fieldsFor(app) : [],
      guide: state === 'READY' ? guideFor(app).steps : undefined,
      guideIntro: state === 'READY' ? guideFor(app).intro : undefined,
      account: str(data.account),
      completedAt: str(data.completed_at),
      cooldownSeconds: data.in_cooldown === true ? cooldown : undefined,
      notice: state === 'READY' ? await serviceNotice(str(data.service_product)) : null,
      requestId,
    }
  },

  async activate({ cdk, values }): Promise<RedeemActivateResult> {
    /*
     * 【必须先 check 一次拿 app】上游按卡密自己判断产品类型，
     * 而我们要在提交前知道该发 session_info 还是 uid。
     * 多一次往返换的是「不会把 Claude 的 sk 发到 GPT 的通道上」。
     */
    const pre = await call('/api/check', { cdkey: cdk })
    const app = (str(asObj(pre.body.data).app) || 'claude') as UpstreamApp

    const args = pickAccountArgs(app, values)
    const { body, requestId } = await call('/api/activate', { cdkey: cdk, ...args })

    const data = asObj(body.data)
    const code = body.code || str(data.status_code)

    if (body.success && (code === 'activation.completed' || code === 'activation.verify_failed')) {
      return {
        state: 'COMPLETED',
        message: copy(code, '充值成功'),
        account: str(data.account),
        completedAt: str(data.completed_at),
        retriable: false,
        requestId,
      }
    }
    if (code === 'activation.processing') {
      return {
        state: 'PROCESSING',
        message: copy(code, '正在处理，请稍后查询'),
        account: str(data.account),
        retriable: false, // 不是失败，但也不该让他再提交一次
        requestId,
      }
    }
    if (code === 'activation.cooldown') {
      return { state: 'COOLDOWN', message: copy(code, '请稍后再试'), retriable: true, requestId }
    }

    return {
      state: 'ERROR',
      message: copy(code, '充值失败，请稍后再试或联系客服'),
      retriable: !(code && TERMINAL_CODES.has(code)),
      requestId,
    }
  },

  rebindFields(): RedeemField[] {
    return [
      {
        name: 'session_key',
        kind: 'session_key',
        label: 'Claude SessionKey',
        help: '需要使用**当初充值时那个账号**的 sessionKey，以 sk-ant-sid 开头。换个账号会提示不一致。',
        placeholder: 'sk-ant-sid...',
        pattern: '^(sessionKey=)?sk-ant-sid',
        required: true,
        multiline: true,
      },
    ]
  },

  async rebind({ cdk, values }): Promise<RedeemActivateResult> {
    const sk = (values.session_key || '').trim()
    if (!sk) throw new RedeemError('请填写 Claude SessionKey', 'ERROR')

    const { body, requestId } = await call('/api/claude_refresh', { cdkey: cdk, session_info: sk })
    const data = asObj(body.data)
    const code = body.code || str(data.status_code)
    const retryAfter = typeof data.retry_after === 'number' ? data.retry_after : undefined

    if (body.success && code === 'rebind.success') {
      return { state: 'COMPLETED', message: copy(code, '重新绑定成功'), retriable: false, requestId }
    }
    if (code === 'rebind.processing' || code === 'rebind.cooldown') {
      return {
        state: code === 'rebind.cooldown' ? 'COOLDOWN' : 'PROCESSING',
        message: copy(code, '正在处理，请稍后再试'),
        // 【这两个必须可重试】文档写明要按 retry_after 续查，
        // 续查用的就是同一个接口同样的参数，不给重试入口买家就卡死在这里
        retriable: true,
        retryAfter,
        requestId,
      }
    }
    if (code === 'rebind.uid_mismatch') {
      const submitted = str(data.submitted_uid)
      const redeemed = str(data.redeemed_uid)
      return {
        state: 'ERROR',
        message:
          `${copy(code, '账号不一致')}` +
          (submitted && redeemed ? `（你提交的是 ${submitted}，充值时用的是 ${redeemed}）` : ''),
        retriable: true,
        requestId,
      }
    }
    return {
      state: 'ERROR',
      message: copy(code, '重新绑定失败，请稍后再试或联系客服'),
      retriable: !(code && ['rebind.order_not_found', 'rebind.not_claude'].includes(code)),
      retryAfter,
      requestId,
    }
  },
}

/**
 * 仅供 scripts/check-redeem.ts 使用的内部导出。
 * 这些是纯函数（不发请求），但它们决定「把哪个凭据发到哪条通道」，
 * 错一次就是把 Claude 的 sk 发进 GPT 的接口，必须有断言守着。
 */
export const __test = { fieldsFor, pickAccountArgs, guideFor, STATE_BY_CODE, STATE_BY_USE_STATUS, MESSAGES, TERMINAL_CODES }
