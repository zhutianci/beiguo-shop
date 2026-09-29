/**
 * 短信接码 S1 纯函数自测（不连库、不发请求）：
 *   npx tsx scripts/check-jiema-pricing.ts
 *
 * 对应 docs/短信接码-设计.md：
 *   · §12.1 第 1 条 定价（§4.7 表格逐行到分、0.8 规则判定、最低售价、到角、到角 + 最低售价、改配置、系数上下边界、成本为 0、BigInt 不溢出）；
 *   · 第 2 条 cap（毛利护栏按成本汇率、不低于成本、100 微美元向下取整、传给上游至少 6700、realCost(cap) ≤ 售价 − 最低毛利）；
 *   · 第 3 条 报价成本（defaultPrice=0 取最低有货档、retail≠min 取较大、map 为空不可售）；
 *   · 第 7 条 DTO（序列化结果里遍历键名，被禁止的字段一个都没有）；
 *   · 第 99 条 的 S1 部分：「起价」只在可售组合里取（按 OFFERS / PRICES 两种数据源分别断言）、列表价 = 下单价（到分 / 到角 / 最低售价兜底 /
 *     覆盖规则 y 四种情况）。waitUntil 那一半属于 S2 的引擎；
 *   · sms_config 的 zod（出厂值、各项边界、保存时的拒绝项与二次确认）、对谁开放（导航 / sitemap / canUseForJiema 同一个判定）、
 *     覆盖规则的优先级、gate 列表层 ①–④、库存等级与约数、地区命名（D44）、种子（不匹配上游代码）。
 */
import {
  usdToCentsCeil,
  salePriceCents,
  realCostCents,
  capMicro,
  effCapMicro,
  microToUsd4,
  meetsLegacyRatio,
  legacyFloorCents,
  quoteCostMicro,
  offerSellable,
  offerStock,
  stockLevelOf,
  stockApprox,
  resolveRule,
  parseScopeKey,
  priceCombo,
  fmtYuan,
  canonicalScopeKey,
  canonicalHoldKey,
  legacyRatioFailures,
  LEGACY_GUARDED_SERVICES,
  type PriceRuleLike,
} from '../src/lib/jiema/pricing'
import {
  FACTORY_SMS_CONFIG,
  checkSmsConfig,
  smsConfigSaveBlockers,
  smsConfigWarnings,
  jiemaPublicOpen,
  jiemaAccessFor,
  parseSmsConfigRaw,
  smsStoredVersionOf,
  JIEMA_ORDER_AVAILABLE,
  settingsNumberValue,
  type SmsConfig,
} from '../src/lib/jiema-config-schema'
import { comboBlock, globalHold, holdReasonText, isHoldActive, adminHoldConflict, type GateData, type HoldLike } from '../src/lib/jiema/gate'
import {
  serviceFromPrice,
  comboPrice,
  recommendedOrder,
  compactOffers,
  invertPrices,
  seedForService,
  allServiceSeeds,
  countrySeed,
  forcedCountryName,
  flagOf,
  operatorDisplayName,
  joinAliases,
  splitAliases,
  staticDue,
  EXCLUDED_SERVICES,
  serviceSeenCutoffFrom,
  catalogCodesValid,
  SERVICE_SEEN_WITHIN_MS,
  STATIC_STALE_ALERT_MS,
} from '../src/lib/jiema/catalog'
import { FORBIDDEN_BUYER_KEYS, collectKeyNames, toCatalogCountry, toCatalogService } from '../src/lib/jiema/dto'
import { parseCatalogState } from '../src/lib/jiema/config'
import { HOLD_KEY_RE, legacyFor, parseCsv, onlyChanged } from '../src/lib/jiema/admin'
import { readFileSync } from 'fs'
import { join } from 'path'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string, extra = '') {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.log(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
function throws(fn: () => unknown): boolean {
  try {
    fn()
    return false
  } catch {
    return true
  }
}
const cfg = (over: Partial<SmsConfig> = {}): SmsConfig => ({ ...FACTORY_SMS_CONFIG, ...over })
const sale = (c: SmsConfig, markup = c.markupCents) => ({ saleCoef4: c.saleCoef4, markupCents: markup, minPriceCents: c.minPriceCents, rounding: c.rounding })
const capP = (c: SmsConfig, tol = c.tolerancePct) => ({ costFx4: c.costFx4, tolerancePct: tol, minMarginCents: c.minMarginCents })

console.log('\n【§12.1 第 1 条 定价：§4.7 表格逐行（出厂值 x=8.00、成本汇率 7.20、y=¥1.50、最低 ¥1.00、到分）】')
{
  const F = cfg()
  ok(F.saleCoef4 === 80000 && F.costFx4 === 72000 && F.markupCents === 150 && F.minPriceCents === 100 && F.rounding === 'CENT' && F.tolerancePct === 25 && F.minMarginCents === 50, '出厂值：x 8.00 / 成本汇率 7.20 / y ¥1.50 / 最低 ¥1.00 / 到分 / 容差 25% / 最低毛利 ¥0.50')
  const rows: Array<[string, number, number, number, number, number, number?, number?]> = [
    // [名字, 成本微美元, 售价, 真实成本, 利润, cap, 按 cap 成交的真实成本?, 利润?]
    ['$0.01', 10_000, 158, 8, 150, 12_500, 9, 149],
    ['$0.024（ot/印尼）', 24_000, 170, 18, 152, 30_000, 22, 148],
    ['$0.6（ot/美国）', 600_000, 630, 432, 198, 750_000, 540, 90],
    ['$2.4', 2_400_000, 2070, 1728, 342, 2_805_500, 2020, 50],
  ]
  for (const [name, cost, price, real, profit, cap, capReal, capProfit] of rows) {
    const p = salePriceCents(cost, sale(F))
    const r = realCostCents(cost, F.costFx4)
    const c = capMicro(cost, p, capP(F))
    ok(p === price && r === real && p - r === profit && c === cap, `${name} → 售价 ${price} / 真实成本 ${real} / 利润 ${profit} / cap ${cap}`, `得到 ${p}/${r}/${p - r}/${c}`)
    if (capReal != null) ok(realCostCents(c, F.costFx4) === capReal && p - realCostCents(c, F.costFx4) === capProfit, `  …按 cap 成交：真实成本 ${capReal}、利润 ${capProfit}`)
  }
  // dr/美国 $0.66 覆盖 y=¥4.40
  const pDr = salePriceCents(660_000, sale(F, 440))
  const cDr = capMicro(660_000, pDr, capP(F))
  ok(pDr === 968 && realCostCents(660_000, F.costFx4) === 476 && pDr - 476 === 492 && cDr === 825_000, 'dr/美国 $0.66 覆盖 y=¥4.40 → 968 / 476 / 492、cap 825,000')
  ok(realCostCents(cDr, F.costFx4) === 594 && pDr - 594 === 374, '  …按 cap 成交：真实成本 594、利润 374')
  ok(salePriceCents(660_000, sale(F)) === 678, '  …没有规则时 528 + 150 = ¥6.78（比「Codex 美区」×0.8 低）')
  ok(meetsLegacyRatio(968, 1200) && meetsLegacyRatio(960, 1200) && !meetsLegacyRatio(959, 1200), '0.8 规则：968 ≥ 1200×0.8；960 通过、959 不通过')
  ok(legacyFloorCents(1200) === 960 && legacyFloorCents(1201) === 961 && legacyFloorCents(999) === 800, '0.8 规则的下限（向上取整到分）：1200 → 960、1201 → 961、999 → 800')
  ok(salePriceCents(10_000, sale(F, 30)) === 100, '最低售价生效：y=¥0.30、$0.01 → 8 + 30 = 38 → ¥1.00')
  ok(salePriceCents(10_000, { ...sale(F), rounding: 'JIAO' }) === 160, '取整到角：158 → 160')
  const j = salePriceCents(10_000, { saleCoef4: 80000, markupCents: 30, minPriceCents: 105, rounding: 'JIAO' })
  ok(j === 110 && j % 10 === 0, '取整到角 + 最低售价 105：max(38, 105) = 105 → 110（先兜底再取整，结果是 10 的倍数）', String(j))
  ok(salePriceCents(10_000, { saleCoef4: 80000, markupCents: 30, minPriceCents: 105, rounding: 'CENT' }) === 105, '  …到分时就是 105（两种顺序结果相同）')
  const G = cfg({ saleCoef4: 75000, markupCents: 200 })
  ok(salePriceCents(24_000, sale(G)) === 218 && salePriceCents(600_000, sale(G)) === 650, '改配置（x=7.50、y=¥2.00）按新值：$0.024 → 18 + 200 = 218；$0.6 → 450 + 200 = 650')
  ok(salePriceCents(10_000, { saleCoef4: 10000, markupCents: 0, minPriceCents: 1, rounding: 'CENT' }) === 1 && salePriceCents(10_000, { saleCoef4: 300000, markupCents: 0, minPriceCents: 1, rounding: 'CENT' }) === 30, '售价系数上下边界 1.00 / 30.00：$0.01 → 1 分 / 30 分')
  ok(realCostCents(1_000_000, 50000) === 500 && realCostCents(1_000_000, 90000) === 900, '成本汇率上下边界 5.00 / 9.00：$1 → 500 / 900 分')
  ok(throws(() => salePriceCents(0, sale(F))) && priceCombo(0, { markupCents: 150, tolerancePct: 25, ruleKey: null }, { ...sale(F), ...capP(F) }) === null && priceCombo(null, { markupCents: 150, tolerancePct: 25, ruleKey: null }, { ...sale(F), ...capP(F) }) === null, '成本为 0 时拒绝报价（salePriceCents 抛错、priceCombo 返回 null）')
  ok(salePriceCents(25_000_000, { saleCoef4: 300000, markupCents: 150, minPriceCents: 100, rounding: 'CENT' }) === 75_150, 'BigInt 不溢出：成本 $25、saleCoef4=300000 → 75,000 + 150')
  ok(usdToCentsCeil(123_456_789, 299_999) === Math.ceil(Number((BigInt(123_456_789) * BigInt(299_999)).toString()) / 1e8), '大数：usdToCentsCeil 与 BigInt 手算一致')
  ok(throws(() => usdToCentsCeil(-1, 80000)) && throws(() => usdToCentsCeil(1.5, 80000)) && throws(() => usdToCentsCeil(1, 0)), '非法输入（负数、小数、系数 0）抛错')
}

console.log('\n【§12.1 第 2 条 cap】')
{
  const F = cfg()
  ok(capMicro(2_400_000, 2070, { costFx4: 72000, tolerancePct: 25, minMarginCents: 5000 }) === 2_400_000, 'byMargin < 成本时取成本（最低毛利设成 ¥50，护栏为 0）')
  ok(capMicro(24_050, 170, capP(F)) % 100 === 0 && capMicro(24_050, 170, capP(F)) === 30_000, '按 100 微美元向下取整（byTol 30,062 → 30,000）')
  ok(effCapMicro(5000) === 6700 && effCapMicro(12_500) === 12_500 && microToUsd4(effCapMicro(5000)) === '0.0067' && microToUsd4(2_805_500) === '2.8055', '传给上游时至少 6700（$0.0067），4 位小数字符串')
  // 护栏按成本汇率算、不按 x：同一组数据下换成除以 x 会得到更小的 cap
  const p = salePriceCents(2_400_000, sale(F))
  const byFx = capMicro(2_400_000, p, capP(F))
  const byX = capMicro(2_400_000, p, { costFx4: F.saleCoef4, tolerancePct: 25, minMarginCents: 50 })
  ok(byFx > byX, '毛利护栏除以成本汇率（除以 x 会把 cap 压得更低）', `${byFx} vs ${byX}`)
  // 性质：cap 由毛利护栏决定、且护栏 ≥ 成本时，realCostCents(cap) ≤ 售价 − 最低毛利
  let bad = 0
  let tested = 0
  for (let cost = 10_000; cost <= 5_000_000; cost += 37_123) {
    for (const markup of [0, 30, 150, 440]) {
      for (const minMargin of [0, 50, 200]) {
        const price = salePriceCents(cost, { saleCoef4: 80000, markupCents: markup, minPriceCents: 100, rounding: 'CENT' })
        const byTol = Math.floor((cost * 125) / 100)
        const byMargin = Number((BigInt(Math.max(0, price - minMargin)) * BigInt(100_000_000)) / BigInt(72000))
        if (byMargin < cost) continue // 成本被抬高时不适用（cap 取成本）
        tested++
        const c = capMicro(cost, price, { costFx4: 72000, tolerancePct: 25, minMarginCents: minMargin })
        if (c < cost - 99 || c > byTol || realCostCents(c, 72000) > price - minMargin) bad++
      }
    }
  }
  ok(bad === 0 && tested > 100, `性质（${tested} 组）：成本不被抬高时 realCostCents(cap) ≤ 售价 − 最低毛利、cap ≤ 成本 × 1.25`)
}

console.log('\n【§12.1 第 3 条 报价成本与可售】')
{
  ok(quoteCostMicro({ retailMicro: 900_000, minMicro: 900_000, defaultCount: 0, tiers: [[1_048_300, 204], [1_159_300, 793], [2_483_100, 46_024]] }) === 1_048_300, 'defaultPrice=0 时取 map 最小的键（规格示例 tg/48：$1.0483，不是 retail $0.9）')
  ok(quoteCostMicro({ retailMicro: 45_000, minMicro: 50_000, defaultCount: 63, tiers: [[45_000, 79_335]] }) === 50_000, 'retail ≠ min 时取较大值')
  ok(quoteCostMicro({ retailMicro: 45_000, minMicro: null, defaultCount: 63, tiers: [] }) === 45_000, 'min 缺省时用 retail')
  const empty = { retailMicro: 45_000, minMicro: 45_000, defaultCount: 0, tiers: [] as Array<[number, number]> }
  ok(!offerSellable(empty, 60_000), 'defaultPrice=0 且 map 为空 → 不可售（售罄）')
  ok(quoteCostMicro({ retailMicro: null, minMicro: null, defaultCount: 5, tiers: [] }) === null && quoteCostMicro({ retailMicro: 0, minMicro: 0, defaultCount: 5, tiers: [] }) === null, '拿不到价 / 价为 0 → 不可售（null）')
  const tg48 = { retailMicro: 900_000, minMicro: 900_000, defaultCount: 0, tiers: [[1_048_300, 204], [1_159_300, 793], [2_483_100, 46_024]] as Array<[number, number]> }
  ok(offerSellable(tg48, 1_048_300) && !offerSellable(tg48, 1_000_000), 'map 里有 ≤ cap 的档位才可售（cap 低于最低档 → 不可售）')
  ok(offerStock(tg48, 1_300_000) === 793 && offerStock(tg48, 1_048_300) === 204, '库存展示：defaultPrice=0 时取 ≤ cap 的档位里最大的累计值')
  ok(offerStock({ retailMicro: 45_000, minMicro: 45_000, defaultCount: 63, tiers: [[45_000, 79_335]] }, 56_000) === 63, 'defaultPrice > 0 时取 min(defaultPrice, ≤ cap 的最大累计值)（dr/16：63，不是 79,335）')
  ok(offerStock({ retailMicro: 45_000, minMicro: 45_000, defaultCount: 63, tiers: [] }, 56_000) === 63, '  …没有档位时就是 defaultPrice')
}

console.log('\n【库存等级（§1.6、D26）与约数】')
{
  ok(stockLevelOf(1000, true) === 'PLENTY' && stockLevelOf(999, true) === 'MANY' && stockLevelOf(100, true) === 'MANY' && stockLevelOf(99, true) === 'LOW' && stockLevelOf(1, true) === 'LOW' && stockLevelOf(0, true) === 'OUT', '三档：≥1000 充足、100–999 较多、1–99 紧张、0 售罄')
  ok(stockLevelOf(160_000, false) === 'AVAILABLE' && stockLevelOf(0, false) === 'OUT', '只有第 ① 层数据：只「有货」，不评「充足」（getPrices 的 count 会严重高估）')
  ok(stockApprox(330_000) === '33 万' && stockApprox(12_000) === '1.2 万' && stockApprox(10_000) === '1 万' && stockApprox(870) === '870' && stockApprox(99_999) === '9.9 万', '约数：33 万、1.2 万、1 万、870、9.9 万')
}

console.log('\n【覆盖规则（§4.3）】')
{
  const rules: PriceRuleLike[] = [
    { scopeKey: 'dr:187', markupCents: 440, tolerancePct: null, disabled: false },
    { scopeKey: 'dr:*', markupCents: 300, tolerancePct: 30, disabled: false },
    { scopeKey: '*:187', markupCents: 200, tolerancePct: 10, disabled: false },
    { scopeKey: 'wb:*', markupCents: null, tolerancePct: null, disabled: true },
  ]
  const G = { markupCents: 150, tolerancePct: 25 }
  const a = resolveRule(rules, 'dr', 187, G)
  ok(a.markupCents === 440 && a.tolerancePct === 30 && a.ruleKey === 'dr:187' && !a.disabled, '服务:国家 > 服务:* > *:国家：y 取 dr:187，容差取 dr:*（逐项取最具体的非空值）')
  const b = resolveRule(rules, 'dr', 6, G)
  ok(b.markupCents === 300 && b.tolerancePct === 30 && b.ruleKey === 'dr:*', '没有精确规则 → 服务:*')
  const c = resolveRule(rules, 'tg', 187, G)
  ok(c.markupCents === 200 && c.tolerancePct === 10 && c.ruleKey === '*:187', '只有 *:国家 → 用它')
  const d = resolveRule(rules, 'tg', 6, G)
  ok(d.markupCents === 150 && d.tolerancePct === 25 && d.ruleKey === null && !d.disabled, '都没有 → 全局配置')
  ok(resolveRule(rules, 'wb', 3, G).disabled && resolveRule(new Map(rules.map((r) => [r.scopeKey, r])), 'wb', 6, G).disabled, 'disabled 规则 → 组合停售（Map 与数组两种输入结果一致）')
  ok(!!parseScopeKey('dr:187') && !!parseScopeKey('acz:*') && !!parseScopeKey('*:6') && !parseScopeKey('*:*') && !parseScopeKey('DR:187') && !parseScopeKey('dr:1000') && !parseScopeKey('toolong:1'), 'scopeKey 格式：dr:187 / acz:* / *:6 合法；*:*、大写、4 位国家、超长服务不合法')
}

console.log('\n【sms_config 的 zod（§5.3、§7.3）】')
{
  ok(checkSmsConfig(FACTORY_SMS_CONFIG).ok, '出厂配置通过')
  const bad = (over: Record<string, unknown>, field: string) => {
    const r = checkSmsConfig({ ...FACTORY_SMS_CONFIG, ...over })
    return !r.ok && Object.keys(r.errors).some((k) => k === field || k.startsWith(field + '.'))
  }
  ok(bad({ saleCoef4: 9999 }, 'saleCoef4') && bad({ saleCoef4: 300001 }, 'saleCoef4') && checkSmsConfig(cfg({ saleCoef4: 10000 })).ok && checkSmsConfig(cfg({ saleCoef4: 300000 })).ok, '售价系数 1.00–30.00（边界通过、越界拒绝）')
  ok(bad({ costFx4: 49999 }, 'costFx4') && bad({ costFx4: 90001 }, 'costFx4') && bad({ costFx4: 80000.5 }, 'costFx4'), '成本汇率 5.00–9.00（超出多半是把 x 填错了位置）、必须整数')
  ok(bad({ minPriceCents: 0 }, 'minPriceCents') && bad({ minPriceCents: 5001 }, 'minPriceCents') && checkSmsConfig(cfg({ minPriceCents: 1 })).ok, '最低售价 ¥0.01–¥50.00（必须 > 0）')
  ok(bad({ markupCents: -1 }, 'markupCents') && bad({ markupCents: 5001 }, 'markupCents'), '加价 0–50 元')
  ok(bad({ rounding: 'YUAN' }, 'rounding') && bad({ audience: 'SOME' }, 'audience') && bad({ maxReplace: 11 }, 'maxReplace') && bad({ enabled: 'yes' }, 'enabled'), '取整、受众、换号次数（0–10）、开关类型')
  ok(bad({ hotServices: ['dr', 'dr'] }, 'hotServices') && bad({ hotServices: ['DR'] }, 'hotServices'), '热门服务不能重复、必须是合法代码')
  ok(bad({ limits: { ...FACTORY_SMS_CONFIG.limits, perDay: 0 } }, 'limits') && bad({ breaker: { ...FACTORY_SMS_CONFIG.breaker, minRatio: 1.5 } }, 'breaker'), '嵌套项（limits、breaker）逐项校验')
  const noRate = { ...FACTORY_SMS_CONFIG } as Record<string, unknown>
  delete noRate.costFx4
  ok(!checkSmsConfig(noRate).ok, '缺字段 → 校验不过（读取时 fail-closed，不回落出厂值）')
  ok(Object.keys(smsConfigSaveBlockers(cfg({ audience: 'ALL' }), false)).includes('audience') && !Object.keys(smsConfigSaveBlockers(cfg({ audience: 'ALL' }), true)).includes('audience'), '保存时：S2 之前受众不能选「全部用户」（S2 交付后放行）')
  ok(['resellerMode', 'webhookEnabled', 'legacyOnNewEngine'].every((k) => Object.keys(smsConfigSaveBlockers(cfg({ [k]: true } as Partial<SmsConfig>), true)).includes(k)), '保存时：P2 预留的三个开关（转售商、Webhook、旧单品迁入）不能打开')
  ok(Object.keys(smsConfigSaveBlockers(cfg(), false)).length === 0, '出厂配置保存没有拒绝项')
  const w = smsConfigWarnings(cfg({ saleCoef4: 70000 }))
  ok(w.needConfirm.length === 1 && smsConfigWarnings(cfg()).needConfirm.length === 0, 'x < 成本汇率 → 要二次确认')
  ok(smsConfigWarnings(cfg({ markupCents: 20, minPriceCents: 40 })).warnings.length === 1 && smsConfigWarnings(cfg()).warnings.length === 0, 'y < 最低毛利、最低售价也兜不住 → 警告「部分组合没有容差」')
  ok(smsStoredVersionOf(null) === 0 && smsStoredVersionOf('{bad') === 0 && smsStoredVersionOf('{"version":7}') === 7 && smsStoredVersionOf('{"version":-1}') === 0, 'storedVersion：坏配置也能拿到版本号（从页面修好）')
  ok(parseSmsConfigRaw(JSON.stringify(FACTORY_SMS_CONFIG)) !== null && parseSmsConfigRaw('{"enabled":true,"audience":"ALL"}') === null && parseSmsConfigRaw('{bad') === null, 'parseSmsConfigRaw：只有两个字段 / 坏 JSON → null（B0 已知限制在 S1 收口）')
}

console.log('\n【对谁开放（D28；导航、sitemap、canUseForJiema、目录接口同一个判定）】')
{
  const open = cfg({ enabled: true, audience: 'ALL' })
  ok(jiemaPublicOpen(open, true) && !jiemaPublicOpen(open, false), '对全部用户开放 = 接码下单已交付 && enabled && ALL')
  ok(JIEMA_ORDER_AVAILABLE === false && !jiemaPublicOpen(open), 'S1：JIEMA_ORDER_AVAILABLE=false → 不开放（导航看不到、sitemap 没有 /jiema）')
  ok(!jiemaPublicOpen(cfg({ enabled: true, audience: 'ADMIN_ONLY' }), true) && !jiemaPublicOpen(cfg({ enabled: false, audience: 'ALL' }), true) && !jiemaPublicOpen(null, true), '仅管理员 / 总开关关 / 配置读不到 → 不开放')
  ok(jiemaAccessFor(open, false, true) === 'OPEN' && jiemaAccessFor(open, true, true) === 'OPEN', '开放后：所有人 OPEN')
  ok(jiemaAccessFor(cfg(), true) === 'ADMIN_PREVIEW' && jiemaAccessFor(cfg({ enabled: true }), true) === 'ADMIN_PREVIEW', '灰度 / 总开关关：管理员预览')
  ok(jiemaAccessFor(cfg(), false) === 'SOON' && jiemaAccessFor(cfg({ enabled: true, audience: 'ADMIN_ONLY' }), false) === 'SOON', '普通用户：即将开放')
  ok(jiemaAccessFor(cfg({ enabled: false, audience: 'ALL' }), false, true) === 'MAINTENANCE', '曾经对全部用户开放、现在总开关关 → 维护中')
  ok(jiemaAccessFor(null, true) === 'MAINTENANCE' && jiemaAccessFor(null, false) === 'MAINTENANCE', '配置读不到 → 所有人维护中（fail-closed）')
}

console.log('\n【gate 列表层 ①–④（§6.1；三种手动停售出厂都为空）】')
{
  const now = new Date('2026-09-29T10:00:00Z')
  const G = { markupCents: 150, tolerancePct: 25 }
  const mk = (holds: HoldLike[] = [], offS: string[] = [], offC: number[] = [], rules: PriceRuleLike[] = []): GateData => ({
    holds: new Map(holds.map((h) => [h.key, h])),
    offServices: new Set(offS),
    offCountries: new Set(offC),
    rules: new Map(rules.map((r) => [r.scopeKey, r])),
  })
  ok(comboBlock(mk(), 'wb', 3, now, G) === null && comboBlock(mk(), 'hw', 3, now, G) === null && comboBlock(mk(), 'aon', 187, now, G) === null, '出厂（三处都空）：微信、支付宝、币安、中国 +86 都可售（D25 不屏蔽任何平台）')
  const h = (key: string, until: Date | null, source = 'ADMIN', reason = 'ADMIN'): HoldLike => ({ key, until, reason, source })
  ok(comboBlock(mk([h('global', null, 'AUTO', 'BREAKER')]), 'tg', 6, now, G)?.code === 'MAINTENANCE', '① global 有效 → MAINTENANCE')
  ok(comboBlock(mk([h('svc:wb', null)]), 'wb', 3, now, G)?.kind === 'svc' && comboBlock(mk([h('country:3', null)]), 'wb', 3, now, G)?.kind === 'country' && comboBlock(mk([h('combo:wb:3', null)]), 'wb', 3, now, G)?.kind === 'combo', '② svc: / country: / combo: 任一有效 → HOLD')
  ok(comboBlock(mk([h('svc:wb', new Date(now.getTime() - 1000))]), 'wb', 3, now, G) === null && comboBlock(mk([h('svc:wb', new Date(now.getTime() + 1000))]), 'wb', 3, now, G) !== null, '  …until 已过 → 不再停售；未到 → 停售')
  ok(comboBlock(mk([h('threads', null, 'UPSTREAM', 'CHANNELS_LIMIT')]), 'tg', 6, now, G) === null, '  …threads 不是停售（按剩余线程收单，E5；只在下单时看）')
  ok(comboBlock(mk([], ['wb']), 'wb', 3, now, G)?.kind === 'svcOff' && comboBlock(mk([], [], [3]), 'wb', 3, now, G)?.kind === 'countryOff', '③ 服务 / 国家 status=OFF → HOLD')
  ok(comboBlock(mk([], [], [], [{ scopeKey: 'wb:*', markupCents: null, tolerancePct: null, disabled: true }]), 'wb', 3, now, G)?.kind === 'disabled', '④ disabled 覆盖规则 → HOLD')
  ok(isHoldActive({ until: null }, now) && !isHoldActive(null, now), 'isHoldActive：until 为空 = 需要手动解除')
  ok(globalHold(mk([h('global', null, 'AUTO', 'BREAKER')]), now)?.key === 'global' && globalHold(mk(), now) === null, 'globalHold')
  const auto = comboBlock(mk([h('combo:dr:187', new Date('2026-09-29T10:40:00Z'), 'AUTO', 'LOW_SUCCESS')]), 'dr', 187, now, G)!
  ok(holdReasonText(auto, now) === '近期成功率低，暂停到 18:40', '暂停原因（北京时间）：「近期成功率低，暂停到 18:40」', holdReasonText(auto, now))
  ok(holdReasonText(comboBlock(mk([h('svc:wb', null, 'ADMIN', 'ADMIN')]), 'wb', 3, now, G)!, now) === '暂停销售' && holdReasonText(comboBlock(mk([], ['wb']), 'wb', 3, now, G)!, now) === '暂停销售', '手动停售 / 下架：「暂停销售」（不回显备注原文）')
  ok(HOLD_KEY_RE.test('svc:wb') && HOLD_KEY_RE.test('combo:dr:187') && HOLD_KEY_RE.test('country:3') && HOLD_KEY_RE.test('global') && !HOLD_KEY_RE.test('threads') && !HOLD_KEY_RE.test('svc:WB') && !HOLD_KEY_RE.test('combo:dr'), '后台手动停售的范围格式（threads 不是手动项）')
}

console.log('\n【§12.1 第 99 条（S1 部分）：「起价」只在可售组合里取；列表价 = 下单价】')
{
  const now = new Date('2026-09-29T10:00:00Z')
  const F = cfg()
  const empty: GateData = { holds: new Map(), offServices: new Set(), offCountries: new Set(), rules: new Map() }
  // OFFERS：tg/6 $0.15、tg/48（defaultPrice=0 → 最低有货档 $1.0483）、tg/52 不可售（null）
  const offersEntries: Array<[number, number | null]> = [[6, 150_000], [48, 1_048_300], [52, null]]
  const r1 = serviceFromPrice({ kind: 'OFFERS', entries: offersEntries }, empty, 'tg', F, now)
  ok(r1.fromCents === salePriceCents(150_000, sale(F)) && r1.fromCents === 270 && !r1.approx && r1.level === 'OK', 'OFFERS：「¥x 起」= 可售组合里最低（$0.15 → ¥2.70），approx=false')
  const onlyTg48 = serviceFromPrice({ kind: 'OFFERS', entries: [[48, 1_048_300], [52, null]] }, empty, 'tg', F, now)
  ok(onlyTg48.fromCents === salePriceCents(1_048_300, sale(F)), 'OFFERS：defaultPrice=0 的组合按最低有货档算（不是 retail）')
  const held: GateData = { ...empty, holds: new Map([['combo:tg:6', { key: 'combo:tg:6', until: null, reason: 'ADMIN', source: 'ADMIN' }]]) }
  ok(serviceFromPrice({ kind: 'OFFERS', entries: offersEntries }, held, 'tg', F, now).fromCents === salePriceCents(1_048_300, sale(F)), '  …最便宜的组合被停售（combo:）→ 起价跳到下一个可售组合')
  const offC: GateData = { ...empty, offCountries: new Set([6]) }
  ok(serviceFromPrice({ kind: 'OFFERS', entries: offersEntries }, offC, 'tg', F, now).fromCents === salePriceCents(1_048_300, sale(F)), '  …国家手动下架 → 同样跳过')
  const dis: GateData = { ...empty, rules: new Map([['tg:6', { scopeKey: 'tg:6', markupCents: null, tolerancePct: null, disabled: true }]]) }
  ok(serviceFromPrice({ kind: 'OFFERS', entries: offersEntries }, dis, 'tg', F, now).fromCents === salePriceCents(1_048_300, sale(F)), '  …disabled 规则 → 同样跳过')
  const svcOff: GateData = { ...empty, offServices: new Set(['tg']) }
  ok(serviceFromPrice({ kind: 'OFFERS', entries: offersEntries }, svcOff, 'tg', F, now).level === 'OUT', '  …服务手动下架 → 没有可售组合（OUT）')
  const svcHold: GateData = { ...empty, holds: new Map([['svc:tg', { key: 'svc:tg', until: null, reason: 'LOW_SUCCESS', source: 'AUTO' }]]) }
  ok(serviceFromPrice({ kind: 'OFFERS', entries: offersEntries }, svcHold, 'tg', F, now).fromCents === null, '  …svc: 停售 → 起价为空')
  // PRICES：按 getPrices 的 cost、count>0 才算，approx=true（「约 ¥x 起」）
  const p1 = serviceFromPrice({ kind: 'PRICES', entries: [[6, 24_000, 1000], [16, 10_000, 0], [187, 600_000, 5]] }, empty, 'ot', F, now)
  ok(p1.fromCents === 170 && p1.approx && p1.level === 'OK', 'PRICES：按 cost 算、count=0 的不算，approx=true（「约 ¥1.70 起」）')
  ok(serviceFromPrice({ kind: 'PRICES', entries: [[16, 10_000, 0]] }, empty, 'ot', F, now).level === 'OUT', 'PRICES：全部 count=0 → OUT（「暂无号码」）')
  // 列表价 = 下单价：四种情况下 comboPrice（列表 / 国家列表 / 预览 / 下单报价共用）与按同一份配置直接算 salePriceCents 相同
  const withRule: GateData = { ...empty, rules: new Map([['dr:187', { scopeKey: 'dr:187', markupCents: 440, tolerancePct: null, disabled: false }]]) }
  const cases: Array<[string, SmsConfig, GateData, string, number, number, number]> = [
    ['到分', F, empty, 'tg', 6, 150_000, salePriceCents(150_000, sale(F))],
    ['到角', cfg({ rounding: 'JIAO' }), empty, 'tg', 6, 150_000, 270],
    ['最低售价兜底', cfg({ markupCents: 30 }), empty, 'ds', 52, 10_000, 100],
    ['覆盖规则 y', F, withRule, 'dr', 187, 660_000, 968],
  ]
  for (const [name, c, g, s, cid, cost, expect] of cases) {
    const list = serviceFromPrice({ kind: 'OFFERS', entries: [[cid, cost]] }, g, s, c, now).fromCents
    const order = comboPrice(cost, g, s, cid, c)?.priceCents
    ok(list === expect && order === expect, `列表价 = 下单价（${name}）：${expect}`, `list=${list} order=${order}`)
  }
}

console.log('\n【推荐排序（§1.6）】')
{
  const rows = [
    { id: 6, priceCents: 170, level: 'PLENTY' as const, paused: null },
    { id: 4, priceCents: 186, level: 'LOW' as const, paused: null },
    { id: 16, priceCents: 186, level: 'PLENTY' as const, paused: null },
    { id: 52, priceCents: 200, level: 'OUT' as const, paused: null },
    { id: 48, priceCents: 225, level: 'MANY' as const, paused: '暂停销售' },
    { id: 187, priceCents: 588, level: 'LOW' as const, paused: null },
  ]
  const o = recommendedOrder(rows, { deliv: [4, 6, 187], rate: [16] })
  ok(o.slice(0, 4).join(',') === '6,4,187,16' || o.slice(0, 4).join(',') === '6,4,16,187', '先按到达率（4、6、187），「紧张」往后挪一位（4 与 6 换位）', o.join(','))
  ok(o.slice(-2).join(',') === '48,52', '售罄、暂停的排最后', o.join(','))
  ok(recommendedOrder([{ id: 1, priceCents: 100, level: 'PLENTY', paused: null, boost: 0 }, { id: 2, priceCents: 300, level: 'PLENTY', paused: null, boost: 5 }], { deliv: [1], rate: [] })[0] === 2, '后台排序加权大的排前面')
}

console.log('\n【§12.1 第 7 条 DTO：序列化结果里没有被禁止的字段】')
{
  const svc = toCatalogService({ code: 'tg', name: 'Telegram（电报）', en: 'Telegram', aliases: ['tg', '电报'], hot: 3, fromCents: 170, approx: false, level: 'OK' })
  const cty = toCatalogCountry({ id: 6, name: '印度尼西亚', en: 'Indonesia', iso2: 'ID', flag: 'id', dial: '62', priceCents: 170, approx: false, stock: 330_000, level: 'PLENTY', tags: ['推荐'], durationMin: 20, paused: null })
  // 往输入里多塞内部字段：显式构造的 DTO 会把它们丢掉
  const leaky = toCatalogCountry({ ...cty, ...({ costMicro: 1, capMicro: 2, saleCoef4: 3, costFx4: 4, markupCents: 5, ruleKey: 'x' } as object) } as typeof cty)
  const keys = collectKeyNames([svc, cty, leaky, { services: [svc], countries: [cty] }])
  const hit = FORBIDDEN_BUYER_KEYS.filter((k) => keys.has(k))
  ok(hit.length === 0, '目录 DTO 里搜不到 cost / cap / 两个系数 / 加价 / 覆盖规则 / 备注 / 原文', hit.join(','))
  ok(['costMicro', 'capMicro', 'saleCoef4', 'costFx4'].every((k) => FORBIDDEN_BUYER_KEYS.includes(k)), '禁止清单含 costMicro、capMicro、saleCoef4、costFx4')
}

console.log('\n【地区命名（D44）与种子（§1.5、§5.4、D25）】')
{
  ok(forcedCountryName(55) === '中国台湾' && forcedCountryName(14) === '中国香港' && forcedCountryName(20) === '中国澳门' && forcedCountryName(3) === null, '55 / 14 / 20 → 中国台湾 / 中国香港 / 中国澳门')
  ok(flagOf(55, 'TW') === null && flagOf(14, 'HK') === 'hk' && flagOf(187, 'US') === 'us' && flagOf(1, null) === null, '台湾不显示旗帜（中性图标）；其他小写 ISO2')
  ok(countrySeed(55)?.iso2 === 'TW' && countrySeed(55)?.dial === '886', '台湾的 ISO2 照常存（匹配区号用）')
  ok(countrySeed(3)?.cn === '中国' && countrySeed(3)?.dial === '86' && countrySeed(187)?.cn === '美国' && countrySeed(16)?.cn === '英国' && countrySeed(158)?.cn === '不丹', '国家种子：中国 +86、美国、英国、不丹（上游 chn 字段写成「丁烷」，不用它）')
  ok(EXCLUDED_SERVICES.has('full') && EXCLUDED_SERVICES.size === 1, '唯一的目录排除是 full（租号）；没有屏蔽名单')
  ok(seedForService('wb', 'WeChat')?.aliases.includes('wx') === true && seedForService('wx', 'Apple')?.aliases.includes('wx') === false, '「wx」是微信（wb）的别名，不给代码为 wx 的 Apple')
  ok(seedForService('kf', 'Weibo')?.aliases.includes('wb') === true && seedForService('lf', 'TikTok/Douyin')?.aliases.includes('dy') === true, '「wb」给微博（kf）、「dy」给抖音（lf）')
  ok(seedForService('za', 'JDcom') !== null && seedForService('za', 'Zalando') === null, '种子要求上游英文名包含 match（代码对错了宁可不填）')
  const seeds = allServiceSeeds()
  const cn = new Set(seeds.flatMap((s) => [s.cn, ...s.aliases]))
  ok(!cn.has('快手') && !cn.has('美团') && !cn.has('淘宝'), '快手、美团、淘宝上游没有单列服务，不配别名')
  ok(seeds.every((s) => /^[a-z0-9]{2,4}$/.test(s.code) && s.match && s.cn), '种子格式')
  ok(joinAliases(['tg', ' 电报 ', 'TG', '', 'a,b']) === 'tg,电报,a b' && splitAliases('tg,电报，飞机') .join('|') === 'tg|电报|飞机', '别名存取：去空、去重（不分大小写）、逗号换成空格')
  ok(operatorDisplayName('at_t', null) === 'AT&T' && operatorDisplayName('at_t', { at_t: 'AT&T 美国' }) === 'AT&T 美国' && operatorDisplayName('some_new_op', null) === 'Some New Op', '运营商显示名：后台映射 > 出厂映射 > 首字母大写')
}

console.log('\n【目录同步的纯函数】')
{
  const inv = invertPrices({ 6: { tg: { costMicro: 150_000, count: 10 }, full: { costMicro: 1, count: 1 }, dr: { costMicro: 45_000, count: 0 } }, 187: { tg: { costMicro: 600_000, count: 3 } } })
  ok(JSON.stringify(inv.get('tg')) === JSON.stringify({ 6: [150_000, 10], 187: [600_000, 3] }) && !inv.has('full') && !inv.has('dr'), 'getPrices 倒成按服务：去掉 full、没货的')
  const co = compactOffers(
    {
      offers: { tg: { 48: { defaultMicro: 1, retailMicro: 900_000, minMicro: 900_000, total: 5, physical: 1, defaultCount: 0, tiers: Array.from({ length: 15 }, (_, i) => [1_000_000 + i, i + 1] as [number, number]) } } },
      rateServices: ['tg'],
      rateCountries: { tg: [48] },
      deliverability: { tg: [48] },
    },
    'tg',
  )
  ok(co.countries['48'].tiers.length === 12 && co.order.deliv[0] === 48 && co.countries['48'].retail === 900_000 && !('total' in co.countries['48']), '第 ② 层压缩：最多 12 档、只留报价要的字段、带上游排序')
  const d = new Date('2026-09-29T20:10:00Z') // 北京时间 04:10
  ok(staticDue(null, d) && staticDue(new Date(d.getTime() - 21 * 3600_000).toISOString(), d) && !staticDue(new Date(d.getTime() - 3600_000).toISOString(), d), '静态目录：从未同步 / 北京时间 04 点且超过 20 小时 → 要跑；刚跑过不跑')
  ok(!staticDue(new Date(new Date('2026-09-29T08:00:00Z').getTime() - 21 * 3600_000).toISOString(), new Date('2026-09-29T08:00:00Z')) && staticDue(new Date(new Date('2026-09-29T08:00:00Z').getTime() - 27 * 3600_000).toISOString(), new Date('2026-09-29T08:00:00Z')), '  …不在 04 点只在超过 26 小时兜底')
  const st = parseCatalogState('{"catalogAt":"2026-09-29T10:00:00.000Z","pricesFails":2,"hotInit":true,"counts":{"services":726,"countries":195,"combos":20811}}')
  ok(st.pricesFails === 2 && st.hotInit && st.counts?.combos === 20811 && parseCatalogState('{bad').pricesFails === 0, '同步状态行：解析与坏行兜底')
}

console.log('\n【种子 SQL 与代码出厂值逐字相同（scripts/ops/jiema-s1-seed.sql）】')
{
  const sql = readFileSync(join(__dirname, 'ops', 'jiema-s1-seed.sql'), 'utf8')
  const m = /SELECT 'sms_config',\s*'(\{[^']*\})',/.exec(sql)
  ok(!!m && JSON.stringify(JSON.parse(m[1])) === JSON.stringify(FACTORY_SMS_CONFIG), '种子里的 sms_config JSON = FACTORY_SMS_CONFIG（键的顺序也一样）')
  ok(!!m && checkSmsConfig(JSON.parse(m[1])).ok && !/\bimport\b|src\//.test(sql.replace(/^--.*$/gm, '')), '种子能通过 zod；纯 SQL、不引用 src/')
}

console.log('\n【后台：0.8 规则对照、CSV】')
{
  const idx = new Map([['dr', { byCountry: new Map([[187, { cents: 1200, names: ['Codex 美区'] }]]), random: { cents: 1500, names: ['Codex 随机地区'] } }]])
  ok(legacyFor(idx, 'dr', 187)?.priceCents === 1500 && legacyFor(idx, 'dr', 6)?.priceCents === 1500, '随机地区单品与这个服务的每个国家/地区都比，有多个时取价格最高的')
  const idx2 = new Map([['dr', { byCountry: new Map([[187, { cents: 1200, names: ['Codex 美区'] }]]), random: null }]])
  ok(legacyFor(idx2, 'dr', 187)?.priceCents === 1200 && legacyFor(idx2, 'dr', 6) === null && legacyFor(idx2, 'acz', 187) === null, '同服务、同国家/地区的上架单品；没有对应单品 → —')
  const rows = parseCsv('﻿code,nameCn,aliases\r\ntg,"Telegram（电报）","tg|电报"\r\nwb,微信,"微信|wx"\n"x,y","a ""q""",\n')
  ok(rows.length === 4 && rows[1][1] === 'Telegram（电报）' && rows[3][0] === 'x,y' && rows[3][1] === 'a "q"', 'CSV 解析：BOM、引号、逗号、双引号转义、CRLF')
  ok(fmtYuan(968) === '¥9.68' && fmtYuan(-50) === '-¥0.50', 'fmtYuan')
}

console.log('\n【S1 评审修复：范围键的规范写法（前导零）】')
{
  ok(canonicalScopeKey('tg:06') === 'tg:6' && canonicalScopeKey('dr:087') === 'dr:87' && canonicalScopeKey('*:003') === '*:3' && canonicalScopeKey('acz:*') === 'acz:*' && canonicalScopeKey('tg:0') === 'tg:0', '规则范围：国家号去前导零（tg:06 → tg:6、*:003 → *:3），服务:* 不变')
  ok(canonicalScopeKey('*:*') === null && canonicalScopeKey('TG:6') === null && canonicalScopeKey('tg:1000') === null && canonicalScopeKey('tg:') === null, '规则范围：不合法的 → null（*:*、大写、4 位国家号）')
  const rule = { scopeKey: canonicalScopeKey('tg:06') as string, markupCents: 999, tolerancePct: null, disabled: true }
  ok(resolveRule([rule], 'tg', 6, { markupCents: 150, tolerancePct: 25 }).disabled && resolveRule([rule], 'tg', 6, { markupCents: 150, tolerancePct: 25 }).markupCents === 999, '  …规范写法存下的规则能被 resolveRule 查到（原来存 tg:06 永远不生效）')
  ok(canonicalHoldKey('country:03') === 'country:3' && canonicalHoldKey('combo:dr:087') === 'combo:dr:87' && canonicalHoldKey(' SVC:WB ') === 'svc:wb' && canonicalHoldKey('global') === 'global', '停售范围：country:03 → country:3、combo:dr:087 → combo:dr:87、大小写与空格')
  ok(canonicalHoldKey('threads') === null && canonicalHoldKey('country:1000') === null && canonicalHoldKey('svc:x') === null && HOLD_KEY_RE.test('country:3'), '停售范围：threads、4 位国家号、1 位服务代码 → null')
  const g: GateData = { holds: new Map([['country:3', { key: 'country:3', until: null, reason: 'ADMIN', source: 'ADMIN' }]]), offServices: new Set(), offCountries: new Set(), rules: new Map() }
  ok(comboBlock(g, 'wb', Number('03'), new Date(), FACTORY_SMS_CONFIG)?.kind === 'country', '  …规范写法存下的停售能被 comboBlock 查到')
}

console.log('\n【S1 评审修复：手动停售不能覆盖 / 缩短生效中的停售（adminHoldConflict）】')
{
  const now = new Date('2026-09-29T10:00:00Z')
  const later = new Date('2026-09-29T12:00:00Z')
  const soon = new Date('2026-09-29T11:00:00Z')
  const past = new Date('2026-09-29T09:00:00Z')
  ok(adminHoldConflict(null, soon, now) === null && adminHoldConflict({ until: past, reason: 'CURRENCY', source: 'AUTO' }, soon, now) === null, '没有记录、或原记录已过期 → 可以写')
  ok(adminHoldConflict({ until: null, reason: 'CURRENCY', source: 'AUTO' }, soon, now) != null && adminHoldConflict({ until: null, reason: 'CURRENCY', source: 'AUTO' }, null, now) != null, '生效中的自动停售（币种异常、需要手动解除）→ 拒绝（不论新截止时间）')
  ok(adminHoldConflict({ until: later, reason: 'BREAKER', source: 'AUTO' }, null, now) != null, '生效中的自动熔断（有到期）→ 同样拒绝（原因不能被冲掉）')
  ok(adminHoldConflict({ until: null, reason: 'ADMIN', source: 'ADMIN' }, soon, now) != null && adminHoldConflict({ until: null, reason: 'ADMIN', source: 'ADMIN' }, null, now) === null, '手动停售「手动解除」→ 不能改成会到期的；仍是手动解除可以（改原因）')
  ok(adminHoldConflict({ until: later, reason: 'ADMIN', source: 'ADMIN' }, soon, now) != null && adminHoldConflict({ until: soon, reason: 'ADMIN', source: 'ADMIN' }, later, now) === null && adminHoldConflict({ until: soon, reason: 'ADMIN', source: 'ADMIN' }, null, now) === null, '手动停售有到期：不能缩短；延长、改成手动解除可以')
}

console.log('\n【S1 评审修复：0.8 规则按 dr / acz 全部组合核对（legacyRatioFailures）】')
{
  const cfg = { ...FACTORY_SMS_CONFIG }
  const rows = [
    { service: 'dr', country: 187, costMicro: 660_000, legacy: { priceCents: 1200 } },
    { service: 'dr', country: 4, costMicro: 25_000, legacy: { priceCents: 800 } },
    { service: 'acz', country: 48, costMicro: 60_000, legacy: null },
    { service: 'tg', country: 6, costMicro: 150_000, legacy: { priceCents: 5000 } },
  ]
  const drRule: PriceRuleLike = { scopeKey: 'dr:187', markupCents: 440, tolerancePct: null, disabled: false }
  const f1 = legacyRatioFailures(rows, [drRule], cfg)
  ok(f1.length === 1 && f1[0].service === 'dr' && f1[0].country === 4 && f1[0].priceCents === 170 && f1[0].legacyCents === 800, 'dr:187 有规则 ¥9.68 ✓；dr/菲律宾 ¥1.70 ✗；没有对照的、不是 dr/acz 的不算', JSON.stringify(f1))
  // 评审的场景：预览筛到 tg 时把 x 从 8.00 改成 7.50 → dr/187 变成 ¥9.35 < ¥9.60，保存前必须能发现
  const f2 = legacyRatioFailures(rows, [drRule], { ...cfg, saleCoef4: 75000 })
  ok(f2.some((f) => f.service === 'dr' && f.country === 187 && f.priceCents === 935), 'x 8.00 → 7.50：dr/187 ¥9.35 < ¥9.60 → ✗（不看预览里显示的是哪个服务）', JSON.stringify(f2))
  ok(legacyRatioFailures(rows, [drRule, { scopeKey: 'dr:4', markupCents: null, tolerancePct: null, disabled: true }], cfg).length === 0, 'disabled 规则停售的组合不算（不卖就不会比旧单品便宜）')
  ok(legacyRatioFailures(rows, [drRule, { scopeKey: '*:187', markupCents: 0, tolerancePct: null, disabled: false }], cfg).length === 1, '*:187 y=0 不影响 dr:187（服务:国家 优先）')
  ok(legacyRatioFailures(rows, [{ scopeKey: '*:187', markupCents: 0, tolerancePct: null, disabled: false }], cfg).some((f) => f.country === 187), '只有 *:187 y=0 → dr/187 ✗（*:国家 规则也核对）')
  ok(legacyRatioFailures(rows, [{ scopeKey: 'dr:187', markupCents: 440, tolerancePct: -5, disabled: false }], cfg).length === 1, '规则容差不合法（负数）：那一行跳过、不抛异常（原来整页白屏）')
  ok(LEGACY_GUARDED_SERVICES.join(',') === 'dr,acz', '只管 dr、acz')
}

console.log('\n【S1 评审修复：后台设置的数字输入（小数点不被吃掉）】')
{
  ok(settingsNumberValue('2.') === '2.' && settingsNumberValue('0.') === '0.' && settingsNumberValue('-') === '-', '「2.」「0.」「-」原样保留（输入中间态）')
  ok(settingsNumberValue('2.5') === 2.5 && settingsNumberValue('0.4') === 0.4 && settingsNumberValue(' 20 ') === 20 && settingsNumberValue('-3') === -3, '完整数字才转 number')
  ok(settingsNumberValue('') === '' && settingsNumberValue('abc') === 'abc', '空与文字原样（保存时 zod 报错）')
  ok(!checkSmsConfig({ ...FACTORY_SMS_CONFIG, upstream: { ...FACTORY_SMS_CONFIG.upstream, balanceAlertUsd: settingsNumberValue('2.') } }).ok, '  …停在「2.」就保存 → zod 拒绝（不会悄悄存成 2）')
}

console.log('\n【S1 评审修复：目录成员（服务可见的基准、报价前的格式检查）】')
{
  const now = new Date('2026-10-10T00:00:00Z')
  const lastOk = new Date('2026-10-01T00:00:00Z') // 静态同步从 10-01 起一直失败
  ok(serviceSeenCutoffFrom(lastOk, now).getTime() === lastOk.getTime() - SERVICE_SEEN_WITHIN_MS, '静态同步一直失败：基准停在最近一次成功的列表（10-01），不随现在后移 → 已列出的服务不会过 3 天全部消失')
  ok(serviceSeenCutoffFrom(null, now).getTime() === now.getTime() - SERVICE_SEEN_WITHIN_MS && serviceSeenCutoffFrom(new Date('2026-10-11T00:00:00Z'), now).getTime() === now.getTime() - SERVICE_SEEN_WITHIN_MS, '没有服务 / 基准在未来（时钟偏差）→ 按现在')
  ok(catalogCodesValid('tg', 6) && catalogCodesValid('acz', 0) && catalogCodesValid('full', 999), '格式：2–4 位小写字母数字、国家 0–999')
  ok(!catalogCodesValid('ABCDE', 6) && !catalogCodesValid('tg', 1000) && !catalogCodesValid('tg', 1.5) && !catalogCodesValid('t', 6) && !catalogCodesValid('tg', -1) && !catalogCodesValid(undefined, 6), '格式不对的一律 false（上游客户端会对它们抛 TypeError）')
  ok(EXCLUDED_SERVICES.has('full') && STATIC_STALE_ALERT_MS === 26 * 3600_000, 'full 在目录排除里；静态目录超过 26 小时没成功才告警')
}

console.log('\n【S1 评审修复：后台改目录只写真正变了的字段（NULL 与空串视为相同）】')
{
  ok(Object.keys(onlyChanged({ nameCn: null, aliases: 'a,b', hotRank: 3 }, { nameCn: '', aliases: 'a,b', hotRank: 3 })).length === 0, '没改的（含 NULL ↔ 空串）不算改动')
  const d = onlyChanged({ nameCn: '微博', aliases: 'weibo,wb', hotRank: null }, { nameCn: '', aliases: 'weibo,wb', hotRank: 20 })
  ok(d.nameCn === '' && d.hotRank === 20 && !('aliases' in d), '清空中文名（存空串）、改热门序号 → 只有这两项')
}

console.log(`\n通过 ${passed} 条，失败 ${failed} 条`)
if (failed) {
  console.log('❌ 有失败')
  process.exit(1)
}
console.log('全部通过 ✅')
process.exit(0)
