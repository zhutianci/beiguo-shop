export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { getCurrentUser } from '@/lib/auth'
import { ensureHandle } from '@/lib/content/creator'
import { notifyUser } from '@/lib/content/inbox'

// 后台：创作者认证申请队列（P3）。GET ?status=PENDING；PATCH {id, action, title?, note?}
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  const status = new URL(request.url).searchParams.get('status') || 'PENDING'
  const rows = await prisma.creatorApplication.findMany({ where: { status }, orderBy: { id: 'desc' }, take: 50 })
  const ids = Array.from(new Set(rows.map((r) => r.userId)))
  const [users, profiles, counts] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, email: true, nickname: true } }),
    prisma.creatorProfile.findMany({ where: { userId: { in: ids } }, select: { userId: true, handle: true, points: true } }),
    prisma.forumPost.groupBy({ by: ['userId'], where: { userId: { in: ids }, status: 1, reviewStatus: 'APPROVED', deletedAt: null, type: { in: ['PROMPT', 'GUIDE', 'APP'] } }, _count: { _all: true } }),
  ])
  const um = new Map(users.map((u) => [u.id, u]))
  const pm = new Map(profiles.map((p) => [p.userId, p]))
  const cm = new Map(counts.map((c) => [c.userId, c._count._all]))
  return success({
    list: rows.map((r) => ({
      ...r,
      user: { email: um.get(r.userId)?.email ?? null, nickname: um.get(r.userId)?.nickname ?? null },
      handle: pm.get(r.userId)?.handle ?? null,
      points: pm.get(r.userId)?.points ?? 0,
      publicWorks: cm.get(r.userId) ?? 0,
    })),
    pending: await prisma.creatorApplication.count({ where: { status: 'PENDING' } }),
  })
}

const schema = z.object({
  id: z.number().int().positive(),
  action: z.enum(['approve', 'reject']),
  title: z.string().trim().min(2).max(40).optional(),
  note: z.string().trim().max(300).optional(),
})

export async function PATCH(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return error('参数无效')
    const { id, action, title, note } = parsed.data
    const admin = await getCurrentUser()
    const app = await prisma.creatorApplication.findUnique({ where: { id } })
    if (!app) return error('申请不存在', 404)
    const status = action === 'approve' ? 'APPROVED' : 'REJECTED'
    // CAS：只有待审的能处理，两个管理员同时点不会处理两遍
    const flip = await prisma.creatorApplication.updateMany({
      where: { id, status: 'PENDING' },
      data: { status, reviewNote: note || null, reviewedBy: admin?.id ?? null, reviewedAt: new Date() },
    })
    if (flip.count !== 1) return error('这份申请已经处理过了')
    if (action === 'approve') {
      const handle = await ensureHandle(app.userId)
      await prisma.creatorProfile.update({ where: { userId: app.userId }, data: { certifiedAt: new Date(), certTitle: (title || `${app.field}创作者`).slice(0, 40) } })
      notifyUser(app.userId, 'CERTIFIED', '恭喜！你已通过贝果创作者认证', { link: `/u/${handle}`, body: '发布内容免审、可以在 AI 应用区发作者自荐，主页和作品上会显示认证徽章。' })
    } else {
      notifyUser(app.userId, 'CERTIFIED', '创作者认证申请未通过', { link: '/learn/me?tab=creator', body: note || '可以继续发布作品，30 天后再申请。' })
    }
    return success({ ok: true }, action === 'approve' ? '已通过' : '已驳回')
  } catch (err) {
    console.error('Admin application error:', err)
    return error('操作失败')
  }
}
