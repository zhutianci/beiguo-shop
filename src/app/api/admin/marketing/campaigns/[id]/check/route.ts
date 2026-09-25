export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error, notFound } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { checkCampaign } from '@/lib/marketing/lifecycle'
import { knownErrorResponse, parseId, readJsonBody } from '@/lib/marketing/campaign-repo'

/**
 * 发送前完整检查（lint + 服务端解析 + 受众预估 + 预计完成时间 + 券让利 + 是否已测试最新内容）。
 * 只读，不改任何状态；「检查并发送」弹窗每次打开、每次改定时时间都会调。
 */

const bodySchema = z
  .object({
    scheduledAt: z.string().datetime({ offset: true, message: '定时时间格式不正确' }).nullable().optional(),
  })
  .strip()

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = parseId(params.id)
    if (!id) return notFound('活动不存在')
    const body = await readJsonBody(request, 8 * 1024)
    if (!body.ok) return error(body.message, body.status)
    const parsed = bodySchema.safeParse(body.body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null
    const result = await checkCampaign(id, { scheduledAt })
    return success(result)
  } catch (err) {
    const known = knownErrorResponse(err)
    if (known) return known
    console.error(`[admin/marketing] 检查活动 #${params.id} 失败:`, err)
    return error('检查失败')
  }
}
