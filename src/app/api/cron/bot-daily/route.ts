export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { runDailyReports } from '@/lib/bot/report/daily'

/**
 * 微信机器人每日零时日报（docs/微信机器人-设计.md §6；cron 每天 00:01 POST + x-cron-secret）：
 * 统计刚结束的北京时间自然日，主站管理群一份、每个分站群一份，00:02 起逐群错峰发出。重跑只补缺的。
 */
export async function POST(request: NextRequest) {
  const auth = assertCronAuth(request)
  if (!auth.ok) return error(auth.message, auth.status)
  try {
    const r = await runDailyReports()
    console.log('[cron/bot-daily]', JSON.stringify(r))
    return success(r)
  } catch (err) {
    console.error('[cron/bot-daily] 执行失败', err)
    return error('机器人日报执行失败', 500)
  }
}
