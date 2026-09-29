/**
 * 短信接码后台「目录」「定价」的读写（docs/短信接码-设计.md §7.3、§7.4、§5.3 末段、§4.3、D13、D25、D44）。
 * 路由（/api/admin/jiema/*）第一行 adminGuard、改动写审计；这里只做校验与读写，返回改动前后给路由写审计。
 *
 * 【手动下架 / 停售是运维开关，出厂一个都没有】服务 / 国家 status=OFF 要填原因；覆盖规则 disabled；sms_holds 的 ADMIN 停售。
 * gate 三处都查（§6.1）。任何改动之后 invalidateCatalogSnapshot()，下一次列表请求立刻生效（单容器）。
 * 【55 / 14 / 20 的中文名只读】「中国台湾 / 中国香港 / 中国澳门」由同步强制写（D44），后台改不回去。
 */
import { prisma } from '../db'
import { SERVICE_CODE_RE } from '../jiema-config-schema'
import { centsOf } from '../wallet/buckets'
import {
  ANY_OTHER,
  countrySeed,
  forcedCountryName,
  flagOf,
  invalidateCatalogSnapshot,
  joinAliases,
  offersRowInput,
  OFFERS_USABLE_MS,
  splitAliases,
  type OffersRow,
  type PricesRow,
} from './catalog'
import { parseScopeKey, quoteCostMicro, offerSellable } from './pricing'
import { isHoldActive } from './gate'

export class AdminInputError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message)
    this.name = 'AdminInputError'
  }
}

const trimOrNull = (v: unknown, max: number, label: string): string | null => {
  if (v == null) return null
  if (typeof v !== 'string') throw new AdminInputError(`${label}必须是文字`)
  const t = v.trim()
  if (!t) return null
  if (t.length > max) throw new AdminInputError(`${label}最多 ${max} 个字`)
  return t
}

// ───────────────────────── 服务 ─────────────────────────

export interface AdminServiceRow {
  code: string
  nameEn: string
  nameCn: string | null
  aliases: string[]
  hotRank: number | null
  popRank: number
  status: string
  offNote: string | null
  seenAt: string
  /** 有货的国家/地区数（第 ② 层优先，没有就第 ① 层） */
  stockCountries: number
  /** 最低报价成本（微美元；后台才看得到） */
  minCostMicro: number | null
  source: 'OFFERS' | 'PRICES' | 'NONE'
}

function parseRow<T>(s: string | null | undefined): T | null {
  if (!s) return null
  try {
    return JSON.parse(s) as T
  } catch {
    return null
  }
}

/** 一个服务的「有货国家数、最低成本」（后台列表用；按页只查当前页的服务） */
async function availabilityOf(codes: string[]): Promise<Map<string, { n: number; min: number | null; source: 'OFFERS' | 'PRICES' | 'NONE' }>> {
  const out = new Map<string, { n: number; min: number | null; source: 'OFFERS' | 'PRICES' | 'NONE' }>()
  if (!codes.length) return out
  const rows = await prisma.smsOfferCache.findMany({ where: { service: { in: codes }, kind: { in: ['PRICES', 'OFFERS'] } }, select: { service: true, kind: true, data: true } })
  const offers = new Map<string, OffersRow>()
  const prices = new Map<string, PricesRow>()
  for (const r of rows) {
    if (r.kind === 'OFFERS') {
      const v = parseRow<OffersRow>(r.data)
      if (v?.countries) offers.set(r.service, v)
    } else {
      const v = parseRow<PricesRow>(r.data)
      if (v) prices.set(r.service, v)
    }
  }
  for (const c of codes) {
    const o = offers.get(c)
    if (o) {
      let n = 0
      let min: number | null = null
      for (const r of Object.values(o.countries)) {
        const inp = offersRowInput(r)
        const cost = quoteCostMicro(inp)
        if (cost == null || !offerSellable(inp, cost)) continue
        n++
        if (min == null || cost < min) min = cost
      }
      out.set(c, { n, min, source: 'OFFERS' })
      continue
    }
    const p = prices.get(c)
    if (p) {
      let n = 0
      let min: number | null = null
      for (const [cost, count] of Object.values(p)) {
        if (!(count > 0)) continue
        n++
        if (min == null || cost < min) min = cost
      }
      out.set(c, { n, min, source: 'PRICES' })
      continue
    }
    out.set(c, { n: 0, min: null, source: 'NONE' })
  }
  return out
}

export async function listServicesAdmin(q: { search?: string; status?: string; hot?: boolean; page?: number; pageSize?: number }): Promise<{ list: AdminServiceRow[]; total: number; page: number; totalPages: number }> {
  const page = Math.max(1, Math.floor(q.page ?? 1))
  const pageSize = Math.min(200, Math.max(1, Math.floor(q.pageSize ?? 50)))
  const s = (q.search ?? '').trim().slice(0, 40)
  const where: Record<string, unknown> = {}
  if (q.status === 'ON' || q.status === 'OFF') where.status = q.status
  if (q.hot) where.hotRank = { not: null }
  if (s) where.OR = [{ code: { contains: s } }, { nameEn: { contains: s } }, { nameCn: { contains: s } }, { aliases: { contains: s } }]
  const [total, rows] = await Promise.all([
    prisma.smsService.count({ where }),
    prisma.smsService.findMany({
      where,
      orderBy: q.hot ? [{ hotRank: 'asc' }] : [{ popRank: 'asc' }, { code: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])
  const av = await availabilityOf(rows.map((r) => r.code))
  return {
    list: rows.map((r) => {
      const a = av.get(r.code) ?? { n: 0, min: null, source: 'NONE' as const }
      return {
        code: r.code,
        nameEn: r.nameEn,
        nameCn: r.nameCn,
        aliases: splitAliases(r.aliases),
        hotRank: r.hotRank,
        popRank: r.popRank,
        status: r.status,
        offNote: r.offNote,
        seenAt: r.seenAt.toISOString(),
        stockCountries: a.n,
        minCostMicro: a.min,
        source: a.source,
      }
    }),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export interface ServicePatch {
  nameCn?: unknown
  aliases?: unknown
  hotRank?: unknown
  status?: unknown
  offNote?: unknown
}

/** 改一个服务（中文名、别名、热门序号、手动下架）。改成 OFF 必须填原因（写审计）；改回 ON 清空原因 */
export async function updateServiceAdmin(code: string, patch: ServicePatch): Promise<{ before: Record<string, unknown>; after: Record<string, unknown> }> {
  if (!SERVICE_CODE_RE.test(code)) throw new AdminInputError('服务代码不合法')
  const cur = await prisma.smsService.findUnique({ where: { code } })
  if (!cur) throw new AdminInputError('没有这个服务')
  const data: Record<string, unknown> = {}
  if ('nameCn' in patch) data.nameCn = trimOrNull(patch.nameCn, 40, '中文名')
  if ('aliases' in patch) {
    const list = Array.isArray(patch.aliases) ? patch.aliases.map(String) : typeof patch.aliases === 'string' ? splitAliases(patch.aliases) : patch.aliases == null ? [] : null
    if (list == null) throw new AdminInputError('别名格式不对（逗号分隔）', 'aliases')
    const joined = joinAliases(list.map((x) => x.slice(0, 40)))
    data.aliases = joined
  }
  if ('hotRank' in patch) {
    const v = patch.hotRank
    if (v == null || v === '') data.hotRank = null
    else {
      const n = Number(v)
      if (!Number.isInteger(n) || n < 1 || n > 999) throw new AdminInputError('热门序号是 1–999 的整数（留空 = 不是热门）', 'hotRank')
      data.hotRank = n
    }
  }
  if ('status' in patch) {
    if (patch.status !== 'ON' && patch.status !== 'OFF') throw new AdminInputError('状态只能是 ON 或 OFF', 'status')
    if (patch.status === 'OFF') {
      const note = trimOrNull(patch.offNote, 120, '下架原因')
      if (!note) throw new AdminInputError('手动下架必须填原因', 'offNote')
      data.status = 'OFF'
      data.offNote = note
    } else {
      data.status = 'ON'
      data.offNote = null
    }
  }
  if (!Object.keys(data).length) throw new AdminInputError('没有要改的内容')
  const after = await prisma.smsService.update({ where: { code }, data })
  invalidateCatalogSnapshot()
  const pick = (r: typeof cur) => ({ nameCn: r.nameCn, aliases: r.aliases, hotRank: r.hotRank, status: r.status, offNote: r.offNote })
  return { before: pick(cur), after: pick(after) }
}

/** CSV（导出与导入同一套列）：code,nameEn,nameCn,aliases,hotRank,status。导入只改 nameCn / aliases / hotRank（下架要逐个填原因，不走批量） */
export const SERVICE_CSV_HEADER = ['code', 'nameEn', 'nameCn', 'aliases', 'hotRank', 'status'] as const

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  // 防 CSV 公式注入（Excel 打开时 = + - @ 开头会被当公式）
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export async function exportServicesCsv(): Promise<string> {
  const rows = await prisma.smsService.findMany({ orderBy: [{ popRank: 'asc' }, { code: 'asc' }] })
  const lines = [SERVICE_CSV_HEADER.join(',')]
  for (const r of rows) lines.push([r.code, r.nameEn, r.nameCn ?? '', splitAliases(r.aliases).join('|'), r.hotRank ?? '', r.status].map(csvCell).join(','))
  return '﻿' + lines.join('\r\n') + '\r\n'
}

/** 纯函数：解析一段 CSV（支持引号、逗号、换行转义） */
export function parseCsv(text: string): string[][] {
  const out: string[][] = []
  let row: string[] = []
  let cell = ''
  let q = false
  const s = text.replace(/^﻿/, '')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          cell += '"'
          i++
        } else q = false
      } else cell += c
      continue
    }
    if (c === '"') q = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++
      row.push(cell)
      out.push(row)
      row = []
      cell = ''
    } else cell += c
  }
  if (cell || row.length) {
    row.push(cell)
    out.push(row)
  }
  return out.filter((r) => r.some((x) => x.trim()))
}

export async function importServicesCsv(text: string): Promise<{ updated: number; skipped: string[]; changes: Array<{ code: string; before: Record<string, unknown>; after: Record<string, unknown> }> }> {
  if (text.length > 1_000_000) throw new AdminInputError('文件太大（上限 1MB）')
  const rows = parseCsv(text)
  if (!rows.length) throw new AdminInputError('CSV 是空的')
  const head = rows[0].map((h) => h.trim())
  const idx = (k: string) => head.indexOf(k)
  if (idx('code') < 0) throw new AdminInputError('CSV 第一行必须是表头，且包含 code 列')
  const skipped: string[] = []
  const changes: Array<{ code: string; before: Record<string, unknown>; after: Record<string, unknown> }> = []
  for (const r of rows.slice(1)) {
    const code = (r[idx('code')] ?? '').trim()
    if (!SERVICE_CODE_RE.test(code)) {
      skipped.push(`${code || '(空)'}：代码不合法`)
      continue
    }
    const patch: ServicePatch = {}
    const unq = (v: string | undefined) => (v ?? '').replace(/^'(?=[=+\-@])/, '')
    if (idx('nameCn') >= 0) patch.nameCn = unq(r[idx('nameCn')])
    if (idx('aliases') >= 0) patch.aliases = unq(r[idx('aliases')]).split('|')
    if (idx('hotRank') >= 0) patch.hotRank = (r[idx('hotRank')] ?? '').trim()
    try {
      const c = await updateServiceAdmin(code, patch)
      changes.push({ code, ...c })
    } catch (e) {
      skipped.push(`${code}：${(e as Error).message}`)
    }
  }
  return { updated: changes.length, skipped: skipped.slice(0, 200), changes }
}

// ───────────────────────── 国家/地区 ─────────────────────────

export interface AdminCountryRow {
  id: number
  nameEn: string
  nameCn: string | null
  /** 中文名由同步强制写（55 / 14 / 20，D44），后台只读 */
  nameLocked: boolean
  iso2: string | null
  flag: string | null
  dialCode: string | null
  status: string
  offNote: string | null
  sortBoost: number
  seenAt: string
}

export async function listCountriesAdmin(q: { search?: string; status?: string }): Promise<AdminCountryRow[]> {
  const s = (q.search ?? '').trim().slice(0, 40)
  const where: Record<string, unknown> = {}
  if (q.status === 'ON' || q.status === 'OFF') where.status = q.status
  if (s) {
    const n = /^\d{1,3}$/.test(s) ? Number(s) : null
    where.OR = [{ nameEn: { contains: s } }, { nameCn: { contains: s } }, { iso2: s.toUpperCase().slice(0, 2) }, { dialCode: s.replace(/^\+/, '') }, ...(n != null ? [{ id: n }] : [])]
  }
  const rows = await prisma.smsCountry.findMany({ where, orderBy: { id: 'asc' } })
  return rows.map((r) => ({
    id: r.id,
    nameEn: r.nameEn,
    nameCn: r.nameCn,
    nameLocked: forcedCountryName(r.id) != null,
    iso2: r.iso2,
    flag: flagOf(r.id, r.iso2),
    dialCode: r.dialCode,
    status: r.status,
    offNote: r.offNote,
    sortBoost: r.sortBoost,
    seenAt: r.seenAt.toISOString(),
  }))
}

export async function updateCountryAdmin(id: number, patch: { nameCn?: unknown; status?: unknown; offNote?: unknown; sortBoost?: unknown; iso2?: unknown; dialCode?: unknown }): Promise<{ before: Record<string, unknown>; after: Record<string, unknown> }> {
  if (!Number.isInteger(id) || id < 0 || id > 999) throw new AdminInputError('国家/地区 id 不合法')
  const cur = await prisma.smsCountry.findUnique({ where: { id } })
  if (!cur) throw new AdminInputError('没有这个国家/地区')
  const data: Record<string, unknown> = {}
  if ('nameCn' in patch) {
    if (forcedCountryName(id) != null) throw new AdminInputError(`这个地区的中文名固定为「${forcedCountryName(id)}」，不能修改`, 'nameCn')
    data.nameCn = trimOrNull(patch.nameCn, 40, '中文名')
  }
  if ('iso2' in patch) {
    const v = trimOrNull(patch.iso2, 2, 'ISO2')
    if (v != null && !/^[A-Za-z]{2}$/.test(v)) throw new AdminInputError('ISO2 是两个字母', 'iso2')
    data.iso2 = v ? v.toUpperCase() : null
  }
  if ('dialCode' in patch) {
    const v = trimOrNull(patch.dialCode, 6, '区号')
    const d = v ? v.replace(/^\+/, '') : null
    if (d != null && !/^\d{1,5}$/.test(d)) throw new AdminInputError('区号是 1–5 位数字', 'dialCode')
    data.dialCode = d
  }
  if ('sortBoost' in patch) {
    const n = Number(patch.sortBoost)
    if (!Number.isInteger(n) || n < -100 || n > 100) throw new AdminInputError('排序加权是 -100–100 的整数（大的排前面）', 'sortBoost')
    data.sortBoost = n
  }
  if ('status' in patch) {
    if (patch.status !== 'ON' && patch.status !== 'OFF') throw new AdminInputError('状态只能是 ON 或 OFF', 'status')
    if (patch.status === 'OFF') {
      const note = trimOrNull(patch.offNote, 120, '下架原因')
      if (!note) throw new AdminInputError('手动下架必须填原因', 'offNote')
      data.status = 'OFF'
      data.offNote = note
    } else {
      data.status = 'ON'
      data.offNote = null
    }
  }
  if (!Object.keys(data).length) throw new AdminInputError('没有要改的内容')
  const after = await prisma.smsCountry.update({ where: { id }, data })
  invalidateCatalogSnapshot()
  const pick = (r: typeof cur) => ({ nameCn: r.nameCn, iso2: r.iso2, dialCode: r.dialCode, status: r.status, offNote: r.offNote, sortBoost: r.sortBoost })
  return { before: pick(cur), after: pick(after) }
}

// ───────────────────────── 覆盖规则 ─────────────────────────

export interface RuleInput {
  scopeKey?: unknown
  markupCents?: unknown
  tolerancePct?: unknown
  disabled?: unknown
  note?: unknown
}

function ruleData(input: RuleInput, requireScope: boolean) {
  const data: { scopeKey?: string; markupCents?: number | null; tolerancePct?: number | null; disabled?: boolean; note?: string | null } = {}
  if (requireScope || 'scopeKey' in input) {
    const k = typeof input.scopeKey === 'string' ? input.scopeKey.trim().toLowerCase() : ''
    if (!parseScopeKey(k)) throw new AdminInputError('范围写成「服务:国家」「服务:*」或「*:国家」（例如 dr:187、acz:*、*:6；不能是 *:*）', 'scopeKey')
    data.scopeKey = k
  }
  if ('markupCents' in input) {
    const v = input.markupCents
    if (v == null || v === '') data.markupCents = null
    else {
      const n = Number(v)
      if (!Number.isInteger(n) || n < 0 || n > 5000) throw new AdminInputError('加价 y 是 0–50 元（整数分）', 'markupCents')
      data.markupCents = n
    }
  }
  if ('tolerancePct' in input) {
    const v = input.tolerancePct
    if (v == null || v === '') data.tolerancePct = null
    else {
      const n = Number(v)
      if (!Number.isInteger(n) || n < 0 || n > 100) throw new AdminInputError('容差是 0–100 的整数（%）', 'tolerancePct')
      data.tolerancePct = n
    }
  }
  if ('disabled' in input) {
    if (typeof input.disabled !== 'boolean') throw new AdminInputError('停售是开 / 关', 'disabled')
    data.disabled = input.disabled
  }
  if ('note' in input) data.note = trimOrNull(input.note, 120, '备注')
  return data
}

export async function listRules() {
  const rows = await prisma.smsPriceRule.findMany({ orderBy: { scopeKey: 'asc' } })
  return rows.map((r) => ({ id: r.id, scopeKey: r.scopeKey, markupCents: r.markupCents, tolerancePct: r.tolerancePct, disabled: r.disabled, note: r.note, updatedBy: r.updatedBy, updatedAt: r.updatedAt.toISOString() }))
}

export async function createRule(input: RuleInput, actorId: number | null) {
  const d = ruleData(input, true)
  if (d.markupCents == null && d.tolerancePct == null && !d.disabled) throw new AdminInputError('加价、容差、停售至少填一项')
  if (d.disabled && !d.note) throw new AdminInputError('停售规则必须写备注（原因）', 'note')
  try {
    const r = await prisma.smsPriceRule.create({ data: { scopeKey: d.scopeKey as string, markupCents: d.markupCents ?? null, tolerancePct: d.tolerancePct ?? null, disabled: d.disabled ?? false, note: d.note ?? null, updatedBy: actorId } })
    invalidateCatalogSnapshot()
    return r
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2002') throw new AdminInputError('这个范围已经有一条规则了，请直接编辑它', 'scopeKey')
    throw e
  }
}

export async function updateRule(id: number, input: RuleInput, actorId: number | null) {
  const cur = await prisma.smsPriceRule.findUnique({ where: { id } })
  if (!cur) throw new AdminInputError('规则不存在')
  const d = ruleData(input, false)
  const next = { markupCents: 'markupCents' in d ? d.markupCents : cur.markupCents, tolerancePct: 'tolerancePct' in d ? d.tolerancePct : cur.tolerancePct, disabled: d.disabled ?? cur.disabled, note: 'note' in d ? d.note : cur.note }
  if (next.markupCents == null && next.tolerancePct == null && !next.disabled) throw new AdminInputError('加价、容差、停售至少填一项（都不要了请删除这条规则）')
  if (next.disabled && !next.note) throw new AdminInputError('停售规则必须写备注（原因）', 'note')
  try {
    const r = await prisma.smsPriceRule.update({ where: { id }, data: { ...d, updatedBy: actorId } })
    invalidateCatalogSnapshot()
    return { before: cur, after: r }
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2002') throw new AdminInputError('这个范围已经有一条规则了', 'scopeKey')
    throw e
  }
}

export async function deleteRule(id: number) {
  const cur = await prisma.smsPriceRule.findUnique({ where: { id } })
  if (!cur) throw new AdminInputError('规则不存在')
  await prisma.smsPriceRule.delete({ where: { id } })
  invalidateCatalogSnapshot()
  return cur
}

// ───────────────────────── 停售（sms_holds 的手动部分；自动停售由 S2 的 holds.ts 写） ─────────────────────────

export const HOLD_KEY_RE = /^(global|svc:[a-z0-9]{2,4}|country:\d{1,3}|combo:[a-z0-9]{2,4}:\d{1,3})$/

export async function listHolds(now: Date = new Date()) {
  const rows = await prisma.smsHold.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map((h) => ({ key: h.key, until: h.until?.toISOString() ?? null, reason: h.reason, source: h.source, note: h.note, active: isHoldActive(h, now), createdAt: h.createdAt.toISOString() }))
}

/** 「+ 手动停售」：reason=ADMIN、source=ADMIN、必须写原因；until 为空 = 需要手动解除 */
export async function createAdminHold(input: { key?: unknown; until?: unknown; note?: unknown }, now: Date = new Date()) {
  const key = typeof input.key === 'string' ? input.key.trim().toLowerCase() : ''
  if (!HOLD_KEY_RE.test(key)) throw new AdminInputError('范围写成 global、svc:服务、country:国家 或 combo:服务:国家（例如 svc:wb、combo:dr:187）', 'key')
  const note = trimOrNull(input.note, 200, '原因')
  if (!note) throw new AdminInputError('手动停售必须写原因', 'note')
  let until: Date | null = null
  if (input.until != null && input.until !== '') {
    const d = new Date(String(input.until))
    if (Number.isNaN(d.getTime())) throw new AdminInputError('截止时间不合法', 'until')
    if (d.getTime() <= now.getTime()) throw new AdminInputError('截止时间必须晚于现在（留空 = 手动解除）', 'until')
    until = d
  }
  const before = await prisma.smsHold.findUnique({ where: { key } })
  const after = await prisma.smsHold.upsert({
    where: { key },
    create: { key, until, reason: 'ADMIN', source: 'ADMIN', note },
    update: { until, reason: 'ADMIN', source: 'ADMIN', note },
  })
  invalidateCatalogSnapshot()
  return { before, after }
}

/** 「解除」：删掉一条停售（自动的也能解除；下一次 S2 的自动判定可能再停） */
export async function deleteHold(key: string) {
  const cur = await prisma.smsHold.findUnique({ where: { key } })
  if (!cur) throw new AdminInputError('这条停售已经不存在了')
  await prisma.smsHold.delete({ where: { key } })
  invalidateCatalogSnapshot()
  return cur
}

// ───────────────────────── 运营商显示名 ─────────────────────────

export function validateOperatorNames(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AdminInputError('格式不对')
  const out: Record<string, string> = {}
  const entries = Object.entries(input as Record<string, unknown>)
  if (entries.length > 1000) throw new AdminInputError('条目太多（上限 1000）')
  for (const [k, v] of entries) {
    const code = k.trim().toLowerCase()
    if (!/^[a-z0-9_]{1,40}$/.test(code)) throw new AdminInputError(`运营商代码「${k}」不合法（小写字母、数字、下划线）`)
    if (typeof v !== 'string') throw new AdminInputError(`「${k}」的显示名必须是文字`)
    const name = v.trim()
    if (!name) continue
    if (name.length > 40) throw new AdminInputError(`「${k}」的显示名最多 40 个字`)
    out[code] = name
  }
  return out
}

// ───────────────────────── 定价预览的数据（成本只在后台） ─────────────────────────

export interface PreviewRow {
  service: string
  serviceName: string
  country: number
  countryName: string
  flag: string | null
  costMicro: number
  source: 'OFFERS' | 'PRICES'
  /** 0.8 规则的对照（D13、Q1）：同服务、同国家/地区的上架旧单品，或同服务的随机地区单品；有多个取最高价 */
  legacy: { priceCents: number; names: string[] } | null
}

/** 旧单品（deliveryType=SMS、上架）按 服务 → 国家 的现价（分）。smsCountry 为空 = 随机地区，与这个服务的每一行都比 */
export async function legacyPriceIndex(): Promise<Map<string, { byCountry: Map<number, { cents: number; names: string[] }>; random: { cents: number; names: string[] } | null }>> {
  const rows = await prisma.product.findMany({ where: { deliveryType: 'SMS', status: 1, smsService: { not: null } }, select: { name: true, price: true, smsService: true, smsCountry: true } })
  const out = new Map<string, { byCountry: Map<number, { cents: number; names: string[] }>; random: { cents: number; names: string[] } | null }>()
  for (const r of rows) {
    const svc = (r.smsService ?? '').trim().toLowerCase()
    if (!SERVICE_CODE_RE.test(svc)) continue
    const cents = centsOf(r.price)
    let e = out.get(svc)
    if (!e) {
      e = { byCountry: new Map(), random: null }
      out.set(svc, e)
    }
    const ctry = (r.smsCountry ?? '').trim()
    const bump = (cur: { cents: number; names: string[] } | null | undefined) =>
      !cur ? { cents, names: [r.name] } : cents > cur.cents ? { cents, names: [r.name] } : cents === cur.cents ? { cents, names: [...cur.names, r.name].slice(0, 3) } : cur
    if (!ctry) e.random = bump(e.random)
    else if (/^\d{1,3}$/.test(ctry)) e.byCountry.set(Number(ctry), bump(e.byCountry.get(Number(ctry))))
  }
  return out
}

/** 纯函数：一行（服务 × 国家）要对照的旧单品价：同国家的与随机地区的取高者 */
export function legacyFor(
  idx: Map<string, { byCountry: Map<number, { cents: number; names: string[] }>; random: { cents: number; names: string[] } | null }>,
  service: string,
  country: number,
): { priceCents: number; names: string[] } | null {
  const e = idx.get(service)
  if (!e) return null
  const a = e.byCountry.get(country) ?? null
  const b = e.random
  const best = !a ? b : !b ? a : a.cents >= b.cents ? a : b
  return best ? { priceCents: best.cents, names: best.names } : null
}

/**
 * 定价页预览的原始数据：热门服务 × 每个服务最便宜的 8 个国家/地区 + 有旧单品对照的 + 规则里点名的；
 * 传了 service 就给这个服务的全部国家/地区。前端用 pricing.ts 的纯函数现算「当前 → 新」（与列表价、下单价同一个函数）。
 */
export async function pricingPreviewData(opts: { service?: string } = {}): Promise<{ rows: PreviewRow[]; services: { code: string; name: string }[] }> {
  const svcWhere = opts.service ? { code: opts.service } : { hotRank: { not: null } }
  const services = await prisma.smsService.findMany({ where: { ...svcWhere, status: 'ON' }, orderBy: [{ hotRank: 'asc' }, { popRank: 'asc' }], select: { code: true, nameEn: true, nameCn: true } })
  if (!opts.service && !services.some((s) => s.code === ANY_OTHER)) {
    const ot = await prisma.smsService.findUnique({ where: { code: ANY_OTHER }, select: { code: true, nameEn: true, nameCn: true } })
    if (ot) services.push(ot)
  }
  const codes = services.map((s) => s.code)
  const [cache, rules, legacy] = await Promise.all([
    codes.length ? prisma.smsOfferCache.findMany({ where: { service: { in: codes }, kind: { in: ['OFFERS', 'PRICES'] } }, select: { service: true, kind: true, data: true, fetchedAt: true } }) : [],
    prisma.smsPriceRule.findMany({ select: { scopeKey: true } }),
    legacyPriceIndex(),
  ])
  const ruleCountries = new Map<string, Set<number>>()
  for (const r of rules) {
    const p = parseScopeKey(r.scopeKey)
    if (p?.service && p.country != null) {
      const set = ruleCountries.get(p.service) ?? new Set<number>()
      set.add(p.country)
      ruleCountries.set(p.service, set)
    }
  }
  // 与列表同一口径：第 ② 层 60 分钟内的用 offers（报价成本 §4.2），否则用第 ① 层 getPrices 的 cost
  const rowsBySvc = new Map<string, { source: 'OFFERS' | 'PRICES'; costs: Array<[number, number]>; deliv: number[] }>()
  const nowMs = Date.now()
  for (const c of cache) {
    if (c.kind !== 'OFFERS' || nowMs - c.fetchedAt.getTime() >= OFFERS_USABLE_MS) continue
    const v = parseRow<OffersRow>(c.data)
    if (!v?.countries) continue
    const costs: Array<[number, number]> = []
    for (const [cid, r] of Object.entries(v.countries)) {
      const inp = offersRowInput(r)
      const cost = quoteCostMicro(inp)
      if (cost != null && offerSellable(inp, cost)) costs.push([Number(cid), cost])
    }
    rowsBySvc.set(c.service, { source: 'OFFERS', costs, deliv: v.order?.deliv ?? [] })
  }
  for (const c of cache) {
    if (c.kind !== 'PRICES' || rowsBySvc.has(c.service)) continue
    const v = parseRow<PricesRow>(c.data)
    if (!v) continue
    rowsBySvc.set(c.service, { source: 'PRICES', costs: Object.entries(v).filter(([, x]) => x[1] > 0).map(([cid, x]) => [Number(cid), x[0]] as [number, number]), deliv: [] })
  }
  const picked: Array<{ service: string; country: number; costMicro: number; source: 'OFFERS' | 'PRICES' }> = []
  for (const s of services) {
    const d = rowsBySvc.get(s.code)
    if (!d) continue
    const sorted = d.costs.slice().sort((a, b) => a[1] - b[1] || a[0] - b[0])
    let chosen: Array<[number, number]>
    if (opts.service) chosen = sorted
    else {
      const want = new Set<number>(sorted.slice(0, 8).map((x) => x[0]))
      for (const id of d.deliv.slice(0, 3)) want.add(id)
      const lg = legacy.get(s.code)
      if (lg) lg.byCountry.forEach((_, id) => want.add(id))
      ruleCountries.get(s.code)?.forEach((id) => want.add(id))
      chosen = sorted.filter((x) => want.has(x[0]))
    }
    for (const [cid, cost] of chosen) picked.push({ service: s.code, country: cid, costMicro: cost, source: d.source })
  }
  const cids = Array.from(new Set(picked.map((p) => p.country)))
  const countries = cids.length ? await prisma.smsCountry.findMany({ where: { id: { in: cids } }, select: { id: true, nameEn: true, nameCn: true, iso2: true, status: true } }) : []
  const cBy = new Map(countries.map((c) => [c.id, c]))
  const sBy = new Map(services.map((s) => [s.code, s]))
  const rows: PreviewRow[] = []
  for (const p of picked) {
    const c = cBy.get(p.country)
    if (!c || c.status !== 'ON') continue
    const s = sBy.get(p.service)
    rows.push({
      service: p.service,
      serviceName: s?.nameCn || s?.nameEn || p.service,
      country: p.country,
      countryName: c.nameCn || c.nameEn || countrySeed(p.country)?.cn || `#${p.country}`,
      flag: flagOf(c.id, c.iso2),
      costMicro: p.costMicro,
      source: p.source,
      legacy: legacyFor(legacy, p.service, p.country),
    })
  }
  return { rows: rows.slice(0, 2000), services: services.map((s) => ({ code: s.code, name: s.nameCn || s.nameEn })) }
}
