export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { announcementSchema, parseAnnouncementDate as parseDate } from '@/lib/announcement'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10'), 1), 50)

    const [list, total] = await Promise.all([
      prisma.announcement.findMany({
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.announcement.count(),
    ])

    return success({ list, total, page, pageSize, totalPages: Math.max(Math.ceil(total / pageSize), 1) })
  } catch (err) {
    console.error('Admin list announcements error:', err)
    return error('查询失败')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = announcementSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const startAt = parseDate(d.startAt)
    const endAt = parseDate(d.endAt)
    if (startAt === 'invalid' || endAt === 'invalid') return error('生效/失效时间格式不正确')
    if (startAt && endAt && startAt > endAt) return error('失效时间不能早于生效时间')

    const a = await prisma.announcement.create({
      data: {
        title: d.title,
        content: d.content,
        level: d.level,
        enabled: d.enabled,
        pinned: d.pinned,
        startAt,
        endAt,
      },
    })
    return success(a, '公告已发布')
  } catch (err) {
    console.error('Create announcement error:', err)
    return error('发布失败')
  }
}
