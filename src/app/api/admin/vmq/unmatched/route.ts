export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { adminGuard } from '@/lib/admin-guard'
import { markUnmatchedHandled, UNMATCHED_KEY_RE, VmqError } from '@/lib/vmq'
import { readEntry, entryInvolvesCarrier } from '@/lib/wallet/latepay'
import { writeAudit } from '@/lib/audit'

const schema = z.object({
  key: z.string().regex(UNMATCHED_KEY_RE),
  handledAs: z.enum(['OFFLINE', 'IGNORE']).optional(),
})

/**
 * 「待人工核实的到账」标记已处理（补单 / 退款做完之后点）。只改这条留痕，不碰任何订单和收款单。
 *
 * B1 起（docs/短信接码-设计.md §2.7、§6.6 第 15 条）：
 *  · 条件更新（lib/vmq markUnmatchedHandled），不会覆盖「退入买家余额」事务写下的 handledAs / orderId / tradeNo；
 *  · 条目的 biz、candidates、vmqOrderId 或候选订单涉及接码单 / 充值单的，必须选 handledAs：
 *    OFFLINE（线下已原路退回支付宝）或 IGNORE（核实不是新到账）——缺了 400。这里不提供「已退入余额」：
 *    退入只能走 /api/admin/vmq/unmatched/[key]/to-balance，钱和标记在同一个事务里。
 */
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
    const { key, handledAs } = parsed.data
    const entry = await readEntry(key)
    if (!entry) return error('记录不存在', 404)
    if (!entry.handledAt && !handledAs && (await entryInvolvesCarrier(entry))) {
      return error('这笔到账涉及短信接码 / 余额充值订单：请选择「线下已原路退回支付宝」或「核实不是新到账」；要退进买家余额请用「退入买家余额」', 400)
    }
    const wrote = await markUnmatchedHandled(key, adminId, handledAs)
    if (wrote && handledAs) {
      await writeAudit(null, {
        actorUserId: adminId,
        actorKind: 'PLATFORM',
        action: 'vmq.unmatched_handle',
        targetType: 'vmq_unmatched',
        targetId: key,
        diff: { handledAs, reason: entry.reason, price: entry.price },
        req: request,
      }).catch((e) => console.error('[vmq] 标记已处理的审计写入失败', e))
    }
    return success({ key, wrote }, wrote ? '已标记处理' : '这条此前已处理过')
  } catch (err) {
    if (err instanceof VmqError) return error(err.message)
    console.error('Vmq unmatched handle error:', err)
    return error('操作失败')
  }
}
