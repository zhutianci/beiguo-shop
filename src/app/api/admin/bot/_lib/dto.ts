/**
 * 会话、管理员的对外形状（多个接口共用）。
 * 原则：只往页面给它要显示的字段——协议服务的授权码、认领码哈希、令牌哈希永远不出现在这里。
 */
import type { BotAdmin, BotAdminIdentity, BotConversation } from '@prisma/client'
import { prisma } from '@/lib/db'
import { isSubscribed } from '@/lib/bot/events/catalog'
import { MGMT_CATEGORIES, TENANT_CATEGORIES } from '@/lib/bot/types'
import { storefrontById } from '@/lib/storefront/resolve'
import type { AdminDTO, ConvDTO, ConvKind, ConvStatus, SiteDTO } from '@/app/admin/bot/types'

/** 管理群里单独开关的「充值到账」知会（route.ts 的 optInOnly：目录里默认关的单个事件要在 subs 里显式写 ev:<类型> = true） */
export const WALLET_TOPUP_KEY = 'ev:wallet.topup'

/** 分站 id → 站名 / 代码 / 状态。站名用店面品牌名（§4.6：后台里写「站名（渠道代码）」） */
export async function loadSites(ids: Array<number | null | undefined>): Promise<Map<number, SiteDTO>> {
  const out = new Map<number, SiteDTO>()
  const uniq = Array.from(new Set(ids.filter((x): x is number => typeof x === 'number' && Number.isInteger(x) && x > 1)))
  await Promise.all(
    uniq.map(async (id) => {
      const sf = await storefrontById(id).catch(() => null)
      out.set(
        id,
        sf
          ? { tenantId: id, code: sf.code, name: sf.brand?.name || sf.code, status: sf.status }
          : { tenantId: id, code: String(id), name: '（渠道已不存在）', status: 'UNKNOWN' }
      )
    })
  )
  return out
}

/** 当前生效的订阅：subs 里缺的类别按事件目录取默认值；管理群另带「充值到账」单独开关 */
export function effectiveSubs(kind: string, subs: unknown): Record<string, boolean> {
  const cats = kind === 'MGMT' ? MGMT_CATEGORIES : kind === 'TENANT' ? TENANT_CATEGORIES : []
  const out: Record<string, boolean> = {}
  cats.forEach((c) => {
    out[c] = isSubscribed(subs, c)
  })
  if (kind === 'MGMT') {
    const raw = subs && typeof subs === 'object' && !Array.isArray(subs) ? (subs as Record<string, unknown>) : {}
    out[WALLET_TOPUP_KEY] = raw[WALLET_TOPUP_KEY] === true
  }
  return out
}

const KIND_RANK: Record<string, number> = { MGMT: 0, TENANT: 1, DM: 2 }

export function sortConvs<T extends { kind: string; id: number }>(list: T[]): T[] {
  return list.slice().sort((a, b) => (KIND_RANK[a.kind] ?? 9) - (KIND_RANK[b.kind] ?? 9) || a.id - b.id)
}

/** 一批会话 → 页面用的形状（顺手查站名、绑定人、待发条数；都是批量查询） */
export async function toConvDTOs(rows: BotConversation[]): Promise<ConvDTO[]> {
  if (!rows.length) return []
  const ids = rows.map((r) => r.id)
  const [sites, boundAdmins, pend] = await Promise.all([
    loadSites(rows.map((r) => r.tenantId)),
    prisma.botAdmin.findMany({
      where: { id: { in: Array.from(new Set(rows.map((r) => r.boundBy).filter((x): x is number => !!x))) } },
      select: { id: true, name: true },
    }),
    prisma.botOutbox.groupBy({ by: ['conversationId'], where: { conversationId: { in: ids }, status: { in: ['PENDING', 'SENDING'] } }, _count: { _all: true } }),
  ])
  const adminName = new Map(boundAdmins.map((a) => [a.id, a.name]))
  const pending = new Map(pend.map((p) => [p.conversationId, p._count._all]))
  return rows.map((r) => ({
    id: r.id,
    adapter: r.adapter,
    externalId: r.externalId,
    name: r.name,
    kind: r.kind as ConvKind,
    tenantId: r.tenantId,
    site: r.tenantId ? sites.get(r.tenantId) ?? null : null,
    status: r.status as ConvStatus,
    allowT3: r.allowT3,
    subs: effectiveSubs(r.kind, r.subs),
    quietFrom: r.quietFrom,
    quietTo: r.quietTo,
    boundByName: r.boundBy ? adminName.get(r.boundBy) ?? `#${r.boundBy}` : null,
    boundAt: r.boundAt ? r.boundAt.toISOString() : null,
    lastSentAt: r.lastSentAt ? r.lastSentAt.toISOString() : null,
    failStreak: r.failStreak,
    pending: pending.get(r.id) ?? 0,
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function toConvDTO(row: BotConversation): Promise<ConvDTO> {
  return (await toConvDTOs([row]))[0]
}

/** 管理员 → 页面用的形状：带它名下的微信身份与站内账号；认领码只告诉页面「有没有、到几点」，哈希不出库 */
export async function toAdminDTOs(rows: BotAdmin[], now: Date = new Date()): Promise<AdminDTO[]> {
  if (!rows.length) return []
  const [identities, users] = await Promise.all([
    prisma.botAdminIdentity.findMany({ where: { adminId: { in: rows.map((r) => r.id) } }, orderBy: { id: 'asc' } }),
    prisma.user.findMany({
      where: { id: { in: Array.from(new Set(rows.map((r) => r.siteUserId).filter((x): x is number => !!x))) } },
      select: { id: true, email: true, nickname: true },
    }),
  ])
  const byAdmin = new Map<number, BotAdminIdentity[]>()
  identities.forEach((i) => {
    const list = byAdmin.get(i.adminId) ?? []
    list.push(i)
    byAdmin.set(i.adminId, list)
  })
  const userLabel = new Map(users.map((u) => [u.id, u.nickname || u.email || `用户#${u.id}`]))
  return rows.map((r) => {
    const claimPending = !!r.claimCodeHash && !!r.claimExpiresAt && r.claimExpiresAt.getTime() > now.getTime()
    return {
      id: r.id,
      name: r.name,
      siteUser: r.siteUserId ? { id: r.siteUserId, label: userLabel.get(r.siteUserId) ?? `用户#${r.siteUserId}` } : null,
      maxTier: r.maxTier,
      enabled: r.enabled,
      claimPending,
      claimExpiresAt: claimPending && r.claimExpiresAt ? r.claimExpiresAt.toISOString() : null,
      identities: (byAdmin.get(r.id) ?? []).map((i) => ({
        id: i.id,
        adapter: i.adapter,
        wxid: i.wxid,
        nickname: i.nickname,
        enabled: i.enabled,
        createdAt: i.createdAt.toISOString(),
      })),
      createdAt: r.createdAt.toISOString(),
    }
  })
}

export async function toAdminDTO(row: BotAdmin): Promise<AdminDTO> {
  return (await toAdminDTOs([row]))[0]
}
