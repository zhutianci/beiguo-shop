export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

// 商品列表
// 向后兼容：不传 page 时返回裸数组（旧行为）；传了 page 才返回 { list, total, page, pageSize, totalPages }
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    // 分类筛选：新参数 categoryId，兼容旧参数 category
    const categoryRaw = searchParams.get('categoryId') ?? searchParams.get('category')

    const where: { status: number; categoryId?: number } = { status: 1 }
    if (categoryRaw) {
      const cid = parseInt(categoryRaw)
      if (!Number.isNaN(cid)) where.categoryId = cid
    }

    // 分页参数（可选）
    const pageRaw = searchParams.get('page')
    const paged = pageRaw !== null
    const page = Math.max(parseInt(pageRaw || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '24') || 24, 1), 60)

    const [products, total] = await Promise.all([
      prisma.product.findMany({
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
          { id: 'desc' }, // 兜底排序，保证翻页结果稳定（不重不漏）
        ],
        ...(paged ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      paged ? prisma.product.count({ where }) : Promise.resolve(0),
    ])

    // 内推：带 ?ref=CODE 时，用推广人的「专属价」覆盖售价（只查本页商品）
    let list = products
    const ref = searchParams.get('ref')?.trim()
    if (ref && products.length > 0) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: ref }, select: { id: true, status: true } })
      if (referrer && referrer.status === 1) {
        const rps = await prisma.referralPrice.findMany({
          where: { userId: referrer.id, productId: { in: products.map((p) => p.id) } },
        })
        const priceMap = new Map(rps.map((r) => [r.productId, r.price]))
        list = products.map((p) => {
          const custom = priceMap.get(p.id)
          return custom != null ? { ...p, price: custom, originalPrice: p.originalPrice ?? p.price } : p
        })
      }
    }

    if (!paged) return success(list)

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    })
  } catch (err) {
    console.error('Get products error:', err)
    return error('获取商品列表失败')
  }
}
