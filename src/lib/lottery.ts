/**
 * 下单有奖（抽奖）—— 纯函数部分。
 *
 * 与 lib/coupon.ts 同样的分法：这个文件**不碰数据库**，只回答「概率怎么算、抽中谁、
 * 这张订单现在能不能抽」，scripts/check-lottery.ts 直接断言。
 * 读写数据库、发券、事务都在 lib/lottery-server.ts。
 *
 * 设计与安全约束见 docs/下单有奖-抽奖设计.md。
 */
import { z } from 'zod'
import { couponLabel, type CouponRule } from './coupon'

/**
 * 概率的最小单位：万分之一（0.01%）。概率一律以整数「万分比」存储与运算。
 *
 * 【为什么不用浮点百分比】后台录入 12.5%、0.1%、0.3% 这类数字，用浮点相加会得到
 * 12.900000000000002，「合计不得超过 100%」这条校验就会在边界上误判；
 * 抽奖时拿随机数去比累计阈值也会有同样的边界问题。整数没有这些问题。
 */
export const RATE_SCALE = 10000 // 100% = 10000
/** 抽奖随机数的取值空间：[0, RATE_SCALE)，每个整数恰好对应 0.01% */
export const ROLL_SPACE = RATE_SCALE

export type PrizeType = 'COUPON' | 'CUSTOM'
export type EntryState = 'PENDING' | 'DRAWN' | 'VOID'

/**
 * 百分比文本 → 万分比整数。只接受最多两位小数、0 < x ≤ 100。
 *   '12.5' → 1250，'0.01' → 1，'100' → 10000
 *   '0' / '-1' / '100.01' / '1.234' / 'abc' → null
 *
 * 按字符串解析而不是 Math.round(parseFloat(x) * 100)：后者对 '1.005' 这类输入会因为
 * 二进制表示误差算成 100 而不是 101，用户写的是什么就该存什么。
 */
export function parseRateToBp(input: string | number): number | null {
  const s = String(input).trim()
  const m = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(s)
  if (!m) return null
  const whole = Number(m[1])
  const frac = Number((m[2] || '').padEnd(2, '0'))
  const bp = whole * 100 + frac
  if (bp <= 0 || bp > RATE_SCALE) return null
  return bp
}

/** 万分比 → 百分比文本（去掉多余的 0）：1250 → '12.5'，1 → '0.01'，10000 → '100' */
export function bpToPercentText(bp: number): string {
  const v = Math.max(0, Math.trunc(bp))
  const whole = Math.trunc(v / 100)
  const frac = v % 100
  if (frac === 0) return String(whole)
  return `${whole}.${String(frac).padStart(2, '0').replace(/0$/, '')}`
}

export interface RatedPrize {
  id: number
  rateBp: number
  enabled: boolean
  sortOrder?: number
}

/** 启用奖项的概率合计（万分比）。停用的奖项不计入 —— 它们不参与抽奖 */
export function sumEnabledBp(prizes: RatedPrize[]): number {
  let s = 0
  for (const p of prizes) if (p.enabled && p.rateBp > 0) s += Math.trunc(p.rateBp)
  return s
}

/**
 * 「改完之后合计会不会超过 100%」。editingId 为正在编辑的那一项（新增时传 null），
 * next 是它改完后的样子。停用的奖项不占概率。
 */
export function rateSumAfterEdit(
  prizes: RatedPrize[],
  editingId: number | null,
  next: { rateBp: number; enabled: boolean }
): number {
  const others = prizes.filter((p) => p.id !== editingId)
  return sumEnabledBp(others) + (next.enabled ? Math.trunc(next.rateBp) : 0)
}

/** 抽奖时奖项的遍历顺序：sortOrder 升序，同序按 id。与后台列表展示顺序一致 */
export function orderPrizes<T extends RatedPrize>(prizes: T[]): T[] {
  return prizes
    .filter((p) => p.enabled && p.rateBp > 0)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id)
}

/**
 * 用一个 [0, ROLL_SPACE) 的整数随机数决定抽中哪个奖项；落在所有奖项之外 = 未中奖（null）。
 *
 * 奖项按顺序在数轴上首尾相接各占 rateBp 个整数：
 *   奖项 A 12.5% → [0, 1250)，奖项 B 0.5% → [1250, 1300)，其余 [1300, 10000) 未中奖
 * 于是在全部 10000 个取值上，每个奖项被选中的次数**恰好**等于它的 rateBp ——
 * scripts/check-lottery.ts 就是这么穷举断言的，不靠统计抽样。
 *
 * 合计超过 100% 时（正常情况下后台校验会拦住，这里是兜底）：超出部分的奖项永远抽不到，
 * 不会越界、不会让「未中奖」变成负概率。
 */
export function pickPrize<T extends RatedPrize>(prizes: T[], roll: number): T | null {
  if (!Number.isInteger(roll) || roll < 0 || roll >= ROLL_SPACE) return null
  let acc = 0
  for (const p of orderPrizes(prizes)) {
    const next = acc + Math.trunc(p.rateBp)
    if (roll < next) return p
    acc = next
    if (acc >= ROLL_SPACE) break
  }
  return null
}

// ============ 活动配置 ============

export interface LotteryConfig {
  /** 活动开关。只影响「新订单有没有资格」，见 isEligibleAtCreation */
  enabled: boolean
  /** 参与门槛：订单货款（不含开票税费）达到这个金额才有资格。0 = 不限 */
  minOrderAmount: number
  /** 活动规则说明，抽奖弹窗里原样展示给买家 */
  rules: string
}

export const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  enabled: false,
  minOrderAmount: 0,
  rules: '',
}

export const lotteryConfigSchema = z.object({
  enabled: z.boolean(),
  minOrderAmount: z
    .number({ invalid_type_error: '参与门槛必须是数字' })
    .min(0, '参与门槛不能为负数')
    .max(100000, '参与门槛过大')
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, '参与门槛最多两位小数'),
  rules: z.string().trim().max(1000, '活动规则最多 1000 字'),
})

/** 与分同口径的比较，避免 99.99 >= 99.99 在浮点下判成 false */
function cents(n: number): number {
  return Math.round(n * 100)
}

/**
 * 建单那一刻这张订单有没有抽奖资格。
 * 这是资格的**唯一**判定点：结果以 LotteryEntry 行的形式和订单一起落库，
 * 之后活动开关怎么变都不影响已经下的单（活动关闭期间下的单永远没有资格）。
 */
export function isEligibleAtCreation(cfg: LotteryConfig, orderAmount: number): boolean {
  if (!cfg.enabled) return false
  if (!Number.isFinite(orderAmount) || orderAmount <= 0) return false
  return cents(orderAmount) >= cents(Math.max(0, cfg.minOrderAmount || 0))
}

/**
 * 这一刻能不能抽。订单与资格行都由调用方按「订单号 + 本人」查出来传进来。
 * 返回的 reason 直接给买家看，所以「不是你的订单」和「订单不存在」必须同一句话 ——
 * 否则可以拿这个接口去试探别人的订单号是否存在。
 */
export function canDraw(
  userId: number,
  order: { userId: number; payStatus: string; deliveryStatus: string } | null,
  entry: { userId: number; state: string } | null
): { ok: true } | { ok: false; reason: string; status: number } {
  if (!order || order.userId !== userId) return { ok: false, reason: '订单不存在', status: 404 }
  if (!entry || entry.userId !== userId) {
    return { ok: false, reason: '这笔订单不在「下单有奖」活动范围内（活动开启期间下的订单才有抽奖资格）', status: 400 }
  }
  if (entry.state === 'VOID') return { ok: false, reason: '这笔订单的抽奖资格已失效', status: 400 }
  if (order.payStatus !== 'PAID') return { ok: false, reason: '订单付款后才能抽奖', status: 400 }
  if (order.deliveryStatus === 'CANCELLED') return { ok: false, reason: '订单已取消，不能参与抽奖', status: 400 }
  // DRAWN 不算失败：由调用方直接返回上次的结果（重复点击、两个标签页同时点都是正常操作）
  return { ok: true }
}

// ============ 奖项 ============

/** 后台录入奖项的校验。金额口径与 api/admin/coupons 的建券校验一致 */
export const prizeInputSchema = z
  .object({
    name: z.string().trim().min(1, '请填写奖项名称').max(60, '奖项名称最多 60 字'),
    type: z.enum(['COUPON', 'CUSTOM'], { errorMap: () => ({ message: '奖项类型不正确' }) }),
    /** 百分比文本，如 '12.5'。服务端转成万分比 */
    rate: z.union([z.string(), z.number()]),
    couponKind: z.enum(['THRESHOLD', 'PRODUCT']).optional().nullable(),
    couponMinAmount: z.number().min(0, '门槛不能为负数').max(100000).optional().nullable(),
    couponDiscount: z.number().positive('券面额必须大于 0').max(100000).optional().nullable(),
    couponProductIds: z.string().trim().max(500).optional().nullable(),
    couponValidDays: z.number().int('有效天数必须是整数').min(1, '有效天数至少 1 天').max(3650).optional().nullable(),
    description: z.string().trim().max(500, '奖品说明最多 500 字').optional().nullable(),
    enabled: z.boolean().default(true),
    sortOrder: z.number().int().min(-9999).max(9999).default(0),
  })
  .superRefine((v, ctx) => {
    if (parseRateToBp(v.rate) == null) {
      ctx.addIssue({ code: 'custom', path: ['rate'], message: '中奖概率须在 0.01% ~ 100% 之间，最多两位小数' })
    }
    if (v.type === 'COUPON') {
      if (!v.couponKind) ctx.addIssue({ code: 'custom', path: ['couponKind'], message: '请选择券类型' })
      if (v.couponDiscount == null) ctx.addIssue({ code: 'custom', path: ['couponDiscount'], message: '请填写券面额' })
      // 面额 ≥ 门槛（如满 10 减 10）不拦：与后台建券（api/admin/coupons）同口径，
      // 实付最低由 lib/coupon.ts 的 MIN_PAYABLE 兜住，不会产出 0 元或负数订单
      if (v.couponKind === 'PRODUCT' && !parseIdsCsv(v.couponProductIds).length) {
        ctx.addIssue({ code: 'custom', path: ['couponProductIds'], message: '商品券必须指定至少一个商品' })
      }
    } else if (!v.description) {
      ctx.addIssue({ code: 'custom', path: ['description'], message: '自定义奖品请写明奖品内容与兑奖方式' })
    }
  })

export type PrizeInput = z.infer<typeof prizeInputSchema>

/** 与 lib/coupon.ts 的 parseProductIds 同口径（那边的函数签名接受 null，这里独立一份给 zod 用） */
function parseIdsCsv(raw: string | null | undefined): number[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 50)
}

/** 奖项上能拿来发券的那几列（数据库 Decimal 已由调用方转成 number） */
export interface PrizeCouponFields {
  couponKind: string | null
  couponMinAmount: number | null
  couponDiscount: number | null
  couponProductIds: string | null
}

/** 奖项 → 券规则。字段不全（后台数据被手工改坏）时返回 null，调用方按「未中奖」处理不发券 */
export function prizeCouponRule(p: PrizeCouponFields): CouponRule | null {
  const kind = p.couponKind === 'PRODUCT' ? 'PRODUCT' : p.couponKind === 'THRESHOLD' ? 'THRESHOLD' : null
  if (!kind) return null
  const discount = Number(p.couponDiscount)
  if (!Number.isFinite(discount) || discount <= 0) return null
  return {
    kind,
    minAmount: kind === 'THRESHOLD' ? Math.max(0, Number(p.couponMinAmount) || 0) : 0,
    discount,
    productIds: parseIdsCsv(p.couponProductIds),
  }
}

/** 奖项的一句话说明（后台列表、抽奖弹窗的奖池、中奖结果共用） */
export function prizeLabel(p: PrizeCouponFields & { type: string; name: string; couponValidDays?: number | null }): string {
  if (p.type !== 'COUPON') return p.name
  const rule = prizeCouponRule(p)
  if (!rule) return p.name
  const base = couponLabel({ kind: rule.kind, minAmount: rule.minAmount, discount: rule.discount })
  return p.couponValidDays ? `${base}（${p.couponValidDays} 天有效）` : base
}

/** 中奖券的到期时间：从中奖时刻起算 N 天；没设 = 长期有效 */
export function couponExpiresAt(now: Date, validDays: number | null | undefined): Date | null {
  if (!validDays || validDays <= 0) return null
  return new Date(now.getTime() + Math.trunc(validDays) * 86400_000)
}

/** 订单号格式：YYYYMMDD + 最多 8 位大写字母数字（lib/utils.ts 的 generateOrderNo） */
export const ORDER_NO_RE = /^[0-9A-Z]{8,32}$/

// ============ 买家侧展示 ============

/** 订单列表里每张订单附带的抽奖状态（没有资格的订单为 null，不下发任何字段） */
export interface BuyerLotteryView {
  state: EntryState
  won: boolean | null
  prizeName: string | null
  prizeType: PrizeType | null
  /** 券面额说明 / 自定义奖品说明 */
  prizeLabel: string | null
  description: string | null
  /** 中奖券的到期时间（ISO） */
  expiresAt: string | null
  /** 自定义奖品的兑现状态 */
  fulfillState: string | null
  drawnAt: string | null
  /**
   * 中奖券此刻的状态（AVAILABLE / LOCKED / USED / EXPIRED / VOID）。订单退款或取消后券会被作废，
   * 订单页的抽奖结果要据此改口，不能还说「已发放到我的优惠券」。只有订单列表批量查询时填；未知为 undefined
   */
  couponState?: string | null
}

/** 中奖快照（LotteryEntry.prizeDetail 的 JSON 形状） */
export interface PrizeSnapshot {
  label: string
  description: string | null
  coupon?: {
    kind: 'THRESHOLD' | 'PRODUCT'
    minAmount: number
    discount: number
    productIds: number[]
    validDays: number | null
    expiresAt: string | null
  }
}

export function parsePrizeSnapshot(raw: string | null | undefined): PrizeSnapshot | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw)
    if (!v || typeof v !== 'object' || typeof v.label !== 'string') return null
    return v as PrizeSnapshot
  } catch {
    return null
  }
}

export function buyerLotteryView(e: {
  state: string
  won: boolean | null
  prizeName: string | null
  prizeType: string | null
  prizeDetail: string | null
  fulfillState: string | null
  drawnAt: Date | null
}): BuyerLotteryView {
  const snap = parsePrizeSnapshot(e.prizeDetail)
  const drawn = e.state === 'DRAWN'
  return {
    state: (e.state === 'DRAWN' || e.state === 'VOID' ? e.state : 'PENDING') as EntryState,
    // 没抽之前不透露任何结果相关字段 —— 结果只在抽的那一刻产生，这里本来也没有
    won: drawn ? !!e.won : null,
    prizeName: drawn && e.won ? e.prizeName : null,
    prizeType: drawn && e.won ? ((e.prizeType as PrizeType) ?? null) : null,
    prizeLabel: drawn && e.won ? snap?.label ?? e.prizeName : null,
    description: drawn && e.won ? snap?.description ?? null : null,
    expiresAt: drawn && e.won ? snap?.coupon?.expiresAt ?? null : null,
    fulfillState: drawn && e.won ? e.fulfillState : null,
    drawnAt: e.drawnAt ? e.drawnAt.toISOString() : null,
  }
}
