/**
 * 渠道层唯一可 import 的账本入口（设计 6.5.3；WP3）。
 *
 * 【为什么要有这一层】模块级 import 白名单挡不住「在同一个模块里调了站长专用函数」（ledger.ts 里有 adjust / writeoff /
 * depositApply / applyRefund，statement.ts 里有 registerPayout / markPaying / returnStatement），也挡不住「调用方传
 * forPartner:false 读到内部字段」。所以 partner-services 只能 import 本文件（边界检查规则 3），本文件只导出渠道可用的函数：
 *  · 每个函数第一个参数是 tenantId（来自 partnerRoute 查库的店面），并在函数内断言 ≥ 2；
 *  · 按公开编号（orderNo / statementNo）寻址，where 里同时带 tenantId，不符按不存在处理；
 *  · 返回值逐字段映射成 types.ts 里的渠道 DTO：没有 id、eventKey、memo、operatorId、payeeAccountEnc、payingBy、statementId；
 *  · 没有任何「forPartner」之类的开关参数；出单固定 origin='REQUEST'。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { writeAudit } from '../audit'
import { computeBalances, computeBalancesWithComposition, getOrderSettlementViews, ledgerWhere, pageOf, statementLines, statementToDTO } from './balances'
import type { LedgerQuery } from './balances'
import { notifyBuyerOfReply as notifyBuyerOfReplyImpl } from './buyer-notify'
import { sealText } from './crypto'
import { WECOM_WEBHOOK_PREFIX } from './notice'
import { generateStatement } from './statement'
import { LEDGER_COMPONENTS, LEDGER_TYPES, TENANT_DEFAULTS } from './types'
import type { BalanceComposition, GenerateResult, LedgerBucket, LedgerComponent, LedgerRowDTO, LedgerType, OrderSettlementView, StatementDetailDTO, TenantBalances } from './types'

function assertTenantId(tenantId: unknown): asserts tenantId is number {
  if (typeof tenantId !== 'number' || !Number.isInteger(tenantId) || tenantId < 2) {
    throw new Error(`[partner-facade] tenantId 非法：${String(tenantId)}`)
  }
}

/** 渠道侧输入错误（格式不合规）：调用方转 400 */
export class PartnerFacadeError extends Error {
  constructor(public code: 'BAD_WEBHOOK' | 'BAD_REQUEST_ID') {
    super(code)
    this.name = 'PartnerFacadeError'
  }
}

const STATEMENT_NO_RE = /^ST\d{6}[0-9A-HJKMNP-TV-Z]{8}$/
const REQUEST_ID_RE = /^[A-Za-z0-9_-]{8,40}$/

/** 东八区当天 00:00 的 UTC 时刻（「每渠道每天 3 次尝试」按站长的日界） */
function cnDayStart(now: Date): Date {
  const t = new Date(now.getTime() + 8 * 3600_000)
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - 8 * 3600_000)
}

/**
 * 渠道「申请结算」：只能全额结清（periodEnd = 现在）；前置条件（间隔、负余额、hold、冷静期、未完结单、对账）由出单函数判定。
 * 每渠道每天最多 3 次尝试（含失败的尝试），用审计行计数（跨进程、跨重启有效），超出返回 INTERVAL。
 * requestId 由前端在打开确认框时生成（重复提交返回同一张结算单）。
 */
export async function applySettlementForPartner(tenantId: number, userId: number, requestId: string): Promise<GenerateResult> {
  assertTenantId(tenantId)
  if (typeof requestId !== 'string' || !REQUEST_ID_RE.test(requestId)) throw new PartnerFacadeError('BAD_REQUEST_ID')
  const now = new Date()
  const prior = await prisma.tenantStatement.findUnique({ where: { requestId }, select: { tenantId: true, statementNo: true, netCents: true } })
  if (prior && prior.tenantId === tenantId) return { ok: true, statementNo: prior.statementNo, netCents: prior.netCents }
  const attempts = await prisma.auditEvent.count({ where: { tenantId, action: 'statement.apply', at: { gte: cnDayStart(now) } } })
  if (attempts >= TENANT_DEFAULTS.applyPerDay) return { ok: false, reason: 'INTERVAL' }
  let result: GenerateResult
  try {
    result = await generateStatement({ tenantId, origin: 'REQUEST', periodEnd: now, actorUserId: userId, requestId })
  } catch (e) {
    await writeAudit(null, { actorUserId: userId, actorKind: 'TENANT', tenantId, action: 'statement.apply', targetType: 'statement', result: 'ERROR', diff: { requestId } }).catch(() => {})
    throw e
  }
  await writeAudit(null, {
    actorUserId: userId,
    actorKind: 'TENANT',
    tenantId,
    action: 'statement.apply',
    targetType: 'statement',
    targetId: result.ok ? result.statementNo : undefined,
    result: result.ok ? 'OK' : 'DENIED',
    reasonCode: result.ok ? undefined : result.reason,
    diff: result.ok ? { statementNo: result.statementNo, netCents: result.netCents } : { reason: result.reason },
  }).catch((e) => console.error('[partner-facade] 申请结算审计写入失败', e))
  return result
}

export async function balancesForPartner(tenantId: number): Promise<TenantBalances> {
  assertTenantId(tenantId)
  const b = await computeBalances(tenantId)
  return {
    available: { balanceCents: b.available.balanceCents, feeCents: b.available.feeCents, payoutCents: b.available.payoutCents },
    pending: { balanceCents: b.pending.balanceCents, feeCents: b.pending.feeCents, payoutCents: b.pending.payoutCents },
    inPayoutCents: b.inPayoutCents,
    depositCents: b.depositCents,
    paidTotalCents: b.paidTotalCents,
    withheldTotalCents: b.withheldTotalCents,
    negative: b.negative,
  }
}

/** 余额构成（结算中心，设计 10.8、12.1）：可结算 / 冻结中两个桶按成分的合计，逐字段显式构造 */
export async function balanceCompositionForPartner(tenantId: number): Promise<{ available: BalanceComposition; pending: BalanceComposition }> {
  assertTenantId(tenantId)
  const { composition: c } = await computeBalancesWithComposition(tenantId)
  const pick = (x: BalanceComposition): BalanceComposition => ({
    goodsCents: x.goodsCents,
    purchaseCents: x.purchaseCents,
    invShareCents: x.invShareCents,
    feeCents: x.feeCents,
    otherCents: x.otherCents,
  })
  return { available: pick(c.available), pending: pick(c.pending) }
}

const TYPE_SET: ReadonlySet<string> = new Set(LEDGER_TYPES)
const COMP_SET: ReadonlySet<string> = new Set(LEDGER_COMPONENTS)

/** 渠道流水（不含 id、eventKey、memo、operatorId；statementId 只换成 statementNo） */
export async function listLedgerForPartner(
  tenantId: number,
  q: { page: number; pageSize: number; type?: LedgerType; component?: LedgerComponent; from?: Date; to?: Date },
): Promise<{ total: number; rows: LedgerRowDTO[] }> {
  assertTenantId(tenantId)
  const safe: LedgerQuery = {
    page: q.page,
    pageSize: q.pageSize,
    type: q.type && TYPE_SET.has(q.type) ? q.type : undefined,
    component: q.component && COMP_SET.has(q.component) ? q.component : undefined,
    from: q.from instanceof Date && !Number.isNaN(q.from.getTime()) ? q.from : undefined,
    to: q.to instanceof Date && !Number.isNaN(q.to.getTime()) ? q.to : undefined,
  }
  const where = ledgerWhere(tenantId, safe)
  const { skip, take } = pageOf(safe)
  const [total, list] = await Promise.all([
    prisma.tenantLedgerEntry.count({ where }),
    prisma.tenantLedgerEntry.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take,
      select: { type: true, component: true, bucket: true, amountCents: true, publicMemo: true, createdAt: true, statementId: true, order: { select: { orderNo: true } } },
    }),
  ])
  const sids = Array.from(new Set(list.map((r) => r.statementId).filter((v): v is number => v != null)))
  const stmts = sids.length ? await prisma.tenantStatement.findMany({ where: { id: { in: sids }, tenantId }, select: { id: true, statementNo: true } }) : []
  const noOf = new Map(stmts.map((s) => [s.id, s.statementNo]))
  return {
    total,
    rows: list.map((r) => ({
      at: r.createdAt.toISOString(),
      type: r.type as LedgerType,
      component: r.component as LedgerComponent,
      bucket: r.bucket as LedgerBucket,
      amountCents: r.amountCents,
      orderNo: r.order?.orderNo ?? null,
      statementNo: r.statementId != null ? noOf.get(r.statementId) ?? null : null,
      publicMemo: r.publicMemo,
    })),
  }
}

const STATEMENT_FIELDS = {
  id: true,
  statementNo: true,
  seq: true,
  origin: true,
  periodEnd: true,
  state: true,
  goodsCents: true,
  purchaseCents: true,
  invShareCents: true,
  feeCents: true,
  otherCents: true,
  grossCents: true,
  netCents: true,
  payeeName: true,
  payeeMethod: true,
  payeeAccountMasked: true,
  voucherType: true,
} as const

function stripForList(d: StatementDetailDTO): Omit<StatementDetailDTO, 'lines' | 'payee'> {
  return {
    statementNo: d.statementNo,
    seq: d.seq,
    origin: d.origin,
    periodEnd: d.periodEnd,
    state: d.state,
    goodsCents: d.goodsCents,
    purchaseCents: d.purchaseCents,
    invShareCents: d.invShareCents,
    feeCents: d.feeCents,
    otherCents: d.otherCents,
    grossCents: d.grossCents,
    netCents: d.netCents,
    voucherType: d.voucherType,
    paidAt: d.paidAt,
    tradeNoLast4: d.tradeNoLast4,
    proofUploaded: d.proofUploaded,
  }
}

/** 本渠道结算单列表（新的在前，每页 20） */
export async function statementListForPartner(tenantId: number, page: number): Promise<{ total: number; rows: Omit<StatementDetailDTO, 'lines' | 'payee'>[] }> {
  assertTenantId(tenantId)
  const { skip, take } = pageOf({ page, pageSize: 20 })
  const [total, list] = await Promise.all([
    prisma.tenantStatement.count({ where: { tenantId } }),
    prisma.tenantStatement.findMany({ where: { tenantId }, orderBy: { seq: 'desc' }, skip, take, select: STATEMENT_FIELDS }),
  ])
  const pays = list.length
    ? await prisma.tenantPayout.findMany({ where: { statementId: { in: list.map((s) => s.id) }, tenantId }, select: { statementId: true, paidAt: true, externalTradeNo: true, proofFile: true } })
    : []
  const payOf = new Map(pays.map((p) => [p.statementId, p]))
  return { total, rows: list.map((s) => stripForList(statementToDTO(s, payOf.get(s.id) ?? null, []))) }
}

/** 本渠道一张结算单（含纳入明细、收款人快照的掩码账号）；不是本渠道的按不存在处理 */
export async function statementDetailForPartner(tenantId: number, statementNo: string): Promise<StatementDetailDTO | null> {
  assertTenantId(tenantId)
  const no = typeof statementNo === 'string' ? statementNo.trim().toUpperCase() : ''
  if (!STATEMENT_NO_RE.test(no)) return null
  const s = await prisma.tenantStatement.findFirst({ where: { statementNo: no, tenantId }, select: STATEMENT_FIELDS })
  if (!s) return null
  const payout = await prisma.tenantPayout.findFirst({ where: { statementId: s.id, tenantId }, select: { paidAt: true, externalTradeNo: true, proofFile: true } })
  const lines = await statementLines(s.id)
  const d = statementToDTO(s, payout, lines)
  return { ...stripForList(d), lines: d.lines, payee: { name: d.payee.name, method: d.payee.method, accountMasked: d.payee.accountMasked } }
}

const ORDER_NO_RE = /^[A-Za-z0-9_-]{1,32}$/

/** 按订单号取结算视图（最多 100 个；不是本渠道的单不出现在结果里） */
export async function orderSettlementViewsForPartner(tenantId: number, orderNos: string[]): Promise<Map<string, OrderSettlementView>> {
  assertTenantId(tenantId)
  const out = new Map<string, OrderSettlementView>()
  const nos = Array.from(new Set((orderNos || []).filter((n) => typeof n === 'string' && ORDER_NO_RE.test(n)))).slice(0, 100)
  if (!nos.length) return out
  const orders = await prisma.order.findMany({ where: { orderNo: { in: nos }, tenantId }, select: { id: true, orderNo: true } })
  const views = await getOrderSettlementViews(
    tenantId,
    orders.map((o) => o.id),
  )
  for (const o of orders) {
    const v = views.get(o.id)
    if (!v) continue
    out.set(o.orderNo, {
      orderNo: v.orderNo,
      settleState: v.settleState,
      invShareState: v.invShareState,
      goodsCents: v.goodsCents,
      purchaseCents: v.purchaseCents,
      invShareCents: v.invShareCents,
      feeCents: v.feeCents,
      otherCents: v.otherCents,
      balanceCents: v.balanceCents,
      payoutCents: v.payoutCents,
      releaseEta: v.releaseEta,
      bucket: v.bucket,
      statementNo: v.statementNo,
    })
  }
  return out
}

/** 上一次「申请结算」出单的时间（页面显示「下次可申请」）；没有则 null */
export async function lastRequestAt(tenantId: number): Promise<Date | null> {
  assertTenantId(tenantId)
  const s = await prisma.tenantStatement.findFirst({ where: { tenantId, origin: 'REQUEST' }, orderBy: { id: 'desc' }, select: { createdAt: true } })
  return s?.createdAt ?? null
}

/**
 * 渠道成员回复买家留言后提醒买家（与站长回复相同的邮件，链接按订单 origin）。
 * 只接受内部 orderId：调用方（partner-services 的 partnerPostMessage）已经用 findTenantOrder 按 tenantId 取到了这一单。
 */
export async function notifyBuyerOfReply(orderId: number): Promise<void> {
  await notifyBuyerOfReplyImpl(orderId)
}

/**
 * 渠道自己的企业微信群 webhook：只写不读回。url 为 null 清除；否则必须是企业微信群机器人地址前缀、不超过 300 字符、
 * 不含空白与换行。加密（deriveKey('webhook')，数据密钥 TENANT_DATA_KEY）在这里完成，渠道层不 import crypto。
 * 可选 tx（主会话 D14）：调用方把「保存 + 审计」放进同一事务，审计写不进去时设置一起回滚，不会出现「生效了却没留痕」。
 * 数据密钥未配置时抛 DataKeyMissingError（name='DataKeyMissingError'），调用方转成「未配置数据密钥」提示。
 */
export async function setTenantWebhook(tenantId: number, url: string | null, tx?: Prisma.TransactionClient): Promise<void> {
  assertTenantId(tenantId)
  const db = tx ?? prisma
  if (url === null) {
    await db.tenant.update({ where: { id: tenantId }, data: { wecomWebhookEnc: null } })
    return
  }
  const u = typeof url === 'string' ? url.trim() : ''
  if (!u.startsWith(WECOM_WEBHOOK_PREFIX) || u.length > 300 || /\s/.test(u) || u.length === WECOM_WEBHOOK_PREFIX.length) {
    throw new PartnerFacadeError('BAD_WEBHOOK')
  }
  try {
    new URL(u)
  } catch {
    throw new PartnerFacadeError('BAD_WEBHOOK')
  }
  await db.tenant.update({ where: { id: tenantId }, data: { wecomWebhookEnc: sealText('webhook', u) } })
}

/**
 * 在事务里对本渠道的 tenants 行加排他锁（SELECT … FOR UPDATE），给渠道层做「读—合并—写回」整块 JSON 用（通知偏好）。
 * 放在 facade 而不是渠道层：渠道层禁原生 SQL（边界检查规则 3）；锁定读不建一致性快照，
 * 所以调用方锁之后的第一次普通读读到的是锁等待结束后已提交的最新值。
 */
export async function lockTenantRowForUpdate(tx: Prisma.TransactionClient, tenantId: number): Promise<void> {
  assertTenantId(tenantId)
  await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`
}

/**
 * 接受邀请用：锁定读当前用户的 role（SELECT role … LOCK IN SHARE MODE），用户不存在返回 null。主会话 D13：
 * 后台「提权为 ADMIN」一侧是「FOR UPDATE 锁用户行 → 锁定读该用户全部成员行」；接受邀请若用普通快照读查 role，
 * 看不见对方刚提交的 ADMIN，照样会写入成员行（ADMIN 成为渠道成员，破坏设计 5.2 不变式）。改成锁定读后：
 *  · 提权先拿到 X 锁：这里等它提交，读到的是已提交的 ADMIN → 拒绝；
 *  · 这里先拿到 S 锁：提权等本事务提交，再锁定读成员行时能看到新成员 → 拒绝提权。
 * 两侧都是「users 行 → tenant_members」同一顺序，不会互相死锁。必须在写入 / 启用成员行之前调用。
 */
export async function lockUserRoleShared(tx: Prisma.TransactionClient, userId: number): Promise<string | null> {
  if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error(`[partner-facade] userId 非法：${userId}`)
  const rows = await tx.$queryRaw<{ role: string }[]>`SELECT role FROM users WHERE id = ${userId} LOCK IN SHARE MODE`
  return rows.length ? rows[0].role : null
}
