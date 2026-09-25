/**
 * 营销推广模块的共享契约：文档模型、受众、配置、各状态枚举，以及后台接口的出入参形状。
 *
 * 【同构】本文件会被浏览器（编辑器、预览）与服务端（快照、发送）同时 import：
 * 只许依赖 zod，不许 import prisma / fs / crypto / window。
 *
 * 契约的来龙去脉见 docs/营销推广-设计.md。改这里的任何形状，前后端要一起改。
 */
import { z } from 'zod'

/* ============================== 基础枚举 ============================== */

export const TOPICS = ['PROMO', 'PRODUCT', 'NEWS'] as const
export type Topic = (typeof TOPICS)[number]
export const TOPIC_LABEL: Record<Topic, string> = {
  PROMO: '优惠活动',
  PRODUCT: '新品上架',
  NEWS: '资讯教程',
}

export const CAMPAIGN_STATUSES = ['DRAFT', 'SCHEDULED', 'SENDING', 'PAUSED', 'COMPLETED', 'CANCELLED'] as const
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]
export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  DRAFT: '草稿',
  SCHEDULED: '待发送',
  SENDING: '发送中',
  PAUSED: '已暂停',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

export const MESSAGE_STATUSES = ['QUEUED', 'CLAIMED', 'SENDING', 'SENT', 'FAILED', 'SKIPPED', 'CANCELLED', 'UNKNOWN'] as const
export type MessageStatus = (typeof MESSAGE_STATUSES)[number]
export const MESSAGE_STATUS_LABEL: Record<MessageStatus, string> = {
  QUEUED: '排队中',
  CLAIMED: '准备发送',
  SENDING: '发送中',
  SENT: '已发送',
  FAILED: '失败',
  SKIPPED: '已跳过',
  CANCELLED: '已取消',
  UNKNOWN: '结果未知',
}

export const SKIP_REASONS = [
  'DISABLED',
  'NO_EMAIL',
  'TEST_ADDRESS',
  'SUPPRESSED',
  'UNSUBSCRIBED',
  'PAUSED',
  'TOPIC_OFF',
  'NO_CONSENT',
  'SUNSET',
  'INACTIVE',
  'FREQ_CAP',
] as const
export type SkipReason = (typeof SKIP_REASONS)[number]
export const SKIP_REASON_LABEL: Record<SkipReason, string> = {
  DISABLED: '账号已禁用',
  NO_EMAIL: '没有邮箱',
  TEST_ADDRESS: '测试地址',
  SUPPRESSED: '在抑制名单',
  UNSUBSCRIBED: '已退订',
  PAUSED: '暂停接收中',
  TOPIC_OFF: '关闭了该主题',
  NO_CONSENT: '未明确订阅',
  SUNSET: '长期未互动（多封未点击）',
  INACTIVE: '长期不活跃',
  FREQ_CAP: '触达频率上限',
}

export const DELIVERY_STATUSES = ['DELIVERED', 'INVALID', 'SPAM', 'FAILED'] as const
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number]

export const CONSENT_STATUSES = ['DEFAULT', 'SUBSCRIBED', 'UNSUBSCRIBED'] as const
export type ConsentStatus = (typeof CONSENT_STATUSES)[number]

export const SUPPRESSION_REASONS = ['HARD_BOUNCE', 'SOFT_BOUNCE', 'COMPLAINT', 'INVALID', 'MANUAL'] as const
export type SuppressionReason = (typeof SUPPRESSION_REASONS)[number]
export const SUPPRESSION_REASON_LABEL: Record<SuppressionReason, string> = {
  HARD_BOUNCE: '硬退信（地址不存在）',
  SOFT_BOUNCE: '连续软退信',
  COMPLAINT: '投诉为垃圾邮件',
  INVALID: '无效地址',
  MANUAL: '手动加入',
}
/** 管理员可以解除的抑制原因。COMPLAINT 永不解除（设计文档 10.3） */
export const UNSUPPRESSIBLE_REASONS: SuppressionReason[] = ['MANUAL', 'INVALID', 'HARD_BOUNCE', 'SOFT_BOUNCE']

export const CONSENT_SOURCES = ['register', 'profile', 'token_page', 'one_click', 'admin', 'complaint', 'aliyun_sync'] as const
export type ConsentSource = (typeof CONSENT_SOURCES)[number]

export const CONSENT_ACTIONS = ['NOTICE', 'SUBSCRIBE', 'UNSUBSCRIBE', 'TOPICS', 'PAUSE', 'RESUME'] as const
export type ConsentAction = (typeof CONSENT_ACTIONS)[number]

export const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'DUPLICATE',
  'TEST_SEND',
  'LAUNCH',
  'PAUSE',
  'RESUME',
  'CANCEL',
  'UNSCHEDULE',
  'REQUEUE',
  'AUTO_PAUSE',
  'HALT',
  'CLEAR_HALT',
  'CONFIG',
  'SUPPRESS',
  'UNSUPPRESS',
  'SET_CONSENT',
  'TEMPLATE',
  'COMPLETE',
  'START',
] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]

/** 文字里允许作者使用的变量（系统占位 {{mkt_*}} 由渲染器生成，作者不得手写） */
export const MERGE_TAGS = ['nickname', 'email', 'coupon_expires'] as const
export type MergeTag = (typeof MERGE_TAGS)[number]
export const MERGE_TAG_LABEL: Record<MergeTag, string> = {
  nickname: '昵称',
  email: '收件邮箱',
  coupon_expires: '券到期日',
}
/** 主题里只允许昵称变量 */
export const SUBJECT_MERGE_TAGS: MergeTag[] = ['nickname']
/** 变量默认值的合法字符（lint 与个性化共用） */
export const MERGE_DEFAULT_RE = /^[^{}|<>&"']{1,20}$/
export const DEFAULT_GREETING_NAME = '朋友'

/* ============================== 富文本 ============================== */

export const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/
export const BLOCK_ID_RE = /^[A-Za-z0-9_-]{1,32}$/

const hex = z.string().regex(HEX_COLOR_RE, '颜色必须是 #RRGGBB')
const align = z.enum(['left', 'center', 'right'])
export type Align = z.infer<typeof align>

const markSchema = z.union([
  z.object({ type: z.enum(['bold', 'italic', 'underline', 'strike']) }).strip(),
  z.object({ type: z.literal('link'), attrs: z.object({ href: z.string().max(2000) }).strip() }).strip(),
  z
    .object({ type: z.literal('textStyle'), attrs: z.object({ color: hex.nullable().optional() }).strip() })
    .strip(),
])
export type RichMark = z.infer<typeof markSchema>

const inlineSchema = z.union([
  z.object({ type: z.literal('text'), text: z.string().min(1).max(5000), marks: z.array(markSchema).max(8).optional() }).strip(),
  z.object({ type: z.literal('hardBreak') }).strip(),
])
export type RichInline = z.infer<typeof inlineSchema>

const paragraphSchema = z
  .object({ type: z.literal('paragraph'), content: z.array(inlineSchema).max(400).optional() })
  .strip()
const listItemSchema = z.object({ type: z.literal('listItem'), content: z.array(paragraphSchema).min(1).max(10) }).strip()
const listSchema = z
  .object({ type: z.enum(['bulletList', 'orderedList']), content: z.array(listItemSchema).min(1).max(50) })
  .strip()

export const richDocSchema = z
  .object({ type: z.literal('doc'), content: z.array(z.union([paragraphSchema, listSchema])).max(100) })
  .strip()
export type RichDoc = z.infer<typeof richDocSchema>
export type RichBlockNode = RichDoc['content'][number]

/* ============================== 邮件文档 ============================== */

const boxSchema = z
  .object({
    padTop: z.number().int().min(0).max(64).optional(),
    padBottom: z.number().int().min(0).max(64).optional(),
    bg: hex.optional(),
  })
  .strip()
export type Box = z.infer<typeof boxSchema>

export const docSettingsSchema = z
  .object({
    backdrop: hex,
    canvas: hex,
    brand: hex,
    accent: hex,
    text: hex,
    muted: hex,
    link: hex,
    font: z.enum(['sans', 'serif']),
    radius: z.number().int().min(0).max(24),
    darkMode: z.enum(['auto', 'light-only']),
  })
  .strip()
export type DocSettings = z.infer<typeof docSettingsSchema>

const url = z.string().trim().max(2000)
const shortText = (max: number) => z.string().max(max)

const buttonLite = z
  .object({ label: shortText(40), href: url, bg: hex, color: hex })
  .strip()

const couponGrantSchema = z
  .object({
    kind: z.enum(['THRESHOLD', 'PRODUCT']),
    discount: z.number().positive().max(100000),
    minAmount: z.number().min(0).max(1000000),
    productIds: z.array(z.number().int().positive()).max(50),
    validity: z.union([
      z.object({ mode: z.literal('days'), days: z.number().int().min(1).max(60) }).strip(),
      z.object({ mode: z.literal('until'), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).strip(),
    ]),
  })
  .strip()
export type CouponGrantSpec = z.infer<typeof couponGrantSchema>

const blockBase = { id: z.string().regex(BLOCK_ID_RE), box: boxSchema.optional() }

export const blockSchema = z.discriminatedUnion('type', [
  z
    .object({
      ...blockBase,
      type: z.literal('header'),
      logo: z.boolean(),
      title: shortText(40),
      bg: hex,
      bg2: hex.optional(),
      color: hex,
      align,
    })
    .strip(),
  z
    .object({
      ...blockBase,
      type: z.literal('hero'),
      title: shortText(80),
      subtitle: shortText(200).optional(),
      bg: hex,
      bg2: hex.optional(),
      color: hex,
      align,
      image: url.optional(),
      imageAlt: shortText(120).optional(),
      button: buttonLite.optional(),
    })
    .strip(),
  z.object({ ...blockBase, type: z.literal('heading'), content: richDocSchema, level: z.union([z.literal(1), z.literal(2), z.literal(3)]), align }).strip(),
  z
    .object({
      ...blockBase,
      type: z.literal('text'),
      content: richDocSchema,
      align,
      size: z.union([z.literal(14), z.literal(15), z.literal(16), z.literal(18)]),
    })
    .strip(),
  z
    .object({
      ...blockBase,
      type: z.literal('image'),
      src: url,
      alt: shortText(120),
      width: z.number().int().min(20).max(100),
      href: url.optional(),
      align,
      radius: z.number().int().min(0).max(24).optional(),
    })
    .strip(),
  z
    .object({
      ...blockBase,
      type: z.literal('button'),
      label: shortText(40),
      href: url,
      bg: hex,
      color: hex,
      radius: z.number().int().min(0).max(40),
      align,
      fullWidth: z.boolean(),
      size: z.enum(['sm', 'md', 'lg']),
    })
    .strip(),
  z
    .object({
      ...blockBase,
      type: z.literal('product'),
      productId: z.number().int().positive(),
      layout: z.enum(['card', 'row']),
      ctaLabel: shortText(20),
      showOriginalPrice: z.boolean(),
      showFeatures: z.boolean(),
    })
    .strip(),
  z
    .object({
      ...blockBase,
      type: z.literal('productGrid'),
      productIds: z.array(z.number().int().positive()).min(2).max(6),
      ctaLabel: shortText(20),
      showFeatures: z.boolean(),
    })
    .strip(),
  z
    .object({
      ...blockBase,
      type: z.literal('coupon'),
      mode: z.enum(['grant', 'claim']),
      title: shortText(40),
      note: shortText(120).optional(),
      ctaLabel: shortText(20),
      bg: hex,
      color: hex,
      grant: couponGrantSchema.optional(),
      claimCode: z.string().regex(/^[a-z0-9-]{3,32}$/).optional(),
    })
    .strip(),
  z
    .object({
      ...blockBase,
      type: z.literal('callout'),
      content: richDocSchema,
      tone: z.enum(['brand', 'info', 'success', 'warning']),
    })
    .strip(),
  z
    .object({
      ...blockBase,
      type: z.literal('divider'),
      color: hex,
      thickness: z.union([z.literal(1), z.literal(2)]),
      widthPct: z.union([z.literal(30), z.literal(60), z.literal(100)]),
    })
    .strip(),
  z.object({ ...blockBase, type: z.literal('spacer'), height: z.number().int().min(8).max(96) }).strip(),
])
export type Block = z.infer<typeof blockSchema>
export type BlockType = Block['type']
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>

export const BLOCK_TYPE_LABEL: Record<BlockType, string> = {
  header: '页眉',
  hero: '头图横幅',
  heading: '标题',
  text: '正文',
  image: '图片',
  button: '按钮',
  product: '商品卡片',
  productGrid: '商品组（两列）',
  coupon: '优惠券',
  callout: '提示框',
  divider: '分割线',
  spacer: '留白',
}

export const MAX_BLOCKS = 40
export const MAX_IMAGES = 12
export const MAX_DOC_JSON_BYTES = 200 * 1024
export const MAX_HTML_BYTES = 80 * 1024
export const WARN_HTML_BYTES = 60 * 1024

export const emailDocSchema = z
  .object({
    v: z.literal(1),
    settings: docSettingsSchema,
    blocks: z.array(blockSchema).min(1, '至少要有一个区块').max(MAX_BLOCKS, `最多 ${MAX_BLOCKS} 个区块`),
  })
  .strip()
  .superRefine((doc, ctx) => {
    const ids = new Set<string>()
    for (const b of doc.blocks) {
      if (ids.has(b.id)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `区块 id 重复：${b.id}` })
      ids.add(b.id)
    }
  })
export type EmailDoc = z.infer<typeof emailDocSchema>

/* ============================== 受众 ============================== */

export const segmentRulesSchema = z
  .object({
    registeredWithinDays: z.number().int().min(1).max(3650).optional(),
    registeredBeforeDays: z.number().int().min(1).max(3650).optional(),
    paid: z.enum(['any', 'yes', 'no']).optional(),
    lastPaidWithinDays: z.number().int().min(1).max(3650).optional(),
    noPaidWithinDays: z.number().int().min(1).max(3650).optional(),
    spendMin: z.number().min(0).optional(),
    spendMax: z.number().min(0).optional(),
    boughtProductIds: z.array(z.number().int().positive()).max(100).optional(),
    boughtCategoryIds: z.array(z.number().int().positive()).max(100).optional(),
    vipLevels: z.array(z.number().int().min(0).max(20)).max(20).optional(),
    excludeInactive: z.boolean().optional(),
  })
  .strip()
export type SegmentRules = z.infer<typeof segmentRulesSchema>

export const MAX_USERS_AUDIENCE = 5000

export const audienceSpecSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ALL'), excludeInactive: z.boolean() }).strip(),
  z.object({ type: z.literal('SEGMENT'), rules: segmentRulesSchema }).strip(),
  z
    .object({
      type: z.literal('USERS'),
      userIds: z.array(z.number().int().positive()).max(MAX_USERS_AUDIENCE, `手工指定最多 ${MAX_USERS_AUDIENCE} 人`),
    })
    .strip(),
])
export type AudienceSpec = z.infer<typeof audienceSpecSchema>
export const DEFAULT_AUDIENCE: AudienceSpec = { type: 'ALL', excludeInactive: true }

/** 一键预设（界面上的筛选芯片）。boughtBrand 由服务端按商品名/分类名匹配成商品 id */
export const SEGMENT_PRESETS: { key: string; label: string; rules: SegmentRules }[] = [
  { key: 'recent-buyers', label: '最近 90 天付过款', rules: { lastPaidWithinDays: 90 } },
  { key: 'lapsed', label: '付过款但 90 天未回购', rules: { paid: 'yes', noPaidWithinDays: 90 } },
  { key: 'new-no-order', label: '注册 30 天内未下单', rules: { registeredWithinDays: 30, paid: 'no' } },
  { key: 'vip-silver', label: 'VIP 白银及以上', rules: { vipLevels: [1, 2, 3] } },
]

/* ============================== 策略配置 ============================== */

export const SUBJECT_PREFIXES = ['(AD)', '【广告】', 'AD '] as const

export const marketingConfigSchema = z
  .object({
    enabled: z.boolean(),
    defaultEligible: z.boolean(),
    fromAlias: z.string().trim().min(1).max(14),
    subjectPrefix: z.enum(SUBJECT_PREFIXES),
    companyName: z.string().trim().min(1).max(60),
    brandName: z.string().trim().min(1).max(20),
    contactEmail: z.union([z.literal(''), z.string().trim().email().max(100)]),
    footerNote: z.string().max(300),
    testRecipients: z.array(z.string().trim().toLowerCase().email().max(100)).max(10),
    ratePerSec: z.number().min(0.2).max(2),
    dailyCap: z.number().int().min(1).max(100000),
    maxQuotaShare: z.number().min(0.1).max(0.9),
    sendWindow: z
      .object({ start: z.number().int().min(0).max(23), end: z.number().int().min(1).max(24) })
      .strip()
      .refine((w) => w.end > w.start, '结束时间要晚于开始时间'),
    warmup: z
      .object({ enabled: z.boolean(), schedule: z.array(z.number().int().min(10).max(100000)).min(1).max(10) })
      .strip(),
    canarySize: z.number().int().min(10).max(500),
    freq: z
      .object({
        minHours: z.number().int().min(0).max(720),
        max7d: z.number().int().min(1).max(20),
        max30d: z.number().int().min(1).max(60),
      })
      .strip(),
    sunset: z.object({ enabled: z.boolean() }).strip(),
    includeTextBody: z.boolean(),
    attributionDays: z.number().int().min(1).max(30),
  })
  .strip()
export type MarketingConfig = z.infer<typeof marketingConfigSchema>

export const DEFAULT_CONFIG: MarketingConfig = {
  enabled: true,
  defaultEligible: true,
  fromAlias: '贝果科技',
  subjectPrefix: '(AD)',
  companyName: '益阳市赫山区必高科技有限公司',
  brandName: '贝果科技',
  contactEmail: '',
  footerNote: '',
  testRecipients: [],
  ratePerSec: 1,
  dailyCap: 2000,
  maxQuotaShare: 0.6,
  sendWindow: { start: 9, end: 21 },
  warmup: { enabled: true, schedule: [200, 500, 1000, 2000] },
  canarySize: 50,
  freq: { minHours: 24, max7d: 2, max30d: 4 },
  sunset: { enabled: true },
  includeTextBody: true,
  attributionDays: 5,
}

/** 页脚渲染需要的配置子集（渲染器是同构的，不能直接读库） */
export type FooterConfig = Pick<MarketingConfig, 'companyName' | 'brandName' | 'contactEmail' | 'footerNote' | 'subjectPrefix'>

/* ============================== 运行时状态（Setting 表） ============================== */

export const SETTING_KEYS = {
  config: 'marketing_config',
  halt: 'mkt_halt',
  account: 'mkt_account',
  sync: 'mkt_sync',
} as const

export interface HaltState {
  /** ISO 时间；now < until 即急停中 */
  until: string | null
  reason: string | null
  at: string | null
  /** 'system' 或管理员 id */
  by: string | null
  /**
   * 急停的种类。'acct_breaker' = 账户级熔断；其余（结果未知 / 同步中断 / 额度 / 配置 / 反垃圾）为 null。
   * 管理员解除急停时，只有解除的是账户级熔断，才移动 acctSince（审查 C1）
   */
  kind?: string | null
  /**
   * 账户级熔断的统计起点（ISO）。管理员解除「账户级熔断」时写入，之后的其他急停原样保留它，
   * 这样解除过的回执不会在别的急停过期后被重新计入，解除无关急停也不会把当天回执悄悄清零（审查 C1）
   */
  acctSince?: string | null
}
export const EMPTY_HALT: HaltState = { until: null, reason: null, at: null, by: null, kind: null, acctSince: null }

export interface AccountState {
  dailyQuota: number
  monthQuota: number | null
  quotaLevel: number | null
  maxQuotaLevel: number | null
  userStatus: number
  ipChannelType: string | null
  remainFreeQuota: number | null
  fetchedAt: string
}

export interface SyncState {
  lastOkAt: string | null
  lastRunAt: string | null
  lastError: string | null
  /** ListBlockSending 游标（Unix 秒） */
  blockCursor: number | null
  /** QueryInvalidAddress 上次拉取到的北京日期 YYYY-MM-DD */
  invalidCursor: string | null
  /** 收件域名 → 退避到期（ISO） */
  domainBackoff: Record<string, string>
}
export const EMPTY_SYNC: SyncState = {
  lastOkAt: null,
  lastRunAt: null,
  lastError: null,
  blockCursor: null,
  invalidCursor: null,
  domainBackoff: {},
}

/** 快照时写入 campaign.refs，发送期间每趟复核 */
export interface CampaignRefs {
  products: { id: number; price: string }[]
  couponId: number | null
  claimCode: string | null
  /** 券限定的商品（商品券）：邮件里写了「适用商品：X」，发送期间要复核它们仍在售（审查 C9）。旧快照没有这个字段 */
  couponProducts?: number[]
}

/**
 * 投递回执里「发信方的问题」（我方 SPF/DKIM/DMARC 认证失败、发信人或域名被收件方/黑名单拉黑）：
 * 不是收件人的问题 —— 不计入该地址的软退信连击，但计入熔断（比例过高说明我方发信出了故障，应停发）。审查 C19
 */
export const SENDER_SIDE_CLASSES = ['SmtpAuthFail', 'SmtpSpfFail', 'SmtpDmaFail', 'SmtpMfBad', 'SmtpDbl'] as const

/* ============================== 渲染 ============================== */

/** 渲染器需要的商品数据（服务端从库里按 PUBLIC_PRODUCT_SELECT 取，已做绝对 URL 处理） */
export interface ProductCard {
  id: number
  name: string
  /** 售价（不含税），两位小数字符串 */
  price: string
  originalPrice: string | null
  /** 绝对 https 图片 URL；没有或不可用于邮件（webp 等）时为 null */
  image: string | null
  features: string[]
  /** 绝对 URL：<origin>/products/<id> */
  url: string
  /** 1 = 在售 */
  status: number
}

/** 渲染器需要的优惠券展示数据 */
export interface CouponView {
  mode: 'grant' | 'claim'
  kind: 'THRESHOLD' | 'PRODUCT'
  discount: string
  minAmount: string
  /** 商品券限定的商品名（已截断） */
  productNames: string[]
  /** 领取模式：绝对 URL <origin>/coupon/<code>；直发模式：<origin>/coupons */
  url: string
  /** 展示用的有效期文字，如「领取后 7 天内有效」「2026年10月7日前有效」；直发时正文可另用 {{coupon_expires}} */
  validityText: string
}

export type RenderMode = 'preview' | 'test' | 'send'

export interface RenderCtx {
  mode: RenderMode
  subject: string
  preheader: string
  /** 站点根，如 https://bigolab.com（来自 siteOrigin()，不硬编码） */
  origin: string
  footer: FooterConfig
  products: Record<number, ProductCard>
  /** 文档里第一个 coupon 区块对应的展示数据；没有券区块或解析失败时为 null */
  coupon: CouponView | null
  /** preview/test 模式下直接替换的变量值；send 模式不传（输出占位符） */
  vars?: Partial<Record<MergeTag, string>>
  /** send 模式：登记链接并返回占位 {{mkt_link:N}}。preview/test 不传则原样输出 URL */
  linkWrap?: (url: string, label: string) => string
  /** preview 模式：高亮的区块 */
  selectedBlockId?: string | null
  /** preview：用无图模式渲染（img 换成 alt 文字块） */
  imagesOff?: boolean
}

export interface RenderResult {
  html: string
  text: string
  /** send 模式下 linkWrap 登记过的链接（其余模式为空数组） */
  links: { idx: number; url: string; label: string }[]
  /** 不含 preview 专用标记的字节数（UTF-8） */
  sizeBytes: number
  imageCount: number
}

/* ============================== 检查 ============================== */

export interface LintIssue {
  level: 'error' | 'warn'
  code: string
  message: string
  blockId?: string
}

/* ============================== 后台接口 DTO ============================== */

export interface CampaignListItem {
  id: number
  name: string
  topic: Topic
  status: CampaignStatus
  statusNote: string | null
  subject: string
  scheduledAt: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  recipientCount: number
  counts: { sent: number; failed: number; skipped: number; queued: number; unknown: number }
  delivered: number
  uniqueClicks: number
  unsubscribes: number
  complaints: number
  orders: number
  revenue: string
}

export interface CampaignDetail {
  id: number
  name: string
  topic: Topic
  status: CampaignStatus
  statusNote: string | null
  subject: string
  preheader: string
  doc: EmailDoc
  audience: AudienceSpec
  scheduledAt: string | null
  materializedAt: string | null
  startedAt: string | null
  completedAt: string | null
  testedAt: string | null
  /** 最近一次测试时的内容指纹是否等于当前内容 */
  testedCurrent: boolean
  contentHash: string
  couponId: number | null
  recipientCount: number
  createdAt: string
  updatedAt: string
}

export interface AudiencePreview {
  matched: number
  eligible: number
  excluded: Partial<Record<SkipReason, number>>
  /** 以计划发送时间估算，会因频控被跳过 / 延后的人数 */
  freqCapEstimate: number
  sample: { id: number; email: string; nickname: string | null }[]
}

export interface EtaDay {
  /** 北京日期 YYYY-MM-DD */
  date: string
  count: number
}

export interface EtaResult {
  startAt: string | null
  finishAt: string | null
  perDay: EtaDay[]
  /** 主要限速因素：warmup | quota | dailyCap | window | queue（排在前面的活动） */
  blockedBy: string[]
}

export interface CheckResult {
  issues: LintIssue[]
  audience: AudiencePreview
  eta: EtaResult
  coupon: { maxCount: number; maxGiveaway: string } | null
  contentHash: string
  testedCurrent: boolean
  canLaunch: boolean
}

export interface WaitingReason {
  code:
    | 'none'
    | 'disabled'
    | 'halted'
    | 'window'
    | 'budget'
    | 'canary'
    | 'queue'
    | 'scheduled'
    | 'paused'
    | 'freq'
    | 'backoff'
    | 'sync'
  text: string
  until?: string | null
}

export interface CampaignReport {
  campaign: CampaignDetail
  waiting: WaitingReason
  progress: { total: number; done: number; queued: number; percent: number }
  funnel: {
    recipients: number
    sent: number
    delivered: number
    invalid: number
    spam: number
    failed: number
    unknown: number
    skipped: number
    uniqueOpens: number
    uniqueClicks: number
    botClicks: number
    unsubscribes: number
    complaints: number
    orders: number
    revenue: string
    influencedOrders: number
    influencedRevenue: string
  }
  rates: {
    deliveryRate: number | null
    clickRate: number | null
    clickToOpen: number | null
    unsubscribeRate: number | null
    complaintRate: number | null
    invalidRate: number | null
  }
  skipReasons: Partial<Record<SkipReason, number>>
  links: { idx: number; url: string; label: string | null; clicks: number }[]
  orders: { orderNo: string; userId: number; email: string; productName: string; amount: string; paidAt: string; clickedAt: string }[]
  timeline: { at: string; action: string; actor: string | null; detail: string | null }[]
  coupon: { id: number; code: string; granted: number; used: number } | null
}

export interface MessageRow {
  id: number
  userId: number | null
  email: string
  nickname: string | null
  status: MessageStatus
  skipReason: SkipReason | null
  sentAt: string | null
  delivery: DeliveryStatus | null
  deliveryDetail: string | null
  errorCode: string | null
  openedAt: string | null
  clickedAt: string | null
  clickCount: number
  unsubscribedAt: string | null
  complainedAt: string | null
}

export interface ConfigResponse {
  config: MarketingConfig
  defaults: MarketingConfig
  sender: { address: string | null; configured: boolean; dryRun: boolean }
  halt: HaltState & { active: boolean }
  account: AccountState | null
  sync: SyncState
  today: {
    date: string
    used: number
    limit: number
    parts: { dailyCap: number; quotaCap: number; warmupCap: number | null; quota: number; quotaAssumed: boolean }
    warmupLevel: number
    inWindow: boolean
  }
  checklist: { key: string; ok: boolean; text: string }[]
}

export interface SubscriberStats {
  totalUsers: number
  withEmail: number
  eligibleNow: number
  byStatus: Record<ConsentStatus, number>
  paused: number
  suppressed: Partial<Record<SuppressionReason, number>>
}

export interface SubscriberRow {
  userId: number
  email: string | null
  nickname: string | null
  status: ConsentStatus
  topicsOff: Topic[]
  pausedUntil: string | null
  suppressed: SuppressionReason | null
  lastSentAt: string | null
  sentCount: number
}

export interface UserMarketingSummary {
  userId: number
  email: string | null
  status: ConsentStatus
  topicsOff: Topic[]
  pausedUntil: string | null
  suppressed: { reason: SuppressionReason; at: string; detail: string | null } | null
  logs: { at: string; action: ConsentAction; source: string; detail: string | null }[]
  messages: {
    campaignId: number
    campaignName: string
    status: MessageStatus
    sentAt: string | null
    delivery: DeliveryStatus | null
    clickedAt: string | null
    unsubscribedAt: string | null
  }[]
}

export interface CatalogResponse {
  products: ProductCard[]
  coupons: {
    code: string
    name: string
    kind: 'THRESHOLD' | 'PRODUCT'
    discount: string
    minAmount: string
    remaining: number
    endAt: string | null
  }[]
}

export interface TemplateItem {
  key: string // 内置：preset:<key>；自存：tpl:<id>
  name: string
  description: string
  topic: Topic
  builtIn: boolean
  updatedAt: string | null
}

/** 公开退订页 GET /api/mkt/prefs/[token] 的返回 */
export interface PrefsState {
  emailMasked: string
  status: ConsentStatus
  topicsOff: Topic[]
  pausedUntil: string | null
  /** 该消息发送 30 天内：允许恢复订阅 / 打开主题 / 取消暂停 */
  canIncrease: boolean
  test?: boolean
}

/** 个人中心 GET /api/account/marketing */
export interface AccountMarketingState {
  status: ConsentStatus
  topicsOff: Topic[]
  pausedUntil: string | null
  defaultEligible: boolean
  email: string | null
}

/* ============================== 小工具（同构） ============================== */

export function parseTopicsOff(raw: string | null | undefined): Topic[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is Topic => (TOPICS as readonly string[]).includes(s))
}

export function serializeTopicsOff(list: readonly Topic[]): string | null {
  const uniq = Array.from(new Set(list.filter((t) => (TOPICS as readonly string[]).includes(t))))
  return uniq.length ? uniq.join(',') : null
}

export function emailDomain(email: string): string {
  const at = email.lastIndexOf('@')
  return at >= 0 ? email.slice(at + 1).toLowerCase() : ''
}

/** 截断外部文字以适配 VarChar 列宽（MySQL 严格模式超长直接报错） */
export function clip(s: string | null | undefined, n: number): string | null {
  if (s == null) return null
  const str = String(s)
  return str.length > n ? str.slice(0, n) : str
}

/** 测试域名：物化时直接跳过（seed 与 itest 造的账号） */
export function isTestAddress(email: string): boolean {
  const d = emailDomain(email)
  return (
    !d ||
    /\.(local|test|invalid|example)$/.test(d) ||
    d === 'example.com' ||
    d === 'example.org' ||
    d === 'example.net'
  )
}

export function maskEmailLite(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return '***'
  const name = email.slice(0, at)
  const keep = name.length <= 2 ? name.slice(0, 1) : name.slice(0, 2)
  return `${keep}***${email.slice(at)}`
}
