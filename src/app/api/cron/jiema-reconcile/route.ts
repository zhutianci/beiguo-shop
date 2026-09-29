export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { runJiemaReconcile } from '@/lib/jiema/reconcile'

/**
 * 短信接码每日对账（docs/短信接码-设计.md §9.4 I 系列 + 与上游对账 R 系列、§6.6 第 34 条；crontab 每天 03:20，GET + x-cron-secret 头，--max-time 240）。
 * 覆盖前两天：I1–I8 只读核对（I8 没定稿的补算）；拉上游 v1 history（6 / 8 / 10）以上游为准修正扣费事实并重跑成本核算
 * （已取消单只记亏损），外部激活推送、旧链路遗留只列出，绝不取消任何激活。顺带生成昨天的日报（北京 09:00 由 jiema-tick 推 sms.daily）。
 * 不一致推 sms.alert，报告写 settings.sms_reconcile_last（后台「短信接码 → 对账」可看）。响应只回各项通过与否与计数，不回金额明细。
 * 锁被占（后台刚点了「立即对账」）先等一会儿；还是抢不到 → 推「对账没有执行」、照样生成日报，回 {busy:true}。
 * 整趟出错也存一份「执行失败」的报告并推 sms.alert（runJiemaReconcile 里兜住，不抛到这里）。
 */
export async function GET(request: NextRequest) {
  const auth = assertCronAuth(request)
  if (!auth.ok) return error(auth.message, auth.status)
  try {
    const r = await runJiemaReconcile({ daily: true, waitLock: true })
    if (!r) return success({ busy: true })
    const failed = r.items.filter((i) => !i.ok).map((i) => ({ code: i.code, count: i.count }))
    if (failed.length) console.warn('[jiema] 对账未通过', JSON.stringify(failed))
    return success({ at: r.at, orders: r.orders, upstreamOk: r.upstream.ok, total: r.items.length, failed, ...(r.error ? { error: true } : {}), fixes: { r1: r.fixes.r1, r6: r.fixes.r6, r2Cleared: r.fixes.r2Cleared, i8: r.fixes.i8 } })
  } catch (err) {
    console.error('[jiema] cron jiema-reconcile 执行失败', err)
    return error('接码对账任务执行失败', 500)
  }
}
