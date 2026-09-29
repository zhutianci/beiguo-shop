/**
 * 短信接码 · 取消退款（T15）、售后退款（T16）、成本核算落库（T20）（docs/短信接码-设计.md §2.4、§4.6、§9.1、D3、D4、D20、D39、E33、E42、E43、E55）。
 *
 * 【T15 一个事务，按锁顺序】Order CAS（PAID → REFUNDED / CANCELLED）→ SmsOrder CAS（REFUNDING + refundState NONE → CANCELLED + DONE）
 *   → 支付宝部分核对（ALIPAY 流水 tradeNo 所指收款单的 reallyPrice == alipayPaidCents）→ wallet.hold.refundInTx（预扣 CAPTURED → REFUNDED，
 *   一条 REFUND 流水 refund:<orderId>：余额部分原路、支付宝实收进充值格）→ 写两格退款额。
 *   三道幂等：refundState CAS、预扣 CAS、流水 bizKey 唯一（附录 B 第 2 条，最后一道防线不能去掉）。**载体销量不动**（§2.7 第 4 条）。
 *   订单不再是 PAID、预扣不是 CAPTURED、支付宝部分核对不上 → 不退、转 MANUAL 并告警（E43、§12.2 第 60、109 条）；
 *   其他失败整体回滚、failCount + 1（状态变化时清零），到 10 次推 sms.refund_failed（E33）。
 * 【已取消不计成本利润】CANCELLED 的 chargedMicro / costCents / profitCents 落空（NULL，不是 0）；没码却被扣费的号只写 lossCents（附录 B 第 18 条）。
 * 【T20】成本利润可重算：收码写预估、任何尝试新被标 charged 立即重算、FINISHED / REFUNDED 且全部尝试终态才定稿（costFinal、costAt）。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { notify } from '../notify'
import { inMoneyTx } from '../wallet/ledger'
import { refundInTx, HoldStateError } from '../wallet/hold'
import { centsOf, fmtCents } from '../wallet/buckets'
import { settleCost, isAttemptTerminal, T15_ALERT_FAILS } from './machine'
import { logEvent, logEventQuiet } from './events'
import { smsAlert } from './alert'
import { jnow } from './runtime'

type Tx = Prisma.TransactionClient

/** 前提不满足、必须人工核实（E43）：调用方把 SmsOrder 转 MANUAL */
export class RefundNeedsManual extends Error {
  constructor(public readonly why: 'ORDER_NOT_PAID' | 'HOLD_STATE' | 'ALIPAY_MISMATCH' | 'NO_SMS_ORDER') {
    super(`[jiema] 退款前提不满足：${why}`)
    this.name = 'RefundNeedsManual'
  }
}

/** 别人已经退过（或状态已变）：本次什么都不做 */
class RefundRace extends Error {
  constructor() {
    super('[jiema] 退款 CAS 落空')
    this.name = 'RefundRace'
  }
}

const ATTEMPT_COST_SELECT = { state: true, charged: true, costMicro: true, maxPriceMicro: true, upstreamRefundMicro: true } as const

// ───────────────────────── T20 成本核算落库 ─────────────────────────

/**
 * 按当前状态重算一张单的成本利润并落库（事务里调，或传 prisma）。CANCELLED 只写 lossCents（成本利润保持 NULL）。
 * 已定稿（costFinal=true）的单：重算结果不同（对账翻案、晚到的扣费）照样改数，但不改 costAt（§4.6「已定稿的不改 costAt」）。
 * 返回是否有变化（有变化时记一条 COST 事件）。
 */
export async function recomputeCostInTx(db: Tx | typeof prisma, smsOrderId: number, why: string): Promise<boolean> {
  const o = await db.smsOrder.findUnique({
    where: { id: smsOrderId },
    select: { id: true, state: true, priceCents: true, costFx4: true, chargedMicro: true, costCents: true, profitCents: true, lossCents: true, costFinal: true, costAt: true },
  })
  if (!o) return false
  const atts = await db.smsAttempt.findMany({ where: { smsOrderId }, select: ATTEMPT_COST_SELECT })
  const s = settleCost(o, atts)
  if (o.state === 'CANCELLED') {
    if (s.lossCents === o.lossCents) return false
    await db.smsOrder.update({ where: { id: o.id }, data: { lossCents: s.lossCents } })
    await logEvent(db, { smsOrderId, type: 'LOSS', detail: { lossCents: s.lossCents, why } })
    return true
  }
  // 还没收过码（chargedMicro 从没算过）的非终态单：没有扣费，不写预估（避免 WAITING 的单显示「成本 0」）
  if (o.chargedMicro == null && s.chargedMicro === 0 && !['RECEIVED', 'FINISHED', 'REFUNDED'].includes(o.state)) return false
  const finalNow = s.costFinal
  const same = o.chargedMicro === s.chargedMicro && o.costCents === s.costCents && o.profitCents === s.profitCents && o.costFinal === finalNow
  if (same) return false
  await db.smsOrder.update({
    where: { id: o.id },
    data: {
      chargedMicro: s.chargedMicro,
      costCents: s.costCents,
      profitCents: s.profitCents,
      costFinal: finalNow,
      ...(finalNow && !o.costAt ? { costAt: jnow() } : {}),
    },
  })
  await logEvent(db, { smsOrderId, type: 'COST', detail: { chargedMicro: s.chargedMicro, costCents: s.costCents, profitCents: s.profitCents, final: finalNow, why } })
  return true
}

// ───────────────────────── T17 冻结 ─────────────────────────

/** 任意非终态 → MANUAL（T17）：写 notice、manualAt、alertedAt，推 sms.alert。返回是否本次冻结 */
export async function toManual(smsOrderId: number, why: string, notice = '订单需要人工核实，客服会尽快处理'): Promise<boolean> {
  const now = jnow()
  const r = await prisma.smsOrder.updateMany({
    where: { id: smsOrderId, state: { notIn: ['MANUAL', 'CLOSED', 'FINISHED', 'CANCELLED', 'REFUNDED'] } },
    data: { state: 'MANUAL', version: { increment: 1 }, notice: notice.slice(0, 120), manualAt: now, alertedAt: now, failCount: 0 },
  })
  if (r.count !== 1) return false
  const o = await prisma.smsOrder.findUnique({ where: { id: smsOrderId }, select: { orderId: true, service: true, country: true } })
  const ord = o ? await prisma.order.findUnique({ where: { id: o.orderId }, select: { orderNo: true } }) : null
  await logEventQuiet({ smsOrderId, type: 'MANUAL', detail: { why } })
  smsAlert(`MANUAL:${smsOrderId}`, '接码订单转人工处理', [
    { label: '订单', value: ord?.orderNo ?? `#${smsOrderId}` },
    { label: '组合', value: o ? `${o.service} · ${o.country}` : '—' },
    { label: '原因', value: why.slice(0, 200) },
  ], { link: '/admin/jiema?tab=orders', throttleMs: 0 })
  return true
}

// ───────────────────────── T15 取消退款 ─────────────────────────

/** 支付宝部分核对：ALIPAY 支付流水 tradeNo 所指收款单的 reallyPrice（分）；没有 / 对不上返回 null */
async function alipayPaidOf(tx: Tx, orderId: number): Promise<number | null> {
  const pay = await tx.payment.findFirst({ where: { orderId, payMethod: 'ALIPAY', status: 1 }, select: { tradeNo: true } })
  if (!pay?.tradeNo) return null
  const v = await tx.vmqOrder.findUnique({ where: { orderId: pay.tradeNo }, select: { reallyPrice: true, bizId: true, state: true } })
  if (!v || v.bizId !== orderId || v.state !== 1) return null
  return centsOf(v.reallyPrice)
}

export type RefundOutcome = { done: true; topupCents: number; cashCents: number } | { done: false; why: 'NOT_READY' | 'RACE' | 'MANUAL' | 'ERROR' }

/**
 * T15：REFUNDING → CANCELLED，整单退回余额。前提：所有尝试都 FAILED / CANCELLED、没有任何一个收到过短信（附录 B 第 2 条）。
 * 不满足前提返回 NOT_READY（调用方等尝试收尾）；并发的另一方先做了返回 RACE；需要人工返回 MANUAL（已转 MANUAL 并告警）。
 */
export async function refundCancelled(smsOrderId: number, actor: 'SYSTEM' | 'CRON' | 'BUYER' | 'ADMIN' = 'SYSTEM'): Promise<RefundOutcome> {
  const pre = await prisma.smsOrder.findUnique({ where: { id: smsOrderId }, select: { id: true, orderId: true, userId: true, state: true, refundState: true, refundReason: true, payMode: true, alipayPaidCents: true, failCount: true } })
  if (!pre || pre.state !== 'REFUNDING' || pre.refundState !== 'NONE') return { done: false, why: 'NOT_READY' }
  const atts = await prisma.smsAttempt.findMany({ where: { smsOrderId }, select: { state: true, smsCount: true, codeAt: true } })
  if (atts.some((a) => a.state !== 'FAILED' && a.state !== 'CANCELLED')) return { done: false, why: 'NOT_READY' }
  if (atts.some((a) => a.smsCount > 0 || a.codeAt != null)) return { done: false, why: 'NOT_READY' }
  try {
    const r = await inMoneyTx(async (tx) => {
      const now = jnow()
      const flip = await tx.order.updateMany({ where: { id: pre.orderId, payStatus: 'PAID' }, data: { payStatus: 'REFUNDED', deliveryStatus: 'CANCELLED' } })
      if (flip.count !== 1) throw new RefundNeedsManual('ORDER_NOT_PAID')
      // 一律按事务里现取的尝试算亏损（EXPIRED / 对账翻案的号），成本利润落空
      const costAtts = await tx.smsAttempt.findMany({ where: { smsOrderId }, select: ATTEMPT_COST_SELECT })
      const so = await tx.smsOrder.findUnique({ where: { id: smsOrderId }, select: { priceCents: true, costFx4: true } })
      if (!so) throw new RefundNeedsManual('NO_SMS_ORDER')
      const settle = settleCost({ state: 'CANCELLED', priceCents: so.priceCents, costFx4: so.costFx4 }, costAtts)
      const cas = await tx.smsOrder.updateMany({
        where: { id: smsOrderId, state: 'REFUNDING', refundState: 'NONE' },
        data: {
          state: 'CANCELLED',
          refundState: 'DONE',
          refundedAt: now,
          version: { increment: 1 },
          failCount: 0,
          chargedMicro: null,
          costCents: null,
          profitCents: null,
          costFinal: false,
          lossCents: settle.lossCents,
        },
      })
      if (cas.count !== 1) throw new RefundRace()
      // 支付宝部分核对（D4、§12.2 第 109 条）：payMode 不是 BALANCE 的单，alipayPaidCents 必须等于那张收款单的实付
      let alipayPaid: number | null = pre.payMode === 'BALANCE' ? 0 : pre.alipayPaidCents
      if (pre.payMode !== 'BALANCE') {
        const real = await alipayPaidOf(tx, pre.orderId)
        if (real == null || pre.alipayPaidCents == null || real !== pre.alipayPaidCents) throw new RefundNeedsManual('ALIPAY_MISMATCH')
        alipayPaid = real
      }
      let money
      try {
        money = await refundInTx(tx, { orderId: pre.orderId, userId: pre.userId, alipayPaidCents: alipayPaid, reason: (pre.refundReason ?? 'SMS_CANCEL').slice(0, 24), now })
      } catch (e) {
        if (e instanceof HoldStateError) throw new RefundNeedsManual('HOLD_STATE')
        throw e
      }
      await tx.smsOrder.update({ where: { id: smsOrderId }, data: { refundTopupCents: money.topupCents, refundCashCents: money.cashCents } })
      await logEvent(tx, { smsOrderId, type: 'REFUND', actor, detail: { topupCents: money.topupCents, cashCents: money.cashCents, reason: pre.refundReason, lossCents: settle.lossCents } })
      await logEvent(tx, { smsOrderId, type: 'STATE', actor, detail: { from: 'REFUNDING', to: 'CANCELLED' } })
      return { topupCents: money.topupCents, cashCents: money.cashCents }
    })
    return { done: true, ...r }
  } catch (e) {
    if (e instanceof RefundRace) return { done: false, why: 'RACE' }
    if (e instanceof RefundNeedsManual) {
      await toManual(smsOrderId, `取消退款前提不满足：${e.why}`)
      notify('wallet.alert', [
        { label: '问题', value: `接码单退款前提不满足（${e.why}），已转人工`, color: 'warning' },
        { label: '接码单', value: `#${smsOrderId}` },
      ], { link: '/admin/jiema?tab=orders', extraTitle: '接码退款转人工' })
      return { done: false, why: 'MANUAL' }
    }
    console.error('[jiema] 取消退款事务失败（tick 重试）', smsOrderId, (e as Error)?.message)
    const upd = await prisma.smsOrder.update({ where: { id: smsOrderId }, data: { failCount: { increment: 1 } }, select: { failCount: true } }).catch(() => null)
    await logEventQuiet({ smsOrderId, type: 'REFUND_ERR', detail: { error: String((e as Error)?.message ?? e).slice(0, 300), fails: upd?.failCount ?? null } })
    if (upd && upd.failCount >= T15_ALERT_FAILS && upd.failCount % T15_ALERT_FAILS === 0) {
      smsAlert(`REFUND_FAILED:${smsOrderId}`, '接码退款连续失败', [
        { label: '接码单', value: `#${smsOrderId}` },
        { label: '连续失败', value: String(upd.failCount) },
        { label: '最近错误', value: String((e as Error)?.message ?? e).slice(0, 200) },
      ], { event: 'sms.refund_failed', throttleMs: 0 })
    }
    return { done: false, why: 'ERROR' }
  }
}

// ───────────────────────── T16 售后退款（管理员） ─────────────────────────

/**
 * T16：RECEIVED / FINISHED → REFUNDED（管理员售后，整单原路退回余额，成本照计、利润 = −成本）。
 * 还开着的号码由调用方先放掉 / 完成（engine.adminRefund）；这里只做钱与状态（同 T15 的锁顺序与三道幂等）。
 */
export async function refundAfterSale(smsOrderId: number, adminId: number, reason: string): Promise<RefundOutcome> {
  const pre = await prisma.smsOrder.findUnique({ where: { id: smsOrderId }, select: { id: true, orderId: true, userId: true, state: true, refundState: true, payMode: true, alipayPaidCents: true, costAt: true } })
  if (!pre || !['RECEIVED', 'FINISHED'].includes(pre.state) || pre.refundState !== 'NONE') return { done: false, why: 'NOT_READY' }
  try {
    const r = await inMoneyTx(async (tx) => {
      const now = jnow()
      const flip = await tx.order.updateMany({ where: { id: pre.orderId, payStatus: 'PAID' }, data: { payStatus: 'REFUNDED', deliveryStatus: 'CANCELLED' } })
      if (flip.count !== 1) throw new RefundNeedsManual('ORDER_NOT_PAID')
      const cas = await tx.smsOrder.updateMany({
        where: { id: smsOrderId, state: pre.state, refundState: 'NONE' },
        data: { state: 'REFUNDED', refundState: 'DONE', refundReason: reason.slice(0, 24), refundedAt: now, refundBy: adminId, version: { increment: 1 }, failCount: 0 },
      })
      if (cas.count !== 1) throw new RefundRace()
      let alipayPaid: number | null = pre.payMode === 'BALANCE' ? 0 : pre.alipayPaidCents
      if (pre.payMode !== 'BALANCE') {
        const real = await alipayPaidOf(tx, pre.orderId)
        if (real == null || pre.alipayPaidCents == null || real !== pre.alipayPaidCents) throw new RefundNeedsManual('ALIPAY_MISMATCH')
        alipayPaid = real
      }
      let money
      try {
        money = await refundInTx(tx, { orderId: pre.orderId, userId: pre.userId, alipayPaidCents: alipayPaid, reason: 'COMPLAINT', now })
      } catch (e) {
        if (e instanceof HoldStateError) throw new RefundNeedsManual('HOLD_STATE')
        throw e
      }
      await tx.smsOrder.update({ where: { id: smsOrderId }, data: { refundTopupCents: money.topupCents, refundCashCents: money.cashCents } })
      await recomputeCostInTx(tx, smsOrderId, 'T16')
      await logEvent(tx, { smsOrderId, type: 'REFUND', actor: 'ADMIN', actorId: adminId, detail: { topupCents: money.topupCents, cashCents: money.cashCents, reason, afterSale: true } })
      await logEvent(tx, { smsOrderId, type: 'STATE', actor: 'ADMIN', actorId: adminId, detail: { from: pre.state, to: 'REFUNDED' } })
      return { topupCents: money.topupCents, cashCents: money.cashCents }
    })
    return { done: true, ...r }
  } catch (e) {
    if (e instanceof RefundRace) return { done: false, why: 'RACE' }
    if (e instanceof RefundNeedsManual) {
      await toManual(smsOrderId, `售后退款前提不满足：${e.why}`)
      return { done: false, why: 'MANUAL' }
    }
    throw e
  }
}

/** 退款金额的买家文案（「实付 ¥1.72 已全部退回你的余额：充值余额 +¥1.22 · 返现余额 +¥0.50」） */
export function refundLine(topupCents: number, cashCents: number): string {
  const parts = [topupCents > 0 ? `充值余额 +${fmtCents(topupCents)}` : null, cashCents > 0 ? `返现余额 +${fmtCents(cashCents)}` : null].filter(Boolean)
  return parts.join(' · ')
}

export { isAttemptTerminal }
