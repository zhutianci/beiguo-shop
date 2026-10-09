export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, parseIdParam, readJson } from '@/lib/tenant/admin-tenants'
import { adminSetModuleGrant, listTenantModules, TenantModuleError } from '@/lib/tenant/content-modules'

/**
 * 内容模块授权（docs/多渠道分销-内容模块下放.md）。站长 10-10：AI学习 / AI圈大事记 / IP工具 由超管按渠道授权（默认不授权），
 * 授权后渠道默认上架，可自己下架。
 *  · GET                                   → { modules }（授权、渠道上架、前台是否生效）
 *  · POST { module, granted }              授权 / 收回（写审计 tenant.module_grant，给渠道发站内通知）
 * 授权：adminGuard（主站店面 + ADMIN 查库复核 + 同源）。
 */
const bodySchema = z.object({ module: z.enum(['learn', 'news', 'iptools']), granted: z.boolean() }).strict()

function fail(e: unknown, tag: string) {
  if (e instanceof TenantModuleError) return error(e.detail, e.status)
  return adminFail(e, tag)
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  try {
    return success({ modules: await listTenantModules(id) })
  } catch (e) {
    return fail(e, '内容模块')
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const body = await readJson(req, bodySchema)
  if (body instanceof Response) return body
  try {
    const r = await adminSetModuleGrant(id, body.module, body.granted, await currentAdminId())
    return success({ modules: r.modules }, !r.changed ? '没有变化' : body.granted ? '已授权，渠道前台已上架' : '已收回')
  } catch (e) {
    return fail(e, '内容模块授权')
  }
}
