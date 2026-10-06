export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { meOrDeny } from '@/lib/content/session'
import { memberDisplayName } from '@/lib/forum'

// 我关注的作者，以及关注的合集（P3）
export async function GET(request: NextRequest) {
  const { user, denied } = await meOrDeny(request, false)
  if (denied) return denied
  try {
    const rows = await prisma.follow.findMany({ where: { followerId: user!.id }, orderBy: { createdAt: 'desc' }, take: 200 })
    const ids = rows.map((r) => r.followeeId)
    const [users, profiles] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, nickname: true } }),
      prisma.creatorProfile.findMany({ where: { userId: { in: ids } }, select: { userId: true, handle: true, points: true } }),
    ])
    const list = ids
      .map((id) => {
        const u = users.find((x) => x.id === id)
        const pf = profiles.find((x) => x.userId === id)
        return u && pf ? { name: memberDisplayName(u.nickname, u.id), handle: pf.handle, points: pf.points } : null
      })
      .filter(Boolean)
    const cf = await prisma.collectionFollow.findMany({ where: { userId: user!.id }, orderBy: { createdAt: 'desc' }, take: 200, select: { collectionId: true } })
    const cols = cf.length
      ? await prisma.collection.findMany({ where: { id: { in: cf.map((c) => c.collectionId) }, isPublic: true }, select: { id: true, title: true, updatedAt: true, _count: { select: { items: true } } } })
      : []
    return success({ list, collections: cols.map((c) => ({ id: c.id, title: c.title, count: c._count.items, updatedAt: c.updatedAt })) })
  } catch (err) {
    console.error('Me following error:', err)
    return error('获取失败')
  }
}
