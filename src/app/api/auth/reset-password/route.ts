export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { hashPassword } from '@/lib/auth'
import { consumeCode } from '@/lib/verify-code'
import { verifyIpLimited, clearLoginThrottle } from '@/lib/auth-throttle'

const schema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  code: z.string().min(4, '请输入验证码'),
  password: z.string().min(6, '密码长度不能少于6位'),
})

// 统一失败文案：不存在的邮箱、错码、码被试爆，对外都长一个样（不给枚举新增信号）
const BAD_CODE = '验证码错误或已过期，多次输错请重新获取验证码'

// 通过邮箱验证码重置密码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const email = parsed.data.email.trim().toLowerCase()

    // 按 IP 限提交次数；每张码另有 5 次上限（lib/verify-code.ts）。
    // 两道都没有时 6 位码可以被穷举，只要知道邮箱就能改掉任何人的密码（含后台管理员）
    if (verifyIpLimited(request.headers)) return error('操作过于频繁，请 10 分钟后再试', 429)

    // 先验码、后查用户：不存在的邮箱根本不会有 RESET 码（发码时改发「无账号」说明信），自然落到同一句失败文案
    const r = await consumeCode(email, 'RESET', parsed.data.code)
    if (r !== 'OK') return error(BAD_CODE)

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) return error(BAD_CODE)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(parsed.data.password),
        // 会话版本 +1：这个账号在所有设备上的旧 token（含被盗的）立即失效
        sessionEpoch: { increment: 1 },
        emailVerifiedAt: new Date(), // 刚用验证码证明了邮箱归属
      },
    })
    // 证明了邮箱归属：解除该邮箱的登录冷却，别人故意输错锁住的真实用户可以立刻登录
    clearLoginThrottle(email, request.headers)
    return success({ ok: true }, '密码已重置，请用新密码登录')
  } catch (err) {
    console.error('Reset password error:', err)
    return error('重置失败')
  }
}
