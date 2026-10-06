/**
 * 「动态」指令的取数（docs/微信机器人-设计.md 附录 E.5）：最近推送过 / 该推送的站内动态（bot_events，落库前已脱敏）。
 *
 * 范围与路由（route.ts）同一规则：
 *  · 分站范围 X（≥ 2）→ 只取 tenant_id = X 的事件——这些本来就只投 X 的分站会话，内容已按分站口径脱敏；
 *  · 主站范围（null）→ 取 tenant_id = 1 的事件（主站动态与渠道告警，只投管理群的那些）。
 * 不看会话的订阅开关（订阅管推送，查询看全部）。主要用途：iLink 推送窗口关着期间过期没送到的动态，对方回来后自己补看。
 * 只读。
 */
import { prisma } from '../../db'
import type { BotLine } from '../types'
import { assertScope, PLATFORM_TENANT_ID, type BotScope } from './scope'

export interface EventRow {
  id: number
  title: string
  lines: BotLine[]
  link: string | null
  linkText: string | null
  category: string
  urgent: boolean
  createdAt: Date
}

/** 最近 hours 小时内、最多 limit 条，新的在前 */
export async function recentEvents(scope: BotScope, opts: { hours: number; limit: number }, now: Date = new Date()): Promise<EventRow[]> {
  assertScope(scope)
  const tenantId = scope.tenantId ?? PLATFORM_TENANT_ID
  const hours = Math.min(Math.max(1, Math.trunc(opts.hours)), 24 * 7)
  const take = Math.min(Math.max(1, Math.trunc(opts.limit)), 30)
  const rows = await prisma.botEvent.findMany({
    where: { tenantId, createdAt: { gte: new Date(now.getTime() - hours * 3600_000) } },
    orderBy: { id: 'desc' },
    take,
    select: { id: true, title: true, lines: true, link: true, linkText: true, category: true, urgent: true, createdAt: true },
  })
  return rows.map((r) => ({ ...r, lines: (Array.isArray(r.lines) ? r.lines : []) as unknown as BotLine[] }))
}
