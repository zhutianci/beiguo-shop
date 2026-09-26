export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { parseTenantFilter, INVALID_TENANT_FILTER, siteOptions, sourceMap, sourceOf } from '@/lib/admin/source-site'

/**
 * 卡密使用情况（兑换日志 RedeemLog）面板的数据（设计 5.5、12.2；契约见实施分包 7.4）。
 * 现有仓库没有任何后台入口读 redeem_logs；订单详情与卡密详情各嵌一个面板，按来源站可筛选，
 * 与渠道看到的「使用情况」对照时用（渠道只看得到动作、结果、说明、时间；这里是全字段含 ip / requestId / orderRef）。
 *
 * 来源站 = cardKeyId → CardKey.orderId → Order.tenantId。RedeemLog 与 CardKey / Order 都没有 Prisma 关系，
 * 按来源站筛选时用一条 JOIN 查询（超管侧，不受渠道层「不许 $queryRaw」的约束）。没有售出订单的卡（外部站领走、
 * 或卡已删除）归主站。
 */
const PAGE_SIZE_MAX = 100

export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const sp = new URL(request.url).searchParams
    const site = parseTenantFilter(sp)
    if (site === 'invalid') return error(INVALID_TENANT_FILTER)
    const orderId = parseInt(sp.get('orderId') || '0') || 0
    const cardKeyId = parseInt(sp.get('cardKeyId') || '0') || 0
    const provider = (sp.get('provider') || '').trim().slice(0, 20)
    const page = Math.max(parseInt(sp.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(sp.get('pageSize') || '20') || 20, 1), PAGE_SIZE_MAX)
    if (orderId < 0 || cardKeyId < 0) return error('参数无效')

    const conds: Prisma.Sql[] = []
    if (orderId) conds.push(Prisma.sql`c.order_id = ${orderId}`)
    if (cardKeyId) conds.push(Prisma.sql`r.card_key_id = ${cardKeyId}`)
    if (provider) conds.push(Prisma.sql`r.provider = ${provider}`)
    if (site != null) conds.push(Prisma.sql`COALESCE(o.tenant_id, 1) = ${site}`)
    const where = conds.length ? Prisma.sql`WHERE ${Prisma.join(conds, ' AND ')}` : Prisma.empty

    const [rows, cnt] = await Promise.all([
      prisma.$queryRaw<
        {
          id: number
          card_key_id: number | null
          provider: string
          action: string
          state: string
          message: string | null
          request_id: string | null
          order_ref: string | null
          ip: string | null
          created_at: Date
          order_id: number | null
          order_no: string | null
          tenant_id: number | null
        }[]
      >`SELECT r.id, r.card_key_id, r.provider, r.action, r.state, r.message, r.request_id, r.order_ref, r.ip, r.created_at,
               o.id AS order_id, o.order_no, o.tenant_id
          FROM redeem_logs r
          LEFT JOIN card_keys c ON c.id = r.card_key_id
          LEFT JOIN orders o ON o.id = c.order_id
          ${where}
         ORDER BY r.id DESC
         LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      prisma.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*) AS n
          FROM redeem_logs r
          LEFT JOIN card_keys c ON c.id = r.card_key_id
          LEFT JOIN orders o ON o.id = c.order_id
          ${where}`,
    ])
    const total = Number(cnt[0]?.n ?? 0)
    const srcMap = await sourceMap(rows.map((r) => Number(r.tenant_id ?? 1)))
    return success({
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      rows: rows.map((r) => ({
        id: Number(r.id),
        cardKeyId: r.card_key_id == null ? null : Number(r.card_key_id),
        provider: r.provider,
        action: r.action,
        state: r.state,
        message: r.message,
        requestId: r.request_id,
        orderRef: r.order_ref,
        ip: r.ip,
        createdAt: r.created_at,
        source: sourceOf(srcMap, Number(r.tenant_id ?? 1)),
        orderId: r.order_id == null ? null : Number(r.order_id),
        orderNo: r.order_no,
      })),
      sites: await siteOptions(),
    })
  } catch (err) {
    console.error('Admin redeem logs error:', err)
    return error('查询失败')
  }
}
