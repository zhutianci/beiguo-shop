import { requireAdmin } from './auth'
import { error } from './api'

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
 */
export async function adminGuard(): Promise<Response | null> {
  try {
    await requireAdmin()
    return null
  } catch {
    return error('无管理员权限', 403)
  }
}
