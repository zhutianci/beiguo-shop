/**
 * 店面解析（设计 4.4，v3 定稿）：Host → 店面。Host 只决定「店面」（可售商品、售价、营销开关、新订单归属），
 * 不决定「你是谁、你能管什么」——后者只来自数据库里的 TenantMember（设计 0.2）。
 *
 * 【七条要点】
 *  1. 主站 Host 走静态白名单（PLATFORM_HOSTS），**永不查库**：租户表出任何问题都不影响主站接单。
 *  2. 休眠（CHANNELS_ENABLED≠1）时任何 Host 都是主站、不查库：未配置渠道前完全休眠（设计 4.10）。
 *  3. 只有 `*.bigolab.com` 形式的 Host 才查库，防随机 Host 刷库；进程内缓存 host → 租户（正 60 秒、负 10 秒、≤256 项 FIFO）。
 *  4. 已登记的渠道域名**永不回落主站**：域名停用 → null（404）、查库报错 → 抛（500）。
 *     回落会让渠道站按主站价卖货、订单记到主站。
 *  5. Host 只读 `host` 头：不用 NextURL 上的主机名（standalone 下是 0.0.0.0:3000），也不信 X-Forwarded-Host 头（边界检查规则 9 全仓禁读）。
 *  6. 按请求记忆：同一请求内 headers() 返回同一对象，用 WeakMap<Headers, Promise> 记忆，RSC 与 Route Handler 都有效。
 *  7. **getStorefront() 必须在任何 try 之外调用**：构建期它（经 headers()）抛 DynamicServerError 把页面转为动态；
 *     被 catch 吞掉会让页面按主站结果被预渲染后发给所有 Host。确需 try 时 catch 第一行 rethrowNextInternal(e)。
 *     notFound() / redirect() 同理。
 *
 * 【渠道 status 每请求查库】缓存的只是「host → tenantId」这层映射；tenants 行（status、origin、code）每个请求按主键查一次，
 * 后台把渠道改成 SUSPENDED / TERMINATED 下一个请求就生效（同一请求内由第 6 条记忆，只查一次）。
 *
 * 【异步路径】到账履约、cron、邮件、webhook **永不从 Host 取租户**，一律 storefrontById(order.tenantId)。
 *
 * 不 import 'server-only'：本仓库没有安装该包（Next 构建时自带别名，但 tsx 直接跑 scripts/itest-* 会找不到模块）。
 * 本文件 import 了 prisma 与 next/headers，客户端组件误引会在构建期直接失败，效果等同。
 */
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { prisma } from '../db'
import { error } from '../api'
import { siteOrigin } from '../news/format'
import { PLATFORM_CONTACT, resolveStoreContact, type StoreContact, type TenantContactRow } from '../contact-base'
import { channelsEnabled, hostStrict, isChannelCandidateHost, normalizeHost, platformHosts } from './hosts'

export { normalizeHost } from './hosts'

export type StorefrontKind = 'PLATFORM' | 'CHANNEL'
export type TenantStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'
export interface Storefront {
  id: number
  code: string
  kind: StorefrontKind
  status: TenantStatus
  origin: string
  /**
   * 客服信息（二期改动 4.1）：主站 = PLATFORM_CONTACT（常量，不查库）；渠道 = tenants 行的 support* 四列按回退规则算出
   * （src/lib/contact-base.ts resolveStoreContact）。公开数据，toPublicStorefront 显式映射给客户端。**不塞进 features。**
   */
  contact: StoreContact
}
export const PLATFORM_TENANT_ID = 1

const TENANT_STATUSES: ReadonlySet<string> = new Set(['DRAFT', 'ACTIVE', 'SUSPENDED', 'TERMINATED'])

/** 主站店面：常量，不查库（主站分支零依赖新表） */
export function platformStorefront(): Storefront {
  return { id: PLATFORM_TENANT_ID, code: 'main', kind: 'PLATFORM', status: 'ACTIVE', origin: siteOrigin(), contact: { ...PLATFORM_CONTACT } }
}

// ---------------------------------------------------------------------------
// 数据访问：只用到 tenantDomain / tenant 两个模型的 findUnique。
// 抽成一个可替换的对象，是为了 itest 能注入「一查就抛」的假库，验证「主站不查库」「渠道查库报错不回落」
// （设计 W0-2 / W0-3）。生产代码从不调用 setStorefrontDbForTest。
// ---------------------------------------------------------------------------
/** tenants 行里店面用到的列。support* 四列可缺省：itest 注入的假库（wp0 countingDb）只 select 前五列，缺省按「未设置」回退主站 */
type TenantStorefrontRow = { id: number; code: string; kind: string; status: string; origin: string } & TenantContactRow

interface StorefrontDb {
  findDomain(host: string): Promise<{ tenantId: number; status: number } | null>
  findTenant(id: number): Promise<TenantStorefrontRow | null>
}

const realDb: StorefrontDb = {
  findDomain: (host) => prisma.tenantDomain.findUnique({ where: { host }, select: { tenantId: true, status: true } }),
  // 客服四列与 status 同一次主键查询取出（二期改动 4.1）：不增加查询次数，后台改完下一个请求就生效
  findTenant: (id) =>
    prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        kind: true,
        status: true,
        origin: true,
        supportWechat: true,
        supportQrUrl: true,
        supportEmail: true,
        supportHours: true,
      },
    }),
}
let db: StorefrontDb = realDb

/** 仅供 scripts/itest-tenant 使用：注入假库（传 null 恢复真库），同时清空缓存 */
export function setStorefrontDbForTest(fake: StorefrontDb | null): void {
  db = fake ?? realDb
  invalidateStorefrontCache()
}

// ---------------------------------------------------------------------------
// host → 租户映射缓存（正 60 秒、负 10 秒、最多 256 项，满了按插入顺序淘汰最早的）
// ---------------------------------------------------------------------------
type HostEntry = { kind: 'tenant'; tenantId: number } | { kind: 'disabled' } | { kind: 'unknown' }
const POSITIVE_TTL_MS = 60_000
const NEGATIVE_TTL_MS = 10_000
const HOST_CACHE_MAX = 256
const hostCache = new Map<string, { entry: HostEntry; exp: number }>()

function cacheGet(host: string): HostEntry | null {
  const hit = hostCache.get(host)
  if (!hit) return null
  if (hit.exp <= Date.now()) {
    hostCache.delete(host)
    return null
  }
  return hit.entry
}

function cacheSet(host: string, entry: HostEntry): void {
  if (hostCache.has(host)) hostCache.delete(host)
  while (hostCache.size >= HOST_CACHE_MAX) {
    const oldest = hostCache.keys().next()
    if (oldest.done) break
    hostCache.delete(oldest.value)
  }
  hostCache.set(host, { entry, exp: Date.now() + (entry.kind === 'unknown' ? NEGATIVE_TTL_MS : POSITIVE_TTL_MS) })
}

/** 后台改域名 / 渠道状态后在同一进程调用（单容器部署，足够；多副本时各自 60 秒内收敛） */
export function invalidateStorefrontCache(): void {
  hostCache.clear()
}

// 未知 Host 日志：每个 Host 每小时最多一行（观察期用来统计现网真实 Host，设计 15.4 N 段），表本身也限容量
const unknownLogged = new Map<string, number>()
function logUnknownHost(host: string | null, mode: 'observe' | 'strict'): void {
  const key = host ?? '(none)'
  const now = Date.now()
  const last = unknownLogged.get(key)
  if (last !== undefined && now - last < 3_600_000) return
  if (unknownLogged.size >= 1000) unknownLogged.clear()
  unknownLogged.set(key, now)
  console.warn(`[storefront] 未知 Host（${mode === 'observe' ? '观察期按主站处理' : '严格期 404'}）：${key.slice(0, 120)}`)
}

function toChannelStorefront(t: TenantStorefrontRow): Storefront | null {
  // 数据行不合规一律不给店面（fail closed）：kind 必须是 CHANNEL、id ≥ 2、status 在枚举内、origin 非空
  if (t.kind !== 'CHANNEL' || t.id === PLATFORM_TENANT_ID || !TENANT_STATUSES.has(t.status) || !t.origin) {
    console.error(`[storefront] tenants 行不合规，按不存在处理：id=${t.id} kind=${t.kind} status=${t.status}`)
    return null
  }
  return {
    id: t.id,
    code: t.code,
    kind: 'CHANNEL',
    status: t.status as TenantStatus,
    origin: t.origin.replace(/\/+$/, ''),
    // 回退规则的唯一实现（微信号 + 二维码成组回退；邮箱、服务时间各自回退；库里不合规的值按未设置处理）
    contact: resolveStoreContact(t),
  }
}

/**
 * 判定顺序（设计 4.4 表格）：
 *   休眠                         → 任何 Host 都是主站，不查库
 *   主站白名单 Host              → 主站，不查库
 *   非 *.bigolab.com / 无 Host   → 观察期：主站 + 日志（不查库）；严格期：null
 *   *.bigolab.com                → 查 tenant_domains：
 *        登记且启用              → 渠道（再按主键查 tenants 行）
 *        登记但域名停用          → null（404，不回落）
 *        未登记                  → 观察期：主站 + 日志；严格期：null
 *   查库报错                     → 抛（500，不回落）
 */
export async function resolveStorefrontForHost(rawHost: string | null): Promise<Storefront | null> {
  if (!channelsEnabled()) return platformStorefront()

  const host = normalizeHost(rawHost)
  if (host && platformHosts().has(host)) return platformStorefront()

  const strict = hostStrict()
  if (!host || !isChannelCandidateHost(host)) {
    logUnknownHost(host ?? (rawHost ? `(非法)${String(rawHost).slice(0, 60)}` : null), strict ? 'strict' : 'observe')
    return strict ? null : platformStorefront()
  }

  let entry = cacheGet(host)
  if (!entry) {
    // 查库报错直接抛：已登记的渠道域名绝不能因为数据库抖动回落成主站
    const d = await db.findDomain(host)
    entry = !d ? { kind: 'unknown' } : d.status === 1 ? { kind: 'tenant', tenantId: d.tenantId } : { kind: 'disabled' }
    cacheSet(host, entry)
  }

  if (entry.kind === 'disabled') return null
  if (entry.kind === 'unknown') {
    logUnknownHost(host, strict ? 'strict' : 'observe')
    return strict ? null : platformStorefront()
  }

  // 每请求按主键查 status（查库报错同样抛）
  const t = await db.findTenant(entry.tenantId)
  if (!t) {
    console.error(`[storefront] 域名 ${host} 指向不存在的租户 ${entry.tenantId}，按 404 处理`)
    return null
  }
  return toChannelStorefront(t)
}

// 按请求记忆：key 是 headers() 返回的对象（同一请求内恒为同一个），请求结束后随之被回收
const perRequest = new WeakMap<object, Promise<Storefront | null>>()

/**
 * 当前请求的店面。**在任何 try 之外调用**（见文件头第 7 条）。
 * null = 该 Host 没有店面（严格期未知 Host、域名停用、租户行不合规）：页面应 notFound()，接口应 404。
 */
export function getStorefront(): Promise<Storefront | null> {
  const h = headers()
  let p = perRequest.get(h)
  if (!p) {
    p = resolveStorefrontForHost(h.get('host'))
    perRequest.set(h, p)
  }
  return p
}

/** DRAFT 期预览：只放行 Tenant.previewUserIds 里的登录用户（设计 4.4）。主站恒为 false（主站永远不是 DRAFT） */
export async function isPreviewUser(tenantId: number, userId: number | null | undefined): Promise<boolean> {
  if (tenantId === PLATFORM_TENANT_ID || !Number.isInteger(tenantId) || tenantId < 2) return false
  if (typeof userId !== 'number' || !Number.isInteger(userId) || userId <= 0) return false
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { previewUserIds: true } })
  const ids = t?.previewUserIds
  return Array.isArray(ids) && ids.some((x) => x === userId)
}

/**
 * 前台页面用：null → notFound；DRAFT 且 userId 不在 previewUserIds → notFound；
 * SUSPENDED / TERMINATED **照常返回**（由外壳显示暂停营业横幅 / 停业页，买家的订单、取卡、留言照常，设计 6.7）。
 * userId 由调用方传入（storefront 不 import auth，避免循环依赖）。不要包进 try。
 */
export async function requireShopStorefront(opt?: { userId?: number | null }): Promise<Storefront> {
  const sf = await getStorefront()
  if (!sf) notFound()
  if (sf.status === 'DRAFT' && !(await isPreviewUser(sf.id, opt?.userId ?? null))) notFound()
  return sf
}

/** 异步路径用：租户永远从数据行来。id=1 直接给主站常量（不查库）；渠道行不存在或不合规 → null */
export async function storefrontById(id: number): Promise<Storefront | null> {
  if (id === PLATFORM_TENANT_ID) return platformStorefront()
  if (!Number.isInteger(id) || id < 2) return null
  const t = await db.findTenant(id)
  return t ? toChannelStorefront(t) : null
}

/**
 * 关闭模块的 API 第一行：`const d = await denyOnChannel(); if (d) return d`（不要包进 try）。
 * 渠道 Host（以及没有店面的 Host）→ 404 JSON；主站 → null（放行）。休眠时恒为 null，主站行为不变。
 */
export async function denyOnChannel(): Promise<Response | null> {
  const sf = await getStorefront()
  if (sf && sf.kind === 'PLATFORM') return null
  return error('资源不存在', 404)
}

/** 关闭模块的 page / layout 第一行：渠道 Host → notFound()（不要包进 try） */
export async function notFoundOnChannel(): Promise<void> {
  const sf = await getStorefront()
  if (!sf || sf.kind !== 'PLATFORM') notFound()
}
