export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { getCurrentUser } from '@/lib/auth'
import { VMQ_KEY } from '@/lib/vmq'
import { writeAudit } from '@/lib/audit'
import { requireSudo } from '@/lib/security/sudo'

/**
 * 收款回调的密钥（2026-10-24）：签名密钥 VMQ_WEBHOOK_SECRET（填进 SmsForwarder Webhook 的 Secret）、
 * 过渡期还认的 token。以前 token 明文跟着「收款监控」页每 10 秒轮询一次发给浏览器；现在只在点「显示密钥」时给，
 * 要二次验证（lib/security/sudo.ts），每次都写 audit_events（vmq.secret.view）。
 * POST（不是 GET）：不会被预取、不进浏览器历史与访问日志的 URL。
 */
export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  const sudo = await requireSudo()
  if (sudo) return sudo
  try {
    const user = await getCurrentUser()
    const secret = process.env.VMQ_WEBHOOK_SECRET || ''
    const tokenAccepted = !secret || process.env.VMQ_WEBHOOK_ACCEPT_TOKEN !== '0'
    const token = tokenAccepted ? process.env.VMQ_WEBHOOK_TOKEN || VMQ_KEY : ''
    void writeAudit(null, {
      actorKind: 'PLATFORM',
      actorUserId: user?.id ?? null,
      action: 'vmq.secret.view',
      reason: secret ? '查看收款回调签名密钥' : '查看收款回调 token',
      req: request,
    }).catch(() => {})
    return success({ secret: secret || null, token: token || null })
  } catch (err) {
    console.error('Vmq secret error:', err)
    return error('获取失败')
  }
}
