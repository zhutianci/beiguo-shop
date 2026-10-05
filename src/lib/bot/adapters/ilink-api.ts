/**
 * 微信官方 iLink Bot API（产品名 ClawBot，2026-03 起开放）的最小客户端（docs/微信机器人-设计.md 附录 E）。
 *
 * 协议事实取自腾讯开源（MIT）的 @tencent-weixin/openclaw-weixin 2.4.9 源码（src/api/api.ts、src/auth/login-qr.ts），
 * 代码是本站自己写的，只实现用得到的五个接口：
 *  - POST ilink/bot/get_bot_qrcode?bot_type=3   {local_token_list}        → {qrcode, qrcode_img_content（扫码 / 在微信里打开的链接）}
 *  - GET  ilink/bot/get_qrcode_status?qrcode=…（&verify_code=…）长轮询 ≈35 秒 → {status, bot_token, ilink_bot_id, ilink_user_id, baseurl, redirect_host}
 *  - POST ilink/bot/getupdates  {get_updates_buf}   长轮询 ≈35 秒 → {ret, errcode, msgs, get_updates_buf, longpolling_timeout_ms}
 *  - POST ilink/bot/sendmessage {msg:{to_user_id, context_token, item_list…}}  → {ret, errmsg}
 *  - POST ilink/bot/msg/notifystart                                         （上线通知，尽力而为）
 * 每个请求都带 base_info（channel_version + bot_agent，后者像 User-Agent，如实写本站）与 iLink-App-Id / ClientVersion / X-WECHAT-UIN 头。
 * errcode / ret = -14 表示 bot_token 失效（对方解除了绑定或过期），只能重新扫码。
 *
 * 所有函数不抛异常：网络错误、超时都折成 ok=false + 原因；日志里不打印 token 与消息正文。
 */
import { randomBytes, randomUUID } from 'crypto'

export const ILINK_DEFAULT_BASE = 'https://ilinkai.weixin.qq.com'
/** 协议兼容级别：与腾讯插件同一版本（服务端可能按版本做兼容判断） */
const CHANNEL_VERSION = '2.4.9'
const APP_ID = 'bot'
const CLIENT_VERSION = String((2 << 16) | (4 << 8) | 9)
/** 自报身份（只用于对方的观测统计，不参与鉴权）：UA 语法 name/version (comment) */
const BOT_AGENT = 'BeiguoShop/1.0 (bigolab.com)'
export const STALE_TOKEN_ERRCODE = -14
const LONG_POLL_MS = 35_000
const API_TIMEOUT_MS = 15_000

type Json = Record<string, unknown>

/**
 * 接口地址。测试时用 BOT_ILINK_BASE 指到本地假服务，生产不设（compose 也不传它）。
 * 谁能改这个地址谁就能把 bot_token 引到别处：只许本目录读（scripts/check-bot-boundary.mjs 规则 B5）
 */
export function ilinkBase(fromBinding?: string | null): string {
  const env = (process.env.BOT_ILINK_BASE || '').trim()
  return (env || fromBinding || ILINK_DEFAULT_BASE).replace(/\/+$/, '')
}

/** 设了 BOT_ILINK_BASE（测试）：扫码时不跟服务端的换机房跳转 */
export function ilinkBaseOverridden(): boolean {
  return !!(process.env.BOT_ILINK_BASE || '').trim()
}

function uin(): string {
  return Buffer.from(String(randomBytes(4).readUInt32BE(0)), 'utf8').toString('base64')
}

function headers(token?: string | null): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    AuthorizationType: 'ilink_bot_token',
    'X-WECHAT-UIN': uin(),
    'iLink-App-Id': APP_ID,
    'iLink-App-ClientVersion': CLIENT_VERSION,
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

function baseInfo(): Json {
  return { channel_version: CHANNEL_VERSION, bot_agent: BOT_AGENT }
}

/**
 * 消息 ID 是 uint64，超过 JS 安全整数：JSON.parse 之前把这几个字段的数字改成字符串（只改「"字段名": 数字」，
 * 字符串里转义过的引号不会误配——字段名后面紧跟的必须是未转义的引号）
 */
export function parseIlinkJson(text: string): Json | null {
  try {
    const fixed = text.replace(/"(message_id|msg_id|svr_id)"(\s*):(\s*)(-?\d+)/g, '"$1"$2:$3"$4"')
    const v = JSON.parse(fixed)
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : null
  } catch {
    return null
  }
}

interface RawResult {
  ok: boolean
  status: number
  json: Json | null
  /** 网络层原因：timeout / aborted / ECONNREFUSED… */
  error?: string
}

async function request(
  method: 'GET' | 'POST',
  url: string,
  opts: { token?: string | null; body?: Json; timeoutMs: number; signal?: AbortSignal; noBaseInfo?: boolean }
): Promise<RawResult> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), opts.timeoutMs)
  const onAbort = () => ctl.abort()
  opts.signal?.addEventListener('abort', onAbort, { once: true })
  try {
    const res = await fetch(url, {
      method,
      headers: method === 'GET' ? { 'iLink-App-Id': APP_ID, 'iLink-App-ClientVersion': CLIENT_VERSION } : headers(opts.token),
      body: method === 'POST' ? JSON.stringify(opts.noBaseInfo ? opts.body || {} : { ...(opts.body || {}), base_info: baseInfo() }) : undefined,
      signal: ctl.signal,
      cache: 'no-store',
    })
    const text = await res.text().catch(() => '')
    return { ok: res.ok, status: res.status, json: text ? parseIlinkJson(text) : null }
  } catch (e) {
    if (opts.signal?.aborted) return { ok: false, status: 0, json: null, error: 'aborted' }
    if ((e as Error)?.name === 'AbortError') return { ok: false, status: 0, json: null, error: 'timeout' }
    const code = (e as { cause?: { code?: string } })?.cause?.code
    return { ok: false, status: 0, json: null, error: code || (e as Error)?.name || 'network' }
  } finally {
    clearTimeout(timer)
    opts.signal?.removeEventListener('abort', onAbort)
  }
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' ? v : typeof v === 'string' && /^-?\d+$/.test(v) ? Number(v) : undefined
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v ? v : undefined
}

function apiError(r: RawResult): string {
  if (r.error) return r.error
  const j = r.json
  const code = num(j?.errcode) ?? num(j?.ret)
  const msg = str(j?.errmsg)
  return [r.status && r.status !== 200 ? `HTTP ${r.status}` : '', code !== undefined ? `ret=${code}` : '', msg ? msg.slice(0, 80) : ''].filter(Boolean).join(' ') || '未知错误'
}

function isStale(j: Json | null): boolean {
  return num(j?.errcode) === STALE_TOKEN_ERRCODE || num(j?.ret) === STALE_TOKEN_ERRCODE
}

// ───────────────────────── 扫码绑定 ─────────────────────────

/** 取一个绑定二维码。localTokens：本站已有绑定的 token（最多 10 个），同一个微信重复扫码时服务端回 binded_redirect 而不是再发一个 */
export async function fetchBindQr(localTokens: string[]): Promise<{ ok: true; qrcode: string; link: string } | { ok: false; error: string }> {
  // 与腾讯插件一致：这个接口的请求体只有 local_token_list，不带 base_info
  const r = await request('POST', `${ilinkBase()}/ilink/bot/get_bot_qrcode?bot_type=3`, { body: { local_token_list: localTokens.slice(0, 10) }, timeoutMs: API_TIMEOUT_MS, noBaseInfo: true })
  const qrcode = str(r.json?.qrcode)
  const link = str(r.json?.qrcode_img_content)
  if (!r.ok || !qrcode || !link) return { ok: false, error: `取二维码失败：${apiError(r)}` }
  if (!/^https:\/\/[^\s"'<>]+$/.test(link)) return { ok: false, error: '取二维码失败：返回的链接格式不对' }
  return { ok: true, qrcode, link }
}

export type BindStatus = 'wait' | 'scaned' | 'confirmed' | 'expired' | 'scaned_but_redirect' | 'need_verifycode' | 'verify_code_blocked' | 'binded_redirect'

export interface BindStatusResult {
  status: BindStatus | 'error'
  botToken?: string
  botId?: string
  userId?: string
  baseUrl?: string
  redirectHost?: string
  error?: string
}

/** 长轮询一次扫码状态（≈35 秒）。客户端超时按「还在等」处理，与腾讯插件一致 */
export async function pollBindStatus(base: string, qrcode: string, verifyCode: string | null, signal?: AbortSignal): Promise<BindStatusResult> {
  let url = `${base}/ilink/bot/get_qrcode_status?qrcode=${encodeURIComponent(qrcode)}`
  if (verifyCode) url += `&verify_code=${encodeURIComponent(verifyCode)}`
  const r = await request('GET', url, { timeoutMs: LONG_POLL_MS + 5_000, signal })
  if (r.error === 'timeout') return { status: 'wait' }
  if (!r.ok || !r.json) return { status: 'error', error: apiError(r) }
  const s = str(r.json.status) as BindStatus | undefined
  if (!s) return { status: 'error', error: apiError(r) }
  return {
    status: s,
    botToken: str(r.json.bot_token),
    botId: str(r.json.ilink_bot_id),
    userId: str(r.json.ilink_user_id),
    baseUrl: str(r.json.baseurl),
    redirectHost: str(r.json.redirect_host),
  }
}

// ───────────────────────── 收发消息 ─────────────────────────

export interface IlinkItem {
  type?: number
  text_item?: { text?: string }
  voice_item?: { text?: string }
}

export interface IlinkMessage {
  seq?: number
  message_id?: string
  from_user_id?: string
  to_user_id?: string
  client_id?: string
  create_time_ms?: number
  group_id?: string
  message_type?: number
  context_token?: string
  item_list?: IlinkItem[]
}

export interface UpdatesResult {
  ok: boolean
  stale: boolean
  msgs: IlinkMessage[]
  cursor: string | null
  nextTimeoutMs: number | null
  error?: string
}

/** 长轮询收消息：服务端最多压 ≈35 秒；客户端超时 = 这一轮没有新消息（不算失败） */
export async function getUpdates(base: string, token: string, cursor: string, timeoutMs: number, signal?: AbortSignal): Promise<UpdatesResult> {
  const r = await request('POST', `${base}/ilink/bot/getupdates`, { token, body: { get_updates_buf: cursor || '' }, timeoutMs: timeoutMs + 5_000, signal })
  if (r.error === 'timeout') return { ok: true, stale: false, msgs: [], cursor: null, nextTimeoutMs: null }
  if (r.error === 'aborted') return { ok: false, stale: false, msgs: [], cursor: null, nextTimeoutMs: null, error: 'aborted' }
  const j = r.json
  if (isStale(j)) return { ok: false, stale: true, msgs: [], cursor: null, nextTimeoutMs: null, error: 'token 失效（-14）' }
  const failed = !r.ok || !j || (num(j.ret) !== undefined && num(j.ret) !== 0) || (num(j.errcode) !== undefined && num(j.errcode) !== 0)
  if (failed) return { ok: false, stale: false, msgs: [], cursor: null, nextTimeoutMs: null, error: apiError(r) }
  const msgs = Array.isArray(j!.msgs) ? (j!.msgs as unknown[]).filter((m): m is IlinkMessage => !!m && typeof m === 'object') : []
  return { ok: true, stale: false, msgs, cursor: str(j!.get_updates_buf) ?? null, nextTimeoutMs: num(j!.longpolling_timeout_ms) ?? null }
}

export interface SendResultIlink {
  ok: boolean
  stale?: boolean
  error?: string
}

/** 发一条文本。contextToken 必须是对方最近一条消息带来的那个（官方插件同样按「每个用户最新一个」缓存复用） */
export async function sendTextIlink(base: string, token: string, toUserId: string, contextToken: string, text: string): Promise<SendResultIlink> {
  const r = await request('POST', `${base}/ilink/bot/sendmessage`, {
    token,
    body: {
      msg: {
        from_user_id: '',
        to_user_id: toUserId,
        client_id: `bg-${randomUUID()}`,
        message_type: 2, // BOT
        message_state: 2, // FINISH
        context_token: contextToken,
        item_list: [{ type: 1, text_item: { text } }],
      },
    },
    timeoutMs: API_TIMEOUT_MS,
  })
  if (isStale(r.json)) return { ok: false, stale: true, error: 'token 失效（-14）' }
  const ret = num(r.json?.ret)
  if (!r.ok || (ret !== undefined && ret !== 0)) return { ok: false, error: apiError(r) }
  return { ok: true }
}

/** 收消息循环启动时告诉服务端「这个 bot 上线了」（腾讯插件同样在启动账号时调；失败不影响收发） */
export async function notifyStart(base: string, token: string): Promise<void> {
  await request('POST', `${base}/ilink/bot/msg/notifystart`, { token, body: {}, timeoutMs: 10_000 })
}
