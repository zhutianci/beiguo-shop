/**
 * 渠道后台 handler：通知中心（WP7，实施分包 10.4）。
 *
 *  GET  /api/partner/notices?unread=1&page=                 notice.read → { total, rows }
 *  POST /api/partner/notices/read  { noticeNos?, all? }     notice.read → 204（他站 / 不存在的编号静默跳过，数据库不变）
 *  GET  /api/partner/notices/unread-count                   notice.read → { count }（外壳红点，WP6 调用）
 */
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { pageParams, parseBody } from './_http'
import { fail, noContent, ok, run, type HandlerCtx } from './orders'
import { MARK_READ_MAX, partnerListNotices, partnerMarkNoticesRead, partnerUnreadNoticeCount } from '../partner-services/notices'

/** GET /api/partner/notices */
export async function listNotices(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('通知列表', async () => {
    const url = new URL(req.url)
    const u = url.searchParams.get('unread')
    if (u !== null && u !== '' && u !== '1' && u !== '0') return fail('参数不正确')
    const { page, pageSize } = pageParams(url)
    const r = await partnerListNotices(ctx.tenantId, { unread: u === '1', page, pageSize })
    return ok({ total: r.total, rows: r.rows, page, pageSize })
  })
}

const readSchema = z
  .object({
    noticeNos: z.array(z.string().max(32)).max(MARK_READ_MAX, `一次最多 ${MARK_READ_MAX} 条`).optional(),
    all: z.literal(true).optional(),
  })
  .refine((b) => b.all === true || (b.noticeNos?.length ?? 0) > 0, { message: '请选择要标记的通知' })

/** POST /api/partner/notices/read → 204 */
export async function markNoticesRead(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('通知已读', async () => {
    const b = await parseBody(req, readSchema)
    if (b instanceof Response) return b
    await partnerMarkNoticesRead(ctx.tenantId, { noticeNos: b.noticeNos, all: b.all })
    return noContent()
  })
}

/** GET /api/partner/notices/unread-count → { count } */
export async function unreadCount(_req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('未读通知数', async () => ok({ count: await partnerUnreadNoticeCount(ctx.tenantId) }))
}
