/**
 * sms_config 的读写（docs/短信接码-设计.md §5.3、E59、附录 B 第 9 条）与目录同步状态 sms_catalog_at。
 *
 * 【fail-closed，只挡新单】行不存在 / JSON 坏 / 校验不过 / 查库出错 → 读取失败，调用方按「接码关闭」处理：
 * 新单、导航、sitemap、目录接口都不开；不回落出厂值。推一次 sms.alert（进程内 1 小时节流）。
 * 在途单的推进（S2 的 tick）不读这里：单级参数快照在 SmsOrder，全局运行参数走 runtimeParams()。
 *
 * 【两种读法】
 *   · readSmsConfig()：每次查库（后台、保存、目录同步用）；
 *   · readSmsConfigCached()：进程内缓存 60 秒（前台外壳、sitemap、目录接口用，§1.2「进程内缓存 60 秒；读取失败按关」）。
 *     保存成功时同一进程里立刻失效；单容器部署，没有别的进程要通知。
 *
 * 【sms_catalog_at 只有一个写入方】jiema-catalog（cron 与后台「从上游刷新」走同一个函数、同一把锁），整行覆盖不会冲掉别人（§5.3）。
 */
import { prisma } from '../db'
import {
  SMS_CONFIG_KEY,
  checkSmsConfig,
  smsConfigSaveBlockers,
  smsStoredVersionOf,
  FACTORY_SMS_CONFIG,
  type SmsConfig,
} from '../jiema-config-schema'
import { smsAlert } from './alert'

export { SMS_CONFIG_KEY }
export const SMS_CATALOG_AT_KEY = 'sms_catalog_at'
export const SMS_OPERATOR_NAMES_KEY = 'sms_operator_names'

export type SmsConfigRead =
  | { ok: true; config: SmsConfig; storedVersion: number }
  | { ok: false; reason: 'MISSING' | 'INVALID' | 'ERROR'; storedVersion: number; errors?: Record<string, string> }

// ───────────────────────── 运行参数（E59：配置坏了在途路径也不停摆） ─────────────────────────

let lastValid: SmsConfig | null = null

/**
 * 在途路径与监控用的全局运行参数：最后一次校验通过的配置；进程启动后还没读到过有效配置就用代码内置默认值（与出厂值相同，告警线 $2）。
 * **只给在途路径与监控用**（S2 的 tick、告警），新单、导航、sitemap 仍然 fail-closed。
 */
export function runtimeParams(): Pick<SmsConfig, 'limits' | 'upstream' | 'breaker' | 'autoHold'> {
  const c = lastValid ?? FACTORY_SMS_CONFIG
  return { limits: c.limits, upstream: c.upstream, breaker: c.breaker, autoHold: c.autoHold }
}

function alertBroken(reason: string, detail: string): void {
  smsAlert(`CONFIG_${reason}`, 'sms_config 读取失败', [
    { label: '影响', value: '新单、导航入口、sitemap、目录接口已按关闭处理（fail-closed）；已付款的在途单照常推进' },
    { label: '详情', value: detail.slice(0, 200) },
  ], { link: '/admin/jiema?tab=settings', throttleMs: 3600_000 })
}

/** 读当前配置（每次查库）。四种失败都返回 ok:false 并推 sms.alert（进程内 1 小时节流） */
export async function readSmsConfig(): Promise<SmsConfigRead> {
  let raw: string | null
  try {
    raw = (await prisma.setting.findUnique({ where: { key: SMS_CONFIG_KEY } }))?.value ?? null
  } catch (e) {
    console.error('[jiema] 读取 sms_config 失败', e)
    alertBroken('ERROR', (e as Error)?.message ?? String(e))
    return { ok: false, reason: 'ERROR', storedVersion: 0 }
  }
  if (raw == null) {
    alertBroken('MISSING', 'settings 里没有 sms_config（部署种子 scripts/ops/jiema-s1-seed.sql 没跑？）；到后台「短信接码 → 设置」点「填入出厂值」再保存一次即可')
    return { ok: false, reason: 'MISSING', storedVersion: 0 }
  }
  const storedVersion = smsStoredVersionOf(raw)
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    alertBroken('INVALID', '不是合法 JSON')
    return { ok: false, reason: 'INVALID', storedVersion }
  }
  const c = checkSmsConfig(parsed)
  if (!c.ok) {
    alertBroken('INVALID', JSON.stringify(c.errors))
    return { ok: false, reason: 'INVALID', storedVersion, errors: c.errors }
  }
  lastValid = c.config
  return { ok: true, config: c.config, storedVersion }
}

// ───────────────────────── 进程内 60 秒缓存 ─────────────────────────

const CACHE_MS = 60_000
let cached: { at: number; value: SmsConfig | null } | null = null
let inflight: Promise<SmsConfig | null> | null = null

/** 进程内缓存 60 秒的配置（读取失败按 null = 关闭，同样缓存，免得每个页面都去撞一次坏配置） */
export async function readSmsConfigCached(): Promise<SmsConfig | null> {
  const now = Date.now()
  if (cached && now - cached.at < CACHE_MS) return cached.value
  if (!inflight) {
    inflight = readSmsConfig()
      .then((r) => {
        const v = r.ok ? r.config : null
        cached = { at: Date.now(), value: v }
        return v
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/** 保存成功、测试切换配置后调用：下一次读取直接查库 */
export function invalidateSmsConfigCache(): void {
  cached = null
}

// ───────────────────────── 保存（后台「定价」「设置」） ─────────────────────────

export class SmsConfigConflict extends Error {
  constructor(public readonly storedBroken = false) {
    super(storedBroken ? '库里的配置已损坏，而且版本号与页面上的不一致（可能刚被别人改过），请刷新后再保存' : '配置已被别人改过，请刷新后再保存')
    this.name = 'SmsConfigConflict'
  }
}

/**
 * 保存。乐观并发：expectVersion 必须等于库里那一行的版本号（行不存在 / JSON 坏 / 没有合法 version 时为 0；校验不过但带 version 的行按它自己的），
 * 保存后 version = expectVersion + 1（快照进 SmsOrder.configVersion，只影响之后的单，§4.4）。
 * 校验不过、或有「做不到」的开关（smsConfigSaveBlockers）→ 返回 errors，不写库。
 */
export async function saveSmsConfig(
  input: Omit<SmsConfig, 'version'>,
  expectVersion: number,
): Promise<{ ok: true; config: SmsConfig; before: SmsConfig | null } | { ok: false; errors: Record<string, string> }> {
  const check = checkSmsConfig({ ...input, version: Math.max(expectVersion, 0) + 1 })
  if (!check.ok) return check
  const blockers = smsConfigSaveBlockers(check.config)
  if (Object.keys(blockers).length) return { ok: false, errors: blockers }
  const r = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ value: string }[]>`SELECT value FROM settings WHERE \`key\` = ${SMS_CONFIG_KEY} FOR UPDATE`
    let before: SmsConfig | null = null
    const curVersion = smsStoredVersionOf(rows[0]?.value)
    if (rows[0]) {
      try {
        const pc = checkSmsConfig(JSON.parse(rows[0].value))
        before = pc.ok ? pc.config : null
      } catch {
        before = null
      }
    }
    if (curVersion !== expectVersion) throw new SmsConfigConflict(!!rows[0] && before === null)
    const value = JSON.stringify(check.config)
    await tx.setting.upsert({ where: { key: SMS_CONFIG_KEY }, create: { key: SMS_CONFIG_KEY, value }, update: { value } })
    return { ok: true as const, config: check.config, before }
  })
  lastValid = r.config
  invalidateSmsConfigCache()
  return r
}

// ───────────────────────── 目录同步状态（写入方只有 jiema-catalog） ─────────────────────────

export interface CatalogState {
  /** 最近一次同步（任何一层）成功的时间 */
  catalogAt: string | null
  /** 静态目录（服务、国家、运营商、例外时长）最近一次成功 */
  staticAt: string | null
  /** 第 ① 层 getPrices 最近一次成功 */
  pricesAt: string | null
  /** getPrices 连续失败次数（≥3 → 降级：热门服务的起价取第 ② 层，其余「起价以实际为准」，E28） */
  pricesFails: number
  /** 最近一次运行（不论成败） */
  lastRunAt: string | null
  lastError: string | null
  /** sms_services.hot_rank 是否已按 sms_config.hotServices 初始化过（只做一次，之后以 hot_rank 为准） */
  hotInit: boolean
  counts: { services: number; countries: number; combos: number } | null
}

export const EMPTY_CATALOG_STATE: CatalogState = Object.freeze({
  catalogAt: null,
  staticAt: null,
  pricesAt: null,
  pricesFails: 0,
  lastRunAt: null,
  lastError: null,
  hotInit: false,
  counts: null,
}) as CatalogState

/** 纯函数：解析 sms_catalog_at 的原文（坏了按空状态：只影响「新鲜度」显示与降级判断） */
export function parseCatalogState(raw: string | null | undefined): CatalogState {
  if (!raw) return { ...EMPTY_CATALOG_STATE }
  try {
    const v = JSON.parse(raw) as Partial<CatalogState>
    const s = (x: unknown) => (typeof x === 'string' ? x : null)
    const c = v.counts && typeof v.counts === 'object' ? (v.counts as CatalogState['counts']) : null
    return {
      catalogAt: s(v.catalogAt),
      staticAt: s(v.staticAt),
      pricesAt: s(v.pricesAt),
      pricesFails: typeof v.pricesFails === 'number' && Number.isSafeInteger(v.pricesFails) && v.pricesFails >= 0 ? v.pricesFails : 0,
      lastRunAt: s(v.lastRunAt),
      lastError: s(v.lastError),
      hotInit: v.hotInit === true,
      counts: c && typeof c.services === 'number' ? { services: c.services, countries: Number(c.countries) || 0, combos: Number(c.combos) || 0 } : null,
    }
  } catch {
    return { ...EMPTY_CATALOG_STATE }
  }
}

export async function readCatalogState(): Promise<CatalogState> {
  const row = await prisma.setting.findUnique({ where: { key: SMS_CATALOG_AT_KEY } })
  return parseCatalogState(row?.value)
}

/** 整行覆盖写（唯一写入方 jiema-catalog，在它自己的锁里调用） */
export async function writeCatalogState(s: CatalogState): Promise<void> {
  const value = JSON.stringify(s)
  await prisma.setting.upsert({ where: { key: SMS_CATALOG_AT_KEY }, create: { key: SMS_CATALOG_AT_KEY, value }, update: { value } })
}

/** getPrices 连续失败达到这个次数就降级（E28） */
export const PRICES_DEGRADE_AFTER = 3
