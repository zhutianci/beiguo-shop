export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { CATEGORY_SLUGS } from '@/lib/news/constants'
import { EVENT_SELECT, toEventDto } from '@/lib/news/format'

/**
 * 时间流分页。/news 首屏由 Server Component 直连 prisma 渲染（SEO + 首屏速度），
 * 这个接口只服务两件事：切分类、「加载更多」追加下一页——
 * 两者都要求在不整页刷新的前提下改列表，必须走客户端 fetch。
 *
 * 与首页热点的口径差异：时间流**包含** needsReview=true 的条目（照常发布，
 * 只是不进重点榜与首页），并在卡片上以「待复核」标注，见 SKILL.md §7。
 */

const PAGE_SIZE = 20

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(50).default(1),
  cat: z
    .string()
    .optional()
    .refine((v) => !v || (CATEGORY_SLUGS as string[]).includes(v), '分类不存在'),
})

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) {
    return error(parsed.error.errors[0]?.message || '参数错误')
  }
  const { page, cat } = parsed.data

  try {
    const where = { status: 'PUBLISHED', ...(cat ? { category: cat } : {}) }
    const [total, rows] = await Promise.all([
      prisma.newsEvent.count({ where }),
      prisma.newsEvent.findMany({
        where,
        select: EVENT_SELECT,
        // id 作为第二排序键：同一秒发生的多条事件在翻页时顺序稳定，不会重复或漏条
        orderBy: [{ happenedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ])

    return success({
      list: rows.map(toEventDto),
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    })
  } catch (e) {
    console.error('[news/list]', e)
    return error('获取列表失败', 500)
  }
}
