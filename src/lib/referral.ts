import crypto from 'crypto'
import { prisma } from './db'

// 生成内推码（10 位 hex）
export function genReferralCode(): string {
  return crypto.randomBytes(5).toString('hex')
}

// 确保用户有内推码（没有则生成唯一码）
export async function ensureReferralCode(userId: number): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } })
  if (u?.referralCode) return u.referralCode
  for (let i = 0; i < 6; i++) {
    const code = genReferralCode()
    try {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } })
      return code
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002') continue // 撞码重试
      throw e
    }
  }
  throw new Error('生成内推码失败')
}

// 某推广人对某商品的「基础价(进货价)」：单独覆盖 → 商品默认推广价 → 网站售价
export async function effectiveBasePrice(userId: number, productId: number): Promise<number | null> {
  const override = await prisma.referrerBasePrice.findUnique({
    where: { userId_productId: { userId, productId } },
  })
  if (override) return Number(override.price)
  const p = await prisma.product.findUnique({
    where: { id: productId },
    select: { referrerBasePrice: true, price: true },
  })
  if (!p) return null
  return Number(p.referrerBasePrice ?? p.price)
}

// 订单「已完成」后结算内推返现：自动进推广人余额，幂等
export async function settleReferral(orderId: number): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return
  if (order.deliveryStatus !== 'DELIVERED') return
  if (!order.referrerId || order.referrerId === order.userId) return
  const reward = order.referralReward ? Number(order.referralReward) : 0
  if (reward <= 0) return

  const existing = await prisma.referralReward.findUnique({ where: { orderId } })
  if (existing) return // 已结算

  const referrer = await prisma.user.findUnique({ where: { id: order.referrerId }, select: { balance: true } })
  const balanceAfter = Math.round((Number(referrer?.balance ?? 0) + reward) * 100) / 100

  try {
    await prisma.$transaction([
      prisma.referralReward.create({
        data: {
          orderId,
          referrerId: order.referrerId,
          buyerId: order.userId,
          productId: order.productId,
          amount: reward,
          status: 'SETTLED',
          settledAt: new Date(),
        },
      }),
      prisma.user.update({ where: { id: order.referrerId }, data: { balance: { increment: reward } } }),
      prisma.balanceLog.create({
        data: { userId: order.referrerId, delta: reward, balanceAfter, type: 'REFERRAL', note: `订单#${orderId} 内推返现` },
      }),
    ])
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2002') return // 并发重复
    throw e
  }
}
