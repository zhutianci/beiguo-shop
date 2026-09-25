import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { cookies, headers } from 'next/headers'
import { prisma } from './db'
import { getJwtSecret } from './jwt-secret'
import { crossSiteReason } from './same-origin'

export interface JwtPayload {
  userId: number
  email: string
  role: string
  // 会话版本（User.sessionEpoch 的签发时快照）。重置密码 / 禁用账号时库里的值 +1，
  // 旧 token 立即失效。旧 token 没有这个字段，按 0 处理——上线那一刻不会让任何人掉线
  sv?: number
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

let dummyHash: Promise<string> | null = null
/**
 * 用户不存在时也跑一次同成本的 bcrypt，让登录时延和用户存在时一样（防客户名单枚举：
 * bcryptjs 是纯 JS，一次 compare 约 100ms，不拉平的话「查无此人」秒回，一测就知道）。
 */
export async function verifyPasswordOrDummy(password: string, hash: string | null | undefined): Promise<boolean> {
  if (hash) return bcrypt.compare(password, hash)
  if (!dummyHash) dummyHash = bcrypt.hash(randomBytes(16).toString('hex'), 10)
  await bcrypt.compare(password, await dummyHash)
  return false
}

export const AUTH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 天

export function signToken(payload: JwtPayload): string {
  const secret = getJwtSecret()
  if (!secret) throw new Error('JWT_SECRET 未配置')
  return jwt.sign(payload, secret, { expiresIn: '30d' })
}

// 是否用 secure cookie：按真实请求协议判断（兼容 http 直连 IP / https 域名）
export function isHttpsRequest(request: { headers: { get(name: string): string | null } }): boolean {
  const proto = request.headers.get('x-forwarded-proto')
  if (proto) return proto.split(',')[0].trim() === 'https'
  return (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://')
}

// 统一的登录 cookie 选项
export function authCookieOptions(request: { headers: { get(name: string): string | null } }) {
  return {
    httpOnly: true,
    secure: isHttpsRequest(request),
    sameSite: 'lax' as const,
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  }
}

export function verifyToken(token: string): JwtPayload | null {
  const secret = getJwtSecret()
  if (!secret) return null // fail closed：没有密钥 = 谁都不认（lib/jwt-secret.ts）
  try {
    return jwt.verify(token, secret, { algorithms: ['HS256'] }) as JwtPayload
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  let token = cookieStore.get('token')?.value

  // 兜底：微信等 WebView 不持久化 cookie 时，客户端会以 Authorization: Bearer 携带 token
  if (!token) {
    const h = await headers()
    const auth = h.get('authorization')
    if (auth && auth.startsWith('Bearer ')) {
      token = auth.slice(7).trim()
    }
  }

  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      phone: true,
      nickname: true,
      avatar: true,
      balance: true,
      vipLevel: true,
      role: true,
      status: true,
      sessionEpoch: true,
    },
  })

  /*
   * 【被禁用的账户一律按「未登录」处理】原来只有登录接口拦 status，而 token 有效期 30 天 ——
   * 管理员禁用一个账户后，他手里的旧 token 还能继续下单、领券、发起支付。
   * 这里是所有买家接口与 requireAdmin 的共同入口，在这一处拦住就全站生效
   * （被禁用的管理员同样过不了 requireAdmin）。
   * status 只用于这一个判断，不放进返回值：返回的字段与原来完全一致，调用方不受影响。
   */
  if (!user || user.status !== 1) return null
  // 会话吊销：token 里的版本必须等于库里当前版本（重置密码 / 禁用后 +1）。
  // 用 typeof 判断而不是 !payload.sv：旧 token 没有 sv，按 0 处理，不能一上线就让全站掉线
  const tokenEpoch = typeof payload.sv === 'number' ? payload.sv : 0
  if (tokenEpoch !== user.sessionEpoch) return null
  const { status: _status, sessionEpoch: _epoch, ...rest } = user
  return rest
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireAdmin() {
  /*
   * 同源校验（审计 G09，规则见 lib/same-origin.ts）。必须放在这里而不只放在 adminGuard：
   * 有 20 个后台路由（含 vmq/complete 强制记到账、referrals/balance 加余额）直接调本函数、不经过 adminGuard，
   * 兄弟子域的 simple POST 会带着 Lax cookie 打进来。requireAdmin 只供 /api/admin 路由用
   * （不要在页面 / server component 里调：从聊天软件点链接进来 Sec-Fetch-Site 是 cross-site，会误拒）。
   * 抛 Forbidden 与「不是管理员」同一出口，各路由现有的 catch → 403 不用改。
   */
  const reason = crossSiteReason(await headers())
  if (reason) {
    console.warn('[requireAdmin] 拒绝非同源的后台请求:', reason)
    throw new Error('Forbidden')
  }
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Forbidden')
  }
  return user
}
