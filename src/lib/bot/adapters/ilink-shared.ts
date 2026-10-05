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
