export const dynamic = 'force-dynamic'

import crypto from 'crypto'
import { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { maskBuyer, maskOrderNo } from '@/lib/mask'
import { denyOnChannel } from '@/lib/storefront/resolve'

/**
 * 推广订单：别人通过「我的」推广链接下的单（Order.referrerId = 我，有索引）。
 *
 * 【隐私】这些订单的买家是别人。绝不返回买家 id / 邮箱 / 手机号、订单内部 id、完整订单号：
 *   · 买家只给打码后的显示名（maskBuyer）
 *   · 订单号只给首尾（maskOrderNo）—— 完整单号是收银台和「下单有奖」的查询键
 *   · 列表 key 用进程内随机密钥做的 HMAC 截断：稳定到能让前端「加载更多」去重，
 *     但反推不出订单 id。不能直接哈希订单号：打码后只剩 4 位未知字符，穷举一百多万次就出来了
 *
 * 【返现状态】
 *   SETTLED = 已有 ReferralReward(SETTLED) 行，钱已进余额（lib/referral.ts settleReferral）
 *   PENDING = 有返现快照(>0)、已付款、未取消、还没结算 —— 订单「已完成」时自动结算
 *   NONE    = 其余：没付款、已取消/退款、或这一单本就没有返现（专属价=基础价）
 *
 * 【筛选 filter】
 *   all      全部推广订单（含未付款、已取消）
 *   pending  待结算：与上面 PENDING 同一口径
 *   settled  已到账：已有 SETTLED 返现记录的订单
 *   inactive 未付款或已取消：未付款、已退款、或已取消。
 *            注意：返现一旦结算不会因后续退款/取消而冲回（现有代码没有冲回逻辑），
 *            所以极少数订单会同时出现在「已到账」和这里 —— 两边都如实反映各自的状态。
 *
 * 【汇总 summary】按「我的全部推广订单」算，不随分页/筛选变化。
 * 待结算的口径与 /api/account/wallet 的 pendingReward 一致，改一处要同步另一处。
 */

const FILTERS = ['all', 'pending', 'settled', 'inactive'] as const
type Filter = (typeof FILTERS)[number]

// 每个进程一把随机密钥：key 只需在一次浏览里稳定，不需要跨重启稳定
const KEY_SECRET = crypto.randomBytes(16)
function opaqueKey(orderId: number): string {
  return crypto.createHmac('sha256', KEY_SECRET).update(`ref-order:${orderId}`).digest('hex').slice(0, 16)
}

type BuyerStatus = 'UNPAID' | 'PAID' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'

/** 优先级与买家「我的订单」页一致：取消 > 未付款/退款 > 已完成 > 已付款 */
function statusOf(payStatus: string, deliveryStatus: string): BuyerStatus {
  if (deliveryStatus === 'CANCELLED') return 'CANCELLED'
  if (payStatus === 'REFUNDED') return 'REFUNDED'
  if (payStatus !== 'PAID') return 'UNPAID'
  if (deliveryStatus === 'DELIVERED') return 'DELIVERED'
  return 'PAID'
}

const toCents = (v: unknown) => Math.round(Number(v ?? 0) * 100)

export async function GET(request: NextRequest) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const sp = request.nextUrl.searchParams
    const page = Math.max(parseInt(sp.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(sp.get('pageSize') || '10') || 10, 1), 50)
    const rawFilter = sp.get('filter') || 'all'
    const filter: Filter = (FILTERS as readonly string[]).includes(rawFilter) ? (rawFilter as Filter) : 'all'

    // 已结算的订单 id。Order 与 ReferralReward 之间没有 Prisma 关系，只能先取 id 再 in/notIn
    const settledRows = await prisma.referralReward.findMany({
      where: { referrerId: user.id, status: 'SETTLED' },
      select: { orderId: true, amount: true },
    })
    const settledIds = settledRows.map((r) => r.orderId)
    const settledSet = new Set(settledIds)
    const settledCents = settledRows.reduce((s, r) => s + toCents(r.amount), 0)

    const mine: Prisma.OrderWhereInput = { referrerId: user.id }
    const pendingWhere: Prisma.OrderWhereInput = {
      referrerId: user.id,
      payStatus: 'PAID',
      deliveryStatus: { not: 'CANCELLED' },
      referralReward: { gt: 0 },
      ...(settledIds.length ? { id: { notIn: settledIds } } : {}),
    }
    const settledWhere: Prisma.OrderWhereInput = { referrerId: user.id, id: { in: settledIds } }
    const inactiveWhere: Prisma.OrderWhereInput = {
      referrerId: user.id,
      OR: [{ payStatus: { in: ['UNPAID', 'REFUNDED'] } }, { deliveryStatus: 'CANCELLED' }],
    }
    const listWhere =
      filter === 'pending' ? pendingWhere : filter === 'settled' ? settledWhere : filter === 'inactive' ? inactiveWhere : mine

    const [orderCount, paidCount, inactiveCount, pendingAgg, total, orders] = await Promise.all([
      prisma.order.count({ where: mine }),
      prisma.order.count({ where: { referrerId: user.id, payStatus: 'PAID', deliveryStatus: { not: 'CANCELLED' } } }),
      prisma.order.count({ where: inactiveWhere }),
      prisma.order.aggregate({ where: pendingWhere, _sum: { referralReward: true }, _count: { _all: true } }),
      prisma.order.count({ where: listWhere }),
      // settledIds 为空时 id: { in: [] } 由 Prisma 直接判为无结果，不会发出非法的 IN ()
      prisma.order.findMany({
        where: listWhere,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          orderNo: true,
          productName: true,
          quantity: true,
          amount: true,
          payStatus: true,
          deliveryStatus: true,
          referralReward: true,
          createdAt: true,
          paidAt: true,
          // 只取打码要用的两个字段，id / 手机号一概不取
          user: { select: { nickname: true, email: true } },
        },
      }),
    ])

    const list = orders.map((o) => {
      const status = statusOf(o.payStatus, o.deliveryStatus)
      const reward = o.referralReward != null ? Math.round(Number(o.referralReward) * 100) / 100 : null
      const rewardState: 'SETTLED' | 'PENDING' | 'NONE' = settledSet.has(o.id)
        ? 'SETTLED'
        : reward != null && reward > 0 && o.payStatus === 'PAID' && o.deliveryStatus !== 'CANCELLED'
          ? 'PENDING'
          : 'NONE'
      return {
        key: opaqueKey(o.id),
        orderNoMasked: maskOrderNo(o.orderNo),
        productName: o.productName,
        quantity: o.quantity,
        amount: Math.round(Number(o.amount) * 100) / 100,
        status,
        buyer: maskBuyer(o.user),
        createdAt: o.createdAt.toISOString(),
        paidAt: o.paidAt ? o.paidAt.toISOString() : null,
        reward,
        rewardState,
      }
    })

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      filter,
      summary: {
        orderCount,
        paidCount,
        settledReward: settledCents / 100,
        settledCount: settledIds.length,
        pendingReward: toCents(pendingAgg._sum.referralReward) / 100,
        pendingCount: pendingAgg._count._all,
      },
      counts: {
        all: orderCount,
        pending: pendingAgg._count._all,
        settled: settledIds.length,
        inactive: inactiveCount,
      },
    })
  } catch (err) {
    console.error('List referral orders error:', err)
    return error('获取推广订单失败')
  }
}
