/**
 * sms_config 的 zod 校验、出厂值与「对谁开放」的纯函数（docs/短信接码-设计.md §5.3、D28、附录 B 第 9 条）。
 *
 * 【为什么在 lib/ 根下、不在 lib/jiema/ 里】B0 的 `wallet/config.ts` 的 canUseForJiema 要按「整份校验通过 && enabled && audience=ALL」判
 * （B0 实施偏差「已知限制，S1 必须收口」），而构建前检查规则 17 不许 `lib/wallet/**` 静态 import `lib/jiema/**`。
 * 所以 schema 放进这个**只依赖 zod** 的共享模块：lib/wallet、lib/jiema/config.ts、前台外壳、sitemap 共用同一份判定，不会各写一套。
 * 不 import prisma、不 import lib/jiema 的其余部分；客户端也能 import（后台设置页用它做即时校验）。
 *
 * 【读取失败 = 停售新单】读不到 / 校验不过一律按关闭处理，不回落出厂值（与营销模块、wallet_config 一致）；
 * 在途单的推进不读这份配置（S2：单级参数快照在 SmsOrder、全局运行参数走 runtimeParams()）。
 */
import { z } from 'zod'

/**
 * 接码下单（S2）已经交付了吗。S1 = false：目录与定价上线但**不开卖**（§11 S1）。
 * false 时：`jiemaPublicOpen` 恒为 false（导航、sitemap、canUseForJiema 都不出现接码），后台保存 `audience=ALL` 会被拒（400），
 * /jiema 的「去支付」一律不可用。
 * **S2b（号码页、确认面板、后台订单）交付时改成 true**（与 B0 的 TOPUP_AVAILABLE 同一做法）。改成 true 之后是否对买家开放只看 sms_config：
 * 出厂 enabled=false、audience=ADMIN_ONLY，管理员真钱验收用「总开关开 + 仅管理员」；**S4 对账跑满 3 天之前不要把受众切到全部用户**（D28、§11 第 9 步）。
 * 它不进读取时的校验：库里万一是 audience=ALL（手改库），读取照常成功。
 */
export const JIEMA_ORDER_AVAILABLE = true

export const SMS_CONFIG_KEY = 'sms_config'

/** 服务代码（与上游客户端 SERVICE_RE 同一口径，小写） */
export const SERVICE_CODE_RE = /^[a-z0-9]{2,4}$/

export type SmsAudience = 'ADMIN_ONLY' | 'ALL'
export type SmsRounding = 'CENT' | 'JIAO'

export interface SmsConfig {
  version: number
  enabled: boolean
  audience: SmsAudience
  /** 售价系数 x ×10000（8.00 → 80000），只用于售价（D38） */
  saleCoef4: number
  /** 成本汇率 ×10000（7.20 → 72000），只用于 cap 的毛利护栏与真实成本（D38） */
  costFx4: number
  markupCents: number
  minPriceCents: number
  rounding: SmsRounding
  tolerancePct: number
  minMarginCents: number
  quoteTtlSec: number
  maxReplace: number
  acquireTries: number
  limits: { activePerUser: number; perHour: number; perDay: number; maxActiveNumbers: number }
  upstream: { balanceAlertUsd: number; legacyReserveThreads: number }
  autoHold: {
    zero: { minAttempts: number; windowH: number }
    ratio: { minAttempts: number; minRatePct: number; windowH: number }
    upstreamCombo: { minCount: number; minRatePct: number }
    upstreamAccount: { minCount: number; minRatePct: number }
    holdH: number
  }
  breaker: { windowSec: number; minFails: number; minRatio: number; closeAfterSec: number }
  longDurationVerified: boolean
  /** 首次目录同步时用来初始化 sms_services.hot_rank（之后热门以 hot_rank 为准，后台「目录」可改；实施偏差 S1） */
  hotServices: string[]
  complaintWindowH: number
  legacyOnNewEngine: boolean
  resellerMode: boolean
  webhookEnabled: boolean
}

/**
 * 出厂值（站长 09-29 确认，Q1）：x=8.00、成本汇率 7.20、y=¥1.50、最低 ¥1.00、取整到分、容差 25%、最低毛利 ¥0.50。
 * 部署时由种子 SQL（scripts/ops/jiema-s1-seed.sql）写入；读不到时**不**回落到它（fail-closed）。
 * 同时是 runtimeParams() 的代码内置默认值（进程启动后还没读到过有效配置时用，E59）。
 */
export const FACTORY_SMS_CONFIG: SmsConfig = Object.freeze({
  version: 1,
  enabled: false,
  audience: 'ADMIN_ONLY',
  saleCoef4: 80000,
  costFx4: 72000,
  markupCents: 150,
  minPriceCents: 100,
  rounding: 'CENT',
  tolerancePct: 25,
  minMarginCents: 50,
  quoteTtlSec: 600,
  maxReplace: 5,
  acquireTries: 3,
  limits: { activePerUser: 3, perHour: 10, perDay: 30, maxActiveNumbers: 20 },
  upstream: { balanceAlertUsd: 2, legacyReserveThreads: 1 },
  autoHold: {
    zero: { minAttempts: 8, windowH: 24 },
    ratio: { minAttempts: 20, minRatePct: 12, windowH: 24 },
    upstreamCombo: { minCount: 70, minRatePct: 8 },
    upstreamAccount: { minCount: 350, minRatePct: 5 },
    holdH: 6,
  },
  breaker: { windowSec: 120, minFails: 5, minRatio: 0.5, closeAfterSec: 180 },
  longDurationVerified: false,
  hotServices: ['dr', 'acz', 'tg', 'wa', 'go', 'ig', 'fb', 'tw', 'ds', 'am', 'wx', 'mm'],
  complaintWindowH: 24,
  legacyOnNewEngine: false,
  resellerMode: false,
  webhookEnabled: false,
}) as SmsConfig

const int = (label: string, min: number, max: number) =>
  z
    .number({ invalid_type_error: `${label}必须是数字`, required_error: `缺少${label}` })
    .int(`${label}必须是整数`)
    .min(min, `${label}不能小于 ${min}`)
    .max(max, `${label}不能大于 ${max}`)
const num = (label: string, min: number, max: number) =>
  z
    .number({ invalid_type_error: `${label}必须是数字`, required_error: `缺少${label}` })
    .refine((v) => Number.isFinite(v), `${label}必须是数字`)
    .refine((v) => v >= min && v <= max, `${label}必须在 ${min}–${max} 之间`)
const bool = (label: string) => z.boolean({ invalid_type_error: `${label}必须是开 / 关`, required_error: `缺少${label}` })

/**
 * 字段级校验（§5.3、§7.3）：售价系数 1.00–30.00、成本汇率 5.00–9.00（超出多半是把 x 填错了位置）、
 * 加价 0–50 元、最低售价 ¥0.01–¥50.00（必须 > 0，收银台不收 0 元）、换号 0–10。
 * 「x < 成本汇率要二次确认」「y < 最低毛利且最低售价兜不住时警告」不是拒绝项，见 smsConfigWarnings。
 */
export const smsConfigSchema = z.object({
  version: int('版本号', 1, 2 ** 31 - 1),
  enabled: bool('总开关'),
  audience: z.enum(['ADMIN_ONLY', 'ALL'], { errorMap: () => ({ message: '受众只能是「仅管理员」或「全部用户」' }) }),
  saleCoef4: int('售价系数', 10000, 300000),
  costFx4: int('成本汇率', 50000, 90000),
  markupCents: int('加价', 0, 5000),
  minPriceCents: int('最低售价', 1, 5000),
  rounding: z.enum(['CENT', 'JIAO'], { errorMap: () => ({ message: '取整只能是「到分」或「到角」' }) }),
  tolerancePct: int('容差', 0, 100),
  minMarginCents: int('最低毛利', 0, 5000),
  quoteTtlSec: int('锁价秒数', 60, 1800),
  maxReplace: int('换号次数', 0, 10),
  acquireTries: int('取号尝试次数', 1, 5),
  limits: z.object({
    activePerUser: int('同时进行中的单', 1, 10),
    perHour: int('每小时单数', 1, 100),
    perDay: int('每天单数', 1, 500),
    maxActiveNumbers: int('新板块同时在途号码上限', 1, 500),
  }),
  upstream: z.object({
    balanceAlertUsd: num('上游余额告警线（美元）', 0, 10000),
    legacyReserveThreads: int('给旧单品保留的线程', 0, 50),
  }),
  autoHold: z.object({
    zero: z.object({ minAttempts: int('0 收码停售的号码数', 1, 1000), windowH: int('0 收码停售的窗口（小时）', 1, 168) }),
    ratio: z.object({ minAttempts: int('低收码率停售的号码数', 1, 1000), minRatePct: int('低收码率阈值', 0, 100), windowH: int('低收码率窗口（小时）', 1, 168) }),
    upstreamCombo: z.object({ minCount: int('上游组合号码数', 1, 100000), minRatePct: int('上游组合成功率阈值', 0, 100) }),
    upstreamAccount: z.object({ minCount: int('上游账户号码数', 1, 1000000), minRatePct: int('上游账户成功率阈值', 0, 100) }),
    holdH: int('自动停售时长（小时）', 1, 168),
  }),
  breaker: z.object({
    windowSec: int('熔断窗口（秒）', 10, 3600),
    minFails: int('熔断最少失败次数', 1, 1000),
    minRatio: num('熔断失败占比', 0, 1),
    closeAfterSec: int('熔断恢复探测（秒）', 10, 3600),
  }),
  longDurationVerified: bool('例外时长已验证'),
  hotServices: z
    .array(z.string().regex(SERVICE_CODE_RE, '热门服务代码不合法'))
    .max(40, '热门服务最多 40 个')
    .refine((a) => new Set(a).size === a.length, '热门服务不能重复'),
  complaintWindowH: int('售后申请窗口（小时）', 1, 168),
  legacyOnNewEngine: bool('旧单品迁入新引擎'),
  resellerMode: bool('转售商模式'),
  webhookEnabled: bool('Webhook'),
})

export type SmsConfigCheck = { ok: true; config: SmsConfig } | { ok: false; errors: Record<string, string> }

/** 纯函数：校验一份配置（读取、保存共用）。errors 的键是字段路径（limits.perDay 这种） */
export function checkSmsConfig(input: unknown): SmsConfigCheck {
  const r = smsConfigSchema.safeParse(input)
  if (r.success) return { ok: true, config: r.data as SmsConfig }
  const errors: Record<string, string> = {}
  for (const i of r.error.issues) {
    const k = i.path.join('.') || '_'
    if (!errors[k]) errors[k] = i.message
  }
  return { ok: false, errors }
}

/**
 * 保存时额外拒绝的项（不是读取校验：读取时这些值照常通过，只是按「做不到」处理）。「只写代码做得到的」：
 *  · S2 之前（JIEMA_ORDER_AVAILABLE=false）不能对全部用户开放；
 *  · P2 预留的三个开关（转售商模式、Webhook、旧单品迁入新引擎）还没有实现，不能打开。
 */
export function smsConfigSaveBlockers(c: SmsConfig, orderAvailable: boolean = JIEMA_ORDER_AVAILABLE): Record<string, string> {
  const out: Record<string, string> = {}
  if (!orderAvailable && c.audience === 'ALL') out.audience = '接码下单（S2）上线之前只能是「仅管理员」'
  if (c.resellerMode) out.resellerMode = '转售商模式是 P2 预留开关，尚未实现，不能打开（Q3：本期不申请转售商身份）'
  if (c.webhookEnabled) out.webhookEnabled = 'Webhook 加速是 P2 功能，尚未实现，不能打开'
  if (c.legacyOnNewEngine) out.legacyOnNewEngine = '旧单品迁入新引擎是 P5 功能（Q7：暂不迁），不能打开'
  return out
}

/**
 * 需要二次确认 / 只提示的项（§7.3）：
 *  · needConfirm：售价系数低于成本汇率（「只靠加价 y 赚钱」）；
 *  · warnings：y < 最低毛利、而且最低售价也兜不住（部分组合没有容差）。
 */
export function smsConfigWarnings(c: Pick<SmsConfig, 'saleCoef4' | 'costFx4' | 'markupCents' | 'minMarginCents' | 'minPriceCents'>): { needConfirm: string[]; warnings: string[] } {
  const needConfirm: string[] = []
  const warnings: string[] = []
  if (c.saleCoef4 < c.costFx4) needConfirm.push('售价系数低于成本汇率：只靠加价 y 赚钱，确定吗？')
  if (c.markupCents < c.minMarginCents && c.minPriceCents <= c.minMarginCents) {
    warnings.push('加价 y 低于最低毛利、最低售价也兜不住：部分组合没有容差（cap 等于报价成本，起价档卖光就取不到号）')
  }
  return { needConfirm, warnings }
}

/**
 * 纯函数：库里一行配置的版本号（乐观并发用）。行不存在、不是合法 JSON、没有 version、version 不是 [0, 2^31) 的整数，一律按 0。
 * 与 wallet_config 的 storedVersionOf 同一口径：校验不过但带 version 的行按它自己的 version，坏掉的配置才能从页面修好。
 */
export function smsStoredVersionOf(raw: string | null | undefined): number {
  if (raw == null) return 0
  try {
    const v = (JSON.parse(raw) as { version?: unknown } | null)?.version
    return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v < 2 ** 31 ? v : 0
  } catch {
    return 0
  }
}

/**
 * 纯函数：后台「设置」数字输入框的原文 → 写进草稿的值。完整的数字（「2」「2.5」「-3」）才转成 number，
 * 「2.」「0.」「-」这类输入中间态与其他文字原样保留（保存时 zod 报「必须是数字」）——原来每敲一个字就 Number()，
 * 「2.」立刻变回 2，小数点打不进去（S1 评审修复）。
 */
export function settingsNumberValue(raw: string): number | string {
  const t = raw.trim()
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : t
}

/** 纯函数：解析一行 sms_config 的原文。不是合法 JSON / 校验不过 → null（调用方按关闭处理） */
export function parseSmsConfigRaw(raw: string | null | undefined): SmsConfig | null {
  if (raw == null) return null
  let v: unknown
  try {
    v = JSON.parse(raw)
  } catch {
    return null
  }
  const c = checkSmsConfig(v)
  return c.ok ? c.config : null
}

/**
 * 接码对「全部用户」开放了吗（D28）：接码下单已交付 && 整份配置校验通过 && enabled && audience=ALL。
 * 导航「短信接码」、页脚入口、sitemap 的 /jiema、钱包的 canUseForJiema 都只看它；配置读不到（null）一律 false。
 */
export function jiemaPublicOpen(cfg: SmsConfig | null, orderAvailable: boolean = JIEMA_ORDER_AVAILABLE): boolean {
  return !!cfg && orderAvailable && cfg.enabled && cfg.audience === 'ALL'
}

/**
 * /jiema 对这个访客显示什么（纯函数；接口与页面共用）：
 *  · OPEN：对全部用户开放（导航也有）；
 *  · ADMIN_PREVIEW：管理员在灰度期 / 总开关关着时预览全部交互（「去支付」在 S2 之前不可用）；
 *  · SOON：普通用户，接码还没对他开放 →「短信接码即将开放」（§1.14「仅管理员可见」一行）；
 *  · MAINTENANCE：配置读不到（fail-closed），或曾经对全部用户开放、现在总开关关了（§1.14「板块维护」）。
 * 配置坏了管理员也看不了目录（价格要按配置算），页面给管理员提示去后台修。
 */
export type JiemaAccess = 'OPEN' | 'ADMIN_PREVIEW' | 'SOON' | 'MAINTENANCE'
export function jiemaAccessFor(cfg: SmsConfig | null, isAdmin: boolean, orderAvailable: boolean = JIEMA_ORDER_AVAILABLE): JiemaAccess {
  if (!cfg) return 'MAINTENANCE'
  if (jiemaPublicOpen(cfg, orderAvailable)) return 'OPEN'
  if (isAdmin) return 'ADMIN_PREVIEW'
  if (!cfg.enabled && cfg.audience === 'ALL') return 'MAINTENANCE'
  return 'SOON'
}
