import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
// 相对路径、且只引这一个 Edge 安全的模块：lib/auth 会带上 prisma，不能进 middleware
import { getJwtSecret } from './lib/jwt-secret'

interface JwtPayload {
  userId: number
  email: string
  role: string
}

async function verifyToken(token: string, key: Uint8Array): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // 没有密钥 = 拒绝（lib/jwt-secret.ts）。以前回落到公开的 'your-secret-key'，漏配时任何人都能自签管理员 token
  const secret = getJwtSecret()
  if (!secret) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ success: false, error: '后台鉴权未配置，暂不可用' }, { status: 503 })
    }
    return new NextResponse('后台鉴权未配置，暂不可用', { status: 503 })
  }
  const key = new TextEncoder().encode(secret)

  // 后台页面：未登录或非管理员重定向
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const payload = await verifyToken(token, key)
    if (!payload || payload.role !== 'ADMIN') {
      const url = new URL('/', request.url)
      url.searchParams.set('error', 'admin_required')
      return NextResponse.redirect(url)
    }
  }

  // 后台 API：拒绝非管理员
  if (pathname.startsWith('/api/admin')) {
    if (!token) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token, key)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: '无管理员权限' },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
