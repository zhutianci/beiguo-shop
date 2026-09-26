export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, unauthorized, notFound } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { denyOnChannel } from '@/lib/storefront/resolve'

const patchSchema = z.object({
  label: z.string().trim().max(50).optional().nullable(),
  platform: z.enum(['CLAUDE', 'CHATGPT', 'OTHER']).optional(),
})

// PATCH：修改备注名 / 平台
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
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
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
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
