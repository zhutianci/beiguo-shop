export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

// GET：各商品的网站售价 + 全局默认基础价（适用所有推广人）
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { status: 1 },
      select: { id: true, name: true, price: true, referrerBasePrice: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    return success({
      products: products.map((p) => ({
        productId: p.id,
        name: p.name,
        websitePrice: Number(p.price),
        base: p.referrerBasePrice != null ? Number(p.referrerBasePrice) : null,
      })),
    })
  } catch (err) {
    console.error('Get default base error:', err)
    return error('查询失败')
  }
}

const saveSchema = z.object({
  prices: z.array(z.object({ productId: z.number().int().positive(), price: z.number().nonnegative().nullable() })),
})

// POST：批量设置全局默认基础价（null/0 = 用网站售价）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = saveSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    for (const item of parsed.data.prices) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { referrerBasePrice: item.price == null || item.price <= 0 ? null : item.price },
      })
    }
    return success({ ok: true }, '已保存')
  } catch (err) {
    console.error('Save default base error:', err)
    return error('保存失败')
  }
}
