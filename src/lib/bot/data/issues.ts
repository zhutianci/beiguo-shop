/**
 * 「提卡记录」指令的取数（docs/微信机器人-设计.md §7.3、§8，附录 B 第 15 条）：某段时间（北京时间自然日）的 bot_card_issues。
 * 只读、只给管理群与私聊。走 created_at 索引；一天最多几十条（每日上限默认 20 张）。
 * 不读 card_ids、不碰 card_keys、不拼核销链接：卡密与核销链接只出现在当时那条提卡回执里。
 * 利润 = 金额 − 成本合计（与后台「提卡与补货」列表同口径）；成本没记下来为 null。
 */
import { prisma } from '../../db'
import { centsOrNull, requirePlatformScope, type BotScope, type TimeWindow } from './scope'

export interface IssueRecord {
  at: Date
  orderNo: string
  productName: string | null
  botCode: string | null
  quantity: number
  unitPriceCents: number
  amountCents: number
  costCents: number | null
  profitCents: number | null
  /** 发起提卡的管理员（bot_admins.name） */
  adminName: string
}

export interface IssueList {
  /** 窗口内的提卡次数（list 最多 limit 条，按时间升序） */
  total: number
  list: IssueRecord[]
  /** 窗口内全部提卡的合计（不受 limit 影响）：张数、金额、成本已知部分的利润与成本未知的次数 */
  sum: { quantity: number; amountCents: number; profitCents: number; costUnknown: number }
}

export async function cardIssuesIn(scope: BotScope, w: TimeWindow, limit = 30): Promise<IssueList> {
  requirePlatformScope(scope, '提卡记录')
  const where = { createdAt: { gte: w.from, lt: w.to } }
  const [total, rows, all] = await Promise.all([
    prisma.botCardIssue.count({ where }),
    prisma.botCardIssue.findMany({
      where,
      orderBy: { id: 'asc' },
      take: Math.min(Math.max(1, Math.trunc(limit)), 100),
      select: { createdAt: true, orderNo: true, productId: true, adminId: true, quantity: true, unitPrice: true, amount: true, costTotal: true },
    }),
    // 合计只取三个数字列（一天几十行），不取别的
    prisma.botCardIssue.findMany({ where, take: 2000, select: { quantity: true, amount: true, costTotal: true } }),
  ])
  const sum = { quantity: 0, amountCents: 0, profitCents: 0, costUnknown: 0 }
  all.forEach((r) => {
    const amount = centsOrNull(r.amount) ?? 0
    const cost = centsOrNull(r.costTotal)
    sum.quantity += r.quantity
    sum.amountCents += amount
    if (cost === null) sum.costUnknown += 1
    else sum.profitCents += amount - cost
  })
  if (!rows.length) return { total, list: [], sum }
  const [products, admins] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: Array.from(new Set(rows.map((r) => r.productId))) } }, select: { id: true, name: true, botCode: true } }),
    prisma.botAdmin.findMany({ where: { id: { in: Array.from(new Set(rows.map((r) => r.adminId))) } }, select: { id: true, name: true } }),
  ])
  const productOf = new Map(products.map((p) => [p.id, p]))
  const adminOf = new Map(admins.map((a) => [a.id, a.name]))
  const list = rows.map((r): IssueRecord => {
    const amountCents = centsOrNull(r.amount) ?? 0
    const costCents = centsOrNull(r.costTotal)
    return {
      at: r.createdAt,
      orderNo: r.orderNo,
      productName: productOf.get(r.productId)?.name ?? null,
      botCode: productOf.get(r.productId)?.botCode ?? null,
      quantity: r.quantity,
      unitPriceCents: centsOrNull(r.unitPrice) ?? 0,
      amountCents,
      costCents,
      profitCents: costCents === null ? null : amountCents - costCents,
      adminName: adminOf.get(r.adminId) ?? `#${r.adminId}`,
    }
  })
  return { total, list, sum }
}
