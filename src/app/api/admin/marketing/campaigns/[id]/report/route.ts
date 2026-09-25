export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error, notFound } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { campaignReport } from '@/lib/marketing/stats'
import { parseId } from '@/lib/marketing/campaign-repo'

/**
 * 活动报表：进度、「为什么还没发」、漏斗、比率、链接排行、跳过原因、归因订单、审计时间线。
 * 归因金额口径 Order.amount（不含税），全部在 lib/marketing/stats.ts 现算，不碰下单链路。
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = parseId(params.id)
    if (!id) return notFound('活动不存在')
    const report = await campaignReport(id)
    if (!report) return notFound('活动不存在')
    return success(report)
  } catch (err) {
    console.error(`[admin/marketing] 获取活动 #${params.id} 报表失败:`, err)
    return error('获取报表失败')
  }
}
