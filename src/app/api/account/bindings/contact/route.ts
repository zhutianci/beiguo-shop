export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, unauthorized } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { hasAccountAccess } from '@/lib/email-proof'
import { denyOnChannel } from '@/lib/storefront/resolve'

const schema = z
  .object({
    accountEmail: z.string().email('账户邮箱格式不正确'),
    notifyEmail: z.boolean(),
    notifyPhone: z.boolean(),
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
  })
  .refine((d) => d.notifyEmail || d.notifyPhone, { message: '请至少选择一种提醒方式' })

const phoneRe = /^1[3-9]\d{9}$/
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST：保存当前用户某个已绑定账户的提醒联系方式
export async function POST(request: NextRequest) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data
    const account = d.accountEmail.trim().toLowerCase()

    // 必须是当前用户已绑定的账户
    const binding = await prisma.userAccount.findUnique({
      where: { userId_accountEmail: { userId: user.id, accountEmail: account } },
    })
    if (!binding) return error('请先绑定该账户', 403)
    // 未验证的绑定不能改提醒去向：否则绑上别人的邮箱就能把他的续费提醒改发到自己这里（审计 G14）
    if (!(await hasAccountAccess(account, user, new Set()))) return error('请先完成该账户的邮箱验证', 403)

    const email = d.email?.trim() || account
    const phone = d.phone?.trim() || ''
    if (d.notifyEmail && !emailRe.test(email)) return error('提醒邮箱格式不正确')
    if (d.notifyPhone) {
      if (!phone) return error('已勾选短信提醒，请填写手机号')
      if (!phoneRe.test(phone)) return error('手机号格式不正确')
    }

    const data = {
      email,
      phone: phone || null,
      notifyEmail: d.notifyEmail,
      notifyPhone: d.notifyPhone,
    }
    await prisma.accountContact.upsert({
      where: { claudeAccount: account },
      create: { claudeAccount: account, ...data },
      update: data,
    })

    return success({ claudeAccount: account, ...data }, '提醒方式已保存')
  } catch (err) {
    console.error('Save binding contact error:', err)
    return error('保存失败')
  }
}
