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
 *
 * ================== 2026-10-24：autosub 的卡也走这里，官网改成 66chong.com ==================
 *
 * 【起因】卡#2865（BSB6…DYHN，ChatGPT Plus 信用卡冲）在本站两次提交都在 1 秒内失败，
 * 买家转去官网 66chong.com 30 秒就充成了。查下来不是这一张卡的问题：
 *   · 10-15 起上游改版，只读查卡（queryOrder）不带新视图头一律 503 → 查卡结果为 null
 *     → 卡付单全部落到 V2 `chatgpt_card`；
 *   · **V2 `chatgpt_card` 自 10-10 起一笔都没成功过**，全是 `CDK_UNAVAILABLE / cdk_state=not_verified`
 *     秒拒（10-24 上游发了新接入说明之后依旧如此）；同期 V2 `chatgpt_ios` 照常成功；
 *   · 10-08～10-14 卡付走这里（V1）每天 11～32 单成功。
 * 所以卡付一律按官网的 V1 SUB 流程走，不再看 backend 分叉到 V2。
 *
 * 【官网就是同一套前端换了个域名】66chong.com 与 hongyunai.pro 的页面只差品牌字样，脚本文件逐字相同；
 * 它的 staff-test-network 脚本把 `/api/v1/sub/<x>` 改写成 `/recharge-api/sub/<x>` 再发（见 V1_ALIAS）。
 * 官网成交单的 order_query_token 里 site_id=2，就是 66chong 这一站。我们照官网发，见 CARD_ORIGIN。
 *
 * 【autosub 与 gpt1 是两条不同的流程，verifyCdk 返回的 backend 决定走哪条】
 *   gpt1    verify → **precheck（建任务、预留卡，不可逆点）** → redeem          token 发 Session 原文
 *   autosub verify → precheck（**只读核对账号，不建单**）→ 查本次激活有没有单 → verify(renew) → **redeem（不可逆点）**
 *                                                                                 token 发 `zstd64:<base64(zstd(Session))>`
 * autosub 那一段逐行对照官网 official-tools-core 的 confirm 流程（readAutosubActivationOrder → renew → redeem）。
 */
import crypto from 'crypto'
import { RedeemError, type RedeemActivateResult } from '../types'

/**
 * 发 V1 请求的站点。默认照官网 66chong.com 发；`SYSB_CARD_ORIGIN=https://hongyunai.pro` 可切回旧站。
 * 两站是同一个后端（同一张卡在两站 queryOrder 结果一致），差别只在路由写法，见 v1Url()。
 */
const CARD_ORIGIN = (process.env.SYSB_CARD_ORIGIN || 'https://66chong.com').trim().replace(/\/+$/, '')

/**
 * 66chong.com 的路由别名，逐字抄自它的 staff-test-network-0c8fd998463440c0.js 里的 routeMap。
 * 它不接受 `/api/v1/sub/*`（server 端直接 nginx 404），只认 `/recharge-api/<别名>`。
 */
const V1_ALIAS: Record<string, string> = {
  '/api/v1/sub/verifyCdk': 'sub/verifyCdk',
  '/api/v1/sub/precheckAccount': 'sub/precheckAccount',
  '/api/v1/sub/redeem': 'sub/redeem',
  '/api/v1/sub/redeemResult': 'sub/redeemResult',
  '/api/v1/sub/queryOrder': 'sub/queryOrder',
}

/** hongyunai.pro 收原始路径；其它站（66chong）收别名 */
export function v1Url(path: string, origin: string = CARD_ORIGIN): string {
  if (/^https:\/\/(www\.)?hongyunai\.pro$/i.test(origin)) return `${origin}${path}`
  const alias = V1_ALIAS[path]
  if (!alias) throw new RedeemError('兑换服务异常，请联系客服', 'ERROR', false)
  return `${origin}/recharge-api/${alias}`
}

/**
 * 实测耗时 precheck 4.3s / redeem 2.5s。这里给的是上限，不是期望值：
 * 留足余量但远小于 nginx 的 proxy_read_timeout 90s，
 * 三步加起来最坏 55s，仍在一次 HTTP 请求内跑得完。
 */
const TIMEOUT = { verify: 20_000, precheck: 25_000, redeem: 25_000 } as const

/**
 * autosub 那条多两步（查单、renew），而且官网给账号核对留了 65 秒、给 redeem 留了 75 秒。
 * 我们是一次 HTTP 请求跑完，外面是 nginx 90 秒 + Cloudflare 100 秒，所以按总预算分配：
 * 不可逆点（redeem）之前任何一步超预算都直接停下 —— 那时卡一点没动，让买家再点一次。
 */
const AUTOSUB = { precheck: 40_000, query: 10_000, renew: 15_000, redeemMin: 20_000, redeemMax: 45_000, budget: 80_000 } as const

/**
 * gpt1 分支上游要求附带的来源标识。官网发的是 'hongyunai'。
 * 【这件事要让站长知会上游】我们调的是他们面向浏览器的内部接口，
 * 并按 gpt1 分支的要求带上了这个字段。做成可配置，便于他们给我们单独的值。
 */
function clientSite(): string {
  return (process.env.SYSB_CARD_CLIENT_SITE || 'hongyunai').trim()
}

/**
 * 这条链路是否启用。**2026-10-24 起默认开启**（卡付走 V2 自 10-10 起 0 成功，见文件头），
 * 只有显式 `SYSB_CARD_V1=0` 才关 —— 那是留给上游修好 V2 之后的回退开关。
 */
export function cardV1Enabled(): boolean {
  return (process.env.SYSB_CARD_V1 || '').trim() !== '0'
}

/** 官网的 newNonce()：18 字节随机数转 36 位小写十六进制 */
function newNonce(): string {
  return crypto.randomBytes(18).toString('hex')
}

/**
 * 一张卡一个 request_nonce，跨请求不变。
 *
 * 【为什么不能每次随机】verifyCdk 会用这个 nonce 在上游给卡做「预留」。官网把它存在
 * sessionStorage 里一张卡用 24 小时（cardFlowNonce），renew 时也必须用同一个 ——
 * 源码注释原话：「Reuse the provider reservation nonce; never allocate a new lock just because
 * an earlier response was lost」。我们是无状态的一次请求，所以从卡密本身确定性地算出来：
 * 买家刷新页面再提交，拿到的还是同一把预留，而不是被自己上一次的预留锁住。
 * 格式与官网一致（36 位小写十六进制，满足它的 /^[A-Za-z0-9_-]{22,86}$/）。
 */
export function cardNonce(cdk: string): string {
  return crypto
    .createHash('sha256')
    .update(`sysb-card-nonce|${process.env.CARDKEY_SECRET || ''}|${cdk.trim().toUpperCase()}`)
    .digest('hex')
    .slice(0, 36)
}

/**
 * 把一段字节包成一个合法的 zstd 帧（RFC 8878），**不压缩**，只用 Raw 块。
 *
 * 【为什么要自己写】官网 autosub 发的 token 是 `zstd64:` + base64(zstd(Session 原文))
 * （card-zstd.js 的 hongyunCompressCardToken，level 10）。生产镜像是 Node 20，
 * zlib 里还没有 zstd（22.15 / 23.8 才加），为它引一个原生或 wasm 依赖不值得：
 * 解压端只关心帧合不合法，不关心压没压过。Raw 块是标准里最基础的块类型，任何合规解码器都认。
 *
 * 【帧头里必须写内容长度】Single_Segment=1 + 4 字节 Frame_Content_Size。
 * 不写的话，像 python-zstandard 的一次性 decompress() 会直接拒绝（不知道该开多大的缓冲）。
 * scripts/check-redeem.ts 用 Node 自带的 libzstd 解回来逐字节比对。
 */
export function zstdRawFrame(data: Buffer): Buffer {
  const MAX_BLOCK = 128 * 1024
  const parts: Buffer[] = []
  const header = Buffer.alloc(9)
  header.writeUInt32LE(0xfd2fb528, 0) // Magic_Number
  header[4] = 0xa0 // Frame_Header_Descriptor：FCS 4 字节（0b10）+ Single_Segment，无校验和、无字典
  header.writeUInt32LE(data.length, 5) // Frame_Content_Size
  parts.push(header)
  let off = 0
  do {
    const size = Math.min(MAX_BLOCK, data.length - off)
    const last = off + size >= data.length ? 1 : 0
    const bh = (size << 3) | (0 << 1) | last // Block_Size | Block_Type=Raw | Last_Block
    parts.push(Buffer.from([bh & 0xff, (bh >> 8) & 0xff, (bh >> 16) & 0xff]))
    parts.push(data.subarray(off, off + size))
    off += size
  } while (off < data.length)
  return Buffer.concat(parts)
}

/** 官网 hongyunCompressCardToken 的等价物：`zstd64:` + base64(zstd 帧(去掉首尾空白的 UTF-8 原文)) */
export function cardToken(sessionRaw: string): string {
  const text = String(sessionRaw || '').trim()
  if (!text) throw new RedeemError('请粘贴 ChatGPT 账号 Session', 'ERROR')
  return `zstd64:${zstdRawFrame(Buffer.from(text, 'utf8')).toString('base64')}`
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
    const res = await fetch(v1Url(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: '*/*',
        Origin: CARD_ORIGIN,
        Referer: `${CARD_ORIGIN}/`,
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
  /*
   * 【有效期必须在本地就判，而且必须在上锁之前】2026-09-19 线上事故的根因就在这儿。
   *
   * 买家粘了一份快过期的 Session，本地这一串校验全过，于是流程往下走到
   * markIrreversible() 把卡锁了 15 分钟，紧接着 precheckAccount 被上游拒掉
   * （上游原话「更新后的登录凭据有效期不足，请重新登录；本次未提交支付」）。
   * 这时**什么都没有提交**，但锁已经落下了。买家重新取一份 Session 再提交，
   * 撞上锁，看到的是「这张卡密已经提交过一次充值，正在处理中」——
   * 一句完全错误、而且让人以为是本站故障的提示。
   *
   * 把有效期挪到这里判，这一类就根本走不到上锁那一步。
   *
   * 【阈值取 5 分钟，而且只拒明确不够的】上游要求的最短剩余时长没有公开，
   * 猜大了会把本来能成的 Session 拒掉——那比现在更糟。所以只拦两种铁定不行的：
   * 已经过期、以及剩余不足 5 分钟（整条链路跑完约 7 秒，但买家从复制到提交
   * 常常要一两分钟，再留点余量）。介于中间的仍然交给上游判。
   */
  assertSessionFresh(o, accessToken)

  const idp = user.idp || o.idp || auth.idp
  return { raw: text, email, idp: typeof idp === 'string' ? idp : '' }
}

/** 至少要剩这么久才允许提交。理由见 assertSessionFresh 的调用处 */
const MIN_SESSION_REMAIN_MS = 5 * 60_000

/**
 * 从 JWT 里读 exp。**不验签**——我们不是在鉴权，只是想在动卡之前
 * 尽早发现「这份凭据已经过期了」。读不出来就返回 null，交给上游判。
 */
function jwtExpMs(token: string): number | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const exp = (JSON.parse(json) as { exp?: unknown }).exp
    return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null
  } catch {
    return null
  }
}

function assertSessionFresh(o: Record<string, unknown>, accessToken: string): void {
  // 两个来源都看：session JSON 顶层的 expires（ISO 字符串），以及 accessToken 里的 exp。
  // 取**更早**的那个——任何一个到期，这份凭据就不能用了。
  const candidates: number[] = []

  const expires = o.expires
  if (typeof expires === 'string') {
    const t = Date.parse(expires)
    if (Number.isFinite(t)) candidates.push(t)
  }
  const jwtExp = jwtExpMs(accessToken)
  if (jwtExp != null) candidates.push(jwtExp)

  // 一个都读不出来：不猜，交给上游。这里宁可漏判也不能误拒。
  if (!candidates.length) return

  const expiresAt = Math.min(...candidates)
  const remain = expiresAt - Date.now()

  if (remain <= 0) {
    throw new RedeemError(
      '这份登录凭据已经过期了。请回到 ChatGPT 的 session 页面重新复制一份再提交——' +
        '本次没有提交，卡密没有被消耗。',
      'ERROR',
      true
    )
  }
  if (remain < MIN_SESSION_REMAIN_MS) {
    throw new RedeemError(
      '这份登录凭据的剩余有效期太短，提交过程中很可能就失效了。' +
        '请回到 ChatGPT 的 session 页面重新复制一份再提交——本次没有提交，卡密没有被消耗。',
      'ERROR',
      true
    )
  }
}

/**
 * 拼出 precheckAccount 与 redeem 共用的那一组字段。
 *
 * 【字段表逐字来自站长提供的成功充值 HAR】不是从前端 JS 推的：
 *   {"token": <AuthSession 原文 6213 字符>, "cdk": "PLUS-…",
 *    "activation_token": "hyg1.…", "idp": "google-oauth2",
 *    "force_recharge": false, "confirm_duplicate": false,
 *    "client_journey_id": "flow_<uuid>", "client_site": "hongyunai"}
 *
 * 【token 必须是原文字符串，不是对象】上游 gpt1 分支收的是 AuthSession 原文
 * （autosub 才压成 zstd64）。重新序列化会改键序、丢掉我们不认识的字段 ——
 * 那份 JSON 里有 sessionToken、account、WARNING_BANNER 一堆东西。
 *
 * 【force_recharge / confirm_duplicate 固定 false】官网卡付通道的「覆盖订阅」
 * 勾选框是隐藏的，实际也发 false；重复充值确认必须由人点，见下面 activate 里的处理。
 */
export function buildCommon(a: {
  sessionRaw: string
  cdk: string
  activationToken: string
  idp: string
  journeyId: string
  site: string
}): Record<string, unknown> {
  return {
    token: a.sessionRaw,
    cdk: a.cdk,
    activation_token: a.activationToken,
    idp: a.idp,
    force_recharge: false,
    confirm_duplicate: false,
    client_journey_id: a.journeyId,
    client_site: a.site,
  }
}

/**
 * redeem 的请求体 = common + prepare_token + backend。
 * 【refreshed_token 有就用】官网原样：`String(data.refreshed_token || token)`。
 * 抓到的那份 HAR 里 precheck 没返回这个字段，于是 redeem 的 token 与 precheck 完全相同
 * （两处 len 都是 6213）—— 与这里的逻辑一致。
 */
export function buildRedeemBody(
  common: Record<string, unknown>,
  prepareToken: string,
  backend: string,
  refreshedToken: unknown
): Record<string, unknown> {
  return {
    ...common,
    token: typeof refreshedToken === 'string' && refreshedToken ? refreshedToken : common.token,
    prepare_token: prepareToken,
    backend,
  }
}

export interface CardV1Input {
  cdk: string
  /** 买家粘贴的 AuthSession 原文。**只在内存里，不落库** */
  sessionRaw: string
  /**
   * 落「已经要动这张卡了」的不可逆标记。抢不到要 throw。
   * gpt1 在 precheckAccount 之前调（那一步就会预留卡），autosub 在查单 / renew / redeem 之前调。
   */
  markIrreversible: () => Promise<void>
  /**
   * 撤销上面那个标记。**只在能证明这张卡没被提交出去时调**：
   * autosub 在 redeem 之前就停下了，或者上游明说卡已退回（card_returned / unused）。
   */
  releaseIrreversible?: () => Promise<void>
  /** 记下上游订单号（gpt1 是 TASK…，autosub 是 SUB…），供之后轮询 */
  saveOrderRef: (ref: string) => Promise<void>
}

/**
 * verifyCdk 失败 → 我们的话。口径照官网 friendlyCardValidationFailure，
 * 但**不透传上游原文**（那里面可能有对方术语）。
 */
export function verifyFailure(v: V1Body): { message: string; state: 'ERROR' | 'PROCESSING' | 'OUT_OF_STOCK' } {
  const code = String(v.error_code || '').trim().toUpperCase()
  const raw = String(v.msg || v.message || v.error || '').trim()
  const wait = Math.max(0, Math.ceil(Number(v.verification_remaining_seconds || v.retry_after_seconds || v.remaining_seconds || 0)))
  if (code === 'NO_STOCK') return { state: 'OUT_OF_STOCK', message: '该套餐暂时无库存，本次没有开始充值，卡密没有被消耗。请稍后再试' }
  if (/LOCK|PROCESS|BUSY|IN_USE/.test(code) || /正在处理|正在核对|被锁定|稍后释放/.test(raw)) {
    return {
      state: 'PROCESSING',
      message: wait > 0 ? `这张卡密正在处理上一笔请求，预计还需 ${wait} 秒，请稍后再试` : '这张卡密正在处理上一笔请求，请稍后再试',
    }
  }
  if (/USED|REDEEMED/.test(code) || /已使用|已兑换/.test(raw)) return { state: 'ERROR', message: '这张卡密已经使用过了，请点「查询」查看充值结果' }
  if (/DISABLED|STOPPED/.test(code) || /已停用/.test(raw)) return { state: 'ERROR', message: '这张卡密已停用，请联系客服' }
  if (/NOT_FOUND|INVALID/.test(code) || /不存在|未找到|格式错误/.test(raw)) return { state: 'ERROR', message: '充值系统没有找到这张卡密，请联系客服核对' }
  return { state: 'ERROR', message: copy(code, '这张卡密暂时无法验证，请稍后重试；多次失败请联系客服') }
}

/**
 * autosub 账号核对失败 → 我们的话。
 *
 * 【上游这一步常常只给中文、不给 error_code】2026-10-24 实测假 Session 的返回：
 * `{"code":0,"error":"Token已失效，获取完Token后请不要退出登录，否则会失效",…}`，没有 error_code。
 * 只看 error_code 的话，买家只能拿到一句「不满足条件」，不知道该重新复制 Session。
 * 所以先认 error_code / precheck_hint，认不出再按原文里的关键词归类 —— 仍然不透传原文。
 */
export function precheckFailure(p: V1Body): string {
  const hint = (p.precheck_hint && typeof p.precheck_hint === 'object' ? p.precheck_hint : {}) as Record<string, unknown>
  const byHint =
    hint.kind === 'account_already_member' ? 'ALREADY_MEMBER' : hint.kind === 'account_processing' ? 'ACCOUNT_PROCESSING' : ''
  const code = String(p.error_code || byHint).trim().toUpperCase()
  if (code && ERRORS[code]) return ERRORS[code]
  const raw = String(p.error || p.message || p.msg || '').trim()
  if (/失效|过期|expired/i.test(raw)) return ERRORS.TOKEN_EXPIRED
  if (/已是会员|已经是会员|已有会员|已订阅|already/i.test(raw)) return ERRORS.ALREADY_MEMBER
  if (/地区|国家|region/i.test(raw)) return ERRORS.UNSUPPORTED_REGION
  if (/处理中|正在充值/.test(raw)) return ERRORS.ACCOUNT_PROCESSING
  if (/登录态|登录内容|无效|invalid/i.test(raw)) return ERRORS.LOGIN_CONTENT_INVALID
  return '当前账号不满足充值条件，请检查后重试'
}

export type AutosubKind = 'success' | 'safe_retry' | 'consumed_failed' | 'failed' | 'processing' | 'rejected' | 'unknown'

/**
 * autosub 的 redeem 响应 / 订单 → 结论。逐条照抄官网 autosubReceiptOutcome(fromSubmission) + autosubOrderOutcome：
 *   · 订单状态说了算（重试中 / 核对中只是过程，不否决终态）
 *   · 失败里再分：卡已退回（card_returned 或 cdk_status 未使用）→ 可以再提交；
 *     卡已核销（partial_closed 或 cdk_status 已激活）→ 售后；其余失败 → 售后
 *   · code≠200 且带了文字 = 上游当场拒了（官网照常显示「充值未成功」）
 */
export function classifyAutosub(r: V1Body | null | undefined): { kind: AutosubKind; orderNo?: string } {
  if (!r || typeof r !== 'object') return { kind: 'unknown' }
  if (Number(r.code) !== 200) {
    const text = [r.error, r.message].some((x) => typeof x === 'string' && x.trim())
    return { kind: text ? 'rejected' : 'unknown' }
  }
  const raw = r.order && typeof r.order === 'object' && !Array.isArray(r.order) ? (r.order as Record<string, unknown>) : null
  const order = raw || (r.status ? { order_no: r.order_no || '', status: r.status, error: r.error } : null)
  if (!order) return { kind: 'unknown' }
  const orderNo = String(order.order_no || '').trim() || undefined
  const status = String(order.status || r.status || '').trim().toLowerCase()
  const card = String(r.cdk_status || '').trim().toLowerCase()
  if (['success', 'manual_success', 'completed', 'complete', 'manual_completed'].includes(status)) return { kind: 'success', orderNo }
  if (['failed', 'failure', 'error', 'cancelled', 'canceled', 'exception', 'partial_closed', 'card_returned'].includes(status)) {
    if (status === 'card_returned' || ['unused', 'available'].includes(card)) return { kind: 'safe_retry', orderNo }
    if (status === 'partial_closed' || ['activated', 'redeemed', 'used'].includes(card)) return { kind: 'consumed_failed', orderNo }
    return { kind: 'failed', orderNo }
  }
  if (['processing', 'pending', 'created', 'running', 'retrying', 'queued', 'preparing'].includes(status)) return { kind: 'processing', orderNo }
  return { kind: 'unknown', orderNo }
}

/** classifyAutosub 的结论 → 买家看到的结果 */
function autosubResult(kind: AutosubKind, orderNo: string | undefined, r: V1Body | null): RedeemActivateResult {
  const orderRef = orderNo || undefined
  switch (kind) {
    case 'success':
      return { state: 'COMPLETED', message: '充值成功', retriable: false, orderRef }
    case 'safe_retry':
      return {
        state: 'ERROR',
        message: '这一笔没有充值成功，**卡密已经退回、没有被消耗**，可以稍后重新提交一次；多次失败请联系客服',
        retriable: true,
        orderRef,
      }
    case 'consumed_failed':
      return { state: 'ERROR', message: '这张卡密已核销，但这一笔充值没有成功。请联系客服并提供卡密，我们会跟进处理', retriable: false, orderRef }
    case 'failed':
      return { state: 'ERROR', message: '这一笔充值没有成功，请联系客服并提供卡密核对，不要重复提交', retriable: false, orderRef }
    case 'rejected':
      return {
        state: 'ERROR',
        message: copy(r?.error_code, '充值系统没有受理这一笔，请稍后在本页点「查询」确认卡密状态，不要连续重复提交'),
        retriable: false,
        orderRef,
      }
    default:
      return {
        state: 'PROCESSING',
        // 官网成功单从受理到出结果约 30 秒（卡#2865：19:20:55 → 19:21:25）
        message: '充值已提交，正在处理，通常 30 秒左右出结果。请稍后在本页点「查询」，不要重复提交',
        retryAfter: 30,
        retriable: true,
        orderRef,
      }
  }
}

/**
 * 跑完官网的卡付流程。verifyCdk 返回的 backend 决定走 gpt1 还是 autosub（见文件头）。
 *
 * 返回 PROCESSING 是正常终点：结果要靠之后的只读查卡（sysb-lookup.ts 的 queryOrder）拿到。
 */
export async function redeemCardV1(input: CardV1Input): Promise<RedeemActivateResult> {
  const startedAt = Date.now()
  const session = parseSession(input.sessionRaw)
  const nonce = cardNonce(input.cdk)

  // ---------- 第一步：验卡，拿 activation_token（会用 nonce 给卡做预留，不会消耗卡） ----------
  const v = await post(
    '/api/v1/sub/verifyCdk',
    { cdk: input.cdk, expected_provider: 'openai', request_nonce: nonce },
    TIMEOUT.verify
  )
  if (Number(v.code) !== 200) {
    const f = verifyFailure(v)
    throw new RedeemError(f.message, f.state, f.state === 'PROCESSING')
  }
  const activationToken = String(v.activation_token || '')
  if (!activationToken) {
    throw new RedeemError('充值服务返回异常，请联系客服', 'ERROR', false)
  }
  // 官网的判据：backend 字段，或者 activation_token 带 gpt1 的签名前缀（旧响应可能不带 backend）
  const isGpt1 = v.backend === 'gpt1' || activationToken.startsWith('hyg1.')
  if (!isGpt1) return redeemAutosub(input, session, nonce, activationToken, startedAt)

  const journeyId = newJourneyId()
  const site = clientSite()
  const backend = 'gpt1'

  /*
   * ---------- 越过这条线，卡就可能被消耗 ----------
   * 下一步 precheckAccount 会在上游创建任务并预留这张卡（task_id 就是它返回的）。
   * 所以标记必须写在调用之前：万一我们在中途崩溃 / 超时，
   * 下次进来才知道「这张卡已经动过了，不能再提交一次」。
   */
  await input.markIrreversible()

  // ---------- 第二步：账号预检，拿 prepare_token（此步会预留卡） ----------
  const common = buildCommon({
    sessionRaw: session.raw,
    cdk: input.cdk,
    activationToken,
    idp: session.idp,
    journeyId,
    site,
  })
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
    buildRedeemBody(common, prepareToken, backend, p.refreshed_token),
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

/**
 * autosub：precheck 只读核对账号 → 查本次激活有没有单 → renew → redeem。
 *
 * 【不可逆点只有 redeem 一个】官网源码原话：「AutoSub precheckAccount only verifies the account;
 * the fixed server route sends non-GPT1 activations to that non-submitting endpoint」。
 * 所以账号核对失败时卡一点没动，买家改了账号直接再提交就行，不用占那把 15 分钟的锁。
 */
async function redeemAutosub(
  input: CardV1Input,
  session: { raw: string; email: string; idp: string },
  nonce: string,
  activationToken: string,
  startedAt: number
): Promise<RedeemActivateResult> {
  const left = () => AUTOSUB.budget - (Date.now() - startedAt)
  const notSubmitted = (msg: string) => new RedeemError(`${msg}（本次没有提交充值，卡密没有被消耗）`, 'ERROR', true)

  // ---------- 第二步：只读核对账号（官网 compressCardToken 之后发） ----------
  const token = cardToken(session.raw)
  const precheckBody = {
    token,
    cdk: input.cdk,
    activation_token: activationToken,
    idp: session.idp,
    force_recharge: false,
    confirm_duplicate: false,
  }
  const p = await post('/api/v1/sub/precheckAccount', precheckBody, Math.min(AUTOSUB.precheck, Math.max(5_000, left())))
  if (p.requires_duplicate_confirm === true) {
    // 同 gpt1：重复充值的确认必须由人来做，见 redeemCardV1 里的说明
    throw new RedeemError(
      '这个账号在 24 小时内已经有过一次充值记录。为避免重复扣费，本次没有提交，请联系客服确认后再处理',
      'ERROR',
      false
    )
  }
  if (Number(p.code) !== 200 || p.eligible !== true) throw notSubmitted(precheckFailure(p))
  /*
   * 【上游核对的账号必须就是买家填的那个】官网原样：邮箱对不上就停，
   * 「返回的充值账号与填写的登录信息不一致，请重新核对」。充错号是不可逆的。
   */
  const checkedEmail = typeof p.email === 'string' ? p.email.trim().toLowerCase() : ''
  if (!checkedEmail) throw notSubmitted('账号核对结果缺少邮箱，请重新提交')
  if (checkedEmail !== session.email.trim().toLowerCase()) {
    throw notSubmitted('充值系统核对到的账号与你填写的登录信息不一致，请重新复制 Session 后再提交')
  }
  const redeemToken = typeof p.refreshed_token === 'string' && p.refreshed_token ? p.refreshed_token : token
  const prepareToken = String(p.prepare_token || '')

  if (left() < AUTOSUB.query + AUTOSUB.renew + AUTOSUB.redeemMin) {
    throw notSubmitted('账号核对用时较长，为避免提交到一半断开，本次先停在这里，请再点一次「提交」')
  }

  // ---------- 越过这条线就要写了：先占位，挡住同一张卡的并发提交 ----------
  await input.markIrreversible()
  /** redeem 之前停下都调它：那时这一次请求根本没碰过写接口，占位可以放掉 */
  const releaseBeforeSubmit = async () => {
    if (input.releaseIrreversible) await input.releaseIrreversible().catch(() => undefined)
  }

  /** renew 之后的 activation_token，redeem 用它 */
  let renewedToken = ''
  try {
    // ---------- 第三步：这次激活下有没有已经建好的单（官网 readAutosubActivationOrder） ----------
    const q = await post('/api/v1/sub/queryOrder', { cdk: input.cdk, activation_token: activationToken }, AUTOSUB.query)
    if (Number(q.code) !== 200 || !Object.prototype.hasOwnProperty.call(q, 'order')) {
      throw notSubmitted('当前兑换记录暂时无法读取，请稍后再提交一次')
    }
    if (q.order && typeof q.order === 'object') {
      // 已经有单了（比如上一次请求在 redeem 之后断开）：不再提交，按它的状态回话
      const found = classifyAutosub({ ...q, code: 200 })
      if (found.orderNo) await input.saveOrderRef(found.orderNo)
      return autosubResult(found.kind === 'unknown' ? 'processing' : found.kind, found.orderNo, q)
    }

    // ---------- 第四步：用同一个 nonce 续一次激活（官网 confirm 前固定做） ----------
    const renewed = await post(
      '/api/v1/sub/verifyCdk',
      { cdk: input.cdk, expected_provider: 'openai', request_nonce: nonce, renew: true },
      AUTOSUB.renew
    )
    renewedToken = typeof renewed.activation_token === 'string' ? renewed.activation_token : ''
    if (Number(renewed.code) !== 200 || !renewedToken || (renewed.backend && renewed.backend !== 'autosub')) {
      throw notSubmitted(verifyFailure(renewed).message)
    }
    if (left() < AUTOSUB.redeemMin) throw notSubmitted('处理用时较长，为避免提交到一半断开，本次先停在这里，请再点一次「提交」')
  } catch (e) {
    await releaseBeforeSubmit()
    throw e
  }

  // ---------- 第五步：确认充值 —— 唯一的不可逆点 ----------
  const r = await post(
    '/api/v1/sub/redeem',
    {
      token: redeemToken,
      cdk: input.cdk,
      activation_token: renewedToken,
      prepare_token: prepareToken,
      backend: 'autosub',
      idp: session.idp,
      force_recharge: false,
      confirm_duplicate: false,
    },
    Math.min(AUTOSUB.redeemMax, Math.max(AUTOSUB.redeemMin, left()))
  )
  const out = classifyAutosub(r)
  if (out.orderNo) await input.saveOrderRef(out.orderNo)
  if (out.kind === 'safe_retry') await releaseBeforeSubmit() // 上游明说卡已退回，占位可以放掉
  return autosubResult(out.kind, out.orderNo, r)
}

/** 仅供自测使用的内部导出 */
export const __test = {
  parseSession,
  ERRORS,
  copy,
  newNonce,
  newJourneyId,
  buildCommon,
  buildRedeemBody,
  verifyFailure,
  precheckFailure,
  classifyAutosub,
  autosubResult,
  AUTOSUB,
  V1_ALIAS,
}
