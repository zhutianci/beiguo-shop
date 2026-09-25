/**
 * 邮件直发券：一个活动一个批次（coupons.source='CAMPAIGN'），发信前逐人发券（幂等）。
 * 规则见设计文档第 9 节。券名用区块里买家可见的 title，绝不用活动名。
 *
 * 【实现方：发送引擎】签名是契约。
 *
 * 【为什么一个活动一个批次，而不是复用抽奖那种单张批次】CouponGrant 有 @@unique([couponId, userId])，
 * 正好就是「每个收件人最多一张」的数据库级保证：worker 重试、进程被杀后重跑，撞唯一约束就取已有那张，
 * 不会发出第二张。批次 total/claimed 从 0 起随发券 +1（后台券页显示「已发 N / 已用 M」）。
 *
 * 【有效期按收券那一刻算】预热/定时/试探会让同一场活动跨好几天发完，按 launch 算有效期的话，
 * 最后几天收到信的人拿到的是一张快过期甚至已过期的券（审查修订记录）。所以：
 *   days  模式：每张券 expiresAt = 发券时刻 + N 天，批次 endAt=null
 *   until 模式：批次 endAt = 该北京日 23:59:59，每张券 expiresAt = endAt；剩余不足 48 小时就暂停活动
 */
import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { mergeTagRe } from './lint'
import { bjDateToEnd } from './time'
import { emailDocSchema, clip, type BlockOf, type CouponGrantSpec } from './types'

/** until 模式剩余有效期不足这么久就不再发（收信的人来不及用） */
export const MIN_UNTIL_REMAINING_MS = 48 * 3600_000

function cents(n: number): number {
  return Math.round(n * 100)
}

/** 直发券参数是否合法（面额 >0；满减门槛为 0 或 ≥ 面额+0.01；商品券需选商品）。返回中文原因，合法返回 null */
export function grantSpecProblem(g: CouponGrantSpec | undefined | null): string | null {
  if (!g) return '直发券缺少面额等参数'
  if (!Number.isFinite(g.discount) || cents(g.discount) <= 0) return '券面额必须大于 0'
  if (g.kind === 'THRESHOLD') {
    const min = cents(g.minAmount || 0)
    if (min !== 0 && min < cents(g.discount) + 1) return '满减门槛必须为 0（无门槛）或不低于面额 + 0.01 元'
  } else if (g.kind === 'PRODUCT') {
    if (!g.productIds?.length) return '商品券需要选择适用商品'
  } else {
    return '券类型不正确'
  }
  if (g.validity.mode === 'until') {
    const end = bjDateToEnd(g.validity.date)
    if (Number.isNaN(end.getTime())) return '券截止日期不正确'
  }
  return null
}

/**
 * 批次名（买家「我的优惠券」与下单选券处看到的券名）。券名是所有收件人共用的一行字，不能个性化：
 * 标题里的变量（{{nickname|朋友}} 之类）整段去掉，否则买家会看到一串原样的花括号（审查 C8；lint 另会拦）
 */
export function couponBatchName(title: string | null | undefined): string {
  return (title || '').replace(mergeTagRe(), '').replace(/\s+/g, ' ').trim().slice(0, 80) || '邮件专享券'
}

/** 在 launch 事务里建批次，返回 coupon id */
export async function createCampaignCouponBatch(
  tx: Prisma.TransactionClient,
  campaignId: number,
  block: BlockOf<'coupon'>,
  scheduledAt: Date
): Promise<number> {
  const g = block.grant
  const problem = grantSpecProblem(g)
  if (problem || !g) throw new Error(problem || '直发券参数缺失')
  const now = new Date()
  const startAt = new Date(Math.max(now.getTime(), scheduledAt.getTime()))
  // until：该日 23:59:59（北京）；days：批次不设截止，每张券自己的 expiresAt 管有效期
  const endAt = g.validity.mode === 'until' ? bjDateToEnd(g.validity.date) : null
  if (endAt && endAt.getTime() <= startAt.getTime()) throw new Error('券截止日期早于开始发送时间')

  const coupon = await tx.coupon.create({
    data: {
      // 不可枚举（16 位随机十六进制）；source 非空的批次在领取接口与 /coupon/<code> 一律拒绝
      code: `mk-${crypto.randomBytes(8).toString('hex')}`,
      // 买家在「我的优惠券」里看到的名字：只用区块 title，绝不用活动名（活动名只给后台看）
      name: couponBatchName(block.title),
      kind: g.kind,
      minAmount: new Prisma.Decimal((g.kind === 'THRESHOLD' ? g.minAmount || 0 : 0).toFixed(2)),
      discount: new Prisma.Decimal(g.discount.toFixed(2)),
      productIds: g.kind === 'PRODUCT' && g.productIds.length ? g.productIds.slice(0, 50).join(',') : null,
      total: 0,
      claimed: 0,
      startAt,
      endAt,
      status: 'ACTIVE',
      source: 'CAMPAIGN',
      note: `营销活动 #${campaignId}`,
    },
    select: { id: true },
  })
  return coupon.id
}

export type GrantResult =
  | { ok: true; grantId: number; expiresAt: Date | null }
  | { ok: false; reason: 'BATCH_NOT_ACTIVE' | 'VALIDITY_TOO_SHORT' | 'NO_USER' | 'ERROR'; note: string }

/**
 * days 模式的天数不在券批次上（批次 endAt=null），而在活动冻结的文档里。
 * launch 之后文档不可再改（只有 DRAFT 能保存；撤回定时会删掉 0 张的批次、重新 launch 建新批次），
 * 所以按批次 id 缓存是安全的。
 */
const validityCache = new Map<number, CouponGrantSpec['validity']>()

async function grantValidityOf(couponId: number): Promise<CouponGrantSpec['validity'] | null> {
  const hit = validityCache.get(couponId)
  if (hit) return hit
  const c = await prisma.marketingCampaign.findFirst({ where: { couponId }, select: { doc: true } })
  if (!c) return null
  try {
    const doc = emailDocSchema.parse(JSON.parse(c.doc))
    const block = doc.blocks.find((b): b is BlockOf<'coupon'> => b.type === 'coupon' && b.mode === 'grant' && !!b.grant)
    if (!block?.grant) return null
    if (validityCache.size > 500) validityCache.clear()
    validityCache.set(couponId, block.grant.validity)
    return block.grant.validity
  } catch {
    return null
  }
}

/** 事务内「批次已不是 ACTIVE」的信号 */
class BatchInactiveSignal extends Error {}

/**
 * 给某个收件人发券（幂等：@@unique([couponId,userId]) 撞了就取已有那张）。
 * 先重读批次：非 ACTIVE → BATCH_NOT_ACTIVE；until 模式剩余 < 48h → VALIDITY_TOO_SHORT（调用方据此暂停活动）。
 */
export async function grantCampaignCoupon(couponId: number, userId: number, now: Date): Promise<GrantResult> {
  try {
    // 已经发过（上一趟发完券、信没发出去就被杀了）：直接复用，券的有效期保持第一次发时的值
    const existing = await prisma.couponGrant.findUnique({
      where: { couponId_userId: { couponId, userId } },
      select: { id: true, expiresAt: true },
    })
    if (existing) return { ok: true, grantId: existing.id, expiresAt: existing.expiresAt }

    const batch = await prisma.coupon.findUnique({
      where: { id: couponId },
      select: { id: true, status: true, source: true, endAt: true },
    })
    if (!batch || batch.source !== 'CAMPAIGN') return { ok: false, reason: 'BATCH_NOT_ACTIVE', note: '直发券批次不存在' }
    if (batch.status !== 'ACTIVE') {
      return { ok: false, reason: 'BATCH_NOT_ACTIVE', note: `直发券批次已${batch.status === 'ENDED' ? '结束' : '停止发放'}` }
    }

    let expiresAt: Date | null
    if (batch.endAt) {
      // until 模式
      if (batch.endAt.getTime() - now.getTime() < MIN_UNTIL_REMAINING_MS) {
        return { ok: false, reason: 'VALIDITY_TOO_SHORT', note: '券剩余有效期不足 48 小时' }
      }
      expiresAt = batch.endAt
    } else {
      const v = await grantValidityOf(couponId)
      if (!v) return { ok: false, reason: 'ERROR', note: '无法确定券有效期（活动文档缺少直发券区块）' }
      if (v.mode === 'days') {
        expiresAt = new Date(now.getTime() + v.days * 86400_000)
      } else {
        // 批次没写 endAt 却是 until 模式（不应出现）：按文档里的日期补算
        expiresAt = bjDateToEnd(v.date)
        if (expiresAt.getTime() - now.getTime() < MIN_UNTIL_REMAINING_MS) {
          return { ok: false, reason: 'VALIDITY_TOO_SHORT', note: '券剩余有效期不足 48 小时' }
        }
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) return { ok: false, reason: 'NO_USER', note: '用户不存在' }

    try {
      const grant = await prisma.$transaction(async (tx) => {
        // 条件自增兼作 CAS：批次在这一刻被管理员结束/停发 → 不发
        const bump = await tx.coupon.updateMany({
          where: { id: couponId, status: 'ACTIVE' },
          data: { total: { increment: 1 }, claimed: { increment: 1 } },
        })
        if (bump.count !== 1) throw new BatchInactiveSignal()
        return tx.couponGrant.create({
          data: { couponId, userId, state: 'AVAILABLE', expiresAt },
          select: { id: true, expiresAt: true },
        })
      })
      return { ok: true, grantId: grant.id, expiresAt: grant.expiresAt }
    } catch (e) {
      if (e instanceof BatchInactiveSignal) return { ok: false, reason: 'BATCH_NOT_ACTIVE', note: '直发券批次已停止发放' }
      if ((e as { code?: string })?.code === 'P2002') {
        // 并发的另一次已经发了（整个事务回滚，计数没有多加）：取那张
        const g = await prisma.couponGrant.findUnique({
          where: { couponId_userId: { couponId, userId } },
          select: { id: true, expiresAt: true },
        })
        if (g) return { ok: true, grantId: g.id, expiresAt: g.expiresAt }
      }
      throw e
    }
  } catch (err) {
    return { ok: false, reason: 'ERROR', note: clip(`发券失败：${(err as Error)?.message || err}`, 300) || '发券失败' }
  }
}

/** 发送前检查弹窗里的「最多发出 N 张 · 最高让利 ¥X」 */
export function couponExposure(block: BlockOf<'coupon'>, recipients: number): { maxCount: number; maxGiveaway: string } | null {
  if (block.mode !== 'grant' || !block.grant) return null
  const n = Number.isFinite(recipients) ? Math.max(0, Math.floor(recipients)) : 0
  const total = cents(block.grant.discount) * n
  return { maxCount: n, maxGiveaway: (total / 100).toFixed(2) }
}

/** 活动取消/撤回定时时处理 0 张的批次：删除（撤回）或置 ENDED（取消） */
export async function retireEmptyBatch(couponId: number, mode: 'delete' | 'end'): Promise<void> {
  // 只动营销批次、只动一张都没发出去的批次：已发出去的券是买家的，结束批次会让它们一并失效
  const grants = await prisma.couponGrant.count({ where: { couponId } })
  if (grants > 0) return
  if (mode === 'delete') {
    await prisma.coupon.deleteMany({ where: { id: couponId, source: 'CAMPAIGN', claimed: 0 } })
  } else {
    await prisma.coupon.updateMany({ where: { id: couponId, source: 'CAMPAIGN', claimed: 0 }, data: { status: 'ENDED' } })
  }
}
