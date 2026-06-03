export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { runAutoReminders } from '@/lib/reminder'

// 定时任务入口：由 cron 容器每天中午 12:00 内网调用
// 该路由不在 middleware 拦截范围（仅 /api/admin/*），用 CRON_SECRET 自行保护
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return error('CRON_SECRET 未配置', 500)
  }
  const provided = request.headers.get('x-cron-secret')
  if (provided !== secret) {
    return error('无权限', 403)
  }

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
