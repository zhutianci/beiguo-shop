export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { readCatalogState } from '@/lib/jiema/config'
import { refreshOffers, runCatalogJob } from '@/lib/jiema/catalog'

/**
 * 目录同步（docs/短信接码-设计.md §6.3、§7.4「从上游刷新」）。
 * GET：同步状态（sms_catalog_at）。POST { part: 'all' | 'static' | 'prices' | 'offers', service? }：
 *  · all / static / prices：跑与 cron 同一个 runCatalogJob（同一把锁，sms_catalog_at 仍只有它写；正在跑时返回「正在同步」）；
 *  · offers + service：只刷新这一个服务的第 ② 层（单飞）。
 * 都是只读上游（getServicesList / getCountries / getOperators / getPrices / offers），不花钱。写审计。
 */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    return success({ state: await readCatalogState() })
  } catch (e) {
    console.error('[jiema] catalog GET 失败', e)
    return error('读取同步状态失败', 500)
  }
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const body = (await request.json().catch(() => null)) as { part?: unknown; service?: unknown } | null
    const part = body?.part
    const admin = await getCurrentUser()
    const audit = (detail: unknown) =>
      writeAudit(null, { actorUserId: admin?.id ?? null, actorKind: 'PLATFORM', action: 'jiema.catalog.sync', targetType: 'setting', targetId: 'sms_catalog_at', diff: detail, req: request })
    if (part === 'offers') {
      const service = typeof body?.service === 'string' ? body.service : ''
      if (!/^[a-z0-9]{2,4}$/.test(service)) return error('服务代码不合法')
      const r = await refreshOffers(service)
      await audit({ part, service, result: r })
      if (r === 'BUSY') return error('这个服务正在刷新，请稍后再看', 409)
      if (r === 'FAILED') return error('刷新失败（上游暂时不可用或限流），请稍后再试', 502)
      return success({ result: r }, r === 'EMPTY' ? '已刷新：这个服务目前全部售罄' : '已刷新')
    }
    if (part !== 'all' && part !== 'static' && part !== 'prices') return error('part 只能是 all / static / prices / offers')
    const r = await runCatalogJob({ forceStatic: part !== 'prices', skipPrices: part === 'static', warm: part === 'all' })
    if (!r.ran) return error('目录正在同步（定时任务或别的管理员），请稍后刷新页面', 409)
    await audit({ part, static: r.static ? { ok: r.static.ok, errors: r.static.errors } : null, prices: r.prices ? { ok: r.prices.ok, error: r.prices.error ?? null } : null })
    return success({ state: r.state, static: r.static ?? null, prices: r.prices ?? null, warmed: r.warmed }, r.state.lastError ? `部分失败：${r.state.lastError}` : '已同步')
  } catch (e) {
    console.error('[jiema] catalog POST 失败', e)
    return error('同步失败', 500)
  }
}
