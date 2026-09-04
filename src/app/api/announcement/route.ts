export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

// 公开接口：取当前生效的一条公告，供前台弹窗展示。没有生效公告时返回 null。
// middleware 只保护 /admin 与 /api/admin，这条路由本就应当公开。
export async function GET() {
  try {
    const now = new Date()
    const a = await prisma.announcement.findFirst({
      where: {
        enabled: true,
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      // 强提醒优先；同级取最新发布的一条
      orderBy: [{ pinned: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        title: true,
        content: true,
        level: true,
        pinned: true,
        updatedAt: true,
      },
    })

    return success(a)
  } catch (err) {
    console.error('Get announcement error:', err)
    return error('获取公告失败')
  }
}
