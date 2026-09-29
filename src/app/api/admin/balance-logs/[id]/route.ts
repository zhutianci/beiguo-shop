export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { toCents, fromCents } from '@/lib/money'
import { couponLabel } from '@/lib/coupon'
import { BALANCE_TYPE_LABELS, referralOrderIdOf, ledgerOrderIdOf } from '@/lib/balance'
import { centsOf } from '@/lib/wallet/buckets'

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
 * 【B0 起按类型分支】（docs/短信接码-设计.md §6.6 第 1 条）REFERRAL 保留上面的返现核对；
 * 其余类型（HOLD / RELEASE / REFUND / TOPUP / LATEPAY 的 orderId 是本人自己的接码单或充值单）展示预扣与订单资金拆分、
 * 两格变动前后余额 —— 不再拿它去找返现记录（否则一条 HOLD 流水会报「没有找到对应的返现记录」）。
 * CLAWBACK 的 orderId 是「产生返现的别人的订单」，按返现订单展示但不做返现核对。
 *
 * 新建目录，动态参数用 Next 14 原生的 { params: { id: string } } 写法。
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  // 中间件之外再验一次（CVE-2025-29927：带特定请求头可整个跳过 middleware）
  const denied = await adminGuard()
  if (denied) return denied

  try {
    const id = parseInt(params.id)
    if (!Number.isSafeInteger(id) || id <= 0) return notFound('流水不存在')

    const log = await prisma.balanceLog.findUnique({ where: { id } })
    if (!log) return notFound('流水不存在')

    const isReferral = log.type === 'REFERRAL'
    const own = ledgerOrderIdOf(log)
    // 关联订单：REFERRAL / CLAWBACK = 产生返现的订单；接码与充值流水 = 本人自己的订单
    const orderId = isReferral ? referralOrderIdOf(log) : log.type === 'CLAWBACK' ? (log.orderId && log.orderId > 0 ? log.orderId : null) : own
    const [user, order, reward, hold] = await Promise.all([
      prisma.user.findUnique({
        where: { id: log.userId },
        select: { id: true, email: true, nickname: true, balance: true, topupCents: true },
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
      orderId && (isReferral || log.type === 'CLAWBACK')
        ? prisma.referralReward.findUnique({
            where: { orderId },
            select: { id: true, referrerId: true, amount: true, status: true, createdAt: true, settledAt: true },
          })
        : Promise.resolve(null),
      own
        ? prisma.balanceHold.findUnique({
            where: { orderId: own },
            select: { id: true, userId: true, topupCents: true, cashCents: true, orderCents: true, state: true, reason: true, heldAt: true, capturedAt: true, releasedAt: true, refundedAt: true },
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

    // 充值格：历史行 topup_after_cents 为空（当时充值格恒为 0）
    const topupDeltaCents = log.topupDeltaCents
    const topupAfterCents = log.topupAfterCents
    const topupBeforeCents = topupAfterCents == null ? null : topupAfterCents - topupDeltaCents

    const warnings: string[] = []
    if (orderId && !order) warnings.push(`关联订单 #${orderId} 已不存在`)
    const referrerMismatch = !!order && (isReferral || log.type === 'CLAWBACK') && order.referrerId !== log.userId
    if (isReferral) {
      // 返现核对只对 REFERRAL 做（其余类型的 orderId 不是返现订单）
      if (referrerMismatch) warnings.push('订单记录的推广人与这条流水的用户不一致')
      if (orderId && !reward) warnings.push('没有找到对应的返现记录（ReferralReward）')
      if (reward && reward.referrerId !== log.userId) warnings.push('返现记录的推广人与这条流水的用户不一致')
      if (reward && toCents(Number(reward.amount)) !== toCents(delta)) {
        warnings.push('返现记录金额与这条流水的变动额不一致')
      }
    } else if (own) {
      if (order && order.user.id !== log.userId) warnings.push('订单的买家与这条流水的用户不一致')
      if ((log.type === 'HOLD' || log.type === 'RELEASE') && !hold) warnings.push('没有找到对应的预扣记录（balance_holds）')
      if (hold && log.type === 'HOLD' && (hold.topupCents !== -topupDeltaCents || hold.cashCents !== -centsOf(log.delta))) {
        warnings.push('预扣两格金额与这条流水不一致')
      }
      if (hold && log.type === 'RELEASE' && (hold.state !== 'RELEASED' || hold.topupCents !== topupDeltaCents || hold.cashCents !== centsOf(log.delta))) {
        warnings.push('预扣状态或金额与这条释放流水不一致')
      }
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
        // B0：两格。delta / balanceBefore / balanceAfter 仍是返现格（元），充值格用分
        topupDeltaCents,
        topupBeforeCents,
        topupAfterCents,
        bizKey: log.bizKey,
        orderKind: isReferral || log.type === 'CLAWBACK' ? 'REFERRAL' : own ? 'OWN' : null,
      },
      user: user
        ? { id: user.id, email: user.email, nickname: user.nickname, balance: Number(user.balance), topupCents: user.topupCents }
        : null,
      hold: hold
        ? {
            ...hold,
            totalCents: hold.topupCents + hold.cashCents,
          }
        : null,
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
