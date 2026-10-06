/**
 * 内容平台的规则（docs/内容平台/内容平台-设计.md §6、§8.1、§10.1、§11.1）。
 *
 * 纯函数，不 import prisma / next/*，方便 scripts/check-content-policy.ts 直接测。
 * 「谁能直接发布」「什么内容进待审」「哪条帖子可以交给搜索引擎」都只在这里判定一次，
 * 页面的 robots meta、sitemap、IndexNow 三处共用 isIndexable（照 lib/news/thin.ts 的 shouldNoindexEvent 的做法），
 * 不允许各写一份——两份实现迟早会漂移，漂移的结果是「sitemap 里提交了一个页面自己说 noindex 的 URL」。
 */

// ─────────────────────────────── 枚举 ───────────────────────────────

export const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

/** 原创声明（设计 §6.1）。只有 ORIGINAL_FIRST 能进精选、拿激励、被收录 */
export const ORIGINALITY = ['ORIGINAL_FIRST', 'ORIGINAL_ELSEWHERE', 'REPOST'] as const
export type Originality = (typeof ORIGINALITY)[number]
export const ORIGINALITY_LABELS: Record<Originality, string> = {
  ORIGINAL_FIRST: '原创首发',
  ORIGINAL_ELSEWHERE: '原创（已在别处发布）',
  REPOST: '转载 / 改编',
}

/** 正文是否用 AI 辅助撰写（设计 §6.3）。MAJOR 不进精选、不收录；出图本身是 AI 生成不受这条限制 */
export const AI_ASSIST = ['NONE', 'PARTIAL', 'MAJOR'] as const
export type AiAssist = (typeof AI_ASSIST)[number]
export const AI_ASSIST_LABELS: Record<AiAssist, string> = {
  NONE: '没有使用 AI',
  PARTIAL: '部分使用（润色、翻译、整理）',
  MAJOR: '主要由 AI 生成',
}

// ─────────────────────────────── 信任等级（§8.1） ───────────────────────────────

/**
 * 0 新人 / 1 成员 / 2 创作者 / 9 管理员。L3 共建者要靠站长邀请，P2 才有存储字段，P0 不出现。
 *
 * 只升不降：入参全是「累计」口径（过审数、精选数、注册时长），删帖不会让等级掉下去。
 * 违规降级等 P2 有了违规记录再做。
 */
export type TrustLevel = 0 | 1 | 2 | 9

export interface TrustInput {
  role: string
  createdAt: Date
  /** 本人已过审的帖子数（含已被删除的：只升不降） */
  approvedPosts: number
  /** 本人被精选的帖子数 */
  featuredPosts: number
}

export const L1_MIN_ACCOUNT_DAYS = 7
export const L2_MIN_FEATURED = 3

export function trustLevelFrom(u: TrustInput, now: Date = new Date()): TrustLevel {
  if (u.role === 'ADMIN') return 9
  if (u.featuredPosts >= L2_MIN_FEATURED) return 2
  const ageDays = (now.getTime() - u.createdAt.getTime()) / 86_400_000
  if (u.approvedPosts >= 1 && ageDays >= L1_MIN_ACCOUNT_DAYS) return 1
  return 0
}

export const TRUST_LABELS: Record<TrustLevel, string> = { 0: '新人', 1: '成员', 2: '创作者', 9: '管理员' }

// ─────────────────────────────── 内容风险检测（§10.1） ───────────────────────────────

export type ContentFlag = 'link' | 'contact' | 'sensitive'

/**
 * 只是「转人工」的信号，不直接拒绝：误报的代价是多等一次审核，漏报的代价是一条垃圾内容公开。
 * 词表是兜底的下限，不是完整的审核——上线后按待审队列里真实出现的东西往里加。
 */
const SENSITIVE_WORDS = [
  // 设计 §2「明确不做的」：越狱 / 破限 / 擦边
  '破限', '越狱', 'jailbreak', '擦边', '色情', '裸照', '约炮',
  // 赌博、诈骗、违禁
  '博彩', '赌博', '赌场', '代孕', '刷单', '洗钱', '套现', '办证', '枪支',
  // 设计 §1.3：接码、账号、KYC 类内容不收（反诈法风险）
  '卖号', '收号', '实名号', '过人脸', '绕过kyc', '绕过 kyc',
]

const CONTACT_PATTERNS: RegExp[] = [
  /(?:微信|weixin|wechat|vx|v信|wx|薇信|威信)\s*(?:号)?\s*[:：]?\s*[a-zA-Z][-_a-zA-Z0-9]{5,19}/i,
  /(?:qq|扣扣|企鹅)\s*(?:号|群)?\s*[:：]?\s*\d{5,11}/i,
  /(?<!\d)1[3-9]\d{9}(?!\d)/, // 大陆手机号
  /(?:t\.me|telegram\.me)\//i,
  /(?:加我|私信我|联系我|找我)\s*(?:微信|vx|qq|v|wx)/i,
]

const URL_RE = /https?:\/\/[^\s)\]>"'<]+/gi

/** 站内地址不算外链。hosts 传本站域名（含 www 与否都写上），测试时可以注入 */
export function externalLinks(text: string, siteHosts: readonly string[]): string[] {
  const out: string[] = []
  // Array.from：tsconfig 的 target 不支持直接 for…of 迭代 matchAll 的结果
  for (const m of Array.from(text.matchAll(URL_RE))) {
    let host = ''
    try {
      host = new URL(m[0]).hostname.toLowerCase()
    } catch {
      out.push(m[0])
      continue
    }
    if (!siteHosts.some((h) => host === h || host.endsWith(`.${h}`))) out.push(m[0])
  }
  return out
}

export function contentFlags(text: string, siteHosts: readonly string[]): ContentFlag[] {
  const flags: ContentFlag[] = []
  if (externalLinks(text, siteHosts).length) flags.push('link')
  if (CONTACT_PATTERNS.some((re) => re.test(text))) flags.push('contact')
  const lower = text.toLowerCase()
  if (SENSITIVE_WORDS.some((w) => lower.includes(w))) flags.push('sensitive')
  return flags
}

export const FLAG_LABELS: Record<ContentFlag, string> = {
  link: '含外链',
  contact: '疑似联系方式',
  sensitive: '命中敏感词',
}

// ─────────────────────────────── 审核判定（§10.1） ───────────────────────────────

/**
 * 新帖的审核状态。
 *  - 管理员：直接通过
 *  - L2 创作者：先发后审；但命中联系方式 / 敏感词仍进待审（外链对创作者是正常的引用）
 *  - L0 新人、L1 成员：一律先审后发（设计 §8.1：L1 解锁的是外链可点和评论免审，不是发帖免审）
 */
export function postReviewOnCreate(level: TrustLevel, flags: readonly ContentFlag[]): ReviewStatus {
  if (level === 9) return 'APPROVED'
  if (level === 2) return flags.includes('contact') || flags.includes('sensitive') ? 'PENDING' : 'APPROVED'
  return 'PENDING'
}

/**
 * 作者修改了标题或正文之后的审核状态。
 *
 * 【为什么已过审的帖子改了要重审】否则「先发一篇干净的混过审核，再改成广告」就是一条稳定的绕过路径。
 * 代价是 L0/L1 作者改错别字也要等一次审核——页面上会明确提示，可以接受。
 * 被驳回的帖子修改后回到待审，等于「按驳回意见改完重新提交」。
 */
export function postReviewOnEdit(level: TrustLevel, flags: readonly ContentFlag[], current: string): ReviewStatus {
  if (level === 9) return current === 'REJECTED' ? 'PENDING' : (current as ReviewStatus)
  if (level === 2) {
    if (flags.includes('contact') || flags.includes('sensitive')) return 'PENDING'
    return current === 'REJECTED' ? 'PENDING' : 'APPROVED'
  }
  return 'PENDING'
}

/**
 * 评论的审核状态。评论默认即发即显（买家的提问不该等审核），只有命中风险的进待审：
 *  - 联系方式 / 敏感词：除管理员外一律待审
 *  - 外链：只有 L0 新人待审（设计 §8.1：L1 起外链可用）
 */
export function commentReviewOnCreate(level: TrustLevel, flags: readonly ContentFlag[]): ReviewStatus {
  if (level === 9) return 'APPROVED'
  if (flags.includes('contact') || flags.includes('sensitive')) return 'PENDING'
  if (level === 0 && flags.includes('link')) return 'PENDING'
  return 'APPROVED'
}

// ─────────────────────────────── 可见性 ───────────────────────────────

export interface VisibilityInput {
  status: number
  reviewStatus: string
  deletedAt: Date | null
  userId: number | null
}

/** 对所有人公开：前台列表、详情、评论区、搜索引擎都只看这一种 */
export function isPublic(p: VisibilityInput): boolean {
  return p.status === 1 && p.reviewStatus === 'APPROVED' && !p.deletedAt
}

/**
 * 某个具体访客能不能打开详情页：公开的谁都能看；待审 / 被驳回 / 被隐藏的只有作者本人和管理员能看
 * （作者要能看到「审核中」「驳回原因」）。已删除的谁都看不到（管理员在后台看）。
 */
export function canView(p: VisibilityInput, viewer: { userId: number | null; isAdmin: boolean }): boolean {
  if (p.deletedAt) return false
  if (isPublic(p)) return true
  if (viewer.isAdmin) return true
  return !!p.userId && p.userId === viewer.userId
}

// ─────────────────────────────── 收录闸门（§11.1） ───────────────────────────────

/**
 * 总开关。默认关：老论坛按 seo/restructure 的决定整体 noindex，
 * 内容平台的收录从 P1（提示词库 + 教程上线、站方种子内容就位）开始逐条放开（设计 §11.1「慢放量」）。
 * 10-07 起改为运行时读环境变量 CONTENT_INDEXING_OPEN（=1 才打开），开关不用重新构建、只重启 app。
 * 打开是一次需要站长确认的上线动作，不要顺手设。只在服务端用（robots / sitemap / IndexNow / 详情页 meta）。
 */
export const INDEXING_OPEN = process.env.CONTENT_INDEXING_OPEN === '1'

export interface IndexableInput extends VisibilityInput {
  content: string
  originality: string
  aiAssist: string
  commentCount: number
  /** 缺省按 DISCUSSION（P0 的老帖子没有这一列的语义） */
  type?: string
  /** PROMPT 专用：提示词全文 */
  promptText?: string | null
  /** PROMPT 专用：出图张数（帖子 images） */
  imageCount?: number
  /** PROMPT 专用：是否关联了模型标签 */
  hasModel?: boolean
  /** PROMPT 专用：模型标签的大类 IMAGE | VIDEO | TEXT（见 lib/content/tags.ts 的 Facet） */
  facet?: string | null
  /** GUIDE 专用：作者声明的测试日期 */
  testedOn?: Date | null
  /** GUIDE 专用：站方据官方文档整理、核对资料的日期（不是亲测） */
  checkedOn?: Date | null
  /** APP 专用：是否作者自荐 */
  selfPromo?: boolean
  featured?: boolean
}

/**
 * 按类型的质量门槛（设计 §11.1）。阈值是我们自己定的，不是官方数字；
 * 上线后按 Search Console「已抓取 - 尚未编入索引」的比例调。
 */
export const MIN_INDEXABLE_CHARS = 300 // DISCUSSION：正文
export const MIN_INDEXABLE_REPLIES = 3 // DISCUSSION：或者有这么多条回复
export const MIN_PROMPT_CHARS = 20 // PROMPT：提示词本身
export const MIN_PROMPT_NOTES = 50 // PROMPT：心得 / 说明（正文）——或者有 ≥2 张出图
export const MIN_GUIDE_CHARS = 600 // GUIDE：正文（不含代码块）
export const MIN_APP_CHARS = 200 // APP：「我用它解决了什么」（设计 §5.3）
export const MIN_TEXT_PROMPT_CHARS = 40 // 文本类提示词：模板本身要够具体
export const MIN_TEXT_PROMPT_NOTES = 80 // 文本类提示词：使用说明 + 示例输出

/** 去掉 Markdown 记号与代码块后的可读字数（中文按字、英文按字符） */
export function readableLength(md: string): number {
  return md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`~_\-|]/g, '')
    .replace(/\s+/g, '').length
}

/** 这一条够不够格（不看总开关、不看审核）：给后台显示「为什么没被收录」也用这个 */
export function qualityGateReason(p: IndexableInput): string | null {
  if (p.originality !== 'ORIGINAL_FIRST') return '非原创首发'
  if (p.aiAssist === 'MAJOR') return '正文主要由 AI 生成'
  const type = p.type || 'DISCUSSION'
  if (type === 'PROMPT') {
    if (!p.hasModel) return '没有关联模型'
    // 文本类（科研、文案……）没有出图，靠模板本身与示例输出撑起页面价值
    if (p.facet === 'TEXT') {
      if ((p.promptText || '').trim().length < MIN_TEXT_PROMPT_CHARS) return `提示词少于 ${MIN_TEXT_PROMPT_CHARS} 字`
      if (readableLength(p.content) < MIN_TEXT_PROMPT_NOTES) return `使用说明与示例输出少于 ${MIN_TEXT_PROMPT_NOTES} 字`
      return null
    }
    if ((p.promptText || '').trim().length < MIN_PROMPT_CHARS) return `提示词少于 ${MIN_PROMPT_CHARS} 字`
    // 视频类：有封面 / 关键帧最好，没有时要有足够的说明（视频本身不在站内托管，设计 §10.4）
    if (p.facet === 'VIDEO') {
      if ((p.imageCount ?? 0) < 1 && readableLength(p.content) < MIN_PROMPT_NOTES) return `没有封面时说明需 ≥${MIN_PROMPT_NOTES} 字`
      return null
    }
    if ((p.imageCount ?? 0) < 1) return '没有出图'
    if ((p.imageCount ?? 0) < 2 && readableLength(p.content) < MIN_PROMPT_NOTES) return `只有 1 张图时心得需 ≥${MIN_PROMPT_NOTES} 字`
    return null
  }
  if (type === 'APP') {
    // 作者自荐：默认不收录，被编辑精选（确有教程价值）才放开（设计 §9.2）
    if (p.selfPromo && !p.featured) return '作者自荐（精选后才收录）'
    if (readableLength(p.content) < MIN_APP_CHARS) return `「我用它解决了什么」少于 ${MIN_APP_CHARS} 字`
    return null
  }
  if (type === 'GUIDE') {
    if (!p.testedOn && !p.checkedOn) return '没有测试日期'
    if (readableLength(p.content) < MIN_GUIDE_CHARS) return `正文少于 ${MIN_GUIDE_CHARS} 字`
    return null
  }
  if (readableLength(p.content) < MIN_INDEXABLE_CHARS && p.commentCount < MIN_INDEXABLE_REPLIES) {
    return `正文少于 ${MIN_INDEXABLE_CHARS} 字且回复少于 ${MIN_INDEXABLE_REPLIES} 条`
  }
  return null
}

export function isIndexable(p: IndexableInput, open: boolean = INDEXING_OPEN): boolean {
  if (!open) return false
  if (!isPublic(p)) return false
  return qualityGateReason(p) === null
}

/**
 * 聚合页（模型 / 主题 / 产品 hub、列表首页）能不能收录（设计 §7.3）。
 * 百度劲风算法打「空短聚合页」，Google 也不想要只有两三条链接的标签页：
 * 要有站方写的介绍，且里面可收录的条目够数。主题页门槛比模型 / 产品 hub 高（主题更碎）。
 */
export const MIN_HUB_INTRO_CHARS = 200
export const MIN_HUB_ITEMS: Record<string, number> = { MODEL: 3, PRODUCT: 3, TOPIC: 8, ROOT: 5 }

export function isHubIndexable(kind: string, introLength: number, indexableItems: number, open: boolean = INDEXING_OPEN): boolean {
  if (!open) return false
  if (kind !== 'ROOT' && introLength < MIN_HUB_INTRO_CHARS) return false
  return indexableItems >= (MIN_HUB_ITEMS[kind] ?? 8)
}

// ─────────────────────────────── 内容类型与地址（§4） ───────────────────────────────

export const CONTENT_TYPES = ['DISCUSSION', 'PROMPT', 'GUIDE', 'APP'] as const
export type ContentType = (typeof CONTENT_TYPES)[number]
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = { DISCUSSION: '讨论', PROMPT: '提示词', GUIDE: '教程', APP: 'AI 应用' }

/** 类型对应的栏目根路径 */
export const SECTION_PATH: Record<ContentType, string> = { DISCUSSION: '/forum', PROMPT: '/prompts', GUIDE: '/guides', APP: '/apps' }

/** 提示词、教程、应用各自挂在一个专用板块下（forum_posts.category_id 非空）；这些板块不出现在论坛的板块导航里 */
export type TypedSection = 'PROMPT' | 'GUIDE' | 'APP'
export const CONTENT_BOARD_SLUGS: Record<TypedSection, string> = { PROMPT: 'prompts', GUIDE: 'guides', APP: 'apps' }

export function asContentType(t: string | null | undefined): ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(t || '') ? (t as ContentType) : 'DISCUSSION'
}

/** slug 只允许小写 ASCII、数字、连字符（设计 §4.2：不自动生成拼音） */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export function isValidSlug(s: string): boolean {
  return s.length >= 2 && s.length <= 80 && SLUG_RE.test(s)
}

/** 规范地址：/prompts/123-some-slug；没有 slug 就是 /prompts/123。URL 永远以 id 为准 */
export function contentPath(type: string, id: number, slug?: string | null): string {
  const base = SECTION_PATH[asContentType(type)]
  return `${base}/${id}${slug ? `-${slug}` : ''}`
}

/** 解析 "123" / "123-some-slug"；不是这个形状返回 null */
export function parseIdSlug(raw: string): { id: number; slug: string | null } | null {
  const m = /^(\d{1,9})(?:-([a-z0-9-]{1,120}))?$/.exec(raw)
  if (!m) return null
  const id = Number(m[1])
  return id > 0 ? { id, slug: m[2] ?? null } : null
}

export const ACCOUNT_TIERS = ['FREE', 'PLUS', 'PRO', 'TEAM', 'OTHER'] as const
export type AccountTier = (typeof ACCOUNT_TIERS)[number]
export const ACCOUNT_TIER_LABELS: Record<AccountTier, string> = {
  FREE: '免费账号',
  PLUS: 'Plus',
  PRO: 'Pro',
  TEAM: 'Team / 企业',
  OTHER: '其他',
}

/** 提示词里的 [变量]：方括号里 1–20 个字、不含换行与方括号 */
export const PROMPT_VAR_RE = /\[([^\[\]\n]{1,20})\]/g

export function promptVariables(prompt: string): string[] {
  const out = new Set<string>()
  for (const m of Array.from(prompt.matchAll(PROMPT_VAR_RE))) out.add(m[1].trim())
  return Array.from(out).filter(Boolean)
}

// ─────────────────────────────── 图片地址 ───────────────────────────────

/**
 * 帖子 images 字段里只允许本站论坛上传目录的地址（文件名格式见 lib/upload-store.ts 的 storeUpload）。
 * 以前是 z.array(z.string())，什么都收：外站图（追踪像素、热链）、javascript:、超长字符串都能进库。
 */
export const FORUM_IMAGE_URL_RE = /^\/uploads\/forum\/[0-9a-z]{6,12}-[0-9a-f]{12}\.(?:jpg|png|gif|webp)$/

export function isForumImageUrl(u: string): boolean {
  return FORUM_IMAGE_URL_RE.test(u)
}
