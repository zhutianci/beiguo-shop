export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { lastJiemaReconcile, lastDaily, runJiemaReconcile } from '@/lib/jiema/reconcile'
import { lastUnlinked } from '@/lib/jiema/unlinked'

/**
 * 后台「短信接码 → 对账」（docs/短信接码-设计.md §9.4、§7.1、§10.3）。第一行 adminGuard。
 * GET：最近一次 jiema-reconcile 报告、最近一次未关联激活快照（jiema-tick 每 10 分钟）、日报（待推 / 已推）。
 * POST { full?, hours? }：手动跑一次（I 系列只读核对并补算 I8；R 系列以上游为准修正扣费事实，与 cron 同一个函数；不生成日报），写审计。
 */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const [report, unlinked, daily] = await Promise.all([lastJiemaReconcile(), lastUnlinked(), lastDaily()])
    return success({ report, unlinked, daily })
  } catch (e) {
    console.error('[jiema] reconcile GET 失败', e)
    return error('获取对账报告失败', 500)
  }
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const body = (await request.json().catch(() => ({}))) as { full?: unknown; hours?: unknown }
    const full = body?.full === true
    const hours = typeof body?.hours === 'number' && Number.isInteger(body.hours) && body.hours >= 1 && body.hours <= 14 * 24 ? body.hours : 48
    const admin = await getCurrentUser()
    const report = await runJiemaReconcile({ full, sinceHours: hours })
    if (!report) return error('另一趟对账正在跑，请稍后再看', 409)
    await writeAudit(null, {
      actorUserId: admin?.id ?? null,
      actorKind: 'PLATFORM',
      action: 'jiema.reconcile',
      targetType: 'setting',
      targetId: 'sms_reconcile_last',
      diff: {
        full,
        hours,
        ok: report.ok,
        failed: report.items.filter((i) => !i.ok).map((i) => ({ code: i.code, count: i.count })),
        fixes: { r1: report.fixes.r1, r6: report.fixes.r6, r2Cleared: report.fixes.r2Cleared, i8: report.fixes.i8 },
      },
      req: request,
    })
    return success({ report })
  } catch (e) {
    console.error('[jiema] reconcile POST 失败', e)
    return error('对账执行失败', 500)
  }
}
