export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { error } from '@/lib/api'
import { clientIp } from '@/lib/news/rate-limit'
import { applyPrefsByToken, getPrefsByToken, MAX_PAUSE_DAYS, type PrefsAction } from '@/lib/marketing/prefs'
import { TOPICS } from '@/lib/marketing/types'
import { denyOnChannel } from '@/lib/storefront/resolve'

/**
 * 退订页（/unsubscribe/[token]）的数据接口，免登录，token 即凭证。
 *
 *   GET  → { emailMasked, status, topicsOff, pausedUntil, canIncrease }；**只读，绝不改状态**
 *          （邮件安全网关、聊天软件的链接预览都会 GET 页面与它背后的接口）
 *   POST → 只收 application/json：{ action, topicsOff?, days? }
 *          减少来信的动作永远可用；增加来信（恢复订阅 / 打开主题 / 取消暂停）只在发送后 30 天内可用，
 *          否则 403「请登录后在个人中心操作」。规则在 lib/marketing/prefs.ts。
 *
 * 为什么 POST 要求 JSON：跨站的 <form> 只能发 urlencoded / multipart / text/plain，
 * 要求 application/json 等于顺手挡掉了「别的网站替你点一下恢复订阅」这类 CSRF。
 * （RFC 8058 一键退订是另一个端点，那边刻意不看 Content-Type。）
 */

const MAX_BODY_BYTES = 4096

const topicSchema = z.enum(TOPICS, { errorMap: () => ({ message: '主题不合法' }) })

const bodySchema = z.discriminatedUnion(
  'action',
  [
    z.object({ action: z.literal('unsubscribe') }),
    z.object({ action: z.literal('resubscribe') }),
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

function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(
    status < 400 ? { success: true, data } : { success: false, error: data },
    { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } }
  )
}

/** 读至多 4KB 的请求体：超了直接拒，不整包读进内存 */
async function readLimited(request: NextRequest): Promise<string | null> {
  const len = Number(request.headers.get('content-length') || '0')
  if (len > MAX_BODY_BYTES) return null
  const body = request.body
  if (!body) return ''
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      total += value.byteLength
      if (total > MAX_BODY_BYTES) return null
      chunks.push(value)
    }
  } finally {
    reader.cancel().catch(() => {})
  }
  const buf = new Uint8Array(total)
  let off = 0
  for (const c of chunks) {
    buf.set(c, off)
    off += c.byteLength
  }
  return new TextDecoder().decode(buf)
}

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const state = await getPrefsByToken(String(params.token || ''))
    if (!state) return json('链接无效或已过期', 404)
    return json(state)
  } catch (err) {
    console.error('[mkt/prefs] GET 失败:', (err as Error)?.message)
    return error('暂时无法读取订阅设置，请稍后再试', 500)
  }
}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const ct = (request.headers.get('content-type') || '').toLowerCase()
    if (!ct.startsWith('application/json')) return json('请求格式不正确', 415)

    const raw = await readLimited(request)
    if (raw == null) return json('请求内容过大', 413)
    let body: unknown
    try {
      body = JSON.parse(raw || '{}')
    } catch {
      return json('请求格式不正确', 400)
    }
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return json(parsed.error.errors[0].message, 400)

    const result = await applyPrefsByToken(String(params.token || ''), parsed.data as PrefsAction, {
      ip: clientIp(request.headers),
      ua: request.headers.get('user-agent'),
    })
    if (!result.ok) return json(result.message, result.status)
    return json(result.state)
  } catch (err) {
    console.error('[mkt/prefs] POST 失败:', (err as Error)?.message)
    return error('保存失败，请稍后再试', 500)
  }
}
