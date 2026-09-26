export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { parseTenantFilter, INVALID_TENANT_FILTER, siteOptions, sourceMap, sourceOf } from '@/lib/admin/source-site'

/**
 * 获取所有用户：关键词（服务端检索，避免只搜当前页）+ 分页。
 *
 * 渠道分站（设计 5.5、12.2；契约见实施分包 7.4）新增：
 *  · 筛选 regTenant（注册站）、site（与某站有关：在该站下过单，或是该渠道的客户 / 主站注册）、crossSite=1（在注册站之外下过单）、
 *    blockedIn=<渠道 id>（被该站限制下单）、member=1（有效渠道成员）；
 *  · 行新增 registeredTenant / source（= 注册站）、siteOrderCounts（各站订单数徽章）、isMember、blockedIn。
 * 不带这些参数时 where 与原来完全一样（主站列表的数字不变）；附加字段只按当前页汇总。
 */
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const { searchParams } = new URL(request.url)
    const keyword = (searchParams.get('keyword') || '').trim()
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20') || 20, 1), 100)
    // 通用的 tenantId=<id>|all（分包 7.4「所有列表接口」）在用户列表上等同 regTenant（行的 source = 注册站）；两者都给时以 regTenant 为准
    const regTenant = parseTenantFilter(searchParams, searchParams.get('regTenant') ? 'regTenant' : 'tenantId')
    const site = parseTenantFilter(searchParams, 'site')
    const blockedIn = parseTenantFilter(searchParams, 'blockedIn')
    if (regTenant === 'invalid' || site === 'invalid' || blockedIn === 'invalid') return error(INVALID_TENANT_FILTER)
    const crossSite = ['1', 'true'].includes((searchParams.get('crossSite') || '').toLowerCase())
    const memberOnly = ['1', 'true'].includes((searchParams.get('member') || '').toLowerCase())

    const where: Prisma.UserWhereInput = {}
    const and: Prisma.UserWhereInput[] = []
    if (keyword) {
      const or: Prisma.UserWhereInput[] = [
        { email: { contains: keyword } },
        { nickname: { contains: keyword } },
        { phone: { contains: keyword } },
        { referralCode: { contains: keyword } },
      ]
      // 纯数字关键词同时按用户 ID 精确匹配
      const asId = Number(keyword)
      if (Number.isInteger(asId) && asId > 0) or.push({ id: asId })
      where.OR = or
    }
    if (regTenant != null) and.push({ registeredTenantId: regTenant })
    if (site != null) {
      // 与某站「有关」：在该站下过单；渠道另含该渠道的客户关系（在该渠道注册的也有行），主站另含主站注册
      and.push({
        OR: [
          { orders: { some: { tenantId: site } } },
          site === 1 ? { registeredTenantId: 1 } : { tenantCustomers: { some: { tenantId: site } } },
        ],
      })
    }
    if (blockedIn != null) and.push({ tenantCustomers: { some: { tenantId: blockedIn, blockedAt: { not: null } } } })
    if (crossSite) {
      // 「跨站」= 在注册站之外的站下过单（列与列比较 Prisma where 写不出来，先取 id）
      const ids = await prisma.$queryRaw<{ id: number }[]>`
        SELECT DISTINCT u.id FROM users u JOIN orders o ON o.user_id = u.id WHERE o.tenant_id <> u.registered_tenant_id LIMIT 20000`
      and.push({ id: { in: ids.map((r) => Number(r.id)) } })
    }
    if (memberOnly) {
      const ms = await prisma.tenantMember.findMany({ where: { status: 1 }, select: { userId: true }, distinct: ['userId'] })
      and.push({ id: { in: ms.map((m) => m.userId) } })
    }
    if (and.length) where.AND = and

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          nickname: true,
          avatar: true,
          balance: true,
          vipLevel: true,
          role: true,
          status: true,
          registeredTenantId: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    // 当前页的站点关系：各站订单数、成员身份、在哪些站被限制下单
    const ids = users.map((u) => u.id)
    const [grouped, members, blocked] = ids.length
      ? await Promise.all([
          prisma.order.groupBy({ by: ['userId', 'tenantId'], where: { userId: { in: ids } }, _count: { _all: true } }),
          prisma.tenantMember.findMany({ where: { userId: { in: ids }, status: 1 }, select: { userId: true, tenantId: true, role: true } }),
          prisma.tenantCustomer.findMany({ where: { userId: { in: ids }, blockedAt: { not: null } }, select: { userId: true, tenantId: true } }),
        ])
      : [[], [], []]
    const counts = new Map<number, { tenantId: number; count: number }[]>()
    for (const g of grouped) {
      const arr = counts.get(g.userId) ?? []
      arr.push({ tenantId: g.tenantId, count: g._count._all })
      counts.set(g.userId, arr)
    }
    const srcMap = await sourceMap([
      ...users.map((u) => u.registeredTenantId),
      ...grouped.map((g) => g.tenantId),
      ...members.map((m) => m.tenantId),
      ...blocked.map((b) => b.tenantId),
    ])

    const list = users.map((u) => {
      const siteOrderCounts = (counts.get(u.id) ?? []).sort((a, b) => a.tenantId - b.tenantId).map((c) => ({ ...c, code: sourceOf(srcMap, c.tenantId).code }))
      const reg = sourceOf(srcMap, u.registeredTenantId)
      return {
        ...u,
        registeredTenant: reg,
        source: reg,
        siteOrderCounts,
        crossSite: siteOrderCounts.some((c) => c.tenantId !== u.registeredTenantId),
        isMember: members.some((m) => m.userId === u.id),
        memberOf: members.filter((m) => m.userId === u.id).map((m) => ({ ...sourceOf(srcMap, m.tenantId), role: m.role })),
        blockedIn: blocked.filter((b) => b.userId === u.id).map((b) => b.tenantId),
      }
    })

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      sites: await siteOptions(),
    })
  } catch (err) {
    console.error('Get users error:', err)
    return error('获取用户列表失败')
  }
}
