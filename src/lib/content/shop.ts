/**
 * 积分兑换优惠券（内容平台 P3，设计 §8.3「积分兑换优惠券，复用现有优惠券模块」）。
 *
 * 一次兑换 = 一个单张批次（coupons.source='POINTS'，total=1）+ 一张发给本人的券，与「下单有奖」中奖发券同一种做法：
 *   · CouponGrant 有 (couponId, userId) 唯一约束，共用批次时同一个人兑换第二次会撞约束，所以一次一批；
 *   · source 非空的批次，公开领取接口与 /coupon/<code> 页一律拒绝（code 是 16 位随机串，也猜不到）。
 *
 * 【扣积分】creator_profiles.spent 加上 cost，条件是 points − spent ≥ cost：一条带条件的 UPDATE，
 * 并发的两次兑换不会把可用积分扣成负数。points（累计获得）不动 —— 等级只看 points，兑换不掉级（设计 §8.1）。
 * 【次数】每人每个自然月（上海时间）最多 MONTHLY_LIMIT 次；同一事务里先扣分（拿行锁）再数，并发也不会多出
 * （2026-10-07 起；以前先数再写，并发下能超）。接口层另有限流。
 */
import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db'

export const SHOP_SETTING_KEY = 'content.pointShop'
export const MONTHLY_LIMIT = 3

export const optionSchema = z.object({
  key: z.string().regex(/^[a-z0-9]{2,16}$/),
  label: z.string().min(2).max(40),
  cost: z.number().int().min(10).max(100000),
  discount: z.number().min(1).max(500),
  minAmount: z.number().min(0).max(10000),
  days: z.number().int().min(1).max(365),
  enabled: z.boolean(),
})
export type RedeemOption = z.infer<typeof optionSchema>
export const optionsSchema = z.array(optionSchema).max(8)

/** 默认档位：3 篇精选（150 分）≈ 3 元无门槛。站长可在后台「论坛与内容 → 积分兑换」改 */
export const DEFAULT_OPTIONS: RedeemOption[] = [
  { key: 'c3', label: '无门槛 3 元券', cost: 150, discount: 3, minAmount: 0, days: 30, enabled: true },
  { key: 'c10', label: '满 50 减 10 元券', cost: 400, discount: 10, minAmount: 50, days: 30, enabled: true },
  { key: 'c30', label: '满 150 减 30 元券', cost: 1000, discount: 30, minAmount: 150, days: 60, enabled: true },
]

export async function shopOptions(): Promise<RedeemOption[]> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: SHOP_SETTING_KEY } })
    if (!row?.value) return DEFAULT_OPTIONS
    const parsed = optionsSchema.safeParse(JSON.parse(row.value))
    return parsed.success ? parsed.data : DEFAULT_OPTIONS
  } catch {
    return DEFAULT_OPTIONS
  }
}

export async function saveShopOptions(options: RedeemOption[]): Promise<void> {
  const keys = new Set(options.map((o) => o.key))
  if (keys.size !== options.length) throw new ShopError('档位编号不能重复')
  for (const o of options) if (o.minAmount > 0 && o.minAmount <= o.discount) throw new ShopError(`「${o.label}」的门槛要高于面额`)
  const value = JSON.stringify(options)
  await prisma.setting.upsert({ where: { key: SHOP_SETTING_KEY }, create: { key: SHOP_SETTING_KEY, value }, update: { value } })
}

export class ShopError extends Error {}

/** 本月第一天 0 点（上海时间） */
export function monthStart(now = new Date()): Date {
  const sh = new Date(now.getTime() + 8 * 3600_000)
  return new Date(Date.UTC(sh.getUTCFullYear(), sh.getUTCMonth(), 1) - 8 * 3600_000)
}

export async function walletOf(userId: number): Promise<{ points: number; spent: number; available: number; usedThisMonth: number }> {
  const [pf, used] = await Promise.all([
    prisma.creatorProfile.findUnique({ where: { userId }, select: { points: true, spent: true } }),
    prisma.pointRedemption.count({ where: { userId, createdAt: { gte: monthStart() } } }),
  ])
  const points = pf?.points ?? 0
  const spent = pf?.spent ?? 0
  return { points, spent, available: Math.max(0, points - spent), usedThisMonth: used }
}

export async function redeem(userId: number, key: string): Promise<{ couponName: string; expiresAt: Date }> {
  const opt = (await shopOptions()).find((o) => o.key === key && o.enabled)
  if (!opt) throw new ShopError('这个兑换档位不存在或已下架')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + opt.days * 86_400_000)
  const name = `积分兑换·${opt.label}`.slice(0, 80)

  await prisma.$transaction(async (tx) => {
    // 先扣积分（拿到 creator_profiles 这一行的行锁）再数本月次数（2026-10-07）：以前先数后扣，并发请求在 REPEATABLE READ 下
    // 都在拿锁之前读到「还没满」，能超过每月上限。现在同一用户的兑换在行锁上排队，后一个事务的第一次一致性读发生在
    // 前一个提交之后，数得到它刚插的记录；超限就抛错，整个事务（含扣分）回滚
    const n = await tx.$executeRaw`UPDATE creator_profiles SET spent = spent + ${opt.cost} WHERE user_id = ${userId} AND points - spent >= ${opt.cost}`
    if (n !== 1) throw new ShopError('可用积分不够')
    const used = await tx.pointRedemption.count({ where: { userId, createdAt: { gte: monthStart(now) } } })
    if (used >= MONTHLY_LIMIT) throw new ShopError(`每月最多兑换 ${MONTHLY_LIMIT} 次，下个月再来`)
    const coupon = await tx.coupon.create({
      data: {
        code: `pt-${crypto.randomBytes(8).toString('hex')}`,
        name,
        kind: 'THRESHOLD',
        minAmount: new Prisma.Decimal(opt.minAmount.toFixed(2)),
        discount: new Prisma.Decimal(opt.discount.toFixed(2)),
        productIds: null,
        total: 1,
        claimed: 1,
        startAt: now,
        endAt: expiresAt,
        status: 'ACTIVE',
        source: 'POINTS',
        note: `积分兑换 · 用户#${userId} · ${opt.cost} 积分`,
      },
      select: { id: true },
    })
    await tx.couponGrant.create({ data: { couponId: coupon.id, userId, state: 'AVAILABLE', expiresAt } })
    await tx.pointRedemption.create({ data: { userId, optionKey: opt.key, cost: opt.cost, couponId: coupon.id } })
  })
  return { couponName: name, expiresAt }
}
