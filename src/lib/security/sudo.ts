/**
 * 后台敏感操作的二次验证（2026-10-24 第二轮加固 M3，docs/安全-第二轮加固-1024.md 2.2；站长定：用登录密码，不上身份验证器）。
 *
 * 【为什么】登录态（cookie）一旦被偷——XSS、借用的电脑、恶意浏览器扩展——拿着它就能直接导出卡密明文、手工标已付、
 * 改余额、绑自己的微信当机器人管理员、把小号提成管理员。这里给这些操作再加一道：10 分钟内必须重新输过一次登录密码。
 * 偷到 cookie 的人不知道密码，做不了这些事；站长自己操作时 10 分钟内只输一次。
 *
 * 【用法】敏感的后台接口在 adminGuard 之后加一行：
 *     const sudo = await requireSudo(); if (sudo) return sudo
 *   没通过 → 403 { needSudo: true }，后台页面统一的拦截器（components/admin/sudo-gate.tsx）弹框要密码，
 *   验过后自动重放原请求——各个页面不用改。
 * 凭证 = 签名 cookie adm_sudo（10 分钟，绑 userId + 会话版本：改密码 / 禁用立即失效；httpOnly、SameSite=Strict）。
 * 验证接口：POST /api/admin/security/sudo { password }（同一管理员 10 分钟最多试 5 次，错 3 次推告警）。
 * 应急：ADMIN_SUDO=0 关掉（改 .env.production 后 up -d app）。
 */
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '../auth'
import { prisma } from '../db'
import { getJwtSecret } from '../jwt-secret'

export const SUDO_COOKIE = 'adm_sudo'
export const SUDO_TTL_SEC = 10 * 60

export function sudoEnabled(): boolean {
  return process.env.ADMIN_SUDO !== '0'
}

function sign(uid: number, ep: number): string | null {
  const secret = getJwtSecret()
  if (!secret) return null
  return jwt.sign({ k: 'adm-sudo', uid, ep }, secret, { expiresIn: SUDO_TTL_SEC })
}

function valid(token: string | undefined, uid: number, ep: number): boolean {
  if (!token) return false
  const secret = getJwtSecret()
  if (!secret) return false
  try {
    const p = jwt.verify(token, secret, { algorithms: ['HS256'] }) as { k?: unknown; uid?: unknown; ep?: unknown }
    return p.k === 'adm-sudo' && p.uid === uid && p.ep === ep
  } catch {
    return false
  }
}

async function sessionEpochOf(uid: number): Promise<number> {
  const u = await prisma.user.findUnique({ where: { id: uid }, select: { sessionEpoch: true } })
  return u?.sessionEpoch ?? -1
}

/**
 * 敏感接口里调用（放在 adminGuard 之后）。返回 null = 放行；否则是要直接返回的 403。
 */
export async function requireSudo(): Promise<NextResponse | null> {
  if (!sudoEnabled()) return null
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: '无管理员权限' }, { status: 403 })
  const store = await cookies()
  if (valid(store.get(SUDO_COOKIE)?.value, user.id, await sessionEpochOf(user.id))) return null
  return NextResponse.json({ success: false, error: '这个操作需要先验证身份（再输一次登录密码）', needSudo: true }, { status: 403 })
}

/** 验证通过后调用：写 10 分钟的 adm_sudo cookie */
export async function grantSudo(uid: number, secure: boolean): Promise<void> {
  const t = sign(uid, await sessionEpochOf(uid))
  if (!t) throw new Error('JWT_SECRET 未配置')
  const store = await cookies()
  store.set(SUDO_COOKIE, t, { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: SUDO_TTL_SEC })
}
