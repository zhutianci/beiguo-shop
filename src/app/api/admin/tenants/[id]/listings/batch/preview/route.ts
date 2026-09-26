export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, parseIdParam, readJson } from '@/lib/tenant/admin-tenants'
import { previewSupply } from '@/lib/tenant/supply-pricing'

/**
 * 批量进货价：预览（设计 7.1）。规则取值单位：COST+PCT / MAIN_PRICE+PCT 为 bp（280 = 2.8%、8500 = 85%），
 * ADD / SUB / MANUAL 为分。返回每行改前改后、基准、成本、毛利预估与是否会自动下架，以及签名的 previewToken。
 */

const schema = z.object({
  scope: z
    .object({
      productIds: z.array(z.number().int().positive()).max(500).optional(),
      categoryId: z.number().int().positive().optional(),
      all: z.literal(true).optional(),
    })
    .strict(),
  rule: z.discriminatedUnion('base', [
    z.object({ base: z.literal('COST'), mode: z.enum(['PCT', 'ADD']), value: z.number().int().min(0) }),
    z.object({ base: z.literal('MAIN_PRICE'), mode: z.enum(['PCT', 'SUB']), value: z.number().int().min(0) }),
    z.object({ base: z.literal('MANUAL'), cents: z.number().int().positive() }),
  ]),
  rounding: z.enum(['NONE', 'JIAO', 'YUAN', 'YUAN_UP']),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const body = await readJson(req, schema)
  if (body instanceof Response) return body
  try {
    return success(await previewSupply(id, body.scope, body.rule, body.rounding))
  } catch (e) {
    return adminFail(e, '批量进货价预览')
  }
}
