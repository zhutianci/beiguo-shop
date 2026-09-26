export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { resolveActor } from '@/lib/forum'
import {
  forumLikeGate,
  anonLikeBlocked,
  anonLikeRelease,
  likeLockKey,
  acquireLikeLock,
  releaseLikeLock,
} from '@/lib/forum-throttle'
import { denyOnChannel } from '@/lib/storefront/resolve'

// 评论点赞 / 取消（切换）
// 审计 G44：匿名去重靠客户端自填的 x-anon-id，换一个值就能再 +1。现在匿名新增赞额外按
// 「IP + 目标」24h 限 1 次（取消后归还），并按身份串行化同一目标的切换，见 lib/forum-throttle
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const actor = await resolveActor(request)
    if (!actor.userId && !actor.anonId) return error('无法识别身份，请刷新后重试')

    const limited = forumLikeGate(request.headers, actor)
    if (limited) return error(limited, 429)

    const comment = await prisma.forumComment.findUnique({ where: { id }, select: { id: true } })
    if (!comment) return error('评论不存在', 404)

    const target = 'c' + id
    const lockKey = likeLockKey(actor, target)
    if (!acquireLikeLock(lockKey)) return error('操作过于频繁，请稍后再试', 429)
    try {
      const existing = await prisma.forumLike.findFirst({
        where: { commentId: id, ...(actor.userId ? { userId: actor.userId } : { anonId: actor.anonId }) },
      })

      let liked: boolean
      if (existing) {
        await prisma.forumLike.delete({ where: { id: existing.id } })
        await prisma.forumComment.update({ where: { id }, data: { likeCount: { decrement: 1 } } })
        if (!actor.userId) anonLikeRelease(request.headers, target)
        liked = false
      } else {
        if (!actor.userId && anonLikeBlocked(request.headers, target)) {
          return error('当前网络已有人赞过，登录后可继续点赞', 429)
        }
        try {
          await prisma.forumLike.create({
            data: { commentId: id, userId: actor.userId, anonId: actor.userId ? null : actor.anonId },
          })
        } catch (e) {
          // 没赞成就把名额还回去，否则这个 IP 24h 内都赞不了
          if (!actor.userId) anonLikeRelease(request.headers, target)
          throw e
        }
        await prisma.forumComment.update({ where: { id }, data: { likeCount: { increment: 1 } } })
        liked = true
      }

      const fresh = await prisma.forumComment.findUnique({ where: { id }, select: { likeCount: true } })
      return success({ liked, likeCount: Math.max(fresh?.likeCount ?? 0, 0) })
    } finally {
      releaseLikeLock(lockKey)
    }
  } catch (err) {
    console.error('Toggle comment like error:', err)
    return error('操作失败')
  }
}
