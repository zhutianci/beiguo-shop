export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { parsePrizeSnapshot } from '@/lib/lottery'
import { denyOnChannel } from '@/lib/storefront/resolve'

/**
 * 我的奖品：本人在「下单有奖」里抽中的全部奖品（优惠券奖 + 自定义奖）。
 *
 * 只返回**本人**的、已抽且中奖的记录。订单号是他自己的订单，全号返回没有问题；
 * 券奖附带那张券现在的状态（券本身在「我的优惠券」里，这里只是让奖品列表能说清楚用没用掉）。
 *
 * 只读、不涉及发奖，所以不额外校验账户是否被禁用 —— 抽奖本身（drawForOrder）会校验。
 */
export async function GET() {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const rows = await prisma.lotteryEntry.findMany({
      where: { userId: user.id, state: 'DRAWN', won: true },
      orderBy: [{ drawnAt: 'desc' }, { id: 'desc' }],
      take: 50,
      select: {
        orderNo: true,
        prizeName: true,
        prizeType: true,
        prizeDetail: true,
        couponGrantId: true,
        fulfillState: true,
        fulfilledAt: true,
        drawnAt: true,
      },
    })

    const grantIds = rows.map((r) => r.couponGrantId).filter((x): x is number => x != null)
    // userId 一并作为条件：券实例 id 来自记录表，理论上一定是本人的，但查询永远按本人收口
    const grants = grantIds.length
      ? await prisma.couponGrant.findMany({
          where: { id: { in: grantIds }, userId: user.id },
          select: { id: true, state: true, expiresAt: true, coupon: { select: { status: true } } },
        })
      : []
    const grantMap = new Map(grants.map((g) => [g.id, g]))
    const now = Date.now()

    return success({
      list: rows.map((r) => {
        const snap = parsePrizeSnapshot(r.prizeDetail)
        const g = r.couponGrantId != null ? grantMap.get(r.couponGrantId) : undefined
        // 与「我的优惠券」同口径：批次被结束 → 已失效；过了有效期 → 已过期（库里可能还没刷）
        let couponState: string | null = null
        if (g) {
          couponState = g.state
          if (g.state === 'AVAILABLE' && g.coupon.status === 'ENDED') couponState = 'VOID'
          else if (g.state === 'AVAILABLE' && g.expiresAt && g.expiresAt.getTime() <= now) couponState = 'EXPIRED'
        }
        return {
          orderNo: r.orderNo,
          prizeName: r.prizeName,
          prizeType: r.prizeType,
          label: snap?.label ?? r.prizeName,
          description: snap?.description ?? null,
          // 只有自定义奖品有兑现这回事；券奖的「兑现」就是券本身
          fulfillState: r.prizeType === 'CUSTOM' ? r.fulfillState : null,
          fulfilledAt: r.prizeType === 'CUSTOM' ? r.fulfilledAt : null,
          drawnAt: r.drawnAt,
          couponState,
          couponExpiresAt: g ? g.expiresAt : null,
        }
      }),
    })
  } catch (err) {
    console.error('List my lottery prizes error:', err)
    return error('获取奖品失败')
  }
}
