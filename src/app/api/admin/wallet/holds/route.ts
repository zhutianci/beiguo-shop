export const dynamic = 'force-dynamic'

import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { walletHolds } from '@/lib/wallet/admin-query'

/**
 * 预扣（只读，docs/短信接码-设计.md §7.8）：HELD 列表（超过 60 分钟标红）与最近释放 / 退款。
 * 后台**不提供「手工释放」**：预扣的变化只能由订单状态驱动（释放 = 关单同一事务），要处理就到接码后台「关单并原路退回预扣」。
 */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    return success(await walletHolds())
  } catch (e) {
    console.error('[wallet] holds 失败', e)
    return error('获取预扣失败', 500)
  }
}
