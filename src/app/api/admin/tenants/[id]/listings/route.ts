export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, parseIdParam, readJson } from '@/lib/tenant/admin-tenants'
import { adminListings, setListingAdmin } from '@/lib/tenant/supply-pricing'

/**
 * 商品授权与进货价（逐个）。GET 全部商品 × 本渠道上架行（含成本基准，仅超管）；PUT 改一行：
 * 授权开关、进货价、售价上下限、代改售价（金额一律整数分；null = 清空）。规则见 supply-pricing.setListingAdmin。
 */

const cents = z.number().int().positive().max(100_000_000).nullable()
const putSchema = z
  .object({
    productId: z.number().int().positive(),
    granted: z.boolean().optional(),
    supplyCents: cents.optional(),
    minRetailCents: cents.optional(),
    maxRetailCents: cents.optional(),
    retailCents: cents.optional(),
  })
  .strict()

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const url = new URL(req.url)
  const only = url.searchParams.get('only')
  const cat = Number.parseInt(url.searchParams.get('categoryId') || '', 10)
  try {
    return success(
      await adminListings(id, {
        keyword: url.searchParams.get('q') || undefined,
        categoryId: Number.isSafeInteger(cat) && cat > 0 ? cat : undefined,
        only: only === 'listed' || only === 'granted' ? only : 'all',
      }),
    )
  } catch (e) {
    return adminFail(e, '商品授权列表')
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const body = await readJson(req, putSchema)
  if (body instanceof Response) return body
  try {
    const adminId = await currentAdminId()
    const { productId, ...patch } = body
    const r = await setListingAdmin(id, productId, patch, adminId)
    return success(r, r.delisted ? '已保存；该商品已自动下架并通知渠道' : '已保存')
  } catch (e) {
    return adminFail(e, '修改上架行')
  }
}
