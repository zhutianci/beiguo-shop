export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, createInvite, currentAdminId, listInvites, parseIdParam, readJson, revokeInvite } from '@/lib/tenant/admin-tenants'

/**
 * 成员邀请（设计 5.2、6.7）：POST 发邀请（邮件由 WP3 sendTenantInviteMail 发送；发不出去时返回链接，由站长手动转发），
 * PATCH 作废未用邀请。库里只存令牌与邮箱的 sha256，列表不返回令牌。
 */

const createSchema = z.object({ email: z.string().trim().min(3).max(254), role: z.literal('OWNER').optional() })
const patchSchema = z.object({ inviteId: z.number().int().positive(), action: z.literal('revoke') })

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  try {
    return success(await listInvites(id))
  } catch (e) {
    return adminFail(e, '邀请列表')
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const body = await readJson(req, createSchema)
  if (body instanceof Response) return body
  try {
    const adminId = await currentAdminId()
    const r = await createInvite(id, body.email, 'OWNER', adminId)
    return success(r, r.mailed ? '邀请邮件已发送' : '邀请已生成，但邮件未发出，请把链接手动发给对方')
  } catch (e) {
    return adminFail(e, '发邀请')
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
    await revokeInvite(id, body.inviteId, adminId)
    return success(null, '邀请已作废')
  } catch (e) {
    return adminFail(e, '作废邀请')
  }
}
