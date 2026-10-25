export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { getStorefront } from '@/lib/storefront/resolve'
import { issuePowChallenge, powEnabled, POW_PURPOSES, type PowPurpose } from '@/lib/security/pow'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'
import { ipKey } from '@/lib/ip-key'

/**
 * 无感人机验证的出题接口（lib/security/pow.ts）。GET ?p=login|register|send|reset|lookup。
 * 题目是无状态签名串，出题不查库；按 IP 每分钟 60 道兜底（正常页面一次提交取一道）。
 */
export async function GET(request: NextRequest) {
  const sf = await getStorefront()
  if (!sf) return error('资源不存在', 404)
  const p = request.nextUrl.searchParams.get('p') as PowPurpose | null
  if (!p || !POW_PURPOSES.includes(p)) return error('参数错误')
  if (!powEnabled()) return success({ off: true })
  const ip = clientIp(request.headers)
  if (ip !== 'unknown' && rateLimited(`pow-issue:${ipKey(ip)}`, { windowMs: 60_000, max: 60 })) {
    return error('操作过于频繁，请稍后再试', 429)
  }
  const c = issuePowChallenge(p, request.headers)
  if (!c) return error('服务暂不可用', 503)
  return success(c)
}
