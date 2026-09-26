export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, failJson, parseIdParam, payoutHoldText, statementHeadOr404 } from '@/lib/tenant/admin-tenants'
import { markPaying } from '@/lib/tenant/statement'

/**
 * 开始打款（认领）：GENERATED / CONFIRMED → PAYING，记认领人与时间（设计 10.9、10.10 人工层防重复打款）。
 * 渠道 payoutHold 时 WP3 的 markPaying 返回 CONFLICT（契约没有单独的 HOLD），这里按渠道状态给出明确提示。
 */

export async function POST(_req: NextRequest, { params }: { params: { sid: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const sid = parseIdParam(params.sid)
  if (!sid) return error('结算单不存在', 404)
  try {
    const head = await statementHeadOr404(sid)
    const adminId = await currentAdminId()
    const r = await markPaying(sid, adminId)
    if (r !== 'OK') {
      const now = await statementHeadOr404(sid)
      // 文案带上暂停原因：对账失败置的 hold 说「对账异常」（D7），站长手动暂停的说原因本身（payoutHoldText）
      if (now.payoutHold) return failJson(409, payoutHoldText(now.payoutHoldReason, '不能认领'), 'HOLD')
      return failJson(409, `结算单当前状态为 ${now.state}，不能开始打款（可能已被他人认领）`, 'CONFLICT')
    }
    return success({ statementNo: head.statementNo }, '已认领：请按结算单号备注转账，完成后登记打款')
  } catch (e) {
    return adminFail(e, '认领结算单')
  }
}
