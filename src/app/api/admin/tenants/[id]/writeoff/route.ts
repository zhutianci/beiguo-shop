export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, balancesAdmin, currentAdminId, failJson, parseIdParam, readJson } from '@/lib/tenant/admin-tenants'
import { writeoff } from '@/lib/tenant/ledger'

/** 核销负余额（站长承担，必须写原因；设计 10.7 第 4 条）：wo:{requestId}，AVAILABLE MANUAL +x */

const schema = z.object({
  amountCents: z.number().int().positive().max(100_000_000),
  reason: z.string().trim().min(2).max(255),
  requestId: z.string().trim().regex(/^[A-Za-z0-9_-]{8,64}$/, 'requestId 格式不对'),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const body = await readJson(req, schema)
  if (body instanceof Response) return body
  try {
    await balancesAdmin(id)
    const adminId = await currentAdminId()
    const r = await writeoff({ tenantId: id, ...body, operatorId: adminId })
    // 只能核掉当前的负数（ledger.writeoff 持锁判 Σ U）：余额不为负、或金额超过负数部分 → 409，不入账
    if (r === 'INSUFFICIENT') {
      return failJson(409, '核销金额超过当前负余额：只能核销「可结算（预计打款）」为负的部分，请刷新余额后按实际负数填写', 'INSUFFICIENT')
    }
    return success({ result: r }, r === 'DUPLICATE' ? '已处理（同一次核销不会重复入账）' : '已核销')
  } catch (e) {
    return adminFail(e, '核销')
  }
}
