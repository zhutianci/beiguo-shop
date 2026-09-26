export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, listMembers, parseIdParam, readJson, setMemberStatus } from '@/lib/tenant/admin-tenants'

/** 渠道成员：停用（强制下线 + 作废未用邀请，不允许零 OWNER）/ 启用（拒绝 ADMIN）。成员只能经邀请加入 */

const patchSchema = z.object({ userId: z.number().int().positive(), status: z.union([z.literal(0), z.literal(1)]) })

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  try {
    return success(await listMembers(id))
  } catch (e) {
    return adminFail(e, '成员列表')
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const body = await readJson(req, patchSchema)
  if (body instanceof Response) return body
  try {
    const adminId = await currentAdminId()
    await setMemberStatus(id, body.userId, body.status, adminId)
    return success(null, body.status === 0 ? '已停用，该成员已被强制下线' : '已启用')
  } catch (e) {
    return adminFail(e, '成员状态')
  }
}
