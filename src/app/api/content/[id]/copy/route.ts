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
 * 提示词「复制」计数（内容平台 P1，设计 §7.1）。
 *
 * 同一访客、同一条提示词、同一天只计一次：靠 content_events 的唯一约束（插入冲突 = 今天已计过），
 * 不靠先查后写。访客身份：登录用户按 id；未登录按 IP（IPv6 按 /64 聚合，取哈希，不在库里存明文 IP）。
 * 复制计数将来要进热门排序与作者积分（P2），所以这里宁可少计，不能被刷。
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
    const viewerKey = user
      ? `u:${user.id}`
      : `ip:${crypto.createHash('sha256').update(ipKey(clientIp(request.headers))).digest('hex').slice(0, 40)}`
    if (rateLimited(`content-copy:${viewerKey}`, { windowMs: 10 * 60 * 1000, max: 60 })) return error('操作过于频繁', 429)

    const post = await prisma.forumPost.findFirst({ where: { id, type: 'PROMPT', ...PUBLIC_WHERE }, select: { id: true } })
    if (!post) return error('内容不存在', 404)

    // 上海时间的日期：YYYYMMDD
    const day = Number(new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10).replace(/-/g, ''))
    let counted = false
    try {
      await prisma.contentEvent.create({ data: { postId: id, kind: 'COPY', viewerKey, day } })
      counted = true
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e
    }
    const row = counted
      ? await prisma.forumPost.update({ where: { id }, data: { copyCount: { increment: 1 } }, select: { copyCount: true } })
      : await prisma.forumPost.findUnique({ where: { id }, select: { copyCount: true } })
    return success({ copyCount: row?.copyCount ?? 0, counted })
  } catch (err) {
    console.error('Content copy count error:', err)
    return error('计数失败')
  }
}
