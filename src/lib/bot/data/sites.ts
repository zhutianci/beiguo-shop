/**
 * 分站（渠道）的查询数据（docs/微信机器人-设计.md §7.3「分站」、§4.6、§6.2–6.3）：分站列表与站名、窗口内下单 / 成交、
 * 绑定的群、按「站名 / 渠道代码 / 域名」找分站、分站的域名与生效地址、分站群回复里用的渠道 origin。只读。
 * 余额与结算单在 settle.ts：指令层把两边拼起来，两个文件互不 import。
 *
 * 【站名】与 getTenantBrand（src/lib/tenant/brand.ts）同一条回退规则（brand-base 的 resolveStoreBrand）：渠道没设站名时是「贝果科技」，
 * 所以管理群里一律写「站名（渠道代码）」（§4.6 第 6 条）。这里直接用已经取到的 tenants 行算，不再逐个 storefrontById。
 */
import { prisma } from '../../db'
import { resolveStoreBrand } from '../../brand-base'
import { excludeTopup } from '../../order-scope'
import { storefrontById } from '../../storefront/resolve'
import { resolveSite, stripBrackets, TENANT_STATUS_LABEL } from '../resolve-site'
import { assertScope, centsOrNull, PLATFORM_TENANT_ID, requirePlatformScope, type BotScope, type TimeWindow } from './scope'

export interface SiteInfo {
  id: number
  code: string
  /** 站名：渠道自设的站名；没设 =「贝果科技」 */
  name: string
  /** 后台内部名称（tenants.name，不出现在前台；只在管理群里用来找站） */
  internalName: string
  /** 站名是不是渠道自己设的 */
  customName: boolean
  status: string
  statusLabel: string
  /** 超管暂停出结算单与打款（不影响下单） */
  payoutHold: boolean
}

const SITE_SELECT = { id: true, code: true, name: true, status: true, brandName: true, payoutHold: true } as const

function toSite(t: { id: number; code: string; name: string; status: string; brandName: string | null; payoutHold: boolean }): SiteInfo {
  const brand = resolveStoreBrand({ brandName: t.brandName })
  return {
    id: t.id,
    code: t.code,
    name: brand.name,
    internalName: t.name,
    customName: brand.custom,
    status: t.status,
    statusLabel: TENANT_STATUS_LABEL[t.status] ?? t.status,
    payoutHold: t.payoutHold,
  }
}

/** 管理群里的分站写法：站名（渠道代码） */
export function siteLabel(s: { name: string; code: string }): string {
  return `${s.name}（${s.code}）`
}

/** 全部渠道分站（kind = CHANNEL，含停业的），按 id 升序。渠道是个位数到几十个，整表取 */
export async function listChannelSites(scope: BotScope): Promise<SiteInfo[]> {
  requirePlatformScope(scope, '分站列表')
  const rows = await prisma.tenant.findMany({ where: { kind: 'CHANNEL' }, orderBy: { id: 'asc' }, take: 300, select: SITE_SELECT })
  return rows.map(toSite)
}

/** 一批分站的站名与代码（订单、待办里给渠道单标来源站）。主站 id 与非法 id 跳过 */
export async function siteNames(scope: BotScope, ids: number[]): Promise<Map<number, { code: string; name: string }>> {
  requirePlatformScope(scope, '分站名称')
  const out = new Map<number, { code: string; name: string }>()
  const uniq = Array.from(new Set(ids.filter((x) => Number.isInteger(x) && x !== PLATFORM_TENANT_ID)))
  if (!uniq.length) return out
  const rows = await prisma.tenant.findMany({ where: { id: { in: uniq } }, select: { id: true, code: true, brandName: true } })
  rows.forEach((t) => out.set(t.id, { code: t.code, name: resolveStoreBrand({ brandName: t.brandName }).name }))
  return out
}

export interface SiteDayStats {
  /** 下单数（含未付款），按 created_at */
  created: number
  /** 成交单数：paid_at 在窗口内且已付或已退款 */
  paid: number
  /** 成交额（分）：上述订单 Σ amount，渠道单就是渠道售价、不含税 */
  paidCents: number
}

/**
 * 一批分站在窗口内的下单 / 成交 / 成交额（口径同 §6.2、§6.3；排除余额充值的载体单）。
 * 分站范围下只算本站（传进来的别的 id 一律丢掉）。下单走 (tenant_id, created_at) 索引，成交走 (pay_status, paid_at) 索引；
 * 回来的是按分站分组后的几行，不取订单明细。
 */
export async function siteDayStats(scope: BotScope, w: TimeWindow, tenantIds: number[]): Promise<Map<number, SiteDayStats>> {
  assertScope(scope)
  const out = new Map<number, SiteDayStats>()
  const ids = Array.from(new Set(tenantIds.filter((id) => Number.isInteger(id) && id !== PLATFORM_TENANT_ID && (scope.tenantId === null || id === scope.tenantId))))
  if (!ids.length) return out
  const [created, paid] = await Promise.all([
    prisma.order.groupBy({
      by: ['tenantId'],
      where: { AND: [{ tenantId: { in: ids }, createdAt: { gte: w.from, lt: w.to } }, excludeTopup()] },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ['tenantId'],
      where: { AND: [{ tenantId: { in: ids }, payStatus: { in: ['PAID', 'REFUNDED'] }, paidAt: { gte: w.from, lt: w.to } }, excludeTopup()] },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ])
  const get = (id: number): SiteDayStats => {
    let v = out.get(id)
    if (!v) {
      v = { created: 0, paid: 0, paidCents: 0 }
      out.set(id, v)
    }
    return v
  }
  created.forEach((g) => (get(g.tenantId).created = g._count._all))
  paid.forEach((g) => {
    const v = get(g.tenantId)
    v.paid = g._count._all
    v.paidCents = centsOrNull(g._sum.amount) ?? 0
  })
  return out
}

export interface BoundGroup {
  id: number
  name: string | null
  status: string
}

/** 绑定这些分站的群（bot_conversations kind = TENANT、未解绑），按分站分组 */
export async function boundGroups(scope: BotScope, tenantIds: number[]): Promise<Map<number, BoundGroup[]>> {
  requirePlatformScope(scope, '分站绑定的群')
  const out = new Map<number, BoundGroup[]>()
  const ids = Array.from(new Set(tenantIds.filter((id) => Number.isInteger(id) && id !== PLATFORM_TENANT_ID)))
  if (!ids.length) return out
  const rows = await prisma.botConversation.findMany({
    where: { kind: 'TENANT', status: { not: 'REVOKED' }, tenantId: { in: ids } },
    orderBy: { id: 'asc' },
    take: 500,
    select: { id: true, name: true, tenantId: true, status: true },
  })
  rows.forEach((r) => {
    if (r.tenantId == null) return
    const arr = out.get(r.tenantId) ?? []
    arr.push({ id: r.id, name: r.name, status: r.status })
    out.set(r.tenantId, arr)
  })
  return out
}

export type SiteFind = { ok: true; site: SiteInfo } | { ok: false; error: string }

/** resolveSite 的报错是按「绑定」写的，查询时换个说法 */
function queryError(e: string): string {
  if (e.startsWith('这是主站域名')) return '这是主站域名；主站的数据请发「@贝果助手 今日」'
  return e.replace(/，不能绑定$/, '')
}

/**
 * 管理员输入 → 分站。顺序：渠道代码（不分大小写）→ 站名（渠道自设的站名或后台内部名称，必须唯一）→ 域名 / 网址（resolveSite，§4.6）。
 * 找不到、重名都返回原因，不猜。
 */
export async function findSiteForQuery(scope: BotScope, input: string): Promise<SiteFind> {
  requirePlatformScope(scope, '查分站')
  const q = stripBrackets(String(input ?? '')).replace(/\s+/g, ' ').trim()
  if (!q) return { ok: false, error: '请写站名、渠道代码或域名' }
  if (Array.from(q).length > 60) return { ok: false, error: '分站写得太长了' }
  const sites = await listChannelSites(scope)
  const lower = q.toLowerCase()
  const byCode = sites.find((s) => s.code.toLowerCase() === lower)
  if (byCode) return { ok: true, site: byCode }
  const byName = sites.filter((s) => (s.customName && s.name.trim().toLowerCase() === lower) || s.internalName.trim().toLowerCase() === lower)
  if (byName.length === 1) return { ok: true, site: byName[0] }
  if (byName.length > 1) return { ok: false, error: `有 ${byName.length} 个分站叫「${q}」，请改写渠道代码：${byName.map((s) => s.code).join('、')}` }
  if (q.includes('.') || q.includes('://')) {
    const r = await resolveSite(q)
    if (!r.ok) return { ok: false, error: queryError(r.error) }
    const hit = sites.find((s) => s.id === r.tenantId)
    return hit ? { ok: true, site: hit } : { ok: false, error: '找不到该分站' }
  }
  return { ok: false, error: `找不到分站「${q}」：可以写站名、渠道代码或域名` }
}

export interface SiteDomains {
  /** 生效的站点地址（storefrontById：自定义主域名连通校验不健康时是子域名）；取不到为 null */
  origin: string | null
  /** 登记的全部域名（主域名在前） */
  domains: Array<{ host: string; primary: boolean; enabled: boolean }>
}

/** 分站的域名与生效地址（分站详情） */
export async function siteDomains(scope: BotScope, tenantId: number): Promise<SiteDomains> {
  requirePlatformScope(scope, '分站域名')
  const [sf, rows] = await Promise.all([
    storefrontById(tenantId).catch(() => null),
    prisma.tenantDomain.findMany({ where: { tenantId }, orderBy: { id: 'asc' }, take: 20, select: { host: true, isPrimary: true, status: true } }),
  ])
  const domains = rows.map((d) => ({ host: d.host, primary: d.isPrimary, enabled: d.status !== 0 }))
  domains.sort((a, b) => Number(b.primary) - Number(a.primary))
  return { origin: sf && sf.kind === 'CHANNEL' ? sf.origin : null, domains }
}

/**
 * 分站群回复里的渠道后台链接用哪个域名：storefrontById(本站).origin（§5.4「渠道链接用渠道自己的 origin」）。
 * 管理群范围（null）没有「本站」，返回 null；取不到也返回 null（调用方就不带链接）。
 */
export async function channelOriginFor(scope: BotScope): Promise<string | null> {
  assertScope(scope)
  if (scope.tenantId === null) return null
  const sf = await storefrontById(scope.tenantId).catch(() => null)
  return sf && sf.kind === 'CHANNEL' && sf.id === scope.tenantId ? sf.origin : null
}
