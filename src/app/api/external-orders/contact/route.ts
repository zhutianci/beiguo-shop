export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

// GET：查询某账户已保存的提醒联系方式（无记录时返回默认值：邮箱=账户邮箱）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const emailRaw = searchParams.get('email')?.trim().toLowerCase() || ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      return error('请输入正确的邮箱')
    }

    // 必须是真实下单过的账户
    const order = await prisma.externalOrder.findFirst({
      where: { claudeAccount: emailRaw },
      select: { id: true },
    })
    if (!order) {
      return error('该邮箱暂无订单记录，无法设置提醒')
    }

    const contact = await prisma.accountContact.findUnique({
      where: { claudeAccount: emailRaw },
    })

    return success({
      exists: !!contact,
      contact: {
        claudeAccount: emailRaw,
        email: contact?.email ?? emailRaw, // 默认 = 账户邮箱
        phone: contact?.phone ?? '',
        notifyEmail: contact?.notifyEmail ?? true,
        notifyPhone: contact?.notifyPhone ?? false,
      },
    })
  } catch (err) {
    console.error('Get contact error:', err)
    return error('查询失败')
  }
}

const saveSchema = z
  .object({
    claudeAccount: z.string().email('账户邮箱格式不正确'),
    notifyEmail: z.boolean(),
    notifyPhone: z.boolean(),
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
  })
  .refine((d) => d.notifyEmail || d.notifyPhone, {
    message: '请至少选择一种提醒方式',
  })

const phoneRe = /^1[3-9]\d{9}$/
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST：保存/更新提醒联系方式
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = saveSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const d = parsed.data
    const account = d.claudeAccount.trim().toLowerCase()

    // 必须是真实下单过的账户
    const order = await prisma.externalOrder.findFirst({
      where: { claudeAccount: account },
      select: { id: true },
    })
    if (!order) {
      return error('该邮箱暂无订单记录，无法设置提醒')
    }

    const email = d.email?.trim() || account // 留空则用账户邮箱
    const phone = d.phone?.trim() || ''

    if (d.notifyEmail && !emailRe.test(email)) {
      return error('提醒邮箱格式不正确')
    }
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
    console.error('Save contact error:', err)
    return error('保存失败')
  }
}
