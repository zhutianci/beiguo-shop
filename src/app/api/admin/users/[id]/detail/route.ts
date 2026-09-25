export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { referralOrderIdOf } from '@/lib/balance'

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
  // 中间件之外再验一次（CVE-2025-29927：带特定请求头可整个跳过 middleware）
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

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
          orderId: true,
          createdAt: true,
        },
        // id 兜底：同一秒写入的多条流水只按 createdAt 排序时顺序不稳定，翻页会重复/漏行
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
      // 已付款订单数 / 累计付款都排除「已付款 + 已取消」（线下退款的惯例做法，钱已退回）
      prisma.order.count({ where: { userId, payStatus: 'PAID', deliveryStatus: { not: 'CANCELLED' } } }),
      prisma.order.count({ where: { userId, deliveryStatus: 'DELIVERED' } }),
      prisma.order.aggregate({
        where: { userId, payStatus: 'PAID', deliveryStatus: { not: 'CANCELLED' } },
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
      user: { ...user, balance: num(user.balance) },
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
        list: orders.map((o) => ({ ...o, amount: num(o.amount) })),
        ...pageInfo(orderTotal, orderPager),
      },
      payments: {
        list: payments.map((p) => ({
          id: p.id,
          tradeNo: p.tradeNo,
          orderNo: p.order?.orderNo ?? null,
          payMethod: p.payMethod,
          amount: num(p.amount),
          status: p.status,
          createdAt: p.createdAt,
        })),
        ...pageInfo(payTotal, payPager),
      },
      balanceLogs: {
        // orderId：REFERRAL 流水对应的站内订单（新流水读列，历史流水从 note 解析），前端据此展示「关联订单」
        list: balanceLogs.map((b) => ({
          id: b.id,
          delta: num(b.delta),
          balanceAfter: num(b.balanceAfter),
          type: b.type,
          note: b.note,
          createdAt: b.createdAt,
          orderId: referralOrderIdOf(b),
        })),
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
