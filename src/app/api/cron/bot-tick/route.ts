export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { runTick } from '@/lib/bot/tick'

/**
 * 微信机器人每分钟兜底（docs/微信机器人-设计.md §12.2；cron 每分钟 GET + x-cron-secret）：
 * 回扫渠道通知、路由、作废过期、收回租约、查小号在线状态并告警、唤醒发送器。BOT_ENABLED 未开时直接返回。
 */
export async function GET(request: NextRequest) {
  const auth = assertCronAuth(request)
  if (!auth.ok) return error(auth.message, auth.status)
  try {
    const r = await runTick()
    if (r.scanned || r.routed || r.expired || r.recovered) console.log('[cron/bot-tick]', JSON.stringify(r))
    return success(r)
  } catch (err) {
    console.error('[cron/bot-tick] 执行失败', err)
    return error('机器人定时任务执行失败', 500)
  }
}
