export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

const VALID_GAMES = ['snake', 'tetris', '2048']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params

    if (!VALID_GAMES.includes(gameId)) {
      return error('无效的游戏 ID')
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    // 取每个用户的最高分（仅未登录用户用 playerName 区分）
    const topScores = await prisma.gameScore.findMany({
      where: { gameId },
      orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
    })

    const list = topScores.map((s, i) => ({
      rank: i + 1,
      id: s.id,
      playerName: s.user?.nickname || s.playerName,
      isLoggedIn: !!s.userId,
      score: s.score,
      duration: s.duration,
      createdAt: s.createdAt,
    }))

    return success({ list, total: list.length })
  } catch (err) {
    console.error('Get leaderboard error:', err)
    return error('获取排行榜失败')
  }
}
