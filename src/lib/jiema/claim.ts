/**
 * 短信接码 · UNKNOWN 取号的扫描器（docs/短信接码-设计.md §2.4、D19、E8、E9、附录 B 第 1、5、12 条）。
 *
 * 取号结果不明（超时、5xx、格式异常、落库失败、REQUESTING 卡住超过 60 秒）**绝不重取**，只由这里解开：
 *  · 候选来源：v1 `GET /activations`，**一直翻到某一页少于 25 条**才算拉全；任何一页失败、超时或认不出 → 这一轮作废（不认领，也不计入「没有候选」）；
 *  · 排除本站已知的激活：sms_attempts.activationId、旧表 sms_activations.activationId、近 24 小时旧单品订单备注里「旧号 xxx 已取消」的号码；
 *  · 时钟校准：近 24 小时正常取到号的尝试「上游 createdAt − 我方 respondedAt」的中位数；**没有样本就不做自动认领**（10 分钟后转人工）；
 *  · 候选条件：服务、国家相同；指定了运营商时运营商相同；price ≤ maxPriceMicro；校准后的 createdAt 落在认领窗（upstream.acquireClaimWindow，
 *    以 sentAt / requestedAt 为锚，只比设计原文宽）；
 *  · 自动认领的闸门（任何一条不满足 → 不认领，转 MANUAL 并告警）：候选恰好 1 个；同一组合没有别的 REQUESTING / UNKNOWN 尝试；
 *    旧链路闸门：[requestedAt − 2 分钟, now] 里没有同服务的旧单品订单付款、没有 sms_activations 更新、没有「已付款却还没有 SmsActivation 行」的旧单品订单；
 *  · 确认没买到：距请求超过 180 秒、并且**连续两轮有效扫描**都没有任何候选（只按服务、国家、时间窗，不看闸门）→ FAILED（NOT_BOUGHT）；
 *    两轮之间至少隔一个 tick 周期（NOT_BOUGHT_SCAN_GAP_SEC，checkedAt 记最近一次计数的时刻），计数对旧值做 CAS；
 *    没有校准样本时时间窗两头各再放宽 60 秒（machine.claimCandidates）——只会多出候选、导向 MANUAL，不会把真买到的号判成没买到；
 *  · UNKNOWN 超过 10 分钟没解开 → 订单转 MANUAL；
 *  · 与任何 UNKNOWN 都对不上的未关联激活**永远不自动取消**：旧单品服务、且在某张旧单品订单付款后 30 分钟内的算「旧链路遗留」（不推送），其余「外部激活」推一次。
 * 顺带：拉全的 v1 列表里第一次看到我方 ACTIVE 号时补写 upstreamCreatedAt（校准样本）。
 *
 * 【同一时刻只跑一轮】（S2a 评审修复）tick 第 2 步与买家 GET 的惰性推进都会调这里、而且每次扫全站的 UNKNOWN：用库锁 jiema:scan 串行，
 * 抢不到就跳过这一轮（下一轮再来）。认领的 CAS 落空时先重读尝试：已经不是 UNKNOWN（别的扫描认领了、或已判 NOT_BOUGHT）就跳过，不转人工。
 */
import type { SmsAttempt } from '@prisma/client'
import { prisma } from '../db'
import * as up from './upstream'
import type { V1Activation } from './parse'
import {
  calibrationOffsetMs,
  claimCandidates,
  legacyOldPhones,
  canCancelAtFrom,
  waitUntilFor,
  endsAtFrom,
  REQUESTING_STUCK_SEC,
  UNKNOWN_MANUAL_SEC,
  NOT_BOUGHT_AFTER_SEC,
  NOT_BOUGHT_EMPTY_SCANS,
  NOT_BOUGHT_SCAN_GAP_SEC,
} from './machine'
import { logEventQuiet } from './events'
import { smsAlert } from './alert'
import { toManual } from './refund'
import { jnow, rt } from './runtime'
import { acquireLock, releaseLock } from '../marketing/lock'

const S = 1000
const SCAN_LOCK = 'jiema:scan'
const SCAN_LOCK_TTL_MS = 60_000

export interface ScanResult {
  valid: boolean
  claimed: number
  notBought: number
  manual: number
  external: number
}

/** 近 24 小时旧单品订单备注里换下的号码（旧表只保存当前号，§2.4） */
async function legacyPhones(now: Date): Promise<Set<string>> {
  const rows = await prisma.order.findMany({
    where: { updatedAt: { gte: new Date(now.getTime() - 24 * 3600 * S) }, remark: { contains: '旧号' }, product: { deliveryType: 'SMS' } },
    select: { remark: true },
    take: 2000,
  })
  const out = new Set<string>()
  for (const r of rows) for (const p of legacyOldPhones(r.remark)) out.add(p)
  return out
}

/**
 * 旧链路闸门（§2.4）：窗口 [from, now] 里没有同服务的旧单品订单付款、没有 sms_activations 更新、
 * 也没有「已付款却还没有 SmsActivation 行」的旧单品订单（近 24 小时）。旧单品卖的正是 dr / acz、商品还有随机国家，所以不比较国家。
 */
async function legacyGateOk(service: string, from: Date, now: Date): Promise<boolean> {
  const [paid, acts, orphan] = await Promise.all([
    prisma.order.count({ where: { paidAt: { gte: from, lte: now }, product: { deliveryType: 'SMS', smsService: service } } }),
    prisma.smsActivation.count({ where: { updatedAt: { gte: from } } }),
    prisma.$queryRaw<{ n: bigint | number }[]>`
      SELECT COUNT(*) AS n FROM orders o JOIN products p ON p.id = o.product_id
       WHERE p.delivery_type = 'SMS' AND o.pay_status = 'PAID' AND o.delivery_status <> 'CANCELLED'
         AND o.paid_at >= ${new Date(now.getTime() - 24 * 3600 * S)}
         AND NOT EXISTS (SELECT 1 FROM sms_activations a WHERE a.order_id = o.id)`,
  ])
  return paid === 0 && acts === 0 && Number(orphan[0]?.n ?? 0) === 0
}

/** 旧单品会卖的服务（products 里 deliveryType=SMS 的 smsService），「旧链路遗留」分类用 */
async function legacyServices(): Promise<Set<string>> {
  const rows = await prisma.product.findMany({ where: { deliveryType: 'SMS', smsService: { not: null } }, select: { smsService: true } })
  return new Set(rows.map((r) => (r.smsService ?? '').toLowerCase()).filter(Boolean))
}

/** 认领：写入 activationId、号码、成本、运营商，endsAt = expiredAt，canCancelAt = 认领时刻 + 123 秒（与 T8 同一常量，比设计的 120 秒更保守），转 ACTIVE；随后按订单状态落地 */
async function claim(u: SmsAttempt, c: V1Activation, offsetMs: number, now: Date): Promise<boolean> {
  const so = await prisma.smsOrder.findUnique({ where: { id: u.smsOrderId }, select: { longWaitOk: true } })
  const createdAt = c.createdAt ? new Date(c.createdAt.getTime() - offsetMs) : now
  const endsAt = c.expiredAt && c.expiredAt.getTime() > now.getTime() ? c.expiredAt : endsAtFrom(null, createdAt)
  const canCancelAt = canCancelAtFrom(now)
  const waitUntil = waitUntilFor({ startAt: createdAt, canCancelAt, endsAt, longWaitOk: !!so?.longWaitOk })
  try {
    const r = await prisma.smsAttempt.updateMany({
      where: { id: u.id, state: 'UNKNOWN' },
      data: {
        state: 'ACTIVE',
        activationId: c.id,
        phone: c.phone ? c.phone.slice(0, 24) : null,
        dialCode: c.dialCode,
        operatorActual: c.operator,
        costMicro: c.priceMicro,
        upstreamCreatedAt: c.createdAt,
        canCancelAt,
        endsAt,
        waitUntil,
        errorCode: null,
        emptyScans: 0,
        checkedAt: null,
      },
    })
    if (r.count !== 1) return false
  } catch (e) {
    // activationId 唯一：别的尝试已经认领了它（不该发生）→ 不认领，交给人工
    console.error('[jiema] 认领写库失败', u.id, c.id, (e as Error)?.message)
    return false
  }
  await logEventQuiet({ smsOrderId: u.smsOrderId, attemptId: u.id, type: 'ADOPT', detail: { activationId: c.id, costMicro: c.priceMicro } })
  // 落地：动态 import 引擎（engine 静态 import 了本文件）
  const eng = await import('./engine')
  await eng.afterClaim(u.smsOrderId, u.id)
  return true
}

/**
 * 一轮扫描（tick 第 2 步；买家 GET 发现有 UNKNOWN 时也会调）。fillCalibration：近 24 小时校准样本不足 5 个且有 ACTIVE 尝试时，拉一页 v1 活跃列表补样本。
 */
export async function scanUnknown(opts: { fillCalibration?: boolean } = {}): Promise<ScanResult> {
  const out: ScanResult = { valid: false, claimed: 0, notBought: 0, manual: 0, external: 0 }
  const now = jnow()
  // REQUESTING 超过 60 秒 → UNKNOWN（进程在调用中途崩溃，或落库失败）
  await prisma.smsAttempt.updateMany({ where: { state: 'REQUESTING', requestedAt: { lt: new Date(now.getTime() - REQUESTING_STUCK_SEC * S) } }, data: { state: 'UNKNOWN', errorCode: 'STUCK' } })
  const pending = await prisma.smsAttempt.count({ where: { state: 'UNKNOWN' } })
  const since24 = new Date(now.getTime() - 24 * 3600 * S)
  let wantCalib = false
  if (!pending && opts.fillCalibration) {
    const [samples, uncal] = await Promise.all([
      prisma.smsAttempt.count({ where: { respondedAt: { gte: since24 }, upstreamCreatedAt: { not: null } } }),
      prisma.smsAttempt.count({ where: { state: 'ACTIVE', upstreamCreatedAt: null, respondedAt: { not: null } } }),
    ])
    wantCalib = samples < 5 && uncal > 0
  }
  if (!pending && !wantCalib) return out
  // 同一时刻只跑一轮：另一轮正在扫（tick 与号码页轮询撞上）→ 这一轮作废，不认领、不计数
  const token = await acquireLock(SCAN_LOCK, SCAN_LOCK_TTL_MS)
  if (!token) return out
  try {
    return await scanLocked(out, now, since24, wantCalib)
  } finally {
    await releaseLock(SCAN_LOCK, token)
  }
}

async function scanLocked(out: ScanResult, now: Date, since24: Date, wantCalib: boolean): Promise<ScanResult> {
  // 拿到锁之后再读一次（上一轮扫描可能刚认领 / 判完）
  const unknowns = await prisma.smsAttempt.findMany({ where: { state: 'UNKNOWN' }, orderBy: { id: 'asc' } })
  if (!unknowns.length && !wantCalib) return out
  const list = await up.v1AllActivations().catch(() => null)
  if (!list || list.kind !== 'ok') return out // 这一轮作废：既不认领，也不计入「没有候选」
  out.valid = true
  const items = list.data.items
  const ids = items.map((i) => i.id)
  // 补写校准样本：我方正常取到号（有 respondedAt）的号第一次出现在 v1 列表里
  if (ids.length) {
    const mine = await prisma.smsAttempt.findMany({ where: { activationId: { in: ids } }, select: { id: true, activationId: true, upstreamCreatedAt: true, respondedAt: true } })
    const byId = new Map(items.map((i) => [i.id, i]))
    for (const m of mine) {
      const it = m.activationId ? byId.get(m.activationId) : null
      if (it?.createdAt && !m.upstreamCreatedAt && m.respondedAt) await prisma.smsAttempt.update({ where: { id: m.id }, data: { upstreamCreatedAt: it.createdAt } })
    }
  }
  if (!unknowns.length) return out

  const knownIds = new Set<string>()
  if (ids.length) {
    const [a, l] = await Promise.all([
      prisma.smsAttempt.findMany({ where: { activationId: { in: ids } }, select: { activationId: true } }),
      prisma.smsActivation.findMany({ where: { activationId: { in: ids } }, select: { activationId: true } }),
    ])
    for (const x of a) if (x.activationId) knownIds.add(x.activationId)
    for (const x of l) knownIds.add(x.activationId)
  }
  const oldPhones = await legacyPhones(now)
  const free = items.filter((i) => !knownIds.has(i.id) && !(i.phone && oldPhones.has(i.phone)))
  const samples = await prisma.smsAttempt.findMany({
    where: { respondedAt: { gte: since24 }, upstreamCreatedAt: { not: null } },
    select: { respondedAt: true, upstreamCreatedAt: true },
    take: 200,
    orderBy: { id: 'desc' },
  })
  const offset = calibrationOffsetMs(samples.filter((x) => x.respondedAt && x.upstreamCreatedAt) as Array<{ respondedAt: Date; upstreamCreatedAt: Date }>)
  const matched = new Set<string>()
  for (const u of unknowns) {
    const win = up.acquireClaimWindow({ requestedAtMs: u.requestedAt.getTime(), sentAtMs: u.dispatchedAt ? u.dispatchedAt.getTime() : null })
    const { broad, strict } = claimCandidates(
      { service: u.service, country: u.country, operator: u.operator, maxPriceMicro: u.maxPriceMicro, window: win },
      free.map((f) => ({ id: f.id, service: f.service, country: f.country, operator: f.operator, priceMicro: f.priceMicro, createdAt: f.createdAt })),
      offset,
    )
    for (const b of broad) matched.add(b.id)
    if (broad.length === 0) {
      // 计一轮「没有候选」：距上一次计数至少一个 tick 周期，并且对旧值做 CAS（别的扫描刚计过就不重复计）
      if (u.checkedAt && now.getTime() - u.checkedAt.getTime() < NOT_BOUGHT_SCAN_GAP_SEC * S) continue
      const inc = await prisma.smsAttempt.updateMany({ where: { id: u.id, state: 'UNKNOWN', emptyScans: u.emptyScans }, data: { emptyScans: u.emptyScans + 1, checkedAt: now } })
      if (inc.count !== 1) continue
      const scans = u.emptyScans + 1
      if (now.getTime() - u.requestedAt.getTime() > NOT_BOUGHT_AFTER_SEC * S && scans >= NOT_BOUGHT_EMPTY_SCANS) {
        const r = await prisma.smsAttempt.updateMany({ where: { id: u.id, state: 'UNKNOWN' }, data: { state: 'FAILED', errorCode: 'NOT_BOUGHT', closedAt: now } })
        if (r.count === 1) {
          out.notBought++
          await logEventQuiet({ smsOrderId: u.smsOrderId, attemptId: u.id, type: 'NOT_BOUGHT', detail: { scans } })
          const eng = await import('./engine')
          await eng.afterNotBought(u.smsOrderId, u)
        }
      }
      continue
    }
    if (u.emptyScans) await prisma.smsAttempt.updateMany({ where: { id: u.id, state: 'UNKNOWN' }, data: { emptyScans: 0 } })
    if (offset == null) continue // 24 小时内没有校准样本：不做自动认领（10 分钟后转人工）
    const others = await prisma.smsAttempt.count({ where: { service: u.service, country: u.country, state: { in: ['REQUESTING', 'UNKNOWN'] }, id: { not: u.id } } })
    const legacyOk = await legacyGateOk(u.service, new Date(u.requestedAt.getTime() - 2 * 60 * S), now)
    const cand = strict.length === 1 ? free.find((f) => f.id === strict[0].id) : undefined
    if (cand && others === 0 && legacyOk) {
      if (await claim(u, cand, offset, now)) {
        out.claimed++
        continue
      }
      // CAS 落空：这个尝试已经被别的扫描认领、或已判 NOT_BOUGHT → 不是歧义，跳过（绝不把刚解开的单冻成 MANUAL）
      const again = await prisma.smsAttempt.findUnique({ where: { id: u.id }, select: { state: true } })
      if (!again || again.state !== 'UNKNOWN') continue
    }
    const why = strict.length !== 1 ? `候选 ${strict.length} 个（宽口径 ${broad.length} 个）` : others ? '同一组合还有别的在途取号' : !legacyOk ? '窗口内旧单品链路有取号 / 换号动作' : '认领写库失败'
    if (await toManual(u.smsOrderId, `取号结果未知、不能自动认领：${why}（attempt #${u.id}）`)) out.manual++
  }
  // UNKNOWN 超过 10 分钟没解开 → MANUAL
  const stale = await prisma.smsAttempt.findMany({ where: { state: 'UNKNOWN', requestedAt: { lt: new Date(now.getTime() - UNKNOWN_MANUAL_SEC * S) } }, select: { id: true, smsOrderId: true } })
  for (const s of stale) if (await toManual(s.smsOrderId, `取号结果未知超过 10 分钟没解开（attempt #${s.id}）`)) out.manual++

  // 未关联激活：永远不自动取消；外部激活推一次
  const unassoc = free.filter((f) => !matched.has(f.id))
  if (unassoc.length) {
    const lsv = await legacyServices()
    for (const f of unassoc) {
      if (rt().externalAlerted.has(f.id)) continue
      let legacy = false
      if (f.service && lsv.has(f.service.toLowerCase()) && f.createdAt) {
        const n = await prisma.order.count({
          where: { product: { deliveryType: 'SMS' }, paidAt: { gte: new Date(f.createdAt.getTime() - 30 * 60 * S), lte: f.createdAt } },
        })
        legacy = n > 0
      }
      rt().externalAlerted.add(f.id)
      if (rt().externalAlerted.size > 5000) rt().externalAlerted.clear()
      if (legacy) continue
      out.external++
      smsAlert(`EXTERNAL:${f.id}`, '上游有一个本站不认识的激活（外部激活，不会自动取消）', [
        { label: '激活', value: f.id },
        { label: '组合', value: `${f.service ?? '?'} · ${f.country ?? '?'}` },
        { label: '创建', value: f.createdAt?.toISOString() ?? '—' },
        { label: '说明', value: '站长在官网手动买的，或历史遗留；确认无用可到上游后台自行处理' },
      ], { throttleMs: 0 })
    }
  }
  return out
}
