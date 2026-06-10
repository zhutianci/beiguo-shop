export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { hashPassword } from '@/lib/auth'
import { consumeCode } from '@/lib/verify-code'

const schema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  code: z.string().min(4, '请输入验证码'),
  password: z.string().min(6, '密码长度不能少于6位'),
})

// 通过邮箱验证码重置密码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const email = parsed.data.email.trim().toLowerCase()

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) return error('验证码错误或已过期') // 不暴露邮箱是否存在

    const ok = await consumeCode(email, 'RESET', parsed.data.code)
    if (!ok) return error('验证码错误或已过期')

    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } })
    return success({ ok: true }, '密码已重置，请用新密码登录')
  } catch (err) {
    console.error('Reset password error:', err)
    return error('重置失败')
  }
}
