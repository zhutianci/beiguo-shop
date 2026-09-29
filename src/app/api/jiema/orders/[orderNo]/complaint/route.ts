export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { crossSiteReason } from '@/lib/same-origin'
import { rateLimited } from '@/lib/news/rate-limit'
import { jfail, jok } from '@/lib/jiema/buyer-api'
import { findBuyerOrder, buildOrderView, JIEMA_ORDER_NO_RE } from '@/lib/jiema/view'
import { submitComplaint } from '@/lib/jiema/complaint'
import { COMPLAINT_DETAIL_MAX, isComplaintReason } from '@/lib/jiema/complaint-rules'

/**
 * 售后申请（docs/短信接码-设计.md §6.4、E17、§1.10）。只在主站：第一行 denyOnChannel，不包进 try（D11、规则 18）。
 *
 * POST `{ reason: 'CODE_INVALID'|'ALREADY_USED'|'NO_SMS'|'OTHER', detail?: string(≤500) }`
 *   200 → 最新的号码页视图（view.complaint 有值、actions.complain=false）；
 *   409 EXISTS（每单 1 次）/ STATE / NO_CODE（没收到码的单自动退回余额，不需要售后）/ EXPIRED（超过收码后 complaintWindowH 小时）/ NOT_PAID，带最新视图；
 *   400 BAD_REQUEST；401；404（不是本人、不是主站、订单号格式不对）；429 RATE。
 * 本人、本站（findBuyerOrder：orderNo + userId + tenantId=1）；写接口同源校验；每个账号 10 分钟 10 次（进程内），每单只能成功一次（唯一约束）。
 * 截图不在这里收：页面上写明「截图请通过微信客服发送」（订单留言本期不支持传图）。
 */
const schema = z.object({
  reason: z.string().max(24),
  detail: z.string().max(COMPLAINT_DETAIL_MAX).nullable().optional(),
})

export async function POST(request: NextRequest, { params }: { params: { orderNo: string } }) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    if (crossSiteReason(request.headers)) return jfail(403, 'FORBIDDEN', '请求来源不正确')
    const user = await getCurrentUser()
    if (!user) return jfail(401, 'UNAUTHORIZED', '请先登录')
    const orderNo = params.orderNo
    if (!JIEMA_ORDER_NO_RE.test(orderNo)) return jfail(404, 'NOT_FOUND', '订单不存在')
    if (rateLimited(`jiema-complaint:${user.id}`, { windowMs: 10 * 60_000, max: 10 })) return jfail(429, 'RATE', '操作太频繁，请稍后再试')
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success || !isComplaintReason(parsed.data.reason)) return jfail(400, 'BAD_REQUEST', '请选择售后原因')
    const ref = await findBuyerOrder(user.id, orderNo)
    if (!ref) return jfail(404, 'NOT_FOUND', '订单不存在')
    const r = await submitComplaint(ref, { reason: parsed.data.reason, detail: parsed.data.detail ?? null })
    const fresh = (await findBuyerOrder(user.id, orderNo)) ?? ref
    const view = await buildOrderView(fresh)
    if (!r.ok) return jfail(r.status, r.code, r.message, { ...(r.extra ?? {}), view })
    return jok(view)
  } catch (e) {
    console.error('[jiema] 售后申请失败', params.orderNo, e)
    return jfail(500, 'ERROR', '提交失败，请稍后重试')
  }
}
