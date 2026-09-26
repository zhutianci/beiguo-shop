export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, failJson, parseIdParam, readJson, statementHeadOr404 } from '@/lib/tenant/admin-tenants'
import { registerBounce } from '@/lib/tenant/statement'

/**
 * 打款退票（设计 10.9 最后一行）：要求结算单 PAID / RECEIVED，且该单累计退票 ≤ 实际打款额；bounce:{流水号} AVAILABLE +amount。
 * 同一退票流水号重复登记 → 409。
 */

const schema = z.object({
  amountCents: z.number().int().positive().max(100_000_000),
  externalNo: z.string().trim().regex(/^[A-Za-z0-9_.:-]{4,64}$/, '退票流水号只能是字母数字与 _ . : -，4–64 位'),
})
const FAIL: Record<string, [number, string]> = {
  DUPLICATE: [409, '这个退票流水号已经登记过'],
  BAD_STATE: [400, '只有已打款的结算单才能登记退票'],
  OVER_AMOUNT: [400, '累计退票金额不能超过实际打款额'],
}

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
    const r = await registerBounce(sid, adminId, body)
    if (r !== 'OK') {
      const [status, text] = FAIL[r] ?? [400, r]
      return failJson(status, text, r)
    }
    return success(null, '已登记退票，金额已转回可结算')
  } catch (e) {
    return adminFail(e, '登记退票')
  }
}
