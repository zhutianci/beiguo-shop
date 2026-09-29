/**
 * 短信接码 · 定价与成本核算的整数纯函数（docs/短信接码-设计.md 第 4 章、D6、D21、D26、D38、§6.3）。
 *
 * 【零依赖、前后端同构】后台定价页的实时预览、目录列表价、国家列表价、下单报价都调这里的同一个 `salePriceCents`，
 * 同一组合、同一份配置与覆盖规则、同一个报价成本 → 同一个价（§6.3、§12.1 第 99 条），不会因为取整或兜底的差异每单都弹 PRICE_CHANGED。
 *
 * 【单位】美元用「微美元」（1 USD = 1,000,000）；人民币用「分」；两个系数都 ×10000（saleCoef4、costFx4）。全程整数，
 * 乘法走 BigInt（成本 $25 × 系数 30.0000 也不溢出）。
 *
 * 【两个系数不能混】售价系数 x 只用于售价；cap 的毛利护栏与真实成本都用成本汇率（附录 B 第 19 条）。
 */

export const MICRO_PER_USD = 1_000_000
/** 传给上游的 maxPrice 至少 $0.0067（v1 文档的最小值，§4.1 的 eff） */
export const MIN_MAX_PRICE_MICRO = 6700

// BigInt 字面量（1n）要 ES2020 target；tsconfig 没设 target，用 BigInt(…) 构造
const B1 = BigInt(1)
const E8 = BigInt(100_000_000)
const ceilDiv = (a: bigint, b: bigint) => (a + b - B1) / b

function assertMicro(v: number, label: string): void {
  if (!Number.isSafeInteger(v) || v < 0) throw new RangeError(`[jiema/pricing] ${label} 必须是非负整数（微美元），收到 ${v}`)
}
function assertCoef4(v: number, label: string): void {
  if (!Number.isSafeInteger(v) || v <= 0) throw new RangeError(`[jiema/pricing] ${label} 必须是正整数（×10000），收到 ${v}`)
}

/** 美元 × 系数 → 人民币分，向上取整（售价和真实成本共用）：⌈micro × coef4 ÷ 10⁸⌉ */
export function usdToCentsCeil(micro: number, coef4: number): number {
  assertMicro(micro, 'micro')
  assertCoef4(coef4, 'coef4')
  return Number(ceilDiv(BigInt(micro) * BigInt(coef4), E8))
}

export interface SaleParams {
  saleCoef4: number
  markupCents: number
  minPriceCents: number
  rounding: 'CENT' | 'JIAO'
}

/**
 * 售价（分）：报价成本 × x 向上取整 + y，**先兜最低售价、再按取整规则**（到角时结果一定是整角：最低售价 ¥1.05 收 ¥1.10）。
 * 报价成本 ≤ 0 不给价（「成本为 0 时拒绝报价」，§12.1 第 1 条）——调用方先用 quoteCostMicro 拿到 null 就按不可售处理。
 */
export function salePriceCents(costMicro: number, c: SaleParams): number {
  assertMicro(costMicro, 'costMicro')
  if (costMicro <= 0) throw new RangeError('[jiema/pricing] 报价成本为 0，拒绝报价')
  if (!Number.isSafeInteger(c.markupCents) || c.markupCents < 0) throw new RangeError('[jiema/pricing] markupCents 必须是非负整数')
  if (!Number.isSafeInteger(c.minPriceCents) || c.minPriceCents < 1) throw new RangeError('[jiema/pricing] minPriceCents 必须 ≥ 1')
  let p = Math.max(usdToCentsCeil(costMicro, c.saleCoef4) + c.markupCents, c.minPriceCents)
  if (c.rounding === 'JIAO') p = Math.ceil(p / 10) * 10
  return p
}

/** 真实成本（分）：实际扣费 × 成本汇率，向上取整（利润宁低勿高，D39） */
export function realCostCents(chargedMicro: number, costFx4: number): number {
  return usdToCentsCeil(chargedMicro, costFx4)
}

export interface CapParams {
  costFx4: number
  tolerancePct: number
  minMarginCents: number
}

/**
 * 取号上限（微美元）：容差与毛利护栏取小，但不低于报价成本；按 100 微美元（$0.0001）向下取整。
 * 毛利护栏按**真实成本**算：realCostCents(cap) ≤ 售价 − 最低毛利（D6；除以成本汇率、不除以 x）。
 */
export function capMicro(costMicro: number, priceCents: number, c: CapParams): number {
  assertMicro(costMicro, 'costMicro')
  assertCoef4(c.costFx4, 'costFx4')
  if (!Number.isSafeInteger(c.tolerancePct) || c.tolerancePct < 0) throw new RangeError('[jiema/pricing] tolerancePct 必须是非负整数')
  const byTol = Math.floor((costMicro * (100 + c.tolerancePct)) / 100)
  const byMargin = Number((BigInt(Math.max(0, priceCents - c.minMarginCents)) * E8) / BigInt(c.costFx4))
  const cap = Math.max(costMicro, Math.min(byTol, byMargin))
  return Math.floor(cap / 100) * 100
}

/** 实际传给上游的上限：max(cap, 6700)（成本低于 $0.0067 的组合，实际上限会比 cap 略高，最多不到 ¥0.05，§4.1） */
export function effCapMicro(cap: number): number {
  assertMicro(cap, 'cap')
  return Math.max(cap, MIN_MAX_PRICE_MICRO)
}

/** 微美元 → 4 位小数的美元字符串（maxPrice 参数；零依赖版，与 parse.microToUsd4 同一口径） */
export function microToUsd4(micro: number): string {
  assertMicro(micro, 'micro')
  const t = Math.floor(micro / 100) // 0.0001 美元
  return `${Math.floor(t / 10000)}.${String(t % 10000).padStart(4, '0')}`
}

/** 利润（分）= 售价 − 真实成本 */
export function profitCents(priceCents: number, costCents: number): number {
  return priceCents - costCents
}

// ───────────────────────── 0.8 规则（D13、Q1） ─────────────────────────

/** 「新板块售价 ≥ 旧单品现价 × 0.8」：整数判定（price × 5 ≥ legacy × 4）。1200 → 960 通过、959 不通过 */
export function meetsLegacyRatio(priceCents: number, legacyPriceCents: number): boolean {
  return priceCents * 5 >= legacyPriceCents * 4
}

/** 旧单品现价 × 0.8 向上取整到分（页面上「≥ ¥9.60」那个数） */
export function legacyFloorCents(legacyPriceCents: number): number {
  return Math.ceil((legacyPriceCents * 4) / 5)
}

// ───────────────────────── 报价成本（§4.2、D21） ─────────────────────────

/** offers 的一个「服务 × 国家」（第 ② 层缓存与第 ③ 层实时报价同一个形状） */
export interface OfferQuoteInput {
  retailMicro: number | null
  minMicro: number | null
  /** counts.defaultPrice（起价档库存；语义未确认，调研 U1） */
  defaultCount: number | null
  /** map 的档位，按价格升序：[价格微美元, 数量] */
  tiers: ReadonlyArray<readonly [number, number]>
}

/**
 * 报价成本（微美元）：max(retail, min)；`defaultPrice == 0` 并且 map 里有档位时，改用 map 里**数值最小的键**（有货的最低档，
 * 规格示例 tg/48）。拿不到价（都为空）、或者成本 ≤ 0 → null（不可售）。
 */
export function quoteCostMicro(o: OfferQuoteInput): number | null {
  const tiers = o.tiers.filter(([p, n]) => Number.isSafeInteger(p) && p > 0 && n > 0)
  if ((o.defaultCount ?? 0) <= 0 && tiers.length) {
    return tiers.reduce((m, [p]) => (p < m ? p : m), tiers[0][0])
  }
  const cands = [o.retailMicro, o.minMicro].filter((v): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0)
  if (!cands.length) return null
  return Math.max(...cands)
}

/**
 * 能不能卖（§4.2）：map 里有 ≤ cap 的档位，或者 defaultPrice > 0，二者满足其一；报价成本拿不到的一律不可售。
 * （报价成本 ≤ cap 恒成立，所以「defaultPrice=0 且 map 有档位」时最低档一定 ≤ cap，结论与 cap 无关——
 * 列表的「起价」因此不必先算 cap；这里仍按原文带 cap 算，给下单报价用。）
 */
export function offerSellable(o: OfferQuoteInput, cap: number): boolean {
  if (quoteCostMicro(o) == null) return false
  if ((o.defaultCount ?? 0) > 0) return true
  return o.tiers.some(([p, n]) => p <= cap && n > 0)
}

/**
 * 库存的展示值（只用第 ② 层 offers，§4.2 的保守读法）：`defaultPrice > 0` 时取 min(defaultPrice, map 里 ≤ cap 的最大累计值)，
 * 否则取 map 里 ≤ cap 的最大累计值。map 的数值是不是累计未确认（调研 U1），这里一律取「≤ cap 的档位里数值最大的那一个」，
 * 累计时它就是累计值，不累计时它也不会比真实库存大（保守）。没有档位时：defaultPrice > 0 → defaultPrice，否则 0。
 */
export function offerStock(o: OfferQuoteInput, cap: number): number {
  let maxCum = -1
  for (const [p, n] of o.tiers) if (p <= cap && n > maxCum) maxCum = n
  const d = o.defaultCount ?? 0
  if (d > 0) return maxCum >= 0 ? Math.min(d, maxCum) : d
  return Math.max(0, maxCum)
}

// ───────────────────────── 库存等级（§1.6、D26） ─────────────────────────

/** PLENTY 充足 ≥1000 · MANY 较多 100–999 · LOW 紧张 1–99 · OUT 售罄 · AVAILABLE 只有第 ① 层数据（只显示「有货」） */
export type StockLevel = 'PLENTY' | 'MANY' | 'LOW' | 'OUT' | 'AVAILABLE'

export function stockLevelOf(n: number | null, fromOffers: boolean): StockLevel {
  if (!fromOffers) return n != null && n > 0 ? 'AVAILABLE' : 'OUT'
  if (n == null || n <= 0) return 'OUT'
  if (n >= 1000) return 'PLENTY'
  if (n >= 100) return 'MANY'
  return 'LOW'
}

/** 约数：≥1 万显示「33 万」「1.2 万」，否则整数（§1.6） */
export function stockApprox(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n < 10_000) return String(Math.floor(n))
  const tenth = Math.floor(n / 1000) // 以千为单位
  if (tenth >= 100) return `${Math.floor(n / 10_000)} 万`
  const w = Math.floor(tenth / 10)
  const d = tenth % 10
  return d ? `${w}.${d} 万` : `${w} 万`
}

// ───────────────────────── 覆盖规则（§4.3） ─────────────────────────

export interface PriceRuleLike {
  scopeKey: string
  markupCents: number | null
  tolerancePct: number | null
  disabled: boolean
}

/** scopeKey：'tg:6' | 'tg:*' | '*:187'（不允许 '*:*'：全局值就是配置本身） */
export const SCOPE_KEY_RE = /^([a-z0-9]{2,4}|\*):([0-9]{1,3}|\*)$/

export function parseScopeKey(k: string): { service: string | null; country: number | null } | null {
  const m = SCOPE_KEY_RE.exec(k)
  if (!m) return null
  if (m[1] === '*' && m[2] === '*') return null
  const country = m[2] === '*' ? null : Number(m[2])
  if (country != null && (country < 0 || country > 999)) return null
  return { service: m[1] === '*' ? null : m[1], country }
}

/**
 * 规范写法（存库只存这个）：国家号去掉前导零（'tg:06' → 'tg:6'、'*:003' → '*:3'）。
 * resolveRule 按 `${service}:${country}` 精确查键，存成 'tg:06' 的规则永远匹配不上（S1 评审修复）。不合法 → null。
 */
export function canonicalScopeKey(k: string): string | null {
  const p = parseScopeKey(k)
  if (!p) return null
  return `${p.service ?? '*'}:${p.country == null ? '*' : String(p.country)}`
}

/** 手动停售能写的范围（sms_holds.key；threads 不是停售，不能手动写）。放在这个零依赖模块里，后台页面也能用 */
export const HOLD_KEY_RE = /^(global|svc:[a-z0-9]{2,4}|country:\d{1,3}|combo:[a-z0-9]{2,4}:\d{1,3})$/

/**
 * 纯函数：停售范围的规范写法（国家号去掉前导零：'country:03' → 'country:3'、'combo:dr:087' → 'combo:dr:87'）。
 * comboBlock 按 `country:${country}` 精确查键，存成 'country:03' 的停售永远不生效（S1 评审修复）。不合法 → null。
 */
export function canonicalHoldKey(raw: string): string | null {
  const k = raw.trim().toLowerCase()
  if (!HOLD_KEY_RE.test(k)) return null
  const parts = k.split(':')
  if (parts[0] === 'country') return `country:${Number(parts[1])}`
  if (parts[0] === 'combo') return `combo:${parts[1]}:${Number(parts[2])}`
  return k
}

/** 优先级从高到低：服务:国家 > 服务:* > *:国家 */
export function ruleKeysFor(service: string, country: number): [string, string, string] {
  return [`${service}:${country}`, `${service}:*`, `*:${country}`]
}

export interface ResolvedRule {
  markupCents: number
  tolerancePct: number
  /** 任何一条匹配的规则 disabled → 停售（停售是运维保护，宁严勿宽） */
  disabled: boolean
  /** 提供了这一组合定价的最具体的那条规则（没有匹配 = null；下单时快照进 SmsOrder.ruleKey） */
  ruleKey: string | null
}

/**
 * 解析一个组合的覆盖规则（纯函数）：加价 y、容差各自取**最具体的非空值**，都没有就用全局配置；
 * disabled 只要任何一条匹配的规则是 true 就停售。售价系数与成本汇率只有全局一个值（§4.3），不在这里。
 */
export function resolveRule(
  rules: ReadonlyMap<string, PriceRuleLike> | readonly PriceRuleLike[],
  service: string,
  country: number,
  global: { markupCents: number; tolerancePct: number },
): ResolvedRule {
  const get = (k: string): PriceRuleLike | undefined =>
    Array.isArray(rules) ? (rules as readonly PriceRuleLike[]).find((r) => r.scopeKey === k) : (rules as ReadonlyMap<string, PriceRuleLike>).get(k)
  let markup: number | null = null
  let tol: number | null = null
  let disabled = false
  let ruleKey: string | null = null
  for (const k of ruleKeysFor(service, country)) {
    const r = get(k)
    if (!r) continue
    if (ruleKey == null) ruleKey = k
    if (markup == null && r.markupCents != null) markup = r.markupCents
    if (tol == null && r.tolerancePct != null) tol = r.tolerancePct
    if (r.disabled) disabled = true
  }
  return { markupCents: markup ?? global.markupCents, tolerancePct: tol ?? global.tolerancePct, disabled, ruleKey }
}

// ───────────────────────── 组合报价（列表价 = 下单价） ─────────────────────────

export interface PricingConfigLike extends SaleParams, CapParams {}

export interface ComboPrice {
  costMicro: number
  priceCents: number
  capMicro: number
  markupCents: number
  tolerancePct: number
  ruleKey: string | null
}

/**
 * 一个组合的售价与 cap（纯函数）：列表价、国家列表价、定价页预览、下单报价都走这里 → salePriceCents，同一组输入同一个结果。
 * 返回 null = 报价成本拿不到（不可售）。disabled 不在这里判（gate 的事），这里只算价。
 */
export function priceCombo(
  costMicro: number | null,
  rule: Pick<ResolvedRule, 'markupCents' | 'tolerancePct' | 'ruleKey'>,
  cfg: PricingConfigLike,
): ComboPrice | null {
  if (costMicro == null || !Number.isSafeInteger(costMicro) || costMicro <= 0) return null
  const priceCents = salePriceCents(costMicro, { saleCoef4: cfg.saleCoef4, markupCents: rule.markupCents, minPriceCents: cfg.minPriceCents, rounding: cfg.rounding })
  const cap = capMicro(costMicro, priceCents, { costFx4: cfg.costFx4, tolerancePct: rule.tolerancePct, minMarginCents: cfg.minMarginCents })
  return { costMicro, priceCents, capMicro: cap, markupCents: rule.markupCents, tolerancePct: rule.tolerancePct, ruleKey: rule.ruleKey }
}

// ───────────────────────── 0.8 规则的保存前核对（D13、Q1、§7.3） ─────────────────────────

/** 0.8 规则只管这两个服务（新板块不能比旧的 Codex / Claude 单品便宜太多） */
export const LEGACY_GUARDED_SERVICES: readonly string[] = Object.freeze(['dr', 'acz'])

export interface LegacyCheckRow {
  service: string
  country: number
  costMicro: number
  legacy: { priceCents: number } | null
}

export interface LegacyFailure {
  service: string
  country: number
  priceCents: number
  legacyCents: number
}

/**
 * 纯函数：按一份（草稿）配置与（草稿）规则，列出 dr / acz 里低于旧单品 × 0.8 的组合。
 * 调用方必须传 **dr、acz 的全部组合**（后台保存前单独拉 ?service=dr / ?service=acz，不受预览筛选影响，S1 评审修复）。
 * 没有旧单品对照的、被 disabled 规则停售的（不卖就不会比旧单品便宜）跳过；某一行算不出价（配置不合法）也跳过，不抛异常。
 */
export function legacyRatioFailures(
  rows: readonly LegacyCheckRow[],
  rules: ReadonlyMap<string, PriceRuleLike> | readonly PriceRuleLike[],
  cfg: PricingConfigLike,
): LegacyFailure[] {
  const out: LegacyFailure[] = []
  for (const r of rows) {
    if (!r.legacy || !LEGACY_GUARDED_SERVICES.includes(r.service)) continue
    try {
      const rule = resolveRule(rules, r.service, r.country, cfg)
      if (rule.disabled) continue
      const p = priceCombo(r.costMicro, rule, cfg)
      if (p && !meetsLegacyRatio(p.priceCents, r.legacy.priceCents)) out.push({ service: r.service, country: r.country, priceCents: p.priceCents, legacyCents: r.legacy.priceCents })
    } catch {
      /* 草稿配置不合法：这一行不参与核对（保存时服务端会拒绝不合法的配置） */
    }
  }
  return out
}

/** 整数分 → 「¥12.34」（零依赖；页面与预览用） */
export function fmtYuan(cents: number): string {
  const neg = cents < 0
  const a = Math.abs(Math.trunc(cents))
  return `${neg ? '-' : ''}¥${Math.floor(a / 100)}.${String(a % 100).padStart(2, '0')}`
}
