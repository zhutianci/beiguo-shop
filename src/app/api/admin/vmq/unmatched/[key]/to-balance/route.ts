export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { getCurrentUser } from '@/lib/auth'
import { readEntry, latepayCandidates, manualCredit, LatepayError, ENTRY_KEY_RE, LATEPAY_MAX_CENTS, entryCents } from '@/lib/wallet/latepay'

/**
 * 「退入买家余额」（docs/短信接码-设计.md D41、§2.7、§6.6 第 15 条、附录 B 第 21 条）。第一行 adminGuard，写审计。
 *
 * GET  ?：这条待核实到账的候选订单（近 24 小时同额的接码 / 充值收款单对应的订单，已关闭的在前；条目提示的那张置顶），
 *        已关闭的恰好 1 个时 suggest 指向它。
 * POST { orderNo, tradeNo, confirmMismatch?, confirmBillChecked? }：按条目原因校验后，同一事务里
 *        占 latepay_trade:<交易号> → 充值格 + 条目实收（LATEPAY）→ 条目标成已处理（handledAs='LATEPAY'、orderId、tradeNo）。
 *        支付宝交易号必填（16–32 位数字）；同一个交易号只能退一次；同一条目再点被拒。
 */
function keyOf(params: { key: string }): string {
  try {
    return decodeURIComponent(params.key)
  } catch {
    return ''
  }
}

export async function GET(_request: NextRequest, { params }: { params: { key: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const key = keyOf(params)
    if (!ENTRY_KEY_RE.test(key)) return error('记录不存在', 404)
    const entry = await readEntry(key)
    if (!entry) return error('记录不存在', 404)
    const { list, suggest } = await latepayCandidates(entry)
    return success({
      key,
      reason: entry.reason,
      price: entry.price,
      cents: entryCents(entry),
      maxCents: LATEPAY_MAX_CENTS,
      at: entry.at,
      repeatForward: !!entry.repeatForward,
      handledAt: entry.handledAt ?? null,
      vmqOrderId: entry.vmqOrderId ?? null,
      candidates: list,
      suggest,
    })
  } catch (e) {
    console.error('[vmq] 退入候选查询失败', e)
    return error('查询失败', 500)
  }
}

const schema = z.object({
  orderNo: z.string().trim().min(1, '请选择或填写订单号').max(32),
  tradeNo: z.string().trim().min(1, '请填写支付宝交易号').max(40),
  confirmMismatch: z.boolean().optional(),
  confirmBillChecked: z.boolean().optional(),
})

export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const key = keyOf(params)
    if (!ENTRY_KEY_RE.test(key)) return error('记录不存在', 404)
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const admin = await getCurrentUser()
    const r = await manualCredit({
      key,
      orderNo: parsed.data.orderNo,
      tradeNo: parsed.data.tradeNo,
      confirmMismatch: parsed.data.confirmMismatch,
      confirmBillChecked: parsed.data.confirmBillChecked,
      adminId: admin?.id ?? null,
      req: request,
    })
    return success(r, `已退入买家充值余额 ¥${(r.cents / 100).toFixed(2)}`)
  } catch (e) {
    if (e instanceof LatepayError) return NextResponse.json({ success: false, error: e.message, code: e.code }, { status: e.status })
    console.error('[vmq] 退入买家余额失败', e)
    return error('操作失败', 500)
  }
}
