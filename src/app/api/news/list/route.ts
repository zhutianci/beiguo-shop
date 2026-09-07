export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { CATEGORY_SLUGS } from '@/lib/news/constants'
import { ARCHIVE_MONTH_RE, EVENT_SELECT, NEWS_PAGE_SIZE, monthEndUtc, monthStartUtc, toEventDto } from '@/lib/news/format'

/**
 * 时间流分页。/news 首屏由 Server Component 直连 prisma 渲染（SEO + 首屏速度），
 * 这个接口只服务两件事：切分类、「加载更多」追加下一页——
 * 两者都要求在不整页刷新的前提下改列表，必须走客户端 fetch。
 *
 * 与首页热点的口径差异：时间流**包含** needsReview=true 的条目（照常发布，
 * 只是不进重点榜与首页），并在卡片上以「待复核」标注，见 SKILL.md §7。
 */

/** 页大小收敛在 lib/news/format.ts —— 首屏直出与这里必须同一个数，理由见那边的注释 */
const PAGE_SIZE = NEWS_PAGE_SIZE

const querySchema = z.object({
  // 上限从 50 提到 500：去掉 compose 的 7 天窗口后内容会持续累积，
  // 50 页 × 20 条 = 1000 条曾经够用，一年下来不够。offset 分页在几千行量级仍然可接受
  // （MySQL 只是多扫几页索引），真到需要游标的规模再换，不为还没发生的问题加复杂度。
  page: z.coerce.number().int().min(1).max(500).default(1),
  cat: z
    .string()
    .optional()
    .refine((v) => !v || (CATEGORY_SLUGS as string[]).includes(v), '分类不存在'),
  /** 归档页用：YYYY-MM，只出这个月的条目 */
  month: z
    .string()
    .optional()
    .refine((v) => !v || ARCHIVE_MONTH_RE.test(v), '月份格式应为 YYYY-MM'),
  /** 归档页按重要度排（baseScore），时间流按时间排。默认时间 */
  sort: z.enum(['time', 'score']).default('time'),
})

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) {
    return error(parsed.error.errors[0]?.message || '参数错误')
  }
  const { page, cat, month, sort } = parsed.data

  try {
    const where = {
      status: 'PUBLISHED',
      ...(cat ? { category: cat } : {}),
      ...(month ? { happenedAt: { gte: monthStartUtc(month), lt: monthEndUtc(month) } } : {}),
    }
    // id 作为最后一个排序键：同一秒/同分的多条事件在翻页时顺序稳定，不会重复或漏条
    const orderBy =
      sort === 'score'
        ? ([{ baseScore: 'desc' }, { happenedAt: 'desc' }, { id: 'desc' }] as const)
        : ([{ happenedAt: 'desc' }, { id: 'desc' }] as const)

    const [total, rows] = await Promise.all([
      prisma.newsEvent.count({ where }),
      prisma.newsEvent.findMany({
        where,
        select: EVENT_SELECT,
        orderBy: [...orderBy],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ])

    // 【返回体一个字段都不能减】news-stream.tsx 用 totalPages 决定「加载更多」按钮是否显示、
    // 用 total 渲染「共 N 条」。买家浏览器里跑的是上一版缓存的 JS，
    // 少一个字段就会出现「按钮消失」或「共 0 条」，而且服务端日志里什么都看不到。
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
