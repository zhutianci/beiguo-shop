/**
 * 渠道后台 handler：商品池（WP6，实施分包 9.4）。GET /api/partner/catalog?categoryId=&q=&status=（catalog.read）。
 * 只返回本渠道 granted=true 的行；库存只给档位。
 */
import type { NextRequest } from 'next/server'
import { partnerCatalog, type CatalogQuery } from '../partner-services/catalog'
import { fail, ok, run, type HandlerCtx } from './orders'

export async function getCatalog(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('商品池', async () => {
    const sp = new URL(req.url).searchParams
    const q: CatalogQuery = {}
    const cat = (sp.get('categoryId') ?? '').trim()
    if (cat) {
      if (!/^\d{1,9}$/.test(cat)) return fail('分类参数不正确')
      q.categoryId = Number(cat)
    }
    const kw = (sp.get('q') ?? '').trim()
    if (kw) {
      if (kw.length > 64) return fail('关键字最多 64 个字')
      q.q = kw
    }
    const st = (sp.get('status') ?? '').trim()
    if (st) {
      if (st !== '0' && st !== '1') return fail('状态参数不正确')
      q.status = st === '1' ? 1 : 0
    }
    return ok({ rows: await partnerCatalog(ctx.tenantId, q) })
  })
}
