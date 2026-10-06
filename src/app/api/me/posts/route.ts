export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { meOrDeny } from '@/lib/content/session'
import { paidOrdersByPost } from '@/lib/content/attribution'
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
    // 「带来访问」（P3）：读者从这篇的开通入口点到落地页的人次（按访客每天去重）
    const cta = rows.length
      ? await prisma.contentEvent.groupBy({ by: ['postId'], where: { kind: 'CTA', postId: { in: rows.map((r) => r.id) } }, _count: { _all: true } })
      : []
    const cm = new Map(cta.map((c) => [c.postId, c._count._all]))
    const om = await paidOrdersByPost(rows.map((r) => r.id))
    return success({ list: rows.map((r) => ({ ...r, path: contentPath(r.type, r.id, r.slug), ctaVisits: cm.get(r.id) ?? 0, ctaOrders: om.get(r.id) ?? 0 })) })
  } catch (err) {
    console.error('Me posts error:', err)
    return error('获取失败')
  }
}
