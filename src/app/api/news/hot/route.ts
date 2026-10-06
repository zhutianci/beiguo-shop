export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { hotNewsEvents } from '@/lib/news/hot'
import { denyOnChannel } from '@/lib/storefront/resolve'

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
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) {
    return error(parsed.error.errors[0]?.message || '参数错误')
  }
  const { limit } = parsed.data

  try {
    // 取数口径见 lib/news/hot.ts（首页服务端直出共用同一个函数）
    const list = await hotNewsEvents(limit)
    return success({ list })
  } catch (e) {
    console.error('[news/hot]', e)
    return error('获取热点失败', 500)
  }
}
