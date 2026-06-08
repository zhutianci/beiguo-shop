export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category')

    const where: { status: number; categoryId?: number } = { status: 1 }
    if (categoryId) {
      where.categoryId = parseInt(categoryId)
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // 内推：带 ?ref=CODE 时，用推广人的「专属价」覆盖售价
    const ref = searchParams.get('ref')?.trim()
    if (ref) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: ref }, select: { id: true, status: true } })
      if (referrer && referrer.status === 1) {
        const rps = await prisma.referralPrice.findMany({
          where: { userId: referrer.id, productId: { in: products.map((p) => p.id) } },
        })
        const priceMap = new Map(rps.map((r) => [r.productId, r.price]))
        const list = products.map((p) => {
          const custom = priceMap.get(p.id)
          return custom != null ? { ...p, price: custom, originalPrice: p.originalPrice ?? p.price } : p
        })
        return success(list)
      }
    }

    return success(products)
  } catch (err) {
    console.error('Get products error:', err)
    return error('获取商品列表失败')
  }
}
