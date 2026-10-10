/**
 * 渠道后台 handler：内容模块（docs/多渠道分销-内容模块下放.md）。全部 settings.write（仅 OWNER）。
 *
 *  GET /api/partner/settings/modules                       → { modules }
 *  PUT /api/partner/settings/modules  { module, on }       → { modules }（module ∈ learn | news | iptools；没授权 409）
 *
 * 请求体只经 zod（strict：多给字段 400）。
 */
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { parseBody } from './_http'
import { ok, run, type HandlerCtx } from './orders'
import { partnerListModules, partnerSetModuleOn } from '../partner-services/modules'

const putSchema = z.object({ module: z.enum(['learn', 'news', 'iptools']), on: z.boolean() }).strict()

export async function getModules(_req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('内容模块', async () => ok({ modules: await partnerListModules(ctx.tenantId) }))
}

export async function setModuleOn(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('内容模块上架 / 下架', async () => {
    const b = await parseBody(req, putSchema)
    if (b instanceof Response) return b
    return ok({ modules: await partnerSetModuleOn(ctx.tenantId, ctx.userId, b.module, b.on, req) })
  })
}
