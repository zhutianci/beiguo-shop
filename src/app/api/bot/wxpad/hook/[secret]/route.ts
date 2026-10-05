export const dynamic = 'force-dynamic'

import { timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { getAdapter } from '@/lib/bot/adapters'
import { botEnabledByEnv } from '@/lib/bot/config'
import { handleInbound } from '@/lib/bot/inbound'
import { readBotState } from '@/lib/bot/state'

/**
 * 协议服务（WeChatPadPro）的消息回调（docs/微信机器人-设计.md §11.3）。
 * 只走 Docker 内网：nginx 对外一律 404 掉 /api/bot/wxpad/（同 /api/cron/），渠道 Host 的 /api 白名单里也没有它。
 * 鉴权：路径里的 BOT_WXPAD_HOOK_SECRET（≥ 32 字符，常量时间比较）；没配 = 503，一律拒绝。
 * 处理在 2 秒内返回：解析 → 过滤（不是 @机器人 / 私聊 / 管理群系统提示的直接丢弃、不落库）→ 三道闸 → 执行 → 回复进出队。
 */
function secretOk(given: string): boolean | null {
  const want = (process.env.BOT_WXPAD_HOOK_SECRET || '').trim()
  if (want.length < 32) return null
  const a = Buffer.from(given || '')
  const b = Buffer.from(want)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest, { params }: { params: { secret: string } }) {
  const deny = await denyOnChannel()
  if (deny) return deny
  const ok = secretOk(params.secret)
  if (ok === null) return error('回调未启用', 503)
  if (!ok) return error('资源不存在', 404)
  if (!botEnabledByEnv()) return success({ accepted: 0 })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return error('请求体不是 JSON', 400)
  }
  try {
    const state = await readBotState()
    const list = getAdapter().parseCallback(body, state.botWxid)
    if (list.length) await handleInbound(list)
    return success({ accepted: list.length })
  } catch (err) {
    console.error('[bot] 回调处理失败', (err as Error)?.message)
    return error('处理失败', 500)
  }
}
