export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { CATEGORY_SLUGS, EVENT_STATUS, TAG_WHITELIST } from '@/lib/news/constants'

/**
 * 【AI圈大事记】事件管理：列表检索 + 单条编辑。
 * 规范见 .claude/skills/ai-news-pipeline/SKILL.md §9。
 *
 * 下线一律用 status='UNLISTED'，**不做物理删除**——出侵权投诉时要拿得出原始记录做证据。
 * 全站是全自动发布，待复核队列是唯一的人工闸口，所以列表里必须能一眼筛出 needsReview。
 */

const STATUSES = Object.values(EVENT_STATUS) as string[]
const MAX_TAGS = 8

/** 标签只能取自白名单：允许自由造词会在三个月内长出几千个只有 1 条内容的话题页 */
function normalizeTags(input: string | string[]): { ok: true; value: string } | { ok: false; msg: string } {
  const raw = Array.isArray(input) ? input : input.split(/[,，]/)
  const list = Array.from(new Set(raw.map((t) => t.trim()).filter(Boolean)))
  if (list.length > MAX_TAGS) return { ok: false, msg: `标签最多 ${MAX_TAGS} 个` }
  const bad = list.filter((t) => !(TAG_WHITELIST as readonly string[]).includes(t))
  if (bad.length) return { ok: false, msg: `标签不在白名单内：${bad.join('、')}` }
  const value = list.join(',')
  if (value.length > 300) return { ok: false, msg: '标签总长度超出 300 字符' }
  return { ok: true, value }
}

// ---------- GET 列表 ----------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = (searchParams.get('keyword') || '').trim()
    const status = (searchParams.get('status') || '').trim()
    const category = (searchParams.get('category') || '').trim()
    const review = (searchParams.get('review') || '').trim() // '1' 只看待复核 | '0' 只看已复核
    const sort = searchParams.get('sort') === 'score' ? 'score' : 'time'
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20') || 20, 1), 100)

    const where: Prisma.NewsEventWhereInput = {}
    if (STATUSES.includes(status)) where.status = status
    if (CATEGORY_SLUGS.includes(category as never)) where.category = category
    if (review === '1') where.needsReview = true
    if (review === '0') where.needsReview = false
    if (keyword) {
      where.OR = [
        { headline: { contains: keyword } },
        { summary: { contains: keyword } },
        { tags: { contains: keyword } },
      ]
    }

    const orderBy: Prisma.NewsEventOrderByWithRelationInput[] =
      sort === 'score'
        ? [{ score: 'desc' }, { happenedAt: 'desc' }]
        : [{ happenedAt: 'desc' }, { id: 'desc' }]

    const [rows, total, pendingReview, capSetting] = await Promise.all([
      prisma.newsEvent.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          headline: true,
          category: true,
          tags: true,
          aiScore: true,
          score: true,
          sourceCount: true,
          tier1Count: true,
          status: true,
          needsReview: true,
          reviewNote: true,
          reviewedAt: true,
          pinned: true,
          composeState: true,
          happenedAt: true,
          publishedAt: true,
          updatedAt: true,
        },
      }),
      prisma.newsEvent.count({ where }),
      prisma.newsEvent.count({ where: { needsReview: true } }),
      // 待审队列上限：堆到三位数管理员就会放弃审核，这是所有人工审核机制的真实死法
      prisma.setting.findUnique({ where: { key: 'news_pending_cap' }, select: { value: true } }),
    ])

    return success({
      list: rows.map((r) => ({
        ...r,
        score: Number(r.score),
        tags: r.tags ? r.tags.split(',').filter(Boolean) : [],
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      stats: {
        pendingReview,
        pendingCap: Number(capSetting?.value || 20) || 20,
      },
    })
  } catch (err) {
    console.error('List news events error:', err)
    return error('获取事件列表失败')
  }
}

// ---------- PATCH 单条编辑 ----------

const patchSchema = z.object({
  id: z.coerce.number().int().positive(),
  headline: z.string().trim().min(2, '标题至少 2 个字').max(300, '标题最多 300 字').optional(),
  summary: z.string().trim().max(4000, '摘要过长').optional(),
  whyItMatters: z.string().trim().max(300, '推荐理由最多 300 字').nullable().optional(),
  category: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.string().optional(),
  pinned: z.boolean().optional(),
  /** true = 标记已复核（needsReview=false + reviewedAt） */
  reviewed: z.boolean().optional(),
  reviewNote: z.string().trim().max(300, '复核备注最多 300 字').nullable().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const current = await prisma.newsEvent.findUnique({
      where: { id: d.id },
      select: { id: true, status: true, publishedAt: true },
    })
    if (!current) return notFound('事件不存在')

    if (d.category !== undefined && !CATEGORY_SLUGS.includes(d.category as never)) {
      return error(`分类不合法，只能是：${CATEGORY_SLUGS.join(' / ')}`)
    }
    if (d.status !== undefined && !STATUSES.includes(d.status)) {
      return error(`状态不合法，只能是：${STATUSES.join(' / ')}`)
    }

    let tags: string | undefined
    if (d.tags !== undefined) {
      const t = normalizeTags(d.tags)
      if (!t.ok) return error(t.msg)
      tags = t.value
    }

    const data: Prisma.NewsEventUpdateInput = {
      ...(d.headline !== undefined ? { headline: d.headline } : {}),
      ...(d.summary !== undefined ? { summary: d.summary } : {}),
      ...(d.whyItMatters !== undefined ? { whyItMatters: d.whyItMatters || null } : {}),
      ...(d.category !== undefined ? { category: d.category } : {}),
      ...(tags !== undefined ? { tags: tags || null } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.pinned !== undefined ? { pinned: d.pinned } : {}),
      ...(d.reviewNote !== undefined ? { reviewNote: d.reviewNote || null } : {}),
    }

    // 标记已复核：needsReview 归位并记录复核时间；reviewed=false 则重新打回待复核
    if (d.reviewed === true) {
      data.needsReview = false
      data.reviewedAt = new Date()
    } else if (d.reviewed === false) {
      data.needsReview = true
      data.reviewedAt = null
    }

    // 首次转为已发布时补 publishedAt（时间轴与前台排序依赖它）
    if (d.status === EVENT_STATUS.PUBLISHED && !current.publishedAt) {
      data.publishedAt = new Date()
    }

    const updated = await prisma.newsEvent.update({ where: { id: d.id }, data })

    return success(
      {
        id: updated.id,
        status: updated.status,
        needsReview: updated.needsReview,
        pinned: updated.pinned,
      },
      d.status === EVENT_STATUS.UNLISTED ? '已下线（记录保留，未删除）' : '已保存'
    )
  } catch (err) {
    console.error('Update news event error:', err)
    return error('保存失败')
  }
}
