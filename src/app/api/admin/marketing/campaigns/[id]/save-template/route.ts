export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error, notFound } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { requireAdmin } from '@/lib/auth'
import { knownErrorResponse, parseId, readJsonBody, saveCampaignAsTemplate } from '@/lib/marketing/campaign-repo'

/** 另存为模板：只拷内容（主题分类、邮件主题、预览文字、文档），不拷受众与任何发送数据 */

const bodySchema = z
  .object({
    name: z
      .string({ required_error: '请填写模板名称' })
      .trim()
      .min(1, '请填写模板名称')
      .max(80, '模板名称最多 80 字'),
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

    const r = await saveCampaignAsTemplate(id, parsed.data.name, me.id)
    return success(r, '已另存为模板')
  } catch (err) {
    const known = knownErrorResponse(err)
    if (known) return known
    console.error(`[admin/marketing] 活动 #${params.id} 另存模板失败:`, err)
    return error('另存模板失败')
  }
}
