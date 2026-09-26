export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { success, error, notFound } from '@/lib/api'
import { prisma } from '@/lib/db'
import { resettleFromSnapshot } from '@/lib/tenant/ledger'
import { adminOrResponse } from '@/lib/admin/source-site'

/**
 * 按快照补记（设计 8.3；契约见实施分包 7.4）。
 *
 * 只对「已付、settleState 为 NULL / MISSING」的渠道单：计提当时失败（MISSING）或漏记的，用下单时的快照一步补齐
 * （已有退款累计值也可以，按剩余值写，与「先计提再逐次冲销」逐分相同）。**永不按当前 listing 重算**；快照不完整只能调账。
 * 实际逻辑全在 WP3 的 resettleFromSnapshot（按 settleVersion CAS、审计同事务），这里只做鉴权与结果翻译。
 */
const REASON_TEXT: Record<string, string> = {
  NOT_FOUND: '订单不存在',
  BAD_STATE: '只有结算状态为空或「缺失」的订单可以补记（可能已被补记，请刷新）',
  NOT_CHANNEL: '主站订单没有渠道结算账',
  NOT_PAID: '订单未付款，不能补记',
  SNAPSHOT_INCOMPLETE: '下单快照不完整，不能补记，请改用调账',
  HAS_ENTRIES: '该订单已有分录，不能补记（请核对对账结果）',
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await adminOrResponse()
  if ('res' in auth) return auth.res
  try {
    const orderId = parseInt(params.id)
    if (!Number.isSafeInteger(orderId) || orderId <= 0) return notFound('订单不存在')
    const o = await prisma.order.findUnique({ where: { id: orderId }, select: { tenantId: true } })
    if (!o) return notFound('订单不存在')
    if (o.tenantId === 1) return error(REASON_TEXT.NOT_CHANNEL)
    const r = await resettleFromSnapshot(orderId, auth.user.id)
    if (r.ok) return success({ orderId }, '已按下单快照补记')
    const reason = r.reason || 'BAD_STATE'
    return NextResponse.json(
      { success: false, error: REASON_TEXT[reason] ?? reason, code: reason },
      { status: reason === 'BAD_STATE' ? 409 : reason === 'NOT_FOUND' ? 404 : 400 },
    )
  } catch (err) {
    console.error('Resettle order error:', err)
    return error('补记失败')
  }
}
