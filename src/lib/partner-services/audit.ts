/**
 * 渠道后台：本渠道操作日志（WP7，设计 5.8、6.2「审计日志」、6.3、12.1）。
 *
 * 【行范围】AuditEvent where { tenantId = 本渠道, action ∉ {authz.denied, authz.noise} }：越权拒绝与噪声汇总只给超管看
 * （给渠道看等于告诉他「哪些接口存在、你哪次被拦了」）。平台对本渠道的操作（改进货价、暂停打款、调账、出单…）同样以
 * tenantId=本渠道 记在这里，渠道看得到「平台做了什么」，但：
 *
 * 【字段】只用 PARTNER_AUDIT_SELECT：**永远不选 diff、reason、ip、ua、viaSessionId**。变更内容只给 publicDiff——
 * 平台行的 publicDiff 由写审计的一方按设计 5.8 的 action 白名单显式构造（不含成本规则、payoutHoldReason、调账内部 memo），
 * 没构造就是 NULL；渠道自己的行 publicDiff = diff（本来就是渠道自己提交的内容）。
 * 在此之上再加三道兜底（写审计的一方写错了也不至于直接泄露）：
 *  1. publicDiff 递归删掉 T10 禁用键（cost、memo、requestId、ip、userId…，PARTNER_FORBIDDEN_KEYS），深度与大小有上限；
 *  2. reasonCode 只放行形如代码的值（字母数字与 _ . : -，≤ 24）：写成中文原因原文的一律不给（原因原文仅超管可见）；
 *  3. 平台行的 targetId 若是内部对象（tenant / user / member / payee）或纯数字（自增 id）则不给——渠道侧不出现自增主键。
 *
 * 【操作者】平台行一律显示「平台」（不给具体是哪个管理员）；系统行「系统」；渠道行显示本渠道成员的昵称（或邮箱），
 * actorUserId 本身不输出。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { LIMITS, type PartnerAuditRow } from '../tenant/types'
import { assertTenantId } from './_scope'
import { PARTNER_AUDIT_SELECT, PARTNER_FORBIDDEN_KEYS, PARTNER_INTERNAL_ACTOR_SELECT, PARTNER_INTERNAL_MEMBER_KEY_SELECT } from './selects'

/**
 * 渠道永远看不到的 targetType：平台对**未授权**上架行的操作（改进货价 / 上下限 / 代改售价）以此记审计
 * （tenant/supply-pricing.ts 的 HIDDEN_LISTING_TARGET；渠道层不能 import 那个文件，这里各写一份字面量）。
 * 整行排除而不只是抹 targetId：行本身的存在与条数就泄露「有隐藏上架行、平台给它定过价」（设计 5.3 / 6.3）。
 */
export const HIDDEN_TARGET_TYPES = ['listing_hidden'] as const
/** 渠道永远看不到的 action */
export const HIDDEN_ACTIONS = ['authz.denied', 'authz.noise'] as const
/** action 筛选：完整 action（listing.price）或前缀（listing = listing.*） */
export const ACTION_FILTER_RE = /^[a-z_]{1,24}(\.[a-z_]{1,23})?$/

const INTERNAL_TARGET_TYPES: ReadonlySet<string> = new Set(['tenant', 'user', 'member', 'payee', 'perm', 'page'])
const REASON_CODE_RE = /^[A-Za-z0-9_.:-]{1,24}$/
const MAX_DEPTH = 6
const MAX_ITEMS = 500

type AuditRaw = Prisma.AuditEventGetPayload<{ select: typeof PARTNER_AUDIT_SELECT }>

/** 递归删禁用键；超深 / 超大截断。纯函数，导出给 itest 测 */
export function sanitizePublicDiff(v: unknown, depth = 0): unknown {
  if (v === null || v === undefined) return null
  if (depth > MAX_DEPTH) return '…'
  if (Array.isArray(v)) return v.slice(0, MAX_ITEMS).map((x) => sanitizePublicDiff(x, depth + 1))
  if (typeof v === 'object') {
    const out: Record<string, unknown> = {}
    let n = 0
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (PARTNER_FORBIDDEN_KEYS.has(k)) continue
      if (++n > MAX_ITEMS) break
      out[k] = sanitizePublicDiff(x, depth + 1)
    }
    return out
  }
  if (typeof v === 'string') return v.length > 500 ? v.slice(0, 500) + '…' : v
  return v
}

function actorKindText(kind: string): string {
  switch (kind) {
    case 'PLATFORM':
      return '平台'
    case 'SYSTEM':
      return '系统'
    case 'BUYER':
      return '买家'
    default:
      return '成员'
  }
}

/**
 * 本页出现的渠道操作者 → 显示名。只认本渠道成员（含已停用的），不是本渠道成员的一律「成员」。
 * 两次批量查询（成员集合 → 用户昵称 / 邮箱），不逐个查：一页最多 100 行，逐个查会是约 200 次串行查询。
 */
async function memberNames(tenantId: number, userIds: number[]): Promise<Map<number, string>> {
  const out = new Map<number, string>()
  const ids = Array.from(new Set(userIds)).slice(0, LIMITS.pageMax)
  if (ids.length === 0) return out
  const members = await prisma.tenantMember.findMany({ where: { tenantId, userId: { in: ids } }, select: PARTNER_INTERNAL_MEMBER_KEY_SELECT })
  const memberIds = Array.from(new Set(members.map((m) => m.userId)))
  if (memberIds.length === 0) return out
  // 昵称、邮箱（selects.ts 的 PARTNER_INTERNAL_ACTOR_SELECT，D15）；id 只用于在本函数内对应回行，不输出
  const users = await prisma.user.findMany({ where: { id: { in: memberIds } }, select: PARTNER_INTERNAL_ACTOR_SELECT })
  for (const u of users) out.set(u.id, u.nickname || u.email || '成员')
  return out
}

function targetIdOf(r: AuditRaw): string | null {
  if (!r.targetId) return null
  if (r.actorKind !== 'TENANT') {
    if (r.targetType && INTERNAL_TARGET_TYPES.has(r.targetType)) return null
    if (/^\d+$/.test(r.targetId) && r.targetType !== 'order') return null
  }
  return r.targetId
}

export async function partnerListAudit(
  tenantId: number,
  f: { action?: string; from?: Date; to?: Date; page: number; pageSize: number },
): Promise<{ total: number; rows: PartnerAuditRow[] }> {
  assertTenantId(tenantId)
  // targetType 可空：NOT IN 对 NULL 为 UNKNOWN 会把 targetType 为空的行一起滤掉，所以显式 OR null
  const and: Prisma.AuditEventWhereInput[] = [
    { action: { notIn: [...HIDDEN_ACTIONS] } },
    { OR: [{ targetType: null }, { targetType: { notIn: [...HIDDEN_TARGET_TYPES] } }] },
  ]
  const where: Prisma.AuditEventWhereInput = { tenantId, AND: and }
  if (f.action) {
    if (!ACTION_FILTER_RE.test(f.action)) return { total: 0, rows: [] }
    and.push(f.action.includes('.') ? { action: f.action } : { action: { startsWith: `${f.action}.` } })
  }
  if (f.from) and.push({ at: { gte: f.from } })
  if (f.to) and.push({ at: { lte: f.to } })
  const page = Math.max(1, Math.floor(f.page))
  const pageSize = Math.min(LIMITS.pageMax, Math.max(1, Math.floor(f.pageSize)))
  const [total, raws] = await Promise.all([
    prisma.auditEvent.count({ where }),
    prisma.auditEvent.findMany({ where, select: PARTNER_AUDIT_SELECT, orderBy: [{ at: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }),
  ])
  const names = await memberNames(
    tenantId,
    raws.filter((r) => r.actorKind === 'TENANT' && r.actorUserId != null).map((r) => r.actorUserId as number),
  )
  const rows: PartnerAuditRow[] = raws.map((r) => ({
    at: r.at.toISOString(),
    action: r.action,
    actor: r.actorKind === 'TENANT' && r.actorUserId != null ? names.get(r.actorUserId) ?? '成员' : actorKindText(r.actorKind),
    targetType: r.targetType ?? null,
    targetId: targetIdOf(r),
    result: r.result,
    reasonCode: r.reasonCode && REASON_CODE_RE.test(r.reasonCode) ? r.reasonCode : null,
    publicDiff: r.publicDiff == null ? null : sanitizePublicDiff(r.publicDiff),
  }))
  return { total, rows }
}
