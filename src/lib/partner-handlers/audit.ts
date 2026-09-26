/**
 * 渠道后台 handler：操作日志（WP7，实施分包 10.4）。
 *
 *  GET /api/partner/audit?action=&from=&to=&page=   audit.read → { total, rows: PartnerAuditRow[] }
 *
 * 只给 publicDiff，永不给 diff；平台行 actor='平台'；不含 authz.denied（见 partner-services/audit.ts）。
 */
import type { NextRequest } from 'next/server'
import { pageParams } from './_http'
import { fail, ok, parseCnDate, run, type HandlerCtx } from './orders'
import { ACTION_FILTER_RE, partnerListAudit } from '../partner-services/audit'

export async function listAudit(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('操作日志', async () => {
    const url = new URL(req.url)
    const sp = url.searchParams
    const action = (sp.get('action') ?? '').trim()
    if (action && !ACTION_FILTER_RE.test(action)) return fail('操作类型参数不正确')
    const from = parseCnDate(sp.get('from'))
    const to = parseCnDate(sp.get('to'), true)
    if (from === 'BAD' || to === 'BAD') return fail('日期格式应为 YYYY-MM-DD')
    const { page, pageSize } = pageParams(url)
    const r = await partnerListAudit(ctx.tenantId, { action: action || undefined, from, to, page, pageSize })
    return ok({ total: r.total, rows: r.rows, page, pageSize })
  })
}
