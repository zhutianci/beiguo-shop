export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, unauthorized, notFound } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { createCode, tooFrequent } from '@/lib/verify-code'
import { sendVerifyCodeEmail, systemEmailConfigured } from '@/lib/mail'
import { sendCodeGate } from '@/lib/auth-throttle'
import { rateLimited } from '@/lib/news/rate-limit'

const schema = z.object({ accountEmail: z.string().email('账户邮箱格式不正确') })

/**
 * 给「待验证」的绑定账户邮箱发验证码（与邮箱查订阅同一种 LOOKUP 码：证明的是同一件事——你是这个邮箱的主人）。
 * 只对当前用户自己已添加、尚未验证的绑定发，且按用户另限次数，免得被拿来给任意邮箱发信。
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (!systemEmailConfigured()) return error('邮件服务暂不可用，请稍后再试', 503)

    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const accountEmail = parsed.data.accountEmail.trim().toLowerCase()

    const binding = await prisma.userAccount.findUnique({
      where: { userId_accountEmail: { userId: user.id, accountEmail } },
      select: { id: true, verifiedAt: true },
    })
    if (!binding) return notFound('请先添加该账户')
    if (binding.verifiedAt) return success({ verified: true }, '该账户已验证')

    if (rateLimited(`bindsend-u:${user.id}`, { windowMs: 3600_000, max: 10 })) {
      return error('发送过于频繁，请稍后再试', 429)
    }
    const gate = sendCodeGate(request.headers, accountEmail, 'LOOKUP')
    if (gate) return error(gate.message, 429)
    if (await tooFrequent(accountEmail, 'LOOKUP')) return error('验证码发送过于频繁，请 60 秒后再试', 429)

    const code = await createCode(accountEmail, 'LOOKUP')
    const r = await sendVerifyCodeEmail(accountEmail, code, 'LOOKUP')
    if (!r.ok) {
      console.error('binding send-code mail failed:', r.detail)
      return error('验证码发送失败，请稍后重试')
    }
    return success({ sent: true }, '验证码已发送至该账户邮箱，请查收（含垃圾箱）')
  } catch (err) {
    console.error('Binding send-code error:', err)
    return error('发送失败')
  }
}
