/**
 * 赞助位（内容平台 P3，设计 §9.3）。
 *   · 明确标「赞助」，链接 rel="sponsored nofollow"；只在列表页的固定位置出现，不进瀑布流、不影响自然排序与精选；
 *   · 站长线下谈好、收款后在后台录入起止时间，到期自动下架；
 *   · 点击经 /api/content/sponsor/{id} 计数后 302 到登记的地址（只跳库里登记的地址，不是开放跳转）。
 */
import { z } from 'zod'
import { prisma } from '../db'
import { isForumImageUrl } from './policy'

export const PLACEMENTS = ['ALL', 'LEARN', 'PROMPTS', 'GUIDES', 'APPS'] as const
export type Placement = (typeof PLACEMENTS)[number]
export const PLACEMENT_LABELS: Record<Placement, string> = { ALL: '全部列表页', LEARN: '学习首页', PROMPTS: '提示词库', GUIDES: '教程', APPS: 'AI 应用' }

export const sponsorSchema = z
  .object({
    title: z.string().trim().min(2).max(60),
    blurb: z.string().trim().max(160).optional().nullable(),
    url: z.string().trim().url().max(500).refine((u) => /^https?:\/\//i.test(u), '只支持 http(s) 链接'),
    image: z.string().trim().max(255).refine((u) => u === '' || isForumImageUrl(u), '图片请先在后台上传').optional().nullable(),
    placement: z.enum(PLACEMENTS),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    active: z.boolean().optional(),
  })
  .refine((d) => d.endAt > d.startAt, { message: '结束时间要晚于开始时间', path: ['endAt'] })

export interface SponsorCard {
  id: number
  title: string
  blurb: string | null
  image: string | null
  href: string
}

/** 当前在投的赞助（最多 2 条）：指定位置的 + 「全部列表页」的 */
export async function activeSponsors(placement: Exclude<Placement, 'ALL'>, limit = 2): Promise<SponsorCard[]> {
  try {
    const now = new Date()
    const rows = await prisma.sponsorSlot.findMany({
      where: { active: true, startAt: { lte: now }, endAt: { gt: now }, placement: { in: ['ALL', placement] } },
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
      take: limit,
      select: { id: true, title: true, blurb: true, image: true },
    })
    return rows.map((r) => ({ ...r, href: `/api/content/sponsor/${r.id}` }))
  } catch (e) {
    console.error('[sponsor]', e)
    return []
  }
}
