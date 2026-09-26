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
import { getStorefront } from '@/lib/storefront/resolve'
import { authCrossSiteReason } from '@/lib/tenant/same-origin'
import { ensureTenantCustomer } from '@/lib/tenant/customer'
import { emitTenantNotice } from '@/lib/tenant/notice'

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
  // 渠道分站：注册站 = 当前店面（设计 5.5）。店面解析不进 try；没有店面的 Host 不开放注册
  const sf = await getStorefront()
  if (!sf) return error('资源不存在', 404)
  // 写接口同源校验（设计 4.6 C4；集成阶段补）：挡兄弟子域发起的登录 CSRF。店面解析之后、try 之外
  if (authCrossSiteReason(request, sf.kind)) return error('请求来源异常，请刷新页面后重试', 403)
  // 渠道店面 DRAFT（未开业，前台对非预览用户 404）/ TERMINATED（已停业）不开放注册。
  // 否则直接 POST 本接口就能在一个没开张 / 已关门的站建号：写下 registeredTenantId=<该站> 与客户关系行，
  // 还会把此人标成「渠道注册用户」、被主站营销受众排除（lib/marketing/audience.ts）。
  // 预览买家是事先建好的老账号、停业站的买家也早已注册，挡住注册不影响任何人；SUSPENDED 是临时状态，照常注册。
  // 一句中性提示、不区分两种状态（不借此暴露店面处于哪个阶段）
  if (sf.kind === 'CHANNEL' && (sf.status === 'DRAFT' || sf.status === 'TERMINATED')) {
    return error('本站暂不开放注册', 403)
  }
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
    //
    // 【渠道分站（设计 5.5）】registeredTenantId 记注册站（之后不变，只有超管带审计可更正）；
    // 渠道店面注册同时建站点客户关系（joinedVia=REGISTER），与建号在**同一个事务**里：
    // 不会出现「号建了、客户关系没建」的渠道注册用户（对账与渠道客户列表都靠这一行）。
    // 主站 ensureTenantCustomer 第一行返回、不建行；主站 registeredTenantId=1 与列默认值相同。
    const passwordHash = await hashPassword(password)
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          nickname: nickname || null,
          // 邮件服务未配置时照常注册（不能挡住新客下单），只是不记已验证
          emailVerifiedAt: emailVerified ? new Date() : null,
          registeredTenantId: sf.id,
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
      await ensureTenantCustomer(tx, { tenantId: sf.id, userId: created.id, via: 'REGISTER' })
      return created
    })

    // 生成 token（aud = 当前店面）。
    // 「CHANNEL 店面不给 ADMIN 签发」（设计 4.7）在注册这里天然成立：已存在的邮箱（含管理员）在上面就被
    // 「该邮箱已被注册」挡下，新建账号的 role 恒为默认值 USER；ensureTenantCustomer 对 ADMIN 也不建行
    const token = signToken(
      {
        userId: user.id,
        email: user.email!,
        role: user.role,
        ep: 0, // 新用户的 sessionEpoch 默认 0（不 select 它，免得出现在注册响应的 user 里）
      },
      sf
    )

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
        (request.headers.get('user-agent') || '').slice(0, 255) || null,
        // 渠道站注册记 source=register:<code>（设计 11.3）；主站不传，仍是 'register'
        sf.kind === 'PLATFORM' ? undefined : sf.code
      )
    } catch (e) {
      console.error('[register] 营销告知留痕失败 user=%d:', user.id, (e as Error)?.message)
    }

    /*
     * 注册提醒（docs/多渠道分销-二期改动.md 3.1、3.2）：
     *  · 主站店面：推站长企业微信，内容与原来逐字相同；
     *  · 渠道店面：不再推站长（原来连标签都不带，站长分不清是哪个站的注册），改写一条渠道通知 CUSTOMER_JOINED，
     *    由渠道站长按自选方式（企业微信 / 邮箱）收到。载荷只有客户编号（公开编号，可在渠道后台「客户」页打开），
     *    不带邮箱、昵称：通知会推到第三方群与邮箱，客户资料要进后台看（后台有权限与审计）。
     *    ensureTenantCustomer 对 ADMIN 不建行（新注册恒为 USER，这里查不到行就不发）。独立写入、失败只记日志，不影响注册。
     */
    if (sf.kind === 'PLATFORM') {
      notifyUserRegistered({
        email: user.email || '—',
        nickname: user.nickname,
        createdAt: new Date(), // 注册接口的 select 不含 createdAt，此处即注册时刻
      })
    } else {
      try {
        const c = await prisma.tenantCustomer.findUnique({
          where: { tenantId_userId: { tenantId: sf.id, userId: user.id } },
          select: { publicNo: true },
        })
        if (c) {
          await emitTenantNotice(null, {
            tenantId: sf.id,
            kind: 'CUSTOMER_JOINED',
            title: '新客户注册',
            body: `客户编号 ${c.publicNo}，可在店铺后台「客户」页查看`,
            refType: 'customer',
            refKey: c.publicNo,
            dedupeKey: `join:${c.publicNo}`,
          })
        }
      } catch (e) {
        console.error('[register] 渠道新客户通知失败 tenant=%d:', sf.id, (e as Error)?.message)
      }
    }

    return success({ user, token }, '注册成功')
  } catch (err) {
    // 并发注册撞 email 唯一约束：能走到建号这一步说明验证码已经对了，明说是安全的
    if ((err as { code?: string })?.code === 'P2002') return error('该邮箱已被注册，请直接登录')
    console.error('Register error:', err)
    return error('注册失败，请重试')
  }
}
