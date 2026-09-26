/**
 * 渠道侧 select 白名单（设计 6.4.3，WP0 独占）。**逐个写死字段（正向白名单）**：
 *  · 成本对渠道不是「隐藏」而是「查询里就没有这一列」（CardKey.cost / profit、SmsActivation.cost、supplyBase*、mainPriceAtOrder …）；
 *  · 每个常量 `as const satisfies Prisma.XxxSelect`：字段名写错、字段被删会直接编译失败；
 *  · 新增字段必须同时改这里、src/lib/tenant/types.ts 的 DTO、以及下面的 PARTNER_ALLOWED_KEYS（T10 的允许键表）。
 *
 * 【三类常量】
 *  1. PARTNER_*_SELECT（设计 6.4.3 表格里的 17 个）：结果经服务函数映射成 DTO 后给渠道。
 *     与表格的差异（均为实现所需、不扩大可见面）：
 *       - PARTNER_ORDER_DETAIL_SELECT.payments 只取 status=1（支付成功）的行——「买家实付」口径；
 *       - PARTNER_PRODUCT_SELECT 多选 stock（只用于 stockLevel() 换算成档位，数字本身不输出）与 category.name（DTO 的 category）。
 *  2. PARTNER_INTERNAL_*：服务端寻址 / 汇总 / 比对用的内部键（自增 id、userId、supplyVersion …），**结果绝不进 DTO**。
 *     把它们也收在这里，是为了 partner-services 里不出现任何临时手写的 select（边界检查按「只用本文件常量」核对）。
 *  3. PARTNER_ALLOWED_KEYS / PARTNER_FORBIDDEN_KEYS / PARTNER_CONTEXTUAL_KEYS：WP8 T10 键名扫描的依据。
 *
 * 【关系】CardKey、RedeemLog、SmsActivation、Invoice、Receipt 与 Order 之间没有 Prisma 关系（schema 铁律：不给现有表加外键），
 * 所以卡密 / 兑换日志 / 接码 / 票据一律先用 findTenantOrder(tenantId, orderNo, PARTNER_INTERNAL_ORDER_KEY_SELECT)
 * 取到本渠道订单的内部 id，再按 orderId / shopOrderId + tenantId 查；不存在「只凭 id 查」的路径。
 */
import type { Prisma } from '@prisma/client'
import type {
  BalanceTriple,
  GenerateResult,
  LedgerRowDTO,
  OrderSettlementView,
  PartnerAfterSaleRow,
  PartnerAuditRow,
  PartnerCustomerDetail,
  PartnerCustomerRow,
  PartnerDeliveryDTO,
  PartnerInvoiceDTO,
  PartnerListingDTO,
  PartnerMessageRow,
  PartnerNoticeRow,
  PartnerOrderDetail,
  PartnerOrderListRow,
  PartnerReceiptDTO,
  PartnerSmsDTO,
  StatementDetailDTO,
  TenantBalances,
} from '../tenant/types'
import { TENANT_NOTICE_KINDS } from '../tenant/types'

// ======================================================================
// 1. 设计 6.4.3 的 17 个白名单
// ======================================================================

export const PARTNER_ORDER_LIST_SELECT = {
  orderNo: true,
  productName: true,
  quantity: true,
  productPrice: true,
  amount: true,
  invoiceTaxFee: true,
  payStatus: true,
  deliveryStatus: true,
  createdAt: true,
  paidAt: true,
  deliveredAt: true,
  escalatedAt: true,
  settleState: true,
  invShareState: true,
  refundedGoodsCents: true,
  refundedTaxCents: true,
  refundedQty: true,
  user: { select: { email: true, nickname: true } },
} as const satisfies Prisma.OrderSelect

/** 不含 deliveryInfo、remark、id、userId、listingId、mainPriceAtOrder、settleLossCents、shortCents、shortChargedCents、settleVersion */
export const PARTNER_ORDER_DETAIL_SELECT = {
  ...PARTNER_ORDER_LIST_SELECT,
  productId: true,
  buyerRemark: true,
  invoiceInfo: true,
  supplyUnitPrice: true,
  supplyCents: true,
  feeRateBp: true,
  invoiceShareRateBp: true,
  settleHoldDays: true,
  settleBearer: true,
  user: { select: { email: true, nickname: true, avatar: true } },
  payments: { select: { payMethod: true, amount: true, createdAt: true }, where: { status: 1 }, orderBy: { createdAt: 'asc' } },
} as const satisfies Prisma.OrderSelect

/** 交付凭据：只在 order-cards.ts 使用（order.cards 权限、每次 card.view 审计） */
export const PARTNER_DELIVERY_SELECT = {
  deliveryInfo: true,
} as const satisfies Prisma.OrderSelect

/** content 在 order-cards.ts 解密后以 cardText 输出；查询条件必须带 status:'USED' 与本渠道订单 id */
export const PARTNER_CARD_SELECT = {
  content: true,
  usedAt: true,
  status: true,
} as const satisfies Prisma.CardKeySelect

/** 不含 ip、requestId、orderRef；provider 经 redeemProviderPublicName 换成公开名后输出 */
export const PARTNER_REDEEM_LOG_SELECT = {
  action: true,
  state: true,
  message: true,
  createdAt: true,
  provider: true,
} as const satisfies Prisma.RedeemLogSelect

/** 不含 activationId、cost、raw、service、country；验证码 code 属交付凭据，另见 PARTNER_SMS_CODE_SELECT */
export const PARTNER_SMS_SELECT = {
  phone: true,
  status: true,
  numberAt: true,
  codeAt: true,
  expireAt: true,
  createdAt: true,
} as const satisfies Prisma.SmsActivationSelect

/** 本站订单的发票全字段（设计 6.4.1）；金额在 DTO 里转分。不含 userId、externalOrderId、sourceKey、claudeAccount、tradeNo */
export const PARTNER_INVOICE_SELECT = {
  invoiceNo: true,
  sellingPrice: true,
  invoiceAmount: true,
  taxFee: true,
  title: true,
  taxNumber: true,
  address: true,
  phone: true,
  bankName: true,
  bankAccount: true,
  email: true,
  showAiWording: true,
  status: true,
  payStatus: true,
  paidAt: true,
  submittedAt: true,
  issuedAt: true,
  createdAt: true,
} as const satisfies Prisma.InvoiceSelect

/** token 只用于拼 previewUrl，不原样输出 */
export const PARTNER_RECEIPT_SELECT = {
  receiptNo: true,
  payerTitle: true,
  payee: true,
  amount: true,
  items: true,
  showAiWording: true,
  issuedAt: true,
  createdAt: true,
  token: true,
} as const satisfies Prisma.ReceiptSelect

/** content 以 messageText 输出；不含 id、orderId、readByAdmin、readByBuyer */
export const PARTNER_MESSAGE_SELECT = {
  sender: true,
  senderRole: true,
  content: true,
  createdAt: true,
  readByTenant: true,
} as const satisfies Prisma.OrderMessageSelect

/** blockReason 仅 blockedByKind='TENANT' 时输出；不含 id、userId、joinedVia、blockedBy、platformNote、noticeVersion */
export const PARTNER_CUSTOMER_SELECT = {
  publicNo: true,
  firstOrderAt: true,
  lastOrderAt: true,
  blockedAt: true,
  blockedByKind: true,
  blockReason: true,
  note: true,
  tags: true,
  createdAt: true,
  user: { select: { email: true, nickname: true, avatar: true } },
} as const satisfies Prisma.TenantCustomerSelect

/** 不含 id、tenantId、supplyVersion、supplyBaseKind、supplyBaseCents、updatedBy */
export const PARTNER_LISTING_SELECT = {
  publicNo: true,
  productId: true,
  supplyCents: true,
  minRetailCents: true,
  maxRetailCents: true,
  retailCents: true,
  status: true,
  sortOrder: true,
  sales: true,
  delistedReason: true,
  granted: true,
} as const satisfies Prisma.TenantListingSelect

/** price 仅渠道后台作「主站售价参考」；stock 只用于换算档位（不输出数字）。不含 apiSku、sms*、referrerBasePrice、description 以外的内部配置 */
export const PARTNER_PRODUCT_SELECT = {
  id: true,
  name: true,
  categoryId: true,
  price: true,
  status: true,
  stock: true,
  category: { select: { name: true } },
} as const satisfies Prisma.ProductSelect

/** statementId 仅用于换成 statementNo；不含 id、eventKey、leg、memo、operatorId、orderId */
export const PARTNER_LEDGER_SELECT = {
  type: true,
  component: true,
  bucket: true,
  amountCents: true,
  publicMemo: true,
  createdAt: true,
  order: { select: { orderNo: true } },
  statementId: true,
} as const satisfies Prisma.TenantLedgerEntrySelect

/** 不含 id、openKey、contentHash、payeeAccountEnc、payingBy、createdBy、requestId、disputeNote、returnReason */
export const PARTNER_STATEMENT_SELECT = {
  statementNo: true,
  seq: true,
  origin: true,
  periodEnd: true,
  lineCount: true,
  goodsCents: true,
  purchaseCents: true,
  invShareCents: true,
  feeCents: true,
  otherCents: true,
  grossCents: true,
  netCents: true,
  state: true,
  payeeName: true,
  payeeMethod: true,
  payeeAccountMasked: true,
  voucherType: true,
  createdAt: true,
} as const satisfies Prisma.TenantStatementSelect

/** externalTradeNo 只输出后四位；proofFile 只输出「已上传」布尔；不含 operatorId */
export const PARTNER_PAYOUT_SELECT = {
  amountCents: true,
  withholdCents: true,
  method: true,
  paidAt: true,
  receivedAt: true,
  externalTradeNo: true,
  proofFile: true,
} as const satisfies Prisma.TenantPayoutSelect

/**
 * 不含 diff、ip、ua、reason、viaSessionId。actorUserId 只用于把 TENANT 行换成成员昵称，平台行一律显示「平台」；
 * 查询条件必须带 tenantId 且 action ≠ 'authz.denied'（也排除 authz.noise）。
 */
export const PARTNER_AUDIT_SELECT = {
  at: true,
  actorKind: true,
  action: true,
  targetType: true,
  targetId: true,
  result: true,
  reasonCode: true,
  publicDiff: true,
  actorUserId: true,
} as const satisfies Prisma.AuditEventSelect

/** payoutHold 只给布尔（不含原因）；不含 payeeAccountEnc、wecomWebhookEnc、previewUserIds、payoutHoldReason、legalName */
export const PARTNER_TENANT_SELECT = {
  code: true,
  status: true,
  feeRateBp: true,
  invoiceShareRateBp: true,
  holdDays: true,
  minPayoutCents: true,
  requestIntervalDays: true,
  payoutHold: true,
  partyType: true,
  payeeName: true,
  payeeMethod: true,
  payeeAccountMasked: true,
  noticePrefs: true,
} as const satisfies Prisma.TenantSelect

// ======================================================================
// 2. 内部键选择器（结果绝不进 DTO）
// ======================================================================

/** 按 orderNo 取到本渠道订单后，拿内部 id 去查卡密 / 留言 / 接码 / 票据 / 售后；userId 用于客户汇总与自买判定 */
export const PARTNER_INTERNAL_ORDER_KEY_SELECT = { id: true, userId: true } as const satisfies Prisma.OrderSelect
/** 按 customerNo 取客户后，拿 userId 汇总本渠道订单；blockedByKind 用于「平台设的拉黑渠道不能解除」 */
export const PARTNER_INTERNAL_CUSTOMER_KEY_SELECT = { id: true, userId: true, blockedByKind: true } as const satisfies Prisma.TenantCustomerSelect
/** 批量改价：previewToken 里签名的 [listing 内部 id, supplyVersion]；productId 用于取商品信息 */
export const PARTNER_INTERNAL_LISTING_KEY_SELECT = { id: true, supplyVersion: true, productId: true } as const satisfies Prisma.TenantListingSelect
/** 留言的 mine 判定（senderUserId === ctx.userId）；兑换日志按卡归组 */
export const PARTNER_INTERNAL_MESSAGE_KEY_SELECT = { senderUserId: true } as const satisfies Prisma.OrderMessageSelect
export const PARTNER_INTERNAL_CARD_KEY_SELECT = { id: true } as const satisfies Prisma.CardKeySelect
export const PARTNER_INTERNAL_REDEEM_KEY_SELECT = { cardKeyId: true } as const satisfies Prisma.RedeemLogSelect
/** 按卡密明文反查「本渠道已售卡」所在订单：取 CardKey.orderId 拼 where（再断言该订单属于本渠道） */
export const PARTNER_INTERNAL_CARD_ORDER_SELECT = { orderId: true } as const satisfies Prisma.CardKeySelect
/** 售后列表把 orderId 换成 orderNo 用 */
export const PARTNER_INTERNAL_AFTER_SALE_KEY_SELECT = { orderId: true, customerId: true } as const satisfies Prisma.TenantAfterSaleSelect
/** 售后列表把 customerId 换成 customerNo（申请全局封禁那一类没有订单，只挂客户）；id 只用于对应回行，不输出 */
export const PARTNER_INTERNAL_CUSTOMER_NO_SELECT = { id: true, publicNo: true } as const satisfies Prisma.TenantCustomerSelect
/** 接受邀请：邀请行的内部字段（接口只回 204 / 404，不出任何字段） */
export const PARTNER_INTERNAL_INVITE_SELECT = {
  id: true,
  tenantId: true,
  emailHash: true,
  role: true,
  perms: true,
  expiresAt: true,
  usedAt: true,
  revokedAt: true,
  invitedBy: true,
} as const satisfies Prisma.TenantInviteSelect
/** 接受邀请：已有成员行时判断「是否已是有效成员」 */
export const PARTNER_INTERNAL_MEMBER_STATE_SELECT = { status: true, role: true } as const satisfies Prisma.TenantMemberSelect
/** 操作日志：批量判定哪些操作者是本渠道成员（含已停用） */
export const PARTNER_INTERNAL_MEMBER_KEY_SELECT = { userId: true } as const satisfies Prisma.TenantMemberSelect
/** 操作日志：成员显示名（昵称优先、否则邮箱）；id 只用于在服务端把名字对回行，不输出 */
export const PARTNER_INTERNAL_ACTOR_SELECT = { id: true, nickname: true, email: true } as const satisfies Prisma.UserSelect
/** 导出水印：只读**当前成员本人**的邮箱与昵称（设计 6.2：文件带成员名与时间水印） */
export const PARTNER_INTERNAL_SELF_SELECT = { email: true, nickname: true } as const satisfies Prisma.UserSelect
/** 申请结算前置条件里的「收款信息冷静期」：只用来算提示与 nextApplyAt，原值不输出 */
export const PARTNER_INTERNAL_TENANT_APPLY_SELECT = { payeeChangedAt: true } as const satisfies Prisma.TenantSelect
/** 接码验证码：属于交付凭据，只在 order-cards.ts 另选（设计 6.4.3） */
export const PARTNER_SMS_CODE_SELECT = { code: true } as const satisfies Prisma.SmsActivationSelect
/** 售后申请（渠道 DTO 用 requestNo，不含 id、orderId、customerId、activeKey、handledBy、requestedBy、bearer 与退款金额内部字段） */
export const PARTNER_AFTER_SALE_SELECT = {
  requestNo: true,
  kind: true,
  status: true,
  reason: true,
  resultNote: true,
  createdAt: true,
  handledAt: true,
} as const satisfies Prisma.TenantAfterSaleSelect
/** 通知（noticeNo = publicNo） */
export const PARTNER_NOTICE_SELECT = {
  publicNo: true,
  kind: true,
  title: true,
  body: true,
  refType: true,
  refKey: true,
  createdAt: true,
  readAt: true,
} as const satisfies Prisma.TenantNoticeSelect

// ======================================================================
// 3. T10 键名表
// ======================================================================

/** 编译期断言：K 恰好列全了 T 的全部键（DTO 加字段忘了登记 → 编译失败） */
type Complete<T, K extends readonly PropertyKey[]> = [Exclude<keyof T, K[number]>] extends [never] ? true : never
function dtoKeys<T>() {
  return <K extends readonly (keyof T)[]>(keys: K, _complete: Complete<T, K>): readonly string[] => keys as unknown as readonly string[]
}

const ORDER_LIST_KEYS = dtoKeys<PartnerOrderListRow>()(
  [
    'orderNo',
    'productName',
    'quantity',
    'unitPriceCents',
    'amountCents',
    'invoiceTaxCents',
    'payStatus',
    'deliveryStatus',
    'createdAt',
    'paidAt',
    'deliveredAt',
    'escalatedAt',
    'settleState',
    'invShareState',
    'refundedGoodsCents',
    'refundedTaxCents',
    'refundedQty',
    'buyer',
    'unreadMessages',
    'afterSaleStatus',
  ] as const,
  true,
)
const ORDER_DETAIL_KEYS = dtoKeys<PartnerOrderDetail>()(
  [
    'orderNo',
    'productName',
    'quantity',
    'unitPriceCents',
    'amountCents',
    'invoiceTaxCents',
    'payStatus',
    'deliveryStatus',
    'createdAt',
    'paidAt',
    'deliveredAt',
    'escalatedAt',
    'settleState',
    'invShareState',
    'refundedGoodsCents',
    'refundedTaxCents',
    'refundedQty',
    'buyer',
    'unreadMessages',
    'afterSaleStatus',
    'productId',
    'buyerRemark',
    'invoiceInfo',
    'supplyUnitCents',
    'supplyCents',
    'feeRateBp',
    'invoiceShareRateBp',
    'settleHoldDays',
    'settleBearer',
    'payments',
    'settlement',
    'invoices',
    'receipts',
    'sms',
    'afterSales',
  ] as const,
  true,
)
const BUYER_KEYS = dtoKeys<PartnerOrderDetail['buyer']>()(['email', 'nickname', 'avatar'] as const, true)
const PAYMENT_KEYS = dtoKeys<PartnerOrderDetail['payments'][number]>()(['payMethod', 'amountCents', 'createdAt'] as const, true)
const ORDER_AFTER_SALE_KEYS = dtoKeys<PartnerOrderDetail['afterSales'][number]>()(['requestNo', 'kind', 'status', 'resultNote', 'createdAt'] as const, true)
const SETTLEMENT_KEYS = dtoKeys<OrderSettlementView>()(
  [
    'orderNo',
    'settleState',
    'invShareState',
    'goodsCents',
    'purchaseCents',
    'invShareCents',
    'feeCents',
    'otherCents',
    'balanceCents',
    'payoutCents',
    'releaseEta',
    'bucket',
    'statementNo',
  ] as const,
  true,
)
const DELIVERY_KEYS = dtoKeys<PartnerDeliveryDTO>()(['cards', 'deliveryInfo', 'smsCode', 'redeemLogs'] as const, true)
const CARD_KEYS = dtoKeys<PartnerDeliveryDTO['cards'][number]>()(['cardText', 'usedAt', 'status'] as const, true)
const REDEEM_KEYS = dtoKeys<PartnerDeliveryDTO['redeemLogs'][number]>()(['cardIndex', 'action', 'state', 'message', 'createdAt', 'provider'] as const, true)
const INVOICE_KEYS = dtoKeys<PartnerInvoiceDTO>()(
  [
    'invoiceNo',
    'sellingPriceCents',
    'invoiceAmountCents',
    'taxFeeCents',
    'title',
    'taxNumber',
    'address',
    'phone',
    'bankName',
    'bankAccount',
    'email',
    'showAiWording',
    'status',
    'payStatus',
    'paidAt',
    'submittedAt',
    'issuedAt',
    'createdAt',
  ] as const,
  true,
)
const RECEIPT_KEYS = dtoKeys<PartnerReceiptDTO>()(['receiptNo', 'payerTitle', 'amountCents', 'issuedAt', 'previewUrl'] as const, true)
const SMS_KEYS = dtoKeys<PartnerSmsDTO>()(['phone', 'status', 'numberAt', 'codeAt', 'expireAt'] as const, true)
const LISTING_KEYS = dtoKeys<PartnerListingDTO>()(
  [
    'listingNo',
    'productId',
    'name',
    'category',
    'supplyCents',
    'mainPriceCents',
    'stockLevel',
    'retailCents',
    'minRetailCents',
    'maxRetailCents',
    'status',
    'sortOrder',
    'sales',
    'unitBalanceCents',
    'unitPayoutCents',
    'sellable',
    'reason',
    'delistedReason',
  ] as const,
  true,
)
const CUSTOMER_KEYS = dtoKeys<PartnerCustomerRow>()(
  [
    'customerNo',
    'email',
    'nickname',
    'firstSeenAt',
    'lastOrderAt',
    'orderCount',
    'paidCents',
    'refundCount',
    'invoiceCount',
    'tags',
    'blocked',
    'blockedByPlatform',
  ] as const,
  true,
)
const CUSTOMER_DETAIL_KEYS = dtoKeys<PartnerCustomerDetail>()(
  [
    'customerNo',
    'email',
    'nickname',
    'firstSeenAt',
    'lastOrderAt',
    'orderCount',
    'paidCents',
    'refundCount',
    'invoiceCount',
    'tags',
    'blocked',
    'blockedByPlatform',
    'avatar',
    'note',
    'blockReason',
    'orders',
  ] as const,
  true,
)
const LEDGER_KEYS = dtoKeys<LedgerRowDTO>()(['at', 'type', 'component', 'bucket', 'amountCents', 'orderNo', 'statementNo', 'publicMemo'] as const, true)
const STATEMENT_KEYS = dtoKeys<StatementDetailDTO>()(
  [
    'statementNo',
    'seq',
    'origin',
    'periodEnd',
    'state',
    'goodsCents',
    'purchaseCents',
    'invShareCents',
    'feeCents',
    'otherCents',
    'grossCents',
    'netCents',
    'lines',
    'payee',
    'voucherType',
    'paidAt',
    'tradeNoLast4',
    'proofUploaded',
  ] as const,
  true,
)
const STATEMENT_LINE_KEYS = dtoKeys<StatementDetailDTO['lines'][number]>()(['at', 'type', 'component', 'amountCents', 'orderNo'] as const, true)
const PAYEE_KEYS = dtoKeys<StatementDetailDTO['payee']>()(['name', 'method', 'accountMasked'] as const, true)
const AUDIT_KEYS = dtoKeys<PartnerAuditRow>()(['at', 'action', 'actor', 'targetType', 'targetId', 'result', 'reasonCode', 'publicDiff'] as const, true)
const NOTICE_KEYS = dtoKeys<PartnerNoticeRow>()(['noticeNo', 'kind', 'title', 'body', 'refType', 'refKey', 'createdAt', 'readAt'] as const, true)
const MESSAGE_KEYS = dtoKeys<PartnerMessageRow>()(['sender', 'messageText', 'createdAt', 'mine'] as const, true)
const AFTER_SALE_ROW_KEYS = dtoKeys<PartnerAfterSaleRow>()(
  ['requestNo', 'orderNo', 'customerNo', 'kind', 'status', 'reason', 'resultNote', 'createdAt', 'handledAt'] as const,
  true,
)
const BALANCES_KEYS = dtoKeys<TenantBalances>()(
  ['available', 'pending', 'inPayoutCents', 'depositCents', 'paidTotalCents', 'withheldTotalCents', 'negative'] as const,
  true,
)
const TRIPLE_KEYS = dtoKeys<BalanceTriple>()(['balanceCents', 'feeCents', 'payoutCents'] as const, true)
type GenerateKeys = keyof Extract<GenerateResult, { ok: true }> | keyof Extract<GenerateResult, { ok: false }>
const GENERATE_KEYS: readonly GenerateKeys[] = ['ok', 'statementNo', 'netCents', 'reason']
/** PARTNER_TENANT_SELECT 的键（设置页原样输出这些字段） */
const TENANT_SETTING_KEYS = Object.keys(PARTNER_TENANT_SELECT)

/**
 * 渠道接口的外层与 WP6 / WP7 契约里的响应键（实施分包 9.4、10.4）。响应里出现这里没有的键，T10 就报错——
 * 需要新键时向 WP0 提（改这张表），不要在 handler 里绕开。
 */
const ENVELOPE_KEYS = [
  // 通用外层
  'success', 'data', 'error', 'message', 'total', 'rows', 'page', 'pageSize',
  // 看板（WP6）
  'today', 'd7', 'month', 'orders', 'goodsCents', 'purchaseCents', 'invShareCents', 'feeCents', 'balanceCents', 'payoutCents',
  'balances', 'todo', 'unreadMessages', 'pendingAfterSales', 'autoDelisted', 'canApply', 'topProducts', 'name', 'qty',
  // 商品池批量（WP6）
  'updated', 'rejected', 'skipped', 'reason', 'previewToken', 'listingNo', 'supplyCents', 'oldRetailCents', 'newRetailCents',
  'unitBalanceCents', 'unitPayoutCents', 'reject',
  // 售后 / 通知（WP6 / WP7）
  'requestNo', 'count',
  // 结算中心（WP7）
  'rates', 'formula', 'applyBlockReason', 'nextApplyAt', 'releaseCalendar', 'date', 'productName', 'quantity', 'tradeNoLast4', 'paidAt',
  // 结算中心：余额构成、订单明细的退款与承担方（终审完整性 #19；内层键 goodsCents 等已在结算视图键里）
  'composition', 'otherCents', 'refundedGoodsCents', 'refundedTaxCents', 'settleBearer',
  // 设置（WP7）
  'tenant', 'webhookConfigured', 'noticePrefs', 'prefs',
] as const

/**
 * 渠道接口响应允许出现的全部 JSON 键（T10「允许键」表）。由上面的 DTO 键表 + 外层键 + 通知类型名（noticePrefs 的键）生成。
 */
export const PARTNER_ALLOWED_KEYS: ReadonlySet<string> = new Set<string>([
  ...ORDER_LIST_KEYS,
  ...ORDER_DETAIL_KEYS,
  ...BUYER_KEYS,
  ...PAYMENT_KEYS,
  ...ORDER_AFTER_SALE_KEYS,
  ...SETTLEMENT_KEYS,
  ...DELIVERY_KEYS,
  ...CARD_KEYS,
  ...REDEEM_KEYS,
  ...INVOICE_KEYS,
  ...RECEIPT_KEYS,
  ...SMS_KEYS,
  ...LISTING_KEYS,
  ...CUSTOMER_KEYS,
  ...CUSTOMER_DETAIL_KEYS,
  ...LEDGER_KEYS,
  ...STATEMENT_KEYS,
  ...STATEMENT_LINE_KEYS,
  ...PAYEE_KEYS,
  ...AUDIT_KEYS,
  ...NOTICE_KEYS,
  ...MESSAGE_KEYS,
  ...AFTER_SALE_ROW_KEYS,
  ...BALANCES_KEYS,
  ...TRIPLE_KEYS,
  ...GENERATE_KEYS,
  ...TENANT_SETTING_KEYS,
  ...ENVELOPE_KEYS,
  ...TENANT_NOTICE_KINDS,
])

/**
 * 渠道响应里绝不能出现的键（设计 6.6 T10、6.4.2）。与 PARTNER_ALLOWED_KEYS 不相交（check 脚本校验），
 * 例外见 PARTNER_CONTEXTUAL_KEYS。deliveryInfo 只允许出现在 /cards 响应（由 T10 按路由判断）。
 */
export const PARTNER_FORBIDDEN_KEYS: ReadonlySet<string> = new Set<string>([
  'cost', 'profit', 'passwordHash', 'balance', 'vipLevel', 'registeredTenantId', 'referralCode', 'ip', 'ua', 'userAgent',
  'requestId', 'orderRef', 'contentHash', 'content', 'apiSku', 'smsMaxPrice', 'referrerBasePrice', 'activationId', 'raw',
  'eventKey', 'memo', 'operatorId', 'actorUserId', 'diff', 'remark', 'supplyBaseKind', 'supplyBaseCents', 'supplyVersion',
  'updatedBy', 'payoutHoldReason', 'payeeAccountEnc', 'wecomWebhookEnc', 'previewUserIds', 'blockedBy', 'platformNote',
  'joinedVia', 'handledBy', 'requestedBy', 'mainPriceAtOrder', 'settleLossCents', 'shortCents', 'shortChargedCents',
  'settleVersion', 'id', 'userId', 'orderId', 'listingId', 'customerId', 'tenantId', 'token',
])

/**
 * 只在特定父键下允许的键。`phone`：接码号码（sms.phone）、发票电话（invoices[].phone）与订单详情里买家填的开票信息
 * （invoiceInfo.phone，WP6 偏差 6）对渠道明文可见（设计 6.4.1），
 * 但 User.phone 在 Q20 拍板前不给（6.4.2 第 6 条）——所以 phone 只允许出现在这三个父键下面，别处出现即违规。
 * `deliveryInfo`：只允许在 /cards 响应的顶层（PartnerDeliveryDTO），父键记为 '(cards)'，由 T10 按路由匹配。
 */
export const PARTNER_CONTEXTUAL_KEYS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  phone: ['sms', 'invoices', 'invoiceInfo'],
  deliveryInfo: ['(cards)'],
})
