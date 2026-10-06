export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { meOrDeny } from '@/lib/content/session'

// 我的站内通知（新到旧，每页 30）
export async function GET(request: NextRequest) {
  const { user, denied } = await meOrDeny(request, false)
  if (denied) return denied
  try {
    const page = Math.max(parseInt(new URL(request.url).searchParams.get('page') || '1') || 1, 1)
    const [list, unread, total] = await Promise.all([
      prisma.notification.findMany({ where: { userId: user!.id }, orderBy: { id: 'desc' }, skip: (page - 1) * 30, take: 30 }),
      prisma.notification.count({ where: { userId: user!.id, readAt: null } }),
      prisma.notification.count({ where: { userId: user!.id } }),
    ])
    return success({ list, unread, total, page, totalPages: Math.max(Math.ceil(total / 30), 1) })
  } catch (err) {
    console.error('Notifications error:', err)
    return error('获取失败')
  }
}
