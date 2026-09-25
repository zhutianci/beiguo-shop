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
import { clientIp } from '@/lib/news/rate-limit'
import { verifyIpLimited } from '@/lib/auth-throttle'
import { logRegisterNotice } from '@/lib/marketing/consent'

// eslint-disable-next-line no-control-regex
const NICK_CTRL_RE = /[\u0000-\u001f\u007f]/g

const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码长度不能少于6位'),
  // 与个人资料页（api/account/profile）同一口径：最多 20 字、不带控制字符。
  // 昵称会原样进企业微信「新用户注册 / 新订单」卡片，换行能伪造整行字段。
  // 选填项绝不能挡住注册：不合规的只清洗 / 截断、不报错（Array.from 按码点截，不会切坏 emoji）。
  // 顺带修掉老问题：以前超过 50 字会被 VarChar(50) 拒绝写入，注册直接报「注册失败」
  nickname: z
    .string()
    .optional()
    .transform((v) => Array.from((v ?? '').replace(NICK_CTRL_RE, '').trim()).slice(0, 20).join('') || undefined),
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

    // 先验码、后查邮箱：证明邮箱归属之前，响应不能因「是否已注册」而不同（防客户名单枚举）。
    // 以前先查邮箱，随便填个验证码就能一次请求判断一个邮箱是不是本站客户。
    // 已注册的邮箱在发码时收到的是「该邮箱已注册」说明信、拿不到 REGISTER 码，所以这里只会走到「验证码错误」
    let emailVerified = false
    if (systemEmailConfigured()) {
      if (!result.data.code) return error('请填写邮箱验证码')
      if (verifyIpLimited(request.headers)) return error('操作过于频繁，请 10 分钟后再试', 429)
      const r = await consumeCode(email, 'REGISTER', result.data.code)
      // 「错太多次」与「错码/没有码」必须同一句：否则第 6 次的不同提示能区分「这个邮箱有没有发过码」，
      // 进而枚举出谁是本站客户（终审 2026-09-26）
      if (r !== 'OK') return error('验证码错误或已过期，多次输错请重新获取验证码')
      emailVerified = true
    }

    // 走到这里：要么验证码对了（已证明是邮箱本人），要么邮件服务没配（本来就防不住），明说没问题
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existingUser) {
      return error('该邮箱已被注册，请直接登录')
    }

    // 创建用户
    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        nickname: nickname || null,
        // 邮件服务未配置时照常注册（不能挡住新客下单），只是不记已验证
        emailVerifiedAt: emailVerified ? new Date() : null,
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
      sv: 0, // 新用户的 sessionEpoch 默认 0（不 select 它，免得出现在注册响应的 user 里）
    })

    // 设置登录 cookie（按真实协议决定 secure，30 天有效期）
    const cookieStore = await cookies()
    cookieStore.set('token', token, authCookieOptions(request))

    // 营销邮件告知留痕：注册页按钮下方写明了「可能发送优惠活动信息、可随时退订」，
    // 这里记一条 NOTICE（含隐私政策版本、IP、UA），出争议时能证明告知过。
    // 留痕失败绝不能挡住注册：账号已经建好、cookie 已下发，只记日志（不含邮箱）
    try {
      const ip = clientIp(request.headers)
      await logRegisterNotice(
        { id: user.id, email: email },
        ip && ip !== 'unknown' ? ip.slice(0, 64) : null,
        (request.headers.get('user-agent') || '').slice(0, 255) || null
      )
    } catch (e) {
      console.error('[register] 营销告知留痕失败 user=%d:', user.id, (e as Error)?.message)
    }

    // 同时下发 token，供 WebView（如微信）以 Authorization 头兜底鉴权
    notifyUserRegistered({
      email: user.email || '—',
      nickname: user.nickname,
      createdAt: new Date(), // 注册接口的 select 不含 createdAt，此处即注册时刻
    })

    return success({ user, token }, '注册成功')
  } catch (err) {
    // 并发注册撞 email 唯一约束：能走到建号这一步说明验证码已经对了，明说是安全的
    if ((err as { code?: string })?.code === 'P2002') return error('该邮箱已被注册，请直接登录')
    console.error('Register error:', err)
    return error('注册失败，请重试')
  }
}
