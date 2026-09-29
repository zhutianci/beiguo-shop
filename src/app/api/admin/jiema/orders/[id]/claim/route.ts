export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { adminClaimCandidates } from '@/lib/jiema/admin-orders'

/**
 * 「认领上游激活」的候选（docs/短信接码-设计.md §7.2、§2.4、D19）：对一个结果未知（UNKNOWN）的尝试，列出上游活跃列表里同服务、同国家、
 * 本站不认识的激活，按时间窗、运营商、价格排好，并标出「旧链路窗口内」的候选（提醒不要把旧单品的号给错人）。
 * 只读（拉一次 v1 活跃列表）；真正认领走 POST /api/admin/jiema/orders/[id]（action=claim，写审计）。第一行 adminGuard。
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = Number(params.id)
    const attemptId = Number(request.nextUrl.searchParams.get('attemptId'))
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(attemptId) || attemptId <= 0) return error('参数不正确', 400)
    const att = await prisma.smsAttempt.findUnique({ where: { id: attemptId }, select: { smsOrderId: true } })
    if (!att || att.smsOrderId !== id) return error('尝试不存在', 404)
    const r = await adminClaimCandidates(attemptId)
    if (!r.ok) return error(r.why === 'NOT_UNKNOWN' ? '这个尝试已经不是「结果未知」' : '拉不全上游活跃列表，稍后再试', 409)
    const res = success(r)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    console.error('[jiema] admin claim candidates 失败', e)
    return error('读取失败', 500)
  }
}
