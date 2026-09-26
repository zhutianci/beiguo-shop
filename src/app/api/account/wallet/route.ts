export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { BALANCE_TYPE_LABELS, referralOrderIdOf } from '@/lib/balance'
import { maskOrderNo } from '@/lib/mask'
import { denyOnChannel } from '@/lib/storefront/resolve'

/**
 * 账户余额：当前余额 + 汇总 + 余额流水（分页）。
 *
 * 【余额从哪来、到哪去】只有两个写入方（见 lib/referral.ts 与 api/admin/referrals/balance）：
 *   REFERRAL  推荐返现，订单完成时自动入账
 *   ADJUST / WITHDRAW  管理员手工调整 / 线下提现后记扣减
 * 买家没有任何「用余额付款」或「自助提现」的接口，页面文案也只能这么说。
 *
 * 【REFERRAL 流水不回显 note】它的 note 固定是「订单#123 内推返现」，123 是站内订单 id，
 * 而那张订单的买家是别人。改为按 referralOrderIdOf 反查订单，只给商品名 + 打码单号；
 * 反查时带上 referrerId = 本人，确保只解析「我推广的」订单。
 * ADJUST / WITHDRAW 的 note 是管理员写给这位用户看的说明，原样返回。
 *
 * 【待结算返现 pendingReward】与 /api/account/referral/orders 的「待结算」同一口径：
 * 我推广的、已付款、未取消、返现快照 > 0、还没有 SETTLED 结算记录的订单，返现快照求和。
 * 改一处要同步另一处。
 */

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
    const pageSize = Math.min(Math.max(parseInt(sp.get('pageSize') || '20') || 20, 1), 50)

    const settledRows = await prisma.referralReward.findMany({
      where: { referrerId: user.id, status: 'SETTLED' },
      select: { orderId: true },
    })
    const settledIds = settledRows.map((r) => r.orderId)

    const [incomeAgg, withdrawAgg, pendingAgg, total, logs] = await Promise.all([
      prisma.balanceLog.aggregate({ where: { userId: user.id, delta: { gt: 0 } }, _sum: { delta: true } }),
      prisma.balanceLog.aggregate({ where: { userId: user.id, type: 'WITHDRAW' }, _sum: { delta: true } }),
      prisma.order.aggregate({
        where: {
          referrerId: user.id,
          payStatus: 'PAID',
          deliveryStatus: { not: 'CANCELLED' },
          referralReward: { gt: 0 },
          ...(settledIds.length ? { id: { notIn: settledIds } } : {}),
        },
        _sum: { referralReward: true },
      }),
      prisma.balanceLog.count({ where: { userId: user.id } }),
      prisma.balanceLog.findMany({
        where: { userId: user.id },
        // id 兜底：同一毫秒写入的两条也有确定顺序，翻页不重不漏
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, type: true, delta: true, balanceAfter: true, note: true, orderId: true, createdAt: true },
      }),
    ])

    // 本页 REFERRAL 流水对应的订单，一次批量查
    const orderIdOfLog = new Map<number, number>()
    logs.forEach((l) => {
      const oid = referralOrderIdOf(l)
      if (oid) orderIdOfLog.set(l.id, oid)
    })
    const orderIds = Array.from(new Set(Array.from(orderIdOfLog.values())))
    const orders = orderIds.length
      ? await prisma.order.findMany({
          where: { id: { in: orderIds }, referrerId: user.id },
          select: { id: true, orderNo: true, productName: true },
        })
      : []
    const orderMap = new Map(orders.map((o) => [o.id, o]))

    const list = logs.map((l) => {
      const oid = orderIdOfLog.get(l.id)
      const o = oid ? orderMap.get(oid) : undefined
      return {
        id: l.id,
        type: l.type,
        typeLabel: BALANCE_TYPE_LABELS[l.type] || '余额变动',
        delta: toCents(l.delta) / 100,
        balanceAfter: toCents(l.balanceAfter) / 100,
        /*
         * 备注一律不回显给买家：
         *  · 返现流水的 note 带着别人订单的内部 id（改由 order 字段展示商品名 + 打码单号）
         *  · 调整 / 提现流水的 note 是管理员在「内推管理 → 提现/调整」里写的，那个输入框从来没说过
         *    买家看得见，历史上写的是给自己看的内部备注（可能含别的订单号、别的买家名字）。
         *    买家看到类型（余额调整 / 提现）和金额就够了，要细节找客服
         */
        note: null,
        createdAt: l.createdAt.toISOString(),
        order: o ? { orderNoMasked: maskOrderNo(o.orderNo), productName: o.productName } : null,
      }
    })

    return success({
      balance: toCents(user.balance) / 100,
      totals: {
        income: toCents(incomeAgg._sum.delta) / 100,
        withdrawn: Math.abs(toCents(withdrawAgg._sum.delta)) / 100,
      },
      pendingReward: toCents(pendingAgg._sum.referralReward) / 100,
      logs: list,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    })
  } catch (err) {
    console.error('Get wallet error:', err)
    return error('获取余额明细失败')
  }
}
