/**
 * 营销配置与运行时状态（Setting 表四个键，每个键只有一类写者，见设计文档第 4 节）。
 *
 * 【fail closed】worker / sync 用 strict:true 读：读库失败或 JSON 坏了直接抛，本趟中止。
 * 后台页面用默认（非 strict）读：失败回落默认值，只影响展示。
 *
 * 【实现方：发送引擎】签名是契约。
 *
 * 为什么四个键分开、各只有一类写者：一块大 JSON 由多方「读-改-写」，后写的会把先写的整块覆盖 ——
 * 比如后台保存配置时把 sync 刚写下的急停冲掉，等于替系统解除了急停。拆开之后：
 *   marketing_config ← 只有后台设置页（saveConfig）
 *   mkt_halt         ← worker / sync（setHalt）与后台「解除急停」（clearHalt）
 *   mkt_account      ← 只有 sync（saveAccountState）
 *   mkt_sync         ← 只有 sync（saveSyncState）
 */
import { prisma } from '@/lib/db'
import { aliyunKeysConfigured } from '@/lib/aliyun'
import { fmtTime, notifyMarketing } from '@/lib/notify'
import { audit } from './audit'
import {
  DEFAULT_CONFIG,
  EMPTY_HALT,
  EMPTY_SYNC,
  SETTING_KEYS,
  clip,
  marketingConfigSchema,
  type AccountState,
  type FooterConfig,
  type HaltState,
  type MarketingConfig,
  type SyncState,
} from './types'

/** saveConfig 校验不通过时抛出；后台接口据此回 400 */
export class MarketingConfigError extends Error {
  status = 400
  constructor(message: string) {
    super(message)
    this.name = 'MarketingConfigError'
  }
}

function cloneDefault(): MarketingConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as MarketingConfig
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

/**
 * 与默认值合并：缺的顶层键用默认值；嵌套对象（sendWindow / warmup / freq / sunset）逐字段浅合并。
 * 这样以后给配置加字段，旧库里存的 JSON 不需要迁移。
 */
function mergeWithDefaults(saved: Record<string, unknown>): Record<string, unknown> {
  const base = cloneDefault() as unknown as Record<string, unknown>
  const out: Record<string, unknown> = { ...base }
  for (const k of Object.keys(base)) {
    if (!(k in saved)) continue
    const dv = base[k]
    const sv = saved[k]
    out[k] = isPlainObject(dv) && isPlainObject(sv) ? { ...dv, ...sv } : sv
  }
  return out
}

async function readSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } })
  return row?.value ?? null
}

async function writeSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
}

/* ============================== marketing_config ============================== */

export async function getConfig(opts: { strict?: boolean } = {}): Promise<MarketingConfig> {
  if (opts.strict) {
    // 读库失败直接抛（fail closed）
    const raw = await readSetting(SETTING_KEYS.config)
    // 从没保存过 ≠ 读失败：用默认值。默认 contactEmail 为空，本身就发不出去
    if (raw == null || raw === '') return cloneDefault()
    const saved: unknown = JSON.parse(raw) // 坏 JSON 直接抛
    if (!isPlainObject(saved)) throw new Error('marketing_config 不是 JSON 对象')
    const parsed = marketingConfigSchema.safeParse(mergeWithDefaults(saved))
    if (!parsed.success) {
      const e = parsed.error.errors[0]
      // 字段存在但值非法 —— 不猜、不回落，本趟中止，等管理员在设置页重新保存
      throw new Error(`marketing_config 校验失败：${e.path.join('.')} ${e.message}`)
    }
    return parsed.data
  }

  try {
    const raw = await readSetting(SETTING_KEYS.config)
    if (raw == null || raw === '') return cloneDefault()
    const saved: unknown = JSON.parse(raw)
    if (!isPlainObject(saved)) return cloneDefault()
    const merged = mergeWithDefaults(saved)
    // 逐字段校验：某个字段坏了只让那个字段回落默认值（同 lib/lottery-server.ts 的 getLotteryConfig 思路）
    const shape = marketingConfigSchema.shape as Record<string, { safeParse: (v: unknown) => { success: boolean; data?: unknown } }>
    const def = cloneDefault() as unknown as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(def)) {
      const r = shape[k]?.safeParse(merged[k])
      out[k] = r && r.success ? r.data : def[k]
    }
    const final = marketingConfigSchema.safeParse(out)
    return final.success ? final.data : cloneDefault()
  } catch (err) {
    console.error('[marketing] 读取营销配置失败，后台按默认值展示:', (err as Error)?.message)
    return cloneDefault()
  }
}

/** 这些字段含邮箱，审计里只记「改了」不记值 */
const PII_CONFIG_KEYS = new Set(['contactEmail', 'testRecipients'])

/** 校验并保存（zod），返回规范化后的值；写审计 CONFIG */
export async function saveConfig(next: unknown, actorId: number | null): Promise<MarketingConfig> {
  if (!isPlainObject(next)) throw new MarketingConfigError('配置格式不正确')
  const current = await getConfig()
  // 顶层浅合并：允许只提交改动的键（如只切换 enabled）；嵌套对象整体替换，由 zod 校验完整性
  const parsed = marketingConfigSchema.safeParse({ ...current, ...next })
  if (!parsed.success) throw new MarketingConfigError(parsed.error.errors[0].message)
  const value: MarketingConfig = {
    ...parsed.data,
    testRecipients: Array.from(new Set(parsed.data.testRecipients.map((s) => s.trim().toLowerCase()))),
    contactEmail: parsed.data.contactEmail.trim(),
  }
  await writeSetting(SETTING_KEYS.config, JSON.stringify(value))

  // 差异摘要：哪些键变了、从什么变成什么（含邮箱的键只记「已修改」）
  const changed: Record<string, unknown> = {}
  const before = current as unknown as Record<string, unknown>
  const after = value as unknown as Record<string, unknown>
  for (const k of Object.keys(after)) {
    if (JSON.stringify(before[k]) === JSON.stringify(after[k])) continue
    if (PII_CONFIG_KEYS.has(k)) {
      changed[k] = k === 'testRecipients' ? { count: (after[k] as unknown[]).length } : after[k] ? '已修改' : '已清空'
    } else {
      changed[k] = { from: before[k], to: after[k] }
    }
  }
  if (Object.keys(changed).length) await audit('CONFIG', { actorId, detail: { changed } })
  return value
}

export function footerConfig(cfg: MarketingConfig): FooterConfig {
  return {
    companyName: cfg.companyName,
    brandName: cfg.brandName,
    contactEmail: cfg.contactEmail,
    footerNote: cfg.footerNote,
    subjectPrefix: cfg.subjectPrefix,
  }
}

/* ============================== mkt_halt ============================== */

function normalizeHalt(v: unknown): HaltState {
  if (!isPlainObject(v)) return { ...EMPTY_HALT }
  const s = (x: unknown) => (typeof x === 'string' && x ? x : null)
  return { until: s(v.until), reason: s(v.reason), at: s(v.at), by: s(v.by), kind: s(v.kind), acctSince: s(v.acctSince) }
}

export async function getHalt(opts: { strict?: boolean } = {}): Promise<HaltState> {
  if (opts.strict) {
    const raw = await readSetting(SETTING_KEYS.halt)
    if (raw == null || raw === '') return { ...EMPTY_HALT }
    const v: unknown = JSON.parse(raw)
    if (!isPlainObject(v)) throw new Error('mkt_halt 不是 JSON 对象')
    const h = normalizeHalt(v)
    // until 写坏了（不是合法时间）不能当成「没急停」：抛出，本趟中止
    if (h.until && Number.isNaN(Date.parse(h.until))) throw new Error('mkt_halt.until 不是合法时间')
    return h
  }
  try {
    const raw = await readSetting(SETTING_KEYS.halt)
    if (raw == null || raw === '') return { ...EMPTY_HALT }
    return normalizeHalt(JSON.parse(raw))
  } catch (err) {
    console.error('[marketing] 读取急停状态失败:', (err as Error)?.message)
    // 后台展示：宁可显示「急停中（状态读取失败）」也不显示「正常」—— 发送端此时同样会中止
    return { until: 'invalid', reason: '急停状态读取失败（发送端会按急停处理）', at: null, by: null }
  }
}

export function isHalted(h: HaltState, now: Date = new Date()): boolean {
  if (!h.until) return false
  const t = Date.parse(h.until)
  // 读不懂的时间按「急停中」处理（fail closed），管理员可在后台解除
  if (Number.isNaN(t)) return true
  return t > now.getTime()
}

/** 账户级熔断那一类急停的 kind（setHalt 的调用方传入；clearHalt 据此决定要不要移动 acctSince） */
export const ACCT_BREAKER_KIND = 'acct_breaker'

/**
 * 账户级熔断的统计起点：管理员上一次手动解除「账户级熔断」的时刻（审查 C1）。
 * 解除之后不能拿同一批旧回执立刻又熔断一次；而别的急停（结果未知 / 同步中断 / 额度…）
 * 既不能把它冲掉（冲掉了旧回执会在那个急停过期后重新计入），解除它们也不能移动它（会把当天回执悄悄清零）。
 * 调用方自己与北京日起点取较晚者：昨天留下的值自然失效。
 */
export function acctBreakerSince(h: HaltState): Date | null {
  if (!h.acctSince) return null
  const t = Date.parse(h.acctSince)
  return Number.isNaN(t) ? null : new Date(t)
}

/**
 * 设置全局急停（若已有更晚的急停则保留更晚的）；写审计 HALT；发通知 marketing.paused。
 * kind：急停种类，账户级熔断传 ACCT_BREAKER_KIND，其余不传（审查 C1）
 */
export async function setHalt(until: Date, reason: string, by: string, kind: string | null = null): Promise<void> {
  if (!(until instanceof Date) || Number.isNaN(until.getTime())) throw new Error('setHalt: until 不是合法时间')
  const now = new Date()
  let current: HaltState = { ...EMPTY_HALT }
  try {
    current = await getHalt({ strict: true })
  } catch {
    // 旧值读不懂就直接覆盖：新写入的是一个明确的急停，方向是安全的
  }
  if (current.until && isHalted(current, now)) {
    const cur = Date.parse(current.until)
    if (!Number.isNaN(cur) && cur >= until.getTime()) {
      // 已有更晚的急停：保留它（不缩短），也不重复通知
      return
    }
  }
  const next: HaltState = {
    until: until.toISOString(),
    reason: clip(reason, 300),
    at: now.toISOString(),
    by: clip(by, 40),
    kind: kind ? clip(kind, 40) : null,
    // 账户级熔断的统计起点原样带过去：新的急停不能把管理员之前的「解除」冲掉（审查 C1）
    acctSince: current.acctSince ?? null,
  }
  await writeSetting(SETTING_KEYS.halt, JSON.stringify(next))
  await audit('HALT', { detail: { until: next.until, reason: next.reason, by: next.by, kind: next.kind } })
  notifyMarketing('paused', {
    campaignId: null,
    reason: `全局急停：${reason}`,
    rows: [{ label: '急停到', value: fmtTime(until) }],
  })
}

/**
 * 管理员解除急停；写审计 CLEAR_HALT。
 * 只有解除的是账户级熔断，才把账户级统计起点挪到现在；解除别的急停原样保留（审查 C1）
 */
export async function clearHalt(actorId: number): Promise<void> {
  const prev = await getHalt()
  const now = new Date().toISOString()
  const isAcct = prev.kind === ACCT_BREAKER_KIND
  const next: HaltState = {
    until: null,
    reason: null,
    at: now,
    by: String(actorId),
    kind: null,
    acctSince: isAcct ? now : prev.acctSince ?? null,
  }
  await writeSetting(SETTING_KEYS.halt, JSON.stringify(next))
  await audit('CLEAR_HALT', { actorId, detail: { previous: { until: prev.until, reason: prev.reason, by: prev.by, kind: prev.kind ?? null } } })
}

/* ============================== mkt_account ============================== */

export async function getAccountState(): Promise<AccountState | null> {
  try {
    const raw = await readSetting(SETTING_KEYS.account)
    if (!raw) return null
    const v: unknown = JSON.parse(raw)
    if (!isPlainObject(v)) return null
    const num = (x: unknown): number | null => {
      const n = typeof x === 'string' && x.trim() !== '' ? Number(x) : x
      return typeof n === 'number' && Number.isFinite(n) ? n : null
    }
    const dailyQuota = num(v.dailyQuota)
    const fetchedAt = typeof v.fetchedAt === 'string' ? v.fetchedAt : null
    if (dailyQuota == null || !fetchedAt || Number.isNaN(Date.parse(fetchedAt))) return null
    return {
      dailyQuota,
      monthQuota: num(v.monthQuota),
      quotaLevel: num(v.quotaLevel),
      maxQuotaLevel: num(v.maxQuotaLevel),
      userStatus: num(v.userStatus) ?? 0,
      ipChannelType: typeof v.ipChannelType === 'string' ? v.ipChannelType : null,
      remainFreeQuota: num(v.remainFreeQuota),
      fetchedAt,
    }
  } catch (err) {
    console.error('[marketing] 读取阿里云账户状态失败:', (err as Error)?.message)
    return null
  }
}

/** 仅 sync 调用 */
export async function saveAccountState(a: AccountState): Promise<void> {
  await writeSetting(SETTING_KEYS.account, JSON.stringify(a))
}

/** 24 小时内取到的日额度，否则 null */
export function freshDailyQuota(a: AccountState | null, now: Date = new Date()): number | null {
  if (!a) return null
  const q = Number(a.dailyQuota)
  if (!Number.isFinite(q) || q <= 0) return null
  const t = Date.parse(a.fetchedAt)
  if (Number.isNaN(t)) return null
  const age = now.getTime() - t
  // 未来 5 分钟以内的时间戳容忍时钟误差；更离谱的「未来」不可信
  if (age < -5 * 60_000 || age > 24 * 3600_000) return null
  return Math.floor(q)
}

/* ============================== mkt_sync ============================== */

function normalizeSync(v: unknown): SyncState {
  const base: SyncState = { ...EMPTY_SYNC, domainBackoff: {} }
  if (!isPlainObject(v)) return base
  const s = (x: unknown) => (typeof x === 'string' && x ? x : null)
  const backoff: Record<string, string> = {}
  if (isPlainObject(v.domainBackoff)) {
    for (const [d, until] of Object.entries(v.domainBackoff)) {
      if (typeof until === 'string' && !Number.isNaN(Date.parse(until))) backoff[d.toLowerCase()] = until
    }
  }
  const cursor = typeof v.blockCursor === 'number' && Number.isFinite(v.blockCursor) ? v.blockCursor : null
  return {
    lastOkAt: s(v.lastOkAt),
    lastRunAt: s(v.lastRunAt),
    lastError: s(v.lastError),
    blockCursor: cursor,
    invalidCursor: s(v.invalidCursor),
    domainBackoff: backoff,
  }
}

export async function getSyncState(opts: { strict?: boolean } = {}): Promise<SyncState> {
  if (opts.strict) {
    const raw = await readSetting(SETTING_KEYS.sync)
    if (raw == null || raw === '') return { ...EMPTY_SYNC, domainBackoff: {} }
    const v: unknown = JSON.parse(raw)
    if (!isPlainObject(v)) throw new Error('mkt_sync 不是 JSON 对象')
    return normalizeSync(v)
  }
  try {
    const raw = await readSetting(SETTING_KEYS.sync)
    if (raw == null || raw === '') return { ...EMPTY_SYNC, domainBackoff: {} }
    return normalizeSync(JSON.parse(raw))
  } catch (err) {
    console.error('[marketing] 读取同步状态失败:', (err as Error)?.message)
    return { ...EMPTY_SYNC, domainBackoff: {} }
  }
}

/** 仅 sync 调用 */
export async function saveSyncState(s: SyncState): Promise<void> {
  await writeSetting(SETTING_KEYS.sync, JSON.stringify(s))
}

/** 退避中的收件域名（until > now） */
export function backoffDomains(s: SyncState, now: Date = new Date()): string[] {
  const out: string[] = []
  for (const [d, until] of Object.entries(s.domainBackoff || {})) {
    const t = Date.parse(until)
    if (!Number.isNaN(t) && t > now.getTime()) out.push(d)
  }
  return out
}

/* ============================== 发信地址 / dry-run ============================== */

/** 营销发信地址：只读 ALIYUN_DM_MARKETING，绝不回落到 no-reply@ / remind@ */
export function marketingSender(): string | null {
  const v = (process.env.ALIYUN_DM_MARKETING || '').trim()
  // 必须像个邮箱地址；配错（比如只填了域名）等同于没配 —— 阿里云那边只会一封封报 InvalidMailAddress
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null
}

/** DATABASE_URL 里的库名（mysql://u:p@host:3306/<db>?x=y） */
export function databaseName(): string {
  const url = process.env.DATABASE_URL || ''
  return url.split('/').pop()?.split('?')[0] || ''
}

function dryRunRequested(): boolean {
  return (process.env.MARKETING_DRY_RUN || '').trim() === '1'
}

/**
 * 是否 dry-run：MARKETING_DRY_RUN=1 且数据库名含 dev|test 才生效（防止生产误开导致整场活动假装发送）。
 */
export function isDryRun(): boolean {
  return dryRunRequested() && /dev|test/i.test(databaseName())
}

/** MARKETING_DRY_RUN 设了但因数据库名不合规被拒绝（后台显示告警用） */
export function dryRunRefused(): boolean {
  return dryRunRequested() && !/dev|test/i.test(databaseName())
}

/** 能否真正发信：dry-run 或（AccessKey + 营销发信地址都配了） */
export function senderReady(): boolean {
  return isDryRun() || (aliyunKeysConfigured() && !!marketingSender())
}
