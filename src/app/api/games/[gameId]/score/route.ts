export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error } from '@/lib/api'

const VALID_GAMES = ['snake', 'tetris', '2048']

const scoreSchema = z.object({
  score: z.number().int().min(0).max(99999999),
  playerName: z.string().min(1).max(20).optional(),
  duration: z.number().int().min(0).optional(),
  metadata: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params

    if (!VALID_GAMES.includes(gameId)) {
      return error('无效的游戏 ID')
    }

    const body = await request.json()
    const result = scoreSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    const user = await getCurrentUser()
    const playerName =
      result.data.playerName?.trim() ||
      user?.nickname ||
      user?.email?.split('@')[0] ||
      '匿名玩家'

    const record = await prisma.gameScore.create({
      data: {
        gameId,
        userId: user?.id,
        playerName,
        score: result.data.score,
        duration: result.data.duration,
        metadata: result.data.metadata,
      },
    })

    // 计算排名
    const betterCount = await prisma.gameScore.count({
      where: { gameId, score: { gt: result.data.score } },
    })

    return success({
      id: record.id,
      rank: betterCount + 1,
    }, '分数已提交')
  } catch (err) {
    console.error('Submit score error:', err)
    return error('提交分数失败')
  }
}
