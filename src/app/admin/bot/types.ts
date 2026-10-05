/**
 * 后台「微信机器人」页与 /api/admin/bot/* 共用的数据形状（docs/微信机器人-设计.md §14）。
 * 只放类型，不 import 任何服务端模块——页面（客户端组件）与接口都 `import type` 它。
 */

export type TabId = 'overview' | 'conversations' | 'admins' | 'issues' | 'commands' | 'settings'

export type ConvKind = 'MGMT' | 'TENANT' | 'DM'
export type ConvStatus = 'ACTIVE' | 'PAUSED' | 'UNREACHABLE' | 'REVOKED'

// ───────────────────────── 概览 ─────────────────────────

export interface BotStateDTO {
  botWxid: string | null
  nickname: string | null
  loginAt: string | null
  checkedAt: string | null
  online: boolean
  offlineSince: string | null
  offlineAlerted: boolean
  detail: string | null
  /** 协议服务的授权码只在服务端用，这里只告诉页面「有没有」 */
  hasAuthKey: boolean
}

export interface LiveStatusDTO {
  reachable: boolean
  online: boolean
  detail: string | null
  botWxid: string | null
  nickname: string | null
}

export interface OverviewDTO {
  serverTime: string
  env: {
    botEnabled: boolean
    adapter: 'wxpad' | 'console'
    proxyConfigured: boolean
    adminKeyConfigured: boolean
    hookSecretConfigured: boolean
    linkOrigin: string
  }
  state: BotStateDTO
  newAccount: { active: boolean; until: string | null; hours: number }
  /** 只有带 ?live=1 才有：现查一次协议服务 */
  live: LiveStatusDTO | null
  config: {
    ok: boolean
    reason: string | null
    enabled: boolean
    locked: boolean
    lockedAt: string | null
    lockedBy: string | null
    version: number | null
  }
  today: { sent: number; failed: number; pending: number; blocked: number; expired: number; since: string }
  convs: { mgmt: number; tenant: number; dm: number; paused: number; unreachable: number }
  admins: { enabled: number; identities: number }
}

export interface LoginQrDTO {
  qr: string
  issuedAt: string
  ttlSeconds: number
}

export interface LoginProgressDTO {
  state: 'WAITING' | 'SCANNED' | 'DONE' | 'EXPIRED' | 'ERROR'
  wxid: string | null
  nickname: string | null
  error: string | null
}

export interface LockResultDTO {
  locked: boolean
  already: boolean
  lockedAt: string | null
  lockedBy: string | null
  revokedTokens?: number
}

export interface TestMessageDTO {
  outboxId: number | null
  status: string | null
}

export interface TestMessageStatusDTO {
  id: number
  status: string
  attempts: number
  lastError: string | null
  sentAt: string | null
}

// ───────────────────────── 会话 ─────────────────────────

export interface SiteDTO {
  tenantId: number
  code: string
  name: string
  status: string
}

export interface ConvDTO {
  id: number
  adapter: string
  externalId: string
  name: string | null
  kind: ConvKind
  tenantId: number | null
  site: SiteDTO | null
  status: ConvStatus
  allowT3: boolean
  /** 当前生效的订阅（缺的类别已按事件目录补了默认值）。MGMT 另含 'ev:wallet.topup'；私聊为空 */
  subs: Record<string, boolean>
  quietFrom: number | null
  quietTo: number | null
  boundByName: string | null
  boundAt: string | null
  lastSentAt: string | null
  failStreak: number
  /** 待发 / 发送中的条数 */
  pending: number
  createdAt: string
}

export interface ConvListDTO {
  currentAdapter: 'wxpad' | 'console'
  list: ConvDTO[]
  summary: { mgmt: number; tenant: number; dm: number; paused: number; unreachable: number; revoked: number }
}

export interface ChatDTO {
  externalId: string
  name: string
  memberCount: number | null
  registered: { id: number; kind: ConvKind; status: ConvStatus; siteCode: string | null } | null
}

export interface ChatListDTO {
  adapter: 'wxpad' | 'console'
  chats: ChatDTO[]
  /** 群列表为空时附上协议服务当前状态，方便判断是「没有群」还是「连不上」 */
  status: LiveStatusDTO | null
}

export interface SiteResolveDTO {
  site: { tenantId: number; code: string; name: string; status: string; origin: string }
}

// ───────────────────────── 管理员 ─────────────────────────

export interface AdminIdentityDTO {
  id: number
  adapter: string
  wxid: string
  nickname: string | null
  enabled: boolean
  createdAt: string
}

export interface AdminDTO {
  id: number
  name: string
  siteUser: { id: number; label: string } | null
  maxTier: number
  enabled: boolean
  claimPending: boolean
  claimExpiresAt: string | null
  identities: AdminIdentityDTO[]
  createdAt: string
}

export interface ClaimCodeDTO {
  /** 明文认领码：只在这一次响应里出现，库里只存 SHA-256 */
  code: string
  expiresAt: string
  ttlMinutes: number
}

// ───────────────────────── 提卡与补货 ─────────────────────────

export interface IssueRowDTO {
  id: number
  createdAt: string
  commandId: number
  orderId: number
  orderNo: string
  productId: number
  productName: string | null
  botCode: string | null
  quantity: number
  unitPrice: number
  amount: number
  costTotal: number | null
  profit: number | null
  cardCount: number | null
  adminName: string | null
  conversationName: string | null
  conversationKind: string | null
}

export interface IssueListDTO {
  type: 'issue'
  page: number
  pageSize: number
  total: number
  list: IssueRowDTO[]
  today: { count: number; quantity: number; amount: number }
  caps: { issuePerDay: number; issueAmountPerDay: number; issuePerCommand: number } | null
}

export type RestockState = 'PENDING' | 'USED' | 'REVOKED' | 'EXPIRED'

export interface RestockRowDTO {
  id: number
  createdAt: string
  expiresAt: string
  usedAt: string | null
  usedIp: string | null
  revokedAt: string | null
  state: RestockState
  commandId: number | null
  adminName: string | null
  conversationName: string | null
  conversationKind: string | null
  /** 令牌参数 / 导入结果里的简单字段（只留数字、布尔与短字符串，且丢掉名字像卡密 / 令牌的键） */
  params: Record<string, string | number | boolean | null> | null
  result: Record<string, string | number | boolean | null> | null
  productName: string | null
}

export interface RestockListDTO {
  type: 'restock'
  page: number
  pageSize: number
  total: number
  list: RestockRowDTO[]
}

// ───────────────────────── 指令日志 ─────────────────────────

export interface CommandRowDTO {
  id: number
  createdAt: string
  adapter: string
  kind: string
  conversationId: number | null
  conversationName: string | null
  conversationKind: string | null
  convExternalId: string
  senderWxid: string | null
  senderName: string | null
  adminName: string | null
  name: string | null
  argsText: string | null
  decision: string
  reasonCode: string | null
  resultSummary: string | null
}

export interface CommandListDTO {
  page: number
  pageSize: number
  total: number
  list: CommandRowDTO[]
}

// ───────────────────────── 设置 ─────────────────────────

/** 后台可调的那部分 bot_config（locked 系列只能经「锁定 / 解锁」、issueUserId 只能由种子 SQL 写） */
export interface EditableConfig {
  enabled: boolean
  caps: { issuePerDay: number; issueAmountPerDay: number; issuePerCommand: number }
  priceWarn: { belowRatio: number; aboveRatio: number }
  pacing: { perConvSeconds: number; jitterSeconds: number; perMinute: number; perHour: number }
  quietDefault: { from: number; to: number } | null
  linkOrigin: string
  tenantReplyTtlDays: number
  disabledCommands: string[]
  newAccountQuietHours: number
}

export interface CommandInfoDTO {
  name: string
  aliases: string[]
  tier: number
  scopes: string[]
  summary: string
  /** 紧急锁定不允许关掉 */
  protected: boolean
}

export interface SettingsDTO {
  ok: boolean
  reason: string | null
  config: EditableConfig | null
  version: number | null
  readonly: { locked: boolean; lockedAt: string | null; lockedBy: string | null; issueUserId: number | null } | null
  defaults: EditableConfig
  effectiveLinkOrigin: string
  env: {
    botEnabled: boolean
    adapter: 'wxpad' | 'console'
    proxyConfigured: boolean
    adminKeyConfigured: boolean
    hookSecretConfigured: boolean
  }
  commands: CommandInfoDTO[]
  /** 命令注册表没能加载时的说明（此时只能保留已有的关闭项，不能新增） */
  commandsError: string | null
}
