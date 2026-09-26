export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, parseIdParam, readJson } from '@/lib/tenant/admin-tenants'
import { commitSupply } from '@/lib/tenant/supply-pricing'

/** 批量进货价：提交（逐行按 supplyVersion CAS；版本变了的行跳过并返回 VERSION_CHANGED；grant=true 同时授权在售商品） */

const schema = z.object({ previewToken: z.string().min(10).max(200_000), grant: z.boolean().optional() })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const body = await readJson(req, schema)
  if (body instanceof Response) return body
  try {
    const adminId = await currentAdminId()
    return success(await commitSupply(id, body.previewToken, adminId, body.grant))
  } catch (e) {
    return adminFail(e, '批量进货价提交')
  }
}
