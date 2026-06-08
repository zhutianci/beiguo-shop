export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'

// GET ?userId= ：余额 + 最近流水
export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(new URL(request.url).searchParams.get('userId') || '0')
    if (!userId) return error('缺少 userId')
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, balance: true } })
    if (!user) return notFound('用户不存在')
    const logs = await prisma.balanceLog.findMany({ where: { userId }, orderBy: { id: 'desc' }, take: 50 })
    return success({
      balance: Number(user.balance),
      logs: logs.map((l) => ({
        id: l.id,
        delta: Number(l.delta),
        balanceAfter: Number(l.balanceAfter),
        type: l.type,
        note: l.note,
        createdAt: l.createdAt,
      })),
    })
  } catch (err) {
    console.error('Get balance error:', err)
    return error('查询失败')
  }
}

const adjustSchema = z.object({
  userId: z.number().int().positive(),
  delta: z.number().refine((v) => v !== 0, '变动额不能为 0'),
  note: z.string().trim().max(255).optional().nullable(),
})

// POST：调整余额（正=增加，负=提现/扣减），记流水
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = adjustSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const { userId, delta, note } = parsed.data

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } })
    if (!user) return notFound('用户不存在')

    const after = Math.round((Number(user.balance) + delta) * 100) / 100
    if (after < 0) return error('余额不足，扣减后不能为负')

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { balance: { increment: delta } } }),
      prisma.balanceLog.create({
        data: {
          userId,
          delta,
          balanceAfter: after,
          type: delta < 0 ? 'WITHDRAW' : 'ADJUST',
          note: note || (delta < 0 ? '提现/扣减' : '余额调整'),
        },
      }),
    ])
    return success({ balance: after }, '已更新')
  } catch (err) {
    console.error('Adjust balance error:', err)
    return error('操作失败')
  }
}
