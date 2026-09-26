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
  /** 定价合计（单价 × 数量）。内推单不会走到 calcCoupon，所以这里不需要专属价 */
  baseAmount: number
}

export type CouponReject =
  | 'KIND_PRODUCT_MISMATCH'
  | 'BELOW_THRESHOLD'
  | 'NO_DISCOUNT'
  /** 这是一张内推单，按规则券整体不可用。与 NO_DISCOUNT 要分开：
   *  券本身完全正常，只是这一单不让用，文案必须能解释清楚 */
  | 'REFERRAL_ORDER'
  /** 渠道站的订单：渠道站营销全关（设计 7.6，服务端硬关），券一律不可用 */
  | 'CHANNEL_ORDER'

export interface CouponCalc {
  /** 能不能用 */
  usable: boolean
  reject?: CouponReject
  /** 用券后的实付金额 */
  amount: number
  /** 实际减免额（可能因为触底而小于券面额） */
  discount: number
  /** 这一单最终按什么算钱。内推与券互斥，不存在两者都生效的情况 */
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
    case 'REFERRAL_ORDER':
      return '通过推广链接下单已享专属价，本单不叠加优惠券'
    case 'CHANNEL_ORDER':
      return '本站不支持优惠券'
  }
}

/**
 * 算一单用券后要付多少。**只管券，不管内推。**
 *
 * 内推单根本不会走到这里 —— `quoteOrder` 在最前面就短路返回专属价了（券不可用）。
 * 所以这里只需要回答一个问题：这张券用在这个金额上，能减多少。
 *
 * 【这里曾经有一段「券后价 vs 内推价取更优」的比较，已删】那段逻辑要求
 * 同时理解两套优惠，结果是结算页和建单各算各的、算出不同的数。
 * 现在两者互斥，这个函数少了一个入参，也少了一整类对不上的可能。
 */
export function calcCoupon(rule: CouponRule, ctx: OrderContext): CouponCalc {
  const noCoupon: CouponCalc = {
    usable: false,
    amount: ctx.baseAmount,
    discount: 0,
    applied: 'none',
  }

  // 商品券：只对限定商品生效
  if (rule.kind === 'PRODUCT') {
    if (rule.productIds.length && !rule.productIds.includes(ctx.productId)) {
      return { ...noCoupon, reject: 'KIND_PRODUCT_MISMATCH' }
    }
  } else if (cents(ctx.baseAmount) < cents(rule.minAmount)) {
    // 满减券：按定价判门槛。minAmount = 0 时恒成立，即无门槛券
    return { ...noCoupon, reject: 'BELOW_THRESHOLD' }
  }

  // 抵扣不能把金额打到 0 或负数，最多减到只剩 MIN_PAYABLE
  const maxCut = cents(ctx.baseAmount) - cents(MIN_PAYABLE)
  const cut = Math.min(cents(rule.discount), Math.max(0, maxCut))
  if (cut <= 0) return { ...noCoupon, reject: 'NO_DISCOUNT' }

  return { usable: true, amount: yuan(cents(ctx.baseAmount) - cut), discount: yuan(cut), applied: 'coupon' }
}

/**
 * 报价：给定商品与可选的券，算出**服务端最终会收多少钱**。
 *
 * 【为什么必须单独有这个函数】结算页此前自己拿 `product.price − 券面额` 算展示价，
 * 而带 ?ref= 访问时 `/api/products` 会把 `p.price` **覆盖成推广专属价**
 * （见 api/products/route.ts 的内推分支）。于是页面算的是「专属价 − 券」、
 * 服务端算的是「定价 − 券」—— 两个数不一样，买家看到的和实际扣的对不上。
 * 现在结算页与下单接口都调这一个函数，不可能再分叉。
 */
export interface QuoteInput {
  productId: number
  /** 商品**定价**（数据库里的 price，不是被 ref 覆盖过的那个） */
  listPrice: number
  quantity: number
  /** 推广专属价单价；没有内推时传 null */
  referralUnitPrice: number | null
  rule: CouponRule | null
  /**
   * 渠道站售价（分 / 件）。非空 = 这是渠道站的订单：按售价成交、discount 恒 0、任何券都拒绝（设计 7.4、7.6）。
   * 渠道站忽略内推，所以与 referralUnitPrice 同时出现时以它为准。主站调用方不传，行为与改造前逐字相同。
   */
  channelUnitCents?: number | null
}

export interface Quote {
  /** 不用券时应付（已考虑内推） */
  baseline: number
  /** 用券后实付；券不适用时等于 baseline */
  amount: number
  discount: number
  applied: 'coupon' | 'referral' | 'none' | 'channel'
  /** 券为什么没用上；用上了则为 null */
  reject: CouponReject | null
}

/**
 * 全站唯一定价口径。商品页、结算页、建单三处都必须走它，谁也不许自己算。
 *
 * 规则只有两条（2026-09-11 站长拍板，取代了原来的「取更优」）：
 *   ① 走内推链接下单 → 一律按**专属价**，优惠券**不可用**
 *   ② 没走内推      → 按定价，可以选券；不选就是定价
 *
 * 【为什么废掉「取更优」】原来写的是 `baseline = Math.min(定价, 专属价)`，
 * 前提是「专属价一定比定价便宜」—— 这个前提是错的。线上有 19 个商品的专属价
 * **高于**定价（推广人自己加价，差额就是他的返现）。于是出现了这一幕：
 *   商品页 1800（专属价） → 结算页 1700（min 取了定价） → 收银台 1800（服务端按专属价建单）
 * 同一单三个价格，买家完全不知道该信哪个。
 *
 * 现在这个函数里**没有 min、没有比较**：走内推就是专属价，不走就是定价。
 * 少一个分支，就少一处能对不上的地方。
 */
export function quoteOrder(input: QuoteInput): Quote {
  // ⓪ 渠道站：售价说了算，券与内推都不参与（服务端硬关，设计 7.6）。放在最前面，主站的两条规则一字不动
  if (input.channelUnitCents != null) {
    if (!Number.isSafeInteger(input.channelUnitCents) || input.channelUnitCents <= 0) {
      throw new Error(`[coupon] 渠道售价非法：${String(input.channelUnitCents)}`)
    }
    const channelAmount = yuan(input.channelUnitCents * input.quantity)
    return { baseline: channelAmount, amount: channelAmount, discount: 0, applied: 'channel', reject: input.rule ? 'CHANNEL_ORDER' : null }
  }

  const baseAmount = yuan(cents(input.listPrice) * input.quantity)

  // ① 内推单：专属价说了算，无论它比定价高还是低；券一律不参与
  if (input.referralUnitPrice != null) {
    const referralAmount = yuan(cents(input.referralUnitPrice) * input.quantity)
    return {
      baseline: referralAmount,
      amount: referralAmount,
      discount: 0,
      applied: 'referral',
      // 没传券时不算「被拒」，传了券才告诉前台为什么没用上
      reject: input.rule ? 'REFERRAL_ORDER' : null,
    }
  }

  // ② 普通单：不选券就是定价
  if (!input.rule) {
    return { baseline: baseAmount, amount: baseAmount, discount: 0, applied: 'none', reject: null }
  }

  const calc = calcCoupon(input.rule, { productId: input.productId, baseAmount })
  const amount = calc.usable ? calc.amount : baseAmount

  // discount 恒等于 baseline − amount，保证订单详情/发票上「原价−优惠=实付」三个数对得上
  return {
    baseline: baseAmount,
    amount,
    discount: yuan(cents(baseAmount) - cents(amount)),
    applied: calc.usable ? 'coupon' : 'none',
    reject: calc.usable ? null : (calc.reject ?? null),
  }
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
  // COUPON_CLAIM_SALT 设了就用它：将来轮换 JWT_SECRET 时，写入旧的 JWT_SECRET 作为这里的盐，
  // 进行中的券批次的 IP/设备限领记录才不会被清零。不设时与原来完全一致
  const salt = process.env.COUPON_CLAIM_SALT || process.env.JWT_SECRET || 'beiguo-coupon'
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
 * 订单支付成功 → 券核销。幂等：已经核销过（或这单没用券）返回 false，不报错。
 *
 * 正常路径：券锁在这一单上（LOCKED + orderId=本单），CAS 翻成 USED，只会成功一次。
 *
 * 【兜底：钱到的时候券已经被放回去了】以下几条路都会让「按优惠价付了款」时券不再是 LOCKED：
 *  · 管理员取消了订单（券已释放），而买家的收银台还开着、照样付了款
 *  · 券锁了很久，兜底清扫把它放回了 AVAILABLE / EXPIRED，之后买家才付款
 *  · 后台对已过期 / 已取消的收款单「补单」
 *  · 建单时「先锁券、后回填 orderId」的回填失败，券是 LOCKED 但 orderId 为空
 * 订单金额在建单时就已经是优惠价，这笔优惠**已经给出去了**。此时券若还留在可用状态，
 * 买家就能再用一次 —— 同一张券享受两次优惠。所以按订单上记的 couponGrantId 找回那张券，
 * 从 AVAILABLE / EXPIRED /「LOCKED 但未挂订单」直接 CAS 成 USED，并挂回本单。
 *
 * 「LOCKED 但未挂订单」也收：券是按账户发的、这里还校验了 userId，锁住它的只可能是
 * 同一个买家的另一笔建单中的订单 —— 把券判给已经付了款的这一单，另一单付款前的复验
 * （assertCouponForPayment）会因券状态变化而拦下它，结果正是「一张券只优惠一次」。
 *
 * 券已经锁在别的订单上 / 已在别的订单核销 / 已作废：这一单的优惠等于被重复享受了，
 * 这里不去抢别人的券（那会让另一单对不上账），只打 error 日志，需要人工对账。
 */
export async function consumeCouponForOrder(orderId: number): Promise<boolean> {
  const now = new Date()
  const r = await prisma.couponGrant.updateMany({
    where: { orderId, state: 'LOCKED' },
    data: { state: 'USED', usedAt: now },
  })
  if (r.count > 0) return true

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { couponGrantId: true, userId: true, orderNo: true },
  })
  if (!order?.couponGrantId) return false // 这单没用券
  const grantId = order.couponGrantId

  const healed = await prisma.couponGrant.updateMany({
    where: {
      id: grantId,
      userId: order.userId,
      OR: [{ state: { in: ['AVAILABLE', 'EXPIRED'] } }, { state: 'LOCKED', orderId: null }],
    },
    data: { state: 'USED', orderId, usedAt: now, lockedAt: null },
  })
  if (healed.count === 1) {
    console.warn('[coupon] 付款时券已不在锁定状态（已被释放），已补核销到本单', { orderId, orderNo: order.orderNo, grantId })
    return true
  }

  const g = await prisma.couponGrant.findUnique({
    where: { id: grantId },
    select: { state: true, orderId: true, userId: true },
  })
  // 已经核销在本单上 = 之前已处理过（重复回调 / 清扫已自愈），幂等返回
  if (g && g.state === 'USED' && g.orderId === orderId) return false
  console.error(
    '[coupon] 订单已按优惠价付款，但券无法核销到本单 —— 这笔优惠可能被重复享受，需人工对账',
    { orderId, orderNo: order.orderNo, grantId, grant: g }
  )
  return false
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
 *
 * 【订单还挂着待支付收款单的不放】lockedAt 是建单时间，而买家可以隔很久才点付款
 * （例：建单后第 105 分钟才打开收银台）。只按时间判的话，清扫会在他付款途中把券放回去，
 * 他照样按优惠价付款成功，券却又能再用一次。收款单（VmqOrder state=0）还在，
 * 就说明买家正在付款、到账随时可能匹配上 —— 等它超时关单（closeExpired 会释放券）再说。
 * 另见 api/pay/vmq/create：发起支付时会把 lockedAt 刷新成「开始付款」的时刻。
 */
export async function sweepStuckCoupons(now: Date = new Date()): Promise<{ released: number; consumed: number }> {
  const cutoff = new Date(now.getTime() - LOCK_SWEEP_MINUTES * 60_000)
  const stuck = await prisma.couponGrant.findMany({
    where: { state: 'LOCKED', lockedAt: { lt: cutoff } },
    select: { id: true, orderId: true, expiresAt: true },
    take: 200,
  })
  if (!stuck.length) return { released: 0, consumed: 0 }

  // 一次把相关订单与其待支付收款单查出来，不在循环里逐个打库
  const orderIds = stuck.map((g) => g.orderId).filter((v): v is number => typeof v === 'number')
  const [orders, livePays] = orderIds.length
    ? await Promise.all([
        prisma.order.findMany({
          where: { id: { in: orderIds } },
          select: { id: true, payStatus: true, deliveryStatus: true },
        }),
        prisma.vmqOrder.findMany({
          where: { bizType: 'order', bizId: { in: orderIds }, state: 0 },
          select: { bizId: true },
        }),
      ])
    : [[], []]
  const orderMap = new Map(orders.map((o) => [o.id, o]))
  const paying = new Set(livePays.map((v) => v.bizId))

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

    // 买家正在付款（收款单还是待支付）→ 这一轮不动，见函数头注释
    if (order && paying.has(order.id)) continue

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
