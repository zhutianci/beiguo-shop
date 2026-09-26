/**
 * 接受成员邀请 handler（WP6，设计 5.2）。POST /api/partner/invite/accept { token } → 204 | 404。
 * 由 inviteRoute 包装（已登录、渠道店面、同源、非 ADMIN，不要求成员）；ctx.tenantId 来自店面。
 * 失败原因（过期、已用、吊销、邮箱不符、他站邀请、不存在）一律同一个 404，不给探测口。
 */
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { notFound404, parseBody } from './_http'
import { acceptInvite } from '../partner-services/invite'
import { noContent, run } from './orders'

const schema = z.object({ token: z.string().trim().min(1).max(256) })

export async function acceptInviteHandler(req: NextRequest, ctx: { tenantId: number; userId: number; email: string }): Promise<Response> {
  return run('接受邀请', async () => {
    const b = await parseBody(req, schema)
    if (b instanceof Response) return b
    const r = await acceptInvite(ctx, b.token, req)
    return r === 'OK' ? noContent() : notFound404()
  })
}
