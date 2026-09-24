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
import { adminGuard } from '@/lib/admin-guard'

// 后台：即将到期（默认 7 日内）订单列表 + 联系人 + 提醒状态 + 服务配置状态
// 「已过期=全部」时时间窗等于全表，因此必须分页 + 用 count 统计，不能把订单全读进内存
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
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

    /*
     * 【排除「背书外部订单」】sourceKey 以 order: 开头的那些行，是买家在本站下单后
     * 为了让发票/收据有开通-到期日期可印而造出来的，expireDate 是「付款日 + 1 个月」
     * 硬写的假日期，跟真实订阅周期没有任何关系。
     *
     * 自动提醒那条路已经靠 remindedExpireDate 跳过它们（见 lib/order-invoice.ts），
     * 但**后台这条路没防住**：本列表按 lastRemindedAt 判「未提醒」，背书行是 null，
     * 于是它们会挤满「仅未提醒」筛选；管理员一次「全选 → 发送提醒」，
     * 就会给一批买了一次性卡密的真实客户群发「你的订阅即将到期，请续费」。
     *
     * 自从结算页加了「同时开具增值税发票」的复选框，这种行的产生量级和改造前
     * 完全不是一个数量级（原来要买家主动点「申请发票/收据」才会有一条）。
     */
    const notEndorsement: Prisma.ExternalOrderWhereInput = {
      NOT: { sourceKey: { startsWith: 'order:' } },
    }
    // 时间窗（统计口径：不受提醒状态筛选影响，与旧版一致）
    const rangeWhere: Prisma.ExternalOrderWhereInput = {
      expireDate: { gte: min, lt: max },
      ...notEndorsement,
    }
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
      prisma.externalOrder.count({ where: { expireDate: { gte: min, lt: today }, ...notEndorsement } }),
      prisma.externalOrder.count({ where: { expireDate: { gte: today, lt: max }, ...notEndorsement } }),
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
