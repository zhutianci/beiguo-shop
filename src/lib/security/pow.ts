/**
 * 无感人机验证：工作量证明（2026-10-25 第三轮加固，站长选「无感算力验证」，docs/安全-第三轮加固-1025.md）。
 *
 * 【为什么】登录、注册、发验证码、找回密码、邮箱查订阅这几个口子一直在被脚本刷（10-25 一个 IP 一天试了 79 次重置码）。
 * 限流 + 封 IP 只能事后止损，脚本换个 IP 就从头再来。这里要求每次提交前，浏览器先在后台算一道 SHA-256 题：
 * 正常客户无感（手机约 0.2～1 秒，和按钮转圈同时发生），脚本每打一次都要付算力；被判可疑的 IP 题目难 8 倍。
 * 不依赖任何第三方（国内访问不受影响），也不需要客户点图片。
 *
 * 【协议】GET /api/auth/pow?p=<用途> → { challenge, bits }。challenge = v1.<base64url(JSON)>.<HMAC>，JSON 里有用途、随机盐、
 *   过期时间、难度；签名用从 JWT_SECRET 派生的独立子密钥（HKDF info=pow-v1）。
 *   浏览器找一个 nonce 使 SHA-256(challenge + "." + nonce) 的前 bits 位全是 0，提交时带请求头 x-pow: <challenge>.<nonce>（见 lib/pow-client.ts）。
 *   服务端验：签名、用途、没过期、前导零够数、没用过（一次性，进程内记到过期为止）。
 *
 * 【应急】POW_MODE=off 关掉校验（改 .env.production 后 up -d app 即生效）；默认开启。
 */
import { createHash, createHmac, hkdfSync, randomBytes, timingSafeEqual } from 'crypto'
import { getJwtSecret } from '../jwt-secret'
import { clientIp, rateFull } from '../news/rate-limit'
import { ipKey } from '../ip-key'
import { ipBlocked } from './ip-ban'

export type PowPurpose = 'login' | 'register' | 'send' | 'reset' | 'lookup'
export const POW_PURPOSES: readonly PowPurpose[] = ['login', 'register', 'send', 'reset', 'lookup']

const TTL_MS = 3 * 60_000
/** 平时的难度：期望 2^18 ≈ 26 万次哈希 */
export const POW_BITS_NORMAL = 18
/** 可疑 IP（最近被限流 / 验码失败过）的难度：期望 2^21 ≈ 210 万次 */
export const POW_BITS_SUSPECT = 21

export function powEnabled(): boolean {
  return process.env.POW_MODE !== 'off'
}

let cachedKey: { root: string; key: Buffer } | null = null
function powKey(): Buffer | null {
  const root = getJwtSecret()
  if (!root) return null
  if (cachedKey && cachedKey.root === root) return cachedKey.key
  const key = Buffer.from(hkdfSync('sha256', Buffer.from(root, 'utf8'), Buffer.from('bigolab-pow', 'utf8'), Buffer.from('pow-v1', 'utf8'), 32))
  cachedKey = { root, key }
  return key
}

function b64url(buf: Buffer): string {
  return buf.toString('base64url')
}

function mac(key: Buffer, body: string): string {
  return createHmac('sha256', key).update(body).digest('base64url')
}

/** 这个 IP 最近有没有被限流 / 验码失败的记录（与 lib/auth-throttle.ts 的 key 同一口径；只看不记） */
function suspicious(headers: Headers): boolean {
  const raw = clientIp(headers)
  if (!raw || raw === 'unknown') return false
  const ip = ipKey(raw)
  return (
    rateFull(`vcv-ip:${ip}`, { windowMs: 10 * 60_000, max: 10 }) ||
    rateFull(`login-ip:${ip}`, { windowMs: 10 * 60_000, max: 10 }) ||
    rateFull(`vcs-ip:${ip}`, { windowMs: 10 * 60_000, max: 5 })
  )
}

export function powDifficulty(headers: Headers): number {
  return suspicious(headers) ? POW_BITS_SUSPECT : POW_BITS_NORMAL
}

/** 签发一道题 */
export function issuePowChallenge(purpose: PowPurpose, headers: Headers, now: number = Date.now()): { challenge: string; bits: number } | null {
  const key = powKey()
  if (!key) return null
  const bits = powDifficulty(headers)
  const body = b64url(Buffer.from(JSON.stringify({ p: purpose, s: randomBytes(12).toString('hex'), e: now + TTL_MS, d: bits }), 'utf8'))
  return { challenge: `v1.${body}.${mac(key, body)}`, bits }
}

/** SHA-256 结果的前导零位数 */
export function leadingZeroBits(buf: Buffer): number {
  let n = 0
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i]
    if (b === 0) {
      n += 8
      continue
    }
    for (let k = 7; k >= 0; k--) {
      if ((b >> k) & 1) return n
      n++
    }
    return n
  }
  return n
}

// 用过的题（challenge → 过期时间）：一次性。进程内即可——题 3 分钟过期，重启后旧题照样过期
const used = new Map<string, number>()

export type PowReject = 'missing' | 'malformed' | 'bad_sig' | 'wrong_purpose' | 'expired' | 'weak' | 'reused'

/**
 * 校验请求头 x-pow。返回 null = 通过（同时把这道题作废），否则是拒绝原因。
 * POW_MODE=off 时一律通过。
 */
export function checkPow(headerValue: string | null | undefined, purpose: PowPurpose, now: number = Date.now()): PowReject | null {
  if (!powEnabled()) return null
  const v = String(headerValue || '').trim()
  if (!v) return 'missing'
  const parts = v.split('.')
  // v1 . body . mac . nonce
  if (parts.length !== 4 || parts[0] !== 'v1' || !parts[3] || parts[3].length > 32) return 'malformed'
  const [, body, sig, nonce] = parts
  const key = powKey()
  if (!key) return 'bad_sig'
  const expect = Buffer.from(mac(key, body))
  const got = Buffer.from(sig)
  if (expect.length !== got.length || !timingSafeEqual(expect, got)) return 'bad_sig'
  let payload: { p?: unknown; e?: unknown; d?: unknown }
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return 'malformed'
  }
  if (payload.p !== purpose) return 'wrong_purpose'
  if (typeof payload.e !== 'number' || payload.e < now) return 'expired'
  const bits = typeof payload.d === 'number' ? payload.d : POW_BITS_NORMAL
  const challenge = `v1.${body}.${sig}`
  const hash = createHash('sha256').update(`${challenge}.${nonce}`, 'utf8').digest()
  if (leadingZeroBits(hash) < bits) return 'weak'
  if (used.size > 20000) used.forEach((exp, k) => exp < now && used.delete(k))
  const prev = used.get(challenge)
  if (prev !== undefined && prev > now) return 'reused'
  used.set(challenge, payload.e)
  return null
}

export const POW_FAIL_MSG = '安全校验未通过，请刷新页面后重试'

/** 路由里用：不通过返回 403 响应，通过返回 null */
export function powGuard(request: Request, purpose: PowPurpose): Response | null {
  const r = checkPow(request.headers.get('x-pow'), purpose)
  if (!r) return null
  // 被封禁的 IP 走各自的 429 文案（路由里 ipBlocked 在前）；这里只记一下原因
  if (!ipBlocked(request.headers)) console.warn('[pow] 拒绝', purpose, r)
  return Response.json({ success: false, error: POW_FAIL_MSG, powRequired: true }, { status: 403 })
}

/** 仅供自测：求解（Node） */
export function solvePowForTest(challenge: string, bits: number): string {
  for (let i = 0; ; i++) {
    const nonce = i.toString(36)
    if (leadingZeroBits(createHash('sha256').update(`${challenge}.${nonce}`, 'utf8').digest()) >= bits) return nonce
  }
}

export function resetPowForTest(): void {
  used.clear()
}
