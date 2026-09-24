/**
 * 会员等级 —— 数据库部分：档位配置（Setting 表 key = vip_tiers）与用户累计消费。
 * 纯计算在 lib/vip.ts。
 */
import { prisma } from './db'
import { DEFAULT_VIP_TIERS, normalizeTiers, vipStatusOf, type VipStatus, type VipTier } from './vip'

const CONFIG_KEY = 'vip_tiers'

export async function getVipTiers(): Promise<VipTier[]> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: CONFIG_KEY } })
    if (!row?.value) return normalizeTiers(DEFAULT_VIP_TIERS)
    return normalizeTiers(JSON.parse(row.value))
  } catch (err) {
    console.error('[vip] 读取会员等级配置失败，回落默认值:', err)
    return normalizeTiers(DEFAULT_VIP_TIERS)
  }
}

export async function saveVipTiers(tiers: VipTier[]): Promise<VipTier[]> {
  const clean = normalizeTiers(tiers)
  const value = JSON.stringify(clean.map(({ name, minSpend, benefits }) => ({ name, minSpend, benefits })))
  await prisma.setting.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value },
    update: { value },
  })
  return clean
}

/**
 * 累计消费 = 已付款订单的 Order.amount 之和（不含开票税费、不含已退款）。
 * 已付款但被后台取消的订单（PAID + CANCELLED，通常是线下退款）不计入。
 */
export async function userPaidSpend(userId: number): Promise<{ spent: number; paidCount: number }> {
  const agg = await prisma.order.aggregate({
    where: { userId, payStatus: 'PAID', deliveryStatus: { not: 'CANCELLED' } },
    _sum: { amount: true },
    _count: { _all: true },
  })
  return { spent: Math.round(Number(agg._sum.amount ?? 0) * 100) / 100, paidCount: agg._count._all }
}

export async function userVipStatus(userId: number, adminLevel: number): Promise<VipStatus & { tiers: VipTier[] }> {
  const [tiers, { spent }] = await Promise.all([getVipTiers(), userPaidSpend(userId)])
  return { ...vipStatusOf(tiers, spent, adminLevel), tiers }
}
