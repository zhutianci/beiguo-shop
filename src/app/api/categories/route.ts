export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { getStorefront } from '@/lib/storefront/resolve'
import { listStorefrontProducts } from '@/lib/pricing'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  // 店面解析不进 try（设计 4.4 第 7 条）
  const sf = await getStorefront()
  if (!sf) return notFound()
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

    if (sf.kind === 'PLATFORM') return success(categories)

    /*
     * 【渠道站：由上架反推】（设计 12.3）只列本店有可售商品的分类，_count.products = 本店可售商品数。
     * 主站的 _count 是全部商品（含下架）的数量，会把站长的品类规模带给渠道站买家；而分类只剩空壳时也不该出现在筛选里。
     * 行的形状与主站相同（整行 + _count），前台不用分叉。
     */
    const previewUserId = sf.status === 'DRAFT' ? ((await getCurrentUser())?.id ?? null) : null
    const items = await listStorefrontProducts(sf, { previewUserId })
    const counts = new Map<number, number>()
    for (const p of items) if (p.categoryId != null) counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1)
    return success(
      categories
        .filter((c) => counts.has(c.id))
        .map((c) => ({ ...c, _count: { products: counts.get(c.id) ?? 0 } })),
    )
  } catch (err) {
    console.error('Get categories error:', err)
    return error('获取分类列表失败')
  }
}
