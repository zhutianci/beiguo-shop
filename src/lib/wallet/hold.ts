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
 * 【不对不存在的预扣行加锁】lockHoldInTx 先普通读，行存在才按主键 FOR UPDATE。对纯支付宝单（没有预扣行）直接
 *   `SELECT … WHERE order_id=? FOR UPDATE`，在 RR 下会给唯一索引的间隙（新订单多半落在最高间隙 → supremum）加锁：
 *   全站新建预扣都要排队，而且和同一买家的下单事务（先锁用户行、再插预扣行）成环死锁（评审复现过）。
 *   普通读够用的前提：预扣行只由下单事务为**它自己新建的**订单插入，与订单行同一事务提交——调用方能看到订单，
 *   就能看到它的预扣行。**调用方约束**：调 capture / release / refund 的事务，不得在这张订单下单提交之前就已开启
 *   并做过一致性读（现有与计划中的调用方——fulfillOrder、closeExpired、tick、售后——都在订单创建之后才开事务）。
 * 【释放的前提不满足就抛错】releaseInTx 在「订单已由调用方取消」的事务里调用：前提不满足（订单没关、还有在途收款单、
 *   预扣已确认 / 已退款）一律抛错，让关单一起回滚、下一轮重试或转人工，绝不留下「单关了、预扣还 HELD」（D33、R9）。
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

/**
 * 释放的前提不满足（H3）：订单没有被调用方置成 UNPAID + CANCELLED，或者这张订单还有 state 0 / 1 的收款单。
 * 调用方的事务必须整体回滚（关单与释放同进同退），下一轮重试或转人工。
 */
export class HoldReleaseBlocked extends Error {
  constructor(
    public readonly orderId: number,
    public readonly why: 'ORDER_NOT_CLOSED' | 'HAS_PAYMENT',
  ) {
    super(
      why === 'HAS_PAYMENT'
        ? `[wallet] 订单 #${orderId} 还有待付款 / 已到账的收款单，不能释放预扣（先作废 state 0 的收款单；state 1 等补履约）`
        : `[wallet] 订单 #${orderId} 不是 UNPAID + CANCELLED，不能释放预扣（释放必须和关单在同一事务里）`,
    )
    this.name = 'HoldReleaseBlocked'
  }
}

/**
 * 在事务里锁住并读出一张订单的预扣行；没有返回 null。
 * 先普通读确认行存在，存在才按主键 `SELECT … FOR UPDATE`（只加记录锁）；不存在就直接返回 null，
 * **不对不存在的键加锁**（间隙锁会挡住全站的新预扣、并与下单事务成环死锁，见文件头「不对不存在的预扣行加锁」）。
 */
export async function lockHoldInTx(tx: Prisma.TransactionClient, orderId: number): Promise<HoldRow | null> {
  const found = await tx.balanceHold.findUnique({ where: { orderId }, select: { id: true } })
  if (!found) return null
  const rows = await tx.$queryRaw<
    { id: number; order_id: number; user_id: number; topup_cents: number; cash_cents: number; order_cents: number; state: string }[]
  >`SELECT id, order_id, user_id, topup_cents, cash_cents, order_cents, state FROM balance_holds WHERE id = ${found.id} FOR UPDATE`
  const r = rows[0]
  if (!r || Number(r.order_id) !== orderId) throw new Error(`[wallet] 订单 #${orderId} 的预扣行 #${found.id} 读不回来`)
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
  /** NO_HOLD：纯支付宝单，空操作；ALREADY_RELEASED：同一张单已释放过（重放），空操作。两种都可以照常提交关单 */
  | { released: false; why: 'NO_HOLD' | 'ALREADY_RELEASED' }

/**
 * H3：释放（「订单 UNPAID → 取消」的同一事务里、订单已置 CANCELLED 之后调）。
 * 没有预扣行 → 空操作（NO_HOLD）；预扣已是 RELEASED → 空操作（ALREADY_RELEASED，重放）。其余前提不满足一律**抛错**，
 * 让调用方的关单一起回滚（绝不留下「单关了、预扣还 HELD」）：
 *   ① 预扣是 CAPTURED / REFUNDED → HoldStateError（钱已确认，订单不该是未付款关闭）；
 *   ② 订单不是 UNPAID + CANCELLED → HoldReleaseBlocked('ORDER_NOT_CLOSED')；
 *   ③ 这张订单还有 state 0 或 1 的收款单 → HoldReleaseBlocked('HAS_PAYMENT')（有 0 说明还能付，调用方应先作废；
 *      有 1 说明钱到了、履约还没做，不释放，等 reconcilePaidVmq 补履约）。收款单用**加锁读**（FOR SHARE）查：
 *      普通 count 是快照读，看不到本事务快照之后别的请求提交的新收款单。按锁顺序，调用方应已先锁住（并作废）
 *      这张订单的收款单，这里的加锁读对它们是重入。
 * 满足时：预扣 CAS HELD→RELEASED（写 reason）→ postInTx 两格原路加回、RELEASE 流水（release:<orderId>）。
 */
export async function releaseInTx(
  tx: Prisma.TransactionClient,
  orderId: number,
  opts: { reason: string; now?: Date },
): Promise<ReleaseOutcome> {
  const h = await lockHoldInTx(tx, orderId)
  if (!h) return { released: false, why: 'NO_HOLD' }
  if (h.state === 'RELEASED') return { released: false, why: 'ALREADY_RELEASED' }
  if (h.state !== 'HELD') throw new HoldStateError(orderId, h.state, 'HELD')
  const o = await tx.order.findUnique({ where: { id: orderId }, select: { payStatus: true, deliveryStatus: true } })
  if (!o || o.payStatus !== 'UNPAID' || o.deliveryStatus !== 'CANCELLED') throw new HoldReleaseBlocked(orderId, 'ORDER_NOT_CLOSED')
  const live = await tx.$queryRaw<{ id: number }[]>`
    SELECT id FROM vmq_orders WHERE biz_type = 'order' AND biz_id = ${orderId} AND state IN (0, 1) FOR SHARE`
  if (live.length > 0) throw new HoldReleaseBlocked(orderId, 'HAS_PAYMENT')
  const r = await tx.balanceHold.updateMany({
    where: { orderId, state: 'HELD' },
    data: { state: 'RELEASED', reason: opts.reason.slice(0, 24), releasedAt: opts.now ?? new Date() },
  })
  if (r.count !== 1) throw new HoldStateError(orderId, 'CHANGED', 'HELD')
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
