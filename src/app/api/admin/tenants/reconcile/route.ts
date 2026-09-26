export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { success } from '@/lib/api'
import { adminFail, currentAdminId, lastReconcileResult, readJson, runReconcileAdmin } from '@/lib/tenant/admin-tenants'

/**
 * 对账自检（设计 10.12）：POST 立即跑 L1–L13、A1–A13（可只跑一个渠道）；钱类失败默认置该渠道 payoutHold（与每日 cron 同口径，
 * fail closed），可在页面上取消勾选只看不置。GET 返回本进程上一次的结果。
 */

const schema = z.object({ tenantId: z.number().int().min(2).optional(), applyHold: z.boolean().optional() })

export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  return success(lastReconcileResult())
}

export async function POST(req: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  const body = await readJson(req, schema)
  if (body instanceof Response) return body
  try {
    const adminId = await currentAdminId()
    return success(await runReconcileAdmin(body, adminId))
  } catch (e) {
    return adminFail(e, '对账自检')
  }
}
