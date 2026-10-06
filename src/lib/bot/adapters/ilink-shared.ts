/**
 * iLink 适配器（ilink.ts）与收消息循环（ilink-loop.ts）共用的部分，单独成文件免得两者互相 import：
 * 推送窗口常量、判定为过期的 context_token 缓存、iLink 消息 → 标准入站。
 */
import type { Inbound } from '../types'
import type { IlinkMessage } from './ilink-api'

/** context_token 的有效期：官方没写明，社区实测约 24 小时；留一小时余量 */
export const CONTEXT_TTL_MS = 23 * 3600_000
/** 窗口剩下不到 3 小时时在消息末尾提醒 */
export const KEEPALIVE_HINT_AFTER_MS = 20 * 3600_000
export const KEEPALIVE_HINT = '（超过 24 小时没有回复，微信会暂停推送；回复任意一个字即可继续接收）'

/**
 * 每个 context_token（= 对方的每一条消息）最多放行几条机器人消息（附录 E.6）。2026-10-06 生产实测：站长发「今日」后
 * 恰好发出 10 条（1 条回复 + 9 条推送，最后一条在 79 分钟后），第 11 条 sendmessage 回「ret=-2 prepare failed」；
 * 发「库存」后又是恰好 10 条、第 11 条失败；另一个绑定在对方说话 2 小时后仍能推送（没到 10 条）。所以是按条数、不是按时间。
 */
export const ILINK_CTX_QUOTA = 10
/** 这一轮额度的最后一条消息末尾附上（让对方知道要回一句才能继续收） */
export const QUOTA_NOTICE = '📭 这一轮推送额度用完了（微信限制：你每发一条消息，机器人最多回 10 条）。回复任意一个字，排队中的动态会合并发给你。'
/** 发往 iLink 绑定的普通动态先攒这么久再发：期间来的几条合成一条，省额度（紧急的不等） */
export const ILINK_BATCH_MS = 5 * 60_000

const g = globalThis as unknown as { __botIlinkDeadCtx?: Map<number, string> }
/** 发失败、判定已过期的 context_token（会话 id → token）：同一个 token 不再试，等对方来新消息 */
const deadCtx = (g.__botIlinkDeadCtx ||= new Map<number, string>())

export function markDeadContext(convId: number, token: string): void {
  deadCtx.set(convId, token)
}

export function isDeadContext(convId: number, token: string): boolean {
  return deadCtx.get(convId) === token
}

/** 对方发来新消息（新的 context_token）时调 */
export function clearDeadContext(convId: number): void {
  deadCtx.delete(convId)
}

/** 一条 iLink 消息 → 标准入站（只取文字：文本、语音转写；图片 / 文件忽略）。convExternalId = 绑定的 ilink_bot_id */
export function ilinkToInbound(botId: string, m: IlinkMessage): Inbound | null {
  const from = typeof m.from_user_id === 'string' ? m.from_user_id : ''
  const id = m.message_id || (m.seq !== undefined ? `seq${m.seq}` : '') || m.client_id || ''
  if (!from || !id) return null
  const text = (m.item_list || [])
    .map((it) => (it?.type === 1 ? it.text_item?.text : it?.type === 3 ? it.voice_item?.text : undefined))
    .filter((t): t is string => typeof t === 'string' && !!t.trim())
    .join('\n')
    .trim()
  if (!text) return null
  const ts = typeof m.create_time_ms === 'number' && m.create_time_ms > 0 ? new Date(m.create_time_ms) : new Date()
  return {
    kind: 'MESSAGE',
    msgId: `il:${id}`.slice(0, 64),
    convExternalId: botId,
    isGroup: false,
    senderWxid: from,
    text: text.slice(0, 2000),
    atWxids: [],
    atAll: false,
    ts,
  }
}
