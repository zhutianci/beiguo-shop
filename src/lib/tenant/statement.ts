/**
 * 结算单：出单、认领、放弃认领、登记打款、退回、退票（设计 10.9、10.10；WP3）。站长专用：渠道层只经 partner-facade 的
 * applySettlementForPartner（固定 origin='REQUEST'）。
 *
 * 【出单 generateStatement】一个事务：
 *  1. 第一句 `SELECT … FROM tenants WHERE id = ? FOR UPDATE` 锁渠道行，串行化该渠道的出单（锁到之后的第一次普通读才建立 RR 快照，
 *     所以后到者一定看得见先到者刚提交的结算单）；
 *  2. 前置：payoutHold=false；当天钱类对账通过（事务前跑 runReconcile，失败即置 hold）；收款信息已设置且不在 72 小时冷静期；
 *     没有未完结结算单（openKey 唯一兜底）；REQUEST 距上次 ≥ requestIntervalDays；
 *  3. 取 U 中的分录，**按 eventKey 整组取舍**：该 eventKey 所有腿里最大的 createdAt < periodEnd 才收入（防一个事件只收进半个）；
 *  4. net ≤ 0 → NEGATIVE；SCHEDULE / REQUEST 且 net < minPayoutCents → BELOW_MIN；MANUAL 只要求 net > 0；
 *  5. 插结算单（openKey = tenantId、seq = 上期 + 1、随机 statementNo、收款人快照、requestId 唯一）+ 逐条 TenantStatementLine（entryId 唯一）
 *     + stmt:{sid} 两条腿（一次 createMany）。任何唯一冲突整个事务回滚；
 *  6. 提交后 emitTenantNotice(STATEMENT)。
 * 【状态机】全部 `updateMany where { id, state: 旧 }`，count ≠ 1 即 CONFLICT；审计与状态迁移同一事务。
 * 结算单生成后金额永不修改；有问题走 RETURNED 或下期调账（设计 10.1 第 6 条）。
 */
import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { writeAudit } from '../audit'
import { insertLedgerEvents } from './ledger'
import type { LegInput } from './ledger'
import { emitTenantNotice } from './notice'
import { newStatementNo } from './public-no'
import { runReconcile } from './reconcile'
import { TENANT_DEFAULTS } from './types'
import type { GenerateResult, LedgerComponent, StatementOrigin } from './types'

type Tx = Prisma.TransactionClient

const ORIGINS: ReadonlySet<string> = new Set(['SCHEDULE', 'REQUEST', 'MANUAL'])
const OPEN_STATES = ['GENERATED', 'CONFIRMED', 'DISPUTED', 'PAYING'] as const
const PAYOUT_METHODS: ReadonlySet<string> = new Set(['ALIPAY', 'BANK', 'WECHAT'])
/** 退回时按成分拆回的腿名（设计 10.4） */
const RETURN_LEG: Readonly<Record<string, string>> = Object.freeze({
  SALE: 'rg',
  PURCHASE: 'rp',
  INVOICE_SHARE: 'rs',
  FEE: 'rf',
  INVOICE_FEE: 'rsf',
  SHORT: 'rsh',
  LOSS: 'rl',
  MANUAL: 'rm',
})

function isP2002(e: unknown, field?: string): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') return false
  if (!field) return true
  const target = (e.meta as { target?: unknown } | undefined)?.target
  const t = Array.isArray(target) ? target.join(',') : String(target ?? '')
  return t.includes(field)
}

class Refuse extends Error {
  constructor(public result: GenerateResult) {
    super('refuse')
  }
}

/**
 * 周期结算的 periodEnd（设计 10.9）：东八区「本周一 00:00」对应的 UTC 时刻（now 本身是周一 00:00 之后的任意时刻）。
 * 站长在后台点「生成本期结算单」时用它（P1 改成每周一 00:00 的 cron）。
 */
export function scheduledPeriodEnd(now: Date = new Date()): Date {
  const cn = new Date(now.getTime() + 8 * 3600_000)
  const dow = (cn.getUTCDay() + 6) % 7 // 周一 = 0
  const monday = Date.UTC(cn.getUTCFullYear(), cn.getUTCMonth(), cn.getUTCDate()) - dow * 86400_000
  return new Date(monday - 8 * 3600_000)
}

async function lockTenant(tx: Tx, tenantId: number): Promise<void> {
  const rows = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`
  if (!rows.length) throw new Error(`[statement] 渠道 ${tenantId} 不存在`)
}

export async function generateStatement(a: {
  tenantId: number
  origin: StatementOrigin
  periodEnd: Date
  actorUserId: number | null
  requestId: string
}): Promise<GenerateResult> {
  if (!Number.isInteger(a.tenantId) || a.tenantId < 2) throw new Error(`[statement] tenantId 非法：${a.tenantId}`)
  if (!ORIGINS.has(a.origin)) throw new Error(`[statement] origin 非法：${a.origin}`)
  if (!(a.periodEnd instanceof Date) || Number.isNaN(a.periodEnd.getTime())) throw new Error('[statement] periodEnd 非法')
  const requestId = String(a.requestId ?? '').trim()
  if (!requestId || requestId.length > 40) throw new Error('[statement] requestId 必填（≤ 40 字符）')

  // 同一个 requestId 重复提交：直接返回当初的结果（双击、重试）
  const prior = await prisma.tenantStatement.findUnique({ where: { requestId }, select: { tenantId: true, statementNo: true, netCents: true } })
  if (prior) {
    if (prior.tenantId !== a.tenantId) throw new Error('[statement] requestId 已被其他渠道使用')
    return { ok: true, statementNo: prior.statementNo, netCents: prior.netCents }
  }

  // 当天钱类对账（出结算单前再跑一次）：失败 → 该渠道 payoutHold，拒绝出单
  const rec = await runReconcile({ tenantId: a.tenantId, applyHold: true })
  if (rec.items.some((i) => i.level === 'MONEY' && !i.ok)) return { ok: false, reason: 'RECONCILE_FAILED' }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await prisma.$transaction(
        async (tx) => {
          await lockTenant(tx, a.tenantId)
          const t = await tx.tenant.findUnique({ where: { id: a.tenantId } })
          if (!t || t.kind !== 'CHANNEL') throw new Error(`[statement] 渠道 ${a.tenantId} 不存在`)
          const dup = await tx.tenantStatement.findUnique({ where: { requestId }, select: { statementNo: true, netCents: true } })
          if (dup) return { ok: true as const, statementNo: dup.statementNo, netCents: dup.netCents, fresh: false, id: 0 }
          if (t.payoutHold) throw new Refuse({ ok: false, reason: 'HOLD' })
          if (!t.payeeName || !t.payeeMethod || !t.payeeAccountMasked) throw new Refuse({ ok: false, reason: 'PAYEE_MISSING' })
          const now = new Date()
          if (t.payeeChangedAt && now.getTime() - t.payeeChangedAt.getTime() < TENANT_DEFAULTS.payeeCooldownHours * 3600_000) {
            throw new Refuse({ ok: false, reason: 'PAYEE_COOLDOWN' })
          }
          if ((await tx.tenantStatement.count({ where: { openKey: a.tenantId } })) > 0) throw new Refuse({ ok: false, reason: 'OPEN_EXISTS' })
          if (a.origin === 'REQUEST') {
            const last = await tx.tenantStatement.findFirst({ where: { tenantId: a.tenantId, origin: 'REQUEST' }, orderBy: { id: 'desc' }, select: { createdAt: true } })
            if (last && now.getTime() - last.createdAt.getTime() < t.requestIntervalDays * 86400_000) throw new Refuse({ ok: false, reason: 'INTERVAL' })
          }

          // U：AVAILABLE、未进任何结算单、非 NET
          const cand = await tx.$queryRaw<{ id: number; ek: string; component: string; amt: number }[]>`
            SELECT e.id, e.event_key AS ek, e.component, e.amount_cents AS amt
              FROM tenant_ledger_entries e
              LEFT JOIN tenant_statement_lines l ON l.entry_id = e.id
             WHERE e.tenant_id = ${a.tenantId} AND e.bucket = 'AVAILABLE' AND e.component <> 'NET' AND l.id IS NULL`
          const keys = Array.from(new Set(cand.map((c) => c.ek)))
          const maxAt = new Map<string, number>()
          for (let i = 0; i < keys.length; i += 500) {
            const chunk = keys.slice(i, i + 500)
            const rows = await tx.$queryRaw<{ ek: string; mx: Date }[]>`
              SELECT event_key AS ek, MAX(created_at) AS mx FROM tenant_ledger_entries
               WHERE tenant_id = ${a.tenantId} AND event_key IN (${Prisma.join(chunk)}) GROUP BY event_key`
            for (const row of rows) maxAt.set(row.ek, new Date(row.mx).getTime())
          }
          const picked = cand.filter((c) => (maxAt.get(c.ek) ?? Infinity) < a.periodEnd.getTime())
          const sum: Record<string, number> = {}
          for (const c of picked) sum[c.component] = (sum[c.component] ?? 0) + Number(c.amt)
          const goods = sum.SALE ?? 0
          const purchase = sum.PURCHASE ?? 0
          const invShare = sum.INVOICE_SHARE ?? 0
          const fee = (sum.FEE ?? 0) + (sum.INVOICE_FEE ?? 0)
          const other = (sum.LOSS ?? 0) + (sum.SHORT ?? 0) + (sum.MANUAL ?? 0)
          const gross = goods + purchase + invShare + other
          const net = gross + fee
          if (net <= 0) throw new Refuse({ ok: false, reason: 'NEGATIVE' })
          if (a.origin !== 'MANUAL' && net < t.minPayoutCents) throw new Refuse({ ok: false, reason: 'BELOW_MIN' })

          const last = await tx.tenantStatement.findFirst({ where: { tenantId: a.tenantId }, orderBy: { seq: 'desc' }, select: { seq: true } })
          const sorted = picked.map((c) => ({ id: Number(c.id), amt: Number(c.amt) })).sort((x, y) => x.id - y.id)
          const contentHash = crypto.createHash('sha256').update(sorted.map((c) => `${c.id}:${c.amt}`).join(',')).digest('hex')
          const statementNo = newStatementNo()
          const s = await tx.tenantStatement.create({
            data: {
              statementNo,
              tenantId: a.tenantId,
              seq: (last?.seq ?? 0) + 1,
              origin: a.origin,
              openKey: a.tenantId,
              periodEnd: a.periodEnd,
              lineCount: sorted.length,
              goodsCents: goods,
              purchaseCents: purchase,
              invShareCents: invShare,
              feeCents: fee,
              otherCents: other,
              grossCents: gross,
              netCents: net,
              contentHash,
              state: 'GENERATED',
              payeeName: t.payeeName,
              payeeMethod: t.payeeMethod,
              payeeAccountMasked: t.payeeAccountMasked,
              payeeAccountEnc: t.payeeAccountEnc,
              requestId,
              createdBy: a.actorUserId,
            },
            select: { id: true },
          })
          for (let i = 0; i < sorted.length; i += 1000) {
            await tx.tenantStatementLine.createMany({ data: sorted.slice(i, i + 1000).map((c) => ({ statementId: s.id, entryId: c.id })) })
          }
          await insertLedgerEvents(tx, a.tenantId, [
            {
              eventKey: `stmt:${s.id}`,
              legs: [
                { leg: 'a', type: 'STATEMENT', component: 'NET', bucket: 'AVAILABLE', amountCents: -net, statementId: s.id, operatorId: a.actorUserId },
                { leg: 'b', type: 'STATEMENT', component: 'NET', bucket: 'IN_PAYOUT', amountCents: net, statementId: s.id, operatorId: a.actorUserId },
              ],
            },
          ])
          await writeAudit(tx, {
            actorUserId: a.actorUserId,
            actorKind: a.origin === 'REQUEST' ? 'TENANT' : a.actorUserId == null ? 'SYSTEM' : 'PLATFORM',
            tenantId: a.tenantId,
            action: 'statement.generate',
            targetType: 'statement',
            targetId: statementNo,
            diff: { statementNo, origin: a.origin, periodEnd: a.periodEnd.toISOString(), netCents: net, lineCount: sorted.length },
            publicDiff: { statementNo, from: null, to: 'GENERATED' },
          })
          return { ok: true as const, statementNo, netCents: net, fresh: true, id: s.id }
        },
        { maxWait: 10_000, timeout: 30_000 },
      )
      if (r.fresh) {
        await emitTenantNotice(null, {
          tenantId: a.tenantId,
          kind: 'STATEMENT',
          title: `结算单 ${r.statementNo} 已生成`,
          body: `本期预计打款 ¥${(r.netCents / 100).toFixed(2)}`,
          refType: 'statement',
          refKey: r.statementNo,
          dedupeKey: `stmt:${r.statementNo}`,
        })
      }
      return { ok: true, statementNo: r.statementNo, netCents: r.netCents }
    } catch (e) {
      if (e instanceof Refuse) return e.result
      if (isP2002(e, 'request_id') || isP2002(e, 'requestId')) {
        const got = await prisma.tenantStatement.findUnique({ where: { requestId }, select: { tenantId: true, statementNo: true, netCents: true } })
        if (got && got.tenantId === a.tenantId) return { ok: true, statementNo: got.statementNo, netCents: got.netCents }
      }
      if (isP2002(e, 'open_key') || isP2002(e, 'openKey')) return { ok: false, reason: 'OPEN_EXISTS' }
      if (isP2002(e) && attempt < 2) continue // statementNo / seq 撞了（极小概率）：整单重来
      throw e
    }
  }
  throw new Error('[statement] 出单连续冲突')
}

async function stmtHead(tx: Tx, statementId: number) {
  return tx.tenantStatement.findUnique({
    where: { id: statementId },
    select: { id: true, tenantId: true, statementNo: true, state: true, netCents: true, payingBy: true },
  })
}

/**
 * GENERATED / CONFIRMED → PAYING（超管「开始打款」认领，记 payingBy / payingAt）。
 *
 * 【payoutHold 在这里拦】设计 5.1：hold「停出结算单与打款」。出单前 generateStatement 已拦，但 hold 可能在单子生成**之后**
 * 才被置上（例：周一出了单，03:00 对账发现 L8/L9 失败）——这时钱还没转出，认领这一步必须停下，等站长查清、解除 hold 再打。
 * 契约返回值只有 OK / CONFLICT，这里按 CONFLICT 返回（调用方拿到非 OK 一律不放行，fail closed）；
 * 后台打款页据 tenant.payoutHold 自行显示「该渠道已暂停打款」（WP5）。
 * 读 hold 用共享锁读（LOCK IN SHARE MODE，5.7 / 8.0 通用）：与对账置 hold 的 UPDATE 串行，不会读到事务开始时的旧快照。
 * 已认领（PAYING）的单子不因 hold 拦登记（registerPayout），理由见那里。
 */
export async function markPaying(statementId: number, adminId: number): Promise<'OK' | 'CONFLICT'> {
  return prisma.$transaction(async (tx) => {
    const s = await stmtHead(tx, statementId)
    if (!s) return 'CONFLICT'
    const holdRows = await tx.$queryRaw<{ hold: number | boolean }[]>`SELECT payout_hold AS hold FROM tenants WHERE id = ${s.tenantId} LOCK IN SHARE MODE`
    if (!holdRows.length || Number(holdRows[0].hold) !== 0) return 'CONFLICT'
    const r = await tx.tenantStatement.updateMany({
      where: { id: statementId, state: { in: ['GENERATED', 'CONFIRMED'] } },
      data: { state: 'PAYING', payingBy: adminId, payingAt: new Date() },
    })
    if (r.count !== 1) return 'CONFLICT'
    await writeAudit(tx, {
      actorUserId: adminId,
      actorKind: 'PLATFORM',
      tenantId: s.tenantId,
      action: 'statement.paying',
      targetType: 'statement',
      targetId: s.statementNo,
      diff: { from: s.state, to: 'PAYING' },
      publicDiff: { statementNo: s.statementNo, from: s.state, to: 'PAYING' },
    })
    return 'OK'
  })
}

/** PAYING → GENERATED（放弃认领）：必须确认「未转出」 */
export async function cancelPaying(statementId: number, adminId: number, confirmNotTransferred: true): Promise<'OK' | 'CONFLICT'> {
  if (confirmNotTransferred !== true) return 'CONFLICT'
  return prisma.$transaction(async (tx) => {
    const s = await stmtHead(tx, statementId)
    if (!s) return 'CONFLICT'
    const r = await tx.tenantStatement.updateMany({ where: { id: statementId, state: 'PAYING' }, data: { state: 'GENERATED', payingBy: null, payingAt: null } })
    if (r.count !== 1) return 'CONFLICT'
    await writeAudit(tx, {
      actorUserId: adminId,
      actorKind: 'PLATFORM',
      tenantId: s.tenantId,
      action: 'statement.unpaying',
      targetType: 'statement',
      targetId: s.statementNo,
      reason: '确认未转出',
      diff: { from: 'PAYING', to: 'GENERATED', previousPayingBy: s.payingBy, confirmNotTransferred: true },
      publicDiff: { statementNo: s.statementNo, from: 'PAYING', to: 'GENERATED' },
    })
    return 'OK'
  })
}

class PayoutRefuse extends Error {
  constructor(public code: 'CONFLICT' | 'AMOUNT_MISMATCH' | 'DUP_TRADE_NO' | 'INVOICE_REQUIRED') {
    super(code)
  }
}

/**
 * PAYING → PAID：amount + withhold = net；externalTradeNo 全局唯一；合作方要求发票（requirePartnerInvoice）时
 * 必须填发票号且发票金额 = 实际打款额（含代扣）。同一事务插 TenantPayout、写 payout:{sid} / withhold:{sid}、openKey = NULL。
 *
 * 【这里故意不看 payoutHold】能走到登记的单子已经 PAYING（认领时 hold 为 false，markPaying 已拦），钱很可能已经转出去了。
 * 此时再因 hold 拒登记，只会让一笔真实发生的转账在账本里缺席（渠道看到的「结算中」永远不清、下期还可能重复出单）。
 * 认领后才置上的 hold：先把这笔登记如实记下，再按 hold 原因处理（下期调账 / 回款），而不是拒记事实。
 */
export async function registerPayout(
  statementId: number,
  adminId: number,
  p: {
    amountCents: number
    withholdCents: number
    method: 'ALIPAY' | 'BANK' | 'WECHAT'
    externalTradeNo: string
    paidAt: Date
    proofFile?: string | null
    voucherType: string
    partnerInvoiceNo?: string | null
    partnerInvoiceAmountCents?: number | null
  },
): Promise<'OK' | 'CONFLICT' | 'AMOUNT_MISMATCH' | 'DUP_TRADE_NO' | 'INVOICE_REQUIRED'> {
  const tradeNo = String(p.externalTradeNo ?? '').trim()
  if (!tradeNo || tradeNo.length > 64) throw new Error('[statement] 外部流水号必填（≤ 64 字符）')
  if (!PAYOUT_METHODS.has(p.method)) throw new Error(`[statement] 打款方式非法：${p.method}`)
  if (!Number.isSafeInteger(p.amountCents) || p.amountCents < 0 || !Number.isSafeInteger(p.withholdCents) || p.withholdCents < 0) {
    return 'AMOUNT_MISMATCH'
  }
  if (!(p.paidAt instanceof Date) || Number.isNaN(p.paidAt.getTime())) throw new Error('[statement] 打款时间非法')
  let notice: { tenantId: number; statementNo: string } | null = null
  try {
    await prisma.$transaction(async (tx) => {
      const s = await tx.tenantStatement.findUnique({ where: { id: statementId }, select: { id: true, tenantId: true, statementNo: true, state: true, netCents: true } })
      if (!s || s.state !== 'PAYING') throw new PayoutRefuse('CONFLICT')
      if (p.amountCents + p.withholdCents !== s.netCents) throw new PayoutRefuse('AMOUNT_MISMATCH')
      const t = await tx.tenant.findUnique({ where: { id: s.tenantId }, select: { requirePartnerInvoice: true } })
      const invNo = (p.partnerInvoiceNo ?? '').trim()
      if (t?.requirePartnerInvoice && (!invNo || p.partnerInvoiceAmountCents !== s.netCents)) throw new PayoutRefuse('INVOICE_REQUIRED')
      if (await tx.tenantPayout.findUnique({ where: { externalTradeNo: tradeNo }, select: { id: true } })) throw new PayoutRefuse('DUP_TRADE_NO')
      const r = await tx.tenantStatement.updateMany({
        where: { id: statementId, state: 'PAYING' },
        data: {
          state: 'PAID',
          openKey: null,
          voucherType: String(p.voucherType ?? '').slice(0, 20) || null,
          partnerInvoiceNo: invNo ? invNo.slice(0, 64) : null,
          partnerInvoiceAmountCents: p.partnerInvoiceAmountCents ?? null,
        },
      })
      if (r.count !== 1) throw new PayoutRefuse('CONFLICT')
      await tx.tenantPayout.create({
        data: {
          statementId,
          tenantId: s.tenantId,
          amountCents: p.amountCents,
          withholdCents: p.withholdCents,
          method: p.method,
          externalTradeNo: tradeNo,
          proofFile: p.proofFile ?? null,
          paidAt: p.paidAt,
          operatorId: adminId,
        },
      })
      const legs: LegInput[] = [{ leg: 'a', type: 'PAYOUT', component: 'NET', bucket: 'IN_PAYOUT', amountCents: -p.amountCents, statementId, operatorId: adminId }]
      await insertLedgerEvents(tx, s.tenantId, [
        { eventKey: `payout:${statementId}`, legs },
        { eventKey: `withhold:${statementId}`, legs: [{ leg: 'a', type: 'WITHHOLD', component: 'NET', bucket: 'IN_PAYOUT', amountCents: -p.withholdCents, statementId, operatorId: adminId }] },
      ])
      await writeAudit(tx, {
        actorUserId: adminId,
        actorKind: 'PLATFORM',
        tenantId: s.tenantId,
        action: 'statement.payout',
        targetType: 'statement',
        targetId: s.statementNo,
        diff: { from: 'PAYING', to: 'PAID', amountCents: p.amountCents, withholdCents: p.withholdCents, method: p.method, externalTradeNo: tradeNo, voucherType: p.voucherType, partnerInvoiceNo: invNo || null },
        publicDiff: { statementNo: s.statementNo, from: 'PAYING', to: 'PAID' },
      })
      notice = { tenantId: s.tenantId, statementNo: s.statementNo }
    })
  } catch (e) {
    if (e instanceof PayoutRefuse) return e.code
    if (isP2002(e, 'external_trade_no') || isP2002(e, 'externalTradeNo')) return 'DUP_TRADE_NO'
    if (isP2002(e)) return 'CONFLICT'
    throw e
  }
  const n = notice as { tenantId: number; statementNo: string } | null
  if (n) {
    await emitTenantNotice(null, {
      tenantId: n.tenantId,
      kind: 'PAYOUT',
      title: `结算单 ${n.statementNo} 已打款`,
      body: `打款 ¥${(p.amountCents / 100).toFixed(2)}${p.withholdCents ? `，代扣 ¥${(p.withholdCents / 100).toFixed(2)}` : ''}；流水号尾号 ${tradeNo.slice(-4)}`,
      refType: 'statement',
      refKey: n.statementNo,
      dedupeKey: `payout:${n.statementNo}`,
    })
  }
  return 'OK'
}

/**
 * GENERATED / CONFIRMED / DISPUTED / PAYING → RETURNED（从 PAYING 退回必须确认「未转出」）。
 * ret:{sid}：IN_PAYOUT −net；AVAILABLE 按 TenantStatementLine ⋈ TenantLedgerEntry **按成分重新求和**拆回
 * （结算单只存了 5 个汇总列，fee / other 各合并了两三个成分，拆不出来；从纳入明细重算则精确，设计 10.4）。
 * 拆回的腿不带 orderId、带 statementId；它们不在任何结算单里，属于 U，下期照常出单。
 */
export async function returnStatement(statementId: number, adminId: number, reason: string, confirmNotTransferred: boolean): Promise<'OK' | 'CONFLICT'> {
  let notice: { tenantId: number; statementNo: string } | null = null
  const res = await prisma.$transaction(async (tx) => {
    const s = await tx.tenantStatement.findUnique({ where: { id: statementId }, select: { id: true, tenantId: true, statementNo: true, state: true, netCents: true } })
    if (!s || !(OPEN_STATES as readonly string[]).includes(s.state)) return 'CONFLICT' as const
    if (s.state === 'PAYING' && confirmNotTransferred !== true) return 'CONFLICT' as const
    const r = await tx.tenantStatement.updateMany({
      where: { id: statementId, state: s.state },
      data: { state: 'RETURNED', openKey: null, returnReason: String(reason ?? '').slice(0, 255) || null },
    })
    if (r.count !== 1) return 'CONFLICT' as const
    const comps = await tx.$queryRaw<{ component: string; s: unknown }[]>`
      SELECT e.component, SUM(e.amount_cents) AS s
        FROM tenant_statement_lines l JOIN tenant_ledger_entries e ON e.id = l.entry_id
       WHERE l.statement_id = ${statementId}
       GROUP BY e.component`
    const memo = `退回结算单 ${s.statementNo} 转入`
    const legs: LegInput[] = [{ leg: 'a', type: 'RETURN', component: 'NET', bucket: 'IN_PAYOUT', amountCents: -s.netCents, statementId, operatorId: adminId, publicMemo: memo }]
    let back = 0
    for (const c of comps) {
      const amt = Number(c.s ?? 0)
      const leg = RETURN_LEG[c.component]
      if (!amt || !leg) continue
      back += amt
      legs.push({ leg, type: 'RETURN', component: c.component as LedgerComponent, bucket: 'AVAILABLE', amountCents: amt, statementId, operatorId: adminId, publicMemo: memo })
    }
    if (back !== s.netCents) throw new Error(`[statement] 结算单 ${s.statementNo} 纳入明细合计 ${back} ≠ net ${s.netCents}，拒绝退回（请先跑对账 L8）`)
    await insertLedgerEvents(tx, s.tenantId, [{ eventKey: `ret:${statementId}`, legs }])
    await writeAudit(tx, {
      actorUserId: adminId,
      actorKind: 'PLATFORM',
      tenantId: s.tenantId,
      action: 'statement.return',
      targetType: 'statement',
      targetId: s.statementNo,
      reason,
      diff: { from: s.state, to: 'RETURNED', reason, confirmNotTransferred },
      publicDiff: { statementNo: s.statementNo, from: s.state, to: 'RETURNED' },
    })
    notice = { tenantId: s.tenantId, statementNo: s.statementNo }
    return 'OK' as const
  })
  const n = notice as { tenantId: number; statementNo: string } | null
  if (res === 'OK' && n) {
    await emitTenantNotice(null, {
      tenantId: n.tenantId,
      kind: 'STATEMENT',
      title: `结算单 ${n.statementNo} 已退回`,
      body: '该结算单的金额已转回可结算，将随下一期结算单重新出具',
      refType: 'statement',
      refKey: n.statementNo,
      dedupeKey: `stmt-ret:${n.statementNo}`,
    })
  }
  return res
}

/**
 * 已打款后银行退票：要求结算单 PAID / RECEIVED，且该单累计退票额 ≤ 实际打款额 amountCents。
 * bounce:{流水号} AVAILABLE +amount（MANUAL，带 statementId），结算单状态不变。
 */
export async function registerBounce(
  statementId: number,
  adminId: number,
  a: { amountCents: number; externalNo: string },
): Promise<'OK' | 'DUPLICATE' | 'BAD_STATE' | 'OVER_AMOUNT'> {
  const no = String(a.externalNo ?? '').trim()
  if (!no || no.length > 64) throw new Error('[statement] 退票流水号必填（≤ 64 字符）')
  if (!Number.isSafeInteger(a.amountCents) || a.amountCents <= 0) return 'OVER_AMOUNT'
  const eventKey = `bounce:${no}`
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM tenant_statements WHERE id = ${statementId} FOR UPDATE`
    if (!locked.length) return 'BAD_STATE'
    const s = await tx.tenantStatement.findUnique({ where: { id: statementId }, select: { tenantId: true, statementNo: true, state: true } })
    if (!s || (s.state !== 'PAID' && s.state !== 'RECEIVED')) return 'BAD_STATE'
    if ((await tx.tenantLedgerEntry.count({ where: { eventKey } })) > 0) return 'DUPLICATE'
    const payout = await tx.tenantPayout.findUnique({ where: { statementId }, select: { amountCents: true } })
    if (!payout) return 'BAD_STATE'
    const sofar = await tx.tenantLedgerEntry.aggregate({ where: { statementId, type: 'BOUNCE' }, _sum: { amountCents: true } })
    if ((sofar._sum.amountCents ?? 0) + a.amountCents > payout.amountCents) return 'OVER_AMOUNT'
    const n = await insertLedgerEvents(tx, s.tenantId, [
      {
        eventKey,
        legs: [{ leg: 'a', type: 'BOUNCE', component: 'MANUAL', bucket: 'AVAILABLE', amountCents: a.amountCents, statementId, operatorId: adminId, publicMemo: `结算单 ${s.statementNo} 打款退票` }],
      },
    ])
    if (n === 0) return 'DUPLICATE'
    await writeAudit(tx, {
      actorUserId: adminId,
      actorKind: 'PLATFORM',
      tenantId: s.tenantId,
      action: 'statement.bounce',
      targetType: 'statement',
      targetId: s.statementNo,
      diff: { amountCents: a.amountCents, externalNo: no },
      publicDiff: { statementNo: s.statementNo, from: s.state, to: s.state },
    })
    return 'OK'
  })
}
