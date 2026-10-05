export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { rateLimited } from '@/lib/news/rate-limit'
import { getAdapter } from '@/lib/bot/adapters'
import { auditSoft, currentActor } from '@/app/api/admin/bot/_lib/common'

/**
 * 唤醒登录（docs/微信机器人-设计.md §11.5、§11.7）：小号掉线后先「唤醒」，不行再重新扫码。
 * 部署教程的说法：首次掉线不唤醒、直接换扫码会「严重提高风控风险」，所以页面把它放在扫码按钮前面。
 * 结果只说「请求是否被协议服务接受」；小号是否真的回到在线由每分钟的健康检查（tick）确认。
 */
export async function POST(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    if (rateLimited('botwake:all', { windowMs: 60_000, max: 3 })) return error('操作太频繁，请 1 分钟后再试', 429)
    const adapter = getAdapter()
    const actor = await currentActor()
    const r = await adapter.wakeLogin()
    await auditSoft(request, actor, 'bot.admin.login_wake', { type: 'bot', id: 'login' }, { adapter: adapter.name, ok: r.ok }, r.ok ? undefined : { result: 'ERROR', reason: (r.error || '').slice(0, 200) })
    // 424 而不是 502：经 Cloudflare 时 502 的响应体会被换成它的错误页，页面看不到原因（同 login/qr）
    if (!r.ok) return error(r.error ? `唤醒登录失败：${r.error}` : '唤醒登录失败（协议服务没有接受请求），请改用扫码登录', 424)
    return success({ ok: true }, '已发出唤醒登录请求')
  } catch (e) {
    console.error('[bot-admin] 唤醒登录失败', e)
    return error('唤醒登录失败', 500)
  }
}
