export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, unauthorized, notFound } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { consumeCode } from '@/lib/verify-code'
import { verifyIpLimited } from '@/lib/auth-throttle'
import { addProof, proofCookieOptions, PROOF_COOKIE } from '@/lib/email-proof'

const schema = z.object({
  accountEmail: z.string().email('账户邮箱格式不正确'),
  code: z.string().min(4, '请输入验证码').max(10),
})

/** 用验证码完成绑定账户的所有权验证：之后才能看它的订阅记录、设置提醒、在登录状态下为它开票开收据 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const accountEmail = parsed.data.accountEmail.trim().toLowerCase()

    const binding = await prisma.userAccount.findUnique({
      where: { userId_accountEmail: { userId: user.id, accountEmail } },
      select: { id: true, verifiedAt: true },
    })
    if (!binding) return notFound('请先添加该账户')
    if (binding.verifiedAt) return success({ verified: true }, '该账户已验证')

    if (verifyIpLimited(request.headers)) return error('操作过于频繁，请 10 分钟后再试', 429)
    const r = await consumeCode(accountEmail, 'LOOKUP', parsed.data.code)
    // 「错太多次」与「错码/没有码」必须同一句：否则第 6 次的不同提示能区分「这个邮箱有没有发过码」，
    // 进而枚举出谁是本站客户（终审 2026-09-26）
    if (r !== 'OK') return error('验证码错误或已过期，多次输错请重新获取验证码')

    // CAS：只从「未验证」翻到「已验证」
    await prisma.userAccount.updateMany({ where: { id: binding.id, verifiedAt: null }, data: { verifiedAt: new Date() } })

    // 顺手下发邮箱归属证明：接着去「邮箱查订阅」页也不用再验
    const token = await addProof(accountEmail)
    if (token) (await cookies()).set(PROOF_COOKIE, token, proofCookieOptions(request))

    // 验的恰好是自己的登录邮箱：记为已验证（老账号没有验过码）
    if (user.email && user.email.trim().toLowerCase() === accountEmail) {
      await prisma.user
        .updateMany({ where: { id: user.id, emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } })
        .catch((e) => console.error('[bindings/verify] 记录邮箱已验证失败', user.id, e))
    }
    // proof 同时放进响应体：App 内置浏览器不保存 cookie 时，前端用 X-Email-Proof 头带回（lib/email-proof.ts）
    return success({ verified: true, proof: token }, '验证成功')
  } catch (err) {
    console.error('Binding verify error:', err)
    return error('验证失败')
  }
}
