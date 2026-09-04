export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, unauthorized } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'

// 每个绑定账户展示的最近订单条数
const RECENT_ORDER_LIMIT = 5

// GET：当前用户绑定的账户列表（分页；每个账户只带最近 5 条订单 + 总数 + 提醒联系方式）
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10') || 10, 1), 50)

    const where = { userId: user.id }
    const [bindings, total] = await Promise.all([
      prisma.userAccount.findMany({
        where,
        // id 兜底，保证翻页稳定（不重不漏）
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.userAccount.count({ where }),
    ])

    const emails = bindings.map((b) => b.accountEmail)

    // 联系方式 + 每个账户的订单总数（聚合，不拉明细）+ 每个账户最近 5 条订单
    // 每个账户只取最近 5 条（本页最多 pageSize 个小查询，走 claudeAccount 索引）
    const [contacts, orderCounts, recentPerAccount] = await Promise.all([
      prisma.accountContact.findMany({ where: { claudeAccount: { in: emails } } }),
      prisma.externalOrder.groupBy({
        by: ['claudeAccount'],
        where: { claudeAccount: { in: emails } },
        _count: { _all: true },
      }),
      Promise.all(
        bindings.map((b) =>
          prisma.externalOrder.findMany({
            where: { claudeAccount: b.accountEmail },
            orderBy: [{ expireDate: 'desc' }, { startDate: 'desc' }],
            take: RECENT_ORDER_LIMIT,
            select: { id: true, subscriptionType: true, startDate: true, expireDate: true },
          })
        )
      ),
    ])

    const countMap = new Map(orderCounts.map((c) => [c.claudeAccount, c._count._all]))
    const now = new Date()
    const list = bindings.map((b, i) => {
      const recent = recentPerAccount[i]
      const latest = recent[0] || null
      const contact = contacts.find((c) => c.claudeAccount === b.accountEmail)
      return {
        id: b.id,
        accountEmail: b.accountEmail,
        platform: b.platform,
        label: b.label,
        orderCount: countMap.get(b.accountEmail) ?? 0,
        latest: latest
          ? {
              subscriptionType: latest.subscriptionType,
              startDate: latest.startDate,
              expireDate: latest.expireDate,
            }
          : null,
        recent,
        active: latest ? new Date(latest.expireDate) >= now : false,
        contact: {
          email: contact?.email ?? b.accountEmail,
          phone: contact?.phone ?? '',
          notifyEmail: contact?.notifyEmail ?? true,
          notifyPhone: contact?.notifyPhone ?? false,
        },
      }
    })

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    })
  } catch (err) {
    console.error('List bindings error:', err)
    return error('查询失败')
  }
}

const createSchema = z.object({
  accountEmail: z.string().email('账户邮箱格式不正确'),
  platform: z.enum(['CLAUDE', 'CHATGPT', 'OTHER']).optional().default('CLAUDE'),
  label: z.string().trim().max(50).optional().nullable(),
})

// POST：绑定一个账户邮箱
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const accountEmail = parsed.data.accountEmail.trim().toLowerCase()

    const existing = await prisma.userAccount.findUnique({
      where: { userId_accountEmail: { userId: user.id, accountEmail } },
    })
    if (existing) return error('该账户已绑定')

    const created = await prisma.userAccount.create({
      data: {
        userId: user.id,
        accountEmail,
        platform: parsed.data.platform,
        label: parsed.data.label?.trim() || null,
      },
    })

    return success({ id: created.id }, '绑定成功')
  } catch (err) {
    console.error('Create binding error:', err)
    return error('绑定失败')
  }
}
