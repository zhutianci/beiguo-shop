export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { notFound } from '@/lib/api'
import { recordProbe } from '@/lib/security/probe'

/*
 * 所有不存在的 /api 路径的兜底（2026-10-15 攻防加固，lib/security/probe.ts）。
 *
 * Next 先匹配全部真实路由，只有没有任何路由能接的路径才落到这里。以前这类请求回的是 11KB 的 HTML 404 页，
 * 现在回与 middleware 同款的 JSON 404，并按 IP 数「不同路径」：10 分钟 10 个以上 → 该 IP 1 小时内不能登录 / 下单（不封号）。
 * 2026-10-15 静态核对过：前端代码里调用的 /api 路径全部有对应路由，正常使用不会落到这里。
 * 后台与渠道后台的路径不计数：管理员的旧页面调到已删掉的后台接口不该算探测（非管理员打后台在 middleware 那一层另算）。
 */
const NOT_COUNTED = ['/api/admin', '/api/partner', '/api/cron']

async function handle(request: NextRequest) {
  const path = request.nextUrl.pathname
  if (!NOT_COUNTED.some((p) => path === p || path.startsWith(p + '/'))) {
    await recordProbe(request, 'API_404')
  }
  return notFound()
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
