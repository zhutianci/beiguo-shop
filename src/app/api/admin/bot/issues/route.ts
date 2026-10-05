export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { bjDayStart } from '@/lib/marketing/time'
import { readBotConfig } from '@/lib/bot/config'
import { pageOf } from '@/app/api/admin/bot/_lib/common'
import type { IssueListDTO, RestockListDTO, RestockRowDTO, RestockState } from '@/app/admin/bot/types'

type Simple = Record<string, string | number | boolean | null>

/** 名字像卡密 / 令牌 / 口令的键：它们的字符串值一律不往页面给 */
const SENSITIVE_KEY = /card|cdk|secret|token|content|key|pass|code|text|raw/i

/**
 * 令牌参数 / 导入结果是别的会话写进 JSON 列的，形状不归这里管：只留第一层的数字、布尔、null 与 ≤ 100 字的字符串，
 * 数组与嵌套对象整个丢掉，键名像卡密 / 令牌的字符串值也丢掉（数字与布尔不可能是卡密，照留，例如「导入张数」）——
 * 就算补货功能将来往 result 里多存了东西，后台列表也不会把卡密带出来。
 */
function simpleOf(v: unknown): Simple | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const out: Simple = {}
  const entries = Object.entries(v as Record<string, unknown>)
  for (let i = 0; i < entries.length && Object.keys(out).length < 12; i++) {
    const [k, val] = entries[i]
    if (typeof val === 'number' || typeof val === 'boolean' || val === null) out[k] = val
    else if (typeof val === 'string' && val.length <= 100 && !SENSITIVE_KEY.test(k)) out[k] = val
  }
  return Object.keys(out).length ? out : null
}

function productIdOf(...sources: Array<Simple | null>): number | null {
  for (let i = 0; i < sources.length; i++) {
    const v = sources[i]?.productId
    const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d{1,9}$/.test(v) ? Number(v) : null
    if (n && n > 0) return n
  }
  return null
}

/**
 * 提卡与补货记录（docs/微信机器人-设计.md §14）。两张表都是别的会话写入的，这里**只读**：
 *  · ?type=issue（默认）：bot_card_issues——订单号可跳订单详情（/admin/orders?orderId=）、商品与货号、单价 / 金额 / 成本 / 利润、
 *    发起的管理员与会话；附「今日已提卡张数 / 金额」与每日上限，方便一眼看出离上限还有多远。卡的内容与卡 id 不返回；
 *  · ?type=restock：bot_action_tokens（action = RESTOCK）——补货链接的状态（待使用 / 已使用 / 已作废 / 已过期）、谁在哪个群发起、
 *    使用时间与 IP、导入结果摘要。令牌哈希不返回。
 * 分页：?page=&pageSize=（默认 20，最多 100）。
 */
export async function GET(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const sp = request.nextUrl.searchParams
    const type = sp.get('type') === 'restock' ? 'restock' : 'issue'
    const { page, pageSize, skip } = pageOf(sp, 20, 100)
    const now = new Date()

    if (type === 'issue') {
      const dayStart = bjDayStart(now)
      const [total, rows, today, cfg] = await Promise.all([
        prisma.botCardIssue.count(),
        prisma.botCardIssue.findMany({ orderBy: { id: 'desc' }, skip, take: pageSize }),
        prisma.botCardIssue.aggregate({ where: { createdAt: { gte: dayStart } }, _sum: { quantity: true, amount: true }, _count: { _all: true } }),
        readBotConfig(),
      ])
      const [products, admins, convs] = await Promise.all([
        prisma.product.findMany({ where: { id: { in: Array.from(new Set(rows.map((r) => r.productId))) } }, select: { id: true, name: true, botCode: true } }),
        prisma.botAdmin.findMany({ where: { id: { in: Array.from(new Set(rows.map((r) => r.adminId))) } }, select: { id: true, name: true } }),
        prisma.botConversation.findMany({ where: { id: { in: Array.from(new Set(rows.map((r) => r.conversationId))) } }, select: { id: true, name: true, kind: true } }),
      ])
      const pMap = new Map(products.map((p) => [p.id, p]))
      const aMap = new Map(admins.map((a) => [a.id, a.name]))
      const cMap = new Map(convs.map((c) => [c.id, c]))
      const dto: IssueListDTO = {
        type: 'issue',
        page,
        pageSize,
        total,
        list: rows.map((r) => {
          const amount = Number(r.amount)
          const costTotal = r.costTotal === null ? null : Number(r.costTotal)
          return {
            id: r.id,
            createdAt: r.createdAt.toISOString(),
            commandId: r.commandId,
            orderId: r.orderId,
            orderNo: r.orderNo,
            productId: r.productId,
            productName: pMap.get(r.productId)?.name ?? null,
            botCode: pMap.get(r.productId)?.botCode ?? null,
            quantity: r.quantity,
            unitPrice: Number(r.unitPrice),
            amount,
            costTotal,
            profit: costTotal === null ? null : Math.round((amount - costTotal) * 100) / 100,
            cardCount: Array.isArray(r.cardIds) ? r.cardIds.length : null,
            adminName: aMap.get(r.adminId) ?? `#${r.adminId}`,
            conversationName: cMap.get(r.conversationId)?.name ?? null,
            conversationKind: cMap.get(r.conversationId)?.kind ?? null,
          }
        }),
        today: { count: today._count._all, quantity: today._sum.quantity ?? 0, amount: Number(today._sum.amount ?? 0) },
        caps: cfg.ok ? { ...cfg.config.caps } : null,
      }
      return success(dto)
    }

    const where = { action: 'RESTOCK' }
    const [total, rows] = await Promise.all([
      prisma.botActionToken.count({ where }),
      prisma.botActionToken.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: pageSize,
        select: { id: true, createdAt: true, expiresAt: true, usedAt: true, usedIp: true, revokedAt: true, commandId: true, adminId: true, conversationId: true, params: true, result: true },
      }),
    ])
    const parsed = rows.map((r) => ({ r, params: simpleOf(r.params), result: simpleOf(r.result) }))
    const productIds = Array.from(new Set(parsed.map((x) => productIdOf(x.params, x.result)).filter((x): x is number => !!x)))
    const [products, admins, convs] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }),
      prisma.botAdmin.findMany({ where: { id: { in: Array.from(new Set(rows.map((r) => r.adminId))) } }, select: { id: true, name: true } }),
      prisma.botConversation.findMany({ where: { id: { in: Array.from(new Set(rows.map((r) => r.conversationId))) } }, select: { id: true, name: true, kind: true } }),
    ])
    const pMap = new Map(products.map((p) => [p.id, p.name]))
    const aMap = new Map(admins.map((a) => [a.id, a.name]))
    const cMap = new Map(convs.map((c) => [c.id, c]))
    const dto: RestockListDTO = {
      type: 'restock',
      page,
      pageSize,
      total,
      list: parsed.map(({ r, params, result }): RestockRowDTO => {
        const state: RestockState = r.usedAt ? 'USED' : r.revokedAt ? 'REVOKED' : r.expiresAt.getTime() <= now.getTime() ? 'EXPIRED' : 'PENDING'
        const pid = productIdOf(params, result)
        return {
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          expiresAt: r.expiresAt.toISOString(),
          usedAt: r.usedAt ? r.usedAt.toISOString() : null,
          usedIp: r.usedIp,
          revokedAt: r.revokedAt ? r.revokedAt.toISOString() : null,
          state,
          commandId: r.commandId,
          adminName: aMap.get(r.adminId) ?? `#${r.adminId}`,
          conversationName: cMap.get(r.conversationId)?.name ?? null,
          conversationKind: cMap.get(r.conversationId)?.kind ?? null,
          params,
          result,
          productName: pid ? pMap.get(pid) ?? null : null,
        }
      }),
    }
    return success(dto)
  } catch (e) {
    console.error('[bot-admin] 提卡与补货记录失败', e)
    return error('读取提卡与补货记录失败', 500)
  }
}
