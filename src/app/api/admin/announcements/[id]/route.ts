export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { announcementSchema, parseAnnouncementDate as parseDate } from '@/lib/announcement'

// 同目录 route.ts 用的是旧式 params 签名，这里保持一致
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('公告无效')

    const exists = await prisma.announcement.findUnique({ where: { id }, select: { id: true } })
    if (!exists) return notFound('公告不存在')

    const body = await request.json()
    // partial：后台既有「完整编辑」也有列表里的快捷启停，两种都走这里
    const parsed = announcementSchema.partial().safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const startAt = 'startAt' in d ? parseDate(d.startAt) : undefined
    const endAt = 'endAt' in d ? parseDate(d.endAt) : undefined
    if (startAt === 'invalid' || endAt === 'invalid') return error('生效/失效时间格式不正确')
    if (startAt && endAt && startAt > endAt) return error('失效时间不能早于生效时间')

    const a = await prisma.announcement.update({
      where: { id },
      data: {
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.content !== undefined ? { content: d.content } : {}),
        ...(d.level !== undefined ? { level: d.level } : {}),
        ...(d.enabled !== undefined ? { enabled: d.enabled } : {}),
        ...(d.pinned !== undefined ? { pinned: d.pinned } : {}),
        ...(startAt !== undefined ? { startAt } : {}),
        ...(endAt !== undefined ? { endAt } : {}),
      },
    })
    return success(a, '已保存')
  } catch (err) {
    console.error('Update announcement error:', err)
    return error('保存失败')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('公告无效')
    await prisma.announcement.delete({ where: { id } })
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Delete announcement error:', err)
    return error('删除失败')
  }
}
