export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { createCode, tooFrequent } from '@/lib/verify-code'
import {
  sendVerifyCodeEmail,
  sendAccountExistsEmail,
  sendNoAccountEmail,
  systemEmailConfigured,
} from '@/lib/mail'
import { sendCodeGate } from '@/lib/auth-throttle'
import { getStorefront } from '@/lib/storefront/resolve'
import { authCrossSiteReason } from '@/lib/tenant/same-origin'

/*
 * 【渠道分站：邮件里的链接按当前店面 origin（设计 4.5、11.4）】验证码 / 说明信里的「登录」「注册」「找回密码」
 * 链接要回到买家发起请求的那个站。origin 只取自店面（Tenant.origin，库里配置），**绝不从 Host 头拼**。
 * 主站不传 origin（mail.ts 的 opts 默认值），按原来的默认地址出信，主站邮件逐字不变。
 */

const schema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  purpose: z.enum(['REGISTER', 'RESET']),
})

// 四种情况（注册/找回 × 有账号/没账号）一律返回这一句：没证明邮箱归属之前，
// 响应内容、状态码、冷却、时延都不能因为「邮箱是否已注册」而不同（防客户名单枚举）
const SENT_MSG = '邮件已发送，请查收（含垃圾箱）'
const TOO_FREQUENT = '验证码发送过于频繁，请 60 秒后再试'

export async function POST(request: NextRequest) {
  // 店面解析不进 try（设计 4.4 第 7 条）；没有店面的 Host 不发信
  const sf = await getStorefront()
  if (!sf) return error('资源不存在', 404)
  // 写接口同源校验（设计 4.6 C4；集成阶段补）：挡兄弟子域发起的登录 CSRF。店面解析之后、try 之外
  if (authCrossSiteReason(request, sf.kind)) return error('请求来源异常，请刷新页面后重试', 403)
  const mailOpts = sf.kind === 'PLATFORM' ? undefined : { origin: sf.origin }
  try {
    if (!systemEmailConfigured()) return error('邮件服务未配置，暂时无法发送验证码', 500)

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const email = parsed.data.email.trim().toLowerCase()
    const purpose = parsed.data.purpose
    // 与注册接口同一口径：渠道店面 DRAFT / TERMINATED 不开放注册，也就不发注册码（免得给没开张 / 已停业的站发信）。
    // 放在查用户之前、与邮箱无关，不影响「注册/找回 × 有没有账号」四种情况的响应一致性。
    // RESET 照常：停业站的买家至少 1 年内要能登录看订单、取卡、开票（设计 4.4 TERMINATED），预览买家也可能忘密码
    if (purpose === 'REGISTER' && sf.kind === 'CHANNEL' && (sf.status === 'DRAFT' || sf.status === 'TERMINATED')) {
      return error('本站暂不开放注册', 403)
    }

    // 限流放在查用户之前：两类邮箱被同样计数、同样冷却（lib/auth-throttle.ts）
    const gate = sendCodeGate(request.headers, email, purpose)
    if (gate) {
      if (gate.alarm) console.error(`[send-code] ${purpose} 验证码全站限流已触发，疑似被刷`)
      return error(gate.message, 429)
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })

    // 每个分支都恰好调用一次发信：时延一致；实情只写在邮箱本人才能看到的信里
    let r: { ok: boolean; detail?: string }
    if (purpose === 'REGISTER' && user) {
      r = await sendAccountExistsEmail(email, mailOpts)
    } else if (purpose === 'RESET' && !user) {
      r = await sendNoAccountEmail(email, mailOpts)
    } else {
      // 数据库兜底冷却：容器重启后进程内计数清零时仍然生效
      if (await tooFrequent(email, purpose)) return error(TOO_FREQUENT, 429)
      const code = await createCode(email, purpose)
      r = await sendVerifyCodeEmail(email, code, purpose, mailOpts)
    }
    if (!r.ok) {
      console.error('send-code mail failed:', r.detail)
      return error('邮件发送失败，请稍后重试')
    }
    return success({ sent: true }, SENT_MSG)
  } catch (err) {
    console.error('Send code error:', err)
    return error('发送失败')
  }
}
