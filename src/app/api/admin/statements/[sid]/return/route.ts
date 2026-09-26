export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, failJson, parseIdParam, readJson, statementHeadOr404 } from '@/lib/tenant/admin-tenants'
import { returnStatement } from '@/lib/tenant/statement'

/**
 * 退回结算单：GENERATED / CONFIRMED / DISPUTED / PAYING → RETURNED（设计 10.9）。金额按纳入明细逐成分转回可结算，
 * 下期重出。从 PAYING 退回必须确认「未转出」。
 */

const schema = z.object({ reason: z.string().trim().min(2).max(255), confirmNotTransferred: z.boolean().optional() })

export async function POST(req: NextRequest, { params }: { params: { sid: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const sid = parseIdParam(params.sid)
  if (!sid) return error('结算单不存在', 404)
  const body = await readJson(req, schema)
  if (body instanceof Response) return body
  try {
    const head = await statementHeadOr404(sid)
    if (head.state === 'PAYING' && body.confirmNotTransferred !== true) return failJson(400, '结算单正在打款中：退回前请确认这笔钱没有转出', 'CONFIRM_REQUIRED')
    const adminId = await currentAdminId()
    const r = await returnStatement(sid, adminId, body.reason, body.confirmNotTransferred === true)
    if (r !== 'OK') return failJson(409, '结算单当前状态不能退回（已打款的单子请走退票或下期调账）', 'CONFLICT')
    return success(null, '已退回，金额已转回可结算')
  } catch (e) {
    return adminFail(e, '退回结算单')
  }
}
