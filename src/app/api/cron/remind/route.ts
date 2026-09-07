export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { runAutoReminders } from '@/lib/reminder'

// 定时任务入口：由 cron 容器每天中午 12:00 内网调用
// 该路由不在 middleware 拦截范围（仅 /api/admin/*），用 CRON_SECRET 自行保护
export async function POST(request: NextRequest) {
  // 这个路由本来就是 fail-closed 的（配置缺失即拒绝），是同目录里唯一没被打穿的一个。
  // 统一到 lib/cron-auth 只是为了让四个路由的口径一致、以后不会再各写各的。
  const auth = assertCronAuth(request)
  if (!auth.ok) return error(auth.message, auth.status)

  try {
    const summary = await runAutoReminders()
    console.log('[cron/remind] 自动提醒完成:', JSON.stringify({
      total: summary.total,
      eligible: summary.eligible,
      sent: summary.sent,
      failed: summary.failed,
      skipped: summary.skipped,
    }))
    return success(summary, '自动提醒任务已执行')
  } catch (err) {
    console.error('[cron/remind] 执行失败:', err)
    return error('自动提醒任务执行失败', 500)
  }
}
