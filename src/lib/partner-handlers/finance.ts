/**
 * 渠道后台 handler：结算中心（WP7，实施分包 10.4）。全部数字经 partner-services/finance → partner-facade（WP3）。
 *
 *  GET  /api/partner/finance/summary                                   finance.read
 *  GET  /api/partner/finance/ledger?type=&component=&from=&to=&page=   finance.read
 *  GET  /api/partner/finance/orders?state=&from=&to=&page=             finance.read
 *  POST /api/partner/finance/apply  { requestId } → GenerateResult     finance.apply（OWNER；每渠道每天 3 次尝试，facade 计数）
 *  GET  /api/partner/finance/statements?page=                          finance.read
 *  GET  /api/partner/finance/statements/[statementNo]                  finance.read
 *  GET  /api/partner/finance/statements/[statementNo]/export → CSV     finance.read
 *
 * 申请结算的结果（成功 / 各种不可申请原因）一律 200 + GenerateResult：「余额不足」「间隔不足」是业务结果不是请求错误，
 * 页面按 reason 显示文案；只有请求本身不合规（requestId 格式）才 400。
 */
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { notFound404, pageParams, parseBody, toCsv } from './_http'
import { fail, ok, parseCnDate, run, type HandlerCtx } from './orders'
import {
  APPLY_REQUEST_ID_RE,
  FIN_ORDER_STATES,
  isLedgerComponent,
  isLedgerType,
  partnerApplySettlement,
  partnerFinanceOrders,
  partnerFinanceSummary,
  partnerLedger,
  partnerStatementCsv,
  partnerStatementDetail,
  partnerStatements,
  type FinOrderState,
} from '../partner-services/finance'

function dateRange(sp: URLSearchParams): { from?: Date; to?: Date } | string {
  const from = parseCnDate(sp.get('from'))
  const to = parseCnDate(sp.get('to'), true)
  if (from === 'BAD' || to === 'BAD') return '日期格式应为 YYYY-MM-DD'
  return { from, to }
}

/** GET /api/partner/finance/summary */
export async function financeSummary(_req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('结算中心概览', async () => ok(await partnerFinanceSummary(ctx.tenantId)))
}

/** GET /api/partner/finance/ledger */
export async function financeLedger(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('流水', async () => {
    const url = new URL(req.url)
    const sp = url.searchParams
    const type = (sp.get('type') ?? '').trim()
    const component = (sp.get('component') ?? '').trim()
    if (type && !isLedgerType(type)) return fail('类型参数不正确')
    if (component && !isLedgerComponent(component)) return fail('成分参数不正确')
    const range = dateRange(sp)
    if (typeof range === 'string') return fail(range)
    const { page, pageSize } = pageParams(url)
    const r = await partnerLedger(ctx.tenantId, {
      type: type && isLedgerType(type) ? type : undefined,
      component: component && isLedgerComponent(component) ? component : undefined,
      ...range,
      page,
      pageSize,
    })
    return ok({ total: r.total, rows: r.rows, page, pageSize })
  })
}

/** GET /api/partner/finance/orders */
export async function financeOrders(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('订单结算明细', async () => {
    const url = new URL(req.url)
    const sp = url.searchParams
    const state = (sp.get('state') ?? '').trim()
    if (state && !(FIN_ORDER_STATES as readonly string[]).includes(state)) return fail('结算状态参数不正确')
    const range = dateRange(sp)
    if (typeof range === 'string') return fail(range)
    const { page, pageSize } = pageParams(url)
    const r = await partnerFinanceOrders(ctx.tenantId, { state: (state || undefined) as FinOrderState | undefined, ...range, page, pageSize })
    return ok({ total: r.total, rows: r.rows, page, pageSize })
  })
}

const applySchema = z.object({ requestId: z.string().regex(APPLY_REQUEST_ID_RE, '请求编号格式不正确，请刷新页面后重试') })

/** POST /api/partner/finance/apply */
export async function financeApply(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('申请结算', async () => {
    const b = await parseBody(req, applySchema)
    if (b instanceof Response) return b
    return ok(await partnerApplySettlement(ctx.tenantId, ctx.userId, b.requestId))
  })
}

/** GET /api/partner/finance/statements */
export async function listStatements(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('结算单列表', async () => {
    const { page } = pageParams(new URL(req.url))
    const r = await partnerStatements(ctx.tenantId, page)
    return ok({ total: r.total, rows: r.rows, page, pageSize: 20 })
  })
}

/** GET /api/partner/finance/statements/[statementNo] */
export async function statementDetail(_req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('结算单详情', async () => {
    const d = await partnerStatementDetail(ctx.tenantId, params.statementNo ?? '')
    return d ? ok(d) : notFound404()
  })
}

/** GET /api/partner/finance/statements/[statementNo]/export */
export async function exportStatement(req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('对账单导出', async () => {
    const r = await partnerStatementCsv(ctx.tenantId, ctx.userId, params.statementNo ?? '', req)
    if (!r) return notFound404()
    return new NextResponse(toCsv(r.rows, r.header, r.watermark), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${r.filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  })
}
