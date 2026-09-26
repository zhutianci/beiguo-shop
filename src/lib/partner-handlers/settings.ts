/**
 * 渠道后台 handler：设置（WP7，实施分包 10.4）。全部 settings.write（仅 OWNER）。
 *
 *  GET  /api/partner/settings                         → { tenant, webhookConfigured, noticePrefs }
 *  PUT  /api/partner/settings/notice   { prefs }      → { noticePrefs }
 *  PUT  /api/partner/settings/webhook  { url | null } → 204（只写不读回）
 *  POST /api/partner/settings/webhook/test            → 204（每小时 5 次，路由限频）
 *
 * 二期（docs/多渠道分销-二期改动.md 3.2 推送方式）：
 *  GET 另带 { transport: { noticeWecomOn, noticeEmailOn, noticeEmail }, contact: {…客服原值} }
 *  PUT  /api/partner/settings/transport          { wecomOn?, emailOn? }      → { transport }
 *  POST /api/partner/settings/notice-email/code  { email }                   → { needCode, sent }（登录邮箱不发码：needCode=false）
 *  PUT  /api/partner/settings/notice-email       { email | null, code? }     → { transport }（null = 清除并关掉邮箱推送）
 *  POST /api/partner/settings/notice-email/test                              → 204（同步发信，失败给出原因）
 */
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { TENANT_NOTICE_KINDS, type TenantNoticeKind } from '../tenant/types'
import { parseBody } from './_http'
import { noContent, ok, run, type HandlerCtx } from './orders'
import {
  partnerGetSettings,
  partnerSendNoticeEmailCode,
  partnerSetNoticeEmail,
  partnerSetNoticePrefs,
  partnerSetNoticeTransport,
  partnerSetWebhook,
  partnerTestNoticeEmail,
  partnerTestWebhook,
} from '../partner-services/settings'

/** GET /api/partner/settings */
export async function getSettings(_req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('设置', async () => ok(await partnerGetSettings(ctx.tenantId)))
}

// 只接受已知通知类型的布尔值；未知类型让 zod 直接 400（strict），不静默吞掉——前端拼错了应该立刻发现
const prefsSchema = z.object({
  prefs: z
    .object(Object.fromEntries(TENANT_NOTICE_KINDS.map((k) => [k, z.boolean().optional()])) as Record<TenantNoticeKind, z.ZodOptional<z.ZodBoolean>>)
    .strict(),
})

/** PUT /api/partner/settings/notice */
export async function setNoticePrefs(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('通知偏好', async () => {
    const b = await parseBody(req, prefsSchema)
    if (b instanceof Response) return b
    const next = await partnerSetNoticePrefs(ctx.tenantId, ctx.userId, b.prefs as Partial<Record<TenantNoticeKind, boolean>>, req)
    return ok({ noticePrefs: next })
  })
}

const webhookSchema = z.object({ url: z.string().trim().max(300, '地址过长').nullable() })

/** PUT /api/partner/settings/webhook → 204 */
export async function setWebhook(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('企业微信 webhook', async () => {
    const b = await parseBody(req, webhookSchema)
    if (b instanceof Response) return b
    // 空字符串按「清除」处理（输入框清空后保存）
    await partnerSetWebhook(ctx.tenantId, ctx.userId, b.url ? b.url : null, req)
    return noContent()
  })
}

/** POST /api/partner/settings/webhook/test → 204 */
export async function testWebhook(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('webhook 测试', async () => {
    await partnerTestWebhook(ctx.tenantId, ctx.userId, req)
    return noContent()
  })
}

// ============================== 二期：推送方式与通知邮箱 ==============================

// 至少给一项；strict：多给的键（例如 noticeEmail）直接 400，邮箱只能走下面带验证的接口
const transportSchema = z
  .object({ wecomOn: z.boolean().optional(), emailOn: z.boolean().optional() })
  .strict()
  .refine((v) => v.wecomOn !== undefined || v.emailOn !== undefined, '请至少指定一项开关')

/** PUT /api/partner/settings/transport → { transport } */
export async function setNoticeTransport(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('推送方式', async () => {
    const b = await parseBody(req, transportSchema)
    if (b instanceof Response) return b
    return ok({ transport: await partnerSetNoticeTransport(ctx.tenantId, ctx.userId, b, req) })
  })
}

// 格式的严格校验在 facade（zod email + 长度 + 引号 / 空白）；这里只挡明显超长的输入
const noticeEmailCodeSchema = z.object({ email: z.string().trim().min(3, '请填写邮箱').max(120, '邮箱过长') }).strict()

/** POST /api/partner/settings/notice-email/code → { needCode, sent } */
export async function sendNoticeEmailCode(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('通知邮箱验证码', async () => {
    const b = await parseBody(req, noticeEmailCodeSchema)
    if (b instanceof Response) return b
    return ok(await partnerSendNoticeEmailCode(ctx.tenantId, ctx.userId, b.email))
  })
}

const noticeEmailSchema = z
  .object({
    email: z.string().trim().max(120, '邮箱过长').nullable(),
    code: z.string().trim().max(12).optional().nullable(),
  })
  .strict()

/** PUT /api/partner/settings/notice-email → { transport } */
export async function setNoticeEmail(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('通知邮箱', async () => {
    const b = await parseBody(req, noticeEmailSchema)
    if (b instanceof Response) return b
    // 空字符串按「清除」处理（与 webhook 同一口径）
    const email = b.email ? b.email : null
    return ok({ transport: await partnerSetNoticeEmail(ctx.tenantId, ctx.userId, email, b.code ?? null, req) })
  })
}

/** POST /api/partner/settings/notice-email/test → 204 */
export async function testNoticeEmail(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('邮件推送测试', async () => {
    await partnerTestNoticeEmail(ctx.tenantId, ctx.userId, req)
    return noContent()
  })
}
