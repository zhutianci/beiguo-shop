export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getAdapter } from '@/lib/bot/adapters'
import { auditSoft, currentActor } from '@/app/api/admin/bot/_lib/common'
import type { LoginProgressDTO } from '@/app/admin/bot/types'

const g = globalThis as unknown as { __botLoginSession?: { startedAt: number; by: number | null } }

/** 取过二维码之后多久内才允许查进度（页面最多轮询 3 分钟，留一分钟余量） */
const SESSION_MS = 4 * 60_000

/**
 * 查扫码登录进度（docs/微信机器人-设计.md §11.5）。页面取到二维码后每 3 秒来问一次，直到 DONE / EXPIRED。
 *
 * 【为什么要先有登录会话】wxpad 适配器在每次查到「已登录」时都会重写登录时间（新号保护期按它算）。
 * 不限制的话，任何一次多余的轮询（例如小号本来就在线时点开页面）都会把 48 小时保护期重新计时。
 * 所以只有本进程里取过二维码（login/qr 写的 __botLoginSession）、且在 4 分钟内才去问协议服务；登录完成 / 过期后会话作废。
 */
export async function GET(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const s = g.__botLoginSession
    const idle = (note: string) => {
      const dto: LoginProgressDTO = { state: 'EXPIRED', wxid: null, nickname: null, error: note }
      return success(dto)
    }
    if (!s || Date.now() - s.startedAt > SESSION_MS) {
      g.__botLoginSession = undefined
      return idle('登录会话已结束，请重新获取二维码')
    }
    const p = await getAdapter().loginProgress()
    if (p.state === 'DONE') {
      g.__botLoginSession = undefined
      const actor = await currentActor()
      await auditSoft(request, actor, 'bot.admin.login_done', { type: 'bot', id: 'login' }, { wxid: p.wxid ?? null, nickname: p.nickname ?? null })
    } else if (p.state === 'EXPIRED') {
      g.__botLoginSession = undefined
    }
    const dto: LoginProgressDTO = { state: p.state, wxid: p.wxid ?? null, nickname: p.nickname ?? null, error: p.error ?? null }
    const res = success(dto)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    console.error('[bot-admin] 查询登录进度失败', e)
    return error('查询登录进度失败', 500)
  }
}
