export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, unauthorized } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'

// GET：当前用户绑定的账户列表（含订单概览 + 提醒联系方式）
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const bindings = await prisma.userAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    const emails = bindings.map((b) => b.accountEmail)
    const [orders, contacts] = await Promise.all([
      emails.length
        ? prisma.externalOrder.findMany({
            where: { claudeAccount: { in: emails } },
            orderBy: [{ expireDate: 'desc' }, { startDate: 'desc' }],
            select: { claudeAccount: true, subscriptionType: true, startDate: true, expireDate: true },
          })
        : Promise.resolve([]),
      emails.length
        ? prisma.accountContact.findMany({ where: { claudeAccount: { in: emails } } })
        : Promise.resolve([]),
    ])

    const now = new Date()
    const list = bindings.map((b) => {
      const acctOrders = orders.filter((o) => o.claudeAccount === b.accountEmail)
      const latest = acctOrders[0] || null
      const contact = contacts.find((c) => c.claudeAccount === b.accountEmail)
      return {
        id: b.id,
        accountEmail: b.accountEmail,
        platform: b.platform,
        label: b.label,
        orderCount: acctOrders.length,
        latest: latest
          ? {
              subscriptionType: latest.subscriptionType,
              startDate: latest.startDate,
              expireDate: latest.expireDate,
            }
          : null,
        active: latest ? new Date(latest.expireDate) >= now : false,
        contact: {
          email: contact?.email ?? b.accountEmail,
          phone: contact?.phone ?? '',
          notifyEmail: contact?.notifyEmail ?? true,
          notifyPhone: contact?.notifyPhone ?? false,
        },
      }
    })

    return success({ list })
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
