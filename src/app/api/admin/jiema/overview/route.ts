export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { readSmsConfig, readCatalogState, PRICES_DEGRADE_AFTER } from '@/lib/jiema/config'
import { CATALOG_STALE_ALERT_MS } from '@/lib/jiema/catalog'
import { isHoldActive } from '@/lib/jiema/gate'
import { upstreamConfigured } from '@/lib/jiema/upstream'
import { JIEMA_ORDER_AVAILABLE, jiemaPublicOpen } from '@/lib/jiema-config-schema'

/**
 * 短信接码后台顶部的状态行（docs/短信接码-设计.md §7.1 的 S1 部分）：销售状态、目录同步新鲜度、服务 / 国家 / 组合数、
 * 手动下架与停售的计数（出厂都为 0，附录 B 第 26 条）、两个系数与加价。S2 在这里接着加上游余额、在途占用、今日单量与成本利润。
 */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const now = new Date()
    const [cfg, state, svcOff, ctyOff, holds, rules] = await Promise.all([
      readSmsConfig(),
      readCatalogState(),
      prisma.smsService.count({ where: { status: 'OFF' } }),
      prisma.smsCountry.count({ where: { status: 'OFF' } }),
      prisma.smsHold.findMany({ select: { key: true, until: true, source: true } }),
      prisma.smsPriceRule.findMany({ select: { disabled: true } }),
    ])
    const activeHolds = holds.filter((h) => isHoldActive(h, now))
    const lastOk = state.catalogAt ? Date.parse(state.catalogAt) : 0
    return success({
      sale: {
        configOk: cfg.ok,
        configReason: cfg.ok ? null : cfg.reason,
        enabled: cfg.ok ? cfg.config.enabled : false,
        audience: cfg.ok ? cfg.config.audience : null,
        version: cfg.ok ? cfg.config.version : cfg.storedVersion,
        publicOpen: jiemaPublicOpen(cfg.ok ? cfg.config : null),
        orderAvailable: JIEMA_ORDER_AVAILABLE,
      },
      pricing: cfg.ok
        ? { saleCoef4: cfg.config.saleCoef4, costFx4: cfg.config.costFx4, markupCents: cfg.config.markupCents, minPriceCents: cfg.config.minPriceCents, rounding: cfg.config.rounding }
        : null,
      catalog: {
        ...state,
        stale: now.getTime() - lastOk > CATALOG_STALE_ALERT_MS,
        degraded: state.pricesFails >= PRICES_DEGRADE_AFTER,
      },
      manual: {
        servicesOff: svcOff,
        countriesOff: ctyOff,
        adminHolds: activeHolds.filter((h) => h.source === 'ADMIN').length,
        activeHolds: activeHolds.length,
        globalHold: activeHolds.some((h) => h.key === 'global'),
        disabledRules: rules.filter((r) => r.disabled).length,
        rules: rules.length,
      },
      upstream: { configured: upstreamConfigured() },
    })
  } catch (e) {
    console.error('[jiema] overview GET 失败', e)
    return error('读取概览失败', 500)
  }
}
