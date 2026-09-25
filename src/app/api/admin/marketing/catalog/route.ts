export const dynamic = 'force-dynamic'

import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { loadCatalog } from '@/lib/marketing/snapshot'

/**
 * 编辑器的商品 / 券选择器数据：在售商品（公开字段白名单）、可领的公开券批次。
 * 只列 source=null 的公开批次 —— 抽奖 / 营销直发这类系统批次不能拿来做「领取链接」。
 */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    return success(await loadCatalog())
  } catch (err) {
    console.error('[admin/marketing] 读取商品/券目录失败:', err)
    return error('读取商品与优惠券失败')
  }
}
