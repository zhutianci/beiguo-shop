export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, parseIdParam, readJson, tenantDetail, upsertDomain } from '@/lib/tenant/admin-tenants'

/** 渠道域名：只接受 *.bigolab.com 的一级子域，拒绝主站域名；停用的域名解析返回 404、绝不回落主站（设计 4.4） */

const bodySchema = z.object({ host: z.string().trim().min(3).max(120), status: z.union([z.literal(0), z.literal(1)]) })

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  try {
    return success((await tenantDetail(id)).domains)
  } catch (e) {
    return adminFail(e, '域名列表')
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
    const adminId = await currentAdminId()
    await upsertDomain(id, body.host, body.status, adminId)
    return success(null, '已保存')
  } catch (e) {
    return adminFail(e, '保存域名')
  }
}
