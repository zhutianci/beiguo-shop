export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success } from '@/lib/api'
import { adminFail, cnMonthRange, overview } from '@/lib/tenant/admin-tenants'

/** 运营概览（仅超管，设计 10.13、12.2）。?range=month（默认，东八区本月）| lastMonth | all */

export async function GET(req: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  const range = new URL(req.url).searchParams.get('range') || 'month'
  try {
    const r = range === 'all' ? null : cnMonthRange(range === 'lastMonth' ? -1 : 0)
    return success({ range, from: r ? r.from.toISOString() : null, to: r ? r.to.toISOString() : null, rows: await overview(r ?? {}) })
  } catch (e) {
    return adminFail(e, '运营概览')
  }
}
