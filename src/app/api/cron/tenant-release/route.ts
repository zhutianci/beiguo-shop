export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { releaseDue } from '@/lib/tenant/ledger'

/**
 * 渠道账本解冻（设计 10.5；cron 每小时第 7 分，POST + x-cron-secret 头）。
 * 先跑补偿扫描（税费已收却漏计的发票分成），再解冻到期的货款组与已开票的发票分成组。
 * 只处理 tenantId ≥ 2 的订单；没有渠道单时几条空查询就返回（休眠期对主站无影响）。
 * 每单一个小事务、按 settleVersion CAS，失败的单下轮再来；整趟异常回 500，cron 日志可见。
 */
export async function POST(request: NextRequest) {
  const auth = assertCronAuth(request)
  if (!auth.ok) return error(auth.message, auth.status)
  try {
    const r = await releaseDue()
    if (r.compensated || r.released || r.releasedInv) console.log('[cron/tenant-release]', JSON.stringify(r))
    return success(r)
  } catch (err) {
    console.error('[cron/tenant-release] 执行失败', err)
    return error('渠道解冻任务执行失败', 500)
  }
}
