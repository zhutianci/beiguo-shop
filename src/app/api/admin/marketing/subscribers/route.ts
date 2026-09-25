export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error, notFound } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  CONSENT_STATUSES,
  SUPPRESSION_REASON_LABEL,
  UNSUPPRESSIBLE_REASONS,
  clip,
  maskEmailLite,
  type ConsentStatus,
  type SuppressionReason,
} from '@/lib/marketing/types'
import { listSubscribers, subscriberStats } from '@/lib/marketing/stats'
import { applyConsentChange, getConsent, suppressEmail, unsuppressEmail } from '@/lib/marketing/consent'
import { bjDateCn } from '@/lib/marketing/time'
import { auditSafe, parsePaging, readJsonBody, totalPages } from '@/lib/marketing/campaign-repo'

/**
 * 订阅与退订：统计 + 用户列表；后台代用户操作。
 *
 * 【管理员只能「减少来信」】设计 10.3（防伪造同意）：
 *  - 能做：设为退订、暂停一段时间、加入抑制名单（MANUAL）、解除非投诉类抑制
 *  - 不能：把退订的人改回订阅、把谁设为「明确订阅」、解除 COMPLAINT 抑制（投诉永不解除）
 * 「确认订阅」只能由用户本人在个人中心点 —— 后台能改的话，SUBSCRIBED 这个状态就失去了证明力。
 * 每个动作都必须填备注（如「客服收到邮件退订请求」），留痕 + 审计。
 */

export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const { searchParams } = new URL(request.url)
    const { page, pageSize } = parsePaging(searchParams, 20, 100)
    const keyword = (searchParams.get('keyword') || '').trim().slice(0, 100) || null
    const rawStatus = (searchParams.get('status') || '').trim()
    const status =
      (CONSENT_STATUSES as readonly string[]).includes(rawStatus) || rawStatus === 'SUPPRESSED' || rawStatus === 'PAUSED'
        ? (rawStatus as ConsentStatus | 'SUPPRESSED' | 'PAUSED')
        : null

    const [stats, { list, total }] = await Promise.all([
      subscriberStats(),
      listSubscribers({ page, pageSize, keyword, status }),
    ])
    return success({ stats, list, total, page, pageSize, totalPages: totalPages(total, pageSize) })
  } catch (err) {
    console.error('[admin/marketing] 获取订阅列表失败:', err)
    return error('获取订阅列表失败')
  }
}

const postSchema = z
  .object({
    action: z.enum(['unsubscribe', 'pause', 'suppress', 'unsuppress'], {
      errorMap: () => ({ message: '不支持的操作（后台只能退订、暂停、加入或解除抑制）' }),
    }),
    userId: z.number().int().positive().optional(),
    email: z.string().trim().toLowerCase().email('邮箱格式不正确').max(191).optional(),
    note: z
      .string({ required_error: '请填写备注，说明为什么操作（如「客服收到邮件退订请求」）' })
      .trim()
      .min(2, '请填写备注，说明为什么操作（至少 2 个字）')
      .max(200, '备注最多 200 字'),
    days: z.number().int().min(1, '暂停天数至少 1 天').max(365, '暂停最多 365 天').optional(),
  })
  .strip()
  .refine((d) => d.userId || d.email, { message: '请指定用户或邮箱' })

type Target = { userId: number | null; email: string | null; userEmail: string | null }

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  let me: { id: number }
  try {
    me = await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }
  try {
    const body = await readJsonBody(request, 8 * 1024)
    if (!body.ok) return error(body.message, body.status)
    const parsed = postSchema.safeParse(body.body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    // ---- 定位对象：userId 优先；只给邮箱时按邮箱找注册用户（抑制名单可以作用于非注册邮箱） ----
    const t: Target = { userId: null, email: d.email || null, userEmail: null }
    if (d.userId) {
      const u = await prisma.user.findUnique({ where: { id: d.userId }, select: { id: true, email: true } })
      if (!u) return notFound('用户不存在')
      t.userId = u.id
      t.userEmail = u.email ? u.email.trim().toLowerCase() : null
      if (!t.email) t.email = t.userEmail
    } else if (d.email) {
      const u = await prisma.user.findFirst({ where: { email: d.email }, select: { id: true, email: true } })
      if (u) {
        t.userId = u.id
        t.userEmail = u.email ? u.email.trim().toLowerCase() : null
      }
    }
    const note = clip(d.note, 200) as string

    // ---------------- 退订 ----------------
    if (d.action === 'unsubscribe') {
      if (!t.userId) return notFound('没有找到这个邮箱对应的注册用户（非注册邮箱可以用「加入抑制名单」）')
      if (!t.userEmail) return error('该用户没有邮箱，本来就收不到营销邮件')
      const r = await applyConsentChange(t.userId, { kind: 'unsubscribe' }, { source: 'admin', email: t.userEmail, note })
      await auditSafe('SET_CONSENT', {
        actorId: me.id,
        detail: { userId: t.userId, op: 'unsubscribe', changed: r.changed, note },
      })
      const message = r.changed ? '已设为退订，立即生效（排队中的邮件也会被拦下）' : '该用户本来就是退订状态'
      return success({ message }, message)
    }

    // ---------------- 暂停 ----------------
    if (d.action === 'pause') {
      if (!t.userId) return notFound('没有找到这个邮箱对应的注册用户')
      if (!t.userEmail) return error('该用户没有邮箱，本来就收不到营销邮件')
      const days = d.days ?? 30
      const cur = await getConsent(t.userId)
      if (cur.status === 'UNSUBSCRIBED') {
        const message = '该用户已退订，无需暂停'
        return success({ message }, message)
      }
      // 只许「减少来信」：已经暂停到更晚的，不能被一次更短的暂停提前放出来
      const until = new Date(Date.now() + days * 86400_000)
      if (cur.pausedUntil && cur.pausedUntil.getTime() >= until.getTime()) {
        const message = `该用户已暂停到 ${bjDateCn(cur.pausedUntil)}，比这次更久，保持不变`
        return success({ message }, message)
      }
      const r = await applyConsentChange(t.userId, { kind: 'pause', days }, { source: 'admin', email: t.userEmail, note })
      await auditSafe('SET_CONSENT', {
        actorId: me.id,
        detail: { userId: t.userId, op: 'pause', days, changed: r.changed, note },
      })
      const message = r.state.pausedUntil ? `已暂停到 ${bjDateCn(r.state.pausedUntil)}` : `已暂停 ${days} 天`
      return success({ message }, message)
    }

    // ---------------- 抑制名单（邮箱级） ----------------
    const email = t.email
    if (!email) return error('该用户没有邮箱，无法加入或解除抑制')
    const existing = await prisma.marketingSuppression.findUnique({
      where: { email },
      select: { reason: true },
    })

    if (d.action === 'suppress') {
      if (existing) {
        const label = SUPPRESSION_REASON_LABEL[existing.reason as SuppressionReason] || existing.reason
        const message = `已经在抑制名单里（原因：${label}），保持不变`
        return success({ message }, message)
      }
      await suppressEmail(email, 'MANUAL', 'admin', clip(`后台：${note}`, 500))
      await auditSafe('SUPPRESS', {
        actorId: me.id,
        // 审计不写完整邮箱：留 userId 与脱敏后的邮箱，足够对上是谁
        detail: { userId: t.userId, email: maskEmailLite(email), reason: 'MANUAL', note },
      })
      const message = '已加入抑制名单，此后不会再给这个邮箱发营销邮件'
      return success({ message }, message)
    }

    // d.action === 'unsuppress'
    if (!existing) return notFound('这个邮箱不在抑制名单里')
    const reason = existing.reason as SuppressionReason
    if (!UNSUPPRESSIBLE_REASONS.includes(reason)) {
      return error('收件人投诉过垃圾邮件的地址永不解除抑制', 403)
    }
    const ok = await unsuppressEmail(email, me.id)
    if (!ok) return error('这个地址不能解除抑制', 403)
    await auditSafe('UNSUPPRESS', {
      actorId: me.id,
      detail: { userId: t.userId, email: maskEmailLite(email), reason, note },
    })
    // 解除抑制不等于恢复订阅：退订了的人仍然是退订状态，只是邮箱不再被整体拉黑
    const message = '已解除抑制（订阅状态不变：已退订的用户仍然不会收到）'
    return success({ message }, message)
  } catch (err) {
    console.error('[admin/marketing] 订阅操作失败:', err)
    return error('操作失败')
  }
}
