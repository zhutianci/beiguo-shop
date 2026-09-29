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

// ───────────────────────── 号码页 JiemaOrderView（S2，§6.4） ─────────────────────────

export type SmsOrderStateView =
  | 'PENDING_PAY'
  | 'CLOSED'
  | 'READY'
  | 'ACQUIRING'
  | 'WAITING'
  | 'REPLACING'
  | 'CANCELLING'
  | 'RECEIVED'
  | 'FINISHED'
  | 'REFUNDING'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'MANUAL'

export interface JiemaOrderView {
  orderNo: string
  orderId: number
  state: SmsOrderStateView
  version: number
  service: { code: string; name: string }
  country: { id: number; name: string; iso2: string | null; dial: string | null }
  operator: { code: string; name: string } | null
  priceCents: number
  pay: {
    mode: 'ALIPAY' | 'BALANCE' | 'MIXED'
    balanceCents: number
    balanceTopupCents: number
    balanceCashCents: number
    alipayCents: number
    alipayPaidCents: number | null
    holdState: 'HELD' | 'CAPTURED' | 'RELEASED' | 'REFUNDED' | null
  }
  quoteExpiresAt: string | null
  cashierUrl: string | null
  /** 收银台二维码的截止时刻（PENDING_PAY 且有有效收款单时；待支付卡片的倒计时，§1.10。S2b 增补字段，实施偏差 S2b） */
  cashierExpiresAt: string | null
  /** 下单时间（「复制订单信息」用，§8.2。S2b 增补字段） */
  createdAt: string
  /** 取号 / 换号进度（ACQUIRING、REPLACING 时给：第几次取号、是否「结果未知，正在确认」；S2b 增补字段） */
  progress: { tries: number; maxTries: number; confirming: boolean } | null
  number: { dial: string | null; national: string; full: string; endsAt: string; waitUntil: string | null; canActAt: string; seq: number; canGetAnotherSms: boolean | null } | null
  replace: { used: number; left: number }
  messages: Array<{ id: number; code: string | null; text: string | null; sender: string | null; at: string; seq: number; toOldNumber: boolean }>
  history: Array<{ seq: number; phone: string; outcome: 'REPLACED' | 'CANCELLED' | 'FAILED' | 'RECEIVED'; at: string }>
  refund: { cents: number; topupCents: number; cashCents: number; at: string; reason: string } | null
  lateCredits: Array<{ cents: number; at: string; kind: 'LATE' | 'DUPLICATE' }>
  replaceBlocked: 'THREADS' | null
  actions: { pay: boolean; close: boolean; replace: boolean; cancel: boolean; finish: boolean; start: boolean; refundReady: boolean; complain: boolean; message: boolean }
  /**
   * 售后申请（S3，E17、§1.10）：state 只给买家三种（管理员正在退款的 APPROVING 对买家就是 OPEN「处理中」）；
   * reply = 驳回时客服的回复（同时发到订单留言）。字段名刻意不用 note / status（FORBIDDEN_BUYER_KEYS）。S3 增补字段，实施偏差 S3
   */
  complaint: { state: 'OPEN' | 'REFUNDED' | 'REJECTED'; reason: string; reasonText: string; detail: string | null; reply: string | null; createdAt: string; handledAt: string | null } | null
  /** 售后申请截止时刻（首次收码 + complaintWindowH 小时；没收到码、已申请、已退款时为 null）。S3 增补字段 */
  complainUntil: string | null
  notice: string | null
  serverNow: string
  pollMs: number
}

/** 取消 / 退款原因 → 买家文案（附录 A；不出现上游名称） */
export const REFUND_REASON_TEXT: Readonly<Record<string, string>> = Object.freeze({
  EXPIRED: '号码到期，没有收到短信',
  BUYER_CANCEL: '你已取消',
  ACQUIRE_FAILED: '暂时没有可用号码',
  PRICE_UP: '这个国家/地区的价格刚刚上涨',
  SERVICE_NA: '接码服务暂时不可用',
  COMBO_NA: '这个组合暂时不可用',
  LATE_START_REFUND: '按你的选择退回余额',
  HOLD: '服务暂时不可用，已退回余额',
  MAINTENANCE: '服务暂时不可用，已退回余额',
  UPSTREAM_ENDED: '号码已失效，未收到短信，已退回余额',
  ADMIN_CANCEL: '客服已为你取消',
  COMPLAINT: '售后审核通过',
})

export function refundReasonText(code: string | null | undefined): string {
  return (code && REFUND_REASON_TEXT[code]) || '已退回余额'
}

/** 售后申请的入口（S3 上线后为 true；S2 期间恒为 false，号码页不出现「申请售后」按钮） */
export const COMPLAINT_AVAILABLE = true

/** 号码页每个状态的建议轮询间隔（终态 0，前端停止轮询） */
export function pollMsFor(state: string): number {
  if (['FINISHED', 'CANCELLED', 'REFUNDED', 'CLOSED'].includes(state)) return 0
  if (state === 'MANUAL') return 15_000
  return 3_000
}

/** 白名单构造（逐字段，不做 {...row} 展开）：结果里绝不会出现 FORBIDDEN_BUYER_KEYS 的任何一个 */
export function toJiemaOrderView(v: JiemaOrderView): JiemaOrderView {
  return {
    orderNo: v.orderNo,
    orderId: v.orderId,
    state: v.state,
    version: v.version,
    service: { code: v.service.code, name: v.service.name },
    country: { id: v.country.id, name: v.country.name, iso2: v.country.iso2, dial: v.country.dial },
    operator: v.operator ? { code: v.operator.code, name: v.operator.name } : null,
    priceCents: v.priceCents,
    pay: {
      mode: v.pay.mode,
      balanceCents: v.pay.balanceCents,
      balanceTopupCents: v.pay.balanceTopupCents,
      balanceCashCents: v.pay.balanceCashCents,
      alipayCents: v.pay.alipayCents,
      alipayPaidCents: v.pay.alipayPaidCents,
      holdState: v.pay.holdState,
    },
    quoteExpiresAt: v.quoteExpiresAt,
    cashierUrl: v.cashierUrl,
    cashierExpiresAt: v.cashierExpiresAt,
    createdAt: v.createdAt,
    progress: v.progress ? { tries: v.progress.tries, maxTries: v.progress.maxTries, confirming: v.progress.confirming } : null,
    number: v.number
      ? {
          dial: v.number.dial,
          national: v.number.national,
          full: v.number.full,
          endsAt: v.number.endsAt,
          waitUntil: v.number.waitUntil,
          canActAt: v.number.canActAt,
          seq: v.number.seq,
          canGetAnotherSms: v.number.canGetAnotherSms,
        }
      : null,
    replace: { used: v.replace.used, left: v.replace.left },
    messages: v.messages.map((m) => ({ id: m.id, code: m.code, text: m.text, sender: m.sender, at: m.at, seq: m.seq, toOldNumber: m.toOldNumber })),
    history: v.history.map((h) => ({ seq: h.seq, phone: h.phone, outcome: h.outcome, at: h.at })),
    refund: v.refund ? { cents: v.refund.cents, topupCents: v.refund.topupCents, cashCents: v.refund.cashCents, at: v.refund.at, reason: v.refund.reason } : null,
    lateCredits: v.lateCredits.map((l) => ({ cents: l.cents, at: l.at, kind: l.kind })),
    replaceBlocked: v.replaceBlocked,
    actions: { ...v.actions },
    complaint: v.complaint
      ? { state: v.complaint.state, reason: v.complaint.reason, reasonText: v.complaint.reasonText, detail: v.complaint.detail, reply: v.complaint.reply, createdAt: v.complaint.createdAt, handledAt: v.complaint.handledAt }
      : null,
    complainUntil: v.complainUntil,
    notice: v.notice,
    serverNow: v.serverNow,
    pollMs: v.pollMs,
  }
}

// ───────────────────────── 我的接码记录（S3，GET /api/jiema/orders，§1.11、§6.4 RecordItem） ─────────────────────────

/**
 * 记录页的一行（本人、主站；白名单逐字段构造）。号码是买家自己的号（不打码，号码页本来就全显示）；验证码只给最新一条且没过保存期的。
 * 不出现成本、上限、两个系数、activationId、上游原文、错误码原文、流水备注与 bizKey（附录 B 第 7 条）。
 */
export interface JiemaRecordItem {
  orderNo: string
  state: SmsOrderStateView
  service: { code: string; name: string }
  country: { id: number; name: string; iso2: string | null }
  operator: string | null
  priceCents: number
  payMode: 'ALIPAY' | 'BALANCE' | 'MIXED'
  /** 当前号码（没有当前号时取最后一个取到的号）；待支付 / 已关闭 / 取号失败的单为 null */
  number: { dial: string | null; national: string; seq: number } | null
  /** 最新一条验证码（没识别出、已清除时为 null） */
  code: string | null
  smsCount: number
  createdAt: string
  /** 倒计时的终点：等码 = 主动取消时刻；收码 = 号码结束前 30 秒；待支付 = 收银台截止（没有收款单时锁价截止）；其余 null */
  deadline: string | null
  /** 已取消 / 售后退款：退回余额的总额（两格之和） */
  refundCents: number | null
  /** 已关闭：预扣原路退回的金额（纯支付宝单为 null） */
  releasedCents: number | null
  /** 关单后 / 重复付款退入余额的合计（LATEPAY，本人） */
  lateCents: number
  complaint: 'OPEN' | 'REFUNDED' | 'REJECTED' | null
}

export function toJiemaRecordItem(x: JiemaRecordItem): JiemaRecordItem {
  return {
    orderNo: x.orderNo,
    state: x.state,
    service: { code: x.service.code, name: x.service.name },
    country: { id: x.country.id, name: x.country.name, iso2: x.country.iso2 },
    operator: x.operator,
    priceCents: x.priceCents,
    payMode: x.payMode,
    number: x.number ? { dial: x.number.dial, national: x.number.national, seq: x.number.seq } : null,
    code: x.code,
    smsCount: x.smsCount,
    createdAt: x.createdAt,
    deadline: x.deadline,
    refundCents: x.refundCents,
    releasedCents: x.releasedCents,
    lateCents: x.lateCents,
    complaint: x.complaint,
  }
}
