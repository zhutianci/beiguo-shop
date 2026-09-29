export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { getCurrentUser } from '@/lib/auth'
import { adminAdjust } from '@/lib/wallet/adjust'
import { centsOf } from '@/lib/wallet/buckets'

/**
 * 内推管理 →「提现/调整」（旧入口保留，只作用于**返现格** users.balance；docs/短信接码-设计.md §6.6 第 3 条）。
 * 充值格（users.topup_cents）的调整在「余额与充值」（/admin/wallet），这里不碰。
 *
 * B0 起写余额改走钱包唯一的记账函数（lib/wallet/adjust → ledger.postInTx）：
 *  · 正数 → ADJUST、负数 → WITHDRAW，入参与改造前相同；
 *  · 请求级幂等改用 balance_logs.biz_key = adj:<requestId>，同时仍核对部署前旧版本写下的 vmq_locks「bal:<requestId>」，
 *    防止「部署前提交、部署后重试」被记两遍（§5.6）；
 *  · 扣减仍是条件更新（balance >= 扣减额 才扣），不会扣成负数；同一事务写审计。
 */

// GET ?userId= ：两格余额 + 最近流水
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const userId = parseInt(new URL(request.url).searchParams.get('userId') || '0')
    if (!userId) return error('缺少 userId')
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, balance: true, topupCents: true } })
    if (!user) return notFound('用户不存在')
    const logs = await prisma.balanceLog.findMany({ where: { userId }, orderBy: { id: 'desc' }, take: 50 })
    return success({
      // balance 的含义不变：返现格（元）
      balance: Number(user.balance),
      topupCents: user.topupCents,
      cashCents: centsOf(user.balance),
      logs: logs.map((l) => ({
        id: l.id,
        delta: Number(l.delta),
        balanceAfter: Number(l.balanceAfter),
        topupDeltaCents: l.topupDeltaCents,
        topupAfterCents: l.topupAfterCents,
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
   * 可选是为了兼容没刷新的旧后台页面：不带时行为和原来完全一样（不去重）。36 位 UUID 或 32 位 hex
   */
  requestId: z
    .string()
    .regex(/^[0-9a-fA-F-]{32,36}$/, '请求号格式不正确')
    .optional(),
})

// POST：调整返现余额（正=增加，负=提现/扣减），记流水
export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const body = await request.json()
    const parsed = adjustSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const { userId, note, requestId } = parsed.data
    // 余额列是 Decimal(10,2)：先取整到分，流水记的变动额与余额实际变动才是同一个数
    const cents = Math.round(parsed.data.delta * 100)
    if (cents === 0) return error('变动额不能为 0')

    const admin = await getCurrentUser()
    const r = await adminAdjust({
      actorUserId: admin?.id ?? null,
      kind: cents < 0 ? 'CASH_SUB' : 'CASH_ADD',
      userId,
      amountCents: Math.abs(cents),
      reason: note || null,
      requestId: requestId ?? null,
      source: 'referrals',
      req: request,
    })
    if (!r.ok) {
      if (r.status === 404) return notFound(r.message)
      return error(r.message, r.status)
    }
    const balance = r.after.cashCents / 100
    if (r.duplicate) return success({ balance, duplicate: true }, '这笔此前已记账成功，本次未重复记账')
    return success({ balance }, '已更新')
  } catch (err) {
    console.error('Adjust balance error:', err)
    return error('操作失败')
  }
}
