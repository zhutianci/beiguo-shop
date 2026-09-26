export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success } from '@/lib/api'
import { adminFail, auditSummary, queryAudit } from '@/lib/tenant/admin-tenants'

/**
 * 审计查询（设计 12.2、13.2；仅超管，含原始 diff、IP、UA、原因原文）。筛选：渠道、操作人、身份、动作（前缀）、结果、对象编号、时间。
 * ?summary=1 另附近 7 天 DENIED 汇总与近 30 天各渠道交付凭据查看量。
 */

const KINDS = new Set(['PLATFORM', 'TENANT', 'SYSTEM', 'BUYER'])
const RESULTS = new Set(['OK', 'DENIED', 'ERROR'])

export async function GET(req: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  const u = new URL(req.url).searchParams
  const int = (k: string) => {
    const n = Number.parseInt(u.get(k) || '', 10)
    return Number.isSafeInteger(n) && n > 0 ? n : undefined
  }
  const date = (k: string) => {
    const v = u.get(k)
    if (!v) return undefined
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? undefined : d
  }
  const kind = u.get('actorKind') || ''
  const result = u.get('result') || ''
  try {
    const data = await queryAudit({
      tenantId: int('tenantId'),
      actorUserId: int('actorUserId'),
      actorKind: KINDS.has(kind) ? kind : undefined,
      action: (u.get('action') || '').trim().slice(0, 48) || undefined,
      result: RESULTS.has(result) ? result : undefined,
      targetId: (u.get('targetId') || '').trim().slice(0, 40) || undefined,
      from: date('from'),
      to: date('to'),
      page: int('page') ?? 1,
      pageSize: Math.min(int('pageSize') ?? 50, 100),
    })
    return success(u.get('summary') === '1' ? { ...data, summary: await auditSummary() } : data)
  } catch (e) {
    return adminFail(e, '审计查询')
  }
}
