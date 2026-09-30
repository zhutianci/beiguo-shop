/**
 * 店面解析（设计 4.4，v3 定稿）：Host → 店面。Host 只决定「店面」（可售商品、售价、营销开关、新订单归属），
 * 不决定「你是谁、你能管什么」——后者只来自数据库里的 TenantMember（设计 0.2）。
 *
 * 【七条要点】
 *  1. 主站 Host 走静态白名单（PLATFORM_HOSTS），**永不查库**：租户表出任何问题都不影响主站接单。
 *  2. 休眠（CHANNELS_ENABLED≠1）时任何 Host 都是主站、不查库：未配置渠道前完全休眠（设计 4.10）。
 *  3. 只有 `*.bigolab.com` 形式的 Host，以及登记过的自定义域名（tibo.pw 这类），才逐个查 tenant_domains，防随机 Host 刷库；
 *     进程内缓存 host → 租户（正 60 秒、负 10 秒、≤256 项 FIFO）。
 *     自定义域名集合（tenant_domains 里所有不以 CHANNEL_HOST_SUFFIX 结尾的 host，不论启停）常驻内存：60 秒 TTL、同一时刻只有一次加载，
 *     随机 Host 只对照这份集合、不逐个查库（docs/多渠道分销-自定义域名.md 第 2 节）。
 *  4. 已登记的渠道域名**永不回落主站**：域名停用 → null（404）、查库报错 → 抛（500）。
 *     回落会让渠道站按主站价卖货、订单记到主站。自定义域名集合加载失败同样抛（不能因为「没加载到」就把 tibo.pw 当主站渲染）。
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
 * 【自定义主域名的连通闸】Tenant.origin 是客户自己的域名（tibo.pw）时，店面的 origin / canonicalHost 只在连通校验健康时才用它，
 * 否则改用该渠道启用中的子域名（primaryGate；口径见 domain-health.ts）。子域名渠道不经过这一步、不多查一次库。
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
import { channelHostSuffix, channelsEnabled, hostStrict, isChannelCandidateHost, isCustomHostShape, normalizeHost, platformHosts } from './hosts'
import { ALERT_THROTTLE_MS, domainHealthKey, isDomainHealthStale, isDomainHealthy, parseDomainHealth } from './domain-health'
import { alertPlatform } from '../tenant/platform-alert'

export { normalizeHost } from './hosts'

export type StorefrontKind = 'PLATFORM' | 'CHANNEL'
export type TenantStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'
export interface Storefront {
  id: number
  code: string
  kind: StorefrontKind
  status: TenantStatus
  /**
   * 生效的站点地址。通常 = Tenant.origin；自定义域名是主域名、但连通校验不健康时（domain-health.ts）= 该渠道启用中的子域名，
   * 邮件、链接、跳转目标一起改走子域名，恢复后自动切回（库里的 Tenant.origin 不动）。
   */
  origin: string
  /**
   * 主域名（= new URL(origin).host 规范化后；解析不出为 ''）。渠道可以登记多个域名（子域名 + 自定义域名），
   * 只有这一个是主域名：系统邮件、邀请链接、metadataBase 都用 origin；在其他域名上打开前台 / 渠道后台页面时跳转过来
   * （primaryRedirectOrigin + PrimaryHostRedirect）。服务端专用，不进 toPublicStorefront（客户端用 new URL(origin).host 比对）。
   */
  canonicalHost: string
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
  const origin = siteOrigin()
  return { id: PLATFORM_TENANT_ID, code: 'main', kind: 'PLATFORM', status: 'ACTIVE', origin, canonicalHost: hostOfOrigin(origin), contact: { ...PLATFORM_CONTACT } }
}

/** origin 的规范化主机名；解析失败返回 ''（调用方把 '' 当成「不知道主域名」，一律不跳转） */
function hostOfOrigin(origin: string): string {
  try {
    return normalizeHost(new URL(origin).host) ?? ''
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// 数据访问：只用到 tenantDomain / tenant 两个模型的 findUnique，外加自定义域名集合的一次 findMany。
// 抽成一个可替换的对象，是为了 itest 能注入「一查就抛」的假库，验证「主站不查库」「渠道查库报错不回落」
// （设计 W0-2 / W0-3）。生产代码从不调用 setStorefrontDbForTest。
// ---------------------------------------------------------------------------
/** tenants 行里店面用到的列。support* 四列可缺省：itest 注入的假库（wp0 countingDb）只 select 前五列，缺省按「未设置」回退主站 */
type TenantStorefrontRow = { id: number; code: string; kind: string; status: string; origin: string } & TenantContactRow

interface StorefrontDb {
  findDomain(host: string): Promise<{ tenantId: number; status: number } | null>
  findTenant(id: number): Promise<TenantStorefrontRow | null>
  /** 自定义域名集合：tenant_domains 里所有不以 CHANNEL_HOST_SUFFIX 结尾的 host（不论启用或停用） */
  listCustomHosts(): Promise<string[]>
  /**
   * 只在渠道的 Tenant.origin 是自定义域名时调用：连通校验记录（settings 原值）+ 该渠道启用中的子域名（按 id 升序）。
   * 可缺省：itest 的假库（只有子域名渠道）不必实现，缺省时用真库。
   */
  loadPrimaryGate?(tenantId: number): Promise<PrimaryGateRow>
}
type PrimaryGateRow = { health: string | null; subHosts: string[] }

const realDb: StorefrontDb = {
  findDomain: (host) => prisma.tenantDomain.findUnique({ where: { host }, select: { tenantId: true, status: true } }),
  // 一个域名一行，全表也只有几十行：只取 host 一列、在进程里按后缀过滤，不依赖 LIKE 的转义与排序规则
  listCustomHosts: async () => {
    const suffix = channelHostSuffix()
    const rows = await prisma.tenantDomain.findMany({ select: { host: true } })
    return rows.map((r) => r.host).filter((h) => !h.endsWith(suffix))
  },
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
  loadPrimaryGate: async (tenantId) => {
    const suffix = channelHostSuffix()
    const [setting, domains] = await Promise.all([
      prisma.setting.findUnique({ where: { key: domainHealthKey(tenantId) }, select: { value: true } }),
      prisma.tenantDomain.findMany({ where: { tenantId, status: 1 }, orderBy: { id: 'asc' }, select: { host: true } }),
    ])
    return { health: setting?.value ?? null, subHosts: domains.map((d) => d.host).filter((h) => h.endsWith(suffix)) }
  },
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

/** 后台改域名 / 渠道状态后在同一进程调用（单容器部署，足够；多副本时各自 60 秒内收敛）。自定义域名集合一并清掉 */
export function invalidateStorefrontCache(): void {
  hostCache.clear()
  gateCache.clear()
  // staleAlerted 不清：它是告警节流，与缓存无关（每次后台写域名都清的话，节流就形同虚设）
  // 清集合时连「上一次成功加载」一起丢掉：刚改过域名，旧集合不能再拿来兜底（见 customHosts 的宽限期）；
  // 代号 +1 让清之前已经发出的那次加载即使晚到也不写回缓存
  customCache = null
  customLoading = null
  customGen++
}

// ---------------------------------------------------------------------------
// 自定义域名集合（docs/多渠道分销-自定义域名.md 第 2 节）
//  · 60 秒 TTL；同一时刻只有一次加载在进行，并发请求共用这一次（一波随机 Host 同时打进来也只查一次库）；
//  · 加载失败：上一次成功的集合在 TTL 过期后最多再沿用 5 分钟（记日志），降低数据库短暂抖动的影响；
//    从未成功过（或刚被 invalidate 清掉）就抛——调用方据此返回 500，绝不把可能是渠道的 Host 当主站渲染。
// ---------------------------------------------------------------------------
const CUSTOM_TTL_MS = 60_000
const CUSTOM_STALE_GRACE_MS = 5 * 60_000
let customCache: { hosts: ReadonlySet<string>; exp: number; staleUntil: number } | null = null
let customLoading: Promise<ReadonlySet<string>> | null = null
let customGen = 0
let customStaleLoggedAt = 0

async function customHosts(): Promise<ReadonlySet<string>> {
  if (customCache && Date.now() < customCache.exp) return customCache.hosts
  if (!customLoading) {
    const gen = customGen
    const suffix = channelHostSuffix()
    const p: Promise<ReadonlySet<string>> = db
      .listCustomHosts()
      .then((list) => {
        // 库里本来就存规范化后的 host；这里再规范化 + 过滤一次，假库或脏数据也不会把子域名混进来
        const hosts: ReadonlySet<string> = new Set(list.map((h) => normalizeHost(h)).filter((h): h is string => !!h && !h.endsWith(suffix)))
        const at = Date.now()
        if (gen === customGen) customCache = { hosts, exp: at + CUSTOM_TTL_MS, staleUntil: at + CUSTOM_TTL_MS + CUSTOM_STALE_GRACE_MS }
        return hosts
      })
      .finally(() => {
        if (customLoading === p) customLoading = null
      })
    customLoading = p
  }
  try {
    return await customLoading
  } catch (e) {
    const stale = customCache
    if (stale && Date.now() < stale.staleUntil) {
      if (Date.now() - customStaleLoggedAt > 60_000) {
        customStaleLoggedAt = Date.now()
        console.error('[storefront] 自定义域名集合加载失败，暂用上一次成功加载的集合（最多 5 分钟）：', (e as Error)?.message || e)
      }
      return stale.hosts
    }
    throw e
  }
}

// 未知 Host 日志：每个 Host 每小时最多一行（观察期用来统计现网真实 Host，设计 15.4 N 段），表本身也限容量
const unknownLogged = new Map<string, number>()
function logUnknownHost(host: string | null, mode: 'observe' | 'strict' | 'unregistered'): void {
  const key = host ?? '(none)'
  const now = Date.now()
  const last = unknownLogged.get(key)
  if (last !== undefined && now - last < 3_600_000) return
  if (unknownLogged.size >= 1000) unknownLogged.clear()
  unknownLogged.set(key, now)
  const how = mode === 'observe' ? '观察期按主站处理' : mode === 'strict' ? '严格期 404' : '形如域名但未登记，404'
  console.warn(`[storefront] 未知 Host（${how}）：${key.slice(0, 120)}`)
}

// ---------------------------------------------------------------------------
// 自定义主域名的连通闸（domain-health.ts 文件头；docs/多渠道分销-自定义域名.md 第 9 节）
//  · 只在 Tenant.origin 的主机名**不在** CHANNEL_HOST_SUFFIX 之下时才查（lulu、shop 这类子域名渠道一次都不查，行为逐字不变）；
//  · 每个渠道缓存 30 秒（校验记录 10 分钟才变一次；cron 与后台写完在同一进程 invalidateStorefrontCache() 立即生效）；
//  · 查库报错照常抛（500），与 findTenant 同一口径——不猜，也不回落主站；
//  · 不健康只因为「40 分钟没有成功记录」（cron 停了）时，给站长群告警一次（alertStaleOnce，每渠道 6 小时最多一次，不阻塞请求）。
// ---------------------------------------------------------------------------
const GATE_TTL_MS = 30_000
type Gate = { healthy: true } | { healthy: false; fallbackOrigin: string | null }
const gateCache = new Map<number, { host: string; gate: Gate; exp: number }>()
const gateLogged = new Map<number, number>()
/** 「校验记录过期」告警的节流：每渠道 6 小时最多一次（进程内；单容器部署，重启后最多多发一次，可以接受） */
const staleAlerted = new Map<number, number>()

/**
 * 定时任务停摆的告警（2026-10-01）：记录属于当前主域名、没降级，只是 40 分钟没有成功记录——说明没人在复验，多半是 cron 停了。
 * 这时店面已经安全地降级到子域名，但如果没人发现，客户的域名会一直「莫名其妙」不生效，所以提醒站长一次。
 * 不阻塞请求（不 await）；alertPlatform 本身永不抛，这里再兜一层只记日志。已停业（TERMINATED）的渠道 cron 本来就不再复验，不告警。
 */
function alertStaleOnce(t: TenantStorefrontRow, host: string, fallback: string | null): void {
  if (t.status === 'TERMINATED') return
  const now = Date.now()
  const last = staleAlerted.get(t.id)
  if (last !== undefined && now - last < ALERT_THROTTLE_MS) return
  if (staleAlerted.size >= HOST_CACHE_MAX) staleAlerted.clear()
  staleAlerted.set(t.id, now)
  const text =
    `渠道 ${t.code} 的自定义主域名 https://${host} 已超过 40 分钟没有成功的连通校验记录，店面已临时改用${fallback ? ` ${fallback}` : '（没有启用中的子域名，只停止跳转）'}。` +
    `多半是定时复验停了：请检查 cron 容器（docker ps、docker logs beiguo-cron）是否在跑、crontab 里是否有 tenant-domains 一行，` +
    `以及 POST /api/cron/tenant-domains 是否每 10 分钟返回 200。复验恢复并通过后自动切回。`
  void alertPlatform(text).catch((e) => console.error('[storefront] 校验记录过期告警发送失败', (e as Error)?.message || e))
}

async function primaryGate(t: TenantStorefrontRow, host: string): Promise<Gate> {
  const tenantId = t.id
  const hit = gateCache.get(tenantId)
  if (hit && hit.host === host && hit.exp > Date.now()) return hit.gate
  const row = await (db.loadPrimaryGate ?? realDb.loadPrimaryGate!)(tenantId)
  const health = parseDomainHealth(row.health)
  let gate: Gate
  if (isDomainHealthy(health, host)) {
    gate = { healthy: true }
  } else {
    const sub = row.subHosts.map((h) => normalizeHost(h)).find((h): h is string => !!h && isChannelCandidateHost(h))
    gate = { healthy: false, fallbackOrigin: sub ? `https://${sub}` : null }
    if (isDomainHealthStale(health, host)) alertStaleOnce(t, host, gate.fallbackOrigin)
    const last = gateLogged.get(tenantId) ?? 0
    if (Date.now() - last > 3_600_000) {
      gateLogged.set(tenantId, Date.now())
      console.error(
        `[storefront] 渠道 ${tenantId} 的自定义主域名 ${host} 连通校验不健康（${health?.host === host ? health.reason || '最近一次成功已过期' : '没有校验记录'}），` +
          (sub ? `暂时改用子域名 ${sub}` : '且没有启用中的子域名可以改用：停止跳转，链接仍用自定义域名'),
      )
    }
  }
  if (gateCache.size >= HOST_CACHE_MAX) gateCache.clear()
  gateCache.set(tenantId, { host, gate, exp: Date.now() + GATE_TTL_MS })
  return gate
}

async function toChannelStorefront(t: TenantStorefrontRow): Promise<Storefront | null> {
  // 数据行不合规一律不给店面（fail closed）：kind 必须是 CHANNEL、id ≥ 2、status 在枚举内、origin 非空
  if (t.kind !== 'CHANNEL' || t.id === PLATFORM_TENANT_ID || !TENANT_STATUSES.has(t.status) || !t.origin) {
    console.error(`[storefront] tenants 行不合规，按不存在处理：id=${t.id} kind=${t.kind} status=${t.status}`)
    return null
  }
  let origin = t.origin.replace(/\/+$/, '')
  let canonicalHost = hostOfOrigin(origin)
  // 主域名是自定义域名：必须有新鲜的连通校验记录，否则改用子域名（没有子域名可用时至少不跳转：canonicalHost = ''）
  if (canonicalHost && !canonicalHost.endsWith(channelHostSuffix())) {
    const gate = await primaryGate(t, canonicalHost)
    if (!gate.healthy) {
      if (gate.fallbackOrigin) {
        origin = gate.fallbackOrigin
        canonicalHost = hostOfOrigin(origin)
      } else {
        canonicalHost = ''
      }
    }
  }
  return {
    id: t.id,
    code: t.code,
    kind: 'CHANNEL',
    status: t.status as TenantStatus,
    origin,
    canonicalHost,
    // 回退规则的唯一实现（微信号 + 二维码成组回退；邮箱、服务时间各自回退；库里不合规的值按未设置处理）
    contact: resolveStoreContact(t),
  }
}

/**
 * 判定顺序（设计 4.4 表格 + docs/多渠道分销-自定义域名.md 第 2 节）：
 *   休眠                         → 任何 Host 都是主站，不查库
 *   主站白名单 Host              → 主站，不查库
 *   *.bigolab.com 一级子域       → 查 tenant_domains（见下）
 *   在自定义域名集合里           → 查 tenant_domains，后续与子域名同一套
 *   形如域名但未登记             → null（404）：观察期也不回落主站（2026-10-01 加固；nginx 已按 channel 放行这类 Host）
 *   其余（IP、不带点的 Host、非法 Host、a.b.bigolab.com 多级子域）/ 无 Host → 观察期：主站 + 日志；严格期：null
 *                                  （IP、不带点的 Host 永远登记不进来，不加载集合；其余 Host 只对照一次集合，不逐个查库）
 *   tenant_domains：登记且启用 → 渠道（再按主键查 tenants 行）；登记但域名停用 → null（404，不回落）；未登记 → null（404）
 *   查库报错（含自定义域名集合加载失败）→ 抛（500，不回落）
 */
export async function resolveStorefrontForHost(rawHost: string | null): Promise<Storefront | null> {
  if (!channelsEnabled()) return platformStorefront()

  const host = normalizeHost(rawHost)
  if (host && platformHosts().has(host)) return platformStorefront()

  const strict = hostStrict()
  // 自定义域名集合加载失败直接抛（customHosts 内部有 5 分钟宽限），不走下面的「未知 Host 当主站」
  const registered = !!host && (isChannelCandidateHost(host) || (isCustomHostShape(host) && (await customHosts()).has(host)))
  if (!host || !registered) {
    /*
     * 【形如域名却没登记：观察期也一律 404，绝不回落主站】（2026-10-01 加固，站长确认）
     * nginx 已把「形如域名的陌生 Host」与 *.bigolab.com 一级子域都按 channel 放行（接自定义域名不用改 nginx），
     * 这类 Host 在应用里若回落主站，就是设计 4.4 第 4 条禁止的「渠道流量落到主站」：
     * 例如站长先给隧道加了 tibo.pw 的路由、还没在后台登记，tibo.pw 上就会显示整份主站、按主站价下单、订单记到主站。
     * 观察期只留给 IP、不含点的 Host（服务器 IP 直连、容器名 app、cron）与非法 Host——它们永远不可能是渠道域名。
     */
    if (host && isCustomHostShape(host)) {
      logUnknownHost(host, 'unregistered')
      return null
    }
    logUnknownHost(host ?? (rawHost ? `(非法)${String(rawHost).slice(0, 60)}` : null), strict ? 'strict' : 'observe')
    return strict ? null : platformStorefront()
  }
  return resolveRegisteredHost(host)
}

/** 子域名与自定义域名共用：host → tenant_domains（带缓存）→ tenants 行（每请求查） */
async function resolveRegisteredHost(host: string): Promise<Storefront | null> {
  let entry = cacheGet(host)
  if (!entry) {
    // 查库报错直接抛：已登记的渠道域名绝不能因为数据库抖动回落成主站
    const d = await db.findDomain(host)
    entry = !d ? { kind: 'unknown' } : d.status === 1 ? { kind: 'tenant', tenantId: d.tenantId } : { kind: 'disabled' }
    cacheSet(host, entry)
  }

  if (entry.kind === 'disabled') return null
  if (entry.kind === 'unknown') {
    // 没登记的 *.bigolab.com 一级子域 / 自定义域名：同上，观察期也 404（nginx 按 channel 放行了它，回落主站就是串站）
    logUnknownHost(host, 'unregistered')
    return null
  }

  // 每请求按主键查 status（查库报错同样抛）
  const t = await db.findTenant(entry.tenantId)
  if (!t) {
    console.error(`[storefront] 域名 ${host} 指向不存在的租户 ${entry.tenantId}，按 404 处理`)
    return null
  }
  return await toChannelStorefront(t)
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

/**
 * 渠道店面在「非主域名」上被访问时返回主域名 origin，交给客户端组件 PrimaryHostRedirect 跳转；其余一律 null：
 * 主站（永远不跳）、当前就在主域名上、主域名解析不出。lulu、shop 这类只有子域名的渠道，主域名就是当前 Host，恒为 null——
 * 组件根本不挂（页面 DOM 与改造前相同）。只读 host 头（与 getStorefront 同一口径）。**不要包进 try**（headers() 见文件头第 7 条）。
 */
export function primaryRedirectOrigin(sf: Storefront): string | null {
  if (sf.kind !== 'CHANNEL' || !sf.canonicalHost) return null
  const host = normalizeHost(headers().get('host'))
  if (!host || host === sf.canonicalHost) return null
  return sf.origin
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
  return t ? await toChannelStorefront(t) : null
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
