export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error, notFound } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { requireAdmin } from '@/lib/auth'
import { TOPICS, audienceSpecSchema } from '@/lib/marketing/types'
import {
  conflictResponse,
  deleteDraft,
  knownErrorResponse,
  loadCampaignDetail,
  parseId,
  readJsonBody,
  updateDraft,
} from '@/lib/marketing/campaign-repo'

/**
 * 单个活动：详情 / 保存草稿（编辑器自动保存）/ 删除草稿。
 *
 * 保存是乐观锁：请求带 baseUpdatedAt（上次拿到的 updatedAt），与库里不一致 → 409 并附服务器版本，
 * 由编辑器让管理员选「用服务器版本 / 用我的覆盖」（覆盖 = 拿服务器版本的 updatedAt 再存一次）。
 * 非草稿同样 409（已提交发送的内容冻结了，要改先撤回定时）。
 */

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = parseId(params.id)
    if (!id) return notFound('活动不存在')
    const detail = await loadCampaignDetail(id)
    if (!detail) return notFound('活动不存在')
    return success(detail)
  } catch (err) {
    console.error(`[admin/marketing] 获取活动 #${params.id} 失败:`, err)
    return error('获取活动失败')
  }
}

const putSchema = z
  .object({
    baseUpdatedAt: z.string({ required_error: '缺少 baseUpdatedAt' }).min(1, '缺少 baseUpdatedAt').max(40),
    name: z
      .string()
      .max(100, '活动名称最多 100 字')
      .refine((s) => s.trim().length > 0, '活动名称不能为空')
      .optional(),
    topic: z.enum(TOPICS).optional(),
    subject: z.string().max(200, '邮件主题最多 200 字').optional(),
    preheader: z.string().max(200, '预览文字最多 200 字').optional(),
    // doc 的形状校验在 normalizeDoc 里做（先把 TipTap 的输出洗成白名单形状，再严格校验）
    doc: z.unknown().optional(),
    audience: audienceSpecSchema.optional(),
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
    const id = parseId(params.id)
    if (!id) return notFound('活动不存在')

    // 文档上限 200KB，加上受众（≤5000 个 id）与其他字段，512KB 足够；再大一定不是编辑器发来的
    const body = await readJsonBody(request, 512 * 1024)
    if (!body.ok) return error(body.message, body.status)
    const parsed = putSchema.safeParse(body.body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const r = await updateDraft(id, parsed.data, me.id)
    switch (r.kind) {
      case 'ok':
        return success(r.detail, '已保存')
      case 'not_found':
        return notFound('活动不存在')
      case 'invalid':
        return error(r.message)
      case 'not_draft':
        return conflictResponse('活动已提交发送，内容已冻结（如需修改请先撤回定时）', r.detail)
      case 'conflict':
        return conflictResponse('内容已在别处被修改', r.detail)
    }
  } catch (err) {
    const known = knownErrorResponse(err)
    if (known) return known
    console.error(`[admin/marketing] 保存活动 #${params.id} 失败:`, err)
    return error('保存失败')
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
    const id = parseId(params.id)
    if (!id) return notFound('活动不存在')
    const r = await deleteDraft(id, me.id)
    if (r === 'not_found') return notFound('活动不存在')
    if (r === 'not_draft') return error('只有草稿可以删除；已提交发送的活动请用「取消」', 409)
    return success(null, '已删除')
  } catch (err) {
    console.error(`[admin/marketing] 删除活动 #${params.id} 失败:`, err)
    return error('删除失败')
  }
}
