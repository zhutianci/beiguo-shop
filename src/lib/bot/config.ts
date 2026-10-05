/**
 * 机器人运行配置：settings.bot_config（JSON，带 version，乐观并发写）。docs/微信机器人-设计.md §13。
 *
 * 【读失败 = 敏感操作一律拒绝、推送照常】解析不了、字段不合法时 readBotConfig 返回 ok=false：
 * 调用方（指令）据此拒绝 T2 / T3；发送器与路由用 DEFAULT_BOT_CONFIG 继续推送（推送不涉及钱）。
 * 进程内缓存 10 秒，写入后立即失效；多进程（只有一个 app 进程）不需要更强的一致性。
 */
import { prisma } from '../db'

export const BOT_CONFIG_KEY = 'bot_config'

export interface BotConfig {
  version: number
  /** 运行时总开关（环境变量 BOT_ENABLED 之外的第二道；后台可临时停推送） */
  enabled: boolean
  /** 一键锁定（§10）：T2 / T3 全部拒绝（「锁定」除外）；解锁只能在后台 */
  locked: boolean
  lockedAt: string | null
  lockedBy: string | null
  caps: {
    /** 每日（北京时间）提卡张数上限 */
    issuePerDay: number
    /** 每日提卡金额上限（元） */
    issueAmountPerDay: number
    /** 单条指令最多几张 */
    issuePerCommand: number
  }
  /** 价格异常提示阈值（只提示、不拦，站长 Q4） */
  priceWarn: { belowRatio: number; aboveRatio: number }
  pacing: {
    /** 同一会话两条之间至少间隔（秒） */
    perConvSeconds: number
    /** 每条额外随机抖动的上限（秒） */
    jitterSeconds: number
    perMinute: number
    perHour: number
  }
  /** 新建分站群默认免打扰（北京时间，一天中的分钟）；null = 不设 */
  quietDefault: { from: number; to: number } | null
  /** 推送里链接的域名；空 = 用 BOT_LINK_ORIGIN / APP_URL */
  linkOrigin: string
  /** 渠道快速回复链接有效期（天） */
  tenantReplyTtlDays: number
  /** 临时关闭的指令名 */
  disabledCommands: string[]
  /** 提卡专用账号的 users.id（种子 SQL 写入；§8.7） */
  issueUserId: number | null
  /** 小号登录后多少小时内只发管理群（新号保护，§5.6） */
  newAccountQuietHours: number
}

export const DEFAULT_BOT_CONFIG: Readonly<BotConfig> = Object.freeze({
  version: 0,
  enabled: true,
  locked: false,
  lockedAt: null,
  lockedBy: null,
  caps: { issuePerDay: 20, issueAmountPerDay: 3000, issuePerCommand: 5 },
  priceWarn: { belowRatio: 0.5, aboveRatio: 3 },
  pacing: { perConvSeconds: 4, jitterSeconds: 2, perMinute: 15, perHour: 300 },
  quietDefault: { from: 23 * 60, to: 8 * 60 },
  linkOrigin: '',
  tenantReplyTtlDays: 7,
  disabledCommands: [],
  issueUserId: null,
  newAccountQuietHours: 48,
})

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function num(v: unknown, def: number, min: number, max: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return def
  return Math.min(max, Math.max(min, n))
}

function minuteOfDay(v: unknown): number | null {
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 && n < 1440 ? n : null
}

/** 把库里的 JSON 规范化成完整配置；结构坏到不能用时抛错（由 readBotConfig 转成 ok=false） */
export function normalizeBotConfig(raw: unknown): BotConfig {
  if (!isObj(raw)) throw new Error('bot_config 不是对象')
  const d = DEFAULT_BOT_CONFIG
  const caps = isObj(raw.caps) ? raw.caps : {}
  const pw = isObj(raw.priceWarn) ? raw.priceWarn : {}
  const pacing = isObj(raw.pacing) ? raw.pacing : {}
  let quiet: BotConfig['quietDefault'] = d.quietDefault
  if (raw.quietDefault === null) quiet = null
  else if (isObj(raw.quietDefault)) {
    const from = minuteOfDay(raw.quietDefault.from)
    const to = minuteOfDay(raw.quietDefault.to)
    quiet = from !== null && to !== null && from !== to ? { from, to } : d.quietDefault
  }
  const issueUserId = raw.issueUserId == null ? null : Number(raw.issueUserId)
  return {
    version: Number.isInteger(raw.version) ? (raw.version as number) : 0,
    enabled: raw.enabled !== false,
    locked: raw.locked === true,
    lockedAt: typeof raw.lockedAt === 'string' ? raw.lockedAt : null,
    lockedBy: typeof raw.lockedBy === 'string' ? raw.lockedBy.slice(0, 60) : null,
    caps: {
      issuePerDay: Math.trunc(num(caps.issuePerDay, d.caps.issuePerDay, 0, 1000)),
      issueAmountPerDay: num(caps.issueAmountPerDay, d.caps.issueAmountPerDay, 0, 1_000_000),
      issuePerCommand: Math.trunc(num(caps.issuePerCommand, d.caps.issuePerCommand, 1, 50)),
    },
    priceWarn: {
      belowRatio: num(pw.belowRatio, d.priceWarn.belowRatio, 0, 1),
      aboveRatio: num(pw.aboveRatio, d.priceWarn.aboveRatio, 1, 100),
    },
    pacing: {
      perConvSeconds: num(pacing.perConvSeconds, d.pacing.perConvSeconds, 1, 120),
      jitterSeconds: num(pacing.jitterSeconds, d.pacing.jitterSeconds, 0, 60),
      perMinute: Math.trunc(num(pacing.perMinute, d.pacing.perMinute, 1, 40)),
      perHour: Math.trunc(num(pacing.perHour, d.pacing.perHour, 1, 2000)),
    },
    quietDefault: quiet,
    linkOrigin: typeof raw.linkOrigin === 'string' && /^https:\/\/[^\s/]+$/.test(raw.linkOrigin) ? raw.linkOrigin : '',
    tenantReplyTtlDays: Math.trunc(num(raw.tenantReplyTtlDays, d.tenantReplyTtlDays, 1, 30)),
    disabledCommands: Array.isArray(raw.disabledCommands)
      ? raw.disabledCommands.filter((x): x is string => typeof x === 'string').slice(0, 50)
      : [],
    issueUserId: issueUserId !== null && Number.isInteger(issueUserId) && issueUserId > 0 ? issueUserId : null,
    newAccountQuietHours: Math.trunc(num(raw.newAccountQuietHours, d.newAccountQuietHours, 0, 240)),
  }
}

export type BotConfigRead = { ok: true; config: BotConfig; raw: string | null } | { ok: false; reason: string }

let cache: { at: number; value: BotConfigRead } | null = null
const CACHE_MS = 10_000

export function invalidateBotConfig(): void {
  cache = null
}

/** 读配置。没有这一行 = 出厂默认（ok=true）；有但读坏了 = ok=false */
export async function readBotConfig(opts?: { fresh?: boolean }): Promise<BotConfigRead> {
  if (!opts?.fresh && cache && Date.now() - cache.at < CACHE_MS) return cache.value
  let value: BotConfigRead
  try {
    const row = await prisma.setting.findUnique({ where: { key: BOT_CONFIG_KEY } })
    if (!row) value = { ok: true, config: { ...DEFAULT_BOT_CONFIG }, raw: null }
    else value = { ok: true, config: normalizeBotConfig(JSON.parse(row.value)), raw: row.value }
  } catch (e) {
    console.error('[bot] 读取 bot_config 失败', (e as Error)?.message)
    value = { ok: false, reason: (e as Error)?.message || '读取失败' }
  }
  cache = { at: Date.now(), value }
  return value
}

/** 推送路径用：读坏了就用出厂默认（推送不涉及钱，不能因为配置坏了就全停） */
export async function botConfigForDelivery(): Promise<BotConfig> {
  const r = await readBotConfig()
  return r.ok ? r.config : { ...DEFAULT_BOT_CONFIG }
}

export class BotConfigConflict extends Error {
  constructor() {
    super('配置已被其他人修改，请刷新后重试')
  }
}

/**
 * 改配置：读当前值 → patch → 用「value 等于读到的原值」做条件更新（CAS）。
 * 没有这一行时 create；并发 create 撞唯一键按冲突处理。返回新配置。
 */
export async function updateBotConfig(patch: (c: BotConfig) => BotConfig): Promise<BotConfig> {
  const cur = await readBotConfig({ fresh: true })
  if (!cur.ok) throw new Error(`bot_config 读取失败：${cur.reason}`)
  const next = normalizeBotConfig({ ...patch(structuredClone(cur.config)), version: cur.config.version + 1 })
  const value = JSON.stringify(next)
  if (cur.raw === null) {
    try {
      await prisma.setting.create({ data: { key: BOT_CONFIG_KEY, value } })
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002') throw new BotConfigConflict()
      throw e
    }
  } else {
    const r = await prisma.setting.updateMany({ where: { key: BOT_CONFIG_KEY, value: cur.raw }, data: { value } })
    if (r.count !== 1) throw new BotConfigConflict()
  }
  invalidateBotConfig()
  return next
}

/** 环境变量总开关：BOT_ENABLED=1 才工作（P0 上线后休眠） */
export function botEnabledByEnv(): boolean {
  return (process.env.BOT_ENABLED || '').trim() === '1'
}

/** 推送链接的域名：配置 > BOT_LINK_ORIGIN > APP_URL > https://bigolab.com */
export function linkOrigin(cfg?: Pick<BotConfig, 'linkOrigin'>): string {
  const v =
    cfg?.linkOrigin ||
    (process.env.BOT_LINK_ORIGIN || '').trim() ||
    (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim() ||
    'https://bigolab.com'
  return v.replace(/\/+$/, '')
}
