/**
 * 适配器接口（docs/微信机器人-设计.md §11.2）：中枢只认这个接口，协议服务换了只加一个适配器文件。
 */
import type { Inbound } from '../types'

export type AdapterCapability = 'sender_id' | 'mention_list' | 'system_msgs' | 'chat_list' | 'login_qr'

/** wxpad = WeChatPadPro 小号进群；ilink = 微信官方 ClawBot 一对一绑定（附录 E）；console = 本地测试 */
export type AdapterName = 'wxpad' | 'console' | 'ilink'

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
  /** 不是失败、只是现在发不了（iLink 推送窗口关着 / 这一轮额度用完）：发送器把这个会话的待发消息挪到 until，不计失败次数 */
  defer?: { until: Date; reason: string }
  /**
   * 失败只算这一条消息的（照常退避重试、5 次后作废），不计会话的连续失败、不会把会话标成发不出去。
   * iLink 用：绑定是否失效由收消息循环按 -14 判定，单条发不出去不代表绑定坏了
   */
  noStreak?: boolean
}

export interface BotAdapter {
  readonly name: AdapterName
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
