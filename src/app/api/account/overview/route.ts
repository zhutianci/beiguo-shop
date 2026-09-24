export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { getVipTiers, userPaidSpend } from '@/lib/vip-server'
import { vipStatusOf } from '@/lib/vip'

/**
 * 个人中心概览：余额、会员等级、账户统计。只返回数字，不返回明细。
 *
 * 【口径】
 *   · paidOrderCount / totalSpent 与会员等级用的是**同一次** userPaidSpend：
 *     已付款、未取消的订单，金额是 Order.amount（商品货款，不含开票税费）。
 *     页面上两处数字（累计消费、会员进度）必须对得上，所以不各算各的。
 *   · 这里没直接调 userVipStatus：它内部也会跑一遍 userPaidSpend，而这里还要订单数，
 *     拆开用 getVipTiers + vipStatusOf 可以少一次聚合查询，结果与 userVipStatus 完全相同。
 *   · availableCoupons 与「我的优惠券」页的「可用 N 张」同口径：
 *     AVAILABLE、未到期、所属批次没被作废（ENDED）。
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const now = new Date()
    const [tiers, paid, availableCoupons] = await Promise.all([
      getVipTiers(),
      userPaidSpend(user.id),
      prisma.couponGrant.count({
        where: {
          userId: user.id,
          state: 'AVAILABLE',
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          coupon: { status: { not: 'ENDED' } },
        },
      }),
    ])

    const vip = vipStatusOf(tiers, paid.spent, user.vipLevel)

    return success({
      balance: Math.round(Number(user.balance ?? 0) * 100) / 100,
      vip: {
        level: vip.current.level,
        name: vip.current.name,
        nextName: vip.next ? vip.next.name : null,
        remaining: vip.remaining,
        progress: vip.progress,
      },
      stats: {
        paidOrderCount: paid.paidCount,
        totalSpent: paid.spent,
        availableCoupons,
      },
    })
  } catch (err) {
    console.error('Get account overview error:', err)
    return error('获取失败')
  }
}
