export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { meOrDeny } from '@/lib/content/session'

// 关注合集（P3，设计 §7.5）：合集新增内容时收到站内通知。GET ?id= 查状态与关注数；POST {collectionId} 切换。
// 只能关注公开合集；不能关注自己的合集。
async function target(id: number) {
  if (!Number.isInteger(id) || id <= 0) return null
  return prisma.collection.findFirst({ where: { id, isPublic: true }, select: { id: true, userId: true } })
}

export async function GET(request: NextRequest) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  const t = await target(Number(new URL(request.url).searchParams.get('id')))
  if (!t) return error('合集不存在', 404)
  const me = await getCurrentUser().catch(() => null)
  const [followers, mine] = await Promise.all([
    prisma.collectionFollow.count({ where: { collectionId: t.id } }),
    me ? prisma.collectionFollow.findUnique({ where: { userId_collectionId: { userId: me.id, collectionId: t.id } } }) : null,
  ])
  return success({ following: !!mine, followers, isSelf: me?.id === t.userId })
}

export async function POST(request: NextRequest) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  const { user, denied } = await meOrDeny(request, true)
  if (denied) return denied
  try {
    const parsed = z.object({ collectionId: z.number().int().positive() }).safeParse(await request.json())
    const t = parsed.success ? await target(parsed.data.collectionId) : null
    if (!t) return error('合集不存在', 404)
    if (t.userId === user!.id) return error('不能关注自己的合集')
    const key = { userId_collectionId: { userId: user!.id, collectionId: t.id } }
    const exists = await prisma.collectionFollow.findUnique({ where: key })
    if (exists) await prisma.collectionFollow.delete({ where: key })
    else {
      if ((await prisma.collectionFollow.count({ where: { userId: user!.id } })) >= 500) return error('最多关注 500 个合集')
      await prisma.collectionFollow.create({ data: { userId: user!.id, collectionId: t.id } }).catch(() => {})
    }
    const followers = await prisma.collectionFollow.count({ where: { collectionId: t.id } })
    return success({ following: !exists, followers })
  } catch (err) {
    console.error('Collection follow error:', err)
    return error('操作失败')
  }
}
