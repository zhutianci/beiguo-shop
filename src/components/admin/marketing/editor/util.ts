/**
 * 编辑器用的小工具（纯函数，无 React、无 DOM），便于脚本断言。
 */
import type { EmailDoc, MergeTag } from '@/lib/marketing/types'
import { HEX_COLOR_RE } from '@/lib/marketing/types'
import { addBjDays, bjDateKey } from '@/lib/marketing/time'

export function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

/* ============================== 颜色 ============================== */

/**
 * 把用户输入的颜色规范成 #rrggbb（小写）。接受 #abc / abc / #aabbcc / aabbcc / rgb(1,2,3)。
 * 其它一律返回 null（调用方保留原值，不把非法颜色写进文档 —— zod 会让整篇保存 400）。
 */
export function normalizeHex(input: string): string | null {
  const s = String(input || '').trim().toLowerCase()
  if (!s) return null
  const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/.exec(s)
  if (rgb) {
    const parts = rgb.slice(1, 4).map((x) => Number(x))
    if (parts.some((x) => x > 255)) return null
    return '#' + parts.map((x) => x.toString(16).padStart(2, '0')).join('')
  }
  const h = s.startsWith('#') ? s.slice(1) : s
  if (/^[0-9a-f]{3}$/.test(h)) return '#' + h.split('').map((c) => c + c).join('')
  if (/^[0-9a-f]{6}$/.test(h)) return '#' + h
  return null
}

export function isHex(c: unknown): c is string {
  return typeof c === 'string' && HEX_COLOR_RE.test(c)
}

function channel(v: number): number {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

/** WCAG 相对亮度 */
export function luminance(hex: string): number {
  const h = normalizeHex(hex)
  if (!h) return 1
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG 对比度（1–21）。任一颜色非法时返回 21（不报警，交给 lint） */
export function contrastRatio(a: string, b: string): number {
  if (!normalizeHex(a) || !normalizeHex(b)) return 21
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** 色块上该用深字还是浅字（色板里打勾图标用） */
export function readableOn(bg: string): '#ffffff' | '#111827' {
  return luminance(bg) > 0.45 ? '#111827' : '#ffffff'
}

/* ============================== 链接 / 图片地址 ============================== */

/**
 * 编辑器端的链接检查（与渲染器白名单同口径：https/http/mailto 与站内路径）。返回给人看的问题，没问题返回 null。
 * 渲染器会丢弃不合规的链接，lint 也会报错；这里是「输入时就告诉你」。
 */
export function linkProblem(raw: string, opts: { required?: boolean } = {}): string | null {
  const href = String(raw || '').trim()
  if (!href) return opts.required ? '请填写链接' : null
  if (href.length > 2000) return '链接太长（最多 2000 字符）'
  if (/\{\{/.test(href)) return '链接里不能用变量（{{…}}）'
  if (/\s/.test(href)) return '链接里不能有空格'
  if (href.startsWith('//')) return '请写完整地址（https://…）或以 / 开头的站内路径'
  if (href.startsWith('/')) return null
  if (/^mailto:/i.test(href)) {
    return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+/i.test(href) ? null : '邮箱链接格式不对，例：mailto:hi@example.com'
  }
  if (/^https?:\/\//i.test(href)) {
    try {
      const u = new URL(href)
      if (!u.hostname || !u.hostname.includes('.')) return '网址缺少域名'
      return null
    } catch {
      return '网址格式不对'
    }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return '只支持 https://、http://、mailto: 链接或站内路径'
  return '请以 https:// 开头，或填写以 / 开头的站内路径（如 /products/1）'
}

const IMG_EXT_RE = /\.(jpe?g|png|gif)$/i
const BAD_IMG_EXT_RE = /\.(webp|svg|avif|heic|heif|bmp|tiff?)$/i

/** 图片地址检查：必须 https；webp/svg 等邮箱不认的格式直接拒 */
export function imageUrlProblem(raw: string): { level: 'error' | 'warn'; message: string } | null {
  const url = String(raw || '').trim()
  if (!url) return null
  if (/\{\{/.test(url)) return { level: 'error', message: '图片地址里不能用变量' }
  if (!/^https:\/\//i.test(url)) return { level: 'error', message: '图片必须是 https:// 开头的完整地址' }
  let path = url
  try {
    path = new URL(url).pathname
  } catch {
    return { level: 'error', message: '图片地址格式不对' }
  }
  if (BAD_IMG_EXT_RE.test(path)) return { level: 'error', message: 'WebP / SVG 等格式在 QQ 邮箱、Outlook 里显示不出来，请用 JPG / PNG / GIF' }
  if (!IMG_EXT_RE.test(path)) return { level: 'warn', message: '无法从地址判断图片格式，请确认是 JPG / PNG / GIF' }
  return null
}

/* ============================== 主题 / 变量 ============================== */

/** 主题里的昵称变量按 12 字估算（与 lint 口径一致：safeNickname 最多 12 字） */
const NICK_TAG_RE = /\{\{\s*nickname(?:\|[^{}]*)?\s*\}\}/g

export function estimateSubjectLength(subject: string): number {
  return Array.from(String(subject || '').replace(NICK_TAG_RE, '某某某某某某某某某某某某')).length
}

/** 预览用：把文字里的变量换成样例（收件箱预览里展示主题用） */
export function applySampleVars(text: string, vars: Partial<Record<MergeTag, string>>): string {
  return String(text || '').replace(/\{\{\s*([a-z_]+)(?:\|([^{}|]*))?\s*\}\}/g, (m, name: string, def: string | undefined) => {
    if (name === 'nickname') return vars.nickname || def || '朋友'
    if (name === 'email') return vars.email || 'name@example.com'
    if (name === 'coupon_expires') return vars.coupon_expires || '到期日'
    return m
  })
}

/* ============================== 券 ============================== */

/** 'YYYY-MM-DD' → '2026年10月7日'（纯字符串运算，不经过 Date，不受进程时区影响） */
export function formatCnDate(key: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!m) return key
  return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日`
}

/**
 * 预览里 {{coupon_expires}} 的样例值：直发券 days 模式 = 今天（北京）+ N 天；until 模式 = 该日期。
 * 真实发送时是每个人收券那天算的，这里只是示意。
 */
export function sampleCouponExpires(doc: EmailDoc, now: Date = new Date()): string | undefined {
  for (const b of doc.blocks) {
    if (b.type !== 'coupon' || b.mode !== 'grant' || !b.grant) continue
    const v = b.grant.validity
    if (v.mode === 'days') return formatCnDate(addBjDays(bjDateKey(now), v.days))
    return formatCnDate(v.date)
  }
  return undefined
}

/* ============================== 其它 ============================== */

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

/** 把金额输入规范成最多两位小数的数字；非法返回 null */
export function parseMoney(raw: string): number | null {
  const s = String(raw ?? '').trim()
  if (!/^\d{1,7}(\.\d{0,2})?$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}

export function isEditableTarget(t: EventTarget | null): boolean {
  if (!t || typeof (t as HTMLElement).closest !== 'function') return false
  const el = t as HTMLElement
  if (el.isContentEditable) return true
  const tag = el.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag === 'INPUT') {
    const type = ((el as HTMLInputElement).type || 'text').toLowerCase()
    // 复选框 / 单选 / 按钮 / 滑块里按 Ctrl+Z 没有「文字撤销」可言，交给文档级撤销
    return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file'].includes(type)
  }
  return !!el.closest('[contenteditable="true"]')
}
