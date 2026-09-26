export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { createCode, tooFrequent } from '@/lib/verify-code'
import { sendVerifyCodeEmail, sendNoSubscriptionEmail, systemEmailConfigured } from '@/lib/mail'
import { sendCodeGate } from '@/lib/auth-throttle'
import { denyOnChannel } from '@/lib/storefront/resolve'

const schema = z.object({ email: z.string().email('请输入正确的邮箱') })

// 有没有订阅记录都回这一句、都发一封信（时延一致），实情只写在邮箱本人能看到的信里
const SENT_MSG = '邮件已发送，请查收（含垃圾箱）'

/**
 * 「邮箱查订阅」第一步：给账户邮箱发 LOOKUP 验证码。验过之后才能看订阅记录（lib/email-proof.ts）。
 * 以前这一页只凭邮箱就能查到任何人的全部订阅与收据（2026-09-25 审计 G11）。
 */
export async function POST(request: NextRequest) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    if (!systemEmailConfigured()) return error('邮件服务暂不可用，请登录后在「我的订单」查看，或联系客服', 503)

    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const email = parsed.data.email.trim().toLowerCase()

    const gate = sendCodeGate(request.headers, email, 'LOOKUP')
    if (gate) {
      if (gate.alarm) console.error('[lookup/send-code] 订阅查询验证码全站限流已触发，疑似被刷')
      return error(gate.message, 429)
    }

    const has = await prisma.externalOrder.findFirst({ where: { claudeAccount: email }, select: { id: true } })
    let r: { ok: boolean; detail?: string }
    if (!has) {
      r = await sendNoSubscriptionEmail(email)
    } else {
      if (await tooFrequent(email, 'LOOKUP')) return error('验证码发送过于频繁，请 60 秒后再试', 429)
      const code = await createCode(email, 'LOOKUP')
      r = await sendVerifyCodeEmail(email, code, 'LOOKUP')
    }
    if (!r.ok) {
      console.error('lookup send-code mail failed:', r.detail)
      return error('邮件发送失败，请稍后重试')
    }
    return success({ sent: true }, SENT_MSG)
  } catch (err) {
    console.error('Lookup send-code error:', err)
    return error('发送失败')
  }
}
