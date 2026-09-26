export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, failJson, parseIdParam, readJson, statementHeadOr404 } from '@/lib/tenant/admin-tenants'
import { cancelPaying } from '@/lib/tenant/statement'

/** 放弃认领：PAYING → GENERATED，必须勾选「确认未转出」（设计 10.9） */

const schema = z.object({ confirmNotTransferred: z.literal(true, { errorMap: () => ({ message: '请确认这笔钱没有转出' }) }) })

export async function POST(req: NextRequest, { params }: { params: { sid: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const sid = parseIdParam(params.sid)
  if (!sid) return error('结算单不存在', 404)
  const body = await readJson(req, schema)
  if (body instanceof Response) return body
  try {
    await statementHeadOr404(sid)
    const adminId = await currentAdminId()
    const r = await cancelPaying(sid, adminId, true)
    if (r !== 'OK') return failJson(409, '结算单不在「打款中」状态', 'CONFLICT')
    return success(null, '已放弃认领')
  } catch (e) {
    return adminFail(e, '放弃认领')
  }
}
