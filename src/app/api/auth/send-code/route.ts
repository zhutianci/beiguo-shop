export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { createCode, tooFrequent } from '@/lib/verify-code'
import { sendVerifyCodeEmail, systemEmailConfigured } from '@/lib/mail'

const schema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  purpose: z.enum(['REGISTER', 'RESET']),
})

export async function POST(request: NextRequest) {
  try {
    if (!systemEmailConfigured()) return error('邮件服务未配置，暂时无法发送验证码', 500)

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const email = parsed.data.email.trim().toLowerCase()
    const purpose = parsed.data.purpose

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (purpose === 'REGISTER' && user) return error('该邮箱已被注册，请直接登录')
    if (purpose === 'RESET' && !user) {
      // 防枚举：不暴露邮箱是否存在，统一返回已发送
      return success({ sent: true }, '若该邮箱已注册，验证码已发送')
    }

    if (await tooFrequent(email, purpose)) return error('验证码发送过于频繁，请 60 秒后再试')

    const code = await createCode(email, purpose)
    const r = await sendVerifyCodeEmail(email, code, purpose)
    if (!r.ok) {
      console.error('send verify code failed:', r.detail)
      return error('验证码发送失败，请稍后重试')
    }
    return success({ sent: true }, '验证码已发送，请查收邮箱')
  } catch (err) {
    console.error('Send code error:', err)
    return error('发送失败')
  }
}
