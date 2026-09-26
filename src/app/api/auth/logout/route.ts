export const dynamic = 'force-dynamic'

import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { success, error } from '@/lib/api'
import { getStorefront } from '@/lib/storefront/resolve'
import { authCrossSiteReason } from '@/lib/tenant/same-origin'

export async function POST(request: NextRequest) {
  // 写接口同源校验（设计 4.6 C4；集成阶段补）：兄弟子域不能替用户「登出」（配合登录 CSRF 把人换进攻击者账号）。
  // 店面解析不进 try；没有店面的 Host（严格期未知 Host）按平台规则校验——登出本身无害，不因此拒绝
  const sf = await getStorefront()
  if (authCrossSiteReason(request, sf?.kind ?? 'PLATFORM')) return error('请求来源异常，请刷新页面后重试', 403)
  const cookieStore = await cookies()
  cookieStore.delete('token')
  return success(null, '已退出登录')
}
