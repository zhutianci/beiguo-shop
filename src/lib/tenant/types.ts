/**
 * 渠道分站的共享类型与常量（WP0 独占；其他包只 import，需要新增字段向 WP0 提）。
 *
 * 【纯类型 + 常量，无任何 import 副作用】partner-handlers / partner-services / 客户端组件都可以 import（边界检查规则 1–3 的白名单里都有它）。
 *
 * 【渠道侧 DTO 的三条规则】（设计 6.3、6.4）
 *  1. 字段与 src/lib/partner-services/selects.ts 的 select 白名单一一对应；selects.ts 里的 PARTNER_ALLOWED_KEYS
 *     由这里的 DTO 键名生成（编译期保证不漏），WP8 的 T10 键名扫描以它为「允许键」表。新增字段必须两处同时改。
 *  2. 不出现任何自增主键（id / userId / orderId / listingId / customerId …），一律用公开编号
 *     orderNo / listingNo / customerNo / noticeNo / requestNo / statementNo；唯一例外 productId（前台 /products/[id] 本来公开）。
 *  3. 金额一律 Int 分（字段名以 Cents 结尾），比例一律 bp；时间一律 ISO 字符串。卡密与留言正文分别叫 cardText / messageText
 *     （T10 禁用 `content` 键）。
 */

// ============================== 状态与枚举 ==============================

export type SettleState = 'ACCRUED' | 'RELEASED' | 'REVERSED' | 'EXCLUDED' | 'MISSING'
export type InvShareState = 'ACCRUED' | 'RELEASED' | 'REVERSED'
/** 不可售原因（设计 7.4；src/lib/tenant/sellable.ts 与 src/lib/pricing.ts 共用） */
export type NotSellableReason =
  | 'NOT_LISTED'
  | 'NOT_GRANTED'
  | 'NO_SUPPLY'
  | 'NOT_PRICED'
  | 'BELOW_SUPPLY'
  | 'OUT_OF_RANGE'
  | 'PRODUCT_OFF'
  | 'TENANT_INACTIVE'
export type LedgerType =
  | 'ACCRUE'
  | 'ACCRUE_INV'
  | 'RELEASE'
  | 'RELEASE_INV'
  | 'REVERSE'
  | 'SHORTPAY'
  | 'ADJUST'
  | 'STATEMENT'
  | 'PAYOUT'
  | 'WITHHOLD'
  | 'RETURN'
  | 'REPAY'
  | 'BOUNCE'
  | 'WRITEOFF'
  | 'DEPOSIT_IN'
  | 'DEPOSIT_APPLY'
  | 'DEPOSIT_REFUND'
export type LedgerComponent = 'SALE' | 'PURCHASE' | 'INVOICE_SHARE' | 'FEE' | 'INVOICE_FEE' | 'LOSS' | 'SHORT' | 'MANUAL' | 'NET'
export type LedgerBucket = 'PENDING' | 'AVAILABLE' | 'IN_PAYOUT' | 'DEPOSIT'
export type Bearer = 'PROPORTIONAL' | 'CHANNEL' | 'PLATFORM'
export type StatementState = 'GENERATED' | 'CONFIRMED' | 'DISPUTED' | 'PAYING' | 'PAID' | 'RECEIVED' | 'RETURNED'
export type StatementOrigin = 'SCHEDULE' | 'REQUEST' | 'MANUAL'
export type AfterSaleKind = 'REFUND' | 'REISSUE' | 'ESCALATE' | 'BAN_REQUEST'
export type AfterSaleStatus = 'PENDING' | 'REJECTED' | 'DONE' | 'CANCELLED'
export type TenantNoticeKind =
  | 'ORDER_PAID'
  | 'BUYER_MESSAGE'
  | 'AFTER_SALE_RESULT'
  /** 平台对本店订单退款（终审第 2 轮）：设计 8.4 ③「每次退款保存 … + 渠道通知」。站长直接退款（买家先找站长微信，11.4）
   *  不经售后申请，只靠 AFTER_SALE_RESULT 渠道就不知道余额被冲减了；列宽 VarChar(24)，新增取值不改表 */
  | 'ORDER_REFUNDED'
  | 'STATEMENT'
  | 'PAYOUT'
  | 'SUPPLY_CHANGED'
  /** 平台调价 / 新授权（主会话 D16，WP5 请求）：站长代改本店售价、新授权可售商品。与「进货价调整」分开，渠道可单独关推送 */
  | 'PLATFORM_LISTING'
  | 'AUTO_DELISTED'
  | 'PRODUCT_WITHDRAWN'
  | 'TENANT_STATUS'
  | 'NEGATIVE_BALANCE'

/** 运行时可枚举的列表（zod 枚举、通知偏好、下拉框用），与上面的联合类型一一对应（编译期校验见文件末尾） */
export const TENANT_NOTICE_KINDS = [
  'ORDER_PAID',
  'BUYER_MESSAGE',
  'AFTER_SALE_RESULT',
  'ORDER_REFUNDED',
  'STATEMENT',
  'PAYOUT',
  'SUPPLY_CHANGED',
  'PLATFORM_LISTING',
  'AUTO_DELISTED',
  'PRODUCT_WITHDRAWN',
  'TENANT_STATUS',
  'NEGATIVE_BALANCE',
] as const satisfies readonly TenantNoticeKind[]
export const LEDGER_TYPES = [
  'ACCRUE',
  'ACCRUE_INV',
  'RELEASE',
  'RELEASE_INV',
  'REVERSE',
  'SHORTPAY',
  'ADJUST',
  'STATEMENT',
  'PAYOUT',
  'WITHHOLD',
  'RETURN',
  'REPAY',
  'BOUNCE',
  'WRITEOFF',
  'DEPOSIT_IN',
  'DEPOSIT_APPLY',
  'DEPOSIT_REFUND',
] as const satisfies readonly LedgerType[]
export const LEDGER_COMPONENTS = ['SALE', 'PURCHASE', 'INVOICE_SHARE', 'FEE', 'INVOICE_FEE', 'LOSS', 'SHORT', 'MANUAL', 'NET'] as const satisfies readonly LedgerComponent[]

// ============================== 账本成分分组（设计 10.4、10.8） ==============================

/** 手续费成分：渠道看到的「手续费」= −Σ 这两类 */
export const FEE_COMPONENTS: ReadonlySet<LedgerComponent> = new Set<LedgerComponent>(['FEE', 'INVOICE_FEE'])
/** 余额成分：站长口径「余额 = 货款 + 发票分成 − 进货款 ± 售后与调整」，不扣手续费 */
export const BALANCE_COMPONENTS: ReadonlySet<LedgerComponent> = new Set<LedgerComponent>(['SALE', 'PURCHASE', 'INVOICE_SHARE', 'LOSS', 'SHORT', 'MANUAL'])
/** 货款组：跟随 Order.settleState 冻结 / 解冻 / 冲销 */
export const GOODS_GROUP: ReadonlySet<LedgerComponent> = new Set<LedgerComponent>(['SALE', 'PURCHASE', 'FEE', 'SHORT'])
/** 发票组：跟随 Order.invShareState（INVOICE_FEE 虽依赖货款，但归发票组，差额写在发票组当前所在的桶） */
export const INVOICE_GROUP: ReadonlySet<LedgerComponent> = new Set<LedgerComponent>(['INVOICE_SHARE', 'INVOICE_FEE'])

/**
 * 全局上限。费率范围与下单快照断言、超管配置校验共用（设计 5.1、5.4）；批量条数、分页、导出行数见设计 7.1、7.2、6.4.3。
 * 这些是「代码里的硬上限」，不是渠道配置：放宽任何一项都要同时评估对账与边界测试。
 */
export const LIMITS = Object.freeze({
  maxFeeBp: 2000,
  maxInvShareBp: 600,
  batchPriceMax: 200,
  batchSupplyMax: 500,
  pageMax: 100,
  exportMaxRows: 5000,
} as const) as { readonly maxFeeBp: 2000; readonly maxInvShareBp: 600; readonly batchPriceMax: 200; readonly batchSupplyMax: 500; readonly pageMax: 100; readonly exportMaxRows: 5000 }

/**
 * 可调的默认口径（Q1–Q22 未拍板项按设计推荐值；集中在这里，改一处全仓生效）。
 * 渠道级的费率、冻结期、最低结算额等以 Tenant 行为准（超管可按渠道配置），这里只是新建渠道时的默认值与全局规则。
 */
export const TENANT_DEFAULTS = Object.freeze({
  /** 手续费率默认 1.5%（站长口径） */
  feeRateBp: 150,
  /** 发票分成率默认 2%（站长口径） */
  invoiceShareRateBp: 200,
  /** Q5：冻结期首月 15 天、之后 7 天 */
  holdDaysFirstMonth: 15,
  holdDays: 7,
  /** Q8：最低结算 100 元、申请间隔 7 天 */
  minPayoutCents: 10000,
  requestIntervalDays: 7,
  /** 风控 */
  pendingOrderCap: 30,
  maxOrderQty: 10,
  /** 收款信息变更冷静期（小时） */
  payeeCooldownHours: 72,
  /** 渠道导出限额（每日次数，设计 6.2） */
  orderExportPerDay: 10,
  customerExportPerDay: 5,
  /** 渠道「申请结算」每天尝试次数上限（设计 10.9） */
  applyPerDay: 3,
  /** 订单详情 order.view 审计聚合窗口（设计 6.4.1：同一成员同一订单 10 分钟聚合一条） */
  orderViewAuditWindowMs: 10 * 60 * 1000,
} as const)

// ============================== 渠道余额与结算 ==============================

/** 一组「三个数」：payout = balance − fee（设计 10.8） */
export interface BalanceTriple {
  balanceCents: number
  feeCents: number
  payoutCents: number
}
/**
 * 余额构成（设计 10.8、12.1「余额构成」）：某个桶里各成分的合计。符号与 OrderSettlementView 相同——
 * purchaseCents、feeCents 取正的量（页面按「− 进货款」「− 手续费」显示），otherCents（售后与调整：LOSS / SHORT / MANUAL）带符号。
 * 恒等式：goods − purchase + invShare + other = 余额；余额 − fee = 预计打款。
 */
export interface BalanceComposition {
  goodsCents: number
  purchaseCents: number
  invShareCents: number
  feeCents: number
  otherCents: number
}
export interface TenantBalances {
  available: BalanceTriple
  pending: BalanceTriple
  inPayoutCents: number
  depositCents: number
  paidTotalCents: number
  withheldTotalCents: number
  negative: boolean
}
export interface OrderSettlementView {
  orderNo: string
  settleState: SettleState | null
  invShareState: InvShareState | null
  goodsCents: number
  purchaseCents: number
  invShareCents: number
  feeCents: number
  otherCents: number
  balanceCents: number
  payoutCents: number
  releaseEta: string | null /* ISO */
  bucket: 'PENDING' | 'AVAILABLE' | 'SETTLED' | 'RETURNED' | 'MIXED' | 'NONE'
  statementNo: string | null
}
/** 渠道订单详情里的结算视图：财务字段对没有 finance.read 的成员为 null（partner-services/orders.ts settlementForViewer） */
export type PartnerOrderSettlementView = Omit<OrderSettlementView, 'feeCents' | 'balanceCents' | 'payoutCents' | 'bucket' | 'statementNo'> & {
  feeCents: number | null
  balanceCents: number | null
  payoutCents: number | null
  bucket: OrderSettlementView['bucket'] | null
  statementNo: string | null
}
export type GenerateResult =
  | { ok: true; statementNo: string; netCents: number }
  | {
      ok: false
      reason: 'BELOW_MIN' | 'NEGATIVE' | 'HOLD' | 'OPEN_EXISTS' | 'PAYEE_MISSING' | 'PAYEE_COOLDOWN' | 'INTERVAL' | 'RECONCILE_FAILED'
    }

// ============================== 渠道侧 DTO（设计 6.4.3，全部不含自增主键） ==============================

export interface PartnerOrderListRow {
  orderNo: string
  productName: string
  quantity: number
  unitPriceCents: number
  amountCents: number
  invoiceTaxCents: number
  payStatus: string
  deliveryStatus: string
  createdAt: string
  paidAt: string | null
  deliveredAt: string | null
  escalatedAt: string | null
  settleState: SettleState | null
  invShareState: InvShareState | null
  refundedGoodsCents: number
  refundedTaxCents: number
  refundedQty: number
  buyer: { email: string; nickname: string | null }
  unreadMessages: number
  afterSaleStatus: string | null
}

export interface PartnerOrderDetail extends PartnerOrderListRow {
  productId: number
  buyerRemark: string | null
  invoiceInfo: unknown | null
  supplyUnitCents: number
  supplyCents: number
  feeRateBp: number
  invoiceShareRateBp: number
  settleHoldDays: number
  settleBearer: string | null
  buyer: { email: string; nickname: string | null; avatar: string | null }
  payments: { payMethod: string; amountCents: number; createdAt: string }[]
  /** 没有 finance.read 的成员拿到的是裁剪版（余额 / 预计打款 / 手续费 / 桶 / 结算单为 null，D5） */
  settlement: PartnerOrderSettlementView | null
  invoices: PartnerInvoiceDTO[]
  receipts: PartnerReceiptDTO[]
  sms: PartnerSmsDTO | null
  afterSales: { requestNo: string; kind: AfterSaleKind; status: AfterSaleStatus; resultNote: string | null; createdAt: string }[]
}

/** 交付凭据：只经 GET /api/partner/orders/[orderNo]/cards（order.cards）返回，每次查看写 card.view 审计 */
export interface PartnerDeliveryDTO {
  cards: { cardText: string; usedAt: string | null; status: string }[]
  deliveryInfo: string | null
  smsCode: string | null
  redeemLogs: { cardIndex: number; action: string; state: string; message: string | null; createdAt: string; provider: string /* 公开名 */ }[]
}

/** PARTNER_INVOICE_SELECT 全部字段，金额转分（设计 6.4.1：本站订单的发票全字段对渠道明文可见） */
export interface PartnerInvoiceDTO {
  invoiceNo: string
  sellingPriceCents: number | null
  invoiceAmountCents: number | null
  taxFeeCents: number | null
  title: string | null
  taxNumber: string | null
  address: string | null
  phone: string | null
  bankName: string | null
  bankAccount: string | null
  email: string | null
  showAiWording: boolean | null
  status: string
  payStatus: string
  paidAt: string | null
  submittedAt: string | null
  issuedAt: string | null
  createdAt: string
}

export interface PartnerReceiptDTO {
  receiptNo: string
  payerTitle: string
  amountCents: number
  issuedAt: string
  previewUrl: string
}

export interface PartnerSmsDTO {
  phone: string | null
  status: string
  numberAt: string | null
  codeAt: string | null
  expireAt: string | null
}

export interface PartnerListingDTO {
  listingNo: string
  productId: number
  name: string
  category: string | null
  supplyCents: number | null
  mainPriceCents: number
  stockLevel: string
  retailCents: number | null
  minRetailCents: number | null
  maxRetailCents: number | null
  status: 0 | 1
  sortOrder: number
  sales: number
  unitBalanceCents: number | null
  unitPayoutCents: number | null
  sellable: boolean
  reason?: NotSellableReason
  delistedReason?: string
}

export interface PartnerCustomerRow {
  customerNo: string
  email: string
  nickname: string | null
  firstSeenAt: string
  lastOrderAt: string | null
  orderCount: number
  paidCents: number
  refundCount: number
  invoiceCount: number
  tags: string[]
  blocked: boolean
  blockedByPlatform: boolean
}

/** 客户详情（WP7）：行 + 渠道备注 + 本站订单；不含 platformNote、joinedVia、平台拉黑原因 */
export interface PartnerCustomerDetail extends PartnerCustomerRow {
  avatar: string | null
  note: string | null
  /** 只在渠道自己拉黑（blockedByKind='TENANT'）时给出；平台拉黑原因永不给渠道 */
  blockReason: string | null
  orders: PartnerOrderListRow[]
}

export interface LedgerRowDTO {
  at: string
  type: LedgerType
  component: LedgerComponent
  bucket: LedgerBucket
  amountCents: number
  orderNo: string | null
  statementNo: string | null
  publicMemo: string | null
}

export interface StatementDetailDTO {
  statementNo: string
  seq: number
  origin: StatementOrigin
  periodEnd: string
  state: StatementState
  goodsCents: number
  purchaseCents: number
  invShareCents: number
  feeCents: number
  otherCents: number
  grossCents: number
  netCents: number
  lines: { at: string; type: LedgerType; component: LedgerComponent; amountCents: number; orderNo: string | null }[]
  payee: { name: string; method: string; accountMasked: string }
  voucherType: string | null
  paidAt: string | null
  tradeNoLast4: string | null
  proofUploaded: boolean
}

export interface PartnerAuditRow {
  at: string
  action: string
  actor: '平台' | string
  targetType: string | null
  targetId: string | null
  result: string
  reasonCode: string | null
  publicDiff: unknown | null
}

export interface PartnerNoticeRow {
  noticeNo: string
  kind: TenantNoticeKind
  title: string
  body: string | null
  refType: string | null
  refKey: string | null
  createdAt: string
  readAt: string | null
}

/** 留言（WP6 GET /api/partner/orders/[orderNo]/messages 的行）：sender 由 sender + senderRole 推出；mine 由 senderUserId 比对得出，id 不输出 */
export interface PartnerMessageRow {
  sender: 'BUYER' | 'PLATFORM' | 'PARTNER'
  messageText: string
  createdAt: string
  mine: boolean
}

/** 售后申请列表行（WP6 GET /api/partner/after-sales） */
export interface PartnerAfterSaleRow {
  requestNo: string
  orderNo: string | null
  /** 申请全局封禁（BAN_REQUEST）针对的本店客户编号；其余类型为 null */
  customerNo: string | null
  kind: AfterSaleKind
  status: AfterSaleStatus
  reason: string
  resultNote: string | null
  createdAt: string
  handledAt: string | null
}

/** 运营概览（仅超管） */
export interface TenantOverviewRow {
  tenantId: number
  code: string
  status: TenantStatus
  gmvCents: number
  goodsCents: number
  purchaseCents: number
  invoiceProfitCents: number
  feeIncomeCents: number
  cardMarginCents: number
  /** 站长承担、退给买家的货款 Σ(RG − Rg)（设计 10.13 第四列） */
  platformBorneRefundCents: number
  /** 渠道承担的损失（LOSS 分录，站长所得）= −Σ LOSS（设计 10.13 第四列） */
  lossCents: number
  availableCents: number
  pendingCents: number
  negative: boolean
  refundRateBp: number
  pendingAfterSales: number
}

export interface PublicProductDetail {
  /* 与现有商品详情页公开字段一致；不含 price（站长价）、supplyCents、cost —— 具体字段由 WP2 在 pricing.ts 落实时补齐 */
  id: number
  name: string
}

export interface ReferralQuote {
  /* 现有主站内推报价原样搬入 pricing.ts，此处只声明类型 */
  refCode: string
  unitCents: number
}

// 店面状态类型从 storefront 再导出一份，方便渠道层只 import 本文件（边界检查规则 2、3 不允许 import storefront/resolve）
export type TenantStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'

// ============================== 渠道接口的统一 404 ==============================

/**
 * 「不存在」与「无权」同一响应体（设计 6.3）。partner-route（守卫）与 partner-handlers/_http（业务 404）都用它，
 * 两边字节级一致，渠道无法从响应区分「这个 orderNo 存在但不是你的」和「根本不存在」。
 */
export const PARTNER_NOT_FOUND_BODY = Object.freeze({ success: false as const, error: '资源不存在' })

// ============================== 编译期一致性校验 ==============================
type _Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
const _noticeKindsComplete: _Exact<(typeof TENANT_NOTICE_KINDS)[number], TenantNoticeKind> = true
const _ledgerTypesComplete: _Exact<(typeof LEDGER_TYPES)[number], LedgerType> = true
const _ledgerComponentsComplete: _Exact<(typeof LEDGER_COMPONENTS)[number], LedgerComponent> = true
void _noticeKindsComplete
void _ledgerTypesComplete
void _ledgerComponentsComplete
