export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { deleteCommentAndRecount, setCommentReview } from '@/lib/forum-moderation'

const patchSchema = z.object({ reviewStatus: z.enum(['APPROVED', 'REJECTED']) })

// 评论审核：通过 → 计入评论数并顶帖；驳回 → 不显示（保留记录）
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const parsed = patchSchema.safeParse(await request.json())
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const ok = await setCommentReview(id, parsed.data.reviewStatus)
    if (!ok) return error('评论不存在', 404)
    return success({ id }, '已更新')
  } catch (err) {
    console.error('Admin review comment error:', err)
    return error('操作失败')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const comment = await prisma.forumComment.findUnique({ where: { id }, select: { id: true, postId: true } })
    if (!comment) return error('评论不存在', 404)
    await deleteCommentAndRecount(comment)
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Admin delete comment error:', err)
    return error('删除失败')
  }
}
