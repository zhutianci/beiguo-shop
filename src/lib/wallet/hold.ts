/**
 * 余额预扣（docs/短信接码-设计.md D33、§2.7 的 H1–H4、附录 B 第 16、17 条）。balance_holds 的写入只在本文件。
 *
 *   H1 无 → HELD      holdInTx     接码下单事务（调用方已先锁用户行）
 *   H2 HELD → CAPTURED captureInTx  fulfillOrder 翻 PAID 的同一事务
 *   H3 HELD → RELEASED releaseInTx  「订单 UNPAID → 取消」的同一事务，且这张订单没有 state 0/1 的收款单
 *   H4 CAPTURED → REFUNDED refundInTx 接码取消 / 售后退款的同一事务
 *
 * 【全部要求调用方传入事务】预扣状态 CAS、两格加减、流水 bizKey 必须和订单的那一步在同一个事务里，
 * 否则就会出现「钱到了、预扣却退了」或「单关了、余额还扣着」（R9）。
 * 【只调 ledger.postInTx 动余额】本文件不写 UPDATE users——postInTx 自己会扣，两处都扣就是双扣。
 * 【锁顺序】收款单 → 订单 → 接码单 → 尝试 → 预扣 → 用户：本文件先锁预扣行，最后才由 postInTx 碰用户行。
 * 【RELEASED 是终态】预扣金额建立后不改；后台不提供「手工释放」，只能「关单并退回预扣」。
 *
 * 读 wallet_config？不读：确认、释放、退款在任何配置状态下都必须能跑（附录 B 第 9 条）。
 * 本文件不 import lib/vmq、lib/jiema（规则 17）：收款单只按表查（vmq_orders），不调 vmq 的函数。
 */
import { Prisma } from '@prisma/client'
import { postInTx } from './ledger'
import { splitDebit, splitRefund, centsOf } from './buckets'

export type HoldState = 'HELD' | 'CAPTURED' | 'RELEASED' | 'REFUNDED'

export interface HoldRow {
  id: number
  orderId: number
  userId: number
  topupCents: number
  cashCents: number
  orderCents: number
  state: HoldState
}

/** 预扣行不在期望的状态（被释放了、被人工改过库）：抛错回滚并告警，绝不「补扣」（E44） */
export class HoldStateError extends Error {
  constructor(
    public readonly orderId: number,
    public readonly actual: string | null,
    public readonly expected: HoldState,
  ) {
    super(`[wallet] 订单 #${orderId} 的预扣状态是 ${actual ?? '（无）'}，期望 ${expected}`)
    this.name = 'HoldStateError'
  }
}

/** 余额两格都为 0，没有可预扣的（由下单接口决定改成纯支付宝还是 409） */
export class NothingToHold extends Error {
  constructor() {
    super('[wallet] 可用余额为 0，没有可预扣的金额')
    this.name = 'NothingToHold'
  }
}

/** 在事务里锁住并读出一张订单的预扣行（SELECT … FOR UPDATE）；没有返回 null */
export async function lockHoldInTx(tx: Prisma.TransactionClient, orderId: number): Promise<HoldRow | null> {
  const rows = await tx.$queryRaw<
    { id: number; order_id: number; user_id: number; topup_cents: number; cash_cents: number; order_cents: number; state: string }[]
  >`SELECT id, order_id, user_id, topup_cents, cash_cents, order_cents, state FROM balance_holds WHERE order_id = ${orderId} FOR UPDATE`
  const r = rows[0]
  if (!r) return null
  return {
    id: Number(r.id),
    orderId: Number(r.order_id),
    userId: Number(r.user_id),
    topupCents: Number(r.topup_cents),
    cashCents: Number(r.cash_cents),
    orderCents: Number(r.order_cents),
    state: r.state as HoldState,
  }
}

/**
 * H1：建立预扣。**调用方的事务必须已经先锁住用户行**（下单事务第一步 SELECT … FROM users FOR UPDATE，§2.5），
 * 这里再锁一次是无害的重入。拆分按当时两格余额：先充值格、再返现格（D32），最多扣到订单应付为止。
 *   maxCents：最多预扣多少（默认 = orderCents，即「能扣多少扣多少」）。
 * 返回预扣两格与剩给支付宝的差额。两格都为 0 抛 NothingToHold；同一订单第二次抛 P2002（order_id 唯一）。
 */
export async function holdInTx(
  tx: Prisma.TransactionClient,
  p: { orderId: number; userId: number; orderCents: number; maxCents?: number; now?: Date },
): Promise<HoldRow & { restCents: number }> {
  if (!Number.isSafeInteger(p.orderCents) || p.orderCents <= 0) throw new Error('[wallet] 预扣的订单应付必须是正整数分')
  const cap = p.maxCents ?? p.orderCents
  if (!Number.isSafeInteger(cap) || cap <= 0 || cap > p.orderCents) throw new Error('[wallet] 预扣上限不合法')
  const u = await tx.$queryRaw<{ balance: unknown; topup_cents: number }[]>`SELECT balance, topup_cents FROM users WHERE id = ${p.userId} FOR UPDATE`
  if (!u[0]) throw new Error(`[wallet] 用户 #${p.userId} 不存在`)
  const split = splitDebit(Number(u[0].topup_cents), centsOf(u[0].balance), cap)
  if (split.topupCents + split.cashCents === 0) throw new NothingToHold()
  const row = await tx.balanceHold.create({
    data: {
      orderId: p.orderId,
      userId: p.userId,
      topupCents: split.topupCents,
      cashCents: split.cashCents,
      orderCents: p.orderCents,
      state: 'HELD',
      heldAt: p.now ?? new Date(),
    },
  })
  await postInTx(tx, {
    userId: p.userId,
    topupDeltaCents: -split.topupCents,
    cashDeltaCents: -split.cashCents,
    type: 'HOLD',
    bizKey: `hold:${p.orderId}`,
    orderId: p.orderId,
  })
  return {
    id: row.id,
    orderId: row.orderId,
    userId: row.userId,
    topupCents: row.topupCents,
    cashCents: row.cashCents,
    orderCents: row.orderCents,
    state: 'HELD',
    restCents: p.orderCents - split.topupCents - split.cashCents,
  }
}

/**
 * H2：确认（fulfillOrder 翻 PAID 的同一事务里、订单 CAS 成功之后调）。
 *   没有预扣行 → 返回 null（纯支付宝单，按原逻辑）；
 *   有但不是 HELD → 抛 HoldStateError（整个付款事务回滚，E44）；
 *   mustCoverCents（余额付清 via=BALANCE 时 = 订单应付）：预扣两格之和必须覆盖它，否则同样抛错。
 */
export async function captureInTx(
  tx: Prisma.TransactionClient,
  orderId: number,
  opts?: { mustCoverCents?: number; now?: Date },
): Promise<HoldRow | null> {
  const h = await lockHoldInTx(tx, orderId)
  if (!h) {
    if (opts?.mustCoverCents != null) throw new HoldStateError(orderId, null, 'HELD')
    return null
  }
  if (h.state !== 'HELD') throw new HoldStateError(orderId, h.state, 'HELD')
  if (opts?.mustCoverCents != null && h.topupCents + h.cashCents < opts.mustCoverCents) {
    throw new Error(`[wallet] 订单 #${orderId} 的预扣 ${h.topupCents + h.cashCents} 分不够付 ${opts.mustCoverCents} 分`)
  }
  const r = await tx.balanceHold.updateMany({ where: { orderId, state: 'HELD' }, data: { state: 'CAPTURED', capturedAt: opts?.now ?? new Date() } })
  if (r.count !== 1) throw new HoldStateError(orderId, 'CHANGED', 'HELD')
  return { ...h, state: 'CAPTURED' }
}

export type ReleaseOutcome =
  | { released: true; hold: HoldRow }
  | { released: false; why: 'NO_HOLD' | 'NOT_HELD' | 'ORDER_NOT_CLOSED' | 'HAS_PAYMENT' }

/**
 * H3：释放（「订单 UNPAID → 取消」的同一事务里、订单已置 CANCELLED 之后调）。
 * 前提全部在事务里核对，任何一条不满足就什么都不做（返回 released:false）——没有预扣的订单是空操作：
 *   ① 预扣行存在且是 HELD；② 订单确实是 UNPAID + CANCELLED；③ 这张订单没有 state 0 或 1 的收款单
 *   （有 0 说明还能付，调用方应先作废；有 1 说明钱到了、履约还没做，不释放，等 reconcilePaidVmq 补履约）。
 * 满足时：预扣 CAS HELD→RELEASED（写 reason）→ postInTx 两格原路加回、RELEASE 流水（release:<orderId>）。
 */
export async function releaseInTx(
  tx: Prisma.TransactionClient,
  orderId: number,
  opts: { reason: string; now?: Date },
): Promise<ReleaseOutcome> {
  const h = await lockHoldInTx(tx, orderId)
  if (!h) return { released: false, why: 'NO_HOLD' }
  if (h.state !== 'HELD') return { released: false, why: 'NOT_HELD' }
  const o = await tx.order.findUnique({ where: { id: orderId }, select: { payStatus: true, deliveryStatus: true } })
  if (!o || o.payStatus !== 'UNPAID' || o.deliveryStatus !== 'CANCELLED') return { released: false, why: 'ORDER_NOT_CLOSED' }
  const live = await tx.vmqOrder.count({ where: { bizType: 'order', bizId: orderId, state: { in: [0, 1] } } })
  if (live > 0) return { released: false, why: 'HAS_PAYMENT' }
  const r = await tx.balanceHold.updateMany({
    where: { orderId, state: 'HELD' },
    data: { state: 'RELEASED', reason: opts.reason.slice(0, 24), releasedAt: opts.now ?? new Date() },
  })
  if (r.count !== 1) return { released: false, why: 'NOT_HELD' }
  if (h.topupCents + h.cashCents > 0) {
    await postInTx(tx, {
      userId: h.userId,
      topupDeltaCents: h.topupCents,
      cashDeltaCents: h.cashCents,
      type: 'RELEASE',
      bizKey: `release:${orderId}`,
      orderId,
    })
  }
  return { released: true, hold: { ...h, state: 'RELEASED' } }
}

/**
 * H4：退款（接码取消 T15 / 售后 T16 的同一事务里调；订单与接码单的 CAS 由调用方先做）。
 *   有预扣行：必须是 CAPTURED（否则抛 HoldStateError，调用方转 MANUAL），CAS 成 REFUNDED；
 *   没有预扣行（纯支付宝单）：只退支付宝实收；userId 此时由调用方给。
 * 一条 REFUND 流水（refund:<orderId>）：返现格 + 预扣返现部分；充值格 + 预扣充值部分 + 支付宝实收（含尾差，D4）。
 */
export async function refundInTx(
  tx: Prisma.TransactionClient,
  p: { orderId: number; userId: number; alipayPaidCents: number | null; reason: string; now?: Date },
): Promise<{ topupCents: number; cashCents: number; totalCents: number; hold: HoldRow | null }> {
  const h = await lockHoldInTx(tx, p.orderId)
  if (h) {
    if (h.state !== 'CAPTURED') throw new HoldStateError(p.orderId, h.state, 'CAPTURED')
    if (h.userId !== p.userId) throw new Error(`[wallet] 订单 #${p.orderId} 的预扣属于用户 #${h.userId}，不是 #${p.userId}`)
    const r = await tx.balanceHold.updateMany({
      where: { orderId: p.orderId, state: 'CAPTURED' },
      data: { state: 'REFUNDED', reason: p.reason.slice(0, 24), refundedAt: p.now ?? new Date() },
    })
    if (r.count !== 1) throw new HoldStateError(p.orderId, 'CHANGED', 'CAPTURED')
  }
  const split = splitRefund(h ? { topupCents: h.topupCents, cashCents: h.cashCents } : null, p.alipayPaidCents)
  if (split.totalCents <= 0) throw new Error(`[wallet] 订单 #${p.orderId} 没有可退的金额`)
  await postInTx(tx, {
    userId: p.userId,
    topupDeltaCents: split.topupCents,
    cashDeltaCents: split.cashCents,
    type: 'REFUND',
    bizKey: `refund:${p.orderId}`,
    orderId: p.orderId,
  })
  return { ...split, hold: h ? { ...h, state: 'REFUNDED' } : null }
}

/** 一张订单的预扣合计（HELD + CAPTURED，分）。B1 的 payableCents 与收银台 balancePart 用 */
export async function heldCentsOf(tx: Prisma.TransactionClient, orderId: number, states: HoldState[] = ['HELD']): Promise<number> {
  const h = await tx.balanceHold.findUnique({ where: { orderId }, select: { topupCents: true, cashCents: true, state: true } })
  if (!h || !states.includes(h.state as HoldState)) return 0
  return h.topupCents + h.cashCents
}
