export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, balancesAdmin, currentAdminId, failJson, parseIdParam, readJson } from '@/lib/tenant/admin-tenants'
import { depositApply, depositIn, depositRefund, repay } from '@/lib/tenant/ledger'

/**
 * 保证金与回款（设计 10.4、10.7）：
 *   IN     收保证金      dep-in:{外部流水号}        DEPOSIT +x
 *   APPLY  保证金抵扣    dep-apply:{requestId}      DEPOSIT −x / AVAILABLE +x
 *   REFUND 退保证金      dep-refund:{外部流水号}    DEPOSIT −x
 *   REPAY  渠道回款      repay:{外部流水号}         AVAILABLE +x（负余额时渠道把钱打回来）
 * 幂等键是外部流水号或弹窗 requestId：重复提交返回「已处理」。保证金不足 → 400。
 */

const key = z.string().trim().regex(/^[A-Za-z0-9_.:-]{4,64}$/, '流水号 / requestId 只能是字母数字与 _ . : -，4–64 位')
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('IN'), amountCents: z.number().int().positive().max(100_000_000), externalNo: key }),
  z.object({ action: z.literal('APPLY'), amountCents: z.number().int().positive().max(100_000_000), requestId: key }),
  z.object({ action: z.literal('REFUND'), amountCents: z.number().int().positive().max(100_000_000), externalNo: key }),
  z.object({ action: z.literal('REPAY'), amountCents: z.number().int().positive().max(100_000_000), externalNo: key }),
])

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
    const a = { tenantId: id, amountCents: body.amountCents, operatorId: adminId }
    const r =
      body.action === 'IN'
        ? await depositIn({ ...a, externalNo: body.externalNo })
        : body.action === 'APPLY'
          ? await depositApply({ ...a, requestId: body.requestId })
          : body.action === 'REFUND'
            ? await depositRefund({ ...a, externalNo: body.externalNo })
            : await repay({ ...a, externalNo: body.externalNo })
    if (r === 'INSUFFICIENT') return failJson(400, '保证金余额不足', 'INSUFFICIENT')
    return success({ result: r }, r === 'DUPLICATE' ? '已处理（同一流水不会重复入账）' : '已入账')
  } catch (e) {
    return adminFail(e, '保证金 / 回款')
  }
}
