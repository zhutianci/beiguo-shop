export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error } from '@/lib/api'
import { consumeCode } from '@/lib/verify-code'
import { verifyIpLimited } from '@/lib/auth-throttle'
import { addProof, proofCookieOptions, PROOF_COOKIE } from '@/lib/email-proof'
import { denyOnChannel } from '@/lib/storefront/resolve'

const schema = z.object({
  email: z.string().email('请输入正确的邮箱'),
  code: z.string().min(4, '请输入验证码').max(10),
})

/**
 * 「邮箱查订阅」第二步：校验 LOOKUP 验证码，成功后下发 30 分钟有效的邮箱归属证明 cookie（lib/email-proof.ts）。
 * 之后查订阅、开票、付税费、开收据、改提醒都认这张证明，不用再验。
 */
export async function POST(request: NextRequest) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const email = parsed.data.email.trim().toLowerCase()

    if (verifyIpLimited(request.headers)) return error('操作过于频繁，请 10 分钟后再试', 429)

    const r = await consumeCode(email, 'LOOKUP', parsed.data.code)
    // 「错太多次」与「错码/没有码」必须同一句：否则第 6 次的不同提示能区分「这个邮箱有没有发过码」，
    // 进而枚举出谁是本站客户（终审 2026-09-26）
    if (r !== 'OK') return error('验证码错误或已过期，多次输错请重新获取验证码')

    const token = await addProof(email)
    if (!token) return error('服务暂不可用，请稍后再试', 503)
    const store = await cookies()
    store.set(PROOF_COOKIE, token, proofCookieOptions(request))

    // 登录用户验的恰好是自己的登录邮箱：顺手记为已验证（2026-06-10 前注册的老账号没有验过码），
    // 以后「登录邮箱 = 订阅邮箱」就能免验码。只补不改
    const user = await getCurrentUser()
    if (user?.email && user.email.trim().toLowerCase() === email) {
      await prisma.user
        .updateMany({ where: { id: user.id, emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } })
        .catch((e) => console.error('[lookup/verify] 记录邮箱已验证失败', user.id, e))
    }

    // proof 同时放进响应体：App 内置浏览器不保存 cookie 时，前端用 X-Email-Proof 头带回（lib/email-proof.ts）
    return success({ verified: true, proof: token }, '验证成功')
  } catch (err) {
    console.error('Lookup verify error:', err)
    return error('验证失败')
  }
}
