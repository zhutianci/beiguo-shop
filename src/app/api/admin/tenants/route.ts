export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { success } from '@/lib/api'
import { adminFail, createTenant, currentAdminId, listTenants, readJson } from '@/lib/tenant/admin-tenants'

/**
 * 渠道列表 / 新建渠道（WP5，设计 12.2）。鉴权：每个 handler 第一行 adminGuard（主站店面 + 同源 + 查库复核 ADMIN），
 * middleware 可被绕过，不能只靠它（实施分包规则 7）。实现全在 src/lib/tenant/admin-tenants.ts。
 */

const createSchema = z.object({
  code: z.string().trim().min(2).max(20),
  name: z.string().trim().min(1).max(50),
  origin: z.string().trim().min(8).max(120),
  feeRateBp: z.number().int().min(0).max(2000).optional(),
  invoiceShareRateBp: z.number().int().min(0).max(600).optional(),
  holdDays: z.number().int().min(0).max(90).optional(),
})

export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    return success(await listTenants())
  } catch (e) {
    return adminFail(e, '渠道列表')
  }
}

export async function POST(req: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  const body = await readJson(req, createSchema)
  if (body instanceof Response) return body
  try {
    const adminId = await currentAdminId()
    return success(await createTenant(body, adminId), '渠道已创建（筹备中）')
  } catch (e) {
    return adminFail(e, '新建渠道')
  }
}
