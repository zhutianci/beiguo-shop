/**
 * 机器人数据访问层的「范围」（docs/微信机器人-设计.md §7.2、§7.6，附录 B 第 2 条）。
 *
 * src/lib/bot/data/** 是指令层（commands/**）读业务数据的唯一入口：边界检查 B4 不许指令层直接查订单、卡密、商品等业务表。
 * 这里的每个函数都**在参数里显式带范围**，而不是从全局或会话里自己推：
 *  · tenantId = null → 主站与全部分站。只有管理群 / 管理员私聊（MGMT / DM）会传 null；
 *  · tenantId = X（≥ 2）→ 只看分站 X。分站群（TENANT）传本站 id，函数按它收窄，拿不到别的分站的任何东西。
 * 只给管理群用的数据（卡池、利润、结算、收款监控、提卡记录、待办……）第一行 requirePlatformScope：收到分站范围直接抛错（fail closed），
 * 指令注册时已经不让这些指令进分站群，这里是第二道。
 * 本目录全部只读：不写任何表。
 */
import { toCents } from '../../money'

/** 数据范围：null = 主站与全部分站（只有 MGMT / DM）；数字 = 只看这个分站 */
export interface BotScope {
  readonly tenantId: number | null
}

/** 北京时间的统计窗口 [from, to)，两端都是 UTC 瞬时值（由 marketing/time 的北京时间工具算出） */
export interface TimeWindow {
  from: Date
  to: Date
}

export const PLATFORM_TENANT_ID = 1

/** 只给管理群 / 私聊用的数据：收到分站范围就抛错，不返回任何东西 */
export function requirePlatformScope(scope: BotScope, what: string): void {
  if (scope.tenantId !== null) throw new Error(`[bot-data] ${what}只在管理群与私聊可用（收到分站范围 ${scope.tenantId}）`)
}

/** 只给分站用的数据（分站待办等）：必须是合法的分站范围（≥ 2），主站范围直接抛错（fail closed）。返回分站 id */
export function requireTenantScope(scope: BotScope, what: string): number {
  const t = scope.tenantId
  if (t === null || !(Number.isInteger(t) && t >= 2)) throw new Error(`[bot-data] ${what}只接分站范围（收到 ${t}）`)
  return t
}

/** 分站范围是否合法：null 或 ≥ 2 的整数（主站 id=1 不是「分站范围」，主站数据只经 null 范围取） */
export function assertScope(scope: BotScope): void {
  const t = scope.tenantId
  if (t !== null && !(Number.isInteger(t) && t >= 2)) throw new Error(`[bot-data] 分站范围不合法：${t}`)
}

/** 按范围收窄的 tenantId 条件（订单、发票、售后等带 tenant_id 的表）：null 范围不加条件 */
export function tenantWhere(scope: BotScope): { tenantId?: number } {
  assertScope(scope)
  return scope.tenantId === null ? {} : { tenantId: scope.tenantId }
}

/** 金额列（Prisma.Decimal / 字符串 / 数字 / null）→ 分（money.ts 的 toCents）；null 与非法值返回 null */
export function centsOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const s = String(v)
  return Number.isFinite(Number(s)) ? toCents(s) : null
}

/** 计数列（MySQL 原生查询的 COUNT / SUM 可能是 bigint）→ number */
export function countOf(v: unknown): number {
  if (v === null || v === undefined) return 0
  const n = Number(typeof v === 'bigint' ? v.toString() : String(v))
  return Number.isFinite(n) ? n : 0
}
