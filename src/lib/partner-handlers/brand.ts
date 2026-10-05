/**
 * 渠道后台 handler：店铺品牌与公告（docs/多渠道分销-渠道品牌与公告.md）。全部 settings.write（仅 OWNER）。
 *
 *  GET    /api/partner/settings/brand                           → { brand }（渠道自己填的原值，不回退）
 *  PUT    /api/partner/settings/brand   { brandName?, brandIntro?, heroTitle?, heroSubtitle?, seoTitle?, seoDescription? } → { brand }
 *  POST   /api/partner/settings/brand-logo  multipart file=<图片> → { brand }（≤1MB，png / jpg / webp）
 *  DELETE /api/partner/settings/brand-logo                      → { brand }
 *  GET    /api/partner/announcements                            → { rows }
 *  POST   /api/partner/announcements    { title, body, level?, enabled?, pinned?, startAt?, endAt? } → { row }
 *  PUT    /api/partner/announcements/[announcementNo]  同上     → { row }
 *  DELETE /api/partner/announcements/[announcementNo]            → { ok }
 *
 * 请求体只经 zod（strict：多给字段 400；**没有 brandLogoUrl**，站标地址只由服务端上传后写入）。字段的长度、网址、冒充官方等
 * 内容校验在 facade（brand.ts 的 checkBrandText）——这里只管形状。
 */
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { parseBody, parseUploadFile } from './_http'
import { fail, ok, run, type HandlerCtx } from './orders'
import {
  partnerClearBrandLogo,
  partnerCreateAnnouncement,
  partnerDeleteAnnouncement,
  partnerGetBrand,
  partnerListAnnouncements,
  partnerSetBrand,
  partnerUpdateAnnouncement,
  partnerUploadBrandLogo,
} from '../partner-services/brand'

/** 与 upload-store 的 BRAND_LOGO_MAX_BYTES 同一个数（handler 层不能 import upload-store，规则 2），先挡一道省得读大文件进内存 */
const BRAND_LOGO_MAX_BYTES = 1024 * 1024

const text = z.union([z.string().max(1000), z.null()]).optional()
const brandInputSchema = z
  .object({ brandName: text, brandIntro: text, heroTitle: text, heroSubtitle: text, seoTitle: text, seoDescription: text })
  .strict()

/** 公告请求体只管形状（字段校验与清洗在 tenant/announcements.ts 的 tenantAnnouncementSchema） */
const annInputSchema = z
  .object({
    title: z.string().max(1000),
    body: z.string().max(10000),
    level: z.string().max(20).optional(),
    enabled: z.boolean().optional(),
    pinned: z.boolean().optional(),
    startAt: z.union([z.string().max(40), z.null()]).optional(),
    endAt: z.union([z.string().max(40), z.null()]).optional(),
  })
  .strict()

/** 公开编号：12 位 Crockford base32（大小写不敏感；与 tenant/public-no.ts 的 PUBLIC_NO_PATTERN 同一格式，handler 层不能 import 它，规则 2） */
function noOf(params: Record<string, string>): string | null {
  const raw = (params.announcementNo ?? '').trim().toUpperCase()
  return /^[0-9A-HJKMNP-TV-Z]{12}$/.test(raw) ? raw : null
}

export async function getBrand(_req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('店铺品牌', async () => ok({ brand: await partnerGetBrand(ctx.tenantId) }))
}

export async function setBrand(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('保存店铺品牌', async () => {
    const b = await parseBody(req, brandInputSchema)
    if (b instanceof Response) return b
    return ok({ brand: await partnerSetBrand(ctx.tenantId, ctx.userId, b, req) })
  })
}

export async function uploadBrandLogo(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('上传店铺 logo', async () => {
    const bytes = await parseUploadFile(req, 'file', BRAND_LOGO_MAX_BYTES)
    if (bytes instanceof Response) return bytes
    const r = await partnerUploadBrandLogo(ctx.tenantId, ctx.userId, bytes, req)
    if (!r.ok) return fail(r.error, r.status)
    return ok({ brand: r.brand })
  })
}

export async function clearBrandLogo(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('清除店铺 logo', async () => ok({ brand: await partnerClearBrandLogo(ctx.tenantId, ctx.userId, req) }))
}

export async function listAnnouncements(_req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('店铺公告', async () => ok({ rows: await partnerListAnnouncements(ctx.tenantId) }))
}

export async function createAnnouncement(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('发布店铺公告', async () => {
    const b = await parseBody(req, annInputSchema)
    if (b instanceof Response) return b
    return ok({ row: await partnerCreateAnnouncement(ctx.tenantId, ctx.userId, b, req) })
  })
}

export async function updateAnnouncement(req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('修改店铺公告', async () => {
    const no = noOf(params)
    if (no === null) return fail('资源不存在', 404)
    const b = await parseBody(req, annInputSchema)
    if (b instanceof Response) return b
    return ok({ row: await partnerUpdateAnnouncement(ctx.tenantId, ctx.userId, no, b, req) })
  })
}

export async function deleteAnnouncement(req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('删除店铺公告', async () => {
    const no = noOf(params)
    if (no === null) return fail('资源不存在', 404)
    await partnerDeleteAnnouncement(ctx.tenantId, ctx.userId, no, req)
    return ok({ ok: true })
  })
}
