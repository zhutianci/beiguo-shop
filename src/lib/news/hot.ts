import { prisma } from '@/lib/db'
import { EVENT_SELECT, hoursAgo, toEventDto, type NewsEventDto } from '@/lib/news/format'

/**
 * 首页「AI 圈今日热点」的取数（/api/news/hot 与首页服务端直出共用一份，SEO 批 2 的 C 包；口径原样搬自 api/news/hot）。
 *
 * 只出 status=PUBLISHED 且 needsReview=false 的事件——待复核条目仍在时间流里可见，但不进首页热点位与重点榜（SKILL.md §7）。
 * 先取近 72 小时的热度榜；冷启动或低更新期不足数时，放开时间窗兜底（热度分本身带 36 小时半衰期，放开时间窗不会让陈年条目顶上来）。
 * 渠道站的拦截在调用方（接口 denyOnChannel、首页只在主站调用）。
 */
export async function hotNewsEvents(limit: number): Promise<NewsEventDto[]> {
  const where = { status: 'PUBLISHED', needsReview: false }
  const orderBy = [{ pinned: 'desc' as const }, { score: 'desc' as const }]
  let rows = await prisma.newsEvent.findMany({ where: { ...where, happenedAt: { gte: hoursAgo(72) } }, select: EVENT_SELECT, orderBy, take: limit })
  if (rows.length < limit) rows = await prisma.newsEvent.findMany({ where, select: EVENT_SELECT, orderBy, take: limit })
  return rows.map(toEventDto)
}
