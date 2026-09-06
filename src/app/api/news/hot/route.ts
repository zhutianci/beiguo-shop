export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { EVENT_SELECT, hoursAgo, toEventDto } from '@/lib/news/format'

/**
 * 首页「AI 圈今日热点」区块用的公开读接口。
 *
 * 只有首页需要走 HTTP（首页是 'use client'）；/news 与 /news/[slug] 是 Server Component，
 * 直接用 prisma 查库，不绕这里。
 *
 * 口径：只出 status=PUBLISHED 且 needsReview=false 的事件——
 * 待复核条目仍在时间流里可见，但不进首页热点位与重点榜（SKILL.md §7）。
 */

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(5),
})

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) {
    return error(parsed.error.errors[0]?.message || '参数错误')
  }
  const { limit } = parsed.data

  try {
    const where = { status: 'PUBLISHED', needsReview: false }
    const orderBy = [{ pinned: 'desc' as const }, { score: 'desc' as const }]

    // 先取近 72 小时的热度榜；冷启动或低更新期不足数时，放开时间窗兜底。
    // 热度分本身带 36 小时半衰期，放开时间窗不会让陈年条目顶上来。
    let rows = await prisma.newsEvent.findMany({
      where: { ...where, happenedAt: { gte: hoursAgo(72) } },
      select: EVENT_SELECT,
      orderBy,
      take: limit,
    })

    if (rows.length < limit) {
      rows = await prisma.newsEvent.findMany({
        where,
        select: EVENT_SELECT,
        orderBy,
        take: limit,
      })
    }

    return success({ list: rows.map(toEventDto) })
  } catch (e) {
    console.error('[news/hot]', e)
    return error('获取热点失败', 500)
  }
}
