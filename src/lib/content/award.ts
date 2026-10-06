/**
 * 月度精选奖（内容平台 P3，设计 §8.3）：每月评 3~5 篇，发**充值余额**（不可提现那一格）。
 *
 * 记账走钱包唯一的后台入口 adminAdjust（TOPUP_ADD），不另写余额：
 *   · 请求号由「月份 + 内容 id」算出（sha256 取 32 位 hex），同一篇同一个月重复点发奖，第二次被 balance_logs.biz_key 唯一挡住；
 *   · 先记账、后写 monthly_awards（upsert）：中途失败重试时两边都幂等，不会出现「表里有奖、钱没到」或反过来发两次。
 * 金额由站长定（§18-8 默认 20~50 元），后台每次填写，这里只限 1~500 元。
 */
import crypto from 'crypto'
import { prisma } from '../db'
import { adminAdjust } from '../wallet/adjust'
import { notifyUser } from './inbox'
import { award as awardPoints } from './points'
import { contentPath } from './policy'

export const AWARD_MAX_CENTS = 50_000
export const AWARD_DEFAULT_CENTS = 3_000
export const AWARD_PER_MONTH_HINT = 5

/** YYYYMM（上海时间） */
export function monthKey(d = new Date()): number {
  const sh = new Date(d.getTime() + 8 * 3600_000)
  return sh.getUTCFullYear() * 100 + sh.getUTCMonth() + 1
}

export function monthRange(month: number): { from: Date; to: Date } {
  const y = Math.floor(month / 100)
  const m = (month % 100) - 1
  return { from: new Date(Date.UTC(y, m, 1) - 8 * 3600_000), to: new Date(Date.UTC(y, m + 1, 1) - 8 * 3600_000) }
}

export function awardRequestId(month: number, postId: number): string {
  return crypto.createHash('sha256').update(`content-award:${month}:${postId}`).digest('hex').slice(0, 32)
}

/** 候选：这个月被精选的提示词 / 教程 / 应用，按互动排序（复制×3 + 收藏×2 + 同款×5 + 赞 + 评论×2） */
export async function awardCandidates(month: number) {
  const { from, to } = monthRange(month)
  const rows = await prisma.forumPost.findMany({
    where: {
      type: { in: ['PROMPT', 'GUIDE', 'APP'] },
      featured: true,
      featuredAt: { gte: from, lt: to },
      status: 1,
      reviewStatus: 'APPROVED',
      deletedAt: null,
      userId: { not: null },
      // 站方编辑（管理员）写的内容不参评：奖是给作者的
      user: { role: { not: 'ADMIN' } },
    },
    select: { id: true, type: true, slug: true, title: true, userId: true, authorName: true, copyCount: true, favoriteCount: true, remixCount: true, likeCount: true, commentCount: true, featuredAt: true },
    take: 200,
  })
  const given = await prisma.monthlyAward.findMany({ where: { month }, select: { postId: true, amountCents: true } })
  const givenMap = new Map(given.map((g) => [g.postId, g.amountCents]))
  return rows
    .map((r) => ({
      ...r,
      path: contentPath(r.type, r.id, r.slug),
      score: r.copyCount * 3 + r.favoriteCount * 2 + r.remixCount * 5 + r.likeCount + r.commentCount * 2,
      awardedCents: givenMap.get(r.id) ?? null,
    }))
    .sort((a, b) => b.score - a.score)
}

export async function grantAward(p: { month: number; postId: number; amountCents: number; note?: string | null; actorId: number }): Promise<{ ok: true; duplicate: boolean } | { ok: false; message: string }> {
  if (!Number.isSafeInteger(p.amountCents) || p.amountCents < 100 || p.amountCents > AWARD_MAX_CENTS) return { ok: false, message: '金额要在 1~500 元之间' }
  const post = await prisma.forumPost.findUnique({ where: { id: p.postId }, select: { id: true, type: true, slug: true, title: true, userId: true, featured: true, deletedAt: true, user: { select: { role: true } } } })
  if (!post || !post.userId || post.deletedAt) return { ok: false, message: '内容不存在或没有作者账号' }
  if (post.user?.role === 'ADMIN') return { ok: false, message: '站方内容不参评' }
  if (!post.featured) return { ok: false, message: '只能给精选内容发奖' }
  const existing = await prisma.monthlyAward.findUnique({ where: { month_postId: { month: p.month, postId: post.id } } })
  if (existing && existing.amountCents !== p.amountCents) return { ok: false, message: `这篇本月已经发过 ${(existing.amountCents / 100).toFixed(2)} 元，不能改金额` }

  const r = await adminAdjust({
    actorUserId: p.actorId,
    kind: 'TOPUP_ADD',
    userId: post.userId,
    amountCents: p.amountCents,
    reason: `月度精选奖 ${p.month} · 内容#${post.id}`,
    requestId: awardRequestId(p.month, post.id),
    source: 'wallet',
  })
  if (!r.ok) return { ok: false, message: r.message }

  await prisma.monthlyAward.upsert({
    where: { month_postId: { month: p.month, postId: post.id } },
    create: { month: p.month, postId: post.id, userId: post.userId, amountCents: p.amountCents, note: p.note?.slice(0, 200) || null, createdBy: p.actorId },
    update: {},
  })
  if (!existing) {
    const yuan = (p.amountCents / 100).toFixed(2).replace(/\.00$/, '')
    notifyUser(post.userId, 'AWARDED', `「${post.title}」获得 ${Math.floor(p.month / 100)} 年 ${p.month % 100} 月精选奖，${yuan} 元已存入你的充值余额`, {
      link: contentPath(post.type, post.id, post.slug),
      body: p.note || undefined,
    })
    void awardPoints(post.userId, 'AWARDED', post.id)
  }
  return { ok: true, duplicate: !!existing || r.duplicate }
}
