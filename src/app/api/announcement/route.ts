export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { denyOnChannel } from '@/lib/storefront/resolve'

// 公开接口：取当前生效的一条公告，供前台弹窗展示。没有生效公告时返回 null。
// middleware 只保护 /admin 与 /api/admin，这条路由本就应当公开。
export async function GET() {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
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
