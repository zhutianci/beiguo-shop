export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { meOrDeny } from '@/lib/content/session'
import { PUBLIC_WHERE } from '@/lib/content/queries'
import { award } from '@/lib/content/points'

// 收藏 / 取消收藏（切换）。收藏数按口径重数；被收藏给作者 +2 积分（同一收藏者对同一篇只算一次，取消再收藏不重复加）
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  const { user, denied } = await meOrDeny(request, true)
  if (denied) return denied
  try {
    const id = parseInt(params.id)
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
      if (post.userId !== user!.id) void award(post.userId, 'FAVORITED', id, user!.id)
    }
    const favoriteCount = await prisma.favorite.count({ where: { postId: id } })
    await prisma.forumPost.update({ where: { id }, data: { favoriteCount } })
    return success({ favorited, favoriteCount })
  } catch (err) {
    console.error('Favorite error:', err)
    return error('操作失败')
  }
}
