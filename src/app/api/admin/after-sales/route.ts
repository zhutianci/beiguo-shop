export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { parseTenantFilter, INVALID_TENANT_FILTER, siteOptions, sourceMap, sourceOf } from '@/lib/admin/source-site'

/**
 * 超管「售后申请」列表（设计 8.4、12.2；契约见实施分包 7.4）。渠道发起的退款 / 补发 / 升级 / 申请全局封禁都在这里，
 * 按渠道、类型、状态筛选；退款类点开即打开订单的退款弹窗（页面按 orderId 深链到订单页）。
 * 超管侧全字段（含内部 id），渠道侧的同一张表只经 partner-services 按 requestNo 读。
 */
const KINDS = ['REFUND', 'REISSUE', 'ESCALATE', 'BAN_REQUEST'] as const
const STATUSES = ['PENDING', 'REJECTED', 'DONE', 'CANCELLED'] as const

export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const sp = new URL(request.url).searchParams
    const site = parseTenantFilter(sp)
    if (site === 'invalid') return error(INVALID_TENANT_FILTER)
    const kind = (sp.get('kind') || '').trim()
    const status = (sp.get('status') || '').trim()
    if (kind && !(KINDS as readonly string[]).includes(kind)) return error('类型参数无效')
    if (status && !(STATUSES as readonly string[]).includes(status)) return error('状态参数无效')
    const page = Math.max(parseInt(sp.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(sp.get('pageSize') || '20') || 20, 1), 100)

    const where: Prisma.TenantAfterSaleWhereInput = {}
    if (site != null) where.tenantId = site
    if (kind) where.kind = kind
    if (status) where.status = status

    const [rows, total, pendingTotal] = await Promise.all([
      prisma.tenantAfterSale.findMany({
        where,
        // 未处理（handledAt 为空）在前，其余新的在前
        orderBy: [{ handledAt: { sort: 'asc', nulls: 'first' } }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.tenantAfterSale.count({ where }),
      prisma.tenantAfterSale.count({ where: { status: 'PENDING', ...(site != null ? { tenantId: site } : {}) } }),
    ])

    const orderIds = Array.from(new Set(rows.map((r) => r.orderId).filter((v): v is number => v != null)))
    const customerIds = Array.from(new Set(rows.map((r) => r.customerId).filter((v): v is number => v != null)))
    const [orders, customers, srcMap] = await Promise.all([
      orderIds.length
        ? prisma.order.findMany({
            where: { id: { in: orderIds } },
            select: { id: true, orderNo: true, productName: true, amount: true, payStatus: true, deliveryStatus: true, escalatedAt: true, settleVersion: true },
          })
        : Promise.resolve([]),
      customerIds.length
        ? prisma.tenantCustomer.findMany({
            where: { id: { in: customerIds } },
            select: { id: true, publicNo: true, userId: true, blockedAt: true, user: { select: { email: true, nickname: true, status: true } } },
          })
        : Promise.resolve([]),
      sourceMap(rows.map((r) => r.tenantId)),
    ])
    const oMap = new Map(orders.map((o) => [o.id, o]))
    const cMap = new Map(customers.map((c) => [c.id, c]))

    return success({
      total,
      pendingTotal,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      rows: rows.map((r) => {
        const o = r.orderId != null ? oMap.get(r.orderId) : undefined
        const c = r.customerId != null ? cMap.get(r.customerId) : undefined
        const src = sourceOf(srcMap, r.tenantId)
        return {
          id: r.id,
          requestNo: r.requestNo,
          tenant: { id: r.tenantId, code: src.code },
          source: src,
          orderNo: o?.orderNo ?? null,
          orderId: r.orderId,
          kind: r.kind,
          status: r.status,
          reason: r.reason,
          suggestedBearer: r.suggestedBearer,
          suggestedGoodsCents: r.suggestedGoodsCents,
          resultNote: r.resultNote,
          bearer: r.bearer,
          refundGoodsCents: r.refundGoodsCents,
          refundTaxCents: r.refundTaxCents,
          lossCents: r.lossCents,
          createdAt: r.createdAt,
          handledAt: r.handledAt,
          order: o
            ? {
                productName: o.productName,
                amount: Number(o.amount),
                payStatus: o.payStatus,
                deliveryStatus: o.deliveryStatus,
                escalatedAt: o.escalatedAt,
                settleVersion: o.settleVersion,
              }
            : null,
          customer: c
            ? { customerNo: c.publicNo, userId: c.userId, email: c.user.email, nickname: c.user.nickname, userStatus: c.user.status, blockedInSite: c.blockedAt != null }
            : null,
        }
      }),
      sites: await siteOptions(),
    })
  } catch (err) {
    console.error('Admin list after-sales error:', err)
    return error('查询失败')
  }
}
