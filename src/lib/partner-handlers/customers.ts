/**
 * 渠道后台 handler：本站用户（WP7，实施分包 10.4）。
 *
 *  GET   /api/partner/customers?q=&tag=&blocked=&from=&to=&dateBy=&sort=&page=   customer.read
 *  GET   /api/partner/customers/export                                          customer.export（OWNER；每日 5 次；水印）
 *  GET   /api/partner/customers/[customerNo]                                    customer.read
 *  PATCH /api/partner/customers/[customerNo]            { note?, tags? }        customer.write
 *  POST  /api/partner/customers/[customerNo]/block      { reason, note? } → 204 customer.write
 *  POST  /api/partner/customers/[customerNo]/unblock    → 204 | 404（平台设的拉黑）
 *  POST  /api/partner/customers/[customerNo]/ban-request { reason } → { requestNo }
 *
 * 授权全在 partnerRoute；tenantId 只取 ctx.tenantId。body 只经 zod 解析出写死的字段（未知键丢弃，T8）。
 * 本目录只能 import 自身、partner-services、tenant/{types,perms,math}、src/lib/api、next/server、zod（边界检查规则 2）。
 */
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { notFound404, pageParams, parseBody, toCsv } from './_http'
import { fail, noContent, ok, parseCnDate, run, type HandlerCtx } from './orders'
import {
  BLOCK_NOTE_MAX,
  BLOCK_REASONS,
  CUSTOMER_DATE_BY,
  CUSTOMER_SORTS,
  NOTE_MAX,
  TAG_LEN_MAX,
  TAGS_MAX,
  partnerBlockCustomer,
  partnerCustomerBanRequest,
  partnerCustomerDetail,
  partnerExportCustomers,
  partnerListCustomers,
  partnerUnblockCustomer,
  partnerUpdateCustomer,
  type CustomerFilter,
} from '../partner-services/customers'
import { REASON_MAX, REASON_MIN } from '../partner-services/after-sales'

function pick<T extends string>(raw: string | null, allowed: readonly T[]): T | undefined | 'BAD' {
  if (raw === null || raw === '') return undefined
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : 'BAD'
}

/** 列表与导出共用的筛选解析；返回字符串 = 400 文案。客户端只能传枚举化的参数，绝不透传到 where */
export function parseCustomerFilter(url: URL): CustomerFilter | string {
  const sp = url.searchParams
  const f: CustomerFilter = {}
  const q = sp.get('q')?.trim()
  if (q) f.q = q
  const tag = sp.get('tag')?.trim()
  if (tag) f.tag = tag
  const blocked = pick(sp.get('blocked'), ['yes', 'no'] as const)
  if (blocked === 'BAD') return '拉黑筛选参数不正确'
  f.blocked = blocked
  const dateBy = pick(sp.get('dateBy'), CUSTOMER_DATE_BY)
  if (dateBy === 'BAD') return '时间筛选参数不正确'
  f.dateBy = dateBy
  const sort = pick(sp.get('sort'), CUSTOMER_SORTS)
  if (sort === 'BAD') return '排序参数不正确'
  f.sort = sort
  const from = parseCnDate(sp.get('from'))
  const to = parseCnDate(sp.get('to'), true)
  if (from === 'BAD' || to === 'BAD') return '日期格式应为 YYYY-MM-DD'
  f.from = from
  f.to = to
  return f
}

/** GET /api/partner/customers */
export async function listCustomers(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('客户列表', async () => {
    const url = new URL(req.url)
    const f = parseCustomerFilter(url)
    if (typeof f === 'string') return fail(f)
    const { page, pageSize } = pageParams(url)
    const r = await partnerListCustomers(ctx.tenantId, { ...f, page, pageSize })
    return ok({ total: r.total, rows: r.rows, page, pageSize })
  })
}

/** GET /api/partner/customers/export */
export async function exportCustomers(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('客户导出', async () => {
    const f = parseCustomerFilter(new URL(req.url))
    if (typeof f === 'string') return fail(f)
    const r = await partnerExportCustomers(ctx.tenantId, ctx.userId, f, req)
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

/** GET /api/partner/customers/[customerNo] */
export async function customerDetail(_req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('客户详情', async () => {
    const d = await partnerCustomerDetail(ctx.tenantId, params.customerNo ?? '')
    return d ? ok(d) : notFound404()
  })
}

const patchSchema = z.object({
  note: z.string().max(NOTE_MAX, `备注最多 ${NOTE_MAX} 个字`).nullable().optional(),
  tags: z.array(z.string().max(TAG_LEN_MAX, `每个标签最多 ${TAG_LEN_MAX} 个字`)).max(TAGS_MAX, `标签最多 ${TAGS_MAX} 个`).optional(),
})

/** PATCH /api/partner/customers/[customerNo] → 204 */
export async function updateCustomer(req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('修改客户备注', async () => {
    const b = await parseBody(req, patchSchema)
    if (b instanceof Response) return b
    await partnerUpdateCustomer(ctx.tenantId, params.customerNo ?? '', ctx.userId, { note: b.note, tags: b.tags }, req)
    return noContent()
  })
}

const blockSchema = z.object({
  reason: z.enum(BLOCK_REASONS, { errorMap: () => ({ message: '请选择拉黑原因' }) }),
  note: z.string().trim().max(BLOCK_NOTE_MAX, `补充说明最多 ${BLOCK_NOTE_MAX} 个字`).nullable().optional(),
})

/** POST /api/partner/customers/[customerNo]/block → 204 */
export async function blockCustomer(req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('拉黑客户', async () => {
    const b = await parseBody(req, blockSchema)
    if (b instanceof Response) return b
    await partnerBlockCustomer(ctx.tenantId, params.customerNo ?? '', ctx.userId, { reason: b.reason, note: b.note ?? null }, req)
    return noContent()
  })
}

/** POST /api/partner/customers/[customerNo]/unblock → 204 | 404 */
export async function unblockCustomer(req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('解除拉黑', async () => {
    await partnerUnblockCustomer(ctx.tenantId, params.customerNo ?? '', ctx.userId, req)
    return noContent()
  })
}

const banSchema = z.object({
  reason: z.string().trim().min(REASON_MIN, `原因至少 ${REASON_MIN} 个字`).max(REASON_MAX, `原因最多 ${REASON_MAX} 个字`),
})

/** POST /api/partner/customers/[customerNo]/ban-request → { requestNo } | 409 */
export async function banRequest(req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('申请全局封禁', async () => {
    const b = await parseBody(req, banSchema)
    if (b instanceof Response) return b
    return ok(await partnerCustomerBanRequest(ctx.tenantId, params.customerNo ?? '', ctx.userId, b.reason, req))
  })
}
