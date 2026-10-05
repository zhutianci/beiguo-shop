export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { rateLimited } from '@/lib/news/rate-limit'
import { getAdapter } from '@/lib/bot/adapters'
import { auditSoft, currentActor } from '@/app/api/admin/bot/_lib/common'
import type { LoginQrDTO } from '@/app/admin/bot/types'

/** 登录会话（同进程）：只有先取过二维码，login/progress 才会去问协议服务，见那边的注释 */
const g = globalThis as unknown as { __botLoginSession?: { startedAt: number; by: number | null } }

/** 二维码图片：协议服务给的是图片地址（https）或 data URL；裸 base64 补上前缀。其它形态一律不要（只会放进 <img src>） */
function normalizeQr(raw: string): string | null {
  const s = raw.trim()
  if (!s || s.length > 600_000) return null
  if (/^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(s)) return s
  if (/^https?:\/\/[^\s"'<>]+$/i.test(s)) return s
  if (/^[A-Za-z0-9+/=\s]{200,}$/.test(s)) return `data:image/png;base64,${s.replace(/\s+/g, '')}`
  return null
}

/**
 * 获取登录二维码（docs/微信机器人-设计.md §11.5）：调适配器的 loginQr()，把图片原样交给页面显示。
 * 二维码相当于小号的登录凭证：不落库、不写日志，响应带 no-store；只在审计里记「谁在什么时候取了二维码」。
 */
export async function POST(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const adapter = getAdapter()
    if (!adapter.capabilities.has('login_qr')) return error(`当前适配器（${adapter.name}）不需要扫码登录`, 400)
    if (rateLimited('botqr:all', { windowMs: 30_000, max: 3 })) return error('操作太频繁，请 30 秒后再试', 429)
    const actor = await currentActor()
    const r = await adapter.loginQr()
    if (!r.qr) return error(r.error || '获取二维码失败', 502)
    const qr = normalizeQr(r.qr)
    if (!qr) return error('协议服务返回的二维码格式无法识别', 502)
    g.__botLoginSession = { startedAt: Date.now(), by: actor.userId }
    await auditSoft(request, actor, 'bot.admin.login_qr', { type: 'bot', id: 'login' }, { adapter: adapter.name })
    const dto: LoginQrDTO = { qr, issuedAt: new Date().toISOString(), ttlSeconds: 180 }
    const res = success(dto)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    console.error('[bot-admin] 获取登录二维码失败', e)
    return error('获取二维码失败', 500)
  }
}
