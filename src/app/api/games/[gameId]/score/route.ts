export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error } from '@/lib/api'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'
import { ipKey } from '@/lib/auth-throttle'
import { memberDisplayName } from '@/lib/forum'

const VALID_GAMES = ['snake', 'tetris', '2048']

const scoreSchema = z.object({
  score: z.number().int().min(0).max(99999999),
  playerName: z.string().min(1).max(20).optional(),
  // 只防 Prisma Int 溢出，不设业务上限：snake/tetris 的 startTimeRef 边界情况下 duration 可能很大，不能因此拒绝真实提交
  duration: z.number().int().min(0).max(2_147_483_647).optional(),
  // 前端只放 {lines,level} / {maxTile}，几十个字符，全站也没有地方读它。
  // 不设上限 = 匿名每行能塞 64KB 的 TEXT，循环提交就能把磁盘写满、连带打挂同机 MySQL（审计 G45）
  metadata: z.string().max(200).optional(),
})

// 正常提交 < 200 字节
const MAX_BODY_BYTES = 4096

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params

    if (!VALID_GAMES.includes(gameId)) {
      return error('无效的游戏 ID')
    }

    // 先限流、再读 body：nginx 放行 20MB 的 body，request.json() 会先把它整个 parse 一遍（审计 G45）。
    // IP 取 nginx 核实过的地址，IPv6 按 /64 聚合；拿不到时只剩全站总闸兜底
    const ip = clientIp(request.headers)
    if (
      (ip !== 'unknown' && rateLimited(`game-score-ip:${ipKey(ip)}`, { windowMs: 10 * 60_000, max: 60 })) ||
      // 全站总闸：换 IP 分布式刷时，保证每天最多新增约 17 万行，磁盘写不满。
      // 代价是被打时大家的排行榜提交会暂时失败——游戏不涉及交易，可以接受。
      // || 短路：单个 IP 超限时不会再消耗总闸的额度
      rateLimited('game-score-all:global', { windowMs: 60_000, max: 120 })
    ) {
      return error('提交太频繁了，歇一会儿再来', 429)
    }
    // nginx 默认 proxy_request_buffering on，转给上游时一定带 Content-Length，这里的检查可靠
    if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
      return error('请求过大', 413)
    }

    const body = await request.json().catch(() => null)
    const result = scoreSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    const user = await getCurrentUser()
    // 排行榜是公开的：会员没填名字时用论坛同款显示名（昵称或「会员+短码」），
    // 绝不回落到邮箱前缀——QQ 邮箱前缀就是 QQ 号（审计 G48 同类问题）
    const playerName =
      result.data.playerName?.trim() ||
      (user ? memberDisplayName(user.nickname, user.id) : '') ||
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
