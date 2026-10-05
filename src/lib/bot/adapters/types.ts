/**
 * 适配器接口（docs/微信机器人-设计.md §11.2）：中枢只认这个接口，协议服务换了只加一个适配器文件。
 */
import type { Inbound } from '../types'

export type AdapterCapability = 'sender_id' | 'mention_list' | 'system_msgs' | 'chat_list' | 'login_qr'

export interface AdapterStatus {
  /** 协议服务连得上 */
  reachable: boolean
  /** 小号在线 */
  online: boolean
  botWxid?: string | null
  nickname?: string | null
  detail?: string
}

export interface ChatInfo {
  externalId: string
  name: string
  memberCount?: number
}

export interface SendResult {
  ok: boolean
  error?: string
}

export interface BotAdapter {
  readonly name: 'wxpad' | 'console'
  readonly capabilities: ReadonlySet<AdapterCapability>
  status(): Promise<AdapterStatus>
  /** 登录二维码（图片地址或 data URL）；拿不到返回 null 并带原因 */
  loginQr(): Promise<{ qr: string | null; error?: string }>
  /** 扫码后的登录进度：2 = 成功 */
  loginProgress(): Promise<{ state: 'WAITING' | 'SCANNED' | 'DONE' | 'EXPIRED' | 'ERROR'; wxid?: string | null; nickname?: string | null; error?: string }>
  /** 掉线后的「唤醒登录」（部署教程：首次掉线不唤醒会严重提高风控风险）；不支持返回 false */
  wakeLogin(): Promise<{ ok: boolean; error?: string }>
  listChats(): Promise<ChatInfo[]>
  sendText(externalId: string, text: string): Promise<SendResult>
  /** 回调体 / 推送体 → 标准入站消息；不认识的结构返回空数组 */
  parseCallback(body: unknown, selfWxid: string | null): Inbound[]
}
