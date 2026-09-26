export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { error } from '@/lib/api'
import { adminFail, currentAdminId, parseIdParam, statementCsv } from '@/lib/tenant/admin-tenants'

/** 结算单对账单 CSV（超管）：汇总 + 纳入明细（含 eventKey，仅超管）。每次导出写审计 */

export async function GET(_req: NextRequest, { params }: { params: { sid: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const sid = parseIdParam(params.sid)
  if (!sid) return error('结算单不存在', 404)
  try {
    const adminId = await currentAdminId()
    const { filename, csv } = await statementCsv(sid, adminId)
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    return adminFail(e, '导出结算单')
  }
}
