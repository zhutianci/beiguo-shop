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
import { clientIp } from '../news/rate-limit'

export const ADMIN_DEVICE_COOKIE = 'adm_dev'
const DEVICE_DAYS = 30
const KNOWN_IPS_KEY = 'security_admin_login_ips'
const KNOWN_IPS_MAX = 20

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
    // 第一次记录（列表为空）不告警：上线后站长的第一次登录不该被当成异常
    if (!seen && known.length > 0) {
      notify(
        'security.alert',
        [
          { label: '类型', value: '管理员在新 IP 登录后台' },
          { label: '账号', value: user.email ?? `#${user.id}` },
          { label: 'IP', value: ip },
          { label: '方式', value: via === 'CODE' ? '密码 + 邮箱验证码' : '密码（受信设备）' },
          { label: 'UA', value: (headers.get('user-agent') || '').slice(0, 120) },
          { label: '说明', value: '如果不是你本人，请立即用「忘记密码」重置密码（会让所有登录态与受信设备一起失效）' },
        ],
        { link: '/admin/settings', linkText: '后台查看安全记录' },
      )
    }
  })().catch((e) => console.error('[admin-2fa] 记录登录 IP 失败', (e as Error)?.message))
}
