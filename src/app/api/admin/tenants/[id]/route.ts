export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, parseIdParam, readJson, tenantDetail, updateTenant } from '@/lib/tenant/admin-tenants'

/** 渠道详情 / 修改配置与状态（状态机、费率、payoutHold、上限、主体、预览账号）。规则与审计见 admin-tenants.updateTenant */

const patchSchema = z
  .object({
    status: z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED', 'TERMINATED']),
    name: z.string().max(50),
    feeRateBp: z.number().int(),
    invoiceShareRateBp: z.number().int(),
    holdDays: z.number().int(),
    minPayoutCents: z.number().int(),
    requestIntervalDays: z.number().int(),
    payoutHold: z.boolean(),
    payoutHoldReason: z.string().max(200).nullable(),
    pendingOrderCap: z.number().int(),
    maxOrderQty: z.number().int(),
    partyType: z.enum(['COMPANY', 'INDIVIDUAL_BIZ', 'PERSON']),
    legalName: z.string().max(100),
    requirePartnerInvoice: z.boolean(),
    previewUserIds: z.array(z.number().int().positive()).max(20),
    /** 只配合 status=TERMINATED：余额未结清仍强制停业（写进审计 diff），见 admin-tenants.updateTenant */
    forceUnsettled: z.boolean(),
  })
  .partial()
  .strict()

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  try {
    return success(await tenantDetail(id))
  } catch (e) {
    return adminFail(e, '渠道详情')
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const body = await readJson(req, patchSchema)
  if (body instanceof Response) return body
  try {
    const adminId = await currentAdminId()
    return success(await updateTenant(id, body, adminId), '已保存')
  } catch (e) {
    return adminFail(e, '修改渠道')
  }
}
