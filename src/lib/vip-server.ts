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
 *
 * 【只算一个站】tenantId 默认 1（主站）：会员等级只看主站消费——渠道消费不计入主站 VIP（Q19 推荐值，
 * 确认前按「不计入」实现，设计 7.6）。休眠期全部订单 tenantId=1，主站等级与改造前逐分相同。
 * 渠道站个人中心的「累计消费」传渠道 id，只统计本站订单（买家侧数据按交易发生站隔离，设计 5.5）。
 */
export async function userPaidSpend(userId: number, tenantId = 1): Promise<{ spent: number; paidCount: number }> {
  const agg = await prisma.order.aggregate({
    where: { userId, tenantId, payStatus: 'PAID', deliveryStatus: { not: 'CANCELLED' } },
    _sum: { amount: true },
    _count: { _all: true },
  })
  return { spent: Math.round(Number(agg._sum.amount ?? 0) * 100) / 100, paidCount: agg._count._all }
}

export async function userVipStatus(userId: number, adminLevel: number): Promise<VipStatus & { tiers: VipTier[] }> {
  const [tiers, { spent }] = await Promise.all([getVipTiers(), userPaidSpend(userId)])
  return { ...vipStatusOf(tiers, spent, adminLevel), tiers }
}

// ============================== 个人中心概览（/api/account/overview） ==============================

/** 主站形状：与改造前 /api/account/overview 的响应逐字段相同 */
export interface PlatformOverviewDTO {
  balance: number
  vip: { level: number; name: string; nextName: string | null; remaining: number; progress: number }
  stats: { paidOrderCount: number; totalSpent: number; availableCoupons: number }
}

/**
 * 渠道站形状（WP1 的个人中心按它渲染）：**不含** balance / vip / availableCoupons / referral——
 * 渠道站余额、会员、券、内推全关（设计 7.6、8.1），字段本身就不下发，而不是下发 0 让前端去藏。
 * 数字只统计本站订单。
 */
export interface ChannelOverviewDTO {
  stats: { paidOrderCount: number; totalSpent: number }
}

export type OverviewDTO = PlatformOverviewDTO | ChannelOverviewDTO

/** 前端判别用：有 vip 字段的是主站形状 */
export function isPlatformOverview(o: OverviewDTO): o is PlatformOverviewDTO {
  return 'vip' in o
}

/**
 * 组装概览。口径（主站，与改造前相同）：
 *   · paidOrderCount / totalSpent 与会员等级用的是**同一次** userPaidSpend，页面上两处数字必须对得上；
 *   · 不直接调 userVipStatus（它内部也会跑一遍 userPaidSpend），拆开用 getVipTiers + vipStatusOf 少一次聚合，结果相同；
 *   · availableCoupons 与「我的优惠券」页「可用 N 张」同口径：AVAILABLE、未到期、所属批次没被作废。
 */
export async function buildAccountOverview(
  user: { id: number; balance?: unknown; vipLevel: number },
  sf: { id: number; kind: 'PLATFORM' | 'CHANNEL' },
): Promise<OverviewDTO> {
  if (sf.kind === 'CHANNEL') {
    const paid = await userPaidSpend(user.id, sf.id)
    return { stats: { paidOrderCount: paid.paidCount, totalSpent: paid.spent } }
  }
  const now = new Date()
  const [tiers, paid, availableCoupons] = await Promise.all([
    getVipTiers(),
    userPaidSpend(user.id),
    prisma.couponGrant.count({
      where: {
        userId: user.id,
        state: 'AVAILABLE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        coupon: { status: { not: 'ENDED' } },
      },
    }),
  ])
  const vip = vipStatusOf(tiers, paid.spent, user.vipLevel)
  return {
    balance: Math.round(Number(user.balance ?? 0) * 100) / 100,
    vip: {
      level: vip.current.level,
      name: vip.current.name,
      nextName: vip.next ? vip.next.name : null,
      remaining: vip.remaining,
      progress: vip.progress,
    },
    stats: { paidOrderCount: paid.paidCount, totalSpent: paid.spent, availableCoupons },
  }
}
