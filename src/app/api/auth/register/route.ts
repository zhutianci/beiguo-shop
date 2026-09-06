export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword, signToken, authCookieOptions } from '@/lib/auth'
import { success, error } from '@/lib/api'
import { notifyUserRegistered } from '@/lib/notify'
import { consumeCode } from '@/lib/verify-code'
import { systemEmailConfigured } from '@/lib/mail'

const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码长度不能少于6位'),
  nickname: z.string().optional(),
  code: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    const { password, nickname } = result.data
    const email = result.data.email.trim().toLowerCase()

    // 检查邮箱是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return error('该邮箱已被注册')
    }

    // 邮箱验证码校验（邮件服务已配置时强制）
    if (systemEmailConfigured()) {
      if (!result.data.code) return error('请填写邮箱验证码')
      const ok = await consumeCode(email, 'REGISTER', result.data.code)
      if (!ok) return error('验证码错误或已过期')
    }

    // 创建用户
    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        nickname: nickname || null,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        nickname: true,
        avatar: true,
        role: true,
      },
    })

    // 生成 token
    const token = signToken({
      userId: user.id,
      email: user.email!,
      role: user.role,
    })

    // 设置登录 cookie（按真实协议决定 secure，30 天有效期）
    const cookieStore = await cookies()
    cookieStore.set('token', token, authCookieOptions(request))

    // 同时下发 token，供 WebView（如微信）以 Authorization 头兜底鉴权
    notifyUserRegistered({
      email: user.email || '—',
      nickname: user.nickname,
      createdAt: new Date(), // 注册接口的 select 不含 createdAt，此处即注册时刻
    })

    return success({ user, token }, '注册成功')
  } catch (err) {
    console.error('Register error:', err)
    return error('注册失败，请重试')
  }
}
