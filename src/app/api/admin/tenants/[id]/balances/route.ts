export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, balancesAdmin, parseIdParam } from '@/lib/tenant/admin-tenants'

/** 渠道三个数（可结算 / 冻结中 / 结算中 / 保证金 / 累计打款），全部由分录求和得出（设计 10.8） */

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  try {
    return success(await balancesAdmin(id))
  } catch (e) {
    return adminFail(e, '渠道余额')
  }
}
