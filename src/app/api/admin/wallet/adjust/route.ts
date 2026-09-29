export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { adminAdjust, isAdjustKind, REQUEST_ID_RE } from '@/lib/wallet/adjust'

/**
 * 余额与充值 · 调整（docs/短信接码-设计.md §7.8）。逻辑在 lib/wallet/adjust.ts：
 *   CASH_ADD → ADJUST、CASH_SUB → WITHDRAW（提现：线下打款后记扣减）、TOPUP_ADD → ADJUST（补偿）、
 *   TOPUP_SUB → TOPUP_REFUND（充值退还，必填支付宝流水号）、CLAWBACK（返现扣回：先返现格、不够再充值格）。
 * **不能记 LATEPAY**：传 LATEPAY（或任何其它类型）一律 400——迟到 / 重复的付款只能从 /admin/vmq 待核实列表「退入买家余额」。
 * 原因必填（内部，不回显给买家）；请求号幂等（adj:<requestId>）；同一事务写审计（调整前后两格）。
 */
const schema = z.object({
  kind: z.string(),
  userId: z.number().int().positive().optional(),
  amountCents: z.number().int().positive().max(99_999_999).optional(),
  reason: z.string().trim().min(1, '请填写原因（内部，不回显给买家）').max(200, '原因最多 200 字'),
  requestId: z.string().regex(REQUEST_ID_RE, '请求号格式不正确'),
  alipayNo: z.string().trim().optional().nullable(),
  referralOrderId: z.number().int().positive().optional().nullable(),
})

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const body = await request.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data
    if (d.kind === 'LATEPAY' || !isAdjustKind(d.kind)) {
      return error('这里不能记「付款退回余额」：迟到 / 重复的付款请到「收款监控 → 待核实」用「退入买家余额」处理', 400)
    }
    if (d.kind !== 'CLAWBACK' && (!d.userId || !d.amountCents)) return error('请选择用户并填写金额')
    const admin = await getCurrentUser()
    const r = await adminAdjust({
      actorUserId: admin?.id ?? null,
      kind: d.kind,
      userId: d.userId,
      amountCents: d.amountCents,
      reason: d.reason,
      requestId: d.requestId,
      alipayNo: d.alipayNo || null,
      referralOrderId: d.referralOrderId ?? null,
      source: 'wallet',
      req: request,
    })
    if (!r.ok) return error(r.message, r.status)
    return success(r, r.duplicate ? '这笔此前已记账成功，本次未重复记账' : r.shortfallCents ? '已扣回（两格合计不足，差额已写进审计）' : '已记账')
  } catch (e) {
    console.error('[wallet] adjust 失败', e)
    return error('操作失败', 500)
  }
}
