export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { AdminJiemaError, jiemaOrderDetailAdmin, runAdminAction } from '@/lib/jiema/admin-orders'

/**
 * 后台接码订单详情与操作（docs/短信接码-设计.md §7.2）。第一行 adminGuard；每个操作必须填原因、写审计（jiema.order.<动作>）。
 *
 * GET：订单快照（报价成本、cap、售价系数 x、成本汇率、加价、覆盖规则）、资金（付款拆分、预扣与时间线、支付流水、收款单、本单余额流水、退款拆分）、
 *      成本利润（每个扣费的号、合计、定稿与否、亏损）、尝试时间线（含 activationId、错误码、上游原文 raw）、短信、事件流水、可用操作。
 * POST `{ action, reason, n?, attemptId?, target?, activationId? }`：
 *   refund（售后退款到余额，T16）/ cancel_refund（取消并退回余额，T15）/ close_release（关单并原路退回预扣，与 T4 同一事务）/
 *   close_latepay（关单并把到账退入余额，E44）/ bonus_replace（加赠换号 N 次）/ release_attempt（释放某个号码）/
 *   unmanual（解除 MANUAL → PENDING_PAY / ACQUIRING / WAITING / REFUNDING，先校验）/ recompute（按快照重新核算成本）/
 *   claim（认领上游激活，候选见 ./claim）。
 * 资金动作只调引擎的现成函数（wallet.hold / ledger 的幂等与 CAS 都在里面），这里不直接改余额。
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = Number(params.id)
    if (!Number.isSafeInteger(id) || id <= 0) return error('参数不正确', 400)
    const d = await jiemaOrderDetailAdmin(id)
    if (!d) return error('接码单不存在', 404)
    const res = success(d)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    console.error('[jiema] admin order detail 失败', e)
    return error('读取失败', 500)
  }
}

const schema = z.object({
  action: z.enum(['refund', 'cancel_refund', 'close_release', 'close_latepay', 'bonus_replace', 'release_attempt', 'unmanual', 'recompute', 'claim']),
  reason: z.string().trim().min(2, '请填写原因（至少 2 个字）').max(200),
  n: z.number().int().min(1).max(5).optional(),
  attemptId: z.number().int().positive().optional(),
  target: z.enum(['PENDING_PAY', 'ACQUIRING', 'WAITING', 'REFUNDING']).optional(),
  activationId: z.string().max(32).optional(),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = Number(params.id)
    if (!Number.isSafeInteger(id) || id <= 0) return error('参数不正确', 400)
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return error(parsed.error.errors[0]?.message || '参数不正确', 400)
    const admin = await getCurrentUser()
    if (!admin) return error('无管理员权限', 403)
    const before = await jiemaOrderDetailAdmin(id)
    if (!before) return error('接码单不存在', 404)
    const r = await runAdminAction(id, admin.id, parsed.data)
    const after = await jiemaOrderDetailAdmin(id)
    await writeAudit(null, {
      actorUserId: admin.id,
      actorKind: 'PLATFORM',
      action: `jiema.order.${parsed.data.action}`,
      targetType: 'sms_order',
      targetId: String(before.order?.orderNo ?? id),
      result: r.ok ? 'OK' : 'DENIED',
      reason: parsed.data.reason,
      diff: {
        input: { n: parsed.data.n, attemptId: parsed.data.attemptId, target: parsed.data.target, activationId: parsed.data.activationId },
        before: { state: before.so.state, version: before.so.version, holdState: before.hold?.state ?? null, payStatus: before.order?.payStatus ?? null },
        after: after ? { state: after.so.state, version: after.so.version, holdState: after.hold?.state ?? null, payStatus: after.order?.payStatus ?? null } : null,
        message: r.message,
      },
      req: request,
    })
    if (!r.ok) return Response.json({ success: false, error: r.message, data: after }, { status: 409 })
    return success({ detail: after, result: r.data ?? null }, r.message)
  } catch (e) {
    if (e instanceof AdminJiemaError) return error(e.message, e.status)
    console.error('[jiema] admin order action 失败', e)
    return error('操作失败', 500)
  }
}
