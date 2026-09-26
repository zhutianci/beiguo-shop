/**
 * 渠道后台 handler：售后申请列表与取消（WP6，实施分包 9.4）。发起申请在 orders.ts（按订单寻址）。
 *  GET  /api/partner/after-sales?status=&kind=        order.read
 *  POST /api/partner/after-sales/[requestNo]/cancel   aftersale.request → 204 | 409 | 404
 */
import type { NextRequest } from 'next/server'
import { AFTER_SALE_KINDS, AFTER_SALE_STATUSES, partnerCancelAfterSale, partnerListAfterSales } from '../partner-services/after-sales'
import { fail, noContent, ok, run, type HandlerCtx } from './orders'

export async function listAfterSales(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('售后列表', async () => {
    const sp = new URL(req.url).searchParams
    const status = (sp.get('status') ?? '').trim()
    const kind = (sp.get('kind') ?? '').trim()
    if (status && !(AFTER_SALE_STATUSES as readonly string[]).includes(status)) return fail('状态参数不正确')
    if (kind && !(AFTER_SALE_KINDS as readonly string[]).includes(kind)) return fail('类型参数不正确')
    const rows = await partnerListAfterSales(ctx.tenantId, {
      status: (status || undefined) as (typeof AFTER_SALE_STATUSES)[number] | undefined,
      kind: (kind || undefined) as (typeof AFTER_SALE_KINDS)[number] | undefined,
    })
    return ok({ rows })
  })
}

export async function cancelAfterSale(req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('取消售后', async () => {
    await partnerCancelAfterSale(ctx.tenantId, params.requestNo ?? '', ctx.userId, req)
    return noContent()
  })
}
