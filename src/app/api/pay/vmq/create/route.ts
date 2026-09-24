export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { createOrGetVmqOrder, VmqError } from '@/lib/vmq'
import { assertCouponForPayment } from '@/lib/coupon'

const schema = z.object({
  orderNo: z.string().min(1, '缺少订单号'),
})

// 为商品订单发起 V免签 收款，返回收银台地址
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const order = await prisma.order.findUnique({ where: { orderNo: parsed.data.orderNo } })
    if (!order || order.userId !== user.id) return error('订单不存在')
    if (order.payStatus === 'PAID') return error('订单已支付')
    if (order.payStatus === 'REFUNDED') return error('订单已退款，无法支付')
    if (order.deliveryStatus === 'CANCELLED') return error('订单已超时取消，请重新下单')

    // 站长明确要求的那道复验：提交收款监控之前，确认「账户与券一致、券处于可用（锁定）状态」。
    // 建单时已经校验并锁定过一次，这里防的是另一件事 —— 订单与券的关联在中途被改坏。
    const couponOk = await assertCouponForPayment(order.id, user.id)
    if (!couponOk.ok) return error(couponOk.message)

    /*
     * 【把券的锁定时间刷新成「开始付款」这一刻】lockedAt 原本是建单时间，兜底清扫
     * （sweepStuckCoupons）按它判「锁太久」。买家建单后隔很久才来付款的话，清扫可能在他
     * 付款途中把券放回去 —— 他照样按优惠价付款成功，券却还能再用一次。
     * 刷新之后清扫窗口从这一刻重新算，远长于收款单的超时，收款单超时关单时会正常释放券。
     *
     * 必须放在 createOrGetVmqOrder 之前：它内部先跑 closeExpired → 清扫，放在后面的话
     * 这一次清扫就可能先把券放掉。CAS 条件带 state/orderId：上面复验通过到这里之间券若被
     * 释放了（count=0），就按复验失败处理，不给一张「券已不在」的订单发起收款。
     */
    if (order.couponGrantId) {
      const touched = await prisma.couponGrant.updateMany({
        where: { id: order.couponGrantId, orderId: order.id, state: 'LOCKED' },
        data: { lockedAt: new Date() },
      })
      if (touched.count !== 1) return error('优惠券状态已变更，请重新下单')
    }

    /*
     * 【收的是 货款 + 开票税费】下单时勾了「同时开发票」的订单，
     * 税费在 order.invoiceTaxFee 上单独记着，这里一次收清 —— 买家只需要一条付款记录，
     * 这正是这次改造的出发点（公司报销不接受分两次付）。
     *
     * order.amount 本身**不含税**，绝不能把 6% 折进去：它同时是支付流水、
     * 单卡售价分摊、内推返现与后台利润的基准，折进去这些数字会全部虚高。
     */
    const taxFee = order.invoiceTaxFee == null ? 0 : Number(order.invoiceTaxFee)
    const payable = Math.round((Number(order.amount) + taxFee) * 100) / 100

    const vmq = await createOrGetVmqOrder({
      bizType: 'order',
      bizId: order.id,
      outTradeNo: order.orderNo,
      price: payable,
    })

    return success({
      payUrl: `/pay/${vmq.orderId}`,
      orderId: vmq.orderId,
      reallyPrice: vmq.reallyPrice,
      goodsAmount: Number(order.amount),
      taxFee,
    })
  } catch (err) {
    if (err instanceof VmqError) return error(err.message)
    console.error('Vmq create error:', err)
    return error('发起支付失败')
  }
}
