/**
 * 邮件渲染器：EmailDoc → 邮件客户端安全的 HTML + 纯文本。
 *
 * 【同构纯函数】浏览器预览与服务端发送用同一份代码（所见即所发）：
 * 不许 import prisma / fs / crypto / window / React。规则清单见设计文档 7.2，
 * 由 scripts/check-marketing-render.ts 逐条断言。
 *
 * 【实现方：渲染器】签名是契约。
 *
 * 版式要点（改之前先想清楚对哪些邮箱有影响）：
 * - 600px「流式混合」布局：外层 max-width div + Outlook 条件注释里的固定宽幽灵表；
 *   两列商品用 inline-block + mso 幽灵 <td>，**不依赖媒体查询**（QQ/163 对 <style> 的支持不可靠）。
 *   <style> 里的媒体查询与暗色规则只是锦上添花，删掉它们版式也不能坏。
 * - 样式全内联；每个带字元素自带 font-family/font-size/line-height/color（Outlook 与部分国产客户端不继承）；
 *   <p>/<h*> 一律 margin:0，间距只用 <td> 的 padding 或定高 spacer；不出现 flex/grid/position。
 * - 有底色处 bgcolor 属性 + background-color 双写；渐变只作为 background-image 叠在纯色上（Outlook 看到纯色）。
 * - 文字全部 HTML 转义；属性只从白名单字段拼，颜色/数字全部再校验一遍（不信任入参，哪怕它过了 zod）。
 */
import {
  BLOCK_TYPE_LABEL,
  DEFAULT_GREETING_NAME,
  HEX_COLOR_RE,
  MERGE_TAGS,
  type Align,
  type Block,
  type BlockOf,
  type BlockType,
  type CouponView,
  type DocSettings,
  type EmailDoc,
  type FooterConfig,
  type ProductCard,
  type RenderCtx,
  type RenderMode,
  type RenderResult,
  type RichDoc,
  type RichInline,
} from './types'
import { bjDateCn } from './time'
import { cleanText, contrastRatio, ensureContrast, escapeHtml as esc, mixHex, richToPlain, utf8Bytes } from './richtext'
import { mergeTagRe, safeBodyEmail, safeNickname, tagDefault } from './lint'
import { FIRST_NOTICE_TEXT } from './personalize'

export { contrastRatio, ensureContrast, hexToRgb, mixHex, relativeLuminance } from './richtext'

/* ============================== 常量 ============================== */

export const EMAIL_WIDTH = 600
/** 内容区左右留白（桌面）；手机上由媒体查询收窄为 24px（不支持媒体查询时保持 40，仍可读） */
const PX = 40
export const CONTENT_WIDTH = EMAIL_WIDTH - PX * 2

export const FONT_SANS = "-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei','微软雅黑','Helvetica Neue',Arial,sans-serif"
export const FONT_SERIF = "'Songti SC',STSong,'Noto Serif SC','Source Han Serif SC',SimSun,'宋体',Georgia,serif"

const TBL = 'role="presentation" cellpadding="0" cellspacing="0" border="0"'

/** 预览里没有真实收件人时用的样例变量 */
export const SAMPLE_EMAIL = 'you@example.com'

/** 预览选中块的描边色（编辑器主色 sky-500） */
const SELECT_OUTLINE = '#0ea5e9'

/* ============================== 渲染状态 ============================== */

interface R {
  ctx: RenderCtx
  doc: EmailDoc
  mode: RenderMode
  s: DocSettings
  origin: string
  /** 正文/标题字体（跟随 settings.font） */
  body: string
  /** 界面性文字（按钮、价格、页眉、页脚）永远用无衬线 */
  ui: string
  preview: boolean
  darkAuto: boolean
  /** preview 专用标记的字节数（sizeBytes 要扣掉） */
  extra: number
  images: number
  links: Map<number, { idx: number; url: string; label: string }>
  now: Date
  footer: FooterConfig
}

type Out = { html: string; text: string }
const EMPTY: Out = { html: '', text: '' }

/* ============================== 小工具 ============================== */

function color(c: unknown, fallback: string): string {
  return typeof c === 'string' && HEX_COLOR_RE.test(c) ? c.toLowerCase() : fallback
}

function int(v: unknown, lo: number, hi: number, fallback: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback
  return Math.max(lo, Math.min(hi, Math.round(v)))
}

function alignOf(a: unknown): Align {
  return a === 'center' || a === 'right' ? a : 'left'
}

/** 金额展示：整数不带小数（¥30），否则两位（¥39.90） */
export function fmtMoney(v: string | number | null | undefined): string {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim())
  if (!Number.isFinite(n)) return String(v ?? '')
  const r = Math.round(n * 100) / 100
  return Number.isInteger(r) ? String(r) : r.toFixed(2)
}

function money2(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? (Math.round(n * 100) / 100).toFixed(2) : '0.00'
}

/** 北京日期 YYYY-MM-DD → 2026年10月7日（字符串直接拆，不经 Date，免得跨时区差一天） */
function dateKeyCn(key: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '')
  if (!m) return key
  return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日`
}

function font(family: string, size: number, lh: number, c: string): string {
  return `font-family:${family};font-size:${size}px;line-height:${lh}px;color:${c};mso-line-height-rule:exactly;`
}

/** 定高空行：<p> 不许用 margin、非 td 不许用 padding，段间距就靠它 */
function gap(px: number): string {
  return `<div style="height:${px}px;line-height:${px}px;font-size:1px;mso-line-height-rule:exactly;">&nbsp;</div>`
}

function hostOf(origin: string): string {
  const m = /^https?:\/\/([^/:?#]+)/i.exec(origin)
  return m ? m[1].replace(/^www\./i, '') : origin
}

/** 外部（库里/配置里）来的文字：清洗 + 去掉 {{ }}（外部文字不参与模板） */
function sysPlain(s: unknown): string {
  return cleanText(String(s ?? ''))
    .replace(/\{\{|\}\}/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}
const sys = (s: unknown) => esc(sysPlain(s))

function clipLabel(s: string, fallback: string): string {
  const v = s.replace(mergeTagRe(), '').replace(/\s+/g, ' ').trim()
  return Array.from(v || fallback).slice(0, 120).join('')
}

/* ============================== 变量与文字 ============================== */

/** 作者文字里的变量：send 模式原样保留（发送时逐封替换）；preview/test 直接代入样例/测试收件人的值 */
function vars(r: R, s: string): string {
  return s.replace(mergeTagRe(), (whole: string, name: string, idx: string | undefined, def: string | undefined) => {
    // 作者不得手写系统占位（lint 已报错）；万一漏过，渲染时直接抹掉，绝不让它在发送时被展开成退订链接等
    if (name.startsWith('mkt_')) return ''
    if (idx !== undefined || !(MERGE_TAGS as readonly string[]).includes(name)) return whole
    if (r.mode === 'send') return whole
    const v = r.ctx.vars || {}
    if (name === 'nickname') return safeNickname(v.nickname ?? null, tagDefault(def) || DEFAULT_GREETING_NAME)
    // 与逐封个性化同一口径（QQ 号邮箱遮成 12***@qq.com）：测试发给 QQ 号邮箱不再被误拦，看到的也是收件人实际收到的样子（审查 C7）
    if (name === 'email') return safeBodyEmail(v.email || SAMPLE_EMAIL)
    if (name === 'coupon_expires') return v.coupon_expires || sampleCouponExpires(r)
    return whole
  })
}

/** 作者的纯文字字段 → 转义后的 HTML */
function t(r: R, s: unknown): string {
  return esc(vars(r, cleanText(String(s ?? '')).replace(/\n+/g, ' ')))
}
/** 作者的纯文字字段 → 纯文本版 */
function tp(r: R, s: unknown): string {
  return vars(r, cleanText(String(s ?? '')).replace(/\n+/g, ' ')).trim()
}

function firstGrantCoupon(doc: EmailDoc): BlockOf<'coupon'> | null {
  for (const b of doc.blocks || []) if (b && b.type === 'coupon' && b.mode === 'grant' && b.grant) return b
  return null
}

/** 预览/测试时 {{coupon_expires}} 的样例值：按区块参数推算「今天收到的话哪天到期」 */
function sampleCouponExpires(r: R): string {
  const c = firstGrantCoupon(r.doc)
  const v = c?.grant?.validity
  if (v && v.mode === 'until') return dateKeyCn(v.date)
  const days = v && v.mode === 'days' ? v.days : 7
  return bjDateCn(new Date(r.now.getTime() + days * 86400_000))
}

/* ============================== 链接与图片 ============================== */

const UNSAFE_URL_CHARS = /[\s<>"'`\\{}]/

/** 地址白名单：https/http/mailto 原样；站内相对路径补成绝对；其余（含变量、空格、javascript: 等）→ null */
function resolveUrl(r: R, raw: unknown): string | null {
  const url = typeof raw === 'string' ? raw.trim() : ''
  if (!url || url.length > 2000 || UNSAFE_URL_CHARS.test(url)) return null
  if (/^https?:\/\/[^/?#]+/i.test(url)) return url
  if (/^mailto:[^@]+@[^@]+$/i.test(url)) return url
  if (url.startsWith('/') && !url.startsWith('//') && r.origin) return r.origin + url
  return null
}

/**
 * 生成一个链接。send 模式（及调用方给了 linkWrap 的 test 模式）http(s) 链接一律经 linkWrap：
 * 登记后返回 {{mkt_link:N}}（点击跳转只认库里存的 URL）。mailto 不经跟踪（跳转到 mailto 在很多客户端里不工作）。
 * 返回的 href 未转义，调用方负责 esc。
 */
function link(r: R, raw: unknown, label: string): { href: string; text: string } | null {
  const abs = resolveUrl(r, raw)
  if (!abs) return null
  if (/^mailto:/i.test(abs)) return { href: abs, text: abs.slice(7) }
  if (r.ctx.linkWrap) {
    const lab = clipLabel(label, '链接')
    const wrapped = String(r.ctx.linkWrap(abs, lab) ?? '')
    const m = /^\{\{mkt_link:(\d+)\}\}$/.exec(wrapped)
    if (m) {
      const idx = Number(m[1])
      if (!r.links.has(idx)) r.links.set(idx, { idx, url: abs, label: lab })
    }
    if (wrapped) return { href: wrapped, text: wrapped }
  }
  return { href: abs, text: abs }
}

/** 图片地址白名单：绝对 https 或站内相对路径；只收 jpg/jpeg/png/gif */
function imageUrl(r: R, raw: unknown): string | null {
  const url = typeof raw === 'string' ? raw.trim() : ''
  if (!url || url.length > 2000 || UNSAFE_URL_CHARS.test(url)) return null
  if (!/\.(jpe?g|png|gif)$/i.test(url.replace(/[?#].*$/, ''))) return null
  if (/^https:\/\/[^/?#]+/i.test(url)) return url
  if (url.startsWith('/') && !url.startsWith('//') && r.origin) return r.origin + url
  return null
}

/** preview 专用片段：计入 extra，不算进 sizeBytes */
function previewOnly(r: R, html: string): string {
  if (!r.preview) return ''
  r.extra += utf8Bytes(html)
  return html
}

function placeholder(r: R, msg: string): string {
  return previewOnly(
    r,
    `<table ${TBL} width="100%"><tr><td align="center" bgcolor="#f8fafc" style="padding:18px 16px;background-color:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;${font(FONT_SANS, 13, 20, '#64748b')}">${esc(msg)}</td></tr></table>`
  )
}

/**
 * 一张图片。imagesOff（预览的无图模式）下换成说明文字块 —— 字节数按真图计，保证体积显示不跳。
 */
function img(r: R, o: { src: string; alt: string; width: number; radius?: string; align?: Align; height?: number }): string {
  r.images++
  const w = Math.max(1, Math.round(o.width))
  const margin = o.align === 'center' ? 'margin:0 auto;' : o.align === 'right' ? 'margin:0 0 0 auto;' : ''
  const h = o.height ? ` height="${o.height}"` : ''
  const hStyle = o.height ? `height:${o.height}px;` : 'height:auto;'
  const tag = `<img src="${esc(o.src)}" width="${w}"${h} alt="${esc(o.alt)}" style="display:block;width:100%;max-width:${w}px;${hStyle}border:0;outline:none;text-decoration:none;${o.radius ? `border-radius:${o.radius};` : ''}${margin}">`
  if (!(r.preview && r.ctx.imagesOff)) return tag
  const box = `<table ${TBL} width="100%" style="max-width:${w}px;${margin}"><tr><td align="center" bgcolor="#f1f5f9" style="padding:14px 12px;background-color:#f1f5f9;border:1px dashed #cbd5e1;${font(FONT_SANS, 13, 20, '#64748b')}">[图片] ${esc(o.alt || '（无说明文字）')}</td></tr></table>`
  r.extra += utf8Bytes(box) - utf8Bytes(tag)
  return box
}

/* ============================== 按钮 ============================== */

const BUTTON_SIZE = {
  sm: { fs: 15, lh: 20, py: 12, px: 22 }, // 12+20+12 = 44
  md: { fs: 16, lh: 22, py: 14, px: 30 }, // 50
  lg: { fs: 17, lh: 24, py: 17, px: 40 }, // 58
} as const

/**
 * 防弹按钮：<a> 自带底色与 padding（整块可点），Outlook 用 mso-font-width/mso-text-raise 撑出同样的尺寸
 * （Outlook 不认 <a> 的 padding；这是 Mark Robbins 的写法，不需要 VML）。高度 ≥ 44px。
 */
function button(
  r: R,
  o: { label: string; href: unknown; bg: string; color: string; radius: number; size: 'sm' | 'md' | 'lg'; fullWidth: boolean; align: Align; linkLabel?: string }
): Out {
  const S = BUTTON_SIZE[o.size] || BUTTON_SIZE.md
  const labelPlain = tp(r, o.label)
  const L = link(r, o.href, o.linkLabel || labelPlain || '按钮')
  const bg = o.bg
  const radius = int(o.radius, 0, 40, 8)
  const aStyle =
    `display:${o.fullWidth ? 'block' : 'inline-block'};padding:${S.py}px ${S.px}px;${font(r.ui, S.fs, S.lh, o.color)}` +
    `font-weight:700;letter-spacing:0.5px;text-decoration:none;text-align:center;border-radius:${radius}px;background-color:${bg};mso-padding-alt:0;text-underline-color:${bg};`
  const inner =
    `<!--[if mso]><i style="letter-spacing:${S.px}px;mso-font-width:-100%;mso-text-raise:${S.py * 2}pt;" hidden>&nbsp;</i><![endif]-->` +
    `<span style="mso-text-raise:${S.py}pt;">${t(r, o.label) || '&nbsp;'}</span>` +
    `<!--[if mso]><i style="letter-spacing:${S.px}px;mso-font-width:-100%;" hidden>&nbsp;</i><![endif]-->`
  const a = L ? `<a href="${esc(L.href)}" target="_blank" style="${aStyle}">${inner}</a>` : `<span style="${aStyle}">${inner}</span>`
  const tableAlign = o.fullWidth ? '' : o.align === 'center' ? ' align="center"' : o.align === 'right' ? ' align="right"' : ''
  const tableStyle = o.fullWidth ? 'width:100%;' : o.align === 'center' ? 'margin:0 auto;' : ''
  const html =
    `<table ${TBL}${tableAlign}${o.fullWidth ? ' width="100%"' : ''}${tableStyle ? ` style="${tableStyle}"` : ''}>` +
    `<tr><td align="center" bgcolor="${bg}" style="border-radius:${radius}px;background-color:${bg};">${a}</td></tr></table>`
  const text = L ? `${labelPlain || '链接'}：${L.text}` : labelPlain
  return { html, text }
}

/* ============================== 富文本 ============================== */

type TextStyle = { family: string; size: number; lh: number; color: string; align: Align; cls: string; weight?: number }

function inlinePiece(r: R, n: RichInline, inLink: boolean): Out {
  if (!n) return EMPTY
  if (n.type === 'hardBreak') return { html: '<br>', text: '\n' }
  if (n.type !== 'text' || typeof n.text !== 'string') return EMPTY
  const raw = vars(r, cleanText(n.text).replace(/\n/g, ' '))
  let h = esc(raw)
  const marks = Array.isArray(n.marks) ? n.marks : []
  const has = (k: string) => marks.some((m) => m && m.type === k)
  if (has('bold')) h = `<strong style="font-weight:700;">${h}</strong>`
  if (has('italic')) h = `<em style="font-style:italic;">${h}</em>`
  const deco = [has('underline') && !inLink ? 'underline' : '', has('strike') ? 'line-through' : ''].filter(Boolean).join(' ')
  if (deco) h = `<span style="text-decoration:${deco};">${h}</span>`
  if (!inLink) {
    const cm = marks.find((m) => m && m.type === 'textStyle')
    const c = cm && cm.type === 'textStyle' ? cm.attrs?.color : null
    if (c && HEX_COLOR_RE.test(c)) h = `<span style="color:${c.toLowerCase()};">${h}</span>`
  }
  return { html: h, text: raw }
}

function linkOf(n: RichInline): string | null {
  if (!n || n.type !== 'text' || !Array.isArray(n.marks)) return null
  const m = n.marks.find((x) => x && x.type === 'link')
  return m && m.type === 'link' && typeof m.attrs?.href === 'string' ? m.attrs.href : null
}

function colorMark(n: RichInline): string | null {
  if (!n || n.type !== 'text' || !Array.isArray(n.marks)) return null
  const m = n.marks.find((x) => x && x.type === 'textStyle')
  const c = m && m.type === 'textStyle' ? m.attrs?.color : null
  return c && HEX_COLOR_RE.test(c) ? c.toLowerCase() : null
}

/** 一段行内内容。连续带同一链接的文字并成一个 <a>（只登记一次） */
function renderInlines(r: R, content: RichInline[] | undefined): Out {
  const list = Array.isArray(content) ? content : []
  let html = ''
  let text = ''
  let i = 0
  while (i < list.length) {
    const href = linkOf(list[i])
    if (!href) {
      const p = inlinePiece(r, list[i], false)
      html += p.html
      text += p.text
      i++
      continue
    }
    let j = i
    const pieces: Out[] = []
    while (j < list.length && linkOf(list[j]) === href) pieces.push(inlinePiece(r, list[j++], true))
    const inner = pieces.map((p) => p.html).join('')
    const label = pieces.map((p) => p.text).join('')
    const L = link(r, href, label)
    if (!L) {
      // 地址不合法（lint 已报错）：只输出文字，不输出链接
      html += inner
      text += label
    } else {
      const custom = colorMark(list[i])
      const c = custom || r.s.link
      html += `<a href="${esc(L.href)}" target="_blank"${custom ? '' : ' class="mk-a"'} style="color:${c};text-decoration:underline;">${inner}</a>`
      text += label && label !== L.text ? `${label}（${L.text}）` : L.text
    }
    i = j
  }
  return { html, text }
}

function pTag(tag: string, st: TextStyle, inner: string): string {
  return `<${tag}${st.cls ? ` class="${st.cls}"` : ''} style="margin:0;${font(st.family, st.size, st.lh, st.color)}${st.weight ? `font-weight:${st.weight};` : ''}text-align:${st.align};">${inner}</${tag}>`
}

/** 列表：用表格画（<ul>/<ol> 的缩进与符号在 Outlook、QQ 邮箱里各不相同） */
function renderList(r: R, node: Extract<RichDoc['content'][number], { type: 'bulletList' | 'orderedList' }>, st: TextStyle): Out {
  const items = Array.isArray(node.content) ? node.content : []
  const ordered = node.type === 'orderedList'
  const markW = ordered ? (items.length >= 10 ? 30 : 24) : 20
  const rowGap = Math.round(st.size * 0.45)
  const rows: string[] = []
  const lines: string[] = []
  items.forEach((item, k) => {
    const paras = Array.isArray(item?.content) ? item.content : []
    const parts = paras.map((p) => renderInlines(r, p?.content))
    const body = parts.map((p) => pTag('p', { ...st, align: 'left' }, p.html || '&nbsp;')).join(gap(Math.round(st.size * 0.4)))
    const mark = ordered ? `${k + 1}.` : '•'
    const pad = k < items.length - 1 ? `padding-bottom:${rowGap}px;` : ''
    const markColor = r.s.brand
    rows.push(
      `<tr><td width="${markW}" valign="top" style="width:${markW}px;${pad}${font(st.family, st.size, st.lh, markColor)}font-weight:700;">${mark}</td>` +
        `<td valign="top" style="${pad}${font(st.family, st.size, st.lh, st.color)}">${body}</td></tr>`
    )
    lines.push(`${ordered ? `${k + 1}.` : '•'} ${parts.map((p) => p.text).join('\n')}`)
  })
  return { html: `<table ${TBL} width="100%">${rows.join('')}</table>`, text: lines.join('\n') }
}

function renderRich(r: R, doc: RichDoc, st: TextStyle, paraGap: number): Out {
  const nodes = Array.isArray(doc?.content) ? doc.content : []
  const html: string[] = []
  const text: string[] = []
  for (const node of nodes) {
    if (!node) continue
    if (node.type === 'paragraph') {
      const inl = renderInlines(r, node.content)
      html.push(pTag('p', st, inl.html || '&nbsp;'))
      text.push(inl.text)
    } else if (node.type === 'bulletList' || node.type === 'orderedList') {
      const l = renderList(r, node, st)
      html.push(l.html)
      text.push(l.text)
    }
  }
  return { html: html.join(gap(paraGap)), text: text.join('\n') }
}

/* ============================== 区块 ============================== */

const DEF_PAD: Record<BlockType, [number, number]> = {
  header: [20, 20],
  hero: [48, 48],
  heading: [28, 12],
  text: [8, 8],
  image: [12, 12],
  button: [16, 16],
  product: [16, 16],
  productGrid: [16, 4],
  coupon: [16, 16],
  callout: [12, 12],
  divider: [16, 16],
  spacer: [0, 0],
}

/** 自带底色的「色带」区块：它和白色正文之间要留出足够的呼吸空间 */
function isBanded(b: Block): boolean {
  return b.type === 'header' || b.type === 'hero' || !!(b.box && b.box.bg && HEX_COLOR_RE.test(b.box.bg))
}

interface RowOpts {
  bg?: string | null
  bg2?: string | null
  px?: number
  pxClass?: string
  pt: number
  pb: number
  first: boolean
  last: boolean
}

function row(r: R, b: Block, inner: string, o: RowOpts): string {
  const radius = int(r.s.radius, 0, 24, 12)
  const px = o.px ?? PX
  let style = `padding:${o.pt}px ${px}px ${o.pb}px ${px}px;`
  if (o.bg) {
    style += `background-color:${o.bg};`
    if (o.bg2 && o.bg2 !== o.bg) style += `background-image:linear-gradient(135deg,${o.bg} 0%,${o.bg2} 100%);`
  }
  if (radius && (o.first || o.last)) {
    const tl = o.first ? radius : 0
    const bl = o.last ? radius : 0
    style += `border-radius:${tl}px ${tl}px ${bl}px ${bl}px;`
  }
  let sel = ''
  if (r.preview && r.ctx.selectedBlockId && r.ctx.selectedBlockId === b.id) sel = previewOnly(r, `outline:2px solid ${SELECT_OUTLINE};outline-offset:-2px;`)
  const bid = r.preview ? previewOnly(r, ` data-bid="${esc(b.id)}"`) : ''
  const cls = px > 0 ? ` class="${o.pxClass || 'mk-px'}"` : ''
  return `<tr${bid}><td${cls}${o.bg ? ` bgcolor="${o.bg}"` : ''} style="${style}${sel}">${inner}</td></tr>`
}

/* ---------- 页眉 ---------- */

function renderHeader(r: R, b: BlockOf<'header'>): Out {
  const bg = color(b.bg, r.s.brand)
  const fg = color(b.color, '#ffffff')
  const align = alignOf(b.align)
  const cells: string[] = []
  if (b.logo) {
    // logo 是透明底 PNG：放进一个有底色的圆角「芯片」里，暗色模式下被反色也不会糊成一团
    const chip = contrastRatio(bg, '#ffffff') < 1.25 ? mixHex(r.s.brand, '#ffffff', 0.9) : '#ffffff'
    const alt = sysPlain(r.footer.brandName) || '贝果科技'
    const image = img(r, { src: `${r.origin}/logo-mark.png`, alt, width: 40, height: 40 })
    const L = link(r, '/', '页眉 Logo')
    const inner = L ? `<a href="${esc(L.href)}" target="_blank" style="display:inline-block;text-decoration:none;color:${fg};">${image}</a>` : image
    cells.push(
      `<td valign="middle"><table ${TBL}><tr><td width="52" height="52" align="center" valign="middle" bgcolor="${chip}" style="width:52px;height:52px;background-color:${chip};border-radius:14px;">${inner}</td></tr></table></td>`
    )
  }
  const title = tp(r, b.title)
  if (title) {
    cells.push(
      `<td valign="middle" style="${b.logo ? 'padding-left:14px;' : ''}"><p style="margin:0;${font(r.ui, 19, 28, fg)}font-weight:700;letter-spacing:1px;">${t(r, b.title)}</p></td>`
    )
  }
  if (!cells.length) return { html: gap(8), text: '' }
  const tAlign = align === 'center' ? ' align="center" style="margin:0 auto;"' : align === 'right' ? ' align="right"' : ''
  return {
    html: `<table ${TBL}${tAlign}><tr>${cells.join('')}</tr></table>`,
    text: title || sysPlain(r.footer.brandName),
  }
}

/* ---------- 头图横幅 ---------- */

function renderHero(r: R, b: BlockOf<'hero'>): Out {
  const bg = color(b.bg, r.s.brand)
  const fg = color(b.color, '#ffffff')
  const align = alignOf(b.align)
  const sub = ensureContrast(mixHex(fg, bg, 0.22), bg, 4.5)
  const rows: string[] = []
  const text: string[] = []
  if (b.image) {
    const src = imageUrl(r, b.image)
    if (src) {
      rows.push(
        `<tr><td align="center" style="padding:0 0 28px 0;font-size:0;line-height:0;">${img(r, { src, alt: tp(r, b.imageAlt || '') , width: CONTENT_WIDTH, radius: `${Math.min(int(r.s.radius, 0, 24, 12), 16)}px`, align: 'center' })}</td></tr>`
      )
    } else {
      const ph = placeholder(r, '头图图片地址不可用：只支持 https 的 jpg / png / gif')
      if (ph) rows.push(`<tr><td style="padding:0 0 20px 0;">${ph}</td></tr>`)
    }
  }
  const title = tp(r, b.title)
  if (title) {
    rows.push(`<tr><td align="${align}">${pTag('h1', { family: r.body, size: 30, lh: 42, color: fg, align, cls: 'mk-h1', weight: 800 }, t(r, b.title))}</td></tr>`)
    text.push(title)
  }
  const subtitle = tp(r, b.subtitle || '')
  if (subtitle) {
    rows.push(
      `<tr><td align="${align}" style="padding-top:${title ? 14 : 0}px;">${pTag('p', { family: r.body, size: 16, lh: 28, color: sub, align, cls: '' }, t(r, b.subtitle))}</td></tr>`
    )
    text.push(subtitle)
  }
  if (b.button && tp(r, b.button.label)) {
    const btn = button(r, {
      label: b.button.label,
      href: b.button.href,
      bg: color(b.button.bg, '#ffffff'),
      color: color(b.button.color, r.s.brand),
      radius: Math.max(8, int(r.s.radius, 0, 24, 12) - 2),
      size: 'lg',
      fullWidth: false,
      align,
    })
    rows.push(`<tr><td align="${align}" style="padding-top:${rows.length ? 30 : 0}px;">${btn.html}</td></tr>`)
    text.push(btn.text)
  }
  if (!rows.length) return { html: gap(8), text: '' }
  return { html: `<table ${TBL} width="100%">${rows.join('')}</table>`, text: text.join('\n') }
}

/* ---------- 标题 / 正文 / 提示框 ---------- */

const HEADING = { 1: [26, 36], 2: [21, 30], 3: [18, 27] } as const

function textColorClass(b: Block): string {
  // 自定义了底色的区块不参与暗色反转：否则浅色底 + 反转后的浅色字会看不见
  return b.box && b.box.bg ? '' : 'mk-tx'
}

function renderHeading(r: R, b: BlockOf<'heading'>): Out {
  const [size, lh] = HEADING[b.level] || HEADING[2]
  const align = alignOf(b.align)
  const st: TextStyle = { family: r.body, size, lh, color: r.s.text, align, cls: textColorClass(b), weight: 700 }
  const nodes = Array.isArray(b.content?.content) ? b.content.content : []
  const lines: Out[] = []
  for (const node of nodes) {
    if (!node) continue
    if (node.type === 'paragraph') lines.push(renderInlines(r, node.content))
    else for (const item of node.content || []) for (const p of item?.content || []) lines.push(renderInlines(r, p?.content))
  }
  const html = lines.map((l) => l.html).filter(Boolean).join('<br>')
  if (!html) return r.preview ? { html: placeholder(r, '（空标题）'), text: '' } : EMPTY
  return { html: pTag(`h${b.level}`, st, html), text: lines.map((l) => l.text).filter(Boolean).join('\n') }
}

function renderText(r: R, b: BlockOf<'text'>): Out {
  const size = b.size === 14 || b.size === 15 || b.size === 16 || b.size === 18 ? b.size : 16
  const lh = Math.round(size * 1.75)
  const st: TextStyle = { family: r.body, size, lh, color: r.s.text, align: alignOf(b.align), cls: textColorClass(b) }
  return renderRich(r, b.content, st, Math.round(size * 0.85))
}

const TONES = {
  brand: { edge: '', tint: '' },
  info: { edge: '#2563eb', tint: '#eff6ff' },
  success: { edge: '#059669', tint: '#ecfdf5' },
  warning: { edge: '#d97706', tint: '#fffbeb' },
} as const

function toneColors(r: R, tone: string): { edge: string; tint: string } {
  if (tone === 'info' || tone === 'success' || tone === 'warning') return TONES[tone]
  return { edge: r.s.brand, tint: mixHex(r.s.brand, '#ffffff', 0.93) }
}

function renderCallout(r: R, b: BlockOf<'callout'>): Out {
  const tone = ['brand', 'info', 'success', 'warning'].includes(b.tone) ? b.tone : 'brand'
  const { edge, tint } = toneColors(r, tone)
  const radius = Math.min(int(r.s.radius, 0, 24, 12), 14)
  const fg = ensureContrast(r.s.text, tint, 4.5)
  const inner = renderRich(r, b.content, { family: r.body, size: 15, lh: 26, color: fg, align: 'left', cls: 'mk-tx' }, 10)
  const html =
    `<table ${TBL} width="100%" class="mk-co-${tone}" bgcolor="${tint}" style="width:100%;background-color:${tint};border-left:4px solid ${edge};border-radius:${radius}px;border-collapse:separate;">` +
    `<tr><td style="padding:18px 22px 18px 20px;">${inner.html}</td></tr></table>`
  return { html, text: inner.text }
}

/* ---------- 图片 ---------- */

function renderImage(r: R, b: BlockOf<'image'>): Out {
  const align = alignOf(b.align)
  const src = imageUrl(r, b.src)
  if (!src) return r.preview ? { html: placeholder(r, b.src ? '图片地址不可用：只支持 https 的 jpg / png / gif' : '请上传图片'), text: '' } : EMPTY
  const w = Math.round((CONTENT_WIDTH * int(b.width, 20, 100, 100)) / 100)
  const alt = tp(r, b.alt || '')
  const radius = b.radius !== undefined ? int(b.radius, 0, 24, 0) : Math.min(int(r.s.radius, 0, 24, 12), 16)
  let tag = img(r, { src, alt, width: w, radius: radius ? `${radius}px` : undefined, align })
  let text = alt ? `[${alt}]` : ''
  if (b.href) {
    const L = link(r, b.href, alt || '图片')
    if (L) {
      tag = `<a href="${esc(L.href)}" target="_blank" style="display:block;color:${r.s.link};text-decoration:none;">${tag}</a>`
      text = `${alt || '图片'}：${L.text}`
    }
  }
  return { html: `<table ${TBL} width="100%"><tr><td align="${align}" style="font-size:0;line-height:0;">${tag}</td></tr></table>`, text }
}

/* ---------- 按钮 ---------- */

function renderButton(r: R, b: BlockOf<'button'>): Out {
  if (!tp(r, b.label)) return r.preview ? { html: placeholder(r, '（按钮文字为空）'), text: '' } : EMPTY
  return button(r, {
    label: b.label,
    href: b.href,
    bg: color(b.bg, r.s.brand),
    color: color(b.color, '#ffffff'),
    radius: b.radius,
    size: b.size,
    fullWidth: !!b.fullWidth,
    align: alignOf(b.align),
  })
}

/* ---------- 商品 ---------- */

function productToken(name: string): string {
  const first = name.split(/[\s·|｜/]+/).find(Boolean) || name
  return Array.from(first).slice(0, 14).join('')
}

function cardColors(r: R) {
  return {
    bg: r.s.canvas,
    line: mixHex(r.s.text, r.s.canvas, 0.87),
    muted: ensureContrast(r.s.muted, r.s.canvas, 4.5),
  }
}

/** 商品主图或品牌色占位（webp/空图/地址不合法都用占位：不让一张挂图毁掉整张卡片） */
function productVisual(r: R, p: ProductCard, width: number, phHeight: number, radius: string, linkHref: { href: string } | null): string {
  const src = p.image ? imageUrl(r, p.image) : null
  if (src) {
    const tag = img(r, { src, alt: sysPlain(p.name), width, radius })
    return linkHref ? `<a href="${esc(linkHref.href)}" target="_blank" style="display:block;color:${r.s.link};text-decoration:none;">${tag}</a>` : tag
  }
  const bg = r.s.brand
  const bg2 = r.s.accent
  return (
    `<table ${TBL} width="100%"><tr><td height="${phHeight}" align="center" valign="middle" bgcolor="${bg}" style="height:${phHeight}px;background-color:${bg};background-image:linear-gradient(135deg,${bg} 0%,${bg2} 100%);border-radius:${radius};">` +
    `<p style="margin:0;${font(r.ui, phHeight >= 140 ? 30 : 24, phHeight >= 140 ? 38 : 32, '#ffffff')}font-weight:800;letter-spacing:0.5px;text-align:center;">${esc(productToken(sysPlain(p.name)))}</p>` +
    `</td></tr></table>`
  )
}

function priceLine(r: R, p: ProductCard, big: number, showOriginal: boolean): { html: string; text: string } {
  const c = cardColors(r)
  const price = fmtMoney(p.price)
  const origN = Number(p.originalPrice)
  const orig = showOriginal && p.originalPrice && Number.isFinite(origN) && origN > Number(p.price) ? fmtMoney(p.originalPrice) : null
  const lh = Math.round(big * 1.3)
  const html =
    `<p style="margin:0;${font(r.ui, 13, lh, c.muted)}">` +
    `<span class="mk-pr" style="font-size:${big}px;line-height:${lh}px;font-weight:800;color:${r.s.brand};"><span style="font-size:${Math.round(big * 0.62)}px;">¥</span>${esc(price)}</span>` +
    (orig ? `&nbsp;&nbsp;<span class="mk-mu" style="font-size:14px;color:${c.muted};text-decoration:line-through;">¥${esc(orig)}</span>` : '') +
    `&nbsp;&nbsp;<span class="mk-mu" style="font-size:12px;color:${c.muted};">价格不含税</span></p>`
  return { html, text: `¥${price}（价格不含税）${orig ? ` 原价 ¥${orig}` : ''}` }
}

function featureList(r: R, features: string[], max: number): Out {
  const list = (Array.isArray(features) ? features : []).map(sysPlain).filter(Boolean).slice(0, max)
  if (!list.length) return EMPTY
  const rows = list
    .map(
      (f, i) =>
        `<tr><td width="22" valign="top" style="width:22px;${i < list.length - 1 ? 'padding-bottom:4px;' : ''}${font(r.ui, 15, 26, r.s.brand)}font-weight:700;">✓</td>` +
        `<td valign="top" class="mk-tx" style="${i < list.length - 1 ? 'padding-bottom:4px;' : ''}${font(r.ui, 15, 26, r.s.text)}text-align:left;">${esc(f)}</td></tr>`
    )
    .join('')
  return { html: `<table ${TBL} width="100%">${rows}</table>`, text: list.map((f) => `✓ ${f}`).join('\n') }
}

function productName(r: R, p: ProductCard, size: number): string {
  return `<p class="mk-tx" style="margin:0;${font(r.ui, size, Math.round(size * 1.45), r.s.text)}font-weight:700;text-align:left;">${sys(p.name)}</p>`
}

function missingProduct(r: R, id: number, p: ProductCard | undefined): string {
  if (!r.preview) return ''
  return placeholder(r, p ? `商品 #${id} 已下架，发送前请换一个商品` : `商品 #${id} 未找到或已下架，请重新选择商品`)
}

function productOf(r: R, id: number): ProductCard | undefined {
  const p = r.ctx.products ? r.ctx.products[id] : undefined
  return p && typeof p === 'object' ? p : undefined
}

/** 单个商品卡片（card：上图下文；row：左图右文，窄屏自动叠放） */
function renderProduct(r: R, b: BlockOf<'product'>): Out {
  const p = productOf(r, b.productId)
  if (!p || p.status !== 1) return { html: missingProduct(r, b.productId, p), text: '' }
  const c = cardColors(r)
  const radius = Math.min(int(r.s.radius, 0, 24, 12), 16)
  const name = sysPlain(p.name)
  const cta = button(r, {
    label: b.ctaLabel || '立即购买',
    href: p.url,
    bg: r.s.brand,
    color: ensureContrast('#ffffff', r.s.brand, 3),
    radius: Math.max(6, radius - 4),
    size: b.layout === 'row' ? 'sm' : 'md',
    fullWidth: b.layout !== 'row',
    align: 'left',
    linkLabel: `商品：${name}`,
  })
  const price = priceLine(r, p, b.layout === 'row' ? 24 : 28, !!b.showOriginalPrice)
  const feats = b.showFeatures ? featureList(r, p.features, 4) : EMPTY
  const imgLink = p.image && imageUrl(r, p.image) ? link(r, p.url, `商品图：${name}`) : null
  const cardOpen = `<table ${TBL} width="100%" class="mk-card" bgcolor="${c.bg}" style="width:100%;background-color:${c.bg};border:1px solid ${c.line};border-radius:${radius}px;border-collapse:separate;">`
  const text = [name, price.text, feats.text, cta.text].filter(Boolean).join('\n')

  if (b.layout === 'row') {
    const inner = CONTENT_WIDTH - 2 - 40
    const leftW = 180
    const rightW = inner - leftW
    const visual = productVisual(r, p, 160, 120, `${Math.max(4, radius - 4)}px`, imgLink)
    const content =
      productName(r, p, 17) + gap(6) + price.html + (feats.html ? gap(10) + feats.html : '') + gap(16) + cta.html
    const html =
      cardOpen +
      `<tr><td class="mk-card" style="padding:20px;font-size:0;text-align:left;">` +
      `<!--[if mso]><table ${TBL} width="${inner}"><tr><td width="${leftW}" valign="top"><![endif]-->` +
      `<div class="mk-col" style="display:inline-block;width:100%;max-width:${leftW}px;vertical-align:top;"><table ${TBL} width="100%"><tr><td style="padding:0 20px 16px 0;">${visual}</td></tr></table></div>` +
      `<!--[if mso]></td><td width="${rightW}" valign="top"><![endif]-->` +
      `<div class="mk-col" style="display:inline-block;width:100%;max-width:${rightW}px;vertical-align:top;"><table ${TBL} width="100%"><tr><td style="text-align:left;">${content}</td></tr></table></div>` +
      `<!--[if mso]></td></tr></table><![endif]-->` +
      `</td></tr></table>`
    return { html, text }
  }

  const visual = productVisual(r, p, CONTENT_WIDTH - 2, 168, `${radius}px ${radius}px 0 0`, imgLink)
  const html =
    cardOpen +
    `<tr><td style="font-size:0;line-height:0;border-radius:${radius}px ${radius}px 0 0;">${visual}</td></tr>` +
    `<tr><td class="mk-card" style="padding:24px 28px 28px 28px;text-align:left;">` +
    productName(r, p, 19) +
    gap(8) +
    price.html +
    (feats.html ? gap(14) + feats.html : '') +
    gap(22) +
    cta.html +
    `</td></tr></table>`
  return { html, text }
}

/** 两列商品组：inline-block + mso 幽灵 <td>，窄屏自动变单列 */
const GRID_COL = 270
function renderProductGrid(r: R, b: BlockOf<'productGrid'>): Out {
  const ids = (Array.isArray(b.productIds) ? b.productIds : []).slice(0, 6)
  const c = cardColors(r)
  const radius = Math.min(int(r.s.radius, 0, 24, 12), 14)
  const cells: string[] = []
  const texts: string[] = []
  let shown = 0
  ids.forEach((id) => {
    const p = productOf(r, id)
    if (!p || p.status !== 1) {
      const ph = missingProduct(r, id, p)
      if (ph) cells.push(ph)
      return
    }
    const name = sysPlain(p.name)
    const cta = button(r, {
      label: b.ctaLabel || '立即购买',
      href: p.url,
      bg: r.s.brand,
      color: ensureContrast('#ffffff', r.s.brand, 3),
      radius: Math.max(6, radius - 4),
      size: 'sm',
      fullWidth: true,
      align: 'left',
      linkLabel: `商品：${name}`,
    })
    const price = priceLine(r, p, 22, false)
    const feats = b.showFeatures ? featureList(r, p.features, 3) : EMPTY
    const imgLink = p.image && imageUrl(r, p.image) ? link(r, p.url, `商品图：${name}`) : null
    const visual = productVisual(r, p, GRID_COL - 20 - 2, 116, `${radius}px ${radius}px 0 0`, imgLink)
    cells.push(
      `<table ${TBL} width="100%" class="mk-card" bgcolor="${c.bg}" style="width:100%;background-color:${c.bg};border:1px solid ${c.line};border-radius:${radius}px;border-collapse:separate;">` +
        `<tr><td style="font-size:0;line-height:0;border-radius:${radius}px ${radius}px 0 0;">${visual}</td></tr>` +
        `<tr><td class="mk-card" style="padding:18px 18px 20px 18px;text-align:left;">` +
        productName(r, p, 16) +
        gap(6) +
        price.html +
        (feats.html ? gap(10) + feats.html : '') +
        gap(16) +
        cta.html +
        `</td></tr></table>`
    )
    texts.push([name, price.text, feats.text, cta.text].filter(Boolean).join('\n'))
    shown++
  })
  if (!cells.length) return EMPTY
  let html = `<table ${TBL} width="100%"><tr><td style="font-size:0;line-height:0;text-align:center;">`
  html += `<!--[if mso]><table ${TBL} width="${GRID_COL * 2}" align="center"><tr><![endif]-->`
  cells.forEach((cell, i) => {
    if (i > 0 && i % 2 === 0) html += '<!--[if mso]></tr><tr><![endif]-->'
    html +=
      `<!--[if mso]><td width="${GRID_COL}" valign="top"><![endif]-->` +
      `<div class="mk-col" style="display:inline-block;width:100%;max-width:${GRID_COL}px;vertical-align:top;">` +
      `<table ${TBL} width="100%"><tr><td style="padding:0 10px 20px 10px;text-align:left;">${cell}</td></tr></table></div>` +
      `<!--[if mso]></td><![endif]-->`
  })
  html += `<!--[if mso]></tr></table><![endif]--></td></tr></table>`
  void shown
  return { html, text: texts.join('\n\n') }
}

/* ---------- 优惠券 ---------- */

function couponCondition(v: CouponView): string {
  if (v.kind === 'PRODUCT') return '指定商品可用'
  const min = Number(v.minAmount)
  return Number.isFinite(min) && min > 0 ? `满${fmtMoney(v.minAmount)}可用` : '无门槛'
}

/** 券票样式：上半面额与门槛，虚线齿孔（两侧半圆缺口），下半有效期与按钮 */
function renderCoupon(r: R, b: BlockOf<'coupon'>, view: CouponView | null): Out {
  if (!view) {
    return {
      html: r.preview ? placeholder(r, b.mode === 'claim' ? '领取券：请选择一个可领取的券批次' : '直发券：请设置面额与有效期') : '',
      text: '',
    }
  }
  const bg = color(b.bg, r.s.brand)
  const fg = color(b.color, '#ffffff')
  const sub = ensureContrast(mixHex(fg, bg, 0.2), bg, 4.5)
  const dash = mixHex(fg, bg, 0.55)
  const notch = color(b.box?.bg, r.s.canvas)
  const notchCls = b.box?.bg ? '' : ' class="mk-cv"'
  const radius = Math.min(int(r.s.radius, 0, 24, 12), 16)
  const title = tp(r, b.title) || '邮件专享券'
  const amount = fmtMoney(view.discount)
  const cond = couponCondition(view)
  const names = (view.productNames || []).map(sysPlain).filter(Boolean).slice(0, 5)
  const scope = view.kind === 'PRODUCT' && names.length ? `适用商品：${names.join('、')}` : ''

  let validity: string
  let validityPlain: string
  if (view.mode === 'grant') {
    const exp = r.mode === 'send' ? '{{coupon_expires}}' : vars(r, '{{coupon_expires}}')
    validityPlain = `券已放入你的账户，${exp}前有效`
    validity = esc(validityPlain)
  } else {
    validityPlain = sysPlain(view.validityText) || '领取后可在「我的优惠券」查看有效期'
    validity = esc(validityPlain)
  }
  const testNote = r.mode === 'test' && view.mode === 'grant' ? '（测试邮件，未实际发券）' : ''
  const cta = button(r, {
    label: b.ctaLabel || (view.mode === 'grant' ? '去使用' : '立即领取'),
    href: view.url,
    bg: fg,
    color: bg,
    radius: Math.max(8, radius - 2),
    size: 'md',
    fullWidth: false,
    align: 'center',
    linkLabel: `优惠券：${tp(r, b.ctaLabel) || title}`,
  })
  const note = tp(r, b.note || '')

  const top =
    `<p style="margin:0;${font(r.ui, 14, 22, sub)}font-weight:600;letter-spacing:3px;text-align:center;">${t(r, title)}</p>` +
    gap(6) +
    `<p style="margin:0;${font(r.ui, 52, 62, fg)}font-weight:800;letter-spacing:-1px;text-align:center;"><span style="font-size:26px;letter-spacing:0;">¥</span>${esc(amount)}</p>` +
    gap(4) +
    `<p style="margin:0;${font(r.ui, 16, 26, fg)}font-weight:600;text-align:center;">${esc(cond)}</p>` +
    (scope ? gap(6) + `<p style="margin:0;${font(r.ui, 13, 22, sub)}text-align:center;">${esc(scope)}</p>` : '')
  const bottom =
    `<p style="margin:0;${font(r.ui, 15, 26, fg)}text-align:center;">${validity}</p>` +
    (testNote ? `<p style="margin:0;${font(r.ui, 13, 22, sub)}font-weight:700;text-align:center;">${testNote}</p>` : '') +
    gap(18) +
    cta.html +
    (note ? gap(14) + `<p style="margin:0;${font(r.ui, 13, 22, sub)}text-align:center;">${t(r, b.note)}</p>` : '')
  const notchCell = (side: 'l' | 'r') =>
    `<td width="14" height="28"${notchCls} bgcolor="${notch}" style="width:14px;height:28px;background-color:${notch};border-radius:${side === 'l' ? '0 14px 14px 0' : '14px 0 0 14px'};font-size:0;line-height:0;">&nbsp;</td>`
  const html =
    `<table ${TBL} width="100%" bgcolor="${bg}" style="width:100%;background-color:${bg};border-radius:${radius}px;border-collapse:separate;">` +
    `<tr><td colspan="3" align="center" style="padding:30px 28px 20px 28px;">${top}</td></tr>` +
    `<tr>${notchCell('l')}<td style="padding:0 8px;font-size:0;line-height:0;"><table ${TBL} width="100%">` +
    `<tr><td height="13" style="height:13px;font-size:0;line-height:0;border-bottom:2px dashed ${dash};">&nbsp;</td></tr>` +
    `<tr><td height="13" style="height:13px;font-size:0;line-height:0;">&nbsp;</td></tr></table></td>${notchCell('r')}</tr>` +
    `<tr><td colspan="3" align="center" style="padding:20px 28px 30px 28px;">${bottom}</td></tr>` +
    `</table>`
  const text = [
    `【${title}】¥${amount} · ${cond}`,
    scope,
    validityPlain,
    testNote,
    cta.text,
    note,
  ]
    .filter(Boolean)
    .join('\n')
  return { html, text }
}

/* ---------- 分割线 / 留白 ---------- */

function renderDivider(r: R, b: BlockOf<'divider'>): Out {
  const pct = b.widthPct === 30 || b.widthPct === 60 ? b.widthPct : 100
  const th = b.thickness === 2 ? 2 : 1
  const c = color(b.color, mixHex(r.s.text, r.s.canvas, 0.87))
  return {
    html: `<table ${TBL} width="${pct}%" align="center" style="width:${pct}%;margin:0 auto;"><tr><td class="mk-ln" style="font-size:0;line-height:0;height:0;border-top:${th}px solid ${c};">&nbsp;</td></tr></table>`,
    text: '————————',
  }
}

/* ============================== 页脚 ============================== */

function renderFooter(r: R): Out {
  const F = r.footer
  const brand = sysPlain(F.brandName) || '贝果科技'
  const company = sysPlain(F.companyName)
  const contact = sysPlain(F.contactEmail)
  const note = sysPlain(F.footerNote)
  const host = hostOf(r.origin) || 'bigolab.com'
  const mu = ensureContrast(r.s.muted, r.s.backdrop, 4.5)
  const strong = ensureContrast(r.s.text, r.s.backdrop, 4.5)
  const send = r.mode === 'send'
  const unsubHref = send ? '{{mkt_unsub}}' : `${r.origin}/unsubscribe/test`
  const prefsHref = send ? '{{mkt_prefs}}' : `${r.origin}/unsubscribe/test?v=prefs`
  const notice = send ? '{{mkt_notice}}' : FIRST_NOTICE_TEXT
  const p = (inner: string, c = mu, cls = 'mk-mu') =>
    `<p class="${cls}" style="margin:0;${font(r.ui, 13, 22, c)}text-align:center;">${inner}</p>`
  const a = (href: string, label: string) =>
    `<a href="${esc(href)}" target="_blank" class="mk-tx" style="color:${strong};text-decoration:underline;">${esc(label)}</a>`

  let contactHtml: string
  let contactText: string
  if (contact && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact)) {
    contactHtml = `联系邮箱：${a(`mailto:${contact}`, contact)}`
    contactText = `联系邮箱：${contact}`
  } else {
    // 联系邮箱是法定必填（lint/launch 会拦住空值）；这里只是保证预览时页脚也完整
    const L = link(r, '/support', '在线客服')
    contactHtml = `在线客服：${L ? a(L.href, `${host}/support`) : esc(`${host}/support`)}`
    contactText = `在线客服：${L ? L.text : `${r.origin}/support`}`
  }
  const reason = `你收到这封邮件，是因为你用本邮箱注册了${brand}（${host}）账户。`
  const lines = [
    // 首封告知：send 模式是占位（非首封替换为空串，空 <p> 不占高度）
    p(esc(notice), strong, 'mk-tx'),
    p(esc(reason)),
    p(`${a(unsubHref, '退订营销邮件')}&nbsp;&nbsp;·&nbsp;&nbsp;${a(prefsHref, '调整订阅')}`),
    p('订单、验证码、发票等交易邮件不受影响。'),
    gap(10),
    p(`${esc(company || brand)}&nbsp;·&nbsp;${esc(brand)}`),
    p(contactHtml),
    note ? p(esc(note)) : '',
  ]
  const html = `<table ${TBL} width="100%"><tr><td class="mk-px" align="center" style="padding:28px ${PX}px 8px ${PX}px;text-align:center;">${lines.join('')}</td></tr></table>`
  const text = [
    '——',
    notice,
    reason,
    `退订营销邮件：${unsubHref}`,
    `调整订阅：${prefsHref}`,
    '订单、验证码、发票等交易邮件不受影响。',
    `${company || brand} · ${brand}`,
    contactText,
    note,
  ]
    .filter((x) => x !== '')
    .join('\n')
  return { html, text }
}

/* ============================== <head> 与样式 ============================== */

function darkRules(r: R): [string, string][] {
  const s = r.s
  const bd = '#0f0f13'
  const cv = '#18181f'
  const card = '#20202a'
  const line = '#30303c'
  const tx = '#ececf1'
  const mu = '#a3a3b2'
  const a = ensureContrast(mixHex(s.link, '#ffffff', 0.4), cv, 4.5)
  const pr = ensureContrast(mixHex(s.brand, '#ffffff', 0.4), card, 4.5)
  const tone = (edge: string) => mixHex(edge, cv, 0.82)
  return [
    ['.mk-bd', `background-color:${bd}!important`],
    ['.mk-cv', `background-color:${cv}!important`],
    ['.mk-card', `background-color:${card}!important;border-color:${line}!important`],
    ['.mk-ln', `border-color:${line}!important`],
    ['.mk-tx', `color:${tx}!important`],
    ['.mk-mu', `color:${mu}!important`],
    ['.mk-a', `color:${a}!important`],
    ['.mk-pr', `color:${pr}!important`],
    ['.mk-co-brand', `background-color:${tone(s.brand)}!important`],
    ['.mk-co-info', `background-color:${tone(TONES.info.edge)}!important`],
    ['.mk-co-success', `background-color:${tone(TONES.success.edge)}!important`],
    ['.mk-co-warning', `background-color:${tone(TONES.warning.edge)}!important`],
  ]
}

function baseCss(r: R): string {
  const scheme = r.darkAuto ? 'light dark' : 'light only'
  let css =
    `:root{color-scheme:${scheme};supported-color-schemes:${scheme}}` +
    'body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}' +
    'table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}' +
    'img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none}' +
    'body{margin:0!important;padding:0!important;width:100%!important}' +
    'a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}' +
    '#MessageViewBody a{color:inherit;text-decoration:none;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit}' +
    'u+#body a{color:inherit;text-decoration:none;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit}' +
    // 窄屏增强（不支持媒体查询的客户端照样是可读的流式布局）
    '@media screen and (max-width:620px){' +
    '.mk-outer{padding:0!important}' +
    '.mk-shell{border-radius:0!important}' +
    '.mk-px{padding-left:24px!important;padding-right:24px!important}' +
    '.mk-px2{padding-left:14px!important;padding-right:14px!important}' +
    '.mk-col{max-width:100%!important}' +
    '.mk-h1{font-size:26px!important;line-height:36px!important}' +
    '}'
  if (r.darkAuto) {
    const rules = darkRules(r)
    css += `@media (prefers-color-scheme:dark){${rules.map(([sel, d]) => `${sel}{${d}}`).join('')}}`
    // Outlook.com / Outlook 手机版的暗色模式不走媒体查询，而是给元素加 data-ogsc/data-ogsb
    const fg = new Set(['.mk-tx', '.mk-mu', '.mk-a', '.mk-pr'])
    css += rules.map(([sel, d]) => `[data-${fg.has(sel) ? 'ogsc' : 'ogsb'}] ${sel}{${d}}`).join('')
  }
  return css
}

/** 预览专用样式：悬停描边 + 编辑器「暗色模拟」开关（父页面给 <html> 加 mk-sim-dark 类） */
function previewCss(r: R): string {
  let css = '[data-bid]{cursor:pointer}[data-bid]:hover>td{outline:2px dashed rgba(14,165,233,.45);outline-offset:-2px}'
  if (r.darkAuto) css += darkRules(r).map(([sel, d]) => `.mk-sim-dark ${sel}{${d}}`).join('')
  return `<style>${css}</style>`
}

/* ============================== 主入口 ============================== */

function sanitizeSettings(x: Partial<DocSettings> | undefined | null): DocSettings {
  const d = DEFAULT_SETTINGS
  const s = x || {}
  return {
    backdrop: color(s.backdrop, d.backdrop),
    canvas: color(s.canvas, d.canvas),
    brand: color(s.brand, d.brand),
    accent: color(s.accent, d.accent),
    text: color(s.text, d.text),
    muted: color(s.muted, d.muted),
    link: color(s.link, d.link),
    font: s.font === 'serif' ? 'serif' : 'sans',
    radius: int(s.radius, 0, 24, d.radius),
    darkMode: s.darkMode === 'light-only' ? 'light-only' : 'auto',
  }
}

function renderBlock(r: R, b: Block, coupon: { first: boolean }): Out {
  switch (b.type) {
    case 'header':
      return renderHeader(r, b)
    case 'hero':
      return renderHero(r, b)
    case 'heading':
      return renderHeading(r, b)
    case 'text':
      return renderText(r, b)
    case 'image':
      return renderImage(r, b)
    case 'button':
      return renderButton(r, b)
    case 'product':
      return renderProduct(r, b)
    case 'productGrid':
      return renderProductGrid(r, b)
    case 'coupon': {
      // ctx.coupon 只对应文档里第一个券区块（lint 禁止多个）；其余直发券按自身参数推算
      const view = coupon.first && r.ctx.coupon ? r.ctx.coupon : b.mode === 'grant' ? couponViewFor(b, r.origin, { productNames: [] }) : null
      coupon.first = false
      return renderCoupon(r, b, view)
    }
    case 'callout':
      return renderCallout(r, b)
    case 'divider':
      return renderDivider(r, b)
    default:
      return EMPTY
  }
}

export function renderEmail(doc: EmailDoc, ctx: RenderCtx): RenderResult {
  const mode: RenderMode = ctx.mode === 'send' || ctx.mode === 'test' ? ctx.mode : 'preview'
  const origin = String(ctx.origin || '').trim().replace(/\/+$/, '')
  const originOk = /^https?:\/\/[^/?#\s]+$/i.test(origin)
  if (!originOk && mode !== 'preview') throw new Error('renderEmail: origin 不合法')
  const s = sanitizeSettings(doc?.settings)
  const r: R = {
    ctx: { ...ctx, mode },
    doc: doc && Array.isArray(doc.blocks) ? doc : ({ v: 1, settings: s, blocks: [] } as unknown as EmailDoc),
    mode,
    s,
    origin: originOk ? origin : '',
    body: s.font === 'serif' ? FONT_SERIF : FONT_SANS,
    ui: FONT_SANS,
    preview: mode === 'preview',
    darkAuto: s.darkMode !== 'light-only',
    extra: 0,
    images: 0,
    links: new Map(),
    now: new Date(),
    footer: ctx.footer || { companyName: '', brandName: '', contactEmail: '', footerNote: '', subjectPrefix: '(AD)' },
  }
  // send/test 不许带 preview 专用参数进来（防止调用方误传导致发出去的信带描边）
  if (!r.preview) r.ctx = { ...r.ctx, selectedBlockId: null, imagesOff: false }
  // send 模式不接受样例变量（变量必须留占位，逐封替换）
  if (mode === 'send') r.ctx = { ...r.ctx, vars: undefined }

  const blocks = r.doc.blocks.filter((b): b is Block => !!b && typeof b === 'object' && typeof (b as Block).type === 'string')
  const banded = blocks.map(isBanded)
  const coupon = { first: true }
  const rows: string[] = []
  const texts: string[] = []
  const n = blocks.length

  blocks.forEach((b, i) => {
    let out: Out
    try {
      out = renderBlock(r, b, coupon)
    } catch (e) {
      // 预览里一个坏区块不该让整页白屏；发送/测试必须抛出（宁可不发，也不发缺内容的信）
      if (!r.preview) throw e
      out = { html: placeholder(r, `这个区块渲染失败：${(e as Error)?.message || '未知错误'}`), text: '' }
    }
    const [dt, db] = DEF_PAD[b.type] || [8, 8]
    let pt = dt
    let pb = db
    if (b.type !== 'spacer') {
      if (banded[i]) {
        if (b.type !== 'header' && b.type !== 'hero') {
          pt = Math.max(pt, 28)
          pb = Math.max(pb, 28)
        }
      } else {
        // 紧挨色带（或在画布顶/底）的普通区块要多留白，否则文字贴着色块边缘
        if (i === 0 || banded[i - 1]) pt = Math.max(pt, 36)
        if (i === n - 1 || banded[i + 1]) pb = Math.max(pb, 40)
      }
    }
    if (b.box && typeof b.box.padTop === 'number') pt = int(b.box.padTop, 0, 64, pt)
    if (b.box && typeof b.box.padBottom === 'number') pb = int(b.box.padBottom, 0, 64, pb)

    let bg: string | null = null
    let bg2: string | null = null
    if (b.type === 'header' || b.type === 'hero') {
      bg = color(b.bg, s.brand)
      bg2 = b.bg2 ? color(b.bg2, bg) : null
    }
    if (b.box && b.box.bg && HEX_COLOR_RE.test(b.box.bg)) {
      bg = b.box.bg.toLowerCase()
      bg2 = null
    }
    const first = i === 0
    const last = i === n - 1

    if (b.type === 'spacer') {
      const h = int(b.height, 8, 96, 24)
      const sel = r.preview && r.ctx.selectedBlockId === b.id ? previewOnly(r, `outline:2px solid ${SELECT_OUTLINE};outline-offset:-2px;`) : ''
      const bid = r.preview ? previewOnly(r, ` data-bid="${esc(b.id)}"`) : ''
      rows.push(
        `<tr${bid}><td height="${h}"${bg ? ` bgcolor="${bg}"` : ''} style="height:${h}px;font-size:0;line-height:0;mso-line-height-rule:exactly;${bg ? `background-color:${bg};` : ''}${sel}">&nbsp;</td></tr>`
      )
      return
    }
    // 预览里内容为空的块也要留一行可点击的位置，否则在预览里选不中它
    const inner = out.html || (r.preview ? placeholder(r, `（${BLOCK_TYPE_LABEL[b.type] || '区块'}：暂无内容）`) : '')
    if (!inner) return
    rows.push(row(r, b, inner, { bg, bg2, pt, pb, first, last, px: b.type === 'productGrid' ? PX - 10 : PX, pxClass: b.type === 'productGrid' ? 'mk-px2' : 'mk-px' }))
    if (out.text) texts.push(out.text)
  })

  const footer = renderFooter(r)
  const radius = int(s.radius, 0, 24, 12)
  const subjectHtml = t(r, ctx.subject || '')
  const preheader = tp(r, ctx.preheader || '')
  const scheme = r.darkAuto ? 'light dark' : 'light only'

  const csp = r.preview
    ? previewOnly(
        r,
        `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:${/^http:\/\//i.test(r.origin) ? ` ${r.origin}` : ''}; style-src 'unsafe-inline'">`
      )
    : ''
  const head =
    '<!DOCTYPE html>' +
    '<html lang="zh-CN" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">' +
    '<head>' +
    '<meta charset="utf-8">' +
    csp +
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">' +
    '<meta name="x-apple-disable-message-reformatting">' +
    '<meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">' +
    `<meta name="color-scheme" content="${scheme}">` +
    `<meta name="supported-color-schemes" content="${scheme}">` +
    `<title>${subjectHtml}</title>` +
    '<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->' +
    "<!--[if mso]><style>table,td,th,div,p,a,span,h1,h2,h3{font-family:'Microsoft YaHei','微软雅黑',Arial,sans-serif !important;}</style><![endif]-->" +
    `<style>${baseCss(r)}</style>` +
    (r.preview ? previewOnly(r, previewCss(r)) : '') +
    '</head>'

  // 预览文字：紧跟 <body>；后面的填充字符把正文开头挤出收件箱摘要
  const preheaderHtml = preheader
    ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:${s.backdrop};">${esc(preheader)}${'&#847;&zwnj;&nbsp;'.repeat(36)}</div>`
    : ''
  const pixel =
    mode === 'send'
      ? '<img src="{{mkt_open}}" width="1" height="1" alt="" border="0" style="display:block;width:1px;height:1px;border:0;margin:0;">'
      : ''

  const html =
    head +
    `<body id="body" class="mk-bd" bgcolor="${s.backdrop}" style="margin:0;padding:0;word-spacing:normal;background-color:${s.backdrop};">` +
    preheaderHtml +
    `<div role="article" aria-roledescription="email" aria-label="${subjectHtml}" lang="zh-CN" dir="ltr">` +
    `<table ${TBL} width="100%" class="mk-bd" bgcolor="${s.backdrop}" style="width:100%;background-color:${s.backdrop};">` +
    `<tr><td align="center" class="mk-outer" style="padding:32px 12px 24px 12px;">` +
    `<!--[if mso]><table ${TBL} align="center" width="${EMAIL_WIDTH}"><tr><td><![endif]-->` +
    `<div style="max-width:${EMAIL_WIDTH}px;margin:0 auto;">` +
    `<table ${TBL} width="100%" class="mk-cv mk-shell" bgcolor="${s.canvas}" style="width:100%;background-color:${s.canvas};border-radius:${radius}px;border-collapse:separate;overflow:hidden;">` +
    rows.join('') +
    `</table>` +
    footer.html +
    `</div>` +
    `<!--[if mso]></td></tr></table><![endif]-->` +
    `</td></tr></table>` +
    `</div>` +
    pixel +
    `</body></html>`

  const text = [...texts, footer.text]
    .join('\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return {
    html,
    text,
    links: Array.from(r.links.values()).sort((a, b) => a.idx - b.idx),
    sizeBytes: Math.max(0, utf8Bytes(html) - r.extra),
    imageCount: r.images,
  }
}

/* ============================== 优惠券展示数据 ============================== */

/**
 * 由优惠券区块算出展示数据（服务端快照与浏览器预览共用，保证口径一致）。
 * - grant：面额/门槛/商品来自区块参数；url = <origin>/coupons；
 *   validityText：days 模式「到账后 N 天内有效」，until 模式「YYYY年M月D日前有效」
 * - claim：claim 为该公开批次的数据（找不到传 null → 返回 null）；url = <origin>/coupon/<code>
 * productNames：商品券限定商品的名字（调用方按 productIds 查好传入）
 */
export function couponViewFor(
  block: BlockOf<'coupon'>,
  origin: string,
  lookup: {
    claim?: { code: string; kind: 'THRESHOLD' | 'PRODUCT'; discount: string; minAmount: string; endAt: string | null } | null
    productNames: string[]
  }
): CouponView | null {
  const o = String(origin || '').trim().replace(/\/+$/, '')
  const productNames = (Array.isArray(lookup?.productNames) ? lookup.productNames : [])
    .map((n) => Array.from(sysPlain(n)).slice(0, 30).join(''))
    .filter(Boolean)
  if (block.mode === 'grant') {
    const g = block.grant
    if (!g || !(Number(g.discount) > 0)) return null
    const v = g.validity
    const validityText =
      v && v.mode === 'until' ? `${dateKeyCn(v.date)}前有效` : `到账后 ${v && v.mode === 'days' ? v.days : 7} 天内有效`
    return {
      mode: 'grant',
      kind: g.kind === 'PRODUCT' ? 'PRODUCT' : 'THRESHOLD',
      discount: money2(g.discount),
      minAmount: money2(g.minAmount),
      productNames,
      url: `${o}/coupons`,
      validityText,
    }
  }
  const c = lookup?.claim
  if (!c || !c.code) return null
  let validityText = '长期有效'
  if (c.endAt) {
    const d = new Date(c.endAt)
    validityText = Number.isNaN(d.getTime()) ? '领取后可在「我的优惠券」查看有效期' : `${bjDateCn(d)}前有效`
  }
  return {
    mode: 'claim',
    kind: c.kind === 'PRODUCT' ? 'PRODUCT' : 'THRESHOLD',
    discount: money2(c.discount),
    minAmount: money2(c.minAmount),
    productNames,
    url: `${o}/coupon/${encodeURIComponent(c.code)}`,
    validityText,
  }
}

/* ============================== 编辑器摘要 ============================== */

function clipSummary(s: unknown, n = 24): string {
  const chars = Array.from(String(s ?? '').replace(/\s+/g, ' ').trim())
  return chars.length > n ? chars.slice(0, n).join('') + '…' : chars.join('')
}

/** 编辑器左栏的一行摘要，如「标题：国庆特惠…」「商品卡片 #4」 */
export function blockSummary(block: Block): string {
  if (!block || typeof block !== 'object') return '未知区块'
  const label = BLOCK_TYPE_LABEL[block.type] || '区块'
  switch (block.type) {
    case 'header':
      return `${label}：${clipSummary(block.title) || (block.logo ? 'Logo' : '（空）')}`
    case 'hero':
      return `${label}：${clipSummary(block.title) || '（无标题）'}`
    case 'heading':
    case 'text':
    case 'callout':
      return `${label}：${clipSummary(richToPlain(block.content)) || '（空）'}`
    case 'image': {
      const file = (block.src || '').split(/[?#]/)[0].split('/').pop() || ''
      return `${label}：${clipSummary(block.alt || file) || '（未上传）'}`
    }
    case 'button':
      return `${label}：${clipSummary(block.label) || '（空）'}`
    case 'product':
      return `${label} #${block.productId}`
    case 'productGrid':
      return `${label}：${(block.productIds || []).map((id) => `#${id}`).join('、')}`
    case 'coupon': {
      if (block.mode === 'claim') return `${label}（领取）：${block.claimCode || '未选择券批次'}`
      const g = block.grant
      if (!g) return `${label}（直发）：未设置`
      const cond = g.kind === 'PRODUCT' ? '指定商品' : g.minAmount > 0 ? `满${fmtMoney(g.minAmount)}` : '无门槛'
      return `${label}（直发）：¥${fmtMoney(g.discount)} · ${cond}`
    }
    case 'divider':
      return label
    case 'spacer':
      return `${label} ${typeof block.height === 'number' ? block.height : 24}px`
    default:
      return label
  }
}

/* ============================== 配色主题 ============================== */

export const DEFAULT_SETTINGS: DocSettings = {
  backdrop: '#f4f5f7',
  canvas: '#ffffff',
  brand: '#7c3aed',
  accent: '#db2777',
  text: '#1f2937',
  muted: '#6b7280',
  link: '#7c3aed',
  font: 'sans',
  radius: 12,
  darkMode: 'auto',
}

/**
 * 内置配色主题（编辑器一键套用）。每套都校过：正文/链接在画布上 ≥4.5:1，
 * 白字在品牌色上 ≥4.5:1（按钮、券），白字在强调色上 ≥3:1（渐变页眉的大字）。
 */
export const THEMES: { key: string; name: string; settings: DocSettings }[] = [
  { key: 'brand', name: '品牌紫粉', settings: { ...DEFAULT_SETTINGS } },
  {
    key: 'ocean',
    name: '深空蓝',
    settings: {
      backdrop: '#eef2f7',
      canvas: '#ffffff',
      brand: '#1d4ed8',
      accent: '#0284c7',
      text: '#0f172a',
      muted: '#64748b',
      link: '#1d4ed8',
      font: 'sans',
      radius: 12,
      darkMode: 'auto',
    },
  },
  {
    key: 'mint',
    name: '清新绿',
    settings: {
      backdrop: '#eff5f1',
      canvas: '#ffffff',
      brand: '#047857',
      accent: '#0d9488',
      text: '#1c2b25',
      muted: '#5f6f68',
      link: '#047857',
      font: 'sans',
      radius: 14,
      darkMode: 'auto',
    },
  },
  {
    key: 'mono',
    name: '简约黑白',
    settings: {
      backdrop: '#f4f4f5',
      canvas: '#ffffff',
      brand: '#18181b',
      accent: '#52525b',
      text: '#18181b',
      muted: '#63636b',
      link: '#18181b',
      font: 'sans',
      radius: 6,
      darkMode: 'auto',
    },
  },
]

/**
 * 套用主题：除了换 settings，还把区块里「跟着旧主题走」的颜色（等于旧品牌色/强调色/正文色，
 * 或模板里用到的品牌浅色）换成新主题的对应色；作者自己挑的其他颜色保持不动。
 */
export function applyTheme(doc: EmailDoc, next: DocSettings): EmailDoc {
  const old = doc.settings
  const map = new Map<string, string>()
  const put = (a: string, b: string) => {
    const k = a.toLowerCase()
    if (!map.has(k)) map.set(k, b.toLowerCase())
  }
  put(old.brand, next.brand)
  put(old.accent, next.accent)
  put(old.text, next.text)
  put(old.link, next.link)
  put(old.muted, next.muted)
  put(old.canvas, next.canvas)
  for (const k of [0.9, 0.92, 0.93, 0.94, 0.96]) {
    put(mixHex(old.brand, '#ffffff', k), mixHex(next.brand, '#ffffff', k))
    put(mixHex(old.accent, '#ffffff', k), mixHex(next.accent, '#ffffff', k))
  }
  const sw = (c: string | undefined) => (c && map.has(c.toLowerCase()) ? map.get(c.toLowerCase())! : c)
  const swRich = (rd: RichDoc): RichDoc => JSON.parse(JSON.stringify(rd, (k, v) => (k === 'color' && typeof v === 'string' ? sw(v) : v)))
  const blocks = doc.blocks.map((b) => {
    const nb = JSON.parse(JSON.stringify(b)) as Block & Record<string, unknown>
    for (const k of ['bg', 'bg2', 'color'] as const) {
      const v = (nb as Record<string, unknown>)[k]
      if (typeof v === 'string') (nb as Record<string, unknown>)[k] = sw(v)
    }
    if (nb.box?.bg) nb.box.bg = sw(nb.box.bg)
    if (nb.type === 'hero' && nb.button) nb.button = { ...nb.button, bg: sw(nb.button.bg)!, color: sw(nb.button.color)! }
    if (nb.type === 'heading' || nb.type === 'text' || nb.type === 'callout') nb.content = swRich(nb.content)
    return nb as Block
  })
  return { ...doc, settings: { ...next }, blocks }
}
