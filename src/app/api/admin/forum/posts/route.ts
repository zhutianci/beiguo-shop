export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

// 后台帖子列表（含隐藏帖，用于审核管理）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '30'), 100)
    const keyword = searchParams.get('keyword')?.trim()
    const status = searchParams.get('status') // '0' | '1' | null(全部)

    const where: any = {}
    if (status === '0' || status === '1') where.status = parseInt(status)
    if (keyword) where.OR = [{ title: { contains: keyword } }, { authorName: { contains: keyword } }]

    const [rows, total] = await Promise.all([
      prisma.forumPost.findMany({
        where,
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: { select: { name: true, icon: true } } },
      }),
      prisma.forumPost.count({ where }),
    ])

    const list = rows.map((p) => ({
      id: p.id,
      title: p.title,
      authorName: p.authorName,
      isMember: !!p.userId,
      category: p.category,
      pinned: p.pinned,
      featured: p.featured,
      locked: p.locked,
      status: p.status,
      views: p.views,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      createdAt: p.createdAt,
    }))

    return success({ list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    console.error('Admin list posts error:', err)
    return error('获取失败')
  }
}
