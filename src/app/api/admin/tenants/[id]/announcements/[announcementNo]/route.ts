export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, parseIdParam, readJson } from '@/lib/tenant/admin-tenants'
import { adminSetAnnouncementBlocked } from '@/lib/tenant/admin-brand'

/** 下架 / 恢复一条渠道公告：PATCH { blocked: boolean }（下架同时停用；恢复后不自动启用）。授权：adminGuard */
const bodySchema = z.object({ blocked: z.boolean() }).strict()

export async function PATCH(req: NextRequest, { params }: { params: { id: string; announcementNo: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('资源不存在', 404)
  const body = await readJson(req, bodySchema)
  if (body instanceof Response) return body
  try {
    const row = await adminSetAnnouncementBlocked(id, params.announcementNo, body.blocked, await currentAdminId())
    return success(row, body.blocked ? '已下架' : '已恢复')
  } catch (e) {
    return adminFail(e, '修改渠道公告')
  }
}
