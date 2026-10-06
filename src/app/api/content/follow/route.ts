export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { meOrDeny } from '@/lib/content/session'
import { isHandle } from '@/lib/content/creator'

// 关注作者（按作者主页短码，不暴露 userId）。GET ?handle= 查状态与粉丝数；POST {handle} 切换
async function target(handle: string | null) {
  if (!handle || !isHandle(handle)) return null
  return prisma.creatorProfile.findUnique({ where: { handle }, select: { userId: true } })
}

export async function GET(request: NextRequest) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  const t = await target(new URL(request.url).searchParams.get('handle'))
  if (!t) return error('作者不存在', 404)
  const me = await getCurrentUser().catch(() => null)
  const [followers, mine] = await Promise.all([
    prisma.follow.count({ where: { followeeId: t.userId } }),
    me ? prisma.follow.findUnique({ where: { followerId_followeeId: { followerId: me.id, followeeId: t.userId } } }) : null,
  ])
  return success({ following: !!mine, followers, isSelf: me?.id === t.userId })
}

export async function POST(request: NextRequest) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  const { user, denied } = await meOrDeny(request, true)
  if (denied) return denied
  try {
    const parsed = z.object({ handle: z.string() }).safeParse(await request.json())
    const t = parsed.success ? await target(parsed.data.handle) : null
    if (!t) return error('作者不存在', 404)
    if (t.userId === user!.id) return error('不能关注自己')
    const key = { followerId_followeeId: { followerId: user!.id, followeeId: t.userId } }
    const exists = await prisma.follow.findUnique({ where: key })
    if (exists) await prisma.follow.delete({ where: key })
    else await prisma.follow.create({ data: { followerId: user!.id, followeeId: t.userId } }).catch(() => {})
    const followers = await prisma.follow.count({ where: { followeeId: t.userId } })
    return success({ following: !exists, followers })
  } catch (err) {
    console.error('Follow error:', err)
    return error('操作失败')
  }
}
