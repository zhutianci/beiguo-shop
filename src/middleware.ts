import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
// 相对路径、且只引这一个 Edge 安全的模块：lib/auth 会带上 prisma，不能进 middleware
import { getJwtSecret } from './lib/jwt-secret'
// 同上：storefront/hosts 是纯函数（不 import prisma / next/headers），主站 Host 白名单与路由内店面解析共用这一份口径
import { channelsEnabled, normalizeHost, platformHosts } from './lib/storefront/hosts'
// 同上：纯函数，不 import next/* 与 prisma
import { apiWriteCrossSite } from './lib/api-csrf'
// 繁体香港版（docs/繁体香港版/设计.md §6）：只 import next/server 与纯函数
import { langMiddleware } from './lib/i18n/middleware-lang'
import { zhhkEnabled } from './lib/i18n/lang'
// 零依赖的开关口径（与 lib/auth requireAdmin 共用）
import { adminDeviceRequired, ADMIN_DEVICE_COOKIE_NAME } from './lib/security/admin-device-policy'

interface JwtPayload {
  userId: number
  email: string
  role: string
  ep?: number
  sv?: number
}

async function verifyToken(token: string, key: Uint8Array): Promise<JwtPayload | null> {
  try {
    // 刻意不传 audience（设计 4.4）：老 token 没有 aud，传了就会让老管理员进不了后台。
    // 按店面校验 aud 是路由内 getCurrentUser / requireAdmin 的事，middleware 只是不可信的粗筛
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

/** 受信设备 cookie 是否与登录 token 同一个管理员、同一个会话版本（只比两张票，不查库） */
async function deviceMatches(dev: string | undefined, p: JwtPayload, key: Uint8Array): Promise<boolean> {
  if (!dev) return false
  try {
    const { payload } = await jwtVerify(dev, key, { algorithms: ['HS256'] })
    const d = payload as { k?: unknown; uid?: unknown; ep?: unknown }
    const ep = typeof p.ep === 'number' ? p.ep : typeof p.sv === 'number' ? p.sv : 0
    return d.k === 'adm-dev' && d.uid === p.userId && d.ep === ep
  } catch {
    return false
  }
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
}

function isPartnerPath(pathname: string): boolean {
  return pathname.startsWith('/partner') || pathname.startsWith('/api/partner')
}

/*
 * 【普通用户打后台接口 → 改写到计数点（2026-10-15 攻防加固，lib/security/probe.ts）】
 * middleware 跑在 Edge 运行时、不能查库也不和路由共享内存，自己没法计数和封号；这里不直接回 403 / 404，
 * 而是改写到 /api/sec-probe/admin-denied，由那边计数后回与原来**逐字相同**的响应。只改写「带着登录态」的拒绝：
 * 未登录的 401 照旧直接回（站长登录过期后，还开着的后台页会连着打好几个后台接口，不能算探测）。
 */
function probeRewrite(request: NextRequest, status: 403 | 404): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/api/sec-probe/admin-denied'
  url.search = ''
  const h = new Headers(request.headers)
  h.set('x-probe-status', String(status))
  h.set('x-probe-path', request.nextUrl.pathname.slice(0, 200))
  return NextResponse.rewrite(url, { request: { headers: h } })
}

function hasLoginToken(request: NextRequest): boolean {
  return !!request.cookies.get('token')?.value || (request.headers.get('authorization') || '').startsWith('Bearer ')
}

function notFound(pathname: string): NextResponse {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ success: false, error: '资源不存在' }, { status: 404 })
  }
  return new NextResponse('Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } })
}

/*
 * 【渠道分站（设计 4.4 middleware 段、4.10；实施分包 WP1）】
 * middleware 是**不可信**的一层（Next 14.2 可被整个绕过，CVE-2025-29927）：这里只做粗分流，
 * 权威判定全在路由内（adminGuard / requireAdmin 要求 PLATFORM 店面、partnerRoute 要求渠道店面）。
 *
 *  · 休眠（CHANNELS_ENABLED≠'1'）：**不做任何按 Host 的拦截**，/admin 与 /api/admin 的逻辑与改造前逐字相同；
 *    matcher 新增的 /partner 两项直接放行（由路由内守卫 404，主站 Host 上 partnerRoute 恒 404）。
 *  · 开启（CHANNELS_ENABLED='1'）：在最前面加一道只用静态 PLATFORM_HOSTS（不查库）的分流——
 *    Host 不在白名单 → 拒绝 /admin、/api/admin；Host 在白名单 → 拒绝 /partner、/api/partner。
 *    PLATFORM_HOSTS 默认 bigolab.com,www.bigolab.com,app,localhost,127.0.0.1（经 IP / localhost 进后台照常），
 *    漏配或写错时退回默认并打日志（storefront/hosts.ts）。
 *  · Host 只读 host 头（不读 NextURL 的主机名：standalone 下是 0.0.0.0:3000；也不信 X-Forwarded-Host）。
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  /*
   * 【前台页面：简繁版本（繁体香港版，2026-10-19）】matcher 为此加了「所有页面」一项；这一段只处理页面，
   * 后台、渠道后台、接口原样走下面的老逻辑。ZHHK_ENABLED 没开时直接放行——与没有这一项 matcher 时的行为相同。
   * 只在主站 Host 上做（渠道站暂不提供繁体版）；规则见 lib/i18n/middleware-lang.ts。
   */
  if (!pathname.startsWith('/api/') && !isAdminPath(pathname) && !isPartnerPath(pathname)) {
    if (!zhhkEnabled()) return NextResponse.next()
    if (channelsEnabled()) {
      const host = normalizeHost(request.headers.get('host'))
      if (!host || !platformHosts().has(host)) return NextResponse.next()
    }
    return langMiddleware(request) ?? NextResponse.next()
  }

  /*
   * 【全站 /api 写请求的同源校验（2026-10-07 安全加固）】以前只有后台、论坛、内容平台、上传、充值、接码下单
   * 各自在路由里调同源校验，买家侧其余写接口（下单、领券、抽奖、改资料、绑定、开票、接码退款…）没有。
   * 渠道子域 *.bigolab.com 由同行运营、与主站同站（same-site），Lax cookie 照样带上——兄弟子域任何一处 XSS
   * 都能以访客身份对主站发 simple POST。规则与例外见 lib/api-csrf.ts（机器回调、cron、退订一律豁免）。
   * 这是纵深防御：路由内已有的校验全部保留。
   */
  if (pathname.startsWith('/api/')) {
    const cross = apiWriteCrossSite(request.method, pathname, request.headers)
    if (cross) {
      console.warn('[middleware] 拒绝非同源的写请求:', request.method, pathname, cross)
      return NextResponse.json({ success: false, error: '请求来源不合法，请刷新页面后重试' }, { status: 403 })
    }
  }

  if (channelsEnabled()) {
    const host = normalizeHost(request.headers.get('host'))
    const onPlatformHost = !!host && platformHosts().has(host)
    if (isAdminPath(pathname) && !onPlatformHost) {
      // 渠道域名上带着登录态打后台接口（10-15 那个人在 tibo.pw 上这么试过几十次）：计数后照样 404
      if (pathname.startsWith('/api/admin') && hasLoginToken(request)) return probeRewrite(request, 404)
      return notFound(pathname)
    }
    if (isPartnerPath(pathname) && onPlatformHost) return notFound(pathname)
  }

  // 渠道后台：middleware 不看登录态（JWT aud / 成员关系 / 权限点全部在 partnerRoute、requirePartnerPage 里查库判定）。
  // 放在密钥检查之前：休眠期主站 Host 上的 /partner 行为只由路由决定（404），不因为这里变成 503
  if (isPartnerPath(pathname)) return NextResponse.next()
  // 其余 /api（matcher 为同源校验扩到了全部 /api）：登录态在路由内判定，这里不看 token，也不因缺 JWT 密钥 503
  if (!isAdminPath(pathname)) return NextResponse.next()

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
    // 管理员会话必须配套受信设备 cookie（lib/security/admin-device-policy.ts，2026-10-25）：没有就回登录页重新验证。
    // 这里只是让页面体验顺（不可信的一层）；权威判定在每个后台接口的 requireAdmin 里（还会查库比对会话版本）
    if (adminDeviceRequired() && !(await deviceMatches(request.cookies.get(ADMIN_DEVICE_COOKIE_NAME)?.value, payload, key))) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
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
    // 登录了的普通用户：计数后回同样的 403（见 probeRewrite）；token 无效的照旧直接 403
    if (payload && payload.role !== 'ADMIN') return probeRewrite(request, 403)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '无管理员权限' },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
}

// matcher 必须是静态常量（Next 在构建期读取），所以固定写死；休眠时 /partner 两项在上面直接放行。
// '/api/:path*' 只为写请求的同源校验（上面第一段）：其余 /api 在校验后直接放行，不看登录态
// 第四项（繁体香港版）：所有前台页面——排除 /api、/_next、/_next-hk、后台、上传目录与带扩展名的静态文件
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
    '/partner/:path*',
    '/((?!api/|_next/|_next-hk/|admin|partner|uploads/|.*\\.[A-Za-z0-9]+$).*)',
  ],
}
