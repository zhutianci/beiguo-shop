export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { approveComplaint, complaintDetailAdmin, logComplaintView, rejectComplaint } from '@/lib/jiema/complaint'
import { COMPLAINT_NOTE_MAX } from '@/lib/jiema/complaint-rules'

/**
 * 后台售后申请详情与处理（docs/短信接码-设计.md §7.5、E17、T16）。第一行 adminGuard；处理写审计（jiema.complaint.approve / reject）。
 *
 * GET：申请（原因、买家说明）、订单与接码单摘要、每个号（能不能再次收码）、短信内容、30 天内已通过次数、上游申诉截止（只给站长看）、可用操作。
 *      详情里有短信内容：每次打开写一条 SmsEvent(ADMIN_VIEW)（§10.2）。
 * POST action=approve（可带 note）：通过并退款到余额（T16：先放掉 / 完成还开着的号，再整单原路退回余额，成本照计、利润 = −成本），
 *        结果（含两格退回金额与备注）自动发到订单留言；
 *      action=reject（reply 必填）：驳回，回复必填，同一事务发到订单留言。
 * 资金只经过引擎（engine.adminRefund → refund.refundAfterSale）；这里不直接改余额。
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = Number(params.id)
    if (!Number.isSafeInteger(id) || id <= 0) return error('参数不正确', 400)
    const d = await complaintDetailAdmin(id)
    if (!d) return error('售后申请不存在', 404)
    const admin = await getCurrentUser()
    if (admin && d.so) await logComplaintView(d.so.id, admin.id, id)
    const res = success(d)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    console.error('[jiema] admin complaint detail 失败', e)
    return error('读取失败', 500)
  }
}

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve'), note: z.string().trim().max(COMPLAINT_NOTE_MAX).optional().nullable() }),
  z.object({ action: z.literal('reject'), reply: z.string().trim().min(2, '请填写回复（会发到买家的订单留言里）').max(COMPLAINT_NOTE_MAX) }),
])

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
    const before = await complaintDetailAdmin(id)
    if (!before) return error('售后申请不存在', 404)
    const input = parsed.data
    // 审计一定写（同后台接码订单操作：动作中途抛错也记一条 result=ERROR，再原样返回 500）
    let r: Awaited<ReturnType<typeof approveComplaint>> | null = null
    let thrown: unknown = null
    try {
      r = input.action === 'approve' ? await approveComplaint(id, admin.id, input.note ?? null) : await rejectComplaint(id, admin.id, input.reply)
    } catch (e) {
      thrown = e
    }
    const after = await complaintDetailAdmin(id).catch(() => null)
    const snap = (d: typeof before | null) => (d ? { complaint: d.complaint.state, order: d.so?.state ?? null, payStatus: d.order?.payStatus ?? null } : null)
    await writeAudit(null, {
      actorUserId: admin.id,
      actorKind: 'PLATFORM',
      action: `jiema.complaint.${input.action}`,
      targetType: 'sms_complaint',
      targetId: String(before.order?.orderNo ?? id),
      result: thrown ? 'ERROR' : r?.ok ? 'OK' : 'DENIED',
      reason: input.action === 'approve' ? (input.note || '通过售后') : input.reply,
      diff: {
        complaintId: id,
        before: snap(before),
        after: snap(after),
        message: thrown ? `抛错：${String((thrown as Error)?.message ?? thrown).slice(0, 300)}` : (r?.message ?? null),
      },
      req: request,
    }).catch((ae) => {
      if (!thrown) throw ae
      console.error('[jiema] 售后处理抛错后写审计也失败', id, input.action, (ae as Error)?.message)
    })
    if (thrown) throw thrown
    if (!r) return error('操作失败', 500)
    if (!r.ok) return Response.json({ success: false, error: r.message, data: after }, { status: r.status })
    return success({ detail: after }, r.message)
  } catch (e) {
    console.error('[jiema] admin complaint action 失败', e)
    return error('操作失败', 500)
  }
}
