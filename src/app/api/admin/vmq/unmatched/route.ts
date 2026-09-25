export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { adminGuard } from '@/lib/admin-guard'
import { markUnmatchedHandled, UNMATCHED_KEY_RE, VmqError } from '@/lib/vmq'

const schema = z.object({ key: z.string().regex(UNMATCHED_KEY_RE) })

// 「待人工核实的到账」标记已处理（补单 / 退款做完之后点）。只改这条留痕的 handledAt，不碰任何订单和收款单
export async function POST(request: NextRequest) {
  // 路由内再验一次管理员（同源 + 查库，见 lib/admin-guard 的注释）
  const denied = await adminGuard()
  if (denied) return denied
  let adminId: number
  try {
    adminId = (await requireAdmin()).id
  } catch {
    return error('无管理员权限', 403)
  }
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return error('参数错误')
    await markUnmatchedHandled(parsed.data.key, adminId)
    return success({ key: parsed.data.key }, '已标记处理')
  } catch (err) {
    if (err instanceof VmqError) return error(err.message)
    console.error('Vmq unmatched handle error:', err)
    return error('操作失败')
  }
}
