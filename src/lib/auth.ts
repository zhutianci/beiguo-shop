import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { cookies, headers } from 'next/headers'
import { prisma } from './db'
import { getJwtSecret } from './jwt-secret'
import { crossSiteReason } from './same-origin'
import { getStorefront, type Storefront } from './storefront/resolve'
import { AdminHostError } from './tenant/admin-host-error'

/*
 * 【渠道分站：登录态按店面隔离（设计 4.6 C3、4.7；实施分包 WP1）】
 * 账号是全局的（同邮箱同账号），但**一张 token 只在签发它的店面有效**：
 *  · 签发时写 aud = 店面 code（主站 'main'）与 tid = 店面 id；签发只在 login / register 两处，sf 必填。
 *  · 校验（verifyTokenFor）按当前店面比对 aud。不用 jsonwebtoken 的 audience 选项：老 token 没有 aud，
 *    用它会让全站老用户一上线就掉线。
 *  · 老 token（无 aud）只在主站店面接受，且 JWT_LEGACY_TOKENS='reject' 时一律拒绝（上线 30 天后切换）。
 *  · aud 是数组一律拒绝（jsonwebtoken 允许数组 aud，数组里同时写 main 和 lulu 就能两站通吃）。
 * 这只保证「lulu 的 cookie 拿到主站没用、主站的 token 以 Bearer 打 lulu 没用」（验收 W1-1）；
 * 数据隔离仍要每个查询带 tenantId: sf.id。
 * 休眠时店面恒为主站：老 token 照常有效，新 token 多一个 aud=main（设计 4.10 ③）。
 */
export interface JwtPayload {
  userId: number
  email: string
  role: string
  /** 签发店面 code（主站 'main'）。老 token 没有 */
  aud?: string
  /** 签发店面 id（主站 1）。有就必须与当前店面一致 */
  tid?: number
  /**
   * 会话版本（User.sessionEpoch 的签发时快照）。重置密码 / 禁用账号 / 移出渠道时库里的值 +1，旧 token 立即失效。
   * 契约字段名是 ep；P0 前置上线的版本写的是 sv。签发时两个都写（值相同）：回滚到旧镜像时旧代码读 sv 仍然对得上，
   * 不会让 sessionEpoch>0 的用户掉线。校验时优先 ep、其次 sv，都没有按 0（老 token，上线那一刻不让任何人掉线）
   */
  ep?: number
  sv?: number
  iat?: number
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

/**
 * 签发登录 token。sf 必填：token 绑定签发它的店面（aud = code、tid = id）。
 * 只在 /api/auth/login、/api/auth/register 两处调用（边界检查）。显式挑字段，调用方多传的东西不会进 token。
 */
export function signToken(p: { userId: number; email: string; role: string; ep: number }, sf: Pick<Storefront, 'id' | 'code'>): string {
  const secret = getJwtSecret()
  if (!secret) throw new Error('JWT_SECRET 未配置')
  if (!sf || typeof sf.code !== 'string' || !sf.code || !Number.isInteger(sf.id) || sf.id < 1) {
    throw new Error('signToken 缺少签发店面')
  }
  const ep = Number.isInteger(p.ep) && p.ep >= 0 ? p.ep : 0
  const payload: JwtPayload = { userId: p.userId, email: p.email, role: p.role, aud: sf.code, tid: sf.id, ep, sv: ep }
  return jwt.sign(payload, secret, { expiresIn: '30d' })
}

/** 老 token（无 aud）是否仍被主站接受：默认接受；JWT_LEGACY_TOKENS='reject' 时拒绝（上线 30 天后切） */
function legacyTokensAccepted(): boolean {
  return process.env.JWT_LEGACY_TOKENS !== 'reject'
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

/**
 * 只验签名与有效期，**不看店面**。仅供 verifyTokenFor 与 getCurrentUserUnscoped 内部使用；
 * 请求路径上一律用 verifyTokenFor / getCurrentUser。
 */
export function verifyToken(token: string): JwtPayload | null {
  const secret = getJwtSecret()
  if (!secret) return null // fail closed：没有密钥 = 谁都不认（lib/jwt-secret.ts）
  try {
    const p = jwt.verify(token, secret, { algorithms: ['HS256'] })
    // 字符串载荷与缺 userId 的载荷都不是我们签的登录 token
    if (!p || typeof p !== 'object' || typeof (p as JwtPayload).userId !== 'number') return null
    return p as JwtPayload
  } catch {
    return null
  }
}

/**
 * 按店面校验 token（设计 4.6 C3）。返回 null = 视为未登录。
 *  · aud 是数组 / 非字符串 → 拒；
 *  · 无 aud（老 token）→ 只在 PLATFORM 店面、且 JWT_LEGACY_TOKENS≠'reject' 时接受；
 *  · 有 aud → 必须等于 sf.code；带 tid 时还必须等于 sf.id（code 与 id 两把尺子都对上才算）。
 */
export function verifyTokenFor(token: string, sf: Pick<Storefront, 'id' | 'code' | 'kind'>): JwtPayload | null {
  if (!sf) return null
  const p = verifyToken(token)
  if (!p) return null
  const aud = (p as { aud?: unknown }).aud
  if (aud === undefined) {
    return sf.kind === 'PLATFORM' && legacyTokensAccepted() ? p : null
  }
  if (typeof aud !== 'string' || aud !== sf.code) return null
  const tid = (p as { tid?: unknown }).tid
  if (tid !== undefined && tid !== sf.id) return null
  return p
}

/** 会话版本：优先契约字段 ep，其次 P0 前置写的 sv，都没有按 0 */
function tokenEpoch(p: JwtPayload): number {
  if (typeof p.ep === 'number') return p.ep
  if (typeof p.sv === 'number') return p.sv
  return 0
}

/** 从请求里取 token：cookie 优先，没有再看 Authorization: Bearer */
async function requestToken(): Promise<string | null> {
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
  return token || null
}

/**
 * 当前登录用户（签名不变；cookie 与 Bearer 两条路径同一套店面校验）。
 *  · 店面取自 getStorefront()（**不包进 try**）；没有店面的 Host（严格期未知 Host、域名停用）→ null；
 *  · token 必须是当前店面签发的（verifyTokenFor）；
 *  · CHANNEL 店面上 role=ADMIN 一律 null（设计 4.7：超管账号不能在渠道站登录，防旧 token / 夹带）。
 */
export async function getCurrentUser() {
  const sf = await getStorefront()
  if (!sf) return null

  const token = await requestToken()
  if (!token) return null

  const payload = verifyTokenFor(token, sf)
  if (!payload) return null

  const user = await loadSessionUser(payload)
  if (!user) return null
  if (sf.kind !== 'PLATFORM' && user.role === 'ADMIN') return null
  return user
}

/**
 * 不看店面的当前用户：只验签名、有效期、账号状态与会话版本。
 * **仅限异步 / 内部路径**（没有可信店面的场景）；边界检查禁止它出现在 src/app/api/** ——
 * 请求路径上用它就绕过了 aud 隔离。tokenOrNull 不传时从当前请求取。
 */
export async function getCurrentUserUnscoped(tokenOrNull?: string) {
  const token = tokenOrNull === undefined ? await requestToken() : tokenOrNull
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  return loadSessionUser(payload)
}

/** 按 token 载荷查库复核：账号存在、未禁用、会话版本一致。返回字段与改造前的 getCurrentUser 完全一致 */
async function loadSessionUser(payload: JwtPayload) {

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
  // 会话吊销：token 里的版本必须等于库里当前版本（重置密码 / 禁用 / 移出渠道后 +1）。
  // 用 typeof 判断而不是真值判断：旧 token 没有这个字段，按 0 处理，不能一上线就让全站掉线
  if (tokenEpoch(payload) !== user.sessionEpoch) return null
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
   * 【第一步：只在主站店面生效（设计 4.7 第 3 条）】非 PLATFORM（含没有店面的 Host）抛 AdminHostError，
   * adminGuard 把它映射为 404；只调本函数、不经 adminGuard 的 20 个超管路由各自的 catch 会回 403——都不放行。
   * 休眠时店面恒为主站，这一步永远不抛，主站行为不变。getStorefront 不包进 try（店面解析铁律）。
   */
  const sf = await getStorefront()
  if (!sf || sf.kind !== 'PLATFORM') throw new AdminHostError()
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
