export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { runCatalogJob } from '@/lib/jiema/catalog'

/**
 * 短信接码目录同步（docs/短信接码-设计.md §6.3、§6.4、§6.6 第 23 条；crontab 每 10 分钟，GET + x-cron-secret 头，--max-time 240）。
 * 一趟：静态目录（每天北京时间 04 点，或从未同步过）→ 第 ① 层 getPrices 全量（只写 hash 变了的行）→ 预热热门服务的第 ② 层 offers
 * → 写 settings.sms_catalog_at（唯一写入方）。锁 jiema:catalog：上一趟没跑完这一趟直接返回。超过 60 分钟没同步成功推 sms.alert。
 * ?static=1 强制同步静态目录。响应只回计数（不回价格）。
 */
export async function GET(request: NextRequest) {
  const auth = assertCronAuth(request)
  if (!auth.ok) return error(auth.message, auth.status)
  try {
    const r = await runCatalogJob({ forceStatic: request.nextUrl.searchParams.get('static') === '1' })
    if (!r.ran) return success({ ran: false, busy: true, services: 0, changed: 0 })
    return success({
      ran: true,
      services: r.services,
      changed: r.changed,
      static: r.static ? { ok: r.static.ok, services: r.static.services, newServices: r.static.newServices, countries: r.static.countries } : null,
      prices: r.prices ? { ok: r.prices.ok, combos: r.prices.combos } : null,
      warmed: r.warmed.length,
      warmFailed: r.warmed.filter((w) => w.result === 'FAILED').length,
      pricesFails: r.state.pricesFails,
      catalogAt: r.state.catalogAt,
      error: r.state.lastError,
    })
  } catch (err) {
    console.error('[jiema] cron jiema-catalog 执行失败', err)
    return error('目录同步任务执行失败', 500)
  }
}
