/**
 * console 适配器：不碰微信，发出的消息记在内存里（itest 断言用）并打印一行；入站消息由测试直接调 handleInbound 注入。
 * 只在 BOT_ADAPTER=console 时启用（本地联调、itest）。
 */
import type { Inbound } from '../types'
import type { AdapterCapability, AdapterStatus, BotAdapter, ChatInfo, SendResult } from './types'

export interface ConsoleSent {
  externalId: string
  text: string
  at: Date
}

const g = globalThis as unknown as { __botConsoleSent?: ConsoleSent[]; __botConsoleFail?: Set<string> }

export function consoleSent(): ConsoleSent[] {
  return (g.__botConsoleSent ||= [])
}

/** 测试用：让发往某会话的消息失败 */
export function consoleFailFor(externalId: string, fail: boolean): void {
  const s = (g.__botConsoleFail ||= new Set())
  if (fail) s.add(externalId)
  else s.delete(externalId)
}

export class ConsoleAdapter implements BotAdapter {
  readonly name = 'console' as const
  readonly capabilities: ReadonlySet<AdapterCapability> = new Set<AdapterCapability>(['sender_id', 'mention_list', 'system_msgs', 'chat_list'])

  async status(): Promise<AdapterStatus> {
    return { reachable: true, online: true, botWxid: process.env.BOT_CONSOLE_WXID || 'wxid_bot', nickname: '贝果助手', detail: 'console' }
  }
  async loginQr() {
    return { qr: null, error: 'console 适配器不需要登录' }
  }
  async loginProgress() {
    return { state: 'DONE' as const, wxid: process.env.BOT_CONSOLE_WXID || 'wxid_bot', nickname: '贝果助手' }
  }
  async wakeLogin() {
    return { ok: true }
  }
  async listChats(): Promise<ChatInfo[]> {
    return []
  }
  async sendText(externalId: string, text: string): Promise<SendResult> {
    if (g.__botConsoleFail?.has(externalId)) return { ok: false, error: 'console 模拟失败' }
    consoleSent().push({ externalId, text, at: new Date() })
    if (process.env.BOT_CONSOLE_ECHO === '1') console.log(`[bot→${externalId}]\n${text}\n`)
    return { ok: true }
  }
  parseCallback(body: unknown): Inbound[] {
    return Array.isArray(body) ? (body as Inbound[]) : []
  }
}
