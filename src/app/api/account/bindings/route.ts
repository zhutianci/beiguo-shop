export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, unauthorized } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { denyOnChannel } from '@/lib/storefront/resolve'

// 每个绑定账户展示的最近订单条数
const RECENT_ORDER_LIMIT = 5
// 每个用户最多绑定的账户数（以前没有上限）
const MAX_BINDINGS_PER_USER = 20

// GET：当前用户绑定的账户列表（分页；每个账户只带最近 5 条订单 + 总数 + 提醒联系方式）
export async function GET(request: NextRequest) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
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

    // 【只有验证过的绑定才能看订阅记录与提醒联系方式（2026-09-26 审计 G14）】
    // 以前绑定任意邮箱不需要验证，绑上就能看对方的订阅记录与完整提醒手机号、改对方的提醒去向。
    // 已验证 = 绑定时用验证码证明过（verifiedAt），或就是本人已验证的登录邮箱
    const me = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true, emailVerifiedAt: true } })
    const selfEmail = (me?.email || '').trim().toLowerCase()
    const isVerified = (b: { verifiedAt: Date | null; accountEmail: string }) =>
      !!b.verifiedAt || (!!me?.emailVerifiedAt && !!selfEmail && selfEmail === b.accountEmail)
    const verifiedFlags = bindings.map(isVerified)
    const emails = bindings.filter((_, i) => verifiedFlags[i]).map((b) => b.accountEmail)

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
        bindings.map((b, i) =>
          !verifiedFlags[i]
            ? Promise.resolve([] as { id: number; subscriptionType: string; startDate: Date; expireDate: Date }[])
            : prisma.externalOrder.findMany({
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
      const verified = verifiedFlags[i]
      const recent = recentPerAccount[i]
      const latest = recent[0] || null
      const contact = contacts.find((c) => c.claudeAccount === b.accountEmail)
      return {
        id: b.id,
        accountEmail: b.accountEmail,
        platform: b.platform,
        label: b.label,
        verified,
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
        contact: verified
          ? {
              email: contact?.email ?? b.accountEmail,
              phone: contact?.phone ?? '',
              notifyEmail: contact?.notifyEmail ?? true,
              notifyPhone: contact?.notifyPhone ?? false,
            }
          : null,
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
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
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

    const count = await prisma.userAccount.count({ where: { userId: user.id } })
    if (count >= MAX_BINDINGS_PER_USER) return error(`最多绑定 ${MAX_BINDINGS_PER_USER} 个账户`)

    // 绑定本人已验证的登录邮箱：直接视为已验证；其它邮箱要收验证码（/api/account/bindings/send-code → verify）
    const me = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true, emailVerifiedAt: true } })
    const isSelfVerified = !!me?.emailVerifiedAt && (me.email || '').trim().toLowerCase() === accountEmail

    const created = await prisma.userAccount.create({
      data: {
        userId: user.id,
        accountEmail,
        platform: parsed.data.platform,
        label: parsed.data.label?.trim() || null,
        verifiedAt: isSelfVerified ? new Date() : null,
      },
    })

    return success(
      { id: created.id, verified: isSelfVerified },
      isSelfVerified ? '绑定成功' : '已添加，请获取验证码完成验证后查看订阅记录'
    )
  } catch (err) {
    if ((err as { code?: string })?.code === 'P2002') return error('该账户已绑定') // 并发重复提交靠唯一约束兜底
    console.error('Create binding error:', err)
    return error('绑定失败')
  }
}
