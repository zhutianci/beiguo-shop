export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { authCookieOptions, getCurrentUser, verifyPassword } from '@/lib/auth'
import { rateLimited } from '@/lib/news/rate-limit'
import { writeAudit } from '@/lib/audit'
import { notify } from '@/lib/notify'
import { grantSudo, SUDO_TTL_SEC } from '@/lib/security/sudo'

/**
 * 后台敏感操作的二次验证：再输一次登录密码，通过后 10 分钟内敏感接口放行（lib/security/sudo.ts）。
 * 同一管理员 10 分钟最多试 5 次；连续错到第 3 次推安全告警（有人拿着站长的登录态在猜密码）。
 * adminGuard 自带同源校验：别的站点没法替站长提交。
 */
export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const user = await getCurrentUser()
    if (!user) return error('请先登录', 401)
    if (rateLimited(`sudo-try:${user.id}`, { windowMs: 10 * 60_000, max: 5 })) return error('尝试过于频繁，请 10 分钟后再试', 429)
    const body = (await request.json().catch(() => ({}))) as { password?: unknown }
    const password = typeof body.password === 'string' ? body.password : ''
    if (!password) return error('请输入登录密码')
    const row = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } })
    const ok = !!row && (await verifyPassword(password, row.passwordHash))
    if (!ok) {
      void writeAudit(null, { actorKind: 'PLATFORM', actorUserId: user.id, action: 'sec.sudo', result: 'DENIED', reason: '二次验证密码错误', req: request }).catch(() => {})
      // 第 3 次错（前两次放行计数、第三次被判超限）时推一条
      if (rateLimited(`sudo-fail:${user.id}`, { windowMs: 10 * 60_000, max: 2 }) && !rateLimited(`sudo-fail-alert:${user.id}`, { windowMs: 60 * 60_000, max: 1 })) {
        notify(
          'security.alert',
          [
            { label: '类型', value: '后台敏感操作二次验证连续输错密码' },
            { label: '账号', value: user.email ?? `#${user.id}` },
            { label: '说明', value: '如果不是你本人在操作，说明有人拿到了后台登录态：立即用「忘记密码」重置密码（所有登录态一起失效）' },
          ],
          { link: '/admin/settings', linkText: '后台查看安全记录' },
        )
      }
      return error('密码不对')
    }
    await grantSudo(user.id, authCookieOptions(request).secure)
    void writeAudit(null, { actorKind: 'PLATFORM', actorUserId: user.id, action: 'sec.sudo', result: 'OK', reason: '二次验证通过', req: request }).catch(() => {})
    return success({ ttlSec: SUDO_TTL_SEC }, '已验证，10 分钟内不用再输')
  } catch (err) {
    console.error('Admin sudo error:', err)
    return error('验证失败')
  }
}
