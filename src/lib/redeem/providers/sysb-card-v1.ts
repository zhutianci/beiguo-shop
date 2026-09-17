/**
 * sysb 卡付通道（backend=gpt1）走 V1 的三段式充值。
 *
 * ================== 为什么非这么做不可 ==================
 *
 * V2 代理接口声明 one_step_create=true（「do not precheck first」），把充值压成一次
 * POST /orders。但线上实测，卡付 gpt1 的单在 V2 里是这样的：
 *
 *   BG-1719  6 分 27 秒   BG-1720  6 分 25 秒   BG-1771  6 分 27 秒
 *   三笔耗时几乎一秒不差；全程 status=pending，**从未进入 processing**，
 *   updated_at 一直等于 created_at；失败后查卡，连 order 节点都没有。
 *   → 任务从来没有被创建过，是在队列里到点被判死的。
 *
 * 而官网同一张卡、同一个账号走 V1，**51 秒充值成功**。两者的结构差别是：
 *
 *   V1：precheckAccount 创建任务（task_id=27056、预留卡、备好「纯协议支付上下文」）
 *       → redeem 确认执行（order_no=TASK00027056，同一个号）
 *   V2：一次调用，没有这两段。
 *
 * 也就是说 V2 的一步式路径没有接上 gpt1 这条两段式管线。那是上游要修的，
 * 在他们修好之前，卡付卡在本站充不了 —— 库里还有 100 张。
 *
 * ================== 规格来源 ==================
 *
 * 本文件每一个字段都来自站长提供的一次**完整成功充值**的 HAR 抓包，
 * 不是从前端 JS 里推测的。实测耗时：precheck 4.3s、redeem 2.5s，
 * 之后每 5 秒轮询一次、约 28 秒出结果。
 * 所以服务端真正阻塞的只有 ~7 秒，轮询交给买家点「查询」。
 *
 * 【无状态】抓包确认：整条链路没有会话 cookie（请求里那 3 个是百度统计的）、
 * 没有 CSRF、没有签名，服务端全程没有 Set-Cookie。所需凭证全在请求体里。
 *
 * ================== 四条不能破的规则 ==================
 *
 * 【一】不可逆点在 precheckAccount，不在 redeem。
 * 上游源码注释原文：「The shared server prepare gate now verifies/refreshed login
 * **before reserving a card**」，而且 precheck 的响应里就带回了 task_id。
 * 所以「已经提交过」的标记必须写在 precheck **之前**。
 *
 * 【二】V1 没有幂等键。V2 靠 order_id 去重，V1 什么都没有 ——
 * 同一张卡并发提交两次，就是两笔真实扣款。所以必须在本地先原子占位。
 *
 * 【三】凭据绝不落库。整条链路在一次请求内跑完（~7 秒），
 * token / prepare_token 只活在内存里，日志里一个字都不留。
 *
 * 【四】requires_duplicate_confirm 绝不自动确认。
 * 那是「该账号 24 小时内已有充值记录」，官网会弹窗让**人**确认。
 * 替买家点这个确认，等于替他决定再花一笔钱。
 */
import crypto from 'crypto'
import { RedeemError, type RedeemActivateResult } from '../types'

const ORIGIN = 'https://hongyunai.pro'

/**
 * 实测耗时 precheck 4.3s / redeem 2.5s。这里给的是上限，不是期望值：
 * 留足余量但远小于 nginx 的 proxy_read_timeout 90s，
 * 三步加起来最坏 55s，仍在一次 HTTP 请求内跑得完。
 */
const TIMEOUT = { verify: 20_000, precheck: 25_000, redeem: 25_000 } as const

/**
 * gpt1 分支上游要求附带的来源标识。官网发的是 'hongyunai'。
 * 【这件事要让站长知会上游】我们调的是他们面向浏览器的内部接口，
 * 并按 gpt1 分支的要求带上了这个字段。做成可配置，便于他们给我们单独的值。
 */
function clientSite(): string {
  return (process.env.SYSB_CARD_CLIENT_SITE || 'hongyunai').trim()
}

/** 这条链路是否启用。**默认关闭** —— 必须由站长实测一张卡通过后才打开 */
export function cardV1Enabled(): boolean {
  return (process.env.SYSB_CARD_V1 || '').trim() === '1'
}

/** 官网的 newNonce()：18 字节随机数转 36 位小写十六进制 */
function newNonce(): string {
  return crypto.randomBytes(18).toString('hex')
}

/** 官网的 getClientJourneyID()：'flow_' + UUID，一次兑换会话一个 */
function newJourneyId(): string {
  return `flow_${crypto.randomUUID()}`
}

interface V1Body {
  code?: number
  backend?: string
  message?: string
  msg?: string
  error?: string
  error_code?: string
  [k: string]: unknown
}

/**
 * 发一次 V1 请求。
 * **不带 Authorization、不带 Cookie** —— 抓包确认这条链路完全无状态。
 */
async function post(path: string, body: unknown, timeoutMs: number): Promise<V1Body> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(`${ORIGIN}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: '*/*',
        Origin: ORIGIN,
        Referer: `${ORIGIN}/`,
      },
      body: JSON.stringify(body),
      signal: ac.signal,
      // 与 lib/news/feed.ts 同一个理由：裸 fetch 会被 Next 的磁盘数据缓存冻住。
      // 这里被冻住的后果是「充值已提交」被回放给后面每一个人，而钱根本没付出去
      cache: 'no-store',
    })
    const text = await res.text()
    try {
      const parsed = JSON.parse(text) as V1Body
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    } catch {
      /* 落到下面统一报错 */
    }
    throw new RedeemError('充值服务暂时不可用，请稍后再试', 'ERROR')
  } catch (e) {
    if (e instanceof RedeemError) throw e
    const msg = e instanceof Error ? e.message : String(e)
    throw new RedeemError(
      msg.includes('abort')
        ? '充值服务响应超时。**请不要重复提交**，稍后回到本页点「查询」确认结果'
        : '无法连接充值服务，请稍后再试',
      'ERROR',
      false
    )
  } finally {
    clearTimeout(timer)
  }
}

/** 上游 error_code → 我们自己的文案。**不透传上游 message**，那里面带对方品牌与内部术语 */
const ERRORS: Record<string, string> = {
  CARD_KEY_MISSING: '请填写卡密',
  CARD_KEY_UNAVAILABLE: '这张卡密当前不可用，请联系客服',
  CARD_KEY_USED: '这张卡密已经使用过了',
  CARD_KEY_LOCKED: '这张卡密正在处理上一笔请求，请稍后再试',
  LOGIN_SESSION_JSON_INVALID: '账号 Session 格式不正确，请回到 session 页面重新复制整段内容',
  LOGIN_CONTENT_INVALID: '登录内容不完整，请从 ChatGPT 官方页面重新复制完整内容',
  TOKEN_EXPIRED: '登录内容已过期，请重新获取一份新的 Session 后再提交',
  ALREADY_MEMBER: '该账号已经是会员，请更换一个没有订阅的账号',
  UNSUPPORTED_REGION: '该账号暂不支持本通道充值，请更换其它账号',
  INVENTORY_UNAVAILABLE: '当前充值资源繁忙，卡密未消耗，请稍后重试',
  ACCOUNT_PROCESSING: '该账号有一笔充值正在处理中，请稍后再试',
}

function copy(code: unknown, fallback: string): string {
  const c = String(code || '').trim().toUpperCase()
  return ERRORS[c] || fallback
}

/** 解析买家粘贴的 AuthSession。校验口径与官网 parseChatGptSession 对齐 */
export function parseSession(raw: string): { raw: string; email: string; idp: string } {
  const text = (raw || '').trim()
  if (!text) throw new RedeemError('请粘贴 ChatGPT 账号 Session', 'ERROR')
  let o: Record<string, unknown>
  try {
    o = JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new RedeemError('账号 Session 不是完整的 JSON，请回到 session 页面全选复制整段内容', 'ERROR')
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) {
    throw new RedeemError('账号 Session 格式不正确，请复制整段 JSON 对象', 'ERROR')
  }
  const user = (o.user && typeof o.user === 'object' ? o.user : {}) as Record<string, unknown>
  const auth = (o.auth && typeof o.auth === 'object' ? o.auth : {}) as Record<string, unknown>
  const account = (o.account && typeof o.account === 'object' ? o.account : {}) as Record<string, unknown>

  const accessToken = o.accessToken || o.access_token || auth.accessToken || auth.access_token
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new RedeemError('账号 Session 里缺少 accessToken，请确认复制的是完整内容', 'ERROR')
  }
  const email = user.email || o.email || auth.email
  if (typeof email !== 'string' || !email.includes('@')) {
    /*
     * 【必须要求邮箱】官网的 parseChatGptSession 也要求 email，缺了它上游
     * 在付款前环节才会拒，那时买家已经等了半分钟。在本地当场拒掉更好。
     */
    throw new RedeemError('账号 Session 里没有识别到账号邮箱，请重新复制完整内容', 'ERROR')
  }
  const planType = String(user.plan_type || user.planType || account.planType || '').toLowerCase()
  const structure = String(account.structure || '').toLowerCase()
  if (structure === 'workspace' || planType === 'team' || planType === 'enterprise') {
    // 官网同样在本地就拒掉，理由一致：这类账号这条通道根本充不了
    throw new RedeemError('暂不支持 Team、Enterprise 或工作区账号，请使用普通个人账号', 'ERROR')
  }
  const idp = user.idp || o.idp || auth.idp
  return { raw: text, email, idp: typeof idp === 'string' ? idp : '' }
}

export interface CardV1Input {
  cdk: string
  /** 买家粘贴的 AuthSession 原文。**只在内存里，不落库** */
  sessionRaw: string
  /** 在 precheckAccount 之前调用，用来落「已经要动这张卡了」的不可逆标记 */
  markIrreversible: () => Promise<void>
  /** 记下上游订单号（TASK…），供之后轮询 */
  saveOrderRef: (ref: string) => Promise<void>
}

/**
 * 跑完 verify → precheck → redeem 三步。
 *
 * 返回 PROCESSING 是正常终点：上游此时是 processing，结果要靠之后轮询
 * queryOrder 得到（sysb-lookup.ts 已经会解析那个响应）。
 */
export async function redeemCardV1(input: CardV1Input): Promise<RedeemActivateResult> {
  const session = parseSession(input.sessionRaw)
  const nonce = newNonce()
  const journeyId = newJourneyId()
  const site = clientSite()

  // ---------- 第一步：验卡，拿 activation_token ----------
  const v = await post(
    '/api/v1/sub/verifyCdk',
    { cdk: input.cdk, expected_provider: 'openai', request_nonce: nonce },
    TIMEOUT.verify
  )
  if (Number(v.code) !== 200) {
    throw new RedeemError(copy(v.error_code, '这张卡密当前无法使用，请联系客服'), 'ERROR', false)
  }
  const activationToken = String(v.activation_token || '')
  const backend = String(v.backend || 'autosub')
  if (!activationToken) {
    throw new RedeemError('充值服务返回异常，请联系客服', 'ERROR', false)
  }
  if (backend !== 'gpt1') {
    /*
     * 这条链路只为 gpt1 存在。autosub 的卡走 V2 是**实测成功过的**（BG-1759，55 秒），
     * 不要把它拖进来。
     */
    throw new RedeemError('BACKEND_NOT_GPT1', 'ERROR', false)
  }

  /*
   * ---------- 越过这条线，卡就可能被消耗 ----------
   * 下一步 precheckAccount 会在上游创建任务并预留这张卡（task_id 就是它返回的）。
   * 所以标记必须写在调用之前：万一我们在中途崩溃 / 超时，
   * 下次进来才知道「这张卡已经动过了，不能再提交一次」。
   */
  await input.markIrreversible()

  // ---------- 第二步：账号预检，拿 prepare_token（此步会预留卡） ----------
  const common = {
    token: session.raw,
    cdk: input.cdk,
    activation_token: activationToken,
    idp: session.idp,
    force_recharge: false,
    confirm_duplicate: false,
    client_journey_id: journeyId,
    client_site: site,
  }
  const p = await post('/api/v1/sub/precheckAccount', common, TIMEOUT.precheck)

  if (p.requires_duplicate_confirm === true) {
    /*
     * 【绝不自动确认】上游在说「这个账号 24 小时内已经充过一次了」。
     * 官网的做法是弹窗让人确认。我们在服务端替他点下去，
     * 等于替买家决定再花一笔钱 —— 这必须由人来决定。
     */
    throw new RedeemError(
      '这个账号在 24 小时内已经有过一次充值记录。为避免重复扣费，本次没有提交，请联系客服确认后再处理',
      'ERROR',
      false
    )
  }
  if (Number(p.code) !== 200 || p.eligible !== true) {
    throw new RedeemError(copy(p.error_code, '当前账号不满足充值条件，请检查后重试'), 'ERROR', true)
  }
  const prepareToken = String(p.prepare_token || '')
  if (!prepareToken) {
    throw new RedeemError('充值服务返回异常，请联系客服', 'ERROR', false)
  }

  // ---------- 第三步：确认充值 ----------
  const r = await post(
    '/api/v1/sub/redeem',
    {
      ...common,
      // 预检可能返回一份刷新过的登录凭据，有就用它
      token: typeof p.refreshed_token === 'string' && p.refreshed_token ? p.refreshed_token : session.raw,
      prepare_token: prepareToken,
      backend,
    },
    TIMEOUT.redeem
  )

  const order = (r.order && typeof r.order === 'object' ? r.order : {}) as Record<string, unknown>
  const orderNo = String(order.order_no || '')
  if (orderNo) await input.saveOrderRef(orderNo)

  if (Number(r.code) !== 200) {
    return {
      state: 'ERROR',
      message: copy(r.error_code, '充值未完成，请联系客服处理'),
      // 上游已经收下了这张卡，重试只会撞「已使用」。这是售后，不是重试
      retriable: false,
      orderRef: orderNo || undefined,
    }
  }

  const status = String(order.status || r.status || '').toLowerCase()
  if (['success', 'completed', 'complete'].includes(status)) {
    return { state: 'COMPLETED', message: '充值成功', retriable: false, orderRef: orderNo || undefined }
  }
  return {
    state: 'PROCESSING',
    /*
     * 实测从 redeem 到出结果约 28 秒（每 5 秒轮询一次）。
     * 这里给 20 秒，买家点一次「查询」大概率就看到结果了。
     */
    message: '充值已提交，正在处理。请等待约 20 秒后在本页点「查询」，不要重复提交',
    retryAfter: 20,
    retriable: true,
    orderRef: orderNo || undefined,
  }
}

/** 仅供自测使用的内部导出 */
export const __test = { parseSession, ERRORS, copy, newNonce, newJourneyId }
