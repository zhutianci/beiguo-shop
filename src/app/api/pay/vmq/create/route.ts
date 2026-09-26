export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import {
  createOrGetVmqOrder,
  VmqError,
  VMQ_TIMEOUT_MIN,
  VMQ_MAX_OPEN_PER_USER,
  countOpenOrderPayments,
  hasOpenPayment,
  discardVmqOrder,
} from '@/lib/vmq'
import { assertCouponForPayment } from '@/lib/coupon'
import { getStorefront } from '@/lib/storefront/resolve'

const schema = z.object({
  orderNo: z.string().min(1, '缺少订单号'),
})

/** 从建单（或管理员最后一次改这张单）到「新发起收款」的最长间隔，默认 24 小时；配错时至少 60 分钟 */
const ORDER_PAY_WINDOW_MIN = Math.max(60, Number(process.env.ORDER_PAY_WINDOW_MIN) || 1440)

// 为商品订单发起 V免签 收款，返回收银台地址
export async function POST(request: NextRequest) {
  // 店面解析不进 try（设计 4.4 第 7 条）
  const sf = await getStorefront()
  if (!sf) return error('订单不存在', 404)
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const order = await prisma.order.findUnique({ where: { orderNo: parsed.data.orderNo } })
    if (!order || order.userId !== user.id) return error('订单不存在')
    // 【店面不符 → 404】（设计 4.5、8.2）订单只能在它下单的那个站付款：收银台、到账后的跳转、邮件链接都按订单的站走。
    // 同一账号拿 lulu 的订单号到主站发起收款（或反过来）一律当不存在，文案与上一行相同
    if (order.tenantId !== sf.id) return error('订单不存在', 404)
    if (order.payStatus === 'PAID') return error('订单已支付')
    if (order.payStatus === 'REFUNDED') return error('订单已退款，无法支付')

    // 【钱已经到了、订单还没翻成已付款】到账那一次履约抛错时会这样（由 cron 对账约 3 分钟内补上）。
    // 这期间买家在订单页再点「去支付」，原来会新建一张收款单、被收第二次钱。走 [bizType,bizId,state] 索引。
    // 只加在这里、不写进 createOrGetVmqOrder：发票两条支付路径不受影响
    const paidVmq = await prisma.vmqOrder.findFirst({
      where: { bizType: 'order', bizId: order.id, state: 1 },
      select: { id: true },
    })
    if (paidVmq) return error('这笔订单已收到付款，系统正在处理，请稍后刷新订单页；长时间未更新请联系客服')

    if (order.deliveryStatus === 'CANCELLED') return error('订单已超时取消，请重新下单')

    // 本单已有有效期内的收款单（刷新收银台 / 订单页再点「去支付」）→ 下面原样复用，不占新金额，
    // 下面几道闸门都不拦：收银台已经开着，那张二维码照样能到账，这时拦截只会给买家一条前后矛盾的提示
    const reusing = await hasOpenPayment('order', order.id)
    const tooMany = `你已有 ${VMQ_MAX_OPEN_PER_USER} 笔订单在等待付款，请先在「我的订单」完成支付，或等其超时（约 ${VMQ_TIMEOUT_MIN} 分钟）自动取消后再试`
    if (!reusing) {
      /*
       * 【没发起过支付的订单不会被超时关单】closeExpired 只扫收款单，只调建单接口、不点付款的
       * 订单会一直是待支付，可以留着等涨价或下架之后再按旧价付款，AUTO 商品还会自动发卡。
       * 所以「新发起」一张收款单时要复核三件事。必须放在券复验和 lockedAt 刷新之前：被拒的订单不能顺手刷新券锁。
       */
      // updatedAt 是建单时刻；管理员改过这张单（改价、协商特价）的话就是最后一次修改的时刻。
      // 待支付且未取消的订单只有后台能改，买家自己刷新不了这个时间
      if (Date.now() - order.updatedAt.getTime() > ORDER_PAY_WINDOW_MIN * 60_000) {
        return error('订单已超过支付有效期，请重新下单')
      }
      const product = await prisma.product.findUnique({
        where: { id: order.productId },
        select: { status: true, price: true },
      })
      if (!product || product.status !== 1) return error('该商品已下架，订单无法支付')
      // 标价变了就不能按旧快照收款。比的是 productPrice（建单时的标价快照），不是 amount：
      // 券价、内推专属价、含税金额都不会误判。管理员手工改过的单以管理员为准，不比这一项
      const adminTouched = order.updatedAt.getTime() - order.createdAt.getTime() > 5_000
      /*
       * 【渠道单比的是本店售价】渠道单的 productPrice 快照是 TenantListing.retailCents（设计 5.4），与站长的
       * Product.price 本来就不相等，拿它比会让每一张渠道单都付不了款。所以渠道单比上架行当前售价，
       * 并要求上架行仍授权、仍上架（渠道下架 / 站长撤销授权 = 该商品在本店已下架）。
       * 店面状态**不看**：SUSPENDED 时已下单未付款的收银台照常可付（设计 6.7）。
       */
      let currentUnitCents = Math.round(Number(product.price) * 100)
      if (order.tenantId !== 1) {
        const listing = await prisma.tenantListing.findUnique({
          where: { tenantId_productId: { tenantId: order.tenantId, productId: order.productId } },
          select: { granted: true, status: true, retailCents: true },
        })
        if (!listing || !listing.granted || listing.status !== 1 || listing.retailCents == null) {
          return error('该商品已下架，订单无法支付')
        }
        currentUnitCents = listing.retailCents
      }
      if (!adminTouched && currentUnitCents !== Math.round(Number(order.productPrice) * 100)) {
        return error('商品价格已调整，请重新下单')
      }

      // 每个买家同时挂着的待付款收款单有上限：每张都占一个唯一金额，而金额池只有 50 格、全站共用
      if ((await countOpenOrderPayments(user.id)) >= VMQ_MAX_OPEN_PER_USER) return error(tooMany, 429)
    }

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

    // 【事后复核】预检和分配之间不是原子的，并发的一批请求会一起通过预检。分配完再数一次，超了就作废自己这张：
    // 最后完成复核的幸存者看到的计数包含所有幸存者，所以幸存数一定 ≤ 上限。这张收款单还没交给买家，作废不影响任何在途付款。
    // 只作废本次新建的（vmq.created）：锁内重查拿到的是同一订单另一个标签页刚建的那张，它可能已经显示成二维码，
    // 作废了那边的收银台会变成「已过期」；它本来就被计在上面的数里，原样复用即可
    if (!reusing && vmq.created && (await countOpenOrderPayments(user.id)) > VMQ_MAX_OPEN_PER_USER) {
      await discardVmqOrder(vmq.orderId).catch((e) => console.error('[vmq] 超额收款单回滚失败', vmq.orderId, e))
      return error(tooMany, 429)
    }

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
