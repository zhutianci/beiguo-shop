export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, unauthorized, notFound } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'

const patchSchema = z.object({
  label: z.string().trim().max(50).optional().nullable(),
  platform: z.enum(['CLAUDE', 'CHATGPT', 'OTHER']).optional(),
})

// PATCH：修改备注名 / 平台
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    const binding = await prisma.userAccount.findUnique({ where: { id } })
    if (!binding || binding.userId !== user.id) return notFound('绑定不存在')

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    await prisma.userAccount.update({
      where: { id },
      data: {
        ...(parsed.data.label !== undefined ? { label: parsed.data.label?.trim() || null } : {}),
        ...(parsed.data.platform ? { platform: parsed.data.platform } : {}),
      },
    })
    return success({ id }, '已更新')
  } catch (err) {
    console.error('Update binding error:', err)
    return error('更新失败')
  }
}

// DELETE：解绑
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    const binding = await prisma.userAccount.findUnique({ where: { id } })
    if (!binding || binding.userId !== user.id) return notFound('绑定不存在')

    await prisma.userAccount.delete({ where: { id } })
    return success({ id }, '已解绑')
  } catch (err) {
    console.error('Delete binding error:', err)
    return error('解绑失败')
  }
}
