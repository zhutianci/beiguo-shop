/**
 * 余额充值的下单编排（docs/短信接码-设计.md §1.16、§6.4、D35、D36、E60）。POST / GET /api/wallet/topup 调这里，itest 直接调。
 *
 * 【为什么不放在 lib/wallet】要调收款单（lib/vmq 的 createOrGetVmqOrder 等），而 lib/wallet 是叶子、不能 import vmq（规则 17）。
 * 钱与订单的事务都在 lib/wallet/topup.ts；这里只把「建单事务 → 发起收款单 → 事后复核 → 失败就在同一请求里关单」串起来。
 *
 * 流程（§1.16）：
 *   1. 开关与受众（wallet_config 读不到按关闭）、载体商品恰好 1 行、金额（整数元、在 [minCents, maxCents] 内）、条款版本 = 代码常量；
 *   2. 充值下单事务（锁用户行；幂等 / 同金额复用 / 待支付 ≤N 张都在锁内，lib/wallet/topup.createTopupOrder）；
 *   3. 同一请求里发起收款单，照 pay/vmq/create 做事后复核（每人待付款收款单 ≤3：普通商品的收款单不走用户行锁，这一项仍要复核）；
 *   4. 发起失败或复核超限：作废本次新建的收款单 → 同一请求里用小事务关掉这张充值单（有 0/1 收款单就不关）→ 返回错误；
 *      关单也失败的，由 vmq-close 路由里的兜底清扫在 10 分钟后关掉（sweepOrphans）。
 */
import { prisma } from './db'
import {
  createOrGetVmqOrder,
  countOpenOrderPayments,
  hasOpenPayment,
  discardVmqOrder,
  VmqError,
  VMQ_MAX_OPEN_PER_USER,
  VMQ_TIMEOUT_MIN,
} from './vmq'
import { payableCents } from './order-payable'
import { readWalletConfig, topupOpenFor, validateTopupAmount, canUseForJiema, type WalletConfig, type WalletConfigRead } from './wallet/config'
import {
  topupCarrierId,
  createTopupOrder,
  closeUnpaidTopup,
  normalizeClientToken,
  normalizeReturnTo,
  agreedWalletTerms,
  TOPUP_PENDING_WINDOW_MIN,
} from './wallet/topup'
import { centsOf } from './wallet/buckets'
import { WALLET_TERMS_VERSION } from './terms/jiema-wallet'

export interface TopupUser {
  id: number
  role?: string | null
}

export type TopupStartResult =
  | { ok: true; orderNo: string; payUrl: string; amountCents: number; reused: boolean }
  | { ok: false; status: number; code: string; message: string; minCents?: number; maxCents?: number }

/** 充值对这个用户开放 + 载体商品正常时返回配置；否则 null（接口 503 TOPUP_OFF、页面「余额充值即将开放」） */
export async function topupAvailability(user: TopupUser): Promise<{ cfg: WalletConfig; carrierId: number; read: WalletConfigRead } | null> {
  const r = await readWalletConfig()
  if (!r.ok || !topupOpenFor(r.config, user.role === 'ADMIN')) return null
  const carrierId = await topupCarrierId()
  if (carrierId == null) return null
  return { cfg: r.config, carrierId, read: r }
}

const OFF: TopupStartResult = { ok: false, status: 503, code: 'TOPUP_OFF', message: '余额充值即将开放' }
const BUSY_MSG = '当前付款人数较多，请稍后再试（这笔充值没有生成，不用处理）'
const openPaymentsMsg = () =>
  `你有 ${VMQ_MAX_OPEN_PER_USER} 笔付款还没完成（含充值），请先在「我的订单」或「余额充值」页完成支付，或等其超时（约 ${VMQ_TIMEOUT_MIN} 分钟）自动关闭后再试`

async function closeQuietly(orderId: number, why: string): Promise<void> {
  try {
    const r = await closeUnpaidTopup(orderId)
    if (r !== 'CLOSED' && r !== 'ALREADY_CLOSED') console.warn(`[wallet] 充值单 #${orderId} 同一请求里关单未关（${r}），${why}`)
  } catch (e) {
    // 关单也失败：没有任何收款单的充值单由 vmq-close 的兜底清扫在 10 分钟后关掉
    console.error(`[wallet] 充值单 #${orderId} 同一请求里关单失败（交给兜底清扫），${why}`, e)
  }
}

// 仅供 itest（§12.2 第 90、107 条）：注入「发起收款失败」
let payFaultForTest: (() => never) | null = null
export function setTopupPayFaultForTest(fn: (() => never) | null): void {
  payFaultForTest = fn
}

export async function startTopup(
  user: TopupUser,
  input: { amountCents: unknown; clientToken: unknown; termsVersion: unknown; returnTo?: unknown },
): Promise<TopupStartResult> {
  const avail = await topupAvailability(user)
  if (!avail) return OFF
  const { cfg, carrierId } = avail
  const amountMsg = validateTopupAmount(input.amountCents, cfg)
  if (amountMsg) return { ok: false, status: 400, code: 'AMOUNT', message: amountMsg, minCents: cfg.minCents, maxCents: cfg.maxCents }
  const amountCents = input.amountCents as number
  const clientToken = normalizeClientToken(input.clientToken)
  if (!clientToken) return { ok: false, status: 400, code: 'BAD_REQUEST', message: '请求参数不正确，请刷新页面后重试' }
  if (input.termsVersion !== WALLET_TERMS_VERSION) {
    return { ok: false, status: 409, code: 'TERMS', message: '《余额与充值规则》已更新，请刷新页面阅读后重新勾选' }
  }
  const returnTo = normalizeReturnTo(input.returnTo)

  // ② 充值下单事务（锁用户行）
  const made = await createTopupOrder({
    userId: user.id,
    carrierId,
    amountCents,
    clientToken,
    termsVersion: WALLET_TERMS_VERSION,
    returnTo,
    pendingLimit: cfg.pendingTopupPerUser,
  })
  if (!made.ok) return { ok: false, status: made.status, code: made.code, message: made.message }

  // ③ 发起收款单（本单已有有效收款单 → createOrGetVmqOrder 原样复用，不占新金额，也不再做每人上限复核）
  const reusing = await hasOpenPayment('order', made.orderId)
  if (!reusing && (await countOpenOrderPayments(user.id)) >= VMQ_MAX_OPEN_PER_USER) {
    await closeQuietly(made.orderId, '每人待付款收款单已满')
    return { ok: false, status: 429, code: 'OPEN_PAYMENTS', message: openPaymentsMsg() }
  }
  let vmq: Awaited<ReturnType<typeof createOrGetVmqOrder>>
  try {
    if (payFaultForTest) payFaultForTest()
    const due = await payableCents(prisma, made.orderId)
    if (due == null || due <= 0) throw new VmqError('订单金额不正确')
    vmq = await createOrGetVmqOrder({ bizType: 'order', bizId: made.orderId, outTradeNo: made.orderNo, price: due / 100 })
  } catch (e) {
    const msg = e instanceof VmqError ? e.message : ''
    if (!(e instanceof VmqError)) console.error('[wallet] 充值单发起收款失败', made.orderId, e)
    // 「这笔款项已收到」：收款单已是 1（到账了、正在入账）——绝不能关单
    if (/已收到/.test(msg)) return { ok: false, status: 409, code: 'PAID_PENDING', message: msg }
    await closeQuietly(made.orderId, '发起收款失败')
    // 复用的那张充值单刚被超时关掉（closeExpired 在发起收款前先跑一遍）：告诉买家这笔已关闭，而不是「人数较多」
    if (!made.created) {
      const o = await prisma.order.findUnique({ where: { id: made.orderId }, select: { payStatus: true, deliveryStatus: true } })
      if (o?.payStatus === 'UNPAID' && o.deliveryStatus === 'CANCELLED') {
        return { ok: false, status: 409, code: 'CLOSED', message: '这笔充值已超时关闭，请重新充值' }
      }
    }
    return { ok: false, status: 503, code: 'BUSY', message: BUSY_MSG }
  }
  // 事后复核（照 pay/vmq/create）：预检与分配不是原子的，并发的一批请求会一起通过预检；只作废本次新建的收款单
  if (!reusing && vmq.created && (await countOpenOrderPayments(user.id)) > VMQ_MAX_OPEN_PER_USER) {
    await discardVmqOrder(vmq.orderId).catch((e) => console.error('[wallet] 超额充值收款单回滚失败', vmq.orderId, e))
    await closeQuietly(made.orderId, '事后复核超过每人上限')
    return { ok: false, status: 429, code: 'OPEN_PAYMENTS', message: openPaymentsMsg() }
  }
  return { ok: true, orderNo: made.orderNo, payUrl: `/pay/${vmq.orderId}`, amountCents: made.amountCents, reused: !made.created || !vmq.created }
}

export interface TopupPageData {
  enabled: boolean
  tiersCents?: number[]
  minCents?: number
  maxCents?: number
  balanceCents?: number
  topupCents?: number
  termsVersion?: string
  termsAgreed?: boolean
  /** 「充值余额可用于支付短信接码订单」这句只在做得到时出现（与钱包页同一个判断，§1.15） */
  canUseForJiema?: boolean
  pending?: { orderNo: string; amountCents: number; payCents: number; payUrl: string; expiresAt: string }[]
}

/** GET /api/wallet/topup：档位与上下限（按配置下发，文案不写死）、两格余额、有有效收款单的待支付充值单 */
export async function topupPageData(user: TopupUser): Promise<TopupPageData> {
  const avail = await topupAvailability(user)
  if (!avail) return { enabled: false }
  const { cfg, carrierId, read } = avail
  const now = Date.now()
  const [u, orders, agreed, jiema] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { balance: true, topupCents: true } }),
    prisma.order.findMany({
      where: {
        userId: user.id,
        productId: carrierId,
        payStatus: 'UNPAID',
        deliveryStatus: { not: 'CANCELLED' },
        createdAt: { gte: new Date(now - TOPUP_PENDING_WINDOW_MIN * 60_000) },
      },
      orderBy: { id: 'desc' },
      select: { id: true, orderNo: true, amount: true },
    }),
    agreedWalletTerms(user.id, carrierId, WALLET_TERMS_VERSION),
    canUseForJiema(read),
  ])
  const vmqs = orders.length
    ? await prisma.vmqOrder.findMany({
        where: { bizType: 'order', bizId: { in: orders.map((o) => o.id) }, state: 0, createdAt: { gte: new Date(now - VMQ_TIMEOUT_MIN * 60_000) } },
        orderBy: { createdAt: 'desc' },
        select: { orderId: true, bizId: true, reallyPrice: true, createdAt: true },
      })
    : []
  const pending = orders.flatMap((o) => {
    const v = vmqs.find((x) => x.bizId === o.id)
    if (!v) return []
    return [{
      orderNo: o.orderNo,
      amountCents: centsOf(o.amount),
      payCents: centsOf(v.reallyPrice),
      payUrl: `/pay/${v.orderId}`,
      expiresAt: new Date(v.createdAt.getTime() + VMQ_TIMEOUT_MIN * 60_000).toISOString(),
    }]
  })
  const topupCents = u?.topupCents ?? 0
  return {
    enabled: true,
    tiersCents: cfg.tiersCents,
    minCents: cfg.minCents,
    maxCents: cfg.maxCents,
    balanceCents: topupCents + centsOf(u?.balance ?? 0),
    topupCents,
    termsVersion: WALLET_TERMS_VERSION,
    termsAgreed: agreed,
    canUseForJiema: jiema,
    pending,
  }
}
