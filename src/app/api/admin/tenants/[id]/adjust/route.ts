export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, balancesAdmin, currentAdminId, parseIdParam, readJson } from '@/lib/tenant/admin-tenants'
import { adjust } from '@/lib/tenant/ledger'

/**
 * 超管调账（设计 10.4 ADJUST）：adj:{requestId}，requestId 由弹窗打开时前端生成——同一个 requestId 重复提交只生效一次，
 * 第二次返回「已处理」（W5-8）。审计由 WP3 的 adjust 在同一事务写好（publicDiff 只含 { amountCents, publicMemo }）。
 */

const schema = z.object({
  amountCents: z.number().int().refine((v) => v !== 0 && Math.abs(v) <= 100_000_000, '调账金额必须非零且不超过 100 万元'),
  reasonCode: z.string().trim().min(1).max(24),
  reason: z.string().trim().min(1).max(255),
  publicMemo: z.string().trim().max(255).optional(),
  requestId: z.string().trim().regex(/^[A-Za-z0-9_-]{8,64}$/, 'requestId 格式不对'),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const body = await readJson(req, schema)
  if (body instanceof Response) return body
  try {
    await balancesAdmin(id) // 渠道存在性（404）
    const adminId = await currentAdminId()
    const r = await adjust({ tenantId: id, ...body, publicMemo: body.publicMemo || undefined, operatorId: adminId })
    return success({ result: r }, r === 'DUPLICATE' ? '已处理（同一次调账不会重复入账）' : '已调账')
  } catch (e) {
    return adminFail(e, '调账')
  }
}
