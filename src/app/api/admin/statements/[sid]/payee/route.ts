export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, parseIdParam, revealStatementPayee } from '@/lib/tenant/admin-tenants'

/**
 * 查看结算单快照里的收款账号明文（打款时核对；设计 10.10「收款人以结算单快照为准，不读当前设置」）。
 * POST（有意的动作，不被预取）；每次查看写审计。
 */

export async function POST(_req: NextRequest, { params }: { params: { sid: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const sid = parseIdParam(params.sid)
  if (!sid) return error('结算单不存在', 404)
  try {
    const adminId = await currentAdminId()
    return success({ account: await revealStatementPayee(sid, adminId) })
  } catch (e) {
    return adminFail(e, '查看收款账号')
  }
}
