/**
 * 短信接码 · 目录同步与三层价格缓存（docs/短信接码-设计.md §6.3、D21、D22、D26、D44、§5.4、E28）。
 *
 * | 层 | 来源 | 频率 | 存在哪 |
 * |---|---|---|---|
 * | 静态目录 | getServicesList、getCountries、getOperators、custom-durations | 每天 04:xx（从未同步过立即） | sms_services、sms_countries、sms_offer_cache(OPS / DUR, service='*') |
 * | ① 列表起价 | getPrices 全量 | 每 10 分钟 | sms_offer_cache(PRICES)，每个服务一行 {国家:[costMicro,count]}；只写 hash 变了的行 |
 * | ② 国家列表 | v1 offers?services=X | 热门服务 cron 预热；其余过期后先返回旧数据，**只有登录用户**触发后台刷新（refreshingAt CAS 单飞） | sms_offer_cache(OFFERS)；进程内 LRU 60 个 |
 * | ③ 报价 | v1 offers?services=X&countries=Y | 下单时（S2），进程内 60 秒 | 内存 |
 *
 * 【匿名访问不触发上游】爬虫刷目录只会读缓存；上游的目录车道留给付款后的取号（D22）。
 * 【列表价 = 下单价】价格一律经 pricing.priceCombo → salePriceCents（覆盖规则的 y 作为 markupCents），不下发成本（§6.3）。
 * 【不屏蔽任何平台】唯一的目录排除是 full（租号，不是接码服务，§0.6、§5.4）；手动下架（status=OFF）默认一个都没有（D25）。
 * 【地区命名】55 / 14 / 20 每次同步都强制写成「中国台湾 / 中国香港 / 中国澳门」，台湾不给旗帜（D44）。
 */
import crypto from 'crypto'
import { prisma } from '../db'
import * as up from './upstream'
import type { OffersData, OfferEntry } from './parse'
import { SERVICE_CODE_RE, FACTORY_SMS_CONFIG, type SmsConfig } from '../jiema-config-schema'
import {
  readSmsConfig,
  readCatalogState,
  writeCatalogState,
  PRICES_DEGRADE_AFTER,
  SMS_OPERATOR_NAMES_KEY,
  type CatalogState,
} from './config'
import {
  priceCombo,
  resolveRule,
  quoteCostMicro,
  offerSellable,
  offerStock,
  stockLevelOf,
  type OfferQuoteInput,
  type PricingConfigLike,
  type ComboPrice,
  type StockLevel,
} from './pricing'
import { comboBlock, globalHold, holdReasonText, loadGateData, type GateData } from './gate'
import { toCatalogCountry, toCatalogService, type CatalogCountry, type CatalogOperator, type CatalogService } from './dto'
import { smsAlert } from './alert'
import { acquireLock, releaseLock } from '../marketing/lock'
import servicesSeedJson from './seed/services-cn.json'
import countriesSeedJson from './seed/countries.json'
import operatorsSeedJson from './seed/operators.json'

// ───────────────────────── 常量 ─────────────────────────

/** 目录同步直接不写进 sms_services 的上游服务：full（Full rent，租号）不是接码服务（§0.6「明确不做」） */
export const EXCLUDED_SERVICES: ReadonlySet<string> = new Set(['full'])
/** 「其他服务 Any other」（热门列表最后固定一行，搜不到时引导到它） */
export const ANY_OTHER = 'ot'
/** 有效期展示：例外时长组合在真钱验证前一律 20 分钟（D42） */
export const DISPLAY_DURATION_MIN = 20
/** 第 ② 层 offers 过期（过了就先返回旧数据、登录用户触发后台刷新） */
export const OFFERS_STALE_MS = 5 * 60_000
/** 第 ② 层 offers 超过这个时长就不再拿来算价（退回第 ① 层）：cron 每 10 分钟预热热门，冷门的旧数据不能当真 */
export const OFFERS_USABLE_MS = 60 * 60_000
/** refreshingAt 单飞占用超过这么久视为上一次刷新的进程死了 */
const REFRESH_CLAIM_MS = 90_000
/** 服务多久没在上游列表里出现就不再列出（容忍一两次静态同步失败） */
const SERVICE_SEEN_WITHIN_MS = 3 * 86400_000
/** 目录超过这么久没同步成功 → sms.alert（§7.7） */
export const CATALOG_STALE_ALERT_MS = 60 * 60_000
/** 第 ② 层每个国家最多存几档 */
const MAX_TIERS = 12

const md5 = (s: string) => crypto.createHash('md5').update(s).digest('hex')
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s)

// ───────────────────────── 种子（纯函数，check / itest 直接测） ─────────────────────────

export interface ServiceSeed {
  code: string
  match: string
  cn: string
  aliases: string[]
}
const SERVICE_SEEDS: ReadonlyMap<string, ServiceSeed> = new Map(
  (servicesSeedJson as { services: ServiceSeed[] }).services.map((s) => [s.code, s]),
)

/** 这个上游服务的种子（代码对上、而且上游英文名包含 match 才采用：代码万一对错了宁可不填） */
export function seedForService(code: string, nameEn: string): ServiceSeed | null {
  const s = SERVICE_SEEDS.get(code)
  if (!s) return null
  return nameEn.toLowerCase().includes(s.match.toLowerCase()) ? s : null
}

export function allServiceSeeds(): ServiceSeed[] {
  return Array.from(SERVICE_SEEDS.values())
}

/** 别名列表 → 存库的逗号分隔串（去空、去重、总长 ≤500） */
export function joinAliases(list: readonly string[]): string | null {
  const seen = new Set<string>()
  const out: string[] = []
  let len = 0
  for (const raw of list) {
    const a = raw.replace(/[,，]/g, ' ').trim()
    if (!a || seen.has(a.toLowerCase())) continue
    if (len + a.length + (out.length ? 1 : 0) > 500) break
    seen.add(a.toLowerCase())
    out.push(a)
    len += a.length + (out.length > 1 ? 1 : 0)
  }
  return out.length ? out.join(',') : null
}

export function splitAliases(s: string | null | undefined): string[] {
  if (!s) return []
  return s
    .split(/[,，]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

type CountrySeedJson = { forced: Record<string, string>; noFlag: number[]; countries: Record<string, [string, string, string]> }
const COUNTRY_SEED = countriesSeedJson as unknown as CountrySeedJson
const NO_FLAG: ReadonlySet<number> = new Set(COUNTRY_SEED.noFlag)

export function countrySeed(id: number): { cn: string; iso2: string; dial: string } | null {
  const r = COUNTRY_SEED.countries[String(id)]
  return r ? { cn: r[0], iso2: r[1], dial: r[2] } : null
}

/** D44：上游 55 Taiwan、14 Hong Kong、20 Macao 固定显示为「中国台湾」「中国香港」「中国澳门」（后台不能改回） */
export function forcedCountryName(id: number): string | null {
  return COUNTRY_SEED.forced[String(id)] ?? null
}

/** 旗帜图标键：台湾不显示旗帜（D44）；没有 ISO2 的也没有 */
export function flagOf(id: number, iso2: string | null): string | null {
  if (NO_FLAG.has(id) || !iso2 || !/^[A-Za-z]{2}$/.test(iso2)) return null
  return iso2.toLowerCase()
}

const OPERATOR_SEED: Readonly<Record<string, string>> = (operatorsSeedJson as { names: Record<string, string> }).names

/** 运营商显示名：后台映射 > 出厂映射 > 代码首字母大写（下划线换空格） */
export function operatorDisplayName(code: string, custom: Readonly<Record<string, string>> | null): string {
  const c = custom?.[code]
  if (c && c.trim()) return c.trim()
  const s = OPERATOR_SEED[code]
  if (s) return s
  return code
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

// ───────────────────────── 缓存行的读写 ─────────────────────────

export interface OffersCountryRow {
  retail: number | null
  min: number | null
  defaultCnt: number | null
  /** [价格微美元, 数量]，按价格升序，最多 12 档 */
  tiers: Array<[number, number]>
}
export interface OffersRow {
  countries: Record<string, OffersCountryRow>
  /** 上游排序：deliv = 到达率（「推荐」标签），rate = 评分 */
  order: { deliv: number[]; rate: number[] }
}
/** 第 ① 层：{国家 id: [costMicro, count]} */
export type PricesRow = Record<string, [number, number]>

/** 纯函数：把 v1 offers 的一个服务压成第 ② 层的一行（只留报价要的字段，每行 ≤40KB） */
export function compactOffers(d: OffersData, service: string): OffersRow {
  const countries: Record<string, OffersCountryRow> = {}
  const byC = d.offers[service] ?? {}
  for (const [cid, e] of Object.entries(byC) as Array<[string, OfferEntry]>) {
    countries[cid] = {
      retail: e.retailMicro,
      min: e.minMicro,
      defaultCnt: e.defaultCount,
      tiers: e.tiers.slice(0, MAX_TIERS).map(([p, n]) => [p, n] as [number, number]),
    }
  }
  return { countries, order: { deliv: d.deliverability[service] ?? [], rate: d.rateCountries[service] ?? [] } }
}

export function offersRowInput(r: OffersCountryRow): OfferQuoteInput {
  return { retailMicro: r.retail, minMicro: r.min, defaultCount: r.defaultCnt, tiers: r.tiers }
}

/** 稳定序列化（键按数字升序）：hash 不因对象键顺序漂移 */
function stableJson(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort((a, b) => Number(a) - Number(b) || (a < b ? -1 : a > b ? 1 : 0))
  return `{${keys.map((k) => `${JSON.stringify(k)}:${JSON.stringify(obj[k])}`).join(',')}}`
}

function parseJson<T>(s: string | null | undefined): T | null {
  if (!s) return null
  try {
    return JSON.parse(s) as T
  } catch {
    return null
  }
}

// ───────────────────────── 静态目录同步 ─────────────────────────

function upErrText(r: { kind: string; code?: string; http?: number; reason?: string }): string {
  if (r.kind === 'err') return `err:${r.code}${r.http ? `(${r.http})` : ''}`
  if (r.kind === 'unknown') return `unknown:${r.reason ?? ''}`
  return r.kind
}

export interface StaticSyncResult {
  ok: boolean
  services: number
  newServices: number
  countries: number
  operators: boolean
  durations: boolean
  seedSkipped: string[]
  errors: string[]
  hotInitDone: boolean
}

/**
 * 同步静态目录。种子只填充空字段（后台改过的中文名 / 别名不覆盖）；status 一律不碰（后台改成 OFF 的不会被改回，§5.4）；
 * 55 / 14 / 20 的中文名每次都强制写（D44）。hotInit=false 时用 sms_config.hotServices 初始化一次 hot_rank。
 */
export async function syncStaticCatalog(now: Date, opts: { hotInit: boolean; hotServices: readonly string[] }): Promise<StaticSyncResult> {
  const res: StaticSyncResult = { ok: true, services: 0, newServices: 0, countries: 0, operators: false, durations: false, seedSkipped: [], errors: [], hotInitDone: false }

  // ---- 服务 ----
  const sl = await up.getServicesList()
  if (sl.kind !== 'ok') {
    res.ok = false
    res.errors.push(`getServicesList ${upErrText(sl)}`)
  } else {
    const seen = new Set<string>()
    const list: { code: string; name: string }[] = []
    for (const s of sl.data) {
      const code = s.code.trim()
      if (EXCLUDED_SERVICES.has(code) || !SERVICE_CODE_RE.test(code) || seen.has(code)) continue
      seen.add(code)
      list.push({ code, name: clip(s.name || code, 80) })
    }
    const existing = await prisma.smsService.findMany({ select: { code: true, nameEn: true, nameCn: true, aliases: true, popRank: true, hotRank: true } })
    const byCode = new Map(existing.map((e) => [e.code, e]))
    const creates: { code: string; nameEn: string; nameCn: string | null; aliases: string | null; popRank: number; seenAt: Date }[] = []
    const updates: { code: string; data: Record<string, unknown> }[] = []
    list.forEach((s, i) => {
      const pop = i + 1
      const seed = seedForService(s.code, s.name)
      if (!seed && SERVICE_SEEDS.has(s.code)) res.seedSkipped.push(`${s.code}（上游名「${s.name}」与种子不符）`)
      const ex = byCode.get(s.code)
      if (!ex) {
        creates.push({
          code: s.code,
          nameEn: s.name,
          nameCn: seed?.cn ? clip(seed.cn, 40) : null,
          aliases: seed ? joinAliases(seed.aliases) : null,
          popRank: pop,
          seenAt: now,
        })
        return
      }
      const data: Record<string, unknown> = {}
      if (ex.nameEn !== s.name) data.nameEn = s.name
      if (ex.popRank !== pop) data.popRank = pop
      if (ex.nameCn == null && seed?.cn) data.nameCn = clip(seed.cn, 40)
      if (ex.aliases == null && seed && seed.aliases.length) data.aliases = joinAliases(seed.aliases)
      if (Object.keys(data).length) updates.push({ code: s.code, data })
    })
    for (let i = 0; i < creates.length; i += 200) {
      await prisma.smsService.createMany({ data: creates.slice(i, i + 200), skipDuplicates: true })
    }
    for (const u of updates) await prisma.smsService.update({ where: { code: u.code }, data: u.data })
    const codes = list.map((s) => s.code)
    for (let i = 0; i < codes.length; i += 500) {
      await prisma.smsService.updateMany({ where: { code: { in: codes.slice(i, i + 500) } }, data: { seenAt: now } })
    }
    res.services = list.length
    res.newServices = creates.length
    // 热门：首次同步按 sms_config.hotServices 初始化 hot_rank（之后以 hot_rank 为准，后台「目录」可改）
    if (!opts.hotInit) {
      const anyHot = existing.some((e) => e.hotRank != null)
      if (!anyHot) {
        let rank = 1
        for (const code of opts.hotServices) {
          if (!seen.has(code)) continue
          await prisma.smsService.updateMany({ where: { code, hotRank: null }, data: { hotRank: rank } })
          rank++
        }
      }
      res.hotInitDone = true
    }
  }

  // ---- 国家/地区 ----
  const cs = await up.getCountries()
  if (cs.kind !== 'ok') {
    res.ok = false
    res.errors.push(`getCountries ${upErrText(cs)}`)
  } else {
    const existing = await prisma.smsCountry.findMany({ select: { id: true, nameEn: true, nameCn: true, iso2: true, dialCode: true } })
    const byId = new Map(existing.map((e) => [e.id, e]))
    const ids: number[] = []
    const idSet = new Set<number>()
    for (const c of cs.data) {
      if (idSet.has(c.id)) continue
      idSet.add(c.id)
      ids.push(c.id)
      const nameEn = clip((c.eng || `Country ${c.id}`).trim(), 80)
      const seed = countrySeed(c.id)
      const forced = forcedCountryName(c.id)
      const ex = byId.get(c.id)
      if (!ex) {
        await prisma.smsCountry.create({
          data: {
            id: c.id,
            nameEn,
            nameCn: forced ?? seed?.cn ?? null,
            iso2: seed?.iso2 ?? null,
            dialCode: seed?.dial ?? null,
            seenAt: now,
          },
        })
        continue
      }
      const data: Record<string, unknown> = { seenAt: now }
      if (ex.nameEn !== nameEn) data.nameEn = nameEn
      if (forced) {
        if (ex.nameCn !== forced) data.nameCn = forced
      } else if (ex.nameCn == null && seed?.cn) data.nameCn = seed.cn
      if (ex.iso2 == null && seed?.iso2) data.iso2 = seed.iso2
      if (ex.dialCode == null && seed?.dial) data.dialCode = seed.dial
      if (Object.keys(data).length > 1) await prisma.smsCountry.update({ where: { id: c.id }, data })
    }
    await prisma.smsCountry.updateMany({ where: { id: { in: ids } }, data: { seenAt: now } })
    // D44 兜底：种子之外万一有人手改库，也在每次同步时改回
    for (const [id, name] of Object.entries(COUNTRY_SEED.forced)) {
      await prisma.smsCountry.updateMany({ where: { id: Number(id), NOT: { nameCn: name } }, data: { nameCn: name } })
    }
    res.countries = ids.length
  }

  // ---- 运营商（全量，每天一次）----
  const ops = await up.getOperators()
  if (ops.kind === 'ok') {
    const data: Record<string, string[]> = {}
    for (const [cid, list] of Object.entries(ops.data.byCountry)) data[cid] = list.slice(0, 60)
    await writeCacheRow('*', 'OPS', stableJson(data), now, true)
    res.operators = true
  } else {
    res.ok = false
    res.errors.push(`getOperators ${upErrText(ops)}`)
  }

  // ---- 例外时长（只做后台参考；有效期以取号返回为准，D42）----
  const dur = await up.v1CustomDurations()
  if (dur.kind === 'ok') {
    await writeCacheRow('*', 'DUR', JSON.stringify(dur.data), now, true)
    res.durations = true
  } else {
    res.errors.push(`custom-durations ${upErrText(dur)}`)
  }
  return res
}

/** 写一行缓存；hash 没变且 touch=false 时不写（第 ① 层「只写 hash 变了的行」）。返回是否变了 */
async function writeCacheRow(service: string, kind: string, json: string, now: Date, touch: boolean): Promise<boolean> {
  const hash = md5(json)
  const ex = await prisma.smsOfferCache.findUnique({ where: { service_kind: { service, kind } }, select: { id: true, hash: true } })
  if (!ex) {
    try {
      await prisma.smsOfferCache.create({ data: { service, kind, data: json, hash, fetchedAt: now } })
    } catch (e) {
      if ((e as { code?: string })?.code !== 'P2002') throw e
      await prisma.smsOfferCache.update({ where: { service_kind: { service, kind } }, data: { data: json, hash, fetchedAt: now, refreshingAt: null } })
    }
    return true
  }
  if (ex.hash === hash) {
    if (touch) await prisma.smsOfferCache.update({ where: { id: ex.id }, data: { fetchedAt: now, refreshingAt: null } })
    return false
  }
  await prisma.smsOfferCache.update({ where: { id: ex.id }, data: { data: json, hash, fetchedAt: now, refreshingAt: null } })
  return true
}

// ───────────────────────── 第 ① 层：getPrices 全量 ─────────────────────────

export interface PricesSyncResult {
  ok: boolean
  services: number
  changed: number
  combos: number
  error?: string
}

/** 纯函数：getPrices 的 {国家:{服务:cell}} → {服务:{国家:[costMicro,count]}}（去掉 full、没货的、成本为 0 的） */
export function invertPrices(data: Record<string | number, Record<string, { costMicro: number; count: number }>>): Map<string, PricesRow> {
  const bySvc = new Map<string, PricesRow>()
  for (const [cid, svcs] of Object.entries(data)) {
    for (const [svc, cell] of Object.entries(svcs)) {
      if (EXCLUDED_SERVICES.has(svc) || !SERVICE_CODE_RE.test(svc)) continue
      if (!(cell.count > 0) || !(cell.costMicro > 0)) continue
      let row = bySvc.get(svc)
      if (!row) {
        row = {}
        bySvc.set(svc, row)
      }
      row[cid] = [cell.costMicro, cell.count]
    }
  }
  return bySvc
}

export async function syncPrices(now: Date): Promise<PricesSyncResult> {
  const r = await up.getPrices()
  if (r.kind !== 'ok') return { ok: false, services: 0, changed: 0, combos: 0, error: `getPrices ${upErrText(r)}` }
  const bySvc = invertPrices(r.data as Record<string, Record<string, { costMicro: number; count: number }>>)
  const heads = await prisma.smsOfferCache.findMany({ where: { kind: 'PRICES' }, select: { id: true, service: true, hash: true } })
  const headBy = new Map(heads.map((h) => [h.service, h]))
  const creates: { service: string; kind: string; data: string; hash: string; fetchedAt: Date }[] = []
  const updates: { id: number; data: string; hash: string }[] = []
  let combos = 0
  bySvc.forEach((row, svc) => {
    combos += Object.keys(row).length
    const json = stableJson(row)
    const hash = md5(json)
    const h = headBy.get(svc)
    if (!h) creates.push({ service: svc, kind: 'PRICES', data: json, hash, fetchedAt: now })
    else if (h.hash !== hash) updates.push({ id: h.id, data: json, hash })
  })
  // 上游不再报价的服务（全部售罄）：写成空对象，不留旧库存
  const empty = '{}'
  const emptyHash = md5(empty)
  for (const h of heads) if (!bySvc.has(h.service) && h.hash !== emptyHash) updates.push({ id: h.id, data: empty, hash: emptyHash })
  for (let i = 0; i < creates.length; i += 50) await prisma.smsOfferCache.createMany({ data: creates.slice(i, i + 50), skipDuplicates: true })
  for (const u of updates) await prisma.smsOfferCache.update({ where: { id: u.id }, data: { data: u.data, hash: u.hash, fetchedAt: now } })
  return { ok: true, services: bySvc.size, changed: creates.length + updates.length, combos }
}

// ───────────────────────── 第 ② 层：按服务的 offers ─────────────────────────

const EMPTY_OFFERS_JSON = JSON.stringify({ countries: {}, order: { deliv: [], rate: [] } } satisfies OffersRow)

export type RefreshResult = 'OK' | 'EMPTY' | 'BUSY' | 'FAILED'

/**
 * 刷新一个服务的第 ② 层（单飞：refreshingAt CAS，90 秒没放掉的占用视为进程已死）。上游 404 OFFER_NOT_FOUND = 这个服务全部售罄，写空行。
 * 其他失败保留旧数据、放掉占用。走目录车道（offers 全局 ≤1 RPS，429 按服务退避，S0）。
 */
export async function refreshOffers(service: string, now: Date = new Date()): Promise<RefreshResult> {
  if (!SERVICE_CODE_RE.test(service)) return 'FAILED'
  const staleClaim = new Date(now.getTime() - REFRESH_CLAIM_MS)
  let claimed =
    (
      await prisma.smsOfferCache.updateMany({
        where: { service, kind: 'OFFERS', OR: [{ refreshingAt: null }, { refreshingAt: { lt: staleClaim } }] },
        data: { refreshingAt: now },
      })
    ).count === 1
  if (!claimed) {
    const ex = await prisma.smsOfferCache.findUnique({ where: { service_kind: { service, kind: 'OFFERS' } }, select: { id: true } })
    if (ex) return 'BUSY'
    try {
      // 占位行：data 为空 = 「还没有数据」（读的一方按没有 offers 处理，不会当成全部售罄）
      await prisma.smsOfferCache.create({ data: { service, kind: 'OFFERS', data: '', hash: '', fetchedAt: new Date(0), refreshingAt: now } })
      claimed = true
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002') return 'BUSY'
      throw e
    }
  }
  const release = () => prisma.smsOfferCache.updateMany({ where: { service, kind: 'OFFERS', refreshingAt: now }, data: { refreshingAt: null } }).catch(() => {})
  try {
    const r = await up.v1Offers({ services: [service] })
    let json: string
    let result: RefreshResult
    if (r.kind === 'ok') {
      const row = compactOffers(r.data, service)
      json = JSON.stringify(row)
      result = Object.keys(row.countries).length ? 'OK' : 'EMPTY'
    } else if (r.kind === 'err' && r.code === 'OFFER_NOT_FOUND') {
      json = EMPTY_OFFERS_JSON
      result = 'EMPTY'
    } else {
      await release()
      return 'FAILED'
    }
    const fetchedAt = new Date()
    await prisma.smsOfferCache.updateMany({
      where: { service, kind: 'OFFERS' },
      data: { data: json, hash: md5(json), fetchedAt, refreshingAt: null },
    })
    offersLru.delete(service)
    return result
  } catch (e) {
    console.error('[jiema] 刷新 offers 失败', service, (e as Error)?.message)
    await release()
    return 'FAILED'
  }
}

/** 下单报价发现组合没货（404）时把这个服务的第 ② 层标脏：下次有人看就刷新（E6，S2 用） */
export async function markOffersDirty(service: string): Promise<void> {
  await prisma.smsOfferCache.updateMany({ where: { service, kind: 'OFFERS' }, data: { fetchedAt: new Date(0) } }).catch(() => {})
  offersLru.delete(service)
}

// ───────────────────────── 进程内缓存：列表摘要与 LRU ─────────────────────────

/** 第 ① 层摘要：[国家, costMicro, count] */
const pricesSum = new Map<string, { hash: string; entries: Array<[number, number, number]> }>()
/** 第 ② 层摘要：[国家, 报价成本|null（null = 这个国家不可售）]，只给列表的「起价」用 */
const offersSum = new Map<string, { hash: string; fetchedAt: number; entries: Array<[number, number | null]> }>()
let sumsCheckedAt = 0
let sumsInflight: Promise<void> | null = null

function offersSummaryOf(row: OffersRow): Array<[number, number | null]> {
  const out: Array<[number, number | null]> = []
  for (const [cid, r] of Object.entries(row.countries)) {
    const inp = offersRowInput(r)
    const cost = quoteCostMicro(inp)
    // 能不能卖与 cap 无关（报价成本 ≤ cap 恒成立，见 pricing.offerSellable 注释）；这里用成本本身当 cap 判
    out.push([Number(cid), cost != null && offerSellable(inp, cost) ? cost : null])
  }
  return out
}

/** 按 hash 增量刷新两个摘要（两条轻查询看 hash，只拉变了的行；15 秒内最多一次） */
export async function refreshSummaries(force = false): Promise<void> {
  if (!force && Date.now() - sumsCheckedAt < 15_000) return
  if (sumsInflight) return sumsInflight
  sumsInflight = (async () => {
    const heads = await prisma.smsOfferCache.findMany({ where: { kind: { in: ['PRICES', 'OFFERS'] } }, select: { service: true, kind: true, hash: true, fetchedAt: true } })
    const needP: string[] = []
    const needO: string[] = []
    const liveP = new Set<string>()
    const liveO = new Set<string>()
    for (const h of heads) {
      if (h.kind === 'PRICES') {
        liveP.add(h.service)
        if (pricesSum.get(h.service)?.hash !== h.hash) needP.push(h.service)
      } else if (h.hash) {
        liveO.add(h.service)
        const cur = offersSum.get(h.service)
        if (cur?.hash !== h.hash) needO.push(h.service)
        else cur.fetchedAt = h.fetchedAt.getTime()
      }
    }
    pricesSum.forEach((_, k) => {
      if (!liveP.has(k)) pricesSum.delete(k)
    })
    offersSum.forEach((_, k) => {
      if (!liveO.has(k)) offersSum.delete(k)
    })
    for (let i = 0; i < needP.length; i += 100) {
      const rows = await prisma.smsOfferCache.findMany({ where: { kind: 'PRICES', service: { in: needP.slice(i, i + 100) } }, select: { service: true, hash: true, data: true } })
      for (const r of rows) {
        const row = parseJson<PricesRow>(r.data) ?? {}
        const entries: Array<[number, number, number]> = []
        for (const [cid, v] of Object.entries(row)) if (Array.isArray(v) && v.length >= 2) entries.push([Number(cid), Number(v[0]), Number(v[1])])
        pricesSum.set(r.service, { hash: r.hash, entries })
      }
    }
    for (let i = 0; i < needO.length; i += 50) {
      const rows = await prisma.smsOfferCache.findMany({ where: { kind: 'OFFERS', service: { in: needO.slice(i, i + 50) } }, select: { service: true, hash: true, data: true, fetchedAt: true } })
      for (const r of rows) {
        const row = parseJson<OffersRow>(r.data)
        if (!row || !row.countries) continue
        offersSum.set(r.service, { hash: r.hash, fetchedAt: r.fetchedAt.getTime(), entries: offersSummaryOf(row) })
      }
    }
    sumsCheckedAt = Date.now()
  })().finally(() => {
    sumsInflight = null
  })
  return sumsInflight
}

/** 第 ② 层整行的进程内 LRU（国家列表用，60 个服务） */
const offersLru = new Map<string, { hash: string; fetchedAt: number; row: OffersRow }>()
const LRU_MAX = 60

async function loadOffersRow(service: string): Promise<{ row: OffersRow; fetchedAt: number } | null> {
  const head = await prisma.smsOfferCache.findUnique({ where: { service_kind: { service, kind: 'OFFERS' } }, select: { hash: true, fetchedAt: true } })
  if (!head || !head.hash) return null
  const hit = offersLru.get(service)
  if (hit && hit.hash === head.hash) {
    offersLru.delete(service)
    offersLru.set(service, { ...hit, fetchedAt: head.fetchedAt.getTime() })
    return { row: hit.row, fetchedAt: head.fetchedAt.getTime() }
  }
  const full = await prisma.smsOfferCache.findUnique({ where: { service_kind: { service, kind: 'OFFERS' } }, select: { hash: true, fetchedAt: true, data: true } })
  const row = parseJson<OffersRow>(full?.data)
  if (!full || !row || !row.countries) return null
  offersLru.set(service, { hash: full.hash, fetchedAt: full.fetchedAt.getTime(), row })
  while (offersLru.size > LRU_MAX) {
    const k = offersLru.keys().next()
    if (k.done) break
    offersLru.delete(k.value)
  }
  return { row, fetchedAt: full.fetchedAt.getTime() }
}

async function loadPricesRow(service: string): Promise<PricesRow | null> {
  const r = await prisma.smsOfferCache.findUnique({ where: { service_kind: { service, kind: 'PRICES' } }, select: { data: true } })
  return parseJson<PricesRow>(r?.data)
}

/** 测试用：清空进程内缓存 */
export function resetCatalogCachesForTest(): void {
  pricesSum.clear()
  offersSum.clear()
  offersLru.clear()
  sumsCheckedAt = 0
  snapshot = null
  quoteCache.clear()
}

// ───────────────────────── 列表：服务目录快照 ─────────────────────────

export function pricingOf(cfg: SmsConfig): PricingConfigLike {
  return {
    saleCoef4: cfg.saleCoef4,
    markupCents: cfg.markupCents,
    minPriceCents: cfg.minPriceCents,
    rounding: cfg.rounding,
    costFx4: cfg.costFx4,
    tolerancePct: cfg.tolerancePct,
    minMarginCents: cfg.minMarginCents,
  }
}

/** 一个组合的价（列表、国家列表、预览、下单共用）：覆盖规则按 §4.3 解析后走 priceCombo → salePriceCents */
export function comboPrice(costMicro: number | null, gate: Pick<GateData, 'rules'>, service: string, country: number, cfg: SmsConfig): ComboPrice | null {
  const rule = resolveRule(gate.rules, service, country, { markupCents: cfg.markupCents, tolerancePct: cfg.tolerancePct })
  return priceCombo(costMicro, rule, pricingOf(cfg))
}

export interface CatalogSnapshot {
  services: CatalogService[]
  anyOther: CatalogService | null
  /** 目录最近一次同步成功的时间（页面「价格每 10 分钟更新」那句旁边的新鲜度） */
  updatedAt: string | null
  /** 超过 60 分钟没同步成功 */
  stale: boolean
  /** getPrices 连续失败已降级（E28） */
  degraded: boolean
  /** 全局停售中（熔断等）：页面显示「接码服务维护中」 */
  maintenance: boolean
}

/**
 * 纯函数：一个服务的「¥x 起」（§1.5、§12.1 第 99 条）。只在可售组合里取：去掉 gate ①–④ 判不可售的（手动下架的服务 / 国家、
 * svc: / country: / combo: / global 停售、disabled 规则）与没货的；价格一律走 comboPrice → salePriceCents（与下单价同一个函数）。
 *  · OFFERS：entries 是 [国家, 报价成本|null]（报价成本按 §4.2：defaultPrice=0 用最低有货档），页面写「¥x 起」；
 *  · PRICES：entries 是 [国家, getPrices 的 cost, count]，页面写「约 ¥x 起」（approx=true）。
 * 一个可售组合都没有 → level=OUT（「暂无号码」）。
 */
export function serviceFromPrice(
  src: { kind: 'OFFERS'; entries: ReadonlyArray<readonly [number, number | null]> } | { kind: 'PRICES'; entries: ReadonlyArray<readonly [number, number, number]> },
  gate: GateData,
  service: string,
  cfg: SmsConfig,
  now: Date,
): { fromCents: number | null; approx: boolean; level: 'OK' | 'OUT' } {
  let from: number | null = null
  const consider = (cid: number, cost: number | null) => {
    if (cost == null || comboBlock(gate, service, cid, now, cfg)) return
    const p = comboPrice(cost, gate, service, cid, cfg)
    if (p && (from == null || p.priceCents < from)) from = p.priceCents
  }
  if (src.kind === 'OFFERS') for (const [cid, cost] of src.entries) consider(cid, cost)
  else for (const [cid, cost, count] of src.entries) if (count > 0) consider(cid, cost)
  return { fromCents: from, approx: src.kind === 'PRICES' && from != null, level: from == null ? 'OUT' : 'OK' }
}

let snapshot: { at: number; version: number; value: CatalogSnapshot } | null = null
const SNAPSHOT_MS = 60_000

/** 后台改了目录、规则、停售、配置后调用：下一次请求重建快照 */
export function invalidateCatalogSnapshot(): void {
  snapshot = null
  sumsCheckedAt = 0
}

/**
 * 服务列表快照（进程内 60 秒；配置版本变了立刻重建）。「¥x 起」只在可售组合里取（去掉 gate ①–④ 判不可售的组合），
 * 有第 ② 层 offers（60 分钟内）的服务按 offers 的报价成本、「¥x 起」；否则按第 ① 层 getPrices 的 cost、「约 ¥x 起」（§1.5、§6.3）。
 * getPrices 已降级时：有 offers 的照常，其余 fromCents=null、level=UNKNOWN（「起价以实际为准」，E28）。
 */
export async function catalogSnapshot(cfg: SmsConfig, now: Date = new Date()): Promise<CatalogSnapshot> {
  if (snapshot && now.getTime() - snapshot.at < SNAPSHOT_MS && snapshot.version === cfg.version) return snapshot.value
  await refreshSummaries()
  const [rows, gate, state] = await Promise.all([
    prisma.smsService.findMany({
      where: { status: 'ON', seenAt: { gte: new Date(now.getTime() - SERVICE_SEEN_WITHIN_MS) } },
      orderBy: [{ popRank: 'asc' }, { code: 'asc' }],
      select: { code: true, nameEn: true, nameCn: true, aliases: true, hotRank: true },
    }),
    loadGateData(),
    readCatalogState(),
  ])
  const degraded = state.pricesFails >= PRICES_DEGRADE_AFTER
  const g = globalHold(gate, now)
  const services: CatalogService[] = []
  let anyOther: CatalogService | null = null
  for (const s of rows) {
    const o = offersSum.get(s.code)
    const useOffers = !!o && (degraded || now.getTime() - o.fetchedAt < OFFERS_USABLE_MS)
    const f = useOffers && o
      ? serviceFromPrice({ kind: 'OFFERS', entries: o.entries }, gate, s.code, cfg, now)
      : !degraded
        ? serviceFromPrice({ kind: 'PRICES', entries: pricesSum.get(s.code)?.entries ?? [] }, gate, s.code, cfg, now)
        : { fromCents: null, approx: false, level: 'UNKNOWN' as const }
    const from = f.fromCents
    const approx = f.approx
    const level = f.level
    const dto = toCatalogService({
      code: s.code,
      name: s.nameCn || s.nameEn,
      en: s.nameEn,
      aliases: splitAliases(s.aliases),
      hot: s.hotRank,
      fromCents: from,
      approx,
      level,
    })
    if (s.code === ANY_OTHER) anyOther = dto
    services.push(dto)
  }
  const updatedAt = state.catalogAt
  const value: CatalogSnapshot = {
    services,
    anyOther,
    updatedAt,
    stale: !updatedAt || now.getTime() - Date.parse(updatedAt) > CATALOG_STALE_ALERT_MS,
    degraded,
    maintenance: !!g,
  }
  snapshot = { at: now.getTime(), version: cfg.version, value }
  return value
}

// ───────────────────────── 列表：一个服务的国家/地区 ─────────────────────────

export interface CountryListResult {
  service: { code: string; name: string; en: string }
  durationMin: number
  countries: CatalogCountry[]
  sort: { recommended: number[] }
  /** 数据来自哪一层：OFFERS（有库存等级与推荐排序）/ PRICES（只「有货」）/ NONE（还没有任何价格数据） */
  source: 'OFFERS' | 'PRICES' | 'NONE'
  /** 第 ② 层已过期或还没有（调用方决定要不要触发后台刷新：只有登录用户才触发） */
  needsRefresh: boolean
  maintenance: boolean
}

/** 纯函数：「推荐」排序 —— 先按上游到达率（deliv），再按评分（rate），其余按价格；「紧张」往后挪一位；售罄、暂停的排最后 */
export function recommendedOrder(
  rows: ReadonlyArray<Pick<CatalogCountry, 'id' | 'priceCents' | 'level' | 'paused'> & { boost?: number }>,
  order: { deliv: readonly number[]; rate: readonly number[] },
): number[] {
  const rankD = new Map(order.deliv.map((id, i) => [id, i]))
  const rankR = new Map(order.rate.map((id, i) => [id, i]))
  const BIG = 1_000_000
  const buyable = (r: (typeof rows)[number]) => r.level !== 'OUT' && !r.paused && r.priceCents != null
  const key = (r: (typeof rows)[number]) =>
    rankD.has(r.id) ? (rankD.get(r.id) as number) : rankR.has(r.id) ? BIG + (rankR.get(r.id) as number) : 2 * BIG + (r.priceCents ?? BIG)
  const good = rows.filter(buyable).slice()
  good.sort((a, b) => (b.boost ?? 0) - (a.boost ?? 0) || key(a) - key(b) || a.id - b.id)
  // 「紧张」的组合往后挪一位（§1.6）：从后往前扫，遇到 LOW 就和它后面那个非 LOW 的换位
  for (let i = good.length - 2; i >= 0; i--) {
    if (good[i].level === 'LOW' && good[i + 1].level !== 'LOW') {
      const t = good[i]
      good[i] = good[i + 1]
      good[i + 1] = t
    }
  }
  const rest = rows.filter((r) => !buyable(r)).slice().sort((a, b) => a.id - b.id)
  return [...good.map((r) => r.id), ...rest.map((r) => r.id)]
}

/**
 * 纯函数：这次国家列表请求要不要在后台刷新第 ② 层（D22）：数据过期或还没有，**而且是登录用户**。
 * 匿名访问一律不触发上游（爬虫刷目录只读缓存）；S2 再加「近 24 小时有人下过单的服务」。
 */
export function refreshTriggerAllowed(needsRefresh: boolean, userId: number | null): boolean {
  return needsRefresh && userId != null
}

export async function catalogCountries(service: string, cfg: SmsConfig, now: Date = new Date()): Promise<CountryListResult | null> {
  if (!SERVICE_CODE_RE.test(service)) return null
  const svc = await prisma.smsService.findUnique({ where: { code: service }, select: { code: true, nameEn: true, nameCn: true, status: true, seenAt: true } })
  if (!svc || svc.status !== 'ON' || now.getTime() - svc.seenAt.getTime() > SERVICE_SEEN_WITHIN_MS) return null
  const [gate, state, offers] = await Promise.all([loadGateData(), readCatalogState(), loadOffersRow(service)])
  const degraded = state.pricesFails >= PRICES_DEGRADE_AFTER
  const offersAge = offers ? now.getTime() - offers.fetchedAt : Infinity
  const useOffers = !!offers && (degraded || offersAge < OFFERS_USABLE_MS)
  const prices = useOffers ? null : await loadPricesRow(service)
  const ids = useOffers && offers ? Object.keys(offers.row.countries).map(Number) : prices ? Object.keys(prices).map(Number) : []
  const countries = ids.length
    ? await prisma.smsCountry.findMany({ where: { id: { in: ids }, status: 'ON' }, select: { id: true, nameEn: true, nameCn: true, iso2: true, dialCode: true, sortBoost: true } })
    : []
  const g = globalHold(gate, now)
  const out: Array<CatalogCountry & { boost: number }> = []
  for (const c of countries) {
    let costMicro: number | null = null
    let stock: number | null = null
    let level: StockLevel = 'OUT'
    let price: ComboPrice | null = null
    if (useOffers && offers) {
      const r = offers.row.countries[String(c.id)]
      const inp = r ? offersRowInput(r) : null
      costMicro = inp ? quoteCostMicro(inp) : null
      price = comboPrice(costMicro, gate, service, c.id, cfg)
      if (inp && price && offerSellable(inp, price.capMicro)) {
        stock = offerStock(inp, price.capMicro)
        level = stockLevelOf(stock, true)
        if (level === 'OUT') stock = null
      } else {
        stock = null
        level = 'OUT'
      }
    } else if (prices) {
      const v = prices[String(c.id)]
      costMicro = v ? v[0] : null
      price = comboPrice(costMicro, gate, service, c.id, cfg)
      level = price && v && v[1] > 0 ? 'AVAILABLE' : 'OUT'
    }
    const block = comboBlock(gate, service, c.id, now, cfg)
    out.push({
      ...toCatalogCountry({
        id: c.id,
        name: c.nameCn || c.nameEn,
        en: c.nameEn,
        iso2: c.iso2,
        flag: flagOf(c.id, c.iso2),
        dial: c.dialCode,
        priceCents: price ? price.priceCents : null,
        approx: !useOffers,
        stock,
        level,
        tags: [],
        durationMin: DISPLAY_DURATION_MIN,
        paused: block ? holdReasonText(block, now) : null,
      }),
      boost: c.sortBoost,
    })
  }
  let recommended: number[] = []
  if (useOffers && offers) {
    recommended = recommendedOrder(out, offers.row.order)
    // 「推荐」标签：到达率排名前 3、而且现在能买的
    const buyable = new Set(out.filter((r) => r.level !== 'OUT' && !r.paused && r.priceCents != null).map((r) => r.id))
    const top = offers.row.order.deliv.filter((id) => buyable.has(id)).slice(0, 3)
    for (const r of out) if (top.includes(r.id)) r.tags.push('推荐')
  }
  const countriesDto = out.map((r) => toCatalogCountry(r))
  return {
    service: { code: svc.code, name: svc.nameCn || svc.nameEn, en: svc.nameEn },
    durationMin: DISPLAY_DURATION_MIN,
    countries: countriesDto,
    sort: { recommended },
    source: useOffers ? 'OFFERS' : prices ? 'PRICES' : 'NONE',
    needsRefresh: !offers || offersAge >= OFFERS_STALE_MS,
    maintenance: !!g,
  }
}

// ───────────────────────── 运营商 ─────────────────────────

export async function readOperatorNames(): Promise<Record<string, string>> {
  const row = await prisma.setting.findUnique({ where: { key: SMS_OPERATOR_NAMES_KEY } })
  const v = parseJson<Record<string, unknown>>(row?.value)
  const out: Record<string, string> = {}
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (typeof x === 'string' && x.trim()) out[k] = x.trim().slice(0, 40)
  return out
}

/** 一个国家/地区的运营商（每天同步一次的 getOperators 全量；这个国家没有运营商数据 → 空，页面就不出现「运营商」） */
export async function catalogOperators(service: string, country: number): Promise<CatalogOperator[] | null> {
  if (!SERVICE_CODE_RE.test(service) || !Number.isInteger(country) || country < 0 || country > 999) return null
  const [svc, ctry, ops, names] = await Promise.all([
    prisma.smsService.findUnique({ where: { code: service }, select: { status: true } }),
    prisma.smsCountry.findUnique({ where: { id: country }, select: { status: true } }),
    prisma.smsOfferCache.findUnique({ where: { service_kind: { service: '*', kind: 'OPS' } }, select: { data: true } }),
    readOperatorNames(),
  ])
  if (!svc || svc.status !== 'ON' || !ctry || ctry.status !== 'ON') return null
  const map = parseJson<Record<string, string[]>>(ops?.data) ?? {}
  const list = Array.isArray(map[String(country)]) ? map[String(country)] : []
  return list.filter((c) => typeof c === 'string' && /^[a-z0-9_]{1,40}$/i.test(c) && c !== 'any').map((code) => ({ code, name: operatorDisplayName(code, names) }))
}

// ───────────────────────── 第 ③ 层：下单报价（S2 用；S1 用来核对「列表价 = 下单价」） ─────────────────────────

const quoteCache = new Map<string, { at: number; entry: OfferQuoteInput | null }>()
const QUOTE_TTL_MS = 60_000

export type QuoteResult =
  | { ok: true; costMicro: number; priceCents: number; capMicro: number; markupCents: number; tolerancePct: number; ruleKey: string | null; configVersion: number; saleCoef4: number; costFx4: number }
  | { ok: false; code: 'SOLD_OUT' | 'QUOTE_FAILED' | 'HOLD' | 'MAINTENANCE' }

/**
 * 实时报价（锁价用，§4.2、D22 第 ③ 层）：拉这个组合的 offers（进程内 60 秒），报价成本同 §4.2，售价走同一个 salePriceCents。
 * 没货（404 或 cap 内没有档位）→ SOLD_OUT 并把第 ② 层标脏（E6，不停售组合）。gate 只查列表层 ①–④（S2 在下单时另查 ⑤⑥）。
 */
export async function quote(service: string, country: number, cfg: SmsConfig, now: Date = new Date()): Promise<QuoteResult> {
  const gate = await loadGateData()
  const block = comboBlock(gate, service, country, now, cfg)
  if (block) return { ok: false, code: block.code }
  const key = `${service}:${country}`
  let hit = quoteCache.get(key)
  if (!hit || now.getTime() - hit.at >= QUOTE_TTL_MS) {
    const r = await up.v1Offers({ services: [service], countries: [country] })
    if (r.kind === 'ok') {
      const e = r.data.offers[service]?.[country]
      hit = { at: now.getTime(), entry: e ? { retailMicro: e.retailMicro, minMicro: e.minMicro, defaultCount: e.defaultCount, tiers: e.tiers } : null }
    } else if (r.kind === 'err' && r.code === 'OFFER_NOT_FOUND') {
      hit = { at: now.getTime(), entry: null }
    } else {
      return { ok: false, code: 'QUOTE_FAILED' }
    }
    quoteCache.set(key, hit)
    if (quoteCache.size > 500) {
      const k = quoteCache.keys().next()
      if (!k.done) quoteCache.delete(k.value)
    }
  }
  const cost = hit.entry ? quoteCostMicro(hit.entry) : null
  const p = comboPrice(cost, gate, service, country, cfg)
  if (!hit.entry || !p || !offerSellable(hit.entry, p.capMicro)) {
    await markOffersDirty(service)
    return { ok: false, code: 'SOLD_OUT' }
  }
  return { ok: true, costMicro: p.costMicro, priceCents: p.priceCents, capMicro: p.capMicro, markupCents: p.markupCents, tolerancePct: p.tolerancePct, ruleKey: p.ruleKey, configVersion: cfg.version, saleCoef4: cfg.saleCoef4, costFx4: cfg.costFx4 }
}

// ───────────────────────── 目录任务（cron jiema-catalog 与后台「从上游刷新」共用） ─────────────────────────

export interface CatalogJobResult {
  ran: boolean
  busy?: boolean
  static?: StaticSyncResult
  prices?: PricesSyncResult
  warmed: Array<{ service: string; result: RefreshResult }>
  services: number
  changed: number
  state: CatalogState
}

/** 北京时间的小时（容器 TZ 不可靠，按 UTC+8 自己算） */
function bjHour(d: Date): number {
  return new Date(d.getTime() + 8 * 3600_000).getUTCHours()
}

/** 纯函数：这一趟要不要同步静态目录（从未同步过；北京时间 04 点且上次超过 20 小时；或者超过 26 小时兜底） */
export function staticDue(staticAt: string | null, now: Date): boolean {
  if (!staticAt) return true
  const age = now.getTime() - Date.parse(staticAt)
  if (!Number.isFinite(age)) return true
  if (age > 26 * 3600_000) return true
  return bjHour(now) === 4 && age > 20 * 3600_000
}

/**
 * 跑一趟目录任务（锁 `jiema:catalog`，同一时刻只有一个；sms_catalog_at 只有它写）：
 * 静态目录（到点才跑，或 forceStatic）→ 第 ① 层 getPrices → 预热热门服务的第 ② 层 → 写同步状态；超过 60 分钟没成功推 sms.alert。
 */
export async function runCatalogJob(opts: { forceStatic?: boolean; skipPrices?: boolean; warm?: boolean; now?: Date } = {}): Promise<CatalogJobResult> {
  const now = opts.now ?? new Date()
  const token = await acquireLock('jiema:catalog', 5 * 60_000)
  if (!token) return { ran: false, busy: true, warmed: [], services: 0, changed: 0, state: await readCatalogState() }
  try {
    const state = await readCatalogState()
    const out: CatalogJobResult = { ran: true, warmed: [], services: 0, changed: 0, state }
    const cfgRead = await readSmsConfig()
    const hotServices = cfgRead.ok ? cfgRead.config.hotServices : FACTORY_SMS_CONFIG.hotServices
    const errors: string[] = []
    let anyOk = false
    if (opts.forceStatic || staticDue(state.staticAt, now)) {
      const st = await syncStaticCatalog(now, { hotInit: state.hotInit, hotServices })
      out.static = st
      if (st.hotInitDone) state.hotInit = true
      if (st.ok) {
        state.staticAt = now.toISOString()
        anyOk = true
      }
      errors.push(...st.errors)
    }
    if (!opts.skipPrices) {
      const pr = await syncPrices(now)
      out.prices = pr
      if (pr.ok) {
        state.pricesAt = now.toISOString()
        state.pricesFails = 0
        anyOk = true
        out.services = pr.services
        out.changed = pr.changed
        const [svcCount, ctyCount] = await Promise.all([prisma.smsService.count({ where: { status: 'ON' } }), prisma.smsCountry.count({ where: { status: 'ON' } })])
        state.counts = { services: svcCount, countries: ctyCount, combos: pr.combos }
      } else {
        state.pricesFails += 1
        errors.push(pr.error ?? 'getPrices 失败')
      }
    }
    if (opts.warm !== false) {
      const hot = await prisma.smsService.findMany({ where: { status: 'ON', hotRank: { not: null } }, orderBy: { hotRank: 'asc' }, select: { code: true }, take: 40 })
      const codes = hot.map((h) => h.code)
      if (!codes.includes(ANY_OTHER)) codes.push(ANY_OTHER)
      for (const code of codes) {
        const r = await refreshOffers(code, new Date())
        out.warmed.push({ service: code, result: r })
        if (r === 'OK' || r === 'EMPTY') anyOk = true
      }
    }
    if (anyOk) state.catalogAt = now.toISOString()
    state.lastRunAt = now.toISOString()
    state.lastError = errors.length ? errors.join('；').slice(0, 500) : null
    await writeCatalogState(state)
    out.state = state
    invalidateCatalogSnapshot()
    const lastOk = state.catalogAt ? Date.parse(state.catalogAt) : 0
    if (now.getTime() - lastOk > CATALOG_STALE_ALERT_MS) {
      smsAlert('CATALOG_STALE', '目录超过 60 分钟没同步成功', [
        { label: '最近成功', value: state.catalogAt ?? '从未' },
        { label: '错误', value: (state.lastError ?? '—').slice(0, 200) },
        { label: '影响', value: '列表价格可能过期；下单时以实时报价为准' },
      ])
    }
    if (state.pricesFails === PRICES_DEGRADE_AFTER) {
      smsAlert('PRICES_DEGRADED', 'getPrices 连续失败，列表起价已降级', [{ label: '连续失败', value: String(state.pricesFails) }, { label: '影响', value: '热门服务的起价改取国家列表缓存，其余显示「起价以实际为准」；下单报价不受影响' }])
    }
    return out
  } finally {
    await releaseLock('jiema:catalog', token)
  }
}
