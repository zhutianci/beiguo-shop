import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'
import { success, error } from '@/lib/api'

const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码长度不能少于6位'),
  nickname: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    const { email, password, nickname } = result.data

    // 检查邮箱是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return error('该邮箱已被注册')
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

    // 设置 cookie
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return success({ user }, '注册成功')
  } catch (err) {
    console.error('Register error:', err)
    return error('注册失败，请重试')
  }
}
