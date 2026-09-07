import crypto from 'crypto'
import { prisma } from '@/lib/db'

/**
 * 优惠券。
 *
 * 文件分两半，边界是明确的：
 *  · 上半部分是**纯函数**（算钱、判状态、拼文案），不碰数据库，
 *    所以 scripts/check-coupon.ts 可以直接断言 —— 这是全站唯一一处
 *    「买家付多少」由代码决定的地方，算错一分钱就是真实的资金差错
 *  · 下半部分是券的**状态流转**，是状态机的唯一入口。散在各处直接改 state
 *    迟早会漏掉一条路径，表现就是买家的券卡在 LOCKED 再也用不了
 */

/** 券类型 */
export type CouponKind = 'THRESHOLD' | 'PRODUCT'

/** 券实例状态。迁移规则见 canUse / 下方注释 */
export type GrantState = 'AVAILABLE' | 'LOCKED' | 'USED' | 'EXPIRED' | 'VOID'

/**
 * 最低实付金额。
 *
 * 【为什么必须留一个正数下限，不能让优惠后为 0】
 * 站内收款是 V免签式的「按唯一金额匹配到账」（见 lib/vmq.ts 的 allocateAmount）：
 * 系统给每张待支付订单分配一个不重复的金额，靠收到的钱数反查是哪一单。
 * 金额为 0 就没有「到账」这件事，订单会永远停在待支付；
 * 而金额过小（几分钱）在多单并发时会和别的订单挤在同一个分位上，
 * allocateAmount 要循环加分才能错开，体验和对账都变差。
 *
 * 取 0.01 元只是「数学下限」，实际建议在后台把券面额设得低于商品价。
 * 这里的作用是兜底：无论券怎么配，都不会产出一张付不了款的订单。
 */
export const MIN_PAYABLE = 0.01

/** 分为单位取整，避免浮点累积误差（与 lib/vmq.ts 的 centsOf 同口径） */
function cents(n: number): number {
  return Math.round(n * 100)
}
function yuan(c: number): number {
  return Math.round(c) / 100
}

export interface CouponRule {
  kind: CouponKind
  /** 满减门槛。0 = 无门槛 */
  minAmount: number
  /** 满减额 / 商品券面额 */
  discount: number
  /** 商品券限定的商品 id；空数组 = 不限商品 */
  productIds: number[]
}

export interface OrderContext {
  productId: number
  /** 未用券、未走内推时的原价合计 */
  baseAmount: number
  /** 走了内推专属价之后的合计。没有内推时与 baseAmount 相同 */
  referralAmount: number
}

export type CouponReject =
  | 'KIND_PRODUCT_MISMATCH'
  | 'BELOW_THRESHOLD'
  | 'NO_DISCOUNT'

export interface CouponCalc {
  /** 能不能用 */
  usable: boolean
  reject?: CouponReject
  /** 用券后的实付金额 */
  amount: number
  /** 实际减免额（可能因为触底而小于券面额） */
  discount: number
  /** 最终采用的是券还是内推。不叠加，取对买家更优的一个 */
  applied: 'coupon' | 'referral' | 'none'
}

export function rejectReason(r: CouponReject): string {
  switch (r) {
    case 'KIND_PRODUCT_MISMATCH':
      return '该券只能用于指定商品'
    case 'BELOW_THRESHOLD':
      return '订单金额未达到该券的使用门槛'
    case 'NO_DISCOUNT':
      return '该券在这一单上抵扣不了金额'
  }
}

/**
 * 算一单用券后要付多少。
 *
 * 【与内推不叠加，取更优的一个】这是站长拍板的规则。两者量纲不同：
 * 内推是「改单价」，券是「减总额」，不能简单相加。做法是各自算出最终应付金额，
 * 取更低的那个 —— 对买家而言「更优」就是「付得更少」，口径最直白也最好解释。
 *
 * 注意券是按**原价**判门槛与抵扣的，不是按内推价：
 * 否则「走了内推链接反而用不了满减券」会让买家觉得被坑，而且两条优惠互相影响
 * 会让规则说不清楚。分别算、取更优，规则只有一句话。
 */
export function calcCoupon(rule: CouponRule, ctx: OrderContext): CouponCalc {
  const noCoupon: CouponCalc = {
    usable: false,
    amount: Math.min(ctx.baseAmount, ctx.referralAmount),
    discount: 0,
    applied: ctx.referralAmount < ctx.baseAmount ? 'referral' : 'none',
  }

  // 商品券：只对限定商品生效
  if (rule.kind === 'PRODUCT') {
    if (rule.productIds.length && !rule.productIds.includes(ctx.productId)) {
      return { ...noCoupon, reject: 'KIND_PRODUCT_MISMATCH' }
    }
  } else if (cents(ctx.baseAmount) < cents(rule.minAmount)) {
    // 满减券：按原价判门槛。minAmount = 0 时恒成立，即无门槛券
    return { ...noCoupon, reject: 'BELOW_THRESHOLD' }
  }

  // 抵扣不能把金额打到 0 或负数，最多减到只剩 MIN_PAYABLE
  const maxCut = cents(ctx.baseAmount) - cents(MIN_PAYABLE)
  const cut = Math.min(cents(rule.discount), Math.max(0, maxCut))
  if (cut <= 0) return { ...noCoupon, reject: 'NO_DISCOUNT' }

  const couponAmount = yuan(cents(ctx.baseAmount) - cut)

  // 取更优：券后价 vs 内推价
  if (cents(couponAmount) <= cents(ctx.referralAmount)) {
    return { usable: true, amount: couponAmount, discount: yuan(cut), applied: 'coupon' }
  }
  return { ...noCoupon, usable: false, reject: 'NO_DISCOUNT' }
}

/**
 * 券在「现在」是否处于可用状态。
 *
 * 【时间比较一律用绝对值时刻，不做本地时区解释】交接文档第六节记过一次事故：
 * 把容器从 UTC 改成 Asia/Shanghai 之后，改动前写入的 DATETIME 被按新时区重新解释，
 * 落到了「未来」，导致 now - createdAt 恒为负、锁永不自愈。
 * 这里只比较两个 Date 的 getTime()，不依赖进程 TZ，也不做字符串日期拼接。
 */
export function grantUsable(
  g: { state: GrantState; expiresAt: Date | null },
  now: Date = new Date()
): { ok: true } | { ok: false; reason: string } {
  if (g.state === 'USED') return { ok: false, reason: '该券已使用' }
  if (g.state === 'LOCKED') return { ok: false, reason: '该券正被另一笔待支付订单占用' }
  if (g.state === 'EXPIRED') return { ok: false, reason: '该券已过期' }
  if (g.state === 'VOID') return { ok: false, reason: '该券已作废' }
  if (g.expiresAt && g.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: '该券已过期' }
  return { ok: true }
}

/** 批次在「现在」是否还能领 */
export function couponClaimable(
  c: { status: string; total: number; claimed: number; startAt: Date | null; endAt: Date | null },
  now: Date = new Date()
): { ok: true } | { ok: false; reason: string } {
  if (c.status === 'ENDED') return { ok: false, reason: '该活动已结束' }
  if (c.status === 'PAUSED') return { ok: false, reason: '该活动已暂停发放' }
  if (c.startAt && now.getTime() < c.startAt.getTime()) return { ok: false, reason: '该活动尚未开始' }
  if (c.endAt && now.getTime() >= c.endAt.getTime()) return { ok: false, reason: '该活动已结束' }
  if (c.claimed >= c.total) return { ok: false, reason: '已被领完' }
  return { ok: true }
}

/** 解析逗号分隔的商品 id */
export function parseProductIds(raw: string | null | undefined): number[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 50)
}

/**
 * 三限取值的哈希。
 *
 * IP 与浏览器指纹都属于个人信息，没有必要以原文长期留存 —— 我们只需要判定
 * 「这个值之前出现过没有」，哈希完全够用。加盐防止被彩虹表反查出 IP 段。
 */
export function claimHash(scope: 'USER' | 'IP' | 'DEVICE', value: string): string {
  const salt = process.env.JWT_SECRET || 'beiguo-coupon'
  return crypto.createHash('sha256').update(`${salt}|${scope}|${value}`).digest('hex').slice(0, 64)
}

/** 券面额的展示文案，前后台共用一套，避免两处写得不一样 */
export function couponLabel(c: { kind: string; minAmount: number; discount: number }): string {
  if (c.kind === 'PRODUCT') return `指定商品减 ¥${c.discount.toFixed(2)}`
  if (cents(c.minAmount) <= 0) return `无门槛减 ¥${c.discount.toFixed(2)}`
  return `满 ¥${c.minAmount.toFixed(2)} 减 ¥${c.discount.toFixed(2)}`
}

// ============ 状态流转 ============

/**
 * 把某张订单占用的券放回可用。
 *
 * 调用点有三处：订单超时取消、订单被管理员取消、建单失败回滚。
 * 幂等：条件里带 state='LOCKED'，已经是别的状态就什么都不做。
 *
 * 【过期的券不放回 AVAILABLE，直接判 EXPIRED】买家锁了券却没付款，
 * 等他回来时券可能已经过期了。放回 AVAILABLE 会让他在结算页看到一张
 * 选了就报错的券，不如直接显示已过期。
 */
export async function releaseCouponForOrder(orderId: number): Promise<number> {
  const now = new Date()
  const grants = await prisma.couponGrant.findMany({
    where: { orderId, state: 'LOCKED' },
    select: { id: true, expiresAt: true },
  })
  let n = 0
  for (const g of grants) {
    const expired = !!g.expiresAt && g.expiresAt.getTime() <= now.getTime()
    const r = await prisma.couponGrant.updateMany({
      where: { id: g.id, state: 'LOCKED' },
      data: { state: expired ? 'EXPIRED' : 'AVAILABLE', orderId: null, lockedAt: null },
    })
    n += r.count
  }
  return n
}

/**
 * 订单支付成功 → 券核销。
 * 用 CAS（条件带 state='LOCKED'）保证只核销一次；重复回调不会重复计数。
 */
export async function consumeCouponForOrder(orderId: number): Promise<boolean> {
  const r = await prisma.couponGrant.updateMany({
    where: { orderId, state: 'LOCKED' },
    data: { state: 'USED', usedAt: new Date() },
  })
  return r.count > 0
}

/**
 * 提交收款监控前的复验（站长明确要求的那一道）。
 *
 * 建单时已经校验并锁定过一次，这里是第二道：确认这张券**确实锁在这一单上、
 * 且属于当前账户**。两道都在的理由是它们防的不是同一件事 ——
 * 建单那道防「用不该用的券」，这道防「订单与券的关联在中途被改坏」。
 */
export async function assertCouponForPayment(
  orderId: number,
  userId: number
): Promise<{ ok: true } | { ok: false; message: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { couponGrantId: true, userId: true },
  })
  if (!order) return { ok: false, message: '订单不存在' }
  if (!order.couponGrantId) return { ok: true } // 没用券，无需复验
  if (order.userId !== userId) return { ok: false, message: '订单不属于当前账户' }

  const grant = await prisma.couponGrant.findUnique({
    where: { id: order.couponGrantId },
    select: { userId: true, state: true, orderId: true },
  })
  if (!grant) return { ok: false, message: '优惠券不存在，请重新下单' }
  // 账户与券必须一致 —— 站长原话
  if (grant.userId !== userId) return { ok: false, message: '优惠券不属于当前账户' }
  if (grant.state !== 'LOCKED' || grant.orderId !== orderId) {
    return { ok: false, message: '优惠券状态已变更，请重新下单' }
  }
  return { ok: true }
}

/**
 * 锁定超时时间。比收款单的超时（VMQ_PAY_TIMEOUT，默认几十分钟）留足余量 ——
 * 券的释放要晚于订单的取消，否则会出现「券已经放回去了、订单还能付款」的短暂窗口，
 * 那时买家付了优惠价，而券已经可以再用一次。
 */
const LOCK_SWEEP_MINUTES = Number(process.env.COUPON_LOCK_SWEEP_MIN || 120)

/**
 * 兜底清扫：把卡死的 LOCKED 券放回去。
 *
 * 【为什么必须有这一道，而不是靠 releaseCouponForOrder 就够】
 * releaseCouponForOrder 依赖「有一张订单、且这张订单走到了取消」。但有两条路径
 * 绕过了它，实测都会让买家的券**永久**卡在「占用中」，他自己解不开、只能找客服：
 *
 *  ① 买家下了单但**从未提交收款监控**（没点付款就关了页面）。
 *     这种订单没有对应的 VmqOrder，而 closeExpired 是遍历过期 VmqOrder 来关单的 ——
 *     它根本看不到这张订单，于是订单和券一起停在原地。
 *
 *  ② 建单时「先锁券、后回填 orderId」这两步之间进程崩了或写库失败。
 *     券是 LOCKED 但 orderId 为空，没有任何按订单查找的逻辑能定位到它。
 *
 * 所以这里按**时间**兜底，不依赖订单关联：锁了太久还没走到终态的，一律放回。
 * 判定时要看订单的真实状态，别把已经付款的券误放回去。
 */
export async function sweepStuckCoupons(now: Date = new Date()): Promise<{ released: number; consumed: number }> {
  const cutoff = new Date(now.getTime() - LOCK_SWEEP_MINUTES * 60_000)
  const stuck = await prisma.couponGrant.findMany({
    where: { state: 'LOCKED', lockedAt: { lt: cutoff } },
    select: { id: true, orderId: true, expiresAt: true },
    take: 200,
  })
  if (!stuck.length) return { released: 0, consumed: 0 }

  // 一次把相关订单查出来，不在循环里逐个打库
  const orderIds = stuck.map((g) => g.orderId).filter((v): v is number => typeof v === 'number')
  const orders = orderIds.length
    ? await prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, payStatus: true, deliveryStatus: true },
      })
    : []
  const orderMap = new Map(orders.map((o) => [o.id, o]))

  let released = 0
  let consumed = 0
  for (const g of stuck) {
    const order = g.orderId ? orderMap.get(g.orderId) : null

    // 订单其实已经付过款了 → 补一次核销，而不是把券放回去。
    // 这种情况说明核销那一步当时失败了，这里顺手自愈
    if (order && order.payStatus === 'PAID') {
      const r = await prisma.couponGrant.updateMany({
        where: { id: g.id, state: 'LOCKED' },
        data: { state: 'USED', usedAt: now },
      })
      consumed += r.count
      continue
    }

    // 其余情况（订单不存在 / 订单已取消 / 订单还挂着但早已超时）一律放回。
    // 过期的直接判 EXPIRED，不放回可用 —— 放回去买家也只会选中后报错
    const expired = !!g.expiresAt && g.expiresAt.getTime() <= now.getTime()
    const r = await prisma.couponGrant.updateMany({
      where: { id: g.id, state: 'LOCKED' },
      data: { state: expired ? 'EXPIRED' : 'AVAILABLE', orderId: null, lockedAt: null },
    })
    released += r.count
  }

  if (released || consumed) {
    console.log('[coupon/sweep]', JSON.stringify({ released, consumed, cutoffMin: LOCK_SWEEP_MINUTES }))
  }
  return { released, consumed }
}
