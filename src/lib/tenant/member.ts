/**
 * 渠道成员关系查询：partnerRoute 与 requirePartnerPage 共用这一个函数（设计 6.5.4），两处判定不会漂。
 *
 * 每个请求都查库（设计 4.6 C7）：停用成员下一次请求立即失效，不靠 JWT 里的任何声明。
 * 只认 status=1、role ∈ {OWNER, STAFF} 的行；其余一律当「不是成员」。
 */
import { prisma } from '../db'

export async function loadActiveMember(tenantId: number, userId: number): Promise<{ role: 'OWNER' | 'STAFF'; perms: unknown } | null> {
  // 主站（id=1）没有成员概念；非法入参直接当非成员（fail closed），不去查库
  if (!Number.isInteger(tenantId) || tenantId < 2 || !Number.isInteger(userId) || userId <= 0) return null
  const m = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
    select: { role: true, perms: true, status: true },
  })
  if (!m || m.status !== 1) return null
  if (m.role !== 'OWNER' && m.role !== 'STAFF') return null
  return { role: m.role, perms: m.perms }
}
