export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { rateLimited } from '@/lib/news/rate-limit'

/**
 * 买家修改自己的昵称。
 *
 * 此前个人中心的「保存」只改了本地 zustand，刷新一次（header 挂载时会拉 /api/auth/me）
 * 就被服务端的旧值覆盖回去 —— 买家以为改好了，其实什么都没存。
 *
 * 【手机号刻意不开放自助修改】users.phone 有唯一约束，而站上没有任何短信验证：
 * 放开自助绑定的话，任何人都能先把别人的真实号码占掉（对方以后绑不上自己的号），
 * 并且能靠「该手机号已被其他账户使用」这句提示逐个试出哪些号码是本站客户。
 * 手机号在站内只是展示用资料（登录只认邮箱，到期提醒的短信号码走 AccountContact），
 * 需要登记请联系客服由后台修改。要开放自助绑定，得先接上短信验证码。
 */

// 控制字符（换行、制表等）会把后台表格与企业微信通知的排版搅乱
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u001f\u007f]/

const schema = z.object({
  nickname: z
    .string({ invalid_type_error: '昵称格式不正确' })
    .trim()
    .min(1, '昵称不能为空')
    .max(20, '昵称最多 20 个字')
    .refine((v) => !CONTROL_RE.test(v), '昵称包含不支持的字符'),
})

const SAFE_SELECT = { id: true, email: true, phone: true, nickname: true, avatar: true, role: true } as const

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (rateLimited(`profile:${user.id}`, { windowMs: 60_000, max: 10 })) {
      return error('操作太频繁，请稍后再试', 429)
    }

    const body = await request.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    // 带上 status: 1 —— 被禁用的账号不允许改资料（getCurrentUser 已拦一道，这里不依赖它）
    const r = await prisma.user.updateMany({
      where: { id: user.id, status: 1 },
      data: { nickname: parsed.data.nickname },
    })
    if (r.count !== 1) return error('账号不可用，请联系客服', 403)

    const fresh = await prisma.user.findUnique({ where: { id: user.id }, select: SAFE_SELECT })
    if (!fresh) return unauthorized()
    return success(fresh, '已保存')
  } catch (err) {
    console.error('Update profile error:', err)
    return error('保存失败')
  }
}
