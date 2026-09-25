export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error, notFound } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { userMarketingSummary } from '@/lib/marketing/stats'
import { parseId } from '@/lib/marketing/campaign-repo'

/** 用户详情页的「营销记录」卡：订阅状态、抑制、留痕、最近 20 封营销邮件 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = parseId(params.id)
    if (!id) return notFound('用户不存在')
    const summary = await userMarketingSummary(id)
    if (!summary) return notFound('用户不存在')
    return success(summary)
  } catch (err) {
    console.error(`[admin/marketing] 获取用户 #${params.id} 的营销记录失败:`, err)
    return error('获取营销记录失败')
  }
}
