export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyPasswordOrDummy, signToken, authCookieOptions } from '@/lib/auth'
import { success, error } from '@/lib/api'
import { loginThrottle } from '@/lib/auth-throttle'

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
})

// 旧版 prisma/seed.ts 写死的默认管理员密码（admin123）的哈希。任何还持有它的账号都不许登录，
// 不管生产库有没有被手工处理过——这个值在仓库里是公开的。bcrypt 每次随机加盐，正常用户的哈希不可能与它相同。
const LEGACY_SEED_HASH = '$2a$10$1nwsaZ4SDtsUmEDBml2MMuGK2WZb1MlJJxmrxQfIexqqV/fHqyiei'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    const { email, password } = result.data

    // 在查库与 bcrypt 之前限流：挡撞库，也挡拿 bcrypt 打满 CPU（lib/auth-throttle.ts）
    const blocked = loginThrottle(request.headers, email)
    if (blocked) return error(blocked, 429)

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (user && user.passwordHash === LEGACY_SEED_HASH) {
      console.warn('[login] 拒绝使用旧种子默认密码的账号 id=', user.id)
      return error('邮箱或密码错误')
    }

    // 用户不存在时也跑一次同成本的 bcrypt，时延与存在时一致（防枚举）
    const isValid = await verifyPasswordOrDummy(password, user?.passwordHash)
    if (!user || !isValid) {
      return error('邮箱或密码错误')
    }

    // 禁用提示放在密码校验之后：只有知道密码的人才能看到这句，否则它本身就能用来枚举
    if (user.status === 0) {
      return error('账号已被禁用')
    }

    // 生成 token
    const token = signToken({
      userId: user.id,
      email: user.email!,
      role: user.role,
      sv: user.sessionEpoch, // 会话版本，重置密码后旧 token 失效（lib/auth.ts）
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
