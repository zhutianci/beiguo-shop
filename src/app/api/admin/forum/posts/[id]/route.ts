export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'

/**
 * 后台帖子运营：置顶 / 精华 / 锁帖 / 隐藏 / 审核 / 删除与恢复。
 *
 * 以前这些操作走前台公开接口 /api/forum/posts/[id]，靠接口里的 isAdmin 判断放行——
 * 没有同源校验，兄弟子域的 simple POST 能借管理员的 Lax cookie 改帖子状态（内容平台设计 §1.1 缺口①）。
 * 现在统一经 adminGuard（查库复核角色 + 同源校验），前台接口不再接收这些字段。
 */
const patchSchema = z.object({
  pinned: z.boolean().optional(),
  featured: z.boolean().optional(),
  locked: z.boolean().optional(),
  status: z.number().int().min(0).max(1).optional(),
  reviewStatus: z.enum(['APPROVED', 'REJECTED', 'PENDING']).optional(),
  reviewNote: z.string().trim().max(500, '原因不超过 500 字').optional().nullable(),
  /** 恢复已软删除的帖子 */
  restore: z.literal(true).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const post = await prisma.forumPost.findUnique({ where: { id } })
    if (!post) return error('帖子不存在', 404)

    const parsed = patchSchema.safeParse(await request.json())
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const data: any = {}
    if (d.pinned !== undefined) data.pinned = d.pinned
    if (d.locked !== undefined) data.locked = d.locked
    if (d.status !== undefined) data.status = d.status
    if (d.restore) {
      data.deletedAt = null
      data.status = 1
    }
    if (d.reviewStatus !== undefined) {
      if (d.reviewStatus === 'REJECTED' && !d.reviewNote?.trim()) {
        // 驳回必须给原因：作者要知道改哪里（设计 §7.2：退回修改，不直接删）
        return error('请填写驳回原因')
      }
      data.reviewStatus = d.reviewStatus
      data.reviewNote = d.reviewStatus === 'APPROVED' ? null : d.reviewNote?.trim() || null
      data.reviewedAt = new Date()
    }
    if (d.featured !== undefined) {
      // 精选只给已过审的：否则「加精」会让一篇待审帖以精华身份出现在作者等级计算里
      const reviewAfter = data.reviewStatus ?? post.reviewStatus
      if (d.featured && reviewAfter !== 'APPROVED') return error('请先审核通过再加精')
      data.featured = d.featured
    }
    if (Object.keys(data).length === 0) return error('没有可更新的内容')

    await prisma.forumPost.update({ where: { id }, data })
    return success({ id }, '已更新')
  } catch (err) {
    console.error('Admin update post error:', err)
    return error('更新失败')
  }
}

// 删除：软删除（可在后台「已删除」里恢复）。前台对已删除帖按不存在处理
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const post = await prisma.forumPost.findUnique({ where: { id }, select: { id: true } })
    if (!post) return error('帖子不存在', 404)
    await prisma.forumPost.update({ where: { id }, data: { deletedAt: new Date(), status: 0 } })
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Admin delete post error:', err)
    return error('删除失败')
  }
}
