export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

// 内推总览：推广人列表（链接/收益）+ 返现明细（明细分页，合计走 aggregate/count）
export async function GET(request: NextRequest) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bigolab.com'

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20'), 1), 100)

    const [referrerUsers, grouped, rewards, rewardTotal, settledAgg] = await Promise.all([
      prisma.user.findMany({
        where: { referralCode: { not: null } },
        select: { id: true, nickname: true, email: true, referralCode: true, balance: true },
      }),
      prisma.referralReward.groupBy({
        by: ['referrerId'],
        where: { status: 'SETTLED' },
        _sum: { amount: true },
        _count: true,
      }),
      // 返现明细：分页取当前页，不再一次性 take 200
      prisma.referralReward.findMany({
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.referralReward.count(),
      prisma.referralReward.aggregate({ _sum: { amount: true }, where: { status: 'SETTLED' } }),
    ])

    const sumMap = new Map(grouped.map((g) => [g.referrerId, { sum: Number(g._sum.amount ?? 0), count: g._count }]))

    // 名称映射（只针对当前页明细）
    const uid = new Set<number>()
    rewards.forEach((r) => {
      uid.add(r.referrerId)
      uid.add(r.buyerId)
    })
    const pids = Array.from(new Set(rewards.map((r) => r.productId)))
    const [users, products] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: Array.from(uid) } }, select: { id: true, nickname: true, email: true } }),
      prisma.product.findMany({ where: { id: { in: pids } }, select: { id: true, name: true } }),
    ])
    const uname = new Map(users.map((u) => [u.id, u.nickname || u.email || `用户#${u.id}`]))
    const pname = new Map(products.map((p) => [p.id, p.name]))

    const referrers = referrerUsers
      .map((u) => {
        const s = sumMap.get(u.id)
        return {
          id: u.id,
          name: u.nickname || u.email || `用户#${u.id}`,
          code: u.referralCode,
          link: `${appUrl}/products?ref=${u.referralCode}`,
          balance: Number(u.balance),
          settledTotal: s?.sum ?? 0,
          settledCount: s?.count ?? 0,
        }
      })
      .sort((a, b) => b.settledTotal - a.settledTotal)

    const rewardList = rewards.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      referrer: uname.get(r.referrerId) || `用户#${r.referrerId}`,
      buyer: uname.get(r.buyerId) || `用户#${r.buyerId}`,
      product: pname.get(r.productId) || `商品#${r.productId}`,
      amount: Number(r.amount),
      status: r.status,
      createdAt: r.createdAt,
      settledAt: r.settledAt,
    }))

    return success({
      referrers,
      rewards: rewardList,
      // 返现明细的分页信息
      rewardPage: {
        page,
        pageSize,
        total: rewardTotal,
        totalPages: Math.max(Math.ceil(rewardTotal / pageSize), 1),
      },
      totals: {
        // 真实合计/条数：来自 aggregate / count，而不是被截断的数组
        settledTotal: Math.round(Number(settledAgg._sum.amount ?? 0) * 100) / 100,
        rewardCount: rewardTotal,
        referrerCount: referrerUsers.length,
      },
    })
  } catch (err) {
    console.error('Admin referrals error:', err)
    return error('查询失败')
  }
}
