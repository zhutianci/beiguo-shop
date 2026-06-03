export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
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
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get('days') || String(REMIND_WITHIN_DAYS)), 60)

    const now = new Date()
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    const today = new Date(todayUtc)
    const max = new Date(todayUtc + (days + 1) * 86400000)

    const orders = await prisma.externalOrder.findMany({
      where: { expireDate: { gte: today, lt: max } },
      orderBy: { expireDate: 'asc' },
    })

    const accounts = Array.from(new Set(orders.map((o) => o.claudeAccount)))
    const contacts = accounts.length
      ? await prisma.accountContact.findMany({ where: { claudeAccount: { in: accounts } } })
      : []
    const contactMap = new Map(contacts.map((c) => [c.claudeAccount, c]))

    const list = orders.map((o) => {
      const resolved = resolveContact(o.claudeAccount, contactMap.get(o.claudeAccount) || null)
      const autoReminded = isSameUtcDate(o.remindedExpireDate, o.expireDate)
      const hasChannel =
        (resolved.notifyEmail && !!resolved.email) || (resolved.notifyPhone && !!resolved.phone)
      return {
        id: o.id,
        startDate: o.startDate,
        expireDate: o.expireDate,
        subscriptionType: o.subscriptionType,
        xianyuNickname: o.xianyuNickname,
        claudeAccount: o.claudeAccount,
        daysLeft: daysUntilExpire(o.expireDate),
        lastRemindedAt: o.lastRemindedAt,
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
      total: list.length,
      withinDays: days,
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
