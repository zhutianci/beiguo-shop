export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { status: 1 },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return success(categories)
  } catch (err) {
    console.error('Get categories error:', err)
    return error('获取分类列表失败')
  }
}
