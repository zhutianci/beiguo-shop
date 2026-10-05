/**
 * 机器人运行状态（settings.bot_wxpad）：协议服务给的授权码、小号 wxid 与昵称、登录时间、在线检查、告警标记。
 * 授权码（auth key）是协议服务里「这个小号」的访问凭证，只在服务端用，不出现在任何页面与日志里。
 */
import { prisma } from '../db'
import { addBjDays } from '../marketing/time'

export const BOT_STATE_KEY = 'bot_wxpad'

export interface BotState {
  /** 协议服务的账号授权码（GenAuthKey 生成）；空 = 还没生成 */
  authKey: string | null
  botWxid: string | null
  nickname: string | null
  /** 最近一次扫码登录成功的时间（新号保护按它算） */
  loginAt: string | null
  /** 最近一次在线检查 */
  checkedAt: string | null
  online: boolean
  /** 连续离线检查次数（≥ 5 分钟才告警） */
  offlineSince: string | null
  /** 已发出离线告警（恢复时发一次恢复通知） */
  offlineAlerted: boolean
  /** 最近一次检查的说明（后台显示） */
  detail: string | null
  /**
   * 按北京日期累计的离线分钟数 { 'YYYY-MM-DD': 分钟 }（日报「机器人运行情况」，docs/微信机器人-设计.md §6.2）。
   * tick 的 checkHealth 每次查到离线时累加（登录过之后才算），只留最近 7 天
   */
  offlineMinutes: Record<string, number>
}

const EMPTY: BotState = {
  authKey: null,
  botWxid: null,
  nickname: null,
  loginAt: null,
  checkedAt: null,
  online: false,
  offlineSince: null,
  offlineAlerted: false,
  detail: null,
  offlineMinutes: {},
}

/** 离线分钟只留最近几天（日报只看昨天；指令补看最多看到 7 天前） */
export const OFFLINE_MINUTES_KEEP_DAYS = 7

/** 库里的 offlineMinutes 规范化：只认 { 'YYYY-MM-DD': 非负数 }，坏数据丢掉 */
function cleanOfflineMinutes(v: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out
  for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k) && typeof n === 'number' && Number.isFinite(n) && n >= 0) out[k] = n
  }
  return out
}

/** 给某个北京日期累加离线分钟（保留一位小数），并删掉 7 天以前的（纯函数，tick 调） */
export function addOfflineMinutes(map: unknown, dayKey: string, minutes: number): Record<string, number> {
  const out = cleanOfflineMinutes(map)
  if (minutes > 0) out[dayKey] = Math.round(((out[dayKey] ?? 0) + minutes) * 10) / 10
  const oldest = addBjDays(dayKey, -(OFFLINE_MINUTES_KEEP_DAYS - 1))
  for (const k of Object.keys(out)) if (k < oldest) delete out[k]
  return out
}

/** 两次在线检查之间的分钟数（离线时记这么多）：上次检查时间缺失记 1 分钟，最多记 5 分钟（cron 停摆后不一次记一大段） */
export function offlineStepMinutes(prevCheckedAt: string | null, now: Date): number {
  const t = prevCheckedAt ? Date.parse(prevCheckedAt) : NaN
  if (!Number.isFinite(t)) return 1
  return Math.min(5, Math.max(0, (now.getTime() - t) / 60_000))
}

export async function readBotState(): Promise<BotState> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: BOT_STATE_KEY } })
    if (!row) return { ...EMPTY, offlineMinutes: {} }
    const v = JSON.parse(row.value)
    const st: BotState = { ...EMPTY, ...(v && typeof v === 'object' ? v : {}) }
    st.offlineMinutes = cleanOfflineMinutes(st.offlineMinutes) // 日报离线分钟（§6.2）：老数据没有这个键 / 坏数据 → {}
    return st
  } catch (e) {
    console.error('[bot] 读取 bot_wxpad 失败', (e as Error)?.message)
    return { ...EMPTY }
  }
}

export async function patchBotState(patch: Partial<BotState>): Promise<BotState> {
  const cur = await readBotState()
  const next = { ...cur, ...patch }
  const value = JSON.stringify(next)
  await prisma.setting.upsert({ where: { key: BOT_STATE_KEY }, create: { key: BOT_STATE_KEY, value }, update: { value } })
  return next
}

/** 新号保护期内（登录未满 N 小时）只发管理群 */
export function inNewAccountQuiet(state: Pick<BotState, 'loginAt'>, hours: number, now: Date = new Date()): boolean {
  if (!hours || !state.loginAt) return false
  const t = Date.parse(state.loginAt)
  return Number.isFinite(t) && now.getTime() - t < hours * 3600_000
}
