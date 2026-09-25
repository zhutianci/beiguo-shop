export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error, notFound } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { requireAdmin } from '@/lib/auth'
import { deleteTemplate, parseTemplateRef, readJsonBody, renameTemplate } from '@/lib/marketing/campaign-repo'

/**
 * 自存模板的改名 / 删除。路径 id 接受 '12' 或 'tpl:12'；内置模板（preset:*）写在代码里，不能改也不能删。
 * 删模板不影响已经用它建出来的活动（活动建立时拷走了内容）。
 */

const putSchema = z
  .object({
    name: z
      .string({ required_error: '请填写模板名称' })
      .trim()
      .min(1, '请填写模板名称')
      .max(80, '模板名称最多 80 字'),
  })
  .strip()

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  let me: { id: number }
  try {
    me = await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }
  try {
    const ref = parseTemplateRef(params.id)
    if (ref.kind === 'builtin') return error('内置模板不能改名')
    if (ref.kind === 'invalid') return notFound('模板不存在')
    const body = await readJsonBody(request, 4 * 1024)
    if (!body.ok) return error(body.message, body.status)
    const parsed = putSchema.safeParse(body.body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const ok = await renameTemplate(ref.id, parsed.data.name, me.id)
    if (!ok) return notFound('模板不存在')
    return success({ id: ref.id }, '已改名')
  } catch (err) {
    console.error(`[admin/marketing] 模板 ${params.id} 改名失败:`, err)
    return error('改名失败')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  let me: { id: number }
  try {
    me = await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }
  try {
    const ref = parseTemplateRef(params.id)
    if (ref.kind === 'builtin') return error('内置模板不能删除')
    if (ref.kind === 'invalid') return notFound('模板不存在')
    const ok = await deleteTemplate(ref.id, me.id)
    if (!ok) return notFound('模板不存在')
    return success(null, '已删除模板')
  } catch (err) {
    console.error(`[admin/marketing] 删除模板 ${params.id} 失败:`, err)
    return error('删除模板失败')
  }
}
