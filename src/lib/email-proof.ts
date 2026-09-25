/**
 * 「邮箱归属证明」：匿名买家（多来自闲鱼、没注册）凭邮箱验证码证明自己是某个订阅账户邮箱的主人，
 * 之后 30 分钟内可以查订阅、开票、付税费、开收据、改到期提醒，不用再验。
 *
 * 【为什么要有】2026-09-25 审计 G11/G12/G13/G14：这些匿名接口以前的「凭证」只是**说出账户邮箱**——
 * 而邮箱不是秘密（同行手里有大量客户邮箱，站内订单背书行的账户邮箱就是买家的登录邮箱）。
 * 于是任何人都能：凭邮箱查到别人的全部订阅和收据令牌（进而看到付款人抬头）、读到提醒手机号明文、
 * 改掉别人的提醒去向、改写别人已付过 6% 的发票抬头、抢先给别人的订单开盖章收据。
 *
 * 【形态】签名的 httpOnly cookie `lk`，内容是**邮箱摘要**的列表（不放明文邮箱）+ 过期时间，
 * HMAC 密钥由 JWT_SECRET 派生（与登录 JWT 不同的用途标签，互相不能冒充）。
 * path 限定 /api、SameSite=Strict：只有本站页面发起的接口请求会带上它。
 *
 * 放行规则（hasAccountAccess）：以下任一成立即视为「本人」——
 *  1. cookie 里有该邮箱的证明（刚用 LOOKUP 验证码验过）
 *  2. 登录用户的登录邮箱就是它，且这个登录邮箱验证过（User.emailVerifiedAt 非空）
 *  3. 登录用户绑定过它，且绑定时验证过（UserAccount.verifiedAt 非空）
 */
import crypto from 'crypto'
import { cookies, headers } from 'next/headers'
import { prisma } from './db'
import { getJwtSecret } from './jwt-secret'
import { isHttpsRequest } from './auth'

export const PROOF_COOKIE = 'lk'
export const PROOF_TTL_SEC = 30 * 60
const MAX_DIGESTS = 5 // 一次会话里最多证明 5 个邮箱（帮家人朋友查也够用）

function proofKey(): Buffer | null {
  const s = getJwtSecret()
  if (!s) return null
  return crypto.createHmac('sha256', s).update('email-proof-v1').digest()
}

const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64url')

/** 邮箱摘要：小写去空白后 sha256 前 32 位十六进制 */
export function emailDigest(email: string): string {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 32)
}

interface ProofBody {
  h: string[] // 邮箱摘要
  x: number // 过期时刻（毫秒）
}

function sign(body: ProofBody): string | null {
  const key = proofKey()
  if (!key) return null
  const payload = b64u(JSON.stringify(body))
  const mac = b64u(crypto.createHmac('sha256', key).update(payload).digest())
  return `${payload}.${mac}`
}

function parse(raw: string | undefined | null): ProofBody | null {
  if (!raw) return null
  const key = proofKey()
  if (!key) return null
  const dot = raw.indexOf('.')
  if (dot <= 0) return null
  const payload = raw.slice(0, dot)
  const mac = Buffer.from(raw.slice(dot + 1), 'base64url')
  const expect = crypto.createHmac('sha256', key).update(payload).digest()
  if (mac.length !== expect.length || !crypto.timingSafeEqual(mac, expect)) return null
  try {
    const body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as ProofBody
    if (!Array.isArray(body.h) || typeof body.x !== 'number' || body.x < Date.now()) return null
    return { h: body.h.filter((d) => typeof d === 'string').slice(0, MAX_DIGESTS), x: body.x }
  } catch {
    return null
  }
}

/** 请求头兜底：微信等 App 内置浏览器常常不保存 fetch 响应下发的 httpOnly cookie（lib/auth-token.ts 同一个坑），
 *  验证接口同时在响应体里给出同一张签名证明，前端存 sessionStorage 后用这个头带回。签名与过期校验完全相同 */
export const PROOF_HEADER = 'x-email-proof'

/** 当前请求（cookie 或兜底请求头）里已证明的邮箱摘要集合（没有 / 过期 / 签名不对 → 空集） */
export async function readProofDigests(): Promise<Set<string>> {
  const store = await cookies()
  const out = new Set<string>(parse(store.get(PROOF_COOKIE)?.value)?.h ?? [])
  const h = await headers()
  const viaHeader = parse(h.get(PROOF_HEADER))
  if (viaHeader) viaHeader.h.forEach((d) => out.add(d))
  return out
}

/**
 * 验码成功后调用：把这个邮箱加进证明（保留其它仍有效的），整体续期 30 分钟。
 * 返回新 cookie 值；密钥未配置时返回 null（调用方按失败处理）。
 */
export async function addProof(email: string): Promise<string | null> {
  // 保留 cookie 与兜底请求头里仍有效的其它邮箱证明
  const prev = await readProofDigests()
  const d = emailDigest(email)
  const h = [d, ...Array.from(prev).filter((x) => x !== d)].slice(0, MAX_DIGESTS)
  return sign({ h, x: Date.now() + PROOF_TTL_SEC * 1000 })
}

export function proofCookieOptions(request: { headers: { get(name: string): string | null } }) {
  return {
    httpOnly: true,
    secure: isHttpsRequest(request),
    sameSite: 'strict' as const,
    path: '/api',
    maxAge: PROOF_TTL_SEC,
  }
}

/**
 * 是否可以以「本人」身份操作这个订阅账户邮箱（查订阅、提醒方式、开票开收据）。
 * digests 由调用方传入（同一请求里多次判断时只读一次 cookie）。
 */
export async function hasAccountAccess(
  account: string,
  user: { id: number; email?: string | null } | null,
  digests: Set<string>
): Promise<boolean> {
  const acc = (account || '').trim().toLowerCase()
  if (!acc) return false
  if (digests.has(emailDigest(acc))) return true
  if (!user) return false
  if (user.email && user.email.trim().toLowerCase() === acc) {
    const u = await prisma.user.findUnique({ where: { id: user.id }, select: { emailVerifiedAt: true } })
    if (u?.emailVerifiedAt) return true
  }
  const bound = await prisma.userAccount.findFirst({
    where: { userId: user.id, accountEmail: acc, verifiedAt: { not: null } },
    select: { id: true },
  })
  return !!bound
}
