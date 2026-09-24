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

// 订单「已付款且已完成」后结算内推返现：自动进推广人余额，幂等
export async function settleReferral(orderId: number): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return
  // 两个条件缺一不可：只看 DELIVERED 的话，被标成退款（REFUNDED）却仍显示已交付的订单
  // 也会给推广人入账 —— 钱没留下，返现却发出去了
  if (order.payStatus !== 'PAID' || order.deliveryStatus !== 'DELIVERED') return
  if (!order.referrerId || order.referrerId === order.userId) return
  const referrerId = order.referrerId
  const reward = order.referralReward ? Number(order.referralReward) : 0
  if (reward <= 0) return

  const existing = await prisma.referralReward.findUnique({ where: { orderId } })
  if (existing) return // 已结算

  try {
    /*
     * 【balanceAfter 必须在事务里、加完之后读】原来是事务外先读余额再加 reward 算出来的，
     * 同一个推广人两笔返现同时结算（或结算撞上后台调余额）时，两条流水会写出同一个
     * 「变动后余额」，余额本身靠 increment 是对的，流水却对不上。
     * 现在 update 行锁住该用户直到提交，读回来的就是本次加完之后的真实余额。
     *
     * 幂等仍靠 ReferralReward.orderId 唯一约束：并发的第二次在第一条 create 上 P2002，整个事务回滚。
     * note 的文本格式不能改 —— 历史行没有 orderId 列，lib/balance.ts 的 referralOrderIdOf 靠它回退解析。
     */
    await prisma.$transaction(async (tx) => {
      await tx.referralReward.create({
        data: {
          orderId,
          referrerId,
          buyerId: order.userId,
          productId: order.productId,
          amount: reward,
          status: 'SETTLED',
          settledAt: new Date(),
        },
      })
      const u = await tx.user.update({
        where: { id: referrerId },
        data: { balance: { increment: reward } },
        select: { balance: true },
      })
      await tx.balanceLog.create({
        data: {
          userId: referrerId,
          delta: reward,
          balanceAfter: u.balance,
          type: 'REFERRAL',
          note: `订单#${orderId} 内推返现`,
          orderId,
        },
      })
    })
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2002') return // 并发重复
    throw e
  }
}
