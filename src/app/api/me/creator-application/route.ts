export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { denyUnlessModule } from '@/lib/storefront/resolve'
import { meOrDeny } from '@/lib/content/session'
import { notify } from '@/lib/notify'
import { trustLevelOf } from '@/lib/forum-server'

/**
 * 创作者认证申请（P3）。通过 = 认证徽章 + 视同 L2（先发后审、可发作者自荐）。
 * 门槛：至少 1 条公开的提示词 / 教程 / 应用（没有作品没法审）；同一时间只能有一份待审；被驳回 30 天后可再申请。
 */
const MIN_PUBLIC_WORKS = 1
const REAPPLY_DAYS = 30

const schema = z.object({
  field: z.string().trim().min(2, '请填写创作领域').max(40),
  works: z.string().trim().min(10, '请列出代表作（站内链接或站外作品链接）').max(1000),
  intro: z.string().trim().min(20, '自我介绍至少 20 字').max(500),
})

async function state(userId: number, role = 'USER') {
  const [profile, latest, works, account, level] = await Promise.all([
    prisma.creatorProfile.findUnique({ where: { userId }, select: { certifiedAt: true, certTitle: true } }),
    prisma.creatorApplication.findFirst({ where: { userId }, orderBy: { id: 'desc' } }),
    prisma.forumPost.count({ where: { userId, type: { in: ['PROMPT', 'GUIDE', 'APP'] }, status: 1, reviewStatus: 'APPROVED', deletedAt: null } }),
    prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } }),
    trustLevelOf({ id: userId, role }),
  ])
  const reapplyAt = latest?.status === 'REJECTED' && latest.reviewedAt ? new Date(latest.reviewedAt.getTime() + REAPPLY_DAYS * 86_400_000) : null
  const canApply = !profile?.certifiedAt && works >= MIN_PUBLIC_WORKS && latest?.status !== 'PENDING' && (!reapplyAt || reapplyAt <= new Date())
  return {
    certified: !!profile?.certifiedAt,
    certTitle: profile?.certTitle ?? null,
    works,
    minWorks: MIN_PUBLIC_WORKS,
    latest: latest ? { status: latest.status, field: latest.field, reviewNote: latest.reviewNote, createdAt: latest.createdAt } : null,
    reapplyAt,
    canApply,
    // 作者内推返现（设计 §13.1）：L2 及以上 + 已开通内推码 → 内容页的开通入口带上你的内推码
    level,
    hasReferralCode: !!account?.referralCode,
    refActive: level >= 2 && level !== 9 && !!account?.referralCode,
  }
}

export async function GET(request: NextRequest) {
  const channelDenied = await denyUnlessModule('learn')
  if (channelDenied) return channelDenied
  const { user, denied } = await meOrDeny(request, false)
  if (denied) return denied
  return success(await state(user!.id, user!.role))
}

export async function POST(request: NextRequest) {
  const channelDenied = await denyUnlessModule('learn')
  if (channelDenied) return channelDenied
  const { user, denied } = await meOrDeny(request, true)
  if (denied) return denied
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return error(parsed.error.issues[0]?.message || '参数无效')
    const s = await state(user!.id, user!.role)
    if (s.certified) return error('你已经是认证创作者')
    if (s.works < MIN_PUBLIC_WORKS) return error(`至少要有 ${MIN_PUBLIC_WORKS} 条公开的提示词、教程或应用才能申请`)
    if (s.latest?.status === 'PENDING') return error('你的申请正在审核中')
    if (!s.canApply) return error('上次申请未通过，30 天后可以再申请')
    await prisma.creatorApplication.create({ data: { userId: user!.id, ...parsed.data } })
    notify('forum.review', [
      { label: '类型', value: '创作者认证申请' },
      { label: '领域', value: parsed.data.field },
    ], { link: '/admin/forum', linkText: '去审核' })
    return success(await state(user!.id, user!.role), '已提交，审核结果会在站内通知里告诉你')
  } catch (err) {
    console.error('Creator application error:', err)
    return error('提交失败')
  }
}
