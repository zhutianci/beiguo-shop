export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyPassword, signToken, authCookieOptions } from '@/lib/auth'
import { success, error } from '@/lib/api'

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    const { email, password } = result.data

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return error('邮箱或密码错误')
    }

    // 检查用户状态
    if (user.status === 0) {
      return error('账号已被禁用')
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return error('邮箱或密码错误')
    }

    // 生成 token
    const token = signToken({
      userId: user.id,
      email: user.email!,
      role: user.role,
    })

    // 设置登录 cookie（按真实协议决定 secure，30 天有效期）
    const cookieStore = await cookies()
    cookieStore.set('token', token, authCookieOptions(request))

    return success({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
      },
      // 同时下发 token，供 WebView（如微信）以 Authorization 头兜底鉴权
      token,
    }, '登录成功')
  } catch (err) {
    console.error('Login error:', err)
    return error('登录失败，请重试')
  }
}
