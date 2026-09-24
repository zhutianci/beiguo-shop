export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { success, error, notFound } from '@/lib/api'

/**
 * 自定义奖品「标记已兑现」。
 *
 * 只做一件事、只有一个方向：PENDING → DONE。用 updateMany 的条件更新做 CAS，
 * 不是先查再改 —— 两个人同时点、或者这张单刚好在退款作废（fulfillState → VOID），
 * 都只会有一个结果落库，不会把已作废的奖品又改回「已兑现」。
 */

const schema = z.object({
  action: z.literal('FULFILL', { errorMap: () => ({ message: '不支持的操作' }) }),
  note: z.string().trim().max(255, '备注最多 255 字').optional().nullable(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  let operator: { id: number; email: string | null }
  try {
    const me = await requireAdmin()
    operator = { id: me.id, email: me.email }
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) return notFound('记录不存在')

    const body = await request.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const flip = await prisma.lotteryEntry.updateMany({
      where: { id, state: 'DRAWN', prizeType: 'CUSTOM', fulfillState: 'PENDING' },
      data: { fulfillState: 'DONE', fulfilledAt: new Date(), fulfillNote: parsed.data.note || null },
    })
    if (flip.count !== 1) return error('该记录不是待兑现状态')

    console.info('[lottery] 自定义奖品已兑现', { by: operator.email || operator.id, entryId: id })
    return success({ id }, '已标记为已兑现')
  } catch (err) {
    console.error('Fulfill lottery entry error:', err)
    return error('操作失败')
  }
}
