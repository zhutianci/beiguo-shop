/**
 * 超管：渠道管理（WP5，设计 5.1、5.2、6.7、12.2）。渠道 CRUD 与状态机、域名、成员与邀请、收款信息、运营概览、审计查询，
 * 以及 /api/admin/tenants/** 与 /api/admin/statements/** 共用的路由小工具。
 *
 * 【只给超管】本文件可以读成本、收款账号密文、审计原始 diff——渠道层（partner-services / handlers）绝不能 import 它
 * （边界检查规则 3 的禁止清单里有 admin-tenants）。
 *
 * 【每一处写操作都写审计，且 publicDiff 按设计 5.8 的 action 白名单显式构造】平台对某渠道的操作以 tenantId=该渠道 写审计，
 * 渠道在「操作日志」里只看得到 publicDiff：
 *   tenant.rates        → 只含变更了的 feeRateBp / invoiceShareRateBp / holdDays / minPayoutCents / requestIntervalDays 新旧值
 *   tenant.payout_hold  → { payoutHold }（**不含原因**：payoutHoldReason 只给超管，S20）
 *   tenant.status       → { from, to }
 *   其余（tenant.create / tenant.config / tenant.domain / tenant.payee / member.*）→ 不写 publicDiff（渠道只看到「平台做了某操作」）
 *
 * 【并发】改渠道配置、停用成员都先 `SELECT … FROM tenants WHERE id = ? FOR UPDATE` 锁渠道行：
 *  · 与出结算单（statement.generateStatement 同样先锁这一行）串行：出单读到的 payoutHold / 收款信息不会是半截状态；
 *  · 「不允许零 OWNER」「→TERMINATED 要求无未付单」这类先查后写的规则在锁内判定，两个管理员同时操作不会双双通过。
 *
 * 【Q1–Q22 未拍板项】新渠道默认值取 TENANT_DEFAULTS（types.ts，一处可改）；状态迁移表、各参数上下限集中在本文件顶部常量。
 */
import { createHash, randomBytes } from 'crypto'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import type { ZodType } from 'zod'
import { prisma } from '../db'
import { writeAudit } from '../audit'
import { getCurrentUser } from '../auth'
import { toCents } from '../money'
import { maskEmail } from '../mask'
import { invalidateStorefrontCache } from '../storefront/resolve'
import { channelHostSuffix, isChannelCandidateHost, normalizeHost, platformHosts } from '../storefront/hosts'
import { computeBalances, listLedgerAdmin, statementDetailAdmin, type LedgerQuery } from './balances'
import { sendTenantInviteMail, TENANT_INVITE_HOURS } from './buyer-notify'
import { openText, sealText } from './crypto'
import { linkedInvoicesByOrder } from './ledger'
import { emitTenantNotice } from './notice'
import { alertPlatform } from './platform-alert'
import { runReconcile, type ReconcileItem } from './reconcile'
import { LIMITS, TENANT_DEFAULTS, type TenantBalances, type TenantOverviewRow, type TenantStatus } from './types'

type Tx = Prisma.TransactionClient

// =====================================================================================
// 路由小工具（/api/admin/tenants/**、/api/admin/statements/** 共用）
// =====================================================================================

/** 业务校验失败：status 直接作为 HTTP 状态码（400 参数 / 404 不存在 / 409 状态冲突） */
export class TenantAdminError extends Error {
  constructor(
    public status: 400 | 404 | 409 | 429 | 503,
    message: string,
    public code?: string,
  ) {
    super(message)
  }
}

/**
 * 当前管理员的 userId。路由里在 `adminGuard()` 放行之后调用（adminGuard 已经做了主站店面、同源、查库复核角色），
 * 这里只是把 id 取出来写审计与 operatorId；万一此刻角色被降级（两次查库之间），按 403 处理。
 */
export async function currentAdminId(): Promise<number> {
  const u = await getCurrentUser()
  if (!u || u.role !== 'ADMIN') throw new TenantAdminError(409, '管理员身份已失效，请重新登录')
  return u.id
}

/** 统一出错映射：业务错误按其状态码；其余记日志后 500（不把内部异常原文回给前端） */
export function adminFail(e: unknown, tag: string): Response {
  if (e instanceof TenantAdminError) {
    return NextResponse.json({ success: false, error: e.message, ...(e.code ? { reason: e.code } : {}) }, { status: e.status })
  }
  console.error(`[admin-tenants] ${tag} 失败`, e)
  return NextResponse.json({ success: false, error: '操作失败，请稍后重试' }, { status: 500 })
}

const MAX_JSON_BYTES = 256 * 1024

/** 解析 JSON 请求体并按 zod 校验；失败返回 400 Response（调用方 `if (b instanceof Response) return b`） */
export async function readJson<T>(req: Request, schema: ZodType<T>): Promise<T | Response> {
  const bad = (m: string) => NextResponse.json({ success: false, error: m }, { status: 400 })
  const len = Number(req.headers.get('content-length') || '0')
  if (len > MAX_JSON_BYTES) return bad('请求体过大')
  let raw: unknown
  try {
    const text = await req.text()
    if (text.length > MAX_JSON_BYTES) return bad('请求体过大')
    raw = text ? JSON.parse(text) : {}
  } catch {
    return bad('请求体不是合法 JSON')
  }
  const r = schema.safeParse(raw)
  if (!r.success) {
    const first = r.error.issues[0]
    const where = first?.path?.length ? `${first.path.join('.')}：` : ''
    return bad(`参数不正确（${where}${first?.message ?? '格式错误'}）`)
  }
  return r.data
}

/** URL 里的自增 id（超管侧可以用内部 id）：正整数，否则 null */
export function parseIdParam(raw: string | undefined | null): number | null {
  if (!raw || !/^\d{1,10}$/.test(raw)) return null
  const n = Number(raw)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

// =====================================================================================
// 常量：状态机与参数范围（Q 未拍板项集中在这里，可改）
// =====================================================================================

/**
 * 状态迁移表（设计 6.7、实施分包 8.4）：DRAFT → ACTIVE → SUSPENDED ⇄ ACTIVE → TERMINATED。
 *  · 建议先 SUSPENDED 一个售后期再 TERMINATED（设计 6.7），但不强制：ACTIVE 直接终止也允许（主会话 D7），
 *    前置条件仍然全部要满足，且终止仍走结清流程——无未完结结算单、各余额为 0（或站长显式 forceUnsettled），见 updateTenant；
 *  · DRAFT 可以直接 TERMINATED（开通到一半放弃合作）；
 *  · TERMINATED 是终态：订单、账本、审计永不删除，买家订单入口照常（不能回到 ACTIVE，W5-5）。
 */
export const TENANT_TRANSITIONS: Readonly<Record<TenantStatus, readonly TenantStatus[]>> = Object.freeze({
  DRAFT: ['ACTIVE', 'TERMINATED'],
  ACTIVE: ['SUSPENDED', 'TERMINATED'],
  SUSPENDED: ['ACTIVE', 'TERMINATED'],
  TERMINATED: [],
})

export const TENANT_STATUS_LABEL: Readonly<Record<TenantStatus, string>> = Object.freeze({
  DRAFT: '筹备中',
  ACTIVE: '营业中',
  SUSPENDED: '暂停营业',
  TERMINATED: '已停业',
})

/** 参数范围（费率上限与下单快照断言共用 LIMITS；其余是超管录入的护栏） */
export const TENANT_RANGES = Object.freeze({
  holdDays: [0, 90],
  minPayoutCents: [0, 10_000_000],
  requestIntervalDays: [0, 90],
  pendingOrderCap: [1, 1000],
  maxOrderQty: [1, 999],
  previewUsersMax: 20,
} as const)

const RESERVED_CODES = new Set(['main', 'www', 'app', 'api', 'admin', 'partner', 'mail', 'static', 'cdn', 'img', 'assets', 'test', 'dev', 'localhost', 'bigolab', 'view'])
const CODE_RE = /^[a-z][a-z0-9-]{0,18}[a-z0-9]$/
const PARTY_TYPES = new Set(['COMPANY', 'INDIVIDUAL_BIZ', 'PERSON'])
const PAYEE_METHODS = new Set(['ALIPAY', 'BANK', 'WECHAT'])
const RATE_KEYS = ['feeRateBp', 'invoiceShareRateBp', 'holdDays', 'minPayoutCents', 'requestIntervalDays'] as const

function isP2002(e: unknown, field?: string): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') return false
  if (!field) return true
  const target = (e.meta as { target?: unknown } | undefined)?.target
  const t = Array.isArray(target) ? target.join(',') : String(target ?? '')
  return t.includes(field)
}

function intIn(name: string, v: number, lo: number, hi: number): void {
  if (!Number.isSafeInteger(v) || v < lo || v > hi) throw new TenantAdminError(400, `${name} 必须是 ${lo}–${hi} 之间的整数`)
}

/** tenant.config 审计里渠道可见的配置项（设计 5.8，D16）：previewUserIds、payoutHoldReason 不在其中 */
const CONFIG_PUBLIC_KEYS: ReadonlySet<string> = new Set(['name', 'pendingOrderCap', 'maxOrderQty', 'partyType', 'legalName', 'requirePartnerInvoice'])

async function lockTenantRow(tx: Tx, id: number): Promise<void> {
  const rows = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM tenants WHERE id = ${id} FOR UPDATE`
  if (!rows.length) throw new TenantAdminError(404, '渠道不存在')
}

async function channelOr404(db: Tx | typeof prisma, id: number) {
  if (!Number.isInteger(id) || id < 2) throw new TenantAdminError(404, '渠道不存在')
  const t = await db.tenant.findUnique({ where: { id } })
  if (!t || t.kind !== 'CHANNEL') throw new TenantAdminError(404, '渠道不存在')
  return t
}

/** 渠道 origin：只接受 https://<一级子域>.bigolab.com（与店面解析的候选口径同一份，storefront/hosts） */
export function normalizeChannelOrigin(raw: string): { origin: string; host: string } {
  let u: URL
  try {
    u = new URL(String(raw ?? '').trim())
  } catch {
    throw new TenantAdminError(400, `站点地址格式不对，应形如 https://lulu${channelHostSuffix()}`)
  }
  if (u.protocol !== 'https:') throw new TenantAdminError(400, '站点地址必须是 https')
  if ((u.pathname && u.pathname !== '/') || u.search || u.hash || u.username || u.password || u.port) {
    throw new TenantAdminError(400, '站点地址只填协议与域名，不带路径、参数与端口')
  }
  const host = assertChannelHost(u.host)
  return { origin: `https://${host}`, host }
}

/** 渠道域名校验：拒绝主站域名、非 *.bigolab.com、多级子域（W5-1） */
export function assertChannelHost(raw: string): string {
  const host = normalizeHost(raw)
  if (!host) throw new TenantAdminError(400, '域名格式不对')
  const root = channelHostSuffix().slice(1)
  if (platformHosts().has(host) || host === root) throw new TenantAdminError(400, '不能使用主站域名')
  if (!isChannelCandidateHost(host)) throw new TenantAdminError(400, `只允许 *${channelHostSuffix()} 的一级子域名`)
  const sub = host.slice(0, -channelHostSuffix().length)
  if (RESERVED_CODES.has(sub)) throw new TenantAdminError(400, `子域名 ${sub} 是保留名`)
  return host
}

// =====================================================================================
// 渠道 CRUD
// =====================================================================================

export async function createTenant(
  a: { code: string; name: string; origin: string; feeRateBp?: number; invoiceShareRateBp?: number; holdDays?: number },
  adminId: number,
): Promise<{ id: number }> {
  const code = String(a.code ?? '').trim().toLowerCase()
  if (!CODE_RE.test(code) || code.includes('--')) throw new TenantAdminError(400, '渠道代号只能用小写字母、数字与连字符，2–20 位，字母开头')
  if (RESERVED_CODES.has(code)) throw new TenantAdminError(400, `代号 ${code} 是保留名`)
  const name = String(a.name ?? '').trim()
  if (!name || name.length > 50) throw new TenantAdminError(400, '内部名称必填，最多 50 字')
  const { origin, host } = normalizeChannelOrigin(a.origin)
  const feeRateBp = a.feeRateBp ?? TENANT_DEFAULTS.feeRateBp
  const invoiceShareRateBp = a.invoiceShareRateBp ?? TENANT_DEFAULTS.invoiceShareRateBp
  // Q5：新渠道首月冻结期 15 天，首月过后由超管改为 7（只影响之后的新订单）
  const holdDays = a.holdDays ?? TENANT_DEFAULTS.holdDaysFirstMonth
  intIn('手续费率', feeRateBp, 0, LIMITS.maxFeeBp)
  intIn('发票分成率', invoiceShareRateBp, 0, LIMITS.maxInvShareBp)
  intIn('冻结期', holdDays, TENANT_RANGES.holdDays[0], TENANT_RANGES.holdDays[1])

  try {
    return await prisma.$transaction(async (tx) => {
      // 先查一遍给出明确提示；并发下两个请求同时通过这里，由唯一约束兜底（下面的 P2002 映射）
      if (await tx.tenant.findUnique({ where: { code }, select: { id: true } })) throw new TenantAdminError(409, '渠道代号已存在')
      if (await tx.tenantDomain.findUnique({ where: { host }, select: { id: true } })) throw new TenantAdminError(409, '该域名已被其他渠道使用')
      const t = await tx.tenant.create({
        data: {
          code,
          kind: 'CHANNEL',
          name,
          status: 'DRAFT',
          origin,
          feeRateBp,
          invoiceShareRateBp,
          holdDays,
          minPayoutCents: TENANT_DEFAULTS.minPayoutCents,
          requestIntervalDays: TENANT_DEFAULTS.requestIntervalDays,
          pendingOrderCap: TENANT_DEFAULTS.pendingOrderCap,
          maxOrderQty: TENANT_DEFAULTS.maxOrderQty,
          requirePartnerInvoice: true,
        },
        select: { id: true },
      })
      // origin 的主机名同时登记为主域名：店面解析按 tenant_domains 查，不登记等于这个站打不开
      await tx.tenantDomain.create({ data: { tenantId: t.id, host, isPrimary: true, status: 1 } })
      await writeAudit(tx, {
        actorUserId: adminId,
        actorKind: 'PLATFORM',
        tenantId: t.id,
        action: 'tenant.create',
        targetType: 'tenant',
        targetId: code,
        diff: { code, name, origin, feeRateBp, invoiceShareRateBp, holdDays, status: 'DRAFT' },
      })
      return { id: t.id }
    })
  } catch (e) {
    if (isP2002(e, 'code')) throw new TenantAdminError(409, '渠道代号已存在')
    if (isP2002(e, 'host')) throw new TenantAdminError(409, '该域名已被其他渠道使用')
    throw e
  } finally {
    invalidateStorefrontCache()
  }
}

export interface TenantPatch {
  status: TenantStatus
  name: string
  feeRateBp: number
  invoiceShareRateBp: number
  holdDays: number
  minPayoutCents: number
  requestIntervalDays: number
  payoutHold: boolean
  payoutHoldReason: string | null
  pendingOrderCap: number
  maxOrderQty: number
  partyType: string
  legalName: string
  requirePartnerInvoice: boolean
  previewUserIds: number[]
  /** 不是配置项：只配合 status=TERMINATED，余额未结清时站长确认后仍强制停业（写进 tenant.status 审计的 diff） */
  forceUnsettled: boolean
}

function samePreview(a: unknown, b: number[]): boolean {
  const x = Array.isArray(a) ? (a as unknown[]).filter((v): v is number => typeof v === 'number').sort((p, q) => p - q) : []
  const y = [...b].sort((p, q) => p - q)
  return x.length === y.length && x.every((v, i) => v === y[i])
}

/**
 * 改渠道配置 / 状态。一个事务：锁渠道行 → 逐项校验 → 更新 → 分 action 写审计（publicDiff 见文件头）→ 状态变更通知渠道。
 * 提交后 invalidateStorefrontCache()：域名缓存清掉；状态本来就每次请求查库，改完下一次请求生效（W5-5）。
 */
export async function updateTenant(id: number, patch: Partial<TenantPatch>, adminId: number): Promise<{ changed: string[] }> {
  const p = patch ?? {}
  if (p.feeRateBp !== undefined) intIn('手续费率', p.feeRateBp, 0, LIMITS.maxFeeBp)
  if (p.invoiceShareRateBp !== undefined) intIn('发票分成率', p.invoiceShareRateBp, 0, LIMITS.maxInvShareBp)
  if (p.holdDays !== undefined) intIn('冻结期', p.holdDays, ...TENANT_RANGES.holdDays)
  if (p.minPayoutCents !== undefined) intIn('最低结算额', p.minPayoutCents, ...TENANT_RANGES.minPayoutCents)
  if (p.requestIntervalDays !== undefined) intIn('申请结算间隔', p.requestIntervalDays, ...TENANT_RANGES.requestIntervalDays)
  if (p.pendingOrderCap !== undefined) intIn('未付订单上限', p.pendingOrderCap, ...TENANT_RANGES.pendingOrderCap)
  if (p.maxOrderQty !== undefined) intIn('单笔数量上限', p.maxOrderQty, ...TENANT_RANGES.maxOrderQty)
  if (p.name !== undefined && (!p.name.trim() || p.name.trim().length > 50)) throw new TenantAdminError(400, '内部名称必填，最多 50 字')
  if (p.partyType !== undefined && !PARTY_TYPES.has(p.partyType)) throw new TenantAdminError(400, '主体类型只能是 公司 / 个体户 / 个人')
  if (p.legalName !== undefined && p.legalName.length > 100) throw new TenantAdminError(400, '主体名称最多 100 字')
  if (p.payoutHoldReason !== undefined && p.payoutHoldReason !== null && p.payoutHoldReason.length > 200) throw new TenantAdminError(400, '暂停打款原因最多 200 字')
  if (p.previewUserIds !== undefined) {
    if (!Array.isArray(p.previewUserIds) || p.previewUserIds.length > TENANT_RANGES.previewUsersMax || p.previewUserIds.some((v) => !Number.isSafeInteger(v) || v <= 0)) {
      throw new TenantAdminError(400, `预览账号最多 ${TENANT_RANGES.previewUsersMax} 个用户 id`)
    }
  }

  let notice: { tenantId: number; from: string; to: string } | null = null
  let unsettledAtTerminate: Record<string, number> | null = null
  const changed: string[] = []
  await prisma.$transaction(
    async (tx) => {
      await lockTenantRow(tx, id)
      const t = await channelOr404(tx, id)
      const data: Prisma.TenantUpdateInput = {}
      const before = t as unknown as Record<string, unknown>

      // —— 状态机 ——
      if (p.status !== undefined && p.status !== t.status) {
        const from = t.status as TenantStatus
        const allowed = TENANT_TRANSITIONS[from] ?? []
        if (!allowed.includes(p.status)) {
          throw new TenantAdminError(409, `不能从「${TENANT_STATUS_LABEL[from] ?? from}」改为「${TENANT_STATUS_LABEL[p.status] ?? p.status}」`)
        }
        if (p.status === 'ACTIVE') {
          // 设计 5.2 不变式：ACTIVE 渠道至少一个有效 OWNER（A3）
          const owners = await tx.tenantMember.count({ where: { tenantId: id, role: 'OWNER', status: 1 } })
          if (owners === 0) throw new TenantAdminError(409, '开业前至少要有一位已接受邀请的渠道主（OWNER）')
        }
        if (p.status === 'TERMINATED') {
          // 设计 6.7：终止前不能有未付款订单（收银台还能付）、不能有待处理售后申请
          const unpaid = await tx.order.count({ where: { tenantId: id, payStatus: 'UNPAID', deliveryStatus: { not: 'CANCELLED' } } })
          if (unpaid > 0) throw new TenantAdminError(409, `该渠道还有 ${unpaid} 张未付款订单，请先取消或等其付款`)
          const pendingAs = await tx.tenantAfterSale.count({ where: { tenantId: id, status: 'PENDING' } })
          if (pendingAs > 0) throw new TenantAdminError(409, `该渠道还有 ${pendingAs} 个待处理售后申请`)
          // 终止仍走结清流程（主会话 D7、设计 6.7「最后一期结算」）：渠道停业后登录不了 /partner、看不到最后一期对账，
          // 所以结清必须由状态机把关，而不是靠站长记得。
          //  · 未完结的结算单（GENERATED / CONFIRMED / PAYING，openKey 非空）一律拦：打款或退回之后才能停业；
          //    出单同样先锁渠道行（statement.generateStatement），与这里串行，不会「刚判完就出了一张单」。
          //  · 可结算 / 冻结中 / 结算中 / 保证金不为 0：默认拦（先出最后一期 MANUAL 结算单并打款、回款、保证金抵扣或退还、核销）；
          //    站长看过明细仍要终止（例如渠道失联、余额留待线下处理）→ 显式 forceUnsettled=true，余额快照写进审计 diff。
          const open = await tx.tenantStatement.findFirst({ where: { openKey: id }, select: { statementNo: true, state: true } })
          if (open) throw new TenantAdminError(409, `该渠道还有未完结的结算单 ${open.statementNo}（${open.state}），请先完成打款或退回`, 'OPEN_STATEMENT')
          const b = await computeBalances(id)
          // 判的是「预计打款」（Σ U，含手续费分录；设计 10.8），不是「余额」：真正欠渠道 / 渠道欠平台的是下一张结算单的 netCents。
          // 只看余额会漏掉「余额恰好 0、手续费分录没冲平」（渠道还被欠几毛也能直接终止、审计无快照），
          // 也会误拦「余额非 0 但预计打款为 0」（终审账本 #4）
          const rest: [string, number][] = [
            ['可结算（预计打款）', b.available.payoutCents],
            ['冻结中（预计打款）', b.pending.payoutCents],
            ['结算中', b.inPayoutCents],
            ['保证金', b.depositCents],
          ]
          const nonzero = rest.filter(([, c]) => c !== 0)
          if (nonzero.length) {
            const text = nonzero.map(([k, c]) => `${k} ${(c / 100).toFixed(2)} 元`).join('、')
            if (p.forceUnsettled !== true) {
              throw new TenantAdminError(
                409,
                `该渠道还有未结清的款项：${text}。请先出最后一期（手动）结算单并打款，负余额请回款或用保证金抵扣，保证金请退还或抵扣，冻结中的等解冻后再出单`,
                'UNSETTLED',
              )
            }
            unsettledAtTerminate = Object.fromEntries(rest)
          }
        }
        data.status = p.status
        changed.push('status')
      }

      // —— 结算参数（只影响之后的新订单：下单时快照）——
      const rateDiff: Record<string, { from: unknown; to: unknown }> = {}
      for (const k of RATE_KEYS) {
        const v = p[k]
        if (v !== undefined && v !== before[k]) {
          rateDiff[k] = { from: before[k], to: v }
          ;(data as Record<string, unknown>)[k] = v
        }
      }
      if (Object.keys(rateDiff).length) changed.push('rates')

      // —— payoutHold ——
      const holdChanged = p.payoutHold !== undefined && p.payoutHold !== t.payoutHold
      const reasonChanged = p.payoutHoldReason !== undefined && (p.payoutHoldReason ?? null) !== (t.payoutHoldReason ?? null)
      if (holdChanged) data.payoutHold = p.payoutHold
      if (reasonChanged) data.payoutHoldReason = p.payoutHoldReason ? p.payoutHoldReason.trim() : null
      if (holdChanged) changed.push('payoutHold')

      // —— 其余配置 ——
      const cfgDiff: Record<string, { from: unknown; to: unknown }> = {}
      const setCfg = (k: string, v: unknown) => {
        cfgDiff[k] = { from: before[k], to: v }
        ;(data as Record<string, unknown>)[k] = v
      }
      if (p.name !== undefined && p.name.trim() !== t.name) setCfg('name', p.name.trim())
      if (p.pendingOrderCap !== undefined && p.pendingOrderCap !== t.pendingOrderCap) setCfg('pendingOrderCap', p.pendingOrderCap)
      if (p.maxOrderQty !== undefined && p.maxOrderQty !== t.maxOrderQty) setCfg('maxOrderQty', p.maxOrderQty)
      if (p.partyType !== undefined && p.partyType !== t.partyType) setCfg('partyType', p.partyType)
      if (p.legalName !== undefined && (p.legalName.trim() || null) !== t.legalName) setCfg('legalName', p.legalName.trim() || null)
      if (p.requirePartnerInvoice !== undefined && p.requirePartnerInvoice !== t.requirePartnerInvoice) setCfg('requirePartnerInvoice', p.requirePartnerInvoice)
      if (p.previewUserIds !== undefined && !samePreview(t.previewUserIds, p.previewUserIds)) {
        const ids = Array.from(new Set(p.previewUserIds))
        if (ids.length) {
          const users = await tx.user.findMany({ where: { id: { in: ids } }, select: { id: true, role: true } })
          if (users.length !== ids.length) throw new TenantAdminError(400, '预览账号里有不存在的用户 id')
          if (users.some((u) => u.role === 'ADMIN')) throw new TenantAdminError(400, '超管账号不能作为渠道站的预览账号（渠道站拒绝超管登录）')
        }
        setCfg('previewUserIds', ids)
      }
      if (reasonChanged && !holdChanged) cfgDiff.payoutHoldReason = { from: t.payoutHoldReason, to: data.payoutHoldReason ?? null }
      if (Object.keys(cfgDiff).length) changed.push('config')

      if (!Object.keys(data).length) return
      await tx.tenant.update({ where: { id }, data })

      const base = { actorUserId: adminId, actorKind: 'PLATFORM' as const, tenantId: id, targetType: 'tenant', targetId: t.code }
      if (data.status !== undefined) {
        await writeAudit(tx, {
          ...base,
          action: 'tenant.status',
          // 强制停业时把当时未结清的余额（分）记进 diff（仅超管可见）；publicDiff 仍只有 from / to
          diff: { from: t.status, to: data.status, ...(unsettledAtTerminate ? { forceUnsettled: true, unsettledCents: unsettledAtTerminate } : {}) },
          publicDiff: { from: t.status, to: data.status },
        })
        notice = { tenantId: id, from: t.status, to: String(data.status) }
      }
      if (Object.keys(rateDiff).length) {
        // A10 靠这条审计的时间判断「之后的新订单快照是否等于当前费率」（reconcile.ts）
        await writeAudit(tx, { ...base, action: 'tenant.rates', diff: rateDiff, publicDiff: rateDiff })
      }
      if (holdChanged) {
        await writeAudit(tx, {
          ...base,
          action: 'tenant.payout_hold',
          reason: (p.payoutHoldReason ?? t.payoutHoldReason ?? '') || undefined,
          diff: { from: t.payoutHold, to: p.payoutHold, reason: data.payoutHoldReason ?? t.payoutHoldReason ?? null },
          publicDiff: { payoutHold: p.payoutHold },
        })
      }
      if (Object.keys(cfgDiff).length) {
        // 渠道可见摘要（设计 5.8，主会话 D16 补齐）：只给渠道本来就知道 / 与它自己有关的配置项；
        // previewUserIds（用户自增 id）与 payoutHoldReason（平台内部原因）不进 publicDiff
        const pub = Object.fromEntries(Object.entries(cfgDiff).filter(([k]) => CONFIG_PUBLIC_KEYS.has(k)))
        await writeAudit(tx, { ...base, action: 'tenant.config', diff: cfgDiff, publicDiff: Object.keys(pub).length ? pub : undefined })
      }
      if (notice) {
        const n = notice as { tenantId: number; from: string; to: string }
        await emitTenantNotice(tx, {
          tenantId: id,
          kind: 'TENANT_STATUS',
          title: `店铺状态变更为「${TENANT_STATUS_LABEL[n.to as TenantStatus] ?? n.to}」`,
          body:
            n.to === 'SUSPENDED'
              ? '暂停期间前台不接新订单、渠道后台只读；已付订单的售后与结算照常'
              : n.to === 'TERMINATED'
                ? '店铺已停业：渠道后台停止访问，买家的订单与售后入口保留'
                : undefined,
        })
      }
    },
    { maxWait: 10_000, timeout: 30_000 },
  )
  invalidateStorefrontCache()
  return { changed }
}

// =====================================================================================
// 域名
// =====================================================================================

export async function upsertDomain(tenantId: number, rawHost: string, status: 0 | 1, adminId: number): Promise<void> {
  if (status !== 0 && status !== 1) throw new TenantAdminError(400, '域名状态只能是启用或停用')
  const host = assertChannelHost(rawHost)
  try {
    await prisma.$transaction(async (tx) => {
      await lockTenantRow(tx, tenantId)
      const t = await channelOr404(tx, tenantId)
      const existing = await tx.tenantDomain.findUnique({ where: { host } })
      if (existing && existing.tenantId !== tenantId) throw new TenantAdminError(409, '该域名已被其他渠道使用')
      const originHost = normalizeHost(new URL(t.origin).host)
      if (existing) {
        if (existing.status === status) return
        await tx.tenantDomain.update({ where: { id: existing.id }, data: { status } })
      } else {
        await tx.tenantDomain.create({ data: { tenantId, host, isPrimary: host === originHost, status } })
      }
      await writeAudit(tx, {
        actorUserId: adminId,
        actorKind: 'PLATFORM',
        tenantId,
        action: 'tenant.domain',
        targetType: 'tenant',
        targetId: t.code,
        diff: { host, from: existing ? existing.status : null, to: status },
        // 域名就是渠道自己的店面地址，渠道可见（设计 5.8，D16 补齐）
        publicDiff: { host, from: existing ? existing.status : null, to: status },
      })
    })
  } catch (e) {
    if (isP2002(e, 'host')) throw new TenantAdminError(409, '该域名已被其他渠道使用')
    throw e
  } finally {
    invalidateStorefrontCache()
  }
}

// =====================================================================================
// 成员与邀请（设计 5.2、6.7）
// =====================================================================================

/** 与 WP6 接受邀请同一口径（partner-services/invite.ts）：sha256(令牌原文 UTF-8)、sha256(小写去空白邮箱)，十六进制 */
export function inviteTokenHash(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}
export function inviteEmailHash(email: string): string {
  return createHash('sha256').update(String(email).trim().toLowerCase(), 'utf8').digest('hex')
}
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{1,63}$/

export interface InviteResult {
  inviteId: number
  expiresAt: string
  /** 邀请链接（仅超管可见）。邮件发送失败时由站长手动转发给对方 */
  link: string
  mailed: boolean
  mailError?: string
}

/**
 * 邀请渠道主。32 字节随机令牌（base64url 43 位），库里只存 sha256；24 小时有效（TENANT_INVITE_HOURS）。
 * 同一邮箱之前未用的邀请一并作废（链接只保留最新一张，少一张在外面流转的有效令牌）。
 * 邮件经 WP3 的 sendTenantInviteMail 发送；发不出去不回滚邀请，返回 mailed=false + 链接，由站长手动转发。
 */
export async function createInvite(tenantId: number, email: string, role: 'OWNER', adminId: number): Promise<InviteResult> {
  if (role !== 'OWNER') throw new TenantAdminError(400, 'P0 只能邀请渠道主（OWNER）')
  const e = String(email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(e) || e.length > 254) throw new TenantAdminError(400, '邮箱格式不对')
  const token = randomBytes(32).toString('base64url')
  const tokenHash = inviteTokenHash(token)
  const emailHash = inviteEmailHash(e)
  const expiresAt = new Date(Date.now() + TENANT_INVITE_HOURS * 3600_000)

  const inv = await prisma.$transaction(async (tx) => {
    await lockTenantRow(tx, tenantId)
    const t = await channelOr404(tx, tenantId)
    if (t.status === 'TERMINATED') throw new TenantAdminError(409, '渠道已停业，不能再邀请成员')
    const u = await tx.user.findUnique({ where: { email: e }, select: { id: true, role: true } })
    if (u?.role === 'ADMIN') throw new TenantAdminError(400, '超管账号不能成为渠道成员（设计 5.2）')
    if (u) {
      const m = await tx.tenantMember.findUnique({ where: { tenantId_userId: { tenantId, userId: u.id } }, select: { status: true } })
      if (m?.status === 1) throw new TenantAdminError(409, '该邮箱已是本渠道的有效成员')
    }
    const now = new Date()
    await tx.tenantInvite.updateMany({ where: { tenantId, emailHash, usedAt: null, revokedAt: null }, data: { revokedAt: now } })
    const row = await tx.tenantInvite.create({
      data: { tenantId, emailHash, tokenHash, role, expiresAt, invitedBy: adminId },
      select: { id: true },
    })
    await writeAudit(tx, {
      actorUserId: adminId,
      actorKind: 'PLATFORM',
      tenantId,
      action: 'member.invite',
      targetType: 'invite',
      targetId: String(row.id),
      // 库里的邀请只存邮箱哈希；审计 diff（仅超管可见）留原文，邀请列表据此显示「发给了谁」
      diff: { email: e, role, expiresAt: expiresAt.toISOString() },
      // 渠道可见摘要只给角色与有效期（设计 5.8，D16 补齐）：不给邮箱原文
      publicDiff: { role, expiresAt: expiresAt.toISOString() },
    })
    return { id: row.id, origin: t.origin }
  })

  const link = `${inv.origin.replace(/\/+$/, '')}/partner/invite/${encodeURIComponent(token)}`
  try {
    await sendTenantInviteMail({ tenantId, email: e, token })
    return { inviteId: inv.id, expiresAt: expiresAt.toISOString(), link, mailed: true }
  } catch (err) {
    const msg = ((err as Error)?.message || '邮件发送失败').slice(0, 200)
    console.warn('[admin-tenants] 邀请邮件未发出，需站长手动转发链接：', msg)
    return { inviteId: inv.id, expiresAt: expiresAt.toISOString(), link, mailed: false, mailError: msg }
  }
}

export async function revokeInvite(tenantId: number, inviteId: number, adminId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const t = await channelOr404(tx, tenantId)
    const r = await tx.tenantInvite.updateMany({ where: { id: inviteId, tenantId, usedAt: null, revokedAt: null }, data: { revokedAt: new Date() } })
    if (r.count !== 1) throw new TenantAdminError(409, '邀请不存在，或已被接受 / 已作废')
    await writeAudit(tx, { actorUserId: adminId, actorKind: 'PLATFORM', tenantId, action: 'member.invite_revoke', targetType: 'invite', targetId: String(inviteId), diff: { tenant: t.code }, publicDiff: { revoked: true } })
  })
}

export async function listInvites(tenantId: number) {
  await channelOr404(prisma, tenantId)
  const rows = await prisma.tenantInvite.findMany({
    where: { tenantId },
    orderBy: { id: 'desc' },
    take: 50,
    select: { id: true, role: true, expiresAt: true, usedAt: true, revokedAt: true, invitedBy: true, createdAt: true },
  })
  const audits = rows.length
    ? await prisma.auditEvent.findMany({
        where: { tenantId, action: 'member.invite', targetType: 'invite', targetId: { in: rows.map((r) => String(r.id)) } },
        select: { targetId: true, diff: true },
      })
    : []
  const emailOf = new Map<string, string>()
  for (const a of audits) {
    const d = a.diff as { email?: unknown } | null
    if (a.targetId && d && typeof d.email === 'string') emailOf.set(a.targetId, d.email)
  }
  const now = Date.now()
  return rows.map((r) => ({
    id: r.id,
    email: emailOf.get(String(r.id)) ?? null,
    role: r.role,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
    state: r.usedAt ? 'USED' : r.revokedAt ? 'REVOKED' : r.expiresAt.getTime() <= now ? 'EXPIRED' : 'PENDING',
  }))
}

export async function listMembers(tenantId: number) {
  await channelOr404(prisma, tenantId)
  const rows = await prisma.tenantMember.findMany({
    where: { tenantId },
    orderBy: [{ status: 'desc' }, { id: 'asc' }],
    select: { userId: true, role: true, status: true, createdAt: true, updatedAt: true },
  })
  const users = rows.length
    ? await prisma.user.findMany({ where: { id: { in: rows.map((r) => r.userId) } }, select: { id: true, email: true, nickname: true, role: true, status: true } })
    : []
  const byId = new Map(users.map((u) => [u.id, u]))
  return rows.map((r) => {
    const u = byId.get(r.userId)
    return {
      userId: r.userId,
      email: u?.email ?? null,
      nickname: u?.nickname ?? null,
      userRole: u?.role ?? null,
      userStatus: u?.status ?? null,
      role: r.role,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
    }
  })
}

/**
 * 停用 / 启用成员（设计 6.7）。
 *  · 停用：status=0（不删行）；User.sessionEpoch + 1 强制下线（该用户在主站的会话也会失效，重新登录即可——
 *    会话版本是账号级的，没有「只吊销某个站」的粒度）；同事务作废发给他邮箱的未用邀请（W5-10）；
 *    不允许零 OWNER：渠道没停业时，停掉最后一位有效 OWNER 拒绝（先邀请新 OWNER 再停旧的）。
 *  · 启用：拒绝 role=ADMIN 的用户（设计 5.2 不变式）。
 */
export async function setMemberStatus(tenantId: number, userId: number, status: 0 | 1, adminId: number): Promise<void> {
  if (status !== 0 && status !== 1) throw new TenantAdminError(400, '成员状态只能是启用或停用')
  await prisma.$transaction(async (tx) => {
    await lockTenantRow(tx, tenantId)
    const t = await channelOr404(tx, tenantId)
    const m = await tx.tenantMember.findUnique({ where: { tenantId_userId: { tenantId, userId } }, select: { id: true, role: true, status: true } })
    if (!m) throw new TenantAdminError(404, '该用户不是本渠道成员')
    if (m.status === status) return
    // 锁定读用户行（主会话 D13），放在改成员行之前：与后台「提权为 ADMIN」同为「users 行 → tenant_members」锁顺序。
    // 普通快照读看不见并发提交的提权，会把刚成为 ADMIN 的账号重新启用成成员。用 FOR UPDATE 而不是共享锁：
    // 停用分支随后要改同一行的 sessionEpoch，先拿共享锁再升级为排他锁，两个并发操作同一用户时会互相死锁。
    const urows = await tx.$queryRaw<{ email: string | null; role: string }[]>`SELECT email, role FROM users WHERE id = ${userId} FOR UPDATE`
    const u = urows[0]
    if (!u) throw new TenantAdminError(404, '用户不存在')
    if (status === 1 && u.role === 'ADMIN') throw new TenantAdminError(400, '超管账号不能成为渠道成员（设计 5.2）')
    if (status === 0 && m.role === 'OWNER' && t.status !== 'TERMINATED') {
      const others = await tx.tenantMember.count({ where: { tenantId, role: 'OWNER', status: 1, userId: { not: userId } } })
      if (others === 0) throw new TenantAdminError(409, '不允许零 OWNER：请先邀请并让新渠道主接受邀请，再停用这一位')
    }
    await tx.tenantMember.update({ where: { id: m.id }, data: { status } })
    let revoked = 0
    if (status === 0) {
      await tx.user.update({ where: { id: userId }, data: { sessionEpoch: { increment: 1 } } })
      if (u.email) {
        const r = await tx.tenantInvite.updateMany({ where: { tenantId, emailHash: inviteEmailHash(u.email), usedAt: null, revokedAt: null }, data: { revokedAt: new Date() } })
        revoked = r.count
      }
    }
    await writeAudit(tx, {
      actorUserId: adminId,
      actorKind: 'PLATFORM',
      tenantId,
      action: 'member.status',
      targetType: 'member',
      targetId: m.role,
      diff: { userId, email: u.email, role: m.role, from: m.status, to: status, revokedInvites: revoked, sessionRevoked: status === 0 },
      // 渠道可见摘要（设计 5.8，D16 补齐）：角色与启停，不含 userId / 邮箱
      publicDiff: { role: m.role, from: m.status, to: status },
    })
  })
}

// =====================================================================================
// 收款信息（设计 5.1、10.10）
// =====================================================================================

/** 收款账号掩码：邮箱形态保留用户名前 2 位；其余保留首 3 末 4（过短只留末 2） */
export function maskAccount(account: string): string {
  const a = String(account ?? '').trim()
  if (a.includes('@')) return maskEmail(a).slice(0, 64)
  if (a.length >= 10) return `${a.slice(0, 3)}****${a.slice(-4)}`
  if (a.length >= 4) return `****${a.slice(-2)}`
  return '****'
}

/**
 * 收款账号加密与 JWT_SECRET 解耦（主会话 D8）：tenant/crypto 改读专用的 TENANT_DATA_KEY（WP0），
 * 密钥缺失或过短时 crypto 抛「数据密钥未配置」类错误。这里把它转成站长看得懂的 503，**录入与查看都 fail closed**：
 * 没有密钥时绝不存明文、也不退回别的密钥。识别按约定的错误特征而不 import 错误类（WP0 改造前后都能编译）：
 *   name === 'DataKeyMissingError' 或 code === 'DATA_KEY_MISSING'（WP0 按 D8 定义），
 *   或 `[tenant/crypto] … 未配置` 文案（改造前 JWT_SECRET 缺失时的旧文案，同样是「没有密钥」）。
 */
export const DATA_KEY_MISSING_TEXT = '未配置数据密钥（TENANT_DATA_KEY），暂不能录入或查看收款账号，请联系技术人员配置后重试'

export function isDataKeyMissing(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false
  const err = e as { name?: unknown; code?: unknown; message?: unknown }
  if (err.name === 'DataKeyMissingError' || err.code === 'DATA_KEY_MISSING') return true
  return typeof err.message === 'string' && /\[tenant\/crypto\].*未配置/.test(err.message)
}

function sealPayee(account: string): string {
  try {
    return sealText('payee', account)
  } catch (e) {
    if (isDataKeyMissing(e)) throw new TenantAdminError(503, DATA_KEY_MISSING_TEXT, 'DATA_KEY_MISSING')
    throw e
  }
}

/** 解密收款账号。密钥缺失 → 503；解不开（数据密钥不符、已轮换、密文损坏）→ 409 */
function openPayee(sealed: string, hint: string): string {
  try {
    return openText('payee', sealed)
  } catch (e) {
    if (isDataKeyMissing(e)) throw new TenantAdminError(503, DATA_KEY_MISSING_TEXT, 'DATA_KEY_MISSING')
    throw new TenantAdminError(409, `收款账号解密失败（数据密钥不符或已轮换），${hint}`, 'DECRYPT_FAILED')
  }
}

/**
 * 录入 / 变更收款信息：账号 sealText('payee') 加密入库，另存掩码；payeeChangedAt = now（之后 72 小时内不能出单，冷静期，
 * statement.generateStatement 读它）。审计 diff 里只放掩码，明文不进任何日志与审计（S11）。
 */
export async function setPayee(tenantId: number, p: { name: string; method: string; account: string }, adminId: number): Promise<void> {
  const name = String(p.name ?? '').trim()
  const method = String(p.method ?? '').trim().toUpperCase()
  const account = String(p.account ?? '').trim()
  if (!name || name.length > 80) throw new TenantAdminError(400, '收款人姓名必填，最多 80 字')
  if (!PAYEE_METHODS.has(method)) throw new TenantAdminError(400, '收款方式只能是 支付宝 / 银行卡 / 微信')
  if (account.length < 3 || account.length > 64 || /[\r\n]/.test(account)) throw new TenantAdminError(400, '收款账号长度 3–64 位')
  const masked = maskAccount(account)
  const enc = sealPayee(account)
  let code = ''
  await prisma.$transaction(async (tx) => {
    await lockTenantRow(tx, tenantId)
    const t = await channelOr404(tx, tenantId)
    code = t.code
    await tx.tenant.update({ where: { id: tenantId }, data: { payeeName: name, payeeMethod: method, payeeAccountEnc: enc, payeeAccountMasked: masked, payeeChangedAt: new Date() } })
    await writeAudit(tx, {
      actorUserId: adminId,
      actorKind: 'PLATFORM',
      tenantId,
      action: 'tenant.payee',
      targetType: 'tenant',
      targetId: t.code,
      diff: { from: { name: t.payeeName, method: t.payeeMethod, masked: t.payeeAccountMasked }, to: { name, method, masked } },
      // 收款信息只给掩码（渠道设置页本来就显示掩码；设计 5.8，D16 补齐），明文与密文都不进审计
      publicDiff: { from: { name: t.payeeName, method: t.payeeMethod, masked: t.payeeAccountMasked }, to: { name, method, masked } },
    })
  })
  // 改收款账号是骗款的典型前奏（S11）：无论谁改的都在平台群留一条
  await alertPlatform(`渠道 ${code} 的收款信息已变更（${method} ${masked}），${TENANT_DEFAULTS.payeeCooldownHours} 小时内不能出结算单`)
}

/** 查看收款账号明文（打款时核对）。每次查看写审计 */
export async function revealPayee(tenantId: number, adminId: number): Promise<string> {
  const t = await channelOr404(prisma, tenantId)
  if (!t.payeeAccountEnc) throw new TenantAdminError(404, '尚未录入收款账号')
  const plain = openPayee(t.payeeAccountEnc, '请重新录入收款信息')
  await writeAudit(null, { actorUserId: adminId, actorKind: 'PLATFORM', tenantId, action: 'tenant.payee_reveal', targetType: 'tenant', targetId: t.code, diff: { masked: t.payeeAccountMasked } })
  return plain
}

/** 结算单快照里的收款账号明文（打款时核对；出单时快照的是当时的账号，不读当前设置）。每次查看写审计 */
export async function revealStatementPayee(statementId: number, adminId: number): Promise<string> {
  const s = await prisma.tenantStatement.findUnique({ where: { id: statementId }, select: { tenantId: true, statementNo: true, payeeAccountEnc: true, payeeAccountMasked: true } })
  if (!s) throw new TenantAdminError(404, '结算单不存在')
  if (!s.payeeAccountEnc) throw new TenantAdminError(404, '该结算单没有收款账号快照')
  const plain = openPayee(s.payeeAccountEnc, '请与渠道当前收款信息核对，或让渠道重新提供')
  await writeAudit(null, {
    actorUserId: adminId,
    actorKind: 'PLATFORM',
    tenantId: s.tenantId,
    action: 'statement.payee_reveal',
    targetType: 'statement',
    targetId: s.statementNo,
    diff: { masked: s.payeeAccountMasked },
  })
  return plain
}

// =====================================================================================
// 列表与详情
// =====================================================================================

/** 东八区自然月 [from, to)（UTC 时刻） */
export function cnMonthRange(offsetMonths = 0, now: Date = new Date()): { from: Date; to: Date } {
  const cn = new Date(now.getTime() + 8 * 3600_000)
  const y = cn.getUTCFullYear()
  const m = cn.getUTCMonth() + offsetMonths
  const from = new Date(Date.UTC(y, m, 1) - 8 * 3600_000)
  const to = new Date(Date.UTC(y, m + 1, 1) - 8 * 3600_000)
  return { from, to }
}

export interface TenantListRow {
  id: number
  code: string
  name: string
  status: TenantStatus
  origin: string
  feeRateBp: number
  invoiceShareRateBp: number
  holdDays: number
  payoutHold: boolean
  createdAt: string
  balances: TenantBalances
  monthGmvCents: number
  monthOrders: number
  pendingAfterSales: number
  unreadMessages: number
}

export async function listTenants(): Promise<TenantListRow[]> {
  const ts = await prisma.tenant.findMany({
    where: { kind: 'CHANNEL' },
    orderBy: { id: 'asc' },
    select: { id: true, code: true, name: true, status: true, origin: true, feeRateBp: true, invoiceShareRateBp: true, holdDays: true, payoutHold: true, createdAt: true },
  })
  if (!ts.length) return []
  const ids = ts.map((t) => t.id)
  const { from, to } = cnMonthRange(0)
  const gmv = await prisma.$queryRaw<{ tid: number; n: unknown; s: unknown }[]>`
    SELECT tenant_id AS tid, COUNT(*) AS n, SUM(ROUND(amount * 100)) AS s
      FROM orders WHERE tenant_id IN (${Prisma.join(ids)}) AND paid_at >= ${from} AND paid_at < ${to}
     GROUP BY tenant_id`
  const unread = await prisma.$queryRaw<{ tid: number; n: unknown }[]>`
    SELECT o.tenant_id AS tid, COUNT(*) AS n
      FROM order_messages m JOIN orders o ON o.id = m.order_id
     WHERE o.tenant_id IN (${Prisma.join(ids)}) AND m.sender = 'BUYER' AND m.read_by_admin = 0
     GROUP BY o.tenant_id`
  const pend = await prisma.tenantAfterSale.groupBy({ by: ['tenantId'], where: { tenantId: { in: ids }, status: 'PENDING' }, _count: { _all: true } })
  const gmvOf = new Map(gmv.map((r) => [Number(r.tid), r]))
  const unreadOf = new Map(unread.map((r) => [Number(r.tid), Number(r.n)]))
  const pendOf = new Map(pend.map((r) => [r.tenantId, r._count._all]))
  const out: TenantListRow[] = []
  for (const t of ts) {
    out.push({
      id: t.id,
      code: t.code,
      name: t.name,
      status: t.status as TenantStatus,
      origin: t.origin,
      feeRateBp: t.feeRateBp,
      invoiceShareRateBp: t.invoiceShareRateBp,
      holdDays: t.holdDays,
      payoutHold: t.payoutHold,
      createdAt: t.createdAt.toISOString(),
      balances: await computeBalances(t.id),
      monthGmvCents: Number(gmvOf.get(t.id)?.s ?? 0),
      monthOrders: Number(gmvOf.get(t.id)?.n ?? 0),
      pendingAfterSales: pendOf.get(t.id) ?? 0,
      unreadMessages: unreadOf.get(t.id) ?? 0,
    })
  }
  return out
}

/** 渠道详情（超管）：配置全字段（加密列只给「是否已设置」）、域名、成员、邀请、余额、预览账号 */
export async function tenantDetail(id: number) {
  const t = await channelOr404(prisma, id)
  const [domains, members, invites, balances] = await Promise.all([
    prisma.tenantDomain.findMany({ where: { tenantId: id }, orderBy: { id: 'asc' }, select: { host: true, isPrimary: true, status: true, createdAt: true } }),
    listMembers(id),
    listInvites(id),
    computeBalances(id),
  ])
  const pids = Array.isArray(t.previewUserIds) ? (t.previewUserIds as unknown[]).filter((v): v is number => typeof v === 'number') : []
  const previewUsers = pids.length ? await prisma.user.findMany({ where: { id: { in: pids } }, select: { id: true, email: true, nickname: true } }) : []
  const cooldownUntil = t.payeeChangedAt ? new Date(t.payeeChangedAt.getTime() + TENANT_DEFAULTS.payeeCooldownHours * 3600_000) : null
  return {
    tenant: {
      id: t.id,
      code: t.code,
      name: t.name,
      status: t.status as TenantStatus,
      origin: t.origin,
      feeRateBp: t.feeRateBp,
      invoiceShareRateBp: t.invoiceShareRateBp,
      holdDays: t.holdDays,
      minPayoutCents: t.minPayoutCents,
      requestIntervalDays: t.requestIntervalDays,
      payoutHold: t.payoutHold,
      payoutHoldReason: t.payoutHoldReason,
      pendingOrderCap: t.pendingOrderCap,
      maxOrderQty: t.maxOrderQty,
      partyType: t.partyType,
      legalName: t.legalName,
      requirePartnerInvoice: t.requirePartnerInvoice,
      payeeName: t.payeeName,
      payeeMethod: t.payeeMethod,
      payeeAccountMasked: t.payeeAccountMasked,
      hasPayeeAccount: !!t.payeeAccountEnc,
      payeeChangedAt: t.payeeChangedAt ? t.payeeChangedAt.toISOString() : null,
      payeeCooldownUntil: cooldownUntil && cooldownUntil.getTime() > Date.now() ? cooldownUntil.toISOString() : null,
      hasWebhook: !!t.wecomWebhookEnc,
      previewUserIds: pids,
      createdAt: t.createdAt.toISOString(),
    },
    transitions: TENANT_TRANSITIONS[t.status as TenantStatus] ?? [],
    domains: domains.map((d) => ({ ...d, createdAt: d.createdAt.toISOString() })),
    members,
    invites,
    balances,
    previewUsers,
  }
}

// =====================================================================================
// 结算单（超管列表 / 导出）——状态迁移与出单全部在 WP3 的 statement.ts，这里只读
// =====================================================================================

export async function listStatementsAdmin(tenantId: number, page = 1, pageSize = 20) {
  await channelOr404(prisma, tenantId)
  const take = Math.min(Math.max(1, pageSize), 100)
  const skip = (Math.max(1, page) - 1) * take
  const [total, rows] = await Promise.all([
    prisma.tenantStatement.count({ where: { tenantId } }),
    prisma.tenantStatement.findMany({
      where: { tenantId },
      orderBy: { seq: 'desc' },
      skip,
      take,
      select: {
        id: true,
        statementNo: true,
        seq: true,
        origin: true,
        periodEnd: true,
        lineCount: true,
        goodsCents: true,
        purchaseCents: true,
        invShareCents: true,
        feeCents: true,
        otherCents: true,
        grossCents: true,
        netCents: true,
        state: true,
        payeeName: true,
        payeeMethod: true,
        payeeAccountMasked: true,
        payingBy: true,
        payingAt: true,
        voucherType: true,
        partnerInvoiceNo: true,
        returnReason: true,
        createdBy: true,
        createdAt: true,
      },
    }),
  ])
  const sids = rows.map((r) => r.id)
  const payouts = sids.length ? await prisma.tenantPayout.findMany({ where: { statementId: { in: sids } } }) : []
  const bounces = sids.length
    ? await prisma.tenantLedgerEntry.groupBy({ by: ['statementId'], where: { statementId: { in: sids }, type: 'BOUNCE' }, _sum: { amountCents: true } })
    : []
  const payOf = new Map(payouts.map((p) => [p.statementId, p]))
  const bounceOf = new Map(bounces.map((b) => [b.statementId, b._sum.amountCents ?? 0]))
  const uids = Array.from(new Set(rows.flatMap((r) => [r.payingBy, r.createdBy]).concat(payouts.map((p) => p.operatorId)).filter((v): v is number => v != null)))
  const users = uids.length ? await prisma.user.findMany({ where: { id: { in: uids } }, select: { id: true, email: true, nickname: true } }) : []
  const nameOf = new Map(users.map((u) => [u.id, u.nickname || u.email || `#${u.id}`]))
  return {
    total,
    rows: rows.map((r) => {
      const p = payOf.get(r.id)
      return {
        ...r,
        periodEnd: r.periodEnd.toISOString(),
        payingAt: r.payingAt ? r.payingAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        payingByName: r.payingBy != null ? nameOf.get(r.payingBy) ?? null : null,
        createdByName: r.createdBy != null ? nameOf.get(r.createdBy) ?? null : null,
        // PAYING 超过 24 小时醒目提示（设计 10.9，A7 同口径）
        payingOverdue: r.state === 'PAYING' && !!r.payingAt && Date.now() - r.payingAt.getTime() > 24 * 3600_000,
        payout: p
          ? {
              amountCents: p.amountCents,
              withholdCents: p.withholdCents,
              method: p.method,
              externalTradeNo: p.externalTradeNo,
              paidAt: p.paidAt.toISOString(),
              hasProof: !!p.proofFile,
              operatorName: nameOf.get(p.operatorId) ?? null,
            }
          : null,
        bouncedCents: bounceOf.get(r.id) ?? 0,
      }
    }),
  }
}

function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  let s = String(v)
  // 防公式注入只针对文本：纯数值（含负数金额 -330.00）原样输出，否则 Excel 里成了文本、求和对不上，对账单就失去作用
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}
const yuan = (c: number) => (c / 100).toFixed(2)

/** 结算单对账单 CSV（超管导出）：汇总行 + 纳入明细（订单号、类型、成分、金额） */
export async function statementCsv(statementId: number, adminId: number): Promise<{ filename: string; csv: string }> {
  const s = await prisma.tenantStatement.findUnique({ where: { id: statementId } })
  if (!s) throw new TenantAdminError(404, '结算单不存在')
  const t = await prisma.tenant.findUnique({ where: { id: s.tenantId }, select: { code: true } })
  const lines = await prisma.$queryRaw<{ at: Date; type: string; component: string; amt: number; orderNo: string | null; eventKey: string }[]>`
    SELECT e.created_at AS at, e.type, e.component, e.amount_cents AS amt, o.order_no AS orderNo, e.event_key AS eventKey
      FROM tenant_statement_lines l
      JOIN tenant_ledger_entries e ON e.id = l.entry_id
      LEFT JOIN orders o ON o.id = e.order_id
     WHERE l.statement_id = ${statementId}
     ORDER BY e.id ASC`
  const out: string[] = []
  out.push(csvCell(`结算单 ${s.statementNo}（渠道 ${t?.code ?? s.tenantId}，第 ${s.seq} 期，截止 ${s.periodEnd.toISOString()}）导出于 ${new Date().toISOString()}，仅供对账`))
  out.push(['货款', '进货款', '发票分成', '手续费', '其他', '余额', '打款'].map(csvCell).join(','))
  out.push([s.goodsCents, s.purchaseCents, s.invShareCents, s.feeCents, s.otherCents, s.grossCents, s.netCents].map((c) => csvCell(yuan(c))).join(','))
  out.push('')
  out.push(['时间', '订单号', '事件', '成分', '金额（元）', '事件键'].map(csvCell).join(','))
  for (const l of lines) out.push([new Date(l.at).toISOString(), l.orderNo ?? '', l.type, l.component, yuan(Number(l.amt)), l.eventKey].map(csvCell).join(','))
  await writeAudit(null, { actorUserId: adminId, actorKind: 'PLATFORM', tenantId: s.tenantId, action: 'statement.export', targetType: 'statement', targetId: s.statementNo, diff: { lines: lines.length } })
  return { filename: `statement-${s.statementNo}.csv`, csv: '﻿' + out.join('\r\n') + '\r\n' }
}

// =====================================================================================
// 运营概览（设计 10.13、12.2；仅超管）
// =====================================================================================

/**
 * 各渠道在时间段内（按付款时间）的经营数字：
 *  · gmvCents          买家货款（Σ amount，不含税，含后来退掉的）
 *  · goodsCents        货款剩余值 G（Σ SALE 分录）
 *  · purchaseCents     进货款净值 P（−Σ PURCHASE，站长的货款营收）
 *  · invoiceProfitCents 实收税费净额（结账税费 + 事后开票已付税费 − 已退税费）− 发票分成净额 I
 *  · feeIncomeCents    手续费净额（−Σ FEE + INVOICE_FEE）
 *  · cardMarginCents   卡差价 = P − 已知真实成本（已发卡 cost + 接码 cost；人工交付没有登记成本，按 0）
 *  · platformBorneRefundCents 站长承担、退给买家的货款 = Σ(RG − Rg)（refunded_goods_cents − settle_refunded_cents）
 *  · lossCents         渠道承担的损失（LOSS 分录，站长所得）= −Σ LOSS
 *    这两列就是设计 10.13 的第四列「站长承担的退款与少付」：站长所得 ≈ 卡差价 + 发票利润 + 手续费收入 + LOSS − 站长承担退款
 *    （只看前三列，PLATFORM 承担的退款会让卡差价高估站长所得，终审账本 #6）
 *  · availableCents / pendingCents：当前可结算 / 冻结中的预计打款（不分时间段）
 *  · refundRateBp      有退款（货款或税费）的已付单占比
 * 口径与设计 10.13 一致，但**不含**唯一金额尾差、少付（这两项只在逐单利润里有意义），面板上写明。
 */
export async function overview(opt: { from?: Date; to?: Date } = {}): Promise<TenantOverviewRow[]> {
  const from = opt.from ?? new Date(0)
  const to = opt.to ?? new Date(Date.now() + 86400_000)
  const ts = await prisma.tenant.findMany({ where: { kind: 'CHANNEL' }, orderBy: { id: 'asc' }, select: { id: true, code: true, status: true } })
  if (!ts.length) return []
  const ids = ts.map((t) => t.id)
  const ord = await prisma.$queryRaw<{ tid: number; n: unknown; gmv: unknown; refunded: unknown; tax: unknown; rtax: unknown; pbr: unknown }[]>`
    SELECT tenant_id AS tid, COUNT(*) AS n, SUM(ROUND(amount * 100)) AS gmv,
           SUM(COALESCE(refunded_goods_cents, 0) - COALESCE(settle_refunded_cents, 0)) AS pbr,
           SUM(CASE WHEN pay_status = 'REFUNDED' OR COALESCE(refunded_goods_cents, 0) > 0 OR COALESCE(refunded_tax_cents, 0) > 0 THEN 1 ELSE 0 END) AS refunded,
           SUM(ROUND(COALESCE(invoice_tax_fee, 0) * 100)) AS tax, SUM(COALESCE(refunded_tax_cents, 0)) AS rtax
      FROM orders
     WHERE tenant_id IN (${Prisma.join(ids)}) AND paid_at IS NOT NULL AND paid_at >= ${from} AND paid_at < ${to}
     GROUP BY tenant_id`
  const led = await prisma.$queryRaw<{ tid: number; component: string; s: unknown }[]>`
    SELECT o.tenant_id AS tid, e.component, SUM(e.amount_cents) AS s
      FROM tenant_ledger_entries e JOIN orders o ON o.id = e.order_id
     WHERE o.tenant_id IN (${Prisma.join(ids)}) AND o.paid_at IS NOT NULL AND o.paid_at >= ${from} AND o.paid_at < ${to}
     GROUP BY o.tenant_id, e.component`
  // 事后开票的税费（结账开票单的税费已在 orders.invoice_tax_fee 里，这里只算没有结账税费的单，避免重复）。
  // 订单 ↔ 发票按与账本相同的四条关联（ledger.linkedInvoicesByOrder：shop_order_id / 外部订单行 / sourceKey 快照），
  // 不只看 invoices.shop_order_id：老路径建的票该列可能为空，只 JOIN 它会漏算事后税费
  const postCand = await prisma.$queryRaw<{ id: number; tid: number }[]>`
    SELECT id, tenant_id AS tid FROM orders
     WHERE tenant_id IN (${Prisma.join(ids)}) AND COALESCE(invoice_tax_fee, 0) = 0
       AND paid_at IS NOT NULL AND paid_at >= ${from} AND paid_at < ${to}`
  const postTax: { tid: number; s: number }[] = []
  for (let i = 0; i < postCand.length; i += 500) {
    const chunk = postCand.slice(i, i + 500)
    const tidOf = new Map(chunk.map((r) => [Number(r.id), Number(r.tid)]))
    const linked = await linkedInvoicesByOrder(prisma, Array.from(tidOf.keys()))
    for (const [oid, list] of Array.from(linked.entries())) {
      const s = list.filter((iv) => iv.payStatus === 'PAID').reduce((acc, iv) => acc + (decToCents(iv.taxFee) ?? 0), 0)
      if (s) postTax.push({ tid: tidOf.get(oid) as number, s })
    }
  }
  const cardCost = await prisma.$queryRaw<{ tid: number; s: unknown }[]>`
    SELECT o.tenant_id AS tid, SUM(ROUND(COALESCE(c.cost, 0) * 100)) AS s
      FROM card_keys c JOIN orders o ON o.id = c.order_id
     WHERE o.tenant_id IN (${Prisma.join(ids)}) AND c.status = 'USED' AND o.paid_at IS NOT NULL AND o.paid_at >= ${from} AND o.paid_at < ${to}
     GROUP BY o.tenant_id`
  const smsCost = await prisma.$queryRaw<{ tid: number; s: unknown }[]>`
    SELECT o.tenant_id AS tid, SUM(ROUND(COALESCE(s.cost, 0) * 100)) AS s
      FROM sms_activations s JOIN orders o ON o.id = s.order_id
     WHERE o.tenant_id IN (${Prisma.join(ids)}) AND o.paid_at IS NOT NULL AND o.paid_at >= ${from} AND o.paid_at < ${to}
     GROUP BY o.tenant_id`
  const pend = await prisma.tenantAfterSale.groupBy({ by: ['tenantId'], where: { tenantId: { in: ids }, status: 'PENDING' }, _count: { _all: true } })

  const n = (v: unknown) => (v == null ? 0 : Number(v))
  const ordOf = new Map(ord.map((r) => [Number(r.tid), r]))
  const comp = new Map<number, Record<string, number>>()
  for (const r of led) {
    const m = comp.get(Number(r.tid)) ?? {}
    m[r.component] = (m[r.component] ?? 0) + n(r.s)
    comp.set(Number(r.tid), m)
  }
  const postOf = new Map<number, number>()
  for (const r of postTax) postOf.set(r.tid, (postOf.get(r.tid) ?? 0) + r.s)
  const costOf = new Map<number, number>()
  for (const r of [...cardCost, ...smsCost]) costOf.set(Number(r.tid), (costOf.get(Number(r.tid)) ?? 0) + n(r.s))
  const pendOf = new Map(pend.map((r) => [r.tenantId, r._count._all]))

  const out: TenantOverviewRow[] = []
  for (const t of ts) {
    const o = ordOf.get(t.id)
    const c = comp.get(t.id) ?? {}
    const bal = await computeBalances(t.id)
    const purchase = -(c.PURCHASE ?? 0)
    const invShare = c.INVOICE_SHARE ?? 0
    const paid = n(o?.n)
    const taxNet = n(o?.tax) + (postOf.get(t.id) ?? 0) - n(o?.rtax)
    out.push({
      tenantId: t.id,
      code: t.code,
      status: t.status as TenantStatus,
      gmvCents: n(o?.gmv),
      goodsCents: c.SALE ?? 0,
      purchaseCents: purchase,
      invoiceProfitCents: taxNet - invShare,
      feeIncomeCents: -((c.FEE ?? 0) + (c.INVOICE_FEE ?? 0)),
      cardMarginCents: purchase - (costOf.get(t.id) ?? 0),
      platformBorneRefundCents: n(o?.pbr),
      lossCents: -(c.LOSS ?? 0),
      availableCents: bal.available.payoutCents,
      pendingCents: bal.pending.payoutCents,
      negative: bal.negative,
      refundRateBp: paid > 0 ? Math.floor((n(o?.refunded) * 10000) / paid) : 0,
      pendingAfterSales: pendOf.get(t.id) ?? 0,
    })
  }
  return out
}

// =====================================================================================
// 对账自检（超管页面）：结果在进程内留一份，GET 直接看上一次
// =====================================================================================

let lastReconcile: { at: string; tenantId: number | null; applyHold: boolean; items: ReconcileItem[] } | null = null

export async function runReconcileAdmin(opt: { tenantId?: number; applyHold?: boolean }, adminId: number) {
  if (opt.tenantId !== undefined) await channelOr404(prisma, opt.tenantId)
  const applyHold = opt.applyHold !== false
  const r = await runReconcile({ tenantId: opt.tenantId, applyHold })
  lastReconcile = { at: r.at, tenantId: opt.tenantId ?? null, applyHold, items: r.items }
  const failed = r.items.filter((i) => !i.ok).map((i) => i.code)
  await writeAudit(null, {
    actorUserId: adminId,
    actorKind: 'PLATFORM',
    tenantId: opt.tenantId ?? null,
    action: 'reconcile.run',
    targetType: 'reconcile',
    diff: { applyHold, failed },
  })
  return lastReconcile
}

export function lastReconcileResult() {
  return lastReconcile
}

// =====================================================================================
// 审计查询（/admin/audit）
// =====================================================================================

export interface AuditQuery {
  tenantId?: number
  actorUserId?: number
  actorKind?: string
  action?: string
  result?: string
  targetId?: string
  from?: Date
  to?: Date
  page: number
  pageSize: number
}

export async function queryAudit(q: AuditQuery) {
  const where: Prisma.AuditEventWhereInput = {
    ...(q.tenantId !== undefined ? { tenantId: q.tenantId } : {}),
    ...(q.actorUserId !== undefined ? { actorUserId: q.actorUserId } : {}),
    ...(q.actorKind ? { actorKind: q.actorKind } : {}),
    ...(q.action ? { action: { startsWith: q.action } } : {}),
    ...(q.result ? { result: q.result } : {}),
    ...(q.targetId ? { targetId: q.targetId } : {}),
    ...(q.from || q.to ? { at: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lt: q.to } : {}) } } : {}),
  }
  const take = Math.min(Math.max(1, q.pageSize), 100)
  const skip = (Math.max(1, q.page) - 1) * take
  const [total, rows] = await Promise.all([prisma.auditEvent.count({ where }), prisma.auditEvent.findMany({ where, orderBy: { id: 'desc' }, skip, take })])
  const uids = Array.from(new Set(rows.map((r) => r.actorUserId).filter((v): v is number => v != null)))
  const tids = Array.from(new Set(rows.map((r) => r.tenantId).filter((v): v is number => v != null)))
  const [users, tenants] = await Promise.all([
    uids.length ? prisma.user.findMany({ where: { id: { in: uids } }, select: { id: true, email: true, nickname: true } }) : [],
    tids.length ? prisma.tenant.findMany({ where: { id: { in: tids } }, select: { id: true, code: true } }) : [],
  ])
  const userOf = new Map(users.map((u) => [u.id, u.email || u.nickname || `#${u.id}`]))
  const codeOf = new Map(tenants.map((t) => [t.id, t.code]))
  return {
    total,
    rows: rows.map((r) => ({
      id: r.id,
      at: r.at.toISOString(),
      actorKind: r.actorKind,
      actorUserId: r.actorUserId,
      actor: r.actorUserId != null ? userOf.get(r.actorUserId) ?? `#${r.actorUserId}` : null,
      tenantId: r.tenantId,
      tenantCode: r.tenantId != null ? codeOf.get(r.tenantId) ?? null : null,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      result: r.result,
      reasonCode: r.reasonCode,
      reason: r.reason,
      diff: r.diff,
      publicDiff: r.publicDiff,
      ip: r.ip,
      ua: r.ua,
    })),
  }
}

/** 审计页顶部的两块汇总（设计 12.2）：近 7 天 DENIED 按动作 / 原因汇总；近 30 天各渠道交付凭据查看量（card.view） */
export async function auditSummary() {
  const since7 = new Date(Date.now() - 7 * 86400_000)
  const since30 = new Date(Date.now() - 30 * 86400_000)
  const denied = await prisma.auditEvent.groupBy({
    by: ['action', 'reasonCode'],
    where: { result: 'DENIED', at: { gte: since7 } },
    _count: { _all: true },
  })
  const cardViews = await prisma.auditEvent.groupBy({
    by: ['tenantId'],
    where: { action: 'card.view', result: 'OK', at: { gte: since30 } },
    _count: { _all: true },
  })
  const tids = cardViews.map((c) => c.tenantId).filter((v): v is number => v != null)
  const tenants = tids.length ? await prisma.tenant.findMany({ where: { id: { in: tids } }, select: { id: true, code: true } }) : []
  const codeOf = new Map(tenants.map((t) => [t.id, t.code]))
  return {
    denied7d: denied
      .map((d) => ({ action: d.action, reasonCode: d.reasonCode, count: d._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50),
    cardViews30d: cardViews
      .map((c) => ({ tenantId: c.tenantId, code: c.tenantId != null ? codeOf.get(c.tenantId) ?? null : null, count: c._count._all }))
      .sort((a, b) => b.count - a.count),
  }
}

/** 金额展示用：Decimal / 字符串元 → 分（供 supply-pricing 与页面接口复用） */
export function decToCents(v: Prisma.Decimal | string | number | null | undefined): number | null {
  if (v == null) return null
  return toCents(typeof v === 'object' ? v.toString() : v)
}

// =====================================================================================
// 账本与结算单：超管侧的读包装与请求解析（金额写入全部在 WP3 的 ledger.ts / statement.ts，这里不碰分录）
// =====================================================================================

/** 超管流水（listLedgerAdmin）+ 操作人显示名 */
export async function ledgerAdmin(tenantId: number, q: LedgerQuery) {
  await channelOr404(prisma, tenantId)
  const r = await listLedgerAdmin(tenantId, q)
  const uids = Array.from(new Set(r.rows.map((x) => x.operatorId).filter((v): v is number => v != null)))
  const users = uids.length ? await prisma.user.findMany({ where: { id: { in: uids } }, select: { id: true, email: true, nickname: true } }) : []
  const nameOf = new Map(users.map((u) => [u.id, u.nickname || u.email || `#${u.id}`]))
  return { total: r.total, rows: r.rows.map((x) => ({ ...x, operatorName: x.operatorId != null ? nameOf.get(x.operatorId) ?? `#${x.operatorId}` : '系统' })) }
}

export async function balancesAdmin(tenantId: number): Promise<TenantBalances> {
  await channelOr404(prisma, tenantId)
  return computeBalances(tenantId)
}

/**
 * 暂停打款的提示文案（超管侧）。hold 有两种来源：对账失败自动置（原因以「对账失败」开头，reconcile.ts）与站长手动暂停
 * （违约调查等，原因自己填）。只有前者才说「对账异常、请到对账自检查看」——手动暂停也这么说就是答非所问（终审完整性 #22）。
 * 原因原文只给超管（S20），渠道侧永远看不到本函数的输出。
 */
export function payoutHoldText(reason: string | null | undefined, what = ''): string {
  const r = (reason ?? '').trim()
  const fromReconcile = r.startsWith('对账失败')
  return (
    `该渠道已暂停打款${fromReconcile ? '（对账异常）' : ''}：${r || '未填写原因'}` +
    (what ? `，${what}` : '') +
    (fromReconcile ? '；请到「对账自检」查看失败项，处理后在渠道详情解除' : '；解除请到渠道详情操作')
  )
}

/** 结算单头：存在性 + 所属渠道（状态迁移前取一次，用于 404 与提示文案） */
export async function statementHeadOr404(statementId: number) {
  const s = await prisma.tenantStatement.findUnique({
    where: { id: statementId },
    select: { id: true, tenantId: true, statementNo: true, state: true, netCents: true },
  })
  if (!s) throw new TenantAdminError(404, '结算单不存在')
  const t = await prisma.tenant.findUnique({ where: { id: s.tenantId }, select: { code: true, payoutHold: true, payoutHoldReason: true, requirePartnerInvoice: true } })
  return {
    ...s,
    tenantCode: t?.code ?? null,
    payoutHold: !!t?.payoutHold,
    payoutHoldReason: t?.payoutHold ? t.payoutHoldReason ?? null : null,
    requirePartnerInvoice: !!t?.requirePartnerInvoice,
  }
}

/** 超管结算单详情：WP3 的 statementDetailAdmin 去掉密文列，另附打款、退票、渠道 hold 状态 */
export async function statementDetailView(statementId: number) {
  const head = await statementHeadOr404(statementId)
  const d = await statementDetailAdmin(statementId)
  if (!d) throw new TenantAdminError(404, '结算单不存在')
  const { payeeAccountEnc, ...rest } = d
  const payout = await prisma.tenantPayout.findUnique({ where: { statementId } })
  const bounced = await prisma.tenantLedgerEntry.aggregate({ where: { statementId, type: 'BOUNCE' }, _sum: { amountCents: true } })
  const raw = await prisma.tenantStatement.findUnique({
    where: { id: statementId },
    select: { payingAt: true, partnerInvoiceNo: true, partnerInvoiceAmountCents: true, returnReason: true, createdAt: true },
  })
  return {
    ...rest,
    id: head.id,
    tenantId: head.tenantId,
    tenantCode: head.tenantCode,
    payoutHold: head.payoutHold,
    payoutHoldReason: head.payoutHoldReason,
    requirePartnerInvoice: head.requirePartnerInvoice,
    hasPayeeAccount: !!payeeAccountEnc,
    payingAt: raw?.payingAt ? raw.payingAt.toISOString() : null,
    partnerInvoiceNo: raw?.partnerInvoiceNo ?? null,
    partnerInvoiceAmountCents: raw?.partnerInvoiceAmountCents ?? null,
    returnReason: raw?.returnReason ?? null,
    createdAt: raw?.createdAt ? raw.createdAt.toISOString() : null,
    payout: payout
      ? {
          amountCents: payout.amountCents,
          withholdCents: payout.withholdCents,
          method: payout.method,
          externalTradeNo: payout.externalTradeNo,
          paidAt: payout.paidAt.toISOString(),
          hasProof: !!payout.proofFile,
        }
      : null,
    bouncedCents: bounced._sum.amountCents ?? 0,
  }
}

/** 出单失败原因的中文说明与 HTTP 状态（GenerateResult.reason） */
export const GENERATE_REASON: Readonly<Record<string, { status: 400 | 409; text: string }>> = Object.freeze({
  BELOW_MIN: { status: 400, text: '可结算金额低于该渠道的最低结算额（手动出单不受此限）' },
  NEGATIVE: { status: 400, text: '可结算金额 ≤ 0，不出结算单（负数留待下期抵扣）' },
  HOLD: { status: 409, text: '该渠道已暂停打款（对账异常），请到「对账自检」查看失败项，处理后在渠道详情解除' },
  OPEN_EXISTS: { status: 409, text: '该渠道还有未完结的结算单，请先打款或退回' },
  PAYEE_MISSING: { status: 400, text: '尚未录入该渠道的收款信息' },
  PAYEE_COOLDOWN: { status: 400, text: `收款信息变更未满 ${TENANT_DEFAULTS.payeeCooldownHours} 小时（冷静期），暂不能出单` },
  INTERVAL: { status: 409, text: '距该渠道上次申请结算未满间隔天数' },
  RECONCILE_FAILED: { status: 409, text: '出单前对账未通过，已自动暂停该渠道打款，请到「对账自检」查看失败项' },
})

export function failJson(status: number, error: string, reason?: string): Response {
  return NextResponse.json({ success: false, error, ...(reason ? { reason } : {}) }, { status })
}

const VOUCHER_TYPES = new Set(['INVOICE', 'AGENT_INVOICE', 'SMALL_RECEIPT', 'WITHHOLD_RECORD'])
const PAYOUT_BODY_MAX = 6 * 1024 * 1024

export interface PayoutRequest {
  amountCents: number
  withholdCents: number
  method: 'ALIPAY' | 'BANK' | 'WECHAT'
  externalTradeNo: string
  paidAt: Date
  voucherType: string
  partnerInvoiceNo: string | null
  partnerInvoiceAmountCents: number | null
  proof: File | null
}

function intField(v: unknown): number | null {
  const s = typeof v === 'number' ? String(v) : typeof v === 'string' ? v.trim() : ''
  return /^\d{1,12}$/.test(s) ? Number(s) : null
}
function blank(v: unknown): boolean {
  return v === undefined || v === null || v === ''
}

/**
 * 登记打款的请求体：multipart（带凭证文件 proof）或 JSON（不带）。字段见实施分包 8.4。
 * 金额一律整数分；paidAt 不能晚于现在 + 1 天（防手滑填成明年）。
 */
export async function readPayoutRequest(req: Request): Promise<PayoutRequest | Response> {
  const bad = (m: string) => failJson(400, m)
  const len = Number(req.headers.get('content-length') || '0')
  if (len > PAYOUT_BODY_MAX) return bad('请求体过大（凭证不能超过 5MB）')
  const ct = (req.headers.get('content-type') || '').toLowerCase()
  const f: Record<string, unknown> = {}
  let proof: File | null = null
  try {
    if (ct.startsWith('multipart/form-data')) {
      const form = await req.formData()
      for (const [k, v] of Array.from(form.entries())) {
        if (k === 'proof') {
          if (typeof v !== 'string' && v.size > 0) proof = v as File
        } else if (typeof v === 'string') f[k] = v
      }
    } else {
      const text = await req.text()
      if (text.length > 64 * 1024) return bad('请求体过大')
      Object.assign(f, text ? (JSON.parse(text) as Record<string, unknown>) : {})
    }
  } catch {
    return bad('请求体格式不对')
  }
  const amountCents = intField(f.amountCents)
  const withholdCents = blank(f.withholdCents) ? 0 : intField(f.withholdCents)
  if (amountCents == null || withholdCents == null) return bad('打款金额、代扣金额必须是整数（分）')
  const method = String(f.method ?? '').toUpperCase()
  if (!PAYEE_METHODS.has(method)) return bad('打款方式只能是 支付宝 / 银行卡 / 微信')
  const externalTradeNo = String(f.externalTradeNo ?? '').trim()
  if (!externalTradeNo || externalTradeNo.length > 64 || /[\r\n]/.test(externalTradeNo)) return bad('请填写转账流水号（≤ 64 字符）')
  const paidAt = new Date(String(f.paidAt ?? ''))
  if (Number.isNaN(paidAt.getTime())) return bad('请填写打款时间')
  if (paidAt.getTime() > Date.now() + 86400_000) return bad('打款时间不能晚于今天')
  const voucherType = String(f.voucherType ?? '').toUpperCase()
  if (!VOUCHER_TYPES.has(voucherType)) return bad('请选择凭证类型')
  const invNo = String(f.partnerInvoiceNo ?? '').trim()
  if (invNo.length > 64) return bad('发票号过长')
  const invAmt = blank(f.partnerInvoiceAmountCents) ? null : intField(f.partnerInvoiceAmountCents)
  if (!blank(f.partnerInvoiceAmountCents) && invAmt == null) return bad('发票金额必须是整数（分）')
  return {
    amountCents,
    withholdCents,
    method: method as PayoutRequest['method'],
    externalTradeNo,
    paidAt,
    voucherType,
    partnerInvoiceNo: invNo || null,
    partnerInvoiceAmountCents: invAmt,
    proof,
  }
}
