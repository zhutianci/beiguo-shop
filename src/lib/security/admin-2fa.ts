/**
 * 管理员登录二次验证（2026-10-15 攻防加固，docs/安全-攻防加固设计-1015.md 3.4）。
 *
 * 后台是唯一能动钱、动卡密的入口，以前只有一道密码、token 30 天。10-15 那个人专门试过 /api/admin/auth/login。
 *  · 密码对了之后，**新设备**还要输一次发到管理员邮箱的 6 位验证码（EmailCode purpose = ADMIN_LOGIN，10 分钟有效、每码 5 次）；
 *  · 验过的设备记一张「受信设备」cookie（adm_dev，30 天，绑 userId + sessionEpoch：改密码 / 禁用即全部失效），30 天内只要密码；
 *  · 管理员 token 从 30 天缩到 ADMIN_TOKEN_HOURS（默认 12 小时）；
 *  · 后台在没见过的 IP 上登录成功 → 推一条安全告警（不论是否受信设备）。
 *
 * 【应急开关】ADMIN_LOGIN_2FA=0 关掉验证码（邮件发不出去、站长又进不了后台时用：改 .env.production 后重建 app 容器）。
 * 关掉后其余几条（token 时长、新 IP 告警）照常。
 */
import jwt from 'jsonwebtoken'
import { prisma } from '../db'
import { getJwtSecret } from '../jwt-secret'
import { notify } from '../notify'
import { clientIp, rateLimited } from '../news/rate-limit'

export const ADMIN_DEVICE_COOKIE = 'adm_dev'
const DEVICE_DAYS = 30
const KNOWN_IPS_KEY = 'security_admin_login_ips'
const KNOWN_IPS_MAX = 50

export function adminTwoFactorEnabled(): boolean {
  return process.env.ADMIN_LOGIN_2FA !== '0'
}

/** 管理员 token 时长（小时），1–720，默认 12 */
export function adminTokenHours(): number {
  const n = parseInt(process.env.ADMIN_TOKEN_HOURS || '12')
  return Number.isFinite(n) && n >= 1 && n <= 720 ? n : 12
}

export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at <= 0) return '***'
  const name = email.slice(0, at)
  return `${name.slice(0, 2)}***${email.slice(at)}`
}

/** 签一张受信设备 cookie 的值（只在验证码通过之后调用） */
export function signAdminDevice(userId: number, epoch: number): string | null {
  const secret = getJwtSecret()
  if (!secret) return null
  return jwt.sign({ k: 'adm-dev', uid: userId, ep: epoch }, secret, { expiresIn: `${DEVICE_DAYS}d` })
}

export function adminDeviceCookieOptions(secure: boolean) {
  return { httpOnly: true, secure, sameSite: 'strict' as const, path: '/', maxAge: DEVICE_DAYS * 24 * 3600 }
}

/** cookie 是否是这个管理员、这个会话版本签发的受信设备 */
export function isTrustedAdminDevice(value: string | undefined, userId: number, epoch: number): boolean {
  if (!value) return false
  const secret = getJwtSecret()
  if (!secret) return false
  try {
    const p = jwt.verify(value, secret, { algorithms: ['HS256'] }) as { k?: unknown; uid?: unknown; ep?: unknown }
    return p.k === 'adm-dev' && p.uid === userId && p.ep === epoch
  } catch {
    return false
  }
}

/** 只验受信设备 cookie 的签名与类型（不知道是哪个账号时用：登录限流在查库之前） */
export function adminDeviceSignatureValid(value: string | undefined): boolean {
  if (!value) return false
  const secret = getJwtSecret()
  if (!secret) return false
  try {
    const p = jwt.verify(value, secret, { algorithms: ['HS256'] }) as { k?: unknown }
    return p.k === 'adm-dev'
  } catch {
    return false
  }
}

/**
 * 管理员登录成功后调用：没见过的 IP → 推安全告警，并记进最近 20 个见过的 IP。fire-and-forget，绝不抛。
 */
export function noteAdminLogin(user: { id: number; email: string | null }, headers: Headers, via: 'PASSWORD' | 'CODE'): void {
  void (async () => {
    const ip = clientIp(headers)
    if (!ip || ip === 'unknown') return
    const row = await prisma.setting.findUnique({ where: { key: KNOWN_IPS_KEY }, select: { value: true } })
    let known: string[] = []
    try {
      const v = JSON.parse(row?.value || '[]')
      if (Array.isArray(v)) known = v.filter((x): x is string => typeof x === 'string')
    } catch {
      known = []
    }
    const seen = known.includes(ip)
    const next = [ip, ...known.filter((x) => x !== ip)].slice(0, KNOWN_IPS_MAX)
    await prisma.setting.upsert({
      where: { key: KNOWN_IPS_KEY },
      create: { key: KNOWN_IPS_KEY, value: JSON.stringify(next) },
      update: { value: JSON.stringify(next) },
    })
    knownIpCache = null // 后台新 IP 检查（noteAdminRequestIp）下次重新读
    // 【每次登录成功都推】（2026-10-24 第二轮加固 M4）：以前只在新 IP 推，受信设备 + 老 IP 的登录完全无声——
    // 被盗号的人用站长常用网络（同一个公司 / 家庭出口）登录时，站长什么都看不到。新 IP 的标题更醒目。
    // 第一次记录（列表为空）不算「新 IP」：上线后站长的第一次登录不该被当成异常
    const isNew = !seen && known.length > 0
    notify(
      'security.alert',
      [
        { label: '类型', value: isNew ? '⚠️ 管理员在新 IP 登录后台' : '管理员登录后台' },
        { label: '账号', value: user.email ?? `#${user.id}` },
        { label: 'IP', value: ip },
        { label: '方式', value: via === 'CODE' ? '密码 + 邮箱验证码' : '密码（受信设备）' },
        { label: 'UA', value: (headers.get('user-agent') || '').slice(0, 120) },
        { label: '说明', value: '如果不是你本人，请立即用「忘记密码」重置密码（会让所有登录态与受信设备一起失效）' },
      ],
      { link: '/admin/settings', linkText: '后台查看安全记录' },
    )
  })().catch((e) => console.error('[admin-2fa] 记录登录 IP 失败', (e as Error)?.message))
}

/*
 * 【后台会话在新 IP 上使用】（2026-10-25 第三轮加固）偷到 cookie 的人不用登录，直接拿会话打后台接口：
 * 以前这种使用不会产生任何登录事件、也没有告警（10-25 线上就出现过一次「没有登录记录的新 IP 在用后台」，经核实是站长换了网络）。
 * 现在每个后台请求都看一眼来源 IP：不在「见过的 IP」里 → 推一条告警并记进去（同一 IP 只推一次）。
 * 见过的 IP 列表进程内缓存 5 分钟，平时零查库；写库失败只记日志。
 */
let knownIpCache: { at: number; ips: Set<string> } | null = null
const KNOWN_CACHE_MS = 5 * 60_000

async function knownAdminIps(): Promise<Set<string>> {
  if (knownIpCache && Date.now() - knownIpCache.at < KNOWN_CACHE_MS) return knownIpCache.ips
  const row = await prisma.setting.findUnique({ where: { key: KNOWN_IPS_KEY }, select: { value: true } })
  let list: string[] = []
  try {
    const v = JSON.parse(row?.value || '[]')
    if (Array.isArray(v)) list = v.filter((x): x is string => typeof x === 'string')
  } catch {
    list = []
  }
  knownIpCache = { at: Date.now(), ips: new Set(list) }
  return knownIpCache.ips
}

export async function noteAdminRequestIp(user: { id: number; email: string | null }, headers: Headers): Promise<void> {
  try {
    const ip = clientIp(headers)
    if (!ip || ip === 'unknown') return
    const known = await knownAdminIps()
    if (known.has(ip) || known.size === 0) return
    known.add(ip) // 先占上：同一进程里并发的几个后台请求只推一条
    if (rateLimited(`admin-newip:${ip}`, { windowMs: 24 * 60 * 60_000, max: 1 })) return
    const row = await prisma.setting.findUnique({ where: { key: KNOWN_IPS_KEY }, select: { value: true } })
    let list: string[] = []
    try {
      const v = JSON.parse(row?.value || '[]')
      if (Array.isArray(v)) list = v.filter((x): x is string => typeof x === 'string')
    } catch {
      list = []
    }
    const next = [ip, ...list.filter((x) => x !== ip)].slice(0, KNOWN_IPS_MAX)
    await prisma.setting.upsert({
      where: { key: KNOWN_IPS_KEY },
      create: { key: KNOWN_IPS_KEY, value: JSON.stringify(next) },
      update: { value: JSON.stringify(next) },
    })
    notify(
      'security.alert',
      [
        { label: '类型', value: '⚠️ 后台登录态在新 IP 上使用（这次没有登录动作）' },
        { label: '账号', value: user.email ?? `#${user.id}` },
        { label: 'IP', value: ip },
        { label: 'UA', value: (headers.get('user-agent') || '').slice(0, 120) },
        { label: '说明', value: '换了网络（手机流量、VPN）也会触发。如果不是你本人：立即在后台点「退出登录」（管理员退出会让所有设备的后台登录一起失效），再联系技术改密码' },
      ],
      { link: '/admin/settings', linkText: '后台查看安全记录' },
    )
  } catch (e) {
    console.error('[admin-2fa] 后台新 IP 检查失败', (e as Error)?.message)
  }
}

/**
 * 管理员能不能在网页上自助找回密码（2026-10-25 第三轮加固）：默认不能。
 * 管理员的第二道关就是邮箱验证码，如果网页还能凭邮箱验证码改密码，邮箱被盗 = 密码 + 验证码两道一起丢，后台直接被拿走。
 * 关掉之后两道是独立的：拿到邮箱还得知道密码。站长真忘了密码时，临时设 ADMIN_WEB_RESET=1 重启 app，改完删掉。
 */
export function adminWebResetAllowed(): boolean {
  return process.env.ADMIN_WEB_RESET === '1'
}

/** 有人为管理员账号申请网页找回密码 → 告警（每小时最多一条） */
export function noteAdminResetAttempt(userId: number, headers: Headers): void {
  try {
    if (rateLimited(`admin-reset-alert:${userId}`, { windowMs: 60 * 60_000, max: 1 })) return
    notify(
      'security.alert',
      [
        { label: '类型', value: '⚠️ 有人为管理员账号申请网页找回密码' },
        { label: '来源 IP', value: clientIp(headers) },
        { label: 'UA', value: (headers.get('user-agent') || '').slice(0, 120) },
        { label: '处置', value: '管理员不能在网页找回密码，没有发验证码。不是你本人操作的话，请检查管理员邮箱的安全（改密码、开两步验证）' },
      ],
      { link: '/admin/settings', linkText: '后台查看安全记录' },
    )
  } catch (e) {
    console.error('[admin-2fa] 找回密码告警失败', (e as Error)?.message)
  }
}

/*
 * 【管理员密码连错锁定】（2026-10-25 第三轮加固）同一管理员 15 分钟内输错 5 次 → 30 分钟内**非受信设备**一律拒绝密码登录
 * （不论密码对不对，回的是与普通账号限流同一句话，不暴露这是管理员）。受信设备（站长自己常用的浏览器）不受影响，
 * 所以攻击者故意输错也锁不住站长。进程内计数（发版清零，放行方向）。
 */
const ADMIN_LOCK_MS = 30 * 60_000
const adminLocks = new Map<number, number>()

export function adminPasswordLocked(userId: number): boolean {
  const until = adminLocks.get(userId)
  if (!until) return false
  if (until <= Date.now()) {
    adminLocks.delete(userId)
    return false
  }
  return true
}

/**
 * 管理员账号输错密码（2026-10-24 M4）：同一管理员 15 分钟内第 3 次输错时推一条（每小时最多一条）；
 * 第 6 次起锁定 30 分钟（只挡非受信设备，见上）。
 * 只在登录接口判明「这个邮箱是管理员」且密码不对时调用；不改变登录接口对外的响应（不暴露这是管理员账号）。
 */
export function noteAdminPasswordFailure(user: { id: number; email: string | null }, headers: Headers): void {
  try {
    if (rateLimited(`admin-pw-lock:${user.id}`, { windowMs: 15 * 60_000, max: 5 }) && !adminPasswordLocked(user.id)) {
      adminLocks.set(user.id, Date.now() + ADMIN_LOCK_MS)
      notify(
        'security.alert',
        [
          { label: '类型', value: '⚠️ 管理员账号被连续猜密码，已锁定 30 分钟' },
          { label: '账号', value: user.email ?? `#${user.id}` },
          { label: '来源 IP', value: clientIp(headers) },
          { label: '处置', value: '30 分钟内只有你已验证过的受信设备能登录后台，其它设备一律拒绝' },
        ],
        { link: '/admin/settings', linkText: '后台查看安全记录' },
      )
    }
    if (!rateLimited(`admin-pw-fail:${user.id}`, { windowMs: 15 * 60_000, max: 2 })) return
    if (rateLimited(`admin-pw-fail-alert:${user.id}`, { windowMs: 60 * 60_000, max: 1 })) return
    notify(
      'security.alert',
      [
        { label: '类型', value: '管理员账号连续输错密码' },
        { label: '账号', value: user.email ?? `#${user.id}` },
        { label: '来源 IP', value: clientIp(headers) },
        { label: 'UA', value: (headers.get('user-agent') || '').slice(0, 120) },
        { label: '说明', value: '15 分钟内第 3 次输错。若不是你本人在试，说明有人在猜后台密码；密码够强、且新设备还要邮箱验证码，一般猜不进来' },
      ],
      { link: '/admin/settings', linkText: '后台查看安全记录' },
    )
  } catch (e) {
    console.error('[admin-2fa] 输错密码告警失败', (e as Error)?.message)
  }
}
