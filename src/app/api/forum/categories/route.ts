export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { ensureDefaultCategories } from '@/lib/forum'
import { denyUnlessModule } from '@/lib/storefront/resolve'

// 板块列表（含每个板块的帖子数）
export async function GET() {
  // 渠道分站：本模块渠道站默认关闭，超管授权且渠道上架才开（docs/多渠道分销-内容模块下放.md）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyUnlessModule('learn')
  if (channelDenied) return channelDenied
  try {
    await ensureDefaultCategories()
    const categories = await prisma.forumCategory.findMany({
      // 提示词 / 教程的专用板块不出现在论坛的板块导航与发帖选择里（它们有自己的栏目，内容平台 P1）
      where: { status: 1, slug: { notIn: ['prompts', 'guides'] } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      // 帖子数只数对外公开的（口径同 lib/content/policy 的 isPublic）
      include: { _count: { select: { posts: { where: { status: 1, reviewStatus: 'APPROVED', deletedAt: null, type: 'DISCUSSION' } } } } },
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
