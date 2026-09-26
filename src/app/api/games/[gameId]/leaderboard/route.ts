export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { memberDisplayName } from '@/lib/forum'
import { denyOnChannel } from '@/lib/storefront/resolve'

const VALID_GAMES = ['snake', 'tetris', '2048']

/**
 * 公开排行榜上的名字。以前会员没设昵称、提交时也没填名字，库里存的就是邮箱 @ 前面那段，
 * 原样公开等于挂出 QQ 号（审计 G48 同类问题）。存量不改库，读取时认出来换成「会员+短码」；
 * 玩家自己填的名字原样保留。
 */
function publicPlayerName(s: {
  userId: number | null
  playerName: string
  user: { nickname: string | null; email: string | null } | null
}): string {
  if (!s.userId) return s.playerName
  if (s.user?.nickname) return memberDisplayName(s.user.nickname, s.userId)
  const prefix = s.user?.email ? s.user.email.split('@')[0].slice(0, 50).toLowerCase() : ''
  if (s.playerName.includes('@') || (prefix && s.playerName.toLowerCase() === prefix)) {
    return memberDisplayName(null, s.userId)
  }
  return s.playerName
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
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
      playerName: publicPlayerName(s),
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
