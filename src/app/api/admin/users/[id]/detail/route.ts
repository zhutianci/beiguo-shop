export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'

// 每个区块自带分页，避免大户一次拉爆
function readPager(sp: URLSearchParams, pageKey: string, sizeKey: string, defSize = 10) {
  const page = Math.max(parseInt(sp.get(pageKey) || '1') || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(sp.get(sizeKey) || String(defSize)) || defSize, 1), 50)
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}

function num(v: unknown): number {
  return v == null ? 0 : Number(v)
}

// 用户全景详情：基础信息 + 统计 + 订单 / 付款 / 余额流水 / 绑定账户 / 内推
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) return notFound('用户不存在')

    const { searchParams } = new URL(request.url)
    const orderPager = readPager(searchParams, 'orderPage', 'orderPageSize')
    const payPager = readPager(searchParams, 'payPage', 'payPageSize')
    const balancePager = readPager(searchParams, 'balancePage', 'balancePageSize')

    const [
      user,
      orders,
      orderTotal,
      payments,
      payTotal,
      balanceLogs,
      balanceTotal,
      boundAccounts,
      paidCount,
      deliveredCount,
      paidAmountAgg,
      referralPriceCount,
      referrerBasePriceCount,
      rewardAgg,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          phone: true,
          nickname: true,
          avatar: true,
          balance: true,
          vipLevel: true,
          role: true,
          status: true,
          referralCode: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: { userId },
        select: {
          id: true,
          orderNo: true,
          productName: true,
          quantity: true,
          amount: true,
          payMethod: true,
          payStatus: true,
          deliveryStatus: true,
          createdAt: true,
          paidAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: orderPager.skip,
        take: orderPager.take,
      }),
      prisma.order.count({ where: { userId } }),
      prisma.payment.findMany({
        where: { order: { userId } },
        select: {
          id: true,
          tradeNo: true,
          payMethod: true,
          amount: true,
          status: true,
          createdAt: true,
          order: { select: { orderNo: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: payPager.skip,
        take: payPager.take,
      }),
      prisma.payment.count({ where: { order: { userId } } }),
      prisma.balanceLog.findMany({
        where: { userId },
        select: {
          id: true,
          delta: true,
          balanceAfter: true,
          type: true,
          note: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: balancePager.skip,
        take: balancePager.take,
      }),
      prisma.balanceLog.count({ where: { userId } }),
      prisma.userAccount.findMany({
        where: { userId },
        select: {
          id: true,
          accountEmail: true,
          platform: true,
          label: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: { userId, payStatus: 'PAID' } }),
      prisma.order.count({ where: { userId, deliveryStatus: 'DELIVERED' } }),
      prisma.order.aggregate({
        where: { userId, payStatus: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.referralPrice.count({ where: { userId } }),
      prisma.referrerBasePrice.count({ where: { userId } }),
      prisma.referralReward.aggregate({
        where: { referrerId: userId, status: 'SETTLED' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ])

    if (!user) return notFound('用户不存在')

    const pageInfo = (total: number, p: { page: number; pageSize: number }) => ({
      total,
      page: p.page,
      pageSize: p.pageSize,
      totalPages: Math.max(Math.ceil(total / p.pageSize), 1),
    })

    return success({
      user,
      stats: {
        orderCount: orderTotal,
        paidOrderCount: paidCount,
        deliveredOrderCount: deliveredCount,
        totalPaidAmount: num(paidAmountAgg._sum.amount),
        balance: num(user.balance),
        referralRewardTotal: num(rewardAgg._sum.amount),
        boundAccountCount: boundAccounts.length,
      },
      orders: {
        list: orders,
        ...pageInfo(orderTotal, orderPager),
      },
      payments: {
        list: payments.map((p) => ({
          id: p.id,
          tradeNo: p.tradeNo,
          orderNo: p.order?.orderNo ?? null,
          payMethod: p.payMethod,
          amount: p.amount,
          status: p.status,
          createdAt: p.createdAt,
        })),
        ...pageInfo(payTotal, payPager),
      },
      balanceLogs: {
        list: balanceLogs,
        ...pageInfo(balanceTotal, balancePager),
      },
      boundAccounts,
      referral: {
        referralCode: user.referralCode,
        referralPriceCount,
        referrerBasePriceCount,
        rewardCount: rewardAgg._count._all,
        rewardTotal: num(rewardAgg._sum.amount),
      },
    })
  } catch (err) {
    console.error('Get user detail error:', err)
    return error('获取用户详情失败')
  }
}
