export const dynamic = 'force-dynamic'

import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error } from '@/lib/api'
import { getStorefront } from '@/lib/storefront/resolve'
import { authCrossSiteReason } from '@/lib/tenant/same-origin'
import { writeAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  // 写接口同源校验（设计 4.6 C4；集成阶段补）：兄弟子域不能替用户「登出」（配合登录 CSRF 把人换进攻击者账号）。
  // 店面解析不进 try；没有店面的 Host（严格期未知 Host）按平台规则校验——登出本身无害，不因此拒绝
  const sf = await getStorefront()
  if (authCrossSiteReason(request, sf?.kind ?? 'PLATFORM')) return error('请求来源异常，请刷新页面后重试', 403)
  /*
   * 【管理员退出 = 所有设备一起退出】（2026-10-25 第三轮加固）以前退出只删本机 cookie，token 本身在 12 小时内照样有效，
   * 被偷走的那一份不受影响。管理员退出时会话版本 +1：所有设备上的后台登录态、受信设备 cookie、二次验证凭证一起失效，
   * 下次登录要重新输邮箱验证码。买家仍只删本机 cookie（多设备购物的人不该因为在一台上退出就全掉线）。
   */
  try {
    const user = sf ? await getCurrentUser() : null
    if (user && user.role === 'ADMIN') {
      await prisma.user.update({ where: { id: user.id }, data: { sessionEpoch: { increment: 1 } } })
      void writeAudit(null, { actorKind: 'PLATFORM', actorUserId: user.id, action: 'auth.logout_all', targetType: 'user', targetId: String(user.id), req: request }).catch(() => {})
    }
  } catch (e) {
    console.error('[logout] 管理员会话版本 +1 失败', (e as Error)?.message)
  }
  const cookieStore = await cookies()
  cookieStore.delete('token')
  cookieStore.delete('adm_sudo')
  return success(null, '已退出登录')
}
