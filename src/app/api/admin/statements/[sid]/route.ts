export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, parseIdParam, statementDetailView } from '@/lib/tenant/admin-tenants'

/** 结算单详情（超管）：汇总、纳入明细、收款人快照（掩码）、打款登记、退票累计、渠道是否 payoutHold */

export async function GET(_req: NextRequest, { params }: { params: { sid: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const sid = parseIdParam(params.sid)
  if (!sid) return error('结算单不存在', 404)
  try {
    return success(await statementDetailView(sid))
  } catch (e) {
    return adminFail(e, '结算单详情')
  }
}
