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
  // 渠道单没有内推（渠道站营销全关，设计 7.6、8.3）：即使 referrerId 被写进去也绝不返现
  if (order.tenantId !== 1) return
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

/** 批量版 effectiveBasePrice（商品列表用）：单独覆盖 → 商品默认推广价 → 网站售价 */
export async function effectiveBasePrices(userId: number, productIds: number[]): Promise<Map<number, number>> {
  const m = new Map<number, number>()
  if (productIds.length === 0) return m
  const [overrides, products] = await Promise.all([
    prisma.referrerBasePrice.findMany({
      where: { userId, productId: { in: productIds } },
      select: { productId: true, price: true },
    }),
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, referrerBasePrice: true },
    }),
  ])
  const ov = new Map(overrides.map((o) => [o.productId, Number(o.price)]))
  for (const p of products) m.set(p.id, ov.has(p.id) ? (ov.get(p.id) as number) : Number(p.referrerBasePrice ?? p.price))
  return m
}

/**
 * 内推单的成交单价，全站唯一口径：商品列表 / 详情、结算页、建单都走它，显示价和实收价才对得上。
 *  - 推广人没设专属价 → 网站售价（与原逻辑一致）
 *  - 专属价低于该推广人「当前」基础价 → 抬到基础价成交，返现为 0
 *
 * 【为什么要在读取时兜底】专属价只在推广人保存时校验 ≥ 基础价。之后站长因进货涨价，
 * 上调了售价 / 默认推广价 / 单独基础价，旧专属价不会跟着涨，照样按旧低价成交 ——
 * 线上毛利本来就薄（售价 135 对基础价 132），基础价一涨，每一单都在亏。
 * 不在后台改价时删推广人的专属价：那会删别人的数据，而且要改三个后台接口；读时兜底已经封住了。
 * 按分比较，避免 Decimal → number 的浮点噪声误判。
 */
export function referralSellUnit(rpPrice: number | null, effBase: number, listPrice: number): number {
  if (rpPrice == null) return listPrice
  return Math.round(rpPrice * 100) < Math.round(effBase * 100) ? effBase : rpPrice
}
