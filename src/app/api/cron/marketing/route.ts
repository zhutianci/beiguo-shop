export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { runSendTick } from '@/lib/marketing/worker'

// 营销邮件发送 worker：cron 容器每分钟内网调用一次（crontab --max-time 58）。
// 单趟 35 秒后不再开始新发送；锁 mkt:send 保证同一时刻只有一趟在跑，抢不到直接返回 skipped:'locked'。
// 返回体只有计数（cron.log 不轮转，绝不能每分钟往里写收件人/正文）。
export async function POST(request: NextRequest) {
  const auth = assertCronAuth(request)
  if (!auth.ok) return error(auth.message, auth.status)

  try {
    const s = await runSendTick()
    // 空转的趟（没有活动、时段外）不打日志，只在真的做了事或停下有原因时记一行
    if (s.sent || s.failed || s.unknown || s.retried || s.skippedRows || s.materialized || s.recovered.claimed || s.recovered.sending) {
      console.log('[cron/marketing]', JSON.stringify(s))
    }
    return success(s)
  } catch (err) {
    console.error('[cron/marketing] 执行失败:', (err as Error)?.message)
    return error('营销发送任务执行失败', 500)
  }
}
