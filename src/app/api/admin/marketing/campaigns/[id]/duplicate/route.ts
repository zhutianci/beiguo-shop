export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error, notFound } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { requireAdmin } from '@/lib/auth'
import { createDraft, knownErrorResponse, parseId } from '@/lib/marketing/campaign-repo'

/**
 * 复制为新草稿：任意状态的活动都能复制（内容 + 受众），名称「<原名> 副本」。
 * 不复制测试记录 —— 新草稿要重新测试才能发（testedHash 属于那一场活动）。
 */
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  let me: { id: number }
  try {
    me = await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }
  try {
    const id = parseId(params.id)
    if (!id) return notFound('活动不存在')
    const detail = await createDraft({ fromCampaignId: id }, me.id)
    return success(detail, '已复制为新草稿')
  } catch (err) {
    const known = knownErrorResponse(err)
    if (known) return known
    console.error(`[admin/marketing] 复制活动 #${params.id} 失败:`, err)
    return error('复制失败')
  }
}
