export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

// GET ?userId= ：某推广人各商品的 网站售价/默认基础价/单独基础价
export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(new URL(request.url).searchParams.get('userId') || '0')
    if (!userId) return error('缺少 userId')

    const [user, products, overrides] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, nickname: true, email: true, referralCode: true } }),
      prisma.product.findMany({
        where: { status: 1 },
        select: { id: true, name: true, price: true, referrerBasePrice: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.referrerBasePrice.findMany({ where: { userId } }),
    ])
    if (!user) return error('推广人不存在', 404)
    const ovMap = new Map(overrides.map((o) => [o.productId, Number(o.price)]))

    const list = products.map((p) => ({
      productId: p.id,
      name: p.name,
      websitePrice: Number(p.price),
      defaultBase: Number(p.referrerBasePrice ?? p.price),
      override: ovMap.has(p.id) ? ovMap.get(p.id)! : null,
    }))

    return success({ user: { id: user.id, name: user.nickname || user.email || `用户#${user.id}`, code: user.referralCode }, products: list })
  } catch (err) {
    console.error('Get referrer base error:', err)
    return error('查询失败')
  }
}

const saveSchema = z.object({
  userId: z.number().int().positive(),
  prices: z.array(z.object({ productId: z.number().int().positive(), price: z.number().nonnegative().nullable() })),
})

// POST：为推广人设置/清除单独基础价（null/0 = 用默认）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = saveSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const { userId, prices } = parsed.data

    for (const item of prices) {
      if (item.price == null || item.price <= 0) {
        await prisma.referrerBasePrice.deleteMany({ where: { userId, productId: item.productId } })
        continue
      }
      await prisma.referrerBasePrice.upsert({
        where: { userId_productId: { userId, productId: item.productId } },
        create: { userId, productId: item.productId, price: item.price },
        update: { price: item.price },
      })
    }
    return success({ ok: true }, '已保存')
  } catch (err) {
    console.error('Save referrer base error:', err)
    return error('保存失败')
  }
}
