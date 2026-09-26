export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { runReconcile } from '@/lib/tenant/reconcile'

/**
 * 渠道账本每日自检（设计 10.12；cron 每天 03:00，POST + x-cron-secret 头）。
 * 钱类不变式（L1–L13）失败 → 涉事渠道 payoutHold=true（只停出结算单与打款，买家下单不受影响）+ 平台企业微信告警；
 * 告警类（A1–A13）只告警。响应只回各项通过与否与计数（样例订单号在告警里），不回任何金额明细。
 */
export async function POST(request: NextRequest) {
  const auth = assertCronAuth(request)
  if (!auth.ok) return error(auth.message, auth.status)
  try {
    const r = await runReconcile({ applyHold: true })
    const failed = r.items.filter((i) => !i.ok).map((i) => ({ code: i.code, level: i.level, count: i.count }))
    if (failed.length) console.warn('[cron/tenant-reconcile] 未通过', JSON.stringify(failed))
    return success({ at: r.at, total: r.items.length, failed })
  } catch (err) {
    console.error('[cron/tenant-reconcile] 执行失败', err)
    return error('渠道对账任务执行失败', 500)
  }
}
