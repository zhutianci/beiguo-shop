export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { generateOrderNo } from '@/lib/utils'
import { decryptCardContent } from '@/lib/cardkey'
import { effectiveBasePrice } from '@/lib/referral'
import { calcInvoiceAmounts } from '@/lib/invoice'
import { shopOrderSourceKey } from '@/lib/order-billing'
import { notifyOrderCreated } from '@/lib/notify'
import { quoteOrder, grantUsable, parseProductIds, rejectReason, type GrantState } from '@/lib/coupon'

const createOrderSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1).default(1),
  remark: z.string().optional(),
  ref: z.string().trim().optional().nullable(), // 内推码
  /** 要使用的券实例 id（CouponGrant.id）。只对本人有效，服务端会校验归属 */
  couponGrantId: z.number().int().positive().optional().nullable(),
})

// 获取用户订单列表（分页 + 服务端筛选/检索）
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10') || 10, 1), 50)
    const filter = (searchParams.get('filter') || '').trim() // all | UNPAID | PROCESSING | DELIVERED
    const keyword = (searchParams.get('keyword') || '').trim()

    // 「处理中」是复合条件（已付款但尚未交付），没法用单个字段表达，这里集中定义一次，
    // 列表筛选与顶部徽标计数共用，避免两处口径漂移。
    const FILTERS: Record<string, Prisma.OrderWhereInput> = {
      UNPAID: { payStatus: 'UNPAID' },
      PROCESSING: { payStatus: 'PAID', deliveryStatus: { in: ['PENDING', 'PROCESSING'] } },
      DELIVERED: { deliveryStatus: 'DELIVERED' },
    }

    const base: Prisma.OrderWhereInput = { userId: user.id }
    const where: Prisma.OrderWhereInput = { ...base }
    if (FILTERS[filter]) Object.assign(where, FILTERS[filter])
    if (keyword) {
      where.OR = [{ orderNo: { contains: keyword } }, { productName: { contains: keyword } }]
    }

    // 顶部徽标计数：必须是「全部订单」的口径，不能随分页变成本页计数
    const [total, cAll, cUnpaid, cProcessing, cDelivered] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: base }),
      prisma.order.count({ where: { ...base, ...FILTERS.UNPAID } }),
      prisma.order.count({ where: { ...base, ...FILTERS.PROCESSING } }),
      prisma.order.count({ where: { ...base, ...FILTERS.DELIVERED } }),
    ])

    // 显式 select：不要用 include + {...o} 整行外泄。Order 上的 referrerId / referralReward
    // 属于内部成本口径，将来若再加成本/利润列，整行序列化会直接把毛利发给买家。
    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNo: true,
        productId: true,
        productName: true,
        productPrice: true,
        quantity: true,
        amount: true,
        payStatus: true,
        deliveryStatus: true,
        deliveryInfo: true,
        remark: true,
        createdAt: true,
        paidAt: true,
        deliveredAt: true,
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            deliveryType: true,
            cardUsage: true,
            cardRedeemUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // 自动发货：把已发给本人订单的卡密解密返回（仅本人、已支付订单可见）
    // cards 保持 string[]（旧字段，前端沿用）；cardItems 额外带上每张卡的专属兑换地址，
    // 买家侧展示时应优先用 card.redeemUrl，为空才回落 product.cardRedeemUrl。
    const paidIds = orders.filter((o) => o.payStatus === 'PAID').map((o) => o.id)
    const cardMap = new Map<number, { secret: string; redeemUrl: string | null }[]>()
    if (paidIds.length) {
      const cards = await prisma.cardKey.findMany({
        where: { orderId: { in: paidIds }, status: 'USED' },
        orderBy: { id: 'asc' },
      })
      for (const c of cards) {
        let plain = ''
        try {
          plain = decryptCardContent(c.content)
        } catch {
          plain = '(卡密解密失败，请联系客服)'
        }
        const arr = cardMap.get(c.orderId as number) || []
        arr.push({ secret: plain, redeemUrl: c.redeemUrl || null })
        cardMap.set(c.orderId as number, arr)
      }
    }

    // 统计每张订单「客服发来、买家未读」的留言数，用于订单列表红点提醒
    const allIds = orders.map((o) => o.id)
    const unreadMap = new Map<number, number>()
    if (allIds.length) {
      const grouped = await prisma.orderMessage.groupBy({
        by: ['orderId'],
        where: { orderId: { in: allIds }, sender: 'ADMIN', readByBuyer: false },
        _count: { _all: true },
      })
      for (const g of grouped) unreadMap.set(g.orderId, g._count._all)
    }

    // 发票/收据状态：买家订单通过背书外部订单(sourceKey=`order:<id>`)挂接，
    // 已申请过的订单查出其发票状态与收据令牌，用于订单页显示对应按钮
    const invByOrderId = new Map<number, { id: number; status: string; payStatus: string }>()
    const receiptByOrderId = new Map<number, string>()
    if (paidIds.length) {
      const exts = await prisma.externalOrder.findMany({
        where: { sourceKey: { in: paidIds.map((id) => shopOrderSourceKey(id)) } },
        select: { id: true, sourceKey: true },
      })
      if (exts.length) {
        const extIdToOrderId = new Map<number, number>()
        for (const e of exts) {
          const oid = parseInt(e.sourceKey.slice('order:'.length))
          if (oid) extIdToOrderId.set(e.id, oid)
        }
        const extIds = exts.map((e) => e.id)
        const [invs, recs] = await Promise.all([
          prisma.invoice.findMany({
            where: { externalOrderId: { in: extIds } },
            select: { id: true, externalOrderId: true, status: true, payStatus: true },
          }),
          prisma.receipt.findMany({
            where: { externalOrderId: { in: extIds } },
            select: { externalOrderId: true, token: true },
          }),
        ])
        for (const iv of invs) {
          const oid = iv.externalOrderId != null ? extIdToOrderId.get(iv.externalOrderId) : undefined
          if (oid) invByOrderId.set(oid, { id: iv.id, status: iv.status, payStatus: iv.payStatus })
        }
        for (const r of recs) {
          const oid = r.externalOrderId != null ? extIdToOrderId.get(r.externalOrderId) : undefined
          if (oid && r.token) receiptByOrderId.set(oid, r.token)
        }
      }
    }

    const withCards = orders.map((o) => {
      const paid = o.payStatus === 'PAID'
      const price = Number(o.amount)
      const inv = invByOrderId.get(o.id)
      const amt = paid ? calcInvoiceAmounts(price) : null
      // 收据金额：买家已付发票税费(payStatus=PAID) → 含税开票金额；否则售价。
      // 须与 submitReceiptForExternalOrder 中的服务端计费口径保持一致。
      const invoicePaid = inv?.payStatus === 'PAID'
      const items = cardMap.get(o.id) || []
      return {
        ...o,
        cards: items.map((c) => c.secret),
        cardItems: items, // [{ secret, redeemUrl }]：redeemUrl 为空则回落 product.cardRedeemUrl
        unreadCount: unreadMap.get(o.id) || 0,
        // 票据信息（仅已支付订单可申请）
        billing: paid
          ? {
              canInvoice: price > 0,
              canReceipt: price > 0,
              sellingPrice: price,
              invoiceAmount: amt!.invoiceAmount,
              taxFee: amt!.taxFee,
              receiptAmount: invoicePaid ? amt!.invoiceAmount : price,
              invoiceStatus: inv ? inv.status : 'UNAPPLIED',
              invoiceId: inv?.id ?? null,
              receiptToken: receiptByOrderId.get(o.id) ?? null,
            }
          : null,
      }
    })
    return success({
      list: withCards,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      counts: { all: cAll, UNPAID: cUnpaid, PROCESSING: cProcessing, DELIVERED: cDelivered },
    })
  } catch (err) {
    console.error('Get orders error:', err)
    return error('获取订单列表失败')
  }
}

// 创建订单
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const body = await request.json()
    const result = createOrderSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    const { productId, quantity, remark, ref } = result.data

    // 获取商品信息
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product || product.status !== 1) {
      return error('商品不存在或已下架')
    }

    // 检查库存
    if (product.stock !== -1 && product.stock < quantity) {
      return error('库存不足')
    }

    // 内推：通过推广人链接下单，使用其「专属价」，差额作为返现归推广人
    const base = Number(product.price)
    let unitPrice = base
    let referrerId: number | null = null
    let referralReward: number | null = null
    if (ref) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: ref },
        select: { id: true, status: true },
      })
      if (referrer && referrer.status === 1 && referrer.id !== user.id) {
        const rp = await prisma.referralPrice.findUnique({
          where: { userId_productId: { userId: referrer.id, productId } },
        })
        // 专属价默认 = 网站售价（推广人未单独设价时也按网站价卖）
        const sellUnit = rp ? Number(rp.price) : base
        // 返现 = 售卖价 − 我给推广人的基础价
        const effBase = (await effectiveBasePrice(referrer.id, productId)) ?? base
        unitPrice = sellUnit
        referrerId = referrer.id
        const per = Math.max(0, Math.round((sellUnit - effBase) * 100) / 100)
        referralReward = per * quantity
      }
    }

    const referralAmount = Math.round(unitPrice * quantity * 100) / 100
    const baseAmount = Math.round(base * quantity * 100) / 100
    let amount = referralAmount

    /*
     * ============ 优惠券 ============
     * 落点选在建单这一步，而不是站长说的「提交收款监控前」，原因是站长同时要求
     * 「订单记录为优惠后的价格」—— order.amount 在建单时就必须是优惠价，
     * 否则收款监控拿到的是原价，买家付了优惠价永远匹配不上到账。
     * 提交收款监控那一步会再复验一次（见 /api/pay/vmq/create），两道都在。
     *
     * 锁定用 updateMany 的条件更新做 CAS：条件里带 userId 与 state='AVAILABLE'，
     * 抢不到就说明这张券已经被另一笔订单占用。**绝不能先 findFirst 再 update** ——
     * 买家开两个标签同时下单，两个请求都会查到「可用」，然后各自用掉同一张券。
     */
    let couponGrantId: number | null = null
    let couponDiscount: number | null = null
    let originalAmount: number | null = null
    /** 券没用上时给前台的说明，随响应返回 */
    let couponNote: string | null = null

    if (result.data.couponGrantId) {
      const grant = await prisma.couponGrant.findFirst({
        where: { id: result.data.couponGrantId, userId: user.id },
        include: {
          coupon: { select: { kind: true, minAmount: true, discount: true, productIds: true, status: true } },
        },
      })
      if (!grant) return error('优惠券不存在')
      if (grant.coupon.status === 'ENDED') return error('该券所属活动已结束')

      const ok = grantUsable({ state: grant.state as GrantState, expiresAt: grant.expiresAt })
      if (!ok.ok) return error(ok.reason)

      const quote = quoteOrder({
        productId: product.id,
        listPrice: base,
        quantity,
        referralUnitPrice: referrerId ? unitPrice : null,
        rule: {
          kind: grant.coupon.kind as 'THRESHOLD' | 'PRODUCT',
          minAmount: Number(grant.coupon.minAmount),
          discount: Number(grant.coupon.discount),
          productIds: parseProductIds(grant.coupon.productIds),
        },
      })

      /*
       * 【券没用上不等于下单失败】券用不上就按 baseline 成交，
       * 券原样留在账户里**不锁定**，把原因随响应返回、前台提示一句。少赚一点也好过丢一单。
       *
       * 内推单走的就是这条路：quoteOrder 对内推单一律返回 applied='referral'，
       * 于是这里按专属价成交、券完好无损地留着，下次普通下单还能用。
       * 前台在内推场景下本来就不展示券，能走到这里的只有手工构造的请求。
       */
      if (quote.applied !== 'coupon') {
        amount = quote.baseline
        couponNote = quote.reject ? rejectReason(quote.reject) : '本单未使用优惠券'
      } else {
        // CAS 抢锁。orderId 先留空，建单成功后回填 —— 订单号这时还没有
        const locked = await prisma.couponGrant.updateMany({
          where: { id: grant.id, userId: user.id, state: 'AVAILABLE' },
          data: { state: 'LOCKED', lockedAt: new Date() },
        })
        if (locked.count !== 1) return error('该券正被另一笔待支付订单占用')

        couponGrantId = grant.id
        couponDiscount = quote.discount
        originalAmount = quote.baseline
        amount = quote.amount
      }
    }

    // 创建待支付订单（默认 payStatus: UNPAID, deliveryStatus: PENDING）
    let order
    try {
      order = await prisma.order.create({
        data: {
          orderNo: generateOrderNo(),
          userId: user.id,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          quantity,
          amount,
          remark,
          referrerId,
          // 券胜出时内推返现不再计入：站长定的是「不叠加，取更优的一个」
          referralReward:
            couponGrantId === null && referralReward && referralReward > 0 ? referralReward : null,
          couponGrantId,
          couponDiscount,
          originalAmount,
        },
      })
    } catch (e) {
      // 建单失败要把刚锁上的券放回去，否则买家的券会凭空变成「被占用」且永远不释放
      if (couponGrantId) {
        await prisma.couponGrant
          .updateMany({
            where: { id: couponGrantId, state: 'LOCKED', orderId: null },
            data: { state: 'AVAILABLE', lockedAt: null },
          })
          .catch(() => {})
      }
      throw e
    }

    // 回填订单关联：券锁定与建单不在同一个事务里（建单还要发通知、算内推），
    // 所以用「先锁后填」的两步。中间窗口内券是 LOCKED 且 orderId 为空，
    // 释放逻辑对这种状态是认的（见 releaseCouponForOrder）
    if (couponGrantId) {
      await prisma.couponGrant
        .updateMany({ where: { id: couponGrantId, state: 'LOCKED' }, data: { orderId: order.id } })
        .catch(() => {})
    }

    // 企业微信通知（fire-and-forget，不 await，通知挂了不能影响下单）
    notifyOrderCreated({
      orderNo: order.orderNo,
      buyer: user.nickname || user.email || `用户#${user.id}`,
      productName: product.name,
      quantity,
      amount,
      createdAt: order.createdAt,
      stock: product.stock,
    })

    // 销量在支付完成后再增加
    return success({ order, couponNote }, couponNote || '订单创建成功')
  } catch (err) {
    console.error('Create order error:', err)
    return error('创建订单失败')
  }
}
