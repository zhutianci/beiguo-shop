export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { toCents, fromCents } from '@/lib/money'
import { couponLabel } from '@/lib/coupon'
import { BALANCE_TYPE_LABELS, referralOrderIdOf } from '@/lib/balance'

function num(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * 一条余额流水的详情（后台用户详情页点开「余额流水」某一行）。
 *
 * REFERRAL 流水要能一路追到产生这笔返现的那张订单：谁买的、买了什么、付了多少、
 * 下单时的返现快照、实际入账记录。订单 id 由 lib/balance.ts 的 referralOrderIdOf 给出 ——
 * 新流水读 balance_logs.order_id，历史流水从 note「订单#123 内推返现」里解析，这里不需要区分。
 *
 * 【几处对账校验，只提示不修正】流水、订单、ReferralReward 三处应当彼此吻合；
 * 不吻合说明数据被手工动过或写入时有并发，展示给管理员自己判断，这个只读接口不去改任何东西。
 *
 * 新建目录，动态参数用 Next 14 原生的 { params: { id: string } } 写法。
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  // 中间件之外再验一次（CVE-2025-29927：带特定请求头可整个跳过 middleware）
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const id = parseInt(params.id)
    if (!Number.isSafeInteger(id) || id <= 0) return notFound('流水不存在')

    const log = await prisma.balanceLog.findUnique({ where: { id } })
    if (!log) return notFound('流水不存在')

    const orderId = referralOrderIdOf(log)
    const [user, order, reward] = await Promise.all([
      prisma.user.findUnique({
        where: { id: log.userId },
        select: { id: true, email: true, nickname: true, balance: true },
      }),
      orderId
        ? prisma.order.findUnique({
            where: { id: orderId },
            select: {
              id: true,
              orderNo: true,
              productId: true,
              productName: true,
              productPrice: true,
              quantity: true,
              amount: true,
              invoiceTaxFee: true,
              referrerId: true,
              referralReward: true,
              couponGrantId: true,
              couponDiscount: true,
              originalAmount: true,
              payMethod: true,
              payStatus: true,
              deliveryStatus: true,
              createdAt: true,
              paidAt: true,
              deliveredAt: true,
              product: { select: { name: true } },
              user: { select: { id: true, email: true, nickname: true } },
              payments: {
                select: { id: true, tradeNo: true, payMethod: true, amount: true, status: true, createdAt: true },
                orderBy: { id: 'desc' },
              },
            },
          })
        : Promise.resolve(null),
      orderId
        ? prisma.referralReward.findUnique({
            where: { orderId },
            select: { id: true, referrerId: true, amount: true, status: true, createdAt: true, settledAt: true },
          })
        : Promise.resolve(null),
    ])

    const grant = order?.couponGrantId
      ? await prisma.couponGrant.findUnique({
          where: { id: order.couponGrantId },
          select: {
            id: true,
            state: true,
            coupon: { select: { name: true, code: true, source: true, kind: true, minAmount: true, discount: true } },
          },
        })
      : null

    const delta = Number(log.delta)
    const balanceAfter = Number(log.balanceAfter)
    // 变动前 = 变动后 − 变动额，按分算（balanceAfter 是写入时的快照，并发写入时快照本身可能不准）
    const balanceBefore = fromCents(toCents(balanceAfter) - toCents(delta))

    const warnings: string[] = []
    if (orderId && !order) warnings.push(`关联订单 #${orderId} 已不存在`)
    const referrerMismatch = !!order && order.referrerId !== log.userId
    if (referrerMismatch) warnings.push('订单记录的推广人与这条流水的用户不一致')
    if (orderId && !reward) warnings.push('没有找到对应的返现记录（ReferralReward）')
    if (reward && reward.referrerId !== log.userId) warnings.push('返现记录的推广人与这条流水的用户不一致')
    if (reward && toCents(Number(reward.amount)) !== toCents(delta)) {
      warnings.push('返现记录金额与这条流水的变动额不一致')
    }

    return success({
      log: {
        id: log.id,
        userId: log.userId,
        type: log.type,
        typeLabel: BALANCE_TYPE_LABELS[log.type] || log.type,
        delta,
        balanceBefore,
        balanceAfter,
        note: log.note,
        createdAt: log.createdAt,
        orderId,
      },
      user: user ? { id: user.id, email: user.email, nickname: user.nickname, balance: Number(user.balance) } : null,
      order: order
        ? {
            id: order.id,
            orderNo: order.orderNo,
            productId: order.productId,
            // 订单上的商品名是下单时的快照；商品之后改名不影响这里
            productName: order.productName,
            currentProductName: order.product?.name ?? null,
            quantity: order.quantity,
            // 下单时的商品标价快照（专属价 / 券减免之前的单价）
            productPrice: Number(order.productPrice),
            amount: Number(order.amount),
            invoiceTaxFee: num(order.invoiceTaxFee),
            payable: fromCents(toCents(Number(order.amount)) + toCents(num(order.invoiceTaxFee) ?? 0)),
            referralReward: num(order.referralReward),
            referrerId: order.referrerId,
            referrerMismatch,
            couponDiscount: num(order.couponDiscount),
            originalAmount: num(order.originalAmount),
            payMethod: order.payMethod,
            payStatus: order.payStatus,
            deliveryStatus: order.deliveryStatus,
            createdAt: order.createdAt,
            paidAt: order.paidAt,
            deliveredAt: order.deliveredAt,
            buyer: order.user,
            payments: order.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
            coupon: grant
              ? {
                  grantId: grant.id,
                  state: grant.state,
                  name: grant.coupon.name,
                  code: grant.coupon.code,
                  source: grant.coupon.source,
                  label: couponLabel({
                    kind: grant.coupon.kind,
                    minAmount: Number(grant.coupon.minAmount),
                    discount: Number(grant.coupon.discount),
                  }),
                }
              : null,
          }
        : null,
      reward: reward
        ? {
            id: reward.id,
            referrerId: reward.referrerId,
            amount: Number(reward.amount),
            status: reward.status,
            createdAt: reward.createdAt,
            settledAt: reward.settledAt,
          }
        : null,
      warnings,
    })
  } catch (err) {
    console.error('Admin balance log detail error:', err)
    return error('获取流水详情失败')
  }
}
