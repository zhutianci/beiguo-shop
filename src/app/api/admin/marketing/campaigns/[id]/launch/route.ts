export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error, notFound } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { requireAdmin } from '@/lib/auth'
import { launchCampaign } from '@/lib/marketing/lifecycle'
import { bjDateTime } from '@/lib/marketing/time'
import { knownErrorResponse, parseId, readJsonBody } from '@/lib/marketing/campaign-repo'

/**
 * 发送（立即或定时）。
 *
 * expectedCount / expectedContentHash 是管理员在检查弹窗里「看到并确认」的人数与内容指纹：
 * 检查之后如果内容又被改了、或受众人数变了，lifecycle 返回 409 并附新值（data），弹窗刷新后让人重新确认 ——
 * 不能让管理员确认的是 A，发出去的是 B。检查不通过 → 400，data.issues 是具体问题。
 */

const bodySchema = z
  .object({
    scheduledAt: z.string().datetime({ offset: true, message: '定时时间格式不正确' }).nullable().optional(),
    expectedCount: z.number({ required_error: '缺少 expectedCount' }).int().min(0),
    expectedContentHash: z
      .string({ required_error: '缺少 expectedContentHash' })
      .regex(/^[0-9a-f]{64}$/, '内容指纹格式不正确'),
  })
  .strip()

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    const body = await readJsonBody(request, 8 * 1024)
    if (!body.ok) return error(body.message, body.status)
    const parsed = bodySchema.safeParse(body.body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null
    await launchCampaign(
      id,
      { scheduledAt, expectedCount: parsed.data.expectedCount, expectedContentHash: parsed.data.expectedContentHash },
      me.id
    )
    // 定时时间用北京时间展示（与后台其他地方一致，不依赖服务器 TZ）
    const message =
      scheduledAt && scheduledAt.getTime() > Date.now()
        ? `已定时，将于 ${bjDateTime(scheduledAt)}（北京时间）开始发送`
        : '已提交发送，一分钟内开始按速率发出'
    return success({ message }, message)
  } catch (err) {
    const known = knownErrorResponse(err)
    if (known) return known
    console.error(`[admin/marketing] 发送活动 #${params.id} 失败:`, err)
    return error('发送失败')
  }
}
