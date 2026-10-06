export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { levelOf } from '@/lib/content/points'

// 页头小红点与「我的学习空间」顶部数据：未读通知数、积分与等级、作者主页短码。未登录返回空，不报 401（页头每页都请求）
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser().catch(() => null)
    if (!user) return success({ loggedIn: false })
    const [unread, profile, favorites, following, followers] = await Promise.all([
      prisma.notification.count({ where: { userId: user.id, readAt: null } }),
      prisma.creatorProfile.findUnique({ where: { userId: user.id }, select: { handle: true, points: true, coBuilder: true } }),
      prisma.favorite.count({ where: { userId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
      prisma.follow.count({ where: { followeeId: user.id } }),
    ])
    const points = profile?.points ?? 0
    return success({
      loggedIn: true,
      unread,
      points,
      level: levelOf(points),
      coBuilder: !!profile?.coBuilder,
      handle: profile?.handle ?? null,
      favorites,
      following,
      followers,
    })
  } catch (err) {
    console.error('Me summary error:', err)
    return error('获取失败')
  }
}
