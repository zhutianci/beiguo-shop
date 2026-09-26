export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { adminOrResponse, closeAfterSale, AfterSaleConflict } from '@/lib/admin/source-site'

/**
 * 处理一条售后申请（设计 8.4；契约见实施分包 7.4）：
 *  · REJECT：驳回，说明必填（渠道可见）；
 *  · DONE：已处理（补发用「补发卡密」执行后点这里；全局封禁申请在用户页操作后点这里）。
 *    **退款类不能在这里点 DONE**：它由订单退款弹窗保存事务自动结案（退款金额、承担方、冲销分录与结案必须同一事务）；
 *  · CLEAR_ESCALATION：升级类——清除订单的 escalatedAt 并结案（DONE），说明渠道可见。
 * 状态一律 CAS PENDING → 终态，activeKey 置 NULL；通知渠道 AFTER_SALE_RESULT；审计 aftersale.handle（publicDiff 只含结果）。
 */
const schema = z.object({
  action: z.enum(['REJECT', 'DONE', 'CLEAR_ESCALATION']),
  note: z.string().trim().max(500).optional().nullable(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await adminOrResponse()
  if ('res' in auth) return auth.res
  try {
    const id = parseInt(params.id)
    if (!Number.isSafeInteger(id) || id <= 0) return notFound('售后申请不存在')
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const { action } = parsed.data
    const note = parsed.data.note?.trim() || null

    const row = await prisma.tenantAfterSale.findUnique({
      where: { id },
      select: { id: true, kind: true, status: true, orderId: true, tenantId: true, requestNo: true },
    })
    if (!row) return notFound('售后申请不存在')
    if (row.status !== 'PENDING') return NextResponse.json({ success: false, error: '该申请已处理，请刷新', code: 'CONFLICT' }, { status: 409 })
    if (action === 'REJECT' && !note) return error('驳回请填写说明（渠道可见）')
    if (action === 'DONE' && row.kind === 'REFUND') {
      return error('退款申请请在订单的退款弹窗里填写金额与承担方后保存，保存时自动结案；不退款请「驳回」')
    }
    if (action === 'CLEAR_ESCALATION' && row.kind !== 'ESCALATE') return error('只有「升级给站长」的申请可以清除升级')

    const r = await prisma.$transaction(async (tx) => {
      if (action === 'CLEAR_ESCALATION' && row.orderId != null) {
        await tx.order.updateMany({ where: { id: row.orderId, tenantId: row.tenantId }, data: { escalatedAt: null } })
        await writeAudit(tx, {
          actorUserId: auth.user.id,
          actorKind: 'PLATFORM',
          tenantId: row.tenantId,
          action: 'order.escalation_clear',
          targetType: 'after_sale',
          targetId: row.requestNo,
          diff: { orderId: row.orderId, note },
          req: request,
        })
      }
      return closeAfterSale(tx, {
        id: row.id,
        result: action === 'REJECT' ? 'REJECTED' : 'DONE',
        note,
        operatorId: auth.user.id,
        req: request,
      })
    })
    return success(
      { id, requestNo: r.requestNo, status: action === 'REJECT' ? 'REJECTED' : 'DONE' },
      action === 'REJECT' ? '已驳回' : '已处理',
    )
  } catch (err) {
    if (err instanceof AfterSaleConflict) return NextResponse.json({ success: false, error: err.message, code: 'CONFLICT' }, { status: 409 })
    console.error('Admin handle after-sale error:', err)
    return error('处理失败')
  }
}
