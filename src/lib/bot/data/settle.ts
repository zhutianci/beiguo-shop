/**
 * 分站余额与待打款的结算单（docs/微信机器人-设计.md §7.3「结算」「分站」、§6.3「余额快照」）。只读、只给管理群。
 *
 * 余额一律调 computeBalances（src/lib/tenant/balances.ts）：渠道后台与超管结算中心同一份口径，由账本分录求和得出，这里不另算。
 *  · 可结算 = available.balanceCents；预计打款 = available.payoutCents（已扣手续费）；冻结中 = pending.balanceCents；
 *  · 打款中 = inPayoutCents（已进结算单、钱还没打出去）；可结算为负 = negative。
 * 「待打款的结算单」= 未完结的结算单 GENERATED / CONFIRMED / DISPUTED / PAYING（与 src/lib/tenant/statement.ts 的 OPEN_STATES 同一组；
 * 每个渠道最多一张，openKey 唯一）。PAYING 超过 24 小时标「超时」（与后台结算单列表、对账 A7 同口径）。
 */
import { prisma } from '../../db'
import { computeBalances } from '../../tenant/balances'
import { listChannelSites, type SiteInfo } from './sites'
import { PLATFORM_TENANT_ID, requirePlatformScope, type BotScope } from './scope'

export const OPEN_STATEMENT_STATES = ['GENERATED', 'CONFIRMED', 'DISPUTED', 'PAYING'] as const

/** 与后台「结算单」列表同一组文字（src/components/admin/tenants/common.tsx STATEMENT_STATE_LABEL） */
export const STATEMENT_STATE_LABEL: Readonly<Record<string, string>> = Object.freeze({
  GENERATED: '已生成',
  CONFIRMED: '渠道已确认',
  DISPUTED: '有异议',
  PAYING: '打款中',
  PAID: '已打款',
  RECEIVED: '已到账',
  RETURNED: '已退回',
})

const PAYING_OVERDUE_MS = 24 * 3600_000

export interface OpenStatement {
  statementNo: string
  state: string
  /** 本单实际打款额（分）= gross + fee */
  netCents: number
  createdAt: Date
  /** PAYING 超过 24 小时 */
  payingOverdue: boolean
}

export interface SiteMoney {
  /** 可结算余额（分） */
  availableCents: number
  /** 预计打款（分）= 可结算 − 手续费 */
  payoutCents: number
  /** 冻结中（分） */
  pendingCents: number
  /** 已进结算单、还没打出去（分） */
  inPayoutCents: number
  /** 可结算（预计打款）为负 */
  negative: boolean
  open: OpenStatement[]
}

/** 一批分站的余额与未完结结算单。computeBalances 逐个分站算（每个一条分组查询 + 一条聚合），渠道数不多，顺序执行不占满连接池 */
export async function siteMoney(scope: BotScope, tenantIds: number[], now: Date): Promise<Map<number, SiteMoney>> {
  requirePlatformScope(scope, '分站余额')
  const out = new Map<number, SiteMoney>()
  const ids = Array.from(new Set(tenantIds.filter((id) => Number.isInteger(id) && id > PLATFORM_TENANT_ID)))
  if (!ids.length) return out
  const stmts = await prisma.tenantStatement.findMany({
    where: { tenantId: { in: ids }, state: { in: [...OPEN_STATEMENT_STATES] } },
    orderBy: { id: 'asc' },
    take: 200,
    select: { tenantId: true, statementNo: true, state: true, netCents: true, createdAt: true, payingAt: true },
  })
  for (const id of ids) {
    const b = await computeBalances(id)
    out.set(id, {
      availableCents: b.available.balanceCents,
      payoutCents: b.available.payoutCents,
      pendingCents: b.pending.balanceCents,
      inPayoutCents: b.inPayoutCents,
      negative: b.negative,
      open: stmts
        .filter((s) => s.tenantId === id)
        .map((s) => ({
          statementNo: s.statementNo,
          state: s.state,
          netCents: s.netCents,
          createdAt: s.createdAt,
          payingOverdue: s.state === 'PAYING' && !!s.payingAt && now.getTime() - s.payingAt.getTime() > PAYING_OVERDUE_MS,
        })),
    })
  }
  return out
}

export interface SettleRow {
  site: SiteInfo
  money: SiteMoney
}

/**
 * 「结算」指令：全部渠道分站的余额与待打款结算单。已停业、而且余额全为 0、没有未完结结算单的分站不列（没有要处理的钱）。
 */
export async function settlementOverview(scope: BotScope, now: Date): Promise<SettleRow[]> {
  requirePlatformScope(scope, '结算一览')
  const sites = await listChannelSites(scope)
  const money = await siteMoney(scope, sites.map((s) => s.id), now)
  const rows: SettleRow[] = []
  sites.forEach((site) => {
    const m = money.get(site.id)
    if (!m) return
    const idle = m.availableCents === 0 && m.pendingCents === 0 && m.inPayoutCents === 0 && m.open.length === 0
    if (site.status === 'TERMINATED' && idle) return
    rows.push({ site, money: m })
  })
  return rows
}
