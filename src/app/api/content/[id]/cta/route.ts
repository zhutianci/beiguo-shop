export const dynamic = 'force-dynamic'

import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'
import { ipKey } from '@/lib/auth-throttle'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { forumCrossSite } from '@/lib/forum-server'
import { PUBLIC_WHERE } from '@/lib/content/queries'

/**
 * 内容「带来访问」计数（P3，设计 §13.1 / §13.2 分析一行）：读者从内容页的 CTA 点到落地页时，落地页回报一次。
 * 与「复制」同一套去重（content_events 唯一约束，同一访客同一内容同一天只计一次）。只记事件，不改内容表：
 * 这是给站长和作者看「哪篇内容带来了转化入口的点击」的，不进热门排序（否则会被刷）。
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  const crossSite = forumCrossSite(request.headers)
  if (crossSite) return crossSite
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const user = await getCurrentUser().catch(() => null)
    const viewerKey = user ? `u:${user.id}` : `ip:${crypto.createHash('sha256').update(ipKey(clientIp(request.headers))).digest('hex').slice(0, 40)}`
    if (rateLimited(`content-cta:${viewerKey}`, { windowMs: 10 * 60 * 1000, max: 30 })) return error('操作过于频繁', 429)
    const post = await prisma.forumPost.findFirst({ where: { id, ...PUBLIC_WHERE }, select: { id: true } })
    if (!post) return error('内容不存在', 404)
    const day = Number(new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10).replace(/-/g, ''))
    try {
      await prisma.contentEvent.create({ data: { postId: id, kind: 'CTA', viewerKey, day } })
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e
    }
    return success({ ok: true })
  } catch (err) {
    console.error('Content cta count error:', err)
    return error('计数失败')
  }
}
