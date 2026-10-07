export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { releaseScheduled } from '@/lib/content/release'

/**
 * 内容定时放量（内容扩容 2026-10-07，docs/内容平台/扩容基础设施-1007.md）：把定时队列（review_status=SCHEDULED）里的下一批公开。
 * 每天 10:00 由 cron/crontab 调一次（x-cron-secret 头，GET）。每天条数 CONTENT_RELEASE_PER_DAY（默认 40，0 = 暂停），
 * 按上海自然日封顶——同一天重复调用只补足差额，不会超量。逻辑全在 lib/content/release.ts。
 */
export async function GET(request: NextRequest) {
  const auth = assertCronAuth(request)
  if (!auth.ok) return error(auth.message, auth.status)
  try {
    const r = await releaseScheduled({ mode: 'cron' })
    if (r.released) console.log(`[content release] 放出 ${r.released} 条（今天 ${r.releasedToday}/${r.perDay}，队列剩 ${r.remaining}，IndexNow ${r.indexNow}）`)
    return success(r)
  } catch (err) {
    console.error('Content release cron error:', err)
    return error('放量失败')
  }
}
