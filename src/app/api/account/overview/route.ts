export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized, notFound } from '@/lib/api'
import { getStorefront } from '@/lib/storefront/resolve'
import { buildAccountOverview } from '@/lib/vip-server'

/**
 * 个人中心概览：余额、会员等级、账户统计。只返回数字，不返回明细。
 *
 * 【按店面两种形状】（设计 8.1，WP2 定义、WP1 的个人中心按它渲染）形状与口径见 lib/vip-server.ts 的 OverviewDTO：
 *   · 主站：{ balance, vip, stats: { paidOrderCount, totalSpent, availableCoupons } }，与改造前逐字段相同；
 *   · 渠道站：{ stats: { paidOrderCount, totalSpent } }，只统计本站订单，不含余额 / 会员 / 券 / 内推。
 */
export async function GET() {
  // 店面解析不进 try（设计 4.4 第 7 条）：查库报错时让它 500，不能被 catch 吞成「获取失败」后按主站继续
  const sf = await getStorefront()
  if (!sf) return notFound()
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    return success(await buildAccountOverview(user, sf))
  } catch (err) {
    console.error('Get account overview error:', err)
    return error('获取失败')
  }
}
