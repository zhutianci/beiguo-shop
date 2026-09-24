export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { userVipStatus } from '@/lib/vip-server'

/**
 * 会员中心：当前等级、到下一级的进度、全部档位与权益。
 * 定级规则全在 lib/vip.ts（按已付款订单货款累计，后台手工等级只往上调），这里只做转发。
 * 权益文案是后台「系统设置 → 会员等级」里配的原文，页面照原样展示，不额外添字。
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const s = await userVipStatus(user.id, user.vipLevel)
    return success({
      spent: s.spent,
      current: s.current,
      next: s.next,
      remaining: s.remaining,
      progress: s.progress,
      byAdmin: s.byAdmin,
      tiers: s.tiers,
    })
  } catch (err) {
    console.error('Get vip status error:', err)
    return error('获取会员信息失败')
  }
}
