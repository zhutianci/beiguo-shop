export const dynamic = 'force-dynamic'

import { success } from '@/lib/api'
import { listProvidersForAdmin } from '@/lib/redeem/registry'

/**
 * 后台用的充值平台清单，给导入卡密时的下拉框。
 *
 * 【只有后台接口会吐 adminLabel】辨识名是货源信息（「A 系统（redeemgpt）」这种），
 * 买家侧任何接口都不返回它。这个路由在 /api/admin/ 下，由 middleware 统一拦截。
 */
export async function GET() {
  return success({ list: listProvidersForAdmin() })
}
