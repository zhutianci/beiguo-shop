export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { runWalletReconcile } from '@/lib/wallet/reconcile'

/**
 * 余额总账每日对账（docs/短信接码-设计.md §9.4 W 系列；crontab 每天 03:10，GET + x-cron-secret 头，--max-time 240）。
 * 覆盖前两天有流水的用户；每周日（北京时间）全量查一次 W1；?full=1 手动全量。只读核对，不改账；
 * 任何一条不通过推 wallet.alert，报告写 settings.wallet_reconcile_last（后台「余额与充值 → 对账」可看）。
 * 响应只回各项通过与否与计数，不回金额明细。
 */
export async function GET(request: NextRequest) {
  const auth = assertCronAuth(request)
  if (!auth.ok) return error(auth.message, auth.status)
  try {
    // 北京时间的星期几：容器 TZ 不可靠（交接文档六·4），按 UTC+8 自己算
    const weekday = new Date(Date.now() + 8 * 3600_000).getUTCDay()
    const full = request.nextUrl.searchParams.get('full') === '1' || weekday === 0
    const r = await runWalletReconcile({ full })
    const failed = r.items.filter((i) => !i.ok).map((i) => ({ code: i.code, count: i.count }))
    if (failed.length) console.warn('[wallet] 对账未通过', JSON.stringify(failed))
    return success({ at: r.at, full: r.full, total: r.items.length, failed })
  } catch (err) {
    console.error('[wallet] cron wallet-reconcile 执行失败', err)
    return error('余额对账任务执行失败', 500)
  }
}
