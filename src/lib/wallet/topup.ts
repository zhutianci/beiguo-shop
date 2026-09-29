/**
 * 余额充值（docs/短信接码-设计.md D14、D35、D36、§1.16、§2.7「充值单」、§9.1、附录 B 第 3、8、20 条）。
 *
 * 【充值单 = 挂 TOPUP 载体商品的普通订单】没有额外状态表，复用订单 + 收银台 + 到账匹配 + 对账补履约：
 *   下单（本文件 createTopupOrder，锁住用户行串行化）→ 同一请求里发起收款单（lib/topup-checkout.ts，因为本目录不能 import vmq）
 *   → 到账 → fulfillOrder(orderId, { via: 'VMQ', vmqId }) 翻 PAID 的**同一事务**里调 creditInTx 给充值格入账（按那张收款单的实付，含尾差）
 *   → 订单直接 DELIVERED。收银台超时由 closeExpired 照常关成 UNPAID + CANCELLED；充值单没有预扣，关了就结束。
 *   关了之后才到的钱不补单，按实收退进充值格（latepay.ts，D41）。
 * 【载体商品必须恰好 1 行、且下架】按 deliveryType='TOPUP' 找，不是恰好 1 行（或被上架了）就停售充值并告警（§5.4、D14 fail-closed）。
 * 【载体商品行不在任何资金事务里写】fulfillOrder 对载体单跳过 sales + 1（§2.7 第 4 条）。
 * 【内部 remark】`topup|ct:<clientToken>|terms:<版本>|return:<回跳>`：createShopOrder 的 remark 传 null（它会把 remark 同时写进
 *   买家备注 buyerRemark，后台订单页会把这串内部字符当成买家备注显示），建单后在同一事务里再写（§1.16）。
 *
 * 本文件是 lib/wallet 的一部分：不 import lib/vmq、lib/jiema（规则 17）；写余额只经 ledger.postInTx（规则 16）。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { notify } from '../notify'
import { safeRedirect } from '../safe-redirect'
import { createShopOrder } from '../order/create-shop-order'
import { postInTx, inMoneyTx } from './ledger'
import { centsOf, yuanStr, fmtCents } from './buckets'

export const TOPUP_REMARK_PREFIX = 'topup|ct:'
/** 待支付充值单按「建单 ≤30 分钟」计数（有效收款单 20 分钟；没发起收款的死单由 10 分钟清扫关掉，§1.16 第 1 步） */
export const TOPUP_PENDING_WINDOW_MIN = 30
/** vmq-close 兜底清扫：UNPAID、未取消、建单超过 10 分钟、没有 0/1 收款单的充值单（§6.6 第 20 条、E60） */
export const TOPUP_ORPHAN_MIN = 10
/** 大额知会阈值：同一用户 24 小时内已入账充值合计 ≥ ¥2,000（按订单金额，不含识别尾差；§10.1） */
export const TOPUP_BIG_24H_CENTS = 200_000
/** returnTo 限长（remark 只有 255 个字符，§1.16） */
export const RETURN_TO_MAX = 120

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ---------------------------------------------------------------------------
// 纯函数（scripts/check-wallet-b1.ts 断言）
// ---------------------------------------------------------------------------

/** clientToken 必须是 UUID（幂等键，写进 remark；小写化后比较） */
export function normalizeClientToken(v: unknown): string | null {
  return typeof v === 'string' && UUID_RE.test(v) ? v.toLowerCase() : null
}

/**
 * 充值单带的「返回继续下单」地址：经 safeRedirect、只接受 /jiema 开头、限长 120、不含 |（remark 的分隔符）。
 * 不合法就当没有（不报错：它只决定钱包页横幅上多不多一个按钮）。
 */
export function normalizeReturnTo(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw || raw.length > RETURN_TO_MAX) return null
  const s = safeRedirect(raw, '')
  if (!s || s.length > RETURN_TO_MAX || s.includes('|')) return null
  if (!(s === '/jiema' || s.startsWith('/jiema?') || s.startsWith('/jiema/'))) return null
  return s
}

export function buildTopupRemark(p: { clientToken: string; termsVersion: string; returnTo: string | null }): string {
  const r = `${TOPUP_REMARK_PREFIX}${p.clientToken}|terms:${p.termsVersion}${p.returnTo ? `|return:${p.returnTo}` : ''}`
  if (r.length > 255) throw new Error('[wallet] 充值单 remark 超过 255 字')
  return r
}

export function parseTopupRemark(remark: string | null | undefined): { clientToken: string; termsVersion: string | null; returnTo: string | null } | null {
  if (!remark || !remark.startsWith(TOPUP_REMARK_PREFIX)) return null
  const rest = remark.slice(TOPUP_REMARK_PREFIX.length)
  const ri = rest.indexOf('|return:')
  const head = ri >= 0 ? rest.slice(0, ri) : rest
  const returnTo = ri >= 0 ? normalizeReturnTo(rest.slice(ri + '|return:'.length)) : null
  const [clientToken, ...kv] = head.split('|')
  let termsVersion: string | null = null
  for (const x of kv) if (x.startsWith('terms:')) termsVersion = x.slice('terms:'.length) || null
  return clientToken ? { clientToken, termsVersion, returnTo } : null
}

/**
 * 后台订单列表 / 详情里充值单的「系统备注」（B1 评审修复）：remark 是内部字段 `topup|ct:…|terms:…|return:…`，不是买家备注
 * （buyerRemark 恒为空，§1.16），原来后台把它当「用户备注」显示。这里翻成人话；解析不了（例如被人工改过）就原样返回。
 */
export function describeTopupRemark(remark: string | null | undefined): string | null {
  if (!remark) return null
  const p = parseTopupRemark(remark)
  if (!p) return remark
  return [
    '充值单内部字段',
    p.termsVersion ? `同意《余额与充值规则》${p.termsVersion} 版` : '没有记条款版本',
    p.returnTo ? `充值后回到 ${p.returnTo}` : null,
    `幂等令牌 ${p.clientToken.slice(0, 8)}…`,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** 充值单的商品名快照（§9.1：「余额充值 ¥50.00」） */
export function topupProductName(amountCents: number): string {
  return `余额充值 ¥${yuanStr(amountCents)}`
}

// ---------------------------------------------------------------------------
// 载体商品
// ---------------------------------------------------------------------------

let carrierCache: { id: number; at: number } | null = null
const CARRIER_TTL_MS = 5 * 60_000
let lastCarrierAlertAt = 0

/** 仅供 itest：清掉进程内缓存的载体商品 id */
export function resetTopupCarrierCacheForTest(): void {
  carrierCache = null
}

/**
 * TOPUP 载体商品的 id。要求 products 里 deliveryType='TOPUP' **恰好 1 行**且下架（status=0）；否则返回 null（充值停售）
 * 并推 wallet.alert（进程内 1 小时节流）。结果在进程内缓存 5 分钟。
 */
export async function topupCarrierId(): Promise<number | null> {
  const now = Date.now()
  if (carrierCache && now - carrierCache.at < CARRIER_TTL_MS) return carrierCache.id
  const rows = await prisma.product.findMany({ where: { deliveryType: 'TOPUP' }, select: { id: true, status: true }, take: 3 })
  if (rows.length === 1 && rows[0].status === 0) {
    carrierCache = { id: rows[0].id, at: now }
    return rows[0].id
  }
  carrierCache = null
  if (now - lastCarrierAlertAt > 3600_000) {
    lastCarrierAlertAt = now
    notify('wallet.alert', [
      { label: '问题', value: rows.length === 1 ? '「余额充值」载体商品被上架了' : `TOPUP 载体商品有 ${rows.length} 行（应恰好 1 行）`, color: 'warning' },
      { label: '影响', value: '余额充值已按停售处理（到账入账、迟到退入不受影响）' },
      { label: '处理', value: rows.length === 0 ? '执行种子 scripts/ops/wallet-b1-seed.sql' : '核对 products 里 delivery_type=TOPUP 的行，保持恰好 1 行、下架' },
    ], { link: '/admin/products', extraTitle: '充值载体商品异常' })
  }
  return null
}

// ---------------------------------------------------------------------------
// 充值下单（§1.16 第 1 步）：锁住用户行串行化，幂等 / 同金额复用 / 待支付 ≤N 张都在锁内按订单行算
// ---------------------------------------------------------------------------

export type TopupOrderResult =
  | { ok: true; orderId: number; orderNo: string; amountCents: number; created: boolean }
  | { ok: false; code: 'CLOSED' | 'PAID' | 'TOO_MANY_PENDING'; status: number; message: string }

export async function createTopupOrder(p: {
  userId: number
  carrierId: number
  amountCents: number
  clientToken: string
  termsVersion: string
  returnTo: string | null
  pendingLimit: number
  now?: Date
}): Promise<TopupOrderResult> {
  if (!Number.isSafeInteger(p.amountCents) || p.amountCents <= 0 || p.amountCents % 100 !== 0) throw new Error('[wallet] 充值金额必须是整数元')
  const remark = buildTopupRemark({ clientToken: p.clientToken, termsVersion: p.termsVersion, returnTo: p.returnTo })
  // READ COMMITTED：锁住用户行之后的普通读要看到「前一个请求刚提交的充值单」（RR 下可能读到更早的快照）
  return inMoneyTx(
    async (tx) => {
      const now = p.now ?? new Date()
      // 第一步：锁用户行（与接码下单 T1 同一把锁；并发的两个充值请求在这里排队，后一个一定看得见前一个刚建的单）
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${p.userId} FOR UPDATE`
      // ① 幂等：同一个 clientToken
      const same = await tx.order.findFirst({
        where: { userId: p.userId, productId: p.carrierId, remark: { startsWith: `${TOPUP_REMARK_PREFIX}${p.clientToken}|` } },
        orderBy: { id: 'desc' },
        select: { id: true, orderNo: true, amount: true, payStatus: true, deliveryStatus: true },
      })
      if (same) {
        if (same.payStatus === 'UNPAID' && same.deliveryStatus !== 'CANCELLED') {
          return { ok: true as const, orderId: same.id, orderNo: same.orderNo, amountCents: centsOf(same.amount), created: false }
        }
        if (same.payStatus === 'UNPAID') return { ok: false as const, code: 'CLOSED' as const, status: 409, message: '这笔充值已取消，请重新充值' }
        return { ok: false as const, code: 'PAID' as const, status: 409, message: '这笔充值已到账，如需再充请刷新页面后重新选择金额' }
      }
      // ② 待支付的充值单（按订单行算：UNPAID、未取消、建单 ≤30 分钟）
      const since = new Date(now.getTime() - TOPUP_PENDING_WINDOW_MIN * 60_000)
      const pending = await tx.order.findMany({
        where: { userId: p.userId, productId: p.carrierId, payStatus: 'UNPAID', deliveryStatus: { not: 'CANCELLED' }, createdAt: { gte: since } },
        orderBy: { id: 'desc' },
        select: { id: true, orderNo: true, amount: true },
      })
      // ③ 同金额复用：不论它的收款单发起了没有（之后 createOrGetVmqOrder 会复用或替它发起），避免占两个唯一金额
      const sameAmount = pending.find((o) => centsOf(o.amount) === p.amountCents)
      if (sameAmount) return { ok: true as const, orderId: sameAmount.id, orderNo: sameAmount.orderNo, amountCents: p.amountCents, created: false }
      // ④ 待支付 ≤N 张（不设充值余额总额上限，Q5）
      if (pending.length >= p.pendingLimit) {
        return { ok: false as const, code: 'TOO_MANY_PENDING' as const, status: 409, message: `你有 ${pending.length} 笔充值待支付，请先完成或等它们超时关闭` }
      }
      // ⑤ 建单（唯一建单点 createShopOrder；remark 传 null，内部 remark 同一事务再写）
      const created = await createShopOrder(tx, {
        tenantId: 1,
        userId: p.userId,
        productId: p.carrierId,
        productName: topupProductName(p.amountCents),
        productPrice: p.amountCents / 100,
        quantity: 1,
        amount: p.amountCents / 100,
        invoiceTaxFee: null,
        invoiceInfo: null,
        remark: null,
      })
      await tx.order.update({ where: { id: created.id }, data: { remark } })
      return { ok: true as const, orderId: created.id, orderNo: created.orderNo, amountCents: p.amountCents, created: true }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  )
}

// ---------------------------------------------------------------------------
// 关掉一张没付款的充值单（发起收款失败 / 复核超限 / 兜底清扫）：锁订单行 → 确认没有 0/1 收款单 → CAS 取消
// ---------------------------------------------------------------------------

export type CloseTopupOutcome = 'CLOSED' | 'ALREADY_CLOSED' | 'HAS_PAYMENT' | 'PAID' | 'NOT_TOPUP' | 'NOT_FOUND'

/**
 * 小事务（READ COMMITTED）：锁订单行后再查收款单——createOrGetVmqOrder 建收款单前也先锁这一行，所以锁内看到的「没有 0/1 收款单」
 * 在本事务提交前不会变；Prisma 的 updateMany 表达不了「不存在收款单」，所以是先查后写，但在订单行锁内（§1.16）。
 * 有 state=1 的收款单（钱到了、履约还没做）绝不关：等 reconcilePaidVmq 补履约。
 */
export async function closeUnpaidTopup(orderId: number): Promise<CloseTopupOutcome> {
  return inMoneyTx(
    async (tx) => {
      const rows = await tx.$queryRaw<{ id: number; pay_status: string; delivery_status: string; product_id: number }[]>`
        SELECT id, pay_status, delivery_status, product_id FROM orders WHERE id = ${orderId} FOR UPDATE`
      const o = rows[0]
      if (!o) return 'NOT_FOUND' as const
      const prod = await tx.product.findUnique({ where: { id: Number(o.product_id) }, select: { deliveryType: true } })
      if (prod?.deliveryType !== 'TOPUP') return 'NOT_TOPUP' as const
      if (o.pay_status !== 'UNPAID') return 'PAID' as const
      if (o.delivery_status === 'CANCELLED') return 'ALREADY_CLOSED' as const
      const live = await tx.vmqOrder.count({ where: { bizType: 'order', bizId: orderId, state: { in: [0, 1] } } })
      if (live > 0) return 'HAS_PAYMENT' as const
      const r = await tx.order.updateMany({
        where: { id: orderId, payStatus: 'UNPAID', deliveryStatus: { not: 'CANCELLED' } },
        data: { deliveryStatus: 'CANCELLED' },
      })
      return r.count === 1 ? ('CLOSED' as const) : ('ALREADY_CLOSED' as const)
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  )
}

/**
 * vmq-close 路由末尾的兜底清扫（§6.6 第 20 条、E60）：UNPAID、未取消、建单超过 10 分钟的充值单逐张小事务关掉
 * （锁订单行 → 确认没有 0/1 收款单 → CAS 取消）。有待付或已到账收款单的跳过。不依赖 wallet_config（关单不读配置）。
 */
export async function sweepOrphans(now = new Date()): Promise<{ checked: number; closed: number }> {
  const rows = await prisma.order.findMany({
    where: {
      product: { deliveryType: 'TOPUP' },
      payStatus: 'UNPAID',
      deliveryStatus: { not: 'CANCELLED' },
      createdAt: { lt: new Date(now.getTime() - TOPUP_ORPHAN_MIN * 60_000) },
    },
    orderBy: { id: 'asc' },
    take: 100,
    select: { id: true },
  })
  let closed = 0
  for (const r of rows) {
    try {
      if ((await closeUnpaidTopup(r.id)) === 'CLOSED') closed++
    } catch (e) {
      console.error('[wallet] 清扫无收款单的充值单失败（下一分钟重试）', r.id, e)
    }
  }
  if (closed) console.warn(`[wallet] 兜底清扫关掉 ${closed} 张没有收款单的充值单`)
  return { checked: rows.length, closed }
}

// ---------------------------------------------------------------------------
// 到账入账（fulfillOrder 翻 PAID 的同一事务里调；附录 B 第 3 条）
// ---------------------------------------------------------------------------

export class TopupCreditError extends Error {
  constructor(message: string) {
    super(`[wallet] ${message}`)
    this.name = 'TopupCreditError'
  }
}

/**
 * 充值格 += 这张收款单（vmqId，要求 state=1、bizType=order、bizId=本单）的实付 reallyPrice（含识别尾差），TOPUP 流水 topup:<orderId>。
 * 不满足就抛错，整个付款事务回滚（fulfillOrder 翻 PAID、Payment 一起撤销；reconcilePaidVmq 宽限期后补做，E45）。
 */
export async function creditInTx(tx: Prisma.TransactionClient, p: { orderId: number; userId: number; vmqId: number }): Promise<{ cents: number; logId: number; topupAfterCents: number }> {
  const v = await tx.vmqOrder.findUnique({ where: { id: p.vmqId }, select: { orderId: true, state: true, bizType: true, bizId: true, reallyPrice: true } })
  if (!v || v.state !== 1 || v.bizType !== 'order' || v.bizId !== p.orderId) {
    throw new TopupCreditError(`充值单 #${p.orderId} 的收款单 #${p.vmqId} 不是本单已到账的收款单`)
  }
  const cents = centsOf(v.reallyPrice)
  if (cents <= 0) throw new TopupCreditError(`收款单 #${p.vmqId} 实付不是正数`)
  const r = await postInTx(tx, {
    userId: p.userId,
    topupDeltaCents: cents,
    type: 'TOPUP',
    bizKey: `topup:${p.orderId}`,
    orderId: p.orderId,
    note: `充值到账（收款单 ${v.orderId}）`,
  })
  return { cents, logId: r.logId, topupAfterCents: r.topupAfterCents }
}

/**
 * 入账之后（事务外、只在赢家调用一次）：可选事件 wallet.topup（默认不推，§7.7）；
 * 同一用户 24 小时内已入账充值合计首次跨过 ¥2,000 时知会 wallet.alert（只标记、不限制，§10.1）。失败只记日志。
 */
export async function afterTopupCredited(orderId: number): Promise<void> {
  try {
    const o = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNo: true, userId: true, amount: true, paidAt: true, user: { select: { email: true, nickname: true } } },
    })
    if (!o) return
    const log = await prisma.balanceLog.findUnique({ where: { bizKey: `topup:${orderId}` }, select: { topupDeltaCents: true } })
    const who = o.user.nickname || o.user.email || `用户#${o.userId}`
    notify('wallet.topup', [
      { label: '充值单', value: o.orderNo },
      { label: '买家', value: who },
      { label: '入账', value: fmtCents(log?.topupDeltaCents ?? centsOf(o.amount)), color: 'info' },
    ], { link: '/admin/wallet?tab=topups' })

    const since = new Date(Date.now() - 24 * 3600_000)
    const agg = await prisma.order.aggregate({
      where: { userId: o.userId, product: { deliveryType: 'TOPUP' }, payStatus: 'PAID', paidAt: { gte: since } },
      _sum: { amount: true },
    })
    const total = centsOf(agg._sum.amount ?? 0)
    const before = total - centsOf(o.amount)
    if (total >= TOPUP_BIG_24H_CENTS && before < TOPUP_BIG_24H_CENTS) {
      notify('wallet.alert', [
        { label: '知会', value: '大额充值（只标记、不限制）', color: 'info' },
        { label: '买家', value: `${who}（#${o.userId}）` },
        { label: '24 小时充值合计', value: `${fmtCents(total)}（按订单金额，不含识别尾差）` },
      ], { link: `/admin/wallet?tab=users`, extraTitle: '大额充值' })
    }
  } catch (e) {
    console.error('[wallet] 充值入账后的知会失败（不影响入账）', orderId, e)
  }
}

// ---------------------------------------------------------------------------
// 买家侧查询
// ---------------------------------------------------------------------------

/** 这个买家是否已同意过当前版本的《余额与充值规则》（有任何一张充值单的 remark 带 terms:<版本>） */
export async function agreedWalletTerms(userId: number, carrierId: number, version: string): Promise<boolean> {
  const n = await prisma.order.count({ where: { userId, productId: carrierId, remark: { contains: `|terms:${version}` } } })
  return n > 0
}

export type TopupState = 'PENDING' | 'CREDITED' | 'CLOSED'

/** GET /api/wallet/topup/[orderNo]：本人、主站的充值单状态与入账额（钱包页 ?topup= 横幅用）。不是本人的 / 不是充值单返回 null */
export async function topupStatusFor(userId: number, orderNo: string): Promise<{ state: TopupState; amountCents: number; creditedCents: number | null; returnTo: string | null } | null> {
  const o = await prisma.order.findFirst({
    where: { orderNo, userId, tenantId: 1, product: { deliveryType: 'TOPUP' } },
    select: { id: true, amount: true, payStatus: true, deliveryStatus: true, remark: true },
  })
  if (!o) return null
  const log = o.payStatus === 'PAID' ? await prisma.balanceLog.findUnique({ where: { bizKey: `topup:${o.id}` }, select: { topupDeltaCents: true } }) : null
  const state: TopupState = o.payStatus === 'PAID' && log ? 'CREDITED' : o.payStatus === 'UNPAID' && o.deliveryStatus === 'CANCELLED' ? 'CLOSED' : 'PENDING'
  return { state, amountCents: centsOf(o.amount), creditedCents: log?.topupDeltaCents ?? null, returnTo: parseTopupRemark(o.remark)?.returnTo ?? null }
}
