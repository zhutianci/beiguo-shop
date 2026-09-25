export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { SUPPRESSION_REASONS } from '@/lib/marketing/types'
import { listSuppressions } from '@/lib/marketing/stats'
import { parsePaging, totalPages } from '@/lib/marketing/campaign-repo'

/** 抑制名单（硬退信 / 连续软退信 / 投诉 / 无效地址 / 手动）。只读；加入与解除走 subscribers 的 POST */
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const { searchParams } = new URL(request.url)
    const { page, pageSize } = parsePaging(searchParams, 20, 100)
    const rawReason = (searchParams.get('reason') || '').trim()
    const reason = (SUPPRESSION_REASONS as readonly string[]).includes(rawReason) ? rawReason : null
    const keyword = (searchParams.get('keyword') || '').trim().slice(0, 100) || null

    const { list, total } = await listSuppressions({ page, pageSize, reason, keyword })
    return success({ list, total, page, pageSize, totalPages: totalPages(total, pageSize) })
  } catch (err) {
    console.error('[admin/marketing] 获取抑制名单失败:', err)
    return error('获取抑制名单失败')
  }
}
