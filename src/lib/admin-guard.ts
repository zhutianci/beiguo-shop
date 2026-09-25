import { headers } from 'next/headers'
import { requireAdmin } from './auth'
import { error } from './api'
import { crossSiteReason } from './same-origin'

/**
 * 后台接口的路由内管理员校验。用法（每个 handler 第一行）：
 *
 *   const denied = await adminGuard()
 *   if (denied) return denied
 *
 * 【为什么 middleware 之外还要再验一次】
 *  1. middleware 只验 JWT 里的 role，不查库：管理员被禁用或降级之后，他手里那张 30 天有效的
 *     token 仍然能进 /api/admin/*，甚至能调 PUT /api/admin/users/<自己> 把自己恢复成管理员。
 *     这里走 getCurrentUser（查库、并且不认 status≠1 的账号）
 *  2. Next 14.2.3 的 middleware 可以被 CVE-2025-29927 整个绕过（交接文档第二十三节），
 *     nginx 那道清洗是唯一的边界；路由内这一道是纵深防御
 *  3. 同源校验（lib/same-origin，审计 G09）：SameSite=Lax 挡不住 *.bigolab.com 兄弟子域的
 *     simple POST。headers() 拿不到请求方法，所以 GET 也校验——后台合法的 GET 都是同源 fetch
 *     或地址栏直开（Sec-Fetch-Site: none），不受影响；从外站 / 聊天软件点链接直进 /api/admin/*
 *     会 403，这正是想要的（例如卡密明文导出不能再被外站跳转触发）。
 *     curl、scripts/itest-* 不带 Origin / Sec-Fetch-Site，照常可用。
 *     另有 20 个后台路由直接调 requireAdmin、不经过这里（vmq/complete、referrals/balance、orders/[id] 等），
 *     所以同一道校验也放进了 requireAdmin（lib/auth.ts）；这里保留一份，是防以后有人把 adminGuard
 *     改成绕过 requireAdmin 时校验跟着丢。
 *     requireAdmin / adminGuard 都只供 /api/admin 路由用，不要在页面或 server component 里调。
 */
export async function adminGuard(): Promise<Response | null> {
  const reason = crossSiteReason(headers())
  if (reason) {
    console.warn('[adminGuard] 拒绝非同源的后台请求:', reason)
    return error('无管理员权限', 403)
  }
  try {
    await requireAdmin()
    return null
  } catch {
    return error('无管理员权限', 403)
  }
}
