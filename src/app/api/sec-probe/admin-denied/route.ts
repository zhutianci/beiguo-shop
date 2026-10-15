export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { error, notFound } from '@/lib/api'
import { recordProbe } from '@/lib/security/probe'

/*
 * 「登录了的普通用户打后台接口」的计数点（2026-10-15 攻防加固，lib/security/probe.ts）。
 *
 * middleware 跑在 Edge 运行时，不能查库、也和路由进程不共享内存，没法自己计数。所以它拒绝这类请求时不直接回 403，
 * 而是改写到这里（带 x-probe-status / x-probe-path 请求头），由这里计数后回**与原来逐字相同**的响应。
 * 只有两种情况会被改写过来：主站上 token 有效但不是管理员（403）、渠道域名上带着 token 打后台路径（404）。
 * 外部直接访问本路径：没有 x-probe-status 就是普通 404、不计数；伪造请求头也只会记到伪造者自己头上。
 */
async function handle(request: NextRequest) {
  const status = request.headers.get('x-probe-status')
  if (status !== '403' && status !== '404') return notFound()
  const path = (request.headers.get('x-probe-path') || '').slice(0, 200)
  if (path.startsWith('/api/admin')) await recordProbe(request, 'ADMIN_DENIED', { path })
  return status === '403' ? error('无管理员权限', 403) : notFound()
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
