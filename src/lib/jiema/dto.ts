/**
 * 短信接码 · 买家 DTO 白名单（docs/短信接码-设计.md §6.4、§10.2、附录 B 第 7 条）。
 *
 * 【只能逐字段显式构造，不做 {...row} 展开】目录响应里**绝不**出现：成本（costMicro）、上限（capMicro）、两个系数（saleCoef4、costFx4）、
 * 加价（markupCents）、覆盖规则（ruleKey）、上游原文（raw）、停售备注原文（note）、上游名称。
 * S1 只有目录的两个 DTO；S2 在这里接着加 JiemaOrderView（号码页）。
 * scripts/check-jiema-pricing.ts 遍历序列化结果的键名，断言 FORBIDDEN_BUYER_KEYS 一个都不出现（§12.1 第 7 条）。
 */
import type { StockLevel } from './pricing'

/** 任何买家响应里都不能出现的字段名（§6.4 末尾那张清单 + 目录这边的内部字段） */
export const FORBIDDEN_BUYER_KEYS: readonly string[] = Object.freeze([
  'costMicro',
  'capMicro',
  'saleCoef4',
  'costFx4',
  'markupCents',
  'tolerancePct',
  'minMarginCents',
  'ruleKey',
  'activationId',
  'maxPriceMicro',
  'raw',
  'errorCode',
  'chargedMicro',
  'costCents',
  'profitCents',
  'lossCents',
  'note',
  'offNote',
  'bizKey',
  'retail',
  'min',
  'tiers',
  'hash',
  'popRank',
  'status',
])

/** 服务列表的一行（GET /api/jiema/catalog） */
export interface CatalogService {
  code: string
  /** 中文名优先（没有中文名时是英文名） */
  name: string
  en: string
  aliases: string[]
  /** 热门序号（null = 不是热门） */
  hot: number | null
  /** 「¥x 起」（只在可售组合里取；null = 暂无号码或「起价以实际为准」） */
  fromCents: number | null
  /** 只有第 ① 层数据（getPrices）时为 true：页面写「约 ¥x 起」 */
  approx: boolean
  /** OK 有货 · OUT 全部国家/地区都售罄（灰显「暂无号码」）· UNKNOWN 价格源降级（「起价以实际为准」） */
  level: 'OK' | 'OUT' | 'UNKNOWN'
}

export function toCatalogService(x: CatalogService): CatalogService {
  return {
    code: x.code,
    name: x.name,
    en: x.en,
    aliases: x.aliases.slice(0, 30),
    hot: x.hot,
    fromCents: x.fromCents,
    approx: x.approx,
    level: x.level,
  }
}

/** 国家/地区列表的一行（GET /api/jiema/catalog/[service]） */
export interface CatalogCountry {
  id: number
  /** 中文名（「中国台湾 / 中国香港 / 中国澳门」按 D44 固定） */
  name: string
  en: string
  iso2: string | null
  /** 旗帜图标键（小写 ISO2）；台湾为 null，显示中性图标（D44） */
  flag: string | null
  dial: string | null
  priceCents: number | null
  /** 价格只来自第 ① 层（getPrices）时为 true：以下单时实时价格为准 */
  approx: boolean
  /** 库存约数（只有第 ② 层 offers 时给；null = 只显示「有货」或售罄） */
  stock: number | null
  level: StockLevel
  /** 「推荐」等标签 */
  tags: string[]
  /** 有效期（分钟）。例外时长组合在真钱验证前一律显示 20（D42） */
  durationMin: number
  /** 暂停销售时给买家看的原因（「近期成功率低，暂停到 18:40」「暂停销售」）；null = 可售 */
  paused: string | null
}

export function toCatalogCountry(x: CatalogCountry): CatalogCountry {
  return {
    id: x.id,
    name: x.name,
    en: x.en,
    iso2: x.iso2,
    flag: x.flag,
    dial: x.dial,
    priceCents: x.priceCents,
    approx: x.approx,
    stock: x.stock,
    level: x.level,
    tags: x.tags.slice(0, 4),
    durationMin: x.durationMin,
    paused: x.paused,
  }
}

/** 运营商选项（GET /api/jiema/catalog/[service]/[country]/operators） */
export interface CatalogOperator {
  code: string
  name: string
}

/** 纯函数：收集一个值里所有对象的键名（测试断言「响应里搜不到 cost / cap / 两个系数」用） */
export function collectKeyNames(v: unknown, out: Set<string> = new Set()): Set<string> {
  if (Array.isArray(v)) {
    for (const x of v) collectKeyNames(x, out)
  } else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      out.add(k)
      collectKeyNames(x, out)
    }
  }
  return out
}
