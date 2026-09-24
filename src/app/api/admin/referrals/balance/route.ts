export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'

// GET ?userId= ：余额 + 最近流水
export async function GET(request: NextRequest) {
  // 路由内再验一次管理员（防 middleware 被绕过，见交接文档第二十三节 CVE-2025-29927）
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

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
  // 改余额是直接动钱的接口，路由内必须再验一次管理员，不能只靠 middleware
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const body = await request.json()
    const parsed = adjustSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const { userId, note } = parsed.data
    // 余额列是 Decimal(10,2)：先取整到分，流水记的变动额与余额实际变动才是同一个数
    const delta = Math.round(parsed.data.delta * 100) / 100
    if (delta === 0) return error('变动额不能为 0')

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) return notFound('用户不存在')

    /*
     * 【判余额与扣余额必须是同一条语句】原来是先读余额、算出扣减后是否为负、再 increment ——
     * 两次提现同时提交时两边都读到扣之前的余额，都判「够扣」，余额就被扣成负数；
     * 流水里的「变动后余额」也是事务外算的，并发下会写错。
     * 现在扣减走条件更新（balance >= 扣减额 才扣），由数据库定胜负；
     * 变动后余额在同一个事务里、改完之后读回，行锁保证读到的就是本次改完的值。
     */
    const after = await prisma.$transaction(async (tx) => {
      if (delta < 0) {
        const r = await tx.user.updateMany({
          where: { id: userId, balance: { gte: -delta } },
          data: { balance: { increment: delta } },
        })
        if (r.count !== 1) return null // 余额不足：什么都还没写，直接结束事务
      } else {
        await tx.user.update({ where: { id: userId }, data: { balance: { increment: delta } } })
      }
      const u = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { balance: true } })
      await tx.balanceLog.create({
        data: {
          userId,
          delta,
          balanceAfter: u.balance,
          type: delta < 0 ? 'WITHDRAW' : 'ADJUST',
          note: note || (delta < 0 ? '提现/扣减' : '余额调整'),
        },
      })
      return Number(u.balance)
    })
    if (after === null) return error('余额不足，扣减后不能为负')

    return success({ balance: after }, '已更新')
  } catch (err) {
    console.error('Adjust balance error:', err)
    return error('操作失败')
  }
}
