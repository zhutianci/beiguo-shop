export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { meOrDeny } from '@/lib/content/session'
import { cardsByIds } from '@/lib/content/queries'

// 我的收藏（收藏时间新到旧；已删除 / 下线的内容不再显示）
export async function GET(request: NextRequest) {
  const { user, denied } = await meOrDeny(request, false)
  if (denied) return denied
  try {
    const page = Math.max(parseInt(new URL(request.url).searchParams.get('page') || '1') || 1, 1)
    const favs = await prisma.favorite.findMany({ where: { userId: user!.id }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 30, take: 30 })
    return success({ list: await cardsByIds(favs.map((f) => f.postId)), page })
  } catch (err) {
    console.error('Me favorites error:', err)
    return error('获取失败')
  }
}
