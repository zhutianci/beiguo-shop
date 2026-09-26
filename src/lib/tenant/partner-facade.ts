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
 *
 * 【二期（docs/多渠道分销-二期改动.md 3.2、4.3、4.4）】渠道层不能 import mail / upload-store / verify-code / crypto（边界检查规则 3），
 * 推送方式、通知邮箱（含验证码）、客服信息、客服二维码的读写都在本文件末尾「二期」一节暴露。
 */
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db'
import { writeAudit } from '../audit'
import { checkContactEmail, checkContactHours, checkContactWechat, changedContactFields, type ContactField, type ContactFieldCheck } from '../contact'
import { sendTenantNoticeEmail, sendVerifyCodeEmail, systemEmailConfigured } from '../mail'
import { rateLimited } from '../news/rate-limit'
import { deleteContactUpload, releaseContactUpload, storeContactQr } from '../upload-store'
import { consumeCode, createCode, tooFrequent } from '../verify-code'
import { tenantOrigin } from '../storefront/origin'
import { computeBalances, computeBalancesWithComposition, getOrderSettlementViews, ledgerWhere, pageOf, statementLines, statementToDTO } from './balances'
import type { LedgerQuery } from './balances'
import { notifyBuyerOfReply as notifyBuyerOfReplyImpl } from './buyer-notify'
import { sealText } from './crypto'
import { WECOM_WEBHOOK_PREFIX } from './notice'
import { generateStatement } from './statement'
import { LEDGER_COMPONENTS, LEDGER_TYPES, TENANT_DEFAULTS } from './types'
import type {
  BalanceComposition,
  GenerateResult,
  LedgerBucket,
  LedgerComponent,
  LedgerRowDTO,
  LedgerType,
  OrderSettlementView,
  PartnerContactDTO,
  PartnerNoticeEmailSaveResult,
  PartnerNoticeTransportDTO,
  StatementDetailDTO,
  TenantBalances,
} from './types'

function assertTenantId(tenantId: unknown): asserts tenantId is number {
  if (typeof tenantId !== 'number' || !Number.isInteger(tenantId) || tenantId < 2) {
    throw new Error(`[partner-facade] tenantId 非法：${String(tenantId)}`)
  }
}

/**
 * 渠道侧输入错误（格式不合规）：调用方转 400。
 * 二期新增：BAD_CONTACT（客服字段不合规，detail 是给用户看的中文提示）、NO_NOTICE_EMAIL（未设通知邮箱就想打开邮箱推送）。
 */
export class PartnerFacadeError extends Error {
  constructor(
    public code: 'BAD_WEBHOOK' | 'BAD_REQUEST_ID' | 'BAD_CONTACT' | 'NO_NOTICE_EMAIL',
    /** 给用户看的提示（BAD_CONTACT / NO_NOTICE_EMAIL 时必有）；不含任何内部信息 */
    public detail?: string,
  ) {
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

// =====================================================================================
// 二期：推送方式、通知邮箱、客服信息、客服二维码（docs/多渠道分销-二期改动.md 3.2、4.3、4.4）
// 所有函数第一个参数是 tenantId（来自 partnerRoute 查库的店面），函数内断言 ≥ 2；权限（OWNER / settings.write、
// 暂停营业只读）由路由层 partnerRoute 负责，这里不重复判断。审计由调用方写（与 setTenantWebhook 同一模式：传 tx 或 audit 回调，
// 保存与审计同事务）。
// =====================================================================================

const HOUR_MS = 3600_000
const DAY_MS = 24 * HOUR_MS
const NOTICE_TRANSPORT_FIELDS = { noticeWecomOn: true, noticeEmailOn: true, noticeEmail: true } as const
const CONTACT_COLS = { supportWechat: true, supportQrUrl: true, supportEmail: true, supportHours: true } as const

/**
 * 推送方式开关（企业微信 / 邮箱，可同时开）。只改传了布尔值的那一项。
 * 打开邮箱推送要求已设通知邮箱：用条件更新（WHERE notice_email IS NOT NULL）一步完成，
 * 与「同时清空邮箱」的并发请求不会出现「开着邮箱推送却没有地址」；不满足抛 PartnerFacadeError('NO_NOTICE_EMAIL')。
 */
export async function setTenantNoticeTransport(
  tenantId: number,
  input: { wecomOn?: boolean; emailOn?: boolean },
  tx?: Prisma.TransactionClient,
): Promise<PartnerNoticeTransportDTO> {
  assertTenantId(tenantId)
  const db = tx ?? prisma
  const data: { noticeWecomOn?: boolean; noticeEmailOn?: boolean } = {}
  if (typeof input?.wecomOn === 'boolean') data.noticeWecomOn = input.wecomOn
  if (typeof input?.emailOn === 'boolean') data.noticeEmailOn = input.emailOn
  if (Object.keys(data).length) {
    const where = data.noticeEmailOn === true ? { id: tenantId, noticeEmail: { not: null } } : { id: tenantId }
    const r = await db.tenant.updateMany({ where, data })
    if (r.count !== 1) {
      if (data.noticeEmailOn === true) throw new PartnerFacadeError('NO_NOTICE_EMAIL', '请先设置并验证通知邮箱，再打开邮箱推送')
      throw new Error(`[partner-facade] 渠道 ${tenantId} 不存在`)
    }
  }
  const t = await db.tenant.findUnique({ where: { id: tenantId }, select: NOTICE_TRANSPORT_FIELDS })
  if (!t) throw new Error(`[partner-facade] 渠道 ${tenantId} 不存在`)
  return { noticeWecomOn: t.noticeWecomOn, noticeEmailOn: t.noticeEmailOn, noticeEmail: t.noticeEmail }
}

const zNoticeEmail = z.string().email().max(120)
/** 通知邮箱归一：trim + 小写；不合规返回 null。**不做禁发词检查**：它是收件人、不进正文，QQ 数字邮箱正是店主最常用的 */
function normalizeNoticeEmail(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const e = v.trim().toLowerCase()
  if (!e || /[<>"'`\s]/.test(e) || !zNoticeEmail.safeParse(e).success) return null
  return e
}

async function loginEmailOf(userId: number): Promise<string | null> {
  if (!Number.isSafeInteger(userId) || userId <= 0) return null
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  return u?.email ? u.email.trim().toLowerCase() : null
}

/**
 * 给「非登录邮箱」发通知邮箱验证码（用途 NOTICE，沿用 verify-code 的 60 秒冷却、10 分钟有效、每码 5 次）。
 *  · 邮箱等于当前操作人的登录邮箱：不发信，返回 { ok:true, needCode:false }（注册时已验证过，直接保存即可）；
 *  · 限频（进程内 + 库兜底）：同一邮箱 60 秒 1 次、每天 5 次；同一渠道每小时 10 次——这个接口会往任意地址发信，
 *    不限死就能被当成垃圾邮件中转，还会和买家的验证码、交易邮件抢同一份阿里云日额度。
 *    每天的桶与登录验证码分开（vcs-ntd），渠道刷不满别人找回密码的额度。
 *  · 信里的链接用渠道 origin（tenantOrigin），不从 Host 拼。
 */
export async function sendTenantNoticeEmailCode(
  tenantId: number,
  userId: number,
  email: string,
): Promise<{ ok: true; needCode: boolean } | { ok: false; reason: 'BAD_EMAIL' | 'TOO_FREQUENT' | 'MAIL_UNCONFIGURED' | 'SEND_FAILED' }> {
  assertTenantId(tenantId)
  const e = normalizeNoticeEmail(email)
  if (!e) return { ok: false, reason: 'BAD_EMAIL' }
  if ((await loginEmailOf(userId)) === e) return { ok: true, needCode: false }
  if (!systemEmailConfigured()) return { ok: false, reason: 'MAIL_UNCONFIGURED' }
  if (
    rateLimited(`vcs-ntt:${tenantId}`, { windowMs: HOUR_MS, max: 10 }) ||
    rateLimited(`vcs-mail:NOTICE:${e}`, { windowMs: 60_000, max: 1 }) ||
    rateLimited(`vcs-ntd:${e}`, { windowMs: DAY_MS, max: 5 })
  ) {
    return { ok: false, reason: 'TOO_FREQUENT' }
  }
  if (await tooFrequent(e, 'NOTICE')) return { ok: false, reason: 'TOO_FREQUENT' }
  const code = await createCode(e, 'NOTICE')
  const r = await sendVerifyCodeEmail(e, code, 'NOTICE', { origin: await tenantOrigin(tenantId) })
  if (!r.ok) {
    console.error('[partner-facade] 通知邮箱验证码发送失败', tenantId, r.detail)
    return { ok: false, reason: 'SEND_FAILED' }
  }
  return { ok: true, needCode: true }
}

/**
 * 保存 / 清除通知邮箱（二期改动 3.2「设置时验证归属」）。
 *  · email = null：清空地址，同时关掉邮箱推送（没有地址的开关没有意义，也免得通知通道拿 null 去发信）；
 *  · 等于当前操作人的登录邮箱：直接保存；
 *  · 否则必须带 NOTICE 验证码：没带 → NEED_CODE；错 → BAD_CODE；这张码错太多次 → TOO_MANY（需重新获取）。
 * 验证码消费在保存之前（consumeCode 是 CAS，并发双提交只有一个 OK）；传 tx 时保存与调用方的审计同事务。
 */
export async function setTenantNoticeEmail(
  tenantId: number,
  userId: number,
  email: string | null,
  code?: string | null,
  tx?: Prisma.TransactionClient,
): Promise<PartnerNoticeEmailSaveResult> {
  assertTenantId(tenantId)
  const db = tx ?? prisma
  if (email === null) {
    await db.tenant.update({ where: { id: tenantId }, data: { noticeEmail: null, noticeEmailOn: false } })
    return { ok: true, noticeEmail: null }
  }
  const e = normalizeNoticeEmail(email)
  if (!e) return { ok: false, reason: 'BAD_EMAIL' }
  if ((await loginEmailOf(userId)) !== e) {
    const c = typeof code === 'string' ? code.trim() : ''
    if (!c) return { ok: false, reason: 'NEED_CODE' }
    if (!/^\d{6}$/.test(c)) return { ok: false, reason: 'BAD_CODE' }
    const r = await consumeCode(e, 'NOTICE', c)
    if (r === 'TOO_MANY') return { ok: false, reason: 'TOO_MANY' }
    if (r !== 'OK') return { ok: false, reason: 'BAD_CODE' }
  }
  await db.tenant.update({ where: { id: tenantId }, data: { noticeEmail: e } })
  return { ok: true, noticeEmail: e }
}

/**
 * 邮箱推送「发送测试」：直接发一封测试信到 Tenant.noticeEmail（同步，结果当场告诉店主），不写站内通知、不走企业微信。
 * 未打开邮箱推送也可以测（先测通再打开）。文案不含「微信」（禁发词，二期改动 3.2）。每渠道每小时 5 次（路由另有限频）。
 */
export async function sendTenantNoticeTestEmail(
  tenantId: number,
): Promise<{ ok: true } | { ok: false; reason: 'NO_NOTICE_EMAIL' | 'MAIL_UNCONFIGURED' | 'TOO_FREQUENT' | 'SEND_FAILED' }> {
  assertTenantId(tenantId)
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { noticeEmail: true } })
  const to = normalizeNoticeEmail(t?.noticeEmail)
  if (!t || !to) return { ok: false, reason: 'NO_NOTICE_EMAIL' }
  if (!systemEmailConfigured()) return { ok: false, reason: 'MAIL_UNCONFIGURED' }
  if (rateLimited(`ntest-mail:${tenantId}`, { windowMs: HOUR_MS, max: 5 })) return { ok: false, reason: 'TOO_FREQUENT' }
  const r = await sendTenantNoticeEmail(
    to,
    { kind: 'TEST', title: '邮件推送测试', body: '这是一条测试消息：收到即表示店铺后台的通知可以推送到本邮箱。', path: '/partner/settings' },
    { origin: await tenantOrigin(tenantId) },
  )
  if (!r.ok) {
    console.error('[partner-facade] 通知测试邮件发送失败', tenantId, r.detail)
    return { ok: false, reason: 'SEND_FAILED' }
  }
  return { ok: true }
}

function contactDTO(t: { supportWechat: string | null; supportQrUrl: string | null; supportEmail: string | null; supportHours: string | null }): PartnerContactDTO {
  return { supportWechat: t.supportWechat, supportQrUrl: t.supportQrUrl, supportEmail: t.supportEmail, supportHours: t.supportHours }
}

/**
 * 客服信息：微信号或昵称、客服邮箱、服务时间（二维码只走 saveTenantContactQr / clearTenantContactQr，这里不收 URL）。
 * 每项缺省（undefined）= 不改；null / 空串 = 清空；不合规抛 PartnerFacadeError('BAD_CONTACT', 中文提示)。
 * 返回写入后的原值与「哪些字段变了」（审计 settings.contact 的 publicDiff 只写字段名）。
 * 传 tx：行锁 + 读 + 写都在调用方事务里，调用方在同一事务写审计；不传：自己开事务。
 */
export async function setTenantContact(
  tenantId: number,
  input: { wechat?: unknown; email?: unknown; hours?: unknown },
  tx?: Prisma.TransactionClient,
): Promise<{ contact: PartnerContactDTO; changed: ContactField[] }> {
  assertTenantId(tenantId)
  const data: { supportWechat?: string | null; supportEmail?: string | null; supportHours?: string | null } = {}
  const pairs: ['supportWechat' | 'supportEmail' | 'supportHours', unknown, (v: unknown) => ContactFieldCheck][] = [
    ['supportWechat', input?.wechat, checkContactWechat],
    ['supportEmail', input?.email, checkContactEmail],
    ['supportHours', input?.hours, checkContactHours],
  ]
  for (const [col, v, check] of pairs) {
    if (v === undefined) continue
    const r = check(v)
    if (!r.ok) throw new PartnerFacadeError('BAD_CONTACT', r.error)
    data[col] = r.value
  }
  const run = async (db: Prisma.TransactionClient) => {
    await lockTenantRowForUpdate(db, tenantId)
    const before = await db.tenant.findUnique({ where: { id: tenantId }, select: CONTACT_COLS })
    if (!before) throw new Error(`[partner-facade] 渠道 ${tenantId} 不存在`)
    if (Object.keys(data).length) await db.tenant.update({ where: { id: tenantId }, data })
    const after = { ...before, ...data }
    return { contact: contactDTO(after), changed: changedContactFields(before, after) }
  }
  return tx ? run(tx) : prisma.$transaction(run)
}

export type ContactQrSaveResult =
  | { ok: true; supportQrUrl: string }
  | { ok: false; reason: 'TOO_FREQUENT' | 'TOO_LARGE' | 'BAD_TYPE' | 'NO_SPACE' }

/**
 * 上传客服二维码（渠道 POST /api/partner/settings/contact-qr；multipart 由 handler 解析成 Buffer 传进来）。
 *  · 每个渠道每小时 10 次（进程内计数，二期改动 4.4）；
 *  · ≤ 2MB、按文件头只收 png / jpg / webp（upload-store 的 storeContactQr；gif / SVG 拒绝）；文件名服务端随机生成；
 *  · 行锁内读出旧地址、写新地址、调 audit(tx)（调用方写 settings.contact 审计，同事务）；事务失败 → 删掉刚落盘的新文件；
 *  · 提交后删除旧文件：只删 contact/ 下、且是库里（锁内）读出来的那个文件名（deleteContactUpload 再校验一遍格式与目录）；
 *    并且只在**没有任何渠道还引用它**时才删（releaseContactUpload）：超管可能把同一地址填给了别的渠道，不能删掉别站的二维码。
 * 失败原因：TOO_FREQUENT → 429；TOO_LARGE / BAD_TYPE → 400；NO_SPACE → 507。
 */
export async function saveTenantContactQr(
  tenantId: number,
  bytes: Buffer,
  audit?: (tx: Prisma.TransactionClient) => Promise<void>,
): Promise<ContactQrSaveResult> {
  assertTenantId(tenantId)
  if (rateLimited(`contactqr:${tenantId}`, { windowMs: HOUR_MS, max: 10 })) return { ok: false, reason: 'TOO_FREQUENT' }
  const stored = await storeContactQr(bytes)
  if (!stored.ok) return { ok: false, reason: stored.reason === 'size' ? 'TOO_LARGE' : stored.reason === 'type' ? 'BAD_TYPE' : 'NO_SPACE' }
  const newUrl = stored.url
  let old: string | null = null
  try {
    old = await prisma.$transaction(async (tx) => {
      await lockTenantRowForUpdate(tx, tenantId)
      const t = await tx.tenant.findUnique({ where: { id: tenantId }, select: { supportQrUrl: true } })
      if (!t) throw new Error(`[partner-facade] 渠道 ${tenantId} 不存在`)
      await tx.tenant.update({ where: { id: tenantId }, data: { supportQrUrl: newUrl } })
      if (audit) await audit(tx)
      return t.supportQrUrl
    })
  } catch (e) {
    // 没写进库（或审计失败回滚）：刚落盘的新文件没人引用，删掉
    await deleteContactUpload(newUrl)
    throw e
  }
  // 新文件是刚随机生成的，事务失败时不可能有人引用，上面直接删；旧文件可能被别的渠道共用，走引用计数
  // 事务已提交、新地址已生效：删旧图（查引用 + unlink）失败只记日志，不能让接口回 500 让店主以为没保存成功
  if (old && old !== newUrl) await releaseContactUpload(old).catch((e) => console.error('[contact-qr] 删除旧二维码失败（新地址已生效）', e))
  return { ok: true, supportQrUrl: newUrl }
}

/**
 * 清除客服二维码（渠道 DELETE /api/partner/settings/contact-qr）。原来就没有 → { cleared:false }（不调 audit）。
 * 行锁内读旧值、置空、audit(tx)；提交后删旧文件（同 saveTenantContactQr 的删除边界）。
 */
export async function clearTenantContactQr(tenantId: number, audit?: (tx: Prisma.TransactionClient) => Promise<void>): Promise<{ cleared: boolean }> {
  assertTenantId(tenantId)
  const old = await prisma.$transaction(async (tx) => {
    await lockTenantRowForUpdate(tx, tenantId)
    const t = await tx.tenant.findUnique({ where: { id: tenantId }, select: { supportQrUrl: true } })
    if (!t) throw new Error(`[partner-facade] 渠道 ${tenantId} 不存在`)
    if (!t.supportQrUrl) return null
    await tx.tenant.update({ where: { id: tenantId }, data: { supportQrUrl: null } })
    if (audit) await audit(tx)
    return t.supportQrUrl
  })
  if (!old) return { cleared: false }
  await releaseContactUpload(old).catch((e) => console.error('[contact-qr] 删除旧二维码失败（已清除）', e))
  return { cleared: true }
}
