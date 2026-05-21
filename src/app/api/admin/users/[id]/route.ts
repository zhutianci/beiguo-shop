export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'

const updateUserSchema = z.object({
  status: z.number().optional(),
  nickname: z.string().optional().nullable(),
  vipLevel: z.number().optional(),
})

// 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return notFound('用户不存在')
    }

    const body = await request.json()
    const result = updateUserSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: result.data,
      select: {
        id: true,
        email: true,
        nickname: true,
        status: true,
        role: true,
      },
    })

    return success(user, '用户更新成功')
  } catch (err) {
    console.error('Update user error:', err)
    return error('更新用户失败')
  }
}
