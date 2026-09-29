export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { runTick } from '@/lib/jiema/engine'

/**
 * 短信接码推进（docs/短信接码-设计.md §6.5、§6.6 第 32 条；crontab 每分钟，GET + x-cron-secret 头，--max-time 55）。
 * 单独一条路由（不和旧的 sms-poll 挤在一起）：抢锁 jiema:tick（TTL 90 秒，抢不到直接返回）→ 写心跳 sms_runtime.tickAt
 * → 每 5 秒一轮，直到 45 秒：批量查码、解开 UNKNOWN、推进中间态的订单、熔断 / 余额告警 / 成功率监控。响应只回计数。
 */
export async function GET(request: NextRequest) {
  const auth = assertCronAuth(request)
  if (!auth.ok) return error(auth.message, auth.status)
  try {
    const s = await runTick()
    return success({ ran: s.ran, rounds: s.rounds, polled: s.polled, advanced: s.advanced, released: s.released, repaired: s.repaired, claimed: s.claimed })
  } catch (err) {
    console.error('[jiema] cron jiema-tick 执行失败', err)
    return error('接码推进任务执行失败', 500)
  }
}
