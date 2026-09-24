/**
 * 下单有奖（抽奖）—— 数据库部分：活动配置、资格落库、抽奖事务、退款作废。
 *
 * 纯计算（概率、选奖、资格判定）在 lib/lottery.ts，这里只负责把它们落到库里。
 * 设计与安全约束见 docs/下单有奖-抽奖设计.md。改这个文件前务必读那一份。
 */
import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from './db'
import {
  DEFAULT_LOTTERY_CONFIG,
  ORDER_NO_RE,
  ROLL_SPACE,
  buyerLotteryView,
  canDraw,
  couponExpiresAt,
  isEligibleAtCreation,
  pickPrize,
  prizeCouponRule,
  prizeLabel,
  type BuyerLotteryView,
  type LotteryConfig,
  type PrizeSnapshot,
} from './lottery'
import { notifyLotteryWon } from './notify'

const CONFIG_KEY = 'lottery_config'

/** 买家/后台看得懂的错误。status 直接作为 HTTP 状态码返回 */
export class LotteryError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
    this.name = 'LotteryError'
  }
}

// ============ 活动配置（Setting 表，key = lottery_config） ============

/**
 * 读配置。库里是坏 JSON / 旧版本少字段时一律与默认值合并 —— 读配置失败绝不能让下单失败，
 * 而默认值是「活动关闭」，失败的方向是安全的（少发奖，不多发）。
 */
export async function getLotteryConfig(): Promise<LotteryConfig> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: CONFIG_KEY } })
    if (!row?.value) return { ...DEFAULT_LOTTERY_CONFIG }
    const saved = JSON.parse(row.value) as Partial<LotteryConfig>
    return {
      enabled: saved.enabled === true,
      minOrderAmount:
        Number.isFinite(Number(saved.minOrderAmount)) && Number(saved.minOrderAmount) >= 0
          ? Number(saved.minOrderAmount)
          : 0,
      rules: typeof saved.rules === 'string' ? saved.rules : '',
    }
  } catch (err) {
    console.error('[lottery] 读取活动配置失败，按「活动关闭」处理:', err)
    return { ...DEFAULT_LOTTERY_CONFIG }
  }
}

export async function saveLotteryConfig(cfg: LotteryConfig): Promise<void> {
  const value = JSON.stringify({
    enabled: !!cfg.enabled,
    minOrderAmount: Math.round(Math.max(0, cfg.minOrderAmount) * 100) / 100,
    rules: cfg.rules || '',
  })
  await prisma.setting.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value },
    update: { value },
  })
}

// ============ 资格：建单时落库 ============

/**
 * 在**建单的同一个事务里**调用：活动开启且达到门槛 → 建一行 PENDING 资格。
 *
 * 【为什么必须和建单同一个事务】分成两步的话，「订单建好了、资格行没建上」
 * （进程崩溃 / 连接断开）这张单就永远没有抽奖按钮，而买家是在活动页看到活动才下的单。
 * 同一个事务里要么都有、要么都没有。
 *
 * cfg 由调用方在事务开始前读好传进来（读配置不需要占着事务）。
 */
export async function createEntryIfEligible(
  tx: Prisma.TransactionClient,
  cfg: LotteryConfig,
  order: { id: number; orderNo: string; userId: number; amount: number }
): Promise<boolean> {
  if (!isEligibleAtCreation(cfg, order.amount)) return false
  await tx.lotteryEntry.create({
    data: { orderId: order.id, orderNo: order.orderNo, userId: order.userId, state: 'PENDING' },
  })
  return true
}

// ============ 买家侧查询 ============

/** 一页订单的抽奖状态（订单列表批量用）。没有资格的订单不在 Map 里 */
export async function lotteryViewsByOrderIds(orderIds: number[]): Promise<Map<number, BuyerLotteryView>> {
  const out = new Map<number, BuyerLotteryView>()
  if (!orderIds.length) return out
  const rows = await prisma.lotteryEntry.findMany({
    where: { orderId: { in: orderIds } },
    select: {
      orderId: true,
      state: true,
      won: true,
      prizeName: true,
      prizeType: true,
      prizeDetail: true,
      fulfillState: true,
      drawnAt: true,
      couponGrantId: true,
    },
  })
  // 中奖券的实际状态：批次被结束（退款作废）或已过期的，对买家都按「已失效」处理（与 /api/lottery/mine 同口径）
  const grantIds = rows.map((r) => r.couponGrantId).filter((v): v is number => v != null)
  const grants = grantIds.length
    ? await prisma.couponGrant.findMany({
        where: { id: { in: grantIds } },
        select: { id: true, state: true, expiresAt: true, coupon: { select: { status: true } } },
      })
    : []
  const now = Date.now()
  const grantState = new Map<number, string>()
  grants.forEach((g) => {
    let st = g.state
    if (st === 'AVAILABLE' && g.coupon.status === 'ENDED') st = 'VOID'
    else if (st === 'AVAILABLE' && g.expiresAt && g.expiresAt.getTime() <= now) st = 'EXPIRED'
    grantState.set(g.id, st)
  })
  for (const r of rows) {
    out.set(r.orderId, {
      ...buyerLotteryView(r),
      couponState: r.couponGrantId != null ? grantState.get(r.couponGrantId) ?? null : null,
    })
  }
  return out
}

/** 抽奖弹窗里展示的活动信息：开关、门槛、规则、奖池（**不含概率**） */
export async function publicLotteryInfo() {
  const [cfg, prizes] = await Promise.all([
    getLotteryConfig(),
    prisma.lotteryPrize.findMany({
      where: { enabled: true, rateBp: { gt: 0 } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        name: true,
        type: true,
        couponKind: true,
        couponMinAmount: true,
        couponDiscount: true,
        couponProductIds: true,
        couponValidDays: true,
      },
    }),
  ])
  return {
    enabled: cfg.enabled,
    minOrderAmount: cfg.minOrderAmount,
    rules: cfg.rules,
    prizes: prizes.map((p) => ({
      name: p.name,
      type: p.type,
      label: prizeLabel({
        type: p.type,
        name: p.name,
        couponKind: p.couponKind,
        couponMinAmount: p.couponMinAmount == null ? null : Number(p.couponMinAmount),
        couponDiscount: p.couponDiscount == null ? null : Number(p.couponDiscount),
        couponProductIds: p.couponProductIds,
        couponValidDays: p.couponValidDays,
      }),
    })),
  }
}

// ============ 抽奖 ============

export interface DrawResult {
  /** true = 这张订单之前已经抽过，这次返回的是当时的结果（重复点击是正常操作，不报错） */
  alreadyDrawn: boolean
  view: BuyerLotteryView
}

/** 事务内部用来「CAS 没抢到」的信号，外层捕获后返回已有结果 */
class AlreadyDrawnSignal extends Error {}

/**
 * 用订单号抽一次奖。
 *
 * 安全口径（每一条都有对应的攻击方式，不要删）：
 *  · **订单号 + 当前登录用户**双重定位：订单号不是秘密（邮件、企业微信推送里都有），
 *    只凭订单号就能抽，等于替别人把奖抽掉
 *  · 「不存在」与「不是你的」返回同一句话、同一个状态码，不能拿来试探订单号
 *  · 资格以 LotteryEntry 行为准：活动关闭期间下的单没有这一行，永远抽不了
 *  · 必须已付款、未取消、未退款：否则建一堆不付款的订单就能无限抽
 *  · 一单一抽靠 CAS（updateMany where state='PENDING'），不是先查后写 ——
 *    两个标签页同时点，只有一个能把 PENDING 翻成 DRAWN，另一个拿到的是同一份结果
 *  · 选奖在服务端用 crypto.randomInt，客户端传什么都不影响结果
 *  · 发券与翻状态在同一个事务里：发券失败 → 状态回滚成 PENDING，买家可以重试，
 *    不会出现「显示已抽、奖却没发」或「奖发了、还能再抽」
 */
export async function drawForOrder(userId: number, orderNoRaw: string): Promise<DrawResult> {
  const orderNo = String(orderNoRaw || '').trim().toUpperCase()
  if (!ORDER_NO_RE.test(orderNo)) throw new LotteryError('订单不存在', 404)

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } })
  if (!user || user.status !== 1) throw new LotteryError('账户状态异常，暂不能参与活动', 403)

  const order = await prisma.order.findUnique({
    where: { orderNo },
    select: { id: true, userId: true, orderNo: true, payStatus: true, deliveryStatus: true },
  })
  const entry = order ? await prisma.lotteryEntry.findUnique({ where: { orderId: order.id } }) : null

  const gate = canDraw(userId, order, entry)
  if (!gate.ok) throw new LotteryError(gate.reason, gate.status)
  // gate.ok 意味着 order 与 entry 都存在且属于本人
  const o = order!
  const e = entry!
  if (e.state === 'DRAWN') return { alreadyDrawn: true, view: buyerLotteryView(e) }

  // 奖池在事务外读：奖项配置不是这次抽奖要锁的对象，事务里只放必须原子的写
  const prizes = await prisma.lotteryPrize.findMany({
    where: { enabled: true, rateBp: { gt: 0 } },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  })
  /*
   * 【奖池为空时不抽】管理员把奖项全部停用（比如在调整奖品）的那段时间里，
   * 抽下去必然是「未中奖」，而且会用掉这张订单唯一的一次机会 —— 等于替买家把奖作废了。
   * 这里直接拒绝、资格原样保留，奖池恢复后买家再来抽。
   */
  if (!prizes.length) throw new LotteryError('奖池暂未开放，请稍后再来抽奖（抽奖机会已为你保留）', 409)
  const roll = crypto.randomInt(0, ROLL_SPACE)
  let picked = pickPrize(prizes, roll)
  // 券奖项的参数被手工改坏（没有券类型/面额）时不发一张参数不明的券，按未中奖处理并记日志
  if (picked && picked.type === 'COUPON') {
    const rule = prizeCouponRule({
      couponKind: picked.couponKind,
      couponMinAmount: picked.couponMinAmount == null ? null : Number(picked.couponMinAmount),
      couponDiscount: picked.couponDiscount == null ? null : Number(picked.couponDiscount),
      couponProductIds: picked.couponProductIds,
    })
    if (!rule) {
      console.error('[lottery] 奖项券参数不完整，按未中奖处理', picked.id)
      picked = null
    }
  }
  if (picked && picked.type !== 'COUPON' && picked.type !== 'CUSTOM') picked = null

  const now = new Date()
  try {
    const view = await prisma.$transaction(async (tx) => {
      // 事务内复核订单状态：与后台「取消 / 退款」并发时，以落库那一刻为准
      const fresh = await tx.order.findUnique({
        where: { id: o.id },
        select: { userId: true, payStatus: true, deliveryStatus: true },
      })
      const regate = canDraw(userId, fresh, { userId: e.userId, state: 'PENDING' })
      if (!regate.ok) throw new LotteryError(regate.reason, regate.status)

      let snapshot: PrizeSnapshot | null = null
      let couponData: Prisma.CouponCreateInput | null = null
      let expiresAt: Date | null = null
      if (picked) {
        const minAmount = picked.couponMinAmount == null ? null : Number(picked.couponMinAmount)
        const discount = picked.couponDiscount == null ? null : Number(picked.couponDiscount)
        const label = prizeLabel({
          type: picked.type,
          name: picked.name,
          couponKind: picked.couponKind,
          couponMinAmount: minAmount,
          couponDiscount: discount,
          couponProductIds: picked.couponProductIds,
          couponValidDays: picked.couponValidDays,
        })
        if (picked.type === 'COUPON') {
          const rule = prizeCouponRule({
            couponKind: picked.couponKind,
            couponMinAmount: minAmount,
            couponDiscount: discount,
            couponProductIds: picked.couponProductIds,
          })!
          expiresAt = couponExpiresAt(now, picked.couponValidDays)
          snapshot = {
            label,
            description: picked.description ?? null,
            coupon: {
              kind: rule.kind,
              minAmount: rule.minAmount,
              discount: rule.discount,
              productIds: rule.productIds,
              validDays: picked.couponValidDays ?? null,
              expiresAt: expiresAt ? expiresAt.toISOString() : null,
            },
          }
          couponData = {
            // 单张批次：只发给这一个中奖人。code 不可枚举（16 位随机十六进制），
            // 且 source='LOTTERY' 的批次在领取接口与 /coupon/<code> 页一律拒绝，双保险
            code: `lt-${crypto.randomBytes(8).toString('hex')}`,
            name: `下单有奖·${picked.name}`.slice(0, 80),
            kind: rule.kind,
            minAmount: new Prisma.Decimal(rule.minAmount.toFixed(2)),
            discount: new Prisma.Decimal(rule.discount.toFixed(2)),
            productIds: rule.productIds.length ? rule.productIds.join(',') : null,
            total: 1,
            claimed: 1,
            startAt: now,
            endAt: expiresAt,
            status: 'ACTIVE',
            source: 'LOTTERY',
            note: `下单有奖 · 订单 ${o.orderNo}`.slice(0, 300),
          }
        } else {
          snapshot = { label, description: picked.description ?? null }
        }
      }

      // 一单一抽的 CAS：只有把 PENDING 翻成 DRAWN 的那一次才发奖
      const flip = await tx.lotteryEntry.updateMany({
        where: { id: e.id, state: 'PENDING' },
        data: {
          state: 'DRAWN',
          won: !!picked,
          prizeId: picked?.id ?? null,
          prizeName: picked?.name ?? null,
          prizeType: picked?.type ?? null,
          prizeDetail: snapshot ? JSON.stringify(snapshot) : null,
          fulfillState: picked?.type === 'CUSTOM' ? 'PENDING' : null,
          drawnAt: now,
        },
      })
      if (flip.count !== 1) throw new AlreadyDrawnSignal()

      let couponGrantId: number | null = null
      if (couponData) {
        const coupon = await tx.coupon.create({ data: couponData, select: { id: true } })
        const grant = await tx.couponGrant.create({
          data: { couponId: coupon.id, userId, state: 'AVAILABLE', expiresAt },
          select: { id: true },
        })
        couponGrantId = grant.id
        await tx.lotteryEntry.update({ where: { id: e.id }, data: { couponGrantId } })
      }
      if (picked) {
        await tx.lotteryPrize.update({ where: { id: picked.id }, data: { wonCount: { increment: 1 } } })
      }

      const saved = await tx.lotteryEntry.findUniqueOrThrow({ where: { id: e.id } })
      return buyerLotteryView(saved)
    })

    if (view.won) {
      notifyLotteryWon({
        orderNo: o.orderNo,
        prizeName: view.prizeName || '',
        prizeLabel: view.prizeLabel || '',
        prizeType: view.prizeType || '',
      })
    }
    return { alreadyDrawn: false, view }
  } catch (err) {
    // 事务里奖项行不见了（管理员恰好在这一刻删除了它）→ 整个事务已回滚、资格仍是 PENDING，
    // 给买家一句能看懂的话让他重试，而不是一个 500
    if ((err as { code?: string })?.code === 'P2025') {
      throw new LotteryError('奖池刚刚发生了调整，请重新抽一次（抽奖机会仍保留）', 409)
    }
    if (err instanceof AlreadyDrawnSignal) {
      // 并发的另一次请求已经抽完了：返回它的结果，而不是报错
      const done = await prisma.lotteryEntry.findUnique({ where: { id: e.id } })
      if (done && done.state === 'DRAWN') return { alreadyDrawn: true, view: buyerLotteryView(done) }
      throw new LotteryError('抽奖状态已变化，请刷新后重试', 409)
    }
    throw err
  }
}

// ============ 作废（订单退款） ============

/**
 * 订单退款（或已付款后被取消）时收回抽奖资格与奖品。幂等，可以重复调用。
 *
 *  · 还没抽 → 资格作废（VOID），之后再也抽不了
 *  · 已抽中券 → 这张券所在的**单张批次**直接置为 ENDED（结束），并把还没用的券（AVAILABLE）作废。
 *    【为什么要结束批次，而不只是作废券】券此刻可能正挂在另一张待付款订单上（LOCKED）。
 *    只作废 AVAILABLE 的话，那张订单超时关单时 releaseCouponForOrder 会把券放回 AVAILABLE，
 *    退了款的订单换来的奖就又能用了。批次 ENDED 之后：那张订单如果付了款，券照常核销
 *    （付款核销不看批次状态，账对得上）；如果被放回，建单时会因「该券所属活动已结束」被拒，
 *    「我的优惠券」也会显示为已作废。抽奖批次一批只有这一张券，结束它不影响任何别人。
 *    已经用掉（USED）的券不动 —— 那是另一笔订单的账
 *  · 已抽中自定义奖品且未兑现 → 标记作废
 *
 * 【与抽奖并发】退款写库与买家拆红包可能同时发生：抽奖事务里对订单状态的复核是普通快照读，
 * 可能读在退款提交之前而放行。所以这里「PENDING → VOID」的 CAS 没抢到时不能直接返回 ——
 * UPDATE 会等抽奖事务提交后再判断，没抢到说明那边刚刚抽完，重新读一次、按已抽的路径把奖收回。
 */
export async function voidLotteryForOrder(orderId: number): Promise<{ voided: boolean; couponVoided: boolean }> {
  let entry = await prisma.lotteryEntry.findUnique({ where: { orderId } })
  if (!entry) return { voided: false, couponVoided: false }

  if (entry.state === 'PENDING') {
    const r = await prisma.lotteryEntry.updateMany({
      where: { id: entry.id, state: 'PENDING' },
      data: { state: 'VOID' },
    })
    if (r.count === 1) return { voided: true, couponVoided: false }
    // 没抢到：并发的抽奖刚把它翻成了 DRAWN。重读后走下面的收回逻辑
    entry = await prisma.lotteryEntry.findUnique({ where: { id: entry.id } })
    if (!entry || entry.state !== 'DRAWN') return { voided: false, couponVoided: false }
  }

  let couponVoided = false
  if (entry.state === 'DRAWN' && entry.couponGrantId) {
    const g = await prisma.couponGrant.findUnique({ where: { id: entry.couponGrantId }, select: { couponId: true } })
    if (g) {
      await prisma.coupon.updateMany({ where: { id: g.couponId, source: 'LOTTERY' }, data: { status: 'ENDED' } })
    }
    const r = await prisma.couponGrant.updateMany({
      where: { id: entry.couponGrantId, state: 'AVAILABLE' },
      data: { state: 'VOID' },
    })
    couponVoided = r.count === 1
  }
  if (entry.state === 'DRAWN' && entry.prizeType === 'CUSTOM' && entry.fulfillState === 'PENDING') {
    await prisma.lotteryEntry.updateMany({
      where: { id: entry.id, fulfillState: 'PENDING' },
      data: { fulfillState: 'VOID', fulfillNote: '订单已退款，奖品作废' },
    })
  }
  return { voided: false, couponVoided }
}
