export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'

const updateUserSchema = z.object({
  status: z.number().int().min(0).max(1).optional(),
  nickname: z.string().optional().nullable(),
  vipLevel: z.number().int().min(0).max(99).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
})

/** 提权撞上渠道成员（设计 4.7、12.2：ADMIN 不得是任何有效渠道成员；A3 从事后告警变为事前阻止） */
class MemberConflict extends Error {}

// 更新用户（状态 / 昵称 / VIP 等级 / 角色）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminGuard()
  if (denied) return denied
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

    const willPromote = result.data.role === 'ADMIN' && current.role !== 'ADMIN'
    // 禁用时顺带让会话版本 +1：否则「禁用后再启用」会让他手里的旧 token 复活
    const data = { ...result.data, ...(result.data.status === 0 ? { sessionEpoch: { increment: 1 } } : {}) }
    const select = { id: true, email: true, nickname: true, status: true, role: true, vipLevel: true } as const

    /*
     * 【提升为 ADMIN：同一事务里查有效 TenantMember】超管账号在渠道 Host 上一律视为未登录（设计 4.7），
     * 既是渠道成员又是超管，会让「渠道成员 = 渠道后台用户」「超管只在主站」两条隔离规则互相打架。
     * 并发要两边都用「锁定读」才真正串行（InnoDB 普通 SELECT 读的是快照，看不见也不等别人的未提交写）：
     *  · 本侧：先 FOR UPDATE 锁用户行，再对该用户的全部成员行做锁定读（LOCK IN SHARE MODE，走 user_id 索引的
     *    next-key 锁）——对方已插入 / 已启用但未提交时，这里等它提交后读到最新值并拒绝；本侧先拿到锁时，
     *    对方的插入 / 启用要等本事务结束。
     *  · 对方（接受邀请 partner-services/invite.ts、启用成员 tenant/admin-tenants.ts setMemberStatus）必须同样用
     *    锁定读取 users.role（SELECT role … LOCK IN SHARE MODE），才会等本侧的 X 锁并看到已提交的 ADMIN——
     *    这一半不在本包，已提请 WP6 / WP5 配合；在那之前残余窗口由每日对账 A3 兜底发现。
     * 不提权的保存（改昵称、禁用等）走原来的单条 update，行为不变。
     */
    const user = willPromote
      ? await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`
          const rows = await tx.$queryRaw<{ status: number }[]>`
            SELECT status FROM tenant_members WHERE user_id = ${userId} LOCK IN SHARE MODE`
          if (rows.some((r) => Number(r.status) === 1)) throw new MemberConflict()
          return tx.user.update({ where: { id: userId }, data, select })
        })
      : await prisma.user.update({ where: { id: userId }, data, select })

    return success(user, '用户更新成功')
  } catch (err) {
    if (err instanceof MemberConflict) return error('该用户是渠道成员，请先移出')
    console.error('Update user error:', err)
    return error('更新用户失败')
  }
}
