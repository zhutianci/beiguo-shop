export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { ensureDefaultCategories } from '@/lib/forum'

// 板块列表（含每个板块的帖子数）
export async function GET() {
  try {
    await ensureDefaultCategories()
    const categories = await prisma.forumCategory.findMany({
      where: { status: 1 },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: { _count: { select: { posts: { where: { status: 1 } } } } },
    })
    return success(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
        color: c.color,
        postCount: c._count.posts,
      }))
    )
  } catch (err) {
    console.error('Get forum categories error:', err)
    return error('获取板块失败')
  }
}
