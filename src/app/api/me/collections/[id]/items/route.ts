export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { meOrDeny } from '@/lib/content/session'
import { PUBLIC_WHERE } from '@/lib/content/queries'
import { onCollectionUpdated } from '@/lib/content/events'

// 往合集里加 / 移除一条内容（只能加公开的内容；一个合集最多 200 条）
const schema = z.object({ postId: z.number().int().positive(), note: z.string().trim().max(200).optional() })

async function mine(userId: number, id: number) {
  return prisma.collection.findFirst({ where: { id, userId }, select: { id: true } })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, denied } = await meOrDeny(request, true)
  if (denied) return denied
  try {
    const id = parseInt(params.id)
    if (!(await mine(user!.id, id))) return error('合集不存在', 404)
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return error('参数无效')
    if (!(await prisma.forumPost.findFirst({ where: { id: parsed.data.postId, ...PUBLIC_WHERE }, select: { id: true } }))) return error('内容不存在', 404)
    if ((await prisma.collectionItem.count({ where: { collectionId: id } })) >= 200) return error('一个合集最多 200 条')
    const existed = await prisma.collectionItem.findUnique({ where: { collectionId_postId: { collectionId: id, postId: parsed.data.postId } }, select: { postId: true } })
    const max = await prisma.collectionItem.aggregate({ where: { collectionId: id }, _max: { sortOrder: true } })
    await prisma.collectionItem.upsert({
      where: { collectionId_postId: { collectionId: id, postId: parsed.data.postId } },
      update: { note: parsed.data.note ?? undefined },
      create: { collectionId: id, postId: parsed.data.postId, note: parsed.data.note || null, sortOrder: (max._max.sortOrder ?? 0) + 1 },
    })
    await prisma.collection.update({ where: { id }, data: { updatedAt: new Date() } })
    // 新加的条目才通知关注者（改备注不算更新）
    if (!existed) void onCollectionUpdated(id)
    return success({ ok: true }, '已加入合集')
  } catch (err) {
    console.error('Collection add error:', err)
    return error('操作失败')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, denied } = await meOrDeny(request, true)
  if (denied) return denied
  try {
    const id = parseInt(params.id)
    if (!(await mine(user!.id, id))) return error('合集不存在', 404)
    const postId = Number(new URL(request.url).searchParams.get('postId'))
    if (!postId) return error('参数无效')
    await prisma.collectionItem.deleteMany({ where: { collectionId: id, postId } })
    return success({ ok: true }, '已移出合集')
  } catch (err) {
    console.error('Collection remove error:', err)
    return error('操作失败')
  }
}
