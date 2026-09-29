export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { lastReconcileReport, runWalletReconcile } from '@/lib/wallet/reconcile'

/** GET：最近一次 wallet-reconcile 报告；POST {full?}：手动跑一次（只读核对，不改账；不一致照常推 wallet.alert） */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    return success({ report: await lastReconcileReport() })
  } catch (e) {
    console.error('[wallet] reconcile GET 失败', e)
    return error('获取对账报告失败', 500)
  }
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const body = (await request.json().catch(() => ({}))) as { full?: unknown }
    const full = body?.full === true
    const admin = await getCurrentUser()
    const report = await runWalletReconcile({ full })
    await writeAudit(null, {
      actorUserId: admin?.id ?? null,
      actorKind: 'PLATFORM',
      action: 'wallet.reconcile',
      targetType: 'wallet',
      targetId: full ? 'full' : 'recent',
      diff: { ok: report.ok, failed: report.items.filter((i) => !i.ok).map((i) => ({ code: i.code, count: i.count })) },
      req: request,
    })
    return success({ report })
  } catch (e) {
    console.error('[wallet] reconcile POST 失败', e)
    return error('对账执行失败', 500)
  }
}
