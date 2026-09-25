export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error, notFound } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { requireAdmin } from '@/lib/auth'
import { controlCampaign } from '@/lib/marketing/lifecycle'
import { knownErrorResponse, parseId, readJsonBody } from '@/lib/marketing/campaign-repo'

/**
 * 暂停 / 继续 / 取消 / 撤回定时 / 重新排队。状态机规则（每一步都是 CAS）见设计文档 5.1，全部在 lifecycle 里；
 * 这里只校验动作名。二次确认由界面负责（重新排队、取消都要确认）。
 */

const bodySchema = z
  .object({
    action: z.enum(['pause', 'resume', 'cancel', 'unschedule', 'requeue'], {
      errorMap: () => ({ message: '不支持的操作' }),
    }),
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
    const body = await readJsonBody(request, 4 * 1024)
    if (!body.ok) return error(body.message, body.status)
    const parsed = bodySchema.safeParse(body.body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const r = await controlCampaign(id, parsed.data.action, me.id)
    return success({ message: r.message }, r.message)
  } catch (err) {
    const known = knownErrorResponse(err)
    if (known) return known
    console.error(`[admin/marketing] 活动 #${params.id} 控制操作失败:`, err)
    return error('操作失败')
  }
}
