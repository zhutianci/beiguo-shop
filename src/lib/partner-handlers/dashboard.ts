/**
 * 渠道后台 handler：看板（WP6，实施分包 9.4）。GET /api/partner/dashboard（dashboard.read，DRAFT / SUSPENDED 可读）。
 *
 * 【财务数字按 finance.read 裁剪】设计 6.1：dashboard.read 可授予 STAFF，但「余额、流水、结算单、打款记录」属于
 * finance.read（仅 OWNER）。看板若对 dashboard.read 一律给渠道账户级余额，STAFF 就能从看板看到结算中心拒绝给他的数字。
 * 所以这里按与 partnerRoute 完全相同的口径（持有该点，且不在 OWNER_ONLY_PERMS 或本人是 OWNER）算出 withFinance，
 * 没有就不给 balances / canApply（服务层直接不查，而不是查了再删）。
 */
import type { NextRequest } from 'next/server'
import { partnerDashboard } from '../partner-services/dashboard'
import { hasFinanceRead, ok, run, type HandlerCtx } from './orders'

export async function getDashboard(_req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  const withFinance = hasFinanceRead(ctx)
  return run('看板', async () => ok(await partnerDashboard(ctx.tenantId, { withFinance })))
}
