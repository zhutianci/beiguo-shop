/**
 * 渠道后台 handler：设置（WP7，实施分包 10.4）。全部 settings.write（仅 OWNER）。
 *
 *  GET  /api/partner/settings                         → { tenant, webhookConfigured, noticePrefs }
 *  PUT  /api/partner/settings/notice   { prefs }      → { noticePrefs }
 *  PUT  /api/partner/settings/webhook  { url | null } → 204（只写不读回）
 *  POST /api/partner/settings/webhook/test            → 204（每小时 5 次，路由限频）
 */
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { TENANT_NOTICE_KINDS, type TenantNoticeKind } from '../tenant/types'
import { parseBody } from './_http'
import { noContent, ok, run, type HandlerCtx } from './orders'
import { partnerGetSettings, partnerSetNoticePrefs, partnerSetWebhook, partnerTestWebhook } from '../partner-services/settings'

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
