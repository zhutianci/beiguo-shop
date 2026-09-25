/**
 * 发送前检查（同构）：错误阻断测试与发送，警告只提示。规则表见设计文档 7.4。
 * 服务端还有一层（商品下架、券可领、是否已测试…）在 snapshot/lifecycle 里补。
 *
 * 本文件同时是「变量语法」的唯一出处（mergeTagRe / tagDefault）：lint、渲染器、逐封个性化
 * 三处必须对 {{…}} 的理解完全一致，否则会出现「检查通过、发出去却是原样的 {{nickname}}」。
 *
 * 【实现方：渲染器】签名是契约。
 */
import {
  DEFAULT_GREETING_NAME,
  MAX_HTML_BYTES,
  MAX_IMAGES,
  MERGE_DEFAULT_RE,
  MERGE_TAGS,
  SUBJECT_MERGE_TAGS,
  WARN_HTML_BYTES,
  type Block,
  type BlockOf,
  type EmailDoc,
  type LintIssue,
  type MergeTag,
  type Topic,
} from './types'
import { cleanText, contrastRatio, richToPlain, walkRichText } from './richtext'

export interface ContentLintInput {
  subject: string
  preheader: string
  topic: Topic
  doc: EmailDoc
  subjectPrefix: string
}

/* ============================== 变量语法 ============================== */

/**
 * {{name}} / {{name|默认}} / {{mkt_link:3}}，花括号内允许首尾空格。
 * 默认值部分先宽松捕获（[^{}]*），再由 tagDefault 按 MERGE_DEFAULT_RE 严格判定 ——
 * 这样非法默认值能被 lint 精确报出来，而不是整段「不像变量」被当成普通文字放过去。
 */
const MERGE_TAG_SOURCE = '\\{\\{\\s*([A-Za-z_][A-Za-z0-9_]*)(?::(\\d{1,6}))?\\s*(?:\\|([^{}]*))?\\}\\}'

/** 每次返回新的全局正则（全局正则带 lastIndex 状态，不能跨调用共享） */
export function mergeTagRe(): RegExp {
  return new RegExp(MERGE_TAG_SOURCE, 'g')
}

/** 变量默认值：合法返回去掉首尾空格后的值；缺省或不合法返回 null（调用方回落「朋友」） */
export function tagDefault(raw: string | undefined | null): string | null {
  if (raw == null) return null
  const v = raw.trim()
  return MERGE_DEFAULT_RE.test(v) ? v : null
}

/** 系统占位（只允许渲染器生成） */
export const SYSTEM_TAGS = ['mkt_link', 'mkt_unsub', 'mkt_prefs', 'mkt_open', 'mkt_notice'] as const

/* ============================== 禁发词与绝对化用语 ============================== */

// 零宽/双向/软连字符：先去掉再扫描，否则「微\u200b信」能绕过
const INVISIBLE_RE = /[\u00ad\u061c\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/g
// 「紧凑」扫描时去掉的分隔符：对付「微 信」「Q Q 群」「二-维-码」这类插空格/符号的写法
const SEP_RE = /[\s\u00a0\u3000\-_.·•*|/\\~,，。、:：;；'"`’‘“”()（）[\]【】]+/g

function scanForm(text: string): string {
  let s = String(text ?? '')
  try {
    s = s.normalize('NFKC') // 全角 ＱＱ、ｗｅｃｈａｔ、圈数字等折叠成常规字符
  } catch {
    /* 极老环境没有 normalize：退回原文 */
  }
  return s.replace(INVISIBLE_RE, '').toLowerCase()
}

// 阿里云禁发内容（设计文档 7.4）。顺序有意义：长词在前，命中时报出更具体的那个词
const BANNED_CJK = ['阿里云盘', '夸克网盘', '百度云', '二维码', '微信', '威信', '扣扣', 'qq号', 'qq群', '群聊', '加群', '网盘', '云盘']
const BANNED_LABEL: Record<string, string> = { qq号: 'QQ号', qq群: 'QQ群' }
const BANNED_ASCII: [RegExp, string][] = [
  [/weixin/, 'weixin'],
  [/wechat/, 'wechat'],
  // vx 只按独立单词算：否则 URL 里的随机串、英文单词拼接都会误报
  [/(^|[^a-z0-9])vx(?![a-z0-9])/, 'vx'],
  // 正文出现 QQ 号邮箱同样会触发阿里云「QQ 号」规则（设计文档第 6 节 contactEmail 说明）
  [/\d{5,}@qq\.com/, 'QQ号邮箱'],
]

/** 阿里云禁发内容命中（微信 / QQ / 二维码 / 群 / 网盘 …）；返回命中的词，没有返回 null */
export function findBannedWord(text: string): string | null {
  if (!text) return null
  const s = scanForm(text)
  for (const [re, label] of BANNED_ASCII) if (re.test(s)) return label
  for (const w of BANNED_CJK) if (s.includes(w)) return BANNED_LABEL[w] || w
  const compact = s.replace(SEP_RE, '')
  for (const w of BANNED_CJK) if (compact.includes(w)) return BANNED_LABEL[w] || w
  return null
}

// 广告法绝对化用语：错误级（设计文档 7.4；v2 审查从警告升级为错误）
const ABSOLUTE_ERROR = ['全网最低', '最低价', '全网最', '史上最', '国家级', '顶级', '最佳', '最好']
// 警告级：本身不一定违法，但常被认定为绝对化或无法证明的宣称
const ABSOLUTE_WARN = ['第一', '独家', '唯一', '首个']

function findTerm(text: string, list: string[]): string | null {
  if (!text) return null
  const s = scanForm(text)
  for (const w of list) if (s.includes(w)) return w
  const compact = s.replace(SEP_RE, '')
  for (const w of list) if (compact.includes(w)) return w
  return null
}

/** 广告法绝对化用语命中（错误级）；返回命中的词 */
export function findAbsoluteTerm(text: string): string | null {
  return findTerm(text, ABSOLUTE_ERROR)
}

/** 警告级用语（第一 / 独家 / 唯一 / 首个） */
export function findAbsoluteWarnTerm(text: string): string | null {
  return findTerm(text, ABSOLUTE_WARN)
}

/* ============================== 昵称 ============================== */

const NICK_MAX = 12
const NICK_URL_RE = /https?:|www\.|:\/\/|ftp:/i
// 域名：点号（含全角句点「。」「．」经 NFKC 后的形态）两侧是字母数字，后接 2 位以上字母
const NICK_DOMAIN_RE = /[a-z0-9-]\s*[.。]\s*[a-z]{2,}/i
// 连续 5 位以上数字（允许中间夹一个空格/点/横线：「123 456 789」同样是 QQ 号/手机号）
const NICK_DIGITS_RE = /(?:\d[\s._-]?){5,}/

function nickUnsafe(s: string): boolean {
  return NICK_URL_RE.test(s) || NICK_DOMAIN_RE.test(s) || s.includes('@') || NICK_DIGITS_RE.test(s) || findBannedWord(s) !== null
}

/**
 * 昵称清洗：NFKC、去控制/双向/零宽字符、截断 12 字；
 * 含网址/域名/@/连续 5 位以上数字/禁发词 → 返回 fallback。
 *
 * 昵称是用户自己填的、会原样进入我们发出的每一封营销邮件（主题里也有）：不清洗的话，
 * 一个叫「加微信 xxx」的用户就能让整场活动命中阿里云禁发规则，或借我们的发信通道发钓鱼文字。
 * 另外去掉 { }：昵称不许长得像变量（发送时是单趟替换，本不会被二次展开；这里是纵深防御）。
 *
 * fallback：合法默认值原样返回；不合法 → 「朋友」；**传空串 → 不可用时返回空串**
 * （调用方据此判断「昵称不可用」，改用占位里作者写的默认值，如 {{nickname|老朋友}}）。
 */
export function safeNickname(raw: string | null | undefined, fallback: string): string {
  const fb = fallback === '' ? '' : tagDefault(fallback) || DEFAULT_GREETING_NAME
  if (raw == null) return fb
  let s = String(raw)
  try {
    s = s.normalize('NFKC')
  } catch {
    /* ignore */
  }
  s = s
    .replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ')
    .replace(INVISIBLE_RE, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!s || nickUnsafe(s)) return fb
  const cut = Array.from(s).slice(0, NICK_MAX).join('').trim()
  if (!cut || nickUnsafe(cut)) return fb
  return cut
}

/* ============================== 正文里的收件人邮箱 ============================== */

/**
 * {{email}} 代入正文时用的地址：完整地址会命中禁发词时（典型是 123456789@qq.com 这种 QQ 号邮箱，
 * 也包括本地部分像 weixin123@… 的），把 @ 前面遮成「前两位 + ***」，如 12***@qq.com。
 *
 * 为什么必须在代入处兜：禁发词扫描（lintContent / lintRendered）只看得到模板里的 {{email}} 占位，
 * 真实地址是发送时逐封替换进去的 —— QQ 号收件人的正文里会出现一个 QQ 号，被阿里云按「QQ 号」规则拒发，
 * 连续两封还会触发 24h 全局熔断（审查 C7）。personalize（真发）与 render 的预览/测试都走这里，
 * 所以测试邮件看到的就是收件人会收到的样子。遮完仍命中（域名本身带禁发词）或不像地址 → 空串。
 */
export function safeBodyEmail(email: string | null | undefined): string {
  const e = String(email ?? '')
  if (!findBannedWord(e)) return e
  const at = e.lastIndexOf('@')
  if (at <= 0) return ''
  const masked = `${e.slice(0, Math.min(2, at))}***${e.slice(at)}`
  return findBannedWord(masked) ? '' : masked
}

/* ============================== 地址检查 ============================== */

const SHORT_LINK_HOSTS = ['t.cn', 'dwz.cn', 'url.cn', 'suo.im', 'bit.ly', 'tinyurl.com', 'is.gd', 'goo.gl', 'w.url.cn']

function hostOf(url: string): string | null {
  const m = url.match(/^https?:\/\/([^/?#\s]+)/i)
  if (!m) return null
  return m[1].replace(/^[^@]*@/, '').replace(/:\d+$/, '').toLowerCase()
}

export function isShortLink(url: string): boolean {
  const h = hostOf(url.trim())
  if (!h) return false
  return SHORT_LINK_HOSTS.some((d) => h === d || h.endsWith('.' + d))
}

export type UrlProblem = 'empty' | 'var' | 'scheme' | 'space' | 'short' | 'format' | 'insecure'

/** 链接地址检查：https/http/mailto/站内相对路径；返回问题或 null */
export function checkLinkUrl(raw: string | null | undefined): UrlProblem | null {
  const url = (raw ?? '').trim()
  if (!url) return 'empty'
  if (url.includes('{{') || url.includes('}}')) return 'var'
  if (/[\s<>"'`\\]/.test(url)) return 'space'
  if (/^https?:\/\/[^/?#\s]+/i.test(url)) return isShortLink(url) ? 'short' : null
  if (/^mailto:[^@\s]+@[^@\s]+$/i.test(url)) return null
  if (url.startsWith('/') && !url.startsWith('//')) return null
  return 'scheme'
}

/** 图片地址检查：绝对 https 或站内相对路径；只收 jpg/jpeg/png/gif */
export function checkImageUrl(raw: string | null | undefined): UrlProblem | null {
  const url = (raw ?? '').trim()
  if (!url) return 'empty'
  if (url.includes('{{') || url.includes('}}')) return 'var'
  if (/[\s<>"'`\\]/.test(url)) return 'space'
  const relative = url.startsWith('/') && !url.startsWith('//')
  if (!relative && !/^https:\/\/[^/?#\s]+/i.test(url)) return /^http:\/\//i.test(url) ? 'insecure' : 'scheme'
  if (!relative && isShortLink(url)) return 'short'
  const path = url.replace(/[?#].*$/, '')
  if (!/\.(jpe?g|png|gif)$/i.test(path)) return 'format'
  return null
}

const URL_PROBLEM_TEXT: Record<UrlProblem, string> = {
  empty: '地址为空',
  var: '地址里不能放变量（{{…}} 只能出现在文字里）',
  scheme: '地址不合法（只支持 https://、http://、mailto: 与站内 / 开头的路径）',
  space: '地址里有空格或引号等非法字符',
  short: '不能使用短链接（t.cn、bit.ly 等会被邮箱判为垃圾邮件）',
  format: '图片只支持 jpg / png / gif（webp、svg 在多数邮箱里显示不出来）',
  insecure: '图片必须是 https 地址',
}

/* ============================== 内容检查 ============================== */

/** noVars：这段文字除了进邮件还会原样存到别处（券标题 = 买家「我的优惠券」里的券名），不许放变量 */
type TextSpot = { text: string; blockId?: string; where: string; kind: 'subject' | 'preheader' | 'body'; noVars?: boolean }
type UrlSpot = { url: string; blockId: string; where: string; kind: 'link' | 'image' }

const LARGE = 3 // 大字号（≥18.66px 粗体 / ≥24px）的对比度下限（WCAG AA）
const NORMAL = 4.5

/** 估算主题长度：昵称按 12 字计 */
function estimateSubject(prefix: string, subject: string): number {
  const est = subject.replace(mergeTagRe(), (_m, name: string) => (name === 'nickname' ? 'x'.repeat(NICK_MAX) : ''))
  return Array.from(prefix + est).length
}

/** 主题按「典型昵称」估算的可见长度（用于 >30 字的提示） */
function typicalSubjectLen(subject: string): number {
  const est = subject.replace(mergeTagRe(), (_m, name: string, _n: string, def: string | undefined) =>
    name === 'nickname' ? tagDefault(def) || DEFAULT_GREETING_NAME : ''
  )
  return Array.from(est).length
}

function blockTexts(b: Block): { text: string; where: string; noVars?: boolean }[] {
  switch (b.type) {
    case 'header':
      return [{ text: b.title, where: '页眉标题' }]
    case 'hero':
      return [
        { text: b.title, where: '头图标题' },
        { text: b.subtitle || '', where: '头图副标题' },
        { text: b.imageAlt || '', where: '头图图片说明' },
        { text: b.button?.label || '', where: '头图按钮' },
      ]
    case 'image':
      return [{ text: b.alt, where: '图片说明' }]
    case 'button':
      return [{ text: b.label, where: '按钮文字' }]
    case 'product':
    case 'productGrid':
      return [{ text: b.ctaLabel, where: '商品按钮' }]
    case 'coupon':
      return [
        // 券标题会原样写进 Coupon.name（买家「我的优惠券」与结账选券里显示）：邮件里能逐封替换，
        // 券名却是整批共用的一份，放了变量买家就会看到字面的 {{nickname|朋友}}的回归券（审查 C8）
        { text: b.title, where: '券标题', noVars: true },
        { text: b.note || '', where: '券备注' },
        { text: b.ctaLabel, where: '券按钮' },
      ]
    default:
      return []
  }
}

function blockUrls(b: Block): UrlSpot[] {
  const out: UrlSpot[] = []
  if (b.type === 'hero') {
    if (b.image !== undefined) out.push({ url: String(b.image ?? ''), blockId: b.id, where: '头图图片', kind: 'image' })
    if (b.button) out.push({ url: String(b.button.href ?? ''), blockId: b.id, where: '头图按钮链接', kind: 'link' })
  } else if (b.type === 'image') {
    out.push({ url: String(b.src ?? ''), blockId: b.id, where: '图片', kind: 'image' })
    if (b.href !== undefined && b.href !== '') out.push({ url: String(b.href), blockId: b.id, where: '图片链接', kind: 'link' })
  } else if (b.type === 'button') {
    out.push({ url: String(b.href ?? ''), blockId: b.id, where: '按钮链接', kind: 'link' })
  } else if (b.type === 'heading' || b.type === 'text' || b.type === 'callout') {
    walkRichText(b.content, (_t, marks) => {
      for (const m of marks) if (m && m.type === 'link') out.push({ url: String(m.attrs?.href ?? ''), blockId: b.id, where: '文字链接', kind: 'link' })
    })
  }
  return out
}

/** 对编辑中的文档做检查（不需要库） */
export function lintContent(input: ContentLintInput): LintIssue[] {
  const issues: LintIssue[] = []
  const seen = new Set<string>()
  const add = (level: LintIssue['level'], code: string, message: string, blockId?: string) => {
    const key = `${level}|${code}|${blockId || ''}|${message}`
    if (seen.has(key)) return
    seen.add(key)
    issues.push(blockId ? { level, code, message, blockId } : { level, code, message })
  }

  const subject = String(input.subject ?? '')
  const preheader = String(input.preheader ?? '')
  const prefix = String(input.subjectPrefix ?? '')
  const doc = input.doc
  const blocks: Block[] = Array.isArray(doc?.blocks) ? doc.blocks : []
  const settings = doc?.settings

  /* ---- 主题 / 预览文字 ---- */
  if (!subject.trim()) add('error', 'SUBJECT_EMPTY', '邮件主题不能为空')
  else {
    const est = estimateSubject(prefix, subject)
    if (est > 100) add('error', 'SUBJECT_TOO_LONG', `主题加上前缀「${prefix}」、按 12 字昵称估算有 ${est} 字，超过 100 字上限`)
    else if (typicalSubjectLen(subject) > 30) add('warn', 'SUBJECT_LONG', '主题超过 30 字，手机收件箱里会被截断')
  }
  if (/[\r\n\t]/.test(subject)) add('error', 'SUBJECT_NEWLINE', '主题里不能有换行或制表符')
  if (!preheader.trim()) add('warn', 'NO_PREHEADER', '没填预览文字：收件箱列表里会显示正文开头的零碎文字')

  /* ---- 收集文字与地址 ---- */
  const texts: TextSpot[] = [
    { text: subject, where: '主题', kind: 'subject' },
    { text: preheader, where: '预览文字', kind: 'preheader' },
  ]
  const urls: UrlSpot[] = []
  let bodyChars = 0
  let greeting = false
  let usesCouponExpires = false
  let hasCta = false
  let linkCount = 0
  let imageCount = 0
  let contentBlocks = 0
  const couponBlocks: BlockOf<'coupon'>[] = []

  for (const b of blocks) {
    if (!b || typeof b !== 'object') continue
    if (!['header', 'divider', 'spacer'].includes(b.type)) contentBlocks++
    for (const t of blockTexts(b)) if (t.text) texts.push({ text: t.text, blockId: b.id, where: t.where, kind: 'body', noVars: t.noVars })
    if (b.type === 'heading' || b.type === 'text' || b.type === 'callout') {
      walkRichText(b.content, (text) => texts.push({ text, blockId: b.id, where: '文字', kind: 'body' }))
      const plain = richToPlain(b.content)
      if (Array.from(plain).length > 5000) add('error', 'TEXT_TOO_LONG', '单个区块的文字超过 5000 字，请拆成几个区块', b.id)
    }
    urls.push(...blockUrls(b))

    switch (b.type) {
      case 'header':
        if (b.logo) linkCount++
        break
      case 'hero':
        if (b.button) {
          hasCta = true
          linkCount++
        }
        if (b.image) imageCount++
        if (b.image && !(b.imageAlt || '').trim()) add('warn', 'IMAGE_NO_ALT', '头图图片缺少文字说明（图片被屏蔽时显示）', b.id)
        break
      case 'image':
        imageCount++
        if (!String(b.src ?? '').trim()) add('error', 'IMAGE_EMPTY', '图片区块还没有上传图片', b.id)
        if (!String(b.alt ?? '').trim()) add('warn', 'IMAGE_NO_ALT', '图片缺少文字说明（很多邮箱默认不显示图片，这时只能看到说明文字）', b.id)
        if (b.href) linkCount++
        break
      case 'button':
        hasCta = true
        linkCount++
        if (!String(b.label ?? '').trim()) add('error', 'BUTTON_EMPTY', '按钮文字不能为空', b.id)
        break
      case 'product':
        hasCta = true
        linkCount += 2
        if (b.showOriginalPrice)
          add('warn', 'ORIGINAL_PRICE', '显示了划线原价：原价必须是真实的近期成交价（《明码标价和禁止价格欺诈规定》）', b.id)
        break
      case 'productGrid':
        hasCta = true
        linkCount += (Array.isArray(b.productIds) ? b.productIds.length : 0) * 2
        break
      case 'coupon':
        hasCta = true
        linkCount++
        couponBlocks.push(b)
        break
    }
  }

  /* ---- 逐段文字：禁发词 / 绝对化用语 / 变量 ---- */
  for (const t of texts) {
    const where = t.where
    const banned = findBannedWord(t.text)
    if (banned) add('error', 'BANNED_WORD', `${where}含阿里云禁发内容「${banned}」（微信/QQ/二维码/群/网盘等），会被拒发`, t.blockId)
    const abs = findAbsoluteTerm(t.text)
    if (abs) add('error', 'ABSOLUTE_TERM', `${where}含广告法禁用的绝对化用语「${abs}」`, t.blockId)
    const warnTerm = findAbsoluteWarnTerm(t.text)
    if (warnTerm) add('warn', 'ABSOLUTE_WARN', `${where}含「${warnTerm}」：除非有可查证的依据，否则容易被认定为虚假或绝对化宣传`, t.blockId)

    const allowed: readonly MergeTag[] = t.kind === 'subject' ? SUBJECT_MERGE_TAGS : MERGE_TAGS
    const re = mergeTagRe()
    let m: RegExpExecArray | null
    while ((m = re.exec(t.text))) {
      const name = m[1]
      if (name.startsWith('mkt_')) {
        add('error', 'SYSTEM_VAR', `${where}里不能手写系统占位 {{${name}…}}`, t.blockId)
        continue
      }
      if (!(MERGE_TAGS as readonly string[]).includes(name) || m[2] !== undefined) {
        add('error', 'UNKNOWN_VAR', `${where}里有未知变量 ${m[0]}（只支持 {{nickname}}、{{email}}、{{coupon_expires}}）`, t.blockId)
        continue
      }
      if (t.noVars) {
        add('error', 'VAR_NOT_ALLOWED', `${where}也是买家「我的优惠券」里显示的券名，不能使用变量 ${m[0]}`, t.blockId) // 审查 C8
        continue
      }
      if (!allowed.includes(name as MergeTag)) {
        add('error', 'VAR_NOT_ALLOWED', `${where}里只能用昵称变量 {{nickname}}`, t.blockId)
        continue
      }
      if (m[3] !== undefined && !tagDefault(m[3]))
        add('error', 'BAD_DEFAULT', `${where}里变量默认值不合法：${m[0]}（1–20 字，不能含 { } | < > & 引号）`, t.blockId)
      if (name === 'nickname' && t.kind === 'body') greeting = true
      if (name === 'coupon_expires') usesCouponExpires = true
    }
    const rest = t.text.replace(mergeTagRe(), '')
    if (/\{\{|\}\}/.test(rest))
      add('error', 'BROKEN_VAR', `${where}里有写法不完整的变量（或变量中间被加粗、链接等格式拆开了）`, t.blockId)
    if (t.kind === 'body') bodyChars += Array.from(cleanText(t.text).replace(/\s+/g, '')).length
  }

  /* ---- 地址 ---- */
  for (const u of urls) {
    const p = u.kind === 'image' ? checkImageUrl(u.url) : checkLinkUrl(u.url)
    if (p && !(p === 'empty' && u.where === '头图图片'))
      add('error', p === 'var' ? 'VAR_IN_URL' : p === 'short' ? 'SHORT_LINK' : u.kind === 'image' ? 'BAD_IMAGE' : 'BAD_LINK', `${u.where}：${URL_PROBLEM_TEXT[p]}`, u.blockId)
    const banned = findBannedWord(u.url)
    if (banned) add('error', 'BANNED_WORD', `${u.where}地址含阿里云禁发内容「${banned}」`, u.blockId)
  }
  linkCount += urls.filter((u) => u.where === '文字链接').length

  /* ---- 结构 ---- */
  if (!contentBlocks) add('error', 'NO_CONTENT', '没有任何内容区块（页眉、分割线、留白不算）')
  if (!greeting)
    add('error', 'NO_GREETING', '缺少尊称：正文里要有 {{nickname|朋友}}（阿里云要求营销邮件带收件人称呼）')
  if (imageCount > MAX_IMAGES) add('error', 'TOO_MANY_IMAGES', `图片 ${imageCount} 张，超过 ${MAX_IMAGES} 张上限`)
  if (!hasCta) add('warn', 'NO_BUTTON', '没有按钮：读者看完不知道下一步点哪里')
  if (contentBlocks && bodyChars < 50) add('warn', 'LITTLE_TEXT', '文字不到 50 字：纯图片邮件容易进垃圾箱，也不利于屏蔽图片的读者')
  if (linkCount > 15) add('warn', 'MANY_LINKS', `链接约 ${linkCount} 个（超过 15 个容易被判为垃圾邮件）`)

  /* ---- 优惠券 ---- */
  if (couponBlocks.length > 1) add('error', 'MULTI_COUPON', '一封邮件只能有一个优惠券区块', couponBlocks[1].id)
  for (const c of couponBlocks) {
    if (c.mode === 'grant') {
      if (!c.grant) add('error', 'COUPON_NO_GRANT', '直发券还没有设置面额与有效期', c.id)
      if (input.topic !== 'PROMO') add('error', 'COUPON_TOPIC', '含直发优惠券的邮件，主题分类必须是「优惠活动」', c.id)
    } else {
      if (!c.claimCode) add('error', 'COUPON_NO_CODE', '领取券还没有选择券批次', c.id)
      if (input.topic !== 'PROMO') add('warn', 'COUPON_TOPIC', '含优惠券的邮件，主题分类建议选「优惠活动」', c.id)
    }
  }
  if (usesCouponExpires && !couponBlocks.some((c) => c.mode === 'grant'))
    add('error', 'COUPON_EXPIRES_NO_GRANT', '用了 {{coupon_expires}}，但邮件里没有直发券区块（这个变量会是空的）')

  /* ---- 主题分类与商品 ---- */
  const firstProduct = blocks.find((b) => b && (b.type === 'product' || b.type === 'productGrid'))
  if (firstProduct && input.topic !== 'PRODUCT' && input.topic !== 'PROMO')
    add('warn', 'PRODUCT_TOPIC', '含商品卡片的邮件，主题分类建议选「新品上架」或「优惠活动」（退订了该主题的人不会收到）', firstProduct.id)

  /* ---- 字号 ---- */
  for (const b of blocks) if (b && b.type === 'text' && b.size === 14) add('warn', 'SMALL_TEXT', '正文字号 14px 在手机上偏小，建议 15px 以上', b.id)

  /* ---- 对比度 ---- */
  if (settings) {
    const low = (fg: string, bg: string, min: number) => contrastRatio(fg, bg) < min
    if (low(settings.text, settings.canvas, NORMAL)) add('warn', 'LOW_CONTRAST', '正文色与画布色对比度不足 4.5:1')
    if (low(settings.link, settings.canvas, NORMAL)) add('warn', 'LOW_CONTRAST', '链接色与画布色对比度不足 4.5:1')
    if (low(settings.muted, settings.canvas, NORMAL)) add('warn', 'LOW_CONTRAST', '次要文字色与画布色对比度不足 4.5:1')
    for (const b of blocks) {
      if (!b) continue
      const boxBg = b.box?.bg
      switch (b.type) {
        case 'header':
          if (low(b.color, b.bg, LARGE) || (b.bg2 && low(b.color, b.bg2, LARGE)))
            add('warn', 'LOW_CONTRAST', '页眉文字与背景对比度偏低', b.id)
          break
        case 'hero':
          if (low(b.color, b.bg, NORMAL) || (b.bg2 && low(b.color, b.bg2, LARGE)))
            add('warn', 'LOW_CONTRAST', '头图文字与背景对比度不足 4.5:1', b.id)
          if (b.button && low(b.button.color, b.button.bg, NORMAL)) add('warn', 'LOW_CONTRAST', '头图按钮文字与按钮底色对比度不足 4.5:1', b.id)
          break
        case 'button':
          if (low(b.color, b.bg, NORMAL)) add('warn', 'LOW_CONTRAST', '按钮文字与按钮底色对比度不足 4.5:1', b.id)
          break
        case 'coupon':
          if (low(b.color, b.bg, NORMAL)) add('warn', 'LOW_CONTRAST', '优惠券文字与底色对比度不足 4.5:1', b.id)
          break
        case 'heading':
        case 'text':
        case 'callout': {
          const bg = boxBg || settings.canvas
          if (boxBg && low(settings.text, boxBg, NORMAL)) add('warn', 'LOW_CONTRAST', '正文色与区块底色对比度不足 4.5:1', b.id)
          let colored = false
          walkRichText(b.content, (_t, marks) => {
            for (const m of marks) if (m && m.type === 'textStyle' && m.attrs?.color && low(m.attrs.color, bg, NORMAL)) colored = true
          })
          if (colored) add('warn', 'LOW_CONTRAST', '有文字颜色与底色对比度不足 4.5:1', b.id)
          break
        }
      }
    }
  }
  return issues
}

/* ============================== 渲染后检查 ============================== */

// 渲染器写出的系统说明句（首封告知）。它由我们自己审过，不参与「第一」之类的用语提示
// （personalize.ts 的 FIRST_NOTICE_TEXT 引用这里，保证两处永远是同一句话）
export const FIRST_NOTICE_SENTENCE =
  '这是贝果科技第一次向你发送优惠邮件；我们已在隐私政策中说明此用途，不想收到可点击下方「退订营销邮件」一键退订。'

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
  zwnj: '',
  zwj: '',
  middot: '·',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  yen: '¥',
}

/** 单趟解码实体（一次替换，不会把 &amp;lt; 解成 <） */
function decodeEntities(s: string): string {
  return s.replace(/&(#\d{1,7}|#x[0-9a-f]{1,6}|[a-z]{2,8});/gi, (_m, e: string) => {
    if (e[0] === '#') {
      const c = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))
      return c > 0 && c < 0x110000 ? String.fromCodePoint(c) : ''
    }
    return NAMED_ENTITIES[e.toLowerCase()] ?? ''
  })
}

/** 最终 HTML 里读者能看到的文字（去掉 <head>、注释与标签；标签直接拼接，防「微<b>信</b>」拆词） */
export function visibleTextOf(html: string): string {
  const body = html.replace(/<head[\s\S]*?<\/head>/i, '').replace(/<!--[\s\S]*?-->/g, '')
  return decodeEntities(body.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ''))
}

/** 最终 HTML 里的属性文字（alt / title / href / src）——图片说明与地址同样会被反垃圾扫描 */
function attributeTextOf(html: string): string {
  const out: string[] = []
  const re = /\s(?:alt|title|href|src)="([^"]*)"/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) out.push(decodeEntities(m[1]))
  return out.join('\n')
}

const ALLOWED_RENDERED_TAGS = new Set<string>([...MERGE_TAGS, ...SYSTEM_TAGS])

/** 对最终产物（渲染后的 HTML / 纯文本 / 主题，含商品文字与页脚）再扫一遍禁发词、体积、图片 */
export function lintRendered(input: { html: string; text: string; subject: string; sizeBytes: number; imageCount: number }): LintIssue[] {
  const issues: LintIssue[] = []
  const seen = new Set<string>()
  const add = (level: LintIssue['level'], code: string, message: string) => {
    const key = `${level}|${code}|${message}`
    if (seen.has(key)) return
    seen.add(key)
    issues.push({ level, code, message })
  }
  const html = String(input.html ?? '')
  const text = String(input.text ?? '')
  const subject = String(input.subject ?? '')

  if (input.sizeBytes > MAX_HTML_BYTES)
    add('error', 'HTML_TOO_LARGE', `邮件 HTML ${Math.ceil(input.sizeBytes / 1024)}KB，超过 ${MAX_HTML_BYTES / 1024}KB 上限（Gmail 超过约 100KB 会截断，退订链接会被折叠）`)
  else if (input.sizeBytes > WARN_HTML_BYTES)
    add('warn', 'HTML_LARGE', `邮件 HTML ${Math.ceil(input.sizeBytes / 1024)}KB，接近上限，建议删减区块`)
  if (input.imageCount > MAX_IMAGES) add('error', 'TOO_MANY_IMAGES', `图片 ${input.imageCount} 张，超过 ${MAX_IMAGES} 张上限`)

  let styleBytes = 0
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let sm: RegExpExecArray | null
  while ((sm = styleRe.exec(html))) styleBytes += sm[1].length
  if (styleBytes > 16 * 1024) add('error', 'STYLE_TOO_LARGE', '<style> 超过 16KB（Gmail 会整段丢弃）')

  const strip = (s: string) => s.split(FIRST_NOTICE_SENTENCE).join(' ')
  const scans: { where: string; text: string }[] = [
    { where: '邮件正文', text: strip(visibleTextOf(html)) },
    { where: '图片说明或链接', text: strip(attributeTextOf(html)) },
    { where: '纯文本版', text: strip(text) },
    { where: '主题', text: subject },
  ]
  for (const s of scans) {
    const banned = findBannedWord(s.text)
    if (banned) add('error', 'BANNED_WORD', `${s.where}含阿里云禁发内容「${banned}」（可能来自商品文字或页脚设置），会被拒发`)
    const abs = findAbsoluteTerm(s.text)
    if (abs) add('error', 'ABSOLUTE_TERM', `${s.where}含广告法禁用的绝对化用语「${abs}」（可能来自商品文字或页脚设置）`)
    const warnTerm = findAbsoluteWarnTerm(s.text)
    if (warnTerm) add('warn', 'ABSOLUTE_WARN', `${s.where}含「${warnTerm}」，请确认有可查证的依据`)
  }

  for (const [where, src] of [
    ['邮件正文', html],
    ['纯文本版', text],
  ] as const) {
    const re = mergeTagRe()
    let m: RegExpExecArray | null
    while ((m = re.exec(src))) {
      if (!ALLOWED_RENDERED_TAGS.has(m[1])) add('error', 'UNKNOWN_VAR', `${where}里有无法替换的变量 ${m[0]}`)
    }
  }
  // 渲染器对每个系统占位只写一次（像素、首封告知、退订、偏好）；多出来的一定来自作者或外部文字拼出来的
  // 「{{mkt_…}}」，发送时会被展开成真实链接/像素 —— 纵深防御，直接拦下
  for (const name of ['mkt_open', 'mkt_notice', 'mkt_unsub', 'mkt_prefs']) {
    const re = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g')
    if ((html.match(re) || []).length > 1 || (text.match(re) || []).length > 1)
      add('error', 'SYSTEM_VAR', `邮件里出现了多余的系统占位 {{${name}}}（可能是文字被拼成了占位写法）`)
  }

  const subjRe = mergeTagRe()
  let st: RegExpExecArray | null
  while ((st = subjRe.exec(subject))) {
    if (st[1] !== 'nickname') add('error', 'VAR_NOT_ALLOWED', `主题里只能用昵称变量，发现 ${st[0]}`)
  }
  if (/[\r\n\t]/.test(subject)) add('error', 'SUBJECT_NEWLINE', '主题里不能有换行或制表符')
  const est = estimateSubject('', subject)
  if (est > 100) add('error', 'SUBJECT_TOO_LONG', `最终主题按 12 字昵称估算有 ${est} 字，超过 100 字上限`)
  return issues
}

export function hasErrors(issues: LintIssue[]): boolean {
  return issues.some((i) => i.level === 'error')
}
