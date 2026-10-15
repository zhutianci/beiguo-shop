export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyPasswordOrDummy, signToken, authCookieOptions } from '@/lib/auth'
import { success, error } from '@/lib/api'
import { loginThrottle, sendCodeGate } from '@/lib/auth-throttle'
import { consumeCode, createCode, tooFrequent } from '@/lib/verify-code'
import { sendVerifyCodeEmail, systemEmailConfigured } from '@/lib/mail'
import {
  ADMIN_DEVICE_COOKIE,
  adminDeviceCookieOptions,
  adminTokenHours,
  adminTwoFactorEnabled,
  isTrustedAdminDevice,
  maskEmail,
  noteAdminLogin,
  signAdminDevice,
} from '@/lib/security/admin-2fa'
import { getStorefront } from '@/lib/storefront/resolve'
import { authCrossSiteReason } from '@/lib/tenant/same-origin'
import { ipBlocked, IP_BLOCKED_MSG } from '@/lib/security/ip-ban'

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
  /** 管理员新设备登录的邮箱验证码（第一次提交不带；服务端回 needCode 后再带上重新提交） */
  code: z.string().trim().max(10).optional(),
})

// 旧版 prisma/seed.ts 写死的默认管理员密码（admin123）的哈希。任何还持有它的账号都不许登录，
// 不管生产库有没有被手工处理过——这个值在仓库里是公开的。bcrypt 每次随机加盐，正常用户的哈希不可能与它相同。
const LEGACY_SEED_HASH = '$2a$10$1nwsaZ4SDtsUmEDBml2MMuGK2WZb1MlJJxmrxQfIexqqV/fHqyiei'

export async function POST(request: NextRequest) {
  // 渠道分站（设计 4.6 C3、4.7）：token 绑定签发它的店面。店面解析不进 try（店面解析铁律，设计 4.4 第 7 条）；
  // 没有店面的 Host（严格期未知 Host、域名停用）不签发任何 token。休眠时恒为主站
  const sf = await getStorefront()
  if (!sf) return error('资源不存在', 404)
  // 写接口同源校验（设计 4.6 C4；集成阶段补）：挡兄弟子域发起的登录 CSRF。店面解析之后、try 之外
  if (authCrossSiteReason(request, sf.kind)) return error('请求来源异常，请刷新页面后重试', 403)
  // 被蜜罐封禁的 IP（lib/security/ip-ban.ts）：1 小时内不能登录 / 注册 / 发码，浏览不受影响
  if (ipBlocked(request.headers)) return error(IP_BLOCKED_MSG, 429)
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

    // 超管账号不能在渠道站登录（设计 4.7，技术阻断而非约定）：同样放在密码校验之后，
    // 不知道密码的人拿不到「这个邮箱是管理员」这个信号。只拒绝签发，不建客户关系（登录本来就不建，T26）
    if (sf.kind !== 'PLATFORM' && user.role === 'ADMIN') {
      return error('管理员账号请在主站登录')
    }

    /*
     * 【管理员二次验证（2026-10-15，lib/security/admin-2fa.ts）】密码对了之后，没有受信设备 cookie 的要再输一次邮箱验证码。
     * 第一次提交（不带 code）：发码并回 needCode，不签 token；带 code 再提交：验码通过才签发，并把这台设备记为受信 30 天。
     * 放在密码校验之后：不知道密码的人拿不到「这是管理员账号」这个信号，也没法拿这里给管理员邮箱刷信。
     * 邮件服务没配时无从发码，退化为只验密码（与注册验码同一口径）。
     */
    const isAdmin = user.role === 'ADMIN' && sf.kind === 'PLATFORM'
    let via: 'PASSWORD' | 'CODE' = 'PASSWORD'
    const cookieStore = await cookies()
    if (isAdmin && adminTwoFactorEnabled() && systemEmailConfigured() && user.email) {
      const trusted = isTrustedAdminDevice(cookieStore.get(ADMIN_DEVICE_COOKIE)?.value, user.id, user.sessionEpoch)
      if (!trusted) {
        const code = result.data.code
        if (!code) {
          const gate = sendCodeGate(request.headers, user.email, 'ADMIN_LOGIN')
          if (gate) return error(gate.message, 429)
          const masked = maskEmail(user.email)
          // 60 秒内发过就不再发：上一封还有效，直接让管理员输
          if (!(await tooFrequent(user.email, 'ADMIN_LOGIN'))) {
            const c = await createCode(user.email, 'ADMIN_LOGIN')
            const r = await sendVerifyCodeEmail(user.email, c, 'ADMIN_LOGIN')
            if (!r.ok) {
              console.error('[login] 管理员验证码发送失败:', r.detail)
              return error('验证码邮件发送失败，请稍后重试', 500)
            }
          }
          return success({ needCode: true, maskedEmail: masked }, `新设备登录后台需要邮箱验证码，已发送到 ${masked}`)
        }
        const r = await consumeCode(user.email, 'ADMIN_LOGIN', code)
        if (r !== 'OK') return error('验证码错误或已过期，多次输错请重新获取')
        via = 'CODE'
        const device = signAdminDevice(user.id, user.sessionEpoch)
        if (device) cookieStore.set(ADMIN_DEVICE_COOKIE, device, adminDeviceCookieOptions(authCookieOptions(request).secure))
      }
    }

    // 生成 token（aud = 当前店面；会话版本，重置密码后旧 token 失效，见 lib/auth.ts）。
    // 登录**不**调用 ensureTenantCustomer：主站老用户在渠道站登录、浏览，不能因此成为渠道的客户（设计 5.5、T26）
    const token = signToken(
      {
        userId: user.id,
        email: user.email!,
        role: user.role,
        ep: user.sessionEpoch,
      },
      sf,
      isAdmin ? { expiresInHours: adminTokenHours() } : undefined
    )

    // 设置登录 cookie（按真实协议决定 secure；买家 30 天，管理员与 token 同为 adminTokenHours）
    const cookieOpts = authCookieOptions(request)
    cookieStore.set('token', token, isAdmin ? { ...cookieOpts, maxAge: adminTokenHours() * 3600 } : cookieOpts)
    if (isAdmin) noteAdminLogin(user, request.headers, via)

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
