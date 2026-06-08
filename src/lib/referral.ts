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
    ])
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2002') return // 并发重复
    throw e
  }
}
