export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { requireDispenseAuth } from '@/lib/dispense'

// 查询共用库存：外部站点上架/下单前可先查可售数量。
// ?sku=a,b,c 查指定；不传则返回所有已配置 apiSku 的自动发货商品。
export async function GET(request: NextRequest) {
  const authErr = requireDispenseAuth(request)
  if (authErr) return authErr

  try {
    const { searchParams } = new URL(request.url)
    const skuParam = (searchParams.get('sku') || '').trim()
    const skus = skuParam
      ? skuParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 100)
      : null

    const where: Prisma.ProductWhereInput = {
      deliveryType: 'AUTO',
      ...(skus ? { apiSku: { in: skus } } : { apiSku: { not: null } }),
    }
    const products = await prisma.product.findMany({
      where,
      select: { id: true, apiSku: true, name: true, status: true },
    })

    const ids = products.map((p) => p.id)
    const grouped = ids.length
      ? await prisma.cardKey.groupBy({
          by: ['productId'],
          where: { productId: { in: ids }, status: 'UNUSED' },
          _count: { _all: true },
        })
      : []
    const stockMap = new Map(grouped.map((g) => [g.productId, g._count._all]))

    const list = products.map((p) => ({
      sku: p.apiSku,
      productId: p.id,
      name: p.name,
      online: p.status === 1, // 是否在 beiguo 前台上架（下架不影响外部站点领卡）
      stock: stockMap.get(p.id) || 0,
    }))

    return success({ list })
  } catch (e) {
    console.error('[inventory/stock] error', e)
    return error('查询失败')
  }
}
