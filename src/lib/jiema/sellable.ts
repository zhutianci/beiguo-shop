/**
 * 短信接码 · 下单与发起支付前的可售判定 `checkSellable`，以及取号前的闸门 `acquireBlock`（docs/短信接码-设计.md §6.1 gate ①–⑥、E5、E26、E59、E63）。
 *
 * 【为什么不直接写在 gate.ts】⑥ 要读目录成员（catalog.catalogPresence）与上游余额（upbalance），而 catalog.ts 已经 import gate.ts；
 * 放在 gate.ts 会成环。纯函数（comboBlock、inflightMicro、affordable）仍在 gate.ts，这里只做查库与编排。
 *
 * checkSellable（T1 与 pay/vmq/create 新发起收款单前共用，§6.6 第 26 条），按顺序，任何一项不过就返回原因：
 *   ① sms_holds 的 global 有效（熔断、封禁、币种异常、key 失效…）或本进程没配 key → MAINTENANCE；
 *   ② svc: / country: / combo: 任一有效 → HOLD；③ 服务或国家 status=OFF → HOLD；④ 覆盖规则 disabled → HOLD；
 *      （外加：组合已不在目录里 → HOLD——T1 前面的 quote 已经把它判成 404，这里只给 pay/vmq/create 的复核用）
 *   ⑤ 线程（threads 记录的剩余线程，E5）与新板块在途号码数（maxActiveNumbers）没有余量 → BUSY；
 *   ⑥ 上游余额够付本单：缓存余额 − 不含本单的在途占用 ≥ eff(cap)（§3.2；缓存超过 5 分钟、为空或未知先同步刷新，失败按不够）→ 否则 UNAVAILABLE。
 *   ⑥ 不是停售线、没有安全垫（Q4、附录 B 第 26 条）；被拒时推 sms.alert（UPSTREAM_INSUFFICIENT，1 小时一次）并计入当天拒单数。
 * acquireBlock（T7 发起取号、T10 换号前）：只查 ①–⑤，**不查余额**（付款后取号撞 NO_BALANCE 按 E3 退回余额），也**不读 sms_config**
 * （总开关与配置读取失败只挡新单，E59）；全局运行参数取 runtimeParams()。
 */
import { prisma } from '../db'
import * as up from './upstream'
import { runtimeParams } from './config'
import { smsAlert } from './alert'
import { loadGateData, comboBlock, inflightMicro, affordable, type InflightSnapshot } from './gate'
import { catalogPresence } from './catalog'
import { ensureFreshBalance } from './upbalance'
import { activeThreadsHold } from './holds'
import { jnow, recentActiveCount, countE26Reject } from './runtime'
import { ATTEMPT_LIVE, threadsLimitOf, parseThreadsNote, threadsRoom } from './machine'
import { usdToMicro } from './parse'
import { VMQ_TIMEOUT_MIN } from '../vmq'
import { FACTORY_SMS_CONFIG } from '../jiema-config-schema'

export type SellCode = 'MAINTENANCE' | 'HOLD' | 'BUSY' | 'UNAVAILABLE'
export type SellResult = { ok: true } | { ok: false; code: SellCode; message: string; detail?: string }

/** 列表层的 ④ disabled 与全局加价 / 容差无关，这里只给 resolveRule 一个占位（不读 sms_config，E59） */
const RULE_GLOBAL = { markupCents: FACTORY_SMS_CONFIG.markupCents, tolerancePct: FACTORY_SMS_CONFIG.tolerancePct }

export const SELL_MESSAGES: Record<SellCode, string> = {
  MAINTENANCE: '接码服务维护中，预计很快恢复',
  HOLD: '这个组合暂停销售，换一个试试',
  BUSY: '当前使用人数较多，请几分钟后再试',
  UNAVAILABLE: '该服务暂不可购买，请稍后再试',
}

/** ①–④：停售、下架、disabled 规则、本进程没配 key */
async function holdBlock(service: string, country: number): Promise<{ code: 'MAINTENANCE' | 'HOLD'; kind: string } | null> {
  if (!up.upstreamConfigured()) return { code: 'MAINTENANCE', kind: 'nokey' }
  const g = await loadGateData()
  const b = comboBlock(g, service, country, jnow(), RULE_GLOBAL)
  return b ? { code: b.code, kind: b.kind } : null
}

/** 在途号码数（不含本单）：REQUESTING / UNKNOWN / ACTIVE / RECEIVED / RELEASING 的尝试 */
async function liveAttempts(selfSmsOrderId: number | null): Promise<{ live: number; acquiring: number }> {
  const where = selfSmsOrderId != null ? { smsOrderId: { not: selfSmsOrderId } } : {}
  const [live, acquiring] = await Promise.all([
    prisma.smsAttempt.count({ where: { state: { in: [...ATTEMPT_LIVE] }, ...where } }),
    prisma.smsAttempt.count({ where: { state: { in: ['REQUESTING', 'UNKNOWN'] }, ...where } }),
  ])
  return { live, acquiring }
}

/** 已付款（READY / ACQUIRING）却还没有任何在途号码的单（不含本单）：马上就会占一个线程 */
async function pendingAcquire(selfSmsOrderId: number | null): Promise<number> {
  const self = selfSmsOrderId ?? 0
  const r = await prisma.$queryRaw<{ n: bigint | number }[]>`
    SELECT COUNT(*) AS n FROM sms_orders o
     WHERE o.state IN ('READY', 'ACQUIRING') AND o.id <> ${self}
       AND NOT EXISTS (SELECT 1 FROM sms_attempts a WHERE a.sms_order_id = o.id AND a.state IN ('REQUESTING', 'UNKNOWN', 'ACTIVE', 'RECEIVED', 'RELEASING'))`
  return Number(r[0]?.n ?? 0)
}

/**
 * ⑤ 线程与在途号码数（E5、D43「给旧单品留线程」）。forAcquire=true（T7 发起取号）时不把「已付款待取号」的单算进去（自己就是其中之一）。
 * 线程受限时：上游在用（2 分钟内拉全的活跃列表条数，与我方在途号码 + 旧单品等码数取大）+ 我方在途取号 < 上限 − 给旧单品留的线程。
 */
export async function capacityBlock(p: { selfSmsOrderId: number | null; forAcquire: boolean }): Promise<'BUSY' | null> {
  const params = runtimeParams()
  const now = jnow()
  const [{ live, acquiring }, pending] = await Promise.all([liveAttempts(p.selfSmsOrderId), p.forAcquire ? Promise.resolve(0) : pendingAcquire(p.selfSmsOrderId)])
  if (live + pending >= params.limits.maxActiveNumbers) return 'BUSY'
  const th = await activeThreadsHold(now)
  if (th) {
    const limit = threadsLimitOf(parseThreadsNote(th.note))
    const legacyWaiting = await prisma.smsActivation.count({ where: { status: 'WAITING', updatedAt: { gte: new Date(now.getTime() - 3 * 3600_000) } } })
    const seen = recentActiveCount(now.getTime())
    const upstreamInUse = Math.max(seen ?? 0, live - acquiring + legacyWaiting)
    if (!threadsRoom({ limit, upstreamInUse, ourAcquiring: acquiring + pending, legacyReserve: params.upstream.legacyReserveThreads })) return 'BUSY'
  }
  return null
}

/** T7 / T10 取号前的闸门（①–⑤，不查余额、不读 sms_config） */
export async function acquireBlock(p: { service: string; country: number; selfSmsOrderId: number }): Promise<{ code: 'MAINTENANCE' | 'HOLD' | 'BUSY'; kind: string } | null> {
  const h = await holdBlock(p.service, p.country)
  if (h) return h
  const c = await capacityBlock({ selfSmsOrderId: p.selfSmsOrderId, forAcquire: true })
  return c ? { code: c, kind: 'capacity' } : null
}

/** 线程受限中（换号暂停，D8） */
export async function threadsLimited(): Promise<boolean> {
  return !!(await activeThreadsHold(jnow()))
}

// ───────────────────────── ⑥ 在途占用的快照（§3.2） ─────────────────────────

/** 读在途占用要用的数据（尝试、已承诺的单、旧单品激活）。只读、不加锁（不加全站锁，§3.2 E26 最后一句） */
export async function loadInflightSnapshot(balanceAt: Date, now: Date = jnow()): Promise<InflightSnapshot> {
  const recent = new Date(now.getTime() - 6 * 3600_000)
  const [attempts, orders, legacy] = await Promise.all([
    prisma.smsAttempt.findMany({
      where: {
        OR: [
          { state: { in: ['REQUESTING', 'UNKNOWN', 'ACTIVE', 'RECEIVED', 'RELEASING'] } },
          { requestedAt: { gte: recent }, OR: [{ respondedAt: { gt: balanceAt } }, { codeAt: { gt: balanceAt } }, { closedAt: { gt: balanceAt } }, { respondedAt: null }] },
        ],
      },
      select: { smsOrderId: true, state: true, costMicro: true, maxPriceMicro: true, respondedAt: true, charged: true, chargeSource: true, codeAt: true, closedAt: true },
    }),
    prisma.smsOrder.findMany({
      where: { state: { in: ['READY', 'ACQUIRING', 'PENDING_PAY'] } },
      select: { id: true, orderId: true, state: true, capMicro: true, quoteExpiresAt: true, payMode: true },
    }),
    prisma.smsActivation.findMany({
      where: { status: { in: ['WAITING', 'CODE'] }, updatedAt: { gte: new Date(now.getTime() - 3 * 3600_000) } },
      select: { status: true, numberAt: true, codeAt: true, orderId: true },
    }),
  ])
  const pendIds = orders.filter((o) => o.state === 'PENDING_PAY').map((o) => o.orderId)
  const [ords, vmqs] = pendIds.length
    ? await Promise.all([
        prisma.order.findMany({ where: { id: { in: pendIds } }, select: { id: true, deliveryStatus: true } }),
        prisma.vmqOrder.findMany({ where: { bizType: 'order', bizId: { in: pendIds }, state: { in: [0, 1] } }, select: { bizId: true, state: true, createdAt: true } }),
      ])
    : [[], []]
  const cancelled = new Set(ords.filter((o) => o.deliveryStatus === 'CANCELLED').map((o) => o.id))
  const expireMs = VMQ_TIMEOUT_MIN * 60_000
  // 收款单的有效期由 closeExpired 按真实时钟判（createdAt 是库里写的真实时刻），这里用同一个时钟
  const open = new Set(vmqs.filter((v) => v.state === 0 && v.createdAt.getTime() + expireMs > Date.now()).map((v) => v.bizId))
  const paid = new Set(vmqs.filter((v) => v.state === 1).map((v) => v.bizId))
  // 旧单品：按商品 smsMaxPrice 估（没有就 $1）
  const legacyOrderIds = Array.from(new Set(legacy.map((l) => l.orderId)))
  const priceByOrder = new Map<number, number>()
  if (legacyOrderIds.length) {
    const lo = await prisma.order.findMany({ where: { id: { in: legacyOrderIds } }, select: { id: true, product: { select: { smsMaxPrice: true } } } })
    for (const o of lo) {
      const m = o.product.smsMaxPrice == null ? null : usdToMicro(String(o.product.smsMaxPrice))
      priceByOrder.set(o.id, m != null && m > 0 ? m : 1_000_000)
    }
  }
  return {
    attempts,
    orders: orders.map((o) => ({
      smsOrderId: o.id,
      state: o.state,
      capMicro: o.capMicro,
      quoteExpiresAt: o.quoteExpiresAt,
      payMode: o.payMode,
      orderCancelled: cancelled.has(o.orderId),
      openVmq: open.has(o.orderId),
      paidVmq: paid.has(o.orderId),
    })),
    legacy: legacy.map((l) => ({ status: l.status, numberAt: l.numberAt, codeAt: l.codeAt, estMicro: priceByOrder.get(l.orderId) ?? 1_000_000 })),
  }
}

/** ⑥：上游余额够付本单吗（返回判定与明细，后台概览也用） */
export async function balanceCheck(capMicro: number, selfSmsOrderId: number | null): Promise<{ ok: boolean; balanceMicro: number | null; inflight: { a: number; b: number; c: number; total: number } | null }> {
  const cache = await ensureFreshBalance()
  if (!cache) return { ok: false, balanceMicro: null, inflight: null }
  const now = jnow()
  const snap = await loadInflightSnapshot(new Date(cache.balanceAt), now)
  const inflight = inflightMicro(snap, new Date(cache.balanceAt), selfSmsOrderId, now)
  return { ok: affordable(cache, inflight.total, capMicro), balanceMicro: cache.balanceMicro, inflight }
}

/**
 * 下单锁价（T1）与 pay/vmq/create 新发起收款单前（§6.6 第 26 条）共用。selfSmsOrderId：pay/vmq/create 复核时传本单（在途占用不含本单）。
 */
export async function checkSellable(p: { service: string; country: number; capMicro: number; selfSmsOrderId: number | null }): Promise<SellResult> {
  const h = await holdBlock(p.service, p.country)
  if (h) return { ok: false, code: h.code, message: SELL_MESSAGES[h.code], detail: h.kind }
  if (!(await catalogPresence(p.service, p.country, jnow()))) return { ok: false, code: 'HOLD', message: SELL_MESSAGES.HOLD, detail: 'catalog' }
  const c = await capacityBlock({ selfSmsOrderId: p.selfSmsOrderId, forAcquire: false })
  if (c) return { ok: false, code: 'BUSY', message: SELL_MESSAGES.BUSY, detail: 'capacity' }
  const b = await balanceCheck(p.capMicro, p.selfSmsOrderId)
  if (!b.ok) {
    const n = countE26Reject(jnow().getTime())
    smsAlert('UPSTREAM_INSUFFICIENT', '上游余额不够付本单：有买家暂时买不了（不停售）', [
      { label: '组合', value: `${p.service} · ${p.country}` },
      { label: '上游余额', value: b.balanceMicro == null ? '未知（刷新失败）' : `$${(b.balanceMicro / 1e6).toFixed(4)}` },
      { label: '在途占用', value: b.inflight ? `$${(b.inflight.total / 1e6).toFixed(4)}（A ${b.inflight.a} · B ${b.inflight.b} · C ${b.inflight.c} 微美元）` : '—' },
      { label: '本单上限', value: `$${(Math.max(p.capMicro, 6700) / 1e6).toFixed(4)}` },
      { label: '今日拒单', value: String(n) },
      { label: '处理', value: '请尽快给上游充值' },
    ], { throttleMs: 3600_000 })
    return { ok: false, code: 'UNAVAILABLE', message: SELL_MESSAGES.UNAVAILABLE, detail: 'balance' }
  }
  return { ok: true }
}
