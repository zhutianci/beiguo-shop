export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { eventSlug } from '@/lib/news/feed'
import { computeScore } from '@/lib/news/score'
import { recomputeEventAggregates } from '@/lib/news/pipeline'
import { EVENT_STATUS } from '@/lib/news/constants'

/**
 * 聚类判错时的补救（SKILL.md §9）。两种操作共用这个入口：
 *
 *   action='detach' 从事件移除信源：把选中条目的 eventId 置 null。
 *   action='split'  拆分事件：把选中条目移到一个新建事件。
 *
 * 为什么必须有：聚类错了，用户会在信源列表里看到明显不相关的原文，这是肉眼可见的质量事故。
 * 拆分更伤，所以新事件一律建成 DRAFT + composeState='RAW' + needsReview=true——
 * 摘要必须由 compose 段重新生成，绝不复制原文正文（§1.1 整段复制原文是红线）。
 *
 * 被移除的条目默认打成 triageState='SKIP'，否则下一轮 cluster 会把它重新聚回同一个事件，
 * 人工干预白做。确实想让它重新参与聚类时传 keepQueued=true。
 *
 * 聚合列一律调管线的 recomputeEventAggregates()，不在这里另写一份口径——
 * sourceCount「先按 urlHash 去重再数 distinct sourceId」这个算法只能有一个实现。
 *
 * 同目录上层 route.ts 用的是旧式 params 签名，这里保持一致。
 */

const bodySchema = z.object({
  action: z.enum(['split', 'detach']),
  itemIds: z.array(z.coerce.number().int().positive()).min(1, '请至少选择一条信源'),
  /** 拆分时新事件的标题；不传则取选中条目里最早那条的标题 */
  headline: z.string().trim().min(2).max(300).optional(),
  /** detach 时保留条目的分诊状态，允许它被重新聚类（默认打 SKIP，避免又聚回来） */
  keepQueued: z.boolean().optional(),
})

/** 生成不冲突的 slug（eventSlug = 日期 + 标题短哈希，同标题同日会撞） */
async function uniqueSlug(headline: string, happenedAt: Date): Promise<string> {
  const base = eventSlug(headline, happenedAt).slice(0, 80)
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`
    const hit = await prisma.newsEvent.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!hit) return candidate
  }
  return `${base}-${Date.now().toString(36)}`.slice(0, 90)
}

/**
 * 立刻重算热度分，不等下一轮 rank。
 * scoreDebug 的形状与 rank 段保持一致（{at, score, base, decay, parts}），后台两处读的是同一份结构。
 */
async function rescore(id: number): Promise<void> {
  const e = await prisma.newsEvent.findUnique({
    where: { id },
    select: {
      sourceCount: true,
      tier1Count: true,
      hnPoints: true,
      viewCount: true,
      shareCount: true,
      likeCount: true,
      aiScore: true,
      happenedAt: true,
    },
  })
  if (!e) return
  const bd = computeScore(e)
  await prisma.newsEvent.update({
    where: { id },
    data: { score: bd.score, scoreDebug: JSON.stringify({ at: new Date().toISOString(), ...bd }) },
  })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = parseInt(params.id)
    if (!eventId) return error('事件无效')

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const { action, itemIds, keepQueued } = parsed.data

    const ev = await prisma.newsEvent.findUnique({
      where: { id: eventId },
      select: { id: true, category: true },
    })
    if (!ev) return notFound('事件不存在')

    // 只允许操作确实挂在本事件下的条目，避免越权把别的事件的条目搬走
    const picked = await prisma.newsItem.findMany({
      where: { id: { in: itemIds }, eventId },
      select: { id: true, title: true, publishedAt: true, category: true },
    })
    if (picked.length !== itemIds.length) {
      return error('选中的条目里有不属于该事件的记录，请刷新后重试')
    }

    const earliest = [...picked].sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime())[0]
    const newHeadline = parsed.data.headline || earliest.title.slice(0, 300)
    const newHappenedAt = earliest.publishedAt
    // 新事件分类取选中条目里出现最多的那个，都没有就沿用原事件
    const catCount = new Map<string, number>()
    for (const it of picked) {
      if (it.category) catCount.set(it.category, (catCount.get(it.category) || 0) + 1)
    }
    const newCategory = Array.from(catCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || ev.category

    const slug = action === 'split' ? await uniqueSlug(newHeadline, newHappenedAt) : ''

    // 搬运本身放事务里：要么全搬走，要么一条都不动
    const newEventId = await prisma.$transaction(async (tx) => {
      if (action !== 'split') {
        await tx.newsItem.updateMany({
          where: { id: { in: itemIds }, eventId },
          // 打成 SKIP，否则下一轮 cluster 会把它重新聚回同一个事件
          data: { eventId: null, ...(keepQueued ? {} : { triageState: 'SKIP' }) },
        })
        return null
      }

      const created = await tx.newsEvent.create({
        data: {
          slug,
          headline: newHeadline,
          // 摘要留空等 compose 段重写：绝不把原文 description 直接搬进来当摘要
          summary: '',
          category: newCategory,
          status: EVENT_STATUS.DRAFT,
          composeState: 'RAW',
          needsReview: true,
          reviewNote: `由事件 #${eventId} 人工拆分，待重新生成摘要`,
          happenedAt: newHappenedAt,
          sourceCount: 0,
        },
        select: { id: true },
      })
      await tx.newsItem.updateMany({
        where: { id: { in: itemIds }, eventId },
        data: { eventId: created.id },
      })
      return created.id
    })

    // 聚合列与热度分：走管线的口径，事务外做，失败也不会把搬运回滚成半吊子
    const restCount = await prisma.newsItem.count({ where: { eventId } })
    if (restCount === 0) {
      // 信源被搬空的事件不能继续挂在前台，但也不物理删除——要保留证据
      await prisma.newsEvent.update({
        where: { id: eventId },
        data: {
          sourceCount: 0,
          tier1Count: 0,
          hnPoints: 0,
          score: 0,
          scoreDebug: null,
          status: EVENT_STATUS.UNLISTED,
          reviewNote: '信源已全部移出，自动下线',
        },
      })
    } else {
      await recomputeEventAggregates(eventId)
      await rescore(eventId)
    }

    if (newEventId) {
      await recomputeEventAggregates(newEventId)
      await rescore(newEventId)
    }

    // compose 只处理 happenedAt 在 7 天内的事件，拆分老事件会得到一个永远补不上摘要的草稿
    const ageDays = (Date.now() - newHappenedAt.getTime()) / 86400000
    const staleHint =
      action === 'split' && ageDays > 7
        ? `⚠ 该事件最早信源已是 ${Math.floor(ageDays)} 天前，超出 compose 段 7 天的处理窗口，摘要不会自动补上，需要手工填写后再发布。`
        : ''

    return success(
      { newEventId, movedItems: picked.length, restItems: restCount },
      action === 'split'
        ? `已拆出新事件 #${newEventId}（草稿，摘要与标题会由 compose 段重新生成后自动发布）${staleHint}`
        : `已从事件移除 ${picked.length} 条信源${keepQueued ? '' : '，并标记为不再参与聚类'}`
    )
  } catch (err) {
    console.error('Split news event error:', err)
    return error('操作失败')
  }
}
