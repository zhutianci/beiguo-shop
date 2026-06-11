import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies, headers } from 'next/headers'
import { prisma } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface JwtPayload {
  userId: number
  email: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export const AUTH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 天

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
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
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
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
    },
  })

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Forbidden')
  }
  return user
}
