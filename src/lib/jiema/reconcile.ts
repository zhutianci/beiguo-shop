/**
 * 短信接码 · 每日对账（docs/短信接码-设计.md §9.4 的 I 系列与「与上游对账」R 系列、§9.5 日报、§7.7 sms.daily、§10.1 知会；S4）。
 * cron `/api/cron/jiema-reconcile` 每天 03:20（覆盖前两天）；后台「短信接码 → 对账」可以手动跑一次。
 *
 * 【I 系列：只读】I1–I8 的全部读取在同一个 REPEATABLE READ 只读事务里（一致性快照，不加锁，不挡 tick 的写入；原因同 wallet/reconcile.ts）。
 * 逐单判定在 recon-rules.checkOrderI（纯函数）。唯一的写是 I8「补算」：FINISHED / REFUNDED、号码全部终态超过 10 分钟仍没定稿的单
 * 在快照事务之后调 T20（refund.recomputeCostInTx，先锁接码单行再算，与引擎同一个函数）。
 *
 * 【R 系列：以上游为准修正钱的事实】v1 history（statuses 6 / 8 / 10，分段拉全；任何一段失败 → R 系列这次不做、R0 报失败，绝不拿半截数据判）。
 *  · 上游实扣**只认状态 6 或 moreCodes 非空的行**（状态 10 除外），cost 字段在已取消的行上也有值、不代表扣费（probe2.out）；
 *  · R1 / R6 的修正只写尝试的 charged / chargeSource=RECON / costMicro / upstreamRefundMicro / 清 assumed，并在**同一个事务**里
 *    按锁顺序（接码单 → 尝试）重跑 T20；已取消的单只写 lossCents（附录 B 第 18 条：不跑成本利润、结论仍是已取消），推送；
 *  · 修正前在事务里按「读到时的值」CAS：这期间引擎动过这个尝试 / 订单的，本次跳过（RACE，下一次对账再核）；
 *  · **状态不改**：尝试还没终态的（引擎还在推进）一律跳过；说不通的不一致（R2 我方计了扣费上游说没扣、R4 找不到）只报告；
 *  · R3 上游有、本站两张表和旧单品备注都没有的激活：旧链路遗留只列出，外部激活推送（与活跃列表的实时监控同一套判定，unlinked.ts）。
 *    **绝不取消任何激活**（附录 B 第 5 条）。
 *
 * 【日报】cron 这一趟（daily=true）按北京时间「昨天」汇总（§9.5 口径：营收与真实成本按定稿批次 Σ costCents，已取消只计单数与退回额），
 * 存进 settings.sms_daily_pending；jiema-tick 在当天北京 09:00 之后推一次 sms.daily（CAS 标记已发，只推一次；§7.7「每天 09:00，由对账任务顺带发」）。
 * 报告写 settings.sms_reconcile_last；有不一致推 sms.alert（原因 RECON，每趟一条）。同一时刻只跑一趟（库锁 jiema:reconcile）。
 *
 * 【S4 评审修复】锁每分钟续租一次（跑得再久也不会被当成陈旧锁接管；续租失败 = 锁丢了，这一趟在下一个检查点中止）；
 * 定时那一趟遇到锁被占（后台刚点了「立即对账」）先等一会儿，还是抢不到就推「对账没有执行」并照样生成日报；
 * 整趟出错也存一份「执行失败」的报告并推 sms.alert（不再只打日志、页面停在上一次的「全部一致」）；
 * 报告按 utf8 字节量瘦身后再存（recon-rules.fitReportJson），存不进去推告警；
 * 上游 history 没拉到时保留上一次的未关联激活清单（R3「只报新出现的」去重靠它）；
 * 后台手动对账写的 RECON 事件带操作人（actor=ADMIN、actorId）。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { notify } from '../notify'
import { centsOf, fmtCents } from '../wallet/buckets'
import { acquireLock, releaseLock, renewLock } from '../marketing/lock'
import * as up from './upstream'
import { type HistoryRow } from './parse'
import { recomputeCostInTx } from './refund'
import { logEvent, logEventQuiet } from './events'
import { smsAlert } from './alert'
import { jnow, rt } from './runtime'
import { summarizeFinance, type FinanceRow } from './report'
import { ensureFreshBalance } from './upbalance'
import { isAttemptTerminal, ORDER_TERMINAL } from './machine'
import {
  RECON_COST_TOLERANCE_MICRO,
  R4_SETTLE_MIN,
  ALIPAY_CANCEL_NOTICE_CENTS,
  CANCEL_NOTICE_COUNT,
  judgeReconRow,
  applyPatch,
  attemptNetChargedMicro,
  upstreamChargedKept,
  classifyUnlinked,
  checkOrderI,
  bjDate,
  bjDayStart,
  dailyDue,
  dailyLines,
  dailyNotifyRows,
  usd4,
  fitReportJson,
  summarizeReconEvents,
  usableCostRows,
  type ReconMoneySnap,
  type ReconAttempt,
  type ReconAction,
  type ReconPatch,
  type IOrderInput,
  type IIssue,
  type DailyData,
} from './recon-rules'
import { knownActivationIds, legacyOldPhoneSet, legacyContext, lastUnlinked } from './unlinked'
import { jiemaUserFlagRows } from './user-flags'

export const SMS_RECONCILE_LAST_KEY = 'sms_reconcile_last'
export const SMS_DAILY_KEY = 'sms_daily_pending'
const LOCK = 'jiema:reconcile'
/** 锁的 TTL：超过它没续租才算陈旧（进程死了）。跑着的这一趟每 renewMs 续一次，所以再久也不会被接管 */
const LOCK_TTL_MS = 5 * 60_000
const LOCK_TIMING_DEFAULT = {
  /** 续租间隔（远小于 TTL） */
  renewMs: 60_000,
  /** 定时那一趟遇到锁被占时最多等多久（crontab --max-time 240；等不到就推「没有执行」） */
  cronWaitMs: 120_000,
  /** 等锁时的轮询间隔 */
  pollMs: 5_000,
}
const LT = { ...LOCK_TIMING_DEFAULT }
/** 测试用：调短续租 / 等锁的时间（null = 恢复默认） */
export function setReconLockTimingForTest(p: Partial<typeof LOCK_TIMING_DEFAULT> | null): void {
  Object.assign(LT, LOCK_TIMING_DEFAULT, p ?? {})
}

/** 测试用：在对账的几个阶段注入故障（'I' 快照之后、'R' 上游对账之后、'save' 存报告之前） */
let faultForTest: ((stage: 'I' | 'R' | 'save') => void) | null = null
export function setReconFaultForTest(f: typeof faultForTest): void {
  faultForTest = f
}

/** 锁丢了（续租失败或已被别人接管）：这一趟在下一个检查点中止，不再写任何东西 */
export class ReconLockLost extends Error {
  constructor() {
    super('对账锁丢失（续租失败或已被另一趟接管），这一趟中止')
  }
}
const BATCH = 500
const MAX_SAMPLES = 10
const TX_TIMEOUT_MS = 200_000
const H = 3600_000
const MIN = 60_000
/** history 分段：每段最多 12 小时；某段超过 40 页（1000 行）就对半再拆，最小 30 分钟 */
const HISTORY_CHUNK_MS = 12 * H
const HISTORY_MIN_SPLIT_MS = 30 * MIN
/** history 比 I 系列的窗口多拉 2 小时：窗口边上取的号，上游的 createDate 可能落在窗口前面 */
const HISTORY_SLACK_MS = 2 * H
/** 报告里外部激活清单最多存多少条（settings.value 是 TEXT） */
const LIST_MAX = 100
/** 外部激活 id 清单（只有 id，R3 去重用）最多存多少个 */
const EXTERNAL_IDS_MAX = 1000
const RC = { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 5_000, timeout: 15_000 }

export interface ReconItem {
  code: string
  title: string
  ok: boolean
  count: number
  samples: string[]
  note?: string
}

export interface R5Day {
  day: string
  /** 新链路：上游实扣（状态 6 / moreCodes 非空的行，与我方尝试对上的） */
  upstreamMicro: number
  /** 新链路：我方同一批尝试的扣费（charged 的 costMicro − upstreamRefundMicro，修正后）＋ 计了扣费却在上游找不到的 */
  oursMicro: number
  rows: number
  /** FREE_CANCELLATION_EXPIRED 的扣费（上游 history 显示没扣，以我方为准，§9.4 R2 单列） */
  expiredKeptMicro: number
  legacyMicro: number
  legacyRows: number
  externalMicro: number
  externalRows: number
  ok: boolean
}

export interface UnlinkedLite {
  id: string
  service: string | null
  country: number | null
  createdAt: string | null
  status: number | null
  costMicro: number | null
  kind: 'LEGACY' | 'EXTERNAL'
}

export interface JiemaReconcileReport {
  at: string
  full: boolean
  sinceHours: number
  window: { from: string; to: string }
  /** I 系列核了几张接码单 */
  orders: number
  items: ReconItem[]
  /** lossOrders 存盘时可能被截短（最多 20 张），lossOrdersTotal 是总数 */
  fixes: { r1: number; r6: number; r2Cleared: number; i8: number; race: number; lossOrders: Array<{ smsOrderId: number; orderNo: string | null; lossCents: number | null }>; lossOrdersTotal?: number }
  upstream: { ok: boolean; skipped?: boolean; reason?: string; rows: number; currency?: boolean }
  r5: R5Day[]
  /** externalIds = 全部外部激活的 id（最多 1000 个；清单瘦身时也保留，R3「只报新出现的」去重用） */
  unlinked: { external: UnlinkedLite[]; legacy: UnlinkedLite[]; externalCount: number; legacyCount: number; externalIds?: string[] }
  notices: string[]
  ok: boolean
  /** 整趟执行失败的原因（items 只有一项 ERR） */
  error?: string
  /** 存盘时瘦身到的级别（recon-rules.fitReportJson；0 / 缺省 = 原样） */
  truncated?: number
}

/** 触发这一趟的人：cron（缺省）或后台管理员（RECON 事件写 actor=ADMIN、actorId） */
export type ReconActor = { kind: 'CRON' } | { kind: 'ADMIN'; id: number | null }
const EMPTY_UNLINKED: JiemaReconcileReport['unlinked'] = { external: [], legacy: [], externalCount: 0, legacyCount: 0, externalIds: [] }

type Db = Prisma.TransactionClient

function item(code: string, title: string, bad: string[], note?: string, okOverride?: boolean): ReconItem {
  return { code, title, ok: okOverride ?? bad.length === 0, count: bad.length, samples: bad.slice(0, MAX_SAMPLES), ...(note ? { note } : {}) }
}

// ───────────────────────── I 系列（快照事务里只读） ─────────────────────────

const I_TITLES: Record<IIssue['code'], string> = {
  I2: '已取消 / 售后退款 ⇔ 订单已退款 ⇔ refund 流水（两格金额、合计 = 余额部分 + 支付宝实收；支付宝实收 = 收款单实付）',
  I3: '余额付清 / 组合单 ⇔ 预扣（已付款 CAPTURED / 退款后 REFUNDED、合计 = 余额部分）；支付宝单没有预扣',
  I4: '没有过了有效期末 90 分钟还在取号 / 结果未知 / 等码 / 放号中的尝试',
  I5: '已收码 / 已完成的单至少一条短信、订单已交付',
  I6: '同一张单取号中 / 结果未知的尝试 ≤ 1',
  I7: '成本利润可重算（已定稿单 = T20 重算；已取消单只有亏损、成本利润为空）',
  I8: '已结束且号码全部终态超过 10 分钟的单都已定稿（没定稿的已补算）',
}

interface IResult {
  bad: Record<'I1' | IIssue['code'], string[]>
  recompute: number[]
  orders: number
}

async function collectI(tx: Db, s: { now: Date; since: Date; full: boolean }): Promise<IResult> {
  const bad: IResult['bad'] = { I1: [], I2: [], I3: [], I4: [], I5: [], I6: [], I7: [], I8: [] }
  const recompute: number[] = []
  let orders = 0

  // I1：载体 SMS_POOL 的订单 ⇔ 恰好一行接码单（sms_orders.order_id 唯一，「恰好」由唯一约束保证，这里核「有」）
  {
    const win = s.full ? Prisma.empty : Prisma.sql`AND (o.created_at >= ${s.since} OR o.updated_at >= ${s.since})`
    const noSo = await tx.$queryRaw<{ id: number; order_no: string }[]>`
      SELECT o.id, o.order_no FROM orders o JOIN products p ON p.id = o.product_id
       WHERE p.delivery_type = 'SMS_POOL' ${win}
         AND NOT EXISTS (SELECT 1 FROM sms_orders s WHERE s.order_id = o.id)
       ORDER BY o.id LIMIT 100`
    for (const r of noSo) bad.I1.push(`接码载体订单 #${Number(r.id)}（${r.order_no}）没有接码单`)
  }

  const scope: Prisma.SmsOrderWhereInput = s.full
    ? {}
    : {
        OR: [
          { createdAt: { gte: s.since } },
          { updatedAt: { gte: s.since } },
          { refundedAt: { gte: s.since } },
          { state: { notIn: Array.from(ORDER_TERMINAL) } },
          { state: { in: ['FINISHED', 'REFUNDED'] }, costFinal: false },
        ],
      }
  let after = 0
  for (;;) {
    const sos = await tx.smsOrder.findMany({
      where: { AND: [scope, { id: { gt: after } }] },
      orderBy: { id: 'asc' },
      take: BATCH,
      select: {
        id: true,
        orderId: true,
        state: true,
        payMode: true,
        priceCents: true,
        balanceCents: true,
        alipayPaidCents: true,
        costFx4: true,
        chargedMicro: true,
        costCents: true,
        profitCents: true,
        lossCents: true,
        costFinal: true,
        refundTopupCents: true,
        refundCashCents: true,
      },
    })
    if (!sos.length) break
    orders += sos.length
    const soIds = sos.map((x) => x.id)
    const oids = sos.map((x) => x.orderId)
    const ords = await tx.order.findMany({ where: { id: { in: oids } }, select: { id: true, payStatus: true, deliveryStatus: true, product: { select: { deliveryType: true } } } })
    const atts = await tx.smsAttempt.findMany({
      where: { smsOrderId: { in: soIds } },
      select: { id: true, smsOrderId: true, state: true, charged: true, costMicro: true, maxPriceMicro: true, upstreamRefundMicro: true, requestedAt: true, endsAt: true, closedAt: true, updatedAt: true },
    })
    const msgs = await tx.smsMessage.groupBy({ by: ['smsOrderId'], where: { smsOrderId: { in: soIds } }, _count: { _all: true } })
    const holds = await tx.balanceHold.findMany({ where: { orderId: { in: oids } }, select: { orderId: true, state: true, topupCents: true, cashCents: true } })
    const logs = await tx.balanceLog.findMany({ where: { bizKey: { in: oids.map((id) => `refund:${id}`) } }, select: { bizKey: true, delta: true, topupDeltaCents: true, type: true } })
    const pays = await tx.payment.findMany({ where: { orderId: { in: oids }, payMethod: 'ALIPAY', status: 1 }, select: { orderId: true, tradeNo: true } })
    const tradeNos = pays.map((p) => p.tradeNo).filter((t): t is string => !!t)
    const vmqs = tradeNos.length ? await tx.vmqOrder.findMany({ where: { orderId: { in: tradeNos } }, select: { orderId: true, reallyPrice: true, state: true, bizId: true, bizType: true } }) : []
    const om = new Map(ords.map((o) => [o.id, o]))
    const am = new Map<number, typeof atts>()
    for (const a of atts) (am.get(a.smsOrderId) ?? am.set(a.smsOrderId, []).get(a.smsOrderId)!).push(a)
    const mm = new Map(msgs.map((m) => [m.smsOrderId, m._count._all]))
    const hm = new Map(holds.map((h) => [h.orderId, h]))
    const lm = new Map(logs.map((l) => [Number((l.bizKey as string).slice('refund:'.length)), l]))
    const pm = new Map<number, (string | null)[]>()
    for (const p of pays) (pm.get(p.orderId) ?? pm.set(p.orderId, []).get(p.orderId)!).push(p.tradeNo)
    const vm = new Map(vmqs.map((v) => [v.orderId, v]))
    for (const so of sos) {
      const o = om.get(so.orderId)
      if (!o || o.product.deliveryType !== 'SMS_POOL') {
        bad.I1.push(`接码单 #${so.id} 的订单 #${so.orderId}${o ? `不是接码载体单（${o.product.deliveryType}）` : '不存在'}`)
        continue
      }
      const ps = pm.get(so.orderId) ?? []
      let alipayReallyCents: IOrderInput['alipayReallyCents'] = null
      if (ps.length) {
        const v = ps.length === 1 && ps[0] ? vm.get(ps[0]) : undefined
        alipayReallyCents = v && v.state === 1 && v.bizType === 'order' && v.bizId === so.orderId ? centsOf(v.reallyPrice) : 'MISMATCH'
      }
      const lg = lm.get(so.orderId)
      const input: IOrderInput = {
        smsOrderId: so.id,
        orderId: so.orderId,
        state: so.state,
        payMode: so.payMode,
        priceCents: so.priceCents,
        balanceCents: so.balanceCents,
        alipayPaidCents: so.alipayPaidCents,
        costFx4: so.costFx4,
        chargedMicro: so.chargedMicro,
        costCents: so.costCents,
        profitCents: so.profitCents,
        lossCents: so.lossCents,
        costFinal: so.costFinal,
        refundTopupCents: so.refundTopupCents,
        refundCashCents: so.refundCashCents,
        order: { payStatus: o.payStatus, deliveryStatus: o.deliveryStatus },
        attempts: am.get(so.id) ?? [],
        messages: mm.get(so.id) ?? 0,
        hold: hm.get(so.orderId) ?? null,
        refundLog: lg && lg.type === 'REFUND' ? { cashCents: centsOf(lg.delta), topupCents: lg.topupDeltaCents } : null,
        alipayReallyCents,
      }
      const r = checkOrderI(input, s.now)
      for (const x of r.issues) bad[x.code].push(x.msg)
      if (r.recompute) recompute.push(so.id)
    }
    after = sos[sos.length - 1].id
    if (sos.length < BATCH) break
  }

  // I2 反向：近期的 refund:<订单> 流水必须落在「已取消 / 售后退款」的接码单上（充值单没有 refund 流水）
  {
    const win = s.full ? Prisma.empty : Prisma.sql`AND l.created_at >= ${s.since}`
    const rows = await tx.$queryRaw<{ id: number; order_id: number | null; state: string | null }[]>`
      SELECT l.id, l.order_id, s.state FROM balance_logs l LEFT JOIN sms_orders s ON s.order_id = l.order_id
       WHERE l.type = 'REFUND' ${win}
         AND (s.id IS NULL OR s.state NOT IN ('CANCELLED', 'REFUNDED'))
       ORDER BY l.id LIMIT 100`
    for (const r of rows) bad.I2.push(`REFUND 流水 #${Number(r.id)}（订单 #${r.order_id ?? '—'}）${r.state ? `落在状态 ${r.state} 的接码单上` : '没有对应的接码单'}`)
  }
  return { bad, recompute, orders }
}

// ───────────────────────── R 系列（上游 history） ─────────────────────────

type HistOk = { ok: true; rows: HistoryRow[]; currency: boolean }
type HistFail = { ok: false; reason: string }

/**
 * 分段拉全 [from, to] 的 history（statuses 6 / 8 / 10）；某段超过 40 页就对半拆；任何一段失败整体失败（不给半截）。
 * keep 在每段之前调一次（锁丢了就抛 ReconLockLost，中止这一趟）。
 */
export async function historyWindow(from: Date, to: Date, keep: () => void = () => undefined): Promise<HistOk | HistFail> {
  const byId = new Map<string, HistoryRow>()
  let currency = false
  // 从最晚的一段往前压栈：栈顶是最早的一段，按时间顺序拉；拆开的两半同样先拉前一半
  const stack: Array<[number, number]> = []
  for (let t = to.getTime(); t > from.getTime(); t -= HISTORY_CHUNK_MS) stack.push([Math.max(from.getTime(), t - HISTORY_CHUNK_MS), t])
  while (stack.length) {
    keep()
    const [a, b] = stack.pop()!
    let r: Awaited<ReturnType<typeof up.v1HistoryAll>>
    try {
      r = await up.v1HistoryAll({ from: new Date(a), to: new Date(b), statuses: [6, 8, 10] })
    } catch (e) {
      return { ok: false, reason: `history 请求异常：${String((e as Error)?.message ?? e).slice(0, 120)}` }
    }
    const data = r.kind === 'ok' ? r.data : r.kind === 'err' && r.code === 'CURRENCY' && r.data ? r.data : null
    if (data) {
      if (r.kind === 'err') currency = true
      for (const row of data.rows) byId.set(row.id, row)
      continue
    }
    if (r.kind === 'noinfo' && /超过 \d+ 页/.test(r.raw) && b - a > HISTORY_MIN_SPLIT_MS) {
      const mid = a + Math.floor((b - a) / 2)
      stack.push([mid, b], [a, mid])
      continue
    }
    const why = r.kind === 'err' ? `${r.code}（HTTP ${r.http ?? '—'}）` : r.kind === 'unknown' ? `结果未知（${r.reason}）` : `没有信息（${r.raw.slice(0, 80)}）`
    return { ok: false, reason: `history ${new Date(a).toISOString()} ~ ${new Date(b).toISOString()} 拉取失败：${why}` }
  }
  return { ok: true, rows: Array.from(byId.values()), currency }
}

interface RResult {
  upstream: JiemaReconcileReport['upstream']
  items: ReconItem[]
  fixes: Omit<JiemaReconcileReport['fixes'], 'i8'>
  r5: R5Day[]
  /** null = 这次没拉到 history（R0 失败 / key 没配置）：报告沿用上一次的清单，不能拿「没拉到」覆盖成「没有」 */
  unlinked: JiemaReconcileReport['unlinked'] | null
}

interface RCtx {
  now: Date
  since: Date
  keep: () => void
  actor: ReconActor
  /** 这一趟会推送不一致（alert !== false）：R3 新报出的外部激活记进本进程的去重集合 */
  markAlerted: boolean
}

type AttRow = ReconAttempt & { activationId: string; requestedAt: Date; closedAt: Date | null; updatedAt: Date }

const ATT_SELECT = {
  id: true,
  smsOrderId: true,
  state: true,
  charged: true,
  chargeSource: true,
  costMicro: true,
  maxPriceMicro: true,
  upstreamRefundMicro: true,
  assumed: true,
  activationId: true,
  requestedAt: true,
  closedAt: true,
  updatedAt: true,
} as const

const evActor = (a: ReconActor) => (a.kind === 'ADMIN' ? { actor: 'ADMIN' as const, actorId: a.id } : { actor: 'CRON' as const })

type MoneyRow = { state: string; cost_cents: number | null; loss_cents: number | null }
const snapOf = (r: MoneyRow): ReconMoneySnap => ({ state: r.state, costCents: r.cost_cents == null ? null : Number(r.cost_cents), lossCents: r.loss_cents == null ? null : Number(r.loss_cents) })

/**
 * 修正一个尝试（R1 / R6 / 清 assumed）：一个事务，按锁顺序 接码单 → 尝试 加锁后 CAS「读到时的值」；
 * 对得上才写补丁、重跑 T20（已取消的单 recomputeCostInTx 只写 lossCents），再记 RECON 事件（带修正前后的成本 / 亏损，
 * 日报按「修正发生的那天」汇总，S4 评审修复）。对不上 → RACE（下一次对账再核）。
 * 只有订单处在稳定状态时才会走到这里（recon-rules.RECON_STABLE_ORDER_STATES）：锁住后状态没变，就没有 T15 正在退这张单。
 */
async function applyFix(att: AttRow, orderState: string, patch: ReconPatch, rule: string, why: string, actor: ReconActor): Promise<'APPLIED' | 'RACE'> {
  return prisma.$transaction(async (tx) => {
    const so = await tx.$queryRaw<MoneyRow[]>`SELECT state, cost_cents, loss_cents FROM sms_orders WHERE id = ${att.smsOrderId} FOR UPDATE`
    if (!so[0] || so[0].state !== orderState) return 'RACE'
    const w = await tx.smsAttempt.updateMany({
      where: { id: att.id, state: att.state, charged: att.charged, costMicro: att.costMicro, upstreamRefundMicro: att.upstreamRefundMicro, assumed: att.assumed },
      data: patch,
    })
    if (w.count !== 1) return 'RACE'
    await recomputeCostInTx(tx, att.smsOrderId, `RECON:${rule}`)
    const after = await tx.$queryRaw<MoneyRow[]>`SELECT state, cost_cents, loss_cents FROM sms_orders WHERE id = ${att.smsOrderId}`
    await logEvent(tx, {
      smsOrderId: att.smsOrderId,
      attemptId: att.id,
      type: 'RECON',
      ...evActor(actor),
      detail: { rule, activationId: att.activationId, patch, before: snapOf(so[0]), after: after[0] ? snapOf(after[0]) : null, why: why.slice(0, 200) },
    })
    return 'APPLIED'
  }, RC)
}

async function collectR(s: RCtx, prevExternal: ReadonlySet<string>): Promise<RResult> {
  const from = new Date(s.since.getTime() - HISTORY_SLACK_MS)
  const empty: RResult = {
    upstream: { ok: false, rows: 0 },
    items: [],
    fixes: { r1: 0, r6: 0, r2Cleared: 0, race: 0, lossOrders: [] },
    r5: [],
    unlinked: null,
  }
  if (!up.upstreamConfigured()) {
    return { ...empty, upstream: { ok: false, rows: 0, reason: '上游 key 没配置（HEROSMS_API_KEY）' }, items: [item('R0', '上游 history 拉取（状态 6 / 8 / 10）', ['上游 key 没配置，R 系列没有执行'])] }
  }
  const h = await historyWindow(from, s.now, s.keep)
  if (!h.ok) {
    return { ...empty, upstream: { ok: false, rows: 0, reason: h.reason }, items: [item('R0', '上游 history 拉取（状态 6 / 8 / 10）', [h.reason], 'R1–R6 这次没有执行（不拿半截数据判）；下一次对账再核')] }
  }
  // 币种异常（E56）：状态照样可用，金额不可信 → 不拿它的 cost 修正成本、也不进 R5 汇总。
  // 认不出的币种（"RUB"）解析成 −1（parse.currencyOf），同样在这里置空；只有缺省（null，按规格默认 840）与 840 的金额可用
  const rows: HistoryRow[] = usableCostRows(h.rows)
  const ids = rows.map((r) => r.id)

  // 我方尝试（按 activationId）与所属接码单的状态
  const attByAct = new Map<string, AttRow>()
  for (let i = 0; i < ids.length; i += 1000) {
    const part = await prisma.smsAttempt.findMany({ where: { activationId: { in: ids.slice(i, i + 1000) } }, select: ATT_SELECT })
    for (const a of part) attByAct.set(a.activationId as string, a as AttRow)
  }
  const soIds = Array.from(new Set(Array.from(attByAct.values()).map((a) => a.smsOrderId)))
  const soState = new Map<number, { state: string; orderId: number }>()
  for (let i = 0; i < soIds.length; i += 1000) {
    const part = await prisma.smsOrder.findMany({ where: { id: { in: soIds.slice(i, i + 1000) } }, select: { id: true, state: true, orderId: true } })
    for (const x of part) soState.set(x.id, { state: x.state, orderId: x.orderId })
  }
  const { legacy: legacyIds } = await knownActivationIds(ids.filter((id) => !attByAct.has(id)))
  const oldPhones = await legacyOldPhoneSet(new Date(from.getTime() - 24 * H))

  const r1: string[] = []
  const r2: string[] = []
  const r6: string[] = []
  const r2Expired: string[] = []
  const fixes: RResult['fixes'] = { r1: 0, r6: 0, r2Cleared: 0, race: 0, lossOrders: [] }
  const r5 = new Map<string, R5Day>()
  const dayRow = (day: string): R5Day => {
    let d = r5.get(day)
    if (!d) r5.set(day, (d = { day, upstreamMicro: 0, oursMicro: 0, rows: 0, expiredKeptMicro: 0, legacyMicro: 0, legacyRows: 0, externalMicro: 0, externalRows: 0, ok: true }))
    return d
  }
  const dayOf = (d: Date | null | undefined) => (d ? bjDate(d) : '未知')
  const unlinkedRows: HistoryRow[] = []
  let pending = 0
  const lossSoIds = new Set<number>()

  for (const row of rows) {
    const att = attByAct.get(row.id)
    if (!att) {
      if (legacyIds.has(row.id) || (row.phone && oldPhones.has(row.phone))) {
        if (upstreamChargedKept(row)) {
          const d = dayRow(dayOf(row.createdAt))
          d.legacyMicro += row.costMicro ?? 0
          d.legacyRows++
        }
      } else unlinkedRows.push(row)
      continue
    }
    const so = soState.get(att.smsOrderId)
    const orderState = so?.state ?? '—'
    const a: ReconAction = judgeReconRow(row, att, orderState)
    let final: ReconAttempt = att
    const tag = `尝试 #${att.id}（接码单 #${att.smsOrderId}，激活 ${row.id}）`
    switch (a.kind) {
      case 'PENDING':
        pending++
        continue
      case 'FIX': {
        s.keep()
        const res = await applyFix(att, orderState, a.patch, a.rule, a.why, s.actor).catch((e) => {
          console.error('[jiema] 对账修正失败', att.id, (e as Error)?.message)
          return 'RACE' as const
        })
        if (res === 'RACE') {
          fixes.race++
          ;(a.rule === 'R1' ? r1 : r6).push(`${tag}：${a.why}（对账时状态刚变或写入失败，这次没改，下一次再核）`)
          break
        }
        final = applyPatch(att, a.patch)
        if (a.rule === 'R1') {
          fixes.r1++
          r1.push(`${tag}：${a.why}${a.recompute === 'LOSS' ? '（订单已取消：只记亏损）' : '（已重跑成本核算）'}`)
          if (a.recompute === 'LOSS') lossSoIds.add(att.smsOrderId)
        } else {
          fixes.r6++
          r6.push(`${tag}：${a.why}（已重跑成本核算）`)
        }
        break
      }
      case 'CLEAR_ASSUMED': {
        const w = await prisma.smsAttempt.updateMany({ where: { id: att.id, assumed: true, charged: att.charged, state: att.state }, data: { assumed: false } })
        if (w.count === 1) {
          fixes.r2Cleared++
          final = { ...att, assumed: false }
          await logEventQuiet({ smsOrderId: att.smsOrderId, attemptId: att.id, type: 'HISTORY_CONFIRM', ...evActor(s.actor), detail: { recon: true, rule: a.rule, status: row.status, assumedVerified: true } })
        }
        break
      }
      case 'EXPIRED_KEPT':
        r2Expired.push(`${tag}：上游状态 ${row.status}、没收到码，我方按「免费取消期已过」计了扣费（以我方为准）`)
        break
      case 'MISMATCH':
        ;(a.rule === 'R2' ? r2 : r6).push(`${tag}：${a.why}`)
        break
      default:
        break
    }
    // R5：与我方尝试对上的行（修正后的值）
    const d = dayRow(dayOf(row.createdAt))
    if (a.kind === 'EXPIRED_KEPT') {
      d.expiredKeptMicro += attemptNetChargedMicro(final)
      continue
    }
    if (upstreamChargedKept(row)) {
      d.upstreamMicro += row.costMicro ?? (final.costMicro ?? final.maxPriceMicro)
      d.rows++
    }
    d.oursMicro += attemptNetChargedMicro(final)
  }

  // 已取消单的亏损（R1 亏损分支）：读修正后的 lossCents，推送里列出来
  if (lossSoIds.size) {
    const sos = await prisma.smsOrder.findMany({ where: { id: { in: Array.from(lossSoIds) } }, select: { id: true, orderId: true, lossCents: true } })
    const ords = await prisma.order.findMany({ where: { id: { in: sos.map((x) => x.orderId) } }, select: { id: true, orderNo: true } })
    const on = new Map(ords.map((o) => [o.id, o.orderNo]))
    fixes.lossOrders = sos.map((x) => ({ smsOrderId: x.id, orderNo: on.get(x.orderId) ?? null, lossCents: x.lossCents }))
  }

  // R2 补充：推定退款（assumed）的尝试在上游 history 里找不到 → 没核实
  const rowIds = new Set(ids)
  {
    const assumed = await prisma.smsAttempt.findMany({
      where: { assumed: true, activationId: { not: null }, requestedAt: { gte: s.since, lte: new Date(s.now.getTime() - 2 * H) } },
      select: { id: true, smsOrderId: true, activationId: true },
      take: 500,
    })
    for (const a of assumed) if (!rowIds.has(a.activationId as string)) r2.push(`尝试 #${a.id}（接码单 #${a.smsOrderId}，激活 ${a.activationId}）按推定退款处理，上游 history 里找不到（没核实）`)
  }

  // R4：我方计了扣费、已结束超过 10 分钟的号必须出现在 history 里
  const r4: string[] = []
  {
    const charged = await prisma.smsAttempt.findMany({
      where: { charged: true, activationId: { not: null }, requestedAt: { gte: s.since, lte: new Date(s.now.getTime() - 30 * MIN) } },
      select: ATT_SELECT,
      take: 20_000,
    })
    for (const a of charged) {
      if (!isAttemptTerminal(a.state) || (a.closedAt ?? a.updatedAt).getTime() > s.now.getTime() - R4_SETTLE_MIN * MIN) continue
      if (rowIds.has(a.activationId as string)) continue
      r4.push(`尝试 #${a.id}（接码单 #${a.smsOrderId}，激活 ${a.activationId}，${a.state}，${usd4(a.costMicro ?? a.maxPriceMicro)}）计了扣费，上游 history 里找不到`)
      dayRow(bjDate(a.requestedAt)).oursMicro += attemptNetChargedMicro(a as AttRow)
    }
  }

  // R3：上游有、本站两张表与旧单品备注都没有的激活
  const unlinked: JiemaReconcileReport['unlinked'] = { external: [], legacy: [], externalCount: 0, legacyCount: 0, externalIds: [] }
  const r3New: string[] = []
  const r3NewIds: string[] = []
  if (unlinkedRows.length) {
    const oldest = Math.min(...unlinkedRows.map((r) => (r.createdAt ? r.createdAt.getTime() : s.now.getTime())))
    const ctx = await legacyContext(new Date(oldest - H), s.now)
    const live = await lastUnlinked()
    const liveExt = new Set((live?.external ?? []).map((x) => x.id))
    for (const r of unlinkedRows) {
      const kind = classifyUnlinked({ service: r.service, createdAt: r.createdAt }, ctx.services, ctx.paidMs)
      const lite: UnlinkedLite = { id: r.id, service: r.service, country: r.country, createdAt: r.createdAt ? r.createdAt.toISOString() : null, status: r.status, costMicro: r.costMicro, kind }
      const d = dayRow(dayOf(r.createdAt))
      if (kind === 'LEGACY') {
        unlinked.legacyCount++
        if (unlinked.legacy.length < LIST_MAX) unlinked.legacy.push(lite)
        if (upstreamChargedKept(r)) {
          d.legacyMicro += r.costMicro ?? 0
          d.legacyRows++
        }
      } else {
        unlinked.externalCount++
        if (unlinked.external.length < LIST_MAX) unlinked.external.push(lite)
        if (unlinked.externalIds!.length < EXTERNAL_IDS_MAX) unlinked.externalIds!.push(r.id)
        if (upstreamChargedKept(r)) {
          d.externalMicro += r.costMicro ?? 0
          d.externalRows++
        }
        // 只推新出现的（上一次对账、实时监控、本进程都没报过的），同一个激活不天天推
        if (!prevExternal.has(r.id) && !liveExt.has(r.id) && !rt().externalAlerted.has(r.id)) {
          r3New.push(`激活 ${r.id}（${r.service ?? '?'} · ${r.country ?? '?'}，状态 ${r.status ?? '?'}${r.createdAt ? `，${r.createdAt.toISOString()}` : ''}）`)
          r3NewIds.push(r.id)
        }
      }
    }
  }
  // 这一趟会推送的新外部激活记进本进程的去重集合（与实时监控共用）：下一趟即使上一次的报告没存下来也不重复报
  if (s.markAlerted) {
    for (const id of r3NewIds) rt().externalAlerted.add(id)
    if (rt().externalAlerted.size > 5000) rt().externalAlerted.clear()
  }

  // R5：按天汇总（新链路逐天比；旧链路、外部激活、EXPIRED 只列出）
  const days = Array.from(r5.values()).sort((a, b) => a.day.localeCompare(b.day))
  const r5bad: string[] = []
  for (const d of days) {
    d.ok = Math.abs(d.upstreamMicro - d.oursMicro) <= RECON_COST_TOLERANCE_MICRO * Math.max(1, d.rows)
    if (!d.ok) r5bad.push(`${d.day}：上游实扣 ${usd4(d.upstreamMicro)}（${d.rows} 个号）≠ 我方扣费 ${usd4(d.oursMicro)}`)
  }
  const sumNote = days.length
    ? days.map((d) => `${d.day} 新链路 ${usd4(d.upstreamMicro)} / 我方 ${usd4(d.oursMicro)} · 旧链路 ${usd4(d.legacyMicro)}（${d.legacyRows}）· 外部 ${usd4(d.externalMicro)}（${d.externalRows}）${d.expiredKeptMicro ? ` · EXPIRED ${usd4(d.expiredKeptMicro)}` : ''}`).join('；')
    : '窗口内上游没有结束的激活'

  const items: ReconItem[] = [
    item('R0', '上游 history 拉取（状态 6 / 8 / 10）', [], `${rows.length} 行${h.currency ? '；有币种不是美元的行（E56），金额没参与修正与汇总' : ''}${pending ? `；${pending} 行对应的号或订单还在推进中（取号 / 等码 / 取消中 / 退款中），这次不判、下一次再核` : ''}`),
    item('R1', '上游扣了费（状态 6 或收过码）⇔ 我方计扣费、成本相等（以上游为准修正；已取消单只记亏损）', r1),
    item('R2', '上游已取消 / 已退款且没收码 ⇔ 我方没计扣费（推定退款在这里核实）', r2, [fixes.r2Cleared ? `推定退款 / 推定完成（assumed）已核实 ${fixes.r2Cleared} 条` : null, r2Expired.length ? `EXPIRED 以我方为准 ${r2Expired.length} 条：${r2Expired.slice(0, 3).join('；')}` : null].filter(Boolean).join('；') || undefined),
    item('R3', '上游有、本站不认识的激活（外部激活推送；旧链路遗留只列出，都不会自动取消）', r3New, `外部激活 ${unlinked.externalCount} 个（新出现 ${r3New.length} 个）· 旧链路遗留 ${unlinked.legacyCount} 个`),
    item('R4', '我方计了扣费的号都能在上游 history 里找到', r4),
    item('R5', '按天汇总：上游实扣 = 我方扣费（新链路；旧链路与外部激活只列出）', r5bad, sumNote),
    item('R6', '上游事后退了收过码的号 → 冲回成本', r6, fixes.r6 ? `已冲回 ${fixes.r6} 条` : undefined),
  ]
  return { upstream: { ok: true, rows: rows.length, ...(h.currency ? { currency: true } : {}) }, items, fixes, r5: days, unlinked }
}

// ───────────────────────── 知会（§10.1：只标记、不限制） ─────────────────────────

/** 知会：与后台用户列表 / 接码订单列表的「可疑用户」徽章同一个查询（user-flags.ts） */
async function noticeLines(now: Date): Promise<{ lines: string[]; alipay: string[] }> {
  const rows = await jiemaUserFlagRows(now)
  const lines: string[] = []
  const alipay: string[] = []
  for (const r of rows) {
    if (r.alipayCents > ALIPAY_CANCEL_NOTICE_CENTS) {
      const s = `用户 #${r.userId} 近 24 小时「支付宝付款后取消、退回充值余额」合计 ${fmtCents(r.alipayCents)}（${r.cancels} 单）`
      lines.push(s)
      alipay.push(s)
    }
    if (r.cancels >= CANCEL_NOTICE_COUNT) lines.push(`用户 #${r.userId} 近 24 小时取消 ${r.cancels} 单（只标记、不限制）`)
  }
  return { lines, alipay }
}

// ───────────────────────── 日报 ─────────────────────────

export interface DailyPending {
  day: string
  lines: string[]
  createdAt: string
  sentAt: string | null
  skipped?: string | null
}

/** 日报里「异常」一行与知会用到的对账结论 */
interface DailyRecon {
  /** 对账不一致的项数 */
  recon: number
  /** 外部激活数（最近一次对账的 R3） */
  external: number
  notices: string[]
}

async function buildDaily(now: Date, a: DailyRecon): Promise<DailyData> {
  const end = bjDayStart(now)
  const start = new Date(end.getTime() - 24 * H)
  const [paidBy, received, finRows, afterSale, manual, cache, live, reconEvs] = await Promise.all([
    prisma.smsOrder.groupBy({ by: ['payMode'], where: { paidAt: { gte: start, lt: end } }, _count: { _all: true } }),
    prisma.smsOrder.count({ where: { paidAt: { gte: start, lt: end }, firstCodeAt: { not: null } } }),
    prisma.smsOrder.findMany({
      where: { OR: [{ costAt: { gte: start, lt: end } }, { refundedAt: { gte: start, lt: end } }] },
      select: { state: true, priceCents: true, chargedMicro: true, costCents: true, profitCents: true, lossCents: true, costFinal: true, costAt: true, refundedAt: true, refundTopupCents: true, refundCashCents: true },
      take: 50_000,
    }),
    prisma.smsOrder.count({ where: { state: 'REFUNDED', refundedAt: { gte: start, lt: end } } }),
    prisma.smsOrder.count({ where: { state: 'MANUAL' } }),
    ensureFreshBalance().catch(() => null),
    lastUnlinked(),
    // 当天对账写下的修正（R1 / R6 改的是原来定稿 / 取消那天的单）：按修正发生的日子单列（§9.5「上游事后退款冲回」）
    prisma.smsEvent.findMany({ where: { type: 'RECON', createdAt: { gte: start, lt: end } }, select: { detail: true }, take: 20_000 }),
  ])
  const paid = { ALIPAY: 0, BALANCE: 0, MIXED: 0 }
  for (const p of paidBy) if (p.payMode in paid) paid[p.payMode as keyof typeof paid] = p._count._all
  const f = summarizeFinance(finRows as FinanceRow[], start, end)
  return {
    day: bjDate(start),
    paid,
    received,
    finance: f,
    afterSale,
    upstreamBalanceMicro: cache ? cache.balanceMicro : null,
    anomalies: { recon: a.recon, manual, external: Math.max(a.external, live?.externalCount ?? 0) },
    notices: a.notices,
    recon: summarizeReconEvents(reconEvs.map((e) => e.detail)),
  }
}

async function saveDaily(d: DailyData, now: Date): Promise<DailyPending> {
  const row = await prisma.setting.findUnique({ where: { key: SMS_DAILY_KEY } })
  let prev: DailyPending | null = null
  try {
    prev = row ? (JSON.parse(row.value) as DailyPending) : null
  } catch {
    prev = null
  }
  if (prev && prev.day === d.day && (prev.sentAt || prev.skipped)) return prev // 这一天的已经推过：不再重新排队（同一天的对账跑了两次）
  const next: DailyPending = { day: d.day, lines: dailyLines(d), createdAt: now.toISOString(), sentAt: null, skipped: null }
  const value = JSON.stringify(next)
  await prisma.setting.upsert({ where: { key: SMS_DAILY_KEY }, create: { key: SMS_DAILY_KEY, value }, update: { value } })
  return next
}

/** 生成并排队昨天的日报（失败只记日志：日报不能挡对账） */
async function queueDaily(now: Date, a: DailyRecon): Promise<void> {
  try {
    await saveDaily(await buildDaily(now, a), now)
  } catch (e) {
    console.error('[jiema] 生成日报失败', (e as Error)?.message)
  }
}

/**
 * jiema-tick 每分钟调：有待推的日报、而且已到报告日次日的北京 09:00 → CAS 标记已推、推一次 sms.daily。
 * 再晚一天（tick 停了一整天）就只标记跳过、不推过期的日报。返回做了什么（测试用）。
 */
export async function maybeSendDaily(now: Date = jnow()): Promise<'NONE' | 'DONE' | 'WAIT' | 'SEND' | 'STALE' | 'RACE'> {
  const row = await prisma.setting.findUnique({ where: { key: SMS_DAILY_KEY } })
  if (!row) return 'NONE'
  let d: DailyPending
  try {
    d = JSON.parse(row.value) as DailyPending
  } catch {
    return 'NONE'
  }
  if (d.sentAt || d.skipped) return 'DONE'
  const due = dailyDue(d.day, now)
  if (due === 'WAIT') return 'WAIT'
  const next: DailyPending = due === 'SEND' ? { ...d, sentAt: now.toISOString() } : { ...d, skipped: now.toISOString() }
  const w = await prisma.setting.updateMany({ where: { key: SMS_DAILY_KEY, value: { equals: row.value } }, data: { value: JSON.stringify(next) } })
  if (w.count !== 1) return 'RACE'
  // 推送行按字节预算截断（企业微信 4096 字节，超了整条被拒、而这里已标记已推）
  if (due === 'SEND') notify('sms.daily', dailyNotifyRows(d.lines), { link: '/admin/jiema?tab=reconcile', extraTitle: d.lines[0] })
  return due
}

export async function lastDaily(): Promise<DailyPending | null> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: SMS_DAILY_KEY } })
    return row?.value ? (JSON.parse(row.value) as DailyPending) : null
  } catch {
    return null
  }
}

// ───────────────────────── 入口 ─────────────────────────

export interface ReconcileOpts {
  now?: Date
  /** 覆盖多少小时（默认 48 = 前两天；后台手动最多 14 天） */
  sinceHours?: number
  /** I 系列逐单核全部历史（R 系列仍按 sinceHours 拉 history） */
  full?: boolean
  /** false = 不调上游（测试用；R 系列整段不做） */
  upstream?: boolean
  alert?: boolean
  save?: boolean
  /** cron 那一趟：生成昨天的日报（09:00 由 tick 推）并推知会 */
  daily?: boolean
  /** 锁被占时等一会儿再抢（cron 那一趟用；等多久见 LOCK_TIMING_DEFAULT.cronWaitMs）。缺省 = 抢不到立刻返回 null */
  waitLock?: boolean
  /** 谁触发的（缺省 cron）：后台手动对账写的 RECON 事件带 actor=ADMIN、actorId */
  actor?: ReconActor
}

const clampHours = (h: number | undefined) => (h != null && Number.isFinite(h) ? Math.min(Math.max(Math.floor(h), 1), 14 * 24) : 48)

async function acquireReconLock(wait: boolean): Promise<string | null> {
  const deadline = Date.now() + (wait ? LT.cronWaitMs : 0)
  for (;;) {
    const t = await acquireLock(LOCK, LOCK_TTL_MS)
    if (t || Date.now() >= deadline) return t
    await new Promise((r) => setTimeout(r, Math.max(1, Math.min(LT.pollMs, deadline - Date.now()))))
  }
}

/** 跑着的这一趟每 renewMs 续一次锁；续租失败 = 锁丢了，check() 在下一个检查点抛 ReconLockLost */
function lockKeeper(token: string): { check: () => void; stop: () => void } {
  let lost = false
  const timer = setInterval(() => {
    void renewLock(LOCK, token).then((ok) => {
      if (!ok) lost = true
    })
  }, LT.renewMs)
  timer.unref?.()
  return {
    check: () => {
      if (lost) throw new ReconLockLost()
    },
    stop: () => clearInterval(timer),
  }
}

/**
 * 跑一次接码对账。同一时刻只跑一趟（库锁 jiema:reconcile；抢不到返回 null——cron 那一趟先等一会儿，还是抢不到就推「没有执行」并照样生成日报）。
 * 不一致推 sms.alert（原因 RECON），报告写 settings.sms_reconcile_last。整趟出错：存一份「执行失败」的报告、推 sms.alert，返回这份报告（不抛）。
 */
export async function runJiemaReconcile(opts: ReconcileOpts = {}): Promise<JiemaReconcileReport | null> {
  const token = await acquireReconLock(!!opts.waitLock)
  if (!token) {
    if (opts.daily) await onCronSkipped(opts)
    return null
  }
  const keeper = lockKeeper(token)
  try {
    return await runLocked(opts, keeper.check)
  } catch (e) {
    return await failedRun(opts, e)
  } finally {
    keeper.stop()
    await releaseLock(LOCK, token)
  }
}

/** cron 那一趟等不到锁：推「对账没有执行」，照样把昨天的日报排上（异常数按最近一次报告 + 这一次没跑） */
async function onCronSkipped(opts: ReconcileOpts): Promise<void> {
  const now = opts.now ?? jnow()
  const prev = await lastJiemaReconcile()
  if (opts.alert !== false) {
    smsAlert(
      'RECON_SKIPPED',
      '接码定时对账没有执行（另一趟对账一直在跑）',
      [
        { label: '说明', value: `等了 ${Math.round(LT.cronWaitMs / 1000)} 秒锁仍被占（多半是后台刚点了「立即对账」）；这一趟跳过，日报照常生成`, color: 'warning' },
        { label: '最近一次', value: prev ? `${prev.at}（${prev.ok ? '全部一致' : `${prev.items.filter((i) => !i.ok).length} 项不一致`}）` : '还没有' },
        { label: '处理', value: '稍后到后台「短信接码 → 对账」点「立即对账」补跑一次' },
      ],
      { link: '/admin/jiema?tab=reconcile', throttleMs: 0 },
    )
  }
  const notices = await noticeLines(now).catch(() => ({ lines: [] as string[], alipay: [] as string[] }))
  await queueDaily(now, { recon: 1 + (prev ? prev.items.filter((i) => !i.ok).length : 0), external: prev?.unlinked.externalCount ?? 0, notices: notices.lines })
}

/** 整趟出错（快照事务超时、库错误、锁丢失……）：存一份「执行失败」的报告（锁丢失时不存——锁已是别人的）、推 sms.alert、cron 那一趟照样排日报 */
async function failedRun(opts: ReconcileOpts, e: unknown): Promise<JiemaReconcileReport> {
  const now = opts.now ?? jnow()
  const lost = e instanceof ReconLockLost
  const reason = lost ? (e as Error).message : `对账执行出错：${String((e as Error)?.message ?? e).slice(0, 300)}`
  console.error('[jiema] 对账执行失败', e)
  const prev = await lastJiemaReconcile()
  const sinceHours = clampHours(opts.sinceHours)
  const report: JiemaReconcileReport = {
    at: now.toISOString(),
    full: !!opts.full,
    sinceHours,
    window: { from: new Date(now.getTime() - sinceHours * H).toISOString(), to: now.toISOString() },
    orders: 0,
    items: [item('ERR', '对账执行（中途出错时这一趟作废，已写下的修正见接码单时间线的 RECON 事件）', [reason])],
    fixes: { r1: 0, r6: 0, r2Cleared: 0, i8: 0, race: 0, lossOrders: [] },
    upstream: { ok: false, skipped: true, rows: 0, reason: '对账中途出错，没有完成' },
    r5: [],
    unlinked: prev?.unlinked ?? EMPTY_UNLINKED,
    notices: [],
    ok: false,
    error: reason,
  }
  if (opts.save !== false && !lost) await saveReport(report, opts)
  if (opts.alert !== false) {
    smsAlert(
      'RECON_FAILED',
      '接码对账执行失败',
      [
        { label: '原因', value: reason, color: 'warning' },
        { label: '处理', value: lost ? '另一趟对账接管了锁；看后台「短信接码 → 对账」的最新报告' : '后台「短信接码 → 对账」显示「执行失败」；排查后点「立即对账」重跑' },
      ],
      { link: '/admin/jiema?tab=reconcile', throttleMs: 0 },
    )
  }
  if (opts.daily && !lost) await queueDaily(now, { recon: 1, external: prev?.unlinked.externalCount ?? 0, notices: [] })
  return report
}

/** 存报告：按字节量瘦身（fitReportJson）；存不进去推告警（页面会停在上一次的结论）。导出给测试用 */
export async function saveReport(report: JiemaReconcileReport, opts: ReconcileOpts): Promise<boolean> {
  const { value, level } = fitReportJson(report)
  try {
    await prisma.setting.upsert({ where: { key: SMS_RECONCILE_LAST_KEY }, create: { key: SMS_RECONCILE_LAST_KEY, value }, update: { value } })
    return true
  } catch (e) {
    const msg = String((e as Error)?.message ?? e)
    console.error('[jiema] 写 sms_reconcile_last 失败', msg)
    if (opts.alert !== false) {
      const failed = report.items.filter((i) => !i.ok)
      smsAlert(
        'RECON_SAVE',
        '接码对账报告没有存进去（后台看到的还是上一次的报告）',
        [
          { label: '这一次', value: report.ok ? '全部一致' : `${failed.length} 项不一致（${failed.map((i) => i.code).join('、')}）`, color: 'warning' },
          { label: '原因', value: `${msg.slice(0, 160)}（${Buffer.byteLength(value, 'utf8')} 字节，瘦身级别 ${level}）` },
        ],
        { link: '/admin/jiema?tab=reconcile', throttleMs: 0 },
      )
    }
    return false
  }
}

async function runLocked(opts: ReconcileOpts, keep: () => void): Promise<JiemaReconcileReport> {
  const now = opts.now ?? jnow()
  const sinceHours = clampHours(opts.sinceHours)
  const since = new Date(now.getTime() - sinceHours * H)
  const full = !!opts.full
  const actor: ReconActor = opts.actor ?? { kind: 'CRON' }
  const prev = await lastJiemaReconcile()
  const prevExternal = new Set([...(prev?.unlinked?.externalIds ?? []), ...(prev?.unlinked?.external ?? []).map((x) => x.id)])

  // I 系列：一致性快照（REPEATABLE READ 只读事务）
  const iRes = await prisma.$transaction((tx) => collectI(tx, { now, since, full }), {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    timeout: TX_TIMEOUT_MS,
    maxWait: 10_000,
  })
  keep()
  faultForTest?.('I')
  // I8：补算（快照之后；T20 自己先锁接码单行再算）
  let i8 = 0
  for (const id of iRes.recompute) {
    keep()
    try {
      if (await recomputeCostInTx(prisma, id, 'RECON:I8')) i8++
    } catch (e) {
      console.error('[jiema] 对账 I8 补算失败', id, (e as Error)?.message)
    }
  }
  const iItems: ReconItem[] = [
    item('I1', '接码载体订单 ⇔ 接码单（1:1）', iRes.bad.I1),
    ...(['I2', 'I3', 'I4', 'I5', 'I6', 'I7', 'I8'] as const).map((c) => item(c, I_TITLES[c], iRes.bad[c], c === 'I8' && iRes.recompute.length ? `已补算 ${i8} 张` : undefined)),
  ]

  // R 系列
  let r: RResult | null = null
  if (opts.upstream !== false) r = await collectR({ now, since, keep, actor, markAlerted: opts.alert !== false }, prevExternal)
  keep()
  faultForTest?.('R')

  const notices = await noticeLines(now).catch((e) => {
    console.error('[jiema] 对账知会查询失败', (e as Error)?.message)
    return { lines: [] as string[], alipay: [] as string[] }
  })
  const items = [...iItems, ...(r?.items ?? [])]
  const report: JiemaReconcileReport = {
    at: now.toISOString(),
    full,
    sinceHours,
    window: { from: since.toISOString(), to: now.toISOString() },
    orders: iRes.orders,
    items,
    fixes: { ...(r?.fixes ?? { r1: 0, r6: 0, r2Cleared: 0, race: 0, lossOrders: [] }), i8 },
    upstream: r ? r.upstream : { ok: false, skipped: true, rows: 0 },
    r5: r?.r5 ?? [],
    // 这次没拉到 history（没调上游 / R0 失败）→ 沿用上一次的清单（R3「只报新出现的」去重靠它，不能拿「没拉到」覆盖成「没有」）
    unlinked: r?.unlinked ?? prev?.unlinked ?? EMPTY_UNLINKED,
    notices: notices.lines,
    ok: items.every((i) => i.ok),
  }
  report.fixes.lossOrdersTotal = report.fixes.lossOrders.length

  if (opts.save !== false) {
    keep()
    faultForTest?.('save')
    await saveReport(report, opts)
  }
  if (!report.ok && opts.alert !== false) {
    const failed = items.filter((i) => !i.ok)
    const loss = report.fixes.lossOrders
    smsAlert(
      'RECON',
      '接码对账发现不一致',
      [
        { label: '对账', value: `${failed.length} 项不一致（${failed.map((i) => i.code).join('、')}）`, color: 'warning' },
        // 企业微信 markdown 整条 ≤ 4096 字节：例子每条截到 120 字、亏损单最多列 10 张
        ...failed.slice(0, 6).map((i) => ({ label: i.code, value: `${i.count} 处；例：${(i.samples[0] ?? i.note ?? '—').slice(0, 120)}` })),
        ...(loss.length
          ? [
              {
                label: '亏损',
                value:
                  loss
                    .slice(0, 10)
                    .map((x) => `${x.orderNo ?? `#${x.smsOrderId}`} ${x.lossCents == null ? '—' : fmtCents(x.lossCents)}`)
                    .join('、') + `${loss.length > 10 ? ` 等 ${loss.length} 张` : ''}（已取消单事后被扣费：只记亏损，订单仍是已取消）`,
              },
            ]
          : []),
      ],
      { link: '/admin/jiema?tab=reconcile', throttleMs: 0 },
    )
  }
  if (opts.daily) {
    await queueDaily(now, { recon: items.filter((i) => !i.ok).length, external: report.unlinked.externalCount, notices: report.notices })
    if (notices.alipay.length && opts.alert !== false) {
      notify('wallet.alert', [{ label: '知会', value: '只标记、不限制（§10.1）', color: 'info' }, ...notices.alipay.slice(0, 8).map((v) => ({ label: '用户', value: v }))], {
        link: '/admin/wallet?tab=users',
        extraTitle: '接码支付宝付款后取消退回余额（知会）',
      })
    }
  }
  return report
}

export async function lastJiemaReconcile(): Promise<JiemaReconcileReport | null> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: SMS_RECONCILE_LAST_KEY } })
    return row?.value ? (JSON.parse(row.value) as JiemaReconcileReport) : null
  } catch {
    return null
  }
}
