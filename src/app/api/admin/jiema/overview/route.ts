export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { readSmsConfig, readCatalogState, PRICES_DEGRADE_AFTER } from '@/lib/jiema/config'
import { CATALOG_STALE_ALERT_MS, STATIC_STALE_ALERT_MS } from '@/lib/jiema/catalog'
import { isHoldActive } from '@/lib/jiema/gate'
import { upstreamConfigured } from '@/lib/jiema/upstream'
import { JIEMA_ORDER_AVAILABLE, jiemaPublicOpen } from '@/lib/jiema-config-schema'
import { jiemaOverviewS2 } from '@/lib/jiema/admin-orders'
import { lastUnlinked } from '@/lib/jiema/unlinked'
import { lastJiemaReconcile } from '@/lib/jiema/reconcile'

/**
 * 短信接码后台「概览」（docs/短信接码-设计.md §7.1）：
 *  · S1：销售状态、目录同步新鲜度、服务 / 国家 / 组合数、手动下架与停售的计数（出厂都为 0，附录 B 第 26 条）、两个系数与加价；
 *  · S2b：`s2` = 上游余额（告警线 $2，不停售）、在途占用（口径 A / B / C，与 E26 判定逐字相同）、可售余量、今日因上游余额不足拒单次数、
 *    上游口径成功率、推进心跳、熔断、线程、今日单量与营收 / 真实成本 / 毛利（§9.5）、需要处理（MANUAL、可退入余额的待核实到账）、
 *    组合成功率与毛利（近 7 天，≥5 单）。S2 部分读失败不影响 S1 部分（s2 为 null、s2Error 给原因）。
 *  · S4：`s4` = 未关联激活快照（外部激活 / 旧链路遗留的计数，jiema-tick 每 10 分钟）与最近一次每日对账的摘要（「需要处理」里的两行）。
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
    let s2: Awaited<ReturnType<typeof jiemaOverviewS2>> | null = null
    let s2Error: string | null = null
    try {
      s2 = await jiemaOverviewS2()
    } catch (e) {
      console.error('[jiema] overview S2 部分失败', e)
      s2Error = (e as Error)?.message?.slice(0, 200) ?? '读取失败'
    }
    let s4: { unlinked: unknown; recon: unknown } | null = null
    try {
      const [ul, rc] = await Promise.all([lastUnlinked(), lastJiemaReconcile()])
      s4 = {
        unlinked: ul ? { at: ul.at, ok: ul.ok, reason: ul.reason ?? null, total: ul.total, externalCount: ul.externalCount, legacyCount: ul.legacyCount } : null,
        recon: rc ? { at: rc.at, ok: rc.ok, failed: rc.items.filter((i) => !i.ok).map((i) => i.code), lossOrders: rc.fixes.lossOrders.length, upstreamOk: rc.upstream.ok || !!rc.upstream.skipped } : null,
      }
    } catch (e) {
      console.error('[jiema] overview S4 部分失败', e)
    }
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
        /** 服务 / 国家 / 运营商（静态目录）超过 26 小时没同步成功（getPrices 成功盖不住它，单独显示） */
        staticStale: now.getTime() - (state.staticAt ? Date.parse(state.staticAt) : 0) > STATIC_STALE_ALERT_MS,
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
      holds: activeHolds.map((h) => ({ key: h.key, until: h.until ? h.until.toISOString() : null, source: h.source })),
      s2,
      s2Error,
      s4,
    })
  } catch (e) {
    console.error('[jiema] overview GET 失败', e)
    return error('读取概览失败', 500)
  }
}
