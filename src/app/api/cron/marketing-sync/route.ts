export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { runSyncTick } from '@/lib/marketing/sync'

/**
 * 营销邮件：阿里云回执与名单同步。cron 每 5 分钟 POST 一次（crontab --max-time 58）。
 * 逻辑全在 lib/marketing/sync.ts（锁 mkt:sync、单趟 ≤45 秒、失败只记 lastError 不抛）。
 *
 * 返回小 JSON：cron.log 不轮转，每 5 分钟一行，不能把回执明细往里写。
 * 同步没配置 / dry-run / 抢不到锁时返回 skipped，也是 200 —— 那是正常状态，不该让 curl -f 报错刷日志。
 */
export async function POST(request: NextRequest) {
  const auth = assertCronAuth(request)
  if (!auth.ok) return error(auth.message, auth.status)
  try {
    const summary = await runSyncTick()
    return success(summary)
  } catch (err) {
    // 走到这里说明是锁 / 数据库这类基础设施问题（各步骤自己的错误已在 sync 内部收敛成 errors）
    console.error('[cron/marketing-sync]', (err as Error)?.message || err)
    return error('同步失败', 500)
  }
}
