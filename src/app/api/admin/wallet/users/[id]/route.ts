export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error, notFound } from '@/lib/api'
import { walletUserDetail } from '@/lib/wallet/admin-query'

/** 单个用户的两格、预扣、最近流水（含内部备注与 bizKey）、关联订单 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = parseInt(params.id)
    if (!Number.isSafeInteger(id) || id <= 0) return notFound('用户不存在')
    const d = await walletUserDetail(id)
    if (!d) return notFound('用户不存在')
    return success(d)
  } catch (e) {
    console.error('[wallet] user detail 失败', e)
    return error('获取用户余额详情失败', 500)
  }
}
