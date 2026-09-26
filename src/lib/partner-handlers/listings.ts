/**
 * 渠道后台 handler：上下架与改价（WP6，实施分包 9.4、设计 7.2）。
 *
 *  PATCH /api/partner/listings/[listingNo]      { retailYuan?, status?, sortOrder? }
 *  POST  /api/partner/listings/status           { listingNos? | categoryId?, status }
 *  POST  /api/partner/listings/price/preview    { listingNos? | categoryId? | all?, mode, value, rounding }
 *  POST  /api/partner/listings/price/commit     同上 + previewToken
 *
 * 【只接受白名单字段】zod 对象默认丢弃未知键：supplyCents、granted、tenantId、productId、minRetailCents 塞进 body 也会被丢掉，
 * 服务层的写函数本身也只写 retailCents / status / sortOrder（T8，W6-2）。售价一律以「元」输入，严格解析成分（最多两位小数）。
 */
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { LIMITS } from '../tenant/types'
import { yuanToCents } from '../tenant/math'
import { parseBody } from './_http'
import {
  partnerBatchPriceCommit,
  partnerBatchPricePreview,
  partnerBatchStatus,
  partnerSetListing,
  PRICE_MODES,
  ROUNDING_MODES,
  type ListingPatch,
} from '../partner-services/listings'
import { fail, ok, run, type HandlerCtx } from './orders'

const patchSchema = z.object({
  retailYuan: z.union([z.string().max(20), z.number()]).optional(),
  status: z.union([z.literal(0), z.literal(1)]).optional(),
  sortOrder: z.number().int().min(0).max(99_999).optional(),
})

/** PATCH /api/partner/listings/[listingNo] → PartnerListingDTO | 400 { reason } */
export async function patchListing(req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('修改商品', async () => {
    const b = await parseBody(req, patchSchema)
    if (b instanceof Response) return b
    const patch: ListingPatch = {}
    if (b.retailYuan !== undefined) {
      try {
        patch.retailCents = yuanToCents(b.retailYuan)
      } catch {
        return fail('售价格式不正确（最多两位小数）', 400, { reason: 'NOT_PRICED' })
      }
    }
    if (b.status !== undefined) patch.status = b.status
    if (b.sortOrder !== undefined) patch.sortOrder = b.sortOrder
    if (patch.retailCents === undefined && patch.status === undefined && patch.sortOrder === undefined) return fail('没有要修改的内容')
    return ok(await partnerSetListing(ctx.tenantId, ctx.userId, params.listingNo ?? '', patch, req))
  })
}

const listingNos = z.array(z.string().max(32)).max(LIMITS.batchPriceMax, `单次最多 ${LIMITS.batchPriceMax} 个商品`)

const statusSchema = z.object({
  listingNos: listingNos.optional(),
  categoryId: z.number().int().positive().optional(),
  status: z.union([z.literal(0), z.literal(1)]),
})

/** POST /api/partner/listings/status → { updated, rejected } */
export async function batchStatus(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('批量上下架', async () => {
    const b = await parseBody(req, statusSchema)
    if (b instanceof Response) return b
    return ok(await partnerBatchStatus(ctx.tenantId, ctx.userId, b, req))
  })
}

const ruleSchema = z.object({
  listingNos: listingNos.optional(),
  categoryId: z.number().int().positive().optional(),
  all: z.literal(true).optional(),
  mode: z.enum(PRICE_MODES),
  value: z.union([z.string().max(20), z.number()]),
  rounding: z.enum(ROUNDING_MODES),
})

/** POST /api/partner/listings/price/preview → { rows, previewToken } */
export async function pricePreview(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('批量改价预览', async () => {
    const b = await parseBody(req, ruleSchema)
    if (b instanceof Response) return b
    return ok(await partnerBatchPricePreview(ctx.tenantId, ctx.userId, { ...b, value: String(b.value) }))
  })
}

const commitSchema = ruleSchema.extend({ previewToken: z.string().min(1).max(20_000) })

/** POST /api/partner/listings/price/commit → { updated, skipped }（验签失败 400） */
export async function priceCommit(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('批量改价提交', async () => {
    const b = await parseBody(req, commitSchema)
    if (b instanceof Response) return b
    return ok(await partnerBatchPriceCommit(ctx.tenantId, ctx.userId, { ...b, value: String(b.value) }, req))
  })
}
