/**
 * 接受渠道成员邀请（WP6，设计 5.2、6.7、T22）。由 inviteRoute 调用：已登录、店面为 CHANNEL 且非 TERMINATED、写方法同源、
 * 非 ADMIN 都已在守卫里判过；这里只做邀请本身的校验与成员写入。
 *
 * 【租户一致性】查 TenantInvite where { tokenHash, tenantId: 当前店面 }：lulu 的邀请拿到 zz 的 Host 上接受 = 不存在（404），
 * 不产生任何 TenantMember。TenantMember.tenantId 只取 invite.tenantId，并断言它等于店面 id。
 * 【一次性】事务内 CAS 置 usedAt（where usedAt IS NULL AND revokedAt IS NULL AND expiresAt > now），并发两次只成一次。
 * 【邮箱】邀请绑定被邀请人邮箱的 sha256（小写）；登录邮箱不符按不存在处理（不提示「邮箱不对」，免得变成邮箱探测口）。
 * 【令牌】链接里是一次性随机令牌，库里只存 sha256(令牌原文，UTF-8) 的十六进制——**WP5 生成邀请时必须用同一口径**。
 * 过期、已用、吊销、邮箱不符、他站、不存在：全部 404，响应体相同。
 */
import { createHash } from 'crypto'
import { Prisma as PrismaNS, type Prisma } from '@prisma/client'
import { prisma } from '../db'
import { writeAudit } from '../audit'
import { parsePerms } from '../tenant/perms'
import { lockUserRoleShared } from '../tenant/partner-facade'
import { assertTenantId } from './_scope'
import { PARTNER_INTERNAL_INVITE_SELECT, PARTNER_INTERNAL_MEMBER_STATE_SELECT } from './selects'

/** 令牌形状：base64url / hex，20–128 字符。形状不对直接当不存在，不去查库 */
const TOKEN_RE = /^[A-Za-z0-9_-]{20,128}$/

export function inviteTokenHash(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}
export function inviteEmailHash(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase(), 'utf8').digest('hex')
}

/** 邀请行的内部字段（结果不进任何 DTO，接口只回 204 / 404）；取自 selects.ts（D15） */
const INVITE_SELECT = PARTNER_INTERNAL_INVITE_SELECT

/** 已有成员行时判断「是否已是有效成员」用；取自 selects.ts（D15） */
const MEMBER_STATE_SELECT = PARTNER_INTERNAL_MEMBER_STATE_SELECT

export type AcceptResult = 'OK' | 'NOT_FOUND'

export async function acceptInvite(ctx: { tenantId: number; userId: number; email: string }, token: string, req?: Request): Promise<AcceptResult> {
  assertTenantId(ctx.tenantId)
  const raw = String(token ?? '').trim()
  if (!TOKEN_RE.test(raw) || !ctx.email) return 'NOT_FOUND'
  const tokenHash = inviteTokenHash(raw)
  const emailHash = inviteEmailHash(ctx.email)

  const inv = await prisma.tenantInvite.findFirst({ where: { tokenHash, tenantId: ctx.tenantId }, select: INVITE_SELECT })
  const now = new Date()
  if (!inv || inv.usedAt || inv.revokedAt || inv.expiresAt <= now || inv.emailHash !== emailHash) return 'NOT_FOUND'
  if (inv.role !== 'OWNER' && inv.role !== 'STAFF') return 'NOT_FOUND'
  // 断言：成员只能落在邀请所属的渠道，且它必须就是当前店面（上面的 where 已保证，这里是第二道）
  if (inv.tenantId !== ctx.tenantId) return 'NOT_FOUND'
  const tenantId = inv.tenantId

  // 同一用户并发接受两张邀请时，后一个事务建成员行会撞 (tenantId, userId) 唯一键：整个事务回滚后重试一次，
  // 第二次会走「已是成员」分支，只作废邀请。ADMIN 复查失败用哨兵异常回滚事务（CAS 过的 usedAt 一并撤销）。
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return (await acceptOnce(inv, tenantId, ctx.userId, now, req)) ? 'OK' : 'NOT_FOUND'
    } catch (e) {
      if (e === ADMIN_SENTINEL) return 'NOT_FOUND'
      if (e instanceof PrismaNS.PrismaClientKnownRequestError && e.code === 'P2002' && attempt === 0) continue
      throw e
    }
  }
  return 'NOT_FOUND'
}

const ADMIN_SENTINEL = new Error('[partner] ADMIN 不能接受渠道邀请')

type InviteRow = Prisma.TenantInviteGetPayload<{ select: typeof INVITE_SELECT }>

async function acceptOnce(inv: InviteRow, tenantId: number, userId: number, now: Date, req?: Request): Promise<boolean> {
  const ctx = { userId }
  return prisma.$transaction(async (tx) => {
    // 一次性 CAS：并发两次接受只有一次 count=1
    const cas = await tx.tenantInvite.updateMany({
      where: { id: inv.id, tenantId, usedAt: null, revokedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    })
    if (cas.count !== 1) return false
    // ADMIN 不得成为任何渠道的有效成员（设计 5.2 不变式；守卫已按会话拦过，这里按库里当前角色再确认一次）。
    // 必须是锁定读、且在写成员行之前（主会话 D13）：与后台提权一侧同为「users 行 → tenant_members」锁顺序，
    // 普通快照读看不见并发提交的提权，会把刚成为 ADMIN 的账号写成成员。
    const role = await lockUserRoleShared(tx, ctx.userId)
    if (role === null || role === 'ADMIN') throw ADMIN_SENTINEL

    const perms = inv.role === 'STAFF' ? Array.from(parsePerms(inv.perms)) : undefined
    const existing = await tx.tenantMember.findUnique({ where: { tenantId_userId: { tenantId, userId: ctx.userId } }, select: MEMBER_STATE_SELECT })
    if (!existing) {
      await tx.tenantMember.create({
        data: {
          tenantId,
          userId: ctx.userId,
          role: inv.role,
          ...(perms ? { perms } : {}),
          status: 1,
          invitedBy: inv.invitedBy,
        },
      })
    } else if (existing.status !== 1) {
      // 曾被停用的成员拿到新邀请：按新邀请的角色恢复
      await tx.tenantMember.update({
        where: { tenantId_userId: { tenantId, userId: ctx.userId } },
        data: { role: inv.role, ...(perms ? { perms } : {}), status: 1, invitedBy: inv.invitedBy },
      })
    }
    // 已是有效成员：邀请照样作废，角色不动（避免 STAFF 邀请把现任 OWNER 降级、造成零 OWNER）
    await writeAudit(tx, {
      actorKind: 'TENANT',
      actorUserId: ctx.userId,
      tenantId,
      action: 'member.join',
      targetType: 'member',
      targetId: inv.role,
      diff: { role: inv.role, reactivated: !!existing && existing.status !== 1, alreadyMember: !!existing && existing.status === 1 },
      req,
    })
    return true
  })
}
