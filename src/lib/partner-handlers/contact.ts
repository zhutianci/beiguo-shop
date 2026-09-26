/**
 * 渠道后台 handler：客服信息（二期改动 4.3）。全部 settings.write（仅 OWNER），写接口在暂停营业时只读（路由不加 readOnlySafe）。
 *
 *  GET    /api/partner/settings/contact                          → { contact }（渠道自己填的原值，不回退）
 *  PUT    /api/partner/settings/contact     { wechat?, email?, hours? } → { contact }（null / 空串 = 清空；多给字段 400）
 *  POST   /api/partner/settings/contact-qr  multipart file=<图片>  → { contact }（≤2MB，png / jpg / webp）
 *  DELETE /api/partner/settings/contact-qr                        → { contact }
 *
 * 请求体只经 zod（partnerContactInputSchema，strict：**没有 qrUrl**，二维码地址只由服务端上传后写入）；
 * multipart 只取 file 字段的字节（_http.parseUploadFile，先查 Content-Length），文件名与声明的 MIME 一概不用。
 */
import type { NextRequest } from 'next/server'
import { partnerContactInputSchema } from '../contact'
import { parseBody, parseUploadFile } from './_http'
import { fail, ok, run, type HandlerCtx } from './orders'
import { partnerClearContactQr, partnerGetContact, partnerSetContact, partnerUploadContactQr } from '../partner-services/contact'

/**
 * 二维码单文件上限 2MB：与 upload-store 的 CONTACT_QR_MAX_BYTES 同一个数（handler 层不能 import upload-store，规则 2），
 * 这里先挡一道省得把大文件读进内存；落盘前 facade → storeContactQr 按真实字节再卡一次，两边不一致也只会更严。
 */
const CONTACT_QR_MAX_BYTES = 2 * 1024 * 1024

/** GET /api/partner/settings/contact */
export async function getContact(_req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('客服信息', async () => ok({ contact: await partnerGetContact(ctx.tenantId) }))
}

/** PUT /api/partner/settings/contact */
export async function setContact(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('保存客服信息', async () => {
    const b = await parseBody(req, partnerContactInputSchema)
    if (b instanceof Response) return b
    return ok({ contact: await partnerSetContact(ctx.tenantId, ctx.userId, b, req) })
  })
}

/** POST /api/partner/settings/contact-qr（multipart，字段名 file） */
export async function uploadContactQr(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('上传客服二维码', async () => {
    const bytes = await parseUploadFile(req, 'file', CONTACT_QR_MAX_BYTES)
    if (bytes instanceof Response) return bytes
    const r = await partnerUploadContactQr(ctx.tenantId, ctx.userId, bytes, req)
    if (!r.ok) return fail(r.error, r.status)
    return ok({ contact: r.contact })
  })
}

/** DELETE /api/partner/settings/contact-qr */
export async function clearContactQr(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('清除客服二维码', async () => ok({ contact: await partnerClearContactQr(ctx.tenantId, ctx.userId, req) }))
}
