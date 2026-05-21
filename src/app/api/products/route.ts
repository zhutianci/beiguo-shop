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

    return success(products)
  } catch (err) {
    console.error('Get products error:', err)
    return error('获取商品列表失败')
  }
}
