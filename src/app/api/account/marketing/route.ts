export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'
import { applyAccountMarketing, getAccountMarketing, MAX_PAUSE_DAYS, type AccountAction } from '@/lib/marketing/prefs'
import { TOPICS } from '@/lib/marketing/types'
import { denyOnChannel } from '@/lib/storefront/resolve'

/**
 * 个人中心「邮件订阅」卡：本人登录后读写自己的营销邮件偏好。
 *
 *   GET → { status, topicsOff, pausedUntil, defaultEligible, email }
 *   PUT → { action: 'subscribe'|'unsubscribe'|'topics'|'pause'|'resume', topicsOff?, days? }
 *
 * 本人登录后可以做任何方向的变更（包括恢复订阅、确认订阅）——这是本人亲手的表态，
 * 与退订页经 token 的「只减不增」规则不同。每次真实变更都留痕（source=profile），见 lib/marketing/consent.ts。
 */

const topicSchema = z.enum(TOPICS, { errorMap: () => ({ message: '主题不合法' }) })

const bodySchema = z.discriminatedUnion(
  'action',
  [
    z.object({ action: z.literal('subscribe') }),
    z.object({ action: z.literal('unsubscribe') }),
    z.object({ action: z.literal('topics'), topicsOff: z.array(topicSchema, { invalid_type_error: '主题格式不正确' }).max(TOPICS.length) }),
    z.object({
      action: z.literal('pause'),
      days: z
        .number({ invalid_type_error: '暂停天数不正确' })
        .int('暂停天数不正确')
        .min(1, '暂停天数不正确')
        .max(MAX_PAUSE_DAYS, `最多暂停 ${MAX_PAUSE_DAYS} 天`)
        .default(30),
    }),
    z.object({ action: z.literal('resume') }),
  ],
  { errorMap: () => ({ message: '不支持的操作' }) }
)

export async function GET() {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    return success(await getAccountMarketing(user.id))
  } catch (err) {
    console.error('[account/marketing] GET 失败:', (err as Error)?.message)
    return error('读取订阅设置失败，请稍后再试', 500)
  }
}

export async function PUT(request: NextRequest) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    // 每次变更都写留痕：防脚本来回拨开关刷表（正常人 10 分钟点不了 30 次）
    if (rateLimited(`mka:${user.id}`, { windowMs: 10 * 60_000, max: 30 })) {
      return error('操作太频繁，请稍后再试', 429)
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return error('请求格式不正确')
    }
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const state = await applyAccountMarketing(user.id, parsed.data as AccountAction, {
      ip: clientIp(request.headers),
      ua: request.headers.get('user-agent'),
    })
    return success(state, '已保存')
  } catch (err) {
    console.error('[account/marketing] PUT 失败:', (err as Error)?.message)
    return error('保存失败，请稍后再试', 500)
  }
}
