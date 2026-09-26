/**
 * 对账不变式与每日自检（设计 10.12；WP3）。POST /api/cron/tenant-reconcile 每天 03:00 跑一次；出结算单前（statement.ts）
 * 与超管点「自检」（WP5）时再跑。应用内平台代码，可用原生 SQL（不受「运维脚本不 import src/」约束；运维另有只读 SQL 巡检，WP8）。
 *
 * 【两级】MONEY（钱类，L1–L13）失败 → applyHold 时把涉事渠道 payoutHold=true（只停出单与认领打款——generateStatement 与 statement.markPaying 各自在事务内读它；已认领在途的登记不拦，买家下单不受影响）+ 平台告警；
 * ALERT（告警类，A1–A13）只告警。
 *
 * 【与设计文字的几处取舍】（都偏保守，写在这里方便对照）
 *  · L2：REVERSED 的单允许没有 sale 组（「按快照补记」时已被渠道分担地全部退完的单，剩余值全为 0，零金额行不写），但不得多于一组；
 *  · L11：货款已全额退回（refundedGoodsCents = A）的单不要求发票分成（accrueInvoiceShare 的前置条件本来就排除它们）；
 *  · L11 以 invShareState 非空为准而不是「恰有一组 inv: 分录」：分成比例为 0 时分录全是零金额、不写行，但状态照样推进；
 *    金额是否正确由 L5 负责；
 *  · L3 额外检查「分录的 tenant_id 与订单的 tenant_id 不一致」（跨站记账）；
 *  · A9 取「当前可结算为负」（没有保存历史期数，「连续两期」无法可靠判断）；
 *  · A10 只看手续费率与分成率：最近一次 tenant.rates / tenant.create 审计之后下的渠道单，其快照必须等于渠道当前配置
 *    （冻结期有「首月 15 天」这类按下单时间变化的规则，不参与比对）。
 */
import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { computeBalances } from './balances'
import {
  COMPONENT_SIGN,
  LEDGER_ORDER_SELECT,
  basisFrom,
  decCents,
  expectedRemaining,
  linkedInvoicesByOrder,
  snapshotProblem,
  type LedgerOrder,
  type OrderComponent,
} from './ledger'
import { checkRetail } from './sellable'
import { alertPlatform } from './platform-alert'
import { emitTenantNotice } from './notice'

export interface ReconcileItem {
  code: string
  level: 'MONEY' | 'ALERT'
  ok: boolean
  count: number
  samples: string[] /* orderNo / statementNo */
}

interface Bad {
  tenantId: number | null
  sample: string
}

const OPEN_STATES = new Set(['GENERATED', 'CONFIRMED', 'DISPUTED', 'PAYING'])
const GOODS: OrderComponent[] = ['SALE', 'PURCHASE', 'FEE', 'SHORT']
const INVS: OrderComponent[] = ['INVOICE_SHARE', 'INVOICE_FEE']

/**
 * 告警策略：钱类失败且置了 hold → 一定推平台群（状态变了，站长必须知道）；其余失败只在全量跑（每日 cron，不带 tenantId）时推，
 * 按渠道跑（出单前、超管自检页）的告警类结果由调用方展示，不重复刷群。
 */
export async function runReconcile(opt: { tenantId?: number; applyHold?: boolean } = {}): Promise<{ at: string; items: ReconcileItem[] }> {
  const tid = opt.tenantId
  if (tid !== undefined && (!Number.isInteger(tid) || tid < 2)) throw new Error(`[reconcile] tenantId 非法：${tid}`)
  const now = new Date()
  /*
   * 【全部读在同一个一致性快照里】不变式横跨多张表（结算单 ↔ 分录桶 ↔ 打款），逐句 autocommit 读的话，两句之间恰好提交了一次
   * 出单 / 登记打款，就会读到「结算单还没有、IN_PAYOUT 分录已经有」这种半截状态，L8–L10 误报钱类失败并**真的**置上 payoutHold
   * （itest W3-7「并发两次出单」曾实际撞到：一次出单成功，另一次对账报 L10 → RECONCILE_FAILED + hold）。
   * 放进一个 REPEATABLE READ 只读事务：第一次读建立快照，之后每一句都看同一时刻的数据；普通一致性读不加锁、不挡业务写。
   * A9 调 computeBalances（走全局连接，不在快照内）只是告警类，不影响 hold。置 hold 与告警在事务外做。
   */
  const { items, moneyFail, negatives } = await prisma.$transaction((db) => collectReconcile(db, tid, now), {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    timeout: 120_000,
    maxWait: 10_000,
  })
  // ---------------- 置 hold 与告警 ----------------
  if (moneyFail.size && opt.applyHold) {
    for (const [t, codes] of Array.from(moneyFail.entries())) {
      const reason = `对账失败：${Array.from(codes).join(',')}（${now.toISOString().slice(0, 16)}Z）`
      await prisma.tenant.updateMany({ where: { id: t, payoutHold: false }, data: { payoutHold: true, payoutHoldReason: reason.slice(0, 200) } }).catch((e) => {
        console.error('[reconcile] 置 payoutHold 失败', t, e)
      })
    }
  }
  /*
   * 可结算为负 → 给渠道发 NEGATIVE_BALANCE 通知（设计 10.7 第 3–4 条「可结算为负 → 告警」；渠道设置页有这一项的推送开关）。
   * 只在权威运行（applyHold：每日 cron、出单前、站长点「立即对账」）发；dedupeKey 按渠道 + 东八区日期，一天最多一条。
   * 正文只给金额，不给订单明细（明细在结算中心看）。失败只记日志，不影响对账结果。
   */
  if (opt.applyHold && negatives.length) {
    const day = new Date(now.getTime() + 8 * 3600_000).toISOString().slice(0, 10)
    for (const n of negatives) {
      await emitTenantNotice(null, {
        tenantId: n.tenantId,
        kind: 'NEGATIVE_BALANCE',
        title: '可结算余额为负',
        body: `当前可结算（预计打款）为 −${(Math.abs(n.payoutCents) / 100).toFixed(2)} 元（售后冲销所致），将从后续订单收入中抵扣；抵扣完之前不能申请结算`,
        dedupeKey: `neg:${n.tenantId}:${day}`,
      }).catch((e) => console.error('[reconcile] 负余额通知失败', n.tenantId, e))
    }
  }
  const failed = items.filter((i) => !i.ok)
  const heldNow = !!opt.applyHold && moneyFail.size > 0
  if (failed.length && (heldNow || tid === undefined)) {
    const money = failed.filter((i) => i.level === 'MONEY')
    const text =
      `渠道对账${tid !== undefined ? `（渠道 #${tid}）` : ''}：` +
      failed.map((i) => `${i.code}×${i.count}${i.samples.length ? `[${i.samples.slice(0, 3).join(' ')}]` : ''}`).join('；') +
      (money.length && opt.applyHold ? `；已对 ${moneyFail.size} 个渠道暂停出单与打款` : '')
    void alertPlatform(text)
  }
  return { at: now.toISOString(), items }
}

/** runReconcile 的读取部分：在调用方给的快照事务 db 里算出全部不变式（只读，不置 hold、不告警） */
async function collectReconcile(
  db: Prisma.TransactionClient,
  tid: number | undefined,
  now: Date,
): Promise<{ items: ReconcileItem[]; moneyFail: Map<number, Set<string>>; negatives: { tenantId: number; payoutCents: number }[] }> {
  const items: ReconcileItem[] = []
  const moneyFail = new Map<number, Set<string>>()
  const negatives: { tenantId: number; payoutCents: number }[] = []
  const push = (code: string, level: 'MONEY' | 'ALERT', bad: Bad[]) => {
    const seen = new Set<string>()
    const samples: string[] = []
    for (const b of bad) {
      if (samples.length >= 10) break
      if (seen.has(b.sample)) continue
      seen.add(b.sample)
      samples.push(b.sample)
    }
    items.push({ code, level, ok: bad.length === 0, count: bad.length, samples })
    if (level === 'MONEY') {
      for (const b of bad) {
        if (b.tenantId == null || b.tenantId < 2) continue
        const s = moneyFail.get(b.tenantId) ?? new Set<string>()
        s.add(code)
        moneyFail.set(b.tenantId, s)
      }
    }
  }
  const tenantSql = tid !== undefined ? Prisma.sql`AND e.tenant_id = ${tid}` : Prisma.empty

  // ---------------- 基础数据 ----------------
  const orders: LedgerOrder[] = await db.order.findMany({
    where: tid !== undefined ? { tenantId: tid } : { tenantId: { gte: 2 } },
    select: LEDGER_ORDER_SELECT,
    orderBy: { id: 'asc' },
  })
  const links = await linkedInvoicesByOrder(db, orders.map((o) => o.id))
  const basisOf = (o: LedgerOrder) => basisFrom(o, links.get(o.id) ?? [])

  // 每单每成分每桶的和；每单的事件键
  const sums = await db.$queryRaw<{ oid: number; component: string; bucket: string; s: unknown }[]>`
    SELECT e.order_id AS oid, e.component, e.bucket, SUM(e.amount_cents) AS s
      FROM tenant_ledger_entries e
     WHERE e.order_id IS NOT NULL ${tenantSql}
     GROUP BY e.order_id, e.component, e.bucket`
  const sumMap = new Map<number, Record<string, Record<string, number>>>()
  for (const r of sums) {
    const oid = Number(r.oid)
    const m = sumMap.get(oid) ?? {}
    const c = (m[r.component] = m[r.component] ?? {})
    c[r.bucket] = (c[r.bucket] ?? 0) + Number(r.s ?? 0)
    sumMap.set(oid, m)
  }
  const keyRows = await db.$queryRaw<{ oid: number; ek: string }[]>`
    SELECT DISTINCT e.order_id AS oid, e.event_key AS ek FROM tenant_ledger_entries e WHERE e.order_id IS NOT NULL ${tenantSql}`
  const keysOf = new Map<number, string[]>()
  for (const r of keyRows) {
    const oid = Number(r.oid)
    const l = keysOf.get(oid) ?? []
    l.push(r.ek)
    keysOf.set(oid, l)
  }
  const total = (oid: number, c: string) => Object.values(sumMap.get(oid)?.[c] ?? {}).reduce((s, v) => s + v, 0)
  const inBucket = (oid: number, c: string, b: string) => sumMap.get(oid)?.[c]?.[b] ?? 0
  const hasEntries = (oid: number) => sumMap.has(oid) || (keysOf.get(oid)?.length ?? 0) > 0
  const A = (o: LedgerOrder) => decCents(o.amount)
  const bad = (o: LedgerOrder): Bad => {
    return { tenantId: o.tenantId, sample: o.orderNo }
  }

  // ---------------- L1 桶间转移成对 ----------------
  {
    const rows = await db.$queryRaw<{ ek: string; t: number }[]>`
      SELECT e.event_key AS ek, MIN(e.tenant_id) AS t FROM tenant_ledger_entries e
       WHERE e.type IN ('RELEASE','RELEASE_INV','STATEMENT','RETURN','DEPOSIT_APPLY') ${tenantSql}
       GROUP BY e.event_key HAVING SUM(e.amount_cents) <> 0`
    push('L1', 'MONEY', rows.map((r) => ({ tenantId: Number(r.t), sample: r.ek })))
  }

  // ---------------- L2 已付必计提 ----------------
  {
    const b: Bad[] = []
    for (const o of orders) {
      if (!o.paidAt) continue
      if (o.settleState == null) {
        b.push(bad(o))
        continue
      }
      const n = (keysOf.get(o.id) ?? []).filter((k) => k === `sale:${o.id}`).length
      if ((o.settleState === 'ACCRUED' || o.settleState === 'RELEASED') && n !== 1) b.push(bad(o))
      if (o.settleState === 'REVERSED' && n > 1) b.push(bad(o))
    }
    push('L2', 'MONEY', b)
  }

  // ---------------- L3 平台单零快照零分录；分录与订单同站 ----------------
  {
    const b: Bad[] = []
    if (tid === undefined) {
      const snap = await db.$queryRaw<{ no: string }[]>`
        SELECT o.order_no AS no FROM orders o
         WHERE o.tenant_id = 1 AND (o.listing_id IS NOT NULL OR o.supply_unit_price IS NOT NULL OR o.supply_cents IS NOT NULL
            OR o.fee_rate_bp IS NOT NULL OR o.invoice_share_rate_bp IS NOT NULL OR o.settle_hold_days IS NOT NULL
            OR o.main_price_at_order IS NOT NULL OR o.settle_state IS NOT NULL OR o.inv_share_state IS NOT NULL)
         LIMIT 50`
      for (const r of snap) b.push({ tenantId: null, sample: r.no })
    }
    const cross = await db.$queryRaw<{ no: string; t: number }[]>`
      SELECT DISTINCT o.order_no AS no, e.tenant_id AS t FROM tenant_ledger_entries e JOIN orders o ON o.id = e.order_id
       WHERE e.tenant_id <> o.tenant_id ${tenantSql} LIMIT 50`
    for (const r of cross) b.push({ tenantId: Number(r.t), sample: r.no })
    push('L3', 'MONEY', b)
  }

  // ---------------- L4 快照完整且在范围内 ----------------
  push('L4', 'MONEY', orders.filter((o) => snapshotProblem(o) != null).map(bad))

  // ---------------- L5 逐单逐成分 = 独立算出的剩余值 ----------------
  {
    const b: Bad[] = []
    for (const o of orders) {
      const st = o.settleState
      if (st !== 'ACCRUED' && st !== 'RELEASED' && st !== 'REVERSED') {
        if (hasEntries(o.id)) b.push(bad(o))
        continue
      }
      let exp
      try {
        exp = expectedRemaining(o, basisOf(o))
      } catch {
        b.push(bad(o))
        continue
      }
      if (!exp) continue
      const actual = (c: OrderComponent) => total(o.id, c)
      const want = (c: OrderComponent) => COMPONENT_SIGN[c] * exp![c]
      const okAll =
        actual('SALE') === want('SALE') &&
        actual('PURCHASE') === want('PURCHASE') &&
        actual('INVOICE_SHARE') === want('INVOICE_SHARE') &&
        actual('FEE') + actual('INVOICE_FEE') === want('FEE') + want('INVOICE_FEE') &&
        actual('FEE') === want('FEE') &&
        actual('SHORT') === want('SHORT') &&
        actual('LOSS') === want('LOSS') &&
        total(o.id, 'MANUAL') === 0 &&
        total(o.id, 'NET') === 0
      if (!okAll) b.push(bad(o))
    }
    push('L5', 'MONEY', b)
  }

  // ---------------- L6 成分所在桶与状态一致（逐成分） ----------------
  {
    const b: Bad[] = []
    for (const o of orders) {
      if (!sumMap.has(o.id)) continue
      let wrong = false
      const st = o.settleState
      for (const c of GOODS) {
        if (st === 'ACCRUED' && inBucket(o.id, c, 'AVAILABLE') !== 0) wrong = true
        if ((st === 'RELEASED' || st === 'REVERSED') && inBucket(o.id, c, 'PENDING') !== 0) wrong = true
      }
      const ist = o.invShareState
      for (const c of INVS) {
        if (ist === 'ACCRUED' && inBucket(o.id, c, 'AVAILABLE') !== 0) wrong = true
        if ((ist === 'RELEASED' || ist === 'REVERSED') && inBucket(o.id, c, 'PENDING') !== 0) wrong = true
      }
      if (inBucket(o.id, 'LOSS', 'PENDING') !== 0) wrong = true
      for (const comp of Object.values(sumMap.get(o.id) ?? {})) {
        if ((comp.IN_PAYOUT ?? 0) !== 0 || (comp.DEPOSIT ?? 0) !== 0) wrong = true
      }
      if (wrong) b.push(bad(o))
    }
    push('L6', 'MONEY', b)
  }

  // ---------------- L7 发票分成有依据、只一次、I₀ ≤ T ----------------
  {
    const b: Bad[] = []
    const sLegs = await db.$queryRaw<{ oid: number; ek: string; amt: number }[]>`
      SELECT e.order_id AS oid, e.event_key AS ek, e.amount_cents AS amt FROM tenant_ledger_entries e
       WHERE e.order_id IS NOT NULL AND e.type = 'ACCRUE_INV' AND e.component = 'INVOICE_SHARE' ${tenantSql}`
    const sOf = new Map<number, { ek: string; amt: number }[]>()
    for (const r of sLegs) {
      const l = sOf.get(Number(r.oid)) ?? []
      l.push({ ek: r.ek, amt: Number(r.amt) })
      sOf.set(Number(r.oid), l)
    }
    for (const o of orders) {
      const invKeys = (keysOf.get(o.id) ?? []).filter((k) => k.startsWith('inv:'))
      const basis = basisOf(o)
      if (o.invShareState != null) {
        const grounded = (basis?.path === 'CHECKOUT' && o.paidAt != null) || basis?.path === 'POSTHOC'
        if (!grounded) b.push(bad(o))
      } else if (invKeys.length) {
        b.push(bad(o))
        continue
      }
      if (invKeys.some((k) => k !== `inv:${o.id}`)) b.push(bad(o))
      const s = sOf.get(o.id) ?? []
      if (s.length > 1 || (s[0] && basis && s[0].amt > basis.taxCents)) b.push(bad(o))
    }
    push('L7', 'MONEY', b)
  }

  // ---------------- 结算单：L8 / L9 / L10 ----------------
  const stmts = await db.tenantStatement.findMany({
    where: tid !== undefined ? { tenantId: tid } : {},
    select: {
      id: true,
      tenantId: true,
      statementNo: true,
      state: true,
      openKey: true,
      lineCount: true,
      goodsCents: true,
      purchaseCents: true,
      invShareCents: true,
      feeCents: true,
      otherCents: true,
      grossCents: true,
      netCents: true,
      contentHash: true,
    },
  })
  const lineRows = stmts.length
    ? await db.$queryRaw<{ sid: number; eid: number; amt: number }[]>`
        SELECT l.statement_id AS sid, e.id AS eid, e.amount_cents AS amt
          FROM tenant_statement_lines l JOIN tenant_ledger_entries e ON e.id = l.entry_id
         WHERE l.statement_id IN (${Prisma.join(stmts.map((s) => s.id))})`
    : []
  const linesOf = new Map<number, { eid: number; amt: number }[]>()
  for (const r of lineRows) {
    const l = linesOf.get(Number(r.sid)) ?? []
    l.push({ eid: Number(r.eid), amt: Number(r.amt) })
    linesOf.set(Number(r.sid), l)
  }
  {
    const b: Bad[] = []
    for (const s of stmts) {
      const lines = (linesOf.get(s.id) ?? []).sort((x, y) => x.eid - y.eid)
      const sumLines = lines.reduce((a, l) => a + l.amt, 0)
      const hash = crypto.createHash('sha256').update(lines.map((l) => `${l.eid}:${l.amt}`).join(',')).digest('hex')
      const ok =
        s.goodsCents + s.purchaseCents + s.invShareCents + s.feeCents + s.otherCents === s.netCents &&
        s.grossCents === s.netCents - s.feeCents &&
        sumLines === s.netCents &&
        lines.length === s.lineCount &&
        hash === s.contentHash
      if (!ok) b.push({ tenantId: s.tenantId, sample: s.statementNo })
    }
    push('L8', 'MONEY', b)
  }
  const payouts = await db.tenantPayout.findMany({
    where: tid !== undefined ? { tenantId: tid } : {},
    select: { statementId: true, tenantId: true, amountCents: true, withholdCents: true },
  })
  const payoutOf = new Map(payouts.map((p) => [p.statementId, p]))
  {
    const b: Bad[] = []
    const bounces = await db.$queryRaw<{ sid: number; s: unknown }[]>`
      SELECT e.statement_id AS sid, SUM(e.amount_cents) AS s FROM tenant_ledger_entries e
       WHERE e.type = 'BOUNCE' AND e.statement_id IS NOT NULL ${tenantSql} GROUP BY e.statement_id`
    const bounceOf = new Map(bounces.map((r) => [Number(r.sid), Number(r.s ?? 0)]))
    const perTenantPaid = new Map<number, number>()
    const perTenantNet = new Map<number, number>()
    const stmtIds = new Set(stmts.map((s) => s.id))
    for (const s of stmts) {
      const p = payoutOf.get(s.id)
      const paid = s.state === 'PAID' || s.state === 'RECEIVED'
      if (paid !== !!p || (p && p.amountCents + p.withholdCents !== s.netCents)) b.push({ tenantId: s.tenantId, sample: s.statementNo })
      if (paid) perTenantNet.set(s.tenantId, (perTenantNet.get(s.tenantId) ?? 0) + s.netCents)
      if ((bounceOf.get(s.id) ?? 0) > (p?.amountCents ?? 0)) b.push({ tenantId: s.tenantId, sample: s.statementNo })
    }
    for (const p of payouts) {
      if (!stmtIds.has(p.statementId)) b.push({ tenantId: p.tenantId, sample: `payout#${p.statementId}` })
      perTenantPaid.set(p.tenantId, (perTenantPaid.get(p.tenantId) ?? 0) + p.amountCents + p.withholdCents)
    }
    const tIds = Array.from(new Set(Array.from(perTenantPaid.keys()).concat(Array.from(perTenantNet.keys()))))
    for (const t of tIds) if ((perTenantPaid.get(t) ?? 0) !== (perTenantNet.get(t) ?? 0)) b.push({ tenantId: t, sample: `tenant#${t}` })
    push('L9', 'MONEY', b)
  }
  {
    const b: Bad[] = []
    const bk = await db.$queryRaw<{ t: number; bucket: string; s: unknown; u: unknown }[]>`
      SELECT e.tenant_id AS t, e.bucket, SUM(e.amount_cents) AS s,
             SUM(CASE WHEN l.id IS NULL AND e.component <> 'NET' THEN e.amount_cents ELSE 0 END) AS u
        FROM tenant_ledger_entries e LEFT JOIN tenant_statement_lines l ON l.entry_id = e.id
       WHERE 1 = 1 ${tenantSql}
       GROUP BY e.tenant_id, e.bucket`
    const inPayout = new Map<number, number>()
    for (const r of bk) {
      const t = Number(r.t)
      if (r.bucket === 'IN_PAYOUT') inPayout.set(t, Number(r.s ?? 0))
      if (r.bucket === 'AVAILABLE' && Number(r.s ?? 0) !== Number(r.u ?? 0)) b.push({ tenantId: t, sample: `tenant#${t}:AVAILABLE≠U` })
    }
    const openNet = new Map<number, number>()
    const openCnt = new Map<number, number>()
    for (const s of stmts) {
      if (OPEN_STATES.has(s.state)) openNet.set(s.tenantId, (openNet.get(s.tenantId) ?? 0) + s.netCents)
      if (s.openKey != null) openCnt.set(s.tenantId, (openCnt.get(s.tenantId) ?? 0) + 1)
      if (OPEN_STATES.has(s.state) !== (s.openKey != null)) b.push({ tenantId: s.tenantId, sample: s.statementNo })
    }
    for (const [t, n] of Array.from(openCnt.entries())) if (n > 1) b.push({ tenantId: t, sample: `tenant#${t}:open>1` })
    const tIds = Array.from(new Set(Array.from(inPayout.keys()).concat(Array.from(openNet.keys()))))
    for (const t of tIds) if ((inPayout.get(t) ?? 0) !== (openNet.get(t) ?? 0)) b.push({ tenantId: t, sample: `tenant#${t}:IN_PAYOUT` })
    push('L10', 'MONEY', b)
  }

  // ---------------- L11 税费已收却漏计分成 ----------------
  {
    const b: Bad[] = []
    for (const o of orders) {
      if (o.settleState !== 'ACCRUED' && o.settleState !== 'RELEASED') continue
      if ((o.refundedGoodsCents ?? 0) >= A(o)) continue
      const basis = basisOf(o)
      const taxed = (basis?.path === 'CHECKOUT' && o.paidAt != null) || basis?.path === 'POSTHOC'
      if (taxed && o.invShareState == null) b.push(bad(o))
    }
    push('L11', 'MONEY', b)
  }

  // ---------------- L12 未付渠道单无任何计提 / 冲销分录 ----------------
  push(
    'L12',
    'MONEY',
    orders.filter((o) => o.payStatus === 'UNPAID' && (keysOf.get(o.id) ?? []).some((k) => /^(sale|inv|short|rev|rel|relinv):/.test(k))).map(bad),
  )

  // ---------------- L13 状态与累计值一致 ----------------
  {
    const b: Bad[] = []
    for (const o of orders) {
      const a = A(o)
      const RG = o.refundedGoodsCents ?? 0
      const Rg = o.settleRefundedCents ?? 0
      const Rt = o.refundedTaxCents ?? 0
      const T = basisOf(o)?.taxCents ?? decCents(o.invoiceTaxFee)
      const voided = o.payStatus === 'REFUNDED' || (o.payStatus === 'PAID' && o.deliveryStatus === 'CANCELLED')
      const ok =
        (!voided || RG === a) &&
        Rg <= RG &&
        RG <= a &&
        Rt <= T &&
        (o.refundedQty ?? 0) <= o.quantity &&
        (o.shortChargedCents ?? 0) <= (o.shortCents ?? 0)
      if (!ok) b.push(bad(o))
    }
    push('L13', 'MONEY', b)
  }

  // ================= 告警类 =================
  // A1 卡差价口径：未按件退款、卡已发齐的自动发卡渠道单，Σ soldPrice = 进货款
  {
    const b: Bad[] = []
    const autoProducts = new Set(
      (await db.product.findMany({ where: { id: { in: Array.from(new Set(orders.map((o) => o.productId))) }, deliveryType: 'AUTO' }, select: { id: true } })).map((p) => p.id),
    )
    const cand = orders.filter((o) => autoProducts.has(o.productId) && !(o.refundedQty ?? 0) && o.supplyCents != null)
    if (cand.length) {
      const cards = await db.cardKey.groupBy({ by: ['orderId'], where: { orderId: { in: cand.map((o) => o.id) }, status: 'USED' }, _count: { _all: true }, _sum: { soldPrice: true } })
      const cm = new Map(cards.map((c) => [c.orderId as number, c]))
      for (const o of cand) {
        const c = cm.get(o.id)
        if (!c || c._count._all !== o.quantity) continue
        if (decCents(c._sum.soldPrice) !== o.supplyCents) b.push(bad(o))
      }
    }
    push('A1', 'ALERT', b)
  }
  // A2 上架中的 listing 必须可售
  {
    const ls = await db.tenantListing.findMany({
      where: { status: 1, ...(tid !== undefined ? { tenantId: tid } : {}) },
      select: { publicNo: true, tenantId: true, granted: true, supplyCents: true, retailCents: true, minRetailCents: true, maxRetailCents: true, productId: true },
    })
    const prods = new Map(
      (await db.product.findMany({ where: { id: { in: Array.from(new Set(ls.map((l) => l.productId))) } }, select: { id: true, status: true } })).map((p) => [p.id, p.status]),
    )
    push(
      'A2',
      'ALERT',
      ls.filter((l) => !l.granted || prods.get(l.productId) !== 1 || checkRetail(l, l.retailCents) != null).map((l) => ({ tenantId: l.tenantId, sample: l.publicNo })),
    )
  }
  // A3 权限结构
  {
    const b: Bad[] = []
    const members = await db.tenantMember.findMany({
      where: { status: 1, ...(tid !== undefined ? { tenantId: tid } : {}) },
      select: { tenantId: true, userId: true, role: true },
    })
    const admins = new Set(
      (await db.user.findMany({ where: { id: { in: Array.from(new Set(members.map((m) => m.userId))) }, role: 'ADMIN' }, select: { id: true } })).map((u) => u.id),
    )
    for (const m of members) if (admins.has(m.userId)) b.push({ tenantId: m.tenantId, sample: `member-admin@tenant#${m.tenantId}` })
    const active = await db.tenant.findMany({ where: { kind: 'CHANNEL', status: 'ACTIVE', ...(tid !== undefined ? { id: tid } : {}) }, select: { id: true, code: true } })
    for (const t of active) if (!members.some((m) => m.tenantId === t.id && m.role === 'OWNER')) b.push({ tenantId: t.id, sample: `no-owner:${t.code}` })
    push('A3', 'ALERT', b)
  }
  // A4 渠道单的商品必须有同渠道 listing
  {
    const lids = Array.from(new Set(orders.map((o) => o.listingId).filter((v): v is number => v != null)))
    const lmap = new Map(
      (lids.length ? await db.tenantListing.findMany({ where: { id: { in: lids } }, select: { id: true, tenantId: true, productId: true } }) : []).map((l) => [l.id, l]),
    )
    push(
      'A4',
      'ALERT',
      orders
        .filter((o) => {
          const l = o.listingId != null ? lmap.get(o.listingId) : undefined
          return !l || l.tenantId !== o.tenantId || l.productId !== o.productId
        })
        .map(bad),
    )
  }
  // A5 解冻 cron 停了
  push(
    'A5',
    'ALERT',
    orders
      .filter(
        (o) =>
          o.settleState === 'ACCRUED' &&
          o.deliveryStatus === 'DELIVERED' &&
          o.deliveredAt != null &&
          o.settleHoldDays != null &&
          o.deliveredAt.getTime() + (o.settleHoldDays + 1) * 86400_000 < now.getTime(),
      )
      .map(bad),
  )
  // A6 MISSING
  push('A6', 'ALERT', orders.filter((o) => o.settleState === 'MISSING').map(bad))
  // A7 PAYING 超过 24 小时
  {
    const paying = await db.tenantStatement.findMany({
      where: { state: 'PAYING', payingAt: { lt: new Date(now.getTime() - 24 * 3600_000) }, ...(tid !== undefined ? { tenantId: tid } : {}) },
      select: { tenantId: true, statementNo: true },
    })
    push('A7', 'ALERT', paying.map((s) => ({ tenantId: s.tenantId, sample: s.statementNo })))
  }
  // A8 货款已解冻 30 天、发票分成仍冻结（票一直没开）
  {
    const cand = orders.filter((o) => o.invShareState === 'ACCRUED' && o.settleState === 'RELEASED')
    const b: Bad[] = []
    if (cand.length) {
      const rels = await db.tenantLedgerEntry.groupBy({ by: ['orderId'], where: { orderId: { in: cand.map((o) => o.id) }, type: 'RELEASE' }, _max: { createdAt: true } })
      const rm = new Map(rels.map((r) => [r.orderId as number, r._max.createdAt]))
      for (const o of cand) {
        const at = rm.get(o.id)
        if (at && at.getTime() < now.getTime() - 30 * 86400_000) b.push(bad(o))
      }
    }
    push('A8', 'ALERT', b)
  }
  // A9 可结算为负
  {
    const b: Bad[] = []
    const ts = await db.tenant.findMany({ where: { kind: 'CHANNEL', ...(tid !== undefined ? { id: tid } : {}) }, select: { id: true, code: true } })
    for (const t of ts) {
      const bal = await computeBalances(t.id)
      if (bal.negative) {
        b.push({ tenantId: t.id, sample: t.code })
        negatives.push({ tenantId: t.id, payoutCents: bal.available.payoutCents })
      }
    }
    push('A9', 'ALERT', b)
  }
  // A10 费率改了却没有审计
  {
    const b: Bad[] = []
    const ts = await db.tenant.findMany({
      where: { kind: 'CHANNEL', ...(tid !== undefined ? { id: tid } : {}) },
      select: { id: true, code: true, feeRateBp: true, invoiceShareRateBp: true, createdAt: true },
    })
    for (const t of ts) {
      const last = await db.auditEvent.findFirst({
        where: { tenantId: t.id, action: { in: ['tenant.rates', 'tenant.create'] }, result: 'OK' },
        orderBy: { at: 'desc' },
        select: { at: true },
      })
      const since = last?.at ?? t.createdAt
      const after = await db.order.findFirst({
        where: {
          tenantId: t.id,
          createdAt: { gt: since },
          OR: [{ feeRateBp: { not: t.feeRateBp } }, { invoiceShareRateBp: { not: t.invoiceShareRateBp } }],
        },
        select: { orderNo: true },
      })
      if (after) b.push({ tenantId: t.id, sample: after.orderNo })
    }
    push('A10', 'ALERT', b)
  }
  // A11 渠道单都有客户关系
  {
    const b: Bad[] = []
    if (orders.length) {
      const cs = await db.tenantCustomer.findMany({
        where: { OR: Array.from(new Set(orders.map((o) => o.tenantId))).map((t) => ({ tenantId: t, userId: { in: orders.filter((o) => o.tenantId === t).map((o) => o.userId) } })) },
        select: { tenantId: true, userId: true },
      })
      const has = new Set(cs.map((c) => `${c.tenantId}:${c.userId}`))
      for (const o of orders) if (!has.has(`${o.tenantId}:${o.userId}`)) b.push(bad(o))
    }
    push('A11', 'ALERT', b)
  }
  // A12 票据来源站与订单一致、渠道单票据带 shopOrderId、外部订单行与订单同站
  {
    const b: Bad[] = []
    const tf = tid !== undefined ? Prisma.sql`AND (x.tenant_id = ${tid} OR o.tenant_id = ${tid})` : Prisma.empty
    const inv = await db.$queryRaw<{ no: string; t: number }[]>`
      SELECT x.invoice_no AS no, x.tenant_id AS t FROM invoices x LEFT JOIN orders o ON o.id = x.shop_order_id
       WHERE ((x.shop_order_id IS NOT NULL AND (o.id IS NULL OR o.tenant_id <> x.tenant_id)) OR (x.shop_order_id IS NULL AND x.tenant_id <> 1)) ${tf}
       LIMIT 50`
    const rec = await db.$queryRaw<{ no: string; t: number }[]>`
      SELECT x.receipt_no AS no, x.tenant_id AS t FROM receipts x LEFT JOIN orders o ON o.id = x.shop_order_id
       WHERE ((x.shop_order_id IS NOT NULL AND (o.id IS NULL OR o.tenant_id <> x.tenant_id)) OR (x.shop_order_id IS NULL AND x.tenant_id <> 1)) ${tf}
       LIMIT 50`
    const viaExt = await db.$queryRaw<{ no: string; t: number }[]>`
      SELECT x.invoice_no AS no, o.tenant_id AS t FROM invoices x
        JOIN external_orders eo ON eo.id = x.external_order_id
        JOIN orders o ON o.id = eo.shop_order_id
       WHERE (o.tenant_id <> x.tenant_id OR (o.tenant_id >= 2 AND x.shop_order_id IS NULL) OR eo.tenant_id <> o.tenant_id) ${tf}
       LIMIT 50`
    const recExt = await db.$queryRaw<{ no: string; t: number }[]>`
      SELECT x.receipt_no AS no, o.tenant_id AS t FROM receipts x
        JOIN external_orders eo ON eo.id = x.external_order_id
        JOIN orders o ON o.id = eo.shop_order_id
       WHERE (o.tenant_id <> x.tenant_id OR (o.tenant_id >= 2 AND x.shop_order_id IS NULL) OR eo.tenant_id <> o.tenant_id) ${tf}
       LIMIT 50`
    for (const r of [...inv, ...rec, ...viaExt, ...recExt]) b.push({ tenantId: Number(r.t), sample: r.no })
    push('A12', 'ALERT', b)
  }
  // A13 发票组与发票状态不一致
  {
    const b: Bad[] = []
    for (const o of orders) {
      if (o.invShareState == null) continue
      const st = basisOf(o)?.invoiceStatus ?? null
      if (o.invShareState === 'RELEASED' && st !== 'ISSUED') b.push(bad(o))
      if (st === 'CANNOT' && (o.invShareState === 'ACCRUED' || o.invShareState === 'RELEASED') && !(o.refundedTaxCents ?? 0)) b.push(bad(o))
    }
    push('A13', 'ALERT', b)
  }

  return { items, moneyFail, negatives }
}
