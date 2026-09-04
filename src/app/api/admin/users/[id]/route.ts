export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'

const updateUserSchema = z.object({
  status: z.number().int().min(0).max(1).optional(),
  nickname: z.string().optional().nullable(),
  vipLevel: z.number().int().min(0).max(99).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
})

// 更新用户（状态 / 昵称 / VIP 等级 / 角色）
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

    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    })
    if (!current) return notFound('用户不存在')

    // 保护：不能把最后一个可用管理员降级或禁用，否则后台会锁死
    const willDemote = result.data.role === 'USER' && current.role === 'ADMIN'
    const willDisable = result.data.status === 0 && current.role === 'ADMIN' && current.status === 1
    if (willDemote || willDisable) {
      const activeAdmins = await prisma.user.count({
        where: { role: 'ADMIN', status: 1 },
      })
      if (activeAdmins <= 1) {
        return error('系统至少需要保留一个可用的管理员账号')
      }
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
        vipLevel: true,
      },
    })

    return success(user, '用户更新成功')
  } catch (err) {
    console.error('Update user error:', err)
    return error('更新用户失败')
  }
}
