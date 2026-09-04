export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { emailConfigured, smsConfigured } from '@/lib/aliyun'
import {
  REMIND_WITHIN_DAYS,
  daysUntilExpire,
  isSameUtcDate,
  resolveContact,
} from '@/lib/reminder'

// 后台：即将到期（默认 7 日内）订单列表 + 联系人 + 提醒状态 + 服务配置状态
// 「已过期=全部」时时间窗等于全表，因此必须分页 + 用 count 统计，不能把订单全读进内存
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get('days') || String(REMIND_WITHIN_DAYS)), 60)
    // 已过期回溯天数：0=不显示过期，3650≈全部
    const expiredDays = Math.min(Math.max(parseInt(searchParams.get('expiredDays') || '30'), 0), 3650)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20'), 1), 100)
    // 提醒状态筛选：all（默认） | unreminded | reminded
    const remindFilter = searchParams.get('reminded')?.trim() || 'all'

    const now = new Date()
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    const today = new Date(todayUtc)
    const min = new Date(todayUtc - expiredDays * 86400000)
    const max = new Date(todayUtc + (days + 1) * 86400000)

    // 时间窗（统计口径：不受提醒状态筛选影响，与旧版一致）
    const rangeWhere: Prisma.ExternalOrderWhereInput = { expireDate: { gte: min, lt: max } }
    // 列表口径：时间窗 + 提醒状态
    const where: Prisma.ExternalOrderWhereInput = { ...rangeWhere }
    if (remindFilter === 'unreminded') where.lastRemindedAt = null
    else if (remindFilter === 'reminded') where.lastRemindedAt = { not: null }

    const [orders, total, expiredCount, upcomingCount] = await Promise.all([
      prisma.externalOrder.findMany({
        where,
        orderBy: [{ expireDate: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.externalOrder.count({ where }),
      prisma.externalOrder.count({ where: { expireDate: { gte: min, lt: today } } }),
      prisma.externalOrder.count({ where: { expireDate: { gte: today, lt: max } } }),
    ])

    const accounts = Array.from(new Set(orders.map((o) => o.claudeAccount)))
    const contacts = accounts.length
      ? await prisma.accountContact.findMany({ where: { claudeAccount: { in: accounts } } })
      : []
    const contactMap = new Map(contacts.map((c) => [c.claudeAccount, c]))

    const list = orders.map((o) => {
      const resolved = resolveContact(o.claudeAccount, contactMap.get(o.claudeAccount) || null)
      const autoReminded = isSameUtcDate(o.remindedExpireDate, o.expireDate)
      const daysLeft = daysUntilExpire(o.expireDate)
      const hasChannel =
        (resolved.notifyEmail && !!resolved.email) || (resolved.notifyPhone && !!resolved.phone)
      return {
        id: o.id,
        startDate: o.startDate,
        expireDate: o.expireDate,
        subscriptionType: o.subscriptionType,
        xianyuNickname: o.xianyuNickname,
        claudeAccount: o.claudeAccount,
        daysLeft,
        expired: daysLeft < 0,   // 已过期（自动任务不发，仅后台手动）
        lastRemindedAt: o.lastRemindedAt,
        reminded: !!o.lastRemindedAt, // 是否提醒过（含手动）
        autoReminded,            // 已自动提醒（本周期），自动任务会跳过
        contact: {
          email: resolved.email,
          phone: resolved.phone,
          notifyEmail: resolved.notifyEmail,
          notifyPhone: resolved.notifyPhone,
          isDefault: resolved.isDefault, // true = 用户未填写，使用默认邮箱
        },
        hasChannel,
      }
    })

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      withinDays: days,
      expiredDays,
      upcomingCount,
      expiredCount,
      config: {
        email: emailConfigured(),
        sms: smsConfigured(),
      },
    })
  } catch (err) {
    console.error('Get reminders error:', err)
    return error('查询失败')
  }
}
