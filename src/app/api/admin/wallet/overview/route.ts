export const dynamic = 'force-dynamic'

import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { walletOverview } from '@/lib/wallet/admin-query'

/** 余额与充值 · 顶部看板（docs/短信接码-设计.md §7.8）：负债、今日各类流水、最近一次对账、配置摘要 */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    return success(await walletOverview())
  } catch (e) {
    console.error('[wallet] overview 失败', e)
    return error('获取余额看板失败', 500)
  }
}
