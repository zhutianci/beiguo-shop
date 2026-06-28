export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { generateOrderNo } from '@/lib/utils'
import { decryptCardContent } from '@/lib/cardkey'
import { effectiveBasePrice } from '@/lib/referral'
import { calcInvoiceAmounts } from '@/lib/invoice'
import { shopOrderSourceKey } from '@/lib/order-billing'

const createOrderSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1).default(1),
  remark: z.string().optional(),
  ref: z.string().trim().optional().nullable(), // 内推码
})

// 获取用户订单列表
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
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
    })

    // 自动发货：把已发给本人订单的卡密解密返回（仅本人、已支付订单可见）
    const paidIds = orders.filter((o) => o.payStatus === 'PAID').map((o) => o.id)
    const cardMap = new Map<number, string[]>()
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
        arr.push(plain)
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
    const invByOrderId = new Map<number, { id: number; status: string }>()
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
            select: { id: true, externalOrderId: true, status: true },
          }),
          prisma.receipt.findMany({
            where: { externalOrderId: { in: extIds } },
            select: { externalOrderId: true, token: true },
          }),
        ])
        for (const iv of invs) {
          const oid = iv.externalOrderId != null ? extIdToOrderId.get(iv.externalOrderId) : undefined
          if (oid) invByOrderId.set(oid, { id: iv.id, status: iv.status })
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
      return {
        ...o,
        cards: cardMap.get(o.id) || [],
        unreadCount: unreadMap.get(o.id) || 0,
        // 票据信息（仅已支付订单可申请）
        billing: paid
          ? {
              canInvoice: price > 0,
              canReceipt: price > 0,
              sellingPrice: price,
              invoiceAmount: amt!.invoiceAmount,
              taxFee: amt!.taxFee,
              invoiceStatus: inv ? inv.status : 'UNAPPLIED',
              invoiceId: inv?.id ?? null,
              receiptToken: receiptByOrderId.get(o.id) ?? null,
            }
          : null,
      }
    })
    return success(withCards)
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

    const amount = Math.round(unitPrice * quantity * 100) / 100

    // 创建待支付订单（默认 payStatus: UNPAID, deliveryStatus: PENDING）
    const order = await prisma.order.create({
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
        referralReward: referralReward && referralReward > 0 ? referralReward : null,
      },
    })

    // 销量在支付完成后再增加
    return success({ order }, '订单创建成功')
  } catch (err) {
    console.error('Create order error:', err)
    return error('创建订单失败')
  }
}
