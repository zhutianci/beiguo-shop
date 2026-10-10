export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { denyUnlessModule } from '@/lib/storefront/resolve'
import { meOrDeny } from '@/lib/content/session'
import { PUBLIC_WHERE } from '@/lib/content/queries'
import { award } from '@/lib/content/points'
import { favoriteAwardAllowed } from '@/lib/content/anti-farm'
import { rateLimited } from '@/lib/news/rate-limit'

// 收藏 / 取消收藏（切换）。收藏数按口径重数；被收藏给作者 +2 积分（同一收藏者对同一篇只算一次，取消再收藏不重复加）
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const channelDenied = await denyUnlessModule('learn')
  if (channelDenied) return channelDenied
  const { user, denied } = await meOrDeny(request, true)
  if (denied) return denied
  try {
    const id = parseInt(params.id)
    if (!id) return error('内容不存在', 404)
    // 每次切换都要重数收藏数并回写：每人 10 分钟 60 次，正常收藏用不完
    if (rateLimited(`fav:${user!.id}`, { windowMs: 600_000, max: 60 })) return error('操作过于频繁，请稍后再试', 429)
    const post = await prisma.forumPost.findFirst({ where: { id, ...PUBLIC_WHERE }, select: { id: true, userId: true } })
    if (!post) return error('内容不存在', 404)
    const key = { userId_postId: { userId: user!.id, postId: id } }
    let favorited: boolean
    if (await prisma.favorite.findUnique({ where: key })) {
      await prisma.favorite.delete({ where: key })
      favorited = false
    } else {
      try {
        await prisma.favorite.create({ data: { userId: user!.id, postId: id } })
      } catch (e) {
        if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e
      }
      favorited = true
      // 给作者加分前过防刷闸门（收藏者满 3 天、作者每天上限，lib/content/anti-farm）；收藏本身照常
      if (post.userId && post.userId !== user!.id) {
        const authorId = post.userId
        void favoriteAwardAllowed(authorId, user!.id)
          .then((ok) => (ok ? award(authorId, 'FAVORITED', id, user!.id) : false))
          .catch((e) => console.error('[favorite award]', e))
      }
    }
    const favoriteCount = await prisma.favorite.count({ where: { postId: id } })
    await prisma.forumPost.update({ where: { id }, data: { favoriteCount } })
    return success({ favorited, favoriteCount })
  } catch (err) {
    console.error('Favorite error:', err)
    return error('操作失败')
  }
}
