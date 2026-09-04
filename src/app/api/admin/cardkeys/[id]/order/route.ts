export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'

// 已发出卡密 → 追溯它的去向。
// 本站订单发的卡有 orderId；外部站点通过库存 API 领走的卡 orderId 恒为 null，
// 归属记在 externalRef（格式 <client>:<orderNo>），这两类必须分开查、分开展示。
// 注意：同目录 route.ts 用的是旧式 { params: { id: string } } 签名，这里必须保持一致，
// 同一路由段混用新旧两种写法 TS 会报错。
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    const card = await prisma.cardKey.findUnique({
      where: { id },
      select: {
        id: true,
        productId: true,
        status: true,
        orderId: true,
        externalRef: true,
        batch: true,
        remark: true,
        cost: true,
        soldPrice: true,
        profit: true,
        redeemUrl: true,
        usedAt: true,
        createdAt: true,
      },
    })
    if (!card) return notFound('卡密不存在')
    if (card.status !== 'USED') return error('该卡密尚未发出')

    const cardInfo = {
      id: card.id,
      batch: card.batch,
      remark: card.remark,
      cost: card.cost != null ? Number(card.cost) : null,
      soldPrice: card.soldPrice != null ? Number(card.soldPrice) : null,
      profit: card.profit != null ? Number(card.profit) : null,
      redeemUrl: card.redeemUrl,
      usedAt: card.usedAt,
      createdAt: card.createdAt,
    }

    // ① 本站订单
    if (card.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: card.orderId },
        select: {
          id: true,
          orderNo: true,
          productId: true,
          productName: true,
          productPrice: true,
          quantity: true,
          amount: true,
          payMethod: true,
          payStatus: true,
          deliveryStatus: true,
          remark: true,
          referrerId: true,
          referralReward: true,
          createdAt: true,
          paidAt: true,
          deliveredAt: true,
          product: {
            select: {
              name: true,
              categoryId: true,
              category: { select: { name: true } },
            },
          },
          user: { select: { id: true, email: true, nickname: true } },
          payments: {
            select: {
              id: true,
              tradeNo: true,
              payMethod: true,
              amount: true,
              status: true,
              createdAt: true,
            },
            orderBy: { id: 'desc' },
          },
        },
      })
      if (!order) return notFound('关联订单已不存在')

      const cardCount = await prisma.cardKey.count({ where: { orderId: order.id, status: 'USED' } })

      return success({
        kind: 'LOCAL' as const,
        card: cardInfo,
        order: {
          id: order.id,
          orderNo: order.orderNo,
          productId: order.productId,
          productName: order.productName,
          productPrice: Number(order.productPrice),
          categoryName: order.product?.category?.name ?? null,
          quantity: order.quantity,
          amount: Number(order.amount),
          payMethod: order.payMethod,
          payStatus: order.payStatus,
          deliveryStatus: order.deliveryStatus,
          remark: order.remark,
          referrerId: order.referrerId,
          referralReward: order.referralReward != null ? Number(order.referralReward) : null,
          createdAt: order.createdAt,
          paidAt: order.paidAt,
          deliveredAt: order.deliveredAt,
          cardCount, // 该订单一共发了几张卡（单卡售价 = 订单金额按张数分摊）
          user: order.user,
          payments: order.payments.map((p) => ({
            id: p.id,
            tradeNo: p.tradeNo,
            payMethod: p.payMethod,
            amount: Number(p.amount),
            status: p.status, // 0 待支付 | 1 成功 | 2 失败
            createdAt: p.createdAt,
          })),
        },
      })
    }

    // ② 外部站点领走：externalRef = <client>:<orderNo>，orderNo 里可能带冒号，只切第一个
    if (card.externalRef) {
      const sep = card.externalRef.indexOf(':')
      const client = sep > 0 ? card.externalRef.slice(0, sep) : card.externalRef
      const externalNo = sep > 0 ? card.externalRef.slice(sep + 1) : ''

      const dispense = externalNo
        ? await prisma.externalDispense.findUnique({
            where: { client_externalNo: { client, externalNo } },
          })
        : null

      const product = await prisma.product.findUnique({
        where: { id: card.productId },
        select: { name: true, apiSku: true },
      })

      return success({
        kind: 'EXTERNAL' as const,
        card: cardInfo,
        dispense: {
          client,
          externalNo,
          found: !!dispense,
          id: dispense?.id ?? null,
          productId: card.productId,
          productName: product?.name ?? null,
          apiSku: dispense?.apiSku ?? product?.apiSku ?? null,
          quantity: dispense?.quantity ?? null,
          delivered: dispense?.delivered ?? null,
          status: dispense?.status ?? null,
          createdAt: dispense?.createdAt ?? null,
          updatedAt: dispense?.updatedAt ?? null,
        },
        // 外部站按库存 API 领卡，本站拿不到对方的成交价，因此没有售价与利润
        note: '外部站发卡，本站无售价与利润',
      })
    }

    return error('该卡密已发出，但没有可追溯的订单归属（既无本站订单也无外部单号）')
  } catch (err) {
    console.error('Cardkey order detail error:', err)
    return error('查询失败')
  }
}
