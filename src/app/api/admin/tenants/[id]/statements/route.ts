export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { GENERATE_REASON, adminFail, currentAdminId, failJson, listStatementsAdmin, parseIdParam, payoutHoldText, readJson } from '@/lib/tenant/admin-tenants'
import { prisma } from '@/lib/db'
import { generateStatement, scheduledPeriodEnd } from '@/lib/tenant/statement'

/**
 * 结算单列表 / 生成（设计 10.9）。生成走 WP3 的 generateStatement（锁渠道行、出单前对账、按 eventKey 整组取舍）：
 *  · origin=SCHEDULE：periodEnd 默认东八区本周一 00:00（scheduledPeriodEnd），受最低结算额限制；
 *  · origin=MANUAL：periodEnd 默认现在，不受最低结算额限制（终止清算）；
 *  · requestId 由页面生成：双击 / 重试只出一张。
 */

const schema = z.object({
  origin: z.enum(['SCHEDULE', 'MANUAL']),
  periodEnd: z.string().datetime().optional(),
  requestId: z.string().trim().regex(/^[A-Za-z0-9_-]{8,40}$/, 'requestId 格式不对'),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const u = new URL(req.url)
  const page = Math.max(1, Number.parseInt(u.searchParams.get('page') || '1', 10) || 1)
  try {
    return success(await listStatementsAdmin(id, page, 20))
  } catch (e) {
    return adminFail(e, '结算单列表')
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const body = await readJson(req, schema)
  if (body instanceof Response) return body
  try {
    await listStatementsAdmin(id, 1, 1) // 渠道存在性（404）
    const adminId = await currentAdminId()
    const periodEnd = body.periodEnd ? new Date(body.periodEnd) : body.origin === 'SCHEDULE' ? scheduledPeriodEnd() : new Date()
    if (periodEnd.getTime() > Date.now() + 60_000) return failJson(400, '结算截止时间不能晚于现在')
    const r = await generateStatement({ tenantId: id, origin: body.origin, periodEnd, actorUserId: adminId, requestId: body.requestId })
    if (!r.ok) {
      const m = GENERATE_REASON[r.reason] ?? { status: 400, text: r.reason }
      if (r.reason === 'HOLD') {
        // 暂停打款的原因分「对账失败自动置」与「站长手动暂停」，文案按原因给（与认领打款同一口径）
        const t = await prisma.tenant.findUnique({ where: { id }, select: { payoutHoldReason: true } })
        return failJson(m.status, payoutHoldText(t?.payoutHoldReason, '不能出结算单'), r.reason)
      }
      return failJson(m.status, m.text, r.reason)
    }
    return success(r, `结算单 ${r.statementNo} 已生成`)
  } catch (e) {
    return adminFail(e, '生成结算单')
  }
}
