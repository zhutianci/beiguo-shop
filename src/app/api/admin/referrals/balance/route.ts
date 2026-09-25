export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { toCents } from '@/lib/money'

/** 扣减时余额不足：在事务里抛出，让幂等占位行一起回滚（不导出：route.ts 只能导出 HTTP handler） */
class InsufficientBalance extends Error {}

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
  /*
   * 幂等键：后台弹窗打开或上次提交成功后生成；网络异常（结果未知）后重试时沿用同一个，服务端按它去重。
   * 可选是为了兼容没刷新的旧后台页面：不带时行为和原来完全一样。
   * 36 位 UUID 或 32 位 hex：'bal:' + 36 = 40，正好是 vmq_locks.lock_key 的列宽
   */
  requestId: z
    .string()
    .regex(/^[0-9a-fA-F-]{32,36}$/, '请求号格式不正确')
    .optional(),
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
    const { userId, note, requestId } = parsed.data
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
    /*
     * 【幂等：同一个请求号只记一次账】服务端已提交、响应却在 Cloudflare / 网络那一段丢了时，
     * 后台页拿不到结果，管理员很自然会再点一次「提交」—— 原来就会再加一次余额、再记一条流水，
     * 之后按余额线下打款就会真的多付钱。现在页面带上请求号，这里在同一个事务里占一个唯一键：
     *  - 复用 vmq_locks 表（不改 schema），lock_key 前缀 'bal:' 不会和收款金额锁 '<分>-<type>'、
     *    营销 'mkt:'、资讯 'news:' 撞；vmq 的清理只按收款单号删锁，碰不到这些行。
     *  - order_id 列存「用户 + 金额」指纹：重放时核对是不是同一笔，同号换了金额就拒绝，不静默吞掉。
     *  - 占位和改余额、写流水同一个事务：本次失败回滚时占位也一起回滚，重试不会被误判为重复。
     * 并发的两个同号请求在唯一键上排队：后到的等先到的提交后拿到 P2002，整体回滚。
     */
    const lockKey = requestId ? `bal:${requestId}` : null
    const fingerprint = `bal:${userId}:${toCents(delta)}`

    let after: number
    try {
      after = await prisma.$transaction(async (tx) => {
        if (lockKey) await tx.vmqLock.create({ data: { lockKey, orderId: fingerprint } })
        if (delta < 0) {
          const r = await tx.user.updateMany({
            where: { id: userId, balance: { gte: -delta } },
            data: { balance: { increment: delta } },
          })
          // 余额不足必须抛出而不是 return：事务里已经写了占位行，return 会把它一起提交，
          // 之后同一个请求号改小金额再提交就会被误判成「已处理过」
          if (r.count !== 1) throw new InsufficientBalance()
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
    } catch (e) {
      if (e instanceof InsufficientBalance) return error('余额不足，扣减后不能为负')
      if (lockKey && (e as { code?: string })?.code === 'P2002') {
        const prev = await prisma.vmqLock.findUnique({ where: { lockKey } })
        if (prev?.orderId === fingerprint) {
          const u = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } })
          return success({ balance: Number(u?.balance ?? 0), duplicate: true }, '这笔此前已记账成功，本次未重复记账')
        }
        return error('该次提交已按另一金额或另一用户处理过，请刷新流水核对后再操作', 409)
      }
      throw e // 交给外层 catch，仍返回「操作失败」
    }

    return success({ balance: after }, '已更新')
  } catch (err) {
    console.error('Adjust balance error:', err)
    return error('操作失败')
  }
}
