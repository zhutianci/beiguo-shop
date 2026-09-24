export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { success, error } from '@/lib/api'
import { parsePrizeSnapshot } from '@/lib/lottery'

/**
 * 下单有奖 · 抽奖记录（一张有资格的订单一行）。
 *
 * 用户与券状态都是**批量**补查（一页最多两次 IN 查询），不在循环里逐行查 ——
 * 与 api/orders 列表补卡密、补发票的写法一致。
 */

/** 筛选口径。customPending = 自定义奖品中奖、还没线下兑现的，是后台真正要处理的那一栏 */
const FILTERS: Record<string, Prisma.LotteryEntryWhereInput> = {
  all: {},
  pending: { state: 'PENDING' },
  drawn: { state: 'DRAWN' },
  won: { state: 'DRAWN', won: true },
  lost: { state: 'DRAWN', won: false },
  customPending: { state: 'DRAWN', prizeType: 'CUSTOM', fulfillState: 'PENDING' },
  // 资格作废（没抽就退款）与奖品作废（抽中了自定义奖品后退款）都算「作废」
  void: { OR: [{ state: 'VOID' }, { fulfillState: 'VOID' }] },
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const sp = request.nextUrl.searchParams
    const page = Math.max(parseInt(sp.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(sp.get('pageSize') || '20') || 20, 1), 100)
    const filterKey = sp.get('filter') || 'all'
    const keyword = (sp.get('keyword') || '').trim().slice(0, 100)

    // hasOwnProperty 而不是直接取下标：?filter=constructor 会取到 Object 原型上的东西塞进 where
    const and: Prisma.LotteryEntryWhereInput[] = [
      Object.prototype.hasOwnProperty.call(FILTERS, filterKey) ? FILTERS[filterKey] : FILTERS.all,
    ]
    if (keyword) {
      // 订单号在记录表里有快照，直接 contains；邮箱要先去用户表换成 id。
      // 邮箱命中上限 200 个用户：关键词短到能命中几百个账户时，本来也该换个更准的词
      const users = await prisma.user.findMany({
        where: { email: { contains: keyword } },
        select: { id: true },
        take: 200,
      })
      and.push({
        OR: [{ orderNo: { contains: keyword } }, ...(users.length ? [{ userId: { in: users.map((u) => u.id) } }] : [])],
      })
    }
    const where: Prisma.LotteryEntryWhereInput = { AND: and }

    const [rows, total] = await Promise.all([
      prisma.lotteryEntry.findMany({
        where,
        orderBy: [{ id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lotteryEntry.count({ where }),
    ])

    const userIds = Array.from(new Set(rows.map((r) => r.userId)))
    const grantIds = rows.map((r) => r.couponGrantId).filter((x): x is number => x != null)
    const [users, grants] = await Promise.all([
      userIds.length
        ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true, nickname: true } })
        : Promise.resolve([]),
      grantIds.length
        ? prisma.couponGrant.findMany({
            where: { id: { in: grantIds } },
            select: {
              id: true,
              state: true,
              expiresAt: true,
              orderId: true,
              usedAt: true,
              coupon: { select: { status: true } },
            },
          })
        : Promise.resolve([]),
    ])
    const userMap = new Map(users.map((u) => [u.id, u]))
    const grantMap = new Map(grants.map((g) => [g.id, g]))
    const now = Date.now()

    return success({
      list: rows.map((r) => {
        const snap = parsePrizeSnapshot(r.prizeDetail)
        const u = userMap.get(r.userId)
        const g = r.couponGrantId != null ? grantMap.get(r.couponGrantId) : undefined
        // 券的「当前」状态：过期只在买家打开「我的优惠券」时才惰性落库，批次被结束时
        // AVAILABLE 的那张也会被作废 —— 后台按买家实际看到的口径显示，不按库里那个滞后的值
        let couponState: string | null = null
        if (g) {
          couponState = g.state
          if (g.state === 'AVAILABLE' && g.coupon.status === 'ENDED') couponState = 'VOID'
          else if (g.state === 'AVAILABLE' && g.expiresAt && g.expiresAt.getTime() <= now) couponState = 'EXPIRED'
        }
        return {
          id: r.id,
          orderId: r.orderId,
          orderNo: r.orderNo,
          userId: r.userId,
          user: u ? { email: u.email, nickname: u.nickname } : null,
          state: r.state,
          won: r.state === 'DRAWN' ? !!r.won : null,
          prizeId: r.prizeId,
          prizeName: r.prizeName,
          prizeType: r.prizeType,
          prizeLabel: r.won ? snap?.label ?? r.prizeName : null,
          description: r.won ? snap?.description ?? null : null,
          couponGrantId: r.couponGrantId,
          coupon: g
            ? {
                state: couponState,
                expiresAt: g.expiresAt,
                // 用在了哪张订单上（LOCKED / USED 时有值）
                orderId: g.orderId,
                usedAt: g.usedAt,
              }
            : null,
          fulfillState: r.fulfillState,
          fulfilledAt: r.fulfilledAt,
          fulfillNote: r.fulfillNote,
          drawnAt: r.drawnAt,
          createdAt: r.createdAt,
        }
      }),
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    })
  } catch (err) {
    console.error('List lottery entries error:', err)
    return error('获取抽奖记录失败')
  }
}
