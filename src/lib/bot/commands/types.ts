/**
 * 指令注册表的类型（docs/微信机器人-设计.md §7.6）。新增一个指令 = 新建一个文件导出 BotCommandDef，再在 index.ts 登记。
 */
import type { BotConfig } from '../config'
import type { ConvKind } from '../types'

/** 指令能在哪里用：UNBOUND = 小号所在、还没登记的群 */
export type CmdScope = ConvKind | 'UNBOUND'

export interface CmdConversation {
  /** 未登记的群为 null */
  id: number | null
  kind: ConvKind | null
  tenantId: number | null
  allowT3: boolean
  externalId: string
  isGroup: boolean
  name: string | null
}

export interface CmdAdmin {
  id: number
  name: string
  siteUserId: number | null
  maxTier: number
}

export interface BotContext {
  adapter: 'wxpad' | 'console' | 'ilink'
  conv: CmdConversation
  admin: CmdAdmin
  commandId: number
  msgId: string
  senderWxid: string
  now: Date
  config: BotConfig
  /**
   * 数据范围：TENANT 会话 = 该分站 id；MGMT / DM = null（主站与全部分站）。
   * 处理函数查数据必须按它收窄（附录 B 第 2 条）
   */
  scopeTenantId: number | null
  /**
   * 谁发的：缺省 admin（登记过的管理员）。agent = iLink 分站绑定里扫码的那个代理（附录 E.5）——不是管理员，
   * 只能用 AGENT_COMMANDS 里的只读指令，范围恒为本站；此时 admin 是占位（id 0、maxTier 1），不要拿它写审计
   */
  actor?: 'admin' | 'agent'
}

/** 指令结果：回复文本；也可以指定回到另一个会话（例如「创建」新建的会话） */
export interface BotReply {
  text: string
  /** 回复发到哪个会话；缺省 = 发起会话 */
  conversationId?: number
  /** 额外发到所有管理群的知会（例如「群 X 已绑定分站 Y」） */
  notifyMgmt?: string
  /** 再往另一个会话发一条（例如在管理群里替某群绑定后，给那个群发欢迎语） */
  extraSendTo?: { id: number; text: string }
  /** 写进 bot_commands.result_summary 的一句话（不得含卡密、令牌、链接） */
  summary?: string
  /** 回复里有卡密 / 核销链接 / 一次性链接：出队里加密存放（outbox.sealOutboxText），只发回发起会话 */
  sensitive?: boolean
  /** 指令没有执行（业务性拒绝，如超上限、库存不足）：bot_commands 记 REJECTED + 这个原因码，不写指令审计 */
  rejected?: string
  /** 审计 diff（tier ≥ 2 的指令） */
  auditDiff?: unknown
  auditTarget?: { type: string; id: string }
}

export type ParseResult<A> = { ok: true; value: A } | { ok: false; usage: string }

export interface BotCommandDef<A = unknown> {
  name: string
  aliases?: readonly string[]
  scopes: readonly CmdScope[]
  tier: 0 | 1 | 2 | 3
  /** 锁定状态下仍可用（只有「锁定」） */
  allowWhenLocked?: boolean
  /** tier ≥ 2 必填：审计 action */
  auditAction?: string
  /** run() 自己在业务事务里写了审计（提卡、改价、补货）：inbound 不再补一条通用的指令审计 */
  selfAudited?: boolean
  parse(args: string[]): ParseResult<A>
  run(ctx: BotContext, args: A): Promise<BotReply>
  help: { summary: string; usage: string; example?: string }
}

/** 无参数指令的 parse */
export function noArgs(usage: string) {
  return (args: string[]): ParseResult<null> => (args.length ? { ok: false, usage } : { ok: true, value: null })
}
