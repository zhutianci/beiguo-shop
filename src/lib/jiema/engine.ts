/**
 * 短信接码 · 状态机推进（docs/短信接码-设计.md 第 2 章 T1–T22、§3 E1–E65、§3.1、§6.5、附录 B）。
 *
 * 订单级迁移一律 `updateMany({ where: { id, state: 旧, (version) }, data: { state: 新, version + 1 } })`（CAS，count≠1 就不往下写）；
 * 尝试级迁移一律 `updateMany({ where: { id, state: 旧 } })`；上游调用前先 CAS 占住 nextCheckAt / checkedAt（§2.3）。
 * 取号意图：锁 SmsOrder → 核对没有在途取号 → attemptCount + 1 → 插 REQUESTING 行，**同一个事务**提交之后才调上游；UNKNOWN 绝不重取（附录 B 第 1 条）。
 * 换号：先取新号 → CAS 切换 → 旧尝试先改 RELEASING → 再调取消（附录 B 第 4 条）。
 * 查询、放号、完成类调用只按 §3.1 判定（parse.judge*），其余一律「没有信息」（附录 B 第 22 条）。
 * 钱只在 refund.ts（T15 / T16）与 vmq.fulfillCarrierOrder（T2 / T3）里动；本文件的关单（T4 / T18）调 wallet.hold.releaseInTx，同一事务。
 *
 * 依赖方向（§6.1、规则 17）：本文件可以静态 import lib/vmq（fulfillOrder、invalidatePendingVmq、recordCarrierPaid）；
 * vmq.ts 对本文件只用动态 import（onPaid）。不 import 旧 herosms.ts / sms.ts。
 */
import crypto from 'crypto'
import { Prisma, type SmsAttempt, type SmsOrder } from '@prisma/client'
import { prisma } from '../db'
import { fulfillOrder, invalidatePendingVmq, recordCarrierPaid } from '../vmq'
import { releaseInTx, HoldReleaseBlocked, HoldStateError, lockHoldInTx } from '../wallet/hold'
import { inMoneyTx } from '../wallet/ledger'
import * as up from './upstream'
import {
  classifyAcquire,
  judgeRelease,
  judgeFinish,
  judgeGetStatus,
  judgeHistory,
  judgeFromActiveList,
  noinfoVerdict,
  type Up,
  type NumberData,
  type OtpItem,
  type Verdict,
  type ActiveItem,
} from './parse'
import {
  ATTEMPT_TERMINAL,
  isAttemptTerminal,
  endsAtFrom,
  canCancelAtFrom,
  waitUntilFor,
  finishDueAt,
  acquireDelaySec,
  operatorForTry,
  REQUESTING_STUCK_SEC,
  UNKNOWN_MANUAL_SEC,
  BLOCKED_REFUND_SEC,
  ASSUMED_AFTER_END_SEC,
  FINISH_HISTORY_AFTER_END_SEC,
  READY_EXPIRE_SEC,
  QUOTE_NO_VMQ_CLOSE_SEC,
  QUOTE_VMQ_CLOSE_SEC,
  T19_AFTER_SEC,
  T19_MANUAL_FAILS,
  MANUAL_REALERT_SEC,
  REJECTED_BACKOFF_SEC,
  LAZY_ADVANCE_SEC,
  STATUS_CHECK_SEC,
  HISTORY_CHECK_SEC,
  STUCK_MID_SEC,
  CALL_LEASE_SEC,
  HEARTBEAT_STALE_SEC,
  paidTarget,
} from './machine'
import { logEvent, logEventQuiet, type EvActor } from './events'
import { smsAlert } from './alert'
import { refundCancelled, refundAfterSale, recomputeCostInTx, toManual } from './refund'
import { holdForBan, holdForThreads, holdForUnavailable, holdForKey, holdForCurrency, checkExpiredChargeCombo, evaluateBreaker, periodicMonitors } from './holds'
import { acquireBlock, threadsLimited } from './sellable'
import { refreshBalance, onUpstreamNoBalance, recheckBalanceQuiet, checkLowBalance } from './upbalance'
import { markOffersDirty } from './catalog'
import { jnow, rt, noteActiveCount, periodicDue } from './runtime'
import { acquireLock, releaseLock, renewLock } from '../marketing/lock'
import { scanUnknown } from './claim'

type Tx = Prisma.TransactionClient
const RC = { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 5_000, timeout: 10_000 }
const S = 1000
const later = (sec: number, from: Date = jnow()) => new Date(from.getTime() + sec * S)

export const SMS_RUNTIME_KEY = 'sms_runtime'

/** 换号失败的统一提示（T10 总则）；WRONG_MAX_PRICE 用 §4.5 的说法 */
const REPLACE_FAIL_NOTICE = '暂时没有新号码，原号码继续有效，可以稍后再换，或者取消（整单退回余额）'
const REPLACE_PRICE_NOTICE = '当前没有原价以内的新号码，可以稍后再换，或者取消（整单退回余额）'

// ───────────────────────── 读 ─────────────────────────

async function loadOrder(id: number): Promise<SmsOrder | null> {
  return prisma.smsOrder.findUnique({ where: { id } })
}

async function loadAttempts(smsOrderId: number): Promise<SmsAttempt[]> {
  return prisma.smsAttempt.findMany({ where: { smsOrderId }, orderBy: { seq: 'asc' } })
}

const hasCode = (a: Pick<SmsAttempt, 'smsCount' | 'codeAt' | 'state'>) => a.smsCount > 0 || a.codeAt != null || a.state === 'RECEIVED' || a.state === 'FINISHED'

// ───────────────────────── 订单级迁移（CAS） ─────────────────────────

/** 订单级 CAS：state（与可选的 version）对得上才写，count≠1 返回 false */
async function casOrder(db: Tx | typeof prisma, so: { id: number }, from: string | string[], data: Prisma.SmsOrderUpdateManyMutationInput, version?: number): Promise<boolean> {
  const r = await db.smsOrder.updateMany({
    where: { id: so.id, state: Array.isArray(from) ? { in: from } : from, ...(version != null ? { version } : {}) },
    data: { ...data, version: { increment: 1 } },
  })
  return r.count === 1
}

/** T9 / T6 / T21 / 取消确认：→ REFUNDING（记 refundReason），随后能退就立刻 T15 */
async function toRefunding(so: SmsOrder, from: string, reason: string, actor: EvActor, version?: number): Promise<boolean> {
  const ok = await casOrder(prisma, so, from, { state: 'REFUNDING', refundReason: reason.slice(0, 24), failCount: 0, blockedSince: null }, version)
  if (!ok) return false
  await logEventQuiet({ smsOrderId: so.id, type: 'STATE', actor, detail: { from, to: 'REFUNDING', reason } })
  await refundCancelled(so.id, actor === 'BUYER' ? 'BUYER' : 'SYSTEM')
  return true
}

// ───────────────────────── 取号意图（§2.3 第 3 条，附录 B 第 1 条） ─────────────────────────

/**
 * 一个事务：锁 SmsOrder → 核对状态仍是 expectState、没有任何 REQUESTING / UNKNOWN 尝试 → attemptCount + 1 → 插 REQUESTING 行。
 * 提交之后才调上游。返回新尝试；前提不满足返回 null（插入失败说明上游没有被调用过）。
 */
async function insertIntent(so: SmsOrder, expectState: 'ACQUIRING' | 'REPLACING', p: { reason: 'FIRST' | 'RETRY' | 'REPLACE'; operator: string | null }): Promise<SmsAttempt | null> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ state: string; attempt_count: number; current_attempt_id: number | null }[]>`SELECT state, attempt_count, current_attempt_id FROM sms_orders WHERE id = ${so.id} FOR UPDATE`
    if (!rows[0] || rows[0].state !== expectState) return null
    // 在途取号（REQUESTING / UNKNOWN）之外，还要挡住「已经取到、订单还没来得及推进」的号：首次取号时任何活着的号，
    // 换号时当前号以外的 ACTIVE（新号刚写成 ACTIVE、CAS 切换还没做）——否则并发的另一方会在这个空隙里再买一个（§2.3 第 3 条、第 79 条）
    const cur = rows[0].current_attempt_id == null ? null : Number(rows[0].current_attempt_id)
    const busy = await tx.smsAttempt.count({
      where:
        expectState === 'ACQUIRING'
          ? { smsOrderId: so.id, state: { in: ['REQUESTING', 'UNKNOWN', 'ACTIVE', 'RECEIVED'] } }
          : { smsOrderId: so.id, OR: [{ state: { in: ['REQUESTING', 'UNKNOWN'] } }, { state: 'ACTIVE', ...(cur != null ? { id: { not: cur } } : {}) }] },
    })
    if (busy > 0) return null
    const seq = Number(rows[0].attempt_count) + 1
    await tx.smsOrder.update({ where: { id: so.id }, data: { attemptCount: seq } })
    const att = await tx.smsAttempt.create({
      data: {
        smsOrderId: so.id,
        seq,
        reason: p.reason,
        state: 'REQUESTING',
        service: so.service,
        country: so.country,
        operator: p.operator,
        maxPriceMicro: so.capMicro,
        requestedAt: jnow(),
      },
    })
    await logEvent(tx, { smsOrderId: so.id, attemptId: att.id, type: p.reason === 'REPLACE' ? 'REPLACE_REQ' : 'ACQ_REQ', detail: { seq, operator: p.operator } })
    return att
  }, RC)
}

// ───────────────────────── 取号结果（E1–E9、E56、E58） ─────────────────────────

/** 取号成功时写尝试行（E8：写库失败在内存里重试 2 次，间隔 200ms；仍失败就放弃，60 秒后由扫描器按 UNKNOWN 认领） */
async function writeActive(att: SmsAttempt, data: NumberData, sentAt: number | undefined, raw: string, longWaitOk: boolean, currency: boolean): Promise<SmsAttempt | null> {
  const now = jnow()
  const endsAt = endsAtFrom(data.activationEndTime, now)
  const canCancelAt = canCancelAtFrom(now)
  const waitUntil = waitUntilFor({ startAt: now, canCancelAt, endsAt, longWaitOk })
  for (let i = 0; i < 3; i++) {
    try {
      const r = await prisma.smsAttempt.updateMany({
        where: { id: att.id, state: { in: ['REQUESTING', 'UNKNOWN'] } },
        data: {
          state: 'ACTIVE',
          activationId: data.activationId,
          phone: data.phone.slice(0, 24),
          dialCode: data.dialCode ? data.dialCode.slice(0, 6) : null,
          operatorActual: data.operator ? data.operator.slice(0, 40) : null,
          costMicro: data.costMicro,
          respondedAt: now,
          dispatchedAt: sentAt != null ? new Date(sentAt + rt().clockOffsetMs) : null,
          canCancelAt,
          endsAt,
          waitUntil,
          canGetAnotherSms: data.canGetAnotherSms,
          errorCode: currency ? 'CURRENCY' : null,
          raw,
        },
      })
      if (r.count !== 1) {
        console.error('[jiema] 取号成功但尝试已不在 REQUESTING / UNKNOWN（这个号将由扫描器列为未关联激活）', att.id, data.activationId)
        return null
      }
      return prisma.smsAttempt.findUnique({ where: { id: att.id } })
    } catch (e) {
      console.error(`[jiema] 取号成功、落库失败（第 ${i + 1} 次）`, att.id, data.activationId, (e as Error)?.message)
      if (i < 2) await new Promise((r) => setTimeout(r, 200))
    }
  }
  return null
}

async function failAttempt(att: SmsAttempt, code: string, raw: string): Promise<void> {
  const now = jnow()
  await prisma.smsAttempt.updateMany({ where: { id: att.id, state: { in: ['REQUESTING', 'UNKNOWN'] } }, data: { state: 'FAILED', errorCode: code.slice(0, 40), respondedAt: now, closedAt: now, raw } })
  await logEventQuiet({ smsOrderId: att.smsOrderId, attemptId: att.id, type: 'ACQ_ERR', detail: { code } })
}

// 仅供 itest（§12.2 第 27 条）：取号成功之后、写库之前注入「落库失败」
let writeActiveFaultForTest: (() => void) | null = null
export function setWriteActiveFaultForTest(fn: (() => void) | null): void {
  writeActiveFaultForTest = fn
}

/**
 * 处理一次取号的结果。mode=FIRST：首次取号（ACQUIRING）；REPLACE：换号（REPLACING，T10 总则：任何失败都保留旧号、回 WAITING、不扣次数）。
 * 返回结果类别（给调用方拼提示）。
 */
async function applyAcquireOutcome(so: SmsOrder, att: SmsAttempt, r: Up<NumberData>, mode: 'FIRST' | 'REPLACE'): Promise<string> {
  const cls = classifyAcquire(r)
  const raw = r.raw
  if ((cls.c === 'ACTIVE' || cls.c === 'CURRENCY') && cls.data) {
    const currency = cls.c === 'CURRENCY'
    let fresh: SmsAttempt | null = null
    if (writeActiveFaultForTest) {
      try {
        writeActiveFaultForTest()
      } catch {
        console.error('[jiema] （测试注入）取号成功、落库失败', att.id)
        return 'WRITE_FAILED'
      }
    }
    fresh = await writeActive(att, cls.data, r.sentAt, raw, so.longWaitOk, currency)
    void refreshBalance().catch(() => false) // E26：每次取号结果回来都刷新一次余额缓存
    if (currency) await holdForCurrency({ currency: cls.currency, where: `getNumberV2 attempt#${att.id}` }).catch(() => undefined)
    if (!fresh) return 'WRITE_FAILED'
    await logEventQuiet({ smsOrderId: so.id, attemptId: att.id, type: 'ACQ_OK', detail: { costMicro: fresh.costMicro, currency: currency ? cls.currency : 840, tail: (fresh.phone ?? '').slice(-4) } })
    if (mode === 'FIRST') await settleAcquired(so.id, fresh)
    else await switchToNew(so.id, fresh)
    return 'ACTIVE'
  }
  if (cls.c === 'UNKNOWN' || cls.c === 'CURRENCY') {
    await prisma.smsAttempt.updateMany({
      where: { id: att.id, state: 'REQUESTING' },
      data: { state: 'UNKNOWN', errorCode: cls.c === 'UNKNOWN' ? cls.reason : 'CURRENCY_NODATA', dispatchedAt: r.sentAt != null ? new Date(r.sentAt + rt().clockOffsetMs) : null, raw },
    })
    await logEventQuiet({ smsOrderId: so.id, attemptId: att.id, type: 'ACQ_UNKNOWN', detail: { reason: cls.c === 'UNKNOWN' ? cls.reason : 'currency' } })
    return 'UNKNOWN'
  }
  // 明确失败：尝试 FAILED + 全局副作用；首次取号按规则重试 / 退款，换号一律回 WAITING
  const code = cls.c === 'REJECTED' ? 'REJECTED' : cls.c === 'UNAVAILABLE' || cls.c === 'KEY_INVALID' ? cls.code : cls.c
  await failAttempt(att, code, raw)
  switch (cls.c) {
    case 'NO_BALANCE':
      await onUpstreamNoBalance({ service: so.service, country: so.country })
      break
    case 'BANNED':
      await holdForBan({ scope: cls.scope, untilMs: cls.untilMs, service: so.service, country: so.country })
      break
    case 'CHANNELS_LIMIT':
      await holdForThreads({ maxAllowed: cls.maxAllowed, currentThreads: cls.currentThreads })
      break
    case 'UNAVAILABLE':
      await holdForUnavailable({ service: so.service, country: so.country, code: cls.code })
      await markOffersDirty(so.service).catch(() => undefined)
      break
    case 'KEY_INVALID':
      await holdForKey(cls.code)
      break
    case 'WRONG_MAX_PRICE':
      await markOffersDirty(so.service).catch(() => undefined)
      break
    default:
      break
  }
  if (mode === 'REPLACE') {
    const notice = cls.c === 'WRONG_MAX_PRICE' ? REPLACE_PRICE_NOTICE : REPLACE_FAIL_NOTICE
    if (await casOrder(prisma, so, 'REPLACING', { state: 'WAITING', notice })) {
      await logEventQuiet({ smsOrderId: so.id, attemptId: att.id, type: 'REPLACE_FAIL', detail: { code } })
    }
    return code
  }
  // 首次取号
  const now = jnow()
  switch (cls.c) {
    case 'NO_NUMBERS':
      await prisma.smsOrder.updateMany({ where: { id: so.id, state: 'ACQUIRING' }, data: { notice: '号码紧张，正在重试', blockedSince: null } })
      // 用完了快照的 acquireTries 就立刻退（不等下一轮 tick）
      await advanceOrder(so.id, 'SYSTEM', { allowAcquire: false })
      break
    case 'REJECTED':
      await prisma.smsOrder.updateMany({ where: { id: so.id, state: 'ACQUIRING', blockedSince: null }, data: { blockedSince: now } })
      await prisma.smsOrder.updateMany({ where: { id: so.id, state: 'ACQUIRING' }, data: { notice: '号码紧张，正在重试' } })
      break
    case 'CHANNELS_LIMIT':
      await prisma.smsOrder.updateMany({ where: { id: so.id, state: 'ACQUIRING', blockedSince: null }, data: { blockedSince: now } })
      await prisma.smsOrder.updateMany({ where: { id: so.id, state: 'ACQUIRING' }, data: { notice: '当前使用人数较多，正在重试' } })
      break
    case 'WRONG_MAX_PRICE': {
      const fresh = await loadOrder(so.id)
      const atts = await loadAttempts(so.id)
      const priorAny = atts.filter((a) => a.errorCode === 'WRONG_MAX_PRICE' && !a.operator && a.id !== att.id).length
      const withOp = !!att.operator
      // E2：指定了运营商且允许改任意 → 先按任意运营商重试一次；info.min ≤ cap（按理不会发生）→ 以任意运营商再试 1 次；否则不按更高价取号，退款
      const retry = (withOp && so.operatorFallback) || (!withOp && priorAny === 0 && cls.minMicro != null && cls.minMicro <= so.capMicro)
      if (!retry && fresh) await toRefunding(fresh, 'ACQUIRING', 'PRICE_UP', 'SYSTEM')
      break
    }
    case 'NO_BALANCE':
    case 'KEY_INVALID':
      await toRefunding(so, 'ACQUIRING', 'SERVICE_NA', 'SYSTEM')
      break
    case 'BANNED':
    case 'UNAVAILABLE':
      await toRefunding(so, 'ACQUIRING', 'COMBO_NA', 'SYSTEM')
      break
    default:
      break
  }
  return code
}

/**
 * 取到 / 认领到的号没能挂到订单上（落地的 CAS 落空）时的兜底：先锁接码单行看 currentAttemptId——**已经是这个号**，说明并发的另一方
 * （tick / 号码页轮询的 advanceAcquiring、advanceWithNumbers(REPLACING)，或取号的调用方自己）刚把同一次落地做完，什么都不做；
 * 否则（订单已退款、已收码、换号已放弃…）这个号没人要了 → RELEASING，canCancelAt 之后放掉（E14 ②、T10 总则）。S2a 评审修复：
 * 原来不看 currentAttemptId，抢输的一方会把订单刚切过去、正在用的当前号放掉。锁顺序：接码单 → 尝试。
 */
async function releaseUnattached(smsOrderId: number, att: Pick<SmsAttempt, 'id' | 'canCancelAt'>, why: string, tx?: Tx): Promise<boolean> {
  const run = async (t: Tx) => {
    const rows = await t.$queryRaw<{ current_attempt_id: number | null }[]>`SELECT current_attempt_id FROM sms_orders WHERE id = ${smsOrderId} FOR UPDATE`
    const cur = rows[0]?.current_attempt_id == null ? null : Number(rows[0].current_attempt_id)
    if (cur === att.id) return false
    const r = await t.smsAttempt.updateMany({ where: { id: att.id, state: 'ACTIVE' }, data: { state: 'RELEASING', nextCheckAt: att.canCancelAt } })
    return r.count === 1
  }
  const done = tx ? await run(tx) : await prisma.$transaction(run, RC)
  if (done && !tx) await logEventQuiet({ smsOrderId, attemptId: att.id, type: 'STATE', detail: { attempt: 'ACTIVE→RELEASING', why } })
  return done
}

/** T8：ACQUIRING → WAITING（写 currentAttemptId、endsAt、waitUntil）；CAS 落空（订单已被别的流程改了）→ 这个号不是当前号就转 RELEASING */
async function settleAcquired(smsOrderId: number, att: SmsAttempt): Promise<void> {
  const ok = await casOrder(prisma, { id: smsOrderId }, 'ACQUIRING', {
    state: 'WAITING',
    currentAttemptId: att.id,
    endsAt: att.endsAt,
    waitUntil: att.waitUntil,
    blockedSince: null,
    notice: null,
    failCount: 0,
  })
  if (ok) {
    await logEventQuiet({ smsOrderId, attemptId: att.id, type: 'STATE', detail: { from: 'ACQUIRING', to: 'WAITING' } })
    return
  }
  await releaseUnattached(smsOrderId, att, 'order-moved')
}

/**
 * T10 的切换：CAS REPLACING → WAITING（currentAttemptId=新、replaceCount+1），旧尝试 ACTIVE → RELEASING，然后放旧号。
 * 订单已不是 REPLACING（换号瞬间旧号收码 → RECEIVED；或旧号到期 → CANCELLING）→ 新号转 RELEASING、120 秒后放掉（E14 ②）。
 */
async function switchToNew(smsOrderId: number, fresh: SmsAttempt): Promise<void> {
  const so = await loadOrder(smsOrderId)
  if (!so) return
  const oldId = so.currentAttemptId
  const now = jnow()
  const switched = await prisma.$transaction(async (tx) => {
    const ok = await casOrder(tx, so, 'REPLACING', {
      state: 'WAITING',
      currentAttemptId: fresh.id,
      replaceCount: { increment: 1 },
      endsAt: fresh.endsAt,
      waitUntil: fresh.waitUntil,
      notice: null,
      failCount: 0,
    })
    if (!ok) {
      // 并发的另一方已经切到这个新号（currentAttemptId = 它）→ 什么都不做；否则新号没人要了 → RELEASING
      if (await releaseUnattached(smsOrderId, fresh, 'order-moved', tx)) {
        await logEvent(tx, { smsOrderId, attemptId: fresh.id, type: 'REPLACE_FAIL', detail: { why: 'order-moved', state: so.state } })
      }
      return false
    }
    if (oldId) {
      const old = await tx.smsAttempt.findUnique({ where: { id: oldId }, select: { canCancelAt: true } })
      const at = old?.canCancelAt && old.canCancelAt > now ? old.canCancelAt : now
      await tx.smsAttempt.updateMany({ where: { id: oldId, state: 'ACTIVE' }, data: { state: 'RELEASING', nextCheckAt: at } })
    }
    await logEvent(tx, { smsOrderId, attemptId: fresh.id, type: 'REPLACE_OK', detail: { oldAttemptId: oldId } })
    return true
  })
  if (switched && oldId) await releaseAttempt(oldId, 'SYSTEM')
}

// ───────────────────────── 放号 / 完成（§3.1、T11、T12、T14、E14、E15、E55） ─────────────────────────

/** CAS 占住一次上游调用（nextCheckAt 为空或已到）；拿到返回 true */
async function leaseCall(att: SmsAttempt, state: string): Promise<boolean> {
  const now = jnow()
  const r = await prisma.smsAttempt.updateMany({
    where: { id: att.id, state, OR: [{ nextCheckAt: null }, { nextCheckAt: { lte: now } }] },
    data: { nextCheckAt: later(CALL_LEASE_SEC, now), releaseTries: { increment: 1 } },
  })
  return r.count === 1
}

async function noinfoEffects(v: Extract<Verdict, { v: 'NOINFO' }>): Promise<void> {
  if (v.recheckBalance) await recheckBalanceQuiet()
  if (v.stopNew === 'KEY') await holdForKey('BAD_KEY')
  else if (v.stopNew === 'BANNED_GLOBAL') await holdForBan({ scope: 'global', untilMs: null, service: '*', country: 0 })
}

export type ReleaseResult = 'CANCELLED' | 'RECEIVED' | 'EARLY' | 'EXPIRED' | 'NOINFO' | 'SKIP'

/**
 * 放号（setStatus 8）。mode=BUYER：买家取消（EARLY_CANCEL_DENIED 时回到 WAITING、尝试回 ACTIVE）；SYSTEM：到期 / 换号 / 退款放号
 * （EARLY 时尝试保持 RELEASING、nextCheckAt = canCancelAt + 5 秒，E15）。
 */
export async function releaseAttempt(attemptId: number, mode: 'BUYER' | 'SYSTEM'): Promise<{ r: ReleaseResult; minSec?: number }> {
  const att = await prisma.smsAttempt.findUnique({ where: { id: attemptId } })
  if (!att || att.state !== 'RELEASING' || !att.activationId) return { r: 'SKIP' }
  const now = jnow()
  if (att.canCancelAt && now < att.canCancelAt) {
    const minSec = Math.ceil((att.canCancelAt.getTime() - now.getTime()) / S)
    // 买家操作：与上游返回 EARLY_CANCEL_DENIED 同样收口（尝试回 ACTIVE、订单回 WAITING），不留在 CANCELLING
    if (mode === 'BUYER') return applyReleaseVerdict(att, { v: 'EARLY_DENIED', minSec }, 'BUYER', att.raw ?? '')
    await prisma.smsAttempt.updateMany({ where: { id: att.id, state: 'RELEASING' }, data: { nextCheckAt: later(5, att.canCancelAt) } })
    return { r: 'EARLY', minSec }
  }
  if (!(await leaseCall(att, 'RELEASING'))) return { r: 'SKIP' }
  let res: Up<{ result: string }>
  try {
    res = await up.cancelActivation(att.activationId)
  } catch (e) {
    res = { kind: 'unknown', reason: 'network', raw: String((e as Error)?.message ?? e).slice(0, 200) }
  }
  const v = judgeRelease(res as Parameters<typeof judgeRelease>[0])
  return applyReleaseVerdict(att, v, mode, res.raw)
}

async function applyReleaseVerdict(att: SmsAttempt, v: Verdict, mode: 'BUYER' | 'SYSTEM', raw: string): Promise<{ r: ReleaseResult; minSec?: number }> {
  const now = jnow()
  switch (v.v) {
    case 'CANCELLED': {
      const ok = await prisma.smsAttempt.updateMany({ where: { id: att.id, state: 'RELEASING' }, data: { state: 'CANCELLED', closedAt: now, nextCheckAt: null, raw } })
      if (ok.count === 1) await logEventQuiet({ smsOrderId: att.smsOrderId, attemptId: att.id, type: 'RELEASE_OK' })
      await advanceOrder(att.smsOrderId, mode === 'BUYER' ? 'BUYER' : 'SYSTEM', { allowAcquire: false })
      return { r: 'CANCELLED' }
    }
    case 'EARLY_DENIED': {
      await logEventQuiet({ smsOrderId: att.smsOrderId, attemptId: att.id, type: 'RELEASE_DENIED', detail: { minSec: v.minSec } })
      if (mode === 'BUYER') {
        await prisma.smsAttempt.updateMany({ where: { id: att.id, state: 'RELEASING' }, data: { state: 'ACTIVE', nextCheckAt: null } })
        await casOrder(prisma, { id: att.smsOrderId }, 'CANCELLING', { state: 'WAITING', refundReason: null })
        const left = att.canCancelAt ? Math.max(1, Math.ceil((att.canCancelAt.getTime() - now.getTime()) / S)) : v.minSec
        return { r: 'EARLY', minSec: left }
      }
      const base = att.canCancelAt && att.canCancelAt > now ? att.canCancelAt : now
      await prisma.smsAttempt.updateMany({ where: { id: att.id, state: 'RELEASING' }, data: { nextCheckAt: later(att.canCancelAt && att.canCancelAt > now ? 5 : 10, base) } })
      return { r: 'EARLY', minSec: v.minSec }
    }
    case 'RECEIVED':
      await logEventQuiet({ smsOrderId: att.smsOrderId, attemptId: att.id, type: 'RELEASE_LATE_CODE' })
      await ingest(att, { sms: v.sms, code: v.code, text: v.text, needAllSms: v.needAllSms, ended: v.ended, upstreamRefunded: v.upstreamRefunded, source: 'release' })
      return { r: 'RECEIVED' }
    case 'EXPIRED_CHARGE': {
      const ok = await prisma.smsAttempt.updateMany({ where: { id: att.id, state: 'RELEASING' }, data: { state: 'CANCELLED', charged: true, chargeSource: 'EXPIRED', closedAt: now, nextCheckAt: null, raw } })
      if (ok.count === 1) {
        await logEventQuiet({ smsOrderId: att.smsOrderId, attemptId: att.id, type: 'RELEASE_EXPIRED_CHARGE', detail: { costMicro: att.costMicro } })
        await checkExpiredChargeCombo(att.service, att.country).catch(() => undefined)
        await recomputeCostInTx(prisma, att.smsOrderId, 'EXPIRED_CHARGE').catch(() => false)
      }
      await advanceOrder(att.smsOrderId, 'SYSTEM', { allowAcquire: false })
      return { r: 'EXPIRED' }
    }
    case 'CHECK_HISTORY':
      await checkHistory([att], { force: true })
      return { r: 'NOINFO' }
    case 'NOINFO':
      await prisma.smsAttempt.updateMany({ where: { id: att.id, state: 'RELEASING' }, data: { nextCheckAt: later(v.backoffSec, now) } })
      await noinfoEffects(v)
      return { r: 'NOINFO' }
    default:
      await prisma.smsAttempt.updateMany({ where: { id: att.id, state: 'RELEASING' }, data: { nextCheckAt: later(10, now) } })
      return { r: 'NOINFO' }
  }
}

/** 完成（setStatus 6，T14）：ACCESS_ACTIVATION / 204 → FINISHED；NEW_OTP_RECEIVED → 入库、下一轮再调；认不出 → 下一轮重试，endsAt + 60 秒后按 history 收尾 */
export async function finishAttempt(attemptId: number): Promise<'FINISHED' | 'AGAIN' | 'NOINFO' | 'SKIP'> {
  const att = await prisma.smsAttempt.findUnique({ where: { id: attemptId } })
  if (!att || att.state !== 'RECEIVED' || !att.activationId) return 'SKIP'
  if (!(await leaseCall(att, 'RECEIVED'))) return 'SKIP'
  let res: Up<{ result: string }>
  try {
    res = await up.finishActivation(att.activationId)
  } catch (e) {
    res = { kind: 'unknown', reason: 'network', raw: String((e as Error)?.message ?? e).slice(0, 200) }
  }
  const v = judgeFinish(res as Parameters<typeof judgeFinish>[0])
  const now = jnow()
  switch (v.v) {
    case 'FINISHED':
      await markFinished(att, res.raw, false)
      return 'FINISHED'
    case 'RECEIVED':
      await ingest(att, { sms: v.sms, code: v.code, text: v.text, needAllSms: v.needAllSms, ended: v.ended, upstreamRefunded: v.upstreamRefunded, source: 'finish' })
      await prisma.smsAttempt.updateMany({ where: { id: att.id, state: 'RECEIVED' }, data: { nextCheckAt: later(5, now) } })
      return 'AGAIN'
    case 'CHECK_HISTORY':
      await checkHistory([att], { force: true })
      return 'NOINFO'
    case 'NOINFO':
      await noinfoEffects(v)
      if (att.endsAt && now.getTime() > att.endsAt.getTime() + FINISH_HISTORY_AFTER_END_SEC * S) {
        await checkHistory([att], { force: true })
      } else {
        await prisma.smsAttempt.updateMany({ where: { id: att.id, state: 'RECEIVED' }, data: { nextCheckAt: later(Math.min(v.backoffSec, 30), now) } })
      }
      return 'NOINFO'
    default:
      return 'NOINFO'
  }
}

/** 尝试 RECEIVED → FINISHED；没有别的 RECEIVED 尝试了 → 订单 RECEIVED → FINISHED；重算成本（全部终态时定稿） */
async function markFinished(att: SmsAttempt, raw: string, assumed: boolean): Promise<void> {
  const now = jnow()
  const r = await prisma.smsAttempt.updateMany({ where: { id: att.id, state: 'RECEIVED' }, data: { state: 'FINISHED', closedAt: now, nextCheckAt: null, raw, ...(assumed ? { assumed: true } : {}) } })
  if (r.count === 1) await logEventQuiet({ smsOrderId: att.smsOrderId, attemptId: att.id, type: 'FINISH', detail: assumed ? { assumed: true } : undefined })
  const still = await prisma.smsAttempt.count({ where: { smsOrderId: att.smsOrderId, state: 'RECEIVED' } })
  if (still === 0) {
    const ok = await casOrder(prisma, { id: att.smsOrderId }, 'RECEIVED', { state: 'FINISHED', finishedAt: now, notice: null })
    if (ok) await logEventQuiet({ smsOrderId: att.smsOrderId, type: 'STATE', detail: { from: 'RECEIVED', to: 'FINISHED' } })
  }
  await recomputeCostInTx(prisma, att.smsOrderId, 'T14').catch((e) => console.error('[jiema] 成本核算失败（tick 补算）', att.smsOrderId, (e as Error)?.message))
}

// ───────────────────────── 收码（T13） ─────────────────────────

export interface IngestInput {
  sms: OtpItem[]
  code: string | null
  text: string | null
  needAllSms: boolean
  ended?: boolean
  upstreamRefunded?: boolean
  source: string
}

const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex')

interface MsgRow {
  dedupeKey: string
  hasId: boolean
  code: string | null
  text: string | null
  sender: string | null
  kind: string
  receivedAt: Date
}

function msgRows(inp: IngestInput, now: Date): MsgRow[] {
  const out: MsgRow[] = []
  for (const s of inp.sms) {
    if (s.code == null && s.text == null) continue
    out.push({
      dedupeKey: s.id ? String(s.id).slice(0, 64) : `h:${sha(`${s.code ?? ''}|${s.text ?? ''}`).slice(0, 30)}`,
      hasId: !!s.id,
      code: s.code ? s.code.slice(0, 32) : null,
      text: s.text,
      sender: s.from ? s.from.slice(0, 64) : null,
      kind: s.type === 'call' ? 'call' : 'sms',
      receivedAt: s.date ?? now,
    })
  }
  if (!out.length && (inp.code || inp.text)) {
    out.push({ dedupeKey: `h:${sha(`${inp.code ?? ''}|${inp.text ?? ''}`).slice(0, 30)}`, hasId: false, code: inp.code ? inp.code.slice(0, 32) : null, text: inp.text, sender: null, kind: 'sms', receivedAt: now })
  }
  return out
}

/** 入库一条短信（按 (attemptId, dedupeKey) 去重）：没有 id 的码与已有短信同码 / 同文就跳过；有 id 的顶掉同码的无 id 占位（getAllSms 补全文） */
async function insertMessage(tx: Tx, att: SmsAttempt, m: MsgRow): Promise<boolean> {
  const existing = await tx.smsMessage.findMany({ where: { attemptId: att.id }, select: { id: true, dedupeKey: true, code: true, text: true } })
  if (existing.some((e) => e.dedupeKey === m.dedupeKey)) return false
  if (!m.hasId) {
    if (existing.some((e) => (m.code && e.code === m.code) || (m.text && e.text === m.text))) return false
  } else {
    const ph = existing.find((e) => e.dedupeKey.startsWith('h:') && ((m.code && e.code === m.code) || (m.text && e.text === m.text)))
    if (ph) {
      await tx.smsMessage.update({ where: { id: ph.id }, data: { dedupeKey: m.dedupeKey, code: m.code, text: m.text, sender: m.sender, kind: m.kind, receivedAt: m.receivedAt } })
      return false
    }
  }
  try {
    await tx.smsMessage.create({ data: { attemptId: att.id, smsOrderId: att.smsOrderId, dedupeKey: m.dedupeKey, code: m.code, text: m.text, sender: m.sender, kind: m.kind, receivedAt: m.receivedAt } })
    return true
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2002') return false
    throw e
  }
}

/**
 * T13：任意一个尝试检测到短信。先（事务外）按需 getAllSms 取全文（失败就先只存 code，下一轮补），然后按锁顺序一个事务：
 * Order CAS PAID & [PENDING, PROCESSING] → DELIVERED → SmsOrder → RECEIVED（写 firstCodeAt）→ 尝试 → RECEIVED（charged）→ 插短信
 * → 其余 ACTIVE 的尝试转 RELEASING → 按 T20 写预估成本利润。history 说上游已结束（ended）的直接 FINISHED（T22 不再调 finish）。
 */
export async function ingest(att0: SmsAttempt, inp: IngestInput): Promise<void> {
  let input = inp
  if (inp.needAllSms && !inp.ended && att0.activationId && !inp.sms.length) {
    const all = await up.getAllSms(att0.activationId).catch(() => null)
    if (all && all.kind === 'ok' && all.data.items.length) input = { ...inp, sms: all.data.items }
  }
  const now = jnow()
  const rows = msgRows(input, now)
  await prisma.$transaction(async (tx) => {
    const att = await tx.smsAttempt.findUnique({ where: { id: att0.id } })
    if (!att) return
    const so = await tx.smsOrder.findUnique({ where: { id: att.smsOrderId }, select: { id: true, orderId: true, state: true } })
    if (!so) return
    await tx.order.updateMany({ where: { id: so.orderId, payStatus: 'PAID', deliveryStatus: { in: ['PENDING', 'PROCESSING'] } }, data: { deliveryStatus: 'DELIVERED', deliveredAt: now } })
    const moved = await tx.smsOrder.updateMany({
      where: { id: so.id, state: { in: ['ACQUIRING', 'WAITING', 'REPLACING', 'CANCELLING', 'REFUNDING'] }, refundState: 'NONE' },
      data: { state: 'RECEIVED', firstCodeAt: now, notice: null, refundReason: null, failCount: 0, blockedSince: null, version: { increment: 1 } },
    })
    if (moved.count === 1) await logEvent(tx, { smsOrderId: so.id, attemptId: att.id, type: 'STATE', detail: { from: so.state, to: 'RECEIVED', source: inp.source } })
    else await tx.smsOrder.updateMany({ where: { id: so.id, firstCodeAt: null, state: { in: ['RECEIVED', 'FINISHED', 'REFUNDED', 'MANUAL'] } }, data: { firstCodeAt: now } })
    const liveStates = ['ACTIVE', 'RELEASING', 'RECEIVED', 'UNKNOWN']
    if (liveStates.includes(att.state) || (att.state === 'FINISHED' && !inp.ended)) {
      const toState = inp.ended ? 'FINISHED' : att.state === 'FINISHED' ? 'FINISHED' : 'RECEIVED'
      await tx.smsAttempt.updateMany({
        where: { id: att.id, state: { in: [...liveStates, 'FINISHED'] } },
        data: {
          state: toState,
          charged: true,
          chargeSource: att.charged ? att.chargeSource : 'SMS',
          codeAt: att.codeAt ?? now,
          nextCheckAt: toState === 'RECEIVED' ? null : att.nextCheckAt,
          ...(inp.ended ? { closedAt: att.closedAt ?? now } : {}),
          ...(inp.upstreamRefunded && att.costMicro != null ? { upstreamRefundMicro: att.costMicro } : {}),
        },
      })
    }
    let added = 0
    for (const m of rows) if (await insertMessage(tx, att, m)) added++
    const count = await tx.smsMessage.count({ where: { attemptId: att.id } })
    await tx.smsAttempt.update({ where: { id: att.id }, data: { smsCount: count } })
    if (added) await logEvent(tx, { smsOrderId: so.id, attemptId: att.id, type: 'SMS', detail: { added, source: inp.source } })
    // 其他仍然 ACTIVE 的尝试转 RELEASING（T13 失败补偿）
    const others = await tx.smsAttempt.findMany({ where: { smsOrderId: so.id, state: 'ACTIVE', id: { not: att.id } }, select: { id: true, canCancelAt: true } })
    for (const o of others) {
      await tx.smsAttempt.updateMany({ where: { id: o.id, state: 'ACTIVE' }, data: { state: 'RELEASING', nextCheckAt: o.canCancelAt && o.canCancelAt > now ? o.canCancelAt : now } })
    }
    await recomputeCostInTx(tx, so.id, `T13:${inp.source}`)
  })
  // ended 的号（history 6 / 8 / 10 带码）直接 FINISHED；订单如果只剩它，按 T22 收尾
  if (inp.ended) await advanceOrder(att0.smsOrderId, 'SYSTEM', { allowAcquire: false })
}

// ───────────────────────── history 定终态（§3.1、E16、E64） ─────────────────────────

/**
 * 查 v1 history（尝试前后各 1 小时，按服务 / 国家过滤，合并成一次查询；CAS 占住 checkedAt，≥10 秒一次）：
 * 状态 6 或 moreCodes 非空 → 收码（ended 的直接 FINISHED）；8 / 10 且无码 → CANCELLED；查不到 → 没有信息，下一轮再查。
 */
export async function checkHistory(atts: SmsAttempt[], opts: { force?: boolean } = {}): Promise<number> {
  const now = jnow()
  const mine: SmsAttempt[] = []
  for (const a of atts) {
    if (!a.activationId || isAttemptTerminal(a.state)) continue
    const r = await prisma.smsAttempt.updateMany({
      where: { id: a.id, state: a.state, ...(opts.force ? {} : { OR: [{ checkedAt: null }, { checkedAt: { lte: new Date(now.getTime() - HISTORY_CHECK_SEC * S) } }] }) },
      data: { checkedAt: now },
    })
    if (r.count === 1) mine.push(a)
  }
  if (!mine.length) return 0
  const from = new Date(Math.min(...mine.map((a) => a.requestedAt.getTime())) - 3600 * S)
  const to = new Date(Math.max(...mine.map((a) => a.requestedAt.getTime())) + 3600 * S)
  const services = Array.from(new Set(mine.map((a) => a.service)))
  const countries = Array.from(new Set(mine.map((a) => a.country)))
  let r: Awaited<ReturnType<typeof up.v1HistoryAll>>
  try {
    r = await up.v1HistoryAll({ from, to, services, countries })
  } catch (e) {
    r = { kind: 'unknown', reason: 'network', raw: String((e as Error)?.message ?? e).slice(0, 200) }
  }
  let changed = 0
  let effectsDone = false
  for (const a of mine) {
    const v = judgeHistory(r, a.activationId as string)
    if (v.v === 'RECEIVED') {
      await ingest(a, { sms: v.sms, code: v.code, text: v.text, needAllSms: v.needAllSms, ended: v.ended, upstreamRefunded: v.upstreamRefunded, source: 'history' })
      changed++
    } else if (v.v === 'CANCELLED') {
      const fresh = await prisma.smsAttempt.findUnique({ where: { id: a.id } })
      if (fresh && fresh.state === 'RECEIVED') {
        // 我方记着收过码、history 却说 8 / 10 且无码：号码在上游已结束，按已完成收尾（扣费不改，对账 R 系列核实）
        await markFinished(fresh, `history ${v.v}`, false)
      } else {
        const ok = await prisma.smsAttempt.updateMany({ where: { id: a.id, state: { in: ['ACTIVE', 'RELEASING'] } }, data: { state: 'CANCELLED', closedAt: now, nextCheckAt: null } })
        if (ok.count === 1) await logEventQuiet({ smsOrderId: a.smsOrderId, attemptId: a.id, type: 'HISTORY_CONFIRM', detail: { v: 'CANCELLED' } })
      }
      await advanceOrder(a.smsOrderId, 'SYSTEM', { allowAcquire: false })
      changed++
    } else if (v.v === 'NOINFO' && !effectsDone) {
      effectsDone = true
      await noinfoEffects(v)
    }
  }
  return changed
}

// ───────────────────────── 系统到期放号（T12） ─────────────────────────

/** T12：没码的当前号到了 waitUntil → 订单 WAITING / REPLACING → CANCELLING（refundReason=EXPIRED），尝试 ACTIVE → RELEASING，然后放号 */
async function systemExpire(so: SmsOrder, att: SmsAttempt): Promise<void> {
  const moved = await prisma.$transaction(async (tx) => {
    const ok = await casOrder(tx, so, ['WAITING', 'REPLACING'], { state: 'CANCELLING', refundReason: 'EXPIRED' })
    if (!ok) return false
    await tx.smsAttempt.updateMany({ where: { id: att.id, state: 'ACTIVE' }, data: { state: 'RELEASING', nextCheckAt: null } })
    await logEvent(tx, { smsOrderId: so.id, attemptId: att.id, type: 'CANCEL_REQ', actor: 'CRON', detail: { why: 'EXPIRED', from: so.state } })
    return true
  })
  if (moved) await releaseAttempt(att.id, 'SYSTEM')
}

// ───────────────────────── 批量查码（tick 第 1 步） ─────────────────────────

/**
 * 在途尝试（ACTIVE / RECEIVED / RELEASING）有就拉全 getActiveActivations（任何一页失败 → 这一轮对所有尝试都是没有信息，跳过本步，§3.1）；
 * 按 activationId 对照：有新码 → T13；在列表里没码 → 到点放号 / 到期取消 / 到点完成；不在列表里 → 查 history。
 */
export async function pollActive(): Promise<{ polled: number; listOk: boolean }> {
  const atts = await prisma.smsAttempt.findMany({ where: { state: { in: ['ACTIVE', 'RECEIVED', 'RELEASING'] }, activationId: { not: null } } })
  if (!atts.length) return { polled: 0, listOk: true }
  const list = await up.getAllActiveActivations().catch(() => null)
  if (!list) return { polled: 0, listOk: false }
  const items: ActiveItem[] | null = list.kind === 'ok' ? list.data.items : list.kind === 'err' && list.code === 'CURRENCY' && list.data ? list.data.items : null
  if (!items) {
    if (list.kind === 'err' || list.kind === 'unknown' || list.kind === 'noinfo') {
      // 402 / 403 / 1020 这类「没有信息」的副作用照做（只触发复核，不改状态）
      await noinfoEffects(noinfoVerdict(list as Parameters<typeof noinfoVerdict>[0]))
    }
    return { polled: 0, listOk: false }
  }
  if (list.kind === 'err' && list.code === 'CURRENCY') void holdForCurrency({ currency: typeof list.info?.currency === 'number' ? (list.info.currency as number) : null, where: 'getActiveActivations' }).catch(() => undefined)
  const now = jnow()
  noteActiveCount(items.length, now.getTime())
  const history: SmsAttempt[] = []
  for (const att of atts) {
    try {
      const last = await prisma.smsMessage.findFirst({ where: { attemptId: att.id }, orderBy: { id: 'desc' }, select: { code: true, text: true } })
      const v = judgeFromActiveList({ kind: 'ok', data: { items }, raw: '' }, att.activationId as string, { lastCode: last?.code ?? null, lastText: last?.text ?? null })
      if (v.v === 'RECEIVED') {
        // 同码同文（getAllSms 已补过全文）不算新码
        if (last && ((v.code && last.code === v.code) || (v.text && last.text === v.text))) {
          // 没有新码
        } else {
          await ingest(att, { sms: v.sms, code: v.code, text: v.text, needAllSms: true, source: 'list' })
          continue
        }
      }
      if (v.v === 'CHECK_HISTORY') {
        history.push(att)
        continue
      }
      await timerActions(att, now)
    } catch (e) {
      console.error('[jiema] 查码处理失败', att.id, (e as Error)?.message)
    }
  }
  if (history.length) await checkHistory(history)
  return { polled: atts.length, listOk: true }
}

/** 一个尝试到点该做的事（放号、到期取消、完成、推定退款），列表与惰性推进共用；并发由 CAS 占位挡住 */
async function timerActions(att: SmsAttempt, now: Date): Promise<void> {
  if (att.state === 'RELEASING') {
    if (!att.nextCheckAt || att.nextCheckAt <= now) await releaseAttempt(att.id, 'SYSTEM')
    return
  }
  if (att.state === 'ACTIVE' && att.waitUntil && now >= att.waitUntil && att.smsCount === 0) {
    const so = await loadOrder(att.smsOrderId)
    if (!so) return
    if (so.currentAttemptId === att.id && (so.state === 'WAITING' || so.state === 'REPLACING')) await systemExpire(so, att)
    else if (['CANCELLING', 'REFUNDING', 'RECEIVED', 'FINISHED', 'REFUNDED', 'MANUAL'].includes(so.state) || (so.currentAttemptId != null && so.currentAttemptId !== att.id)) {
      // 不是当前号（换号后、或订单已在取消 / 收码）：直接转 RELEASING 放掉
      await prisma.smsAttempt.updateMany({ where: { id: att.id, state: 'ACTIVE' }, data: { state: 'RELEASING', nextCheckAt: null } })
      await releaseAttempt(att.id, 'SYSTEM')
    }
    return
  }
  if (att.state === 'RECEIVED' && att.endsAt && now >= finishDueAt(att.endsAt) && (!att.nextCheckAt || att.nextCheckAt <= now)) {
    await finishAttempt(att.id)
  }
}

/** E20：过了 endsAt 60 分钟仍然确认不了的 ACTIVE / RELEASING 尝试按「上游已自动退款」推定 CANCELLED（assumed=true，对账核实）；RECEIVED 的推定已完成 */
async function assumeStale(atts: SmsAttempt[], now: Date): Promise<boolean> {
  let any = false
  for (const a of atts) {
    if (!a.endsAt || now.getTime() < a.endsAt.getTime() + ASSUMED_AFTER_END_SEC * S) continue
    if (a.state === 'ACTIVE' || a.state === 'RELEASING') {
      const r = await prisma.smsAttempt.updateMany({ where: { id: a.id, state: a.state }, data: { state: 'CANCELLED', assumed: true, closedAt: now, nextCheckAt: null } })
      if (r.count === 1) {
        any = true
        await logEventQuiet({ smsOrderId: a.smsOrderId, attemptId: a.id, type: 'HISTORY_CONFIRM', detail: { assumed: true } })
      }
    } else if (a.state === 'RECEIVED') {
      await markFinished(a, 'assumed finished', true)
      any = true
    }
  }
  return any
}

// ───────────────────────── 订单推进（tick 第 3 步、惰性推进、事件之后） ─────────────────────────

export interface AdvanceOpts {
  /** 允许在这一步发起取号（tick 每轮最多 5 单；事件回调里不连环取号） */
  allowAcquire?: boolean
}

/** 推进一张单（按状态，§6.5 第 3 步）。任何一步失败只记日志，下一轮再来 */
export async function advanceOrder(smsOrderId: number, actor: EvActor = 'CRON', opts: AdvanceOpts = {}): Promise<void> {
  const so = await loadOrder(smsOrderId)
  if (!so) return
  const now = jnow()
  try {
    switch (so.state) {
      case 'PENDING_PAY':
        return await advancePending(so, now)
      case 'READY':
        if (so.paidAt && now.getTime() - so.paidAt.getTime() >= READY_EXPIRE_SEC * S) await toRefunding(so, 'READY', 'LATE_START_REFUND', actor)
        return
      case 'ACQUIRING':
        return await advanceAcquiring(so, now, opts.allowAcquire !== false)
      case 'MANUAL':
        if (so.alertedAt && now.getTime() - so.alertedAt.getTime() >= MANUAL_REALERT_SEC * S) {
          const r = await prisma.smsOrder.updateMany({ where: { id: so.id, state: 'MANUAL', alertedAt: so.alertedAt }, data: { alertedAt: now } })
          if (r.count === 1) {
            smsAlert(`MANUAL_AGAIN:${so.id}`, '接码订单人工处理超过 24 小时仍未处理', [
              { label: '接码单', value: `#${so.id}` },
              { label: '进入人工', value: so.manualAt?.toISOString() ?? '—' },
            ], { link: '/admin/jiema?tab=orders', throttleMs: 0 })
          }
        }
        return
      case 'CLOSED':
      case 'CANCELLED':
        return
      default:
        return await advanceWithNumbers(so, now, actor)
    }
  } catch (e) {
    console.error('[jiema] 推进订单失败（下一轮重试）', so.id, so.state, (e as Error)?.message)
  }
}

async function advanceAcquiring(so: SmsOrder, now: Date, allowAcquire: boolean): Promise<void> {
  const atts = await loadAttempts(so.id)
  const inflight = atts.find((a) => a.state === 'REQUESTING' || a.state === 'UNKNOWN')
  if (inflight) {
    if (inflight.state === 'REQUESTING' && now.getTime() - inflight.requestedAt.getTime() > REQUESTING_STUCK_SEC * S) {
      await prisma.smsAttempt.updateMany({ where: { id: inflight.id, state: 'REQUESTING' }, data: { state: 'UNKNOWN', errorCode: 'STUCK' } })
    }
    if (inflight.state === 'UNKNOWN' && now.getTime() - inflight.requestedAt.getTime() > UNKNOWN_MANUAL_SEC * S) {
      await toManual(so.id, `取号结果未知超过 10 分钟没解开（attempt #${inflight.id}）`, undefined, { attemptId: inflight.id })
    }
    return
  }
  const active = atts.find((a) => a.state === 'ACTIVE')
  if (active) return settleAcquired(so.id, active)
  if (atts.some((a) => a.state === 'RECEIVED')) return
  // 首次取号的「算数」失败已达快照 acquireTries → T9（E1：3 次都失败 → 退回）
  const counted = atts.filter((a) => (a.reason === 'FIRST' || a.reason === 'RETRY') && a.state === 'FAILED' && a.errorCode !== 'REJECTED' && a.errorCode !== 'CHANNELS_LIMIT').length
  if (counted >= so.acquireTries) {
    await toRefunding(so, 'ACQUIRING', 'ACQUIRE_FAILED', 'SYSTEM')
    return
  }
  // allowAcquire=false（tick 每轮第 6 单起、事件回调）也要走闸门判定：被挡住照样记 blockedSince、满 90 秒 T9（E59、第 81 条），只是不真正调 getNumberV2
  await acquireOnce(so, atts, now, allowAcquire)
}

/**
 * T7：发起一次首次取号。前提：没有在途取号；首次取号的「算数」失败数 < 快照 acquireTries（E1）；到了重试时刻（0 / 20 / 45 秒）；
 * 闸门 ①–⑤ 通过（停售、熔断、线程与在途号码数；不读 sms_config，E59）。被挡住 → 记 blockedSince，满 90 秒 T9；
 * E58 的 REJECTED 不占次数、退避 12 秒，持续超过 90 秒同样 T9。
 * allowAcquire=false：闸门判定（记 blockedSince、满 90 秒退款）照做，只是这一轮不发起取号（S2a 评审修复：原来第 6 单起连闸门都不判，
 * 熔断时后面的单要等前一批退完才开始计时）。
 */
async function acquireOnce(so: SmsOrder, atts: SmsAttempt[], now: Date, allowAcquire = true): Promise<void> {
  const firstTries = atts.filter((a) => a.reason === 'FIRST' || a.reason === 'RETRY')
  const counted = firstTries.filter((a) => a.state === 'FAILED' && a.errorCode !== 'REJECTED' && a.errorCode !== 'CHANNELS_LIMIT').length
  if (counted >= so.acquireTries) {
    await toRefunding(so, 'ACQUIRING', 'ACQUIRE_FAILED', 'SYSTEM')
    return
  }
  const last = atts.length ? atts[atts.length - 1] : null
  const lastRejected = !!last && last.state === 'FAILED' && (last.errorCode === 'REJECTED' || last.errorCode === 'CHANNELS_LIMIT')
  const block = await acquireBlock({ service: so.service, country: so.country, selfSmsOrderId: so.id })
  // 被停售 / 熔断 / 线程受限 / 请求被拒挡住满 90 秒（E58、E59）→ T9
  if (so.blockedSince && now.getTime() - so.blockedSince.getTime() >= BLOCKED_REFUND_SEC * S && (block || lastRejected)) {
    await logEventQuiet({ smsOrderId: so.id, type: 'BLOCKED', detail: { code: block?.code ?? 'REJECTED', refund: true } })
    await toRefunding(so, 'ACQUIRING', block?.code === 'MAINTENANCE' ? 'MAINTENANCE' : 'HOLD', 'SYSTEM')
    return
  }
  if (block) {
    // 只在开始被挡的那一刻记一条 BLOCKED（不再每轮每单一条）
    if (!so.blockedSince) {
      const b = await prisma.smsOrder.updateMany({ where: { id: so.id, state: 'ACQUIRING', blockedSince: null }, data: { blockedSince: now } })
      if (b.count === 1) await logEventQuiet({ smsOrderId: so.id, type: 'BLOCKED', detail: { code: block.code, kind: block.kind } })
    }
    return
  }
  if (!allowAcquire) {
    // 闸门已放开：清掉旧的 blockedSince（REJECTED 的计时除外），等下一个有名额的轮次再取号
    if (so.blockedSince && !lastRejected) await prisma.smsOrder.updateMany({ where: { id: so.id, state: 'ACQUIRING' }, data: { blockedSince: null } })
    return
  }
  if (lastRejected && last?.respondedAt && now.getTime() < last.respondedAt.getTime() + REJECTED_BACKOFF_SEC * S) return
  const first = firstTries[0]
  // WRONG_MAX_PRICE 之后的那一次（改任意运营商 / 按 info.min）不用等重试间隔（E2）；NO_NUMBERS 等按 0 / 20 / 45 秒（E1）
  const lastPriceMiss = !!last && last.state === 'FAILED' && last.errorCode === 'WRONG_MAX_PRICE'
  if (first && !lastRejected && !lastPriceMiss && now.getTime() < first.requestedAt.getTime() + acquireDelaySec(counted) * S) return
  if (so.blockedSince && !lastRejected) await prisma.smsOrder.updateMany({ where: { id: so.id, state: 'ACQUIRING' }, data: { blockedSince: null } })
  const op = operatorForTry({
    operator: so.operator,
    fallback: so.operatorFallback,
    countedTries: counted,
    hadPriceMissWithOperator: atts.some((a) => a.errorCode === 'WRONG_MAX_PRICE' && !!a.operator),
  })
  const att = await insertIntent(so, 'ACQUIRING', { reason: firstTries.length ? 'RETRY' : 'FIRST', operator: op })
  if (!att) return
  let r: Up<NumberData>
  try {
    r = await up.getNumberV2({ service: so.service, country: so.country, operator: op, maxPriceMicro: so.capMicro })
  } catch (e) {
    // 参数不合法（程序错误）：请求没发出去 → 明确失败
    r = { kind: 'err', code: 'BAD_PARAM', http: 0, raw: String((e as Error)?.message ?? e).slice(0, 200) }
  }
  await applyAcquireOutcome(so, att, r, 'FIRST')
}

/** 有号码之后的各个状态（WAITING / REPLACING / CANCELLING / REFUNDING / RECEIVED / FINISHED / REFUNDED） */
async function advanceWithNumbers(so: SmsOrder, now: Date, actor: EvActor): Promise<void> {
  let atts = await loadAttempts(so.id)
  if (await assumeStale(atts, now)) {
    atts = await loadAttempts(so.id)
  }
  const fresh = (await loadOrder(so.id)) ?? so
  so = fresh
  const received = atts.some(hasCode)
  const cur = atts.find((a) => a.id === so.currentAttemptId) ?? null
  const nonTerminal = atts.filter((a) => !ATTEMPT_TERMINAL.has(a.state))

  // 订单还没到 RECEIVED、尝试却已有码（进程在 T13 事务之后崩溃之类）→ 补推进
  if (received && ['WAITING', 'REPLACING', 'CANCELLING', 'REFUNDING'].includes(so.state) && so.refundState === 'NONE') {
    if (await casOrder(prisma, so, so.state, { state: 'RECEIVED', firstCodeAt: so.firstCodeAt ?? now, notice: null, refundReason: null })) {
      await logEventQuiet({ smsOrderId: so.id, type: 'STATE', actor, detail: { from: so.state, to: 'RECEIVED', repair: true } })
    }
    return
  }

  switch (so.state) {
    case 'WAITING': {
      if (cur && isAttemptTerminal(cur.state) && !received && nonTerminal.length === 0) {
        // T21：当前号已被上游先结束、没收到短信
        await toRefunding(so, 'WAITING', 'UPSTREAM_ENDED', actor)
        return
      }
      for (const a of nonTerminal) await timerActions(a, now)
      return
    }
    case 'REPLACING': {
      const newer = atts.filter((a) => cur && a.seq > cur.seq && a.reason === 'REPLACE')
      const activeNew = newer.find((a) => a.state === 'ACTIVE')
      const inflightNew = newer.find((a) => a.state === 'REQUESTING' || a.state === 'UNKNOWN')
      if (activeNew) {
        await switchToNew(so.id, activeNew)
        return
      }
      if (inflightNew) {
        if (inflightNew.state === 'REQUESTING' && now.getTime() - inflightNew.requestedAt.getTime() > REQUESTING_STUCK_SEC * S) {
          await prisma.smsAttempt.updateMany({ where: { id: inflightNew.id, state: 'REQUESTING' }, data: { state: 'UNKNOWN', errorCode: 'STUCK' } })
        }
        if (inflightNew.state === 'UNKNOWN' && now.getTime() - inflightNew.requestedAt.getTime() > UNKNOWN_MANUAL_SEC * S) {
          await toManual(so.id, `换号结果未知超过 10 分钟没解开（attempt #${inflightNew.id}）`, undefined, { attemptId: inflightNew.id })
          return
        }
        // 新号结果未知期间旧号到了 waitUntil → 先放旧号，订单 REPLACING → CANCELLING（T10 总则最后一段）
        if (cur && cur.state === 'ACTIVE' && cur.waitUntil && now >= cur.waitUntil && cur.smsCount === 0) await systemExpire(so, cur)
        return
      }
      const since = await prisma.smsEvent.findFirst({ where: { smsOrderId: so.id, type: 'REPLACE_REQ' }, orderBy: { id: 'desc' }, select: { createdAt: true } })
      const startedAt = since?.createdAt ?? so.updatedAt
      if (Date.now() - startedAt.getTime() > STUCK_MID_SEC * S) {
        if (await casOrder(prisma, so, 'REPLACING', { state: 'WAITING', notice: REPLACE_FAIL_NOTICE })) {
          await logEventQuiet({ smsOrderId: so.id, type: 'REPLACE_FAIL', detail: { why: 'stuck-recover' } })
        }
      }
      return
    }
    case 'CANCELLING': {
      if (nonTerminal.length === 0 && !received) {
        if (await casOrder(prisma, so, 'CANCELLING', { state: 'REFUNDING', failCount: 0 })) {
          await logEventQuiet({ smsOrderId: so.id, type: 'STATE', actor, detail: { from: 'CANCELLING', to: 'REFUNDING', reason: so.refundReason } })
          await refundCancelled(so.id, actor === 'BUYER' ? 'BUYER' : 'SYSTEM')
        }
        return
      }
      for (const a of nonTerminal) {
        if (a.state === 'ACTIVE') {
          await prisma.smsAttempt.updateMany({ where: { id: a.id, state: 'ACTIVE' }, data: { state: 'RELEASING', nextCheckAt: null } })
          await releaseAttempt(a.id, 'SYSTEM')
        } else await timerActions(a, now)
      }
      return
    }
    case 'REFUNDING': {
      if (nonTerminal.length === 0 && !received) {
        await refundCancelled(so.id, actor === 'BUYER' ? 'BUYER' : 'SYSTEM')
        return
      }
      for (const a of nonTerminal) {
        if (a.state === 'ACTIVE') {
          await prisma.smsAttempt.updateMany({ where: { id: a.id, state: 'ACTIVE' }, data: { state: 'RELEASING', nextCheckAt: null } })
          await releaseAttempt(a.id, 'SYSTEM')
        } else if (a.state === 'REQUESTING' && now.getTime() - a.requestedAt.getTime() > REQUESTING_STUCK_SEC * S) {
          await prisma.smsAttempt.updateMany({ where: { id: a.id, state: 'REQUESTING' }, data: { state: 'UNKNOWN', errorCode: 'STUCK' } })
        } else await timerActions(a, now)
      }
      return
    }
    case 'RECEIVED': {
      if (nonTerminal.length === 0) {
        // T22：上游先结束了全部号码（或都已完成）→ FINISHED，不再调 finish；定稿
        if (await casOrder(prisma, so, 'RECEIVED', { state: 'FINISHED', finishedAt: now })) {
          await logEventQuiet({ smsOrderId: so.id, type: 'STATE', actor, detail: { from: 'RECEIVED', to: 'FINISHED', t22: true } })
        }
        await recomputeCostInTx(prisma, so.id, 'T22')
        return
      }
      for (const a of nonTerminal) await timerActions(a, now)
      if (so.chargedMicro == null) await recomputeCostInTx(prisma, so.id, 'T20-repair')
      return
    }
    case 'FINISHED':
    case 'REFUNDED': {
      for (const a of nonTerminal) {
        if (a.state === 'ACTIVE') {
          await prisma.smsAttempt.updateMany({ where: { id: a.id, state: 'ACTIVE' }, data: { state: 'RELEASING', nextCheckAt: null } })
          await releaseAttempt(a.id, 'SYSTEM')
        } else await timerActions(a, now)
      }
      if (!so.costFinal) await recomputeCostInTx(prisma, so.id, 'T20-final')
      return
    }
    default:
      return
  }
}

// ───────────────────────── 待支付（T4、T19、T2 修复） ─────────────────────────

class PayingRetry extends Error {}
class CloseVersionConflict extends Error {}
class CloseStateConflict extends Error {}

export type CloseOutcome = 'CLOSED' | 'PAID_PROCESSING' | 'PAYING' | 'VERSION' | 'STATE'

/**
 * 关单（T18 买家取消、T4 tick 两条路径、pay/vmq/create 复核不过、管理员「关单并退回预扣」共用；§2.4、§2.7 H3、附录 B 第 16 条）：
 * （可选）先作废 state=0 的收款单 → 一个事务（READ COMMITTED）：锁订单行 → 又发现 state=0 的收款单（另一个页面刚发起了支付）→ 回滚、
 * 再作废一次、重试一次，仍有 → PAYING；发现 state=1 或订单已付款 → PAID_PROCESSING（不关、不释放）→ 订单 CAS UNPAID 且未取消 → CANCELLED
 * → SmsOrder CAS → CLOSED → releaseInTx（预扣 HELD → RELEASED、原路加回、RELEASE 流水）。
 * 收款单只能在锁住订单行时新建（createOrGetVmqOrder），所以锁内看到的「没有 0/1 收款单」在提交前不会变。
 */
export async function closePending(
  so: Pick<SmsOrder, 'id' | 'orderId'>,
  opts: { reason: string; actor: EvActor; actorId?: number | null; version?: number; invalidate: boolean; requireNoVmqEver?: boolean; fromStates?: string[] },
): Promise<CloseOutcome> {
  for (let i = 0; i < 2; i++) {
    if (opts.invalidate) await invalidatePendingVmq('order', so.orderId).catch((e) => console.error('[jiema] 关单前作废收款单失败', so.orderId, e))
    try {
      return await inMoneyTx(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM orders WHERE id = ${so.orderId} FOR UPDATE`
          const o = await tx.order.findUnique({ where: { id: so.orderId }, select: { payStatus: true, deliveryStatus: true } })
          if (!o) throw new CloseStateConflict()
          const rows = await tx.vmqOrder.findMany({ where: { bizType: 'order', bizId: so.orderId, state: { in: [0, 1] } }, select: { state: true } })
          if (o.payStatus !== 'UNPAID' || rows.some((r) => r.state === 1)) return 'PAID_PROCESSING' as const
          if (rows.some((r) => r.state === 0)) throw new PayingRetry()
          if (opts.requireNoVmqEver && (await tx.vmqOrder.count({ where: { bizType: 'order', bizId: so.orderId } })) > 0) throw new CloseStateConflict()
          await tx.order.updateMany({ where: { id: so.orderId, payStatus: 'UNPAID', deliveryStatus: { not: 'CANCELLED' } }, data: { deliveryStatus: 'CANCELLED' } })
          const cas = await tx.smsOrder.updateMany({
            where: { id: so.id, state: { in: opts.fromStates ?? ['PENDING_PAY'] }, ...(opts.version != null ? { version: opts.version } : {}) },
            data: { state: 'CLOSED', version: { increment: 1 }, failCount: 0, notice: null },
          })
          if (cas.count !== 1) throw opts.version != null ? new CloseVersionConflict() : new CloseStateConflict()
          const rel = await releaseInTx(tx, so.orderId, { reason: opts.reason })
          await logEvent(tx, { smsOrderId: so.id, type: 'CLOSED', actor: opts.actor, actorId: opts.actorId ?? null, detail: { reason: opts.reason, released: rel.released ? rel.hold.topupCents + rel.hold.cashCents : 0 } })
          if (rel.released) await logEvent(tx, { smsOrderId: so.id, type: 'RELEASE', actor: opts.actor, detail: { topupCents: rel.hold.topupCents, cashCents: rel.hold.cashCents } })
          return 'CLOSED' as const
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
      )
    } catch (e) {
      if (e instanceof PayingRetry) {
        if (i === 0 && opts.invalidate) continue
        return 'PAYING'
      }
      if (e instanceof CloseVersionConflict) return 'VERSION'
      if (e instanceof CloseStateConflict) return 'STATE'
      if (e instanceof HoldReleaseBlocked) return e.why === 'HAS_PAYMENT' ? 'PAYING' : 'STATE'
      // 预扣已不是 HELD（CAPTURED 之类，人工改过库）：整个事务已回滚，不关单（管理员按 E44 / 取消并退回余额处理）
      if (e instanceof HoldStateError) return 'STATE'
      throw e
    }
  }
  return 'PAYING'
}

async function advancePending(so: SmsOrder, now: Date): Promise<void> {
  const o = await prisma.order.findUnique({ where: { id: so.orderId }, select: { payStatus: true, deliveryStatus: true, paidAt: true } })
  if (!o) return
  if (o.payStatus === 'PAID') {
    // T2 修复扫描：订单已 PAID、SmsOrder 却还是 PENDING_PAY（翻 PAID 事务里推进那一步落空之类）→ 补推进
    const target = paidTarget({ now, quoteExpiresAt: so.quoteExpiresAt, via: so.payMode === 'BALANCE' ? 'BALANCE' : 'VMQ', payDate: o.paidAt })
    if (await casOrder(prisma, so, 'PENDING_PAY', { state: target, paidAt: so.paidAt ?? o.paidAt ?? now, failCount: 0 })) {
      await logEventQuiet({ smsOrderId: so.id, type: 'STATE', detail: { from: 'PENDING_PAY', to: target, repair: true } })
      if (target === 'ACQUIRING') await advanceOrder(so.id, 'CRON')
    }
    return
  }
  if (o.payStatus !== 'UNPAID') return
  if (o.deliveryStatus === 'CANCELLED') {
    // closeExpired 已经关了订单（预扣一般已在同一事务释放；没释放的——同单还有别的收款单挡着——这里兜底）
    await closePending(so, { reason: 'VMQ_EXPIRED', actor: 'CRON', invalidate: false })
    return
  }
  if (so.payMode === 'BALANCE') {
    // T19：余额付清单停在 PENDING_PAY（预扣之后、确认之前进程崩溃）→ 建单超过 30 秒补调 fulfillOrder(via BALANCE)
    // 用应用写的 quotedAt（= 建单时刻，§5.1：比较大小的时间一律用应用写的列，不用库默认值的 createdAt）
    if (now.getTime() - so.quotedAt.getTime() < T19_AFTER_SEC * S) return
    try {
      await fulfillOrder(so.orderId, { via: 'BALANCE' })
    } catch (e) {
      const upd = await prisma.smsOrder.update({ where: { id: so.id }, data: { failCount: { increment: 1 } }, select: { failCount: true } })
      await logEventQuiet({ smsOrderId: so.id, type: 'PAY_RETRY_ERR', detail: { error: String((e as Error)?.message ?? e).slice(0, 200), fails: upd.failCount } })
      if (upd.failCount >= T19_MANUAL_FAILS) await toManual(so.id, `余额付清单补推进连续失败 ${upd.failCount} 次：${String((e as Error)?.message ?? e).slice(0, 120)}`)
    }
    return
  }
  const vmqs = await prisma.vmqOrder.findMany({ where: { bizType: 'order', bizId: so.orderId }, select: { state: true } })
  const q = so.quoteExpiresAt.getTime()
  if (vmqs.length === 0 && now.getTime() > q + QUOTE_NO_VMQ_CLOSE_SEC * S) {
    // T4 ①：一张收款单都没有过（下单请求在发起收款前崩溃、T18 兜底也失败）
    await closePending(so, { reason: 'QUOTE_EXPIRED', actor: 'CRON', invalidate: false, requireNoVmqEver: true })
    return
  }
  if (vmqs.length > 0 && now.getTime() > q + QUOTE_VMQ_CLOSE_SEC * S && !vmqs.some((v) => v.state === 0 || v.state === 1)) {
    // T4 ②：有过收款单、锁价到期 + 20 分钟、没有 0/1 收款单（closeExpired 早该关了，这里只是兜底）
    await closePending(so, { reason: 'VMQ_EXPIRED', actor: 'CRON', invalidate: false })
  }
}

// ───────────────────────── 付款之后（vmq.fulfillCarrierOrder 动态 import 调它） ─────────────────────────

/** 付款翻 PAID 之后马上踢一次取号（最多等 8 秒由调用方控制；失败只记日志，由 tick 兜底，§6.6 第 24 条） */
export async function onPaid(orderId: number): Promise<void> {
  const so = await prisma.smsOrder.findUnique({ where: { orderId }, select: { id: true, state: true } })
  if (!so) return
  if (so.state === 'ACQUIRING') await advanceOrder(so.id, 'SYSTEM')
}

// ───────────────────────── 买家操作（T5、T6、T10、T11、T14、T18） ─────────────────────────

export type BuyerResult = { ok: true } | { ok: false; status: number; code: string; message: string; extra?: Record<string, unknown> }
const fail = (status: number, code: string, message: string, extra?: Record<string, unknown>): BuyerResult => ({ ok: false, status, code, message, extra })
const VERSION_FAIL = fail(409, 'VERSION', '状态已更新，请刷新后再试')

/** T18：买家取消待支付订单（payMode 不是 BALANCE） */
export async function buyerClose(so: SmsOrder, version: number): Promise<BuyerResult> {
  if (so.state !== 'PENDING_PAY') return VERSION_FAIL
  if (so.payMode === 'BALANCE') return fail(409, 'STATE', '余额付清的订单正在确认付款，不能取消')
  if (so.version !== version) return VERSION_FAIL
  const r = await closePending(so, { reason: 'BUYER_CLOSE', actor: 'BUYER', actorId: so.userId, version, invalidate: true })
  switch (r) {
    case 'CLOSED':
      return { ok: true }
    case 'PAID_PROCESSING':
      return fail(409, 'PAID_PROCESSING', '付款已到账，正在处理，请稍候')
    case 'PAYING':
      return fail(409, 'PAYING', '另一个页面正在发起支付，请稍后再试或直接去付款')
    case 'VERSION':
      return VERSION_FAIL
    default:
      return fail(409, 'STATE', '订单状态已变化，请刷新')
  }
}

/** 换号 / 取消的共同前提：WAITING、当前号 ACTIVE 且没有短信、满 canCancelAt、没有在途取号 */
async function numberActionPre(so: SmsOrder, version: number): Promise<{ ok: true; cur: SmsAttempt; atts: SmsAttempt[] } | { ok: false; res: BuyerResult }> {
  if (so.state !== 'WAITING' || so.version !== version) return { ok: false, res: VERSION_FAIL }
  const atts = await loadAttempts(so.id)
  const cur = atts.find((a) => a.id === so.currentAttemptId)
  if (!cur || cur.state !== 'ACTIVE' || cur.smsCount > 0) return { ok: false, res: fail(409, 'STATE', '号码状态已变化，请刷新') }
  if (atts.some(hasCode)) return { ok: false, res: fail(409, 'STATE', '已收到短信，按平台规则不能再换号或取消') }
  if (atts.some((a) => a.state === 'REQUESTING' || a.state === 'UNKNOWN')) return { ok: false, res: fail(409, 'STATE', '正在确认号码，请稍后再试') }
  const now = jnow()
  if (cur.canCancelAt && now < cur.canCancelAt) {
    const sec = Math.ceil((cur.canCancelAt.getTime() - now.getTime()) / S)
    return { ok: false, res: fail(409, 'TOO_EARLY', `还需要等 ${sec} 秒才能操作`, { sec }) }
  }
  return { ok: true, cur, atts }
}

/** T11：买家取消 → CANCELLING → 放号 → 上游确认后 REFUNDING → T15 整单退回余额 */
export async function buyerCancel(so: SmsOrder, version: number): Promise<BuyerResult> {
  const pre = await numberActionPre(so, version)
  if (!pre.ok) return pre.res
  const moved = await prisma.$transaction(async (tx) => {
    const ok = await casOrder(tx, so, 'WAITING', { state: 'CANCELLING', refundReason: 'BUYER_CANCEL' }, version)
    if (!ok) return false
    await tx.smsAttempt.updateMany({ where: { id: pre.cur.id, state: 'ACTIVE' }, data: { state: 'RELEASING', nextCheckAt: null } })
    await logEvent(tx, { smsOrderId: so.id, attemptId: pre.cur.id, type: 'CANCEL_REQ', actor: 'BUYER', actorId: so.userId })
    return true
  })
  if (!moved) return VERSION_FAIL
  const r = await releaseAttempt(pre.cur.id, 'BUYER')
  if (r.r === 'EARLY') return fail(409, 'TOO_EARLY', `还需要等 ${r.minSec ?? 0} 秒才能操作`, { sec: r.minSec ?? 0 })
  return { ok: true }
}

/**
 * T10：换号。前提同取消，外加换号次数没用完、上游线程没有受限（D8）。
 * ① 先查一次旧号（getStatus），已经有码就放弃换号 → RECEIVED（E14 ①）；② 取新号；③ CAS 切换、旧号 → RELEASING、放旧号。
 * 取新号的任何失败都回 WAITING、保留旧号、不扣次数（T10 总则）；结果未知 → 订单保持 REPLACING 等扫描器。
 */
export async function buyerReplace(so: SmsOrder, version: number, reason?: string | null): Promise<BuyerResult> {
  const pre = await numberActionPre(so, version)
  if (!pre.ok) return pre.res
  if (so.replaceCount >= so.maxReplace + so.replaceBonus) return fail(409, 'NO_LEFT', '换号次数已用完，可以继续等待，或取消（整单退回余额）')
  if (await threadsLimited()) return fail(409, 'THREADS', '当前号码资源紧张，暂不能换号；可以继续等待，或取消并退回余额')
  const moved = await casOrder(prisma, so, 'WAITING', { state: 'REPLACING', notice: null }, version)
  if (!moved) return VERSION_FAIL
  await logEventQuiet({ smsOrderId: so.id, attemptId: pre.cur.id, type: 'REPLACE_START', actor: 'BUYER', actorId: so.userId, detail: reason ? { reason } : undefined })
  const back = async (notice: string) => {
    await casOrder(prisma, { id: so.id }, 'REPLACING', { state: 'WAITING', notice })
  }
  // ① 旧号单查（E14 ①）
  if (pre.cur.activationId) {
    const st = await up.getStatus(pre.cur.activationId).catch(() => null)
    if (st) {
      const v = judgeGetStatus(st, { hasSms: false })
      if (v.v === 'RECEIVED') {
        await ingest(pre.cur, { sms: v.sms, code: v.code, text: v.text, needAllSms: v.needAllSms, source: 'replace-precheck' })
        return { ok: true }
      }
      if (v.v === 'CHECK_HISTORY') {
        await checkHistory([pre.cur], { force: true })
        const fresh = await loadOrder(so.id)
        if (fresh && fresh.state !== 'REPLACING') return { ok: true }
      }
    }
  }
  // ② 闸门（①–⑤）：挡住就回 WAITING、保留旧号
  const block = await acquireBlock({ service: so.service, country: so.country, selfSmsOrderId: so.id })
  if (block) {
    await back(REPLACE_FAIL_NOTICE)
    return { ok: true }
  }
  const fresh = (await loadOrder(so.id)) ?? so
  if (fresh.state !== 'REPLACING') return { ok: true }
  const att = await insertIntent(fresh, 'REPLACING', { reason: 'REPLACE', operator: so.operator })
  if (!att) {
    await back(REPLACE_FAIL_NOTICE)
    return { ok: true }
  }
  let r: Up<NumberData>
  try {
    r = await up.getNumberV2({ service: so.service, country: so.country, operator: att.operator, maxPriceMicro: so.capMicro })
  } catch (e) {
    r = { kind: 'err', code: 'BAD_PARAM', http: 0, raw: String((e as Error)?.message ?? e).slice(0, 200) }
  }
  await applyAcquireOutcome(fresh, att, r, 'REPLACE')
  return { ok: true }
}

/** T14（买家「我已用完，释放号码」，二次确认之后才调）：对全部 RECEIVED 的号调 finish */
export async function buyerFinish(so: SmsOrder, version: number): Promise<BuyerResult> {
  if (so.state !== 'RECEIVED' || so.version !== version) return VERSION_FAIL
  const atts = await prisma.smsAttempt.findMany({ where: { smsOrderId: so.id, state: 'RECEIVED' } })
  await logEventQuiet({ smsOrderId: so.id, type: 'FINISH_REQ', actor: 'BUYER', actorId: so.userId })
  for (const a of atts) {
    // 买家主动完成不等 endsAt − 30 秒：清掉占位直接调
    await prisma.smsAttempt.updateMany({ where: { id: a.id, state: 'RECEIVED' }, data: { nextCheckAt: null } })
    await finishAttempt(a.id)
  }
  await advanceOrder(so.id, 'BUYER', { allowAcquire: false })
  return { ok: true }
}

/** T5：READY → ACQUIRING（组合没被停售、熔断没打开） */
export async function buyerStart(so: SmsOrder, version: number): Promise<BuyerResult> {
  if (so.state !== 'READY' || so.version !== version) return VERSION_FAIL
  const block = await acquireBlock({ service: so.service, country: so.country, selfSmsOrderId: so.id })
  if (block && block.code !== 'BUSY') return fail(409, 'HOLD', '该组合暂停销售，可以取消并退回余额')
  if (!(await casOrder(prisma, so, 'READY', { state: 'ACQUIRING', notice: null }, version))) return VERSION_FAIL
  await logEventQuiet({ smsOrderId: so.id, type: 'STATE', actor: 'BUYER', actorId: so.userId, detail: { from: 'READY', to: 'ACQUIRING' } })
  await advanceOrder(so.id, 'BUYER')
  return { ok: true }
}

/** T6：READY → REFUNDING → 立即 T15（没有任何尝试） */
export async function buyerRefundReady(so: SmsOrder, version: number): Promise<BuyerResult> {
  if (so.state !== 'READY' || so.version !== version) return VERSION_FAIL
  if (!(await toRefunding(so, 'READY', 'LATE_START_REFUND', 'BUYER', version))) return VERSION_FAIL
  return { ok: true }
}

// ───────────────────────── 买家 GET 的惰性推进（§6.5、E19） ─────────────────────────

/**
 * 先用 CAS 占住 advancedAt（距上次 ≥3 秒），只对这一张单推进；当前号是 ACTIVE 时再占 checkedAt（≥4 秒）→ getStatus（D10）。
 * 每张单最多 0.25 次上游调用 / 秒，与打开页面的人数无关。顺带检查 tick 心跳（超过 3 分钟推一次，进程内 30 分钟节流）。
 */
export async function lazyAdvance(smsOrderId: number): Promise<void> {
  const now = jnow()
  const claimed = await prisma.smsOrder.updateMany({
    where: { id: smsOrderId, OR: [{ advancedAt: null }, { advancedAt: { lte: new Date(now.getTime() - LAZY_ADVANCE_SEC * S) } }] },
    data: { advancedAt: now },
  })
  void checkHeartbeat().catch(() => undefined)
  if (claimed.count !== 1) return
  const so = await loadOrder(smsOrderId)
  if (!so || so.state === 'CLOSED' || so.state === 'CANCELLED') return
  if (['WAITING', 'REPLACING', 'CANCELLING', 'REFUNDING', 'RECEIVED'].includes(so.state) && so.currentAttemptId) {
    const cur = await prisma.smsAttempt.findUnique({ where: { id: so.currentAttemptId } })
    if (cur && cur.state === 'ACTIVE' && cur.activationId) {
      const c = await prisma.smsAttempt.updateMany({
        where: { id: cur.id, state: 'ACTIVE', OR: [{ checkedAt: null }, { checkedAt: { lte: new Date(now.getTime() - STATUS_CHECK_SEC * S) } }] },
        data: { checkedAt: now },
      })
      if (c.count === 1) {
        const r = await up.getStatus(cur.activationId).catch(() => null)
        if (r) {
          const v = judgeGetStatus(r, { hasSms: cur.smsCount > 0 })
          if (v.v === 'RECEIVED') await ingest(cur, { sms: v.sms, code: v.code, text: v.text, needAllSms: v.needAllSms, source: 'getStatus' })
          else if (v.v === 'CHECK_HISTORY') await checkHistory([cur], { force: true })
          else if (v.v === 'NOINFO') await noinfoEffects(v)
        }
      }
    }
  }
  const atts = await prisma.smsAttempt.count({ where: { smsOrderId, OR: [{ state: 'UNKNOWN' }, { state: 'REQUESTING', requestedAt: { lt: new Date(now.getTime() - REQUESTING_STUCK_SEC * S) } }] } })
  if (atts > 0) await scanUnknown({}).catch((e) => console.error('[jiema] 惰性推进的认领扫描失败', (e as Error)?.message))
  await advanceOrder(smsOrderId, 'BUYER')
}

/** E19：心跳超过 3 分钟 → 推送（进程内 30 分钟只推一次） */
export async function checkHeartbeat(): Promise<boolean> {
  const row = await prisma.setting.findUnique({ where: { key: SMS_RUNTIME_KEY } })
  let tickAt = 0
  try {
    tickAt = row ? Date.parse((JSON.parse(row.value) as { tickAt?: string }).tickAt ?? '') || 0 : 0
  } catch {
    tickAt = 0
  }
  if (Date.now() - tickAt <= HEARTBEAT_STALE_SEC * S) return false
  smsAlert('TICK_STALE', '接码推进任务（jiema-tick）心跳超过 3 分钟', [
    { label: '最近心跳', value: tickAt ? new Date(tickAt).toISOString() : '从未' },
    { label: '影响', value: '买家打开号码页时仍会惰性推进；没人看的单到期不会及时退款' },
    { label: '处理', value: '核对 cron 容器与 crontab 里的 jiema-tick 一行' },
  ], { throttleMs: 30 * 60_000 })
  return true
}

// ───────────────────────── tick（/api/cron/jiema-tick，§6.5） ─────────────────────────

export interface TickStats {
  ran: boolean
  rounds: number
  polled: number
  advanced: number
  released: number
  repaired: number
  claimed: number
}

async function writeHeartbeat(): Promise<void> {
  const value = JSON.stringify({ tickAt: new Date().toISOString() })
  await prisma.setting.upsert({ where: { key: SMS_RUNTIME_KEY }, create: { key: SMS_RUNTIME_KEY, value }, update: { value } })
}

/** 一轮（§6.5 的 1–4 步）。测试直接调它；cron 路由调 runTick（45 秒循环） */
export async function tickRound(stats?: TickStats): Promise<TickStats> {
  const s: TickStats = stats ?? { ran: true, rounds: 0, polled: 0, advanced: 0, released: 0, repaired: 0, claimed: 0 }
  s.rounds++
  // 1. 批量查码
  try {
    const p = await pollActive()
    s.polled += p.polled
  } catch (e) {
    console.error('[jiema] tick 查码失败', (e as Error)?.message)
  }
  // 2. 解开 REQUESTING（>60 秒）与 UNKNOWN
  try {
    const now = jnow()
    const needCalib = periodicDue('calibFill', 10 * 60_000, now.getTime())
    const c = await scanUnknown({ fillCalibration: needCalib })
    s.claimed += c.claimed
  } catch (e) {
    console.error('[jiema] tick 认领扫描失败', (e as Error)?.message)
  }
  // 3. 推进中间态的订单（ACQUIRING 每轮最多 5 单发起取号）
  try {
    const now = jnow()
    const orders = await prisma.smsOrder.findMany({
      where: {
        OR: [
          { state: { in: ['PENDING_PAY', 'READY', 'ACQUIRING', 'WAITING', 'REPLACING', 'CANCELLING', 'REFUNDING', 'RECEIVED', 'MANUAL'] } },
          { state: { in: ['FINISHED', 'REFUNDED'] }, costFinal: false, updatedAt: { gte: new Date(now.getTime() - 3 * 86400_000) } },
        ],
      },
      orderBy: { id: 'asc' },
      select: { id: true, state: true },
      take: 500,
    })
    let acquires = 0
    for (const o of orders) {
      const allow = o.state === 'ACQUIRING' ? acquires++ < 5 : true
      await advanceOrder(o.id, 'CRON', { allowAcquire: allow })
      s.advanced++
    }
  } catch (e) {
    console.error('[jiema] tick 推进订单失败', (e as Error)?.message)
  }
  // 4. 熔断（每轮）；余额刷新与低余额告警（每 5 分钟）；本站 / 上游成功率（5 / 10 分钟）
  try {
    await evaluateBreaker()
    const now = jnow().getTime()
    if (periodicDue('balance', 5 * 60_000, now)) {
      await refreshBalance()
      checkLowBalance()
    }
    await periodicMonitors()
  } catch (e) {
    console.error('[jiema] tick 监控失败', (e as Error)?.message)
  }
  return s
}

/**
 * cron 入口：抢锁 jiema:tick（TTL 90 秒，抢不到就返回）→ 写心跳 → 每 5 秒一轮，直到 45 秒 → 释放锁。
 * 旧链路仍由 sms-poll 负责，这里不调 pollAllWaiting（§6.5）。
 */
export async function runTick(opts: { budgetMs?: number; intervalMs?: number } = {}): Promise<TickStats> {
  const budget = opts.budgetMs ?? 45_000
  const interval = opts.intervalMs ?? 5_000
  const token = await acquireLock('jiema:tick', 90_000)
  const stats: TickStats = { ran: !!token, rounds: 0, polled: 0, advanced: 0, released: 0, repaired: 0, claimed: 0 }
  if (!token) return stats
  const started = Date.now()
  try {
    // S4 的周期监控（未关联激活分类、卡住的预扣、到点推日报）：每趟一次、失败只记日志；不放进 tickRound（测试直接调 tickRound）
    await import('./monitor').then((m) => m.tickExtras()).catch((e) => console.error('[jiema] S4 周期监控失败', (e as Error)?.message))
    for (;;) {
      await writeHeartbeat().catch((e) => console.error('[jiema] 写心跳失败', (e as Error)?.message))
      const roundStart = Date.now()
      await tickRound(stats)
      await renewLock('jiema:tick', token)
      const elapsed = Date.now() - started
      if (elapsed + interval > budget) break
      const wait = Math.max(0, interval - (Date.now() - roundStart))
      await new Promise((r) => setTimeout(r, wait))
    }
  } finally {
    await releaseLock('jiema:tick', token)
  }
  return stats
}

// ───────────────────────── 管理员（§7.2 的动作；后台页面与接口在 S2b） ─────────────────────────

/**
 * T16 售后退款：先放掉还开着的号（ACTIVE 放号、RECEIVED 完成），再整单原路退回余额，成本照计。
 * opts.allowManual：MANUAL（收过码的）单直接在 T16 的事务里 MANUAL → REFUNDED（失败时留在 MANUAL；S2b 评审修复）
 * opts.complaint：这张单的售后申请在 T16 同一个事务里收成「已通过」时用的备注与入口（S3 评审修复）；返回的 complaintClosed = 本次收尾了一条
 */
export async function adminRefund(
  smsOrderId: number,
  adminId: number,
  reason = 'COMPLAINT',
  opts: { allowManual?: boolean; complaint?: { note: string | null; via: 'APPROVE' | 'ORDER' } } = {},
): Promise<{ ok: boolean; why?: string; complaintClosed?: boolean }> {
  const atts = await prisma.smsAttempt.findMany({ where: { smsOrderId, state: { in: ['ACTIVE', 'RECEIVED'] } } })
  for (const a of atts) {
    if (a.state === 'ACTIVE') {
      await prisma.smsAttempt.updateMany({ where: { id: a.id, state: 'ACTIVE' }, data: { state: 'RELEASING', nextCheckAt: null } })
      await releaseAttempt(a.id, 'SYSTEM').catch(() => undefined)
    } else {
      await prisma.smsAttempt.updateMany({ where: { id: a.id, state: 'RECEIVED' }, data: { nextCheckAt: null } })
      await finishAttempt(a.id).catch(() => undefined)
    }
  }
  // finish 成功时订单已 RECEIVED → FINISHED；两种都可以售后
  const r = await refundAfterSale(smsOrderId, adminId, reason, opts)
  return r.done ? { ok: true, complaintClosed: !!r.complaintClosed } : { ok: false, why: r.why }
}

/**
 * MANUAL / 待支付单「关单并原路退回预扣」（仅在订单 UNPAID、没有 state 0/1 收款单时可用，与 T4 同一个事务；§7.2）。
 * **不替买家作废收款单**（invalidate=false，S2a 评审修复）：有 state=0 的 → PAYING（买家手里的二维码还有效，先等它超时或让买家取消），
 * 有 state=1 的 → PAID_PROCESSING（钱到了，改用「关单并把到账退入余额」或「取消并退回余额」）。
 */
export async function adminCloseAndRelease(smsOrderId: number, adminId: number): Promise<CloseOutcome> {
  const so = await loadOrder(smsOrderId)
  if (!so) return 'STATE'
  return closePending(so, { reason: 'ADMIN_CLOSE', actor: 'ADMIN', actorId: adminId, invalidate: false, fromStates: ['PENDING_PAY', 'MANUAL'] })
}

class LatepayCloseRefused extends Error {
  constructor(public readonly why: LatepayCloseWhy) {
    super(`[jiema] 关单并把到账退入余额的前提不满足：${why}`)
  }
}
/** STATE：接码单不是 MANUAL / 已变化；ORDER：订单不是「UNPAID 且未取消」；NO_PAID_VMQ：没有 state=1 的收款单；HOLD_HELD：预扣还是 HELD（改用「关单并原路退回预扣」） */
export type LatepayCloseWhy = 'STATE' | 'ORDER' | 'NO_PAID_VMQ' | 'HOLD_HELD'

/**
 * E44「关单并把到账退入余额」：钱已到账（state=1 的收款单）、却因为预扣不是 HELD 翻不了 PAID 的单（SmsOrder 已是 MANUAL）。
 * 一个事务里订单 CAS 取消、SmsOrder → CLOSED（预扣保持原样，另行人工核实）；随后同一请求对每张已到账收款单调 recordCarrierPaid
 * （补记 duplicate_payment 并按 §2.7 自动退入；不满足自动条件的留在待核实列表里由站长退入）。入账键只有 latepay:<条目 key> 一种。
 * 【前提在同一事务里核对】（§7.2，S2a 评审修复）锁订单行后要求：订单 UNPAID 且未取消、至少一张 state=1 的收款单、预扣不存在或不是 HELD。
 * 预扣还是 HELD 却关了单，之后就没有任何路径能释放它（CLOSED 不再推进，closePending 只收 PENDING_PAY / MANUAL）——拒绝，改用「关单并原路退回预扣」。
 */
export async function adminCloseWithLatepay(smsOrderId: number, adminId: number): Promise<{ ok: boolean; keys: string[]; why?: LatepayCloseWhy }> {
  const so = await loadOrder(smsOrderId)
  if (!so || so.state !== 'MANUAL') return { ok: false, keys: [], why: 'STATE' }
  try {
    await prisma.$transaction(async (tx) => {
      // 锁顺序：订单 → 接码单 → 预扣
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${so.orderId} FOR UPDATE`
      const o = await tx.order.findUnique({ where: { id: so.orderId }, select: { payStatus: true, deliveryStatus: true } })
      if (!o || o.payStatus !== 'UNPAID' || o.deliveryStatus === 'CANCELLED') throw new LatepayCloseRefused('ORDER')
      const paidVmq = await tx.vmqOrder.count({ where: { bizType: 'order', bizId: so.orderId, state: 1 } })
      if (paidVmq === 0) throw new LatepayCloseRefused('NO_PAID_VMQ')
      const c = await tx.order.updateMany({ where: { id: so.orderId, payStatus: 'UNPAID', deliveryStatus: { not: 'CANCELLED' } }, data: { deliveryStatus: 'CANCELLED' } })
      if (c.count !== 1) throw new LatepayCloseRefused('ORDER')
      const s = await tx.smsOrder.updateMany({ where: { id: so.id, state: 'MANUAL' }, data: { state: 'CLOSED', version: { increment: 1 }, notice: null } })
      if (s.count !== 1) throw new LatepayCloseRefused('STATE')
      const hold = await lockHoldInTx(tx, so.orderId)
      if (hold && hold.state === 'HELD') throw new LatepayCloseRefused('HOLD_HELD')
      await logEvent(tx, { smsOrderId: so.id, type: 'ADMIN_CLOSE_LATEPAY', actor: 'ADMIN', actorId: adminId, detail: { holdState: hold?.state ?? null, paidVmq } })
    })
  } catch (e) {
    if (e instanceof LatepayCloseRefused) return { ok: false, keys: [], why: e.why }
    throw e
  }
  const paid = await prisma.vmqOrder.findMany({ where: { bizType: 'order', bizId: so.orderId, state: 1 }, select: { id: true } })
  const keys: string[] = []
  for (const v of paid) {
    const r = await recordCarrierPaid(v.id)
    if (r.key) keys.push(r.key)
  }
  return { ok: true, keys }
}

/** MANUAL 且已付款的单「取消并退回余额」：→ REFUNDING，放掉还开着的号，全部终态后 T15（支付宝部分核对不上会再转 MANUAL） */
export async function adminCancelRefund(smsOrderId: number, adminId: number): Promise<boolean> {
  const so = await loadOrder(smsOrderId)
  if (!so || so.state !== 'MANUAL') return false
  const o = await prisma.order.findUnique({ where: { id: so.orderId }, select: { payStatus: true } })
  if (o?.payStatus !== 'PAID') return false
  const atts = await loadAttempts(so.id)
  if (atts.some(hasCode)) return false
  // 还有结果未知的取号：不转 REFUNDING（会先放掉买家手上的号，扫描器随后又把单冻回 MANUAL；S2b 评审修复）
  if (atts.some((a) => a.state === 'REQUESTING' || a.state === 'UNKNOWN')) return false
  if (!(await casOrder(prisma, so, 'MANUAL', { state: 'REFUNDING', refundReason: 'ADMIN_CANCEL', manualAt: null, failCount: 0 }))) return false
  await logEventQuiet({ smsOrderId: so.id, type: 'ADMIN_CANCEL', actor: 'ADMIN', actorId: adminId })
  await advanceOrder(so.id, 'CRON', { allowAcquire: false })
  return true
}

// ───────────────────────── 扫描器的落地（claim.ts 动态 import 调） ─────────────────────────

/** 认领之后：订单 ACQUIRING → T8；REPLACING 且是换号尝试 → 把切换做完；其余（订单已不在等这个号）→ RELEASING、120 秒后放掉（E14 ②、T10 总则） */
export async function afterClaim(smsOrderId: number, attemptId: number): Promise<void> {
  const [so, att] = await Promise.all([loadOrder(smsOrderId), prisma.smsAttempt.findUnique({ where: { id: attemptId } })])
  if (!so || !att || att.state !== 'ACTIVE') return
  if (so.state === 'ACQUIRING') return settleAcquired(so.id, att)
  if (so.state === 'REPLACING' && att.reason === 'REPLACE') return switchToNew(so.id, att)
  // 订单已不在等这个号——除非并发的 advanceAcquiring / advanceWithNumbers 刚把它结算成当前号（那样就什么都不做）
  await releaseUnattached(smsOrderId, att, `claimed-while-${so.state}`)
}

/** 确认没买到之后：换号 → 回 WAITING、保留旧号、不扣次数（T10 总则）；首次取号 → 按重试规则继续（这一次算数，E1） */
export async function afterNotBought(smsOrderId: number, att: Pick<SmsAttempt, 'reason'>): Promise<void> {
  if (att.reason === 'REPLACE') {
    if (await casOrder(prisma, { id: smsOrderId }, 'REPLACING', { state: 'WAITING', notice: REPLACE_FAIL_NOTICE })) {
      await logEventQuiet({ smsOrderId, type: 'REPLACE_FAIL', detail: { why: 'NOT_BOUGHT' } })
    }
    return
  }
  await advanceOrder(smsOrderId, 'CRON')
}
