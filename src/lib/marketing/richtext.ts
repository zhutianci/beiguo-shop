/**
 * 富文本（受限 ProseMirror JSON）的规范化与序列化。同构、零依赖。
 *
 * normalizeRichDoc：保存前把 TipTap 的任意输出洗成白名单形状 —— 未知节点拆成文字、
 * 嵌套列表压平、rgb()/rgba() 颜色转 #RRGGBB、丢弃未知 attrs 与不安全链接 —— 再交给严格 zod。
 * 不这样做的话，从网页/Word 粘贴一段就会让整篇保存 400、自动保存丢稿。
 *
 * 另外放了几件营销模块各处都要用、又必须同构的小工具（颜色换算与对比度、HTML 转义、UTF-8 字节数）：
 * 它们放在这里是因为本文件是依赖链的最底层（lint / personalize / render / presets 都 import 它），
 * 放在别处会形成循环 import。
 *
 * 【实现方：渲染器】签名是契约。
 */
import {
  BLOCK_ID_RE,
  BLOCK_TYPE_LABEL,
  HEX_COLOR_RE,
  MAX_DOC_JSON_BYTES,
  emailDocSchema,
  type BlockType,
  type DocSettings,
  type EmailDoc,
  type RichBlockNode,
  type RichDoc,
  type RichInline,
  type RichMark,
} from './types'

/* ============================== 通用小工具 ============================== */

/** HTML 文本/属性转义（五个字符全转：同一个函数既能用在文字里也能用在双引号属性里） */
export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * UTF-8 字节数。不用 TextEncoder / Buffer：前者在个别老 WebView 里没有、后者是 Node 专有，
 * 而这里的数字决定「HTML ≤ 80KB」这条阻断规则，浏览器预览和服务端必须算得一模一样。
 */
export function utf8Bytes(s: string): number {
  let n = 0
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c < 0x80) n += 1
    else if (c < 0x800) n += 2
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      const d = s.charCodeAt(i + 1)
      if (d >= 0xdc00 && d <= 0xdfff) {
        n += 4
        i++
      } else n += 3
    } else n += 3
  }
  return n
}

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x)
}

/* ============================== 颜色 ============================== */

const NAMED_COLORS: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  gray: '#808080',
  grey: '#808080',
  orange: '#ffa500',
  purple: '#800080',
  yellow: '#ffff00',
  pink: '#ffc0cb',
  brown: '#a52a2a',
  navy: '#000080',
  teal: '#008080',
  silver: '#c0c0c0',
  maroon: '#800000',
}

export function hexToRgb(hex: string): [number, number, number] | null {
  if (typeof hex !== 'string') return null
  const h = hex.trim()
  if (!HEX_COLOR_RE.test(h)) return null
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) =>
    Math.max(0, Math.min(255, Math.round(Number.isFinite(v) ? v : 0)))
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function channel(raw: string): number {
  const s = raw.trim()
  if (s.endsWith('%')) return (parseFloat(s) / 100) * 255
  return parseFloat(s)
}

/**
 * 任意 CSS 颜色写法 → 小写 #rrggbb；识别不了（或全透明、inherit 之类）→ null。
 * 支持 #rgb、#rrggbb、#rrggbbaa、rgb()/rgba()（逗号或空格分隔、百分比）、少量颜色名。
 * rgba 的半透明按「叠在白底上」折算 —— 邮件画布是白的，这样最接近作者在编辑器里看到的颜色。
 */
export function normalizeColor(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const s = input.trim().toLowerCase()
  if (!s) return null
  if (/^#[0-9a-f]{6}$/.test(s)) return s
  if (/^#[0-9a-f]{3}$/.test(s)) return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`
  if (/^#[0-9a-f]{8}$/.test(s)) return s.slice(0, 7)
  if (NAMED_COLORS[s]) return NAMED_COLORS[s]
  const m = s.match(/^rgba?\(\s*([\d.]+%?)\s*[,\s]\s*([\d.]+%?)\s*[,\s]\s*([\d.]+%?)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/)
  if (!m) return null
  const r = channel(m[1])
  const g = channel(m[2])
  const b = channel(m[3])
  if (![r, g, b].every((v) => Number.isFinite(v))) return null
  let a = 1
  if (m[4] !== undefined) {
    a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])
    if (!Number.isFinite(a)) a = 1
    a = Math.max(0, Math.min(1, a))
  }
  if (a === 0) return null
  const blend = (c: number) => c * a + 255 * (1 - a)
  return rgbToHex(blend(r), blend(g), blend(b))
}

/** WCAG 相对亮度 */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 对比度 1–21。任一颜色不合法时返回 21（不合法的颜色由格式校验去报，这里不重复报对比度） */
export function contrastRatio(a: string, b: string): number {
  if (!hexToRgb(a) || !hexToRgb(b)) return 21
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** 线性混色：t=0 → a，t=1 → b。任一不合法时原样返回 a */
export function mixHex(a: string, b: string, t: number): string {
  const x = hexToRgb(a)
  const y = hexToRgb(b)
  if (!x || !y) return a
  const k = Math.max(0, Math.min(1, t))
  return rgbToHex(x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k)
}

/**
 * 保证前景色在底色上的对比度 ≥ min：不够就逐步往黑或白（取对比更大的方向）推。
 * 渲染器用它兜住「派生色」（副标题、页脚小字）——那些颜色不是作者直接选的，不能让它们不可读。
 */
export function ensureContrast(fg: string, bg: string, min = 4.5): string {
  if (!hexToRgb(fg) || !hexToRgb(bg)) return fg
  if (contrastRatio(fg, bg) >= min) return fg
  const target = contrastRatio('#000000', bg) >= contrastRatio('#ffffff', bg) ? '#000000' : '#ffffff'
  for (let t = 0.1; t <= 1.0001; t += 0.1) {
    const c = mixHex(fg, target, t)
    if (contrastRatio(c, bg) >= min) return c
  }
  return target
}

/* ============================== 文字清洗 ============================== */

// 控制字符（保留 \n 另行处理）、双向覆盖、零宽字符、BOM、软连字符。
// 零宽字符还是绕过禁发词检测的常用手法（「微\u200b信」），必须先去掉 lint 才看得见。
// ZWJ(U+200D) 保留：emoji 组合序列要用它。
const STRIP_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u00ad\u061c\u200b\u200c\u200e\u200f\u202a-\u202e\u2060-\u2069\ufeff]/g

/** 清洗一段正文：去不可见/危险字符，\t → 空格，\r\n、U+2028/2029 → \n */
export function cleanText(s: string): string {
  return String(s)
    .replace(/\r\n?/g, '\n')
    .replace(/[\u2028\u2029]/g, '\n')
    .replace(/\t/g, ' ')
    .replace(STRIP_RE, '')
}

/* ============================== 链接 ============================== */

/**
 * 富文本链接的「方案级」清洗：只放行 http/https/mailto 与站内相对路径（/ 开头、不是 //）。
 * javascript:/data:/vbscript:/file:/协议相对 // 等一律丢弃链接（文字保留）。
 * 形如 www.x.com / x.com/path 的裸域名补 https://（从网页粘贴常见）。
 *
 * 注意这里**不**丢弃含 {{…}} 或空格的地址：那属于「作者写错了」，要让 lint 报出来，
 * 而不是保存时悄悄把链接抹掉（渲染器对这种地址另有拒绝逻辑，不会真的输出）。
 */
export function sanitizeLinkHref(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const s = cleanText(raw).replace(/\n/g, '').trim()
  if (!s || s.length > 2000) return null
  if (/^https?:\/\//i.test(s)) return s
  if (/^mailto:/i.test(s)) return s.length > 7 ? s : null
  if (s.startsWith('/') && !s.startsWith('//') && !s.startsWith('/\\')) return s
  if (/^[a-z]+:/i.test(s)) return null // 其他协议（javascript: data: vbscript: file: …）
  if (/^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+(?::\d+)?(?:[/?#]|$)/i.test(s)) return `https://${s}`
  return null
}

/* ============================== 富文本规范化 ============================== */

type ListItem = { type: 'listItem'; content: { type: 'paragraph'; content?: RichInline[] }[] }
type Paragraph = { type: 'paragraph'; content?: RichInline[] }

const MAX_TEXT = 5000
const MAX_INLINES = 400
const MAX_BLOCK_NODES = 100
const MAX_LIST_ITEMS = 50
const MAX_ITEM_PARAS = 10
const MAX_DEPTH = 24

const MARK_ORDER = ['bold', 'italic', 'underline', 'strike', 'textStyle', 'link'] as const

function normMarks(raw: unknown): RichMark[] {
  if (!Array.isArray(raw)) return []
  const byType = new Map<string, RichMark>()
  for (const m of raw) {
    if (!isObj(m) || typeof m.type !== 'string') continue
    const t = m.type
    const attrs = isObj(m.attrs) ? m.attrs : {}
    if ((t === 'bold' || t === 'strong') && !byType.has('bold')) byType.set('bold', { type: 'bold' })
    else if ((t === 'italic' || t === 'em') && !byType.has('italic')) byType.set('italic', { type: 'italic' })
    else if (t === 'underline' && !byType.has('underline')) byType.set('underline', { type: 'underline' })
    else if ((t === 'strike' || t === 'strikethrough' || t === 's') && !byType.has('strike')) byType.set('strike', { type: 'strike' })
    else if (t === 'link' && !byType.has('link')) {
      const href = sanitizeLinkHref(attrs.href)
      if (href) byType.set('link', { type: 'link', attrs: { href } })
    } else if (t === 'textStyle' && !byType.has('textStyle')) {
      const color = normalizeColor(attrs.color)
      if (color) byType.set('textStyle', { type: 'textStyle', attrs: { color } })
    }
    // highlight / code / subscript / fontFamily / fontSize … 一律丢弃
  }
  const out: RichMark[] = []
  for (const k of MARK_ORDER) {
    const m = byType.get(k)
    if (m) out.push(m)
  }
  return out
}

const sameMarks = (a: RichMark[] | undefined, b: RichMark[] | undefined) => JSON.stringify(a || []) === JSON.stringify(b || [])

function pushText(out: RichInline[], text: string, marks: RichMark[]) {
  const t = cleanText(text)
  if (!t) return
  const parts = t.split('\n')
  parts.forEach((part, i) => {
    if (i > 0) out.push({ type: 'hardBreak' })
    if (part) out.push(marks.length ? { type: 'text', text: part, marks } : { type: 'text', text: part })
  })
}

function collectInlines(nodes: unknown[], out: RichInline[], depth: number) {
  if (depth > MAX_DEPTH) return
  for (const n of nodes) {
    if (typeof n === 'string') {
      pushText(out, n, [])
      continue
    }
    if (!isObj(n)) continue
    const type = typeof n.type === 'string' ? n.type : ''
    if (type === 'text') {
      if (typeof n.text === 'string') pushText(out, n.text, normMarks(n.marks))
    } else if (type === 'hardBreak') {
      out.push({ type: 'hardBreak' })
    } else if (type === 'image') {
      // 行内图片不支持，丢弃（图片请用图片区块）
    } else if (type === 'mention' || type === 'emoji') {
      const attrs = isObj(n.attrs) ? n.attrs : {}
      const label = [attrs.label, attrs.name, attrs.id].find((v) => typeof v === 'string' && v)
      if (typeof label === 'string') pushText(out, label, [])
    } else if (Array.isArray(n.content)) {
      collectInlines(n.content, out, depth + 1)
    } else if (typeof n.text === 'string') {
      pushText(out, n.text, normMarks(n.marks))
    }
  }
}

/** 合并相邻同样式文字、切掉超长、去掉首尾换行、限制节点数 */
function tidyInlines(list: RichInline[]): RichInline[] {
  const merged: RichInline[] = []
  for (const n of list) {
    const last = merged[merged.length - 1]
    if (n.type === 'text' && last && last.type === 'text' && sameMarks(last.marks, n.marks)) {
      merged[merged.length - 1] = { ...last, text: last.text + n.text }
    } else merged.push(n)
  }
  while (merged.length && merged[0].type === 'hardBreak') merged.shift()
  while (merged.length && merged[merged.length - 1].type === 'hardBreak') merged.pop()
  const out: RichInline[] = []
  for (const n of merged) {
    if (n.type === 'text' && n.text.length > MAX_TEXT) {
      // 严格 schema 单节点 ≤5000；拆开而不是截断，内容一字不丢
      for (let i = 0; i < n.text.length; i += MAX_TEXT) {
        const chunk = n.text.slice(i, i + MAX_TEXT)
        out.push(n.marks ? { type: 'text', text: chunk, marks: n.marks } : { type: 'text', text: chunk })
      }
    } else out.push(n)
  }
  return out.slice(0, MAX_INLINES)
}

function paragraphOf(inlines: RichInline[]): Paragraph {
  const content = tidyInlines(inlines)
  return content.length ? { type: 'paragraph', content } : { type: 'paragraph' }
}

const isInlineNode = (n: unknown): boolean =>
  typeof n === 'string' ||
  (isObj(n) &&
    (n.type === 'text' || n.type === 'hardBreak' || n.type === 'mention' || n.type === 'emoji' || (n.type === 'image' && !n.content) ||
      (typeof n.text === 'string' && !Array.isArray(n.content))))

const LIST_TYPES = new Set(['bulletList', 'orderedList', 'taskList'])
const ITEM_TYPES = new Set(['listItem', 'taskItem'])

type Flat = Paragraph | { type: 'bulletList' | 'orderedList'; content: ListItem[] }

/** 任意块级节点 → 段落/列表序列 */
function collectBlocks(nodes: unknown[], out: Flat[], depth: number) {
  if (depth > MAX_DEPTH) return
  let pending: unknown[] = []
  const flush = () => {
    if (pending.length) {
      out.push(paragraphOf(collectInlineList(pending, depth)))
      pending = []
    }
  }
  for (const n of nodes) {
    if (isInlineNode(n)) {
      // 块级位置上散落的文字（粘贴常见）：连续的并成一段
      if (isObj(n) && n.type === 'image') continue
      pending.push(n)
      continue
    }
    flush()
    if (!isObj(n)) continue
    const type = typeof n.type === 'string' ? n.type : ''
    const content = Array.isArray(n.content) ? n.content : []
    if (LIST_TYPES.has(type)) {
      const items = listItemsOf(content, depth + 1)
      const listType = type === 'orderedList' ? 'orderedList' : 'bulletList'
      for (let i = 0; i < items.length; i += MAX_LIST_ITEMS) {
        out.push({ type: listType, content: items.slice(i, i + MAX_LIST_ITEMS) })
      }
    } else if (ITEM_TYPES.has(type)) {
      collectBlocks(content, out, depth + 1)
    } else if (type === 'horizontalRule') {
      // 丢弃（分割线请用分割线区块）
    } else if (type === 'codeBlock') {
      out.push(paragraphOf(collectInlineList(content, depth + 1)))
    } else if (content.length && content.every(isInlineNode)) {
      // paragraph / heading / 未知的行内容器
      out.push(paragraphOf(collectInlineList(content, depth + 1)))
    } else if (content.length) {
      // blockquote / table / 未知块容器：拆开递归
      collectBlocks(content, out, depth + 1)
    } else if (type === 'paragraph' || type === 'heading') {
      out.push({ type: 'paragraph' })
    } else if (typeof n.text === 'string') {
      out.push(paragraphOf(collectInlineList([n], depth + 1)))
    }
  }
  flush()
}

function collectInlineList(nodes: unknown[], depth: number): RichInline[] {
  const out: RichInline[] = []
  collectInlines(nodes, out, depth)
  return out
}

/** 列表 → 扁平的列表项（嵌套列表的项接在父项后面，同一层级） */
function listItemsOf(children: unknown[], depth: number): ListItem[] {
  const items: ListItem[] = []
  if (depth > MAX_DEPTH) return items
  for (const child of children) {
    const content = isObj(child) && Array.isArray(child.content) ? child.content : [child]
    const paras: Paragraph[] = []
    const nested: ListItem[] = []
    for (const c of content) {
      if (isObj(c) && typeof c.type === 'string' && LIST_TYPES.has(c.type)) {
        nested.push(...listItemsOf(Array.isArray(c.content) ? c.content : [], depth + 1))
      } else {
        const tmp: Flat[] = []
        collectBlocks([c], tmp, depth + 1)
        for (const f of tmp) {
          if (f.type === 'paragraph') paras.push(f)
          else nested.push(...f.content) // 列表项里藏的列表（形状怪异的粘贴）同样压平
        }
      }
    }
    const kept = paras.slice(0, MAX_ITEM_PARAS)
    if (paras.length > MAX_ITEM_PARAS) {
      // 超出的段落并进最后一段（用换行隔开），不丢字
      const last = kept[kept.length - 1]
      const extra: RichInline[] = [...(last.content || [])]
      for (const p of paras.slice(MAX_ITEM_PARAS)) extra.push({ type: 'hardBreak' }, ...(p.content || []))
      kept[kept.length - 1] = paragraphOf(extra)
    }
    const hasText = kept.some((p) => p.content && p.content.length)
    if (hasText || !nested.length) items.push({ type: 'listItem', content: kept.length ? kept : [{ type: 'paragraph' }] })
    items.push(...nested)
  }
  return items
}

export function normalizeRichDoc(input: unknown): RichDoc {
  let root: unknown = input
  if (typeof root === 'string') {
    const str = root
    try {
      root = JSON.parse(str)
    } catch {
      // 不是 JSON：当成纯文字，每行一段
      const paras: Paragraph[] = cleanText(str)
        .split('\n')
        .map((line) => paragraphOf(line ? [{ type: 'text', text: line }] : []))
      const content: RichBlockNode[] = paras.length ? paras : [{ type: 'paragraph' }]
      return { type: 'doc', content: content.slice(0, MAX_BLOCK_NODES) }
    }
    if (typeof root === 'string') return normalizeRichDoc(root.length ? root : '')
  }
  const out: Flat[] = []
  if (isObj(root)) {
    if (Array.isArray(root.content)) collectBlocks(root.content, out, 0)
    else if (typeof root.text === 'string') collectBlocks([root], out, 0)
  } else if (Array.isArray(root)) {
    collectBlocks(root, out, 0)
  }
  const content = out.slice(0, MAX_BLOCK_NODES) as RichBlockNode[]
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] }
}

/* ============================== 整篇文档 ============================== */

const FIELD_LABEL: Record<string, string> = {
  title: '标题',
  subtitle: '副标题',
  bg: '背景色',
  bg2: '渐变色',
  color: '文字颜色',
  align: '对齐',
  image: '图片地址',
  imageAlt: '图片说明',
  button: '按钮',
  label: '按钮文字',
  href: '链接',
  content: '内容',
  level: '级别',
  size: '字号',
  src: '图片地址',
  alt: '图片说明',
  width: '宽度',
  radius: '圆角',
  fullWidth: '通栏',
  productId: '商品',
  productIds: '商品',
  layout: '布局',
  ctaLabel: '按钮文字',
  showOriginalPrice: '显示原价',
  showFeatures: '显示卖点',
  mode: '方式',
  note: '备注',
  grant: '直发券参数',
  claimCode: '领取码',
  discount: '面额',
  minAmount: '门槛',
  validity: '有效期',
  days: '天数',
  date: '日期',
  kind: '券类型',
  tone: '样式',
  thickness: '粗细',
  widthPct: '宽度',
  height: '高度',
  box: '边距与背景',
  padTop: '上边距',
  padBottom: '下边距',
  id: '区块 id',
  settings: '配色',
  backdrop: '外底色',
  canvas: '画布色',
  brand: '品牌色',
  accent: '强调色',
  text: '正文色',
  muted: '次要文字色',
  link: '链接色',
  font: '字体',
}

const HAS_CJK = /[㐀-鿿]/

function zodIssueText(issue: { code: string; message: string; path: (string | number)[] }, blocks: unknown[]): string {
  const path = issue.path
  let where = ''
  if (path[0] === 'blocks' && typeof path[1] === 'number') {
    const b = blocks[path[1]]
    const type = isObj(b) && typeof b.type === 'string' ? b.type : ''
    const label = (BLOCK_TYPE_LABEL as Record<string, string>)[type]
    where = `第 ${path[1] + 1} 个区块${label ? `（${label}）` : ''}`
    const field = path.slice(2).find((p) => typeof p === 'string' && FIELD_LABEL[p]) as string | undefined
    if (field) where += `的${FIELD_LABEL[field]}`
  } else if (path[0] === 'settings') {
    const field = path[1] as string | undefined
    where = `配色${field && FIELD_LABEL[field] ? `的${FIELD_LABEL[field]}` : ''}`
  } else if (path[0] === 'blocks') {
    where = '区块列表'
  }
  let msg = issue.message
  if (!HAS_CJK.test(msg)) {
    if (issue.code === 'invalid_union_discriminator') msg = '未知的区块类型'
    else if (issue.code === 'invalid_type') msg = '缺少或格式不对'
    else if (issue.code === 'invalid_enum_value' || issue.code === 'invalid_literal' || issue.code === 'invalid_union') msg = '取值不在允许范围内'
    else if (issue.code === 'too_small' || issue.code === 'too_big') msg = '超出允许范围'
    else if (issue.code === 'invalid_string') msg = '格式不对'
    else msg = '内容不合法'
  }
  return where ? `${where}：${msg}` : msg
}

const STRING_MAX: Partial<Record<BlockType, Record<string, number>>> = {
  header: { title: 40 },
  hero: { title: 80, subtitle: 200, imageAlt: 120 },
  image: { alt: 120 },
  button: { label: 40 },
  product: { ctaLabel: 20 },
  productGrid: { ctaLabel: 20 },
  coupon: { title: 40, note: 120, ctaLabel: 20 },
}
const URL_FIELDS = ['href', 'src', 'image']
const COLOR_FIELDS = ['bg', 'bg2', 'color']

function clampInt(v: unknown, lo: number, hi: number): unknown {
  if (typeof v !== 'number' || !Number.isFinite(v)) return v
  return Math.max(lo, Math.min(hi, Math.round(v)))
}

function cleanLine(v: unknown, max: number): unknown {
  if (typeof v !== 'string') return v
  return Array.from(cleanText(v).replace(/\n+/g, ' ')).slice(0, max).join('')
}

function normalizeSettings(raw: unknown): unknown {
  if (!isObj(raw)) return raw
  const out: Record<string, unknown> = { ...raw }
  for (const k of ['backdrop', 'canvas', 'brand', 'accent', 'text', 'muted', 'link']) {
    const c = normalizeColor(out[k])
    if (c) out[k] = c
  }
  out.radius = clampInt(out.radius, 0, 24)
  return out
}

function normalizeBlock(raw: unknown, index: number, seen: Set<string>): unknown {
  if (!isObj(raw)) return raw
  const b: Record<string, unknown> = { ...raw }
  const type = typeof b.type === 'string' ? (b.type as BlockType) : null

  // id：缺失/非法/重复 → 按位置生成确定性的新 id（不用随机数：同一份输入必须得到同一份输出，内容指纹才稳定）
  let id = typeof b.id === 'string' ? b.id.trim() : ''
  if (!BLOCK_ID_RE.test(id) || seen.has(id)) {
    let k = 0
    do {
      id = `blk${index + 1}${k ? `_${k}` : ''}`
      k++
    } while (seen.has(id))
  }
  seen.add(id)
  b.id = id

  for (const k of COLOR_FIELDS) {
    if (b[k] === undefined) continue
    const c = normalizeColor(b[k])
    if (c) b[k] = c
    else if (k === 'bg2' && (b[k] === null || b[k] === '')) delete b[k]
  }
  for (const k of URL_FIELDS) {
    if (typeof b[k] === 'string') b[k] = (b[k] as string).trim().slice(0, 2000)
  }
  if (type === 'hero' && typeof b.image === 'string' && !b.image) delete b.image
  if (type === 'image' && typeof b.href === 'string' && !b.href) delete b.href

  if (isObj(b.box)) {
    const box: Record<string, unknown> = { ...b.box }
    box.padTop = clampInt(box.padTop, 0, 64)
    box.padBottom = clampInt(box.padBottom, 0, 64)
    if (box.bg !== undefined) {
      const c = normalizeColor(box.bg)
      if (c) box.bg = c
      else delete box.bg
    }
    for (const k of ['padTop', 'padBottom']) if (box[k] === null || box[k] === undefined) delete box[k]
    b.box = box
  } else if (b.box === null) delete b.box

  if (type === 'heading' || type === 'text' || type === 'callout') b.content = normalizeRichDoc(b.content)

  const maxes = type ? STRING_MAX[type] : undefined
  if (maxes) for (const [k, max] of Object.entries(maxes)) b[k] = cleanLine(b[k], max)

  if (type === 'hero' && isObj(b.button)) {
    const btn: Record<string, unknown> = { ...b.button }
    btn.label = cleanLine(btn.label, 40)
    if (typeof btn.href === 'string') btn.href = btn.href.trim().slice(0, 2000)
    for (const k of ['bg', 'color']) {
      const c = normalizeColor(btn[k])
      if (c) btn[k] = c
    }
    b.button = btn
  } else if (type === 'hero' && b.button === null) delete b.button

  if (type === 'image') {
    b.width = clampInt(b.width, 20, 100)
    b.radius = clampInt(b.radius, 0, 24)
    if (b.radius === undefined || b.radius === null) delete b.radius
  }
  if (type === 'button') b.radius = clampInt(b.radius, 0, 40)
  if (type === 'spacer') b.height = clampInt(b.height, 8, 96)
  if (type === 'productGrid' && Array.isArray(b.productIds)) b.productIds = b.productIds.slice(0, 6)
  if (type === 'coupon') {
    if (typeof b.claimCode === 'string') {
      const code = b.claimCode.trim().toLowerCase()
      if (code) b.claimCode = code
      else delete b.claimCode
    } else if (b.claimCode === null) delete b.claimCode
    if (b.note === '' || b.note === null) delete b.note
    if (b.grant === null) delete b.grant
    if (isObj(b.grant)) {
      const g: Record<string, unknown> = { ...b.grant }
      const money = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) / 100 : v)
      g.discount = money(g.discount)
      g.minAmount = money(g.minAmount)
      if (!Array.isArray(g.productIds)) g.productIds = []
      b.grant = g
    }
  }
  return b
}

/**
 * 整篇文档规范化 + zod 校验。服务端保存与编辑器导入都用它。
 * 返回 ok=false 时 error 是给人看的中文说明。
 */
export function normalizeDoc(input: unknown): { ok: true; doc: EmailDoc } | { ok: false; error: string } {
  let raw: unknown = input
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      return { ok: false, error: '文档不是合法的 JSON' }
    }
  }
  if (!isObj(raw)) return { ok: false, error: '文档格式不对' }
  if (raw.v !== undefined && raw.v !== 1) return { ok: false, error: '不支持的文档版本' }
  if (!Array.isArray(raw.blocks)) return { ok: false, error: '文档缺少区块列表' }
  const seen = new Set<string>()
  const blocks = raw.blocks.map((b, i) => normalizeBlock(b, i, seen))
  const candidate = { v: 1, settings: normalizeSettings(raw.settings), blocks }
  const parsed = emailDocSchema.safeParse(candidate)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return { ok: false, error: zodIssueText(first, raw.blocks) }
  }
  const bytes = utf8Bytes(JSON.stringify(parsed.data))
  if (bytes > MAX_DOC_JSON_BYTES) {
    return { ok: false, error: `文档太大（${Math.ceil(bytes / 1024)}KB），上限 ${MAX_DOC_JSON_BYTES / 1024}KB` }
  }
  return { ok: true, doc: parsed.data }
}

export function emptyRichDoc(text = ''): RichDoc {
  return text
    ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
    : { type: 'doc', content: [{ type: 'paragraph' }] }
}

/* ============================== 遍历与序列化 ============================== */

function inlinePlain(content: RichInline[] | undefined): string {
  if (!Array.isArray(content)) return ''
  return content.map((n) => (n && n.type === 'text' ? n.text : n && n.type === 'hardBreak' ? '\n' : '')).join('')
}

/** 富文本 → 纯文字（摘要、lint 扫描、纯文本版用） */
export function richToPlain(doc: RichDoc): string {
  if (!doc || !Array.isArray(doc.content)) return ''
  const lines: string[] = []
  for (const node of doc.content) {
    if (!node) continue
    if (node.type === 'paragraph') lines.push(inlinePlain(node.content))
    else if (node.type === 'bulletList' || node.type === 'orderedList') {
      ;(node.content || []).forEach((item, i) => {
        const text = (item?.content || []).map((p) => inlinePlain(p?.content)).join('\n')
        lines.push(`${node.type === 'orderedList' ? `${i + 1}.` : '•'} ${text}`)
      })
    }
  }
  return lines.join('\n')
}

/**
 * 逐个访问富文本里的文字节点（lint 按「单个文字节点」检查变量：
 * 被加粗/链接拆开的 {{nick|name}} 在渲染与发送时都不会被替换，必须在这一层看出来）。
 */
export function walkRichText(doc: RichDoc, fn: (text: string, marks: RichMark[]) => void): void {
  if (!doc || !Array.isArray(doc.content)) return
  const visit = (content: RichInline[] | undefined) => {
    if (!Array.isArray(content)) return
    for (const n of content) if (n && n.type === 'text') fn(n.text, n.marks || [])
  }
  for (const node of doc.content) {
    if (!node) continue
    if (node.type === 'paragraph') visit(node.content)
    else for (const item of node.content || []) for (const p of item?.content || []) visit(p?.content)
  }
}

/** 富文本里的全部链接地址 */
export function richLinks(doc: RichDoc): string[] {
  const out: string[] = []
  walkRichText(doc, (_t, marks) => {
    for (const m of marks) if (m.type === 'link') out.push(m.attrs.href)
  })
  return out
}

/** 设置里的颜色是否齐全合法（渲染器用来兜底） */
export function isValidSettings(s: unknown): s is DocSettings {
  return !!s && typeof s === 'object' && ['backdrop', 'canvas', 'brand', 'accent', 'text', 'muted', 'link'].every((k) => HEX_COLOR_RE.test(String((s as Record<string, unknown>)[k])))
}
