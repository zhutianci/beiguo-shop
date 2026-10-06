export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { getCurrentUser } from '@/lib/auth'
import { AWARD_DEFAULT_CENTS, AWARD_PER_MONTH_HINT, awardCandidates, grantAward, monthKey } from '@/lib/content/award'

// 后台：月度精选奖（P3，设计 §8.3）。GET ?month=YYYYMM 候选与已发；POST {month, postId, amountCents, note?} 发奖
const monthSchema = z.number().int().min(202601).max(209912).refine((m) => m % 100 >= 1 && m % 100 <= 12)

export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  const raw = Number(new URL(request.url).searchParams.get('month')) || monthKey()
  const month = monthSchema.safeParse(raw).success ? raw : monthKey()
  const [candidates, given] = await Promise.all([
    awardCandidates(month),
    prisma.monthlyAward.aggregate({ where: { month }, _sum: { amountCents: true }, _count: { _all: true } }),
  ])
  return success({
    month,
    defaultCents: AWARD_DEFAULT_CENTS,
    perMonthHint: AWARD_PER_MONTH_HINT,
    candidates,
    given: { count: given._count._all, cents: given._sum.amountCents ?? 0 },
  })
}

const postSchema = z.object({
  month: monthSchema,
  postId: z.number().int().positive(),
  amountCents: z.number().int(),
  note: z.string().trim().max(200).optional(),
})

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const parsed = postSchema.safeParse(await request.json())
    if (!parsed.success) return error('参数无效')
    const admin = await getCurrentUser()
    const r = await grantAward({ ...parsed.data, actorId: admin!.id })
    if (!r.ok) return error(r.message)
    return success(r, r.duplicate ? '这篇本月已经发过，没有重复发放' : '已发放，作者会收到站内通知')
  } catch (err) {
    console.error('Admin award error:', err)
    return error('发放失败')
  }
}
