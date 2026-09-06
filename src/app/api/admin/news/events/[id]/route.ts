export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { computeScore } from '@/lib/news/score'

/**
 * 事件详情：事件本体 + 它的全部原始信源条目 + 热度分明细。
 *
 * 「这条为什么排第一」必须能在后台答出来，所以除了落库的 scoreDebug，
 * 这里还用当前计数实时重算一份 breakdown——两者不一致就说明 rank 段没跑或数据被手工改过。
 *
 * items 按 id 升序返回，与 compose 段读取 event.items 的顺序一致，
 * 前端用这个序号对应 facts[].sourceIndex，人工一键跳转复核。
 *
 * 同目录父级 route.ts 用的是旧式 params 签名，这里保持一致。
 */

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('事件无效')

    const ev = await prisma.newsEvent.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { id: 'asc' },
          select: {
            id: true,
            sourceId: true,
            title: true,
            url: true,
            urlHash: true,
            summaryRaw: true,
            author: true,
            publishedAt: true,
            fetchedAt: true,
            triageState: true,
            blocked: true,
            blockReason: true,
            category: true,
            entities: true,
            confidence: true,
            points: true,
            comments: true,
            source: { select: { id: true, key: true, name: true, tier: true, role: true, kind: true, lang: true } },
          },
        },
      },
    })
    if (!ev) return notFound('事件不存在')

    // 实时重算：与落库的 scoreDebug 对照，能看出 rank 段是否跑过
    const live = computeScore({
      sourceCount: ev.sourceCount,
      tier1Count: ev.tier1Count,
      hnPoints: ev.hnPoints,
      viewCount: ev.viewCount,
      shareCount: ev.shareCount,
      likeCount: ev.likeCount,
      aiScore: ev.aiScore,
      happenedAt: ev.happenedAt,
    })

    return success({
      event: {
        id: ev.id,
        slug: ev.slug,
        headline: ev.headline,
        summary: ev.summary,
        whyItMatters: ev.whyItMatters,
        facts: parseJson<{ text: string; sourceIndex: number }[]>(ev.facts, []),
        category: ev.category,
        tags: ev.tags ? ev.tags.split(',').filter(Boolean) : [],
        aiScore: ev.aiScore,
        score: Number(ev.score),
        sourceCount: ev.sourceCount,
        tier1Count: ev.tier1Count,
        hnPoints: ev.hnPoints,
        viewCount: ev.viewCount,
        shareCount: ev.shareCount,
        likeCount: ev.likeCount,
        status: ev.status,
        needsReview: ev.needsReview,
        reviewNote: ev.reviewNote,
        reviewedAt: ev.reviewedAt,
        pinned: ev.pinned,
        composeState: ev.composeState,
        rewriteCount: ev.rewriteCount,
        happenedAt: ev.happenedAt,
        publishedAt: ev.publishedAt,
        createdAt: ev.createdAt,
        updatedAt: ev.updatedAt,
      },
      // 落库明细（rank 段写入）
      scoreDebug: parseJson<Record<string, unknown> | null>(ev.scoreDebug, null),
      // 实时明细（用当前计数重算）
      scoreLive: live,
      items: ev.items.map((it, idx) => ({
        index: idx, // 与 facts[].sourceIndex 对齐
        id: it.id,
        title: it.title,
        url: it.url,
        urlHash: it.urlHash,
        summaryRaw: it.summaryRaw ? it.summaryRaw.slice(0, 600) : null,
        author: it.author,
        publishedAt: it.publishedAt,
        fetchedAt: it.fetchedAt,
        triageState: it.triageState,
        blocked: it.blocked,
        blockReason: it.blockReason,
        category: it.category,
        entities: parseJson<string[]>(it.entities, []),
        confidence: it.confidence == null ? null : Number(it.confidence),
        points: it.points,
        comments: it.comments,
        source: it.source,
      })),
    })
  } catch (err) {
    console.error('Get news event detail error:', err)
    return error('获取事件详情失败')
  }
}
