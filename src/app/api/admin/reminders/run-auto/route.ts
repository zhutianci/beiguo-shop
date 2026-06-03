export const dynamic = 'force-dynamic'

import { success, error } from '@/lib/api'
import { runAutoReminders } from '@/lib/reminder'

// 后台手动触发“自动提醒任务”（与定时任务逻辑一致：跳过已提醒订单），便于测试
export async function POST() {
  try {
    const summary = await runAutoReminders()
    return success(
      summary,
      `自动提醒已执行：${summary.eligible} 条待提醒，成功 ${summary.sent}，失败 ${summary.failed}，跳过 ${summary.skipped}`
    )
  } catch (err) {
    console.error('Run auto remind error:', err)
    return error('执行失败')
  }
}
