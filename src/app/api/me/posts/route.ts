export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { meOrDeny } from '@/lib/content/session'
import { contentPath } from '@/lib/content/policy'

// 我的投稿（含待审、驳回、隐藏的；不含已删除）
export async function GET(request: NextRequest) {
  const { user, denied } = await meOrDeny(request, false)
  if (denied) return denied
  try {
    const rows = await prisma.forumPost.findMany({
      where: { userId: user!.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { id: true, type: true, slug: true, title: true, reviewStatus: true, reviewNote: true, status: true, featured: true, likeCount: true, favoriteCount: true, copyCount: true, commentCount: true, createdAt: true },
    })
    return success({ list: rows.map((r) => ({ ...r, path: contentPath(r.type, r.id, r.slug) })) })
  } catch (err) {
    console.error('Me posts error:', err)
    return error('获取失败')
  }
}
